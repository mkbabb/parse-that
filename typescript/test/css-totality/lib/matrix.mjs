// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.a — THE 52-ROW MATRIX. One row per frozen export, each with a RUNNABLE assertion over a
// corpus that is not empty, so "coverage" is a count nobody can round up (`W3.md` §5 `.a`).
//
// THE LEGEND IS `coverage.md`'s, ASSERTED MECHANICALLY, NEVER APPLIED BY JUDGEMENT (G-1's own
// falsifier):
//   TOTAL    the candidate covers the row by NAME **and** SHAPE — every accept cell and every
//            reject cell passes, and both sets are NON-EMPTY.
//   PARTIAL  the name resolves but some cell fails, WITH WHAT FAILED NAMED.
//   ABSENT   no candidate peer resolves the name at all.
// A row whose assertion does not execute, or whose corpus is empty, CANNOT be TOTAL: `cellsRun`
// and the two counts are part of the verdict, not decoration.
//
// THE ORACLE IS THE PUBLISHED sha-PINNED 4.0.0 TARBALL, NEVER A SELF-AUTHORED ANSWER KEY
// (`W3.md` §3 prohibitions). The accept/reject partition of the union corpus is COMPUTED by running
// the published module: `ok:true` puts the input in the accept set, `ok:false` in the reject set,
// and a THROW puts it in the reject set as an R1-class row — because "R1–R5 … are held as
// spec-correct regression fixtures — the mirror preserves spec-correctness, never
// bug-compatibility" (`W3.md` §5 `.d`). Where `parser-band.md` adjudicates against the published
// reading, THE ADJUDICATION WINS and the input is marked as a declared divergence, never as a
// silent pick (`adjudications.mjs`).
//
// THREE FAMILIES, because the frozen surface has three shapes and pretending otherwise would let a
// row pass on a cell that never touched it:
//   parser      the nine `(source: string) => ParseResult<T>` entries — corpus-driven.
//   coercer     `coerceToSyntax(source, syntax)` — the corpus crossed with the syntax vocabulary
//               EXTRACTED FROM THE PUBLISHED MODULE'S OWN BYTES, never a hand-picked list.
//   structured  the two serializers and the seven collectors, whose inputs are the published
//               oracle's OWN OUTPUTS over the corpus, plus the seven declared degenerate values.

import { NINE_PUBLIC_PARSERS } from "../../../../harness/totality/lib/probes.mjs";

import { ADJUDICATIONS, adjudicationIndex } from "./adjudications.mjs";

export const TOTAL = "TOTAL";
export const PARTIAL = "PARTIAL";
export const ABSENT = "ABSENT";

