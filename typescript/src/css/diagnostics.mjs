// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.b — THE LABEL SURFACE: NAMED PRODUCTIONS, AVAILABLE UNARMED (`W3.md` §6 G-8).
//
// O-15 PT-01, measured against the published parse-that dist: `label` is a NO-OP unless diagnostics
// are armed, and arming couples an unconditional `console.error` — the two are reachable only
// together (`parse/parser.ts:66-68` in this root's own library: `if (isDiagnosticsEnabled())
// console.error(...)`). `parser-band.md` debt 1 adds the value.js side: cand-O's `never` arm yields
// an opaque `(?!)` expectation where cand-F yields a NAME.
//
// The cure G-8 names is "a label surface that never depended on arming", so this module has NO ARM.
// There is no switch to set, no policy to read and no logger to install: the expectations are a
// pure function of the labels σ already carries, and they are therefore available on every rejection
// with parse-that's diagnostics tier untouched and silent.
//
// THE TABLE IS TOTAL AND INJECTIVE OVER `L`, asserted at load:
//   * TOTAL — every label the algebra can raise has a named production; a label with no row would be
//     an unnamed expectation (D-1), which is the `(?!)` defect under another spelling;
//   * INJECTIVE — two labels never collapse onto one production, so promotion never loses the
//     distinction the grammar drew ('deg' and 'grad' stay distinguishable);
//   * every value is a NAMED PRODUCTION in cand-F's own idiom — an angle-bracketed production name,
//     optionally followed by a human-readable clarifier, transcribed from `cand-f/color.ts:528`
//     ("<hex-color> (3, 4, 6 or 8 digits)") and `:609` ("<string source>").
//
// Order is meaning (G-5 compares `expected` WITHOUT sorting, because a diagnostic's expectation
// order is part of its meaning), so promotion preserves σ's order exactly and adds nothing.

import { L } from "./algebra/tables.mjs";
import { difference, isFrozenCode, selectCode } from "./codes.mjs";

/**
 * BND-1's code, taken THROUGH the selection table and authenticated at load — so the one code this
 * module names is a member of the frozen union by the same mechanism as every other, and not by a
 * literal nobody checked.
 */
const BOUNDARY_CODE = selectCode("css_syntax");
if (!isFrozenCode(BOUNDARY_CODE)) {
    throw new Error("HALT: BND-1's code is not a member of the frozen ParseIssue union.");
}

/** cand-F's idiom: the label OPENS with an angle-bracketed production name. */
const NAMED_PRODUCTION = /^<[^<>]+>/;

/** G-8's predicate, applied mechanically rather than by reading the label and judging it. */
export const isNamedProduction = (label) => typeof label === "string" && NAMED_PRODUCTION.test(label);

/**
 * Every label of `L`, in `L`'s own order, with the named production it is promoted to. An identity
 * row means the algebra already named a production; the other rows are the ones cand-O's surface
 * left unnamed (a byte class, a bare literal, a prose guard).
 */
