// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — THE GRADUATED DIFFERENTIAL. THE P-1 HARNESS, AT FULL SURFACE.
//
// `W3.md` §2c is precise about what this unit inherits and what it must not do with it:
//     "P-1 equivalence GREEN (0 mirror-defects, 403 strings) | FLOOR — inherited, never regressed |
//      unit `.d`; gate G-7. A GREEN arm is not a finished arm: it is graduated to the full surface
//      and re-proven, and a regression is a wave-blocker."
// and §6 G-7's own RED baseline says the graduation has "never been run": "49 of 52 exports had no
// assay peer at the census. The floor is therefore inherited as a floor, not as a pass."
//
// ── THE TAXONOMY IS CARRIED, NEVER RE-STATED ───────────────────────────────────────────────────
//
// The three MIRROR-DEFECT classes are the authority's, imported from `harness/equivalence/
// taxonomy.ts` — which itself re-reads `apotheosis/parser-proof/equivalence.md` §1 at run time and
// compares byte-for-byte. W1.md §6 G-2's falsifier is the reason: "widen the taxonomy (reclassify a
// MIS_ACCEPT as COVERAGE_NARROWING) and the count goes to zero for the wrong reason". This module
// asserts the taxonomy unmoved BEFORE it classifies a single cell.
//
// ── THE ONE JUDGEMENT THIS MODULE MAKES, STATED BEFORE THE NUMBERS ─────────────────────────────
//
// Two of the three classes are defined against the CSS SPECIFICATION as well as against the
// incumbent:
//     (B) MIS_ACCEPT           — "C14 accepts an input the live parser **and spec** reject"
//     (C) FALSE_REJECT_IN_SHAPE — "C14 rejects an input **unambiguously valid** within its own shape"
// and this wave ships no executable specification oracle. For the sixteen inputs `parser-band.md`
// adjudicated, the adjudication IS the spec reading and it is used. For every other input the
// discriminator is missing, and the missing discriminator is resolved in ONE direction, declared
// here before the run:
//
//     WHERE THE SPEC READING IS MISSING, THE CELL IS COUNTED **AGAINST** THE CANDIDATE.
//
// A candidate-accepts/incumbent-rejects cell counts as MIS_ACCEPT; a candidate-rejects/
// incumbent-accepts cell inside the declared shape counts as FALSE_REJECT_IN_SHAPE. The opposite
// convention — reading every unadjudicated disagreement as LIVE_STRICTER, which the taxonomy also
// licenses in principle — would drive the defect count toward zero on an argument nobody measured,
// and that is precisely the move the falsifier names. Every such cell additionally carries
// `specUndecided: true`, so `.e` can see exactly how much of the count rests on a reading this wave
// does not own, and can overturn it with a spec citation rather than with a preference.
//
// COVERAGE_NARROWING is the one declared NON-defect this module applies, and only where the
// candidate's grammar registry — authored at X.P.W2, committed before this seat opened — does not
// carry the input's function head (`lib/shape.mjs`). It is a fact with a commit date, not a
// classification convenience.

import { readTypeDeclarations } from "../../../../harness/totality/lib/surface.mjs";
import {
    MIRROR_DEFECT_CLASSES,
    DECLARED_NON_DEFECTS,
    checkTaxonomyUnmoved,
} from "../../../../harness/equivalence/taxonomy.ts";

import { ADJUDICATIONS } from "../../css-totality/lib/adjudications.mjs";
import { callOracle, loadOracle } from "./oracle.mjs";
import { distinctSources, loadCorpus } from "./corpus.mjs";
import { ENTRY_FAMILY, inDeclaredShape, shapeDeclaration } from "./shape.mjs";

/** The verdicts a cell can carry. The first three are the authority's RED triggers, by name. */
export const CELL = Object.freeze({
    AGREE: "AGREE",
    DIVERGENT_VALUE: "DIVERGENT_VALUE",
    MIS_ACCEPT: "MIS_ACCEPT",
    FALSE_REJECT_IN_SHAPE: "FALSE_REJECT_IN_SHAPE",
    CANDIDATE_THREW: "CANDIDATE_THREW",
    CANDIDATE_SHAPE: "CANDIDATE_SHAPE",
    COVERAGE_NARROWING: "COVERAGE_NARROWING",
    DECLARED_DIVERGENCE: "DECLARED_DIVERGENCE",
    ADJUDICATION_UNHONOURED: "ADJUDICATION_UNHONOURED",
    FIXTURE_R1: "FIXTURE_R1",
});

