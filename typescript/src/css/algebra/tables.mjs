// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · THE REGISTRIES (`ALGEBRA.md` §4.4), as DATA.
//
// One source for both lowerings: the JS lowering reads these objects, the Wasm lowering emits the
// same bytes into its data segment from the same objects. A registry that existed twice is the v12
// shape at one remove, so it exists once and both targets are functions of it.
//
// TARGET-INDEPENDENT: no row mentions a target, and this file imports neither lowering.

/* ── R_cls: byte classes, each a 256-entry table (§4.4, eight classes) ─────────────────────── */

const table256 = (pred) => {
    const t = new Uint8Array(256);
    for (let b = 0; b < 256; b++) t[b] = pred(b) ? 1 : 0;
    return t;
};
const ch = (s) => s.charCodeAt(0);
const isWs = (b) => b === 0x20 || b === 0x09 || b === 0x0a || b === 0x0d || b === 0x0c;
const isDigit = (b) => b >= 0x30 && b <= 0x39;
const isHex = (b) => isDigit(b) || (b >= 0x41 && b <= 0x46) || (b >= 0x61 && b <= 0x66);
const isAlpha = (b) => (b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a);
const isIdent = (b) => isAlpha(b) || isDigit(b) || b === ch("_") || b === ch("-");

/**
 * `any-but-*` admit every byte outside their exclusion set, INCLUDING the non-ASCII marker 0xFF the
 * Wasm boundary writes for a non-ASCII code unit (§5.1: "non-ASCII bytes belong to no class but
 * any-but-*"). The JS lowering tests the code unit, the Wasm lowering the byte; both agree because
 * the excluded bytes are all ASCII.
 */
