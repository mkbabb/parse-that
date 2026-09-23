// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.a — THE ADJUDICATED CONFLICTS, AS DATA. One source of truth for G-6's named rows, for the
// matrix's oracle override, and for `.d`'s `DIVERGENCE-LEDGER.md`.
//
// TWO GROUPS, BOTH OUT OF `registry/adjudicated/parser-band.md`:
//
//   PB-*   the **MEASURED — published-parser defects** table (parser-band.md:85-100), fifteen rows
//          "each confirmed by direct probe". These are the wave's spec-correct regression fixtures:
//          `W3.md` §5 `.d` — "the mirror preserves spec-correctness, never bug-compatibility". The
//          candidate is REQUIRED to differ from the incumbent here, so a difference on one of these
//          inputs is a DECLARED DIVERGENCE and not a mirror-defect. Twelve of them are G-6's own
//          named rows (`W3.md` §6 G-6, L451-455).
//   ADJ-*  the three conflicts between the two FOLDED SUITES that `W3.md` §5 `.a` names — "hue wrap
//          → unwrapped; juxtaposition → accept; `1e400` → `color_non_finite`" — resolved to
//          `parser-band.md`'s adjudications and its preserved DISSENTS (:138-141).
//
// EVERY ROW CARRIES THE SIX FIELDS `DIVERGENCE-LEDGER.md` DEMANDS (`W3.md` §5 `.d`): input ·
// incumbent result · candidate result · spec citation · adjudication · THE DIRECTION OF BEHAVIOUR
// CHANGE FOR A CONSUMER. The incumbent and candidate halves are MEASURED by the matrix and never
// written from memory; this file supplies the other four and the expectation.
// `css-universe.mjs --cross-check-ledger` then asserts every row reached `.d`'s ledger: `.a`
// resolving a conflict and `.d` rowing it are ONE FAMILY (`X-P-W3.md` §P.1), and G-7 treats an
// unrowed intentional difference exactly as it treats a defect.
//
// ONE THING THIS FILE DOES NOT DO. `parser-band.md` spells the third folded conflict
// "`1e400` → `color_non_finite`", which is cand-O's OWN diagnostic vocabulary, not the frozen
// union's. The frozen `ParseIssue` union has eight codes (`src/css/types.ts:11-19`) and
// `color_non_finite` is not among them: introducing it would be a NINTH CODE, which `W3.md` §3a
// makes a halt to X·V and the owner — "never a local decision". The adjudication is carried at its
// MEANING (clamp where a clamp exists, reject the unclamped non-finite channel) and lowered onto
// `css_syntax`, with the naming difference itself rowed. NO NINTH CODE IS PROPOSED ANYWHERE.

import {
    callsOf,
    hasJuxtaposedOperands,
    soleIdent,
    hasTrailingDotNumber,
    juxtapositionBoundaries,
    nonFiniteNumerics,
    soleNumeric,
    spliceAll,
} from "./tokens.mjs";

const BAND = "docs/tranches/V/megatranche/registry/adjudicated/parser-band.md";
const cite = (line, quote) => `${BAND}:${line} — "${quote}"`;

/**
 * `expect` is what the ADJUDICATION requires of the candidate: `"accept"` or `"reject"`. It
 * OVERRIDES the published oracle for that input, which is exactly what turns a difference into a
 * declared divergence instead of a defect. `valueDiffers` marks the rows where both sides accept
 * and the VALUES differ by adjudication, so the matrix's DIVERGENT_VALUE check stands down for them
 * and for them only.
 */
