// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.c — THE PUBLIC ENTRY: THE R1 THROW CLASS, DEAD BY CONSTRUCTION.
//
// `W3.md` §2c names R1 — the shipping crash `parseCssColor("oklch()")` — as this wave's NAMED
// ENEMY and gives it to this unit. §5 `.c` gives the unit three cures and ONE file to put them in,
// "because they share the entry module and splitting them would put two writers on one file". This
// is that module. Everything a consumer of the candidate calls goes through it.
//
// WHAT "TOTAL" MEANS HERE, from §2a: `ParseResult<T>` is
//     { ok: true,  value, diagnostics: [] }
//   | { ok: false,        diagnostics: [ParseIssue, ...ParseIssue[]] }
// "a function that throws has not failed to be fast, it has failed to have the type it declares".
// So there are exactly two lawful returns, and `undefined` is neither — parse-that's `.parse()`
// returning `undefined` on failure (O-15 PT-07) is indistinguishable from a successful `undefined`
// and is the second half of the same defect.
//
// ── THE THREE CURES, in the order a call meets them ────────────────────────────────────────────
//
//  (2) THE JS BOUNDARY, PLACED ABOVE THE GRAMMAR (§5 `.c` item 2 · O-15 PT-07 · G-3 boundary leg).
//      `null`, `undefined`, a number, an object, an array, a boolean, `NaN`, a symbol, a bigint, a
//      function — every non-string argument returns `ok:false` with `css_syntax` and `actual: null`,
//      never a raw `TypeError`. It is the FIRST statement of every public entry, before any lowering
//      is touched, because the raw algebra is NOT total for a non-string: `js-alg.mjs:259` reaches
//      `sg.src.slice(...)` and throws `TypeError: sg.src.slice is not a function` (measured by this
//      seat over the raw path). Placing the guard above the grammar is what makes that unreachable
//      rather than caught. This is OUR invariant above parse-that and explicitly NOT an ask to them
//      — O-15 says so in the letter's own "what is NOT in this letter".
//
//  (3) THE BOUNDS (§5 `.c` item 3 · §3 item 6 · G-9 depth leg · cand-O debt 3). The one lazy
//      back-edge carries an explicit depth bound, so stack exhaustion is an ordinary `ok:false`
//      with a frozen code instead of PT-04's thrown `RangeError` at 7,762. `bounds.mjs` declares
//      the value; `assertDepthBound` is run HERE, at construction, against the lowering that is
//      about to be published — a bound the mechanism does not carry halts the module load rather
//      than shipping an entry whose declared limit is decorative.
//
//  (1) THE SHIELD (§5 `.c` item 1). cand-O's outer guard is RETAINED — and only as a PROVEN
//      NON-LOAD-BEARING shield. Read this next paragraph before reading the `try` below, because
//      G-3's falsifier is explicit that "catching the throw at the call site and re-shaping it is
//      NOT a cure — a masking fallback fails the gate by inspection of the entry module".
//
//      The distinction the gate draws is between a catch that MAKES the surface total and a catch
//      that CANNOT FIRE. Here the totality is bought by the two structural cures above plus `.b`'s
//      closed union; the shield covers only "a genuine defect in the combinator graph" (cand-O's
//      own words, `cand-o/index.ts:18-23`), and its deadness is not asserted — it is MEASURED, by
//      cand-O's own instrument, which the band requires to survive: the RAW path (`lowering.parse`,
//      which carries no `try`/`catch` at all — `lowering-js/index.mjs:7`, DM-4) is run over the
//      whole corpus and must never throw on its own. This seat's reading, over the union of `.a`'s
//      26,604-row and `.b`'s 685-row corpora (26,785 distinct sources) × 3 entries × 2 lowerings:
//      **160,710 raw calls, 0 throws**. `SHIELD.caught` is published on this module's own surface
//      so the count is re-derivable by any reader at any time, and the boundary suite asserts it is
//      0 after the whole corpus has gone through the PUBLIC entries as well.
//
//      THE DISSENT IS RECORDED, not resolved. cand-F holds that a shield converts an impossible bug
//      into a silent `ok:false` and ships without one (`parser-band.md`, try/catch posture). §5 `.c`
//      states the condition under which that position becomes tenable — "if `.c` lands the depth
//      bound below" — and it is landed. **Removal is therefore a live option for X.P.W4 and is NOT
//      a decision of this seat**, which is the spec's own sentence and is followed literally.
//
// ── WHAT THIS MODULE DOES NOT DO ───────────────────────────────────────────────────────────────
//
//   * It does not stub the public entries the grammar does not carry. The candidate realizes
//     `P:color`, `P:timing-function`, `P:stylesheet` and — since X.P.W3.h — `P:scalar`, `P:value`
//     and `P:values`; `parseKeyframeSelector`, `parseAnimationTimeline` and `parseAnimationRange`
//     have no production. Answering them with a stub rejection would emit codes no grammar raises
//     and would be the masking fallback `.b` refused for the same reason (`X-P-W3.md` b.5 E-1).
//     The gap is a wave-level row (`.a`'s F-a.6), not a hole to paper here.
//
// ── THE TWO COMPOSITIONS (X.P.W3.h · COHESION §0s E-h3) ────────────────────────────────────────
//
//   `coerceToSyntax(source, syntax)` and `serializeCssColor(color)` are the two frozen runtime
//   exports that are not parsers. Both are SURFACE COMPOSITIONS here — over `parseCssValue` for the
//   first, over a `CssColor` for the second — and neither reaches a lowering on its own: a
//   descriptor is not CSS text and a colour is not a source, so neither has a production, and a
//   production for either would be a grammar for a non-language. The two codes the coercer emits,
//   `syntax_descriptor_invalid` and `syntax_mismatch`, are members of the frozen eight (§3a: never
//   a ninth), selected through `codes.mjs`; the descriptor's own alternatives are its `expected`
//   list — dynamic, and lawful by the ruling. The descriptor vocabulary and the serializer's
//   arithmetic are the incumbent's own (`src/css/syntax.ts`, `src/css/grammar.ts` at the pin),
//   transcribed rather than approximated, because a consumer reads their output as text.
//   * It does not widen the `ParseIssue` union. Every code below is `selectCode`'d out of `.b`'s
//     frozen eight; a ninth is a contract change that halts the wave (`W3.md` §3a).
//   * It does not catch anything from the incumbent. Nothing in this file imports, wraps, or
//     re-shapes `@mkbabb/value.js`.

