// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.i — THE ANIMATION FAMILY: `P:keyframe-selector` · `P:animation-timeline` ·
// `P:animation-range` · `P:animation-option`, authored ONCE against the twenty-two typed operations
// and composed into `buildGrammar(A)` by `../grammar.mjs` (`W3.md` third ADDENDUM L703: "author in
// the 22-op algebra through `buildGrammar(A)` — one grammar source, both lowerings").
//
// THE SUBJECT it mirrors is the incumbent's `src/css/timeline.ts` and the keyframe-selector arm of
// `src/css/grammar.ts` at pin `6aca8602` — logic-identical to the sha-pinned 4.0.0 bundle this
// wave's oracle is (`cand-o/vendor/value-js-4.0.0/dist/subpaths/css.js`, `Se` · `P` · `N` · `ue`).
// All three are written there as `String.prototype.trim` plus a whole-token REGEX plus
// `splitTopLevel`, and the one fact a PEG has to carry that those give for free is that a token is
// a token: `splitTopLevel(s, "space")` cuts at every top-level whitespace run and DROPS the empty
// parts, and each part is then matched ANCHORED (`^…$`). Here a token's right edge is the `WS1`
// that separates it from the next, or the entry's own `END`, and a maximal `TEXT` run is what makes
// `50%x` nothing rather than `50%` with a tail.
//
// THE FOUR PRODUCTS, in the frozen shapes (`generated/frozen-4.0.0.d.ts`):
//   KeyframeSelector        {kind:"percent", value} | {kind:"named", name, offset?}
//   AnimationTimelineValue  {kind:"auto"|"none"} | {kind:"name",name} | {kind:"scroll",scroller?,axis?}
//                           | {kind:"view", axis?, inset?{start,end?}}
//   AnimationRangeValue     {start: RangeBoundary, end?: RangeBoundary},  RangeBoundary {phase?,offset?}
//   and `P:animation-option`, which has no frozen product because it is not a frozen export: it is
//   the DECLARATION-LEVEL law `rules.ts` `emptyComma` states over an `animation`/`animation-*`
//   value ("a blank item between two top-level commas is `animation_option_invalid`"), and it is the
//   vocabulary `collectAnimationOptions`'s cascade reads. It is an entry of the grammar map and NOT
//   a public entry — `entry.mjs`'s `PUBLIC_ENTRIES` is the frozen barrel's own name list, and this
//   production has no barrel name to publish under. It is reached by the closure gate, which runs
//   every entry of the map (`scripts/css-recovery-closure.mjs` `recovery.entries()`), which is where
//   the eighth frozen code becomes an EMITTED code rather than a declared one (G-4's ⊇ direction).
//   The second `animation_option_invalid` site — `optionDeclarationValid`'s per-property reading —
//   lives inside `parseDeclarations`, i.e. inside `parseStylesheet`'s declaration layer, and is
//   therefore `.j`'s byte and not this unit's; that split is stated here rather than discovered.
//
// A value shape exists only through OP-19 `CTOR`, whose constructor is realized per lowering
// (COHESION §0s E-h1): the rows are `algebra/tables.mjs` R_ctor's `lp-*` / `range-*` / `keyframe-*` /
// `timeline-*` / `animation-option-list`, the functions are `lowering-js/js-alg.mjs` CTORS and
// `lowering-wasm/wasm-alg.mjs` emitCtors, and the node table is `bounds.mjs` CTOR_ALLOC /
// CTOR_SCRATCH_CELLS — four name-sets, equal, asserted at load.
//
// ── THE ONE DESIGN DECISION WORTH STATING: NO `NUM` IN THE RANGE OR THE TIMELINE ───────────────
//
// `LENGTH_PERCENTAGE` (`timeline.ts:16`, the oracle's `M`) is
//     /^auto$|^[+-]?(?:\d+\.?\d*|\.\d+)(?:%|[a-z]+)?$/i
// and the value the incumbent KEEPS is the token's own TEXT: `RangeBoundary.offset` and
// `ViewInset.start` are `string`, and the corpus witnesses `"841fEd"`, `"25De"` and `"11e"` coming
// back verbatim. OP-03 `NUM` is css-syntax-3 §4.3.12 — it answers a NUMBER, it admits an exponent
// this regex does not (`1e3` is one number to `NUM` and nothing to the regex), and it refuses the
// trailing dot this regex admits (`1.`). Reading these tokens with `NUM` would therefore be wrong
// twice over and would still not give the text. They are read with `TEXT` alone, piece by
// contiguous piece, and the constructor re-joins them: the grammar is the regex, alternative for
// alternative, longest arm first, and the divergence class is EMPTY rather than declared.
//
// `P:keyframe-selector` DOES use `NUM`, because there the frozen product is a NUMBER
// (`{kind:"percent", value}`) and `Number(percent[1])` is what the incumbent computes. Its two
// declared divergence classes are therefore the ones `NUM` carries and are named at the bottom of
// this file.
//
// ── DECLARED DIVERGENCES, by class, reported by count in the receipt (COHESION §0s E-h2) ───────
//
//   WS-1   the incumbent's `trim()` and `/\s/` see UNICODE whitespace (U+00A0, `\v`, …); the
//          algebra's `ws` class is css-syntax-3's five. Inherited from X.P.W3.h, same root.
//   KF-1   `parseKeyframeSelector`'s number is the regex `[+-]?(?:\d+\.?\d*|\.\d+)`, which admits
//          `1.` and refuses `1e3`; OP-03 `NUM` does the opposite. Measured over the union corpus:
//          ZERO inputs of either shape reach this entry (no bare `<exponent>%` and no `<digits>.%`
//          row exists), so the class is declared and its measured population is 0.
//   DC-1   every entry's rejection carries the algebra's FARTHEST-failure code (§5.6) rather than
//          the incumbent's one-code-per-function; the unit's own code is raised where nothing at
//          all matched (the `FAIL` arm) and at every constructor guard. The VERDICT is identical —
//          it is the `code` cell of the diagnostic that differs, and G-1 compares verdict and value.
//   KO-1   `timeline-scroll` and `timeline-view` write their record in a FIXED key order (scroller
//          then axis; axis then inset), because a Wasm record's pairs are emitted in a fixed
//          sequence and G-5 requires the two lowerings to be byte-identical. The incumbent assigns
//          each field as it CONSUMES the argument, so `scroll(block root)` yields `{kind, axis,
//          scroller}` there and `{kind, scroller, axis}` here. The two objects are EQUAL — key
//          insertion order is not part of JS object equality, not part of the frozen type
//          (`ScrollTimelineDescriptor`), and not what G-1 compares; a `JSON.stringify` comparison
//          is the only reading that separates them. MEASURED population over the 26,604-row union
//          corpus: ONE input (`"scroll(block root)"`). Declared, not cured — the cure would be a
//          source-order-dependent key sequence in both lowerings for no semantic gain.