export const R_cls = {
    ws: { label: "whitespace", table: table256(isWs) },
    ident: { label: "ident", table: table256(isIdent) },
    digit: { label: "<digit>", table: table256(isDigit) },
    hexdigit: { label: "<hex-digit>", table: table256(isHex) },
    "any-but-paren": { label: "any-but-paren", table: table256((b) => b !== ch("(") && b !== ch(")")) },
    "any-but-brace-or-semi": {
        label: "any-but-brace-or-semi",
        table: table256((b) => b !== ch("{") && b !== ch("}") && b !== ch(";")),
    },
    "any-but-semi-or-close": {
        label: "any-but-semi-or-close",
        table: table256((b) => b !== ch(";") && b !== ch("}")),
    },
    "any-but-brace-close": { label: "any-but-brace-close", table: table256((b) => b !== ch("}")) },
    // X.P.W3.g — the code points that START an ident sequence (css-syntax-3 §4.3.9, "Check if three
    // code points would start an ident sequence": an ident-start code point — a letter, U+005F, or
    // a non-ASCII code point — begins one). `ident` above is the CONTINUATION class: it admits
    // digits and U+002D, which may stand INSIDE a unit but can never begin one. The distinction is
    // the whole of §4.3.3's width decision, so the two classes must not be conflated: `rgb(1-2 3)`
    // is two numbers (§4.3.9 returns false for `-` followed by a digit) while `rgb(255none none)`
    // is one <dimension-token>. The label is `ident`'s OWN — `collectLabels` dedupes, so `L` does
    // not move (K-10: no Wasm DLAB index changes) and `diagnostics.mjs` already promotes it to
    // `<ident>` without a new row.
    "ident-start": { label: "ident", table: table256((b) => isAlpha(b) || b === ch("_") || b === 0xff) },
    // X.P.W3.h — the value grammar's classes (`algebra/grammar/value.mjs`). Each row is tagged
    // `since` so `collectLabels` appends its NEW label at the END of L (K-10: no existing index
    // moves; the Wasm DLAB indices are compile-time). A row whose label already exists dedupes.
    //
    //   token-char     every byte the incumbent's splitters keep INSIDE a token — all but the five
    //                  whitespace code points, `,`, `/`, `:`, `;` and `)`. Read ONLY zero-width
    //                  (`SCAN(…, 0, 0)`: "the token ends here"), so its label names the boundary.
    //   leading-digit  a digit — read zero-width before an ident or a function name (`[-_a-z]` first).
    //   unit-char      the incumbent's unit class `[%a-z-]` (case-insensitive) after a number.
    //   op-char        the bytes the ten `KW`-read operators are spelled from (`+*-<>=!`).
    //   dquote/squote  the two quote characters; dq-plain/sq-plain the bytes a string's interior
    //                  admits outside an escape (everything but that quote and `\`, 0xFF included).
    //  X.P.W3.j widens the exclusion set by the two BRACES. The incumbent never hands a value
    //  containing one: `parseCssValue`'s source is a part `splitTopLevel(body, ";")` cut out of a
    //  body `blocks()` already cut at the MATCHING brace, so a top-level `{` or `}` cannot stand
    //  in it. Under the old set `}` was a token-char, so `NOT_TOKEN` refused `red` in
    //  `a{color:red}` — the value token ran into the block's own closing brace. Widening moves no
    //  verdict of `P:value` / `P:values` / `P:scalar`: a brace left over after the token still
    //  meets those entries' `END` and still rejects (measured on both lowerings by the fixture's
    //  `brace-edge` family); it moves only WHERE the token ends, which is the whole point.
    "token-char": {
        label: "token boundary",
        table: table256(
            (b) =>
                !isWs(b) && b !== ch(",") && b !== ch("/") && b !== ch(":") && b !== ch(";") && b !== ch(")")
                && b !== ch("{") && b !== ch("}"),
        ),
        since: "X.P.W3.h",
    },
    "leading-digit": { label: "ident start", table: table256(isDigit), since: "X.P.W3.h" },
    "unit-char": { label: "<unit>", table: table256((b) => isAlpha(b) || b === ch("%") || b === ch("-")), since: "X.P.W3.h" },
    "op-char": { label: "<operator>", table: table256((b) => "+*-<>=!".includes(String.fromCharCode(b))), since: "X.P.W3.h" },
    dquote: { label: "double quote", table: table256((b) => b === ch('"')), since: "X.P.W3.h" },
    squote: { label: "single quote", table: table256((b) => b === ch("'")), since: "X.P.W3.h" },
    "dq-plain": { label: "string text", table: table256((b) => b !== ch('"') && b !== ch("\\")), since: "X.P.W3.h" },
    "sq-plain": { label: "string text", table: table256((b) => b !== ch("'") && b !== ch("\\")), since: "X.P.W3.h" },
    // X.P.W3.i — the animation family's classes (`algebra/grammar/animation.mjs`). Each is read by
    // `TEXT` (so its bytes stay in the value and the incumbent's RAW token text is reconstructible)
    // or by a `DROP`ped `SCAN` (a separator run). The four single-byte classes exist because the
    // incumbent's `LENGTH_PERCENTAGE` keeps the token's TEXT, not its number — `/^auto$|^[+-]?(?:\d+
    // \.?\d*|\.\d+)(?:%|[a-z]+)?$/i` — so `841fEd` must come back as `841fEd`, which an OP-03 `NUM`
    // (a value, and one that also admits an exponent the regex does not) cannot give.
    //
    //   sign / dot / percent  read by `TEXT(cls, 1, 1)`: EXACTLY ONE, because `TEXT` takes a MAXIMAL
    //                         run and `++5` / `1..5` / `5%%` are nothing to the regex either.
    //   letter                the regex's `[a-z]+` under `/i` — ASCII letters, no digit, no `-`.
    //   comma-gap             the separator run inside `scroll()` / `view()` and between the two
    //                         parts of an `animation-range`: the incumbent replaces `,` with a space
    //                         and splits on whitespace, dropping empty parts, so a run of whitespace
    //                         and commas is ONE separator wherever it stands.
    //   any-but-comma         one item of an animation declaration's comma list (`emptyComma`).
    sign: { label: "<sign>", table: table256((b) => b === ch("+") || b === ch("-")), since: "X.P.W3.i" },
    dot: { label: "<decimal-point>", table: table256((b) => b === ch(".")), since: "X.P.W3.i" },
    percent: { label: "<percent-unit>", table: table256((b) => b === ch("%")), since: "X.P.W3.i" },
    letter: { label: "<unit-letters>", table: table256(isAlpha), since: "X.P.W3.i" },
    "comma-gap": { label: "<comma-or-whitespace>", table: table256((b) => isWs(b) || b === ch(",")), since: "X.P.W3.i" },
    "any-but-comma": { label: "<animation-item-text>", table: table256((b) => b !== ch(",")), since: "X.P.W3.i" },
    // X.P.W3.j — the stylesheet family's classes (`algebra/grammar/stylesheet.mjs`). Each mirrors
    // one byte-level decision `stylesheet.ts` makes with a regex or an `indexOf`:
    //
    //   ws-or-semi   `while (/\s|;/.test(source[cursor])) cursor++` — `blocks()`'s leading trivia,
    //                and, at J-5, the whole separator between two declarations (`splitTopLevel(body,
    //                ";")` drops empty parts, so a run of any length is one separator).
    //   prelude-char `blocks()` breaks only on a top-level `{` or `;`; a `}` is ordinary prelude
    //                text (J-3). The slice's `any-but-brace-or-semi` excluded `}` and is kept —
    //                removing a row would move every label index after it (K-10).
    //   decl-name    `row.slice(0, row.indexOf(":"))` — every byte before the first colon (J-2).
    //                `;` bounds the part, `{`/`}` bound the block, and the constructor trims.
    //   any-but-star / slash — `source.indexOf("*/", cursor + 2)`, as a production (J-4). `slash`
    //                is read ZERO-WIDTH only (`SCAN("slash", 0, 0)`: "no slash here"), and its
    //                label is the existing `'/'`, which `collectLabels` dedupes — no index moves.
    "ws-or-semi": { label: "<whitespace-or-semicolon>", table: table256((b) => isWs(b) || b === ch(";")), since: "X.P.W3.j" },
    "prelude-char": { label: "rule-prelude", table: table256((b) => b !== ch("{") && b !== ch(";")), since: "X.P.W3.j" },
    "decl-name": {
        label: "declaration-name",
        table: table256((b) => b !== ch(":") && b !== ch(";") && b !== ch("{") && b !== ch("}")),
        since: "X.P.W3.j",
    },
    "any-but-star": { label: "comment-text", table: table256((b) => b !== ch("*")), since: "X.P.W3.j" },
    slash: { label: "'/'", table: table256((b) => b === ch("/")), since: "X.P.W3.j" },
    //   semi — `splitTopLevel(body, ";")`'s cut, as a zero-width assertion in front of a
    //          DECLARATION's top-level value token (`grammar/value.mjs` `declaration-body`). Its
    //          label is the existing `';'`, which `collectLabels` dedupes — no index moves.
    semi: { label: "';'", table: table256((b) => b === ch(";")), since: "X.P.W3.j" },
    // X.P.W3.l — the at-rule and nesting families (`algebra/grammar/stylesheet.mjs`, E-j1). Each
    // mirrors one byte-level decision `stylesheet.ts` `parseItems` / `blocks()` / `parseDeclarations`
    // makes with `startsWith`, `indexOf` or a depth counter:
    //
    //   space          `lower.startsWith("@keyframes ")` — the ONE byte that separates a known
    //                  at-rule's name from its prelude is U+0020, never any other whitespace.
    //   at-rule-text   `blocks()`'s brace-depth scan over an UNKNOWN at-rule's body: every byte but
    //                  the two braces is body text (the incumbent keeps that body as raw text).
    //   lbrace/rbrace  read `TEXT(cls, 1, 1)` — ONE brace when it stands alone — so a block's span
    //                  is exact; a run of braces falls to the dropped `LIT`, which is exact-width.
    //                  Their labels are the existing `'{'` / `'}'`, deduped — no index moves.
    //   any-but-semi   read ZERO-WIDTH only ("';' or the end of input is next"): `@starting-style`
    //                  with no body is `failure(…, "nested body")` there, never an unknown at-rule.
    //   decl-item-char read ZERO-WIDTH only: the byte AFTER a top-level comma in an animation
    //                  declaration is one of `,` `;` `}` `!` (or the end) exactly when `emptyComma`
    //                  would find a blank part — the assertion that names the eighth code there.
    space: { label: "<space>", table: table256((b) => b === 0x20), since: "X.P.W3.l" },
    "at-rule-text": { label: "at-rule body text", table: table256((b) => b !== ch("{") && b !== ch("}")), since: "X.P.W3.l" },
    lbrace: { label: "'{'", table: table256((b) => b === ch("{")), since: "X.P.W3.l" },
    rbrace: { label: "'}'", table: table256((b) => b === ch("}")), since: "X.P.W3.l" },
    "any-but-semi": { label: "at-rule end", table: table256((b) => b !== ch(";")), since: "X.P.W3.l" },
    "decl-item-char": {
        label: "animation list item",
        table: table256((b) => b !== ch(",") && b !== ch(";") && b !== ch("}") && b !== ch("!")),
        since: "X.P.W3.l",
    },
};

/**
 * X.P.W3.h — every keyword and dispatch table is NULL-PROTOTYPE. Measured before this landed (the
 * `.h` receipt, INFO-h5): `kw.rows[key]` / `disp.rows[key]` over a plain object literal reached
 * `Object.prototype` — `parseCssColor("constructor")` answered `ok` with three `null` channels in the
 * JS lowering and `css_syntax` in Wasm (a G-5 divergence), and `parseTimingFunction("constructor")`
 * THREW on the raw JS path (`SHIELD.caught` 2). A table whose misses are unreachable by construction
 * is `codes.mjs`'s own discipline for `selectCode`, applied here to every row.
 */
const np = (rows) => Object.assign(Object.create(null), rows);

/* ── R_kw: keyword → value (§4.4, seven tables) ────────────────────────────────────────────── */

/**
 * The 148 named colours, transcribed from `value.js/src/css/named-colors.ts` (the frozen surface's
 * own table, read-only) as `name:rrggbb`. The hex is expanded to the three channels at load, once,
 * by the same arithmetic in both lowerings.
 */
