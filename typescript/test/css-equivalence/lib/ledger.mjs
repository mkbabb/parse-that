// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — THE DIVERGENCE LEDGER, AS DATA, WITH ITS TWO HALVES MEASURED.
//
// `W3.md` §5 `.d`: "Every remaining difference is a row in `DIVERGENCE-LEDGER.md` carrying: input,
// incumbent result, candidate result, spec citation, adjudication, and the **direction of
// behaviour change for a consumer**." §6 G-7's falsifier is blunt about the last field: "A row
// whose 'direction of behaviour change for a consumer' field is empty fails; that field is what the
// KF and glass packets quote."
//
// SEVEN FAMILIES, EACH WITH ITS AUTHORITY (F and G added by `## Repair 1 — round 4`, the F-L1 /
// ESC-g1 cure; the five below it are unmoved):
//
//   A · ADJUDICATED    `.a`'s sixteen — `lib/adjudications.mjs`, out of `parser-band.md`. One
//                      family with this seat by `X-P-W3.md` §P.1: "every conflict `.a` resolves
//                      against `parser-band.md` MUST appear as a `.d` row." They are imported, not
//                      re-typed, so the two halves of the family cannot drift apart.
//   B · DISSENT        the four preserved DISSENTS `W3.md` §2c names (token juxtaposition ·
//                      non-finite numerals · try/catch posture · bench epistemics), carried from
//                      `harness/equivalence/declared-divergences.ts`, which anchors each in
//                      `parser-band.md`'s own bytes.
//   C · FIXTURE        R1–R5 from `GATE-VERDICT.md` F-2 — held as SPEC-CORRECT regression fixtures.
//                      "The mirror preserves spec-correctness, never bug-compatibility."
//   D · LABEL          F-b4, routed to this seat by `.b` inside the wave: the candidate's
//                      `ParseIssue.expected` are PROMOTED labels, not cand-O's raw σ labels. That
//                      is G-8's cure and debt 1's ask, and it is a behaviour difference.
//   E · NARROWING      the declared coverage narrowing — the sixteen frozen runtime exports and the
//                      twenty-eight frozen type exports the candidate does not realize. The P-1
//                      taxonomy makes COVERAGE_NARROWING a declared NON-defect *on condition that
//                      it is declared*; this is the declaration, and it is generated from the
//                      candidate's own `UNREALIZED_ENTRIES` and the pinned barrel, never listed.
//   F · CAPACITY       the nine declared capacity bounds `.f` landed on BOTH lowerings under
//                      COHESION §0p/§0q — a consumer-visible narrowing of the accepted language on
//                      the shipped JS target that no row declared (**F-L1**). Generated from
//                      `bounds.mjs`'s own `CAPACITY_REGIONS`, never listed, so it cannot drift
//                      from Θ; the witness coordinates are binary-searched at generation.
//   G · SPEC-DIVERGENCE the wave's own spec-cited divergences on entries the candidate DOES realize
//                      — SP-1, the legacy-`hsl()` mis-accept `.e` found under L-14 and returned as
//                      F-e2 "for a `.d`-emitted row". The five families above were each closed to
//                      it by their own authority (**ESC-g1**); this is the sixth it needed.
//
// NOTHING HERE ADJUDICATES. `.e` is the fresh Fable adjudicator (M-23 §1) and holds the ledger's
// §Adjudication section; an author cannot adjudicate his own union. This file states each row's
// ruling AS ALREADY RULED ELSEWHERE, with the citation, and measures what the two engines actually
// do. Where no ruling exists — the non-finite contract question, the bench bar — the row says so
// and names the owner, which is what "PRESERVED, UNRESOLVED" means.

import { readFileSync } from "node:fs";

import { ADJUDICATIONS } from "../../css-totality/lib/adjudications.mjs";
import { UNREALIZED_ENTRIES } from "../../../src/css/entry.mjs";
import {
    CAPACITY,
    CAPACITY_LABELS,
    CAPACITY_REGIONS,
    CLASS3_PROOF,
    INPUT_BOUND,
    THETA,
    WITNESS_PRODUCTION,
    witnessAtCapacity,
} from "../../../src/css/bounds.mjs";
import { callOracle } from "./oracle.mjs";

export const GATE_VERDICT_PATH =
    "/Users/mkbabb/Programming/value.js/docs/tranches/V/apotheosis/parser-proof/GATE-VERDICT.md";

/**
 * The ONE canonical `DIVERGENCE-LEDGER.md` — `W3.md` §4's own row, and the file G-7 reads. Held
 * here so the emitter, the suite and any successor address the same bytes by one name: it was
 * duplicated as a literal in `equivalence.test.ts` and in nothing else, and a second literal is how
 * a carry starts reading a file that is not the artefact (**F-y2**).
 */
export const CANONICAL_LEDGER_PATH =
    "/Users/mkbabb/Programming/value.js/docs/tranches/X/parse-that/DIVERGENCE-LEDGER.md";

/* ── family B: the four preserved DISSENTS ─────────────────────────────────────────────────── */

