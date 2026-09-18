// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · LOWERING-WASM, THE MODULE AND THE BOUNDARY BND-1 (§5.8).
//
// `buildGrammar(wasmAlgebra(env))` assembles a module; the module is instantiated ONCE with no
// imports (`WebAssembly.Instance(module)` — there is no import object because there is no import
// section); `parse` marshals the source in, runs it, and materializes `V` out of the arena. The six
// ENTRY steps are the JS lowering's six, in the same order, for the same reasons.
//
// The boundary writes ONE BYTE PER CODE UNIT, and a code unit at or above 128 becomes 0xFF — the
// marker `R_cls` documents. Offsets are therefore code-unit offsets in BOTH lowerings, and a span's
// text is read back from the original string, so a non-ASCII byte is never re-encoded and never
// lost. That is a DECLARED posture: the algebra's spans are indices, and the two lowerings index the
// same sequence.

import { buildGrammar } from "../algebra/grammar.mjs";
import { CODES, KINDS, registryRows } from "../algebra/ops.mjs";
import { L, R_cls, R_kw, R_disp } from "../algebra/tables.mjs";
import { reifiedGrammar } from "../reify/term-alg.mjs";
import { I32, ModuleBuilder } from "./asm.mjs";
import {
    DLAB_BASE, DLAB_STRIDE, D_BASE, D_STRIDE, DataBuilder, FARLAB_BASE, INPUT_BASE, INPUT_CAP,
    MARK_BASE, MARK_STRIDE, MEMORY_PAGES, P_BASE, P_STRIDE, REC_BASE, REC_STRIDE, T_ARR, T_FALSE,
    T_LIST, T_NONE, T_NULL, T_NUM, T_REC, T_SPAN, T_STR, T_STRB, T_TRUE, T_TUPLE, T_UNIT,
    C_BASE, C_STRIDE, STATIC_CAP, buildPow10Table, buildPow5Table, u32, u64,
} from "./layout.mjs";
import { RESULT, emitRuntime } from "./runtime.mjs";
import { emitCtors, u32le, wasmAlgebra } from "./wasm-alg.mjs";

const DEFAULT_THETA = Object.freeze({ depthBound: 64 });

/**
 * The result block's word indices, bound ONCE. Reading them as `RESULT[field]` inside `parse` is a
 * keyed load over fifteen different string keys and V8 takes the site MEGAMORPHIC on the short-string
 * leg — measured under `--log-ic` (15 sites) before this was written this way. The fields are
 * constants; the reads are constant-index loads.
 */
const W_OK = RESULT.ok >> 2;
const W_I = RESULT.i >> 2;
const W_DEPTH = RESULT.depth >> 2;
const W_CLEN = RESULT.clen >> 2;
const W_PLEN = RESULT.plen >> 2;
const W_DLEN = RESULT.dlen >> 2;
const W_MARKN = RESULT.markn >> 2;
const W_RECN = RESULT.recn >> 2;
const W_ROOT = RESULT.root >> 2;
const W_OVF = RESULT.ovf >> 2;
const W_AMB = RESULT.amb >> 2;
const W_ARENA = RESULT.arena >> 2;
const W_FARF = RESULT.farf >> 2;
const W_FARCODE = RESULT.farcode >> 2;
const W_FARN = RESULT.farn >> 2;

/* ── the module ───────────────────────────────────────────────────────────────────────────── */

