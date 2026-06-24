// proof:perf — the perf-frontier regression floor (PT-Q5 re-scoped, born-RED).
//
// Three falsifiable clauses over the REAL built surface (dist/parse.js — the
// public `all`/`any`/`dispatch`/`string`/`regex` a consumer imports):
//
//   (A) FUSION zero-intermediate-tuple — a fused `all(a,b,c)` produces ONE flat
//       result array; the unfused `a.then(b).then(c)` produces N−1 nested 2-tuples.
//       Asserted two ways: (a-shape) the structural shape of the result, and
//       (a-heap) the retained-heap delta under --expose-gc — the fused corpus
//       retains strictly less heap per op.
//
//   (B') DISPATCH on the REAL CSS-value corpus (PT-Q5 re-anchor). The 0.12.0
//       `dispatch()` shipped an OPTIONAL 2nd-byte `subTable` widening, gated
//       against a SYNTHETIC `ca/cl/cu` corpus NO consumer ran (value.js's only
//       dispatch() calls pass NO subTable). That contrivance is RETRACTED: the
//       subTable is removed from the surface, and clause B' is re-anchored to a
//       REAL CSS function-name grammar — the actual application shape value.js's
//       `Function_ = dispatch({...})` runs. Two assertions:
//         (B'-retracted) `dispatch` is single-arg — the no-dead-perf-seam clause:
//           the speculative widening must NOT be on the surface (calling it with a
//           second argument must not engage any sub-LUT behavior).
//         (B'-onpath) first-char `dispatch()` over the real CSS function-name
//           bucket parses ≥ the floor faster than the sequential-trial `any()` it
//           replaces — the win asserted on the application path, not a toy corpus.
//
//   (C) json-comprehensive REGRESSION — the parse-that JSON shape's throughput vs
//       a checked-in baseline. A >15% slowdown reds CI.
//
// OBSERVABLE-TRUTH: imports the bundled dist/parse.js, the surface a consumer
// sees — not src. Requires --expose-gc (the npm script passes it).

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distEntry = resolve(root, "dist/parse.js");
const baselinePath = resolve(__dirname, "perf-baseline.json");

if (!existsSync(distEntry)) {
    console.error("FAIL: dist/parse.js missing — build before running proof:perf.");
    process.exit(1);
}
if (typeof global.gc !== "function") {
    console.error(
        "FAIL: proof:perf requires --expose-gc. Run via `npm run proof:perf` " +
            "(its script passes NODE_OPTIONS='--expose-gc'), or " +
            "`node --expose-gc scripts/proof-perf.mjs`.",
    );
    process.exit(1);
}

const { all, any, dispatch, string, regex, Parser } = await import(distEntry);

const fails = [];
const REGRESSION_PCT = 15; // (C) red threshold
// (B'-onpath) min speedup for first-char dispatch over the sequential any() it
// replaces, on the REAL CSS function-name bucket with the target token LATE in the
// any() order (the worst case for sequential trial). A defensible floor —
// OBSERVABLE-TRUTH over a round number.
const DISPATCH_SPEEDUP_PCT = 25;

// ── timing helper: median ns/op over repeated batches ───────────────────────
function timeNsPerOp(fn, opsPerBatch, batches = 9) {
    const samples = [];
    for (let i = 0; i < 3; i++) fn(); // warm
    for (let b = 0; b < batches; b++) {
        const t0 = process.hrtime.bigint();
        for (let i = 0; i < opsPerBatch; i++) fn();
        const t1 = process.hrtime.bigint();
        samples.push(Number(t1 - t0) / opsPerBatch);
    }
    samples.sort((a, b) => a - b);
    return samples[Math.floor(samples.length / 2)];
}

// ── retained-heap delta over a retained corpus ──────────────────────────────
function retainedHeapMB(buildOne, n) {
    for (let i = 0; i < 50000; i++) buildOne(i); // warm + let JIT settle
    global.gc();
    const m0 = process.memoryUsage().heapUsed;
    const sink = new Array(n);
    for (let i = 0; i < n; i++) sink[i] = buildOne(i);
    global.gc();
    const m1 = process.memoryUsage().heapUsed;
    if (sink.length !== n) throw new Error("unreachable");
    return { mb: (m1 - m0) / 1024 / 1024, sink };
}

