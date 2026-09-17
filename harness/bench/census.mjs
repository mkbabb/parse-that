// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — THE CENSUS CELL. Its own process, its own PID, its own latch assertions.
//
// It runs BEFORE any timing cell and answers the four questions a timing cell must not be
// asked to answer about itself:
//
//   1. G-9  — what is the `Parser.lazy` ceiling AT THIS CLOCK, in THIS process, and what
//             margin does each corpus's declared depth have below it?
//   2. §3.9 — does the JS-boundary invariant hold, and does the raw surface still throw 5/5?
//   3. LEG  — what is each (engine, leg) pair's measured DISPOSITION (accept/reject/throw)?
//             A pair whose disposition makes its leg vacuous is NOT TIMED, and the reason is
//             the measurement, printed. Nothing is excluded by opinion.
//   4. N    — how many passes per round make a round long enough to measure? Calibrated here
//             once, printed, and then FIXED for every round of that cell.
//
// It is forked, not imported: the ceiling walk drives `Parser.lazy` to a `RangeError` 7,700+
// frames deep, and that is not a thing to do in a process that also holds timing state.

import { assertUnarmed, latchModuleCount } from "./lib/latch.mjs";
import { packratChunkPath, PARSE_THAT_DIST, loadEngine, classify } from "./lib/engines.mjs";
import { LEGS, NORMALISER_LEG, legOf, depthDeclaration } from "./lib/corpora.mjs";
import { measureBoundary } from "./lib/boundary.mjs";
import { pathToFileURL } from "node:url";

const ENGINES = ["published-4.0.0", "c14", "deposed"];
const TARGET_ROUND_NS = 3_000_000; // 3 ms per round: long enough to time, short enough to interleave

// The latch witness — loaded FIRST, in every process of this harness, so that every cell has
// at least one latch-bearing module to read and no cell can be silent about the latch.
await import(pathToFileURL(packratChunkPath()).href);
const entryLatch = await assertUnarmed("entry", 1);

// ── 1. G-9: the ceiling, measured here, and the margin ────────────────────────────────────
const pt = await import(pathToFileURL(`${PARSE_THAT_DIST}/parse.js`).href);
const nested = pt.Parser.lazy(() =>
    pt.any(pt.all(pt.string("("), nested, pt.string(")")), pt.string("x")),
);
let deepestOk = 0;
let ceilingMode = "n/a";
for (let d = 1; d <= 20000; d++) {
    try {
        const st = nested.parseState("(".repeat(d) + "x" + ")".repeat(d));
        if (st.isError) {
            ceilingMode = `ok:false at depth ${d}`;
            break;
        }
        deepestOk = d;
    } catch (e) {
        ceilingMode = `${e.constructor.name} thrown at depth ${d}`;
        break;
    }
}
const depths = depthDeclaration();
const ceiling = {
    deepestOk,
    mode: ceilingMode,
    lazyArity: pt.Parser.lazy.length,
    corpora: depths.map((row) => ({
        ...row,
        margin: deepestOk - row.declaredMaxDepth,
        marginPct: ((deepestOk - row.declaredMaxDepth) / deepestOk) * 100,
    })),
};

// ── 2. §3 item 9: the JS boundary ─────────────────────────────────────────────────────────
const boundary = measureBoundary((x) => pt.string("a").parseState(x));

// ── 3. dispositions, and the grid that follows from them ──────────────────────────────────
const dispositions = [];
for (const name of ENGINES) {
    const engine = await loadEngine(name);
    for (const leg of Object.keys(LEGS)) {
        const items = legOf(leg);
        const tally = { accept: 0, reject: 0, throw: 0 };
        for (const item of items) {
            const door = engine.doors[item.kind];
            tally[classify(door, item.src)]++;
        }
        // The leg contracts, each a MEASUREMENT of the pair, never a judgement of the engine.
        let timed = true;
        let reason = "";
        if (leg === "shared-accepted" && tally.accept !== items.length) {
            timed = false;
            reason = `leg contract broken: ${tally.accept}/${items.length} accepted — the "shared" claim is false, so nothing is timed (the ported bench's rule: refuse to time a failing parse)`;
        }
        if (leg === "reject-non-throwing" && (tally.reject !== items.length || tally.throw > 0)) {
            timed = false;
            reason = `not a non-throwing reject path here: accept ${tally.accept} / reject ${tally.reject} / throw ${tally.throw} of ${items.length}`;
        }
        if (leg === "r1-throw-class" && tally.accept > items.length / 2) {
            timed = false;
            reason = `accepts ${tally.accept}/${items.length} of the degenerate cross-product — this engine is not exercising the throw class at all`;
        }
        dispositions.push({
            engine: name,
            leg,
            items: items.length,
            doors: [...new Set(items.map((i) => engine.doorNames[i.kind]))],
            ...tally,
            timed,
            reason,
        });
    }
}

// The normaliser is always timed: it is the co-scaling reference and the cell that reads the
// INSTALLED dist's own latch (O-15 PT-03's `:678`/`:722` module).
dispositions.push({
    engine: "json-normaliser",
    leg: "json-normaliser",
    items: NORMALISER_LEG.length,
    doors: ["jsonParser.parse"],
    accept: NORMALISER_LEG.length,
    reject: 0,
    throw: 0,
    timed: true,
    reason: "",
});

// ── 4. N calibration ──────────────────────────────────────────────────────────────────────
// Measured per pair, in THIS process, for round-shaping only. It never enters a published
// ratio: a ratio is always median-ns-per-call against median-ns-per-call.
const calibration = [];
for (const row of dispositions.filter((d) => d.timed)) {
    const engine = await loadEngine(row.engine);
    const items = legOf(row.leg);
    const pass = () => {
        for (const item of items) {
            try {
                engine.doors[item.kind](item.src);
            } catch {
                /* counted in the cell, never here */
            }
        }
    };
    for (let i = 0; i < 20; i++) pass();
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < 20; i++) pass();
    const perPassNs = Number(process.hrtime.bigint() - t0) / 20;
    const passes = Math.max(1, Math.min(200000, Math.round(TARGET_ROUND_NS / perPassNs)));
    calibration.push({ engine: row.engine, leg: row.leg, perPassNs, passes });
}

const exitLatch = await assertUnarmed("exit", 1);

process.send({
    t: "census",
    pid: process.pid,
    latchModules: latchModuleCount(),
    entryLatch,
    exitLatch,
    ceiling,
    boundary,
    dispositions,
    calibration,
});
process.exit(0);
