// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — ONE BENCH CELL, ONE FRESH PROCESS (W1.md §5.d.1, G-4).
//
// A cell is one (engine, leg) pair. It is forked by `bench.ts`, it loads exactly one engine,
// and it lives for the whole run so that its PID is a stable identity and every round of that
// cell is measured in the same process. All cells are alive SIMULTANEOUSLY, which is what
// makes "no PID repeated across cells" a structural fact rather than a hopeful assertion —
// the OS cannot hand two live processes the same PID.
//
// WHY THIS SHAPE AND NOT A LOOP IN ONE PROCESS. `PACKRAT_ARMED` is one-way: `:678` declares
// it false, `:722` sets it true inside `makeMemoized()`, and nothing in the bundle sets it
// back. A harness that arms it in an early cell measures EVERY later cell at the armed rate —
// O-15 measured that penalty at 1.47x, larger than most differences a bench in this program is
// trying to resolve. Process isolation is the only structure under which an early cell cannot
// poison a late one, because `resetPackrat()` provably does not disarm (it returns early when
// unarmed and clears only the memo tables when armed).
//
// The latch is READ, at entry and at exit, from every latch-bearing module this process has
// loaded — the installed dist chunk always, plus whatever copy the engine bundle inlines.
// "We did not call memoize" is not evidence and is not used (§3a).

import { assertUnarmed, latchModuleCount, verifyOnDisk } from "./lib/latch.mjs";
import { packratChunkPath, loadEngine, classify } from "./lib/engines.mjs";
import { legOf } from "./lib/corpora.mjs";
import { pathToFileURL } from "node:url";

const [, , engineName, legName, passesArg] = process.argv;
const passes = Number(passesArg);

// The latch witness first, before the engine: O-15 PT-03's coordinates are the installed
// dist's, so the installed dist is what a claim about PT-03 must be read from.
await import(pathToFileURL(packratChunkPath()).href);
const preload = await assertUnarmed("preload", 1);

const engine = await loadEngine(engineName);
const items = legOf(legName);

// G-4's entry half: the latch, read after the engine is in memory and before a single parse.
const entry = await assertUnarmed("entry", 1);

const bytesPerPass = items.reduce((s, i) => s + Buffer.byteLength(i.src, "utf8"), 0);
const callsPerPass = items.length;

// The sink. Every result contributes to it and the orchestrator PRINTS it, so no parse can be
// optimised away as dead. A bench whose work can be elided measures the optimiser, not the
// parser.
let sink = 0;
const tally = { accept: 0, reject: 0, throw: 0 };

function pass() {
    for (const item of items) {
        const door = engine.doors[item.kind];
        try {
            const r = door(item.src);
            if (r !== null && typeof r === "object" && "ok" in r) {
                sink = (sink + (r.ok === true ? 1 : 2)) | 0;
            } else {
                sink = (sink + (r === undefined ? 3 : 4)) | 0;
            }
        } catch (e) {
            // COUNTED, never swallowed: the r1 leg's whole subject is that this happens.
            sink = (sink + 5 + (e?.message?.length ?? 0)) | 0;
        }
    }
}

/** One round = `passes` passes over the leg. Timed with the monotonic clock, nothing else. */
function round() {
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < passes; i++) pass();
    const ns = Number(process.hrtime.bigint() - t0);
    const calls = passes * callsPerPass;
    return {
        ns,
        calls,
        nsPerCall: ns / calls,
        mbps: (bytesPerPass * passes) / 1e6 / (ns / 1e9),
    };
}

// The disposition of THIS cell, measured once in this process before timing: it must equal the
// census's reading, and `bench.ts` compares them. A cell whose disposition drifted between the
// census process and its own is a cell measuring something other than what was declared.
for (const item of items) tally[classify(engine.doors[item.kind], item.src)]++;

process.send({
    t: "ready",
    pid: process.pid,
    engine: engineName,
    leg: legName,
    passes,
    callsPerPass,
    bytesPerPass,
    latchModules: latchModuleCount(),
    preload,
    entry,
    tally,
    doors: [...new Set(items.map((i) => engine.doorNames[i.kind]))],
});

process.on("message", async (msg) => {
    if (msg.t === "round") {
        process.send({ t: "round", n: msg.n, pid: process.pid, ...round() });
        return;
    }
    if (msg.t === "finish") {
        // G-4's exit half. A harness that checks the latch only at startup passes while being
        // wrong from cell two onward — hence entry AND exit.
        const exit = await assertUnarmed("exit", 1);
        process.send({
            t: "done",
            pid: process.pid,
            exit,
            sink,
            onDisk: verifyOnDisk(),
        });
        process.exit(0);
    }
});