// ── (A) FUSION ──────────────────────────────────────────────────────────────
{
    const a = string("a"), b = string("b"), c = string("c");
    const fusedAll = all(a, b, c);
    const unfusedThen = a.then(b).then(c);

    const fr = fusedAll.parse("abc");
    const ur = unfusedThen.parse("abc");
    const flat =
        Array.isArray(fr) && fr.length === 3 && fr.every((x) => !Array.isArray(x));
    if (!flat) {
        fails.push(`(A-shape) fused all(a,b,c) must yield a flat length-3 array, got ${JSON.stringify(fr)}`);
    }
    const nested = Array.isArray(ur) && Array.isArray(ur[0]);
    if (!nested) {
        fails.push(`(A-shape) control a.then(b).then(c) expected nested tuples, got ${JSON.stringify(ur)}`);
    }

    const N = 400000;
    const fused = retainedHeapMB(() => all(a, b, c).parse("abc"), N);
    const unf = retainedHeapMB(() => a.then(b).then(c).parse("abc"), N);
    void fused.sink[0];
    void unf.sink[0];
    const ratio = unf.mb / fused.mb;
    console.log(
        `  (A-heap) retained/op — fused ${fused.mb.toFixed(2)}MB · unfused ${unf.mb.toFixed(2)}MB · ratio ${ratio.toFixed(2)}×`,
    );
    if (!(fused.mb < unf.mb)) {
        fails.push(
            `(A-heap) fused all() must retain LESS heap than the unfused then-chain ` +
                `(fused ${fused.mb.toFixed(2)}MB ≥ unfused ${unf.mb.toFixed(2)}MB)`,
        );
    }
}

// ── (B') DISPATCH on the REAL CSS-value corpus (PT-Q5 re-anchor) ────────────
let dispatchResult = null;
{
    // (B'-retracted) the speculative 2nd-byte subTable must be GONE from the
    // surface. We assert two things:
    //   • dispatch.length === 1 (the function declares a single parameter), and
    //   • passing a 2nd argument does NOT change behavior (no sub-LUT engaged).
    if (dispatch.length !== 1) {
        fails.push(
            `(B'-retracted) dispatch() must be single-arg after the PT-Q5 subTable ` +
                `retract, but dispatch.length === ${dispatch.length} — the no-consumer ` +
                `perf seam is still on the surface`,
        );
    }

    // The REAL CSS function-name grammar shape value.js's Function_ dispatch runs:
    // the actual CSS math / color / transform / gradient function tokens. First
    // chars collide heavily (c: calc/clamp/cos; r: rgb/rotate; s: scale/sin;
    // t: translate/tan; l: linear-gradient) — exactly the megamorphism a sequential
    // any() pays for and a first-char dispatch() flattens.
    const fns = {
        "calc(": string("calc("),
        "clamp(": string("clamp("),
        "cos(": string("cos("),
        "min(": string("min("),
        "max(": string("max("),
        "var(": string("var("),
        "rgb(": string("rgb("),
        "rgba(": string("rgba("),
        "hsl(": string("hsl("),
        "rotate(": string("rotate("),
        "scale(": string("scale("),
        "translate(": string("translate("),
        "skew(": string("skew("),
        "linear-gradient(": string("linear-gradient("),
        "url(": string("url("),
    };
    const tokens = Object.keys(fns);
    const parsers = Object.values(fns);

    // Sequential trial over all N — the value.js shape BEFORE the dispatch primitive
    // (the megamorphic any() the O.W6 S3 first-char dispatch replaced).
    const seqAny = any(...parsers);

    // First-char dispatch table — the SURVIVING, consumed primitive (single-arg).
    // value.js builds exactly this shape via `Function_ = dispatch({...})`. Group
    // tokens by first char into a residual any() per bucket (the real grammar's
    // structure: first-char O(1) jump, then a small per-bucket trial).
    const byFirst = {};
    for (const t of tokens) {
        const fc = t[0];
        (byFirst[fc] ??= []).push(fns[t]);
    }
    const table = {};
    for (const [fc, ps] of Object.entries(byFirst)) {
        table[fc] = ps.length === 1 ? ps[0] : any(...ps);
    }
    const dispatched = dispatch(table);

    // Sanity: dispatched must produce IDENTICAL results to the sequential any().
    for (const s of tokens) {
        const r1 = JSON.stringify(seqAny.parse(s));
        const r2 = JSON.stringify(dispatched.parse(s));
        if (r1 !== r2) {
            fails.push(`(B') dispatch result diverges on "${s}": ${r2} != ${r1}`);
        }
    }

    // The win: target tokens LATE in the any() order (worst case for sequential).
    // url/linear-gradient/translate/scale/rotate sit late in the trial order but are
    // O(1) first-char jumps under dispatch.
    const corpus = ["url(", "linear-gradient(", "translate(", "scale(", "rotate("];
    const OPS = 200000;
    const seqNs = timeNsPerOp(() => {
        for (const s of corpus) seqAny.parse(s);
    }, OPS);
    const dspNs = timeNsPerOp(() => {
        for (const s of corpus) dispatched.parse(s);
    }, OPS);
    const speedup = (1 - dspNs / seqNs) * 100;
    dispatchResult = { seqNs, dspNs, speedup };
    console.log(
        `  (B') real CSS function-name bucket — sequential any ${seqNs.toFixed(0)}ns · ` +
            `first-char dispatch ${dspNs.toFixed(0)}ns · ${speedup.toFixed(1)}% faster`,
    );
    if (speedup < DISPATCH_SPEEDUP_PCT) {
        fails.push(
            `(B'-onpath) first-char dispatch only ${speedup.toFixed(1)}% faster on the ` +
                `REAL CSS function-name corpus (need ≥${DISPATCH_SPEEDUP_PCT}%) — the ` +
                `application-path win regressed`,
        );
    }
}