import {
    assertCapacityBounds, assertDepthBound, CAPACITY, CAPACITY_LABELS, CLASS3_PROOF, DEPTH_BOUND, DEPTH_CODE, DEPTH_PRODUCTION, THETA,
} from "./bounds.mjs";
import { selectCode } from "./codes.mjs";
import { boundaryIssue, PRODUCTION_LABELS } from "./diagnostics.mjs";
import { makeRecoveryLowering } from "./lower.mjs";

/* ── the published surface, declared ────────────────────────────────────────────────────────── */

/**
 * The three public entries the candidate realizes, each bound to the grammar production it parses
 * and to the named production its diagnostics carry. The names are value.js's own frozen barrel
 * names (`src/css/index.ts`), so a consumer swapping the incumbent for the candidate changes an
 * import specifier and nothing else.
 */
export const PUBLIC_ENTRIES = Object.freeze([
    Object.freeze({ name: "parseCssColor", production: "P:color", label: "<color>" }),
    Object.freeze({ name: "parseTimingFunction", production: "P:timing-function", label: "<timing-function>" }),
    Object.freeze({ name: "parseStylesheet", production: "P:stylesheet", label: "<stylesheet>" }),
    // X.P.W3.h — the value grammar's three (`algebra/grammar/value.mjs`)
    Object.freeze({ name: "parseCssScalar", production: "P:scalar", label: "<scalar>" }),
    Object.freeze({ name: "parseCssValue", production: "P:value", label: "<value>" }),
    Object.freeze({ name: "parseCssValues", production: "P:values", label: "<value-list>" }),
]);

