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

import { JUMP_POSITIONS, R_kw, TIMING_KEYWORDS } from "./algebra/tables.mjs";
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
    // X.P.W3.i — the animation family's three (`algebra/grammar/animation.mjs`)
    Object.freeze({ name: "parseKeyframeSelector", production: "P:keyframe-selector", label: "<keyframe-selector>" }),
    Object.freeze({ name: "parseAnimationTimeline", production: "P:animation-timeline", label: "<animation-timeline>" }),
    Object.freeze({ name: "parseAnimationRange", production: "P:animation-range", label: "<animation-range>" }),
]);

/**
 * The frozen runtime parsers the candidate does NOT realize, named rather than omitted. An absence a
 * reader has to discover is the shape §11 guardrail 2 warns about — the universe quietly narrowed to
 * what the candidate happens to cover. Six until X.P.W3.h landed `P:scalar`, `P:value` and
 * `P:values`; three until X.P.W3.i landed the animation family; NONE now — all nine frozen parsers
 * of `src/css/index.ts` are published above, over a production of the one authored grammar.
 */
export const UNREALIZED_ENTRIES = Object.freeze([]);

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

/* ── X.P.W3.i — the animation family's three STRUCTURED exports ─────────────────────────────── */
//
// `collectAnimationOptions(declarations)`, `collectTimelineOptions(declarations)` and
// `serializeTimelineOptions(options)` are the family's non-parsers: their argument is a VALUE, not
// CSS text, and their answer is a `CSSAnimationOptions[]` / `CSSTimelineOptions` / a property
// record. They are SURFACE COMPOSITIONS here for the reason `coerceToSyntax` and
// `serializeCssColor` are (X.P.W3.h, COHESION §0s E-h3): a grammar for a non-language would be a
// grammar for nothing. The two collectors read the incumbent's own vocabulary
// (`src/css/rules.ts`, `src/css/stylesheet.ts` at pin `6aca8602`, and the sha-pinned 4.0.0
// tarball's `$e` / `tt` / `ot`), transcribed rather than approximated, because a consumer reads
// their output as data.
//
// TOTALITY OF SHAPE IS THE LAW HERE, not totality of parse (`W3.md` §2a, and G-1's structured
// family): these do not return `ParseResult`, so a degenerate argument must produce a value OF THE
// DECLARED SHAPE — an array, an object — and never a throw. The oracle throws on all seven declared
// degenerate values (`undefined`, `null`, `42`, `{}`, `[]`, `true`, `NaN` reach `for (… of …)` and
// `Object.keys`); this surface answers the empty array / the empty record, which is BND-1's posture
// one layer up and not a caught throw: nothing below is entered.
//
// TWO DECLARED DIVERGENCES, named rather than discovered:
//   SV-1  the oracle's value serializer THROWS a `TypeError` on a colour CSS cannot spell, and
//         `collectTimelineOptions` calls it unguarded. Here it answers `undefined`, which the
//         callers already treat as "no such declaration" — the R1 class refused at the boundary,
//         exactly as `W3.md` §5 `.d` holds R1–R5 as spec-correct rather than bug-compatible.
//   SV-2  the incumbent's `splitTopLevel` cuts at JS `/\s/` (Unicode whitespace); this transcription
//         keeps that spelling, because it is a STRING function here and not a grammar — the WS-1
//         class of `grammar/animation.mjs` is about the algebra's `ws` class and does not reach it.

/** `grammar.ts` splitTopLevel, transcribed: top-level parts, trimmed, empties dropped. */
const splitTopLevel = (source, separator) => {
    const parts = [];
    let depth = 0;
    let quote = "";
    let start = 0;
    for (let i = 0; i < source.length; i++) {
        const char = source.charAt(i);
        if (quote) {
            if (char === quote && source[i - 1] !== "\\") quote = "";
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }
        if (char === "(") depth++;
        else if (char === ")") depth--;
        else if (depth === 0 && (separator === "space" ? /\s/.test(char) : char === separator)) {
            const part = source.slice(start, i).trim();
            if (part) parts.push(part);
            if (separator === "space") while (/\s/.test(source[i + 1] ?? "")) i++;
            start = i + 1;
        }
    }
    const tail = source.slice(start).trim();
    if (tail) parts.push(tail);
    return parts;
};