export const DISSENTS = [
    {
        id: "S-1",
        title: "Token juxtaposition",
        anchor: "**Token juxtaposition**",
        inputs: ["rgb(50%20%30%)", "rgb(1.5.5 3)", "hsl(120 50%50%)"],
        incumbentPosture: "REJECT (published rejects; cand-F rejects)",
        candidatePosture:
            "ACCEPT — the css-syntax token-stream reading the adjudication adopted. SPLIT BY MEASUREMENT at X.P.W3.g (COHESION §0p F-e1/F-e2): the adopted reading is maximal-munch, and maximal-munch is what makes a juxtaposed NUMBER+IDENT run ONE <dimension-token> (§4.3.3). The three inputs above juxtapose `%`-terminated and `.`-led tokens, which ARE separate tokens, and they are still accepted; `hsl(120deg50%50%)` and `rgb(255none none)` are NOT — they were accepted before `.g` and are now rejected, which is the same reading applied where it bites rather than a second reading. The incumbent rejects those two as well, so the split ADDS no divergence: it removed seven MIS_ACCEPT cells from G-7 (5,890 → 5,883, measured).",
        specCitation:
            "css-syntax-3 §4 — tokenization is maximal-munch over the code-point stream, so `50%20%` is two tokens; browsers agree. §4.3.3 is the same rule's other edge: after a number, code points that would start an ident sequence (§4.3.9) are consumed as the token's UNIT, so `255none` is one <dimension-token> and `deg50` is not `deg`.",
        adjudication:
            "ADOPTED toward cand-O (parser-band.md VERDICT). PRESERVED, UNRESOLVED as a DISSENT: the ruling WIDENS acceptance relative to the incumbent and the owner may overrule toward cand-F's stricter line.",
        consumerDirection:
            "WIDENS acceptance. A consumer that fed `rgb(50%20%30%)` and read the rejection as 'malformed' now receives a colour. No consumer that relied on acceptance is affected. If the owner overrules toward cand-F, this row reverses and the reversal is a breaking change for anyone who came to depend on the widening — which is why the row is pinned before adoption, not after.",
    },
    {
        id: "S-2",
        title: "Non-finite numerals",
        anchor: "**Non-finite numerals**",
        inputs: ["rgb(1e400 0 0)", "lab(50 1e400 0)", "hsl(1e400 0% 50%)"],
        incumbentPosture: "REJECT outright",
        candidatePosture:
            "CLAMP where a clamp exists (`rgb(1e400 0 0)` → 255), REJECT the unclamped non-finite channel — lowered onto `css_syntax`, because the frozen union has eight codes and `color_non_finite` is not one of them",
        specCitation:
            "css-values-4 §10.9 — a calculation producing a value outside the allowed range is clamped to that range; css-color-4 §4.1 — rgb() channels are clamped to [0,255]",
        adjudication:
            "PRESERVED, UNRESOLVED — a three-way split (published rejects · cand-O clamps-then-rejects · cand-F admits Infinity). The GROUND-C contract question (are ±Infinity admitted?) is OWNER-OWED and `W3.md` §10 lists it under 'Not opened here'. `.a` carried the adjudication at its MEANING and rowed the naming difference rather than minting a ninth ParseIssue code, which would be a §3a halt.",
        consumerDirection:
            "SPLITS by channel. `rgb(1e400 0 0)` WIDENS (the incumbent rejects; the candidate clamps to 255). `lab(…)`/`hsl(…)` with a non-finite hue stay rejected, so nothing narrows. A consumer reading the diagnostic code sees `css_syntax` where cand-O's own vocabulary would have said `color_non_finite`: the code is less specific than the research prototype's, and deliberately so — the frozen eight-code union is a contract, not a preference.",
    },
    {
        id: "S-3",
        title: "try/catch posture",
        anchor: "**try/catch posture**",
        inputs: [],
        incumbentPosture: "n/a — a posture, not an input; the incumbent ships no shield and throws (R1)",
        candidatePosture:
            "cand-O's outer guard RETAINED as a proven non-load-bearing shield; `.c` measured 160,710 raw unshielded calls with 0 throws and `SHIELD.caught` = 0",
        specCitation: "not a specification question — an engineering posture over the same frozen `ParseResult` contract",
        adjudication:
            "PRESERVED, UNRESOLVED. cand-F holds a shield converts an impossible bug into a silent `ok:false` and ships without one. `W3.md` §5 `.c` makes that position tenable 'if `.c` lands the depth bound' — the bound IS landed (`.c`, `<p2>` `f14f59f`) — and states removal is 'a live option for X.P.W4, not a decision here'. It is not decided here either.",
        consumerDirection:
            "NONE TODAY, by measurement: the shield has never fired, so no consumer has ever received a shield-shaped result. The direction is contingent — if X.P.W4 removes it, a future combinator defect would surface as a throw rather than as `ok:false`, which is cand-F's whole argument; if it stays, such a defect would surface as `ok:false` with `SHIELD.caught` incremented and the fault recorded.",
    },
    {
        id: "S-4",
        title: "Bench epistemics",
        anchor: "**Bench epistemics**",
        inputs: [],
        incumbentPosture: "the 07-20 gate's recorded reading: 'LIVE regex measured FASTEST ~1.8×'",
        candidatePosture:
            "three independent measurements (two candidates and an arbiter, three methods) read the opposite direction; this wave's own three-leg table is a fourth",
        specCitation: "not a specification question — a measurement-epistemics question",
        adjudication:
            "PRESERVED, UNRESOLVED and OWNER-GATED. COHESION §0j.E OC-1: 'ADMISSION IS DECIDED ON CORRECTNESS; the bench table is RECORDED-NOT-GATING.' `W3.md` §6 G-10: 'Inventing a bar is a defect.' The contradiction with the 07-20 reading is carried as a ROW in the bench table, never reconciled and never erased.",
        consumerDirection:
            "NONE. No consumer behaviour changes on this row; it changes what a READER of the bench table may conclude. The row exists so that a future reader meeting two opposite readings finds both, with their methods, rather than one that quietly survived.",
    },
];

/* ── family C: R1–R5, the spec-correct regression fixtures ─────────────────────────────────── */