const NAMED_SRC = [
    "aliceblue:f0f8ff antiquewhite:faebd7 aqua:00ffff aquamarine:7fffd4 azure:f0ffff beige:f5f5dc",
    "bisque:ffe4c4 black:000000 blanchedalmond:ffebcd blue:0000ff blueviolet:8a2be2 brown:a52a2a",
    "burlywood:deb887 cadetblue:5f9ea0 chartreuse:7fff00 chocolate:d2691e coral:ff7f50",
    "cornflowerblue:6495ed cornsilk:fff8dc crimson:dc143c cyan:00ffff darkblue:00008b",
    "darkcyan:008b8b darkgoldenrod:b8860b darkgray:a9a9a9 darkgreen:006400 darkgrey:a9a9a9",
    "darkkhaki:bdb76b darkmagenta:8b008b darkolivegreen:556b2f darkorange:ff8c00",
    "darkorchid:9932cc darkred:8b0000 darksalmon:e9967a darkseagreen:8fbc8f darkslateblue:483d8b",
    "darkslategray:2f4f4f darkslategrey:2f4f4f darkturquoise:00ced1 darkviolet:9400d3",
    "deeppink:ff1493 deepskyblue:00bfff dimgray:696969 dimgrey:696969 dodgerblue:1e90ff",
    "firebrick:b22222 floralwhite:fffaf0 forestgreen:228b22 fuchsia:ff00ff gainsboro:dcdcdc",
    "ghostwhite:f8f8ff gold:ffd700 goldenrod:daa520 gray:808080 green:008000 greenyellow:adff2f",
    "grey:808080 honeydew:f0fff0 hotpink:ff69b4 indianred:cd5c5c indigo:4b0082 ivory:fffff0",
    "khaki:f0e68c lavender:e6e6fa lavenderblush:fff0f5 lawngreen:7cfc00 lemonchiffon:fffacd",
    "lightblue:add8e6 lightcoral:f08080 lightcyan:e0ffff lightgoldenrodyellow:fafad2",
    "lightgray:d3d3d3 lightgreen:90ee90 lightgrey:d3d3d3 lightpink:ffb6c1 lightsalmon:ffa07a",
    "lightseagreen:20b2aa lightskyblue:87cefa lightslategray:778899 lightslategrey:778899",
    "lightsteelblue:b0c4de lightyellow:ffffe0 lime:00ff00 limegreen:32cd32 linen:faf0e6",
    "magenta:ff00ff maroon:800000 mediumaquamarine:66cdaa mediumblue:0000cd mediumorchid:ba55d3",
    "mediumpurple:9370db mediumseagreen:3cb371 mediumslateblue:7b68ee mediumspringgreen:00fa9a",
    "mediumturquoise:48d1cc mediumvioletred:c71585 midnightblue:191970 mintcream:f5fffa",
    "mistyrose:ffe4e1 moccasin:ffe4b5 navajowhite:ffdead navy:000080 oldlace:fdf5e6 olive:808000",
    "olivedrab:6b8e23 orange:ffa500 orangered:ff4500 orchid:da70d6 palegoldenrod:eee8aa",
    "palegreen:98fb98 paleturquoise:afeeee palevioletred:db7093 papayawhip:ffefd5",
    "peachpuff:ffdab9 peru:cd853f pink:ffc0cb plum:dda0dd powderblue:b0e0e6 purple:800080",
    "rebeccapurple:663399 red:ff0000 rosybrown:bc8f8f royalblue:4169e1 saddlebrown:8b4513",
    "salmon:fa8072 sandybrown:f4a460 seagreen:2e8b57 seashell:fff5ee sienna:a0522d silver:c0c0c0",
    "skyblue:87ceeb slateblue:6a5acd slategray:708090 slategrey:708090 snow:fffafa",
    "springgreen:00ff7f steelblue:4682b4 tan:d2b48c teal:008080 thistle:d8bfd8 tomato:ff6347",
    "turquoise:40e0d0 violet:ee82ee wheat:f5deb3 white:ffffff whitesmoke:f5f5f5 yellow:ffff00",
    "yellowgreen:9acd32",
].join(" ");

/** The 20 context-colour spellings, `grammar.ts:160`'s own alternation, in its order. */
const CONTEXT_SPELLINGS = [
    "currentcolor", "accentcolor", "accentcolortext", "activetext", "buttonborder", "buttonface",
    "buttontext", "canvas", "canvastext", "field", "fieldtext", "graytext", "highlight",
    "highlighttext", "linktext", "mark", "marktext", "selecteditem", "selecteditemtext",
    "visitedtext",
];

const namedRows = () => {
    const rows = Object.create(null);
    for (const entry of NAMED_SRC.split(" ")) {
        const [name, hex] = entry.split(":");
        rows[name] = [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16),
        ];
    }
    return rows;
};

const contextRows = () => {
    const rows = Object.create(null);
    for (const spelling of CONTEXT_SPELLINGS) rows[spelling] = 0; //  the token `context`, one value
    return rows;
};