const isRecord = (value) => value !== null && typeof value === "object";
const commaItems = (value) => (value?.kind === "list" && value.separator === "comma" ? value.items : [value]);
const spaceItems = (value) => (value?.kind === "list" && value.separator === "space" ? value.items : [value]);
const scalarKeyword = (value) => (value?.kind === "scalar" && value.payload?.type === "keyword" ? value.payload.value : undefined);
const scalarNumber = (value, units = [""]) => {
    if (value?.kind !== "scalar" || value.payload?.type !== "number") return undefined;
    const unit = String(value.payload.unit ?? "").toLowerCase();
    if (!units.includes(unit)) return undefined;
    return unit === "ms" ? value.payload.value / 1000 : value.payload.value;
};
const folded = (value) => (typeof value === "string" ? value.toLowerCase() : undefined);

const DIRECTIONS = ["normal", "reverse", "alternate", "alternate-reverse"];
const FILL_MODES = ["none", "forwards", "backwards", "both"];
const PLAY_STATES = ["running", "paused"];
const COMPOSITIONS = ["replace", "add", "accumulate"];
const CSS_WIDE = ["initial", "inherit", "unset", "revert", "revert-layer"];
const TIMELINE_AXES = ["block", "inline", "x", "y"];
const SCROLLERS = ["nearest", "root", "self"];
const TRIGGER_TYPES = ["once", "repeat", "alternate", "state"];
const OPTION_PROPERTIES = [
    "animation-name", "animation-duration", "animation-delay", "animation-iteration-count",
    "animation-direction", "animation-fill-mode", "animation-play-state",
    "animation-timing-function", "animation-composition",
];
const CASCADE_PROPERTIES = [...OPTION_PROPERTIES, "animation-timeline"];

/** `rules.ts` timingFunctionValue — the four `CssTimingFunction` kinds, over the frozen tables. */
function timingFunctionValue(value) {
    const word = folded(scalarKeyword(value));
    if (word && TIMING_KEYWORDS.includes(word)) return { kind: "keyword", name: word };
    if (word === "step-start" || word === "step-end") {
        return { kind: "steps", count: 1, position: word === "step-start" ? "jump-start" : "jump-end" };
    }
    if (value?.kind !== "call" || !Array.isArray(value.args)) return undefined;
    const name = String(value.name ?? "").toLowerCase();
    if (name === "cubic-bezier") {
        const values = value.args.map((argument) => scalarNumber(argument));
        if (values.length !== 4 || values.some((item) => item === undefined)) return undefined;
        const [x1, y1, x2, y2] = values;
        return x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1 ? { kind: "cubic-bezier", x1, y1, x2, y2 } : undefined;
    }
    if (name === "steps") {
        const [countArgument] = value.args;
        if (countArgument === undefined || value.args.length > 2) return undefined;
        const count = scalarNumber(countArgument);
        const authored = folded(scalarKeyword(value.args[1]));
        //  the row's OWN table, read by key — `Object.prototype` is unreachable (`np()` in tables.mjs)
        const position = authored === undefined ? "jump-end" : JUMP_POSITIONS[R_kw["jump-position"].rows[authored]];
        if (position === undefined) return undefined;
        return count !== undefined && Number.isInteger(count) && count > 0 && !(position === "jump-none" && count < 2)
            ? { kind: "steps", count, position }
            : undefined;
    }
    if (name !== "linear" || value.args.length < 2) return undefined;
    const stops = [];
    for (const argument of value.args) {
        const tokens = spaceItems(argument);
        const [outputToken, ...rest] = tokens;
        if (outputToken === undefined || tokens.length > 3) return undefined;
        const output = scalarNumber(outputToken);
        if (output === undefined) return undefined;
        const input = [];
        for (const token of rest) {
            const position = scalarNumber(token, ["%"]);
            if (position === undefined) return undefined;
            input.push(position / 100);
        }
        stops.push({ output, input });
    }
    return { kind: "linear-function", stops };
}