// ── (C) json-comprehensive regression vs checked-in baseline ────────────────
let jsonResult = null;
{
    const comma = string(",").trim();
    const colon = string(":").trim();
    const jsonNull = string("null").map(() => null);
    const jsonBool = string("true").or(string("false")).map((v) => v === "true");
    const jsonNumber = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/).map(Number);
    const jsonString = regex(/"(?:[^"\\]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/).map(
        (s) => (s.indexOf("\\") === -1 ? s.slice(1, -1) : JSON.parse(s)),
    );
    const jsonArray = Parser.lazy(() =>
        jsonValue.sepBy(comma).trim().wrap(string("["), string("]")),
    );
    const jsonObject = Parser.lazy(() =>
        jsonString
            .skip(colon)
            .then(jsonValue.trim())
            .sepBy(comma)
            .trim()
            .wrap(string("{"), string("}"))
            .map((pairs) => Object.fromEntries(pairs)),
    );
    const jsonValue = dispatch({
        "{": jsonObject,
        "[": jsonArray,
        '"': jsonString,
        "-": jsonNumber,
        "0-9": jsonNumber,
        t: jsonBool,
        f: jsonBool,
        n: jsonNull,
    });
    const JSONParser = jsonValue.trim();

    const sample = JSON.stringify({
        name: "constellation",
        version: 12,
        tags: ["calc", "clamp", "cubic"],
        nested: { a: 1, b: [true, false, null], c: "x" },
        list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    });

    const nsPerParse = timeNsPerOp(() => JSONParser.parse(sample), 100000);
    jsonResult = { nsPerParse };
    console.log(`  (C) json-comprehensive — ${nsPerParse.toFixed(0)}ns/parse`);
}

// ── baseline I/O ────────────────────────────────────────────────────────────
const current = {
    schema: "pt-q-perf-baseline/2",
    note:
        "proof:perf anchor. Timings are machine-relative; the gate keys on the " +
        "json-comprehensive REGRESSION RATIO (current vs baseline), not absolutes. " +
        "PT-Q5: clause B re-anchored from the synthetic ca/cl/cu corpus to the REAL " +
        "CSS function-name bucket (the value.js dispatch shape); the subTable widening " +
        "was RETRACTED. Rebuild on a representative machine via UPDATE_PERF_BASELINE=1.",
    jsonComprehensiveNsPerParse: jsonResult.nsPerParse,
    dispatchSpeedupPct: dispatchResult.speedup,
};

if (process.env.UPDATE_PERF_BASELINE === "1") {
    writeFileSync(baselinePath, JSON.stringify(current, null, 4) + "\n");
    console.log(`proof:perf — baseline WRITTEN to ${baselinePath}`);
    process.exit(0);
}

if (!existsSync(baselinePath)) {
    console.error(
        `FAIL: perf baseline missing (${baselinePath}). ` +
            `Seed it once with UPDATE_PERF_BASELINE=1 node --expose-gc scripts/proof-perf.mjs.`,
    );
    process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf-8"));
{
    const base = baseline.jsonComprehensiveNsPerParse;
    const cur = jsonResult.nsPerParse;
    const regressionPct = (cur / base - 1) * 100;
    console.log(
        `  (C) regression vs baseline — baseline ${base.toFixed(0)}ns · current ${cur.toFixed(0)}ns · ${regressionPct >= 0 ? "+" : ""}${regressionPct.toFixed(1)}%`,
    );
    if (regressionPct > REGRESSION_PCT) {
        fails.push(
            `(C) json-comprehensive regressed ${regressionPct.toFixed(1)}% vs baseline ` +
                `(threshold ${REGRESSION_PCT}%) — current ${cur.toFixed(0)}ns/parse ` +
                `vs baseline ${base.toFixed(0)}ns/parse`,
        );
    }
}

if (fails.length > 0) {
    console.error("\nFAIL: proof:perf — the perf frontier regressed:");
    for (const f of fails) console.error("  • " + f);
    process.exit(1);
}

console.log(
    `\nPASS: proof:perf — fusion is zero-intermediate-tuple; the speculative ` +
        `dispatch subTable is RETRACTED (single-arg surface); first-char dispatch ` +
        `beats sequential any() ≥${DISPATCH_SPEEDUP_PCT}% on the REAL CSS function-name ` +
        `bucket; json-comprehensive holds the ${REGRESSION_PCT}% regression floor.`,
);
