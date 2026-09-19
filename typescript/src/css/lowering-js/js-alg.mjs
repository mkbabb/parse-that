// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · LOWERING-JS: the signature instantiated with the combinator
// library's own `Parser` type and `ParserState`. The interpretation IS the parser — there is no
// codegen step, no emitted source, no generated artifact: `buildGrammar(jsAlgebra())` returns
// parse-that `Parser` objects and running one IS the parse (`ALGEBRA.md` §12 AC-1).
//
// DECLARED POSTURE (written before any measurement, FF-4). The twenty-two operations are
// instantiated as NEW COMBINATORS over parse-that's `Parser`/`ParserState` — the library's own
// constructor, its own state machine, its own `parseState` entry — and NOT as compositions of the
// library's stock `all`/`any`/`many`/`opt` vocabulary. The reason is measurable and is reported
// rather than glossed: the algebra's state is `(V, C, P, D)` plus σ, and the library's own rollback
// (`then`/`or`/`many` each call `state.rollback(offset, value, diagnosticsLength, isError)`)
// restores the offset, the value and ITS diagnostics — it knows nothing of `C`, `P`, `D` or the
// arena watermark, so an `any()` around an algebra arm would leave the complement holding spans
// past the restored offset and break INV-OWN on the next byte. The seat measures how many of the
// twenty-two could be given a stock-combinator instantiation and prints the number in `VERDICT.md`.
//
// σ is per-parse and lives ON the state object the library creates for each `parseState` call.
// There is no module-level mutable binding in this file (O-8, §2.3) — `grep -nE "^(let|var) "`
// returns 0 — and no operator reads `globalThis`, `process.env`, or any latch.

import { Parser, createParserContext } from "@mkbabb/parse-that";

import { ESCAPED_BACKSLASH, ESCAPED_QUOTE, OPERATORS, SEPARATORS } from "../algebra/grammar/value.mjs";
import { KINDS } from "../algebra/ops.mjs";
import {
    AT_DECLARATION_KINDS, JUMP_POSITIONS, KEYFRAME_PHASES, L, RANGE_PHASES, R_cls, R_ctor, R_disp, R_kw, SCROLLER_KEYWORDS,
    STEP_ALIASES, TIMELINE_AXES, TIMELINE_MODES, TIMING_KEYWORDS, labelIndex,
} from "../algebra/tables.mjs";
import { asciiFold, clampValue, isList, isTuple, list, NONE_OPT, scaleValue, splitSelectors, span, trimWs, tuple, UNIT } from "./values.mjs";

/**
 * The combinator library itself — **this package's OWN BUILT ENTRY**, reached by the SELF-REFERENCE
 * `@mkbabb/parse-that`, which `package.json`'s own `exports["."]` resolves to `./dist/parse.js`.
 *
 * X.P.W4.e / C2 (COHESION §0y F-w4b-3). Until this landed, line 23 read
 * `import { tsImport } from "tsx/esm/api"` and this line read
 * `await tsImport("../../parse/index.ts", import.meta.url)` — the library's TYPESCRIPT SOURCES,
 * loaded through a loader, because the library's internal specifiers are TS-style (`./parser.js`
 * naming `parser.ts`) and Node strips types without re-resolving those. Inside this repository that
 * works. Inside a consumer it cannot: `src/parse/**` is not shipped and `tsx` is not a dependency of
 * this package (it is the fresh root's devDependency, reached by npm's up-walk from this tree), so
 * `import("@mkbabb/parse-that/css")` from an installed tarball died on the loader before a single
 * seam symbol could resolve — G-3 read `resolved 0 of 52` against exactly this line. Declaring `tsx`
 * a runtime `dependency` is REFUSED by the ruling: it makes a consumer install a TypeScript loader
 * to run a built package, which is a workaround wearing a manifest's clothes.
 *
 * The SUBJECT is unchanged — `dist/parse.js` is built by this root's own `vite build` from this
 * root's own `typescript/src/parse/**` (COHESION §0n.5 / OP-7: *"the fresh root's own library —
 * never on another repository's `node_modules`"*). What changed is that the lowering now addresses
 * that library the way a consumer does: through the package's export map. `harness/bench/lib/
 * engines.mjs`'s `PARSE_THAT_DIST` stays where it is — it is the BENCH's declared subject (the latch
 * witness O-15 PT-03's `:678`/`:722` coordinates name), and a subject under measurement is not a
 * substrate.
 *
 * A self-reference is location-independent by construction: it resolves through the nearest
 * `package.json` carrying this `name` and `exports`, which is this file's own package in the source
 * tree and the installed copy under a consumer's `node_modules` — so the D-c1 class of defect (a
 * depth-calibrated path) cannot recur here, and no specifier escapes the package root.
 */
export { Parser, createParserContext };

/* ── σ ─────────────────────────────────────────────────────────────────────────────────────── */