export function buildModule() {
    const m = new ModuleBuilder();
    m.memory(MEMORY_PAGES);
    const data = new DataBuilder();

    //  the two conversion tables, placed first so the emitted arithmetic can address them
    const pow5 = data.put(buildPow5Table().flatMap((v) => u64(v)));
    const pow10 = data.put(buildPow10Table().flatMap((r) => [...u64(r.h2), ...u64(r.h1), ...u64(r.h0), ...u32(r.e), ...u32(r.exact ? 1 : 0)]));

    const { G, F } = emitRuntime(m, { pow5, pow10 });

    const consts = {
        UNIT: data.singleton(T_UNIT),
        NONE: data.singleton(T_NONE),
        NULL: data.singleton(T_NULL),
        TRUE: data.singleton(T_TRUE),
        FALSE: data.singleton(T_FALSE),
    };

    const env = {
        m, data, G, F, consts,
        sites: [],
        deferred: [],
        termIndex: {},
        dispatchIndex: {},
        classTable: (name) => data.blob(`cls:${name}`, [...R_cls[name].table], 1),
        literal: (bytes) => data.blob(`lit:${bytes}`, [...bytes].map((ch) => {
            const b = ch.charCodeAt(0);
            return b >= 65 && b <= 90 ? b + 32 : b;
        }), 1),
        kwBlob: (tableName) => data.blob(`kw:${tableName}`, keywordBlob(data, tableName), 4),
        dispBlob: (tableName, targets) => data.blob(`disp:${tableName}`, dispatchBlob(data, tableName, targets), 4),
        constNode: (lit) =>
            lit === null ? consts.UNIT
                : lit === true ? consts.TRUE
                    : lit === false ? consts.FALSE
                        : data.numNode(lit),
        ctorFn: (row) => env.ctors[row],
    };
    env.ctors = emitCtors(env);

    const A = wasmAlgebra(env);
    const g = buildGrammar(A);
    Object.assign(env.termIndex, g.terms);
    Object.assign(env.dispatchIndex, g.dispatchTerms);
    for (const fill of env.deferred) fill();

    //  the entry points, in a fixed order the boundary indexes by
    const entries = Object.keys(g.entries);
    const run = m.declare("run", [I32, I32], [I32]);
    m.define(run, (c) => {
        const ok = c.local(I32);
        c.call(F.reset);
        c.get(1).gset(G.srclen);
        entries.forEach((prod, k) => {
            c.get(0).i32(k).x("i32.eq").if_("void", (b) => {
                b.call(g.terms[g.entries[prod]]).set(ok);
            });
        });
        //  the residue rule: whatever the root did not consume is one `residue` entry (§4.5)
        c.gget(G.i).gget(G.srclen).x("i32.lt_u").if_("void", (b) => {
            b.gget(G.i).gget(G.srclen).gget(G.i).x("i32.sub").i32(KINDS.indexOf("residue")).call(F.appendC);
        });
        //  Π: on failure the far frontier becomes the one diagnostic (§5.6)
        c.get(ok).x("i32.eqz").if_("void", (b) => {
            const f = b.local(I32);
            b.gget(G.farf).i32(0).x("i32.lt_s").if_("void",
                (t) => t.i32(0).set(f),
                (t) => t.gget(G.farf).set(f));
            b.gget(G.farcode).i32(0).x("i32.lt_s").if_(I32,
                (t) => t.i32(CODES.indexOf("css_syntax")),
                (t) => t.gget(G.farcode));
            b.get(f).gget(G.srclen).i32(FARLAB_BASE).gget(G.farn).call(F.appendD);
        });
        const put = (field, emit) => {
            c.i32(0);
            emit(c);
            c.store(RESULT[field]);
        };
        put("ok", (b) => b.gget(G.dlen).x("i32.eqz"));
        put("i", (b) => b.gget(G.i));
        put("depth", (b) => b.gget(G.depth));
        put("clen", (b) => b.gget(G.clen));
        put("plen", (b) => b.gget(G.plen));
        put("dlen", (b) => b.gget(G.dlen));
        put("markn", (b) => b.gget(G.markn));
        put("recn", (b) => b.gget(G.recn));
        put("ovf", (b) => b.gget(G.ovf));
        put("amb", (b) => b.gget(G.amb));
        put("arena", (b) => b.gget(G.arena));
        put("farf", (b) => b.gget(G.farf));
        put("farcode", (b) => b.gget(G.farcode));
        put("farn", (b) => b.gget(G.farn));
        put("root", (b) => {
            b.gget(G.vsp).i32(0).x("i32.gt_u").if_(I32,
                (t) => t.i32(0).call(F.slotGet),
                (t) => t.i32(0));
        });
        c.gget(G.arena).gget(G.high).x("i32.gt_u").if_("void", (b) => b.gget(G.arena).gset(G.high));
        c.get(ok);
    });

    const setTheta = m.declare("setTheta", [I32], []);
    m.define(setTheta, (c) => c.get(0).gset(G.theta));
    const highWater = m.declare("highWater", [], [I32]);
    m.define(highWater, (c) => c.gget(G.high));
    const resetHigh = m.declare("resetAll", [], []);
    m.define(resetHigh, (c) => {
        c.call(F.reset);
        c.i32(0).gset(G.high);
    });

    m.exportFunc("run", run);
    m.exportFunc("setTheta", setTheta);
    m.exportFunc("highWater", highWater);
    m.exportFunc("reset", resetHigh);
    m.exportMemory("memory");

    for (const seg of data.segments) m.data(seg.offset, seg.bytes);
    return { bytes: m.emit(), entries, sites: env.sites, staticBytes: data.cursor, builder: m };
}