/** The frozen 8-code union, read from the pinned `src/css/types.ts` rather than restated. */
export const frozenCodes = (typesText) => {
    const head = /export type ParseIssue = Readonly<\{\s*code:([\s\S]*?);/.exec(typesText);
    if (!head) throw new Error("matrix: ParseIssue's code union not found in the pinned types.ts");
    return [...head[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
};

/** The published module's own `<production>` vocabulary — `coerceToSyntax`'s second argument. */
export const syntaxVocabulary = (publishedJsText) => [
    ...new Set([...publishedJsText.matchAll(/"(<[a-z0-9-]+>)"/g)].map((m) => m[1])),
];

// ── frozen shape predicates ─────────────────────────────────────────────────

const isIssue = (issue, codes) =>
    issue !== null &&
    typeof issue === "object" &&
    codes.includes(issue.code) &&
    typeof issue.start === "number" &&
    typeof issue.end === "number" &&
    Array.isArray(issue.expected) &&
    issue.expected.every((e) => typeof e === "string") &&
    (issue.actual === null || typeof issue.actual === "string");

/** `ParseResult<T>` exactly as `src/css/types.ts:25-27` declares it. */
export const parseResultShape = (result, codes) => {
    if (result === null || typeof result !== "object") return `not an object: ${typeOf(result)}`;
    if (result.ok === true) {
        if (!("value" in result)) return "ok:true without `value`";
        if (!Array.isArray(result.diagnostics) || result.diagnostics.length !== 0)
            return "ok:true whose `diagnostics` is not the empty tuple";
        return null;
    }
    if (result.ok === false) {
        if (!Array.isArray(result.diagnostics) || result.diagnostics.length === 0)
            return "ok:false whose `diagnostics` is not a non-empty tuple";
        const bad = result.diagnostics.findIndex((d) => !isIssue(d, codes));
        if (bad >= 0) return `ok:false whose diagnostics[${bad}] is not a frozen ParseIssue`;
        return null;
    }
    return "`ok` is neither true nor false";
};

const typeOf = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

/** Structural equality over the plain data the frozen value types are made of. */
export const deepEqual = (a, b) => {
    if (Object.is(a, b)) return true;
    if (typeof a !== typeof b || a === null || b === null) return false;
    if (typeof a !== "object") return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    return ka.length === kb.length && ka.every((k, i) => k === kb[i] && deepEqual(a[k], b[k]));
};

// ── the oracle ──────────────────────────────────────────────────────────────

const call = (fn, ...args) => {
    try {
        return { threw: false, value: fn(...args) };
    } catch (error) {
        return {
            threw: true,
            why: `THREW ${error?.constructor?.name ?? "Error"}: ${String(error?.message ?? error).slice(0, 120)}`,
        };
    }
};

/**
 * Partition the union corpus for one parser by running the PUBLISHED module over it.
 * `verdict` is `"accept"` when the oracle says `ok:true`, `"reject"` when it says `ok:false` OR
 * throws (the R1 class — spec-correct rejection, never bug-compatibility), and an adjudicated input
 * takes the band's verdict instead, flagged `declared`.
 */
export const partition = (publishedFn, rows, index) => {
    const accept = [];
    const reject = [];
    for (const row of rows) {
        const adjudicated = index.get(row.s);
        const oracle = call(publishedFn, row.s);
        const oracleVerdict = oracle.threw
            ? "reject"
            : oracle.value?.ok === true
              ? "accept"
              : "reject";
        const verdict = adjudicated?.expected ?? oracleVerdict;
        const cell = {
            i: row.i,
            s: row.s,
            bands: row.bands,
            oracle: oracleVerdict,
            r1: oracle.threw,
            declared: adjudicated ? adjudicated.id : null,
            valueDiffers: Boolean(adjudicated?.valueDiffers),
            value: !oracle.threw && oracle.value?.ok === true ? oracle.value.value : undefined,
        };
        (verdict === "accept" ? accept : reject).push(cell);
    }
    return { accept, reject };
};

// ── the runtime rows ────────────────────────────────────────────────────────

const SAMPLE = 8;

const summarize = (cells) => ({
    count: cells.length,
    r1: cells.filter((c) => c.r1).length,
    declared: cells.filter((c) => c.declared).length,
    sample: cells.slice(0, SAMPLE).map((c) => c.s),
});

/**
 * One parser row. Every accept cell and every reject cell is executed against the candidate; a
 * failure is recorded with the input that produced it and classified in P-1's own vocabulary
 * (DIVERGENT_VALUE / MIS_ACCEPT / FALSE_REJECT_IN_SHAPE / THROW / SHAPE), so `.d`'s G-7 reads this
 * matrix's misses as mirror-defect candidates without re-deriving them.
 */
const runParserRow = (fn, sets, codes) => {
    const misses = [];
    let cellsRun = 0;
    for (const cell of sets.accept) {
        cellsRun += 1;
        const got = call(fn, cell.s);
        if (got.threw) {
            misses.push({ kind: "THROW", input: cell.s, why: got.why, declared: cell.declared });
            continue;
        }
        const shape = parseResultShape(got.value, codes);
        if (shape) {
            misses.push({ kind: "SHAPE", input: cell.s, why: shape, declared: cell.declared });
            continue;
        }
        if (got.value.ok !== true) {
            misses.push({
                kind: "FALSE_REJECT_IN_SHAPE",
                input: cell.s,
                why: `oracle accepts; candidate rejects with ${got.value.diagnostics[0]?.code}`,
                declared: cell.declared,
            });
            continue;
        }
        // The value check stands down ONLY for a row the band adjudicates as value-differing
        // (PB-03's 100× spelling disagreement, PB-04's missing clamp); a declared row that is not
        // value-differing keeps its check, so a declaration cannot be used to buy silence.
        if (cell.value !== undefined && !cell.valueDiffers && !deepEqual(got.value.value, cell.value)) {
            misses.push({
                kind: "DIVERGENT_VALUE",
                input: cell.s,
                why: `oracle ${JSON.stringify(cell.value).slice(0, 90)} vs candidate ${JSON.stringify(got.value.value).slice(0, 90)}`,
                declared: null,
            });
        }
    }
    for (const cell of sets.reject) {
        cellsRun += 1;
        const got = call(fn, cell.s);
        if (got.threw) {
            misses.push({ kind: "THROW", input: cell.s, why: got.why, declared: cell.declared });
            continue;
        }
        const shape = parseResultShape(got.value, codes);
        if (shape) {
            misses.push({ kind: "SHAPE", input: cell.s, why: shape, declared: cell.declared });
            continue;
        }
        if (got.value.ok !== false) {
            misses.push({
                kind: "MIS_ACCEPT",
                input: cell.s,
                why: "oracle rejects; candidate accepts",
                declared: cell.declared,
            });
        }
    }
    return { cellsRun, misses };
};

/** `coerceToSyntax(source, syntax)` — the corpus crossed with the published module's own vocabulary. */
const coercerPairs = (rows, vocabulary, denseBands) => {
    const pairs = [];
    for (const row of rows) {
        const dense = row.bands.some((b) => denseBands.includes(b));
        if (dense) for (const syntax of vocabulary) pairs.push({ s: row.s, syntax, bands: row.bands });
        else pairs.push({ s: row.s, syntax: vocabulary[row.i % vocabulary.length], bands: row.bands });
    }
    return pairs;
};

/** The oracle's partition of the coercer pairs — taken ONCE, then read by the candidate run. */
const coercerSets = (publishedFn, pairs) => {
    const accept = [];
    const reject = [];
    for (const pair of pairs) {
        const oracle = call(publishedFn, pair.s, pair.syntax);
        const wantAccept = !oracle.threw && oracle.value?.ok === true;
        const cell = {
            i: accept.length + reject.length,
            s: `${JSON.stringify(pair.s)} @ ${pair.syntax}`,
            source: pair.s,
            syntax: pair.syntax,
            bands: pair.bands,
            oracle: wantAccept ? "accept" : "reject",
            r1: oracle.threw,
            declared: null,
            value: wantAccept ? oracle.value.value : undefined,
        };
        (wantAccept ? accept : reject).push(cell);
    }
    return { accept, reject };
};

const runCoercerRow = (fn, sets, codes) => {
    const misses = [];
    let cellsRun = 0;
    for (const [wantAccept, cells] of [
        [true, sets.accept],
        [false, sets.reject],
    ]) {
        for (const cell of cells) {
            cellsRun += 1;
            const got = call(fn, cell.source, cell.syntax);
            if (got.threw) {
                misses.push({ kind: "THROW", input: cell.s, why: got.why, declared: null });
                continue;
            }
            const shape = parseResultShape(got.value, codes);
            if (shape) {
                misses.push({ kind: "SHAPE", input: cell.s, why: shape, declared: null });
                continue;
            }
            if (got.value.ok !== wantAccept) {
                misses.push({
                    kind: wantAccept ? "FALSE_REJECT_IN_SHAPE" : "MIS_ACCEPT",
                    input: cell.s,
                    why: `oracle ${wantAccept ? "accepts" : "rejects"}; candidate does not`,
                    declared: null,
                });
            }
        }
    }
    return { cellsRun, misses };
};

/**
 * The structured family. Inputs are the published oracle's OWN OUTPUTS over the corpus (accept
 * side) and the seven declared degenerate values (reject side). "Reject" here means TOTALITY OF
 * SHAPE — these exports do not return `ParseResult`, so the assertion is that a degenerate argument
 * produces a value of the declared shape instead of a throw, which is `W3.md` §2a's own criterion:
 * "no CSS string … makes the candidate parser do anything other than return a typed result".
 */
const STRUCTURED = {
    serializeCssColor: { source: "parseCssColor", shape: "result" },
    serializeTimelineOptions: { source: "collectTimelineOptions", shape: "object" },
    collectStyleRules: { source: "parseStylesheet", shape: "array" },
    collectKeyframes: { source: "parseStylesheet", shape: "array" },
    collectPropertyDescriptors: { source: "parseStylesheet", shape: "array" },
    collectCustomFunctions: { source: "parseStylesheet", shape: "array" },
    collectDeclarations: { source: "declarations", shape: "map" },
    collectAnimationOptions: { source: "declarations", shape: "array" },
    collectTimelineOptions: { source: "declarations", shape: "object" },
};

/** The seven declared degenerate values — `experiments/w2/corpus/r1.json`'s own boundary list. */
const degenerate = (boundary) =>
    boundary.map((b) => ({
        id: b.id,
        js: b.js,
        // eslint-disable-next-line no-new-func -- the seven literals come from the corpus's own file.
        value: Function(`"use strict"; return (${b.js});`)(),
    }));

const shapeOk = (kind, value) => {
    if (kind === "array") return Array.isArray(value) ? null : `not an array: ${typeOf(value)}`;
    if (kind === "map") return value instanceof Map ? null : `not a Map: ${typeOf(value)}`;
    if (kind === "object")
        return value !== null && typeof value === "object" ? null : `not an object: ${typeOf(value)}`;
    if (kind === "result")
        return value !== null && typeof value === "object" && "ok" in value
            ? null
            : `not a Result: ${typeOf(value)}`;
    return `unknown shape kind ${kind}`;
};

const runStructuredRow = (fn, spec, inputs, boundary) => {
    const misses = [];
    let cellsRun = 0;
    for (const input of inputs) {
        cellsRun += 1;
        const got = call(fn, input.value);
        if (got.threw) {
            misses.push({ kind: "THROW", input: input.label, why: got.why, declared: null });
            continue;
        }
        const bad = shapeOk(spec.shape, got.value);
        if (bad) misses.push({ kind: "SHAPE", input: input.label, why: bad, declared: null });
    }
    for (const bad of boundary) {
        cellsRun += 1;
        const got = call(fn, bad.value);
        if (got.threw) {
            misses.push({ kind: "THROW", input: `degenerate ${bad.js}`, why: got.why, declared: null });
            continue;
        }
        const wrong = shapeOk(spec.shape, got.value);
        if (wrong)
            misses.push({ kind: "SHAPE", input: `degenerate ${bad.js}`, why: wrong, declared: null });
    }
    return { cellsRun, misses };
};

/** Harvest the structured inputs the oracle itself produces over the corpus. */
const structuredInputs = (published, rows) => {
    const sheets = [];
    const declarations = [];
    const colors = [];
    const timelines = [];
    const seenSheet = new Set();
    const seenColor = new Set();
    for (const row of rows) {
        const sheet = call(published.parseStylesheet, row.s);
        if (!sheet.threw && sheet.value?.ok === true) {
            const key = JSON.stringify(sheet.value.value);
            if (!seenSheet.has(key) && seenSheet.size < 400) {
                seenSheet.add(key);
                sheets.push({ label: `parseStylesheet(${JSON.stringify(row.s).slice(0, 40)})`, value: sheet.value.value });
                const decls = call(published.collectStyleRules, sheet.value.value);
                if (!decls.threw) {
                    for (const collected of decls.value ?? []) {
                        const list = collected?.rule?.declarations;
                        if (Array.isArray(list) && list.length > 0 && declarations.length < 400) {
                            declarations.push({
                                label: `declarations of ${JSON.stringify(row.s).slice(0, 36)}`,
                                value: list,
                            });
                        }
                    }
                }
            }
        }
        const color = call(published.parseCssColor, row.s);
        if (!color.threw && color.value?.ok === true) {
            const key = JSON.stringify(color.value.value);
            if (!seenColor.has(key) && seenColor.size < 400) {
                seenColor.add(key);
                colors.push({ label: `parseCssColor(${JSON.stringify(row.s).slice(0, 40)})`, value: color.value.value });
            }
        }
    }
    for (const decl of declarations.slice(0, 200)) {
        const options = call(published.collectTimelineOptions, decl.value);
        if (!options.threw && options.value !== undefined) {
            timelines.push({ label: `collectTimelineOptions(${decl.label})`, value: options.value });
        }
    }
    return { parseStylesheet: sheets, declarations, parseCssColor: colors, collectTimelineOptions: timelines };
};

// ── the assembly ────────────────────────────────────────────────────────────

/**
 * Build all 52 rows. `assignability` is the compile's per-type reading (`assignability.mjs`);
 * when it is absent the 33 type rows are reported `PARTIAL` with "assignability compile not run",
 * never silently TOTAL.
 */
export const buildMatrix = ({ pin, corpus, candidate, declaredTypes, assignability, breadth }) => {
    const codes = frozenCodes(pin.typesText);
    const index = adjudicationIndex();
    const vocabulary = syntaxVocabulary(pin.publishedJsText);
    const rows = corpus.rows;
    const boundary = degenerate(corpus.boundary);
    const structured = structuredInputs(pin.published, rows);

    const runtimeRows = pin.universe.exports
        .filter((e) => e.kind === "runtime")
        .map((entry) => {
            const signature = pin.signatures[entry.name] ?? null;
            const base = {
                name: entry.name,
                kind: "runtime",
                slice: entry.slice,
                arity: signature?.arity ?? null,
                signature: signature ? `${signature.form}(${signature.params.join(", ")})` : null,
                assertion: `typescript/test/css-totality/universe.test.ts :: runtime row \`${entry.name}\``,
            };

            const family = NINE_PUBLIC_PARSERS.includes(entry.name)
                ? "parser"
                : entry.name === "coerceToSyntax"
                  ? "coercer"
                  : "structured";

            // The corpus is built for EVERY row, present or absent: a row that is ABSENT today must
            // become measurable the instant a peer lands, without this file moving.
            let sets;
            if (family === "parser") {
                sets = partition(pin.published[entry.name], rows, index);
            } else if (family === "coercer") {
                const pairs = coercerPairs(rows, vocabulary, ["r1", "ground-a", "named"]);
                sets = coercerSets(pin.published[entry.name], pairs);
            } else {
                const spec = STRUCTURED[entry.name];
                const inputs = structured[spec.source] ?? [];
                sets = {
                    accept: inputs.map((i, n) => ({ i: n, s: i.label, bands: ["oracle-output"], oracle: "accept", r1: false, declared: null })),
                    reject: boundary.map((b, n) => ({ i: n, s: `degenerate ${b.js}`, bands: ["boundary"], oracle: "reject", r1: false, declared: null })),
                    inputs,
                };
            }

            const row = {
                ...base,
                family,
                accept: summarize(sets.accept),
                reject: summarize(sets.reject),
            };

            const fn = candidate.namespace?.[entry.name];
            if (typeof fn !== "function") {
                return {
                    ...row,
                    verdict: ABSENT,
                    cellsRun: 0,
                    missing: [
                        candidate.namespace === null
                            ? "no candidate namespace was loaded"
                            : `no candidate peer resolves \`${entry.name}\` on ${candidate.entry}`,
                    ],
                    misses: [],
                };
            }

            let result;
            if (family === "parser") result = runParserRow(fn, sets, codes);
            else if (family === "coercer") result = runCoercerRow(fn, sets, codes);
            else result = runStructuredRow(fn, STRUCTURED[entry.name], sets.inputs, boundary);

            // The dominant miss SHAPES, so `.d` inherits a class list rather than 4,000 rows. The
            // signature is purely descriptive — the miss kind and the input's leading function head
            // — and adjudicating those classes is `.d`'s act, never this seat's.
            const heads = {};
            for (const miss of result.misses) {
                const head = /^\s*(?:")?([a-z][\w-]*)\(/i.exec(miss.input)?.[1] ?? "(other)";
                const key = `${miss.kind}:${head}`;
                heads[key] = (heads[key] ?? 0) + 1;
            }
            const missClasses = Object.entries(heads)
                .sort((x, y) => y[1] - x[1])
                .slice(0, 14)
                .map(([signature, n]) => ({ signature, count: n }));

            const corpusEmpty = row.accept.count === 0 || row.reject.count === 0;
            const verdict =
                result.misses.length === 0 && result.cellsRun > 0 && !corpusEmpty ? TOTAL : PARTIAL;
            const byKind = {};
            for (const miss of result.misses) byKind[miss.kind] = (byKind[miss.kind] ?? 0) + 1;

            return {
                ...row,
                verdict,
                cellsRun: result.cellsRun,
                missing: [
                    ...(corpusEmpty ? ["accept or reject corpus is EMPTY — cannot be TOTAL"] : []),
                    ...Object.entries(byKind).map(([kind, n]) => `${kind} ×${n}`),
                ],
                missClasses,
                misses: result.misses.slice(0, 12),
                missesTotal: result.misses.length,
            };
        });

    const typeRows = pin.universe.exports
        .filter((e) => e.kind === "type")
        .map((entry) => {
            const reading = assignability?.rows?.[entry.name] ?? null;
            const declared = declaredTypes.includes(entry.name);
            const base = {
                name: entry.name,
                kind: "type",
                slice: entry.slice,
                arity: null,
                assertion: `typescript/test/css-totality/generated/assignability.generated.ts :: \`${entry.name}\` (both directions)`,
                accept: { count: 1, r1: 0, declared: 0, sample: [`${entry.name} (candidate → frozen)`] },
                reject: { count: 1, r1: 0, declared: 0, sample: [`${entry.name} (frozen → candidate)`] },
                family: "type",
            };
            if (!reading) {
                return {
                    ...base,
                    verdict: PARTIAL,
                    cellsRun: 0,
                    missing: ["the assignability compile was not run — no reading exists for this row"],
                    misses: [],
                    missesTotal: 0,
                };
            }
            if (!declared) {
                return {
                    ...base,
                    verdict: ABSENT,
                    cellsRun: reading.cellsRun,
                    missing: ["the candidate's declaration surface does not export this frozen type name"],
                    misses: reading.errors.slice(0, 4),
                    missesTotal: reading.errors.length,
                };
            }
            return {
                ...base,
                verdict: reading.errors.length === 0 && reading.cellsRun === 2 ? TOTAL : PARTIAL,
                cellsRun: reading.cellsRun,
                missing: reading.errors.map((e) => `${e.code}: ${e.message}`),
                misses: reading.errors.slice(0, 4),
                missesTotal: reading.errors.length,
            };
        });

    const all = [...runtimeRows, ...typeRows];
    const tally = (list) => ({
        TOTAL: list.filter((r) => r.verdict === TOTAL).length,
        PARTIAL: list.filter((r) => r.verdict === PARTIAL).length,
        ABSENT: list.filter((r) => r.verdict === ABSENT).length,
    });

    return {
        rows: all,
        aggregate: tally(all),
        runtimeTally: tally(runtimeRows),
        typeTally: tally(typeRows),
        declaredObservations: observeDeclared(pin.published, candidate.namespace),
        breadth,
        vocabulary,
        codes,
    };
};

/**
 * The MEASURED halves of every declared divergence: what the incumbent does, what the candidate
 * does, and whether the candidate honours the adjudication. `.d` writes its ledger rows from this —
 * `W3.md` §5 `.d` demands "input · incumbent result · candidate result · spec citation ·
 * adjudication · the direction of behaviour change for a consumer", and the first three are
 * measurements, never recollections.
 */
export const observeDeclared = (published, namespace) =>
    ADJUDICATIONS.flatMap((row) =>
        row.inputs.map((input) => {
            const fn = published[row.parser];
            const peer = namespace?.[row.parser];
            const incumbent = call(fn, input);
            const candidate = peer ? call(peer, input) : null;
            const want = row.expectByInput?.[input] ?? row.expect;
            const got = candidate === null || candidate.threw ? null : candidate.value?.ok === true ? "accept" : "reject";
            return {
                id: row.id,
                g6: row.g6 ?? null,
                input,
                adjudication: row.ruling,
                expected: want,
                incumbent: incumbent.threw
                    ? { threw: true, why: incumbent.why }
                    : { ok: incumbent.value?.ok === true, value: incumbent.value?.ok === true ? incumbent.value.value : undefined, code: incumbent.value?.ok === false ? incumbent.value.diagnostics[0]?.code : undefined },
                candidate:
                    candidate === null
                        ? { absent: true }
                        : candidate.threw
                          ? { threw: true, why: candidate.why }
                          : { ok: candidate.value?.ok === true, value: candidate.value?.ok === true ? candidate.value.value : undefined, code: candidate.value?.ok === false ? candidate.value.diagnostics[0]?.code : undefined },
                honoured: candidate === null ? null : got === want,
                divergesFromIncumbent: row.divergesFromIncumbent,
                specCitation: row.specCitation,
                citation: row.citation,
                consumerDirection: row.consumerDirection,
            };
        }),
    );