/**
 * The three frozen runtime parsers the candidate does NOT realize, named rather than omitted. An
 * absence a reader has to discover is the shape §11 guardrail 2 warns about — the universe quietly
 * narrowed to what the candidate happens to cover. (Six until X.P.W3.h landed `P:scalar`,
 * `P:value` and `P:values`.)
 */
export const UNREALIZED_ENTRIES = Object.freeze([
    "parseKeyframeSelector",
    "parseAnimationTimeline",
    "parseAnimationRange",
]);

/* ── the two compositions (X.P.W3.h, E-h3) — the incumbent's own tables, transcribed ───────── */

/** `syntax.ts` SYNTAX_COMPONENTS — the thirteen `<production>` components a descriptor may name. */
const SYNTAX_COMPONENTS = Object.freeze([
    "<angle>", "<color>", "<custom-ident>", "<flex>", "<integer>", "<length>", "<length-percentage>",
    "<number>", "<percentage>", "<resolution>", "<time>", "<transform-function>", "<transform-list>",
]);
/** `syntax.ts` LENGTH_UNITS — the forty-nine. */
const LENGTH_UNITS = Object.freeze([
    "cap", "ch", "cm", "cqb", "cqh", "cqi", "cqmax", "cqmin", "cqw",
    "dvb", "dvh", "dvi", "dvmax", "dvmin", "dvw", "em", "ex", "ic", "in",
    "lh", "lvb", "lvh", "lvi", "lvmax", "lvmin", "lvw", "mm", "pc", "pt",
    "px", "q", "rcap", "rch", "rem", "rex", "ric", "rlh", "svb", "svh",
    "svi", "svmax", "svmin", "svw", "vb", "vh", "vi", "vmax", "vmin", "vw",
]);
/** `syntax.ts` TRANSFORM_FUNCTIONS — the twenty-one. */
const TRANSFORM_FUNCTIONS = Object.freeze([
    "matrix", "matrix3d", "perspective", "rotate", "rotate3d", "rotatex",
    "rotatey", "rotatez", "scale", "scale3d", "scalex", "scaley", "scalez",
    "skew", "skewx", "skewy", "translate", "translate3d", "translatex",
    "translatey", "translatez",
]);
const ANGLE_UNITS = Object.freeze(["deg", "grad", "rad", "turn"]);
const RESOLUTION_UNITS = Object.freeze(["dpi", "dpcm", "dppx", "x"]);
/** `syntax.ts` `<custom-ident>`'s exclusions — the CSS-wide keywords, matched case-insensitively. */
const CSS_WIDE_KEYWORDS = /^(?:initial|inherit|unset|revert|revert-layer|default)$/i;

/** The named production a rejected DESCRIPTOR names — the composition's own, above the algebra. */
export const SYNTAX_DESCRIPTOR_PRODUCTION = "<syntax-descriptor> (a '|'-separated list of '*' and supported <production> components)";

/** `syntax.ts` syntaxAlternatives: the `|`-split, trimmed alternatives, or null. */
const syntaxAlternatives = (syntax) => {
    if (typeof syntax !== "string") return null;
    const alternatives = syntax.split("|").map((part) => part.trim());
    return alternatives.length > 0 && alternatives.every((part) => part === "*" || SYNTAX_COMPONENTS.includes(part))
        ? alternatives
        : null;
};

const numericOf = (value) => (value.kind === "scalar" && value.payload.type === "number" ? value.payload : null);
const isTransformCall = (value) => value.kind === "call" && TRANSFORM_FUNCTIONS.includes(value.name.toLowerCase());

