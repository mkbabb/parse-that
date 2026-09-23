// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — G-1 (structural half) and G-2 (the bijection), and G-12's re-run at the graduated
// location.
//
//   node harness/w2/op-bijection.mjs --structural
//   node harness/w2/op-bijection.mjs --candidate <id> [--at typescript/src/css]
//
// THE GATE IS THE PAIRING, NOT THE COUNT (`W2.md` §6 G-2): "a bijection that is '18 of 20' passes a
// naive count check and fails this gate". So this probe compares REGISTRIES — length, order,
// fingerprint pairwise, both symbols present — and prints the full mapping. The v12 shape (N ids
// over an M-formula domain with the last rows misbound) fails condition (iii) even when (i) passes,
// and the printed table names the row.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
    argv, contractHomes, contractOperators, contractStatedCount, contractText, fingerprint,
    P2_ROOT,
} from "./lib/contract.mjs";
import { loadCandidate, candidateSurvey } from "./lib/candidate.mjs";
import { header, table, kv, verdict, absent } from "./lib/report.mjs";
import { NEGATIVE_CONTROL_GRAMMAR, recoverInNonFinalAlt, structuralReport } from "./lib/term.mjs";

const a = argv();

/** The G-1 pattern, quoted from `W2.md` §6 L686, applied in-process over a file's bytes. */
const TARGET_CONDITIONAL = /isWasm|target\s*===|TARGET_JS|TARGET_WASM/;

function resolveSrc(p) {
    return path.isAbsolute(p) ? p : path.join(P2_ROOT, p);
}

function importsOf(file) {
    const src = readFileSync(file, "utf8");
    return [...src.matchAll(/(?:^|\n)\s*(?:import|export)[\s\S]*?from\s+["']([^"']+)["']/g)].map((m) => m[1]);
}

/* ── --structural : G-1's half that is not the sha256 equality ─────────────────────────────── */

async function structural() {
    const homes = contractHomes();
    const ops = contractOperators();
    const stated = contractStatedCount();
    let red = [];

    header("X.P.W2.g — op-bijection --structural (G-1)");
    table(
        ["home", "present", "bytes", "sha256"],
        homes.homes.map((h) => [h.label, h.present ? "yes" : "NO", h.bytes, h.sha256 ?? "-"]),
    );
    console.log(homes.equal ? "homes sha256-equal: YES" : "homes sha256-equal: NO");
    if (!homes.equal) red.push("the two ALGEBRA.md homes are not sha256-equal");

    kv([
        ["operators enumerated (registry block)", String(ops.length)],
        ["count stated in prose (§4.1)", String(stated)],
        ["enumeration == stated count", String(ops.length === stated)],
    ]);
    if (ops.length !== stated) red.push(`the registry block holds ${ops.length} rows and the prose states ${stated}`);

    // The contract's own text must carry no target-conditional (the G-1 grep ranges over it).
    const contractHits = TARGET_CONDITIONAL.test(contractText().replace(/isWasm|TARGET_JS|TARGET_WASM/g, (m) => m)) &&
        [...contractText().matchAll(new RegExp(TARGET_CONDITIONAL.source, "g"))].length;
    console.log(`target-conditional tokens in the contract text: ${contractHits || 0}`);
    if (contractHits) red.push("the contract text carries a target-conditional token");

    // The checker must be able to fire: the negative control is walked every run.
    const control = recoverInNonFinalAlt(NEGATIVE_CONTROL_GRAMMAR);
    console.log(`RECOVER-in-nonfinal-ALT (negative control ALT[RECOVER(a), b]): ${control.length}`);
    if (control.length !== 1) red.push("the R-LAW-5 checker did not fire on its own negative control — the probe is decorative");

    const survey = candidateSurvey();
    const rows = [];
    for (const s of survey) {
        const c = await loadCandidate(s.id);
        if (!c.present) {
            rows.push([s.id, s.home, "ABSENT", c.reason.slice(0, 64), "-", "-", "-", "-", "-"]);
            continue;
        }
        const perLowering = [];
        for (const k of ["js", "wasm"]) {
            const g = c.lowerings[k].grammar();
            const r = structuralReport(g, contractOperators());
            perLowering.push({ k, r });
        }
        const src = c.meta.sources ?? {};
        const algebra = (src.algebra ?? []).map(resolveSrc).filter(existsSync);
        const lowered = new Set([...(src.js ?? []), ...(src.wasm ?? [])].map(resolveSrc));
        const leaks = [];
        let condHits = 0;
        for (const f of [...algebra, ...lowered].filter(existsSync)) {
            const bytes = readFileSync(f, "utf8");
            condHits += [...bytes.matchAll(new RegExp(TARGET_CONDITIONAL.source, "g"))].length;
        }
        for (const f of algebra) {
            for (const spec of importsOf(f)) {
                const abs = spec.startsWith(".") ? path.resolve(path.dirname(f), spec) : spec;
                for (const l of lowered) if (l === abs || l.startsWith(abs)) leaks.push(`${path.basename(f)} → ${spec}`);
            }
        }
        for (const { k, r } of perLowering) {
            rows.push([
                s.id, `${s.home}/${k}`, "present",
                `${r.terms} terms`,
                String(r.opsOutsideContract.length),
                String(r.recoverInNonFinalAlt.length),
                String(r.cutOutsideAlt.length),
                String(r.unownedSpans.length),
                String(r.closureLeaks.length),
            ]);
            if (r.opsOutsideContract.length) red.push(`${s.id}/${k}: ops outside the ratified 22 — ${r.opsOutsideContract.join(", ")}`);
            if (r.recoverInNonFinalAlt.length) red.push(`${s.id}/${k}: RECOVER in a non-final ALT arm (R-LAW-5)`);
            if (r.cutOutsideAlt.length) red.push(`${s.id}/${k}: CUT outside an ALT arm's scope (§5.2)`);
            if (r.unownedSpans.length) red.push(`${s.id}/${k}: an unowned Span term (INV-OWN §2.4)`);
            if (r.closureLeaks.length) red.push(`${s.id}/${k}: a host function/class/getter under a term (CL-1)`);
        }
        if (condHits) red.push(`${s.id}: ${condHits} target-conditional token(s) in declared sources (K-2)`);
        if (leaks.length) red.push(`${s.id}: the algebra imports a lowering — ${leaks.join(" · ")}`);
    }
    console.log();
    table(
        ["id", "subject", "state", "detail", "ops∉22", "recover≺alt", "cut∉alt", "unowned-span", "closure-leak"],
        rows,
    );

    const present = survey.filter((s) => s.adapterPresent).length;
    console.log();
    if (present === 0) {
        console.log("SUBJECT ABSENT — 0 of 4 candidates present: the per-candidate structural walk has no subject.");
        console.log("This run reads the CONTRACT HALF of G-1 only; the structural half turns when a candidate lands.");
    }
    return verdict(
        red.length === 0 && homes.equal,
        red.length === 0
            ? `contract half: ${ops.length} operators enumerated, both homes sha256-equal, the R-LAW-5 checker fires on its own control; candidates present ${present} of 4`
            : red.join(" | "),
    );
}

