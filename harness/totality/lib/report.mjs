// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.a — the printed reading. Every figure here is computed by
// `classify.mjs` from the settled bytes; this file only lays it out.
//
// L-16: each block is labelled with its evidence mode. SOURCE = read from a
// file on disk. API-TEST = a call made into a candidate's own module. Nothing
// printed here is a proof of a product.

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

const line = (char = "─", n = 78) => char.repeat(n);

export const renderDerivation = (surface, variants, out) => {
    out(`\n${line("═")}`);
    out("THE DERIVATION — SOURCE");
    out(line("═"));
    out(`source      ${surface.source.file}`);
    out(`bytes       ${surface.source.bytes} · lines ${surface.source.lines}`);
    out(`sha256      ${surface.source.sha256}`);
    out(`variants    ${variants.source.file}`);
    out(`            sha256 ${variants.source.sha256}`);
    out("");
    out(
        `derived     ${surface.counts.total} exports = ${surface.counts.types} types + ` +
            `${surface.counts.runtime} runtime`,
    );
    const slices = Object.entries(surface.slices)
        .filter(([s]) => s !== "types")
        .map(([s, n]) => `${n} ${s}`)
        .join(" + ");
    out(`runtime     ${slices}`);
    out(
        `cross-check ${surface.crossCheck.blockMembers} block members + ` +
            `${surface.crossCheck.singleLineExports} single-line export = ` +
            `${surface.crossCheck.sum}  (W1.md §6 G-1's own 51 + 1 baseline, re-derived in-process)`,
    );
};

export const renderManifestCheck = (check, out) => {
    out(`\n${line("═")}`);
    out("MANIFEST vs SOURCE — the gate's assertion");
    out(line("═"));
    out(`manifest    ${check.manifestPath}`);
    out(`derived at  ${check.manifestDerivedAt}`);
    out(
        `counts      manifest ${check.manifest.total} · derived ${check.derived.total}   ` +
            (check.countsEqual ? "EQUAL" : "*** DISAGREE ***"),
    );
    out(
        `            types    ${num(check.manifest.types, 3)} · ${num(check.derived.types, 3)}` +
            `        runtime ${num(check.manifest.runtime, 3)} · ${num(check.derived.runtime, 3)}`,
    );
    out(
        `sets        names ${check.setsEqual ? "IDENTICAL" : "*** DIVERGED ***"} · ` +
            `kinds+slices ${check.shapeEqual ? "IDENTICAL" : "*** DIVERGED ***"}`,
    );
    if (check.sourceSha256Drift) {
        out(
            `source sha  DRIFTED since the manifest was written — reported, not asserted ` +
                `(a comment may move it; the export SETS are what the gate binds)`,
        );
    }
    for (const problem of check.problems) out(`  !! ${problem}`);
};

