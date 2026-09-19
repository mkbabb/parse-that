// SERVED MODEL: claude-fable-5-1
//
// X.P.W3.h — THE VALUE GRAMMAR: `P:scalar` · `P:value` · `P:values`, authored ONCE against the
// twenty-two and composed into `buildGrammar(A)` by `../grammar.mjs` (W3.md third ADDENDUM L703:
// "author in the 22-op algebra through `buildGrammar(A)` — one grammar source, both lowerings").
//
// THE SUBJECT it mirrors is the incumbent's `parseValueInternal` / `parseScalarInternal`
// (`value.js/src/css/grammar.ts` at pin 6aca8602, logic-identical to the sha-pinned 4.0.0 bundle),
// read as a TOKEN language rather than as the string-splitting it is written as: the incumbent
// splits at TOP-LEVEL commas, then slashes, then whitespace (cutting `:` and `;` out as tokens of
// their own), then reads ONE token as a call or a scalar. Every token there is matched by a
// WHOLE-TOKEN regex, so the one fact this grammar has to carry that a PEG does not give for free is
// the TOKEN BOUNDARY: `1px` is a number with a unit and `1px5` is nothing, `red` is a colour and
// `red(1)` is a call, `"a"b` is not a string. That boundary is the `.g` idiom — a ZERO-WIDTH
// `SCAN(cls, 0, 0)` (OP-01) that succeeds exactly when the run of `cls` at the cursor is EMPTY —
// over a `token-char` class that admits every byte but the ones the incumbent's splitters stop at:
// the five CSS whitespace code points, `,`, `/`, `:`, `;` and `)`.
//
// THE THREE PRODUCTS, in the frozen shapes (`generated/frozen-4.0.0.d.ts`):
//   CssScalar  {kind:"scalar", payload: {type:"number",value,unit} | {type:"keyword",value} | {type:"color",value}}
//   CssCall    {kind:"call", name, args: CssValue[]}
//   CssList    {kind:"list", separator:"space"|"comma"|"slash", items: CssValue[]}
// A value shape exists only through OP-19 `CTOR`, whose constructor is realized per lowering
// (COHESION §0s E-h1): the rows are `algebra/tables.mjs` `R_ctor.value-*`, the functions are
// `lowering-js/js-alg.mjs` `CTORS` and `lowering-wasm/wasm-alg.mjs` `emitCtors`, and the node table
// is `bounds.mjs` `CTOR_ALLOC` / `CTOR_SCRATCH_CELLS` — four name-sets, equal, asserted at load.
//
// ORDERED COMMITTED CHOICE (OP-09) does the incumbent's precedence: comma-list, else slash-list,
// else space-list, else one token; and within a token: colour, call, number, string, operator,
// ident — the incumbent's own order (`grammar.ts` parseValueInternal → parseScalarInternal), with
// the one transposition its regexes make invisible: the incumbent tries the CALL regex before the
// scalar chain but EXCLUDES the ten colour heads by name, and this grammar reaches the same verdict
// by putting the colour heads FIRST, FLAT in the token's `ALT`, and letting `head-*`'s `CUT` commit
// the token — so `rgb(1,2,3,)` is a committed colour failure and never a call named `rgb`, exactly
// as the incumbent rejects it (§5.2's scope rule: a `CUT` commits the nearest enclosing `ALT` arm
// through `SEQ`/`CTOR`/`EXPECT`/`DROP`/`DISPATCH`). The value-side dispatch table
// `R_disp.value-color-head` carries the ten heads and NOT `var`/`env`: the incumbent parses
// `var(--x)` as a CALL in a value (and as `color_context_required` only in `parseCssColor`), and a
// table is a registry row, not an `if`.
//
// DECLARED DIVERGENCES this grammar carries by design — every one a class the adjudications
// already name, reported by count in the receipt (COHESION §0s E-h2: "raw misses AND
// misses-in-adjudicated-classes, never TOTAL-by-assertion"):
//   PB-12  `1.` is not a CSS number — the incumbent's regex `\d+\.?\d*` accepts it in any number
//          position of a value; OP-03 `NUM` is css-syntax-3 §4.3.12 and does not;
//   PB-03/04/05/08/09/10/11, ADJ-2/3  every colour scalar inherits `P:color`'s adjudicated classes;
//   the incumbent's `String.prototype.trim` and `/\s/` see Unicode whitespace (`\v`, U+00A0 …); the
//   algebra's `ws` class is css-syntax-3's five (measured: 0 accepted corpus inputs carry either —
//   `X-P-W3.md` h.2 INFO-h2);
//   a lone backslash immediately before a string's closing quote (`"a\"`) is a string to the
//   incumbent's BACKTRACKING regex and an escaped quote to this PEG — rowable, not in the corpus.
//
// EVERY production is a FUNCTION returning a FRESH node (the grammar file's own law: sharing makes
// the reified term a DAG, and the structural walk reads a revisited object as a cycle).
//
// THE BACK-EDGES are two `REF`s (OP-22): every entry reads `value-body`, and every call reads its
// `value-args` (see the lists below for the measured reason the token itself is not one). Both
// count against Θ.depthBound exactly as `balanced-tail` does — a call nested sixty-four deep is an
// ordinary `ok:false` naming `nesting <= 64`, never a `RangeError` (the incumbent recurses on the
// native stack). No `EXPECT` stands inside the recursion, so the snapshot stack's static ceiling
// (`bounds.mjs` CLASS3_CEILINGS.expsnap.S) is unmoved; the three entries carry ONE `EXPECT` each,
// at their root, naming `<value>` / `<value-list>` / `<scalar>` when nothing at all could start.