export const RED_TRIGGERS = Object.freeze([
    CELL.DIVERGENT_VALUE,
    CELL.MIS_ACCEPT,
    CELL.FALSE_REJECT_IN_SHAPE,
    CELL.CANDIDATE_THREW,
    CELL.CANDIDATE_SHAPE,
    CELL.ADJUDICATION_UNHONOURED,
]);

/* ── result-shape law (the frozen contract, asserted on every candidate cell) ───────────────── */

const isFrozenShape = (v) => {
    if (v === null || typeof v !== "object") return "not an object";
    if (v.ok === true) {
        if (!Array.isArray(v.diagnostics) || v.diagnostics.length !== 0) return "ok:true with non-empty diagnostics";
        return null;
    }
    if (v.ok === false) {
        if (!Array.isArray(v.diagnostics) || v.diagnostics.length === 0) return "ok:false with an EMPTY diagnostics tuple";
        return null;
    }
    return "`ok` is neither true nor false";
};

const deepEqual = (a, b) => {
    if (a === b) return true;
    if (typeof a === "number" && typeof b === "number") return Object.is(a, b);
    if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => kb.includes(k) && deepEqual(a[k], b[k]));
};

/* ── the adjudication index (the sixteen, by input) ────────────────────────────────────────── */

export const adjudicationIndex = () => {
    const byInput = new Map();
    for (const row of ADJUDICATIONS) {
        for (const input of row.inputs) byInput.set(input, row);
    }
    return byInput;
};

/* ── one cell ──────────────────────────────────────────────────────────────────────────────── */

const classifyCell = ({ input, family, oracle, candidate, adjudicated }) => {
    if (candidate.threw) {
        return { verdict: CELL.CANDIDATE_THREW, why: `${candidate.error}: ${candidate.message}`, specUndecided: false };
    }
    const shape = isFrozenShape(candidate.value);
    if (shape) return { verdict: CELL.CANDIDATE_SHAPE, why: shape, specUndecided: false };

    // The R1 class. The incumbent throws; the candidate returns a typed result. That IS the fixture.
    if (oracle.threw) {
        return {
            verdict: CELL.FIXTURE_R1,
            why: `incumbent throws ${oracle.error}; candidate returns ok:${candidate.value.ok}`,
            specUndecided: false,
        };
    }

    const oracleOk = oracle.value?.ok === true;
    const candOk = candidate.value.ok === true;

    if (adjudicated) {
        // ADJ-3 carries `expect: null` and a PER-INPUT map, because "clamp where a clamp exists,
        // reject where none does" is not one verdict for three inputs. Reading `expect` alone would
        // score two of its three cells against the candidate for the wrong reason.
        const expect = adjudicated.expectByInput?.[input] ?? adjudicated.expect;
        const wants = expect === "accept";
        if (candOk !== wants) {
            return {
                verdict: CELL.ADJUDICATION_UNHONOURED,
                why: `${adjudicated.id} requires ${expect}; candidate ${candOk ? "accepts" : "rejects"}`,
                specUndecided: false,
                adjudication: adjudicated.id,
            };
        }
        if (candOk && oracleOk && !adjudicated.valueDiffers && !deepEqual(oracle.value.value, candidate.value.value)) {
            return {
                verdict: CELL.DIVERGENT_VALUE,
                why: `${adjudicated.id} is not a value-differing row, yet the values differ`,
                specUndecided: false,
                adjudication: adjudicated.id,
            };
        }
        return {
            verdict: candOk === oracleOk && (!candOk || deepEqual(oracle.value.value, candidate.value.value)) ? CELL.AGREE : CELL.DECLARED_DIVERGENCE,
            why: `${adjudicated.id} honoured (${expect})`,
            specUndecided: false,
            adjudication: adjudicated.id,
        };
    }

    if (oracleOk && candOk) {
        if (deepEqual(oracle.value.value, candidate.value.value)) return { verdict: CELL.AGREE, why: null, specUndecided: false };
        return {
            verdict: CELL.DIVERGENT_VALUE,
            why: `incumbent ${JSON.stringify(oracle.value.value)?.slice(0, 90)} vs candidate ${JSON.stringify(candidate.value.value)?.slice(0, 90)}`,
            specUndecided: false,
        };
    }

    if (!oracleOk && !candOk) return { verdict: CELL.AGREE, why: null, specUndecided: false };

    if (oracleOk && !candOk) {
        const shapeRead = inDeclaredShape(family, input);
        if (!shapeRead.inShape) {
            return { verdict: CELL.COVERAGE_NARROWING, why: shapeRead.why, specUndecided: false };
        }
        return {
            verdict: CELL.FALSE_REJECT_IN_SHAPE,
            why: `incumbent accepts; candidate rejects with ${candidate.value.diagnostics[0]?.code} inside the declared shape`,
            specUndecided: true,
        };
    }

    // candidate accepts, incumbent rejects — counted AGAINST the candidate, per the declared convention.
    return {
        verdict: CELL.MIS_ACCEPT,
        why: `incumbent rejects with ${oracle.value.diagnostics?.[0]?.code ?? "?"}; candidate accepts`,
        specUndecided: true,
    };
};

