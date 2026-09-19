// SERVED MODEL: claude-opus-5[1m] (X.P.W3.j) · claude-fable-5-1 (X.P.W3.l, the at-rule and nesting families)
//
// X.P.W3.j — THE STYLESHEET FAMILY: `P:stylesheet` and the productions beneath it, authored ONCE
// against the twenty-two typed operations and composed into `buildGrammar(A)` by `../grammar.mjs`
// (`W3.md` third ADDENDUM L703: "author in the 22-op algebra through `buildGrammar(A)` — one
// grammar source, both lowerings"). It REPLACES the four productions the AC-1 slice carried in
// `grammar.mjs` (`stylesheet` · `qualified-rule` · `declaration` · `value-slice`) — the slice was a
// colour-only reading of a stylesheet and its `value-slice` (`CTOR value-color [REF color-body]`)
// admitted a declaration whose value is a COLOUR and nothing else.
//
// THE SUBJECT it mirrors is the incumbent's `src/css/stylesheet.ts` at pin `6aca8602` —
// logic-identical to the sha-pinned 4.0.0 bundle this wave's oracle is
// (`cand-o/vendor/value-js-4.0.0/dist/subpaths/css.js`). There a stylesheet is read by `blocks()`
// (a scanner: leading trivia, a prelude up to the first top-level `{` or `;`, then a
// brace-balanced body), `parseItems()` (a dispatch on the prelude's folded text) and
// `parseDeclarations()` (`splitTopLevel(body, ";")`, then the first `:` of each part).
//
// ── WHAT MOVED, AND WHY EACH MOVE IS THE INCUMBENT'S OWN READING ────────────────────────────────
//
//   J-1  THE DECLARATION'S VALUE IS THE VALUE GRAMMAR. `parseDeclarations` calls `parseCssValue`
//        (`stylesheet.ts:399`), so a declaration's value is whatever `P:value` admits. The slice
//        read `value-slice := CTOR value-color [REF color-body]`, i.e. a colour. Every
//        `var(--a)` / `chocolate` / `1px 2px` declaration the incumbent accepts was therefore a
//        FALSE_REJECT_IN_SHAPE. X.P.W3.h landed the value grammar; this unit reads it, which is
//        the whole of §10.3's own contract tension (`grammar.mjs`'s "REPORTED to `.h`" note)
//        discharged. It reads it through `declaration-body` rather than `value-body`, and the one
//        byte of difference is MEASURED, not stylistic: `parseCssValue("a;b")` ACCEPTS at the
//        incumbent, so `;` is one of the value grammar's operator tokens — but inside a stylesheet
//        `splitTopLevel(body, ";")` has already cut the part, so a top-level `;` never reaches
//        `parseCssValue` there (`a{c:1;d:2}` is TWO declarations; `a{c:url(a;b)}` is one, because
//        the splitter counts parens). `declaration-body` is the SAME token language with one
//        zero-width assertion in front of the top-level item, and a call's arguments still go
//        through the unguarded group — which is that paren rule exactly.
//
//   J-2  THE DECLARATION'S NAME IS TEXT, NOT AN IDENT. `parseDeclarations` takes
//        `row.slice(0, row.indexOf(":")).trim().toLowerCase()` — every byte before the FIRST colon,
//        whatever it is. `backgrou(d-color`, `border-co+or`, `,ackground-color`, `!color`, `/olor`
//        and `backgro und-color` are all names there; a `TEXT("ident", …)` read admits none of
//        them. The class is therefore `decl-name` (any byte but `:`, `;`, `{`, `}`) and the
//        `declaration` constructor TRIMS before it folds, which is what `.trim().toLowerCase()`
//        does in that order. `{` and `}` are excluded so a NESTED rule is not swallowed as a name:
//        the incumbent reaches the same verdict by a different road (its `parseCssValue` of the
//        nested body fails and `parseStyleBody` falls through to `blocks()`), and the ordered
//        choice below IS that fall-through.
//
//   J-3  THE PRELUDE ADMITS `}`. `blocks()` breaks only on a top-level `{` or `;`; a `}` is
//        ordinary prelude text, which is why `a { color: red } b  background-color: x } b { … }`
//        is ONE rule whose selector is `b  background-color: x } b` there. The slice's class
//        `any-but-brace-or-semi` excluded `}` and refused the whole sheet. The new class is
//        `prelude-char` (any byte but `{` and `;`).
//
//   J-4  `;` AND COMMENTS ARE TRIVIA BETWEEN RULES. `blocks()` opens each block with
//        `while (/\s|;/.test(…)) cursor++` and a `/* … */` skip, and an UNTERMINATED comment is a
//        named failure. `ws-or-semi` is that run; the comment is its own `ALT` arm whose
//        constructor answers the recovery sentinel (`NONE_OPT`), so it leaves NO item behind and
//        NO diagnostic — a comment is not an error, and `stylesheet`'s constructor already filters
//        the sentinel. The `CUT` after `/*` is load-bearing: without it an unterminated comment
//        falls into the `RECOVER` arm and is SKIPPED as a malformed rule, which would accept a
//        source the incumbent refuses. With it the committed arm propagates, the `REP` stops and
//        `END` refuses the input — the same verdict, by the same reason.
//
//   J-5  A DECLARATION LIST DROPS ITS EMPTY PARTS. `splitDeclarations` is
//        `splitTopLevel(body, ";")`, which drops empty parts, so `a{color:red;;}`, `a{;}` and
//        `a{color:red;}` are all lawful. The slice wrote `REP(declaration, 0, INF, SEQ(WS, ";",
//        WS))` with ONE optional trailing `;`, and refused two. The list is now
//        `(ws-or-semi declaration)* ws-or-semi`, which is that splitter's own reading: a run of
//        whitespace and semicolons, of any length, anywhere, is a separator and nothing else.
//
// ── X.P.W3.l — THE AT-RULE AND NESTING FAMILIES (COHESION §0v E-j1, granted) ───────────────────
//
//   The grammar answers the RAW ITEM TREE (what `blocks()` + the dispatch of `parseItems()` sees:
//   which family, which prelude text, which raw or structured body); `entry.mjs`'s `completerOver`
//   COMPLETES that tree into the frozen `Stylesheet` as E-h3 surface compositions (the descriptor
//   checks, `parseKeyframeSelector`, `parseTimingFunction(serializeCssValue(…))`, `coerceToSyntax`,
//   the animation option checks). Nothing below re-parses; nothing below is a stub.
//
//   L-1  THE DISPATCH IS THE INCUMBENT'S OWN STRING TESTS, as productions over the folded prelude:
//          `startsWith("@keyframes ")`          LIT "keyframes"  ·  U+0020  ·  a non-empty name
//          `startsWith("@property ")` etc.       KW  at-rule-name ·  U+0020  ·  a non-empty name
//          `startsWith("@scope")`                LIT "scope"       (a PREFIX: `@scoped {}` is a scope
//                                                rule whose prelude `d` the completion refuses —
//                                                the oracle's own verdict, measured)
//          `=== "@starting-style"`               LIT "starting-style" · `{` (exact; `@starting-style
//                                                x {}` is UNKNOWN, `@starting-style;` is refused)
//          else                                  the unknown at-rule: `@`, a prelude, a raw
//                                                brace-balanced body or a `;`
//        The space is `SCAN("space", 1, INF)` (a run of U+0020, then any whitespace): the dispatch
//        keys on `"@keyframes "` with a literal U+0020, so `@keyframes\tx {}` is an UNKNOWN
//        at-rule there, and is one here (a `SCAN` run is maximal, so `1, 1` would refuse two). The
//        maximal `KW` read is what makes `@propertyx` fall through (`startsWith("@property ")`
//        fails on the same byte), and `LIT` + U+0020 does the same for `@keyframesx`.
//   L-2  THE CUT COMMITS THE FAMILY. Once a family's head and name have been read, a malformed body
//        is THAT family's rejection, never an unknown at-rule's acceptance: without the `CUT`,
//        `@property --x { syntax }` would fall into the unknown-block arm and be ACCEPTED, where
//        the incumbent (having dispatched on `@property `) refuses it. §5.2: the `CUT` commits the
//        nearest enclosing `ALT` — the at-rule family choice — and no further.
//   L-3  THE UNKNOWN BODY IS RAW, BRACE-BALANCED TEXT (`blocks()`'s own body scan), answered as the
//        source span `{ … }` minus its braces: `raw-text` is a run of non-brace text and nested
//        `raw-block`s; a `raw-block` is `{`, pieces, `}`. `TEXT(cls, 1, 1)` fails on a run of two
//        (a `TEXT` run is MAXIMAL: `{{` is one run of width 2), so each brace is read by `TEXT` when
//        it stands alone and by a dropped `LIT` when it is doubled — and the constructor recovers
//        the dropped brace's position from its neighbours (±1 code unit; both lowerings agree by
//        construction because both read the same span arithmetic). The children of an unknown
//        at-rule are the completion's re-read of that text through `parseStylesheet` — the
//        incumbent's own `Y(r.body)`, kept only when it succeeds.
//   L-4  A STYLE BODY IS DECLARATIONS FIRST, THEN THE MIXED READING (`parseStyleBody`:
//        `parseDeclarations(body)`, else `blocks(body + ";")`). The first arm is `.j`'s
//        `style-rule`; the second is `style-rule-mixed`, whose items are comments (trivia), nested
//        rules and declarations in any order. In the mixed reading a statement is a DECLARATION
//        only when it ends at `;`, `}` or the end (`blocks()` cuts a prelude at the first top-level
//        `{` OR `;`, whichever comes first — so `b:hover { … }` is a nested RULE there, and
//        `color: red` followed by `}` is a declaration); `decl-end` is that zero-width assertion.
//   L-5  A KEYFRAMES BODY IS KEYFRAME RULES AND COMMENTS; a keyframe rule's body is
//        `parseDeclarations` alone (never the mixed reading) and its prelude may be EMPTY
//        (`{ }` → selectors `[]`, the splitter's own reading of an empty prelude). `@property`,
//        `@function` and the two timeline families read `parseDeclarations` alone as well.
//   L-6  AN ANIMATION DECLARATION'S BODY REFUSES A BLANK COMMA PART (`emptyComma`, F-k1's cousin):
//        `declaration` is an ordered choice — the `animation-property` constructor admits the name
//        exactly when it is `animation` or `animation-*` (ASCII-folded, trimmed), and only then is
//        the body `animation-declaration-body` (`grammar/value.mjs`), whose blank part is OP-15
//        `FAIL animation_option_invalid`. Every other name reads `declaration-body`, unchanged.
//
// ── DECLARED DIVERGENCES, by class, reported by COUNT in the receipt (COHESION §0s E-h2) ───────
//
//   SH-1  `blocks()`'s prelude scan is PAREN- and QUOTE-aware: a `{` or `;` inside `( … )` or
//         inside a quoted string does not end the prelude, and the paren counter is SIGNED (a
//         stray `)` takes it to −1, where a later `(` returns it to 0 — `GARBAGE ) ;(#d {` is one
//         prelude there). `prelude-char` is a byte class and knows neither. The reading here is
//         therefore STRICTER: such a source ends its prelude early and is refused.
//   SH-2  DISCHARGED by X.P.W3.l (the families above); what remains of it is SH-4 and RT-1.
//   SH-3  DISCHARGED by X.P.W3.l: `!important` is `/!important\s*$/i` at the END of the part there
//         and the oracle refuses `! important` (measured); the production admits no gap now, and
//         `decl-end` holds it at the end of the part.
//   SH-4  (X.P.W3.l) `parseDeclarations` reads a name as EVERY byte before the first `:` of a
//         `;`-split part — braces included — so `a { x { } color: red }` is ONE declaration named
//         `x { } color` there; `decl-name` excludes braces (J-2) and reads a nested rule `x { }`
//         and a declaration `color: red`. The verdict agrees; the value differs.
//   RT-1  (X.P.W3.l) `blocks()`'s BODY scan is quote-aware: a `}` inside a quoted string does not
//         close the body (`@media { a { b: "}" } }` is one rule there). `raw-text`'s pieces are
//         byte classes and know no quotes, so such a source closes early and is refused. STRICTER,
//         the SH-1 posture at the body.
//   WS-1  the incumbent's `trim()` and `/\s/` see UNICODE whitespace; the algebra's `ws` class is
//         css-syntax-3's five. Inherited from X.P.W3.h / X.P.W3.i, same root.
//   DC-1  every rejection carries the algebra's FARTHEST-failure code (§5.6) rather than the
//         incumbent's one-code-per-function. The VERDICT is identical; the `code` cell differs.
//   DEPTH (X.P.W3.l) `nested-rule` and `raw-block` are `REF` targets, so nesting is bounded by
//         Θ.depthBound (64) in both lowerings and answers `nesting <= 64`; the incumbent's
//         recursion is bounded by the host stack alone.

