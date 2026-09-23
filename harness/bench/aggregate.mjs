// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — PORT OF `bench/aggregate.mjs` (parser-proof job tree, 1,396 B).
//
// WHAT THE ORIGINAL DID: read `raw-run-{1..5}.json` — five whole invocations of the bench —
// and print the median / min / max of `ratio_peak` across those five runs.
//
// WHAT THIS PORT DOES, AND WHY IT CHANGED: the unit of repetition is no longer "a whole
// invocation". It is a ROUND, and rounds are interleaved across a live process set (W1.md
// §5.d.2), so the across-run spread the original was estimating is now measured directly and
// within one process-set. This script therefore aggregates the SCORED rounds of each cell and
// prints the dispersion beside every median — the same question, asked of the right unit.
//
// Two things the original printed are deliberately absent: `gate.verdict` and `meets_floor`.
// COHESION §0j.E OC-1 rules the bench table RECORDED-NOT-GATING and W1.md G-7 makes a ✓/✗
// column on Plane B a gate failure whatever the number — "the column is the claim". The
// floors survive as recorded constants in bench-results.json, applied to nothing.
//
// Invoked BY `bench.ts`, in its own process. It is not a gate entry.

import { readFileSync } from "node:fs";
import { median, min, max, spreadPct, f } from "./lib/stats.mjs";

const path = process.argv[2] ?? new URL("./bench-raw.json", import.meta.url).pathname;
const raw = JSON.parse(readFileSync(path, "utf8"));
const out = (s = "") => process.stdout.write(s + "\n");

out("── AGGREGATE · dispersion of the scored rounds, per cell ──");
out(
    `   ${"cell".padEnd(39)} ${"ns/call med".padStart(12)} ${"min".padStart(10)} ` +
        `${"max".padStart(10)} ${"spread%".padStart(8)} ${"rounds".padStart(7)}`,
);
for (const cellRounds of raw.rounds) {
    const scored = cellRounds.rounds.filter((r) => r.n > raw.method.warmupRoundsDiscarded);
    const ns = scored.map((r) => r.nsPerCall);
    out(
        `   ${cellRounds.cell.padEnd(39)} ${f(median(ns), 1).padStart(12)} ${f(min(ns), 1).padStart(10)} ` +
            `${f(max(ns), 1).padStart(10)} ${f(spreadPct(ns), 1).padStart(8)} ${String(scored.length).padStart(7)}`,
    );
}

const warm = raw.rounds.map((c) => {
    const d = c.rounds.filter((r) => r.n <= raw.method.warmupRoundsDiscarded).map((r) => r.nsPerCall);
    const s = c.rounds.filter((r) => r.n > raw.method.warmupRoundsDiscarded).map((r) => r.nsPerCall);
    return { cell: c.cell, warm: median(d), scored: median(s) };
});
out();
out(
    "── WARMUP CHECK · the discarded rounds are discarded for a reason; here is the reason, " +
        "measured ──",
);
out(`   ${"cell".padEnd(39)} ${"discarded med".padStart(14)} ${"scored med".padStart(11)} ${"ratio".padStart(7)}`);
for (const w of warm) {
    out(
        `   ${w.cell.padEnd(39)} ${f(w.warm, 1).padStart(14)} ${f(w.scored, 1).padStart(11)} ` +
            `${f(w.warm / w.scored, 3).padStart(7)}`,
    );
}
out(
    "   A ratio far above 1.000 is the JIT warming; a ratio at 1.000 means the discard cost " +
        "nothing and hid nothing.",
);