const INF = Infinity;

/**
 * `SEPARATORS[k]` is the `separator` the `value-list` constructor writes for `PURE(k)` — ONE row
 * for three list kinds, the index carried as a leaf so no constructor inspects a value.
 */
export const SEPARATORS = Object.freeze(["space", "comma", "slash"]);

/**
 * The twelve operator spellings the incumbent's `parseScalarInternal` admits as keywords
 * (`grammar.ts` `/^(?:[+*]|-|<=|>=|==|!=|<|>|=|:|;)$/`). The first ten are the codomain of
 * `R_kw.operator` (read by `KW` over the `op-char` class, so `<=` is one token and `<=>` none);
 * `:` and `;` are the two the incumbent's splitter cuts out as tokens of their own, so they are
 * self-delimiting on BOTH sides and are read by `LIT` with their index carried as a `PURE` leaf.
 */
export const OPERATORS = Object.freeze(["+", "*", "-", "<=", ">=", "==", "!=", "<", ">", "=", ":", ";"]);
export const OPERATOR_COLON = OPERATORS.indexOf(":");
export const OPERATOR_SEMICOLON = OPERATORS.indexOf(";");

/**
 * The string constructor's piece markers. A quoted string's interior is a list of pieces: a plain
 * run (a bare string) or an ESCAPE (a tuple `[x, true]`, `x` being `ESCAPED_QUOTE`, `ESCAPED_BACKSLASH`
 * or the plain run the backslash introduced). The JS constructor re-joins them; the Wasm constructor
 * reads the source span from the opening quote to the closing one and never looks at a piece.
 */
export const ESCAPED_QUOTE = 1;
export const ESCAPED_BACKSLASH = 2;

/**
 * @param A   the algebra — any instantiation of the twenty-two
 * @param N   the notations and colour pieces `grammar.mjs` already defines, passed in so the value
 *            grammar re-uses `P:color`'s hex / named / transparent productions byte for byte
 *            (`WS`, `TOK`, `hex`, `named`, `transparent`)
 */
