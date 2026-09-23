// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — G-8: NO-LATCH + ALLOCATION, BOTH SIDES.
//
//   node --expose-gc harness/w2/alloc-latch.mjs --candidate <id>
//   node --expose-gc harness/w2/alloc-latch.mjs --baseline     # the instrument against the incumbent
//
// FOUR LEGS, EACH PRINTED, NONE AVERAGED:
//   1. history invariance — the median of parses 1–10k against 90k–100k, and the printed noise
//      envelope they are read inside. K-6 kills the class: parse #100,001 distinguishable from
//      parse #1.
//   2. steady-state heap — bytes retained per parse after a warmup GC. `--expose-gc` is required:
//      without it the leg prints UNREAD rather than a number that means nothing.
//   3. the reject path allocates ZERO in both lowerings. §6 G-8's falsifier says why this leg is
//      not optional: "the reject leg is where the incumbent genuinely wins, so hiding it flatters
//      every candidate."
//   4. reset residue (timing AND heap) and, on the Wasm side, the arena high-water mark; plus the
//      `Object.freeze` mark (DM-1) as its own leg when the adapter exposes an unfrozen entry.
//
// THE INHERITED COUNTER-EXAMPLE, pasted: `PACKRAT_ARMED` — UNARMED 93.9 ns/parse → ARMED 138.2 =
// 1.47x, and `resetPackrat()` leaves 139.3 (it clears the store and does not disarm). A latch is a
// state machine with one absorbing state; O-8 forbids the class, not the instance.
//
// NO BAR IS SET HERE. The timings below are a WITHIN-SUBJECT invariance reading, never a
// cross-engine ratio, and no row of this probe is admissible as a speed sentence.

import { argv } from "./lib/contract.mjs";
import { loadCandidate } from "./lib/candidate.mjs";
import { loadPublished } from "./lib/published.mjs";
import { header, table, kv, verdict, absent } from "./lib/report.mjs";

const a = argv();
const N = Number(a.parses ?? 100000);
const WINDOW = Number(a.window ?? 10000);