export const renderCandidate = (result, out) => {
    out(`\n${line("═")}`);
    out(`CANDIDATE  ${result.candidate.id}   [${result.candidate.role}] — API-TEST`);
    out(line("═"));
    out(`is          ${result.candidate.what}`);
    if (result.candidate.notWhat) out(`is NOT      ${result.candidate.notWhat}`);
    out(`module      ${result.candidate.runtimeModule ?? "(none)"}`);
    out("");
    out(
        `AGGREGATE (52)   ${num(result.aggregate.TOTAL, 3)} TOTAL · ` +
            `${num(result.aggregate.PARTIAL, 3)} PARTIAL · ${num(result.aggregate.ABSENT, 3)} ABSENT`,
    );
    out(
        `  runtime (19)   ${num(result.runtimeTally.TOTAL, 3)} TOTAL · ` +
            `${num(result.runtimeTally.PARTIAL, 3)} PARTIAL · ${num(result.runtimeTally.ABSENT, 3)} ABSENT` +
            `        throws ${result.throws}`,
    );
    out(
        `  types   (33)   ${num(result.typeTally.TOTAL, 3)} TOTAL · ` +
            `${num(result.typeTally.PARTIAL, 3)} PARTIAL · ${num(result.typeTally.ABSENT, 3)} ABSENT`,
    );

    out(`\n  ── per-slice (the barrel's own modules) ${line("─", 38)}`);
    out(`  ${pad("slice", 14)}${num("n", 4)}${num("TOTAL", 8)}${num("PARTIAL", 9)}${num("ABSENT", 8)}`);
    for (const [slice, t] of Object.entries(result.moduleSlices)) {
        out(
            `  ${pad(slice, 14)}${num(t.count, 4)}${num(t.TOTAL, 8)}${num(t.PARTIAL, 9)}${num(t.ABSENT, 8)}`,
        );
    }

    out(`\n  ── per-slice (the NINE public parsers the R1 probe targets) ${line("─", 18)}`);
    out(`  ${pad("parser", 24)}${pad("verdict", 10)}${pad("cells", 12)}${pad("throws", 8)}`);
    for (const p of result.parserSlices) {
        out(
            `  ${pad(p.name, 24)}${pad(p.verdict, 10)}` +
                `${pad(`${p.cellsPassed}/${p.cellsTotal}`, 12)}${pad(p.threw, 8)}`,
        );
    }

    const narrowed = result.rows.filter((r) => r.verdict === "PARTIAL");
    if (narrowed.length > 0) {
        out(`\n  ── PARTIAL: what is missing, named (the legend's own requirement) ${line("─", 12)}`);
        for (const row of narrowed) {
            out(`  ${row.name} (${row.slice})`);
            for (const miss of row.missing) out(`      · ${miss}`);
        }
    }

    const absent = result.rows.filter((r) => r.verdict === "ABSENT");
    if (absent.length > 0) {
        out(`\n  ── ABSENT (${absent.length}) ${line("─", 56)}`);
        const runtime = absent.filter((r) => r.kind === "runtime").map((r) => r.name);
        const types = absent.filter((r) => r.kind === "type").map((r) => r.name);
        if (runtime.length > 0) out(`  runtime (${runtime.length}): ${runtime.join(", ")}`);
        if (types.length > 0) out(`  types   (${types.length}): ${types.join(", ")}`);
    }
};

export const renderKfColumn = (seams, columns, orphans, out) => {
    out(`\n${line("═")}`);
    out("KF SEAM COLUMN — SEPARATE, never merged into the 52");
    out(line("═"));
    if (!seams.available) {
        out(`UNREADABLE — ${seams.reason}`);
        return;
    }
    out(`root        ${seams.root}`);
    out(`specifier   ${seams.specifier}`);
    out(
        `derived     ${seams.counts.distinct} distinct symbols · ${seams.counts.occurrences} occurrences · ` +
            `${seams.counts.files} files · ${seams.counts.lineHits} line-hits`,
    );
    out(
        `Finding F-3 orphan imports: ${orphans.length}` +
            (orphans.length === 0
                ? "  — every kf-consumed symbol is exported by src/css/index.ts, MEASURED"
                : `  *** ${orphans.join(", ")} ***`),
    );
    out("");
    out(`  ${pad("candidate", 20)}${pad("column", 10)}${num("TOTAL", 8)}${num("PARTIAL", 9)}${num("ABSENT", 8)}`);
    for (const [id, col] of Object.entries(columns)) {
        out(
            `  ${pad(id, 20)}${pad(`${col.count} kf`, 10)}` +
                `${num(col.TOTAL, 8)}${num(col.PARTIAL, 9)}${num(col.ABSENT, 8)}`,
        );
    }
};

export const renderSeparation = (separation, out) => {
    out(
        `\nSEPARATION ASSERTED — manifest ${separation.manifestExports} exports · ` +
            `kf column ${separation.kfSeamSymbols} symbols · merged: ${separation.merged}`,
    );
};