export const FIXTURES = [
    {
        id: "R1",
        title: "empty functional colour bodies throw",
        anchor: "`parseCssColor(\"oklch()\")`",
        inputs: ["oklch()", "rgb()", "hsl()", "rgba()", "lab()", "color()"],
        incumbentPosture: "THROWS `TypeError` from `parseFunctionalColor` (`src/css/grammar.ts` ~L181) — a shipping crash",
        candidatePosture: "`ok:false` with `css_syntax` and a non-empty diagnostics tuple — the frozen contract's own promise",
        specCitation:
            "`src/css/types.ts:25-27` — `ParseResult<T>` is `{ok:true,…} | {ok:false, diagnostics:[ParseIssue, ...ParseIssue[]]}`; a function that throws has not failed to be fast, it has failed to have the type it declares (`W3.md` §2a)",
        adjudication:
            "SPEC-CORRECT REGRESSION FIXTURE (`GATE-VERDICT.md` F-2: 'In all five, C14 is the spec-correct engine. These become regression fixtures the mirror must PRESERVE — spec-correctness, NOT bug-compatibility with live'). The candidate is REQUIRED to differ.",
        consumerDirection:
            "STRICTLY SAFER. A consumer that called `parseCssColor('oklch()')` crashed; it now receives `ok:false`. A consumer that WRAPPED the call in try/catch to survive the crash keeps working — the catch simply stops firing. No consumer loses information: the thrown `TypeError` carried no span and no code, and the `ParseIssue` carries both.",
    },
    {
        id: "R2",
        title: "valid qualified rules over-rejected",
        // The authority wraps this sentence across a line break ("R2: 10 valid qualified rules\n
        // over-rejected"), so the anchor is the half that lives on one line. Anchored by TEXT and
        // never by line number, the idiom `taxonomy.ts` sets.
        anchor: "R2: 10 valid qualified rules",
        inputs: [],
        incumbentPosture:
            "REJECTS 10 valid qualified rules — `animation_option_invalid` on `var()`/`calc()` compositions, and relative-colour inside `color-mix()`",
        candidatePosture:
            "NOT REACHED by this wave's candidate: `color-mix()` and the relative-colour arm are outside the declared shape (`W3.md` §10 'Not opened here'), and the candidate's stylesheet entry carries qualified rules without the incumbent's animation-option pass",
        specCitation: "css-animations-1 §3 · css-color-5 §4 (relative colour) · css-values-4 §7 (`var()`/`calc()` substitution)",
        adjudication:
            "SPEC-CORRECT REGRESSION FIXTURE, HELD — and explicitly NOT discharged by this wave. Recorded so a later reader cannot mistake 'the candidate does not reproduce the over-rejection' for 'the candidate cures it'.",
        consumerDirection:
            "NO CHANGE TODAY for the ten inputs, because the candidate does not realize the productions they exercise. The direction is DEFERRED to the css-color-5 wave `W3.md` §10 names; this row is the standing reminder that the fixture is owed, not met.",
    },
    {
        id: "R3",
        title: "dangling-alpha leniency",
        anchor: "R3 dangling-alpha leniency",
        inputs: ["rgb(1 2 3 / )", "rgb(1,2,3,)"],
        incumbentPosture: "ACCEPTS both — the dangling separator is swallowed and a colour is returned",
        candidatePosture: "REJECTS both with `css_syntax` (measured; these are also `.a`'s PB-07 and PB-06)",
        specCitation: "css-color-4 §4.1 — the `/ <alpha-value>` production requires an alpha value; a trailing comma terminates no production",
        adjudication:
            "SPEC-CORRECT REGRESSION FIXTURE, MET. Overlaps `.a`'s PB-06/PB-07 by input, and the overlap is stated rather than deduplicated: the same two strings carry a GATE-VERDICT identity and a parser-band identity and a reader of either must find the other.",
        consumerDirection:
            "NARROWS acceptance. A consumer that fed `rgb(1,2,3,)` received a colour and now receives `ok:false`. That is the intended direction — the input is not valid CSS — but it IS a behaviour change and any consumer generating trailing commas must be fixed, not accommodated.",
    },
    {
        id: "R4",
        title: "selector range check off-api",
        anchor: "R4 selector",
        inputs: [],
        incumbentPosture: "the keyframe-selector range check is performed off the public API surface",
        candidatePosture:
            "NOT REACHED: `parseKeyframeSelector` is one of the six entries the candidate does not realize (`UNREALIZED_ENTRIES`), so no selector range check exists to place on or off the API",
        specCitation: "css-animations-1 §3 — keyframe selectors are `from`, `to`, or a percentage in [0%, 100%]",
        adjudication: "SPEC-CORRECT REGRESSION FIXTURE, HELD and NOT met by this wave. Blocked on the same wall as `.a`'s F-a.6 and `.b`'s E-1.",
        consumerDirection:
            "NO CHANGE TODAY. Deferred with the entry itself; the row is carried so the fixture is not lost when `parseKeyframeSelector` is eventually realized.",
    },
    {
        id: "R5",
        title: "comment trivia folded into declaration names",
        anchor: "R5 comment-trivia",
        inputs: [],
        incumbentPosture: "comment trivia is folded into declaration NAMES, so `/*x*/color` can reach a consumer as part of the property name",
        candidatePosture:
            "NOT SEPARATELY WITNESSED by this wave's harness: the candidate's declaration production reads a name slice and the corpus union carries no comment-bearing declaration row, so the fixture has no executed cell here",
        specCitation: "css-syntax-3 §4.3.2 — comments are trivia and are consumed before a component value is produced",
        adjudication:
            "SPEC-CORRECT REGRESSION FIXTURE, HELD and NOT met by this wave — and the reason is a CORPUS gap, which is disclosed rather than repaired by this seat (adding inputs to `.a`'s corpus is a write in `.a`'s create row).",
        consumerDirection:
            "NO CHANGE TODAY, and the absence is a measurement gap rather than an agreement. Routed as a finding: the graduated corpus does not exercise comment trivia in declarations.",
    },
];

/* ── family D: F-b4, the promoted `expected` labels ────────────────────────────────────────── */

export const LABEL_ROW = {
    id: "F-b4",
    title: "`ParseIssue.expected` carries PROMOTED named productions, not raw σ labels",
    inputs: ["rgb(1,2,3,)", "oklch()"],
    incumbentPosture:
        "`expected` is a byte-class or a bare literal — measured on the pinned oracle: `parseCssColor('oklch()')` THROWS, and where 4.0.0 does reject it answers with labels like `\"CSS color\"` / `\"color\"`",
    candidatePosture:
        "`expected[0]` is a named production — `\"<number>\"`, `\"<none-keyword> ('none')\"`, `\"<color>\"`, `\"<hex-color> (3, 4, 6 or 8 digits)\"` — available with diagnostics UNARMED and with zero `console.*` on the parse path (`.b`, G-8 GREEN)",
    specCitation:
        "`parser-band.md` debt 1 — 'the single clearest thing cand-F does better': cand-O's `never` arm yields an opaque `(?!)` expectation where cand-F yields a name. `W3.md` §6 G-8 makes the named label a gate condition.",
    adjudication:
        "INTENDED, and required by G-8. Raised by `.b` as F-b4 with owner `.d` and rowed here — an intentional difference that went unrowed would fail G-7 exactly as a defect does.",
    consumerDirection:
        "A caller reading `expected[0]` receives a NAMED PRODUCTION where 4.0.0 gives a byte-class or a bare literal. Message text is not a stable API and no consumer should switch on it; a consumer that DID switch on the incumbent's exact strings breaks. The direction is strictly more informative — the label set is finite, declared in `diagnostics.mjs`, and every rejection carries one (`.b`: 0 of 3,744 unnamed).",
};

/* ── family E: the declared coverage narrowing ─────────────────────────────────────────────── */

