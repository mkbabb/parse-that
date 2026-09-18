// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · LOWERING-WASM, THE MEMORY MAP AND THE DATA SEGMENT.
//
// One linear memory, twelve megabytes, no `memory.grow` anywhere: every region below is sized once
// and the emitted code bounds-checks every append against its cap, setting the overflow flag rather
// than writing past a region (a silent write past a journal is the class of defect this candidate
// exists to make impossible to hide). G-9's steady-state leg reads the buffer length before and
// after 2,000 parses; a module that never grows cannot move it.
//
// The static region at the bottom is written by the DATA segment: the eight `R_cls` tables, the
// keyword and dispatch blobs, the interned literal and key strings, the five singleton nodes and the
// two power-of-ten tables. All of it is a FUNCTION of `algebra/tables.mjs` — the registries exist
// once and this file projects them to bytes.

/* ── the regions ──────────────────────────────────────────────────────────────────────────── */

export const STATIC_BASE = 0x000000;
export const STATIC_CAP = 0x040000; //                       256 KB of tables, blobs and singletons

export const INPUT_BASE = 0x040000;
export const INPUT_CAP = 0x100000; //                        1 MB of code units, one byte each

export const C_BASE = 0x140000;
export const C_CAP = 65536; //                               12 B per entry
export const C_STRIDE = 12;

export const P_BASE = 0x200000;
export const P_CAP = 65536; //                               8 B per entry
export const P_STRIDE = 8;

export const D_BASE = 0x280000;
export const D_CAP = 4096; //                                16 B per entry
export const D_STRIDE = 16;

export const DLAB_BASE = 0x290000;
export const DLAB_STRIDE = 128; //                           32 label indices per diagnostic
export const DLAB_MAX = 32;

export const MARK_BASE = 0x310000;
export const MARK_CAP = 32768; //                            56 B per entry
export const MARK_STRIDE = 56;

export const REC_BASE = 0x4d0000;
export const REC_CAP = 4096; //                              12 B per entry
export const REC_STRIDE = 12;

export const FARLAB_BASE = 0x4dc000;
export const FARLAB_CAP = 64;

/** `EXPECT`'s `far` snapshots (§5.6: `far` is saved, the body runs, the save is restored). */
export const EXPSNAP_BASE = 0x4dd000;
export const EXPSNAP_CAP = 32;
export const EXPSNAP_STRIDE = 8 + FARLAB_CAP * 4;

export const VSTACK_BASE = 0x4e0000;
export const VSTACK_CAP = 65536; //                          4 B per slot

export const ARENA_BASE = 0x520000;
export const ARENA_CAP = 0xc00000 - 0x520000; //             ~6.9 MB

export const MEMORY_PAGES = 0xc00000 / 65536; //             192 pages = 12 MB, fixed

/* ── the node tags (the carrier kinds 𝒦 of `ALGEBRA.md` §4.0, as bytes) ───────────────────── */

export const T_UNIT = 0;
export const T_NONE = 1;
export const T_NULL = 2;
export const T_TRUE = 3;
export const T_FALSE = 4;
export const T_NUM = 5; //                                   +8: f64
export const T_STR = 6; //                                   +4: start, +8: len   (a span of the source)
export const T_STRB = 7; //                                  +4: len,   +8: bytes (owned, ASCII)
export const T_LIST = 8; //                                  +4: count, +8: ptrs  (the `{l}` carrier)
export const T_TUPLE = 9; //                                 +4: count, +8: ptrs  (the `{t}` carrier)
export const T_SPAN = 10; //                                 +4: s,     +8: e     (the `{s,e}` carrier)
export const T_REC = 11; //                                  +4: count, +8: (keyPtr, valPtr) pairs
export const T_ARR = 12; //                                  +4: count, +8: ptrs  (a bare array)

/* ── the decimal→f64 table (§5.7's exactness, as data) ────────────────────────────────────── */

export const Q_MIN = -400;
export const Q_MAX = 340;

const U64 = (x) => BigInt.asUintN(64, x);

/**
 * One 192-bit normalized power of ten per decimal exponent, with the `exact` flag that says whether
 * the entry is the power itself or a truncation of it. The flag is what lets the conversion KNOW
 * when it cannot decide the last bit rather than guess: an inexact entry brackets the product and
 * the two roundings are compared.
 */