export const R_kw = {
    "named-color": { label: "<named-color>", code: "css_syntax", kind: "rgb3", rows: namedRows() },
    transparent: { label: "'transparent'", code: "css_syntax", kind: "rgba4", rows: np({ transparent: [0, 0, 0, 0] }) },
    "context-color": { label: "<context-color>", code: "css_syntax", kind: "token", rows: contextRows() },
    none: { label: "'none'", code: "css_syntax", kind: "none", rows: np({ none: 0 }) },
    "timing-keyword": {
        label: "<timing-keyword>",
        code: "css_syntax",
        kind: "token",
        rows: np({ linear: 0, ease: 1, "ease-in": 2, "ease-out": 3, "ease-in-out": 4 }),
    },
    "step-alias": { label: "<step-alias>", code: "css_syntax", kind: "token", rows: np({ "step-start": 0, "step-end": 1 }) },
    "jump-position": {
        label: "<jump-position>",
        code: "css_syntax",
        kind: "token",
        // six spellings -> four values (`grammar.ts:457-460`): start/end alias jump-start/jump-end
        rows: np({ "jump-start": 0, "jump-end": 1, "jump-none": 2, "jump-both": 3, start: 0, end: 1 }),
    },
    // X.P.W3.h — the ten operator spellings `KW` reads over the `op-char` class, numbered by their
    // index in `grammar/value.mjs` OPERATORS (the `value-operator` constructor's codomain); `:` and
    // `;` are OPERATORS[10..11], read by `LIT` because the incumbent's splitter cuts them out alone.
    operator: {
        label: "<operator>",
        code: "css_syntax",
        kind: "token",
        rows: np({ "+": 0, "*": 1, "-": 2, "<=": 3, ">=": 4, "==": 5, "!=": 6, "<": 7, ">": 8, "=": 9 }),
        since: "X.P.W3.h",
    },
    // ── X.P.W3.i — the animation family's keyword tables. Every row's value is an INDEX into one of
    //    the canonical name lists below, so the constructor answers the incumbent's own spelling
    //    (always the LOWER-CASE canonical one: `parseKeyframeSelector` writes `name.toLowerCase()`,
    //    `rangeBoundary` writes `tokens[0].toLowerCase()`, `parseAnimationTimeline` writes the
    //    folded token) rather than the authored one, and the ASCII fold is `KW`'s own.
    "keyframe-word": { label: "<keyframe-keyword>", code: "keyframe_selector_invalid", kind: "token", rows: np({ from: 0, to: 1 }), since: "X.P.W3.i" },
    "keyframe-phase": { label: "<keyframe-phase>", code: "keyframe_selector_invalid", kind: "token", rows: np({ entry: 0, exit: 1, cover: 2, contain: 3 }), since: "X.P.W3.i" },
    "range-phase": {
        label: "<range-phase>",
        code: "timeline_option_invalid",
        kind: "token",
        rows: np({ normal: 0, cover: 1, contain: 2, entry: 3, exit: 4, "entry-crossing": 5, "exit-crossing": 6 }),
        since: "X.P.W3.i",
    },
    "timeline-mode": { label: "<timeline-keyword>", code: "timeline_option_invalid", kind: "token", rows: np({ auto: 0, none: 1 }), since: "X.P.W3.i" },
    //  ONE table for `scroll()`'s two vocabularies: 0..2 are the scrollers, 3..6 the axes. The
    //  incumbent tests `SCROLLERS.has` first and `AXES.has` second over DISJOINT sets, so the split
    //  is an index comparison in the constructor and never a second lookup.
    "scroll-arg": {
        label: "<scroll-argument>",
        code: "timeline_option_invalid",
        kind: "token",
        rows: np({ nearest: 0, root: 1, self: 2, block: 3, inline: 4, x: 5, y: 6 }),
        since: "X.P.W3.i",
    },
    "view-axis": { label: "<timeline-axis>", code: "timeline_option_invalid", kind: "token", rows: np({ block: 0, inline: 1, x: 2, y: 3 }), since: "X.P.W3.i" },
    // X.P.W3.l — the four at-rules whose body is a DECLARATION LIST (`parseItems`: `@property ` ·
    // `@function ` · `@scroll-timeline ` · `@view-timeline `, each matched on the folded prelude
    // and each followed by ONE space). `KW` reads the maximal ident run, so `@property-x` is an
    // unknown at-rule here exactly as `"@property-x".startsWith("@property ")` is false there. The
    // value indexes `AT_DECLARATION_KINDS`, which is the frozen `StylesheetItem.kind` the
    // constructor answers. `@keyframes` (a rule list), `@scope` (a PREFIX match) and
    // `@starting-style` (an EXACT match) are read by `LIT` in the grammar, never by this table.
    "at-rule-name": {
        label: "<at-rule-name>",
        code: "css_syntax",
        kind: "token",
        rows: np({ property: 0, function: 1, "scroll-timeline": 2, "view-timeline": 3 }),
        since: "X.P.W3.l",
    },
};

/** X.P.W3.l — the frozen `StylesheetItem.kind` of each `R_kw["at-rule-name"]` row, by id. */
export const AT_DECLARATION_KINDS = ["property", "function", "scroll-timeline", "view-timeline"];

/* ── X.P.W3.i — the canonical spellings the animation constructors answer, by index ─────────── */

/** `KeyframeSelector` `{kind:"percent"}`'s two keyword spellings: `from` → 0, `to` → 1. */
export const KEYFRAME_PHASES = ["entry", "exit", "cover", "contain"];
/** `RangePhase`, in `R_kw["range-phase"]`'s row order (`timeline.ts` RANGE_PHASES). */
export const RANGE_PHASES = ["normal", "cover", "contain", "entry", "exit", "entry-crossing", "exit-crossing"];
/** `AnimationTimelineValue`'s two keyword kinds. */
export const TIMELINE_MODES = ["auto", "none"];
/** `ScrollerKeyword`, the first three rows of `R_kw["scroll-arg"]`. */
export const SCROLLER_KEYWORDS = ["nearest", "root", "self"];
/** `TimelineAxis`, rows 3..6 of `R_kw["scroll-arg"]` and all four of `R_kw["view-axis"]`. */
export const TIMELINE_AXES = ["block", "inline", "x", "y"];

/** The four `JumpPosition` values, by id — the codomain of `R_kw.jump-position`. */
export const JUMP_POSITIONS = ["jump-start", "jump-end", "jump-none", "jump-both"];
/** The five `keyword` timing-function names, by id. */
export const TIMING_KEYWORDS = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"];
/** `step-start`/`step-end` expand to `steps(1, …)` (measured at the incumbent). */
export const STEP_ALIASES = [
    { count: 1, position: 0 },
    { count: 1, position: 1 },
];

/* ── R_disp: key → term NAME (§4.4, two tables) ────────────────────────────────────────────── */
//
// The rows hold the NAME of the production each key dispatches to; the grammar map resolves it.
// A name rather than a nested term because a term reached only through a registry is a term the
// structural walk cannot see, and because both lowerings then compile exactly one copy.

/**
 * The ten colour heads of css-color-4 the incumbent's `parseFunctionalColor` names, each to its
 * production. X.P.W3.h widened the slice's three (`rgb`/`hsl`/`oklch`) to the whole family so
 * `parseCssColor` is TOTAL over every ORACLE head (COHESION §0s E-h1: the 84 unrealized-head cells —
 * lab 55 · color() 26 · hwb/lch/oklab 1 each).
 */
const COLOR_HEADS = {
    rgb: "head-rgb",
    rgba: "head-rgb",
    hsl: "head-hsl",
    hsla: "head-hsl",
    hwb: "head-hwb",
    lab: "head-lab",
    lch: "head-lch",
    oklab: "head-oklab",
    oklch: "head-oklch",
    color: "head-color",
};

export const R_disp = {
    "color-head": {
        label: "<color-function>",
        code: "css_syntax",
        rows: np({ ...COLOR_HEADS, var: "head-var" }),
    },
    "timing-head": {
        label: "<timing-function>",
        code: "css_syntax",
        rows: np({ "cubic-bezier": "head-cubic-bezier", steps: "head-steps", linear: "head-linear" }),
    },
    // X.P.W3.h — the colour heads as a VALUE sees them: the ten, and NOT `var` — in a value,
    // `var(--x)` is a call (`grammar.ts` parseValueInternal's call arm; `color_context_required` is
    // `parseCssColor`'s verdict alone). The label is `color-head`'s own, so L does not move.
    "value-color-head": {
        label: "<color-function>",
        code: "css_syntax",
        rows: np({ ...COLOR_HEADS }),
        since: "X.P.W3.h",
    },
    // X.P.W3.h — `color()`'s predefined spaces (css-color-4 §10.1), each to the production that
    // reads its three channels: `xyz` and `xyz-d65` are one space in the frozen `CssColorSpace`
    // (both → `xyz`), `xyz-d50` is adapted to D65 by its own constructor, `srgb` is scaled to the
    // frozen `rgb` shape (×255) — all three as the incumbent's `parseFunctionalColor` does it.
    "color-space": {
        label: "<color-space>",
        code: "css_syntax",
        rows: np({
            srgb: "space-srgb",
            "srgb-linear": "space-srgb-linear",
            "display-p3": "space-display-p3",
            "a98-rgb": "space-a98-rgb",
            "prophoto-rgb": "space-prophoto-rgb",
            rec2020: "space-rec2020",
            xyz: "space-xyz",
            "xyz-d65": "space-xyz",
            "xyz-d50": "space-xyz-d50",
        }),
        since: "X.P.W3.h",
    },
    // X.P.W3.i — `animation-timeline`'s two functional forms. The incumbent reaches them by
    // `/^scroll\((.*)\)$/i` and `/^view\((.*)\)$/i`; a table is a registry row, not an `if`, and the
    // ident run `DISPATCH` reads is maximal, so `scrolls(…)` resolves to nothing here exactly as the
    // anchored regex refuses it there.
    "timeline-head": {
        label: "<timeline-function>",
        code: "timeline_option_invalid",
        rows: np({ scroll: "timeline-scroll", view: "timeline-view" }),
        since: "X.P.W3.i",
    },
};

