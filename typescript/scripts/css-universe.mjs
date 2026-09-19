// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.a — G-1: UNIVERSE-52-TOTAL. The generator of the 52-row conformance matrix.
//
//   node typescript/scripts/css-universe.mjs --check --pinned-value-commit <sha>
//   node typescript/scripts/css-universe.mjs --pinned-value-commit <sha> --emit <path.json>
//   node typescript/scripts/css-universe.mjs --cross-check-ledger docs/tranches/X/parse-that/DIVERGENCE-LEDGER.md
//
// `W3.md` §6 G-1: "All 52 frozen `/css` exports verdict **TOTAL** in the generated matrix: 19
// runtime by name **and** shape, 33 types by bidirectional assignability." The command "emits the
// matrix and exits non-zero while any row is not TOTAL".
//
// FOUR LAWS THIS PROGRAM IS BUILT AROUND, each from the gate's own falsifier (`W3.md` §6 G-1,
// §11 guardrails 2 and 4):
//
//   1. THE UNIVERSE IS GENERATED, NEVER TRANSCRIBED. The 52 names are read out of
//      `src/css/index.ts` AT A PINNED COMMIT (`git show <sha>:…`), so the universe cannot be
//      quietly narrowed to what the candidate happens to cover, and a dirty working tree or a
//      sibling track's commit cannot move it under a running gate. "Deleting any export from the
//      manifest without a corresponding frozen-surface change also fails."
//   2. A ROW CANNOT BE TOTAL WITHOUT AN EXECUTED ASSERTION AND A NON-EMPTY CORPUS. `cellsRun` and
//      the two corpus counts are part of the verdict. "Counting a PARTIAL as TOTAL is the specific
//      dishonesty this gate exists to prevent — the legend is asserted mechanically, not applied by
//      judgement."
//   3. THE ORACLE IS THE PUBLISHED sha-PINNED 4.0.0 TARBALL, NEVER A SELF-AUTHORED ANSWER KEY, and
//      where `parser-band.md` adjudicates against it the adjudication wins AND IS ROWED — never a
//      silent pick. `--cross-check-ledger` is the other half of that family: it fails if `.d`'s
//      `DIVERGENCE-LEDGER.md` does not carry every conflict this program resolved.
//   4. NO PROOF-FARM SCRIPT (`W3.md` §7, L-19; the retired `proof:*` idiom). This program does not
//      grep for an invariant: it executes a corpus and compiles a program, and its OUTPUT is the
//      evidence.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { P2_ROOT, VALUE_JS_ROOT, sha256 } from "../test/css-totality/lib/pin.mjs";
import { ADJUDICATIONS } from "../test/css-totality/lib/adjudications.mjs";
import { ABSENT, PARTIAL, TOTAL } from "../test/css-totality/lib/matrix.mjs";
import { CORPUS_JSON, assemble } from "../test/css-totality/lib/universe.mjs";

// ── arguments ───────────────────────────────────────────────────────────────

const argv = () => {
    const flags = new Set();
    const values = {};
    for (const raw of process.argv.slice(2)) {
        const eq = raw.indexOf("=");
        if (raw.startsWith("--") && eq > 0) values[raw.slice(2, eq)] = raw.slice(eq + 1);
        else if (raw.startsWith("--")) flags.add(raw.slice(2));
        else if (flags.size > 0) {
            const last = [...flags].pop();
            flags.delete(last);
            values[last] = raw;
        }
    }
    return { flags, values };
};

const a = argv();
const want = (name) => a.values[name] ?? null;
const has = (name) => a.flags.has(name) || a.values[name] !== undefined;

// ── report helpers ──────────────────────────────────────────────────────────

const pad = (s, n) => String(s).padEnd(n);
const rule = (n = 100) => "─".repeat(n);

const table = (headers, rows) => {
    const widths = headers.map((h, i) =>
        Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)),
    );
    console.log(headers.map((h, i) => pad(h, widths[i])).join("  "));
    console.log(widths.map((w) => "─".repeat(w)).join("  "));
    for (const row of rows) console.log(row.map((c, i) => pad(c ?? "", widths[i])).join("  "));
};

// ── the cross-check-ledger leg (G-7's second command, this program's flag) ──