/**
 * Generated from the candidate's own `UNREALIZED_ENTRIES` and the pinned universe — never listed.
 * `runtimeUniverse` and `typeUniverse` are the pinned barrel's own names, passed in by the caller
 * so this file holds no copy of the frozen surface.
 */
export const narrowingRows = ({ runtimeUniverse, typeUniverse, realizedEntries, realizedTypes }) => {
    const unrealizedRuntime = runtimeUniverse.filter((n) => !realizedEntries.includes(n));
    const unrealizedTypes = typeUniverse.filter((n) => !realizedTypes.includes(n));
    const namedByEntry = UNREALIZED_ENTRIES.filter((n) => unrealizedRuntime.includes(n));
    const notNamed = unrealizedRuntime.filter((n) => !UNREALIZED_ENTRIES.includes(n));

    return [
        {
            id: "CN-1",
            title: `the ${namedByEntry.length} frozen parse entries the candidate NAMES as unrealized`,
            inputs: [],
            subjects: namedByEntry,
            incumbentPosture: "all six are exported and callable from published 4.0.0",
            candidatePosture:
                "named in `entry.mjs`'s `UNREALIZED_ENTRIES` and NOT published. A stub rejection was refused on purpose: it 'would emit codes no grammar raises and would be the masking fallback `.b` refused' (`entry.mjs`, and `.b` b.5 E-1).",
            specCitation:
                "P-1 taxonomy (`apotheosis/parser-proof/equivalence.md` §1, carried at `harness/equivalence/taxonomy.ts`): 'COVERAGE_NARROWING (C14 declines an input outside its declared shape that the live superset accepts) is not a defect — status.json declares it.' This row is that declaration.",
            adjudication:
                "DECLARED COVERAGE NARROWING. NOT a mirror-defect, and NOT discharged: it is the same wall as `.a`'s F-a.6 (G-1's implementation is assigned to no unit) and `.b`'s E-1 (the ⊇ direction wants six more grammar entries), both standing orchestrator rows.",
            consumerDirection:
                "A consumer of these six CANNOT MIGRATE to the candidate today — the import would be `undefined`, which is a build-time failure rather than a runtime surprise. The direction is stated as a blocker, not as a difference: adoption (X.P.W4's seam) is gated on it.",
        },
        {
            id: "CN-2",
            title: `the ${notNamed.length} frozen runtime exports that are neither realized nor named`,
            inputs: [],
            subjects: notNamed,
            incumbentPosture: "all are exported and callable from published 4.0.0",
            candidatePosture:
                "absent from the candidate and absent from `UNREALIZED_ENTRIES` — the collectors, the coercer and the serializers, which are not parse entries and which the candidate's grammar does not address at all",
            specCitation: "as CN-1 — the same taxonomy sentence",
            adjudication:
                "DECLARED COVERAGE NARROWING, declared HERE for the first time. `UNREALIZED_ENTRIES` names the six PARSE entries; these are the rest of the 19, and an absence nobody declared is exactly what G-7 treats as a defect. Rowed rather than left to be discovered.",
            consumerDirection:
                "As CN-1: a consumer of any of these cannot migrate. Recorded separately from CN-1 because the cure is different in kind — CN-1 wants six grammar entries, CN-2 wants collectors and serializers that no unit of this wave was asked to author.",
        },
        {
            id: "CN-3",
            title: `the ${unrealizedTypes.length} frozen type exports the candidate does not declare`,
            inputs: [],
            subjects: unrealizedTypes,
            incumbentPosture: "all 33 are declared by published 4.0.0's `css.d.ts`",
            candidatePosture: `the candidate re-exports ${realizedTypes.length} (${realizedTypes.join(", ")}) from the vendored declaration and declares no others`,
            specCitation: "as CN-1 — the same taxonomy sentence; `W3.md` §6 G-1 requires all 33 by bidirectional assignability",
            adjudication:
                "DECLARED COVERAGE NARROWING. `.a` measured the same distance as G-1's types leg (5 TOTAL / 28 ABSENT) and reported it RED rather than narrowing the universe; this row is the differential's half of that reading.",
            consumerDirection:
                "A TypeScript consumer importing any of the 28 gets a compile error rather than a silent `any` — the failure is loud and at build time. No runtime behaviour changes.",
        },
    ];
};

/* ── family F: the declared capacity bounds ────────────────────────────────────────────────── */

/**
 * Thousands separators without `toLocaleString` — a generated document must not read differently
 * under a different `LANG`.
 */
export const groupDigits = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const num = groupDigits;

/**
 * X.P.W3.f landed, on BOTH lowerings and therefore on the shipped JS target, a set of capacity
 * rejections that NARROW the accepted language relative to published 4.0.0: a stylesheet above
 * Θ.input code units that 4.0.0 parses is now `ok:false` by name. COHESION §0p/§0q ordain exactly
 * that shape and not one byte of it is wrong — but G-7's falsifier does not grade intent: "an
 * unrowed intentional difference — the gate treats 'we meant to do that' without a ledger row as
 * identical to a defect", and CN-2's own sentence sets the standard, "an absence nobody declared is
 * exactly what G-7 treats as a defect. Rowed rather than left to be discovered."
 *
 * GENERATED FROM `bounds.mjs`'s OWN `CAPACITY_REGIONS`, never hand-listed, so the family cannot
 * drift from Θ: a region added, renamed or re-capped moves these rows at emission. The row's two
 * result columns are MEASURED by `measureCapacityRow` against the sha-pinned oracle and both
 * lowerings — this file states no engine's answer.
 */
export const CAPACITY_AUTHORITY =
    'COHESION §0p — "both lowerings reject at the bound … with `css_syntax` and a label naming it" — and §0q\'s E-f2 per-class ruling (class 1 boundary-visible · class 2 peak-with-grant · class 3 unreachable-by-construction), carried into `W3.md`\'s two dated 2026-09-18 ADDENDA as unit `.f`. Every bound VALUE is read from the built module\'s own layout constants (`layout.mjs`), and `Θ.input` is DERIVED (`INPUT_BOUND`) rather than pinned; no CAP was moved by this wave.';