/* ── one runtime row (one export, one lowering) ────────────────────────────────────────────── */

const SAMPLE = 6;

const runEntryRow = ({ name, oracleFn, candidateFn, family, sources, adjIndex }) => {
    const tally = Object.fromEntries(Object.values(CELL).map((k) => [k, 0]));
    const samples = {};
    const misses = [];
    let cellsRun = 0;

    for (const row of sources) {
        cellsRun += 1;
        const oracle = callOracle(oracleFn, row.src);
        const candidate = callOracle(candidateFn, row.src);
        const cell = classifyCell({
            input: row.src,
            family,
            oracle,
            candidate,
            adjudicated: adjIndex.get(row.src) ?? null,
        });
        tally[cell.verdict] += 1;
        if (cell.verdict !== CELL.AGREE) {
            samples[cell.verdict] ??= [];
            if (samples[cell.verdict].length < SAMPLE) {
                samples[cell.verdict].push({ input: row.src, why: cell.why, bands: row.bands });
            }
            if (RED_TRIGGERS.includes(cell.verdict)) {
                misses.push({ input: row.src, verdict: cell.verdict, why: cell.why, specUndecided: cell.specUndecided, bands: row.bands });
            }
        }
    }

    const mirrorDefects = RED_TRIGGERS.reduce((n, k) => n + tally[k], 0);
    const specUndecided = misses.filter((m) => m.specUndecided).length;
    return { cellsRun, tally, samples, mirrorDefects, specUndecided, misses };
};

/* ── the 52 rows ───────────────────────────────────────────────────────────────────────────── */

/**
 * The whole graduated differential, over the pinned universe.
 * `universe` is the caller's pinned reading (`.a`'s `readPin`) so this module holds no copy of the
 * frozen surface; `surfaces` are the candidate's two lowerings.
 */
