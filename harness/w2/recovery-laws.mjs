// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — G-4: THE FIVE RECOVERY LAWS, EXECUTABLE (`ALGEBRA.md` §7).
//
//   node harness/w2/recovery-laws.mjs --candidate <id>
//   node harness/w2/recovery-laws.mjs --self-test     # every law's POSITIVE CONTROL, no subject
//
// Each law is a CHECKER over recorded data plus a POSITIVE CONTROL that must make the checker fire.
// §7 writes the controls into the contract itself ("a harness-side mutant skipping the `P`
// truncation must print `mismatches > 0` or the probe is decorative"), and `W2.md` §6 G-4 makes the
// rule general: "A probe that cannot fail for its intended reason is itself a defect."
//
// R-LAW-3 is the one law that is not a checker over data: diagnostic purity is a property of the
// RUN, so the probe monkey-patches `console.error`/`console.warn`/`console.log`/
// `process.stdout.write` to THROW and runs the whole corpus underneath. Its positive control is a
// function that prints — if the patched console does not catch that, the probe is decorative.

import { argv, corpus } from "./lib/contract.mjs";
import { loadCandidate } from "./lib/candidate.mjs";
import { header, table, kv, verdict, absent } from "./lib/report.mjs";
import { comp1, rollbackMismatches } from "./lib/serialize.mjs";

const a = argv();

/* ── R-LAW-3's instrument: an effect-free window around a body ─────────────────────────────── */

export function underSilence(body) {
    const saved = {
        error: console.error, warn: console.warn, log: console.log, info: console.info, debug: console.debug,
        stdout: process.stdout.write.bind(process.stdout), stderr: process.stderr.write.bind(process.stderr),
    };
    const boom = (chan) => (...args) => {
        throw new Error(`R-LAW-3 VIOLATION: the run wrote to ${chan}: ${String(args[0]).slice(0, 120)}`);
    };
    console.error = boom("console.error");
    console.warn = boom("console.warn");
    console.log = boom("console.log");
    console.info = boom("console.info");
    console.debug = boom("console.debug");
    process.stdout.write = boom("process.stdout.write");
    process.stderr.write = boom("process.stderr.write");
    try {
        body();
        return { printed: false, message: null };
    } catch (e) {
        const msg = String(e.message ?? e);
        if (msg.startsWith("R-LAW-3 VIOLATION")) return { printed: true, message: msg };
        return { printed: false, threw: msg };
    } finally {
        console.error = saved.error;
        console.warn = saved.warn;
        console.log = saved.log;
        console.info = saved.info;
        console.debug = saved.debug;
        process.stdout.write = saved.stdout;
        process.stderr.write = saved.stderr;
    }
}

/* ── the four data checkers ────────────────────────────────────────────────────────────────── */

/** R-LAW-1 — rollback exactness: the restored tuple equals the mark, coordinate by coordinate. */
export const rlaw1 = (marks) => rollbackMismatches(marks);

/** R-LAW-2 — complement conservation: COMP-1a/b/c over an `ok:false` product. */
export const rlaw2 = (src, product) => comp1(src, product.C, product.P).failures;

/** R-LAW-4 — non-amplification: N planted sites ⇒ exactly N issues; and progress (no re-entry). */
export function rlaw4(plantedSites, product) {
    const n = (product.D ?? []).length;
    const recoveries = (product.recoveries ?? []).length;
    const zeroWidth = (product.recoveries ?? []).filter((r) => (r.skipped?.[1] ?? 0) < 1);
    return {
        planted: plantedSites,
        issues: n,
        recoveries,
        amplified: plantedSites > 0 && n !== plantedSites,
        zeroWidthRecoveries: zeroWidth.length,
    };
}

/* ── the positive controls ─────────────────────────────────────────────────────────────────── */