/** `syntax.ts` matchesSyntax, component by component. */
function matchesSyntax(value, component) {
    if (component === "*") return true;
    if (component === "<color>") return value.kind === "scalar" && value.payload.type === "color";
    if (component === "<custom-ident>") {
        return value.kind === "scalar" && value.payload.type === "keyword" && !CSS_WIDE_KEYWORDS.test(value.payload.value);
    }
    if (component === "<transform-function>") return isTransformCall(value);
    if (component === "<transform-list>") {
        return isTransformCall(value)
            || (value.kind === "list" && value.separator === "space" && value.items.length > 0 && value.items.every(isTransformCall));
    }
    const token = numericOf(value);
    if (!token) return false;
    const unit = token.unit.toLowerCase();
    switch (component) {
        case "<number>": return unit === "";
        case "<integer>": return unit === "" && Number.isInteger(token.value);
        case "<percentage>": return unit === "%";
        case "<length>": return LENGTH_UNITS.includes(unit);
        case "<length-percentage>": return unit === "%" || LENGTH_UNITS.includes(unit);
        case "<angle>": return ANGLE_UNITS.includes(unit);
        case "<time>": return unit === "s" || unit === "ms";
        case "<resolution>": return RESOLUTION_UNITS.includes(unit);
        case "<flex>": return unit === "fr";
        default: return false;
    }
}

/**
 * A rejection SPANNING THE SOURCE with a frozen code and a named expectation list — the shape the
 * incumbent's `failure(source, code, expected)` answers. `actual` is the Π idiom: the source, or
 * `null` when it is empty. Every code goes through `selectCode`; a non-member is `undefined` and
 * the diagnostic below would fail `.b`'s shape predicate, which is the proof there is no ninth.
 */
const sourceIssue = (source, code, expected) =>
    Object.freeze({
        code: selectCode(code),
        start: 0,
        end: source.length,
        expected: Object.freeze(expected.slice()),
        actual: source === "" ? null : source,
    });

/**
 * `coerceToSyntax(source, syntax)` over ONE `parseCssValue`: the descriptor first (an invalid one is
 * `syntax_descriptor_invalid` over the whole source — the source is what the caller handed in and
 * the descriptor is not CSS text, so it has no span of its own), then the parse (its own
 * rejection, untouched), then the match (a value no alternative admits is `syntax_mismatch`, and
 * its `expected` is the descriptor's own alternatives — the incumbent's, and E-h3's).
 */
const coercerOver = (parseValue) => (source, syntax) => {
    if (!isSource(source)) return BOUNDARY_RESULT;
    const alternatives = syntaxAlternatives(syntax);
    if (alternatives === null) {
        return Object.freeze({ ok: false, diagnostics: Object.freeze([sourceIssue(source, "syntax_descriptor_invalid", [SYNTAX_DESCRIPTOR_PRODUCTION])]) });
    }
    const value = parseValue(source);
    if (!value.ok) return value;
    return alternatives.some((alternative) => matchesSyntax(value.value, alternative))
        ? value
        : Object.freeze({ ok: false, diagnostics: Object.freeze([sourceIssue(source, "syntax_mismatch", alternatives)]) });
};

/** The thirteen frozen `CssColorSpace` members (`types.ts`), the serializer's domain. */
const CSS_COLOR_SPACES = Object.freeze([
    "rgb", "hsl", "hwb", "lab", "lch", "oklab", "oklch", "xyz",
    "srgb-linear", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020",
]);

/** `model.ts` isAnyColor, restricted to the thirteen: three channels, each a number or `none`. */
const isCssColor = (value) => {
    if (!value || typeof value !== "object") return false;
    if (typeof value.space !== "string" || !CSS_COLOR_SPACES.includes(value.space)) return false;
    if (!Array.isArray(value.channels) || value.channels.length !== 3) return false;
    if (value.alpha !== "none" && typeof value.alpha !== "number") return false;
    return value.channels.every((channel) => channel === "none" || typeof channel === "number");
};

/** `grammar.ts` format / angle / alphaSuffix — the incumbent's own text, digit for digit. */
const format = (value) => (value === "none" ? value : Number(value.toFixed(12)).toString());
const angle = (value) => (value === "none" ? value : `${format(value)}deg`);
const percent = (value) => (value === "none" ? value : `${format(value * 100)}%`);
const alphaSuffix = (alpha) => (alpha === 1 ? "" : ` / ${alpha === "none" ? "none" : `${format(alpha * 100)}%`}`);
const colorErr = (code) => Object.freeze({ ok: false, error: Object.freeze({ code }) });