/* ── --candidate : G-2, registries compared, printed before any timing ─────────────────────── */

async function bijection(id) {
    const ops = contractOperators();
    const c = await loadCandidate(id, a.at ?? null);
    header(`X.P.W2.g — op-bijection --candidate ${id}${a.at ? ` --at ${a.at}` : ""} (G-2)`);
    if (!c.present) {
        console.log(`contract rows: ${ops.length}`);
        return absent(`candidate ${id}`, c.reason);
    }

    const reg = { js: c.lowerings.js.registry(), wasm: c.lowerings.wasm.registry() };
    const rows = [];
    const red = [];
    const n = Math.max(ops.length, reg.js.length, reg.wasm.length);
    for (let i = 0; i < n; i++) {
        const k = ops[i];
        const j = reg.js[i];
        const w = reg.wasm[i];
        const jf = j ? fingerprint(j) : null;
        const wf = w ? fingerprint(w) : null;
        const pair =
            !k ? "EXTRA-ROW" :
            !j || !w ? "MISSING-LOWERING" :
            j.opId !== k.opId || w.opId !== k.opId ? "MISBOUND" :
            jf !== k.fingerprint || wf !== k.fingerprint ? "FINGERPRINT" :
            !j.symbol || !w.symbol ? "NO-SYMBOL" :
            "ok";
        if (pair !== "ok") red.push(`${k?.opId ?? `row ${i}`}: ${pair}`);
        rows.push([
            k?.opId ?? "-", k?.name ?? "-",
            j ? `${j.opId} ${j.name}` : "ABSENT", j?.symbol ?? "-",
            w ? `${w.opId} ${w.name}` : "ABSENT", w?.symbol ?? "-",
            pair,
        ]);
    }
    table(["contract", "name", "js row", "jsSymbol", "wasm row", "wasmSymbol", "pairing"], rows);
    kv([
        ["contract rows", String(ops.length)],
        ["js rows", String(reg.js.length)],
        ["wasm rows", String(reg.wasm.length)],
        ["DECLARED-ABSENT wasm symbols", String(reg.wasm.filter((r) => r.symbol === "DECLARED-ABSENT").length)],
    ]);
    return verdict(red.length === 0, red.length === 0 ? `${ops.length} rows, both lowerings, fingerprints pairwise equal` : red.join(" | "));
}

const code = a.flags.has("structural") ? await structural() : a.candidate ? await bijection(a.candidate) : (console.log("usage: op-bijection.mjs --structural | --candidate <id> [--at <path>]"), 2);
process.exit(code);