const animationNameValue = (value) => {
    const name = scalarKeyword(value);
    if (!name) return undefined;
    return CSS_WIDE.includes(name.toLowerCase()) ? undefined : name;
};

/** `rules.ts` timelineValue / timelineList — a timeline read off a PARSED value, not off text. */
function timelineValue(value) {
    const word = scalarKeyword(value);
    const lower = folded(word);
    if (lower === "auto" || lower === "none") return { kind: lower };
    if (word?.startsWith("--")) return { kind: "name", name: word };
    if (value?.kind !== "call" || !Array.isArray(value.args)) return undefined;
    const name = String(value.name ?? "").toLowerCase();
    const args = value.args.flatMap((argument) => spaceItems(argument));
    if (name === "scroll") {
        const result = { kind: "scroll" };
        for (const argument of args) {
            const token = folded(scalarKeyword(argument));
            if (SCROLLERS.includes(token ?? "") && result.scroller === undefined) result.scroller = token;
            else if (TIMELINE_AXES.includes(token ?? "") && result.axis === undefined) result.axis = token;
            else return undefined;
        }
        return result;
    }
    if (name !== "view") return undefined;
    const result = { kind: "view" };
    const inset = [];
    for (const argument of args) {
        const token = folded(scalarKeyword(argument));
        if (TIMELINE_AXES.includes(token ?? "") && result.axis === undefined) result.axis = token;
        else if (argument?.kind === "scalar" && argument.payload?.type === "number" && argument.payload.unit) {
            inset.push(`${argument.payload.value}${argument.payload.unit}`);
        } else return undefined;
    }
    if (inset.length > 2) return undefined;
    if (inset[0]) result.inset = inset[1] ? { start: inset[0], end: inset[1] } : { start: inset[0] };
    return result;
}
const timelineList = (value) => {
    const values = commaItems(value).map(timelineValue);
    return values.every((item) => item !== undefined) ? values : undefined;
};

/** `rules.ts` animationArm / expandAnimationShorthand — the `animation` shorthand, component-wise. */
const keywordValue = (value) => ({ kind: "scalar", payload: { type: "keyword", value } });
const numberValue = (value, unit) => ({ kind: "scalar", payload: { type: "number", value, unit } });
const listValue = (items) => (items.length === 1 && items[0] !== undefined ? items[0] : { kind: "list", separator: "comma", items: [...items] });

function animationArm(value) {
    const tokens = spaceItems(value);
    if (tokens.length === 0 || (value?.kind === "list" && value.separator !== "space")) return undefined;
    const arm = {};
    for (const token of tokens) {
        const time = scalarNumber(token, ["s", "ms"]);
        if (time !== undefined) {
            if (!arm.duration) {
                if (time < 0) return undefined;
                arm.duration = token;
            } else if (!arm.delay) arm.delay = token;
            else return undefined;
            continue;
        }
        if (!arm.timing && timingFunctionValue(token)) {
            arm.timing = token;
            continue;
        }
        const word = folded(scalarKeyword(token));
        const count = scalarNumber(token);
        if (!arm.iteration && (word === "infinite" || (count !== undefined && count >= 0))) {
            arm.iteration = token;
            continue;
        }
        if (!arm.direction && DIRECTIONS.includes(word ?? "")) {
            arm.direction = token;
            continue;
        }
        if (!arm.fill && FILL_MODES.includes(word ?? "")) {
            arm.fill = token;
            continue;
        }
        if (!arm.playState && PLAY_STATES.includes(word ?? "")) {
            arm.playState = token;
            continue;
        }
        if (!arm.name && animationNameValue(token)) {
            arm.name = token;
            continue;
        }
        return undefined;
    }
    return {
        name: arm.name ?? keywordValue("none"),
        duration: arm.duration ?? numberValue(0, "s"),
        delay: arm.delay ?? numberValue(0, "s"),
        iteration: arm.iteration ?? numberValue(1, ""),
        direction: arm.direction ?? keywordValue("normal"),
        fill: arm.fill ?? keywordValue("none"),
        playState: arm.playState ?? keywordValue("running"),
        timing: arm.timing ?? keywordValue("ease"),
    };
}

