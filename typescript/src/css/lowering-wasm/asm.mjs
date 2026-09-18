// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · A MINIMAL WEBASSEMBLY BINARY ASSEMBLER.
//
// The Wasm lowering emits a module; a module is bytes; these are the bytes. Nothing here is
// substrate: no byte of the read-only evidence root's uncommitted `wasm32` working tree is read,
// copied or cited (K-10), and nothing here needs `cargo`, `rustc`, `wasm-pack` or any non-JS
// toolchain (K-9) — `node` alone reproduces the artifact.
//
// The module carries NO import section by construction: this file has no `importSection` to emit.
// That is G-9's condition met structurally rather than checked afterwards. It also emits no START
// section (the side channel G-9 names) — there is nothing to run at instantiation.

const MAGIC = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];

export const I32 = 0x7f;
export const I64 = 0x7e;
export const F64 = 0x7c;

export function uleb(n) {
    const out = [];
    let v = n >>> 0;
    do {
        let b = v & 0x7f;
        v >>>= 7;
        if (v) b |= 0x80;
        out.push(b);
    } while (v);
    return out;
}

export function sleb(n) {
    const out = [];
    let value = BigInt(n);
    for (;;) {
        const byte = Number(value & 0x7fn);
        value >>= 7n;
        const signBit = (byte & 0x40) !== 0;
        if ((value === 0n && !signBit) || (value === -1n && signBit)) {
            out.push(byte);
            return out;
        }
        out.push(byte | 0x80);
    }
}

/** The numeric instruction set this lowering uses — the WebAssembly 1.0 binary opcodes, by name. */
const OPCODES = {
    "select": 0x1b,
    "i32.eqz": 0x45, "i32.eq": 0x46, "i32.ne": 0x47, "i32.lt_s": 0x48, "i32.lt_u": 0x49,
    "i32.gt_s": 0x4a, "i32.gt_u": 0x4b, "i32.le_s": 0x4c, "i32.le_u": 0x4d, "i32.ge_s": 0x4e, "i32.ge_u": 0x4f,
    "i64.eqz": 0x50, "i64.eq": 0x51, "i64.ne": 0x52, "i64.lt_s": 0x53, "i64.lt_u": 0x54,
    "i64.gt_s": 0x55, "i64.gt_u": 0x56, "i64.le_s": 0x57, "i64.le_u": 0x58, "i64.ge_s": 0x59, "i64.ge_u": 0x5a,
    "f64.eq": 0x61, "f64.ne": 0x62, "f64.lt": 0x63, "f64.gt": 0x64, "f64.le": 0x65, "f64.ge": 0x66,
    "i32.clz": 0x67, "i32.add": 0x6a, "i32.sub": 0x6b, "i32.mul": 0x6c, "i32.div_s": 0x6d, "i32.div_u": 0x6e,
    "i32.rem_s": 0x6f, "i32.rem_u": 0x70, "i32.and": 0x71, "i32.or": 0x72, "i32.xor": 0x73,
    "i32.shl": 0x74, "i32.shr_s": 0x75, "i32.shr_u": 0x76,
    "i64.clz": 0x79, "i64.add": 0x7c, "i64.sub": 0x7d, "i64.mul": 0x7e, "i64.div_u": 0x80, "i64.rem_u": 0x82,
    "i64.and": 0x83, "i64.or": 0x84, "i64.xor": 0x85, "i64.shl": 0x86, "i64.shr_s": 0x87, "i64.shr_u": 0x88,
    "f64.abs": 0x99, "f64.neg": 0x9a, "f64.ceil": 0x9b, "f64.floor": 0x9c, "f64.trunc": 0x9d, "f64.add": 0xa0, "f64.sub": 0xa1, "f64.mul": 0xa2, "f64.div": 0xa3,
    "f64.min": 0xa4, "f64.max": 0xa5,
    "i32.wrap_i64": 0xa7, "i32.trunc_f64_s": 0xaa, "i32.trunc_f64_u": 0xab, "i64.extend_i32_s": 0xac, "i64.extend_i32_u": 0xad,
    "f64.convert_i32_s": 0xb7, "f64.convert_i32_u": 0xb8, "f64.convert_i64_s": 0xb9, "f64.convert_i64_u": 0xba,
    "i64.reinterpret_f64": 0xbd, "f64.reinterpret_i64": 0xbf,
};

const section = (id, payload) => [id, ...uleb(payload.length), ...payload];
const vec = (items) => [...uleb(items.length), ...items.flat()];
const str = (s) => [...uleb(s.length), ...[...s].map((c) => c.charCodeAt(0))];

/** One function body under construction. `local(t)` allocates; the emit helpers push opcodes. */
export class Code {
    constructor(params, results) {
        this.params = params;
        this.results = results;
        this.locals = [];
        this.bytes = [];
    }

    local(type) {
        this.locals.push(type);
        return this.params.length + this.locals.length - 1;
    }

    op(...b) {
        this.bytes.push(...b);
        return this;
    }