const crossCheckLedger = (ledgerPath) => {
    const abs = path.isAbsolute(ledgerPath) ? ledgerPath : path.join(VALUE_JS_ROOT, ledgerPath);
    console.log(`X.P.W3.a — css-universe --cross-check-ledger\n${rule()}`);
    console.log(`ledger   ${abs}`);
    if (!existsSync(abs)) {
        console.log(
            `\nRED — the ledger is ABSENT. ${ADJUDICATIONS.length} adjudicated conflicts were resolved by ` +
                `\`.a\` and every one of them must be a row: W3.md §6 G-7 treats an unrowed intentional ` +
                `difference exactly as it treats a defect.`,
        );
        for (const row of ADJUDICATIONS) console.log(`  UNROWED  ${row.id}  ${row.title}`);
        return 1;
    }
    const text = readFileSync(abs, "utf8");
    const missing = [];
    for (const row of ADJUDICATIONS) {
        const byId = text.includes(row.id);
        const unrowedInputs = row.inputs.filter((input) => !text.includes(input));
        if (!byId || unrowedInputs.length > 0) missing.push({ row, byId, unrowedInputs });
    }
    console.log(`rows     ${ADJUDICATIONS.length} adjudicated conflicts, ${missing.length} not carried`);
    for (const m of missing) {
        console.log(
            `  UNROWED  ${m.row.id}  ${m.byId ? "id present" : "id ABSENT"}  inputs missing: ${m.unrowedInputs.map((i) => JSON.stringify(i)).join(" ") || "none"}`,
        );
    }
    console.log(missing.length === 0 ? "\nGREEN — every adjudicated conflict is rowed." : "\nRED — see above.");
    return missing.length === 0 ? 0 : 1;
};

// ── main ────────────────────────────────────────────────────────────────────

