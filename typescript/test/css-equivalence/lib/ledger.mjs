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
// FIVE FAMILIES, EACH WITH ITS AUTHORITY:
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
//
// NOTHING HERE ADJUDICATES. `.e` is the fresh Fable adjudicator (M-23 §1) and holds the ledger's
// §Adjudication section; an author cannot adjudicate his own union. This file states each row's
// ruling AS ALREADY RULED ELSEWHERE, with the citation, and measures what the two engines actually
// do. Where no ruling exists — the non-finite contract question, the bench bar — the row says so
// and names the owner, which is what "PRESERVED, UNRESOLVED" means.

import { readFileSync } from "node:fs";

import { ADJUDICATIONS } from "../../css-totality/lib/adjudications.mjs";
import { UNREALIZED_ENTRIES } from "../../../src/css/entry.mjs";
import { callOracle } from "./oracle.mjs";

export const GATE_VERDICT_PATH =
    "/Users/mkbabb/Programming/value.js/docs/tranches/V/apotheosis/parser-proof/GATE-VERDICT.md";

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