/* ── R_ctor: constructors (§4.4, eighteen rows) ────────────────────────────────────────────── */
//
// `leafMap` names the tuple slots the row consumes, in order; `guards` names the guard labels the
// row may raise. The constructor FUNCTIONS are per-lowering (JS builds an object, Wasm writes an
// arena node) but the ROW — its arity, its leaf map, its code and its labels — is here, once.

export const R_ctor = {
    rgb: { label: "rgb()", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "rgb" },
    hsl: { label: "hsl()", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "hsl" },
    oklch: { label: "oklch()", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "oklch" },
    hex8: { label: "#rrggbbaa", code: "css_syntax", labels: ["<hex-digit>"], arity: 4, leafMap: ["r", "g", "b", "a"], space: "rgb" },
    hex6: { label: "#rrggbb", code: "css_syntax", labels: ["<hex-digit>"], arity: 3, leafMap: ["r", "g", "b"], space: "rgb" },
    hex4: { label: "#rgba", code: "css_syntax", labels: ["<hex-digit>"], arity: 4, leafMap: ["r", "g", "b", "a"], space: "rgb" },
    hex3: { label: "#rgb", code: "css_syntax", labels: ["<hex-digit>"], arity: 3, leafMap: ["r", "g", "b"], space: "rgb" },
    context: { label: "context colour", code: "color_context_required", labels: ["context-free color"], arity: 1, leafMap: ["token"] },
    "named-color": { label: "<named-color>", code: "css_syntax", labels: ["<named-color>"], arity: 1, leafMap: ["rgb3"], space: "rgb" },
    transparent: { label: "'transparent'", code: "css_syntax", labels: ["'transparent'"], arity: 1, leafMap: ["rgba4"], space: "rgb" },
    "timing-keyword": { label: "<timing-keyword>", code: "css_syntax", labels: ["<timing-keyword>"], arity: 1, leafMap: ["name"] },
    "step-alias": { label: "<step-alias>", code: "css_syntax", labels: ["<step-alias>"], arity: 1, leafMap: ["alias"] },
    "cubic-bezier": { label: "cubic-bezier()", code: "css_syntax", labels: ["x1 in [0,1]", "x2 in [0,1]"], arity: 4, leafMap: ["x1", "y1", "x2", "y2"] },
    steps: { label: "steps()", code: "css_syntax", labels: ["<integer> >= 1", "jump-none needs >= 2"], arity: 2, leafMap: ["count", "position"] },
    "linear-function": { label: "linear()", code: "css_syntax", labels: ["<linear-stop-list>"], arity: 1, leafMap: ["stops"] },
    "linear-stop": { label: "<linear-stop>", code: "css_syntax", labels: ["<linear-stop>"], arity: 2, leafMap: ["output", "input"] },
    "style-rule": { label: "<qualified-rule>", code: "css_syntax", labels: ["<qualified-rule>"], arity: 2, leafMap: ["prelude", "declarations"] }, // X.P.W3.l: the prelude leaf is OPTIONAL (`{ … }` is a rule with no selector there)
    declaration: { label: "<declaration>", code: "css_syntax", labels: ["<declaration>"], arity: 3, leafMap: ["name", "value", "important"] },
    "value-color": { label: "<colour value>", code: "css_syntax", labels: ["<color>"], arity: 1, leafMap: ["color"] },
    stylesheet: { label: "<stylesheet>", code: "css_syntax", labels: ["<stylesheet>"], arity: 1, leafMap: ["items"] },

    // ── X.P.W3.h — the CTOR family this unit lands as ONE commit across the four realizations
    //    (COHESION §0s E-h1): the row here, the JS function in `lowering-js/js-alg.mjs` CTORS, the
    //    Wasm emitter in `lowering-wasm/wasm-alg.mjs` emitCtors, and the node table in `bounds.mjs`
    //    CTOR_ALLOC / CTOR_SCRATCH_CELLS. `bounds.mjs` HALTs at load unless the four name-sets agree.
    //
    //    The seven remaining colour heads and `color()`'s spaces: `{space, channels, alpha}` over
    //    finite channels, exactly the three-row `rgb`/`hsl`/`oklch` shape.
    hwb: { label: "hwb()", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "hwb", since: "X.P.W3.h" },
    lab: { label: "lab()", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "lab", since: "X.P.W3.h" },
    lch: { label: "lch()", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "lch", since: "X.P.W3.h" },
    oklab: { label: "oklab()", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "oklab", since: "X.P.W3.h" },
    xyz: { label: "color(xyz)", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "xyz", since: "X.P.W3.h" },
    "srgb-linear": { label: "color(srgb-linear)", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "srgb-linear", since: "X.P.W3.h" },
    "display-p3": { label: "color(display-p3)", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "display-p3", since: "X.P.W3.h" },
    "a98-rgb": { label: "color(a98-rgb)", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "a98-rgb", since: "X.P.W3.h" },
    "prophoto-rgb": { label: "color(prophoto-rgb)", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "prophoto-rgb", since: "X.P.W3.h" },
    rec2020: { label: "color(rec2020)", code: "css_syntax", labels: ["<finite-number>"], arity: 4, leafMap: ["c1", "c2", "c3", "alpha"], space: "rec2020", since: "X.P.W3.h" },
    //    `color(xyz-d50 …)`: the frozen `CssColorSpace` has no `xyz-d50`, so the incumbent adapts the
    //    three channels to D65 (`src/color/anchors.ts` adaptXyzD50ToD65, the Bradford matrix below,
    //    `m[0]*x + m[1]*y + m[2]*z` per row) and answers `xyz`. `none` cannot be adapted: the
    //    incumbent rejects it ("concrete xyz-d50"), and so does this row's guard. The channels and
    //    the adapted results must all be finite (the incumbent's `xyz()` factory checks the results).
    "xyz-d50": {
        label: "color(xyz-d50)",
        code: "css_syntax",
        labels: ["<finite-number>", "concrete xyz-d50"],
        arity: 4,
        leafMap: ["c1", "c2", "c3", "alpha"],
        space: "xyz",
        matrix: Object.freeze([
            0.95547342148807501, -0.023098454948764641, 0.063259243200570692,
            -0.028369709333863888, 1.0099953980813041, 0.021041441191917334,
            0.012314014864481979, -0.020507649298898967, 1.3303659262421239,
        ]),
        since: "X.P.W3.h",
    },
    //    The value shapes (`grammar/value.mjs`). `value-number` takes ONE leaf (a bare number) or
    //    TWO (number, unit); `value-string` ONE (an empty string's own two quotes) or THREE (open,
    //    pieces, close); `arity` names the maximum.
    "value-number": { label: "<number-value>", code: "css_syntax", labels: ["<finite-number>"], arity: 2, leafMap: ["value", "unit"], since: "X.P.W3.h" },
    "value-keyword": { label: "<keyword-value>", code: "css_syntax", labels: ["ident"], arity: 1, leafMap: ["text"], since: "X.P.W3.h" },
    "value-operator": { label: "<operator-value>", code: "css_syntax", labels: ["<operator>"], arity: 1, leafMap: ["index"], since: "X.P.W3.h" },
    "value-string": { label: "<string-value>", code: "css_syntax", labels: ["string text"], arity: 3, leafMap: ["open", "pieces", "close"], since: "X.P.W3.h" },
    //    `value-call`'s name rules (`grammar.ts` parseValueInternal): `zeroArg` names take NO
    //    argument; `emptyOk` names and `--*` names MAY take none; every other name takes >= 1. The
    //    `args` leaf is ABSENT for an empty body (one leaf) and the `value-args` array otherwise.
    "value-call": {
        label: "<function-call>",
        code: "css_syntax",
        labels: ["<function-arguments>"],
        arity: 2,
        leafMap: ["name", "args"],
        zeroArg: Object.freeze(["sibling-index", "sibling-count"]),
        emptyOk: Object.freeze(["scroll", "view"]),
        since: "X.P.W3.h",
    },
    //    The two group rows share one shape — `lead` (a list of the leading separators, each a
    //    UNIT), `first`, `rest` (a list of items, a UNIT where a separator was followed by
    //    nothing), `separator` (an index into `grammar/value.mjs` SEPARATORS) — and one guard: a
    //    comma or slash separator before the first item or after the last, with fewer than two
    //    items, is the incumbent's "one part, separators still in the text" failure. `value-args`
    //    answers the BARE ARRAY of items (the `stylesheet` row's precedent: a value that is its
    //    own projection); `value-group` answers `first` itself when it is the only item and the
    //    `{kind:"list", separator, items}` record otherwise; `value-wrap` (`P:values`) answers a
    //    list as it is and any other value as a one-item space list.
    "value-args": { label: "<function-arguments>", code: "css_syntax", labels: ["<value-list>"], arity: 4, leafMap: ["lead", "first", "rest", "separator"], since: "X.P.W3.h" },
    "value-group": { label: "<value-list>", code: "css_syntax", labels: ["<value-list>"], arity: 4, leafMap: ["lead", "first", "rest", "separator"], since: "X.P.W3.h" },
    "value-wrap": { label: "<value-list>", code: "css_syntax", labels: ["<value-list>"], arity: 1, leafMap: ["value"], since: "X.P.W3.h" },

    // ── X.P.W3.i — the ANIMATION family's CTOR rows, landed as ONE commit across the same four
    //    realizations (COHESION §0s E-h1): the row here, `lowering-js/js-alg.mjs` CTORS, the Wasm
    //    emitter `lowering-wasm/wasm-alg.mjs` emitCtors, and the node table `bounds.mjs`
    //    CTOR_ALLOC / CTOR_SCRATCH_CELLS. `bounds.mjs` HALTs at load unless the four agree.
    //
    //    `lp-text` is the incumbent's `LENGTH_PERCENTAGE` token, answered as its OWN SOURCE TEXT:
    //    the leaves are the contiguous `TEXT` pieces of one token (sign · integer · point ·
    //    fraction · unit, one to five of them), the JS constructor re-joins them and the Wasm one
    //    reads the span from the first piece's start to the last piece's end. No number is parsed,
    //    because the frozen `RangeBoundary.offset` and `ViewInset.start` are STRINGS.
    "lp-text": { label: "<length-percentage>", code: "timeline_option_invalid", labels: ["<length-percentage>"], arity: 5, leafMap: ["sign", "int", "point", "frac", "unit"], since: "X.P.W3.i" },
    "lp-auto": { label: "'auto'", code: "timeline_option_invalid", labels: ["'auto'"], arity: 1, leafMap: ["text"], since: "X.P.W3.i" },

    //    `RangeBoundary` has three inhabited shapes and each is its own row, so no constructor
    //    branches on an absent field: `{phase}` · `{phase, offset}` · `{offset}`.
    "range-phase": { label: "<range-boundary>", code: "timeline_option_invalid", labels: ["<animation-range>"], arity: 1, leafMap: ["phase"], since: "X.P.W3.i" },
    "range-phase-offset": { label: "<range-boundary>", code: "timeline_option_invalid", labels: ["<animation-range>"], arity: 2, leafMap: ["phase", "offset"], since: "X.P.W3.i" },
    "range-offset": { label: "<range-boundary>", code: "timeline_option_invalid", labels: ["<animation-range>"], arity: 1, leafMap: ["offset"], since: "X.P.W3.i" },
    "range-single": { label: "<animation-range>", code: "timeline_option_invalid", labels: ["<animation-range>"], arity: 1, leafMap: ["start"], since: "X.P.W3.i" },
    "range-pair": { label: "<animation-range>", code: "timeline_option_invalid", labels: ["<animation-range>"], arity: 2, leafMap: ["start", "end"], since: "X.P.W3.i" },

    //    `KeyframeSelector`. `keyframe-word` carries the keyword's own value (`from` → 0, `to` → 1),
    //    which IS the frozen percent; the other two guard the incumbent's range checks — `value` in
    //    [0,100] before the divide, `offset` in [0,1] after it (`grammar.ts` parseKeyframeSelector).
    "keyframe-word": { label: "<keyframe-selector>", code: "keyframe_selector_invalid", labels: ["<keyframe-selector>"], arity: 1, leafMap: ["value"], since: "X.P.W3.i" },
    "keyframe-percent": { label: "<keyframe-selector>", code: "keyframe_selector_invalid", labels: ["0%..100%"], arity: 1, leafMap: ["value"], since: "X.P.W3.i" },
    "keyframe-named": { label: "<keyframe-selector>", code: "keyframe_selector_invalid", labels: ["0%..100%"], arity: 2, leafMap: ["name", "offset"], since: "X.P.W3.i" },

    //    `AnimationTimelineValue`'s five kinds over four rows (`auto` and `none` share one).
    "timeline-mode": { label: "<animation-timeline>", code: "timeline_option_invalid", labels: ["<timeline-keyword>"], arity: 1, leafMap: ["mode"], since: "X.P.W3.i" },
    "timeline-name": { label: "<animation-timeline>", code: "timeline_option_invalid", labels: ["<dashed-ident>"], arity: 1, leafMap: ["name"], since: "X.P.W3.i" },
    "timeline-scroll": { label: "<animation-timeline>", code: "timeline_option_invalid", labels: ["<scroll-timeline>"], arity: 1, leafMap: ["args"], since: "X.P.W3.i" },
    "timeline-view": { label: "<animation-timeline>", code: "timeline_option_invalid", labels: ["<view-timeline>"], arity: 1, leafMap: ["args"], since: "X.P.W3.i" },

    //    `emptyComma`'s law (`rules.ts` parseDeclarations), in its positive form: an animation
    //    declaration's value is a comma list of NON-BLANK items. The refusal is the GRAMMAR's — a
    //    zero-width assertion and an OP-15 `FAIL` at the blank byte itself (`grammar/animation.mjs`)
    //    — so this row builds and never guards, the `value-color` row's posture: its value is the
    //    bare array of items, the `stylesheet` row's precedent.
    "animation-option": { label: "<animation-option>", code: "animation_option_invalid", labels: ["<animation-option-list>"], arity: 1, leafMap: ["tokens"], since: "X.P.W3.i" },
    "animation-option-list": {
        label: "<animation-option-list>",
        code: "animation_option_invalid",
        labels: ["<animation-option-list>"],
        arity: 2,
        leafMap: ["first", "rest"],
        since: "X.P.W3.i",
    },

    // ── X.P.W3.j — the STYLESHEET family's one CTOR row, landed as ONE commit across the same
    //    four realizations (COHESION §0s E-h1): the row here, `lowering-js/js-alg.mjs` CTORS, the
    //    Wasm emitter `lowering-wasm/wasm-alg.mjs` emitCtors, and the node table `bounds.mjs`
    //    CTOR_ALLOC / CTOR_SCRATCH_CELLS. `bounds.mjs` HALTs at load unless the four agree.
    //
    //    A comment is not an item and not an error: `blocks()` skips it before a block begins
    //    (J-4). Its constructor answers the RECOVERY SENTINEL, which `stylesheet`'s own
    //    constructor already filters out of the item list — so the comment leaves nothing behind
    //    in `V` and nothing in `D`, which is precisely the incumbent's "cursor = end + 2". It
    //    never guards (the `CUT` after `/*` and the closing `LIT` carry the refusal).
    "sheet-comment": { label: "<comment>", code: "css_syntax", labels: ["<comment>"], arity: 1, leafMap: ["text"], since: "X.P.W3.j" },

    // ── X.P.W3.l — the AT-RULE and NESTING families' CTOR rows (E-j1), landed as ONE commit
    //    across the same four realizations (COHESION §0s E-h1): the rows here, `lowering-js/js-alg.mjs`
    //    CTORS, the Wasm emitter `lowering-wasm/wasm-alg.mjs` emitCtors, and the node table
    //    `bounds.mjs` CTOR_ALLOC / CTOR_SCRATCH_CELLS. `bounds.mjs` HALTs at load unless the four agree.
    //
    //    EVERY ROW ANSWERS A RAW ITEM (COHESION §0v: "the grammar answers the RAW item tree … and
    //    `entry.mjs` completes and validates it into the frozen `Stylesheet`"): the leaves are the
    //    SPANS the grammar read and the lists it collected, untrimmed and unfolded, so that the two
    //    lowerings answer byte-identical records (the J-6 posture) and every trim, fold, split,
    //    regex and check-over-a-parsed-value is ONE function on the surface. None of these rows
    //    guards except `animation-property`; a raw record is not a verdict.
    //
    //    `style-rule` keeps `.j`'s declarations-only shape (the incumbent's FIRST reading of a style
    //    body, `parseDeclarations(body)`), now with the prelude OPTIONAL (`{ color: red }` is a rule
    //    with no selector there). `style-rule-mixed` is its SECOND reading (`blocks(body + ";")`):
    //    declarations and nested rules interleaved, in source order, which the surface partitions.
    "style-rule-mixed": { label: "<qualified-rule>", code: "css_syntax", labels: ["<qualified-rule>"], arity: 2, leafMap: ["prelude", "items"], since: "X.P.W3.l" },
    //    `@keyframes NAME { (PRELUDE { declarations })* }` — the name is the prelude text after the
    //    space, untrimmed; each rule's prelude is optional (`{ color: red }` is a rule whose
    //    selector list is EMPTY there: `splitTopLevel("", ",")` is `[]`).
    "at-keyframes": { label: "<keyframes-rule>", code: "css_syntax", labels: ["<keyframes-rule>"], arity: 2, leafMap: ["name", "rules"], since: "X.P.W3.l" },
    "keyframe-rule": { label: "<keyframe-rule>", code: "css_syntax", labels: ["<keyframe-rule>"], arity: 2, leafMap: ["prelude", "declarations"], since: "X.P.W3.l" },
    //    `@property` · `@function` · `@scroll-timeline` · `@view-timeline`: ONE row whose first leaf
    //    is the `R_kw["at-rule-name"]` index, answered as the frozen `kind` through
    //    `AT_DECLARATION_KINDS` (the `timing-keyword` row's own idiom); the prelude text after the
    //    space and the body's declaration list are the other two.
    "at-declarations": { label: "<at-rule-declarations>", code: "css_syntax", labels: ["<at-rule-declarations>"], arity: 3, leafMap: ["kind", "prelude", "declarations"], since: "X.P.W3.l" },
    //    `@scope PRELUDE? { items }` and `@starting-style { items }`: a nested ITEM list (rules and
    //    at-rules, never a bare declaration — `parseItems` refuses a body-less block there).
    "at-scope": { label: "<scope-rule>", code: "css_syntax", labels: ["<scope-rule>"], arity: 2, leafMap: ["prelude", "children"], since: "X.P.W3.l" },
    "at-starting-style": { label: "<starting-style-rule>", code: "css_syntax", labels: ["<starting-style-rule>"], arity: 1, leafMap: ["children"], since: "X.P.W3.l" },
    //    The unknown at-rule, in its two shapes: `@… { body }` and `@… ;`. The prelude leaf is the
    //    whole text after `@` (optional: `@{}` is lawful there), and the block form's body is the
    //    RAW brace-balanced text `blocks()` slices out — the incumbent keeps it as a string.
    "at-unknown-block": { label: "<at-rule>", code: "css_syntax", labels: ["<at-rule>"], arity: 2, leafMap: ["prelude", "body"], since: "X.P.W3.l" },
    "at-unknown-stmt": { label: "<at-rule>", code: "css_syntax", labels: ["<at-rule>"], arity: 1, leafMap: ["prelude"], since: "X.P.W3.l" },
    //    The raw body as ONE SPAN of the source. `raw-text` is the pieces between an at-rule's own
    //    braces (its span runs from the first piece's start to the last piece's end, "" when there
    //    is none); `raw-block` is one nested `{ … }` — its braces are read `TEXT(cls, 1, 1)` when
    //    they stand alone and by a dropped exact-width `LIT` inside a run, so the leaves are one to
    //    three (the pieces list, with the open and/or close brace beside it) and the span is
    //    recovered from whichever stand: a dropped brace is exactly one code unit outside the
    //    pieces it encloses. Both lowerings read the span back from the ORIGINAL string, so a
    //    non-ASCII byte inside an unknown at-rule's body is never re-encoded (the J-6 posture).
    "raw-text": { label: "<at-rule-body>", code: "css_syntax", labels: ["<at-rule-body>"], arity: 1, leafMap: ["pieces"], since: "X.P.W3.l" },
    "raw-block": { label: "<at-rule-body>", code: "css_syntax", labels: ["<at-rule-body>"], arity: 3, leafMap: ["open", "pieces", "close"], since: "X.P.W3.l" },
    //    `parseDeclarations`' `name === "animation" || name.startsWith("animation-")` — the ONE guard
    //    of this family: the declaration name (trimmed, ASCII-folded) is `animation` or begins
    //    `animation-`, and the row answers the TRIMMED span; any other name is the guard's failure,
    //    which sends the declaration to its plain arm. It is what routes an animation declaration's
    //    value through the body that names a blank comma part (`emptyComma`'s law).
    "animation-property": { label: "<animation-property>", code: "css_syntax", labels: ["<animation-property> (animation or animation-*)"], arity: 1, leafMap: ["name"], since: "X.P.W3.l" },
};