function tableEntryFor(q) {
    let e = Math.floor(q * Math.log2(10));
    const num = q >= 0 ? 10n ** BigInt(q) : 1n;
    const den = q >= 0 ? 1n : 10n ** BigInt(-q);
    for (let tries = 0; tries < 8; tries++) {
        const sh = 191 - e;
        const scaledNum = sh >= 0 ? num << BigInt(sh) : num;
        const scaledDen = sh >= 0 ? den : den << BigInt(-sh);
        const H = scaledNum / scaledDen;
        const rem = scaledNum % scaledDen;
        const bits = H.toString(2).length;
        if (bits === 192) return { H, e, exact: rem === 0n };
        e += bits - 192;
    }
    throw new Error(`HALT: no 192-bit table entry for q=${q}`);
}

export function buildPow10Table() {
    const rows = [];
    for (let q = Q_MIN; q <= Q_MAX; q++) {
        const { H, e, exact } = tableEntryFor(q);
        rows.push({ q, e, exact, h2: U64(H >> 128n), h1: U64(H >> 64n), h0: U64(H) });
    }
    return rows;
}

/** 5^k for k <= 27 — the exact-dyadic path's only table (5^28 exceeds 2^64). */
export function buildPow5Table() {
    return Array.from({ length: 28 }, (_, k) => 5n ** BigInt(k));
}

/* ── the data builder ─────────────────────────────────────────────────────────────────────── */

/**
 * A bump allocator over the static region that hands out an offset NOW and keeps the bytes for the
 * data section LATER — the emitter needs the address while it is compiling the instruction that
 * reads it. Every blob is interned by key, so one literal spelled twice is one blob.
 */
export class DataBuilder {
    constructor() {
        this.cursor = STATIC_BASE + 256; //                  below this: the result block and the scratch (a null pointer is 0)
        this.segments = [];
        this.interned = new Map();
    }

    alloc(size, align = 8) {
        const off = Math.ceil(this.cursor / align) * align;
        this.cursor = off + size;
        if (this.cursor > STATIC_CAP) throw new Error(`HALT: the static region overflowed (${this.cursor} > ${STATIC_CAP})`);
        return off;
    }

    put(bytes, align = 8) {
        const off = this.alloc(bytes.length, align);
        this.segments.push({ offset: off, bytes: [...bytes] });
        return off;
    }

    intern(key, factory) {
        if (this.interned.has(key)) return this.interned.get(key);
        const off = factory();
        this.interned.set(key, off);
        return off;
    }

    /** A `T_STRB` node holding ASCII bytes — interned, and pointed at rather than copied. */
    stringNode(text) {
        return this.intern(`str:${text}`, () => {
            const bytes = [...text].map((c) => c.charCodeAt(0));
            if (bytes.some((b) => b > 255)) throw new Error(`HALT: a non-byte code unit in an interned string (${JSON.stringify(text)})`);
            const body = [...u32(T_STRB), ...u32(bytes.length), ...bytes];
            return this.put(pad8(body));
        });
    }

    /** A singleton node: the tag alone. */
    singleton(tag) {
        return this.intern(`singleton:${tag}`, () => this.put(pad8(u32(tag))));
    }

    /** A constant `T_NUM` node — the keyword tables' values and the grammar's literal numbers. */
    numNode(v) {
        return this.intern(`num:${Object.is(v, -0) ? "-0" : String(v)}`, () => this.put([...u32(T_NUM), 0, 0, 0, 0, ...f64b(v)]));
    }

    /** A constant sequence node (`T_ARR` / `T_LIST` / `T_TUPLE`) over already-placed nodes. */
    seqNode(tag, ptrs) {
        return this.put(pad8([...u32(tag), ...u32(ptrs.length), ...ptrs.flatMap(u32)]));
    }

    /** A constant record node: `[[keyPtr, valPtr], …]`, in the key order the JS constructor uses. */
    recNode(pairs) {
        return this.put(pad8([...u32(T_REC), ...u32(pairs.length), ...pairs.flatMap(([k, v]) => [...u32(k), ...u32(v)])]));
    }

    /** A raw byte blob (a class table, a keyword blob, a literal's folded bytes). */
    blob(key, bytes, align = 8) {
        return this.intern(key, () => this.put(bytes, align));
    }
}

export const u32 = (n) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
export const i32b = (n) => u32(n | 0);
export const u64 = (v) => {
    const x = BigInt.asUintN(64, BigInt(v));
    const out = [];
    for (let k = 0n; k < 8n; k++) out.push(Number((x >> (k * 8n)) & 0xffn));
    return out;
};
export const f64b = (x) => {
    const buf = Buffer.allocUnsafe(8);
    buf.writeDoubleLE(x, 0);
    return [...buf];
};
export const pad8 = (bytes) => {
    const out = [...bytes];
    while (out.length % 8 !== 0) out.push(0);
    return out;
};