export function buildValueGrammar(A, N) {
    const { SCAN, LIT, NUM, TEXT, KW, END, SEQ, ALT, CUT, PURE, REP, DROP, DISPATCH, FAIL, EXPECT, CTOR, REF } = A;
    const { WS, TOK, hex, named, transparent } = N;

    /* ── the two zero-width assertions (the `.g` idiom, OP-01 alone) ─────────────────────── */

    /** The token ends HERE: no `token-char` may follow (whitespace, `,` `/` `:` `;` `)` or the end). */
    const NOT_TOKEN = () => DROP("keyword", SCAN("token-char", 0, 0));
    /** An identifier or a function name may not BEGIN with a digit (`[-_a-z][\w-]*`, both regexes). */
    const NO_LEADING_DIGIT = () => DROP("keyword", SCAN("leading-digit", 0, 0));

    /* ── the scalars ─────────────────────────────────────────────────────────────────────── */

    /** A colour production, wrapped as the `color` scalar and closed at the token boundary. */
    const colorScalar = (body) => CTOR("value-color", SEQ(body, NOT_TOKEN()));

    /** The colour arms, FLAT in the enclosing `ALT` so a head's `CUT` commits the whole token. */
    const colorArms = () => [
        colorScalar(hex()),
        colorScalar(named()),
        colorScalar(transparent()),
        colorScalar(DISPATCH("ident", "value-color-head")),
    ];

    /**
     * `<number-token>` [`<unit>`]: `1px` · `50%` · `1e3` · `-.5em`; `1px5` and `1.` are nothing. The
     * unit is OPTIONAL through the `OPT(o, null)` idiom rather than a zero-width `TEXT`, because a
     * `TEXT` that matched nothing would still append an EMPTY provenance span, and COMP-1c reads an
     * empty span as a tiling violation. The constructor takes one leaf or two.
     */
    const number = () =>
        CTOR("value-number", SEQ(NUM(), ALT(TEXT("unit-char", 1, INF), PURE(null)), NOT_TOKEN()));

    /** `[-_a-z][\w-]*` as a keyword — after every other arm, so `red` is a colour and `1e` a number. */
    const ident = () => CTOR("value-keyword", SEQ(NO_LEADING_DIGIT(), TEXT("ident", 1, INF), NOT_TOKEN()));

    /**
     * The operators. The class-run read (`KW`) is what makes `<=` one token and `<=>` none, and its
     * `NOT_TOKEN` is what makes `-a` an ident rather than an operator and a keyword; `:` and `;`
     * are read by `LIT` with their table index carried as a `PURE` leaf, because the incumbent's
     * splitter cuts each of them out on its own (`::` is TWO tokens, `<<` is none).
     */
    const operator = () =>
        ALT(
            CTOR("value-operator", SEQ(KW("op-char", "operator"), NOT_TOKEN())),
            CTOR("value-operator", SEQ(TOK(":"), PURE(OPERATOR_COLON))),
            CTOR("value-operator", SEQ(TOK(";"), PURE(OPERATOR_SEMICOLON))),
        );

    /**
     * A quoted string, kept WHOLE as a keyword (`/^(["'])(?:\\.|(?!\1)[\s\S])*\1$/`).
     *
     * The regex pairs every backslash with the next code point, left to right, and a quote closes
     * the string exactly when it is not the second half of such a pair. A pair's first half must be
     * read as EXACTLY ONE backslash whatever the length of the run it begins (`\\\\` is two escaped
     * backslashes, `\\\"` is one escaped backslash and one escaped quote), and `TEXT`/`SCAN` read a
     * MAXIMAL run — so the backslash is `LIT`, the one exact-width primitive, and its second half is
     * `LIT` of the quote, `LIT` of a backslash, or the plain run it introduced (a maximal plain run
     * after an escaped plain character is the same bytes the regex reads one at a time). INV-OWN
     * (§2.4) requires a `LIT`'s span to be owned by a `DROP`, and §4.5's π_punct admits neither
     * `\` nor a quote, so the dropped halves are `skipped` — the E-2 ruling's general form, "bytes no
     * LEAF of V claims" (no `TEXT` claims them; the constructor re-joins them from the markers).
     *
     * An EMPTY string is the one place a maximal-run read of the quote cannot be one quote: `""` is
     * a run of two, read by the second arm as its own text. `"""` is a run of three and nothing, as
     * it is to the regex.
     */
    const quoted = (quote, plain, q) => {
        const escape = () =>
            SEQ(
                DROP("skipped", LIT("\\")),
                ALT(
                    SEQ(DROP("skipped", LIT(q)), PURE(ESCAPED_QUOTE)),
                    SEQ(DROP("skipped", LIT("\\")), PURE(ESCAPED_BACKSLASH)),
                    TEXT(plain, 1, INF),
                ),
                PURE(true),
            );
        return ALT(
            CTOR(
                "value-string",
                SEQ(TEXT(quote, 1, 1), REP(ALT(TEXT(plain, 1, INF), escape()), 1, INF, null), TEXT(quote, 1, 1), NOT_TOKEN()),
            ),
            CTOR("value-string", SEQ(TEXT(quote, 2, 2), NOT_TOKEN())),
        );
    };
    const string = () => ALT(quoted("dquote", "dq-plain", '"'), quoted("squote", "sq-plain", "'"));

    /* ── the separators: ONE comma or slash, whitespace either side (a run is the group's) ──── */

    const commaSep = () => SEQ(WS(), TOK(","), WS());
    const slashSep = () => SEQ(WS(), TOK("/"), WS());

    /* ── the lists, left-factored, over the token ──────────────────────────────────────── */

    /**
     * LEFT-FACTORED, so every token is read ONCE. A list is `sep* first (sep first?)*` — leading
     * separators, one item, then zero or more separators each followed by an item or by nothing —
     * and the `value-group` constructor answers the item ITSELF when no second item followed, the
     * list otherwise. That is the incumbent's `splitTopLevel` verdict, part for part: it splits at
     * every top-level separator, DROPS THE EMPTY PARTS, and a level is a list exactly when two or
     * more parts remain — so `a,,b` and `,a,b` and `a,b,` are the two-item comma list, while `a,`
     * and `,a` (one part, the separators still in the text) fall through every level and fail as a
     * scalar. Here an empty part is a `UNIT` in `rest` (`OPT(item, null)` after a separator, or a
     * leading separator run), and the constructor's guard is the incumbent's own count: a leading
     * or trailing separator with fewer than two items is a failure. The space group has no such
     * form: whitespace before or after a token belongs to the enclosing production.
     *
     * The form this replaced — "a list of at least two, else one item" — was MEASURED, not judged:
     * each of the three nesting levels re-read its item on the second arm after the first arm's
     * list failed for want of a second item, eight re-reads per level, so `f(g(h(1)))` re-read the
     * innermost token 8³ times and overflowed the mark journal (`marks <= 32768`) at three levels
     * of nesting where the incumbent is linear. The token is still ordered committed choice; the
     * lists are not choices at all.
     *
     * Whitespace between space-list items is `WS` (zero or more), not `WS1`: every token ends at a
     * boundary by construction, and the only boundary bytes that can BEGIN a token are `:` and `;`,
     * so `a:b` is the three-item list the incumbent's splitter makes of it while `ab` is one ident
     * (a maximal `TEXT` run) and `1px2px` is nothing (`NOT_TOKEN` fails at the `2`).
     *
     * THE TOKEN STANDS BEHIND `REF("value-single")` at every item position, beside the entries'
     * `value-body`; a call's arguments are INLINE, so the one cycle closes at the token, whose
     * every path through a call is at least `n()` wide. MEASURED, not stylistic: the token carries the 148-row named-colour table, which the Wasm lowering's
     * keyword blobs materialize PER SITE (≈ 6 KB each, `index.mjs keywordBlob`, not this unit's);
     * inline at the eight item positions of two bodies the static region read 160,176 B of the
     * 262,144 B `STATIC_CAP` and the module 716,292 B, behind one `REF` it reads under half of
     * each. The ceiling walk (`bounds.mjs`) reads the SAME per-unit arena rate either way: it takes
     * the worst bytes-per-width over a production's Pareto front, and a one-token value pays every
     * group level's fixed record once, so the rate is the one-token vertex (≈ 470 B for one code
     * unit) whether the token is a `REF` or inline — the measured arena high-water is 56–132 B per
     * code unit over long lists — while a cycle closed at a production that CAN be zero-width
     * (`value-args` as a `REF`: its lead and rest are optional) is charged its fixed bytes
     * sixty-four times over (rate 6,221, Θ.input 1,155). That gap between the walk's model and the measurement is
     * escalated (E-h5), not patched here. A `CUT` inside the token (`rgb(` …) commits the token's
     * OWN choice (§5.2: the nearest enclosing `ALT`) in both shapes, so `rgb(1,2,3,)` is the same
     * committed colour failure either way — asserted by the recovery fixture on both lowerings.
     */
    const spaceGroup = () =>
        CTOR("value-group", REP(WS(), 0, INF, null), REF("value-single"), REP(SEQ(WS(), REF("value-single")), 0, INF, null), PURE(SEPARATORS.indexOf("space")));
    const separated = (row, separator, elem, sep) =>
        CTOR(
            row,
            REP(sep(), 0, INF, null),
            elem(),
            REP(SEQ(sep(), ALT(elem(), PURE(null))), 0, INF, null),
            PURE(SEPARATORS.indexOf(separator)),
        );
    const slashGroup = () => separated("value-group", "slash", spaceGroup, slashSep);
    const commaGroup = () => separated("value-group", "comma", slashGroup, commaSep);

    /* ── the call ────────────────────────────────────────────────────────────────────────── */

    /** `[a-z_-][\w-]*` — the incumbent's call-name class, verbatim (case is preserved). */
    const callName = () => SEQ(NO_LEADING_DIGIT(), TEXT("ident", 1, INF));

    /**
     * The argument list: a comma group's items become the arguments (`value-args` is the comma
     * group's own shape answering the BARE ARRAY, one item or many), an empty body is no leaf at
     * all (`OPT(o, null)`), and the `value-call` constructor takes the name alone or the name and
     * the array. The arguments are inline; the recursion is the token behind them
     * (`REF("value-single")`), which counts against Θ.depthBound one level per level of call
     * nesting, so a call nested sixty-four deep is the ordinary `ok:false` naming `nesting <= 64`. The constructor holds the incumbent's three name
     * rules — `sibling-index()`/`sibling-count()` take nothing, `--*`/`scroll()`/`view()` may take
     * nothing, every other function takes at least one — as a labelled zero-width guard over the
     * row's OWN name lists (`R_ctor.value-call.zeroArg` / `.emptyOk`), never as an `if` here.
     */
    const callArgs = () => separated("value-args", "comma", slashGroup, commaSep);
    const call = () =>
        CTOR("value-call", SEQ(callName(), TOK("("), CUT(), WS(), ALT(callArgs(), PURE(null)), WS(), TOK(")"), NOT_TOKEN()));

    /* ── one token ───────────────────────────────────────────────────────────────────────── */

    /** ONE value token: the incumbent's `parseValueInternal` tail (call) and `parseScalarInternal`. */
    const single = () => ALT(...colorArms(), call(), number(), string(), operator(), ident());
    /** ONE scalar token: `parseScalarInternal` alone — no call, no list (`parseCssScalar`). */
    const scalar = () => ALT(...colorArms(), number(), string(), operator(), ident());

    /* ── the three entries ───────────────────────────────────────────────────────────────── */

    /* ── X.P.W3.j — the DECLARATION's body: the same token language, bounded at a top-level `;` ──
     *
     * `parseCssValue("a;b")` ACCEPTS at the incumbent (measured against the pinned 4.0.0 oracle),
     * which is why `;` is one of this grammar's operator tokens. Inside a STYLESHEET it never
     * arrives: `parseDeclarations` reads `splitTopLevel(body, ";")` FIRST, so a `;` at paren depth
     * zero has already cut the part before `parseCssValue` sees it — `a{c:1;d:2}` is two
     * declarations there, and `a{c:url(a;b)}` is one, because the splitter counts parens.
     *
     * The bound is therefore a guard on the TOP-LEVEL item and nowhere else: one zero-width
     * assertion (`SCAN("semi", 0, 0)` — "no semicolon here", the `.g` idiom) in front of the SAME
     * `REF("value-single")` every other item position reads. There is no second token language and
     * no second spelling of a value — a call's arguments go through the UNGUARDED group, which is
     * exactly the splitter's paren rule, and every arm, every constructor and every label below is
     * the one this grammar already had.
     */
    const NOT_SEMI = () => DROP("keyword", SCAN("semi", 0, 0));
    const declSingle = () => SEQ(NOT_SEMI(), REF("value-single"));
    const declSpaceGroup = () =>
        CTOR("value-group", REP(WS(), 0, INF, null), declSingle(), REP(SEQ(WS(), declSingle()), 0, INF, null), PURE(SEPARATORS.indexOf("space")));
    const declSlashGroup = () => separated("value-group", "slash", declSpaceGroup, slashSep);
    const declBody = () => separated("value-group", "comma", declSlashGroup, commaSep);

    /* ── X.P.W3.l — an ANIMATION declaration's body: the same comma list, a blank part REFUSED ──
     *
     * `parseDeclarations` (`stylesheet.ts`) runs `emptyComma(source)` BEFORE `parseCssValue` on a
     * declaration named `animation` or `animation-*`: a blank part between two top-level commas, or
     * before the first, or after the last, is `animation_option_invalid` — `x: a,,b` is a two-item
     * list and `animation-name: a,,b` is a rejection. The comma group above DROPS its blank parts
     * (`groupItems`, the incumbent's `splitTopLevel` reading), so once the value is built the blank
     * is gone; the law has to hold at the byte, in the grammar, and this is the body that holds it.
     *
     * The blank assertion is written FIRST at every item position and as the `.g` zero-width idiom
     * over `decl-item-char` — the run is empty exactly when the next byte is `,` `;` `}` `!` or the
     * end, i.e. exactly when `emptyComma` would find nothing but whitespace before the next
     * top-level comma or the end of the (`!important`-stripped) source — followed by OP-15 `FAIL`,
     * which is `.i`'s own `optionItem` order and is load-bearing for the same reason it was there:
     * §5.6 keeps the FIRST code raised at an offset, so the eighth frozen code is the code AT the
     * blank byte and the token arm's later refusal only adds its label. Leading separators are the
     * empty `REP` (a blank first part is refused by the first item's own assertion), and every
     * non-blank part is `declaration-body`'s own slash group, one token language.
     */
    const NOT_ITEM = () => DROP("keyword", SCAN("decl-item-char", 0, 0));
    const blankItem = () => SEQ(NOT_ITEM(), FAIL("animation_option_invalid", "nonempty animation list item"));
    const animationItem = () => ALT(blankItem(), declSlashGroup());
    const animationDeclBody = () =>
        CTOR(
            "value-group",
            REP(commaSep(), 0, 0, null),
            animationItem(),
            REP(SEQ(commaSep(), animationItem()), 0, INF, null),
            PURE(SEPARATORS.indexOf("comma")),
        );

    const value = () => SEQ(WS(), EXPECT(REF("value-body"), "<value>"), WS(), END());
    /** `parseCssValues`: the same body, a lone token wrapped as a one-item space list (`value-wrap`). */
    const values = () => SEQ(WS(), EXPECT(CTOR("value-wrap", REF("value-body")), "<value-list>"), WS(), END());
    const scalarEntry = () => SEQ(WS(), EXPECT(scalar(), "<scalar>"), WS(), END());

    return {
        entries: { "P:scalar": "scalar", "P:value": "value", "P:values": "values" },
        terms: {
            scalar: scalarEntry(),
            value: value(),
            values: values(),
            /** The two `REF` targets: the body every entry reads, the token every item is. */
            "value-body": commaGroup(),
            "value-single": single(),
            /** X.P.W3.j's third: the same body with a top-level `;` refused (the splitter's cut). */
            "declaration-body": declBody(),
            /** X.P.W3.l's fourth: the same body, a blank comma part refused by name (`emptyComma`). */
            "animation-declaration-body": animationDeclBody(),
        },
    };
}

/** The value grammar's `REF` targets, beside the slice's one (`grammar.mjs` REF_TARGETS). */
export const VALUE_REF_TARGETS = Object.freeze(["value-body", "value-single", "declaration-body", "animation-declaration-body"]);