/**
 * `serializeCssColor(color)` — `Result<string, ColorIssue>` (`ok`/`err`, not `ParseResult`): a
 * value that is not one of the thirteen frozen colours is `color_invalid_input`, a non-finite
 * channel or alpha `color_non_finite`, an alpha outside [0, 1] `color_out_of_range`; otherwise the
 * incumbent's own serialization (`grammar.ts` serializeCssColor at the pin). The `ColorIssue` codes
 * are the incumbent's `Result` vocabulary, not `ParseIssue`'s — this function's declared type.
 */
export function serializeCssColor(color) {
    if (!isCssColor(color)) return colorErr("color_invalid_input");
    if (color.channels.some((channel) => channel !== "none" && !Number.isFinite(channel))
        || (color.alpha !== "none" && !Number.isFinite(color.alpha))) {
        return colorErr("color_non_finite");
    }
    if (color.alpha !== "none" && (color.alpha < 0 || color.alpha > 1)) return colorErr("color_out_of_range");
    const [a, b, c] = color.channels;
    const alpha = alphaSuffix(color.alpha);
    const ok = (value) => Object.freeze({ ok: true, value });
    switch (color.space) {
        case "rgb": return ok(`rgb(${format(a)} ${format(b)} ${format(c)}${alpha})`);
        case "hsl": return ok(`hsl(${angle(a)} ${percent(b)} ${percent(c)}${alpha})`);
        case "hwb": return ok(`hwb(${angle(a)} ${percent(b)} ${percent(c)}${alpha})`);
        case "lab": return ok(`lab(${a === "none" ? a : `${format(a)}%`} ${format(b)} ${format(c)}${alpha})`);
        case "lch": return ok(`lch(${a === "none" ? a : `${format(a)}%`} ${format(b)} ${angle(c)}${alpha})`);
        case "oklab": return ok(`oklab(${percent(a)} ${format(b)} ${format(c)}${alpha})`);
        case "oklch": return ok(`oklch(${percent(a)} ${format(b)} ${angle(c)}${alpha})`);
        case "xyz": return ok(`color(xyz ${format(a)} ${format(b)} ${format(c)}${alpha})`);
        default: return ok(`color(${color.space} ${format(a)} ${format(b)} ${format(c)}${alpha})`);
    }
}

/* ── cure (2): the JS boundary, above the grammar ───────────────────────────────────────────── */

/**
 * The one result every non-string argument gets. Built from `.b`'s `boundaryIssue()` so the code,
 * the span, the named production and `actual: null` come from the union's own authority and not
 * from a second hand-written literal (the OR05 shape at one remove, `W3.md` §11 item 3).
 *
 * Frozen and shared: a consumer cannot mutate the diagnostics of the next caller's rejection.
 */
const BOUNDARY_RESULT = Object.freeze({
    ok: false,
    diagnostics: Object.freeze([boundaryIssue()]),
});

/** The predicate, written once. `typeof` and nothing else — no coercion, no `String(source)`. */
const isSource = (source) => typeof source === "string";

/* ── cure (1): the shield, and the ledger that keeps it honest ──────────────────────────────── */

const caught = [];

/**
 * THE SHIELD LEDGER, on the public surface. If the shield ever fires, the fault is recorded with
 * the entry, the source and the error's own constructor and message — a shield that swallowed a
 * defect silently would be worse than no shield, and this is what stops it being silent.
 *
 * `caught` is the number G-3's proof leg asserts is 0. It is a live count, never reset: a reset
 * would let a suite arrange a zero, which is the "silent re-pin" §3 prohibits.
 */
export const SHIELD = Object.freeze({
    get caught() {
        return caught.length;
    },
    faults: () => caught.map((f) => ({ ...f })),
});

const shieldIssue = (label, source) =>
    Object.freeze({
        code: selectCode("css_syntax"),
        start: 0,
        end: source.length,
        expected: Object.freeze([PRODUCTION_LABELS[label]]),
        actual: source === "" ? null : source,
    });

/* ── the entry factory ──────────────────────────────────────────────────────────────────────── */

