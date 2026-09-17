// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.a — THE RUNNER. Coverage becomes a number this file prints, over the
// exact surface value.js ships.
//
// `coverage.md`'s legend, reproduced exactly:
//
//   TOTAL    the candidate covers the item by NAME AND SHAPE
//   PARTIAL  present but narrower — WITH WHAT IS MISSING NAMED
//   ABSENT   no candidate peer
//
// Two limbs, and both must hold for TOTAL:
//   NAME   the symbol resolves on the candidate (runtime: the module
//          namespace; type: the declaration surface), directly or through the
//          candidate's own declared peer map.
//   SHAPE  runtime — every derived/declared breadth cell passes, and a THROW
//          is a shape violation, never a skip (the R1 contract:
//          `(source: string) => ParseResult<T>` is TOTAL BY CONSTRUCTION, so a
//          parser that throws has already failed its shape).
//          type — the frozen member set and literal set are covered.
//
// A candidate that is present but satisfies NO cell is PARTIAL, not ABSENT:
// ABSENT is reserved for "no peer at all", which is what `coverage.md` means
// by it. The distinction is load-bearing — it is the difference between
// "unimplemented" and "narrower than the contract".

import { readTypeDeclarations } from "./surface.mjs";
import { NINE_PUBLIC_PARSERS, nonParserProbes, parserCells } from "./probes.mjs";

export const TOTAL = "TOTAL";
export const PARTIAL = "PARTIAL";
export const ABSENT = "ABSENT";

/**
 * Run one breadth cell. A throw is CAUGHT AND RECORDED as a failed cell —
 * this is the measurement the R1 probe itself performs (a ParseResult-returning
 * parser must not throw), not a defect being swallowed. The throw is named in
 * the miss list and surfaces in the report's own throw column.
 */
const runCell = (fn, cell) => {
    try {
        const result = fn(cell.input);
        const verdict = cell.check(result);
        return { id: cell.id, provenance: cell.provenance, ...verdict, threw: false };
    } catch (error) {
        return {
            id: cell.id,
            provenance: cell.provenance,
            pass: false,
            threw: true,
            why: `THREW ${error?.constructor?.name ?? "Error"}: ${error?.message ?? error}`,
        };
    }
};

const runProbe = (probe, namespace) => {
    try {
        return { ...probe(namespace), threw: false };
    } catch (error) {
        return {
            pass: false,
            threw: true,
            why: `THREW ${error?.constructor?.name ?? "Error"}: ${error?.message ?? error}`,
        };
    }
};

const verdictFromCells = (cells) => {
    const passed = cells.filter((c) => c.pass).length;
    if (cells.length === 0) return PARTIAL;
    if (passed === cells.length) return TOTAL;
    return PARTIAL;
};

/** Classify the 19 runtime exports of the frozen surface. */
const classifyRuntime = (surface, variants, namespace, peers) => {
    const cells = parserCells(variants);
    const probes = nonParserProbes(variants);
    const rows = [];

    for (const entry of surface.exports.filter((e) => e.kind === "runtime")) {
        const peer = peers[entry.name] ?? entry.name;
        const fn = namespace === null ? undefined : namespace[peer];

        if (typeof fn !== "function") {
            rows.push({
                ...entry,
                peer: namespace === null ? null : peer,
                verdict: ABSENT,
                missing: ["no candidate peer resolves this name"],
                cells: [],
                threw: 0,
            });
            continue;
        }

        const own = cells[entry.name];
        const results = own
            ? own.map((cell) => runCell((input) => fn(input), cell))
            : [
                  {
                      id: "shape",
                      provenance: "DECLARED — frozen result shape, members derived from src/css/types.ts",
                      ...runProbe(probes[entry.name], namespace),
                  },
              ];

        rows.push({
            ...entry,
            peer,
            verdict: verdictFromCells(results),
            missing: results.filter((r) => !r.pass).map((r) => `${r.id} — ${r.why}`),
            cells: results,
            threw: results.filter((r) => r.threw).length,
        });
    }
    return rows;
};

