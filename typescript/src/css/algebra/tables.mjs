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
    "token-char": {
        label: "token boundary",
        table: table256((b) => !isWs(b) && b !== ch(",") && b !== ch("/") && b !== ch(":") && b !== ch(";") && b !== ch(")")),
        since: "X.P.W3.h",
    },
    "leading-digit": { label: "ident start", table: table256(isDigit), since: "X.P.W3.h" },
    "unit-char": { label: "<unit>", table: table256((b) => isAlpha(b) || b === ch("%") || b === ch("-")), since: "X.P.W3.h" },
    "op-char": { label: "<operator>", table: table256((b) => "+*-<>=!".includes(String.fromCharCode(b))), since: "X.P.W3.h" },
    dquote: { label: "double quote", table: table256((b) => b === ch('"')), since: "X.P.W3.h" },
    squote: { label: "single quote", table: table256((b) => b === ch("'")), since: "X.P.W3.h" },
    "dq-plain": { label: "string text", table: table256((b) => b !== ch('"') && b !== ch("\\")), since: "X.P.W3.h" },
    "sq-plain": { label: "string text", table: table256((b) => b !== ch("'") && b !== ch("\\")), since: "X.P.W3.h" },
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
};

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
    "style-rule": { label: "<qualified-rule>", code: "css_syntax", labels: ["<qualified-rule>"], arity: 2, leafMap: ["prelude", "declarations"] },
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
};

/* ── L: the label index (§4.4) — EQ-4 compares INDICES into this list ──────────────────────── */

/**
 * TWO PASSES over the registries (X.P.W3.h). The first pass is the slice's own order, row for row,
 * and yields exactly the sixty labels L held before the value grammar landed; the second pass adds
 * the labels of every row tagged `since` (a row born AFTER the slice) and the value grammar's own
 * `EXPECT` labels, at the END. K-10: no existing index moves. A row born later still dedupes against
 * a label the slice already carries (`value-color-head` is `<color-function>`, `ident-start` is
 * `ident`), so only a genuinely new label takes a new index.
 */
const collectLabels = () => {
    const seen = [];
    const add = (l) => {
        if (typeof l === "string" && !seen.includes(l)) seen.push(l);
    };
    const slice = (rows) => Object.values(rows).filter((row) => row.since === undefined);
    const later = (rows) => Object.values(rows).filter((row) => row.since !== undefined);
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
    // ── the second pass: every row born after the slice, then the value grammar's EXPECT sites
    //    (X.P.W3.h). Appended AFTER the nine capacity labels, so no index above moves (K-10).
    for (const cls of later(R_cls)) add(cls.label);
    for (const kw of later(R_kw)) add(kw.label);
    for (const disp of later(R_disp)) add(disp.label);
    for (const row of later(R_ctor)) for (const l of row.labels) add(l);
    for (const l of ["<value>", "<value-list>", "<scalar>", "'\\'", "'\"'", "'''"]) add(l);
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