export const ADJUDICATIONS = [
    // ── the twelve G-6 rows (parser-band.md:87-98), in the spec's own order ──────────────────────
    {
        id: "PB-01",
        g6: "a",
        title: "legacy 4-argument rgba() parses",
        parser: "parseCssColor",
        inputs: ["rgba(1, 2, 3, 0.5)"],
        published: "REJECT — the gap confirmed as P-012",
        expect: "accept",
        expectShape: { space: "rgb", channels: [1, 2, 3], alpha: 0.5 },
        ruling: "ACCEPT — the most-deployed colour syntax on the web must parse",
        citation: cite(87, "REJECT (gap) | accept | accept | **GAP confirmed** (P-012): the most-deployed colour syntax on the web fails"),
        specCitation: "css-color-4 §8.1 — the legacy rgba() form with four comma-separated arguments",
        divergesFromIncumbent: true,
        consumerDirection: "WIDENS acceptance: input the incumbent rejects now parses. A consumer that treated the rejection as a signal loses it; no consumer that relied on acceptance is affected.",
    },
    {
        id: "PB-02",
        g6: "b",
        title: "legacy 4-argument hsla() parses",
        parser: "parseCssColor",
        inputs: ["hsla(120, 50%, 50%, 0.5)"],
        published: "REJECT — the gap confirmed as P-015",
        expect: "accept",
        expectShape: { space: "hsl", channels: [120, 0.5, 0.5], alpha: 0.5 },
        ruling: "ACCEPT",
        citation: cite(88, "REJECT (gap) | accept | accept | **GAP confirmed** (P-015)"),
        specCitation: "css-color-4 §7 — the legacy hsla() form",
        divergesFromIncumbent: true,
        consumerDirection: "WIDENS acceptance, as PB-01.",
    },
    {
        id: "PB-03",
        g6: "c",
        title: "the two spec-identical hsl spellings agree bit-for-bit",
        parser: "parseCssColor",
        inputs: ["hsl(120 50 50)", "hsl(120 50% 50%)"],
        published: "[120,50,50] vs [120,0.5,0.5] — R6 confirmed: two spec-identical spellings disagree 100×",
        expect: "accept",
        valueDiffers: true,
        equivalence: ["hsl(120 50 50)", "hsl(120 50% 50%)"],
        ruling: "BOTH parse to [120,0.5,0.5] — the bare number and the percentage are the same value",
        citation: cite(96, "[120,50,50] vs [120,0.5,0.5] | consistent | consistent (0.5) | **R6 confirmed**: two spec-identical spellings disagree 100×"),
        specCitation: "css-color-4 §7 — <percentage> and <number> are interchangeable for hsl() saturation/lightness in the modern form",
        divergesFromIncumbent: true,
        consumerDirection: "CHANGES VALUE by a factor of 100 for `hsl(120 50 50)`: the incumbent returns 50, the candidate 0.5. A consumer that read the incumbent's bare-number saturation as a percentage got a value 100× too large; that arithmetic changes.",
    },
    {
        id: "PB-04",
        g6: "d",
        title: "out-of-range rgb channels clamp",
        parser: "parseCssColor",
        inputs: ["rgb(300 -20 3)"],
        published: "[300,−20,3] — unclamped",
        expect: "accept",
        expectShape: { space: "rgb", channels: [255, 0, 3], alpha: 1 },
        valueDiffers: true,
        ruling: "CLAMP to [255,0,3]",
        citation: cite(94, "[300,−20,3] unclamped | [255,0,3] | [255,0,3] | §8.1 clamp missing in published"),
        specCitation: "css-color-4 §8.1 / §12 — rgb() channel values are clamped to the [0,255] range",
        divergesFromIncumbent: true,
        consumerDirection: "CHANGES VALUE: out-of-range channels now arrive clamped. Downstream colour maths that compensated for the incumbent's unclamped values must stop compensating.",
    },
    {
        id: "PB-05",
        g6: "e",
        title: "out-of-range alpha clamps rather than rejecting",
        parser: "parseCssColor",
        inputs: ["rgb(1 2 3 / 1.5)"],
        published: "REJECT",
        expect: "accept",
        expectShape: { space: "rgb", channels: [1, 2, 3], alpha: 1 },
        ruling: "ACCEPT with alpha clamped to 1",
        citation: cite(95, "REJECT | alpha=1 | alpha=1 | §4.2 says clamp, not reject"),
        specCitation: "css-color-4 §4.2 — <alpha-value> outside [0,1] is clamped, not invalid",
        divergesFromIncumbent: true,
        consumerDirection: "WIDENS acceptance and fixes the value: input the incumbent rejected now parses with alpha 1.",
    },
    {
        id: "PB-06",
        g6: "f",
        title: "a trailing legacy comma rejects",
        parser: "parseCssColor",
        inputs: ["rgb(1,2,3,)"],
        published: "ACCEPT — P-037 unsound accept confirmed",
        expect: "reject",
        ruling: "REJECT",
        citation: cite(89, "ACCEPT | reject | reject | P-037 unsound accept confirmed"),
        specCitation: "css-syntax-3 §5.4.1 / css-color-4 §8.1 — an empty component value is not <alpha-value>",
        divergesFromIncumbent: true,
        consumerDirection: "NARROWS acceptance: a malformed string the incumbent accepted is now an ok:false with a located diagnostic.",
    },
    {
        id: "PB-07",
        g6: "g",
        title: "a dangling slash rejects",
        parser: "parseCssColor",
        inputs: ["rgb(1 2 3 / )"],
        published: "ACCEPT — P-037",
        expect: "reject",
        ruling: "REJECT",
        citation: cite(90, "ACCEPT | reject | reject | P-037 confirmed"),
        specCitation: "css-color-4 §4.2 — the solidus must be followed by an <alpha-value>",
        divergesFromIncumbent: true,
        consumerDirection: "NARROWS acceptance, as PB-06.",
    },
    {
        id: "PB-08",
        g6: "h",
        title: "mixed separators reject",
        parser: "parseCssColor",
        inputs: ["rgb(1, 2 3)"],
        published: "ACCEPT [1,2,3] — the comma→space rewrite makes separators invisible",
        expect: "reject",
        ruling: "REJECT",
        citation: cite(91, "ACCEPT [1,2,3] | reject | reject | comma→space rewrite makes separators invisible (found by the bench honesty gate)"),
        specCitation: "css-color-4 §8.1 — the legacy form is comma-separated throughout; the modern form is space-separated throughout",
        divergesFromIncumbent: true,
        consumerDirection: "NARROWS acceptance. This row is the one the BENCH honesty gate found, not the suite: a candidate that reproduces the rewrite passes every value check and still fails here (W3.md §6 G-6).",
    },
    {
        id: "PB-09",
        g6: "i",
        title: "a percentage hue rejects",
        parser: "parseCssColor",
        inputs: ["hsl(120%, 50%, 50%)"],
        published: "ACCEPT, hue = 432",
        expect: "reject",
        ruling: "REJECT",
        citation: cite(92, "ACCEPT, hue=432 | reject | reject | percentage `<hue>` over-accept, §7"),
        specCitation: "css-color-4 §7 — <hue> is <number> | <angle>; a <percentage> is not a hue",
        divergesFromIncumbent: true,
        consumerDirection: "NARROWS acceptance, and removes a silently wrong hue (432).",
    },
    {
        id: "PB-10",
        g6: "j",
        title: "a percentage in lch()'s hue position rejects",
        parser: "parseCssColor",
        inputs: ["lch(50% 50% 50%)"],
        published: "ACCEPT, hue = 180",
        expect: "reject",
        ruling: "REJECT",
        citation: cite(93, "ACCEPT, hue=180 | reject | reject | same class"),
        specCitation: "css-color-4 §9.3 — lch()'s third component is <hue>, never <percentage>",
        divergesFromIncumbent: true,
        consumerDirection: "NARROWS acceptance, as PB-09.",
    },
    {
        id: "PB-11",
        g6: "k",
        title: "the css-color-4 functions have no comma form",
        parser: "parseCssColor",
        inputs: ["hwb(120, 30%, 40%)"],
        published: "ACCEPT",
        expect: "reject",
        ruling: "REJECT",
        citation: cite(98, "ACCEPT | reject | reject | css-color-4 functions have no comma form"),
        specCitation: "css-color-4 §8 — hwb() takes space-separated components only; there is no legacy comma form",
        divergesFromIncumbent: true,
        consumerDirection: "NARROWS acceptance.",
    },
    {
        id: "PB-12",
        g6: "l",
        title: "`1.` is not a CSS number",
        parser: "parseCssColor",
        inputs: ["rgb(1. 2 3)"],
        published: "ACCEPT",
        expect: "reject",
        ruling: "REJECT",
        citation: cite(97, "ACCEPT | reject | reject | `1.` is not a CSS number"),
        specCitation: "css-syntax-3 §4.3.12 — a <number-token> with a decimal point requires at least one following digit",
        divergesFromIncumbent: true,
        consumerDirection: "NARROWS acceptance.",
    },
    // ── the remaining MEASURED row that is not one of G-6's twelve ───────────────────────────────
    {
        id: "PB-13",
        title: "`currentcolor` is a context-dependent colour",
        parser: "parseCssColor",
        inputs: ["currentcolor"],
        published: "REJECT — the published gap; the adapter answers `color_context_required`",
        expect: "reject",
        ruling: "REJECT with the frozen `color_context_required` code — a context-free parse cannot resolve it",
        citation: cite(99, "REJECT | accept (node) | context node; adapter `color_context_required` | published gap"),
        specCitation: "css-color-4 §6.2 — currentcolor computes to the value of the color property, which a context-free parse does not have",
        divergesFromIncumbent: false,
        consumerDirection: "NONE at the adapter boundary — incumbent and candidate both reject with `color_context_required`. The divergence parser-band records is at cand-F's NODE level, below the shipped surface.",
    },
    // ── the three folded-suite conflicts (`W3.md` §5 `.a`) ───────────────────────────────────────
    {
        id: "ADJ-1",
        title: "hue is not wrapped at parse time",
        parser: "parseCssColor",
        inputs: ["hsl(480 50% 50%)", "hsl(-120 50% 50%)"],
        published: "unwrapped — 480 / −120; the incumbent agrees with the adjudication",
        expect: "accept",
        ruling: "UNWRAPPED — cand-F's parse-time mod-360 is dropped",
        citation: cite(98, "480 / −120 (unwrapped) | **120 / 240 (wrapped)** | 480 / −120 | cand-F's parse-time mod-360 is a drop-in divergence; wrapping is serialisation-time"),
        specCitation: "css-color-4 §7 — <hue> is an <angle>; normalization is a serialization act, not a parse act",
        divergesFromIncumbent: false,
        consumerDirection: "NONE against the incumbent — published and the adjudication agree. The change is against cand-F's FOLDED SUITE, whose wrapped expectations are dropped: a consumer of cand-F's numbers would read 480 where it read 120.",
    },
    {
        id: "ADJ-2",
        title: "token juxtaposition is accepted",
        parser: "parseCssColor",
        inputs: ["rgb(50%20%30%)", "rgb(1.5.5 3)", "hsl(120 50%50%)"],
        published: "REJECTS all three",
        expect: "accept",
        ruling: "ACCEPT — the css-syntax token-stream reading browsers implement",
        citation: cite(104, "O accepts per css-syntax token-stream reading, matching browsers; F rejects as a declared simplification; note published rejects these too, so O diverges from the incumbent **toward** the spec") + " · DISSENT preserved at :140",
        specCitation: "css-syntax-3 §4 — `50%20%30%` tokenizes as three <percentage-token>s; whitespace is not required between tokens that cannot merge",
        divergesFromIncumbent: true,
        consumerDirection: "WIDENS acceptance relative to the incumbent: a consumer relying on the incumbent's rejection of juxtaposed tokens would see these parse. parser-band.md:140 reserves the owner's overrule toward cand-F's stricter line without disturbing the rest of the verdict.",
    },
    {
        id: "ADJ-3",
        title: "non-finite numerals — clamp where a clamp exists, reject where none does",
        parser: "parseCssColor",
        inputs: ["rgb(1e400 0 0)", "lab(50 1e400 0)", "hsl(1e400 0% 50%)"],
        published: "REJECTS `1e400` outright, in every position",
        expect: null,
        expectByInput: {
            "rgb(1e400 0 0)": "accept",
            "lab(50 1e400 0)": "reject",
            "hsl(1e400 0% 50%)": "reject",
        },
        ruling: "cand-O's reading — clamped channels accept at the clamp, unclamped channels reject",
        citation: cite(97, "REJECT | **accept, a=∞ in AST** | `color_non_finite` | cand-F's sole adjudicated correctness debit") + " · " + cite(141, "three-way split — published rejects 1e400 outright; cand-O clamps where clamps exist and fails color_non_finite on unclamped channels; cand-F admits Infinity … the GROUND-C contract question ('are ±Infinity admitted?') deserves an owner ruling"),
        specCitation: "css-color-4 §4.2 and §12 (out-of-range values clamp at computed-value time); css-values-4 §10.9 — a numeric token outside the implementation range is not a <number>",
        divergesFromIncumbent: true,
        codeNaming:
            "cand-O names the rejection `color_non_finite`. That code is NOT in the frozen 8-code ParseIssue union (src/css/types.ts:11-19); adding it would be a ninth code and a W3.md §3a halt. The adjudication is carried at its meaning and lowered onto `css_syntax`. NO NINTH CODE IS PROPOSED.",
        consumerDirection:
            "WIDENS acceptance where a clamp exists (`rgb(1e400 0 0)` parses to 255 where the incumbent rejects) and holds the incumbent's rejection where none does. The GROUND-C ±Infinity contract ruling is OWNER-OWED and W3.md §10 leaves it 'not opened here'.",
    },
];

/** G-6's twelve named rows, in `W3.md` §6 G-6's own order — the suite reads this, never a copy. */
export const G6_ROWS = ADJUDICATIONS.filter((row) => row.g6).sort((a, b) => a.g6.localeCompare(b.g6));

