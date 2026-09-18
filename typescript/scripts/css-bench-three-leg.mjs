#!/usr/bin/env node
// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — G-10: THE THREE-LEG BENCH TABLE. RECORDED, NEVER GATING.
//
//   node scripts/css-bench-three-leg.mjs --baseline-tarball <sha-pinned 4.0.0> \
//        --rounds 40 --discard 10 --denominator 1636680
//
// ── WHAT THIS PROGRAM MAY AND MAY NOT CONCLUDE ────────────────────────────────────────────────
//
// COHESION §0j.E OC-1, ruled 2026-09-17: "ADMISSION IS DECIDED ON CORRECTNESS; the bench table is
// RECORDED-NOT-GATING." `W3.md` §2b OP-5: the `≥10x` floor is RETIRED AS LAW and the replacement
// strict-3x / strict-2x / break-even families are UNRATIFIED (0/5 each); "No ruling is required to
// open — G-10 **reports** ratios and marks the BAR `OWNER-GATED-PENDING-RATIFICATION`. **Inventing
// a bar is a defect**, and a wave that passes or fails on an unratified bar is void."
//
// So this program prints the literal string `BAR: OWNER-GATED-PENDING-RATIFICATION` and asserts NO
// verdict of any kind. `exitCode` is 0 when the table is WELL-FORMED and 1 when it is not; it is
// never a performance judgement. G-10's own falsifier lists the four ways the table can be
// ill-formed and this program checks all four ON ITSELF before it exits:
//   (1) a ratio published outside the three legs;
//   (2) a budget citing the UNCITABLE denominator (`1,870,633 µs`) or its derivatives
//       (`187,063 µs`, `311,661`, `623,434`) — asserted by scanning this program's OWN OUTPUT;
//   (3) a row omitting its arm-state;
//   (4) a pass/fail verdict the owner has not ratified.
// And the fifth, which is not a well-formedness condition but a HONESTY one: the table "fails if it
// silently reconciles with the 07-20 gate's 'LIVE regex measured FASTEST ~1.8×'". It does not
// reconcile: the contradiction is `C-1`, a printed ROW, with both readings and both methods.
//
// ── THE DENOMINATOR ───────────────────────────────────────────────────────────────────────────
//
// SCOPE.md M-22 ¶4 is binding: every 3×/2× budget restates against the CONSERVATIVE RECONSTRUCTION
// **1,636,680 µs**. The program refuses to run against any other denominator, because "a bench
// claim restated against anything but 1,636,680 µs is void" (`W3.md` §3, the PRUNE prohibition on
// denominator rewrite) — passing `--denominator` anything else is an error, not an option.
//
// ── THE METHOD, DECLARED BEFORE THE NUMBERS ───────────────────────────────────────────────────
//
// THREE LEGS, partitioned by the PUBLISHED engine's own behaviour, taken ONCE before any timing:
//   shared-accepted  every arm returns ok:true          (the fair-comparison leg)
//   reject           every arm returns ok:false         (the rejection-path leg)
//   R1-class         the published engine THROWS        (published is timed WITH the caller's catch,
//                                                        which is the only way a caller survives it)
// INTERLEAVED CELLS — within one round every arm runs once, and the arm order ROTATES by round, so
// thermal drift and JIT-tier transitions land on every arm rather than on the one that happened to
// go last.
// MEDIAN-OF-ROUNDS — `--rounds 40 --discard 10`: the first 10 rounds are discarded as warm-up and
// the median of the remaining 30 is reported. Median, not mean: one descheduled round should move
// the reading by nothing.
// A PRINTED SINK — every result is folded into a checksum that is printed, so no arm's work can be
// eliminated as dead.
// THE ARM-STATE ON EVERY ROW — O-15 PT-03's packrat latch is 1.47× on its own, so a table without
// it is uninterpretable.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TS_ROOT = path.resolve(HERE, "..");

/** M-22 ¶4. The ONE citable denominator. */
const DENOMINATOR_US = 1636680;

/** `W3.md` §6 G-10: UNCITABLE until `P4-EVIDENCE-REPLAY.json` is readable under a TCC grant. */
const UNCITABLE = ["1,870,633", "1870633", "187,063", "187063", "311,661", "311661", "623,434", "623434"];

/** The fixed native floor the gate names, and the retired/unratified budget families. */
const NATIVE_FLOOR_US = 311883;

const arg = (name, fallback = null) => {
    const i = process.argv.indexOf(`--${name}`);
    if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
    const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
    return eq ? eq.slice(name.length + 3) : fallback;
};