/* ── L: the label index (§4.4) — EQ-4 compares INDICES into this list ──────────────────────── */

/**
 * ONE PASS PER UNIT, in LANDING ORDER (X.P.W3.h, generalized by X.P.W3.i). The first pass is the
 * slice's own order, row for row, and yields exactly the sixty labels L held before the value
 * grammar landed; then one pass per later unit — its rows (`since`), then its own `EXPECT`/`FAIL`
 * labels — appended at the END. K-10: no existing index moves, and a unit landing after another
 * cannot shift the labels of the one before it (which a single "every row tagged `since`" pass
 * would have done the moment a second unit added an `R_cls` row). A row born later still dedupes
 * against a label an earlier pass carries (`value-color-head` is `<color-function>`, `ident-start`
 * is `ident`), so only a genuinely new label takes a new index.
 */
const LATER_UNITS = ["X.P.W3.h", "X.P.W3.i", "X.P.W3.j", "X.P.W3.l"];

/** The `EXPECT` / `FAIL` labels each later unit's grammar names, in that grammar's own order. */
const UNIT_SITE_LABELS = {
    "X.P.W3.h": ["<value>", "<value-list>", "<scalar>", "'\\'", "'\"'", "'''"],
    "X.P.W3.i": ["<keyframe-selector>", "<animation-timeline>", "<animation-range>", "<animation-option-list>", "nonempty animation list item"],
    //  the three `LIT`s the comment production reads (`LIT`'s own label form is `'<bytes>'`)
    "X.P.W3.j": ["'/*'", "'*'", "'*/'"],
    //  the three at-rule heads the grammar reads by `LIT` (`'keyframes'` · `'scope'` · `'starting-style'`)
    //  and the one `FAIL` it names (`@starting-style` with no body). The braces' `'{'` / `'}'`
    //  already stand in L, so the dropped exact-width `LIT`s of `raw-block` add no index.
    "X.P.W3.l": ["'@'", "'keyframes'", "'scope'", "'starting-style'", "<starting-style-body>"],
};