function expandAnimationShorthand(value) {
    const arms = commaItems(value).map(animationArm);
    if (arms.some((arm) => arm === undefined)) return undefined;
    return new Map([
        ["animation-name", listValue(arms.map((arm) => arm.name))],
        ["animation-duration", listValue(arms.map((arm) => arm.duration))],
        ["animation-delay", listValue(arms.map((arm) => arm.delay))],
        ["animation-iteration-count", listValue(arms.map((arm) => arm.iteration))],
        ["animation-direction", listValue(arms.map((arm) => arm.direction))],
        ["animation-fill-mode", listValue(arms.map((arm) => arm.fill))],
        ["animation-play-state", listValue(arms.map((arm) => arm.playState))],
        ["animation-timing-function", listValue(arms.map((arm) => arm.timing))],
        ["animation-composition", keywordValue("replace")],
        ["animation-timeline", keywordValue("auto")],
    ]);
}

/** The declaration list, as data — the ONE place a degenerate argument is turned away (BND-1). */
const declarationsOf = (declarations) =>
    (Array.isArray(declarations) ? declarations : []).filter((row) => isRecord(row) && typeof row.name === "string");

/** `rules.ts` collectDeclarations — the last declaration wins unless an `!important` one stands. */
function declarationCascade(declarations) {
    const result = new Map();
    for (const declaration of declarationsOf(declarations)) {
        const current = result.get(declaration.name);
        if (!current || declaration.important || !current.important) result.set(declaration.name, declaration);
    }
    return result;
}

/** `rules.ts` animationCascade — the same rule over the shorthand's expansion. */
function animationCascade(declarations) {
    const selected = new Map();
    let hasOptions = false;
    const offer = (name, value, important) => {
        const current = selected.get(name);
        if (!current || important || !current.important) selected.set(name, { value, important });
    };
    for (const declaration of declarationsOf(declarations)) {
        if (declaration.name === "animation") {
            hasOptions = true;
            const expanded = expandAnimationShorthand(declaration.value);
            if (expanded) for (const [name, value] of expanded) offer(name, value, declaration.important);
        } else if (CASCADE_PROPERTIES.includes(declaration.name)) {
            if (OPTION_PROPERTIES.includes(declaration.name)) hasOptions = true;
            offer(declaration.name, declaration.value, declaration.important);
        }
    }
    return { selected, hasOptions };
}

/**
 * `serialize.ts` serializeCssValue, as the oracle's `F` computes it — except that a colour CSS
 * cannot spell answers `undefined` instead of throwing (SV-1). Every caller below already treats
 * `undefined` as "there is no such text", so the R1 class is refused rather than propagated.
 */
function serializeValue(value) {
    if (value?.kind === "scalar") {
        const payload = value.payload;
        if (payload?.type === "number") return `${payload.value}${payload.unit}`;
        if (payload?.type === "keyword") return payload.value;
        const color = serializeCssColor(payload?.value);
        return color.ok ? color.value : undefined;
    }
    if (!isRecord(value)) return undefined;
    const items = value.kind === "call" ? value.args : value.items;
    if (!Array.isArray(items)) return undefined;
    const parts = [];
    for (const item of items) {
        const part = serializeValue(item);
        if (part === undefined) return undefined;
        parts.push(part);
    }
    if (value.kind === "call") return `${value.name}(${parts.join(", ")})`;
    const separator = value.separator === "comma" ? ", " : value.separator === "slash" ? " / " : " ";
    const joined = parts.join(separator);
    return value.separator === "space" ? joined.replace(/\s+([:;])/g, "$1") : joined;
}

/** `rules.ts` parseTimelineScope — text, so it needs no lowering. */
const parseTimelineScope = (source) => {
    const input = source.trim();
    if (input === "none" || input === "all") return { kind: input };
    const names = splitTopLevel(input, ",");
    return names.length > 0 && names.every((name) => /^--[-\w]+$/.test(name)) ? { kind: "names", names } : undefined;
};

