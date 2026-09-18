#!/usr/bin/env node
// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — THE GRADUATED DIFFERENTIAL, RUN. G-7's first command's engine.
//
//   node test/css-equivalence/run-full-surface.mjs --pinned-value-commit <sha> [--out <path>] [--limit <n>]
//
// `W3.md` §8 names the artifact this writes: `evidence/W3/equivalence-full-surface.json` — "52-export
// differential results against the vendored tarball, with the tarball's sha256 recorded inline."
//
// It prints the reading and EXITS NON-ZERO while any mirror-defect stands or any adjudicated
// conflict is unrowed, because G-7's falsifier treats an unrowed intentional difference exactly as
// it treats a defect. It asserts NO bar of any other kind: the bench bar is OWNER-GATED (§0j.E
// OC-1) and is not this program's business.
//
// This lives under `test/css-equivalence/**` — this unit's own create row — rather than under
// `scripts/`, because `W3.md` §4 admits exactly two new scripts to this seat (`css-dual-target-
// identity.mjs`, `css-bench-three-leg.mjs`) and a third would be a file-bound expansion (§3a).

import { writeFileSync } from "node:fs";
import path from "node:path";

import { readPin } from "../css-totality/lib/pin.mjs";
import { ADJUDICATIONS } from "../css-totality/lib/adjudications.mjs";
import { loadPublicSurfaces, UNREALIZED_ENTRIES } from "../../src/css/entry.mjs";
import { disposeOracle, crossCheckUnpacked, loadOracle } from "./lib/oracle.mjs";
import { runFullSurface, RED_TRIGGERS } from "./lib/differential.mjs";
import { DISSENTS, FIXTURES, LABEL_ROW, directionAudit, fixtureAnchorsPresent, narrowingRows } from "./lib/ledger.mjs";

const UNPACKED_400 =
    "/Users/mkbabb/Programming/value.js/docs/tranches/V/megatranche/prototypes/css-parser/cand-o/vendor/value-js-4.0.0";

const arg = (name, fallback = null) => {
    const i = process.argv.indexOf(`--${name}`);
    if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
    const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
    return eq ? eq.slice(name.length + 3) : fallback;
};

