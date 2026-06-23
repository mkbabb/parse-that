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
//   (2) 2-char DISPATCH widening — a calc/clamp/cubic/cos/conic corpus through
//       the widened length+second-byte `dispatch()` vs the sequential-trial
//       `any()`. The ca/cl/cu tokens are 2nd-byte-DISTINCT (fully flattened);
//       `co` (cos vs conic) shares its 2nd byte and routes to a 2-deep residual
//       `any()` — the honest scope (FULL-LOOP correction): ≥40% is claimed only
//       for the flattened ca/cl/cu arms, `co` is a 2-deep residual.
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

// ── (2) 2-char dispatch widening corpus ─────────────────────────────────────
// A realistic deep `c`-bucket (8 CSS-math/color functions colliding on 'c').
// 2nd-byte DISTINCT: calc(a) clamp(l) cubic(u) ceil(e) cross(r) — flattened.
// 2nd-byte COLLIDING on 'o': color/counter/contrast → a residual any() (the
// honest `co` residual: the widening does NOT flatten a shared second byte).
const calc = string("calc(");
const clamp = string("clamp(");
const cubic = string("cubic(");
const ceil = string("ceil(");
const cross = string("cross(");
const color = string("color(");
const counter = string("counter(");
const contrast = string("contrast(");
const oResidual = any(color, counter, contrast);

// Sequential-trial baseline: an any() over all 8 (worst case when the target
// token is LATE in the trial order).
const seqAny = any(calc, clamp, cubic, ceil, cross, color, counter, contrast);

// Widened dispatch: first byte 'c' is sub-table-only; the 2nd byte routes.
const widened = dispatch(
    {},
    { c: { a: calc, l: clamp, u: cubic, e: ceil, r: cross, o: oResidual } },
);

// Flattened arms with the target token late in any() order (worst case).
const corpus = ["cross(", "ceil(", "cubic(", "clamp(", "calc("];

describe("PT-B3 2-char dispatch — widened vs sequential any()", () => {
    bench("sequential any(8-deep c-bucket)", () => {
        for (const s of corpus) seqAny.parse(s);
    }, options);

    bench("widened dispatch (2nd-byte LUT)", () => {
        for (const s of corpus) widened.parse(s);
    }, options);

    // Worst-case single token: the 5th sequential arm (cross) vs widened.
    bench("sequential any — worst case (cross, 5th arm)", () => {
        seqAny.parse("cross(");
    }, options);
    bench("widened dispatch — cross (O(1) 2nd-byte jump)", () => {
        widened.parse("cross(");
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