const capacityPosture = (row) => {
    const cap = CAPACITY[row.region];
    const label = CAPACITY_LABELS[row.region];
    if (row.cls === 1)
        return {
            candidatePosture: `REJECTS at the bound on the parse path, in BOTH lowerings, as an ordinary \`ok:false\` — \`css_syntax\` with \`expected[0]\` the promoted production \`${row.production}\` (raw label \`${label}\`, checked ${row.when}). Θ.${row.region} = ${num(cap)} ${row.unit}${cap === row.cap ? "" : ` of the region's layout CAP ${num(row.cap)}`}.`,
            consumerDirection: `NARROWS acceptance, and it is consumer-visible on the shipped JS target. An input whose ${row.unit} exceed **${num(cap)}** — a size published 4.0.0 parses and returns a value for — is answered \`ok:false\` with \`expected[0] = "${row.production} …"\`. A consumer whose stylesheets can exceed that size must chunk its input or read the diagnostic; it will not receive a partial value and it will not receive a throw. The direction is strictly safer than the state it replaced (a Wasm trap on one target and an untyped acceptance on the other), and strictly narrower than 4.0.0.`,
        };
    if (row.cls === 2)
        return {
            candidatePosture: `DECLARED and ASSERTED (§0q class 2, peak-with-grant: the JS lowering keeps a high-water on the journal it already appends, the same quantity the module guards), and measured UNREACHABLE under the derived Θ.input — C ⊔ P tiles the consumed input, so C + P ≤ Θ.input = ${num(INPUT_BOUND)} < ${num(cap)}. The raw label \`${label}\` exists and promotes to \`${row.production}\`, so the bound is readable even though no input reaches it.`,
            consumerDirection: `NO CHANGE TODAY. The bound is declared so that a consumer can read it and so that a later Θ.input restoration (R-f1) cannot make it silent, but no input under the present window breaches it — measured at the window on this family, below. Rowed rather than left undeclared: an unreachable bound that nobody declared is still an undeclared bound.`,
        };
    return {
        candidatePosture: `UNREACHABLE BY CONSTRUCTION (§0q class 3). Θ declares the capacity from \`layout.mjs\` and \`bounds.mjs\` ASSERTS AT LOAD that \`cap₃ ≥ K × bound₁ + S\` — for this region ${CLASS3_PROOF[row.region] ? `K = ${num(CLASS3_PROOF[row.region].K)} ${CLASS3_PROOF[row.region].unit ?? ""}, S = ${num(CLASS3_PROOF[row.region].S)}, ceiling ${num(CLASS3_PROOF[row.region].ceiling)} ≤ cap ${num(CLASS3_PROOF[row.region].cap)}`.trim() : `derived at load`} — so a class-1 rejection always fires first and this region cannot be the one that answers.`,
        consumerDirection: `NO CHANGE at this region, and the narrowing it CAUSES is rowed at CAP-1: Θ.input is **${num(INPUT_BOUND)}** rather than the layout's own ${num(CAPACITY_REGIONS[0].cap)} precisely because \`cap₃ ≥ K × Θ.input + S\` must hold for this region among the three. Restoring the full window is R-f1, owned by X.P.W4; it is a capacity question, never a correctness one.`,
    };
};

export const capacityRows = () =>
    CAPACITY_REGIONS.map((row, i) => {
        const posture = capacityPosture(row);
        return {
            id: `CAP-${i + 1}`,
            region: row.region,
            cls: row.cls,
            capacity: CAPACITY[row.region],
            layoutCap: row.cap,
            unit: row.unit,
            when: row.when,
            label: CAPACITY_LABELS[row.region],
            production: row.production,
            witnessProduction: WITNESS_PRODUCTION[row.region],
            title: `the \`${row.region}\` region — Θ.${row.region} = ${num(CAPACITY[row.region])} ${row.unit} (class ${row.cls})`,
            incumbentPosture:
                "published 4.0.0 declares NO capacity of any kind on this axis: it parses until it runs out of host memory, and on the inputs measured below it returns a value.",
            ...posture,
            specCitation: CAPACITY_AUTHORITY,
            adjudication: `DECLARED CAPACITY BOUND, rowed here for the first time (**F-L1**, raised by the round-4 \`## Check 1\`). The P-1 taxonomy's COVERAGE_NARROWING sentence — "C14 declines an input outside its **declared shape** that the live superset accepts is **not** a defect — \`status.json\` declares it" — is the governing one, and Θ **is** the declared shape; this row is that declaration for the \`${row.region}\` axis. Not discharged and not repaired here: the bound is correct and ordained, and what was owed was the declaration.`,
        };
    });

/* ── family G: this wave's own spec-cited divergences on REALIZED entries ──────────────────── */

/**
 * The family `.e` asked for and `.g` could not land (ESC-g1). `.e` returned the row as **F-e2**
 * "for a `.d`-emitted row at X.P.W4, **not hand-added here**" — so it is emitted, with both result
 * columns measured at generation, exactly as that sentence requires. `.g` banked the six fields at
 * `evidence/W3/legacy-hsl-divergence-row-2026-09-18.md`, including the id it proposed (`SP-1`), and
 * they are carried here rather than re-derived.
 *
 * It is NOT a coverage narrowing (the entry is realized), NOT a preserved DISSENT (`W3.md` §2c
 * routes exactly four `parser-band.md` dissents to §2 by name), and NOT a GATE-VERDICT fixture
 * (that file carries no anchor for this subject). That is why it needs a family of its own.
 */
/**
 * EMPTY AT THIS EMISSION, AND THAT IS A MEASUREMENT. This family holds a spec-cited divergence on a
 * REALIZED entry that is not an incumbent mis-accept — the incumbent refusing what the spec admits,
 * say. Its one row, SP-1, WAS an oracle mis-accept, so it is promoted into the INCUMBENT-DEFECT
 * family below (F-aa3 (c): "SP-1 already carries the legacy-`hsl()` fact, so `.k` either promotes
 * that one row into the INCUMBENT-DEFECT family or states why both stand — one meaning, one row").
 * The heading is still emitted, with its count, because a family that disappears when it empties
 * cannot be told from a family that was never there.
 */
export const SPEC_DIVERGENCES = [];

/* ── family H: INCUMBENT-DEFECT — the oracle mis-accepts, the candidate is right per spec ──── */