    i32(n) {
        return this.op(0x41, ...sleb(n | 0));
    }
    i64(n) {
        return this.op(0x42, ...sleb(BigInt.asIntN(64, BigInt(n))));
    }
    f64(x) {
        const buf = Buffer.allocUnsafe(8);
        buf.writeDoubleLE(x, 0);
        return this.op(0x44, ...buf);
    }
    get(i) {
        return this.op(0x20, ...uleb(i));
    }
    set(i) {
        return this.op(0x21, ...uleb(i));
    }
    tee(i) {
        return this.op(0x22, ...uleb(i));
    }
    gget(i) {
        return this.op(0x23, ...uleb(i));
    }
    gset(i) {
        return this.op(0x24, ...uleb(i));
    }
    call(i) {
        return this.op(0x10, ...uleb(i));
    }
    drop() {
        return this.op(0x1a);
    }
    ret() {
        return this.op(0x0f);
    }
    // loads/stores: align is log2, offset in bytes
    load(offset = 0) {
        return this.op(0x28, 2, ...uleb(offset));
    }
    store(offset = 0) {
        return this.op(0x36, 2, ...uleb(offset));
    }
    load8u(offset = 0) {
        return this.op(0x2d, 0, ...uleb(offset));
    }
    store8(offset = 0) {
        return this.op(0x3a, 0, ...uleb(offset));
    }
    load64(offset = 0) {
        return this.op(0x29, 3, ...uleb(offset));
    }
    store64(offset = 0) {
        return this.op(0x37, 3, ...uleb(offset));
    }
    loadf64(offset = 0) {
        return this.op(0x2b, 3, ...uleb(offset));
    }
    storef64(offset = 0) {
        return this.op(0x39, 3, ...uleb(offset));
    }

    /** Every numeric opcode this lowering uses, by its spec name: `c.x("i64.shr_u")`. */
    x(...names) {
        for (const n of names) {
            const code = OPCODES[n];
            if (code === undefined) throw new Error(`HALT: no opcode named '${n}'`);
            this.bytes.push(code);
        }
        return this;
    }

    /** Structured control flow. `block`/`loop`/`if` take a result type or `void`. */
    block(type, body) {
        this.op(0x02, type === "void" ? 0x40 : type);
        body(this);
        return this.op(0x0b);
    }
    loop(type, body) {
        this.op(0x03, type === "void" ? 0x40 : type);
        body(this);
        return this.op(0x0b);
    }
    if_(type, thenBody, elseBody) {
        this.op(0x04, type === "void" ? 0x40 : type);
        thenBody(this);
        if (elseBody) {
            this.op(0x05);
            elseBody(this);
        }
        return this.op(0x0b);
    }
    br(depth) {
        return this.op(0x0c, ...uleb(depth));
    }
    brIf(depth) {
        return this.op(0x0d, ...uleb(depth));
    }

    encode() {
        const groups = [];
        for (const t of this.locals) {
            const last = groups[groups.length - 1];
            if (last && last[1] === t) last[0]++;
            else groups.push([1, t]);
        }
        const body = [...vec(groups.map(([n, t]) => [...uleb(n), t])), ...this.bytes, 0x0b];
        return [...uleb(body.length), ...body];
    }
}

/** The whole module. Functions are declared first (so bodies can call forward), then filled. */
export class ModuleBuilder {
    constructor() {
        this.types = [];
        this.typeKeys = new Map();
        this.funcs = []; //                                  { typeIdx, code, name }
        this.globals = []; //                                { type, mutable, init }
        this.exports = [];
        this.datas = [];
        this.memPages = 1;
    }

    typeIdx(params, results) {
        const key = `${params.join(",")}->${results.join(",")}`;
        if (this.typeKeys.has(key)) return this.typeKeys.get(key);
        const idx = this.types.length;
        this.types.push([0x60, ...vec(params.map((p) => [p])), ...vec(results.map((r) => [r]))]);
        this.typeKeys.set(key, idx);
        return idx;
    }

    declare(name, params, results) {
        const idx = this.funcs.length;
        this.funcs.push({ typeIdx: this.typeIdx(params, results), params, results, code: null, name });
        return idx;
    }

    define(idx, body) {
        const f = this.funcs[idx];
        const code = new Code(f.params, f.results);
        body(code);
        f.code = code;
        return idx;
    }

    global(type, mutable, initConst) {
        const idx = this.globals.length;
        this.globals.push({ type, mutable, init: initConst });
        return idx;
    }

    memory(pages) {
        this.memPages = pages;
    }

    exportFunc(name, idx) {
        this.exports.push({ name, kind: 0x00, idx });
    }
    exportMemory(name) {
        this.exports.push({ name, kind: 0x02, idx: 0 });
    }

    data(offset, bytes) {
        this.datas.push({ offset, bytes });
    }

    emit() {
        const typeSection = section(1, vec(this.types.map((t) => t)));
        const funcSection = section(3, vec(this.funcs.map((f) => uleb(f.typeIdx))));
        const memSection = section(5, vec([[0x00, ...uleb(this.memPages)]]));
        const globalSection = section(
            6,
            vec(this.globals.map((g) => [g.type, g.mutable ? 1 : 0, g.type === 0x7e ? 0x42 : 0x41, ...sleb(g.init), 0x0b])),
        );
        const exportSection = section(7, vec(this.exports.map((e) => [...str(e.name), e.kind, ...uleb(e.idx)])));
        const codeSection = section(10, vec(this.funcs.map((f) => f.code.encode())));
        const dataSection = section(
            11,
            vec(this.datas.map((d) => [0x00, 0x41, ...sleb(d.offset), 0x0b, ...uleb(d.bytes.length), ...d.bytes])),
        );
        const body = [
            ...MAGIC,
            ...typeSection,
            ...funcSection,
            ...memSection,
            ...(this.globals.length ? globalSection : []),
            ...exportSection,
            ...codeSection,
            ...(this.datas.length ? dataSection : []),
        ];
        return new Uint8Array(body);
    }
}