const newSigma = (src, theta) => ({
    src,
    C: [],
    P: [],
    D: [],
    depth: 0,
    far: { f: -1, code: null, labels: [] },
    lastCode: null,
    origin: 0,
    cut: false,
    marks: [],
    recoveries: [],
    theta,
    arena: 0,
    Chw: 0, //   X.P.W3.f (COHESION §0q E-f2, class 2): the PEAK length of C within this parse
    Phw: 0, //   … and of P — the quantity the Wasm appender guards; `restore` never lowers them
});

/** The class-2 high-water, noted at every push site — the same quantity `runtime.mjs`'s appender keeps. */
const noteC = (sg) => {
    if (sg.C.length > sg.Chw) sg.Chw = sg.C.length;
};
const noteP = (sg) => {
    if (sg.P.length > sg.Phw) sg.Phw = sg.P.length;
};

/** §5.6's merge rule, exactly: `x > f` replaces, `x = f` appends (code unchanged), `x < f` ignored. */
function raise(sg, x, code, label) {
    sg.lastCode = code;
    sg.origin = x;
    if (x > sg.far.f) {
        sg.far.f = x;
        sg.far.code = code;
        sg.far.labels = [label];
        return;
    }
    if (x === sg.far.f) {
        if (sg.far.code === null) sg.far.code = code;
        if (!sg.far.labels.includes(label)) sg.far.labels.push(label);
    }
}

const failWith = (state, sg, x, code, label) => {
    raise(sg, x, code, label);
    state.isError = true;
    return state;
};

const propagate = (state) => {
    state.isError = true;
    return state;
};

const mark = (state, sg) => [state.offset, sg.C.length, sg.P.length, sg.D.length, sg.depth, sg.arena];

function restore(state, sg, m) {
    state.offset = m[0];
    sg.C.length = m[1];
    sg.P.length = m[2];
    sg.D.length = m[3];
    sg.depth = m[4];
    sg.arena = m[5];
}

const recordMark = (sg, site, m, state) => {
    sg.marks.push({ site, at: m[0], mark: m, restored: [state.offset, sg.C.length, sg.P.length, sg.D.length, sg.depth, sg.arena] });
};

/* ── byte classes ──────────────────────────────────────────────────────────────────────────── */

/**
 * The class test both lowerings share: a code unit at or above 128 indexes byte 255, which is the
 * marker the Wasm boundary writes for a non-ASCII code unit. Every excluded byte of every
 * `any-but-*` class is ASCII, so the two tests agree on every input (§5.1).
 */
const classAt = (table, src, at) => {
    const c = src.charCodeAt(at);
    return table[c < 128 ? c : 255];
};

function scanClass(src, from, table, limit) {
    let j = from;
    while (j < limit) {
        if (!classAt(table, src, j)) break;
        j++;
    }
    return j;
}

const isDigitAt = (src, at) => {
    const c = src.charCodeAt(at);
    return c >= 48 && c <= 57;
};

/* ── the number token (OP-03), the one scanner both lowerings must agree on to the bit ─────── */

export function scanNumberToken(src, from, limit) {
    let j = from;
    if (j < limit) {
        const c = src.charCodeAt(j);
        if (c === 43 || c === 45) j++;
    }
    let intDigits = 0;
    while (j < limit) {
        if (!isDigitAt(src, j)) break;
        j++;
        intDigits++;
    }
    let fracDigits = 0;
    if (j < limit && src.charCodeAt(j) === 46 && j + 1 < limit && isDigitAt(src, j + 1)) {
        j++;
        while (j < limit) {
            if (!isDigitAt(src, j)) break;
            j++;
            fracDigits++;
        }
    }
    if (intDigits === 0 && fracDigits === 0) return -1; //   `1.` is not a number (band L94)
    if (j < limit) {
        const e = src.charCodeAt(j);
        if (e === 101 || e === 69) {
            let k = j + 1;
            if (k < limit) {
                const sgn = src.charCodeAt(k);
                if (sgn === 43 || sgn === 45) k++;
            }
            if (k < limit && isDigitAt(src, k)) {
                while (k < limit) {
                    if (!isDigitAt(src, k)) break;
                    k++;
                }
                j = k;
            }
        }
    }
    return j;
}

/* ── the constructors (the JS half of each `R_ctor` row) ───────────────────────────────────── */

const finite = (v) => typeof v !== "number" || Number.isFinite(v);
const colorOf = (space, c1, c2, c3, alpha) => ({ space, channels: [c1, c2, c3], alpha });

/** Each returns the value, or GUARD to mean the row's labelled zero-width failure (OP-19). */
const GUARD = Symbol("ctor-guard");

