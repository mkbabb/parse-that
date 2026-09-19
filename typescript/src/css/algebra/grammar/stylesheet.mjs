// SERVED MODEL: claude-opus-5[1m]
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
// ── DECLARED DIVERGENCES, by class, reported by COUNT in the receipt (COHESION §0s E-h2) ───────
//
//   SH-1  `blocks()`'s prelude scan is PAREN- and QUOTE-aware: a `{` or `;` inside `( … )` or
//         inside a quoted string does not end the prelude, and the paren counter is SIGNED (a
//         stray `)` takes it to −1, where a later `(` returns it to 0 — `GARBAGE ) ;(#d {` is one
//         prelude there). `prelude-char` is a byte class and knows neither. The reading here is
//         therefore STRICTER: such a source ends its prelude early and is refused.
//   SH-2  the at-rule families (`@keyframes` · `@property` · `@function` · `@scope` ·
//         `@starting-style` · `@scroll-timeline` · `@view-timeline` and the `unknown` at-rule) and
//         NESTED style bodies have no production in this unit — ESCALATED as E-j1 with its
//         measured corpus population, never silently narrowed.
//   SH-3  `!important` is `/!important\s*$/i` at the END of the value text there; here it is a
//         production after the value, so `! important` (a gap after the bang) is admitted. This is
//         the slice's own `important()`, carried unchanged.
//   WS-1  the incumbent's `trim()` and `/\s/` see UNICODE whitespace; the algebra's `ws` class is
//         css-syntax-3's five. Inherited from X.P.W3.h / X.P.W3.i, same root.
//   DC-1  every rejection carries the algebra's FARTHEST-failure code (§5.6) rather than the
//         incumbent's one-code-per-function. The VERDICT is identical; the `code` cell differs.

const INF = Infinity;

/**
 * @param A   the algebra — any instantiation of the twenty-two, handed over as the locals
 *            `../grammar.mjs` destructured ONCE (never `A` itself: `lower.mjs`'s
 *            `assertClosedOperatorSet` records every property read and a duplicate is a HALT).
 * @param N   the notations `../grammar.mjs` already defines, passed in so this family spells
 *            whitespace, punctuation and optionality with the same bytes the slice does.
 */
export function buildStylesheetGrammar(A, N) {
    const { SCAN, LIT, TEXT, END, SEQ, ALT, CUT, PURE, REP, DROP, CTOR, RECOVER, REF } = A;
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

    /* ── J-2 / J-1 / J-5: the declaration and the declaration list ────────────────────────── */

    // DECLARED DEVIATION, carried from the slice unchanged: §10.3's
    // `OPT(SEQ[WS, TOK "!", WS, UNIT "important"]) unit` cannot carry "whether the OPT arm
    // matched" — both arms yield `unit`. `PURE true` / `PURE false` is the expressible form, so
    // the constructor reads a value rather than a match and `Declaration.important` is exact.
    const important = () => ALT(SEQ(WS(), TOK("!"), WS(), UNIT_KW("important"), PURE(true)), PURE(false));

    /**
     * ONE declaration: the name run up to the first colon, the colon, and the value the VALUE
     * GRAMMAR reads (J-1). The name's trailing whitespace is INSIDE the `TEXT` run — space is a
     * `decl-name` byte — because the incumbent trims a slice it has already cut at the colon; the
     * constructor does that trim, and only then folds.
     */
    const declaration = () =>
        CTOR("declaration", SEQ(TEXT("decl-name", 1, INF), TOK(":"), WS(), REF("declaration-body"), important(), WS()));

    /** J-5: `(ws-or-semi declaration)* ws-or-semi` — `splitTopLevel(body, ";")`'s own reading. */
    const declarations = () => SEQ(REP(SEQ(wsSemi(), declaration()), 0, INF, null), wsSemi());

    /* ── J-3: the qualified rule ──────────────────────────────────────────────────────────── */

    const qualifiedRule = () =>
        CTOR("style-rule", SEQ(TEXT("prelude-char", 1, INF), TOK("{"), declarations(), TOK("}")));

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
    const sheetItem = () => ALT(comment(), RECOVER("css_syntax", qualifiedRule(), syncRule()));

    const stylesheet = () =>
        CTOR("stylesheet", SEQ(REP(SEQ(wsSemi(), sheetItem()), 0, INF, null), wsSemi(), END()));

    return {
        entries: { "P:stylesheet": "stylesheet" },
        terms: {
            stylesheet: stylesheet(),
            rule: qualifiedRule(),
            "qualified-rule": qualifiedRule(),
            declaration: declaration(),
            "sync-rule": syncRule(),
            comment: comment(),
        },
    };
}
