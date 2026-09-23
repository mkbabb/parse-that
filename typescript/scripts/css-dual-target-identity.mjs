#!/usr/bin/env node
// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — G-5: DUAL-TARGET RECOVERY IDENTITY.
//
//   node scripts/css-dual-target-identity.mjs --js <jsEntry> --wasm <wasmArtifact> --corpus <corpus.json>
//
// `W3.md` §6 G-5, verbatim: "for every corpus input, the JS target's and the Wasm target's
// `{ok, code, start, end, expected, actual}` must be **byte-identical** after JSON canonicalization"
// and its falsifier: "a single differing byte fails, and a difference in `expected` ORDERING counts
// — **canonicalization sorts nothing**, because a diagnostic's expectation order is part of its
// meaning."
//
// THAT SENTENCE IS THE WHOLE DESIGN OF THIS PROGRAM. `canonical()` below fixes the KEY order of the
// six-tuple — so the two targets cannot differ merely by property insertion order, which is a
// serialization artifact and not a semantic one — and touches ARRAY order not at all. An `expected`
// list that reads `["<number>", "<none-keyword>"]` in one target and `["<none-keyword>", "<number>"]`
// in the other is a FAILURE here, by design.
//
// G-5 WAS THE WAVE'S ONE `MEASURE-AT-OPEN` GATE. On 2026-08-03 it had no subject at all ("no Wasm
// artifact exists ... zero project artifacts"). At this wave's open the subject EXISTS —
// `src/css/build/ac1.wasm` plus `lowering-js/` and `lowering-wasm/` — and the open's baseline
// recorded the gate as RED "for want of the comparator, not for want of the artifact". This file is
// that comparator.
//
// ── THE §4 TRANSCRIPTION, STATED RATHER THAN IMPROVISED ────────────────────────────────────────
//
// The spec's command names `--js dist/css.js --wasm dist/css.wasm`, written 2026-08-03, before AC-1
// was selected. The graduated survivor's artifacts are `src/css/build/ac1.js` and
// `src/css/build/ac1.wasm`, and the two lowerings a consumer actually reaches are published through
// `src/css/entry.mjs`'s `loadPublicSurfaces()`. Both flags are ACCEPTED and both default to the
// tree's own paths; the paths are printed with their sha256 so a reader sees exactly which bytes
// were compared. This is the same transcription reconciliation `.b` and `.c` recorded for the
// spec's `.ts` names against the tree's `.mjs` — §4's first row admits the whole glob, so no bounds
// question arises.
//
// ── WHAT IS COMPARED, AND WHAT IS REPORTED BESIDE IT ───────────────────────────────────────────
//
// THE GATE is the declared six-tuple, and nothing else, because that is what G-5 says.
// BESIDE IT, and named as an addition rather than a substitute, this program also compares the
// full `value` of every accepted parse across the two targets. A gate that proved the REJECTIONS
// identical while the ACCEPTANCES disagreed would be true and useless, so the reading is taken;
// it is reported as its own line and it does not silently enter G-5's verdict either way.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TS_ROOT = path.resolve(HERE, "..");

const arg = (name, fallback = null) => {
    const i = process.argv.indexOf(`--${name}`);
    if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
    const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
    return eq ? eq.slice(name.length + 3) : fallback;
};

const sha256File = (p) => (existsSync(p) ? createHash("sha256").update(readFileSync(p)).digest("hex") : null);

/**
 * THE CANONICALIZATION. Fixed KEY order for the six-tuple; NO array is sorted, NO array is
 * de-duplicated, NO number is rounded. `undefined` is normalized to `null` so that "absent" and
 * "present as undefined" cannot read as different bytes for the same meaning — the only
 * normalization this function performs, and it is symmetric across both targets.
 */
const KEYS = ["ok", "code", "start", "end", "expected", "actual"];

const canonical = (result) => {
    const issue = result && result.ok === false ? result.diagnostics?.[0] ?? null : null;
    const tuple = {
        ok: result?.ok ?? null,
        code: issue ? issue.code ?? null : null,
        start: issue ? issue.start ?? null : null,
        end: issue ? issue.end ?? null : null,
        // The array is copied, never sorted: `expected` ORDER is part of the diagnostic's meaning.
        expected: issue ? (Array.isArray(issue.expected) ? [...issue.expected] : null) : null,
        actual: issue ? (issue.actual === undefined ? null : issue.actual) : null,
    };
    return JSON.stringify(tuple, KEYS);
};