const INF = Infinity;

/**
 * @param A   the algebra — any instantiation of the twenty-two, handed over as the locals
 *            `../grammar.mjs` destructured ONCE (never `A` itself: `lower.mjs`'s
 *            `assertClosedOperatorSet` records every property read and a duplicate is a HALT).
 * @param N   the notations `../grammar.mjs` already defines, passed in so this family spells
 *            whitespace, punctuation and optionality with the same bytes the slice does.
 */
export function buildAnimationGrammar(A, N) {
    const { SCAN, TEXT, KW, NUM, END, SEQ, ALT, CUT, REP, DROP, DISPATCH, FAIL, EXPECT, CTOR, REF } = A;
    const { WS, WS1, TOK, OPT } = N;

    /* ── the <length-percentage> token, as TEXT ──────────────────────────────────────────── */

    const sign = () => TEXT("sign", 1, 1);
    const digits = () => TEXT("digit", 1, INF);
    const point = () => TEXT("dot", 1, 1);
    /** `(?:%|[a-z]+)` under `/i` — `TEXT` is maximal, so `5px2` ends at `px` and then nothing fits. */
    const unit = () => ALT(TEXT("percent", 1, 1), TEXT("letter", 1, INF));

    /**
     * The regex's four shapes, LONGEST FIRST, each a FLAT sequence under its constructor — flat
     * because a nested `SEQ` yields ONE tuple value and the constructor would receive a tuple where
     * it expects a leaf (`§5.3` seqFinish; the same reason X.P.W3.h's `number()` is flat).
     *
     *   \d+ \. \d+   ·   \d+ \.   ·   \d+   ·   \. \d+          each optionally signed and united
     *
     * Ordered committed choice does the regex's own backtracking: `1.5` takes the first arm, `1.`
     * the second (the incumbent's `\d+\.?\d*` with an empty `\d*`), `1` the third, `.5` the fourth.
     * An arm that succeeds and leaves a tail does NOT re-enter the choice — the tail then fails at
     * the enclosing `WS1` or `END`, which is exactly what the anchored `$` does to the regex.
     */
    const lpText = () =>
        ALT(
            CTOR("lp-text", SEQ(OPT(sign(), null), digits(), point(), digits(), OPT(unit(), null))),
            CTOR("lp-text", SEQ(OPT(sign(), null), digits(), point(), OPT(unit(), null))),
            CTOR("lp-text", SEQ(OPT(sign(), null), digits(), OPT(unit(), null))),
            CTOR("lp-text", SEQ(OPT(sign(), null), point(), digits(), OPT(unit(), null))),
        );
    /** `^auto$` under `/i`: the ident run must fold to exactly `auto`, and the TEXT is kept as authored. */
    const lpAuto = () => CTOR("lp-auto", TEXT("ident", 1, INF));
    /** One `LENGTH_PERCENTAGE` token, answering its own source text. */
    const lp = () => ALT(lpText(), lpAuto());

    /* ── `P:keyframe-selector` (`grammar.ts` parseKeyframeSelector) ───────────────────────── */

    /**
     * Three arms and a named failure, in the incumbent's own order: the `from`/`to` keywords, the
     * bare percent with its [0,100] guard, then `(entry|exit|cover|contain)` with an OPTIONAL
     * `\s+ <number>%` whose guard is the DIVIDED value in [0,1]. The optional tail is two arms
     * rather than one `OPT`, again so each constructor's children stay flat.
     *
     * The `FAIL` arm is what makes `keyframe_selector_invalid` — and not `css_syntax` — the code of
     * a rejection that originated at the very first byte: `EXPECT` re-raises `σ.lastCode` when the
     * body failed at its own start (§5.6 / `js-alg.mjs` EXPECT), and `FAIL` is the last thing to
     * set it. A rejection that originates FARTHER IN keeps the farthest failure's code, which is
     * the algebra's law and this unit's DC-1.
     */
    const keyframeSelector = () =>
        SEQ(
            WS(),
            EXPECT(
                ALT(
                    CTOR("keyframe-word", KW("ident", "keyframe-word")),
                    CTOR("keyframe-percent", SEQ(NUM(), TOK("%"))),
                    CTOR("keyframe-named", SEQ(KW("ident", "keyframe-phase"), WS1(), NUM(), TOK("%"))),
                    CTOR("keyframe-named", KW("ident", "keyframe-phase")),
                    FAIL("keyframe_selector_invalid", "<keyframe-selector>"),
                ),
                "<keyframe-selector>",
            ),
            WS(),
            END(),
        );

    /* ── `P:animation-timeline` (`timeline.ts` parseAnimationTimeline) ────────────────────── */

    /**
     * The separator inside `scroll()` / `view()`. The incumbent writes
     * `splitTopLevel(body.replace(/,/g, " "), "space")` — every comma becomes a space, the split is
     * on whitespace runs, and EMPTY parts are dropped — so a run of whitespace and commas, of any
     * length and in any mixture, is ONE separator, and a leading or trailing run is nothing at all.
     * `DROP` over a zero-or-more `SCAN` says that in one operation and leaves no leaf behind.
     * The kind is `skipped` ("bytes no LEAF of `V` claims", the E-2 ruling's general form): a comma
     * is not whitespace and calling the run `ws` would be a kind that lies (COMP-1c).
     */
    const gap = () => DROP("skipped", SCAN("comma-gap", 0, INF));

    /**
     * `scroll()`'s arguments are one keyword table whose first three rows are the scrollers and
     * whose last four are the axes; `view()`'s are an axis keyword OR a `LENGTH_PERCENTAGE` token,
     * two vocabularies the incumbent tests in that order and which are DISJOINT (no axis name
     * carries a digit, no length-percentage is an ident but `auto`, which is not an axis). The
     * constructors therefore tell them apart by the leaf's own kind — a number is a table index, a
     * string is inset text — and never by a second lookup.
     */
    const argList = (arg) => SEQ(gap(), REP(SEQ(arg(), gap()), 0, INF, null));
    const scrollArg = () => KW("ident", "scroll-arg");
    const viewArg = () => ALT(KW("ident", "view-axis"), lp());

    const headScroll = () => CTOR("timeline-scroll", SEQ(TOK("("), CUT(), argList(scrollArg), TOK(")")));
    const headView = () => CTOR("timeline-view", SEQ(TOK("("), CUT(), argList(viewArg), TOK(")")));

    /**
     * `/^--[-\w]+$/`: the `ident` class IS `[-\w]`, so the whole name is one maximal run of at
     * least three code units whose first two the constructor checks are `-` — the `value-call`
     * row's own `--*` test, one row down.
     */
    const timelineName = () => CTOR("timeline-name", TEXT("ident", 3, INF));

    const animationTimeline = () =>
        SEQ(
            WS(),
            EXPECT(
                ALT(
                    CTOR("timeline-mode", KW("ident", "timeline-mode")),
                    DISPATCH("ident", "timeline-head"),
                    timelineName(),
                    FAIL("timeline_option_invalid", "<animation-timeline>"),
                ),
                "<animation-timeline>",
            ),
            WS(),
            END(),
        );

    /* ── `P:animation-range` (`timeline.ts` parseAnimationRange + rangeBoundary) ──────────── */

    /** The two-token boundary, and the one-token boundary: `rangeBoundary`'s three shapes. */
    const boundary2 = () => CTOR("range-phase-offset", SEQ(KW("ident", "range-phase"), WS1(), lp()));
    const boundary1 = () => ALT(CTOR("range-phase", KW("ident", "range-phase")), CTOR("range-offset", lp()));
    const boundary = () => ALT(boundary2(), boundary1());

    /**
     * The four arms are `parseAnimationRange`'s four paths, in its own order.
     *
     *  1. THE COMMA FORM. `splitTopLevel(input, ",")` drops empty parts, so any number of commas
     *     may stand before the first part, between the two, and after the last — and exactly TWO
     *     non-empty parts take this path (`n.length === 2`). A third part is `n.length > 2`, which
     *     the incumbent refuses outright; here the arm's trailing separator run cannot swallow a
     *     third boundary, so the arm fails and — because no space arm admits a top-level comma —
     *     the input is refused, which is the same verdict by the same reason.
     *  2. `N(r)` over the whole token list: ONE boundary that consumes everything.
     *  3. and 4. `for (const split of [2, 1])`: a two-token start then the rest, a one-token start
     *     then the rest. `N`'s domain is one or two tokens, so `boundary()` IS `N` and the two
     *     splits are these two sequences; five tokens fit no arm, exactly as none of `N`'s calls
     *     can cover them.
     */
    const commaMid = () => SEQ(WS(), TOK(","), gap());
    /**
     * EACH ARM CARRIES ITS OWN `END`, and the choice stands OUTSIDE it. That is not a style: OP-09
     * commits to the first arm that SUCCEEDS, and an `END` outside the choice fails in the enclosing
     * `SEQ`, where no arm is left to try. Measured before it was written — with one `END` at the
     * root, `entry 50% exit` took arm 2 (`N(r)` over the first two tokens), the `END` then found
     * `exit`, and the input was refused although the incumbent's `split = 2` accepts it; the same
     * shape refused `entry exit` and `50% entry 25%`. With the `END` inside, a shorter arm that
     * leaves a tail is an ARM THAT FAILED, which is exactly `N(…) && N(…)` returning null and the
     * loop trying the next split.
     */
    const rangeArm = (body) => SEQ(WS(), body, WS(), END());
    const animationRange = () =>
        EXPECT(
            ALT(
                rangeArm(CTOR("range-pair", SEQ(gap(), boundary(), commaMid(), boundary(), gap()))),
                rangeArm(CTOR("range-single", boundary())),
                rangeArm(CTOR("range-pair", SEQ(boundary2(), WS1(), boundary()))),
                rangeArm(CTOR("range-pair", SEQ(boundary1(), WS1(), boundary()))),
                FAIL("timeline_option_invalid", "<animation-range>"),
            ),
            "<animation-range>",
        );

    /* ── `P:animation-option` (`rules.ts` emptyComma, the declaration-level law) ──────────── */

    /**
     * One item of an animation declaration's comma list, as `rules.ts` `parseDeclarations` reads it:
     * the part must be NON-BLANK (`emptyComma`) and it must PARSE AS A VALUE (`parseCssValue`) — the
     * two steps that stand, in that order, before `optionDeclarationValid` looks at the property at
     * all. A part is therefore a space-separated run of value tokens, each one X.P.W3.h's
     * `value-single` through OP-22 `REF` — one grammar, one token language, no second spelling of it
     * here — and a part where nothing but whitespace stands is REFUSED, by name, at that byte.
     *
     * The blank arm is written FIRST and as a ZERO-WIDTH assertion (`SCAN(cls, 0, 0)` succeeds
     * exactly when the run of `cls` at the cursor is empty, the `.g` idiom) followed by OP-15
     * `FAIL`, and that order is load-bearing, measured rather than preferred: §5.6 merges two raises
     * at the SAME offset by keeping the FIRST code and appending the labels, so a token arm that
     * failed at the blank byte before the guard ran would make the diagnostic `css_syntax` and the
     * eighth frozen code would be declared and never emitted (G-4's ⊇ direction, C-3). With the
     * assertion first, `animation_option_invalid` is the code AT that byte, the token arm's later
     * refusal only adds its label, and because the offset is the farthest the parse reached it
     * survives the `END` that then fails behind it.
     *
     * `emptyComma` reads a lone blank source as lawful because the `parseCssValue` behind it refuses
     * the empty string anyway; here the two steps are ONE production, so an empty source has no item
     * and is not in the language. Stated because it is the one place the two spellings part, and
     * there is no oracle row to hide it in (`P:animation-option` is not a frozen export).
     */
    const optionItem = () =>
        CTOR(
            "animation-option",
            SEQ(
                DROP("ws", SCAN("ws", 0, INF)),
                ALT(
                    SEQ(DROP("keyword", SCAN("any-but-comma", 0, 0)), FAIL("animation_option_invalid", "nonempty animation list item")),
                    REP(SEQ(WS(), REF("value-single")), 1, INF, null),
                ),
            ),
        );
    /**
     * No `EXPECT` stands at this entry's root, and that is the one place in the family where the
     * idiom is dropped on purpose: `EXPECT` re-raises `σ.lastCode` — the LAST raise, not the
     * farthest — so on a source whose every item is blank (`""`, `",a"`) it would replace the named
     * `animation_option_invalid` the `FAIL` arm put at the blank byte with the `css_syntax` the
     * `TEXT` arm raised behind it. The `FAIL` already names the production, which is what `EXPECT`
     * exists to do (`W3.md` §6 G-8 / C-7: `expected[0]` is a named production, asserted).
     */
    const animationOption = () =>
        SEQ(
            WS(),
            CTOR("animation-option-list", optionItem(), REP(SEQ(TOK(","), optionItem()), 0, INF, null)),
            WS(),
            END(),
        );

    return {
        entries: {
            "P:keyframe-selector": "keyframe-selector",
            "P:animation-timeline": "animation-timeline",
            "P:animation-range": "animation-range",
            "P:animation-option": "animation-option",
        },
        terms: {
            "keyframe-selector": keyframeSelector(),
            "animation-timeline": animationTimeline(),
            "animation-range": animationRange(),
            "animation-option": animationOption(),
            "length-percentage": lp(),
            "range-boundary": boundary(),
        },
        dispatchTerms: {
            "timeline-scroll": headScroll(),
            "timeline-view": headView(),
        },
    };
}
