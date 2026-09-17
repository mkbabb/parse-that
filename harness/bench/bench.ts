// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — THE HONEST BENCH. The gate-invoked entry (W1.md §4, §5.d; gates G-4, G-5, G-9).
//
//   $ npx tsx harness/bench/bench.ts                    # run from <p2>
//   $ npx tsx harness/bench/bench.ts 2> harness/bench/bench.stderr   # G-5's literal form
//
// ARGV — a cross-wave contract (X.P.W2 §4 binds this entry by name and argv):
//   --rounds=<n>   total rounds per cell          (default 40)
//   --warmup=<n>   leading rounds discarded       (default 10)
//   --out=<path>   raw JSON destination           (default harness/bench/bench-raw.json)
//   --no-finalize  skip aggregate.mjs/finalize.mjs invocation (rows still written)
// Every flag is optional; the default invocation above is the gate's.
//
// WHAT THIS BENCH PROVES, AND WHAT IT DOES NOT.
// It proves that no cell ran with the packrat latch armed (G-4), that no cell ran with
// diagnostics armed (G-5 — this process writes NOTHING to stderr), and that every corpus
// declares a nesting depth with a stated margin below a MEASURED `Parser.lazy` ceiling (G-9).
// It publishes ratios. It sets NO BAR: COHESION §0j.E OC-1 rules the bench table
// RECORDED-NOT-GATING, and W1.md G-7 makes inventing a bar a defect of this wave. There is no
// pass/fail column here, and no sentence of the form "the bench passes" exists anywhere in
// this file's output — the column would be the claim.
//
// NO SPEED CLAIM EXISTS OUTSIDE THE PRINTED TABLE (W1.md §5.d).

import { fork } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { arch, platform, release, cpus } from "node:os";
import { subjectPins, packratChunkPath } from "./lib/engines.mjs";
import { stat, f } from "./lib/stats.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (name: string, dflt: string) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : dflt;
};
const ROUNDS = Number(flag("rounds", "40"));
const WARMUP = Number(flag("warmup", "10"));
const OUT = resolve(HERE, flag("out", "bench-raw.json"));
const NO_FINALIZE = argv.includes("--no-finalize");

/** Every published figure is printed here and nowhere else. stdout only: G-5 reads stderr. */
const say = (s = "") => process.stdout.write(s + "\n");

let failures = 0;
const fail = (s: string) => {
    failures++;
    say(`FAIL  ${s}`);
};

interface Msg {
    t: string;
    [k: string]: any;
}

function ask(child: ChildProcess, msg: Msg | null, want: string): Promise<Msg> {
    return new Promise((res, rej) => {
        const onMsg = (m: Msg) => {
            if (m.t !== want) return;
            child.off("message", onMsg);
            child.off("exit", onExit);
            res(m);
        };
        const onExit = (code: number | null) => {
            child.off("message", onMsg);
            rej(new Error(`cell exited ${code} while waiting for ${want}`));
        };
        child.on("message", onMsg);
        child.once("exit", onExit);
        if (msg) child.send(msg);
    });
}

/** Children run under PLAIN node (execArgv []) whatever runs this entry — tsx or node. */
const spawnChild = (file: string, args: string[] = []) =>
    fork(resolve(HERE, file), args, { execArgv: [], stdio: ["ignore", "inherit", "inherit", "ipc"] });

// ── header ────────────────────────────────────────────────────────────────────────────────
const started = new Date().toISOString();
say("X.P.W1.d — THE HONEST BENCH");
say("SERVED MODEL: claude-opus-5[1m]");
say(`run ${started} · orchestrator pid ${process.pid}`);
say();
say("── MACHINE (N=1 — one box, one build, one clock) ──");
say(
    `node ${process.version} · v8 ${process.versions.v8} · ${platform()} ${arch} ${release()} · ` +
        `${cpus()[0]?.model} × ${cpus().length}`,
);
say(
    "BOUND: N=1 machine; a same-process hot loop WITHIN a cell; interleaved cells across a " +
        "live process set. Absolute ns/parse is NOT portable across runs or boxes (this wave's",
);
say(
    "       own open measured the same unarmed median at 56.4 then 58.0 ns/parse, against 55.6 " +
        "in the spec and 93.9 in O-15 — finding F-5). Read the RATIOS between interleaved",
);
say("       cells of one process-set; do not carry a bare nanosecond figure anywhere.");
say();

