// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — THE CANDIDATE'S DECLARED SHAPE, READ FROM THE GRAMMAR'S OWN REGISTRY.
//
// The P-1 taxonomy this wave inherits (`harness/equivalence/taxonomy.ts`, carried verbatim from
// `apotheosis/parser-proof/equivalence.md` §1) defines its third RED trigger as
//     "(C) FALSE_REJECT_IN_SHAPE — C14 rejects an input unambiguously valid within C14's *own*
//      declared W0 shape"
// and its first declared NON-defect as
//     "COVERAGE_NARROWING (C14 declines an input *outside* its declared shape that the live
//      superset accepts) is **not** a defect — `status.json` declares it".
//
// Both sentences turn on the words "its own declared shape", so a differential that does not state
// the shape cannot classify a single rejection. THE DANGER IS OBVIOUS AND IS THE REASON THIS FILE
// EXISTS: a shape written AFTER the measurement is a description of the result, and W1.md §6 G-2's
// own falsifier names that move — "widen the taxonomy (reclassify a MIS_ACCEPT as
// COVERAGE_NARROWING) and the count goes to zero for the wrong reason".
//
// SO NOTHING HERE IS HAND-LISTED. The shape is READ, mechanically, out of the candidate grammar's
// own registry — `R_disp` (the dispatch rows: which function heads exist at all) and the grammar's
// declared entries — which were authored at X.P.W2, committed before this seat opened, and are not
// in this unit's writable set. This file cannot widen the shape; it can only report it. If a head
// is missing from `R_disp`, the candidate genuinely does not carry that function, and that is a
// coverage fact with a commit date, not a classification convenience.
//
// The one thing this file adds is the READING of an input: which head, if any, an input names. That
// is a lexical question ("does this string begin `ident(`?"), answered with one regular expression
// over the input, and it is deliberately INDEPENDENT of both parsers — asking either engine what an
// input "is" would make the classification circular.

import { R_ctor, R_disp } from "../../../src/css/algebra/tables.mjs";

/**
 * Every function head the candidate's dispatch registry carries, per entry family. This is the
 * CANDIDATE's own declaration, and it is kept for the evidence record — never as the denominator.
 */
export const CANDIDATE_HEADS = Object.freeze({
    color: Object.freeze(Object.keys(R_disp["color-head"].rows).sort()),
    timing: Object.freeze(Object.keys(R_disp["timing-head"].rows).sort()),
});

/**
 * **F-z2 — THE DENOMINATOR IS THE ORACLE'S, NOT THE CANDIDATE'S.**
 *
 * Reading the shape out of `R_disp` made the candidate the author of its own coverage: a head it
 * never implemented was absent from the registry, so every input naming that head fell OUTSIDE the
 * declared shape and left the mirror-defect count untouched. A parser that implemented nothing
 * would have declared an empty shape and scored a perfect mirror. That is the "self-serving
 * denominator" F-z2 names, and no amount of mechanical reading of the WRONG table cures it.
 *
 * So the shape is MEASURED ON THE ORACLE, over the pinned surface and the sha-asserted corpus: a
 * head is inside the declared shape for a family when the ORACLE ACCEPTS at least one corpus input
 * naming it. The reading needs no list and no engine's opinion of what an input "is" — it is the
 * incumbent's own behaviour, counted. A head the incumbent never accepts anywhere in the universe
 * asks nothing of the candidate; every other head does, whether or not `R_disp` carries a row for
 * it, and a rejection there is a mirror-defect with the incumbent's acceptance as its witness.
 */
export const oracleHeads = (publishedFn, rows) => {
    const byFamily = { color: new Set(), timing: new Set() };
    const ask = {
        color: publishedFn("parseCssColor"),
        timing: publishedFn("parseTimingFunction"),
    };
    for (const [family, fn] of Object.entries(ask)) {
        if (typeof fn !== "function") continue;
        for (const row of rows) {
            const head = headOf(row.s);
            if (head === null || byFamily[family].has(head)) continue;
            let accepted = false;
            try {
                accepted = fn(row.s)?.ok === true;
            } catch {
                accepted = false;
            }
            if (accepted) byFamily[family].add(head);
        }
    }
    return Object.freeze({
        color: Object.freeze([...byFamily.color].sort()),
        timing: Object.freeze([...byFamily.timing].sort()),
    });
};