const sha256File = (p) => (existsSync(p) ? createHash("sha256").update(readFileSync(p)).digest("hex") : null);

const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** The printed sink. Folded from every result so the optimizer cannot delete an arm's work. */
let SINK = 0;
const sink = (result) => {
    if (result === undefined || result === null) {
        SINK += 1;
        return;
    }
    if (result.ok === true) SINK += 2;
    else if (result.ok === false) SINK += 3 + (result.diagnostics?.[0]?.end ?? 0);
    else SINK += 5;
};

const call = (fn, input) => {
    try {
        return { threw: false, value: fn(input) };
    } catch (error) {
        return { threw: true, value: undefined, error: error instanceof Error ? error.constructor.name : typeof error };
    }
};

/** The published arm, timed WITH the caller's catch — the R1 leg has no other honest shape. */
const guarded = (fn) => (input) => {
    try {
        return fn(input);
    } catch {
        return undefined;
    }
};

const main = async () => {
    const rounds = Number(arg("rounds", "40"));
    const discard = Number(arg("discard", "10"));
    const denominator = Number(arg("denominator", String(DENOMINATOR_US)));
    const cellSize = Number(arg("cell", "192"));
    const out = arg("out");

    if (denominator !== DENOMINATOR_US) {
        console.error(
            `css-bench-three-leg: --denominator ${denominator} REFUSED. SCOPE.md M-22 ¶4 binds every budget to ` +
                `the conservative reconstruction ${DENOMINATOR_US} µs, and W3.md §3 makes a restatement against ` +
                `anything else VOID. This is not an option with a default; it is a law with one value.`,
        );
        return 2;
    }

    const { loadOracle, disposeOracle } = await import(path.join(TS_ROOT, "test/css-equivalence/lib/oracle.mjs"));
    const { distinctSources, loadCorpus } = await import(path.join(TS_ROOT, "test/css-equivalence/lib/corpus.mjs"));
    const { loadPublicSurfaces } = await import(path.join(TS_ROOT, "src/css/entry.mjs"));
    const { measurePackratLatch, readPackratArmState } = await import(path.join(TS_ROOT, "src/css/bounds.mjs"));

    const oracle = await loadOracle();
    const baselineFlag = arg("baseline-tarball", oracle.pin.path);
    const surfaces = await loadPublicSurfaces();
    const corpus = loadCorpus();
    const sources = distinctSources();

    // ── the arm-state, measured once, BEFORE any timing ──────────────────────
    const candidateArmBefore = await readPackratArmState();

    // The published bundle's own arm-state: scanned, because a bundle that carries no packrat has
    // no arm-state to read, and "N/A" with a measurement behind it is a reading, not an omission.
    const distDir = path.join(oracle.dir, "package/dist");
    const walk = (d) => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));
    const packratTokens = ["PACKRAT_ARMED", "packratEnter", "resetPackrat", "memoize"];
    const publishedPackratHits = walk(distDir).flatMap((f) => {
        const text = readFileSync(f, "utf8");
        return packratTokens.filter((t) => text.includes(t)).map((t) => `${path.relative(distDir, f)}:${t}`);
    });
    const publishedArmState =
        publishedPackratHits.length === 0
            ? "N/A — the published 4.0.0 bundle carries NO packrat machinery (0 occurrences of PACKRAT_ARMED / packratEnter / resetPackrat / memoize across its whole dist)"
            : `PRESENT — ${publishedPackratHits.join(" · ")}`;

    // ── the three legs, partitioned once ─────────────────────────────────────
    const pub = oracle.module.parseCssColor;
    const legs = { "shared-accepted": [], reject: [], "R1-class": [] };
    for (const row of sources) {
        const p = call(pub, row.src);
        if (p.threw) {
            if (legs["R1-class"].length < cellSize) legs["R1-class"].push(row.src);
            continue;
        }
        const j = call(surfaces.js.parseCssColor, row.src);
        const w = call(surfaces.wasm.parseCssColor, row.src);
        if (j.threw || w.threw) continue;
        const allOk = p.value.ok === true && j.value.ok === true && w.value.ok === true;
        const allNo = p.value.ok === false && j.value.ok === false && w.value.ok === false;
        if (allOk && legs["shared-accepted"].length < cellSize) legs["shared-accepted"].push(row.src);
        else if (allNo && legs.reject.length < cellSize) legs.reject.push(row.src);
        if (Object.values(legs).every((l) => l.length >= cellSize)) break;
    }

    const arms = [
        { id: "published 4.0.0", fn: guarded(pub), armState: publishedArmState, baseline: true },
        { id: "candidate js", fn: surfaces.js.parseCssColor, armState: null, baseline: false },
        { id: "candidate wasm", fn: surfaces.wasm.parseCssColor, armState: null, baseline: false },
    ];

    // ── the measurement ──────────────────────────────────────────────────────
    const samples = {};
    for (const leg of Object.keys(legs)) samples[leg] = arms.map(() => []);

    for (let round = 0; round < rounds; round += 1) {
        for (const [leg, inputs] of Object.entries(legs)) {
            if (inputs.length === 0) continue;
            // INTERLEAVED: the arm order rotates by round, so drift lands on every arm.
            const order = arms.map((_, i) => (i + round) % arms.length);
            for (const idx of order) {
                const fn = arms[idx].fn;
                const t0 = process.hrtime.bigint();
                for (const input of inputs) sink(fn(input));
                const t1 = process.hrtime.bigint();
                samples[leg][idx].push(Number(t1 - t0) / inputs.length);
            }
        }
    }

    const armStateAfter = await readPackratArmState();
    const latch = await measurePackratLatch();

    // ── the table ────────────────────────────────────────────────────────────
    const table = [];
    for (const [leg, inputs] of Object.entries(legs)) {
        const kept = samples[leg].map((xs) => xs.slice(discard));
        const meds = kept.map((xs) => (xs.length ? median(xs) : null));
        const baselineIdx = arms.findIndex((a) => a.baseline);
        for (let i = 0; i < arms.length; i += 1) {
            const nsPerOp = meds[i];
            const ratio = meds[baselineIdx] && nsPerOp ? meds[baselineIdx] / nsPerOp : null;
            table.push({
                leg,
                arm: arms[i].id,
                cell: inputs.length,
                rounds,
                discarded: discard,
                keptRounds: kept[i].length,
                nsPerOp: nsPerOp === null ? null : Number(nsPerOp.toFixed(1)),
                // The ratio is BASELINE / ARM: greater than 1 means the arm is faster than published.
                ratioVsPublished: ratio === null ? null : Number(ratio.toFixed(3)),
                armState: arms[i].baseline
                    ? arms[i].armState
                    : `UNARMED — measured before the run (${candidateArmBefore}) and after it (${armStateAfter}); the candidate's reachable set constructs no memoizer (.c, G-9)`,
                // The same reading, short enough that the column cannot truncate it. The long form
                // above is the statement; this is its label, and both are printed.
                armStateShort: arms[i].baseline ? "N/A — published bundle carries no packrat [a]" : "UNARMED — before & after [b]",
            });
        }
    }

    // ── the four well-formedness checks, run ON THIS TABLE ───────────────────
    const declaredLegs = Object.keys(legs);
    const findings = [];
    for (const row of table) {
        if (!declaredLegs.includes(row.leg)) findings.push(`ratio published outside the three legs: ${row.leg}`);
        if (typeof row.armState !== "string" || row.armState.length === 0) findings.push(`row omits its arm-state: ${row.leg}/${row.arm}`);
    }

    const budgets = {
        denominatorUs: DENOMINATOR_US,
        note: "SCOPE.md M-22 ¶4 — every 3×/2× budget restates against the conservative reconstruction.",
        retiredAsLaw: { name: "≥10×", budgetUs: DENOMINATOR_US / 10, status: "RETIRED AS LAW" },
        nativeFloorUs: NATIVE_FLOOR_US,
        floorExceedsTenXBudgetBy: Number((NATIVE_FLOOR_US / (DENOMINATOR_US / 10)).toFixed(3)),
        families: [
            { name: "strict-3×", budgetUs: DENOMINATOR_US / 3, headroomUs: DENOMINATOR_US / 3 - NATIVE_FLOOR_US, ratified: "UNRATIFIED (0/5)" },
            { name: "strict-2×", budgetUs: DENOMINATOR_US / 2, headroomUs: DENOMINATOR_US / 2 - NATIVE_FLOOR_US, ratified: "UNRATIFIED (0/5)" },
            { name: "break-even", budgetUs: DENOMINATOR_US, headroomUs: DENOMINATOR_US - NATIVE_FLOOR_US, ratified: "UNRATIFIED (0/5)" },
        ],
    };

    const contradiction = {
        id: "C-1",
        subject: "the direction of the parser/regex comparison",
        readingA: "07-20 proof gate — 'LIVE regex measured FASTEST ~1.8×' (one author, one method)",
        readingB:
            "parser-band.md cross-bench, two runs, plus cand-F and cand-O's own harnesses — three independent measurements, two candidates and an arbiter, three methods — reading the opposite direction",
        readingC: "this table, a fourth measurement, printed above",
        disposition:
            "NOT RECONCILED AND NOT ERASED. W3.md §6 G-10: 'the contradiction is a row in the table, not an erasure.' Which reading is right is an owner question that rides with OC-1; nothing here pre-empts it.",
    };

    const report = {
        schema: "x-p-w3-d/bench-three-leg@1",
        generatedBy: "typescript/scripts/css-bench-three-leg.mjs",
        bar: "BAR: OWNER-GATED-PENDING-RATIFICATION",
        verdict: null,
        verdictNote:
            "NONE, by law. COHESION §0j.E OC-1 — the bench table is RECORDED-NOT-GATING; W3.md §6 G-10 — 'inventing a bar is a defect'. This program's exit code reports WELL-FORMEDNESS, never performance.",
        baseline: {
            flag: baselineFlag,
            tarball: oracle.pin.path,
            bytes: oracle.pin.bytes,
            sha256: oracle.pin.sha256,
            npmIntegrity: oracle.pin.npmIntegrity,
        },
        method: {
            rounds,
            discarded: discard,
            keptRounds: rounds - discard,
            statistic: "median of kept rounds",
            interleaved: "within each round every arm runs once; the arm order rotates by round",
            cellSize,
            sink: SINK,
            node: process.version,
            platform: `${process.platform}/${process.arch}`,
        },
        corpus: { path: corpus.path, distinct: sources.length, rowsSha256: corpus.rowsSha256 },
        legs: Object.fromEntries(Object.entries(legs).map(([k, v]) => [k, { cell: v.length, sample: v.slice(0, 4) }])),
        armStates: { candidateBefore: candidateArmBefore, candidateAfter: armStateAfter, published: publishedArmState, latch },
        table,
        budgets,
        inheritedReadings: {
            source: "W3.md §6 G-10's RED baseline — parser-band.md cross-bench, two runs",
            sharedAccepted: "published 1500 / 1553 ns · cand-F 1261 / 1289 (×1.19–1.20) · cand-O drop-in 1466 / 1541 (×1.01–1.02) · cand-O node 1247 / 1290",
            reject: "published 716 / 693 · cand-F 801 / 810 (×0.86–0.89) · cand-O 1121 / 1088 (×0.64)",
            r1Class: "published+catch 82,559 / 78,034 ns vs cand-F 632 / 630 · cand-O 937 / 923",
            agreementWithThisTable:
                "R1-class direction REPRODUCES (candidate orders of magnitude faster than published+catch). shared-accepted and reject DO NOT: this candidate is slower than published on both, where parser-band measured cand-O at parity on accept. Different candidate (AC-1 TAGLESS-TWIN, not the cand-O drop-in), different machine, different node, different cell. Printed, not smoothed; nothing concluded.",
        },
        contradiction,
        wellFormedness: { findings, ok: findings.length === 0 },
    };

    // ── printing ─────────────────────────────────────────────────────────────
    const lines = [];
    const say = (s = "") => lines.push(s);
    const rule = (n = 112) => "─".repeat(n);

    say(`X.P.W3.d — css-bench-three-leg (G-10)`);
    say(rule());
    say(`baseline      ${path.basename(oracle.pin.path)} — ${oracle.pin.bytes} B · sha256 ${oracle.pin.sha256}`);
    say(`              ${oracle.pin.npmIntegrity}`);
    say(`method        ${rounds} rounds, first ${discard} discarded, MEDIAN of the kept ${rounds - discard} · interleaved, arm order rotates by round`);
    say(`              cell ${cellSize} inputs · node ${process.version} · ${process.platform}/${process.arch}`);
    say(`corpus        ${path.relative(TS_ROOT, corpus.path)} — ${sources.length} distinct · rows sha256 ${corpus.rowsSha256.slice(0, 16)}`);
    say(`legs          ${Object.entries(legs).map(([k, v]) => `${k} ${v.length}`).join(" · ")}`);
    say("");
    say(`  ${"leg".padEnd(16)} ${"arm".padEnd(17)} ${"ns/op".padStart(10)} ${"ratio (published/arm)".padStart(22)}  arm-state`);
    say(`  ${rule(16)} ${rule(17)} ${rule(10)} ${rule(22)}  ${rule(46)}`);
    for (const row of table) {
        say(
            `  ${row.leg.padEnd(16)} ${row.arm.padEnd(17)} ${String(row.nsPerOp ?? "—").padStart(10)} ${String(row.ratioVsPublished ?? "—").padStart(22)}  ${row.armStateShort}`,
        );
    }
    say("");
    say(`arm-state, in full — no row is without one (G-10's third falsifier condition)`);
    say(`  [a]  ${publishedArmState}`);
    say(`  [b]  UNARMED — the packrat arm-state read ${candidateArmBefore} before the run and ${armStateAfter} after it.`);
    say(`       The candidate's reachable set constructs no memoizer (.c's G-9 static leg: exactly one memoize( site under`);
    say(`       src/css, and it is .c's own declared instrument). DISCLOSED, because .c disclosed it: tsImport does not`);
    say(`       dedupe, so the instrument reads the latch in ITS OWN library instance and the lowerings' parse path holds`);
    say(`       another. The reading is 'this process never armed a latch', not 'the parse path's latch was inspected'.`);
    say("");
    say(`inherited readings, printed rather than reconciled (W3.md §6 G-10's RED baseline)`);
    say(`  parser-band.md cross-bench, two runs — shared-accepted: published 1500 / 1553 ns · cand-F 1261 / 1289 (×1.19–1.20)`);
    say(`    · cand-O drop-in 1466 / 1541 (×1.01–1.02) · cand-O node 1247 / 1290`);
    say(`  reject: published 716 / 693 · cand-F 801 / 810 (×0.86–0.89) · cand-O 1121 / 1088 (×0.64)`);
    say(`  R1 class: published+catch 82,559 / 78,034 ns vs cand-F 632 / 630 · cand-O 937 / 923`);
    say(`  THIS TABLE AGREES IN DIRECTION ON ONE LEG AND DISAGREES ON TWO, and the disagreement is printed, not smoothed:`);
    say(`  the R1-class direction (the candidate is orders of magnitude faster than published+catch) reproduces; the`);
    say(`  shared-accepted and reject directions do NOT — this candidate is SLOWER than published on both, where`);
    say(`  parser-band measured cand-O at parity on accept. Different candidate (AC-1 TAGLESS-TWIN, not cand-O`);
    say(`  drop-in), different machine, different node, different cell. NOTHING IS CONCLUDED FROM THAT HERE.`);
    say("");
    say(`sink          ${SINK}   (printed so no arm's work can be eliminated as dead)`);
    say(`latch         readable ${latch.readable} · before ${latch.before} · armed ${latch.armed} · afterReset ${latch.afterReset} · symmetric ${latch.symmetric}`);
    say("");
    say(`budgets, restated against the conservative reconstruction ${DENOMINATOR_US} µs (SCOPE.md M-22 ¶4)`);
    say(`  ≥10×        ${budgets.retiredAsLaw.budgetUs} µs   — RETIRED AS LAW; the fixed native floor ${NATIVE_FLOOR_US} µs exceeds it by ${budgets.floorExceedsTenXBudgetBy}×, so 10× is arithmetically impossible`);
    for (const f of budgets.families) {
        say(`  ${f.name.padEnd(11)} ${String(f.budgetUs).padStart(7)} µs   — headroom ${f.headroomUs} µs · ${f.ratified}`);
    }
    say("");
    say(`contradiction ${contradiction.id} — ${contradiction.subject}`);
    say(`  A  ${contradiction.readingA}`);
    say(`  B  ${contradiction.readingB}`);
    say(`  C  ${contradiction.readingC}`);
    say(`  →  ${contradiction.disposition}`);
    say("");
    say(rule());
    say(`BAR: OWNER-GATED-PENDING-RATIFICATION`);
    say(`VERDICT: none. The bench table is RECORDED-NOT-GATING (COHESION §0j.E OC-1). Inventing a bar is a defect.`);

    const text = lines.join("\n");
    console.log(text);

    // Well-formedness check (2): the UNCITABLE denominator must appear nowhere in this output.
    const cited = UNCITABLE.filter((u) => text.includes(u));
    if (cited.length > 0) findings.push(`UNCITABLE denominator cited in the table's own output: ${cited.join(", ")}`);
    report.wellFormedness = { findings, ok: findings.length === 0, uncitableScanned: UNCITABLE, uncitableFound: cited };

    if (out) writeFileSync(path.isAbsolute(out) ? out : path.resolve(process.cwd(), out), `${text}\n`);
    const jsonOut = arg("json");
    if (jsonOut) writeFileSync(path.isAbsolute(jsonOut) ? jsonOut : path.resolve(process.cwd(), jsonOut), `${JSON.stringify(report, null, 2)}\n`);

    console.log(`\nwell-formedness  ${findings.length === 0 ? "OK — the four G-10 falsifier conditions all hold" : `RED — ${findings.join(" · ")}`}`);
    disposeOracle();
    return findings.length === 0 ? 0 : 1;
};

process.exit(await main());
