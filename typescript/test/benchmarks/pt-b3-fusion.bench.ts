// PT-B3 perf-frontier bench — the MEASUREMENT substrate for `proof:perf`.
//
// Three measured axes, all over the IN-REALM combinator core (no competitor
// libraries — this is the parse-that regression floor, not the comparison
// matrix in json-comprehensive.bench.ts):
//
//   (1) FUSION alloc — fused `all(a,b,c)` builds ONE flat result array; the
//       unfused `a.then(b).then(c)` builds N−1 nested 2-tuples. The throughput
//       gap is the per-call intermediate-tuple alloc PT-B3 §1 removes. The
//       hard alloc-COUNT assertion (zero intermediate tuples) lives in the
//       proof script (scripts/proof-perf.mjs) which runs under --expose-gc and
//       diffs retained heap; this bench records the throughput side.
//
//   (2) DISPATCH on the REAL CSS function-name bucket (PT-Q5 re-anchor) — the
//       value.js `Function_ = dispatch({...})` shape: first-char O(1) jump over the
//       CSS math/color/transform/gradient function tokens vs the sequential-trial
//       `any()` it replaced. The speculative 2nd-byte subTable widening was
//       RETRACTED (zero consumers); this measures the SURVIVING first-char
//       primitive on the application path, not a synthetic ca/cl/cu corpus.
//
//   (3) json-comprehensive BASELINE — the parse-that JSON shape, the regression
//       anchor proof:perf reds CI against (checked-in baseline JSON).
//
// Run: `vitest bench test/benchmarks/pt-b3-fusion.bench.ts`.

import { describe, bench, type BenchOptions } from "vitest";
import { all, any, dispatch, string, regex, Parser } from "../../src/parse";

const options: BenchOptions = { warmupIterations: 100, time: 1500 };

// ── Leaf parsers (single-char, zero-alloc through string()'s fast path) ──────
const pa = string("a");
const pb = string("b");
const pc = string("c");

// ── (1) Fusion: fused all() vs unfused then-chain ───────────────────────────
// Fused: ONE flat array [va, vb, vc].
const fusedAll3 = all(pa, pb, pc);
// Unfused: a.then(b).then(c) → [[va, vb], vc] (two nested arrays per call).
const unfusedThen3 = pa.then(pb).then(pc);

describe("PT-B3 fusion — all(a,b,c) vs a.then(b).then(c)", () => {
    bench("fused all(a,b,c)  [1 flat array]", () => {
        fusedAll3.parse("abc");
    }, options);

    bench("unfused a.then(b).then(c)  [2 nested arrays]", () => {
        unfusedThen3.parse("abc");
    }, options);
});

// ── (2) Real CSS function-name dispatch corpus (PT-Q5 re-anchor) ────────────
// The actual CSS math/color/transform/gradient function tokens value.js's
// `Function_ = dispatch({...})` runs. First chars collide heavily (c, r, s, t, l)
// — exactly the megamorphism a sequential any() pays for and a first-char O(1)
// dispatch flattens.
const cssFns: Record<string, ReturnType<typeof string>> = {
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
const cssTokens = Object.keys(cssFns);

// Sequential-trial baseline: an any() over all tokens (the megamorphic shape the
// first-char dispatch primitive replaced).
const seqAny = any(...Object.values(cssFns));

// First-char dispatch — the SURVIVING, consumed primitive (single-arg). Group
// tokens by first char into a residual any() per bucket (the real grammar shape).
const byFirst: Record<string, ReturnType<typeof string>[]> = {};
for (const t of cssTokens) (byFirst[t[0]!] ??= []).push(cssFns[t]!);
const dispatchTable: Record<string, ReturnType<typeof any>> = {};
for (const [fc, ps] of Object.entries(byFirst)) {
    dispatchTable[fc] = ps.length === 1 ? ps[0]! : any(...ps);
}
const dispatched = dispatch(dispatchTable);

// Target tokens LATE in the any() order (worst case for sequential trial).
const corpus = ["url(", "linear-gradient(", "translate(", "scale(", "rotate("];

describe("PT-Q5 first-char dispatch — real CSS fn bucket vs sequential any()", () => {
    bench("sequential any(15 CSS fns)", () => {
        for (const s of corpus) seqAny.parse(s);
    }, options);

    bench("first-char dispatch (O(1) LUT)", () => {
        for (const s of corpus) dispatched.parse(s);
    }, options);

    // Worst-case single token: url( sits late in any() order vs O(1) dispatch.
    bench("sequential any — worst case (url, late arm)", () => {
        seqAny.parse("url(");
    }, options);
    bench("first-char dispatch — url (O(1) jump)", () => {
        dispatched.parse("url(");
    }, options);
});

// ── (3) json-comprehensive baseline anchor (the regression floor) ───────────
// A self-contained JSON parser (the parse-that hand shape) over a fixed corpus.
// proof:perf compares this throughput against the checked-in baseline JSON.
const comma = string(",").trim();
const colon = string(":").trim();
const jsonNull = string("null").map(() => null);
const jsonBool = string("true").or(string("false")).map((v) => v === "true");
const jsonNumber = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/).map(Number);
const jsonString = regex(/"(?:[^"\\]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/).map(
    (s) => (s.indexOf("\\") === -1 ? s.slice(1, -1) : JSON.parse(s)),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((pairs: any) => Object.fromEntries(pairs)),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsonValue: Parser<any> = dispatch({
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

const jsonSample = JSON.stringify({
    name: "constellation",
    version: 12,
    tags: ["calc", "clamp", "cubic"],
    nested: { a: 1, b: [true, false, null], c: "x" },
    list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
});

describe("PT-B3 json-comprehensive baseline (regression anchor)", () => {
    bench("parse-that JSON — fixed sample", () => {
        JSONParser.parse(jsonSample);
    }, options);
});
