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

/** Every function head the candidate's dispatch registry carries, per entry family. */
export const DECLARED_HEADS = Object.freeze({
    color: Object.freeze(Object.keys(R_disp["color-head"].rows).sort()),
    timing: Object.freeze(Object.keys(R_disp["timing-head"].rows).sort()),
});

/** The union, for a question that does not care which entry is being asked. */
export const ALL_DECLARED_HEADS = Object.freeze(
    [...new Set([...DECLARED_HEADS.color, ...DECLARED_HEADS.timing])].sort(),
);

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
    source: "typescript/src/css/algebra/tables.mjs — R_disp and R_ctor, authored at X.P.W2 and committed before X.P.W3.d opened",
    declaredHeads: DECLARED_HEADS,
    declaredLiteralForms: DECLARED_LITERAL_FORMS,
    rule: "an input naming a function head that the entry's R_disp row set does not carry is OUTSIDE the declared shape (COVERAGE_NARROWING); everything else is INSIDE",
    families: Object.keys(DECLARED_HEADS).sort(),
});