const INF = Infinity;

/** The stylesheet family's `REF` targets (`../grammar.mjs` REF_TARGETS); each has mandatory width ≥ 2. */
export const STYLESHEET_REF_TARGETS = Object.freeze(["nested-rule", "raw-block"]);

/**
 * @param A   the algebra — any instantiation of the twenty-two, handed over as the locals
 *            `../grammar.mjs` destructured ONCE (never `A` itself: `lower.mjs`'s
 *            `assertClosedOperatorSet` records every property read and a duplicate is a HALT).
 * @param N   the notations `../grammar.mjs` already defines, passed in so this family spells
 *            whitespace, punctuation and optionality with the same bytes the slice does.
 */
export function buildStylesheetGrammar(A, N) {
    const { SCAN, LIT, TEXT, KW, END, SEQ, ALT, CUT, PURE, REP, DROP, FAIL, CTOR, RECOVER, REF } = A;
    const { WS, TOK, UNIT_KW, OPT } = N;

    /* ── J-4: the trivia between rules, and the comment ───────────────────────────────────── */

    /** `while (/\s|;/.test(source[cursor])) cursor++` — one run, of any length, possibly empty. */
    const wsSemi = () => DROP("skipped", SCAN("ws-or-semi", 0, INF));

    /**
     * `source.indexOf(CLOSE, cursor + 2)` as a production (CLOSE being the two bytes an asterisk
     * and a solidus spell, which this comment may not itself contain). A comment's interior is
     * every byte that is not `*`, plus every `*` NOT followed by `/`. The second arm is `LIT`
     * (exact width — a
     * maximal `TEXT` run of stars would swallow the closing one) followed by the `.g` zero-width
     * idiom: `SCAN(cls, 0, 0)` succeeds exactly when the run of `cls` at the cursor is EMPTY, so
     * it asserts "no slash here", consumes nothing, and — because `DROP` appends a `C` row only
     * for a non-empty span — appends nothing in either lowering.
     */
    const commentBody = () =>
        REP(
            ALT(
                DROP("skipped", SCAN("any-but-star", 1, INF)),
                SEQ(DROP("skipped", LIT("*")), DROP("keyword", SCAN("slash", 0, 0))),
            ),
            0,
            INF,
            null,
        );
    const comment = () =>
        CTOR("sheet-comment", SEQ(DROP("skipped", LIT("/*")), CUT(), commentBody(), DROP("skipped", LIT("*/"))));

    /* ── J-2 / J-1 / J-5 / L-6: the declaration and the declaration list ──────────────────── */

    // DECLARED DEVIATION, carried from the slice unchanged: §10.3's
    // `OPT(SEQ[WS, TOK "!", WS, UNIT "important"]) unit` cannot carry "whether the OPT arm
    // matched" — both arms yield `unit`. `PURE true` / `PURE false` is the expressible form, so
    // the constructor reads a value rather than a match and `Declaration.important` is exact.
    /**
     * X.P.W3.l — THE DECLARATION'S END. `parseDeclarations` reads a part CUT AT `;` (or at the end
     * of the body) and hands the WHOLE of it to `parseCssValue` after stripping a trailing
     * `!important`; a value the grammar stops reading early is therefore not a shorter value
     * followed by something else — it is the part refused. Both readings below end with the `.g`
     * zero-width assertion "the next byte is `;`, `}` or the end" (`decl-end`), so a declaration is
     * exactly one `;`-delimited part. Measured before this stood: `a { <comment with a colon in it>
     * grid-template-columns: … }` read the comment's text up to its colon as a NAME, the words after
     * it as a VALUE, and the real declaration as a SECOND declaration with no `;` between — the
     * oracle refuses that part and falls to the mixed reading, where the comment is trivia (the
     * two F-k3 cells of the corpus); `a { color: red !important x: y }` accepted here and is
     * refused there.
     *
     * SH-3 DISCHARGED: `/!important\s*$/i` admits no gap between `!` and `important`, and the
     * oracle refuses `a { color: red ! important }` (measured); the slice's `WS` between them is
     * gone. `PURE true` / `PURE false` is the expressible form of "whether the arm matched"
     * (the slice's declared deviation, carried).
     */
    const declEnd = () => DROP("keyword", SCAN("any-but-semi-or-close", 0, 0));
    const important = () =>
        ALT(
            SEQ(WS(), TOK("!"), UNIT_KW("important"), WS(), declEnd(), PURE(true)),
            SEQ(WS(), declEnd(), PURE(false)),
        );

    /**
     * ONE declaration: the name run up to the first colon, the colon, and the value the VALUE
     * GRAMMAR reads (J-1). The name's trailing whitespace is INSIDE the `TEXT` run — space is a
     * `decl-name` byte — because the incumbent trims a slice it has already cut at the colon; the
     * constructor does that trim, and only then folds.
     *
     * L-6: the ordered choice. The `animation-property` constructor answers the name when it is
     * `animation` or `animation-*` and the row's labelled zero-width failure otherwise (OP-19), so
     * the first arm is taken exactly for the names `parseDeclarations` runs `emptyComma` on; its
     * `CUT` after the colon commits the declaration to the animation body — the blank part's
     * `FAIL` must not fall through to the plain body, which would ACCEPT `animation-name: a,,b`
     * as a two-item list. §5.2: the nearest enclosing `ALT` is this choice, and no further.
     */
    const animationDeclaration = () =>
        CTOR(
            "declaration",
            SEQ(
                CTOR("animation-property", TEXT("decl-name", 1, INF)),
                TOK(":"),
                CUT(),
                WS(),
                REF("animation-declaration-body"),
                important(),
            ),
        );
    const plainDeclaration = () =>
        CTOR("declaration", SEQ(TEXT("decl-name", 1, INF), TOK(":"), WS(), REF("declaration-body"), important()));
    const declaration = () => ALT(animationDeclaration(), plainDeclaration());

    /** J-5: `(ws-or-semi declaration)* ws-or-semi` — `splitTopLevel(body, ";")`'s own reading. */
    const declarations = () => SEQ(REP(SEQ(wsSemi(), declaration()), 0, INF, null), wsSemi());

    /* ── J-3 / L-4: the style rule, in its two readings ───────────────────────────────────── */

    /**
     * `blocks()`'s prelude: every byte up to the first `{` or `;` (J-3) — at the TOP LEVEL, where a
     * `}` is ordinary prelude text. INSIDE A BODY the incumbent has already cut the body
     * brace-balanced before `blocks()` runs over it, so a nested prelude can never reach the `}`
     * that closes its parent: a nested prelude is every byte but `{`, `;` AND `}` (the slice's own
     * `any-but-brace-or-semi`). Measured before this split: `@starting-style {\n}\n@keyframes s {…}`
     * read `}\n@keyframes s` as a nested rule's selector and the parent lost its closing brace.
     * Every rule production below takes the prelude it is built over.
     */
    const topPrelude = () => TEXT("prelude-char", 1, INF);
    const nestedPrelude = () => TEXT("any-but-brace-or-semi", 1, INF);

    /** `parseDeclarations(body)` succeeded: the first reading. The prelude may be empty (`{ … }`). */
    const styleRule = (prelude) =>
        CTOR("style-rule", SEQ(OPT(prelude(), null), TOK("{"), declarations(), TOK("}")));

    /**
     * L-4: in the mixed reading a declaration is a STATEMENT — `blocks()` cut its prelude at a
     * `;` (or the appended one at the end of the body), never at a `{`. The value grammar admits
     * no `{`, so after the value and the optional `!important` the next byte decides: `;`, `}` or
     * the end is a declaration (`decl-end`, inside `declaration` itself); anything else (a `{` —
     * `b:hover {`) is not, and the nested-rule arm reads the same bytes as a prelude.
     */
    const mixedItems = () =>
        SEQ(
            REP(SEQ(wsSemi(), ALT(comment(), declaration(), REF("nested-rule"))), 0, INF, null),
            wsSemi(),
        );
    const styleRuleMixed = (prelude) =>
        CTOR("style-rule-mixed", SEQ(OPT(prelude(), null), TOK("{"), mixedItems(), TOK("}")));

    /** `parseStyleBody`: `parseDeclarations(body)` first, else `blocks(body + ";")` — the ordered choice. */
    const styleRules = (prelude) => ALT(styleRule(prelude), styleRuleMixed(prelude));

    /* ── L-1 … L-3, L-5: the at-rule families ────────────────────────────────────────────── */

    /**
     * The U+0020 the dispatch strings end in (`"@keyframes "`, `"@property "`, …): the head must be
     * followed by a SPACE, not a tab or a newline. A `SCAN` run is MAXIMAL (`SCAN(cls, 1, 1)` fails
     * on two spaces), so the run is `1..INF` spaces and `WS()` then takes any other whitespace.
     */
    const SPACE = () => DROP("ws", SCAN("space", 1, INF));

    /** `blocks(body)` over a keyframes body: keyframe rules and comments, `;` and whitespace trivia. */
    const keyframeRule = () =>
        CTOR("keyframe-rule", SEQ(OPT(nestedPrelude(), null), TOK("{"), declarations(), TOK("}")));
    const keyframesBody = () => SEQ(REP(SEQ(wsSemi(), ALT(comment(), keyframeRule())), 0, INF, null), wsSemi());

    /** `parseItems(body)` over a nested body (`@scope`, `@starting-style`): rules and comments only. */
    const nestedItems = () => SEQ(REP(SEQ(wsSemi(), ALT(comment(), REF("nested-rule"))), 0, INF, null), wsSemi());

    /**
     * L-3: the raw body. A piece is a maximal run of non-brace text or a nested block; a block is
     * an opening brace, pieces, a closing brace, each brace read by `TEXT(cls, 1, 1)` when it
     * stands alone and by a dropped `LIT` when doubled (the maximal-run rule). The `raw-text` and
     * `raw-block` constructors answer the SOURCE SPAN (a `T_STR` span in Wasm, the slice in JS), so
     * the unknown at-rule's `body` is the incumbent's `source.slice(open + 1, close)` byte for byte.
     */
    const rawPieces = () => REP(ALT(TEXT("at-rule-text", 1, INF), REF("raw-block")), 0, INF, null);
    const rawClose = () => ALT(TEXT("rbrace", 1, 1), DROP("punct", LIT("}")));
    const rawBlock = () =>
        CTOR(
            "raw-block",
            ALT(
                SEQ(TEXT("lbrace", 1, 1), rawPieces(), rawClose()),
                SEQ(DROP("punct", LIT("{")), rawPieces(), rawClose()),
            ),
        );
    const rawText = () => CTOR("raw-text", rawPieces());

    /** `startsWith("@keyframes ")`: the literal head, ONE space, the name (non-empty after `WS`). */
    const atKeyframes = (prelude) =>
        CTOR(
            "at-keyframes",
            SEQ(UNIT_KW("keyframes"), SPACE(), WS(), prelude(), CUT(), TOK("{"), keyframesBody(), TOK("}")),
        );

    /** `startsWith("@property ")` · `"@function "` · `"@scroll-timeline "` · `"@view-timeline "`. */
    const atDeclarations = (prelude) =>
        CTOR(
            "at-declarations",
            SEQ(KW("ident", "at-rule-name"), SPACE(), WS(), prelude(), CUT(), TOK("{"), declarations(), TOK("}")),
        );

    /** `startsWith("@scope")` — a PREFIX; the prelude (possibly empty) is the completion's to judge. */
    const atScope = (prelude) =>
        CTOR("at-scope", SEQ(UNIT_KW("scope"), CUT(), OPT(prelude(), null), TOK("{"), nestedItems(), TOK("}")));

    /**
     * `=== "@starting-style"`: the exact head, then a body. A `;` (or the end) where the body
     * should stand is the incumbent's "nested body" refusal, named here by OP-15 `FAIL` behind the
     * `.g` assertion "no non-`;` byte here"; any other byte (`@starting-style x {}`) is neither arm
     * and falls to the unknown at-rule, as `startsWith` fails there.
     */
    const atStartingStyle = () =>
        CTOR("at-starting-style", SEQ(UNIT_KW("starting-style"), WS(), TOK("{"), CUT(), nestedItems(), TOK("}")));
    const atStartingStyleStatement = () =>
        SEQ(
            UNIT_KW("starting-style"),
            WS(),
            DROP("keyword", SCAN("any-but-semi", 0, 0)),
            CUT(),
            FAIL("css_syntax", "<starting-style-body>"),
        );

    /** The unknown at-rule: a prelude and a raw block, or a prelude and a `;` (`body: null`). */
    const atUnknownBlock = (prelude) => CTOR("at-unknown-block", SEQ(OPT(prelude(), null), TOK("{"), rawText(), TOK("}")));
    const atUnknownStatement = (prelude) => CTOR("at-unknown-stmt", SEQ(OPT(prelude(), null), TOK(";")));

    /**
     * ONE rule over its prelude class: the seven at-rule arms (each opened by its own `@`) and the
     * two style-rule readings, in ONE `ALT`. The flatness is load-bearing (L-2): §5.2 commits the
     * NEAREST enclosing `ALT`, so with the at-rule arms in a choice of their own a family's `CUT`
     * committed only that inner choice, and `@keyframes k { from { color: red; <comment> } }` (a
     * comment inside a keyframe block, the keyframes family's refusal) fell through to the
     * style-rule arm and was ACCEPTED as a rule whose selector is `@keyframes k` (measured, both
     * lowerings). One choice, one commit.
     */
    const AT = () => TOK("@");
    const rule = (prelude) =>
        ALT(
            SEQ(AT(), atKeyframes(prelude)),
            SEQ(AT(), atDeclarations(prelude)),
            SEQ(AT(), atScope(prelude)),
            SEQ(AT(), atStartingStyle()),
            SEQ(AT(), atStartingStyleStatement()),
            SEQ(AT(), atUnknownBlock(prelude)),
            SEQ(AT(), atUnknownStatement(prelude)),
            styleRule(prelude),
            styleRuleMixed(prelude),
        );
    /** The at-rule arms alone, for the registry's own term. */
    const atRule = (prelude) =>
        ALT(
            SEQ(AT(), atKeyframes(prelude)),
            SEQ(AT(), atDeclarations(prelude)),
            SEQ(AT(), atScope(prelude)),
            SEQ(AT(), atStartingStyle()),
            SEQ(AT(), atStartingStyleStatement()),
            SEQ(AT(), atUnknownBlock(prelude)),
            SEQ(AT(), atUnknownStatement(prelude)),
        );

    // DECLARED DEVIATION (recorded, never silent; the slice's own, carried): §10.3 writes
    // `sync-rule`'s terminals as bare `SCAN`/`LIT`. INV-OWN (§2.4) requires every Span to be owned
    // by a `DROP`. `sync` runs UNDER DISCARD — whatever it appends to `C` is truncated to the mark
    // and the whole consumed span becomes ONE `skipped` entry — so the kinds below are
    // unobservable by construction. The DROPs are ownership bookkeeping, not a semantic change.
    const syncRule = () =>
        ALT(
            SEQ(DROP("keyword", SCAN("any-but-semi-or-close", 1, INF)), OPT(ALT(TOK(";"), TOK("}")), null)),
            TOK(";"),
            TOK("}"),
        );

    /* ── the sheet ────────────────────────────────────────────────────────────────────────── */

    /**
     * One item position: a comment (which leaves nothing behind) or a rule under `RECOVER`. The
     * `RECOVER` is NOT error tolerance — `lowering-js/index.mjs` and the Wasm result block both
     * read `ok = D.length === 0`, so a recovered rule REFUSES the sheet exactly as
     * `parseItems`'s early `return failure(…)` does. It is where the diagnostic gets its span.
     */
    const sheetItem = () => ALT(comment(), RECOVER("css_syntax", rule(topPrelude), syncRule()));

    const stylesheet = () =>
        CTOR("stylesheet", SEQ(REP(SEQ(wsSemi(), sheetItem()), 0, INF, null), wsSemi(), END()));

    return {
        entries: { "P:stylesheet": "stylesheet" },
        terms: {
            stylesheet: stylesheet(),
            rule: rule(topPrelude),
            "nested-rule": rule(nestedPrelude),
            "qualified-rule": styleRules(topPrelude),
            "at-rule": atRule(topPrelude),
            "raw-block": rawBlock(),
            declaration: declaration(),
            "sync-rule": syncRule(),
            comment: comment(),
        },
    };
}