export const PRODUCTION_LABELS = Object.freeze({
    /* byte classes (`R_cls`) */
    whitespace: "<whitespace>",
    ident: "<ident>",
    "<digit>": "<digit>",
    "<hex-digit>": "<hex-digit>",
    "any-but-paren": "<balanced-tail-text> (any character but '(' or ')')",
    "any-but-brace-or-semi": "<qualified-rule-prelude> (any character but '{', '}' or ';')",
    "any-but-semi-or-close": "<error-recovery-text> (any character but ';' or '}')",
    "any-but-brace-close": "<block-text> (any character but '}')",

    /* keyword tables (`R_kw`) */
    "<named-color>": "<named-color>",
    "'transparent'": "<named-color> ('transparent')",
    "<context-color>": "<context-color>",
    "'none'": "<none-keyword> ('none')",
    "<timing-keyword>": "<timing-keyword>",
    "<step-alias>": "<step-alias>",
    "<jump-position>": "<jump-position>",

    /* dispatch tables (`R_disp`) */
    "<color-function>": "<color-function>",
    "<timing-function>": "<timing-function>",

    /* constructor guards (`R_ctor`) */
    "<finite-number>": "<finite-number>",
    "context-free color": "<context-free-color> (a context colour has no value outside a computed style)",
    "x1 in [0,1]": "<cubic-bezier-x1> (a number in [0,1])",
    "x2 in [0,1]": "<cubic-bezier-x2> (a number in [0,1])",
    "<integer> >= 1": "<integer> >= 1",
    "jump-none needs >= 2": "<steps-count> (at least 2 when the position is 'jump-none')",
    "<linear-stop-list>": "<linear-stop-list>",
    "<linear-stop>": "<linear-stop>",
    "<qualified-rule>": "<qualified-rule>",
    "<declaration>": "<declaration>",
    "<color>": "<color>",
    "<stylesheet>": "<stylesheet>",

    /* the sites the slice's FAIL / EXPECT / END name */
    "end of input": "<end-of-input>",
    "<number>": "<number>",
    "nesting <= 64": "<nesting-depth> (at most 64 levels)",
    "'('": "<open-paren>",
    "')'": "<close-paren>",
    "','": "<comma>",
    "'/'": "<slash>",
    "'%'": "<percent-sign>",
    "'#'": "<number-sign>",
    "';'": "<semicolon>",
    "':'": "<colon>",
    "'{'": "<open-brace>",
    "'}'": "<close-brace>",
    "'!'": "<exclamation-mark>",
    "'deg'": "<angle-unit> ('deg')",
    "'grad'": "<angle-unit> ('grad')",
    "'rad'": "<angle-unit> ('rad')",
    "'turn'": "<angle-unit> ('turn')",
    "'important'": "<important-flag> ('!important')",
    "<declaration-value>": "<declaration-value>",
    rule: "<qualified-rule-recovery>",
    "<string>": "<string source>", //                        BND-1's one label (§5.8), cand-f/color.ts:609

    /* the capacity bounds (X.P.W3.f, COHESION §0q E-f1) — the `nesting <= 64` row's own form, one
       per fixed region of the Wasm memory model; both lowerings raise them at their boundary */
    "input <= 14107": "<input-window> (at most 14107 code units)",
    "marks <= 32768": "<mark-journal> (at most 32768 marks)",
    "recoveries <= 4096": "<recovery-journal> (at most 4096 recoveries)",
    "D <= 4096": "<diagnostic-journal> (at most 4096 diagnostics)",
    "C <= 65536": "<complement-journal> (at most 65536 entries)",
    "P <= 65536": "<provenance-journal> (at most 65536 entries)",
    "vstack <= 65536": "<value-stack> (at most 65536 slots)",
    "arena <= 7208960": "<arena> (at most 7208960 bytes)",
    "expsnap <= 32": "<expectation-snapshots> (at most 32 frames)",

    /* X.P.W3.h — the value grammar's labels (`algebra/grammar/value.mjs`), in L's own appended
       order: the classes, the operator table, `color()`'s space table, the constructor guards,
       the three entries' EXPECT sites and the three `LIT`s a quoted string's escape reads */
    "token boundary": "<token-boundary> (whitespace, ',', '/', ':', ';', ')' or the end of input)",
    "ident start": "<ident-start> (a letter, '_' or '-'; never a digit)",
    "<unit>": "<unit>",
    "<operator>": "<operator>",
    "double quote": "<double-quote> ('\"')",
    "single quote": "<single-quote> (\"'\")",
    "string text": "<string-text> (any character but the closing quote or '\\')",
    "<color-space>": "<color-space> (srgb, srgb-linear, display-p3, a98-rgb, prophoto-rgb, rec2020, xyz, xyz-d50 or xyz-d65)",
    "concrete xyz-d50": "<xyz-d50-channel> (a number; 'none' cannot be adapted to D65)",
    "<function-arguments>": "<function-arguments> (none for sibling-index()/sibling-count(); at least one otherwise, except --*, scroll() and view())",
    "<value-list>": "<value-list>",
    "<value>": "<value>",
    "<scalar>": "<scalar>",
    "'\\'": "<backslash>",
    "'\"'": "<double-quote>",
    "'''": "<single-quote>",
});

/** Both set-differences against `L`, injectivity, and the named-production predicate — at load. */
export function assertLabelSurfaceClosed() {
    const rows = Object.keys(PRODUCTION_LABELS);
    const unlabelled = difference(L, rows);
    const orphan = difference(rows, L);
    if (unlabelled.length > 0 || orphan.length > 0) {
        throw new Error(
            `HALT: the label surface is not closed over L. unnamed=[${unlabelled.join(" · ")}] ` +
                `orphan=[${orphan.join(" · ")}] — an expectation with no named production is D-1's unnamed ` +
                `expectation, which is the '(?!)' defect under another spelling.`,
        );
    }
    const values = Object.values(PRODUCTION_LABELS);
    const unnamed = values.filter((v) => !isNamedProduction(v));
    if (unnamed.length > 0) {
        throw new Error(`HALT: ${unnamed.length} promoted label(s) are not named productions: ${unnamed.join(" · ")}`);
    }
    if (new Set(values).size !== values.length) {
        const collisions = values.filter((v, i) => values.indexOf(v) !== i);
        throw new Error(`HALT: the promotion is not injective — [${[...new Set(collisions)].join(" · ")}] is reached twice.`);
    }
    return { labels: rows.length, identityRows: rows.filter((r) => PRODUCTION_LABELS[r] === r).length };
}

export const LABEL_SURFACE = Object.freeze(assertLabelSurfaceClosed());

/** One label, promoted. A raw label outside `L` has no row and returns `undefined` — never a guess. */
export const promoteLabel = (raw) => PRODUCTION_LABELS[raw];

/**
 * σ's expectation list, promoted in place. Order is preserved (it is meaning); duplicates are
 * dropped, which the injectivity assertion makes a no-op on distinct raw labels.
 */
export function promoteExpected(labels) {
    const out = [];
    for (const raw of labels) {
        const named = promoteLabel(raw);
        if (!out.includes(named)) out.push(named);
    }
    return out;
}

/**
 * BND-1's issue (`W3.md` §5 `.c` item 2, §6 G-3): a non-string argument is `ok:false` with a frozen
 * code and a named expectation, never a raw `TypeError`. It is AUTHORED HERE, once, so the public
 * entry `.c` owns and this lowering answer with the same bytes rather than two constructions that
 * can drift — the group-2 → group-3 lock stated at the wave record's P.1.
 */
export const boundaryIssue = () =>
    Object.freeze({
        code: BOUNDARY_CODE,
        start: 0,
        end: 0,
        expected: Object.freeze([PRODUCTION_LABELS["<string>"]]),
        actual: null,
    });
