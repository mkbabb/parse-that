// One fresh-process paired cell: node --expose-gc cell.mjs <entry> <candidate dist/parse.js> <baseline dist/parse.js> <rounds> <order:0|1>
// Prints one JSON line. Both arms live in this process; every pass is gc'd
// first; the ratio is the median of per-round candidate/baseline ratios.
import { isDeepStrictEqual } from "node:util";
import { ENTRIES, run } from "./entries.mjs";

const [entry, candPath, basePath, roundsArg, orderArg] = process.argv.slice(2);
const rounds = Number(roundsArg ?? 11);
const firstIsCandidate = orderArg !== "1";
if (typeof globalThis.gc !== "function") throw new Error("cell.mjs needs --expose-gc");

const cand = await import(candPath);
const base = await import(basePath);
const spec = ENTRIES[entry];
if (!spec) throw new Error(`unknown entry ${entry}`);
const inputs = spec.inputs();
const pc = spec.build(cand);
const pb = spec.build(base);

// Same product on both arms, input by input: the same verdict, and on
// success the same value (0.8.2 leaves a partial value on a failed parse,
// which 1.x retired; a failure's product is the verdict alone).
let mismatches = 0;
for (const src of inputs) {
    const c = pc.parseState(src), b = pb.parseState(src);
    if (c.isError !== b.isError || (!c.isError && !isDeepStrictEqual(c.value, b.value))) mismatches++;
}

const now = () => Number(process.hrtime.bigint()) / 1e6;
function pass(p, reps) {
    globalThis.gc();
    const t0 = now();
    for (let i = 0; i < reps; i++) run(p, inputs);
    return now() - t0;
}

// Warm both arms, then size a pass so the baseline arm takes >= 20 ms.
for (let i = 0; i < 30; i++) { run(pc, inputs); run(pb, inputs); }
let reps = 1;
while (pass(pb, reps) < 20) reps *= 2;

const cT = [], bT = [], ratios = [];
for (let r = 0; r < rounds; r++) {
    const candFirst = (r % 2 === 0) === firstIsCandidate;
    let c, b;
    if (candFirst) { c = pass(pc, reps); b = pass(pb, reps); }
    else { b = pass(pb, reps); c = pass(pc, reps); }
    cT.push(c); bT.push(b); ratios.push(c / b);
}
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[s.length >> 1]; };
const min = (xs) => Math.min(...xs), max = (xs) => Math.max(...xs);
console.log(JSON.stringify({
    entry, rounds, reps, inputs: inputs.length, mismatches,
    ratio: med(ratios), minMin: min(cT) / min(bT),
    candMedMs: med(cT), baseMedMs: med(bT),
    baseSpread: max(bT) / min(bT), candSpread: max(cT) / min(cT),
}));
