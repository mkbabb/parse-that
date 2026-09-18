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

import { tsImport } from "tsx/esm/api";

import { KINDS } from "../algebra/ops.mjs";
import { JUMP_POSITIONS, L, R_cls, R_ctor, R_disp, R_kw, STEP_ALIASES, TIMING_KEYWORDS, labelIndex } from "../algebra/tables.mjs";
import { asciiFold, clampValue, isTuple, list, NONE_OPT, scaleValue, splitSelectors, span, tuple, UNIT } from "./values.mjs";

/**
 * The combinator library itself — **this root's own `typescript/src/parse/**`** (COHESION §0n.5 /
 * OP-7: *"W3 builds the 52 on `<p2>/typescript/src/parse/**` — the fresh root's own library — never
 * on another repository's `node_modules`"*). X.P.W3.0 re-pointed it here; until then the specifier
 * reached `harness/bench/lib/engines.mjs`'s `PARSE_THAT_DIST`, which addresses
 * `…/value.js/docs/tranches/V/megatranche/prototypes/css-parser/node_modules/@mkbabb/parse-that/dist`
 * — a second repository's install directory, which is exactly what OP-7 forbids. That constant stays
 * where it is: it is the BENCH's declared subject (the latch witness O-15 PT-03's `:678`/`:722`
 * coordinates name), and a subject under measurement is not a substrate.
 *
 * The specifier is RELATIVE and stays inside the tree, so the lowering is location-independent by
 * construction — the D-c1 class of defect (a depth-calibrated absolute-ish path) cannot recur here.
 * The library is TypeScript source whose internal specifiers are TS-style (`./parser.js` naming
 * `parser.ts`); Node 26 strips types but does not re-resolve those, so the root's own pinned `tsx`
 * (§0l E-1, `tsx@4.23.13` in `<p2>/package.json`) loads it. `tsImport` scopes its hooks to this
 * import graph rather than registering a process-wide loader.
 */
const pt = await tsImport("../../parse/index.ts", import.meta.url);
export const Parser = pt.Parser;
export const createParserContext = pt.createParserContext;

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
});

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
    "style-rule": (a) => ({ kind: "style", selectors: splitSelectors(a[0]), declarations: a[1].l }),
    declaration: (a) => ({ name: asciiFold(a[0]), value: a[1], important: a[2] }),
    "value-color": (a) => ({ kind: "scalar", payload: { type: "color", value: a[0] } }),
    stylesheet: (a) => a[0].l.filter((item) => item !== NONE_OPT),
};

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
                    if (sp.e > sp.s) sg.C.push([sp.s, sp.e - sp.s, kind]);
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

export { newSigma, raise, restore, mark, recordMark };