const main = async () => {
    if (has("cross-check-ledger")) return crossCheckLedger(want("cross-check-ledger"));

    const commit = want("pinned-value-commit");
    if (!commit) {
        console.error(
            "css-universe: --pinned-value-commit <sha> is REQUIRED. The universe is read at a pinned\n" +
                "commit, never from a working tree — there is no default, on purpose.",
        );
        return 2;
    }

    const {
        pin,
        candidate,
        corpus,
        declaredTypes: candidateTypeNames,
        generated,
        assignability,
        matrix,
        agreementClean,
    } = await assemble({
        commit,
        adapterPath: want("candidate-adapter") ?? undefined,
        runTsc: !has("no-tsc"),
    });

    console.log(`X.P.W3.a — css-universe (G-1: UNIVERSE-52-TOTAL)\n${rule()}`);
    console.log(`pin        ${pin.commit}`);
    console.log(`  index    ${pin.sources.index.path} — ${pin.sources.index.bytes} B, sha256 ${pin.sources.index.sha256.slice(0, 16)}`);
    console.log(`  types    ${pin.sources.types.path} — ${pin.sources.types.bytes} B, sha256 ${pin.sources.types.sha256.slice(0, 16)}`);
    console.log(`  oracle   ${path.relative(VALUE_JS_ROOT, pin.sources.publishedJs.path)} — sha256 ${pin.sources.publishedJs.sha256.slice(0, 16)}`);
    console.log(`  frozen   ${path.relative(VALUE_JS_ROOT, pin.sources.publishedDts.path)} — sha256 ${pin.sources.publishedDts.sha256.slice(0, 16)}`);
    console.log(`universe   ${pin.counts.runtime} runtime + ${pin.counts.types} types = ${pin.counts.total}`);
    console.log(`candidate  ${candidate.id} — entry ${candidate.entry ? path.relative(P2_ROOT, candidate.entry) : "ABSENT"} · dts ${candidate.dts ? path.relative(P2_ROOT, candidate.dts) : "ABSENT"}`);

    // The universe's own arithmetic, asserted rather than assumed.
    const universeOk = pin.counts.total === 52 && pin.counts.runtime === 19 && pin.counts.types === 33;
    if (!universeOk) {
        console.log(
            `\nFROZEN-SURFACE CHANGE: the pinned barrel reads ${pin.counts.runtime} runtime + ` +
                `${pin.counts.types} types = ${pin.counts.total}, not 19 + 33 = 52. This is a contract ` +
                `change, not a gate failure — it halts to X·V and the owner (W3.md §3a).`,
        );
    }

    // The pin-agreement proof: may the published declaration stand in for the pinned type source?
    const ag = pin.agreement;
    console.log(
        `\npin agreement (the frozen declaration vs the pinned src/css/types.ts, one extractor)\n` +
            `  type names     barrel−published ${ag.typeNames.barrelMinusPublished.length ? ag.typeNames.barrelMinusPublished.join(", ") : "∅"} · published−barrel ${ag.typeNames.publishedMinusBarrel.length ? ag.typeNames.publishedMinusBarrel.join(", ") : "∅"}\n` +
            `  runtime names  barrel−published ${ag.runtimeNames.barrelMinusPublished.length ? ag.runtimeNames.barrelMinusPublished.join(", ") : "∅"} · published−barrel ${ag.runtimeNames.publishedMinusBarrel.length ? ag.runtimeNames.publishedMinusBarrel.join(", ") : "∅"}\n` +
            `  member/literal disagreements ${ag.disagreements.length}${ag.disagreements.map((d) => `\n    ${d.name} — ${d.why}`).join("")}`,
    );

    // The corpus, folded as a union and written where G-4 names it (by `assemble`).
    console.log(`\ncorpus (W3.md §5 .a — the six arms, folded as a UNION)`);
    table(
        ["arm", "declared", "read", "provenance"],
        corpus.arms.map((arm) => [
            arm.id,
            arm.declared,
            arm.read,
            arm.provenance.replace(`${VALUE_JS_ROOT}/`, "").replace(`${P2_ROOT}/`, "").slice(0, 96),
        ]),
    );
    console.log(
        `  arm total ${corpus.counts.armTotal} · UNION ${corpus.counts.union} · overlap ${corpus.counts.overlap} · ` +
            `declared non-string boundary ${corpus.counts.boundary}\n  written to ${path.relative(P2_ROOT, CORPUS_JSON)} — rows sha256 ${corpus.rowsSha256.slice(0, 16)}`,
    );

    // The 33 type rows: one generated program, one compile (run by `assemble`).
    if (!generated) {
        console.log(`\nassignability  SKIPPED (--no-tsc); the 33 type rows report PARTIAL "compile not run"`);
    } else {
        console.log(
            `\nassignability  one compile, 33 types × 2 directions\n` +
                `  program      ${path.relative(P2_ROOT, generated.program.path)} — ${generated.program.bytes} B, sha256 ${generated.program.sha256.slice(0, 16)}\n` +
                `  frozen copy  ${path.relative(P2_ROOT, generated.frozenCopy.path)} — sha256 ${generated.frozenCopy.sha256.slice(0, 16)}\n` +
                `  candidate    import type * as Candidate from "${generated.candidateSpecifier}"\n` +
                `  tsc exit     ${assignability.exitCode} · diagnostics attributed ${Object.values(assignability.rows).reduce((n, r) => n + r.errors.length, 0)} · unattributed ${assignability.unattributed.length}`,
        );
        for (const u of assignability.unattributed.slice(0, 6)) {
            console.log(`    UNATTRIBUTED ${u.file}(${u.line}) ${u.code}: ${u.message.slice(0, 96)}`);
        }
        if (assignability.failedSilently) {
            console.log(
                `\n  **RED — THE COMPILE TOOK NO READING**: tsc exited ${assignability.exitCode} and printed no\n` +
                    `  diagnostic, so the 33 type rows below rest on nothing. This is the instrument failing, not\n` +
                    `  the candidate; re-run before reading any type verdict.\n` +
                    `${assignability.stdout.trim().split("\n").slice(0, 6).map((l) => `    ${l}`).join("\n")}`,
            );
        }
    }

    console.log(`\nTHE 52-ROW MATRIX\n${rule()}`);
    table(
        ["#", "export", "kind", "arity", "family", "accept", "reject", "cells", "verdict", "missing"],
        matrix.rows.map((row, i) => [
            i + 1,
            row.name,
            row.kind,
            row.arity ?? "—",
            row.family,
            row.accept.count,
            row.reject.count,
            row.cellsRun,
            row.verdict,
            row.missing.join(" · ").slice(0, 78),
        ]),
    );

    console.log(
        `\ntally  runtime ${matrix.runtimeTally.TOTAL} TOTAL / ${matrix.runtimeTally.PARTIAL} PARTIAL / ${matrix.runtimeTally.ABSENT} ABSENT` +
            ` · types ${matrix.typeTally.TOTAL} / ${matrix.typeTally.PARTIAL} / ${matrix.typeTally.ABSENT}` +
            ` · ALL ${matrix.aggregate.TOTAL} of ${matrix.rows.length} TOTAL`,
    );

    console.log(`\nadjudicated conflicts (W3.md §5 .a — each is a \`.d\` DIVERGENCE-LEDGER row, never a silent pick)`);
    table(
        ["id", "G-6", "input", "incumbent", "candidate", "adjudication wants", "honoured"],
        matrix.declaredObservations.map((o) => [
            o.id,
            o.g6 ?? "—",
            JSON.stringify(o.input).slice(0, 26),
            o.incumbent.threw ? "THREW" : o.incumbent.ok ? `ok ${JSON.stringify(o.incumbent.value).slice(0, 34)}` : `reject ${o.incumbent.code}`,
            o.candidate.absent ? "ABSENT" : o.candidate.threw ? "THREW" : o.candidate.ok ? `ok ${JSON.stringify(o.candidate.value).slice(0, 34)}` : `reject ${o.candidate.code}`,
            o.expected,
            o.honoured === null ? "—" : o.honoured ? "YES" : "NO",
        ]),
    );
    // ── the class predicates' census (COHESION §0s E-h2) ───────────────────────────────────────
    // "each printing its own census asserted ≤ the ruling's measured population, so a predicate
    // that swallows an un-ruled input is itself a defect". The census is the cells a class
    // GOVERNED, per entry; the population is the pinned match count over the pinned union corpus.
    // Both are printed, and the widest census is checked against the pin below.
    console.log(`\nadjudication CLASS predicates (E-h2 — one per ruling id; census ≤ the ruling's measured population)`);
    const censusRows = matrix.classPopulations.map((klass) => {
        const perEntry = Object.entries(matrix.classCensus)
            .map(([entry, counts]) => [entry, counts[klass.id] ?? 0])
            .filter(([, n]) => n > 0)
            .sort((a, b) => b[1] - a[1]);
        const widest = perEntry.length > 0 ? perEntry[0][1] : 0;
        return { ...klass, perEntry, widest, within: widest <= klass.pinned };
    });
    table(
        ["ruling", "population (pinned)", "population (measured)", "census — widest entry", "≤ pin", "governed, by entry"],
        censusRows.map((r) => [
            r.id,
            r.pinned,
            `${r.measured}${r.agrees ? "" : "  DRIFTED"}`,
            r.widest,
            r.within ? "YES" : "**NO**",
            r.perEntry.map(([entry, n]) => `${entry} ${n}`).join(" · ").slice(0, 78),
        ]),
    );
    const overReaching = censusRows.filter((r) => !r.within);
    const drifted = censusRows.filter((r) => !r.agrees);
    console.log(
        `  ${censusRows.length} class predicates · ${censusRows.reduce((n, r) => n + r.widest, 0)} cells governed at the widest entry · ` +
            `${overReaching.length} census OVER its pinned population · ${drifted.length} population drifted from its pin`,
    );
    for (const r of overReaching)
        console.log(`  OVER-REACHING  ${r.id} — census ${r.widest} > pinned population ${r.pinned}: the predicate swallows an un-ruled input (E-h2)`);
    for (const r of drifted)
        console.log(`  DRIFTED        ${r.id} — pinned ${r.pinned}, measured ${r.measured} over the pinned corpus: the predicate moved, or the corpus did`);

    // ── the honest remainder, by id (G-1's own alternative to 52/52) ───────────────────────────
    const partialRows = matrix.rows.filter((row) => row.verdict === PARTIAL && row.kind === "runtime");
    if (partialRows.length > 0) {
        console.log(`\nthe honest remainder, BY ID (W3.md §6 G-1 — "52/52 or the honest remainder, by id")`);
        table(
            ["export", "misses", "remainder, by id"],
            partialRows.map((row) => [
                row.name,
                row.missesTotal ?? 0,
                Object.entries(row.remainder ?? {})
                    .map(([id, n]) => `${n}× ${id}`)
                    .join(" · ")
                    .slice(0, 110),
            ]),
        );
    }

    const unhonoured = matrix.declaredObservations.filter((o) => o.honoured === false);
    console.log(
        `  ${ADJUDICATIONS.length} adjudications · ${matrix.declaredObservations.length} witnessed inputs · ` +
            `${matrix.declaredObservations.filter((o) => o.divergesFromIncumbent).length} diverge from the incumbent · ` +
            `${unhonoured.length} NOT honoured by the candidate`,
    );

    const emit = want("emit");
    if (emit) {
        const abs = path.isAbsolute(emit) ? emit : path.join(P2_ROOT, emit);
        const document = {
            schema: "x-p-w3.a.universe-52/1",
            note:
                "GENERATED by typescript/scripts/css-universe.mjs at the pinned value.js commit. `accept` and " +
                "`reject` are the MEASURED sets, published as count + sample because the union corpus is " +
                "26k+ rows; the assertions run over the full sets, and the sets are reproducible from " +
                "typescript/test/css-totality/corpus.json plus the sha-pinned published oracle. Never hand-edited.",
            generatedBy: "typescript/scripts/css-universe.mjs",
            pin: { commit: pin.commit, sources: pin.sources, counts: pin.counts },
            agreement: { clean: agreementClean, ...ag },
            candidate: { id: candidate.id, adapter: path.relative(P2_ROOT, candidate.adapter), entry: candidate.entry && path.relative(P2_ROOT, candidate.entry), dts: candidate.dts && path.relative(P2_ROOT, candidate.dts), declaredTypeNames: candidateTypeNames },
            corpus: { arms: corpus.arms, counts: corpus.counts, rowsSha256: corpus.rowsSha256, path: path.relative(P2_ROOT, CORPUS_JSON) },
            assignability: generated
                ? {
                      program: path.relative(P2_ROOT, generated.program.path),
                      programSha256: generated.program.sha256,
                      frozenCopySha256: generated.frozenCopy.sha256,
                      tsconfig: path.relative(P2_ROOT, generated.tsconfig.path),
                      tscExitCode: assignability.exitCode,
                      unattributed: assignability.unattributed,
                  }
                : { skipped: true },
            frozenCodes: matrix.codes,
            syntaxVocabulary: matrix.vocabulary,
            adjudications: ADJUDICATIONS,
            classPredicates: matrix.classPopulations,
            classCensus: matrix.classCensus,
            declaredObservations: matrix.declaredObservations,
            tally: { runtime: matrix.runtimeTally, types: matrix.typeTally, all: matrix.aggregate },
            rows: matrix.rows,
        };
        const text = `${JSON.stringify(document, null, 4)}\n`;
        writeFileSync(abs, text);
        console.log(`\nemitted  ${abs} — ${Buffer.byteLength(text)} B, sha256 ${sha256(text)}`);
    }

    if (!has("check")) return 0;

    const notTotal = matrix.rows.filter((row) => row.verdict !== TOTAL);
    console.log(`\n${rule()}`);
    if (overReaching.length > 0 || drifted.length > 0) {
        console.log(
            `RED — ${overReaching.length} class predicate(s) governed more cells than the ruling's pinned population and ` +
                `${drifted.length} predicate population(s) drifted from their pin. E-h2: "a predicate that swallows an ` +
                `un-ruled input is itself a defect". This check runs BEFORE the row tally, because a matrix read through ` +
                `an over-reaching predicate is not a matrix.`,
        );
        return 1;
    }
    if (notTotal.length === 0 && agreementClean && universeOk) {
        console.log(`GREEN — all ${matrix.rows.length} frozen exports verdict TOTAL.`);
        return 0;
    }
    console.log(
        `RED — ${notTotal.length} of ${matrix.rows.length} rows are not TOTAL ` +
            `(${matrix.rows.filter((r) => r.verdict === PARTIAL).length} PARTIAL, ` +
            `${matrix.rows.filter((r) => r.verdict === ABSENT).length} ABSENT).`,
    );
    return 1;
};

process.exit(await main());