const CTORS = {
    rgb: (a) => (a.every(finite) ? colorOf("rgb", a[0], a[1], a[2], a[3]) : GUARD),
    hsl: (a) => (a.every(finite) ? colorOf("hsl", a[0], a[1], a[2], a[3]) : GUARD),
    oklch: (a) => (a.every(finite) ? colorOf("oklch", a[0], a[1], a[2], a[3]) : GUARD),
    hex8: (a) => colorOf("rgb", a[0], a[1], a[2], a[3]),
    hex6: (a) => colorOf("rgb", a[0], a[1], a[2], 1),
    hex4: (a) => colorOf("rgb", a[0], a[1], a[2], a[3]),
    hex3: (a) => colorOf("rgb", a[0], a[1], a[2], 1),
    context: () => GUARD, //                                 its only result is the failure (§10.1)
    "named-color": (a) => colorOf("rgb", a[0].rgb3[0], a[0].rgb3[1], a[0].rgb3[2], 1),
    transparent: (a) => colorOf("rgb", a[0].rgba4[0], a[0].rgba4[1], a[0].rgba4[2], a[0].rgba4[3]),
    "timing-keyword": (a) => ({ kind: "keyword", name: TIMING_KEYWORDS[a[0]] }),
    "step-alias": (a) => ({ kind: "steps", count: STEP_ALIASES[a[0]].count, position: JUMP_POSITIONS[STEP_ALIASES[a[0]].position] }),
    "cubic-bezier": (a) => (a[0] >= 0 && a[0] <= 1 && a[2] >= 0 && a[2] <= 1 ? { kind: "cubic-bezier", x1: a[0], y1: a[1], x2: a[2], y2: a[3] } : GUARD),
    steps: (a) => {
        const count = a[0];
        const position = JUMP_POSITIONS[a[1]];
        if (!Number.isInteger(count) || count < 1) return GUARD;
        if (position === "jump-none" && count < 2) return GUARD;
        return { kind: "steps", count, position };
    },
    "linear-function": (a) => ({ kind: "linear-function", stops: a[0].l }),
    "linear-stop": (a) => ({ output: a[0], input: a[1].l }),
    //  X.P.W3.l: the prelude leaf is OPTIONAL (`{ color: red }` → `selectors: []`, the splitter's own reading)
    "style-rule": (a) =>
        (a.length === 2
            ? { kind: "style", selectors: splitSelectors(a[0]), declarations: a[1].l }
            : { kind: "style", selectors: [], declarations: a[0].l }),
    /**
     * X.P.W3.j (J-2 / J-6): the name is the TRIMMED span, and nothing else. `.toLowerCase()` is
     * the surface's (`entry.mjs` `sheetOver`) — MEASURED, not preferred: a fold inside a
     * constructor has to MATERIALIZE folded bytes, and the Wasm arena's only materializer,
     * `mkFold`, reads the input buffer, where a code unit >= 128 was written as the `any-but-*`
     * marker 0xFF (the adapter's declared `spans` posture). Folding here therefore answered `ÿ`
     * for `≡` in the Wasm target and `≡` in the JS one — a G-5 value divergence on two corpus
     * rows, measured before this form was written. A span is read back from the ORIGINAL string
     * in both targets, so the trimmed name is byte-identical across them, and the surface's
     * `.toLowerCase()` is the incumbent's own operation rather than an ASCII approximation of it.
     */
    declaration: (a) => ({ name: trimWs(a[0]), value: a[1], important: a[2] }),
    "value-color": (a) => ({ kind: "scalar", payload: { type: "color", value: a[0] } }),
    stylesheet: (a) => a[0].l.filter((item) => item !== NONE_OPT),

    // ── X.P.W3.h — the CTOR family landed as ONE commit with its rows (`tables.mjs` R_ctor), the
    //    Wasm emitter (`wasm-alg.mjs` emitCtors) and the node table (`bounds.mjs`), E-h1.
    hwb: (a) => (a.every(finite) ? colorOf("hwb", a[0], a[1], a[2], a[3]) : GUARD),
    lab: (a) => (a.every(finite) ? colorOf("lab", a[0], a[1], a[2], a[3]) : GUARD),
    lch: (a) => (a.every(finite) ? colorOf("lch", a[0], a[1], a[2], a[3]) : GUARD),
    oklab: (a) => (a.every(finite) ? colorOf("oklab", a[0], a[1], a[2], a[3]) : GUARD),
    xyz: (a) => (a.every(finite) ? colorOf("xyz", a[0], a[1], a[2], a[3]) : GUARD),
    "srgb-linear": (a) => (a.every(finite) ? colorOf("srgb-linear", a[0], a[1], a[2], a[3]) : GUARD),
    "display-p3": (a) => (a.every(finite) ? colorOf("display-p3", a[0], a[1], a[2], a[3]) : GUARD),
    "a98-rgb": (a) => (a.every(finite) ? colorOf("a98-rgb", a[0], a[1], a[2], a[3]) : GUARD),
    "prophoto-rgb": (a) => (a.every(finite) ? colorOf("prophoto-rgb", a[0], a[1], a[2], a[3]) : GUARD),
    rec2020: (a) => (a.every(finite) ? colorOf("rec2020", a[0], a[1], a[2], a[3]) : GUARD),
    /** `color(xyz-d50 …)` → `xyz`: the row's Bradford matrix, `m[0]*x + m[1]*y + m[2]*z` per row. */
    "xyz-d50": (a) => {
        if (typeof a[0] !== "number" || typeof a[1] !== "number" || typeof a[2] !== "number") return GUARD;
        if (!a.every(finite)) return GUARD;
        const m = R_ctor["xyz-d50"].matrix;
        const x = m[0] * a[0] + m[1] * a[1] + m[2] * a[2];
        const y = m[3] * a[0] + m[4] * a[1] + m[5] * a[2];
        const z = m[6] * a[0] + m[7] * a[1] + m[8] * a[2];
        return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z) ? colorOf("xyz", x, y, z, a[3]) : GUARD;
    },
    /** `[number, unit?]` — the unit leaf is absent for a bare number (`OPT(o, null)`). */
    "value-number": (a) => (finite(a[0]) ? { kind: "scalar", payload: { type: "number", value: a[0], unit: a.length === 2 ? a[1] : "" } } : GUARD),
    "value-keyword": (a) => ({ kind: "scalar", payload: { type: "keyword", value: a[0] } }),
    "value-operator": (a) => ({ kind: "scalar", payload: { type: "keyword", value: OPERATORS[a[0]] } }),
    /** One leaf is an empty string's own two quotes; three are open, the interior pieces, close. */
    "value-string": (a) => {
        if (a.length === 1) return { kind: "scalar", payload: { type: "keyword", value: a[0] } };
        const quote = a[0];
        const piece = (p) =>
            typeof p === "string" ? p
                : p.t[0] === ESCAPED_QUOTE ? `\\${quote}`
                    : p.t[0] === ESCAPED_BACKSLASH ? "\\\\"
                        : `\\${p.t[0]}`;
        return { kind: "scalar", payload: { type: "keyword", value: quote + a[1].l.map(piece).join("") + a[2] } };
    },
    /** The incumbent's three name rules, over the row's own lists (`grammar.ts` parseValueInternal). */
    "value-call": (a) => {
        const row = R_ctor["value-call"];
        const name = a[0];
        const args = a.length === 2 ? a[1] : [];
        const folded = asciiFold(name);
        if (row.zeroArg.includes(folded)) return args.length === 0 ? { kind: "call", name, args } : GUARD;
        if (args.length === 0 && !(row.emptyOk.includes(folded) || name.startsWith("--"))) return GUARD;
        return { kind: "call", name, args };
    },
    /** The argument array, bare (the `stylesheet` row's precedent), or the group guard's failure. */
    "value-args": (a) => groupItems(a) ?? GUARD,
    /** `first` alone when it is the only item, else the list. */
    "value-group": (a) => {
        const items = groupItems(a);
        if (items === null) return GUARD;
        return items.length > 1 ? { kind: "list", separator: SEPARATORS[a[3]], items } : items[0];
    },
    /** `parseCssValues`: a list is itself, any other value a one-item space list. */
    "value-wrap": (a) => (a[0].kind === "list" ? a[0] : { kind: "list", separator: "space", items: [a[0]] }),

    // ── X.P.W3.i — the ANIMATION family, landed as ONE commit with its rows (`tables.mjs` R_ctor),
    //    the Wasm emitter (`wasm-alg.mjs` emitCtors) and the node table (`bounds.mjs`), E-h1.

    /** One `LENGTH_PERCENTAGE` token, re-joined from its contiguous `TEXT` pieces (its own text). */
    "lp-text": (a) => a.join(""),
    /** `^auto$` under `/i`: the ident run folds to `auto`, and the AUTHORED spelling is kept. */
    "lp-auto": (a) => (asciiFold(a[0]) === "auto" ? a[0] : GUARD),

    /** `RangeBoundary`'s three inhabited shapes, one row each (`timeline.ts` rangeBoundary). */
    "range-phase": (a) => ({ phase: RANGE_PHASES[a[0]] }),
    "range-phase-offset": (a) => ({ phase: RANGE_PHASES[a[0]], offset: a[1] }),
    "range-offset": (a) => ({ offset: a[0] }),
    "range-single": (a) => ({ start: a[0] }),
    "range-pair": (a) => ({ start: a[0], end: a[1] }),

    /** `KeyframeSelector`. `from`/`to` carry their own percent; the other two guard the range. */
    "keyframe-word": (a) => ({ kind: "percent", value: a[0] }),
    "keyframe-percent": (a) => (a[0] >= 0 && a[0] <= 100 ? { kind: "percent", value: a[0] / 100 } : GUARD),
    "keyframe-named": (a) => {
        const name = KEYFRAME_PHASES[a[0]];
        if (a.length === 1) return { kind: "named", name };
        const offset = a[1] / 100;
        return offset >= 0 && offset <= 1 ? { kind: "named", name, offset } : GUARD;
    },

    /** `AnimationTimelineValue`. The key ORDER is this candidate's own and is identical in Wasm. */
    "timeline-mode": (a) => ({ kind: TIMELINE_MODES[a[0]] }),
    "timeline-name": (a) => (a[0].startsWith("--") ? { kind: "name", name: a[0] } : GUARD),
    "timeline-scroll": (a) => {
        let scroller;
        let axis;
        for (const index of a[0].l) {
            if (index < SCROLLER_KEYWORDS.length) {
                if (scroller !== undefined) return GUARD;
                scroller = SCROLLER_KEYWORDS[index];
            } else {
                if (axis !== undefined) return GUARD;
                axis = TIMELINE_AXES[index - SCROLLER_KEYWORDS.length];
            }
        }
        return {
            kind: "scroll",
            ...(scroller === undefined ? {} : { scroller }),
            ...(axis === undefined ? {} : { axis }),
        };
    },
    "timeline-view": (a) => {
        let axis;
        const inset = [];
        for (const item of a[0].l) {
            if (typeof item === "number") {
                if (axis !== undefined) return GUARD;
                axis = TIMELINE_AXES[item];
            } else {
                if (inset.length >= 2) return GUARD;
                inset.push(item);
            }
        }
        return {
            kind: "view",
            ...(axis === undefined ? {} : { axis }),
            ...(inset.length === 0 ? {} : { inset: inset.length === 2 ? { start: inset[0], end: inset[1] } : { start: inset[0] } }),
        };
    },

    /** One comma part: the space-separated run of value tokens `parseCssValue` reads there. */
    "animation-option": (a) => a[0].l,
    /** The animation declaration's comma list, as the bare array of its parts (the blank ones the
     *  grammar already refused by name). It is the vocabulary `collectAnimationOptions` reads. */
    "animation-option-list": (a) => [a[0], ...a[1].l],

    // ── X.P.W3.j — the STYLESHEET family, landed as ONE commit with its row (`tables.mjs`
    //    R_ctor), the Wasm emitter (`wasm-alg.mjs` emitCtors) and the node table (`bounds.mjs`).

    /** A comment is the recovery sentinel: `stylesheet`'s own constructor filters it out (J-4). */
    "sheet-comment": () => NONE_OPT,

    /* ── X.P.W3.l — the at-rule and nesting families (`algebra/grammar/stylesheet.mjs` L-1…L-6).
          Every record carries its keys in the incumbent's own order; a leaf an `OPT` left out is
          read by COUNT (`value-call`'s idiom), never by a sentinel. The raw items these answer are
          the grammar's — `entry.mjs` `completerOver` finishes them into the frozen `Stylesheet`. ── */

    /** The mixed reading (L-4): the prelude (optional) and the items — declarations, rules, comment holes. */
    "style-rule-mixed": (a) =>
        (a.length === 2
            ? { kind: "style", selectors: splitSelectors(a[0]), items: a[1].l }
            : { kind: "style", selectors: [], items: a[0].l }),
    /** `@keyframes <name> { … }`: the name is the prelude run (trimmed by the completion, as `slice(11).trim()`). */
    "at-keyframes": (a) => ({ kind: "keyframes", name: a[0], rules: a[1].l }),
    /** One keyframe block: its prelude (optional — `{ }` is the empty selector list) and `parseDeclarations`. */
    "keyframe-rule": (a) => (a.length === 2 ? { prelude: a[0], declarations: a[1].l } : { prelude: "", declarations: a[0].l }),
    /** `@property` · `@function` · `@scroll-timeline` · `@view-timeline`: the head's row index names the kind. */
    "at-declarations": (a) => ({ kind: AT_DECLARATION_KINDS[a[0]], prelude: a[1], declarations: a[2].l }),
    /** `@scope<prelude> { … }`: the prelude is the text after the head (the incumbent's `t.slice(6)`). */
    "at-scope": (a) => (a.length === 2 ? { kind: "scope", prelude: a[0], children: a[1].l } : { kind: "scope", prelude: "", children: a[0].l }),
    "at-starting-style": (a) => ({ kind: "starting-style", children: a[0].l }),
    /** The unknown at-rule with a block: the prelude after `@` (optional) and the raw body text. */
    "at-unknown-block": (a) => (a.length === 2 ? { kind: "unknown", prelude: a[0], body: a[1] } : { kind: "unknown", prelude: "", body: a[0] }),
    /** The unknown at-rule statement (`@import …;`): `body: null`, exactly as `blocks()` records it. */
    "at-unknown-stmt": (a) => ({ kind: "unknown", prelude: a.length === 1 ? a[0] : "", body: null }),
    /** The raw body between the at-rule's braces: its pieces, concatenated — the source span. */
    "raw-text": (a) => a[0].l.join(""),
    /**
     * X.P.W3.n — a SIMPLE BLOCK inside a prelude (css-syntax-3 §5.4.9): its opening paren, whatever
     * stood between, and its closing paren, as ONE run of source text. The three leaves are always
     * present (`TEXT(lparen,1,1)` · the inner run · `TEXT(rparen,1,1)`) and contiguous, so the JS
     * join and the Wasm span (open.start .. close.end) are the same bytes.
     */
    "paren-block": (a) => `(${a.find(isList).l.join("")})`,
    /**
     * A nested `{ … }` inside a raw body, braces included. The braces are leaves when `TEXT` read
     * them and absent when a doubled brace fell to the dropped `LIT` arm (L-3), so the block is
     * rebuilt around the one leaf that is always present: the pieces list.
     */
    "raw-block": (a) => `{${a.find(isList).l.join("")}}`,
    /**
     * L-6: the name of a declaration `parseDeclarations` runs `emptyComma` on — `animation` or
     * `animation-*` after `.trim().toLowerCase()` — or the row's labelled zero-width failure.
     * Answers the TRIMMED span (the fold is the surface's, J-6), so the `declaration` constructor
     * sees the same leaf it sees from the plain arm.
     */
    "animation-property": (a) => {
        const name = trimWs(a[0]);
        const lower = asciiFold(name);
        return lower === "animation" || lower.startsWith("animation-") ? name : GUARD;
    },
};