/** Every issue of a rejection, not just the first — a target that agreed on `[0]` and diverged at `[1]` is a divergence. */
const canonicalAll = (result) => {
    if (!result || result.ok !== false) return canonical(result);
    return JSON.stringify(
        (result.diagnostics ?? []).map((issue) => ({
            ok: false,
            code: issue.code ?? null,
            start: issue.start ?? null,
            end: issue.end ?? null,
            expected: Array.isArray(issue.expected) ? [...issue.expected] : null,
            actual: issue.actual === undefined ? null : issue.actual,
        })),
    );
};

const canonicalValue = (result) => (result && result.ok === true ? JSON.stringify(result.value) : null);

const call = (fn, input) => {
    try {
        return { threw: false, value: fn(input) };
    } catch (error) {
        return { threw: true, value: undefined, error: error instanceof Error ? error.constructor.name : typeof error, message: error instanceof Error ? error.message : String(error) };
    }
};

const main = async () => {
    const jsPath = path.resolve(TS_ROOT, arg("js", "src/css/build/ac1.js"));
    const wasmPath = path.resolve(TS_ROOT, arg("wasm", "src/css/build/ac1.wasm"));
    const corpusPath = path.resolve(TS_ROOT, arg("corpus", "test/css-totality/corpus.json"));
    const out = arg("out");
    const limit = arg("limit") ? Number(arg("limit")) : null;

    const { loadPublicSurfaces } = await import(path.join(TS_ROOT, "src/css/entry.mjs"));
    const { loadCorpus, distinctSources, boundaryValues } = await import(
        path.join(TS_ROOT, "test/css-equivalence/lib/corpus.mjs")
    );

    const surfaces = await loadPublicSurfaces();
    const corpus = loadCorpus();
    const all = distinctSources();
    const sources = limit ? all.slice(0, limit) : all;
    const entries = surfaces.js.entries();

    const rule = (n = 96) => "─".repeat(n);
    console.log(`X.P.W3.d — css-dual-target-identity (G-5)\n${rule()}`);
    console.log(`js artifact    ${path.relative(TS_ROOT, jsPath)} — sha256 ${String(sha256File(jsPath)).slice(0, 16)}`);
    console.log(`wasm artifact  ${path.relative(TS_ROOT, wasmPath)} — sha256 ${String(sha256File(wasmPath)).slice(0, 16)}`);
    console.log(`lowerings      ${Object.keys(surfaces).join(" · ")} (published through src/css/entry.mjs)`);
    console.log(`corpus         ${path.relative(TS_ROOT, corpusPath)} — ${corpus.rows.length} rows → ${all.length} distinct · run ${sources.length} · F-c3 unwrapped ${corpus.unwrapped}`);
    console.log(`entries        ${entries.join(" · ")}`);
    console.log(`canonical      keys [${KEYS.join(", ")}] in FIXED order · NO array sorted · NO number rounded\n`);

    const rows = [];
    let differingBytes = 0;
    let differingCells = 0;
    let valueDifferingCells = 0;
    let throwCells = 0;

    for (const entry of entries) {
        let cells = 0;
        let differ = 0;
        let valueDiffer = 0;
        let allIssueDiffer = 0;
        let threw = 0;
        const samples = [];

        for (const row of sources) {
            cells += 1;
            const js = call(surfaces.js[entry], row.src);
            const wasm = call(surfaces.wasm[entry], row.src);
            if (js.threw || wasm.threw) {
                threw += 1;
                samples.length < 6 && samples.push({ input: row.src, why: `THREW js=${js.threw} wasm=${wasm.threw}` });
                continue;
            }
            const a = canonical(js.value);
            const b = canonical(wasm.value);
            if (a !== b) {
                differ += 1;
                let d = 0;
                for (let i = 0; i < Math.max(a.length, b.length); i += 1) if (a[i] !== b[i]) d += 1;
                differingBytes += d;
                if (samples.length < 6) samples.push({ input: row.src, js: a, wasm: b, differingBytes: d });
            }
            if (canonicalAll(js.value) !== canonicalAll(wasm.value)) allIssueDiffer += 1;
            if (canonicalValue(js.value) !== canonicalValue(wasm.value)) valueDiffer += 1;
        }

        differingCells += differ;
        valueDifferingCells += valueDiffer;
        throwCells += threw;
        rows.push({ entry, cells, differ, allIssueDiffer, valueDiffer, threw, samples });
        console.log(
            `  ${entry.padEnd(22)} ${String(cells).padStart(6)} cells · six-tuple differ ${String(differ).padStart(5)} · ` +
                `full-diagnostics differ ${String(allIssueDiffer).padStart(5)} · value differ ${String(valueDiffer).padStart(5)} · threw ${threw}`,
        );
        for (const s of samples) console.log(`      e.g. ${JSON.stringify(s.input).slice(0, 56)}\n           js   ${s.js}\n           wasm ${s.wasm}`);
    }

    // The seven declared non-string boundary values, across both targets (`.a`'s corpus declares them).
    const boundary = [];
    for (const b of boundaryValues()) {
        for (const entry of entries) {
            const js = call(surfaces.js[entry], b.value);
            const wasm = call(surfaces.wasm[entry], b.value);
            const same = !js.threw && !wasm.threw && canonical(js.value) === canonical(wasm.value);
            boundary.push({ id: b.id, js: b.js, entry, identical: same, canonical: js.threw ? null : canonical(js.value) });
            if (!same) differingCells += 1;
        }
    }
    const boundaryOk = boundary.every((b) => b.identical);
    console.log(`\n  boundary (7 declared non-string values × ${entries.length} entries = ${boundary.length} cells) — identical across both targets: ${boundaryOk ? "ALL" : `${boundary.filter((b) => b.identical).length}/${boundary.length}`}`);

    const report = {
        schema: "x-p-w3-d/dual-target-identity@1",
        note:
            "G-5 — DUAL-TARGET RECOVERY IDENTITY. The declared six-tuple {ok, code, start, end, expected, actual} " +
            "compared byte-for-byte between the source-direct JS lowering and the zero-function-import Wasm " +
            "lowering, over the graduated corpus. Canonicalization fixes KEY order only: no array is sorted, " +
            "because `expected` order is part of a diagnostic's meaning (W3.md §6 G-5's falsifier).",
        generatedBy: "typescript/scripts/css-dual-target-identity.mjs",
        artifacts: {
            js: { path: path.relative(TS_ROOT, jsPath), sha256: sha256File(jsPath) },
            wasm: { path: path.relative(TS_ROOT, wasmPath), sha256: sha256File(wasmPath) },
            specCommandPaths: { js: "dist/css.js", wasm: "dist/css.wasm" },
            transcription:
                "W3.md §6 G-5 was authored 2026-08-03, before AC-1 was selected; the graduated survivor's artifacts are src/css/build/ac1.{js,wasm} and the two lowerings are published through src/css/entry.mjs. Both spec flags are accepted and default to these paths.",
        },
        canonicalization: { keyOrder: KEYS, sortsArrays: false, roundsNumbers: false, undefinedNormalizedToNull: true },
        corpus: {
            path: path.relative(TS_ROOT, corpusPath),
            rows: corpus.rows.length,
            distinct: all.length,
            run: sources.length,
            unwrappedForFc3: corpus.unwrapped,
            rowsSha256: corpus.rowsSha256,
            rowsSha256Agrees: corpus.rowsSha256Agrees,
        },
        entries,
        rows,
        boundary,
        totals: {
            cells: rows.reduce((n, r) => n + r.cells, 0) + boundary.length,
            sixTupleDifferingCells: differingCells,
            differingBytes,
            fullDiagnosticsDifferingCells: rows.reduce((n, r) => n + r.allIssueDiffer, 0),
            valueDifferingCells,
            throwCells,
        },
        gate: {
            id: "G-5",
            condition: "zero differing bytes in the declared six-tuple, over every corpus input, in both targets",
            reading: differingCells === 0 && throwCells === 0 ? "GREEN" : "RED",
        },
        besideTheGate: {
            condition: "value identity of every accepted parse across both targets — an addition to G-5's letter, never a substitute",
            reading: valueDifferingCells === 0 ? "GREEN" : "RED",
            valueDifferingCells,
        },
    };

    if (out) writeFileSync(path.isAbsolute(out) ? out : path.resolve(process.cwd(), out), `${JSON.stringify(report, null, 2)}\n`);

    console.log(`\n${rule()}`);
    console.log(`cells                       ${report.totals.cells}`);
    console.log(`six-tuple differing cells   ${differingCells}   (differing bytes ${differingBytes})`);
    console.log(`full-diagnostics differing  ${report.totals.fullDiagnosticsDifferingCells}`);
    console.log(`value differing cells       ${valueDifferingCells}   ← beside the gate, not part of it`);
    console.log(`cells where a target threw  ${throwCells}`);
    console.log(
        differingCells === 0 && throwCells === 0
            ? "\nGREEN — the two targets produce byte-identical {ok, code, start, end, expected, actual} for every corpus input."
            : `\nRED — ${differingCells} cells differ (${differingBytes} bytes).`,
    );
    return differingCells === 0 && throwCells === 0 ? 0 : 1;
};

process.exit(await main());