/**
 * The live denominator. `installOracleHeads` is called once per run, by the differential, with the
 * pinned surface and the corpus; until it is, `DECLARED_HEADS` is EMPTY and every function call is
 * therefore inside the shape — the conservative direction, which counts differences rather than
 * excusing them. A denominator that defaulted to the candidate's registry could be left installed
 * by accident and would excuse silently, which is the defect this whole file guards.
 */
let installed = null;
export const installOracleHeads = (publishedFn, rows) => {
    installed = oracleHeads(publishedFn, rows);
    return installed;
};
export const DECLARED_HEADS = new Proxy(
    {},
    {
        get: (_t, family) => (installed ? installed[family] : undefined),
        ownKeys: () => (installed ? Object.keys(installed) : []),
        getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    },
);

/**
 * The union, for a question that does not care which entry is being asked. A FUNCTION, not a
 * constant: the shape is measured on the oracle when the run installs it, and a constant computed
 * at module load would freeze the empty pre-installation reading.
 */
export const allDeclaredHeads = () =>
    Object.freeze([...new Set([...(DECLARED_HEADS.color ?? []), ...(DECLARED_HEADS.timing ?? [])])].sort());

/**
 * The non-functional colour forms the grammar's constructor registry names: hex in its four
 * widths, the named-colour table, `transparent`, and the context keyword. Read from `R_ctor` rather
 * than listed, for the same reason as the heads.
 */
export const DECLARED_LITERAL_FORMS = Object.freeze(
    Object.keys(R_ctor)
        .filter((k) => k.startsWith("hex") || k === "named-color" || k === "transparent" || k === "context")
        .sort(),
);

/** `rgb(1 2 3)` → `rgb`; `#ff0` → null; `red` → null; `  lab( 1 )` → `lab`. Lexical, engine-free. */
const HEAD = /^[\s]*([A-Za-z_][A-Za-z0-9_-]*)\s*\(/;

export const headOf = (source) => {
    if (typeof source !== "string") return null;
    const m = HEAD.exec(source);
    return m ? m[1].toLowerCase() : null;
};

/**
 * IS THIS INPUT INSIDE THE CANDIDATE'S DECLARED SHAPE, for the entry being asked?
 *
 * Exactly one rule, and it is a rule about the FUNCTION HEAD only:
 *   * the input names a function head the entry's dispatch registry does not carry → OUTSIDE;
 *   * anything else → INSIDE.
 *
 * Everything that is not a function call — a hex literal, a bare identifier, a stylesheet, a
 * degenerate string, an empty string — is INSIDE the declared shape, and deliberately so. The
 * candidate claims to be a `<color>` parser; declining `#ff0` would be a defect and not a coverage
 * fact, and a shape rule that let it become one would be the widening this file exists to prevent.
 */
export const inDeclaredShape = (family, source) => {
    const head = headOf(source);
    if (head === null) return { inShape: true, head: null, why: "not a function call — inside the declared shape by default" };
    const heads = DECLARED_HEADS[family];
    if (!heads) return { inShape: true, head, why: `no dispatch registry for family '${family}'` };
    if (heads.includes(head)) return { inShape: true, head, why: `'${head}' is a declared ${family} head` };
    return {
        inShape: false,
        head,
        why: `'${head}()' is named by no row of R_disp['${family}-head'] — the candidate carries [${heads.join(", ")}]`,
    };
};

/** The entry-family of each public entry name, for callers that hold entry names rather than families. */
export const ENTRY_FAMILY = Object.freeze({
    parseCssColor: "color",
    parseTimingFunction: "timing",
    parseStylesheet: "stylesheet",
});

/** The shape declaration, as a printable record — published in the evidence so a reader can audit it. */
export const shapeDeclaration = () => ({
    source: "MEASURED ON THE ORACLE (F-z2): the pinned value.js 4.0.0 surface over the sha-asserted corpus — a head is declared when the INCUMBENT accepts at least one input naming it",
    declaredHeads: installed ?? { color: [], timing: [] },
    candidateHeads: CANDIDATE_HEADS,
    declaredLiteralForms: DECLARED_LITERAL_FORMS,
    rule: "an input naming a function head the ORACLE accepts nowhere in the corpus is OUTSIDE the declared shape (COVERAGE_NARROWING); everything else is INSIDE, whether or not the candidate's R_disp carries a row for it",
    families: installed ? Object.keys(installed).sort() : [],
});