/** `R_kw` as bytes: `[u32 count]` then `[u8 keyLen][key…][u8 4][ptr]`, the value node pre-built. */
function keywordBlob(data, tableName) {
    const kw = R_kw[tableName];
    const rows = Object.entries(kw.rows);
    const bytes = [...u32(rows.length)];
    for (const [key, value] of rows) {
        const node =
            kw.kind === "rgb3" ? data.recNode([[data.stringNode("rgb3"), data.seqNode(T_ARR, value.map((v) => data.numNode(v)))]])
                : kw.kind === "rgba4" ? data.recNode([[data.stringNode("rgba4"), data.seqNode(T_ARR, value.map((v) => data.numNode(v)))]])
                    : kw.kind === "none" ? data.stringNode("none")
                        : data.numNode(value);
        bytes.push(key.length, ...[...key].map((ch) => ch.charCodeAt(0)), 4, ...u32le(node));
    }
    return bytes;
}

/** `R_disp` as bytes: the same shape, with the target's index in the dispatch order as payload. */
function dispatchBlob(data, tableName, targets) {
    const rows = Object.entries(R_disp[tableName].rows);
    const bytes = [...u32(rows.length)];
    for (const [key, target] of rows) {
        bytes.push(key.length, ...[...key].map((ch) => ch.charCodeAt(0)), 1, targets.indexOf(target));
    }
    return bytes;
}

/* ── the boundary ─────────────────────────────────────────────────────────────────────────── */

