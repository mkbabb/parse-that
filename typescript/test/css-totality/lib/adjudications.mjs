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

/** `input → the adjudication that governs it`, for the matrix's oracle override. */
export const adjudicationIndex = () => {
    const index = new Map();
    for (const row of ADJUDICATIONS) {
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

/** Every input any adjudication governs — the band the coercer crosses exhaustively. */
export const adjudicatedInputs = () => ADJUDICATIONS.flatMap((r) => r.inputs);