function selfTest() {
    header("X.P.W2.g — recovery-laws --self-test (every law's positive control)");
    const marksGood = [{ site: "try@0", at: 0, mark: [0, 0, 0, 0, 0, 0], restored: [0, 0, 0, 0, 0, 0] }];
    const marksMutant = [{ site: "try@0", at: 0, mark: [0, 1, 2, 0, 0, 0], restored: [0, 1, 3, 0, 0, 0] }]; // P not truncated
    const okProduct = { C: [[1, 1, "ws"]], P: [[0, 1], [2, 3]], D: [], recoveries: [] };
    const mutantProduct = { C: [], P: [[0, 1], [2, 3]], D: [], recoveries: [] }; //  a skipped span never entered C
    const amplified = { D: [1, 2, 3, 4].map(() => ({ code: "css_syntax" })), recoveries: [{ skipped: [0, 3] }] };
    const zeroWidth = { D: [{ code: "css_syntax" }], recoveries: [{ at: 0, skipped: [0, 0] }] };

    const cases = [
        ["R-LAW-1 checker is silent on an exact rollback", rlaw1(marksGood).length === 0],
        ["R-LAW-1 control: a mutant that skips the P truncation prints mismatches > 0", rlaw1(marksMutant).length > 0],
        ["R-LAW-2 checker is silent on a complete tiling", rlaw2("a b", okProduct).length === 0],
        ["R-LAW-2 control: a mutant RECOVER that omits the C.skipped append fails COMP-1a", rlaw2("a b", mutantProduct).some((f) => f.law === "COMP-1a")],
        ["R-LAW-3 instrument catches a body that prints", underSilence(() => console.error("x")).printed === true],
        ["R-LAW-3 instrument is silent on a body that does not print", underSilence(() => 1 + 1).printed === false],
        ["R-LAW-4 control: 1 planted site with 4 issues reads amplified", rlaw4(1, amplified).amplified === true],
        ["R-LAW-4 control: a zero-width recovery is counted (progress)", rlaw4(1, zeroWidth).zeroWidthRecoveries === 1],
        ["R-LAW-4 checker is silent on N sites ⇒ N issues", rlaw4(1, { D: [{ code: "css_syntax" }], recoveries: [{ skipped: [0, 3] }] }).amplified === false],
    ];
    // R-LAW-5 is structural and lives in the bijection walk; its control is asserted there and
    // named here so the five laws are all visible in one place.
    table(["control", "fires"], cases.map(([n, ok]) => [n, ok ? "YES" : "NO"]));
    console.log("R-LAW-5 (recover-final-only) is STRUCTURAL: `op-bijection.mjs --structural` walks it and prints its negative control.");
    const bad = cases.filter(([, ok]) => !ok).map(([n]) => n);
    return verdict(bad.length === 0, bad.length === 0 ? `${cases.length} positive controls all fire — the four data checkers and the silence instrument can each fail for their intended reason` : bad.join(" | "));
}

/* ── the run against a candidate ──────────────────────────────────────────────────────────── */

async function run(id) {
    const c = await loadCandidate(id, a.at ?? null);
    header(`X.P.W2.g — recovery-laws --candidate ${id} (G-4)`);
    if (!c.present) {
        selfTest();
        console.log();
        return absent(`candidate ${id}`, c.reason);
    }
    const slice = corpus("slice.json");
    const rows = [];
    const red = [];
    for (const k of ["js", "wasm"]) {
        const L = c.lowerings[k];
        let sites = 0;
        let mismatches = 0;
        let comp1Failures = 0;
        let amplified = 0;
        let zeroWidth = 0;
        const silence = underSilence(() => {
            for (const row of slice.rows) {
                const p = L.parse(row.prod, row.src);
                sites += (p.marks ?? []).length;
                mismatches += rlaw1(p.marks ?? []).length;
                if (rlaw2(row.src, p).length) comp1Failures++;
                if (row.plantedSites !== undefined) {
                    const r = rlaw4(row.plantedSites, p);
                    if (r.amplified) amplified++;
                    zeroWidth += r.zeroWidthRecoveries;
                }
            }
        });
        rows.push([k, String(sites), String(mismatches), String(comp1Failures), String(amplified), String(zeroWidth), silence.printed ? "PRINTED" : silence.threw ? `THREW: ${silence.threw.slice(0, 32)}` : "silent"]);
        if (mismatches) red.push(`${k}: R-LAW-1 — ${mismatches} rollback coordinate mismatches`);
        if (comp1Failures) red.push(`${k}: R-LAW-2 — ${comp1Failures} rows fail COMP-1`);
        if (silence.printed) red.push(`${k}: R-LAW-3 — ${silence.message}`);
        if (silence.threw) red.push(`${k}: the run threw under the silence instrument — ${silence.threw}`);
        if (amplified) red.push(`${k}: R-LAW-4 — ${amplified} rows where N sites did not give N issues`);
        if (zeroWidth) red.push(`${k}: R-LAW-4 — ${zeroWidth} zero-width recoveries (a sync that consumes 0 bytes must fail the recovery)`);
    }
    table(["lowering", "TRY sites", "R-LAW-1 mismatches", "R-LAW-2 COMP-1 failures", "R-LAW-4 amplified", "R-LAW-4 zero-width", "R-LAW-3"], rows);
    console.log();
    kv([["R-LAW-5", "structural — see `op-bijection.mjs --structural` (recover-final-only, printed with its negative control)"]]);
    return verdict(red.length === 0, red.length === 0 ? "five laws green on both lowerings" : red.join(" | "));
}

const code = a.flags.has("self-test") ? selfTest() : a.candidate ? await run(a.candidate) : (console.log("usage: recovery-laws.mjs --candidate <id> | --self-test"), 2);
process.exit(code);