export function makeWasmLowering() {
    const built = buildModule();
    const module = new WebAssembly.Module(built.bytes);
    const instance = new WebAssembly.Instance(module); //     no import object: there is nothing to import
    const ex = instance.exports;
    const mem = ex.memory;
    const u8 = new Uint8Array(mem.buffer);
    const u32v = new Uint32Array(mem.buffer);
    const i32v = new Int32Array(mem.buffer);
    const f64v = new Float64Array(mem.buffer);
    const prodIndex = Object.fromEntries(built.entries.map((p, k) => [p, k]));
    const strCache = new Map();

    /** The interned byte strings decode once: they are static and the same node every time. */
    const strb = (ptr) => {
        const hit = ptr < STATIC_CAP ? strCache.get(ptr) : undefined;
        if (hit !== undefined) return hit;
        const n = u32v[(ptr >> 2) + 1];
        let out = "";
        for (let k = 0; k < n; k++) out += String.fromCharCode(u8[ptr + 8 + k]);
        if (ptr < STATIC_CAP) strCache.set(ptr, out);
        return out;
    };

    const decode = (ptr, src) => {
        const tag = u32v[ptr >> 2];
        switch (tag) {
            case T_UNIT: return UNIT;
            case T_NONE: return NONE_OPT;
            case T_NULL: return null;
            case T_TRUE: return true;
            case T_FALSE: return false;
            case T_NUM: return f64v[(ptr >> 3) + 1];
            case T_STR: return src.slice(u32v[(ptr >> 2) + 1], u32v[(ptr >> 2) + 1] + u32v[(ptr >> 2) + 2]);
            case T_STRB: return strb(ptr);
            case T_SPAN: return { s: u32v[(ptr >> 2) + 1], e: u32v[(ptr >> 2) + 2] };
            case T_LIST: return { l: elements(ptr, src) };
            case T_TUPLE: return { t: elements(ptr, src) };
            case T_ARR: return elements(ptr, src);
            case T_REC: {
                const n = u32v[(ptr >> 2) + 1];
                const out = {};
                for (let k = 0; k < n; k++) {
                    out[strb(u32v[(ptr >> 2) + 2 + k * 2])] = decode(u32v[(ptr >> 2) + 3 + k * 2], src);
                }
                return out;
            }
            default: throw new Error(`HALT: the arena holds no node tagged ${tag} at ${ptr}`);
        }
    };
    const elements = (ptr, src) => {
        const n = u32v[(ptr >> 2) + 1];
        const out = new Array(n);
        for (let k = 0; k < n; k++) out[k] = decode(u32v[(ptr >> 2) + 2 + k], src);
        return out;
    };

    function parse(prod, source, theta) {
        const k = prodIndex[prod];
        if (k === undefined) throw new Error(`HALT: '${prod}' is not an entry of the grammar map`);
        if (source.length > INPUT_CAP) throw new Error(`HALT: the input exceeds the module's ${INPUT_CAP}-byte window`);
        for (let j = 0; j < source.length; j++) {
            const cu = source.charCodeAt(j);
            u8[INPUT_BASE + j] = cu < 128 ? cu : 255;
        }
        const bound = theta && theta.depthBound !== undefined ? theta.depthBound : DEFAULT_THETA.depthBound;
        ex.setTheta(bound);
        ex.run(k, source.length);
        if (i32v[W_OVF]) throw new Error("HALT: a journal, the value stack or the arena overflowed its fixed region");

        const C = [];
        for (let j = 0; j < i32v[W_CLEN]; j++) {
            const b = (C_BASE + j * C_STRIDE) >> 2;
            C.push([u32v[b], u32v[b + 1], KINDS[u32v[b + 2]]]);
        }
        const P = [];
        for (let j = 0; j < i32v[W_PLEN]; j++) {
            const b = (P_BASE + j * P_STRIDE) >> 2;
            P.push([u32v[b], u32v[b + 1]]);
        }
        const D = [];
        for (let j = 0; j < i32v[W_DLEN]; j++) {
            const b = (D_BASE + j * D_STRIDE) >> 2;
            const n = u32v[b + 3];
            const expected = [];
            for (let q = 0; q < n; q++) expected.push(L[u32v[((DLAB_BASE + j * DLAB_STRIDE) >> 2) + q]]);
            const start = u32v[b + 1];
            const end = u32v[b + 2];
            D.push({
                code: CODES[u32v[b]],
                start,
                end,
                expected,
                actual: start >= end ? null : source.slice(start, end),
            });
        }
        const marks = [];
        for (let j = 0; j < i32v[W_MARKN]; j++) {
            const b = (MARK_BASE + j * MARK_STRIDE) >> 2;
            marks.push({
                site: built.sites[u32v[b]],
                at: u32v[b + 1],
                mark: [u32v[b + 2], u32v[b + 3], u32v[b + 4], u32v[b + 5], u32v[b + 6], u32v[b + 7]],
                restored: [u32v[b + 8], u32v[b + 9], u32v[b + 10], u32v[b + 11], u32v[b + 12], u32v[b + 13]],
            });
        }
        const recoveries = [];
        for (let j = 0; j < i32v[W_RECN]; j++) {
            const b = (REC_BASE + j * REC_STRIDE) >> 2;
            recoveries.push({ at: u32v[b], skipped: [u32v[b], u32v[b + 1]], code: CODES[u32v[b + 2]] });
        }
        const ok = i32v[W_OK] === 1;
        const farLabels = [];
        for (let j = 0; j < i32v[W_FARN]; j++) farLabels.push(L[u32v[(FARLAB_BASE >> 2) + j]]);
        return {
            ok,
            V: ok ? decode(i32v[W_ROOT], source) : undefined,
            C,
            P,
            D,
            far: { f: i32v[W_FARF], code: i32v[W_FARCODE] < 0 ? null : CODES[i32v[W_FARCODE]], labels: farLabels },
            sigma: { i: i32v[W_I], depth: i32v[W_DEPTH], arena: i32v[W_ARENA] },
            marks,
            recoveries,
            ambiguous: i32v[W_AMB],
        };
    }

    const boundaryIssue = () => ({ code: "css_syntax", start: 0, end: 0, expected: ["<string>"], actual: null });
    const entryWith = (prod, freeze) => (source) => {
        if (typeof source !== "string") return { ok: false, diagnostics: [boundaryIssue()] };
        const p = parse(prod, source);
        if (!p.ok) return { ok: false, diagnostics: p.D };
        return { ok: true, value: freeze ? deepFreeze(p.V) : p.V, diagnostics: [] };
    };

    return {
        kind: "wasm",
        registry: () => registryRows((name) => `wasm:${name}`),
        labels: () => L.slice(),
        grammar: () => reifiedGrammar(),
        parse,
        entry: (prod) => entryWith(prod, true),
        entryNoFreeze: (prod) => entryWith(prod, false),
        module: () => module,
        wasmBytes: () => built.bytes,
        memory: () => mem,
        arenaHighWater: () => ex.highWater(),
        reset: () => ex.reset(),
        theta: () => DEFAULT_THETA,
        internals: { built, instance },
    };
}

/** `Unit` and `Opt`'s `none` — the two carrier singletons, per lowering (EQ-1 sees only "a symbol"). */
export const UNIT = Symbol("unit");
export const NONE_OPT = Symbol("none-opt");

/** DM-1: `ENTRY` deep-freezes `V` on success; the algebra's constructors never freeze. */
function deepFreeze(v) {
    if (v === null || typeof v !== "object" || Object.isFrozen(v)) return v;
    Object.freeze(v);
    for (const key of Object.keys(v)) deepFreeze(v[key]);
    return v;
}