/* ══════════════════════════════════════════════════════════════════════════════════════════════
   X.P.W3.k — THE CLASS PREDICATES (COHESION §0s **E-h2**)

   THE FINDING THIS SECTION ANSWERS, quoted from the ruling: "G-1's oracle override matches LITERAL
   inputs (`matrix.mjs:120`) while the rulings it encodes are CLASSES (PB-03 hsl-100× · PB-04/05
   clamp · PB-08 rewrite · PB-12 trailing-dot · ADJ-2 juxtaposition …). `.k` extends
   `test/css-totality/lib/adjudications.mjs` from literal lists to CLASS PREDICATES, one per ruling
   id, each printing its own census … so G-1 counts a row TOTAL against the ADJUDICATED expectation
   and a predicate that swallows an un-ruled input is itself a defect (the predicate census is
   asserted `≤` the ruling's measured population)."

   FIVE LAWS THIS SECTION IS BUILT AROUND.

   1. A PREDICATE IS WRITTEN IN THE RULING'S OWN TERMS, over the INPUT and the ORACLE's measured
      reading — never over the candidate's answer. "Whatever the candidate did" is not a class; it
      is the excuse a class exists to make impossible. Every predicate below reads `lib/tokens.mjs`
      (css-syntax-3 §4, engine-free) and, where the ruling widens acceptance, the ORACLE's own
      verdict on a REPAIRED source.
   2. AN ADJUDICATION STATES WHAT THE CANDIDATE MUST DO, not what it may do. `expect` is a verdict
      the candidate is then held to — a cell in ADJ-2's class where the candidate REJECTS is still a
      miss — and the value ruling carries `ruledValue`, the arithmetic css-color-4 names, which the
      candidate's value must EQUAL. The pre-`.k` `valueDiffers` blank cheque ("the values may
      differ") survives only on the two literal rows that predate this section.
   3. A WIDENING IS MEASURED BY REPAIR, NEVER BY SHAPE ALONE. An `expect: "accept"` class moves a
      cell the incumbent REJECTED into the accept set; a predicate that fires on shape alone
      manufactures FALSE_REJECTs out of inputs malformed for some other reason (MEASURED: a first,
      predicate-only version of the four accept classes moved 1,680 such cells at
      `parseCssColor`). Each accept class therefore declares the EDIT that removes the ruled defect
      and nothing else, and fires only when the ORACLE accepts the repaired source — the
      adjudication's own sentence, executable: *the incumbent rejects this input FOR THIS REASON*.
   4. EVERY CLASS DECLARES ITS POPULATION, MEASURED, AND THE CENSUS IS ASSERTED `≤` IT.
      `population` is the number of rows of the union corpus the predicate MATCHES, measured by
      `node scripts/css-universe.mjs --check --pinned-value-commit 6aca8602`, which prints the live
      figure beside the pin. A widened predicate raises the census above the pin and G-1 goes RED —
      the defect E-h2 names, caught mechanically rather than by review.
      THE CORPUS THESE FIGURES ARE READ OVER moved once since `.k` pinned them (26,604 rows, `rows
      sha256 559e84bfb632b140`) and once again at X.P.W3.n: `.l` added the stylesheet band, and
      `.n` cured BND-1 so the r1 arm hands the STRING rather than the `{id, src}` pair (§0w). The
      pins below are therefore re-measured at **27,021 rows, `rows sha256 e119d81be0d088ec`** — a
      re-pin against a corpus this unit MOVED, printed beside the live figure on every run, never a
      silent re-pin against a corpus that moved on its own.
   5. A RULING REACHES ONLY THE ENTRIES WHOSE INPUT IT IS ABOUT. `currentcolor` is
      `color_context_required` to `parseCssColor` and an ordinary keyword to `parseCssScalar`
      (MEASURED at the oracle), so PB-13 is scoped to the one entry; the separator, hue and legacy
      classes quantify over COLOUR-HEAD CALLS found anywhere in the source, so they reach a colour
      inside a value inside a declaration and cannot reach `linear(0 0%, 1 100%)`, whose
      comma-and-space structure is lawful.

   WHAT IS DELIBERATELY NOT CLASSED, and therefore stays in the honest remainder (`W3.md` §6 G-1's
   "or the honest remainder, by id"): a non-finite numeral OUTSIDE a clamped colour channel (the
   GROUND-C ±Infinity contract is OWNER-OWED and `W3.md` §10 lists it under "Not opened here"); the
   at-rule and nesting families (**E-j1**); `blocks()`'s signed paren counter (**SH-1**); and
   `splitSelectors`' empty first part (**E-j2**). Each is reported by id and none is excused here.
   ══════════════════════════════════════════════════════════════════════════════════════════════ */

const COLOUR_HEADS = ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color"];

/** The heads css-color-4 gives a LEGACY comma form; every other head is space-separated only. */
const LEGACY_HEADS = new Set(["rgb", "rgba", "hsl", "hsla"]);

/** The head → `CssColorSpace` map the frozen surface itself uses; `color()` names its space inside. */
const HEAD_SPACE = { rgb: "rgb", rgba: "rgb", hsl: "hsl", hsla: "hsl", hwb: "hwb", lab: "lab", lch: "lch", oklab: "oklab", oklch: "oklch" };

/** The `<hue>` argument's index, per head — css-color-4 §7 (hsl/hwb) and §9.3/§9.5 (lch/oklch). */
const HUE_INDEX = { hsl: 0, hsla: 0, hwb: 0, lch: 2, oklch: 2 };

/** The `<percentage>`-only argument indices of the legacy comma form — css-color-4 §7.1. */
const LEGACY_PERCENT_ONLY = { hsl: [1, 2], hsla: [1, 2] };

/**
 * THE RULED RANGES — css-color-4's own, by section, and the ONLY arithmetic PB-04/05 licenses.
 * `null` is "this channel is not clamped": a hue is an angle (§7, and ADJ-1 keeps it unwrapped),
 * lab/oklab a and b are unbounded (§9.1/§9.4), and the predefined spaces admit out-of-gamut
 * coordinates by design (§10), so a value outside [0,1] there is a colour, not an error.
 */
const CHANNEL_RANGES = Object.freeze({
    rgb: [[0, 255], [0, 255], [0, 255]], //            §8.1 — clamped to [0,255]
    hsl: [null, [0, 1], [0, 1]], //                    §7   — saturation and lightness are percentages
    hwb: [null, [0, 1], [0, 1]], //                    §8.3 — whiteness and blackness are percentages
    lab: [[0, 100], null, null], //                    §9.1 — L is [0,100]; a and b are unbounded
    lch: [[0, 100], [0, Infinity], null], //           §9.3 — L is [0,100]; C is non-negative
    oklab: [[0, 1], null, null], //                    §9.4 — L is [0,1]
    oklch: [[0, 1], [0, Infinity], null], //           §9.5 — L is [0,1]; C is non-negative
});
const ALPHA_RANGE = [0, 1]; //                         §4.2 — an <alpha-value> outside [0,1] is CLAMPED

const clampTo = (value, range) =>
    range === null || range === undefined || typeof value !== "number" ? value : Math.min(Math.max(value, range[0]), range[1]);

const isColourValue = (v) => v !== null && typeof v === "object" && typeof v.space === "string" && Array.isArray(v.channels);

/** The separator structure css-color-4 admits: all-comma (legacy), or space with one trailing `/`. */
const separatorShape = (call) => {
    if (!call.closed) return "invalid";
    if (call.args.some((a) => a.length === 0)) return "invalid";
    const { seps } = call;
    if (seps.length === 0) return "modern";
    if (seps.every((s) => s === ",")) return "legacy";
    if (seps.includes(",")) return "invalid";
    const slashes = seps.filter((s) => s === "/").length;
    if (slashes === 0) return "modern";
    return slashes === 1 && seps[seps.length - 1] === "/" ? "modern" : "invalid";
};

/** The `<alpha-value>` argument of a call, when its structure names one. */
const alphaArgument = (call) => {
    const shape = separatorShape(call);
    if (shape === "legacy" && call.args.length === 4) return { arg: call.args[3], index: 3 };
    if (shape === "modern" && call.seps[call.seps.length - 1] === "/") return { arg: call.args[call.args.length - 1], index: call.args.length - 1 };
    return null;
};

const colourCalls = (src) => (typeof src === "string" ? callsOf(src, COLOUR_HEADS) : []);

/**
 * THE STYLESHEET GUARD. A sheet may carry a ruled token AND an UNRULED construct — an at-rule, a
 * nested style body — and then the candidate's rejection is E-j1's, not the ruling's. Excusing it
 * would be precisely "a predicate that swallows an un-ruled input". A source naming `@…` or nesting
 * a block inside a block is therefore outside every class below, and its cells stay in the
 * remainder under E-j1's own id.
 */
/**
 * Four constructs, each MEASURED as riding along with a ruled colour and each un-ruled by anything:
 *   `@…`      an at-rule, and a stray `@` too — `#d { … }@@ ; #d { … }` is E-j1's family either way
 *   `{ … { `  a nested style body (E-j1)
 *   `^\s*{`   or `;{`, `}{` — a style rule with an EMPTY selector (E-j2's `splitSelectors`)
 *   `x!imp`   `!important` with no token boundary before it — a spacing rule no ruling reaches
 * The guard NEVER excuses a cell: it withholds the RULING, and the oracle's own verdict then
 * decides, so these rows land in the honest remainder under their own ids rather than being scored
 * against a ruling that was never about them.
 */
/**
 * X.P.W3.n — THREE OF THE FOUR CLAUSES ARE RETIRED, because the constructs they named are no longer
 * unruled (COHESION §0v/§0w). `.l` landed the ten at-rule shapes and nested style bodies, and was
 * GRANTED E-j2 (`splitSelectors` drops an empty part, both lowerings); `.n` landed the
 * component-value prelude. A guard that still withheld every ruling from a sheet naming `@`, or
 * nesting a block, or opening with `{`, was withholding it for a reason that had been cured —
 * MEASURED at this seat: ten of `parseStylesheet`'s twenty-one residual cells were a RULED class's
 * own subject (PB-12's trailing-dot number, PB-04/05's alpha clamp, ID-5's legacy comma form) held
 * out of reach by a stale clause, and counted as misses for a construct the candidate now reads.
 *
 * THE ONE CLAUSE THAT STANDS is `x!imp`: `!important` — or a declaration NAME — with no token
 * boundary before the `!`. That is **ID-1b**'s own subject (§0w: "the incumbent accepts `col!r` as a
 * declaration NAME and `-!important` as a keyword"), it is UNADJUDICATED, and withholding the other
 * rulings from those sheets is what keeps its cells in the honest remainder under ITS id instead of
 * being scored against a ruling that was never about them.
 */