/**
 * **ESC-g1's family** (COHESION §0r: it "gains a … row family (**INCUMBENT-DEFECT**: the oracle
 * mis-accepts, the candidate is right per spec — the legacy-`hsl(120, 50, 50)` row first)"), at the
 * next free level-2 heading and NOT §6, which is `.e`'s reserved hand-written block (F-aa3 (a);
 * `emit-divergence-ledger.mjs` lifts §6 verbatim, and a generated family written over it would
 * overwrite the fresh adjudicator's own region).
 *
 * A row here says: the INCUMBENT accepts a string the specification forbids, the candidate refuses
 * it, and the refusal is correct. Two of the three are UNADJUDICATED and say so in their own
 * `adjudication` field — `.k` measured them at G-1's honest remainder and declines to rule them,
 * because an author may not adjudicate his own union (M-23 §1; SP-1, the same shape, was ruled only
 * after `.e` raised it). Rowing them is not excusing them: their cells REMAIN mirror-defects in
 * G-7's count, and the row is what keeps the difference declared rather than silent.
 */
export const INCUMBENT_DEFECTS = [
    {
        id: "SP-1",
        parser: "parseCssColor",
        title: "`<legacy-hsl-syntax>` admits no `<number>`: the incumbent mis-accepts `hsl(120, 50, 50)`",
        inputs: ["hsl(120, 50, 50)", "hsl(120, 50%, 50)"],
        incumbentPosture:
            "ACCEPTS both. `hsl(120, 50, 50)` → `{space:\"hsl\", channels:[120,50,50], alpha:1}` — and the channels are UNSCALED, so this row carries the PB-03 100× defect a second time; `hsl(120, 50%, 50)` → `{hsl,[120,0.5,50]}`.",
        candidatePosture:
            "REJECTS both, identically in BOTH lowerings: `ok:false css_syntax [11,16) expected [\"<percent-sign>\"]` on the first, `[16,17)` on the second.",
        specCitation:
            "css-color-4 §7.1 — `<legacy-hsl-syntax> = hsl( <hue>, <percentage>, <percentage>, <alpha-value>? )`. The legacy COMMA form admits no `<number>` for saturation or lightness; only `<modern-hsl-syntax>` does (`[<percentage> | <number> | none]`). The candidate's rejection is spec-correct and the incumbent's acceptance is an R-class mis-accept.",
        adjudication:
            "SPEC-CORRECT, and the candidate is REQUIRED to differ. Discovered by `.e` under L-14 refutation (ledger §6.1, PB-03 attempt (b)), re-measured by `.g`, and NOT created by `.g`'s dimension-token cure — the pre-cure probe already read the identical rejection. `.e` routed it as **F-e2** for a `.d`-EMITTED row; this is that row, and both result columns above are re-measured at every emission rather than typed.",
        consumerDirection:
            "NARROWS acceptance. A consumer that fed `hsl(120, 50, 50)` received a colour — and a wrong one, whose saturation and lightness were 100× the spec's value — and now receives `ok:false`. That is the intended direction: the input is not valid CSS and the value it returned was not the value the string names. A consumer emitting unitless saturation/lightness in the COMMA form must be fixed, not accommodated; the same consumer's SPACE form (`hsl(120 50 50)`) keeps working and is adjudicated separately at PB-03.",
    },
    {
        id: "ID-1",
        parser: "parseCssValue",
        title: "the incumbent's UNANCHORED component read: a component value with trailing garbage is accepted",
        inputs: ["#ff0.99cc", "steps(5e-2%28)", "cubic-bezier(-293, +10, 43.6-49, 160)"],
        incumbentPosture:
            "ACCEPTS all three. The read is unanchored: the incumbent consumes the prefix it recognizes — `#ff0`, `5e-2`, `43.6` — and never requires the rest of the component value to be consumed, so `.99cc`, `%28` and `-49` are discarded in silence.",
        candidatePosture:
            "REJECTS all three, identically in BOTH lowerings, with `css_syntax` spanning the unconsumed tail.",
        specCitation:
            "css-syntax-3 §5.4.7 — a component value is consumed WHOLE, and input left over once the production is satisfied makes the declaration invalid (§5.4.4's trailing-input condition). A token run no production admits cannot be dropped.",
        adjudication:
            "**UNADJUDICATED — routed to X.P.W4's fresh adjudicator.** Measured by `.k` as G-1's honest remainder at `parseCssValue` / `parseCssValues` (33 cells each) and inside `parseStylesheet`; those cells REMAIN counted as mirror-defects at G-7. `.k` declines to rule it: an author may not adjudicate his own union (M-23 §1).",
        consumerDirection:
            "NARROWS acceptance. A consumer that fed `#ff0.99cc` received the colour `#ff0` and now receives `ok:false`. The direction is intended: the string does not name that colour, and the old answer silently discarded five bytes its author wrote.",
    },
    {
        id: "ID-2",
        parser: "parseTimingFunction",
        title: "the incumbent accepts an EMPTY argument in a comma-separated list",
        inputs: ["steps(1e43,, start)"],
        incumbentPosture:
            "ACCEPTS: `{kind:\"steps\", count:1e43, position:\"jump-start\"}` — the empty part between the two commas is skipped and the list reads as two arguments.",
        candidatePosture:
            "REJECTS in BOTH lowerings: `ok:false css_syntax [11,19) expected [\"<jump-position>\"]`.",
        specCitation:
            "css-syntax-3 §5.4.1 / css-values-4 §2.1 — the parts of a comma-separated list are component values; an EMPTY part is not one, and a production that requires an argument is not satisfied by its absence.",
        adjudication:
            "**UNADJUDICATED — routed to X.P.W4's fresh adjudicator**, for the reason ID-1 gives. Measured by `.k` as the last unattributed cell of G-1's `parseTimingFunction` remainder.",
        consumerDirection:
            "NARROWS acceptance, on a string no author writes deliberately. A consumer producing `steps(n,, start)` is emitting a malformed list and now learns of it at the parse instead of silently receiving a timing function it never spelled.",
    },
];

/* ── measuring the two halves ──────────────────────────────────────────────────────────────── */

const shortJson = (v, n = 160) => {
    const s = JSON.stringify(v);
    return s === undefined ? "undefined" : s.length > n ? `${s.slice(0, n)}…` : s;
};