/**
 * `collectAnimationOptions` (`rules.ts`): the cascade, then one row per `animation-name` component,
 * every other component REPEATED modulo its own length — the incumbent's `$(e, t)`.
 */
export function collectAnimationOptions(declarations) {
    const { selected, hasOptions } = animationCascade(declarations);
    if (!hasOptions) return Object.freeze([]);
    const components = (name, read) => {
        const source = selected.get(name)?.value;
        if (!source) return undefined;
        const values = commaItems(source).map(read);
        return values.every((value) => value !== undefined) ? values : undefined;
    };
    const repeated = (values, index) => values?.[index % values.length];
    const names = components("animation-name", animationNameValue);
    const durations = components("animation-duration", (value) => scalarNumber(value, ["s", "ms"]));
    const delays = components("animation-delay", (value) => scalarNumber(value, ["s", "ms"]));
    const iterations = components("animation-iteration-count", (value) =>
        (folded(scalarKeyword(value)) === "infinite" ? Infinity : scalarNumber(value)));
    const keyword = (set) => (value) => {
        const word = folded(scalarKeyword(value));
        return set.includes(word ?? "") ? word : undefined;
    };
    const directions = components("animation-direction", keyword(DIRECTIONS));
    const fills = components("animation-fill-mode", keyword(FILL_MODES));
    const timings = components("animation-timing-function", timingFunctionValue);
    const compositions = components("animation-composition", keyword(COMPOSITIONS));
    const rows = Array.from({ length: names?.length ?? 1 }, (_unused, index) => {
        const cells = [
            ["name", repeated(names, index)],
            ["duration", repeated(durations, index)],
            ["delay", repeated(delays, index)],
            ["iterationCount", repeated(iterations, index)],
            ["direction", repeated(directions, index)],
            ["fillMode", repeated(fills, index)],
            ["timingFunction", repeated(timings, index)],
            ["composition", repeated(compositions, index)],
        ];
        const row = {};
        for (const [key, value] of cells) if (value !== undefined) row[key] = value;
        return Object.freeze(row);
    });
    return Object.freeze(rows);
}

/**
 * `collectTimelineOptions` (`stylesheet.ts`) — the ONE collector that reads a `CssValue` back
 * through the serializer and re-parses it, three times (range, scope, trigger), which is why it is
 * built over a SURFACE: `parseAnimationRange` and `parseAnimationTimeline` must be THIS lowering's.
 */