const UNRULED_SHEET = /[^\s,/(]![A-Za-z]/;
const outsideEveryClass = (src) => typeof src !== "string" || UNRULED_SHEET.test(src);

/* ── the ten class predicates, one per ruling id, in RESOLUTION ORDER ───────────────────────── */

/**
 * EVERY `population` BELOW IS MEASURED, NOT ESTIMATED — the count of DISTINCT corpus sources the
 * predicate matches, taken at the sha-asserted union on 2026-09-19 and printed by
 * `scripts/css-universe.mjs --check` on every run. E-h2's assertion is `census ≤ population`: a
 * class may govern fewer cells at an entry than it matches sources (an ACCEPT class fires only
 * where the ORACLE accepts the repair), and it may never govern MORE — a census over its
 * population means the predicate reached an input the ruling never measured, which is the defect
 * E-h2 names. The corpus is sha-asserted, so a drift from these numbers means the PREDICATE moved,
 * and the runner prints the drift rather than re-pinning itself.
 *
 * PB-11 measures 0: the union carries no comma-spelled modern colour function outside PB-11's own
 * literal ADJUDICATIONS row, which the literal index governs and the stylesheet guard excludes. It
 * is pinned at what it measures — a class with no fuzz witness is a fact about the corpus, and
 * pinning it at a guess would manufacture the drift it is meant to detect.
 */

/**
 * Order is meaning, not convenience: a malformed SEPARATOR structure is read before the tokens
 * inside it (an input that is both mis-separated and juxtaposed is mis-separated), and every
 * REJECT class is read before every ACCEPT class, so a class can never widen acceptance past a
 * structure the specification refuses.
 */
export const CLASSES = [
    {
        id: "PB-08",
        carries: ["PB-06", "PB-07", "PB-08"],
        kind: "reject",
        title: "the comma→space rewrite makes an invalid separator structure invisible",
        expect: "reject",
        population: 2272, //  MEASURED at 27,021 rows (X.P.W3.n); 2,220 at `.k`'s 26,604 — the corpus moved, then the GUARD did.
        specCitation:
            "css-color-4 §8.1 / §7.1 — the legacy form is comma-separated THROUGHOUT and the modern form is space-separated throughout, with at most one solidus before <alpha-value>; css-syntax-3 §5.4.1 — an empty component value is not a value",
        why: "a colour call whose top-level separators are mixed, doubled, leading, trailing or empty",
        consumerDirection:
            "NARROWS acceptance. Strings the incumbent accepted because its comma→space rewrite erased their separators — `rgb(255,0 153 / 0.5)`, `rgb(/55 0 153 / 0.5)`, `lab(50% -100% 100,)` — are now `ok:false` with a located diagnostic. A consumer emitting them was relying on a rewrite no specification licenses.",
        matches: (src) => colourCalls(src).some((call) => separatorShape(call) === "invalid"),
    },
    {
        id: "PB-11",
        carries: ["PB-11"],
        kind: "reject",
        title: "the css-color-4 functions have no comma form",
        expect: "reject",
        population: 1, //  MEASURED (X.P.W3.n): the guard no longer hides `hwb(10, 10%, 10%)` — F-l3's own cell.
        specCitation: "css-color-4 §8 / §9 — hwb(), lab(), lch(), oklab(), oklch() and color() take space-separated components only; there is no legacy comma form",
        why: "a comma-separated call on a head css-color-4 gives no legacy form",
        consumerDirection: "NARROWS acceptance: `hwb(120, 30%, 40%)` and its siblings no longer parse. The space-separated spelling of the same colour is unaffected.",
        matches: (src) => colourCalls(src).some((call) => separatorShape(call) === "legacy" && !LEGACY_HEADS.has(call.head)),
    },
    {
        id: "SP-1",
        carries: ["SP-1"],
        kind: "reject",
        title: "`<legacy-hsl-syntax>` admits no `<number>` for saturation or lightness",
        expect: "reject",
        population: 6,
        specCitation:
            "css-color-4 §7.1 — `<legacy-hsl-syntax> = hsl( <hue>, <percentage>, <percentage>, <alpha-value>? )`. Only `<modern-hsl-syntax>` admits `[<percentage> | <number> | none]` there.",
        why: "a comma-separated hsl()/hsla() whose saturation or lightness is a bare number",
        consumerDirection:
            "NARROWS acceptance. A consumer that fed `hsl(120, 50, 50)` received a colour — and a wrong one, 100× the spec's saturation and lightness — and now receives `ok:false`. The SPACE form `hsl(120 50 50)` keeps working and is adjudicated at PB-03.",
        matches: (src) =>
            colourCalls(src).some((call) => {
                if (separatorShape(call) !== "legacy") return false;
                const slots = LEGACY_PERCENT_ONLY[call.head];
                if (!slots) return false;
                return slots.some((i) => {
                    const n = soleNumeric(call.args[i]);
                    return n !== null && n.unit === "";
                });
            }),
    },
    {
        id: "ID-5",
        carries: ["ID-5"],
        kind: "reject",
        title: "the legacy comma form takes THREE arguments of ONE type and no `none`",
        expect: "reject",
        population: 1501, //  MEASURED at 27,021 rows (X.P.W3.n) — the class is new at this unit; re-read after the guard retired three clauses.
        specCitation:
            "css-color-4 §8.1 — `<legacy-rgb-syntax> = rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? )`: the three channels are one type throughout and `none` is admitted only by the modern grammar; §7.1 — `<legacy-hsl-syntax> = hsl( <hue>, <percentage>, <percentage>, <alpha-value>? )`, which admits no `none` either. §4.2's `<alpha-value>` is untouched: `none` as the FOURTH argument stays lawful.",
        why: "a comma-separated rgb()/rgba()/hsl()/hsla() whose first three arguments mix `<number>` with `<percentage>`, or spell `none`",
        consumerDirection:
            "NARROWS acceptance. `rgb(24.745, 171.2787213968113, 41%)`, `rgb(+12, none, 40.12, 46.14)` and `rgb(none, 8e144, 80%, .86)` parsed before and are now `ok:false` with a located diagnostic. The incumbent accepts them because it rewrites the commas to spaces and reads every channel as `<number>|<percentage>|none` — the MODERN grammar — so a consumer that fed a mixed legacy form received a colour the string does not name. The space-separated spelling of the same colour is unaffected, and so is `none` in the alpha slot.",
        matches: (src) => legacyFormMisaccept(src),
    },
    {
        id: "PB-09/10",
        carries: ["PB-09", "PB-10"],
        kind: "reject",
        title: "a `<percentage>` is not a `<hue>`",
        expect: "reject",
        population: 138,
        specCitation: "css-color-4 §7 and §9.3 — `<hue> = <number> | <angle>`; the third component of lch()/oklch() and the first of hsl()/hwb() are hues, never percentages",
        why: "a percentage token in a hue argument",
        consumerDirection: "NARROWS acceptance, and removes a silently wrong hue (the incumbent read `hsl(120%, …)` as hue 432).",
        matches: (src) =>
            colourCalls(src).some((call) => {
                const index = HUE_INDEX[call.head];
                if (index === undefined) return false;
                const n = soleNumeric(call.args[index]);
                return n !== null && n.unit === "%";
            }),
    },
    {
        id: "PB-12",
        carries: ["PB-12"],
        kind: "reject",
        title: "`1.` is not a CSS number",
        expect: "reject",
        population: 5428, //  X.P.W3.n: +37, the guard's three retired clauses
        specCitation: "css-syntax-3 §4.3.12 — a number's decimal point must be followed by at least one digit; the incumbent's `\\d+\\.?\\d*` admits the trailing dot in every numeric position",
        why: "any numeric token spelled with a trailing decimal point",
        consumerDirection: "NARROWS acceptance wherever a number is read — colours, values, timing functions alike. `steps(7., jump-start)` and `rgb(1. 2 3)` are now `ok:false`.",
        matches: (src) => typeof src === "string" && hasTrailingDotNumber(src),
    },

    /* ── the ACCEPT side: a ruling that WIDENS acceptance is measured by REPAIR (law 3) ──────── */
    {
        id: "ADJ-2",
        carries: ["ADJ-2"],
        kind: "repair",
        title: "token juxtaposition is accepted",
        expect: "accept",
        population: 995, //   X.P.W3.n: +5, the guard's three retired clauses
        specCitation:
            "css-syntax-3 §4 — tokenization is maximal-munch over the code-point stream, so `50%20%30%` is three tokens and whitespace between tokens that cannot merge is not required. §4.3.3 is the same rule's other edge and is X.P.W3.g's subject: a number followed by an ident-start is ONE dimension token, and this class cannot reach it.",
        why: "two operand tokens run together with nothing between them; the repair inserts the whitespace the tokenizer does not require",
        consumerDirection:
            "WIDENS acceptance relative to the incumbent: `rgb(50%20%30%)`, `rgb(255-0 153)` and `rgb(59%none none)` parse. `parser-band.md`:140 reserves the owner's overrule toward cand-F's stricter line.",
        matches: (src) => colourJuxtapositions(src).length > 0,
        edits: (src) => colourJuxtapositions(src).map((at) => ({ start: at, end: at, text: " " })),
    },
    {
        id: "ADJ-3",
        carries: ["ADJ-3"],
        kind: "repair",
        title: "non-finite numerals — clamp where a clamp exists, reject where none does",
        expect: "accept",
        population: 635, //   X.P.W3.n: +5, the guard's three retired clauses
        specCitation:
            "css-values-4 §10.9 — a value outside the implementation's supported range is clamped to that range; css-color-4 §8.1/§4.2 — rgb() channels and <alpha-value> are clamped. Where no clamp exists the numeral is not a <number> and the colour is invalid.",
        why: "a non-finite numeral sitting in a CLAMPED colour channel or in alpha; the repair spells it at the bound. One in an UNCLAMPED channel is not repaired, so the incumbent's rejection stands and the candidate is held to it",
        consumerDirection:
            "SPLITS by channel, exactly as the adjudication reads it: `rgb(1e400 0 0)` widens (clamped to 255) and `lab(50 1e400 0)` stays rejected. A non-finite numeral OUTSIDE a colour call — `cubic-bezier(.319, 1e389, …)` — is in no class here: the GROUND-C ±Infinity contract is owner-owed and `W3.md` §10 does not open it.",
        matches: (src) => clampedNonFiniteEdits(src).length > 0,
        edits: (src) => clampedNonFiniteEdits(src),
    },
    {
        id: "PB-04/05",
        carries: ["PB-04", "PB-05"],
        kind: "repair",
        title: "out-of-range channels and alphas CLAMP rather than passing through or rejecting",
        expect: "accept",
        population: 8002, //  X.P.W3.n: +63, the guard's three retired clauses
        specCitation: "css-color-4 §8.1 and §12 — channel values are clamped to their range; §4.2 — an <alpha-value> outside [0,1] is clamped, not invalid",
        why: "a colour argument outside the range css-color-4 declares for its slot; the repair spells it AT the bound, which is what a clamp means",
        consumerDirection:
            "CHANGES VALUE and WIDENS acceptance. Out-of-range channels arrive clamped where the incumbent passed them through unclamped, and `rgb(1 2 3 / 1.5)` parses with alpha 1 where the incumbent rejected it. Downstream colour maths that compensated for the incumbent's unclamped values must stop compensating.",
        matches: (src) => outOfRangeArguments(src).length > 0,
        edits: (src) =>
            outOfRangeArguments(src).map(({ token, range }) => ({
                start: token.start,
                end: token.end,
                text: `${clampTo(token.unit === "%" ? token.value / 100 : token.value, range) * (token.unit === "%" ? 100 : 1)}${token.unit}`,
            })),
    },
    {
        id: "PB-01/02",
        carries: ["PB-01", "PB-02"],
        kind: "repair",
        title: "the legacy four-argument rgba()/hsla() forms parse",
        expect: "accept",
        population: 1122, //  X.P.W3.n: +12, the guard's three retired clauses
        specCitation: "css-color-4 §8.1 and §7.1 — `rgb()`/`rgba()` and `hsl()`/`hsla()` each admit a four-argument comma form ending in <alpha-value>",
        why: "a four-argument comma form on a head that HAS a legacy syntax; the repair drops the fourth argument, which is the only part the incumbent refuses",
        consumerDirection: "WIDENS acceptance: the most-deployed colour syntax on the web parses. No consumer that relied on acceptance is affected; one that read the rejection as a signal loses it.",
        matches: (src) => legacyAlphaEdits(src).length > 0,
        edits: (src) => legacyAlphaEdits(src),
    },

    /* ── the VALUE ruling: no verdict moves, the expected VALUE does ─────────────────────────── */
    {
        id: "PB-03",
        carries: ["PB-03"],
        kind: "value",
        title: "the two spec-identical hsl spellings agree — a bare number IS a percentage there",
        expect: null,
        population: 3022, //  X.P.W3.n: +31, the guard's three retired clauses
        specCitation: "css-color-4 §7 — in the modern hsl() form saturation and lightness are `[<percentage> | <number> | none]` and the two spellings name the same value; the incumbent scales only the percentage",
        why: "a space-separated hsl() whose saturation or lightness is a bare number; `ruledValue` scales it, and the candidate must answer with exactly that",
        consumerDirection:
            "CHANGES VALUE by a factor of 100 for `hsl(120 50 50)`: the incumbent returns 50, the candidate 0.5. A consumer that read the incumbent's bare-number saturation as a percentage got a value 100× too large; that arithmetic changes.",
        matches: (src) => bareNumberSlots(src).some((slots) => slots.length > 0),
    },
];

/** ADJ-3's repair: every non-finite numeral that sits in a CLAMPED slot, spelled at its bound. */
function clampedNonFiniteEdits(src) {
    if (typeof src !== "string" || nonFiniteNumerics(src).length === 0) return [];
    const edits = [];
    let unclamped = false;
    for (const call of colourCalls(src)) {
        const ranges = CHANNEL_RANGES[HEAD_SPACE[call.head] ?? ""] ?? [null, null, null];
        const alpha = alphaArgument(call);
        call.args.forEach((arg, index) => {
            const inAlpha = alpha !== null && alpha.index === index;
            const range = inAlpha ? ALPHA_RANGE : ranges[index];
            for (const token of arg) {
                if (token.kind !== "numeric" || Number.isFinite(token.value)) continue;
                if (!range) return; // an unclamped channel: NOT repaired, so the rejection stands
                const bound = token.value > 0 ? range[1] : range[0];
                // AN INFINITE BOUND IS NOT A CLAMP. `oklch()`'s chroma and `lch()`'s run to +∞
                // (css-color-4 §9.3/§9.5), so a non-finite chroma has nothing to be clamped TO and
                // the adjudication's "reject where none does" arm governs it: no repair, the
                // incumbent's rejection stands, and the candidate is held to it. (MEASURED: without
                // this the class claimed 43 cells at `parseCssColor` that the candidate rejects.)
                if (!Number.isFinite(bound)) {
                    unclamped = true;
                    return;
                }
                edits.push({ start: token.start, end: token.end, text: `${bound}${token.unit}` });
            }
        });
    }
    return unclamped ? [] : edits;
}

/**
 * PB-01/02's repair: drop the fourth comma argument of a legacy call, alpha and separator alike.
 *
 * ONLY when that argument is a WELL-FORMED legacy `<alpha-value>` — a bare number or a percentage (`none`
 * withdrawn by F-W5c-1, css-color-4 §4.2 ED). The ruling is about the FORM (four comma arguments), not
 * about the alpha's own spelling, so an input whose fourth argument is `7none-425`, `..66` or
 * `}9.969` carries a SECOND defect no ruling covers, and deleting it would make the repair claim
 * an input the ruling never reached. (MEASURED: without this guard the class claimed 24 cells at
 * `parseCssColor` and 57 at `parseCssValue` whose candidate answer — a rejection — contradicts the
 * expectation the class would have set. Those cells are now the honest remainder, by id.)
 */
function legacyAlphaEdits(src) {
    const edits = [];
    for (const call of colourCalls(src)) {
        if (separatorShape(call) !== "legacy" || call.args.length !== 4 || !LEGACY_HEADS.has(call.head)) continue;
        const third = call.args[2];
        const fourth = call.args[3];
        if (third.length === 0 || fourth.length === 0) continue;
        const numeric = soleNumeric(fourth);
        //  X.P.W5.g — F-W5c-1 (COHESION §0bx, re-ruled to the spec): the LEGACY `<alpha-value>` is
        //  `<number> | <percentage>` (css-color-4 §4.2 ED: "legacy forms do not support none"), so a
        //  `none` fourth argument is no longer a form this ruling repairs — the candidate refuses it,
        //  the incumbent refuses it, and the raw verdict stands. DIVERGENCE-LEDGER §14 carries the row.
        const wellFormed =
            numeric !== null && (numeric.unit === "" || numeric.unit === "%") && Number.isFinite(numeric.value) && !numeric.trailingDot;
        if (!wellFormed) continue;
        edits.push({ start: third[third.length - 1].end, end: fourth[fourth.length - 1].end, text: "" });
    }
    return edits;
}

/** Every colour argument whose numeric value falls outside the range css-color-4 declares for it. */
function outOfRangeArguments(src) {
    const out = [];
    for (const call of colourCalls(src)) {
        const space = HEAD_SPACE[call.head];
        const ranges = CHANNEL_RANGES[space ?? ""] ?? [null, null, null];
        const alpha = alphaArgument(call);
        call.args.forEach((arg, index) => {
            const n = soleNumeric(arg);
            if (n === null || !Number.isFinite(n.value)) return;
            const inAlpha = alpha !== null && alpha.index === index;
            const range = inAlpha ? ALPHA_RANGE : ranges[index];
            if (!range) return;
            // A percentage is read against its own reference range before it is compared: `50%` is
            // 0.5 of a [0,1] channel and 127.5 of rgb()'s [0,255] one (css-color-4 §8.1).
            const value = n.unit === "%" ? (space === "rgb" && !inAlpha ? (n.value * 255) / 100 : n.value / 100) : n.value;
            if (!(value >= range[0] && value <= range[1])) out.push({ call, index, token: n, range: inAlpha || space !== "rgb" || n.unit !== "%" ? range : [0, 100] });
        });
    }
    return out;
}

/** Per colour call, in source order, the argument indices spelled as a BARE NUMBER in a `%` slot. */
function bareNumberSlots(src) {
    return colourCalls(src).map((call) => {
        if (call.head !== "hsl" && call.head !== "hsla") return [];
        if (separatorShape(call) !== "modern") return []; // the legacy form is SP-1's, and it REJECTS
        const out = [];
        for (const index of [1, 2]) {
            const n = soleNumeric(call.args[index]);
            if (n !== null && n.unit === "") out.push(index);
        }
        return out;
    });
}

/**
 * THE VALUE RULING, APPLIED: PB-03's scaling first, then PB-04/05's clamp — over every colour the
 * ORACLE returned, wherever it sits inside the entry's own product (a colour, a scalar's payload, a
 * list's items, a stylesheet's declarations). The nth colour of the value is read against the nth
 * colour call of the SOURCE, in document order, so a declaration list keeps its spellings apart; a
 * source and value that do not line up are left unscaled, and the cell stays a miss.
 *
 * Returns the value the adjudication REQUIRES of the candidate and the ids that moved it. Nothing
 * here consults the candidate: this is the ruling's arithmetic, and the candidate is measured
 * against it. It is the IDENTITY wherever no ruling fires, so a row no ruling touches keeps exactly
 * the check it had before this section existed.
 */
export const ruledValue = (src, value) => {
    // PB-03's slots are matched to the value's HSL colours ALONE, in document order. A value carries
    // colours a call never spelled — `#69b`, `aliceblue` — so counting every colour against every
    // colour CALL slips the moment a stylesheet mixes the two (MEASURED: 48 cells at
    // `parseStylesheet` diverged on a lightness the ruling had already scaled, because the third
    // colour was read against the second call). An hsl() value can only have come from an hsl()
    // call, so this pairing cannot slip.
    const slots = bareNumberSlots(src);
    const hslSlots = colourCalls(src).flatMap((call, index) => (call.head === "hsl" || call.head === "hsla" ? [slots[index] ?? []] : []));
    const ids = new Set();
    let nth = 0;
    const walk = (v) => {
        if (Array.isArray(v)) return v.map(walk);
        if (isColourValue(v)) {
            const scale = v.space === "hsl" ? (hslSlots[nth] ?? []) : [];
            if (v.space === "hsl") nth += 1;
            const ranges = CHANNEL_RANGES[v.space] ?? [null, null, null];
            const channels = v.channels.map((channel, index) => {
                const scaled = scale.includes(index) && typeof channel === "number" ? channel / 100 : channel;
                if (!Object.is(scaled, channel)) ids.add("PB-03");
                const clamped = clampTo(scaled, ranges[index]);
                if (!Object.is(clamped, scaled)) ids.add("PB-04/05");
                return clamped;
            });
            const alpha = clampTo(v.alpha, ALPHA_RANGE);
            if (!Object.is(alpha, v.alpha)) ids.add("PB-04/05");
            return { ...v, channels, alpha };
        }
        if (v !== null && typeof v === "object") {
            const out = {};
            for (const [key, inner] of Object.entries(v)) out[key] = walk(inner);
            return out;
        }
        return v;
    };
    const ruled = walk(value);
    return { value: ruled, ids: [...ids] };
};

/**
 * The entries a COLOUR ruling reaches — every frozen entry whose argument is CSS text that may
 * carry a colour. `parseKeyframeSelector`, `parseAnimationTimeline` and `parseAnimationRange` read
 * text that cannot, and a colour ruling has nothing to say about them.
 */
export const COLOUR_TEXT_ENTRIES = Object.freeze([
    "parseCssColor",
    "parseCssScalar",
    "parseCssValue",
    "parseCssValues",
    "parseStylesheet",
    "coerceToSyntax",
]);

/** PB-12 is about a NUMBER, so it reaches every entry that reads one. */
const NUMBER_TEXT_ENTRIES = Object.freeze([...COLOUR_TEXT_ENTRIES, "parseTimingFunction", "parseKeyframeSelector"]);

const classEntries = (klass) => (klass.id === "PB-12" ? NUMBER_TEXT_ENTRIES : COLOUR_TEXT_ENTRIES);

/**
 * The literal rows' own scope. Measured, not assumed: the oracle answers `currentcolor` with
 * `color_context_required` through `parseCssColor` and with an ordinary keyword scalar through
 * `parseCssScalar`, so PB-13's ruling reaches exactly one entry. Every other literal row is about
 * a colour FUNCTION and reaches the colour-text entries.
 */
const literalEntries = (row) => (row.id === "PB-13" ? ["parseCssColor"] : COLOUR_TEXT_ENTRIES);

/**
 * `input → the adjudication that governs it`, for the matrix's oracle override.
 * Pre-`.k` callers may still ask for the unscoped index; passing an entry name scopes it, which is
 * law 5 above.
 */
export const adjudicationIndex = (entry = null) => {
    const index = new Map();
    for (const row of ADJUDICATIONS) {
        if (entry !== null && !literalEntries(row).includes(entry)) continue;
        for (const input of row.inputs) {
            index.set(input, {
                id: row.id,
                expected: row.expectByInput?.[input] ?? row.expect,
                valueDiffers: Boolean(row.valueDiffers),
                row,
            });
        }
    }
    return index;
};

/**
 * THE RESOLVER G-1 AND G-7 SHARE. One reading of "which ruling governs this cell, for this entry",
 * so the matrix and the differential cannot drift apart on the same input.
 *
 * `resolve(input, oracleAccepts)` returns `{ id, ids, expected, valueDiffers, literal }` or `null`.
 * A literal row wins over a class — the twenty-two witnessed inputs keep their own attribution —
 * then the REJECT classes resolve in declared order, and only then the ACCEPT side, which asks
 * `oracleAccepts` about the repaired source. `oracleAccepts` is the ORACLE's verdict function and
 * nothing else; a caller that passed the candidate's would be measuring the candidate against
 * itself, and the callers are `matrix.mjs` and `lib/differential.mjs`, both of which pass the
 * published module.
 */
export const adjudicator = (entry) => {
    const literal = adjudicationIndex(entry);
    return (input, oracleAccepts = null) => {
        const hit = literal.get(input);
        if (hit) return { ...hit, ids: [hit.id], literal: true };
        if (outsideEveryClass(input)) return null;
        for (const klass of CLASSES) {
            if (klass.kind !== "reject" || !classEntries(klass).includes(entry)) continue;
            if (klass.matches(input)) return { id: klass.id, ids: [klass.id], expected: "reject", valueDiffers: false, literal: false };
        }
        if (typeof oracleAccepts !== "function") return null;
        // THE REPAIR TEST. Every applicable repair is applied AT ONCE — an input carrying two ruled
        // defects is explained by both rulings or by neither — and the ORACLE is asked once.
        const edits = [];
        const ids = [];
        for (const klass of CLASSES) {
            if (klass.kind !== "repair" || !classEntries(klass).includes(entry)) continue;
            const own = klass.edits(input);
            if (own.length === 0) continue;
            edits.push(...own);
            ids.push(klass.id);
        }
        if (edits.length === 0) return null;
        const repaired = spliceAll(input, mergeEdits(edits));
        if (repaired === input || !oracleAccepts(repaired)) return null;
        return { id: ids.join("+"), ids, expected: "accept", valueDiffers: false, literal: false };
    };
};

/**
 * Two rulings may name the SAME argument — an out-of-range alpha is both PB-04/05's clamp and
 * PB-01/02's dropped fourth argument — and applying both would splice one edit inside the other's
 * span and hand the oracle a corrupted string. (MEASURED: it did, on 214 cells at `parseCssColor`;
 * the repaired source read `rgb(114, 46.701, 163, 1` and the oracle rejected it, so the class never
 * fired and the cells stood as misses.) The WIDEST repair wins, because the ruling that removes the
 * whole argument subsumes the one that rewrites a token inside it.
 */
const mergeEdits = (edits) => {
    const sorted = [...edits].sort((a, b) => a.start - b.start || b.end - a.end);
    const kept = [];
    for (const edit of sorted) {
        const last = kept[kept.length - 1];
        if (last && edit.start < last.end) continue; // contained in, or overlapping, a wider edit
        if (last && edit.start === last.start && edit.end === last.end) continue;
        kept.push(edit);
    }
    return kept;
};

/**
 * The per-class POPULATION over a corpus, measured — the pinned `population` field's own subject.
 * `census` (the cells a class actually governed) is counted by the matrix, per entry, and asserted
 * `≤` this. A class whose live population has drifted from its pin is reported, never re-pinned
 * silently: the corpus is sha-asserted, so a drift means the predicate moved.
 */
export const classPopulations = (rows) => {
    const out = [];
    for (const klass of CLASSES) {
        let matched = 0;
        for (const row of rows) if (!outsideEveryClass(row.s) && klass.matches(row.s)) matched += 1;
        out.push({ id: klass.id, kind: klass.kind, title: klass.title, pinned: klass.population, measured: matched, agrees: matched === klass.population });
    }
    return out;
};

/**
 * THE HONEST REMAINDER, BY ID (`W3.md` §6 G-1: "52/52 **or the honest remainder, by id**").
 * A miss no class governs is attributed to the ESCALATION or the OWNER-OWED question that owns it,
 * measured from the input, never guessed. `unattributed` is a real answer and is printed as one —
 * a remainder that cannot be named is the finding, not a rounding error.
 */
/* ══════════════════════════════════════════════════════════════════════════════════════════════
   X.P.W3.n — THE RESIDUAL CLASSES (COHESION §0w), one predicate per RULED id.

   `.m` left the remainder as a first-match cascade of prose tags, and said so: "`remainderId` is a
   first-match cascade, so its printed tag is the first rule that fires, not always the mechanism".
   §0w rules every residual class and fixes the id-set X.P.W4's OP-2 biconditional is checked
   against — `{GROUND-C · ID-1/ID-1b · ID-2 · ID-3 · ID-4 · ID-5 · PB-11 · R-f1 · E-k2}` — so the
   cascade becomes a TABLE: one row per ruling, each with the ruling's own predicate over the INPUT,
   its measured population, and a census the gate prints and asserts `≤` it. A tag that is not a
   ruled class is not a member (§0w), so BND-1, SH-1, F-k1, F-k2, F-k4 and F-m1 do not appear here:
   each was either cured at this unit or promoted to the ruling that owns its mechanism.

   TWO OF THE NINE ARE NOT THE MATRIX'S. **R-f1** (which bound fires first at the depth suites) and
   **E-k2** (the un-measurable class-1 capacity bounds) are read by G-9, never by a G-1 cell, and
   are named here so the id-set is one list rather than two.

   ORDER IS MEANING, as it is in `CLASSES`: a cell whose source carries TWO ruled constructs is
   attributed to the one that explains the VERDICT, so the incumbent's lax NAME read is read before
   the numerals inside the value it names, and the paren scan before the component read.
   ══════════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * **ID-4's predicate, in the ruling's own terms.** §0w: "the incumbent's `blocks()` signed paren
 * counter mis-tracks nesting; css-syntax-3 consumes blocks with a stack". The two readings differ at
 * exactly one place: a `)` that closes NOTHING. `blocks()` does `else if (char === ")") parens--`,
 * so the counter goes NEGATIVE and every later `{` or `;` is invisible to it (the prelude runs to
 * the end and the rule is refused); css-syntax-3 §5.4.9 has nothing on the stack to pop, the `)` is
 * a stray token, and the next `{` opens the block. Quote handling is the incumbent's own
 * (`stylesheet.ts` `blocks()`: a quote opens a string, a backslash escapes the closer).
 */
export const unmatchedCloseParen = (src) => {
    if (typeof src !== "string") return false;
    let depth = 0;
    let quote = "";
    for (let i = 0; i < src.length; i += 1) {
        const c = src[i];
        if (quote) {
            if (c === quote && src[i - 1] !== "\\") quote = "";
            continue;
        }
        if (c === '"' || c === "'") quote = c;
        else if (c === "(") depth += 1;
        else if (c === ")") {
            if (depth === 0) return true; //  the counter goes NEGATIVE here; the stack does not
            depth -= 1;
        }
    }
    return false;
};

/**
 * **ID-1b's predicate.** §0w: "the incumbent accepts `col!r` as a declaration NAME and `-!important`
 * as a keyword — ID-1's mechanism one production up". `parseDeclarations` takes
 * `row.slice(0, row.indexOf(":"))` as the NAME whatever bytes stand in it, and `/!important\s*$/i`
 * matches with no token boundary in front of the `!`; css-syntax-3 §5.4.4 reads a declaration's
 * name as an <ident-token> and §5.4.10's `!important` follows a component value, so neither run is
 * one token. The predicate is the byte shape both readings turn on: a `!` with no boundary before
 * it and an ident start after it.
 */
export const unanchoredBangRead = (src) => typeof src === "string" && /[^\s,/(]![A-Za-z]/.test(src);

/**
 * **ID-1b's OTHER shape, measured by replaying the incumbent's own two functions.** The `!` byte
 * shape above is what `.m` could see from outside; the RULING is about the production. The
 * incumbent takes a declaration's name as `row.slice(0, row.indexOf(":"))` over a part of
 * `splitTopLevel(body, ";")`, and that split is PAREN-aware and BRACE-BLIND — so a name may cross
 * an inner `{`. Replayed here (`blocks()`'s scanner and the `;` split, byte for byte from
 * `stylesheet.ts` at the pin), the predicate fires exactly when the incumbent reads, as a NAME,
 * a run that css-syntax-3 §4.3.11 does not admit as an `<ident-token>`.
 *
 * THIS IS WHERE `.m`'s LAST TWO E-j1 CELLS GO, and the re-characterization is X.P.W3.n's finding,
 * not a fold: `@property --ratio { … } h1, h2 { <comment> img { @container (width > 400px) { nav {
 * margin: 0 auto; … } } transition: opacity 200ms } … }` is a DIVERGENT_VALUE because the incumbent
 * reads `@container (width > 400px) { nav { margin` as a declaration NAME (measured: that string is
 * the `name` field of its first declaration) where css-syntax-3 §5.4.4 starts an AT-RULE on an
 * `<at-keyword-token>`. The candidate reads the nested at-rule, which is the spec's answer; the
 * difference is the incumbent's lax name production — ID-1's mechanism one production up, which is
 * what §0w defines ID-1b to be — and NOT a candidate gap.
 */
const IDENT_TOKEN = /^--?[-_a-zA-Z0-9\u0080-￿]*$|^[-_a-zA-Z\u0080-￿][-_a-zA-Z0-9\u0080-￿]*$/;

/** `splitTopLevel(src, ";")` — `grammar.ts` at the pin: paren-depth and quote aware, empty parts dropped. */
const semiParts = (src) => {
    const parts = [];
    let depth = 0;
    let quote = "";
    let start = 0;
    for (let i = 0; i < src.length; i += 1) {
        const c = src[i];
        if (quote) {
            if (c === quote && src[i - 1] !== "\\") quote = "";
            continue;
        }
        if (c === '"' || c === "'") { quote = c; continue; }
        if (c === "(") depth += 1;
        else if (c === ")") depth -= 1;
        else if (depth === 0 && c === ";") {
            const part = src.slice(start, i).trim();
            if (part) parts.push(part);
            start = i + 1;
        }
    }
    const tail = src.slice(start).trim();
    if (tail) parts.push(tail);
    return parts;
};

/** `blocks()` — `stylesheet.ts` at the pin, its bodies alone (the preludes are ID-4's subject). */
const blockBodies = (src) => {
    const out = [];
    let cursor = 0;
    while (cursor < src.length) {
        while (cursor < src.length) {
            while (/\s|;/.test(src[cursor] ?? "")) cursor += 1;
            if (!src.startsWith("/*", cursor)) break;
            const end = src.indexOf("*/", cursor + 2);
            if (end < 0) return out;
            cursor = end + 2;
        }
        if (cursor >= src.length) break;
        let quote = "";
        let parens = 0;
        let boundary = -1;
        for (let i = cursor; i < src.length; i += 1) {
            const c = src[i];
            if (quote) {
                if (c === quote && src[i - 1] !== "\\") quote = "";
                continue;
            }
            if (c === '"' || c === "'") quote = c;
            else if (c === "(") parens += 1;
            else if (c === ")") parens -= 1;
            else if (parens === 0 && (c === "{" || c === ";")) { boundary = i; break; }
        }
        if (boundary < 0) return out;
        if (src[boundary] === ";") { cursor = boundary + 1; continue; }
        let depth = 1;
        quote = "";
        let end = boundary + 1;
        for (; end < src.length && depth > 0; end += 1) {
            const c = src[end];
            if (quote) {
                if (c === quote && src[end - 1] !== "\\") quote = "";
                continue;
            }
            if (c === '"' || c === "'") quote = c;
            else if (c === "{") depth += 1;
            else if (c === "}") depth -= 1;
        }
        if (depth !== 0) return out;
        out.push(src.slice(boundary + 1, end - 1));
        cursor = end;
    }
    return out;
};

export const nonIdentDeclarationName = (src, depth = 0) => {
    if (typeof src !== "string" || depth > 8) return false;
    for (const body of blockBodies(src)) {
        for (const part of semiParts(body)) {
            const colon = part.indexOf(":");
            if (colon > 0 && !IDENT_TOKEN.test(part.slice(0, colon).trim())) return true;
        }
        if (nonIdentDeclarationName(body, depth + 1)) return true;
    }
    return false;
};

/** **ID-2's predicate**: an EMPTY part in a comma-separated argument list (`steps(1e43,, start)`). */
export const emptyCommaPart = (src) => typeof src === "string" && /\(\s*[^()]*,\s*,/.test(src);

export const RESIDUAL_CLASSES = [
    {
        id: "ID-3",
        title: "the incumbent accepts a NON-STRING as an empty stylesheet",
        population: 0, //  MEASURED: a non-string is not a union ROW; ID-3's subjects are the seven declared boundary cases beside them.
        specCitation: "css-syntax-3 §3 — parsing operates on a stream of code points; a non-string has no parse, so `[]` is not the answer.",
        ruling: "INCUMBENT DEFECT, UNADJUDICATED → X.P.W4 (DIVERGENCE-LEDGER §9 ID-3)",
        matches: (src) => typeof src !== "string",
    },
    {
        id: "ID-1b",
        title: "the incumbent reads `col!r` as a declaration NAME and `-!important` as a keyword",
        population: 534, //  MEASURED at 27,021 rows (X.P.W3.n) — the `!` byte shape alone matches 146; the incumbent's own name read adds the rest
        specCitation: "css-syntax-3 §5.4.4 — a declaration's name is an <ident-token>; §5.4.10 — `!important` follows a component value. A run with no token boundary before the `!` is neither.",
        ruling: "INCUMBENT DEFECT, UNADJUDICATED → X.P.W4's fresh adjudicator (§0w: ID-1's predicate extended)",
        matches: (src) => unanchoredBangRead(src) || nonIdentDeclarationName(src),
    },
    {
        id: "ID-4",
        title: "`blocks()`'s SIGNED paren counter goes negative where css-syntax-3's stack does not",
        population: 1172, // MEASURED at 27,021 rows (X.P.W3.n)
        specCitation: "css-syntax-3 §5.4.9 — a simple block is consumed to its MATCHING closer; a `)` with nothing open is a stray token, not a depth of −1.",
        ruling: "INCUMBENT DEFECT, UNADJUDICATED → X.P.W4 (DIVERGENCE-LEDGER §9 ID-4)",
        matches: unmatchedCloseParen,
    },
    {
        id: "ID-5",
        title: "the legacy comma form mixes `<number>` with `<percentage>`, or spells `none`",
        population: 1506, //  MEASURED at 27,021 rows (X.P.W3.n) — the same predicate `CLASSES`'s ID-5 row carries, read WITHOUT that table's ID-1b guard (1,501 there)
        specCitation: "css-color-4 §8.1 / §7.1 — three arguments of ONE type, and `none` only in the modern grammar.",
        ruling: "INCUMBENT DEFECT (DIVERGENCE-LEDGER §9 ID-5); the candidate's §8.1 cure landed at X.P.W3.n",
        matches: (src) => legacyFormMisaccept(src),
    },
    {
        id: "GROUND-C",
        title: "a numeral that overflows to ±Infinity",
        population: 1069, // MEASURED at 27,021 rows (X.P.W3.n)
        specCitation: "css-syntax-3 §4.3.13 — the conversion yields ±Infinity and that is not a syntax error; css-values-4 §5.1 — range support and clamping are the consumer's.",
        ruling: "RULED at COHESION §0v: per-cell adjudication at X.P.W4's fresh adjudicator; `<finite-number>` as a rejection label REFUSED",
        matches: (src) => nonFiniteNumerics(src).length > 0,
    },
    {
        id: "ID-2",
        title: "the incumbent accepts an EMPTY argument in a comma-separated list",
        population: 45, //   MEASURED at 27,021 rows (X.P.W3.n)
        specCitation: "css-syntax-3 §5.4.1 / css-values-4 §2.1 — the parts of a comma-separated list are component values; an EMPTY part is not one.",
        ruling: "INCUMBENT DEFECT, UNADJUDICATED → X.P.W4 (DIVERGENCE-LEDGER §9 ID-2)",
        matches: emptyCommaPart,
    },
    {
        id: "ID-1",
        title: "the incumbent's UNANCHORED component read — a component value with trailing garbage",
        population: 7076, // MEASURED at 27,021 rows (X.P.W3.n)
        specCitation: "css-syntax-3 §5.4.7 — a component value is consumed WHOLE; §5.4.4's trailing-input condition makes the declaration invalid.",
        ruling: "INCUMBENT DEFECT, UNADJUDICATED → X.P.W4 (DIVERGENCE-LEDGER §9 ID-1)",
        matches: (src) => unanchoredComponentRead(src),
    },
    {
        id: "PB-11",
        title: "the ORACLE ACCEPTS a comma form on a head css-color-4 gives no legacy syntax (F-l3)",
        population: 1, //  MEASURED at 27,021 rows (X.P.W3.n) — `hwb(10, 10%, 10%)`, F-l3's own witness
        specCitation: "css-color-4 §8 / §9 — hwb(), lab(), lch(), oklab(), oklch() and color() take space-separated components only.",
        ruling: "INCUMBENT-DEFECT OBSERVATION under PB-11 (§0w); adjudicated at X.P.W4",
        matches: (src) => colourCalls(src).some((call) => separatorShape(call) === "legacy" && !LEGACY_HEADS.has(call.head)),
    },
];

/** The §0w id-set, as one list — the two G-9 members included, so the biconditional reads from here. */
export const RULING_IDS = Object.freeze([...RESIDUAL_CLASSES.map((k) => k.id), "R-f1", "E-k2"]);

/**
 * THE HONEST REMAINDER, BY ID (`W3.md` §6 G-1: "52/52 **or the honest remainder, by id**").
 * A miss no class GOVERNS is attributed to the RULING that owns its mechanism, measured from the
 * input and never guessed. `unattributed` is a real answer and is printed as one — a remainder that
 * cannot be named is the finding, not a rounding error, and X.P.W4's OP-2 biconditional is exactly
 * "no cell reads `unattributed`".
 */
export const remainderId = (src) => {
    for (const klass of RESIDUAL_CLASSES) if (klass.matches(src)) return klass.id;
    return "unattributed";
};

/** The per-class POPULATION over a corpus — `classPopulations`' twin, for the residual table. */
export const residualPopulations = (rows) =>
    RESIDUAL_CLASSES.map((klass) => {
        let matched = 0;
        for (const row of rows) if (klass.matches(row.s)) matched += 1;
        return { id: klass.id, title: klass.title, ruling: klass.ruling, pinned: klass.population, measured: matched, agrees: matched === klass.population };
    });

/**
 * ADJ-2's SUBJECT, and only it: a juxtaposition INSIDE A COLOUR CALL's arguments.
 *
 * The ruling's three inputs are `rgb(50%20%30%)`, `rgb(1.5.5 3)` and `hsl(120 50%50%)`, and its
 * consumer direction names colour calls alone; `hasJuxtaposedOperands` answers about the WHOLE
 * string, so the class also claimed `#ff0.99cc` and `steps(5e-2%28)` — where inserting a space
 * happens to make the ORACLE accept, for a reason the ruling never reached. Those cells then read
 * as adjudications the candidate failed to honour (MEASURED: 33 at `parseCssValue`, 33 at
 * `parseCssValues`, 33 at `coerceToSyntax`), which is precisely E-h2's "a predicate that swallows
 * an un-ruled input is itself a defect". They now stay in the honest remainder under ID-1.
 */
const colourJuxtapositions = (src) => {
    if (typeof src !== "string" || !hasJuxtaposedOperands(src)) return [];
    const spans = colourCalls(src)
        .map((call) => {
            const tokens = call.args.flat();
            return tokens.length === 0 ? null : [tokens[0].start, tokens[tokens.length - 1].end];
        })
        .filter((span) => span !== null);
    return juxtapositionBoundaries(src).filter((at) => spans.some(([from, to]) => at > from && at < to));
};

/**
 * **ID-5's SUBJECT** (X.P.W3.n; COHESION §0w) — the legacy comma form css-color-4 forbids.
 *
 * `.k` named it F-k2 and could not cure it (`src/css/**` was outside that unit's bounds); `.l`
 * landed the §8.1 cure TWICE and withdrew it both times, because a cure with no adjudication turns
 * 575 oracle-accepted cells into FALSE_REJECTs. §0w rules the residue **incumbent defect ID-5** and
 * orders the two to land together. This predicate is the adjudication's half.
 *
 * WHAT IT SAYS, in the specification's own terms and over the INPUT alone (law 1):
 *   §8.1  `<legacy-rgb-syntax> = rgb( <percentage>#{3} , <alpha-value>? ) |
 *          rgb( <number>#{3} , <alpha-value>? )` — the three channels are ONE type, and `none`
 *          belongs to the modern grammar alone.
 *   §7.1  `<legacy-hsl-syntax> = hsl( <hue>, <percentage>, <percentage>, <alpha-value>? )` — the
 *          hue is `<number>|<angle>` and saturation/lightness are `<percentage>`; `none` is
 *          nowhere in it.
 *   §4.2  `<alpha-value> = <number> | <percentage> | none` — so the FOURTH argument is NOT this
 *          predicate's business, and `rgb(58%, 14%, .816, none)`'s `none` is lawful there.
 *
 * TWO THINGS IT DELIBERATELY DOES NOT CLAIM, each measured:
 *   `hsl(120, 50%, 50%)` — the hue is a `<number>` and the other two are `<percentage>`, which is
 *   the §7.1 form ITSELF. `.k`'s version read the three arguments of EVERY legacy head as one
 *   homogeneous list and so fired on this input (measured at this seat before the rewrite); as a
 *   remainder tag that was invisible, as a REJECT class it would have declared the most-deployed
 *   legacy spelling on the web invalid. The hsl arm is therefore read per SLOT.
 *   `hsl(120, 50, 50)` — a bare number where §7.1 writes `<percentage>`. That is **SP-1**, which is
 *   already a ruled class and resolves BEFORE this one; one meaning, one row.
 */
const legacyArgumentKind = (arg) => {
    const numeric = soleNumeric(arg);
    if (numeric !== null) return numeric.unit === "%" ? "percentage" : numeric.unit === "" ? "number" : "other";
    const ident = soleIdent(arg);
    if (ident !== null) return ident.text.toLowerCase() === "none" ? "none" : "other";
    return "other";
};

export const legacyFormMisaccept = (src) => {
    if (typeof src !== "string") return false;
    for (const call of colourCalls(src)) {
        if (separatorShape(call) !== "legacy" || !LEGACY_HEADS.has(call.head)) continue;
        const three = call.args.slice(0, 3);
        if (three.length < 3) continue;
        const kinds = three.map(legacyArgumentKind);
        if (kinds.includes("none")) return true; //                          `none` — §8.1 / §7.1
        if (call.head === "hsl" || call.head === "hsla") continue; //        the rest is SP-1's slot reading
        if (kinds.includes("percentage") && kinds.includes("number")) return true; // mixed — §8.1
    }
    return false;
};

/**
 * **F-k1**, measured by this seat and NOT adjudicated by it: the incumbent reads a component value
 * with an UNANCHORED regex and ignores what follows — `rgb(.589, 54.644, .887, 7none-425)`,
 * `cubic-bezier(-293, +10, 43.6-49, 160)`, `#ff0.99cc` all ACCEPT there and reject here. Per
 * css-syntax-3 §5.4.7 a component value is consumed WHOLE, so the candidate's rejection is
 * spec-correct and the acceptance is an R-class mis-accept of the incumbent's.
 *
 * It is reported, rowed in the ledger's INCUMBENT-DEFECT family and counted — and it governs NO
 * cell. Minting an adjudication that turns these misses into declared divergences would be this
 * seat adjudicating its own union, which M-23 §1 reserves for a FRESH Fable adjudicator (SP-1, the
 * same shape, came from `.e` and was ruled at COHESION §0p). The cells therefore stay in G-1's
 * honest remainder under this id, with their owner named.
 */
export const unanchoredComponentRead = (src) => {
    if (typeof src !== "string") return false;
    if (/#[0-9A-Fa-f]{3,8}[.+\-][^\s,)]/.test(src)) return true; // a hex token with a tail
    for (const call of callsOf(src, [...COLOUR_HEADS, "cubic-bezier", "steps", "linear"])) {
        for (const arg of call.args) {
            const numeric = soleNumeric(arg);
            if (numeric !== null && numeric.unit !== "" && numeric.unit !== "%") return true; // `7none-425`
            const operands = arg.filter((t) => t.kind !== "ws");
            if (operands.length > 1 && operands.every((t) => t.kind === "numeric" || t.kind === "ident" || t.kind === "punct")) return true;
        }
    }
    return false;
};

/** Every input any adjudication governs — the band the coercer crosses exhaustively. */
export const adjudicatedInputs = () => ADJUDICATIONS.flatMap((r) => r.inputs);