const collectLabels = () => {
    const seen = [];
    const add = (l) => {
        if (typeof l === "string" && !seen.includes(l)) seen.push(l);
    };
    const slice = (rows) => Object.values(rows).filter((row) => row.since === undefined);
    const born = (rows, unit) => Object.values(rows).filter((row) => row.since === unit);
    for (const cls of slice(R_cls)) add(cls.label);
    for (const kw of slice(R_kw)) add(kw.label);
    for (const disp of slice(R_disp)) add(disp.label);
    for (const row of slice(R_ctor)) for (const l of row.labels) add(l);
    // the labels the slice's FAIL/EXPECT/END sites name, in grammar order
    for (const l of [
        "<color>",
        "<timing-function>",
        "end of input",
        "<number>",
        "nesting <= 64",
        "'('",
        "')'",
        "','",
        "'/'",
        "'%'",
        "'#'",
        "';'",
        "':'",
        "'{'",
        "'}'",
        "'!'",
        "'deg'",
        "'grad'",
        "'rad'",
        "'turn'",
        "'important'",
        "<declaration-value>",
        "rule",
        "<string>", //                                      BND-1's one label, above the algebra (§5.8)
        // X.P.W3.f — the nine capacity labels (COHESION §0q E-f1), appended AFTER "<string>" so no
        // existing index moves (the Wasm DLAB indices are compile-time). Each names its declared
        // bound in the `nesting <= 64` form; `bounds.mjs` asserts every value against the layout
        // at load, so a re-sized region halts until the label names the new value. The input
        // window is the ONE bound below its region's CAP: derived (`bounds.mjs` CLASS3_PROOF).
        "input <= 14107", //     X.P.W3.h re-derived: the value grammar's walked arena rate 511 B/code unit (was 65458; E-h5)
        "marks <= 32768",
        "recoveries <= 4096",
        "D <= 4096",
        "C <= 65536",
        "P <= 65536",
        "vstack <= 65536",
        "arena <= 7208960",
        "expsnap <= 32",
    ])
        add(l);
    // ── one pass per later unit, in landing order: its rows, then the labels its own `EXPECT` and
    //    `FAIL` sites name. Appended AFTER the nine capacity labels, so no index above moves (K-10),
    //    and each unit's block stands after the previous unit's, so no index below moves either.
    for (const unit of LATER_UNITS) {
        for (const cls of born(R_cls, unit)) add(cls.label);
        for (const kw of born(R_kw, unit)) add(kw.label);
        for (const disp of born(R_disp, unit)) add(disp.label);
        for (const row of born(R_ctor, unit)) for (const l of row.labels) add(l);
        for (const l of UNIT_SITE_LABELS[unit]) add(l);
    }
    const orphan = Object.values(R_cls).concat(Object.values(R_kw), Object.values(R_disp), Object.values(R_ctor))
        .filter((row) => row.since !== undefined && !LATER_UNITS.includes(row.since));
    if (orphan.length > 0) {
        throw new Error(`HALT: ${orphan.length} registry row(s) name a unit LATER_UNITS does not list — their labels would never reach L.`);
    }
    return seen;
};

export const L = collectLabels();

export const labelIndex = (label) => {
    const idx = L.indexOf(label);
    if (idx < 0) throw new Error(`HALT: label '${label}' is not in L — a label outside the index is an unnamed expectation (D-1)`);
    return idx;
};

/** The `R_disp` production names, so the grammar map can assert every row resolves. */
export const dispatchTargets = () =>
    Object.values(R_disp).flatMap((d) => Object.values(d.rows));