/**
 * The public surface over ONE lowering. Both targets are published by the same bytes, so G-5's
 * dual-target identity cannot be broken by this layer — only by the lowerings, which is the only
 * place a difference would mean anything (`.b`'s lower.mjs makes the same argument for the
 * projection, and this module inherits it rather than restating the mechanism).
 *
 * Construction, in order: `.b`'s recovery projection (which itself proves the closed operator set,
 * the lowering signature and the built graph's code closure), then this seat's depth bound. Each is
 * a HALT at construction; none is a parse-path arm.
 */
export function makePublicSurface(lowering) {
    const recovery = makeRecoveryLowering(lowering);
    const bound = assertDepthBound(lowering);
    //  (4) THE CAPACITIES (X.P.W3.f, COHESION §0p/§0q): the nine fixed regions, each read back off
    //  this lowering's Θ and off the label surface, and the class-3 proof — at construction, a HALT.
    const capacity = assertCapacityBounds(lowering);

    const available = recovery.entries();
    const surface = { kind: lowering.kind, bound, capacity, theta: THETA };

    for (const row of PUBLIC_ENTRIES) {
        if (!available.includes(row.production)) {
            throw new Error(
                `HALT: the '${lowering.kind}' lowering does not carry '${row.production}', which '${row.name}' ` +
                    `publishes — available [${available.join(", ")}]. A public entry over an absent production ` +
                    `would have to answer with a stub, and a stub rejection is a masking fallback (W3.md §6 G-3).`,
            );
        }

        // Constructed ONCE, here. `.b`'s `entry(prod)` halts on a production the grammar does not
        // name; running that halt at construction is what keeps it off every call's path, so no
        // `throw` of any kind is reachable from the returned function.
        const inner = recovery.entry(row.production);

        surface[row.name] = (source) => {
            // (2) THE BOUNDARY — first, above the grammar, before the lowering is touched.
            if (!isSource(source)) return BOUNDARY_RESULT;

            // (3) THE BOUNDS are already carried by Θ, asserted above at construction.
            try {
                return inner(source);
            } catch (fault) {
                // (1) THE SHIELD. Proven dead over the corpus; recorded loud if it ever fires.
                caught.push({
                    entry: row.name,
                    kind: lowering.kind,
                    source,
                    error: fault instanceof Error ? fault.constructor.name : typeof fault,
                    message: fault instanceof Error ? fault.message : String(fault),
                });
                return Object.freeze({ ok: false, diagnostics: Object.freeze([shieldIssue(row.label, source)]) });
            }
        };
    }

    // X.P.W3.h — the two compositions, on the surface: the coercer over THIS lowering's
    // `parseCssValue` (so both targets answer through their own value grammar), the serializer as
    // the one lowering-independent function it is.
    surface.coerceToSyntax = coercerOver(surface.parseCssValue);
    surface.serializeCssColor = serializeCssColor;

    surface.entries = () => PUBLIC_ENTRIES.map((row) => row.name);
    surface.unrealized = () => UNREALIZED_ENTRIES.slice();
    surface.raw = (prod, source) => recovery.probe(prod, source);
    return Object.freeze(surface);
}

/** Both public surfaces, over the declared adapter. Dynamic, so a JS consumer never builds Wasm. */
export async function loadPublicSurfaces() {
    const { lowerings } = await import("./harness-adapter.mjs");
    return Object.freeze({ js: makePublicSurface(lowerings.js), wasm: makePublicSurface(lowerings.wasm) });
}

/* ── the shipped entries: the JS target, by name ────────────────────────────────────────────── */

const { makeJsLowering } = await import("./lowering-js/index.mjs");

/** The JS target's public surface — the one `build/ac1.js` names and a consumer imports. */
export const js = makePublicSurface(makeJsLowering());

export const parseCssColor = js.parseCssColor;
export const parseTimingFunction = js.parseTimingFunction;
export const parseStylesheet = js.parseStylesheet;
export const parseCssScalar = js.parseCssScalar;
export const parseCssValue = js.parseCssValue;
export const parseCssValues = js.parseCssValues;
export const coerceToSyntax = js.coerceToSyntax;

export { CAPACITY, CAPACITY_LABELS, CLASS3_PROOF, DEPTH_BOUND, DEPTH_CODE, DEPTH_PRODUCTION };