/** Classify the 33 type exports of the frozen surface. */
const classifyTypes = (surface, variants, declarationText) => {
    const declared = declarationText === null ? {} : readTypeDeclarations(declarationText);
    return surface.exports
        .filter((e) => e.kind === "type")
        .map((entry) => {
            const peer = declared[entry.name];
            if (peer === undefined) {
                return {
                    ...entry,
                    verdict: ABSENT,
                    missing: [
                        declarationText === null
                            ? "candidate exposes no declaration surface"
                            : "the frozen type name is not exported by the candidate",
                    ],
                };
            }
            const wantMembers = variants.members[entry.name] ?? [];
            const wantLiterals = variants.literals[entry.name] ?? [];
            const missingMembers = wantMembers.filter((m) => !peer.members.includes(m));
            const missingLiterals = wantLiterals.filter((l) => !peer.literals.includes(l));
            const missing = [
                ...missingMembers.map((m) => `member \`${m}\``),
                ...missingLiterals.map((l) => `variant "${l}"`),
            ];
            return {
                ...entry,
                verdict: missing.length === 0 ? TOTAL : PARTIAL,
                missing,
            };
        });
};

const tally = (rows) => ({
    TOTAL: rows.filter((r) => r.verdict === TOTAL).length,
    PARTIAL: rows.filter((r) => r.verdict === PARTIAL).length,
    ABSENT: rows.filter((r) => r.verdict === ABSENT).length,
});

/**
 * Classify all 52 for one candidate, reporting per-slice AND in aggregate.
 *
 * Per-slice is TWO cuts, because the lane reads it two ways:
 *   moduleSlices  the barrel's own slices — grammar / syntax / timeline /
 *                 stylesheet / types
 *   parserSlices  the NINE public parsers, each on its own row. The parser
 *                 band: the probe "targets ALL nine public parsers, so the
 *                 colour wave discharges only its slice and the probe stays
 *                 wired until the whole surface is total."
 */
export const classify = ({ surface, variants, candidate, namespace, declarationText }) => {
    const runtime = classifyRuntime(surface, variants, namespace, candidate.peers ?? {});
    const types = classifyTypes(surface, variants, declarationText);
    const all = [...runtime, ...types];

    const moduleSlices = {};
    for (const row of all) {
        moduleSlices[row.slice] ??= [];
        moduleSlices[row.slice].push(row);
    }

    const parserSlices = NINE_PUBLIC_PARSERS.map((name) => {
        const row = runtime.find((r) => r.name === name);
        return {
            name,
            verdict: row?.verdict ?? ABSENT,
            cellsPassed: row?.cells.filter((c) => c.pass).length ?? 0,
            cellsTotal: row?.cells.length ?? 0,
            threw: row?.threw ?? 0,
            missing: row?.missing ?? [],
        };
    });

    return {
        candidate: {
            id: candidate.id,
            role: candidate.role,
            what: candidate.what,
            notWhat: candidate.notWhat,
            runtimeModule: candidate.runtimeModule,
        },
        aggregate: tally(all),
        runtimeTally: tally(runtime),
        typeTally: tally(types),
        moduleSlices: Object.fromEntries(
            Object.entries(moduleSlices).map(([slice, rows]) => [
                slice,
                { count: rows.length, ...tally(rows) },
            ]),
        ),
        parserSlices,
        throws: runtime.reduce((n, r) => n + r.threw, 0),
        rows: all,
    };
};

/**
 * The kf seam column — a VIEW over the 52's verdicts, restricted to the 37
 * symbols keyframes consumes. Never merged into the aggregate; the runner
 * prints it under its own heading and `derive.mjs` asserts the separation.
 */
export const kfSeamColumn = (classified, seams) => {
    if (!seams.available) {
        return { available: false, reason: seams.reason, TOTAL: 0, PARTIAL: 0, ABSENT: 0, rows: [] };
    }
    const byName = new Map(classified.rows.map((r) => [r.name, r]));
    const rows = seams.symbols.map((s) => ({
        name: s.name,
        uses: s.uses,
        frozen: byName.has(s.name),
        verdict: byName.get(s.name)?.verdict ?? ABSENT,
    }));
    return { available: true, ...tally(rows), count: rows.length, rows };
};