/**
 * The group rows' shared reading (`tables.mjs` R_ctor `value-args` / `value-group`): the items are
 * `first` and every non-UNIT of `rest` (a UNIT is a separator followed by nothing); a leading or a
 * trailing comma/slash separator needs at least two items, or the group is the incumbent's
 * "one part, separators still in the text" failure (`null` here, the row's labelled GUARD above).
 */
function groupItems(a) {
    const rest = a[2].l;
    const items = [a[1]];
    for (const v of rest) if (v !== UNIT) items.push(v);
    const leading = a[0].l.length > 0;
    const trailing = rest.length > 0 && rest[rest.length - 1] === UNIT;
    if (a[3] !== SEPARATORS.indexOf("space") && (leading || trailing) && items.length < 2) return null;
    return items;
}

/* ── the instantiation ─────────────────────────────────────────────────────────────────────── */

const node = (name, fn, child, args) => new Parser(fn, createParserContext(name, child, args));

/**
 * `jsAlgebra(resolve)` — `resolve(name)` returns the production Parser a `REF` names; it is
 * supplied by the grammar builder's caller because the map is only complete once every production
 * is built. It is a lookup into a finite closed map, never a host closure inside a term.
 */
export function jsAlgebra(ctx) {
    const A = {
        SCAN(clsName, min, max) {
            const cls = R_cls[clsName];
            const label = labelIndex(cls.label);
            return node(
                "SCAN",
                (state) => {
                    const sg = state.w2;
                    const from = state.offset;
                    const end = scanClass(sg.src, from, cls.table, sg.src.length);
                    const run = end - from;
                    if (run < min || run > max) return failWith(state, sg, from, "css_syntax", label);
                    state.offset = end;
                    state.value = span(from, end);
                    state.isError = false;
                    return state;
                },
                undefined,
                [clsName, min, max],
            );
        },

        LIT(bytes) {
            const folded = asciiFold(bytes);
            const len = bytes.length;
            const label = labelIndex(`'${bytes}'`);
            return node(
                "LIT",
                (state) => {
                    const sg = state.w2;
                    const from = state.offset;
                    if (from + len > sg.src.length) return failWith(state, sg, from, "css_syntax", label);
                    if (asciiFold(sg.src.slice(from, from + len)) !== folded) return failWith(state, sg, from, "css_syntax", label);
                    state.offset = from + len;
                    state.value = span(from, from + len);
                    state.isError = false;
                    return state;
                },
                undefined,
                [bytes],
            );
        },

        NUM() {
            const label = labelIndex("<number>");
            return node(
                "NUM",
                (state) => {
                    const sg = state.w2;
                    const from = state.offset;
                    const end = scanNumberToken(sg.src, from, sg.src.length);
                    if (end < 0) return failWith(state, sg, from, "css_syntax", label);
                    sg.P.push([from, end]);
                    noteP(sg);
                    state.offset = end;
                    state.value = Number(sg.src.slice(from, end));
                    state.isError = false;
                    return state;
                },
                undefined,
                [],
            );
        },

        DIGITS(radix, n) {
            const cls = radix === 16 ? R_cls.hexdigit : R_cls.digit;
            const label = labelIndex(cls.label);
            return node(
                "DIGITS",
                (state) => {
                    const sg = state.w2;
                    const from = state.offset;
                    let j = from;
                    while (j < from + n) {
                        if (j >= sg.src.length) break;
                        if (!classAt(cls.table, sg.src, j)) break;
                        j++;
                    }
                    if (j - from !== n) return failWith(state, sg, from, "css_syntax", label);
                    sg.P.push([from, j]);
                    noteP(sg);
                    state.offset = j;
                    state.value = parseInt(sg.src.slice(from, j), radix);
                    state.isError = false;
                    return state;
                },
                undefined,
                [radix, n],
            );
        },

        TEXT(clsName, min, max) {
            const cls = R_cls[clsName];
            const label = labelIndex(cls.label);
            return node(
                "TEXT",
                (state) => {
                    const sg = state.w2;
                    const from = state.offset;
                    const end = scanClass(sg.src, from, cls.table, sg.src.length);
                    const run = end - from;
                    if (run < min || run > max) return failWith(state, sg, from, "css_syntax", label);
                    sg.P.push([from, end]);
                    noteP(sg);
                    state.offset = end;
                    state.value = sg.src.slice(from, end);
                    state.isError = false;
                    return state;
                },
                undefined,
                [clsName, min, max],
            );
        },

        KW(clsName, tableName) {
            const cls = R_cls[clsName];
            const kw = R_kw[tableName];
            const label = labelIndex(kw.label);
            return node(
                "KW",
                (state) => {
                    const sg = state.w2;
                    const from = state.offset;
                    const end = scanClass(sg.src, from, cls.table, sg.src.length);
                    if (end === from) return failWith(state, sg, from, kw.code, label);
                    const key = asciiFold(sg.src.slice(from, end));
                    const row = kw.rows[key];
                    if (row === undefined) return failWith(state, sg, from, kw.code, label);
                    sg.P.push([from, end]);
                    noteP(sg);
                    state.offset = end;
                    state.value = kw.kind === "rgb3" ? { rgb3: row } : kw.kind === "rgba4" ? { rgba4: row } : kw.kind === "none" ? "none" : row;
                    state.isError = false;
                    return state;
                },
                undefined,
                [clsName, tableName],
            );
        },

        END() {
            const label = labelIndex("end of input");
            return node(
                "END",
                (state) => {
                    const sg = state.w2;
                    if (state.offset !== sg.src.length) return failWith(state, sg, state.offset, "trailing_input", label);
                    state.value = UNIT;
                    state.isError = false;
                    return state;
                },
                undefined,
                [],
            );
        },

        SEQ(...ops) {
            return node(
                "SEQ",
                (state) => {
                    const out = [];
                    for (const op of ops) {
                        op.parser(state);
                        if (state.isError) return propagate(state);
                        if (state.value !== UNIT) out.push(state.value);
                    }
                    state.value = out.length === 0 ? UNIT : out.length === 1 ? out[0] : tuple(out);
                    state.isError = false;
                    return state;
                },
                ops[0],
                ops,
            );
        },

        ALT(...ops) {
            return node(
                "ALT",
                (state) => {
                    const sg = state.w2;
                    let maxOrigin = -1;
                    for (let k = 0; k < ops.length; k++) {
                        const m = mark(state, sg);
                        const savedCut = sg.cut;
                        sg.cut = false;
                        ops[k].parser(state);
                        if (!state.isError) {
                            sg.cut = savedCut;
                            return state;
                        }
                        if (sg.cut) {
                            //  a committed arm propagates WITHOUT restoring σ (§5.2)
                            sg.cut = savedCut;
                            return propagate(state);
                        }
                        if (sg.origin > maxOrigin) maxOrigin = sg.origin;
                        restore(state, sg, m);
                        recordMark(sg, `ALT[${k}]`, m, state);
                        sg.cut = savedCut;
                    }
                    sg.origin = maxOrigin;
                    return propagate(state);
                },
                ops[0],
                ops,
            );
        },

        CUT() {
            return node(
                "CUT",
                (state) => {
                    state.w2.cut = true;
                    state.value = UNIT;
                    state.isError = false;
                    return state;
                },
                undefined,
                [],
            );
        },

        PURE(lit) {
            return node(
                "PURE",
                (state) => {
                    state.value = lit === null ? UNIT : lit;
                    state.isError = false;
                    return state;
                },
                undefined,
                [lit],
            );
        },

        REP(op, min, max, sep) {
            return node(
                "REP",
                (state) => {
                    const sg = state.w2;
                    const items = [];
                    let lastOrigin = -1;
                    while (items.length < max) {
                        const m = mark(state, sg);
                        if (items.length > 0 && sep) {
                            sep.parser(state);
                            if (state.isError) {
                                lastOrigin = sg.origin;
                                restore(state, sg, m);
                                recordMark(sg, "REP.sep", m, state);
                                break;
                            }
                        }
                        const before = state.offset;
                        op.parser(state);
                        if (state.isError) {
                            lastOrigin = sg.origin;
                            restore(state, sg, m);
                            recordMark(sg, "REP.item", m, state);
                            break;
                        }
                        if (state.offset === before) {
                            //  the progress law: a zero-width iteration is discarded and the loop stops
                            restore(state, sg, m);
                            recordMark(sg, "REP.zero", m, state);
                            break;
                        }
                        items.push(state.value);
                    }
                    if (items.length < min) {
                        sg.origin = lastOrigin < 0 ? state.offset : lastOrigin;
                        return propagate(state);
                    }
                    state.value = list(items);
                    state.isError = false;
                    return state;
                },
                op,
                [min, max, sep],
            );
        },

        DROP(kind, op) {
            if (!KINDS.includes(kind)) throw new Error(`HALT: '${kind}' is not one of K_C (§4.5)`);
            return node(
                "DROP",
                (state) => {
                    const sg = state.w2;
                    op.parser(state);
                    if (state.isError) return propagate(state);
                    const sp = state.value;
                    if (sp.e > sp.s) {
                        sg.C.push([sp.s, sp.e - sp.s, kind]);
                        noteC(sg);
                    }
                    state.value = UNIT;
                    return state;
                },
                op,
                [kind],
            );
        },

        DISPATCH(clsName, tableName) {
            const cls = R_cls[clsName];
            const disp = R_disp[tableName];
            const label = labelIndex(disp.label);
            return node(
                "DISPATCH",
                (state) => {
                    const sg = state.w2;
                    const from = state.offset;
                    const end = scanClass(sg.src, from, cls.table, sg.src.length);
                    if (end === from) return failWith(state, sg, from, disp.code, label);
                    const key = asciiFold(sg.src.slice(from, end));
                    const toName = disp.rows[key];
                    if (toName === undefined) return failWith(state, sg, from, disp.code, label);
                    sg.P.push([from, end]);
                    noteP(sg);
                    state.offset = end;
                    ctx.dispatch[toName].parser(state);
                    if (state.isError) return propagate(state);
                    return state;
                },
                undefined,
                [clsName, tableName],
            );
        },

        FAIL(code, ...labels) {
            const idx = labels.map(labelIndex);
            return node(
                "FAIL",
                (state) => {
                    const sg = state.w2;
                    for (const l of idx) raise(sg, state.offset, code, l);
                    state.isError = true;
                    return state;
                },
                undefined,
                [code, ...labels],
            );
        },

        EXPECT(op, ...labels) {
            const idx = labels.map(labelIndex);
            return node(
                "EXPECT",
                (state) => {
                    const sg = state.w2;
                    const f0 = { f: sg.far.f, code: sg.far.code, labels: sg.far.labels.slice() };
                    const i0 = state.offset;
                    op.parser(state);
                    if (!state.isError) return state;
                    if (sg.origin !== i0) return propagate(state);
                    const code = sg.lastCode;
                    sg.far = f0;
                    for (const l of idx) raise(sg, i0, code, l);
                    return propagate(state);
                },
                op,
                labels,
            );
        },

        CLAMP(lo, hi, op) {
            return node(
                "CLAMP",
                (state) => {
                    op.parser(state);
                    if (state.isError) return propagate(state);
                    if (typeof state.value === "number") state.value = clampValue(state.value, lo, hi);
                    return state;
                },
                op,
                [lo, hi],
            );
        },

        SCALE(num, den, op) {
            return node(
                "SCALE",
                (state) => {
                    op.parser(state);
                    if (state.isError) return propagate(state);
                    if (typeof state.value === "number") state.value = scaleValue(state.value, num, den);
                    return state;
                },
                op,
                [num, den],
            );
        },

        CTOR(rowName, ...ops) {
            const row = R_ctor[rowName];
            const build = CTORS[rowName];
            const labels = row.labels.map(labelIndex);
            return node(
                "CTOR",
                (state) => {
                    const sg = state.w2;
                    const out = [];
                    for (const op of ops) {
                        op.parser(state);
                        if (state.isError) return propagate(state);
                        if (state.value !== UNIT) out.push(state.value);
                    }
                    const seq = out.length === 0 ? UNIT : out.length === 1 ? out[0] : tuple(out);
                    const args = seq === UNIT ? [] : isTuple(seq) ? seq.t : [seq];
                    const built = build(args);
                    if (built === GUARD) {
                        for (const l of labels) raise(sg, state.offset, row.code, l);
                        state.isError = true;
                        return state;
                    }
                    state.value = built;
                    state.isError = false;
                    return state;
                },
                ops[0],
                ops,
            );
        },

        TRY(op) {
            return node(
                "TRY",
                (state) => {
                    const sg = state.w2;
                    const m = mark(state, sg);
                    op.parser(state);
                    if (!state.isError) return state;
                    restore(state, sg, m);
                    recordMark(sg, "TRY", m, state);
                    return propagate(state);
                },
                op,
                [],
            );
        },

        RECOVER(code, op, sync) {
            return node(
                "RECOVER",
                (state) => {
                    const sg = state.w2;
                    const m = mark(state, sg);
                    op.parser(state);
                    if (!state.isError) return state;
                    restore(state, sg, m);
                    recordMark(sg, "RECOVER.body", m, state);
                    const labels = sg.far.labels.slice();
                    sync.parser(state);
                    if (state.isError || state.offset === m[0]) {
                        restore(state, sg, m);
                        recordMark(sg, "RECOVER.sync", m, state);
                        return propagate(state);
                    }
                    const end = state.offset;
                    sg.C.length = m[1];
                    sg.P.length = m[2];
                    sg.D.length = m[3];
                    sg.D.push({
                        code,
                        start: m[0],
                        end,
                        expected: labels.map((l) => L[l]),
                        actual: sg.src.slice(m[0], end),
                    });
                    sg.C.push([m[0], end - m[0], "skipped"]);
                    noteC(sg);
                    sg.recoveries.push({ at: m[0], skipped: [m[0], end - m[0]], code });
                    state.value = NONE_OPT;
                    state.isError = false;
                    return state;
                },
                op,
                [code, sync],
            );
        },

        REF(name) {
            const label = labelIndex("nesting <= 64");
            return node(
                "REF",
                (state) => {
                    const sg = state.w2;
                    sg.depth++;
                    if (sg.depth > sg.theta.depthBound) {
                        sg.depth--;
                        return failWith(state, sg, state.offset, "css_syntax", label);
                    }
                    ctx.terms[name].parser(state);
                    sg.depth--;
                    if (state.isError) return propagate(state);
                    return state;
                },
                undefined,
                [name],
            );
        },
    };
    return A;
}

export { newSigma, noteC, noteP, raise, restore, mark, recordMark };