const main = async () => {
    const commit = arg("pinned-value-commit");
    if (!commit) {
        console.error("run-full-surface: --pinned-value-commit <sha> is REQUIRED — the universe is read at a pin, never from a working tree.");
        return 2;
    }
    const limit = arg("limit") ? Number(arg("limit")) : null;

    const pin = await readPin(commit);
    const surfaces = await loadPublicSurfaces();
    const oracle = await loadOracle();
    const candidateTypeNames = ["CssColor", "CssTimingFunction", "Stylesheet", "StyleRule", "Declaration"];

    const result = await runFullSurface({
        universe: pin.universe,
        surfaces,
        unrealizedEntries: [...UNREALIZED_ENTRIES],
        candidateTypeNames,
        limit,
    });

    const realizedEntries = surfaces.js.entries();
    const ledgerRows = [
        ...ADJUDICATIONS.map((r) => ({ id: r.id, family: "ADJUDICATED", consumerDirection: r.consumerDirection })),
        ...DISSENTS.map((r) => ({ id: r.id, family: "DISSENT", consumerDirection: r.consumerDirection })),
        ...FIXTURES.map((r) => ({ id: r.id, family: "FIXTURE", consumerDirection: r.consumerDirection })),
        { id: LABEL_ROW.id, family: "LABEL", consumerDirection: LABEL_ROW.consumerDirection },
        ...narrowingRows({
            runtimeUniverse: pin.universe.runtime,
            typeUniverse: pin.universe.types,
            realizedEntries,
            realizedTypes: candidateTypeNames,
        }).map((r) => ({ id: r.id, family: "NARROWING", consumerDirection: r.consumerDirection })),
    ];

    const emptyDirections = directionAudit(ledgerRows);
    const anchors = fixtureAnchorsPresent();
    const crossCheck = crossCheckUnpacked(oracle, UNPACKED_400);

    const report = {
        schema: "x-p-w3-d/equivalence-full-surface@1",
        note:
            "X.P.W3.d — the P-1 differential harness GRADUATED from the 403-string pilot to the full 52-export " +
            "surface, against the vendored sha-pinned published 4.0.0 tarball (never dist/). The MIRROR-DEFECT " +
            "taxonomy is the authority's own, re-read and asserted byte-for-byte before any cell was classified.",
        generatedBy: "typescript/test/css-equivalence/run-full-surface.mjs",
        pin: {
            commit: pin.commit,
            index: pin.sources.index,
            types: pin.sources.types,
        },
        oracle: result.oracle,
        oracleCrossCheckAgainstUnpackedTree: { dir: UNPACKED_400, ...crossCheck },
        taxonomy: result.taxonomy,
        specReadingConvention:
            "Where the taxonomy's spec half is missing and no parser-band adjudication covers the input, the cell " +
            "is counted AGAINST the candidate (MIS_ACCEPT / FALSE_REJECT_IN_SHAPE) and flagged specUndecided. The " +
            "opposite convention would drive the count toward zero on an argument nobody measured.",
        shape: result.shape,
        corpus: result.corpus,
        universe: result.universe,
        ledger: {
            rows: ledgerRows.length,
            byFamily: ledgerRows.reduce((acc, r) => ({ ...acc, [r.family]: (acc[r.family] ?? 0) + 1 }), {}),
            emptyConsumerDirections: emptyDirections,
            fixtureAnchorsPresent: anchors,
        },
        tally: result.tally,
        redTriggers: RED_TRIGGERS,
        rows: result.rows,
    };

    const out = arg("out");
    if (out) {
        const abs = path.isAbsolute(out) ? out : path.resolve(process.cwd(), out);
        writeFileSync(abs, `${JSON.stringify(report, null, 2)}\n`);
    }

    // ── the printed reading ────────────────────────────────────────────────
    const rule = (n = 96) => "─".repeat(n);
    console.log(`X.P.W3.d — css-equivalence, FULL SURFACE (G-7)\n${rule()}`);
    console.log(`pin        ${pin.commit}`);
    console.log(`oracle     ${path.basename(result.oracle.path)} — ${result.oracle.bytes} B · sha256 ${result.oracle.sha256}`);
    console.log(`           ${result.oracle.npmIntegrity}`);
    console.log(`           cross-check vs the unpacked cand-o vendor tree: ${crossCheck.agree ? "AGREE (css.js + css.d.ts byte-identical)" : "DISAGREE"}`);
    console.log(`taxonomy   ${result.taxonomy.ok ? "UNMOVED" : "MOVED"} · sha256 ${result.taxonomy.extractedSha256.slice(0, 16)} · classes ${result.taxonomy.classes.join(" / ")}`);
    console.log(`corpus     ${result.corpus.rows} rows → ${result.corpus.distinct} distinct · run ${result.corpus.run} · F-c3 unwrapped ${result.corpus.unwrappedForFc3} · replay pin ${result.corpus.rowsSha256Agrees ? "AGREES" : "DRIFTED"}`);
    console.log(`shape      color heads [${result.shape.declaredHeads.color.join(", ")}] · timing heads [${result.shape.declaredHeads.timing.join(", ")}]`);
    console.log(`universe   ${result.universe.runtime} runtime + ${result.universe.types} types = ${result.universe.total}\n`);

    const w = Math.max(...result.rows.map((r) => r.name.length));
    for (const row of result.rows) {
        if (row.status === "NO-PEER") {
            console.log(`  ${row.name.padEnd(w)}  ${row.kind.padEnd(7)}  NO-PEER      ${row.narrowingRow}  ${row.note}`);
            continue;
        }
        if (row.kind === "type") {
            console.log(`  ${row.name.padEnd(w)}  type     COMPARED     re-exported from the pinned declaration · ${row.members} members · ${row.literals} literals`);
            continue;
        }
        const js = row.lowerings.js;
        console.log(
            `  ${row.name.padEnd(w)}  runtime  COMPARED     ${js.cellsRun} cells × ${Object.keys(row.lowerings).length} lowerings · ` +
                `mirror-defects ${row.mirrorDefects} (spec-undecided ${js.specUndecided}) · lowerings ${row.lowerAgree ? "AGREE" : "DISAGREE"}`,
        );
        for (const [verdict, n] of Object.entries(js.tally)) {
            if (n === 0 || verdict === "AGREE") continue;
            console.log(`  ${" ".repeat(w)}    ${verdict.padEnd(24)} ${String(n).padStart(6)}${js.samples[verdict] ? `   e.g. ${JSON.stringify(js.samples[verdict][0].input).slice(0, 48)}` : ""}`);
        }
    }

    console.log(`\n${rule()}`);
    console.log(`rows       ${result.tally.rows} · COMPARED ${result.tally.compared} · NO-PEER ${result.tally.noPeer}`);
    console.log(`ledger     ${report.ledger.rows} rows — ${Object.entries(report.ledger.byFamily).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
    console.log(`           empty consumer-direction fields: ${emptyDirections.length === 0 ? "0" : emptyDirections.join(", ")}`);
    console.log(`           GATE-VERDICT anchors present: ${anchors.filter((a) => a.present).length}/${anchors.length}`);
    console.log(`MIRROR-DEFECTS  ${result.tally.mirrorDefects}   (of which spec-undecided ${result.tally.specUndecided})`);

    const red = result.tally.mirrorDefects > 0 || emptyDirections.length > 0;
    console.log(
        red
            ? `\nRED — the equivalence floor is NOT held at full surface. ${result.tally.mirrorDefects} mirror-defects over ${result.tally.compared} compared rows.`
            : "\nGREEN — zero mirror-defects across the full surface, and every declared difference is rowed.",
    );
    disposeOracle();
    return red ? 1 : 0;
};

process.exit(await main());