/** One input, through the oracle and through both candidate lowerings. Measured, never written. */
export const measureInput = (input, oracleFn, surfaces, entryName) => {
    const inc = callOracle(oracleFn, input);
    const row = {
        input,
        incumbent: inc.threw ? `THROWS ${inc.error}: ${inc.message}` : shortJson(inc.value),
        incumbentThrew: inc.threw,
    };
    for (const [kind, surface] of Object.entries(surfaces)) {
        const fn = surface[entryName];
        if (typeof fn !== "function") {
            row[kind] = "NOT REALIZED by the candidate";
            continue;
        }
        const got = callOracle(fn, input);
        row[kind] = got.threw ? `THROWS ${got.error}: ${got.message}` : shortJson(got.value);
        row[`${kind}Threw`] = got.threw;
    }
    return row;
};

/** The sixteen, imported. Re-typing them here would break the `.a`/`.d` family `§P.1` declares. */
export const adjudicatedRows = () => ADJUDICATIONS;

/* ── measuring a capacity row ──────────────────────────────────────────────────────────────── */

/**
 * A capacity witness is up to Θ.input code units long, and `shortJson` would serialize a
 * 16,382-rule stylesheet to ten megabytes before slicing 160 bytes off the front. This reads the
 * SAME `ParseResult` in the only terms a capacity row is about: accepted-or-not, how much came
 * back, and — when it did not — which productions the diagnostics name. `actual` is never printed:
 * on a capacity rejection it is the whole input.
 */
const capacityOutcome = (res) => {
    if (res.threw) return `THROWS ${res.error}: ${res.message}`;
    const v = res.value;
    if (v === undefined || v === null) return "undefined";
    const diagnostics = Array.isArray(v.diagnostics) ? v.diagnostics : [];
    if (v.ok)
        return `ok:true · ${Array.isArray(v.value) ? `${num(v.value.length)} top-level item(s)` : "one value"} · ${diagnostics.length} diagnostic(s)`;
    const named = diagnostics.map((d) => `${d.code} [${d.start},${d.end}) ${JSON.stringify(d.expected?.[0] ?? null)}`);
    return `ok:false · ${num(diagnostics.length)} diagnostic(s): ${named.slice(0, 2).join(" · ")}${named.length > 2 ? ` …(+${named.length - 2})` : ""}`;
};

/**
 * Did this engine RETURN A VALUE for this witness? `ok:true` and nothing else — a throw and an
 * `ok:false` are both "no". Read off the result object rather than off `capacityOutcome`'s prose,
 * so the reading cannot drift with the wording.
 */
const accepted = (res) => !res.threw && res.value !== undefined && res.value !== null && res.value.ok === true;

/** Does this answer name THIS region's production? The row's own promoted label, never a substring. */
const namesRegion = (res, production) =>
    !res.threw &&
    res.value !== undefined &&
    res.value !== null &&
    res.value.ok === false &&
    (Array.isArray(res.value.diagnostics) ? res.value.diagnostics : []).some(
        (d) => typeof d.expected?.[0] === "string" && d.expected[0].startsWith(production),
    );

/** The smallest n at which `fires(n)`; binary-searched from 1 — `.f`'s census method, unchanged. */
const firstFiring = (fires, ceiling) => {
    let lo = 0;
    let hi = 1;
    while (hi < ceiling && !fires(hi)) {
        lo = hi;
        hi *= 2;
    }
    if (!fires(hi)) return null;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (fires(mid)) hi = mid;
        else lo = mid;
    }
    return hi;
};

/**
 * The largest n whose witness still fits the declared window — arithmetic on the generator, never a
 * parse. `Θ.input + 1` is the only ceiling worth searching: every family spends at least one code
 * unit per unit of n, so no larger n can fit.
 */
const largestFitting = (region) => {
    let lo = 1;
    let hi = INPUT_BOUND + 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (witnessAtCapacity(region, mid).length <= INPUT_BOUND) lo = mid;
        else hi = mid;
    }
    return lo;
};

const capacityCell = (region, n, oracleFn, surfaces, entryName) => {
    const src = witnessAtCapacity(region, n);
    const inc = callOracle(oracleFn, src);
    const cell = {
        n,
        length: src.length,
        witness: `witnessAtCapacity("${region}", ${num(n)})`,
        preview: `${src.slice(0, 20).replace(/\s+/g, " ")}…`,
        incumbent: capacityOutcome(inc),
        incumbentAccepted: accepted(inc),
    };
    for (const [kind, surface] of Object.entries(surfaces)) {
        const res = callOracle(surface[entryName], src);
        cell[kind] = capacityOutcome(res);
        cell[`${kind}NamesRegion`] = namesRegion(res, CAPACITY_REGIONS.find((r) => r.region === region).production);
    }
    cell.identical = cell.js === cell.wasm;
    return cell;
};

/**
 * One capacity row's evidence, MEASURED. Class 1 regions get the census pair — the last witness that
 * does NOT name the region and the first that does, found by binary search rather than pinned, so a
 * moved bound moves the pair instead of falsifying it. Classes 2 and 3 have no such coordinate under
 * the derived window, which is itself the claim, so they get the densest declared family AT the
 * window and the row records that it does not name them.
 */