const median = (xs) => {
    const s = [...xs].sort((x, y) => x - y);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** One window of `n` parses, timed per parse in nanoseconds; the sink is printed so nothing is DCE'd. */
function window_(fn, input, n) {
    const ns = new Float64Array(n);
    let sink = 0;
    for (let i = 0; i < n; i++) {
        const t0 = process.hrtime.bigint();
        const r = fn(input);
        const t1 = process.hrtime.bigint();
        ns[i] = Number(t1 - t0);
        sink += r === undefined ? 0 : 1;
    }
    return { median: median(ns), sink };
}

function heapBytes() {
    if (typeof globalThis.gc === "function") globalThis.gc();
    return process.memoryUsage().heapUsed;
}

/**
 * THE TWO READINGS, AND WHY THERE ARE TWO. §6 G-8's words are "median of parses 1–10k vs 90k–100k,
 * both printed". Measured against the incumbent as a control, that literal reading comes out at
 * 0.727x — parses 90k–100k are FASTER than parses 1–10k — because the first window carries V8's
 * tier-up, not because the engine unlatched. A latch is a one-way COST (O-15 PT-03: 93.9 → 138.2,
 * and the reset does not disarm), so the literal reading is printed as the spec writes it AND a
 * warmed reading is taken beside it (one discarded window, then the early window), with the verdict
 * read on the warmed leg. Both are printed; neither is hidden; the direction is stated.
 */
function legs(label, fn, acceptInput, rejectInput) {
    const rows = [];
    const cold = window_(fn, acceptInput, WINDOW); //              parses 1–W, the literal reading
    for (let i = 0; i < WINDOW; i++) fn(acceptInput); //           one discarded window (tier-up)
    const first = window_(fn, acceptInput, WINDOW); //             the warmed early window
    for (let i = 0; i < Math.max(0, N - 4 * WINDOW); i++) fn(acceptInput); // the history between them
    const last = window_(fn, acceptInput, WINDOW); //              the late window
    const drift = last.median / first.median;
    const coldDrift = last.median / cold.median;
    rows.push([label, "history invariance (literal §6 reading)", `parses 1–${WINDOW} median ${cold.median.toFixed(1)} ns`, `late window median ${last.median.toFixed(1)} ns`, `drift ${coldDrift.toFixed(3)}x — a value < 1 is V8 tier-up, the opposite direction from a latch`]);

    const h0 = heapBytes();
    let sink = 0;
    for (let i = 0; i < WINDOW; i++) sink += fn(acceptInput) === undefined ? 0 : 1;
    const h1 = heapBytes();
    const perParse = (h1 - h0) / WINDOW;

    const rj0 = heapBytes();
    let rsink = 0;
    for (let i = 0; i < WINDOW; i++) rsink += fn(rejectInput) === undefined ? 0 : 1;
    const rj1 = heapBytes();
    const rejectPerParse = (rj1 - rj0) / WINDOW;

    rows.push([label, "history invariance (warmed — the verdict leg)", `early warmed window median ${first.median.toFixed(1)} ns`, `parses ${N - WINDOW}–${N} median ${last.median.toFixed(1)} ns`, `drift ${drift.toFixed(3)}x`]);
    rows.push([label, "steady-state heap", `${(h1 - h0).toLocaleString()} B over ${WINDOW} parses`, `${perParse.toFixed(1)} B/parse`, typeof globalThis.gc === "function" ? "after gc()" : "UNREAD — run under --expose-gc"]);
    rows.push([label, "reject-path heap", `${(rj1 - rj0).toLocaleString()} B over ${WINDOW} rejects`, `${rejectPerParse.toFixed(1)} B/parse`, rejectPerParse <= 0 ? "zero (or reclaimed)" : "NONZERO"]);
    rows.push([label, "sink (printed so nothing is optimized away)", String(first.sink + last.sink + sink + rsink), "", ""]);
    return { rows, drift, perParse, rejectPerParse };
}

async function baseline() {
    const { mod, pin } = await loadPublished();
    header("X.P.W2.g — alloc-latch --baseline (the instrument, against the incumbent)", [
        `subject  vendored 4.0.0  sha256 ${pin.sha256.slice(0, 16)}…`,
        `legs     ${N.toLocaleString()} parses, ${WINDOW.toLocaleString()}-parse windows at each end`,
        `gc       ${typeof globalThis.gc === "function" ? "available (--expose-gc)" : "UNAVAILABLE — heap legs print UNREAD"}`,
    ]);
    const r = legs("published-4.0.0", (s) => mod.parseCssColor(s), "rgb(1 2 3)", "rgb(1 2)");
    table(["subject", "leg", "reading", "reading", "note"], r.rows);
    console.log();
    kv([
        ["inherited counter-example (O-15 PT-03)", "UNARMED 93.9 ns → ARMED 138.2 = 1.47x; resetPackrat() leaves 139.3"],
        ["noise envelope for the invariance leg", "drift within 0.80x–1.25x is read as invariant; outside it, the leg is a finding"],
        ["bar", "none. This is a within-subject invariance reading, not a cross-engine ratio."],
    ]);
    const invariant = r.drift >= 0.8 && r.drift <= 1.25;
    return verdict(invariant, invariant ? `the instrument reads the incumbent as history-invariant (drift ${r.drift.toFixed(3)}x) — it can therefore be trusted to see a latch` : `drift ${r.drift.toFixed(3)}x is outside the printed envelope`);
}

async function candidate(id) {
    const c = await loadCandidate(id, a.at ?? null);
    header(`X.P.W2.g — alloc-latch --candidate ${id} (G-8)`);
    if (!c.present) {
        await baseline();
        console.log();
        return absent(`candidate ${id}`, c.reason);
    }
    const rows = [];
    const red = [];
    for (const k of ["js", "wasm"]) {
        const L = c.lowerings[k];
        const entry = L.entry("P:color");
        const r = legs(k, (s) => entry(s), "rgb(1 2 3)", "rgb(1 2)");
        rows.push(...r.rows);
        if (!(r.drift >= 0.8 && r.drift <= 1.25)) red.push(`${k}: history drift ${r.drift.toFixed(3)}x outside the printed envelope (K-6)`);
        if (r.rejectPerParse > 0) red.push(`${k}: the reject path allocates ${r.rejectPerParse.toFixed(1)} B/parse`);
        if (typeof L.arenaHighWater === "function") rows.push([k, "arena high-water", `${L.arenaHighWater()} B`, "", "wasm only; the JS lowering reports 0"]);
        if (typeof L.reset === "function") {
            const before = window_((s) => entry(s), "rgb(1 2 3)", 1000).median;
            L.reset();
            const after = window_((s) => entry(s), "rgb(1 2 3)", 1000).median;
            rows.push([k, "reset residue", `${before.toFixed(1)} ns → ${after.toFixed(1)} ns`, `${(after / before).toFixed(3)}x`, "a reset that leaves timing residue is the PT-03 shape"]);
            if (after / before > 1.25) red.push(`${k}: reset leaves timing residue (${(after / before).toFixed(3)}x)`);
        }
        if (typeof L.entryNoFreeze === "function") {
            const frozen = window_((s) => entry(s), "rgb(1 2 3)", 2000).median;
            const plain = window_((s) => L.entryNoFreeze("P:color")(s), "rgb(1 2 3)", 2000).median;
            rows.push([k, "DM-1 Object.freeze leg", `frozen ${frozen.toFixed(1)} ns`, `unfrozen ${plain.toFixed(1)} ns`, "the mark measured as its own leg, never folded into another"]);
        }
    }
    table(["lowering", "leg", "reading", "reading", "note"], rows);
    return verdict(red.length === 0, red.length === 0 ? "history-invariant, zero reject-path allocation, no reset residue, both lowerings" : red.join(" | "));
}

const code = a.candidate ? await candidate(a.candidate) : await baseline();
process.exit(code);