// ── subjects ──────────────────────────────────────────────────────────────────────────────
say("── SUBJECTS (pinned at the bytes) ──");
const pins = subjectPins();
for (const [name, p] of Object.entries(pins)) {
    say(`${name.padEnd(17)} ${String(p.bytes).padStart(7)} B  sha256 ${p.sha256}`);
    say(`${"".padEnd(17)} ${p.path}`);
}
say();

// ── the latch mechanism, stated before it is used ─────────────────────────────────────────
say("── LATCH OBSERVATION (O-15 PT-03) ──");
say(`installed dist chunk: ${packratChunkPath()}`);
say(
    "PACKRAT_ARMED is a module-local binding of that chunk; it is exported by nothing. It is " +
        "READ through a node loader hook that appends one accessor returning the live",
);
say(
    "binding — same module instance, same URL, same ESM cache entry the grammar would arm. " +
        "The on-disk bytes are never written (re-hashed after every cell). The accessor is",
);
say(
    'proved to be a live read, not a constant, by the positive control in diagnostics-suite.mjs. ' +
        '"We did not call memoize" is not used as evidence anywhere (W1.md §3a).',
);
say();

// ── census ────────────────────────────────────────────────────────────────────────────────
const censusChild = spawnChild("census.mjs");
const census = await ask(censusChild, null, "census");

say("── CENSUS CELL ──");
say(
    `pid ${census.pid} · latch-bearing modules loaded ${census.latchModules} · ` +
        `entry PACKRAT_ARMED === false: ${census.entryLatch.every((r: any) => !r.armed)} · ` +
        `exit: ${census.exitLatch.every((r: any) => !r.armed)}`,
);
for (const r of census.exitLatch) {
    say(
        `   ${r.armed ? "ARMED" : "false"}  decl :${r.declLine}  arm-sites ${r.armSites}` +
            `${r.armLines.length ? ` (:${r.armLines.join(", :")})` : ""}  ${r.path.split("/").slice(-2).join("/")}`,
    );
}
say(
    "   arm-sites is read from the ORIGINAL bytes: a module with 0 assignment sites cannot arm " +
        "at all (esbuild tree-shook makeMemoized out of the two engine bundles); the",
);
say("   installed dist has exactly 1, at the line O-15 PT-03 names. Both facts are measured here.");
say();

// ── G-9 ───────────────────────────────────────────────────────────────────────────────────
const MIN_MARGIN = 1000;
say("── G-9 · DEPTH IS DECLARED, NOT DISCOVERED ──");
say(
    `Parser.lazy ceiling MEASURED IN THE CENSUS PROCESS AT THIS CLOCK: deepest OK = ` +
        `${census.ceiling.deepestOk}; failure mode = ${census.ceiling.mode}; Parser.lazy arity ` +
        `${census.ceiling.lazyArity} (fn only — no depth bound).`,
);
say(
    "The ceiling is NEVER inherited: W1.md/O-15 PT-04 read 7,761, this wave's open read 7,759 " +
        "(finding F-1), and a process with a different module graph reads different again.",
);
say("It is a property of a stack shape, not a constant. The margin below it is the assertion.");
say(`   ${"corpus".padEnd(22)} ${"items".padStart(5)} ${"bytes".padStart(6)} ${"depth".padStart(6)} ${"margin".padStart(7)}  all-strings`);
for (const c of census.ceiling.corpora) {
    say(
        `   ${c.corpus.padEnd(22)} ${String(c.items).padStart(5)} ${String(c.bytes).padStart(6)} ` +
            `${String(c.declaredMaxDepth).padStart(6)} ${String(c.margin).padStart(7)}  ${c.allStrings}`,
    );
    if (c.margin < MIN_MARGIN) fail(`G-9: corpus ${c.corpus} margin ${c.margin} < ${MIN_MARGIN}`);
    if (!c.allStrings) fail(`G-9/§3.9: corpus ${c.corpus} holds a non-string item`);
}
say(
    `   Declared bound: every corpus in this lane nests at most ${Math.max(
        ...census.ceiling.corpora.map((c: any) => c.declaredMaxDepth),
    )} deep, with margin ≥ ${MIN_MARGIN} required and ` +
        `${Math.min(...census.ceiling.corpora.map((c: any) => c.margin))} measured.`,
);
say();