const collectorsOver = (parseRange, parseTimeline) => {
    const rangeOf = (value) => {
        if (!value) return undefined;
        const text = serializeValue(value);
        if (text === undefined) return undefined;
        const parsed = parseRange(text);
        return parsed.ok ? parsed.value : undefined;
    };
    /** `rules.ts` parseAnimationTrigger — a type keyword, a timeline, and whatever is left is a range. */
    const triggerOf = (source) => {
        const tokens = splitTopLevel(source.trim(), "space");
        const result = {};
        const range = [];
        for (const token of tokens) {
            const lower = token.toLowerCase();
            if (TRIGGER_TYPES.includes(lower) && result.type === undefined) {
                result.type = lower;
                continue;
            }
            if (result.timeline === undefined && /^(?:auto|none|--|scroll\(|view\()/i.test(token)) {
                const timeline = parseTimeline(token);
                if (!timeline.ok) return undefined;
                result.timeline = timeline.value;
                continue;
            }
            range.push(token);
        }
        if (range.length > 0) {
            const parsed = parseRange(range.join(" "));
            if (!parsed.ok) return undefined;
            result.range = parsed.value;
        }
        return Object.keys(result).length > 0 ? result : undefined;
    };
    return (declarations) => {
        const selected = declarationCascade(declarations);
        const timelineSource = animationCascade(declarations).selected.get("animation-timeline")?.value;
        const timelines = timelineSource ? timelineList(timelineSource) : undefined;
        const range = rangeOf(selected.get("animation-range")?.value);
        const start = rangeOf(selected.get("animation-range-start")?.value)?.start;
        const end = rangeOf(selected.get("animation-range-end")?.value)?.start;
        const scopeText = selected.has("timeline-scope") ? serializeValue(selected.get("timeline-scope").value) : undefined;
        const scope = scopeText === undefined ? undefined : parseTimelineScope(scopeText);
        const triggerText = selected.has("animation-trigger") ? serializeValue(selected.get("animation-trigger").value) : undefined;
        const trigger = triggerText === undefined ? undefined : triggerOf(triggerText);
        const resolved = range ?? (start || end ? { start: start ?? { phase: "normal" }, ...(end ? { end } : {}) } : undefined);
        return {
            ...(timelines?.[0] ? { timeline: timelines[0] } : {}),
            ...(timelines && timelines.length > 1 ? { timelines } : {}),
            ...(resolved ? { range: resolved } : {}),
            ...(scope ? { timelineScope: scope } : {}),
            ...(trigger ? { trigger } : {}),
        };
    };
};

/**
 * `serializeTimelineOptions` (`timeline.ts`) — `CSSTimelineOptions` back to the four properties it
 * came from. A pure value transform: no lowering, no parse, and a degenerate argument is the empty
 * record rather than a throw.
 */
const serializeTimeline = (value) => {
    if (value?.kind === "auto" || value?.kind === "none") return value.kind;
    if (value?.kind === "name") return value.name;
    if (value?.kind === "scroll") return `scroll(${[value.scroller, value.axis].filter(Boolean).join(" ")})`;
    if (value?.kind === "view") return `view(${[value.axis, value.inset?.start, value.inset?.end].filter(Boolean).join(" ")})`;
    return undefined;
};
const serializeRange = (value) => {
    const boundary = (item) => [item?.phase, item?.offset].filter(Boolean).join(" ");
    return [boundary(value?.start), value?.end ? boundary(value.end) : ""].filter(Boolean).join(" ");
};
const serializeScope = (value) =>
    (value?.kind === "names" ? (Array.isArray(value.names) ? value.names.join(", ") : "") : value?.kind);
const serializeTrigger = (value) =>
    [value?.type, value?.timeline ? serializeTimeline(value.timeline) : undefined, value?.range ? serializeRange(value.range) : undefined]
        .filter(Boolean)
        .join(" ");

export function serializeTimelineOptions(options) {
    if (!isRecord(options)) return {};
    return {
        ...(Array.isArray(options.timelines) && options.timelines.length
            ? { "animation-timeline": options.timelines.map(serializeTimeline).join(", ") }
            : options.timeline ? { "animation-timeline": serializeTimeline(options.timeline) } : {}),
        ...(options.range ? { "animation-range": serializeRange(options.range) } : {}),
        ...(options.timelineScope ? { "timeline-scope": serializeScope(options.timelineScope) } : {}),
        ...(options.trigger ? { "animation-trigger": serializeTrigger(options.trigger) } : {}),
    };
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

    // X.P.W3.i — the animation family's three structured exports. The two value transforms are
    // lowering-independent and are the same function on both surfaces; `collectTimelineOptions`
    // re-parses through THIS surface's `parseAnimationRange` / `parseAnimationTimeline`, so both
    // targets answer through their own grammar and G-5's identity reaches it.
    surface.collectAnimationOptions = collectAnimationOptions;
    surface.serializeTimelineOptions = serializeTimelineOptions;
    surface.collectTimelineOptions = collectorsOver(surface.parseAnimationRange, surface.parseAnimationTimeline);

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
export const parseKeyframeSelector = js.parseKeyframeSelector;
export const parseAnimationTimeline = js.parseAnimationTimeline;
export const parseAnimationRange = js.parseAnimationRange;
export const collectTimelineOptions = js.collectTimelineOptions;

export { CAPACITY, CAPACITY_LABELS, CLASS3_PROOF, DEPTH_BOUND, DEPTH_CODE, DEPTH_PRODUCTION };