export const measureCapacityRow = (row, oracle, surfaces) => {
    const entryName = { "P:stylesheet": "parseStylesheet", "P:timing-function": "parseTimingFunction", "P:color": "parseCssColor" }[
        row.witnessProduction
    ];
    const oracleFn = oracle.module[entryName];
    const cell = (n) => capacityCell(row.region, n, oracleFn, surfaces, entryName);
    if (row.cls === 1) {
        const n = firstFiring((k) => namesRegion(callOracle(surfaces.js[entryName], witnessAtCapacity(row.region, k)), row.production), row.layoutCap * 2);
        if (n !== null) return { kind: "pair", entryName, coordinate: n, at: cell(n - 1), past: cell(n) };
        /**
         * NO COORDINATE — and the reason is MEASURED before anything is said about it. Two causes
         * look alike from here and mean opposite things:
         *
         *   (a) the witness family FITS the input window and still never names the region — a
         *       class-1 bound no input reaches, which is not a class-1 bound. That HALTS, as it
         *       always has.
         *   (b) the largest witness that FITS the window is already smaller than the bound needs,
         *       so the window cuts the search off before the region can fire. Then nothing is known
         *       about the bound and the row says exactly that — the same posture §7 already takes
         *       for classes 2 and 3, whose absent coordinate under the derived window "IS the
         *       claim". This is **R-f1**'s subject (COHESION §0r: Θ.input = 65,458 derived, "a 64 K
         *       window is a product defect for `parseStylesheet`", ruled for X.P.W4), reaching the
         *       instrument: at the derived window in this tree the `marks` family tops out three
         *       code units per mark, far under `MARK_CAP`, so no witness of it can ever fire.
         *
         * Throwing in case (b) would take the whole ledger down over a bound this wave has already
         * ruled elsewhere, and would report a window limit as a missing bound. The row is emitted
         * with its measurement instead, and G-7 reads it.
         */
        const fits = largestFitting(row.region);
        const reached = namesRegion(callOracle(surfaces.js[entryName], witnessAtCapacity(row.region, fits)), row.production);
        if (reached) {
            throw new Error(`HALT: the '${row.region}' witness family never names its own production up to ${row.layoutCap * 2}; a class-1 bound that no input reaches is not class 1.`);
        }
        return {
            kind: "window-limited",
            entryName,
            coordinate: fits,
            window: cell(fits),
            why:
                `the largest \`${row.region}\` witness that FITS the derived input window is n = ${fits} ` +
                `(${witnessAtCapacity(row.region, fits).length} code units, window ${INPUT_BOUND}), and it does not name ` +
                `\`${row.production}\`; the search to n = ${row.layoutCap * 2} found no coordinate because the WINDOW cuts ` +
                `first, not because the bound is absent. R-f1 (COHESION §0r) owns the window and is ruled for X.P.W4.`,
        };
    }
    const n = row.region === "expsnap" ? THETA.depthBound : largestFitting(row.region);
    return { kind: "window", entryName, coordinate: n, window: cell(n) };
};

/**
 * **F-y1's cure, at the generator rather than at the two rows it was raised against.**
 *
 * `capacityRows()` writes the incumbent sentence and the class-1 consumer direction from ONE
 * template across all nine regions, BEFORE anything is measured — and for three of them the
 * template is contradicted by the row's own table two lines beneath it: published 4.0.0 REJECTS
 * both `recoveries` and `D` witnesses (`ok:false css_syntax [0,1) "declaration"`) and the `expsnap`
 * window witness (`color_context_required`), so *"on the inputs measured below it returns a value"*
 * and *"a size published 4.0.0 parses and returns a value for"* are false there. `W3.md` §6 G-7
 * makes the second one load-bearing — *"that field is what the KF and glass packets quote"* — so a
 * packet quoting those rows would tell a consumer that 4.0.0 accepts inputs it in fact refuses.
 *
 * The generator ALREADY measures the incumbent cell. This reads it back and re-scopes the two
 * sentences to what was measured. It cannot widen a claim: where every witness was accepted, both
 * sentences are returned **unchanged, byte for byte**, and the eight rows whose reading was already
 * true are untouched.
 *
 * The un-measured strings on the row object stay as they are and stay non-empty — `directionAudit`,
 * `run-full-surface.mjs`'s census and `equivalence.test.ts` read them synchronously, without an
 * oracle. The EMITTED file is the artefact G-7 grades and the packets quote, and it is the one that
 * must agree with its own measurement.
 */
export const capacityMeasuredReading = (row, m) => {
    const cells = m.kind === "pair" ? [m.at, m.past] : [m.window];
    const refused = cells.filter((c) => !c.incumbentAccepted);
    if (refused.length === 0) return { incumbentPosture: row.incumbentPosture, consumerDirection: row.consumerDirection };

    const which =
        m.kind !== "pair"
            ? "the window witness measured below"
            : refused.length === cells.length
              ? "EITHER witness measured below"
              : `the ${refused[0] === m.at ? "AT-the-bound" : "ONE-PAST-the-bound"} witness measured below`;
    const incumbentPosture =
        "published 4.0.0 declares NO capacity of any kind on this axis: it parses until it runs out of host memory. " +
        `It does NOT, however, return a value for ${which} — it answers ${[...new Set(refused.map((c) => c.incumbent))].join(" · then ")} — ` +
        "and it does so for its own reason, never for a capacity. MEASURED at this generation and generated from that " +
        "measurement (**F-y1**): a row may not claim an incumbent verdict its own table denies.";

    // The witness whose reading the DIRECTION must answer to: the one past the bound where a
    // coordinate was found, and the largest the window admits where none was. A window-limited row
    // is still class 1 and its template still claims the incumbent "parses and returns a value" —
    // F-y1 is about the claim, not about how the witness was chosen, so both kinds are read back.
    const past = m.kind === "pair" ? m.past : m.kind === "window-limited" ? m.window : null;
    if (row.cls !== 1 || past === null || past.incumbentAccepted) return { incumbentPosture, consumerDirection: row.consumerDirection };

    const consumerDirection =
        `NARROWS the declared shape — Θ.${row.region} = **${num(row.capacity)}** ${row.unit} is a bound published 4.0.0 does not declare — but on THIS row's own ` +
        "witness family the narrowing is **not observable as a verdict change**: published 4.0.0 answers " +
        `${past.incumbent} on the witness ${m.kind === "pair" ? `whose ${row.unit} exceed the bound` : "the input window admits"}, so a consumer at that size received \`ok:false\` from 4.0.0 and ` +
        "receives `ok:false` here. What changes is the DIAGNOSTIC, not the verdict: the candidate spans the whole input and names the region " +
        `(\`expected[0] = "${row.production} …"\`) where 4.0.0 named the first construct it could not parse. The consumer will not receive a ` +
        "partial value and will not receive a throw. **Whether an input exists that published 4.0.0 ACCEPTS and this bound refuses is NOT " +
        "established by these witnesses, and is not claimed here** — the class-1 rows that do establish it are the ones whose incumbent cell " +
        "reads `ok:true` at the same coordinate.";
    return { incumbentPosture, consumerDirection };
};

/** `GATE-VERDICT.md` is read so each fixture's anchor is proven present in its authority. */
export const fixtureAnchorsPresent = () => {
    const text = readFileSync(GATE_VERDICT_PATH, "utf8");
    return FIXTURES.map((f) => ({ id: f.id, anchor: f.anchor, present: text.includes(f.anchor) }));
};

/** Every row of every family must carry a non-empty consumer direction. G-7 fails on an empty one. */
export const directionAudit = (rows) =>
    rows
        .filter((r) => typeof r.consumerDirection !== "string" || r.consumerDirection.trim().length === 0)
        .map((r) => r.id);