// ── §3 item 9 ─────────────────────────────────────────────────────────────────────────────
say("── JS-BOUNDARY INVARIANT (W1.md §3 item 9 · O-15 PT-07) ──");
say(
    `raw parse-that: ${census.boundary.rawThrows}/${census.boundary.probes} non-string inputs ` +
        `throw (${census.boundary.rawModes.join(", ")}) — PT-07 reproduced, not assumed.`,
);
say(
    `guarded above parse-that: ${census.boundary.guardedThrows}/${census.boundary.probes} throw; ` +
        `every one returns the typed failure ${census.boundary.guardedCodes.join(", ")}.`,
);
say(
    "The guard types the INPUT edge only. It does not catch an engine exception on a string " +
        "input: wrapping those would turn R1 into a tidy ok:false and delete the defect the",
);
say("r1-throw leg exists to price.");
if (!census.boundary.holds) fail("§3.9: the JS-boundary invariant does not hold");
if (census.boundary.rawThrows !== 5) fail(`§3.9: PT-07 did not reproduce (${census.boundary.rawThrows}/5)`);
say();

// ── the grid ──────────────────────────────────────────────────────────────────────────────
say("── THE GRID · measured dispositions decide it, nothing else ──");
say(
    `   ${"engine".padEnd(17)} ${"leg".padEnd(21)} ${"acc".padStart(4)} ${"rej".padStart(4)} ${"thr".padStart(4)}  timed`,
);
for (const d of census.dispositions) {
    say(
        `   ${d.engine.padEnd(17)} ${d.leg.padEnd(21)} ${String(d.accept).padStart(4)} ` +
            `${String(d.reject).padStart(4)} ${String(d.throw).padStart(4)}  ${d.timed ? "yes" : "NO"}` +
            (d.timed ? "" : ` — ${d.reason}`),
    );
}
say();

const timed = census.dispositions.filter((d: any) => d.timed);
const calMap = new Map(census.calibration.map((c: any) => [`${c.engine}/${c.leg}`, c]));

// ── cells ─────────────────────────────────────────────────────────────────────────────────
say("── CELLS · one fresh process each, all alive at once ──");
const cells: any[] = [];
for (const d of timed) {
    const key = `${d.engine}/${d.leg}`;
    const cal: any = calMap.get(key);
    const child = spawnChild("cell.mjs", [d.engine, d.leg, String(cal.passes)]);
    const ready = await ask(child, null, "ready");
    cells.push({ key, child, ready, rounds: [] as any[] });
    say(
        `   pid ${String(ready.pid).padStart(6)}  ${key.padEnd(39)} passes/round ${String(ready.passes).padStart(6)} ` +
            `calls/pass ${String(ready.callsPerPass).padStart(4)}  doors ${ready.doors.join(",")}`,
    );
    say(
        `   ${"".padStart(6)}  latch@preload false · latch@entry PACKRAT_ARMED === false · ` +
            `latch modules ${ready.latchModules} · disposition ${ready.tally.accept}/${ready.tally.reject}/${ready.tally.throw}`,
    );
    if (!ready.entry.every((r: any) => !r.armed)) fail(`G-4: ${key} entered ARMED`);
    if (
        ready.tally.accept !== d.accept ||
        ready.tally.reject !== d.reject ||
        ready.tally.throw !== d.throw
    ) {
        fail(`${key}: disposition drifted between the census process and the cell process`);
    }
}
const pids = cells.map((c) => c.ready.pid);
say();

// ── rounds ────────────────────────────────────────────────────────────────────────────────
say(
    `── ROUNDS · ${ROUNDS} rounds, first ${WARMUP} discarded, cells INTERLEAVED per round ` +
        `(round r measures every cell once, in order, before round r+1 begins) ──`,
);
for (let n = 1; n <= ROUNDS; n++) {
    for (const cell of cells) {
        const r = await ask(cell.child, { t: "round", n }, "round");
        cell.rounds.push({ n, ...r });
    }
}
for (const cell of cells) {
    const done = await ask(cell.child, { t: "finish" }, "done");
    cell.done = done;
    if (!done.exit.every((r: any) => !r.armed)) fail(`G-4: ${cell.key} EXITED ARMED`);
    if (!done.onDisk.every((r: any) => r.unchanged)) fail(`${cell.key}: a latch module's on-disk bytes moved`);
}
say(`${ROUNDS} rounds × ${cells.length} cells = ${ROUNDS * cells.length} measured round-cells.`);
say();

