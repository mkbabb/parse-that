#!/usr/bin/env node
// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.a — THE GATE ENTRY. G-1: THE 52 ARE THE 52.
//
//   node harness/totality/derive.mjs            (run from <p2>)  writes the manifest
//   node harness/totality/derive.mjs --check    (run from <p2>)  asserts, then reports
//
// W1.md §6 G-1's GREEN condition, verbatim: `--check` "exits 0 with the
// re-derived source count and the manifest count printed and equal
// (52 = 33 + 19), plus the per-slice TOTAL/PARTIAL/ABSENT report and the
// separate 37-symbol kf-seam column."
//
// W1.md §6 G-1's FALSIFIER, verbatim: "add an export to `src/css/index.ts` and
// a hand-maintained manifest silently keeps saying 52 — which is why the
// manifest is derived by script from the source file and
// `node harness/totality/derive.mjs --check` compares the derived count to the
// manifest's, exiting non-zero on disagreement. Delete a type from the
// manifest and that same command goes red."
//
// Both limbs are implemented here, and the assertion is STRICTLY STRONGER than
// the count the gate names: the derived NAME SET and each name's KIND and
// SLICE are compared, so a rename that preserves the count is caught too. A
// manifest that cannot go red when the surface moves is not a coverage
// instrument.

import { writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import process from "node:process";

import { MANIFEST_PATH, present } from "./lib/config.mjs";
import { deriveSurface, deriveVariants } from "./lib/surface.mjs";
import { assertDisjointFromManifest, deriveKfSeams, orphanSeams } from "./lib/kf-seams.mjs";
import { candidates, loadCandidate } from "./lib/candidates.mjs";
import { classify, kfSeamColumn } from "./lib/classify.mjs";
import {
    renderCandidate,
    renderDerivation,
    renderKfColumn,
    renderManifestCheck,
    renderSeparation,
} from "./lib/report.mjs";

const out = (s = "") => process.stdout.write(`${s}\n`);

const SCHEMA = "x-p-w1.totality.manifest/1";

const today = () => new Date().toISOString().slice(0, 10);

const buildManifest = (surface) => ({
    schema: SCHEMA,
    note:
        "DERIVED BY SCRIPT from src/css/index.ts at run time. Never hand-edit: " +
        "`node harness/totality/derive.mjs --check` compares this file to a fresh " +
        "derivation and exits non-zero on any disagreement.",
    derivedAt: today(),
    derivedFrom: surface.source,
    counts: surface.counts,
    slices: surface.slices,
    crossCheck: surface.crossCheck,
    exports: surface.exports.map(({ name, kind, slice, sourceModule, sourceLine }) => ({
        name,
        kind,
        slice,
        sourceModule,
        sourceLine,
    })),
});

// A plain-ASCII identity for an export row. JSON so the three fields can
// never collide however a slice is spelled, and so the file stays TEXT:
// a NUL separator would make this source binary to git and un-diffable.
const key = (e) => JSON.stringify([e.name, e.kind, e.slice]);

const compare = (manifest, surface) => {
    const problems = [];

    const countsEqual =
        manifest.counts.total === surface.counts.total &&
        manifest.counts.types === surface.counts.types &&
        manifest.counts.runtime === surface.counts.runtime;
    if (!countsEqual) {
        problems.push(
            `count disagreement: manifest ${manifest.counts.total} (${manifest.counts.types}+` +
                `${manifest.counts.runtime}) vs derived ${surface.counts.total} ` +
                `(${surface.counts.types}+${surface.counts.runtime})`,
        );
    }

    const manifestNames = new Set(manifest.exports.map((e) => e.name));
    const derivedNames = new Set(surface.exports.map((e) => e.name));
    const onlyManifest = [...manifestNames].filter((n) => !derivedNames.has(n));
    const onlyDerived = [...derivedNames].filter((n) => !manifestNames.has(n));
    for (const n of onlyManifest) problems.push(`manifest names \`${n}\`, source does not export it`);
    for (const n of onlyDerived) problems.push(`source exports \`${n}\`, manifest omits it`);

    const manifestShape = new Set(manifest.exports.map(key));
    const derivedShape = new Set(surface.exports.map(key));
    const movedKind = [...derivedShape].filter((k) => !manifestShape.has(k));
    for (const k of movedKind) {
        const [name, kind, slice] = JSON.parse(k);
        if (!onlyDerived.includes(name)) {
            problems.push(`\`${name}\` moved to ${kind}/${slice} — the manifest records another`);
        }
    }

    for (const [slice, n] of Object.entries(surface.slices)) {
        if (manifest.slices?.[slice] !== n) {
            problems.push(
                `slice \`${slice}\`: manifest ${manifest.slices?.[slice] ?? "absent"} vs derived ${n}`,
            );
        }
    }

    if (surface.crossCheck.sum !== surface.counts.total) {
        problems.push(
            `the two independent derivations disagree: block-member arithmetic says ` +
                `${surface.crossCheck.sum}, the export-block parse says ${surface.counts.total}`,
        );
    }

    return {
        manifestPath: MANIFEST_PATH,
        manifestDerivedAt: manifest.derivedAt ?? "(undated)",
        manifest: manifest.counts,
        derived: surface.counts,
        countsEqual,
        setsEqual: onlyManifest.length === 0 && onlyDerived.length === 0,
        shapeEqual: movedKind.length === 0,
        sourceSha256Drift: manifest.derivedFrom?.sha256 !== surface.source.sha256,
        problems,
    };
};

const runReport = async (surface, variants) => {
    const seams = deriveKfSeams();
    const orphans = seams.available ? orphanSeams(seams, surface) : [];
    const columns = {};

    for (const candidate of candidates()) {
        const { namespace, loaded, reason } = await loadCandidate(candidate);
        if (!loaded) out(`\n(candidate ${candidate.id}: ${reason})`);
        const result = classify({
            surface,
            variants,
            candidate,
            namespace,
            declarationText: candidate.declarations(),
        });
        renderCandidate(result, out);
        columns[candidate.id] = kfSeamColumn(result, seams);
    }

    renderKfColumn(seams, columns, orphans, out);
    return { seams, orphans };
};

const main = async () => {
    const check = process.argv.includes("--check");
    const surface = deriveSurface();
    const variants = deriveVariants();

    renderDerivation(surface, variants, out);

    if (!check) {
        const manifest = buildManifest(surface);
        writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 4)}\n`);
        out(`\nWROTE ${MANIFEST_PATH}`);
        out(
            `      ${manifest.counts.total} exports = ${manifest.counts.types} types + ` +
                `${manifest.counts.runtime} runtime, derived ${manifest.derivedAt}`,
        );
        out("\nRe-run with --check to assert the manifest against source and print the report.");
        return 0;
    }

    if (!present(MANIFEST_PATH)) {
        out(`\n*** no manifest at ${MANIFEST_PATH} — run without --check to write one.`);
        return 2;
    }

    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
    const comparison = compare(manifest, surface);
    renderManifestCheck(comparison, out);

    if (comparison.problems.length > 0) {
        out(`\n${"─".repeat(78)}`);
        out(`RED — ${comparison.problems.length} manifest/source disagreement(s).`);
        out("The manifest is derived, never maintained: re-run without --check to re-derive,");
        out("then read the diff as the surface having moved.");
        return 1;
    }

    const { seams } = await runReport(surface, variants);

    const separation = assertDisjointFromManifest(seams, manifest);
    renderSeparation(separation, out);

    out(`\n${"─".repeat(78)}`);
    out(
        `GREEN — manifest ${manifest.counts.total} == derived ${surface.counts.total} ` +
            `(${surface.counts.types} types + ${surface.counts.runtime} runtime); ` +
            `names, kinds and slices identical.`,
    );
    return 0;
};

main().then(
    (code) => process.exit(code),
    (error) => {
        process.stderr.write(`${error?.stack ?? error}\n`);
        process.exit(1);
    },
);