export const runFullSurface = async ({ universe, surfaces, unrealizedEntries, candidateTypeNames, limit = null }) => {
    const taxonomy = checkTaxonomyUnmoved();
    if (!taxonomy.ok) {
        throw new Error(`TAXONOMY MOVED — ${taxonomy.failures.join(" · ")}. W1.md §6 G-2: a harness that only counts cannot tell a cured engine from a widened rule.`);
    }

    const oracle = await loadOracle();
    const corpus = loadCorpus();
    const all = distinctSources();
    const sources = limit ? all.slice(0, limit) : all;
    const adjIndex = adjudicationIndex();

    const publishedDecls = readTypeDeclarations(oracle.declarationText);
    const rows = [];

    for (const name of universe.runtime) {
        const oracleFn = oracle.module[name];
        const realizedIn = Object.entries(surfaces).filter(([, s]) => typeof s[name] === "function").map(([k]) => k);
        if (realizedIn.length === 0) {
            rows.push({
                name,
                kind: "runtime",
                status: "NO-PEER",
                declaredUnrealized: unrealizedEntries.includes(name),
                narrowingRow: unrealizedEntries.includes(name) ? "CN-1" : "CN-2",
                cellsRun: 0,
                mirrorDefects: 0,
                note: unrealizedEntries.includes(name)
                    ? "named by the candidate's own UNREALIZED_ENTRIES — declared coverage narrowing (ledger CN-1)"
                    : "neither realized nor named by UNREALIZED_ENTRIES — declared coverage narrowing (ledger CN-2)",
            });
            continue;
        }
        const family = ENTRY_FAMILY[name] ?? "color";
        const lowerings = {};
        for (const kind of realizedIn) {
            lowerings[kind] = runEntryRow({
                name,
                oracleFn,
                candidateFn: surfaces[kind][name],
                family,
                sources,
                adjIndex,
            });
        }
        const mirrorDefects = Math.max(...Object.values(lowerings).map((l) => l.mirrorDefects));
        rows.push({
            name,
            kind: "runtime",
            status: "COMPARED",
            family,
            lowerings: Object.fromEntries(
                Object.entries(lowerings).map(([k, v]) => [k, { cellsRun: v.cellsRun, tally: v.tally, samples: v.samples, mirrorDefects: v.mirrorDefects, specUndecided: v.specUndecided }]),
            ),
            misses: Object.fromEntries(Object.entries(lowerings).map(([k, v]) => [k, v.misses.slice(0, 200)])),
            cellsRun: Object.values(lowerings).reduce((n, l) => n + l.cellsRun, 0),
            mirrorDefects,
            lowerAgree: Object.values(lowerings).every(
                (l, _i, arr) => JSON.stringify(l.tally) === JSON.stringify(arr[0].tally),
            ),
        });
    }

    for (const name of universe.types) {
        const declared = candidateTypeNames.includes(name);
        if (!declared) {
            rows.push({
                name,
                kind: "type",
                status: "NO-PEER",
                narrowingRow: "CN-3",
                cellsRun: 0,
                mirrorDefects: 0,
                note: "not declared by the candidate's `.d.ts` — declared coverage narrowing (ledger CN-3)",
            });
            continue;
        }
        // The candidate RE-EXPORTS the frozen declaration, so the comparison is identity, asserted.
        const published = publishedDecls[name];
        rows.push({
            name,
            kind: "type",
            status: "COMPARED",
            cellsRun: 1,
            mirrorDefects: 0,
            members: published?.members?.length ?? 0,
            literals: published?.literals?.length ?? 0,
            note: "re-exported from the vendored sha-pinned 4.0.0 declaration — identical by construction, and the identity is what is asserted",
        });
    }

    const compared = rows.filter((r) => r.status === "COMPARED");
    const noPeer = rows.filter((r) => r.status === "NO-PEER");
    const mirrorDefects = rows.reduce((n, r) => n + r.mirrorDefects, 0);

    return {
        taxonomy: {
            ok: taxonomy.ok,
            authorityPath: taxonomy.authorityPath,
            extractedSha256: taxonomy.extractedSha256,
            classes: MIRROR_DEFECT_CLASSES.map((c) => `${c.letter} ${c.name}`),
            declaredNonDefects: DECLARED_NON_DEFECTS.map((d) => d.name),
        },
        oracle: {
            path: oracle.pin.path,
            bytes: oracle.pin.bytes,
            sha256: oracle.pin.sha256,
            npmIntegrity: oracle.pin.npmIntegrity,
            entrySha256: oracle.entrySha256,
            declarationSha256: oracle.declarationSha256,
            exports: oracle.exports.length,
        },
        corpus: {
            path: corpus.path,
            rows: corpus.rows.length,
            distinct: all.length,
            run: sources.length,
            unwrappedForFc3: corpus.unwrapped,
            rowsSha256: corpus.rowsSha256,
            rowsSha256Agrees: corpus.rowsSha256Agrees,
            bands: corpus.bands,
        },
        shape: shapeDeclaration(),
        universe: { runtime: universe.runtime.length, types: universe.types.length, total: universe.runtime.length + universe.types.length },
        tally: {
            rows: rows.length,
            compared: compared.length,
            noPeer: noPeer.length,
            mirrorDefects,
            specUndecided: rows.reduce((n, r) => n + (r.lowerings ? Math.max(...Object.values(r.lowerings).map((l) => l.specUndecided)) : 0), 0),
        },
        rows,
    };
};