// ── the table ─────────────────────────────────────────────────────────────────────────────
const rows = cells.map((cell) => {
    const scored = cell.rounds.filter((r: any) => r.n > WARMUP);
    return {
        engine: cell.ready.engine,
        leg: cell.ready.leg,
        pid: cell.ready.pid,
        passes: cell.ready.passes,
        callsPerPass: cell.ready.callsPerPass,
        bytesPerPass: cell.ready.bytesPerPass,
        doors: cell.ready.doors,
        disposition: cell.ready.tally,
        roundsTotal: cell.rounds.length,
        roundsScored: scored.length,
        ns_per_call: stat(scored.map((r: any) => r.nsPerCall)),
        mbps: stat(scored.map((r: any) => r.mbps)),
        sink: cell.done.sink,
    };
});

const byLeg = new Map<string, any[]>();
for (const r of rows) {
    if (!byLeg.has(r.leg)) byLeg.set(r.leg, []);
    byLeg.get(r.leg)!.push(r);
}
const jsonRow = rows.find((r) => r.engine === "json-normaliser");

say("── TABLE · THREE LEGS, KEPT SEPARATE (never summed, never averaged) ──");
for (const [leg, legRows] of byLeg) {
    const ref = legRows.find((r) => r.engine === "published-4.0.0");
    say();
    say(`leg ${leg}`);
    say(
        `   ${"engine".padEnd(17)} ${"ns/call".padStart(10)} ${"spread%".padStart(8)} ` +
            `${"MB/s".padStart(9)} ${"×published".padStart(11)} ${"÷jsonParser".padStart(12)}  acc/rej/thr  sink`,
    );
    for (const r of legRows) {
        const vsPub = ref ? ref.ns_per_call.median / r.ns_per_call.median : NaN;
        const vsJson = jsonRow ? r.mbps.median / jsonRow.mbps.median : NaN;
        say(
            `   ${r.engine.padEnd(17)} ${f(r.ns_per_call.median, 1).padStart(10)} ` +
                `${f(r.ns_per_call.spread_pct, 1).padStart(8)} ${f(r.mbps.median, 2).padStart(9)} ` +
                `${(r.engine === "published-4.0.0" ? "1.000 (ref)" : f(vsPub, 3)).padStart(11)} ` +
                `${f(vsJson, 4).padStart(12)}  ${r.disposition.accept}/${r.disposition.reject}/${r.disposition.throw}` +
                `  ${r.sink}`,
        );
        if (ref && r !== ref) {
            const sameShape =
                r.disposition.accept === ref.disposition.accept &&
                r.disposition.reject === ref.disposition.reject &&
                r.disposition.throw === ref.disposition.throw;
            if (!sameShape) {
                say(
                    `   ${"".padEnd(17)} ↳ DISPOSITION DIFFERS from the reference ` +
                        `(${ref.disposition.accept}/${ref.disposition.reject}/${ref.disposition.throw}): the ratio above is ` +
                        `two different behaviours timed, not one behaviour compared.`,
                );
            }
        }
    }
}
say();
say(
    "×published = published-4.0.0's median ns/call ÷ this engine's; >1 means faster than the " +
        "incumbent. ÷jsonParser is the U-F14 co-scaling reading, recomputed on MEDIANS",
);
say(
    "(the ported bench used a PEAK, which is the luckiest round on a shared box). The historical " +
        "absolute floors VALUE ≥ 0.0500 / SHEET ≥ 0.1000 are RECORDED HERE AND NOT APPLIED:",
);
say(
    "COHESION §0j.E OC-1 rules the bench table RECORDED-NOT-GATING, and the gate's own " +
        "calibration subject failed those floors on 3 of 5 scenarios — a bar the calibration",
);
say(
    "subject cannot meet is a broken ruler, not a standard. No bar is set by this harness; " +
        "Plane B's 3× / 2× / break-even remain OWNER-GATED-PENDING-RATIFICATION (W1.md G-7).",
);
say();

// ── latch ledger ──────────────────────────────────────────────────────────────────────────
say("── G-4 LEDGER · one PID per cell, entry AND exit, read from the dist ──");
say(`   ${"pid".padStart(7)}  ${"cell".padEnd(39)} entry  exit`);
for (const cell of [{ key: "census", ready: { pid: census.pid, entry: census.entryLatch }, done: { exit: census.exitLatch } }, ...cells]) {
    say(
        `   ${String(cell.ready.pid).padStart(7)}  ${cell.key.padEnd(39)} ` +
            `${cell.ready.entry.every((r: any) => !r.armed) ? "false" : "ARMED"}  ` +
            `${cell.done.exit.every((r: any) => !r.armed) ? "false" : "ARMED"}`,
    );
}
const allPids = [census.pid, ...pids];
const distinct = new Set(allPids).size;
say(
    `   PIDs ${allPids.length}, distinct ${distinct} — ${distinct === allPids.length ? "NONE REPEATED" : "REPEAT FOUND"}. ` +
        `All cells were alive simultaneously, so distinctness is structural as well as asserted.`,
);
if (distinct !== allPids.length) fail("G-4: a PID repeated across cells");
say(`   orchestrator pid ${process.pid} — it loads no engine and parses nothing.`);
say();

// ── raw rows ──────────────────────────────────────────────────────────────────────────────
const raw = {
    schema: "x-p-w1.bench/1",
    servedModel: "claude-opus-5[1m]",
    generated: started,
    finished: new Date().toISOString(),
    method: {
        rounds: ROUNDS,
        warmupRoundsDiscarded: WARMUP,
        statistic: "median of scored rounds",
        interleaving: "cells interleaved per round across a live process set",
        processModel: "one fresh process per cell; all cells alive simultaneously",
        latchObservation:
            "node loader hook appends a reader to every module declaring PACKRAT_ARMED; read at preload, entry and exit",
        barsApplied: "NONE — COHESION §0j.E OC-1: the bench table is RECORDED-NOT-GATING",
        historicalFloorsRecordedNotApplied: { VALUE_RATIO_FLOOR: 0.05, SHEET_RATIO_FLOOR: 0.1 },
    },
    machine: {
        node: process.version,
        v8: process.versions.v8,
        os: platform(),
        os_release: release(),
        arch,
        cpu: cpus()[0]?.model,
        cores: cpus().length,
        bound: "N=1 machine; same-process hot loop within a cell; ratios only",
    },
    subjects: pins,
    census: {
        pid: census.pid,
        ceiling: census.ceiling,
        boundary: census.boundary,
        dispositions: census.dispositions,
        calibration: census.calibration,
    },
    latchLedger: [
        { cell: "census", pid: census.pid, entry: census.entryLatch, exit: census.exitLatch },
        ...cells.map((c) => ({ cell: c.key, pid: c.ready.pid, preload: c.ready.preload, entry: c.ready.entry, exit: c.done.exit })),
    ],
    rows,
    rounds: cells.map((c) => ({ cell: c.key, pid: c.ready.pid, rounds: c.rounds })),
};
writeFileSync(OUT, JSON.stringify(raw, null, 2) + "\n");
say(`── RAW ROWS · ${OUT}`);
say();

// ── the two ported scripts, each invoked by this entry, each in its own process ───────────
if (!NO_FINALIZE) {
    for (const script of ["aggregate.mjs", "finalize.mjs"]) {
        const code: number = await new Promise((res) => {
            const c = spawnChild(script, [OUT]);
            c.on("exit", (x) => res(x ?? 1));
        });
        if (code !== 0) fail(`${script} exited ${code}`);
    }
}

say();
if (failures === 0) {
    say(
        `GREEN — ${cells.length} timing cells + 1 census cell, each in its own process, each ` +
            `proving PACKRAT_ARMED === false at entry and at exit, no PID repeated; three legs`,
    );
    say(
        `        published separately; every corpus depth declared with margin ≥ ${MIN_MARGIN} below a ` +
            `ceiling measured at this clock. No bar is set and no verdict is issued.`,
    );
    process.exit(0);
} else {
    say(`RED — ${failures} failure(s) above.`);
    process.exit(1);
}
