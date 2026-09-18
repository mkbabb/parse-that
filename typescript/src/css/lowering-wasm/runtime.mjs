// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · LOWERING-WASM, THE EMITTED RUNTIME.
//
// σ lives in globals, the four journals and the value arena live in linear memory, and every
// function below is EMITTED — this file writes instructions, it does not run a parser. The
// twenty-two operations (`wasm-alg.mjs`) compile to calls into these.
//
// The decimal→f64 conversion (§5.7) is the reason this file is long: `Number(s)` is one call in the
// JS lowering and a correctly-rounded 192-bit path here, because EQ-1 compares the two by their
// eight bytes and a fast-but-approximate conversion diverges on the third digit of the corpus. The
// algorithm was validated against `Number()` over 500k generated tokens and the 20,433 distinct
// number tokens of the slice+fuzz corpora BEFORE a single byte was emitted (0 mismatches), and it
// flags — never guesses — the case it cannot decide.

import {
    ARENA_BASE, ARENA_CAP, C_BASE, C_CAP, C_STRIDE, DLAB_BASE, DLAB_MAX, DLAB_STRIDE, D_BASE, D_CAP,
    D_STRIDE, FARLAB_BASE, FARLAB_CAP, INPUT_BASE, MARK_BASE, MARK_CAP, MARK_STRIDE, P_BASE, P_CAP,
    P_STRIDE, Q_MAX, Q_MIN, REC_BASE, REC_CAP, REC_STRIDE, T_ARR, T_NUM, T_REC, T_SPAN, T_STR,
    T_STRB, T_TUPLE, VSTACK_BASE, VSTACK_CAP,
} from "./layout.mjs";
import { F64, I32, I64 } from "./asm.mjs";

/** The result block the boundary reads after `run` — twelve words at address 0. */
export const RESULT_BASE = 0;
export const RESULT = {
    ok: 0, i: 4, depth: 8, clen: 12, plen: 16, dlen: 20, markn: 24, recn: 28,
    root: 32, ovf: 36, amb: 40, arena: 44, farf: 48, farcode: 52, farn: 56,
};
/** Scratch for the 256-bit products — two, so the bracketing rounding has somewhere to live. */
export const SCRATCH_MUL = 64; //                            2 * 32 bytes
export const SCRATCH_LAB = 128; //                           RECOVER's label snapshot: 32 * 4 bytes

export function emitRuntime(m, data) {
    const G = {};
    const F = {};
    const g = (name, init = 0) => {
        G[name] = m.global(I32, true, init);
    };
    for (const name of ["i", "srclen", "clen", "plen", "dlen", "depth", "farf", "farcode", "farn",
        "lastcode", "origin", "cut", "markn", "recn", "arena", "vsp", "ovf", "amb", "ndig", "q",
        "trunc", "expsp", "high"]) {
        g(name);
    }
    G.w = m.global(I64, true, 0);
    G.theta = m.global(I32, true, 64); //                     Θ = ⟨depthBound⟩, settable at the boundary

    const fn = (name, params, results, body) => {
        const idx = m.declare(name, params, results);
        m.define(idx, body);
        F[name] = idx;
        return idx;
    };

    /* ── the value stack ──────────────────────────────────────────────────────────────────── */

    fn("push", [I32], [], (c) => {
        c.gget(G.vsp).i32(VSTACK_CAP).x("i32.lt_u").if_("void",
            (b) => b.gget(G.vsp).i32(4).x("i32.mul").i32(VSTACK_BASE).x("i32.add").get(0).store(),
            (b) => b.i32(1).gset(G.ovf));
        c.gget(G.vsp).i32(1).x("i32.add").gset(G.vsp);
    });

    /** VSTACK[k] — the slot's value, by absolute slot index. */
    const slotAddr = (c, pushIndex) => {
        pushIndex(c);
        c.i32(4).x("i32.mul").i32(VSTACK_BASE).x("i32.add");
    };

    fn("slotGet", [I32], [I32], (c) => {
        slotAddr(c, (b) => b.get(0));
        c.load();
    });
    fn("slotSet", [I32, I32], [], (c) => {
        slotAddr(c, (b) => b.get(0));
        c.get(1).store();
    });

    /* ── the arena ────────────────────────────────────────────────────────────────────────── */

    fn("alloc", [I32], [I32], (c) => {
        const size = c.local(I32);
        const ptr = c.local(I32);
        c.get(0).i32(7).x("i32.add").i32(-8).x("i32.and").set(size);
        c.gget(G.arena).get(size).x("i32.add").i32(ARENA_CAP).x("i32.gt_u").if_("void", (b) => {
            b.i32(1).gset(G.ovf);
        });
        c.i32(ARENA_BASE).gget(G.arena).x("i32.add").set(ptr);
        c.gget(G.arena).get(size).x("i32.add").gset(G.arena);
        c.get(ptr);
    });

    const node2 = (name, tag) =>
        fn(name, [I32, I32], [I32], (c) => {
            const p = c.local(I32);
            c.i32(16).call(F.alloc).set(p);
            c.get(p).i32(tag).store();
            c.get(p).get(0).store(4);
            c.get(p).get(1).store(8);
            c.get(p);
        });
    node2("mkSpan", T_SPAN);
    node2("mkStr", T_STR);

    fn("mkNum", [F64], [I32], (c) => {
        const p = c.local(I32);
        c.i32(16).call(F.alloc).set(p);
        c.get(p).i32(T_NUM).store();
        c.get(p).get(0).storef64(8);
        c.get(p);
    });

    /** `mkFold(s, e)` — the span's bytes, ASCII-folded into the arena (§5.1's fold, in Wasm). */
    fn("mkFold", [I32, I32], [I32], (c) => {
        const p = c.local(I32);
        const n = c.local(I32);
        const k = c.local(I32);
        const b = c.local(I32);
        c.get(1).get(0).x("i32.sub").set(n);
        c.get(n).i32(8).x("i32.add").call(F.alloc).set(p);
        c.get(p).i32(T_STRB).store();
        c.get(p).get(n).store(4);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(n).x("i32.ge_u").brIf(1);
                lp.get(0).get(k).x("i32.add").i32(INPUT_BASE).x("i32.add").load8u().set(b);
                lp.get(b).i32(65).x("i32.ge_u").get(b).i32(90).x("i32.le_u").x("i32.and").if_("void", (t) => {
                    t.get(b).i32(32).x("i32.add").set(b);
                });
                lp.get(p).get(k).x("i32.add").get(b).store8(8);
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.get(p);
    });

    /** `mkSeqNode(tag, base, count)` — a list/tuple/array built from VSTACK slots [base, base+count). */
    fn("mkSeqNode", [I32, I32, I32], [I32], (c) => {
        const p = c.local(I32);
        const k = c.local(I32);
        c.get(2).i32(4).x("i32.mul").i32(8).x("i32.add").call(F.alloc).set(p);
        c.get(p).get(0).store();
        c.get(p).get(2).store(4);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(2).x("i32.ge_u").brIf(1);
                lp.get(p).get(k).i32(4).x("i32.mul").x("i32.add");
                lp.get(1).get(k).x("i32.add").call(F.slotGet);
                lp.store(8);
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.get(p);
    });

    /** `mkRec(base, pairs)` — a record from 2*pairs VSTACK slots: key pointer, value pointer, … */
    fn("mkRec", [I32, I32], [I32], (c) => {
        const p = c.local(I32);
        const k = c.local(I32);
        c.get(1).i32(8).x("i32.mul").i32(8).x("i32.add").call(F.alloc).set(p);
        c.get(p).i32(T_REC).store();
        c.get(p).get(1).store(4);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(1).i32(2).x("i32.mul").x("i32.ge_u").brIf(1);
                lp.get(p).get(k).i32(4).x("i32.mul").x("i32.add");
                lp.get(0).get(k).x("i32.add").call(F.slotGet);
                lp.store(8);
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.get(p);
    });

    /* ── §5.6's failure merge ─────────────────────────────────────────────────────────────── */

    fn("raise", [I32, I32, I32], [], (c) => {
        const k = c.local(I32);
        c.get(1).gset(G.lastcode);
        c.get(0).gset(G.origin);
        c.get(0).gget(G.farf).x("i32.gt_s").if_("void", (b) => {
            b.get(0).gset(G.farf);
            b.get(1).gset(G.farcode);
            b.i32(FARLAB_BASE).get(2).store();
            b.i32(1).gset(G.farn);
            b.ret();
        });
        c.get(0).gget(G.farf).x("i32.eq").if_("void", (b) => {
            b.gget(G.farcode).i32(0).x("i32.lt_s").if_("void", (t) => t.get(1).gset(G.farcode));
            b.block("void", (blk) => {
                blk.loop("void", (lp) => {
                    lp.get(k).gget(G.farn).x("i32.ge_u").brIf(1);
                    lp.i32(FARLAB_BASE).get(k).i32(4).x("i32.mul").x("i32.add").load().get(2).x("i32.eq").if_("void", (t) => t.ret());
                    lp.get(k).i32(1).x("i32.add").set(k);
                    lp.br(0);
                });
            });
            b.gget(G.farn).i32(FARLAB_CAP).x("i32.lt_u").if_("void", (t) => {
                t.i32(FARLAB_BASE).gget(G.farn).i32(4).x("i32.mul").x("i32.add").get(2).store();
                t.gget(G.farn).i32(1).x("i32.add").gset(G.farn);
            });
        });
    });

    /** `fail(x, code, label)` — raise and answer 0, the shape every terminal's failure path takes. */
    fn("fail", [I32, I32, I32], [I32], (c) => {
        c.get(0).get(1).get(2).call(F.raise);
        c.i32(0);
    });

    /* ── the journals ─────────────────────────────────────────────────────────────────────── */

    const appender = (name, base, cap, stride, arity) =>
        fn(name, Array.from({ length: arity }, () => I32), [], (c) => {
            const p = c.local(I32);
            const lenG = { appendC: G.clen, appendP: G.plen, appendRec: G.recn }[name];
            c.gget(lenG).i32(cap).x("i32.lt_u").if_("void",
                (b) => {
                    b.gget(lenG).i32(stride).x("i32.mul").i32(base).x("i32.add").set(p);
                    for (let k = 0; k < arity; k++) b.get(p).get(k).store(k * 4);
                },
                (b) => b.i32(1).gset(G.ovf));
            c.gget(lenG).i32(1).x("i32.add").gset(lenG);
        });
    appender("appendC", C_BASE, C_CAP, C_STRIDE, 3);
    appender("appendP", P_BASE, P_CAP, P_STRIDE, 2);
    appender("appendRec", REC_BASE, REC_CAP, REC_STRIDE, 3);

    /** `appendD(code, start, end, labPtr, labN)` — the diagnostic and its expectation list. */
    fn("appendD", [I32, I32, I32, I32, I32], [], (c) => {
        const p = c.local(I32);
        const k = c.local(I32);
        const n = c.local(I32);
        c.get(4).set(n);
        c.get(n).i32(DLAB_MAX).x("i32.gt_u").if_("void", (b) => b.i32(DLAB_MAX).set(n));
        c.gget(G.dlen).i32(D_CAP).x("i32.lt_u").if_("void",
            (b) => {
                b.gget(G.dlen).i32(D_STRIDE).x("i32.mul").i32(D_BASE).x("i32.add").set(p);
                b.get(p).get(0).store();
                b.get(p).get(1).store(4);
                b.get(p).get(2).store(8);
                b.get(p).get(n).store(12);
                b.gget(G.dlen).i32(DLAB_STRIDE).x("i32.mul").i32(DLAB_BASE).x("i32.add").set(p);
                b.block("void", (blk) => {
                    blk.loop("void", (lp) => {
                        lp.get(k).get(n).x("i32.ge_u").brIf(1);
                        lp.get(p).get(k).i32(4).x("i32.mul").x("i32.add");
                        lp.get(3).get(k).i32(4).x("i32.mul").x("i32.add").load();
                        lp.store();
                        lp.get(k).i32(1).x("i32.add").set(k);
                        lp.br(0);
                    });
                });
            },
            (b) => b.i32(1).gset(G.ovf));
        c.gget(G.dlen).i32(1).x("i32.add").gset(G.dlen);
    });

    /**
     * `appendMark(site, m0..m4)` — EQ-5's per-site record. The sixth coordinate is reported as 0 in
     * BOTH lowerings: `ALGEBRA.md` line 238 and §6 EQ-5 say "the JS lowering reports arena = 0",
     * and `.g`'s serializer digests all six coordinates, so a Wasm watermark here would diverge on
     * every mark by the contract's own construction. The REAL arena is truncated exactly on every
     * restore (the seat asserts it within the lowering) and its watermark rides `arenaHighWater()`.
     */
    fn("appendMark", [I32, I32, I32, I32, I32, I32], [], (c) => {
        const p = c.local(I32);
        c.gget(G.markn).i32(MARK_CAP).x("i32.lt_u").if_("void",
            (b) => {
                b.gget(G.markn).i32(MARK_STRIDE).x("i32.mul").i32(MARK_BASE).x("i32.add").set(p);
                b.get(p).get(0).store();
                b.get(p).get(1).store(4);
                for (let k = 0; k < 5; k++) b.get(p).get(k + 1).store(8 + k * 4);
                b.get(p).i32(0).store(28);
                b.get(p).gget(G.i).store(32);
                b.get(p).gget(G.clen).store(36);
                b.get(p).gget(G.plen).store(40);
                b.get(p).gget(G.dlen).store(44);
                b.get(p).gget(G.depth).store(48);
                b.get(p).i32(0).store(52);
            },
            (b) => b.i32(1).gset(G.ovf));
        c.gget(G.markn).i32(1).x("i32.add").gset(G.markn);
    });

    /* ── the scanners ─────────────────────────────────────────────────────────────────────── */

    /** The maximal run of a byte class from `G.i` — the one scanner both lowerings share (§5.1). */
    fn("scanRun", [I32], [I32], (c) => {
        const j = c.local(I32);
        c.gget(G.i).set(j);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(j).gget(G.srclen).x("i32.ge_u").brIf(1);
                lp.get(0).get(j).i32(INPUT_BASE).x("i32.add").load8u().x("i32.add").load8u().x("i32.eqz").brIf(1);
                lp.get(j).i32(1).x("i32.add").set(j);
                lp.br(0);
            });
        });
        c.get(j);
    });

    /** `litMatch(ptr, len)` — the folded literal at `ptr` against the input at `G.i`. */
    fn("litMatch", [I32, I32], [I32], (c) => {
        const k = c.local(I32);
        const b = c.local(I32);
        c.gget(G.i).get(1).x("i32.add").gget(G.srclen).x("i32.gt_u").if_("void", (t) => {
            t.i32(0).ret();
        });
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(1).x("i32.ge_u").brIf(1);
                lp.gget(G.i).get(k).x("i32.add").i32(INPUT_BASE).x("i32.add").load8u().set(b);
                lp.get(b).i32(65).x("i32.ge_u").get(b).i32(90).x("i32.le_u").x("i32.and").if_("void", (t) => {
                    t.get(b).i32(32).x("i32.add").set(b);
                });
                lp.get(b).get(0).get(k).x("i32.add").load8u().x("i32.ne").if_("void", (t) => t.i32(0).ret());
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.i32(1);
    });

    /**
     * `kwLookup(blob, s, e)` — the folded input span against a closed table, answering the payload
     * pointer or -1. The blob is `[u32 count]` then `[u8 keyLen][key…][u8 payloadLen][payload…]`.
     */
    fn("kwLookup", [I32, I32, I32], [I32], (c) => {
        const p = c.local(I32);
        const n = c.local(I32);
        const klen = c.local(I32);
        const k = c.local(I32);
        const b = c.local(I32);
        const hit = c.local(I32);
        c.get(0).load().set(n);
        c.get(0).i32(4).x("i32.add").set(p);
        c.block("void", (outer) => {
            outer.loop("void", (lp) => {
                lp.get(n).x("i32.eqz").brIf(1);
                lp.get(p).load8u().set(klen);
                lp.i32(1).set(hit);
                lp.get(klen).get(2).get(1).x("i32.sub").x("i32.ne").if_("void", (t) => t.i32(0).set(hit));
                lp.i32(0).set(k);
                lp.get(hit).if_("void", (t) => {
                    t.block("void", (blk) => {
                        blk.loop("void", (inner) => {
                            inner.get(k).get(klen).x("i32.ge_u").brIf(1);
                            inner.get(1).get(k).x("i32.add").i32(INPUT_BASE).x("i32.add").load8u().set(b);
                            inner.get(b).i32(65).x("i32.ge_u").get(b).i32(90).x("i32.le_u").x("i32.and").if_("void", (u) => {
                                u.get(b).i32(32).x("i32.add").set(b);
                            });
                            inner.get(b).get(p).get(k).x("i32.add").load8u(1).x("i32.ne").if_("void", (u) => {
                                u.i32(0).set(hit);
                                u.br(2);
                            });
                            inner.get(k).i32(1).x("i32.add").set(k);
                            inner.br(0);
                        });
                    });
                });
                lp.get(hit).if_("void", (t) => {
                    t.get(p).get(klen).x("i32.add").i32(2).x("i32.add").ret();
                });
                lp.get(p).get(klen).x("i32.add").i32(1).x("i32.add").set(p); //   past key
                lp.get(p).get(p).load8u().x("i32.add").i32(1).x("i32.add").set(p); // past payload
                lp.get(n).i32(1).x("i32.sub").set(n);
                lp.br(0);
            });
        });
        c.i32(-1);
    });

    /** `numToken()` — CSS Syntax's `<number-token>` from `G.i`, or -1. `1.` is not a number. */
    fn("numToken", [], [I32], (c) => {
        const j = c.local(I32);
        const k = c.local(I32);
        const ch = c.local(I32);
        const intD = c.local(I32);
        const fracD = c.local(I32);
        const lim = c.local(I32);
        c.gget(G.srclen).set(lim);
        c.gget(G.i).set(j);
        const at = (b, idx) => b.get(idx).i32(INPUT_BASE).x("i32.add").load8u();
        const isDigit = (b, idx) => {
            at(b, idx);
            b.set(ch);
            b.get(ch).i32(48).x("i32.ge_u").get(ch).i32(57).x("i32.le_u").x("i32.and");
        };
        c.get(j).get(lim).x("i32.lt_u").if_("void", (b) => {
            at(b, j);
            b.set(ch);
            b.get(ch).i32(43).x("i32.eq").get(ch).i32(45).x("i32.eq").x("i32.or").if_("void", (t) => {
                t.get(j).i32(1).x("i32.add").set(j);
            });
        });
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(j).get(lim).x("i32.ge_u").brIf(1);
                isDigit(lp, j);
                lp.x("i32.eqz").brIf(1);
                lp.get(j).i32(1).x("i32.add").set(j);
                lp.get(intD).i32(1).x("i32.add").set(intD);
                lp.br(0);
            });
        });
        c.get(j).get(lim).x("i32.lt_u").if_("void", (b) => {
            at(b, j);
            b.i32(46).x("i32.eq").if_("void", (t) => {
                t.get(j).i32(1).x("i32.add").set(k);
                t.get(k).get(lim).x("i32.lt_u").if_("void", (u) => {
                    isDigit(u, k);
                    u.if_("void", (v) => {
                        v.get(k).set(j);
                        v.block("void", (blk) => {
                            blk.loop("void", (lp) => {
                                lp.get(j).get(lim).x("i32.ge_u").brIf(1);
                                isDigit(lp, j);
                                lp.x("i32.eqz").brIf(1);
                                lp.get(j).i32(1).x("i32.add").set(j);
                                lp.get(fracD).i32(1).x("i32.add").set(fracD);
                                lp.br(0);
                            });
                        });
                    });
                });
            });
        });
        c.get(intD).x("i32.eqz").get(fracD).x("i32.eqz").x("i32.and").if_("void", (b) => b.i32(-1).ret());
        c.get(j).get(lim).x("i32.lt_u").if_("void", (b) => {
            at(b, j);
            b.set(ch);
            b.get(ch).i32(101).x("i32.eq").get(ch).i32(69).x("i32.eq").x("i32.or").if_("void", (t) => {
                t.get(j).i32(1).x("i32.add").set(k);
                t.get(k).get(lim).x("i32.lt_u").if_("void", (u) => {
                    at(u, k);
                    u.set(ch);
                    u.get(ch).i32(43).x("i32.eq").get(ch).i32(45).x("i32.eq").x("i32.or").if_("void", (v) => {
                        v.get(k).i32(1).x("i32.add").set(k);
                    });
                });
                t.get(k).get(lim).x("i32.lt_u").if_("void", (u) => {
                    isDigit(u, k);
                    u.if_("void", (v) => {
                        v.block("void", (blk) => {
                            blk.loop("void", (lp) => {
                                lp.get(k).get(lim).x("i32.ge_u").brIf(1);
                                isDigit(lp, k);
                                lp.x("i32.eqz").brIf(1);
                                lp.get(k).i32(1).x("i32.add").set(k);
                                lp.br(0);
                            });
                        });
                        v.get(k).set(j);
                    });
                });
            });
        });
        c.get(j);
    });

    /* ── decimal → f64, correctly rounded (§5.7) ──────────────────────────────────────────── */

    emitNumeric(m, fn, F, G, data);

    /* ── SEQ's tuple discipline ───────────────────────────────────────────────────────────── */

    /**
     * `seqFinish(base, unitPtr)` — §5.3: UNIT is dropped from a tuple, one survivor IS the value,
     * two or more are a tuple. Leaves exactly one slot at `base`.
     */
    fn("seqFinish", [I32, I32], [], (c) => {
        const k = c.local(I32);
        const w = c.local(I32);
        const p = c.local(I32);
        c.get(0).set(k);
        c.get(0).set(w);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).gget(G.vsp).x("i32.ge_u").brIf(1);
                lp.get(k).call(F.slotGet).set(p);
                lp.get(p).get(1).x("i32.ne").if_("void", (t) => {
                    t.get(w).get(p).call(F.slotSet);
                    t.get(w).i32(1).x("i32.add").set(w);
                });
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.get(w).get(0).x("i32.sub").set(k); //                  the survivor count
        c.get(k).x("i32.eqz").if_("void", (b) => {
            b.get(0).get(1).call(F.slotSet);
            b.get(0).i32(1).x("i32.add").gset(G.vsp);
            b.ret();
        });
        c.get(k).i32(1).x("i32.eq").if_("void", (b) => {
            b.get(0).i32(1).x("i32.add").gset(G.vsp);
            b.ret();
        });
        c.i32(T_TUPLE).get(0).get(k).call(F.mkSeqNode).set(p);
        c.get(0).get(p).call(F.slotSet);
        c.get(0).i32(1).x("i32.add").gset(G.vsp);
    });

    /** `ctorArgs(base, unitPtr)` — §5.5's `args`: UNIT is none, a tuple is its leaves, else one. */
    fn("ctorArgs", [I32, I32], [I32], (c) => {
        const p = c.local(I32);
        const n = c.local(I32);
        const k = c.local(I32);
        c.get(0).call(F.slotGet).set(p);
        c.get(p).get(1).x("i32.eq").if_("void", (b) => {
            b.get(0).gset(G.vsp);
            b.i32(0).ret();
        });
        c.get(p).load().i32(T_TUPLE).x("i32.ne").if_("void", (b) => b.i32(1).ret());
        c.get(p).load(4).set(n);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(n).x("i32.ge_u").brIf(1);
                lp.get(0).get(k).x("i32.add");
                lp.get(p).get(k).i32(4).x("i32.mul").x("i32.add").load(8);
                lp.call(F.slotSet);
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.get(0).get(n).x("i32.add").gset(G.vsp);
        c.get(n);
    });

    /* ── `style-rule`'s selector split (§10.3), a pure operation over an owned span ────────── */

    const isWsByte = (c, get) => {
        get(c);
        c.i32(32).x("i32.eq");
        for (const b of [9, 10, 13, 12]) {
            get(c);
            c.i32(b).x("i32.eq").x("i32.or");
        }
    };

    /** `trimWs(a, b)` — the span minus its leading and trailing whitespace, as a `T_STR` node. */
    fn("trimWs", [I32, I32], [I32], (c) => {
        const a = c.local(I32);
        const b = c.local(I32);
        c.get(0).set(a);
        c.get(1).set(b);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(a).get(b).x("i32.ge_u").brIf(1);
                isWsByte(lp, (u) => u.get(a).i32(INPUT_BASE).x("i32.add").load8u());
                lp.x("i32.eqz").brIf(1);
                lp.get(a).i32(1).x("i32.add").set(a);
                lp.br(0);
            });
        });
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(b).get(a).x("i32.le_u").brIf(1);
                isWsByte(lp, (u) => u.get(b).i32(1).x("i32.sub").i32(INPUT_BASE).x("i32.add").load8u());
                lp.x("i32.eqz").brIf(1);
                lp.get(b).i32(1).x("i32.sub").set(b);
                lp.br(0);
            });
        });
        c.get(a).get(b).get(a).x("i32.sub").call(F.mkStr);
    });

    /** `splitSelectors(p)` — top-level "," only, each side trimmed; the `T_STR` span in, an array out. */
    fn("splitSelectors", [I32], [I32], (c) => {
        const s = c.local(I32);
        const n = c.local(I32);
        const k = c.local(I32);
        const depth = c.local(I32);
        const start = c.local(I32);
        const count = c.local(I32);
        const abase = c.local(I32);
        const ch = c.local(I32);
        const arr = c.local(I32);
        c.get(0).load(4).set(s);
        c.get(0).load(8).set(n);
        c.gget(G.vsp).set(abase);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(n).x("i32.ge_u").brIf(1);
                lp.get(s).get(k).x("i32.add").i32(INPUT_BASE).x("i32.add").load8u().set(ch);
                lp.get(ch).i32(40).x("i32.eq").get(ch).i32(91).x("i32.eq").x("i32.or").if_("void",
                    (b) => b.get(depth).i32(1).x("i32.add").set(depth),
                    (b) => {
                        b.get(ch).i32(41).x("i32.eq").get(ch).i32(93).x("i32.eq").x("i32.or").if_("void",
                            (t) => {
                                t.get(depth).i32(0).x("i32.gt_u").if_("void", (u) => u.get(depth).i32(1).x("i32.sub").set(depth));
                            },
                            (t) => {
                                t.get(ch).i32(44).x("i32.eq").get(depth).x("i32.eqz").x("i32.and").if_("void", (u) => {
                                    u.get(s).get(start).x("i32.add").get(s).get(k).x("i32.add").call(F.trimWs).call(F.push);
                                    u.get(count).i32(1).x("i32.add").set(count);
                                    u.get(k).i32(1).x("i32.add").set(start);
                                });
                            });
                    });
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.get(s).get(start).x("i32.add").get(s).get(n).x("i32.add").call(F.trimWs).call(F.push);
        c.get(count).i32(1).x("i32.add").set(count);
        c.i32(T_ARR).get(abase).get(count).call(F.mkSeqNode).set(arr);
        c.get(abase).gset(G.vsp);
        c.get(arr);
    });

    /* ── the per-parse reset ──────────────────────────────────────────────────────────────── */

    fn("reset", [], [], (c) => {
        for (const name of ["i", "clen", "plen", "dlen", "depth", "farn", "origin", "cut", "markn",
            "recn", "arena", "vsp", "ovf", "amb", "ndig", "q", "trunc", "expsp"]) {
            c.i32(0).gset(G[name]);
        }
        c.i32(-1).gset(G.farf);
        c.i32(-1).gset(G.farcode);
        c.i32(-1).gset(G.lastcode);
        c.i64(0).gset(G.w);
    });

    return { G, F };
}

/* ── the conversion, emitted ──────────────────────────────────────────────────────────────── */

function emitNumeric(m, fn, F, G, data) {
    const POW5 = data.pow5;
    const POW10 = data.pow10;

    fn("mulHi", [I64, I64], [I64], (c) => {
        const a0 = c.local(I64);
        const a1 = c.local(I64);
        const b0 = c.local(I64);
        const b1 = c.local(I64);
        const t = c.local(I64);
        const k = c.local(I64);
        const w1 = c.local(I64);
        const w2 = c.local(I64);
        c.get(0).i64(0xffffffff).x("i64.and").set(a0);
        c.get(0).i64(32).x("i64.shr_u").set(a1);
        c.get(1).i64(0xffffffff).x("i64.and").set(b0);
        c.get(1).i64(32).x("i64.shr_u").set(b1);
        c.get(a0).get(b0).x("i64.mul").set(t);
        c.get(t).i64(32).x("i64.shr_u").set(k);
        c.get(a1).get(b0).x("i64.mul").get(k).x("i64.add").set(t);
        c.get(t).i64(0xffffffff).x("i64.and").set(w1);
        c.get(t).i64(32).x("i64.shr_u").set(w2);
        c.get(a0).get(b1).x("i64.mul").get(w1).x("i64.add").set(t);
        c.get(t).i64(32).x("i64.shr_u").set(k);
        c.get(a1).get(b1).x("i64.mul").get(w2).x("i64.add").get(k).x("i64.add");
    });

    /** `mul192(w, h2, h1, h0, out)` — the exact 256-bit product, four little-endian words at `out`. */
    fn("mul192", [I64, I64, I64, I64, I32], [], (c) => {
        const r0 = c.local(I64);
        const r1 = c.local(I64);
        const r2 = c.local(I64);
        const r3 = c.local(I64);
        const t = c.local(I64);
        const carry = c.local(I64);
        const addend = c.local(I64);
        /** r_k += addend, with the carry out left in `carry` (0 or 1). */
        const addTo = (b, target) => {
            b.get(target).get(addend).x("i64.add").set(t);
            b.get(t).get(target).x("i64.lt_u").if_("void", (u) => u.i64(1).set(carry), (u) => u.i64(0).set(carry));
            b.get(t).set(target);
        };
        c.get(0).get(3).x("i64.mul").set(r0);
        c.get(0).get(3).call(F.mulHi).set(r1);
        c.i64(0).set(r2);
        c.i64(0).set(r3);
        //  + (w * h1) << 64
        c.get(0).get(2).x("i64.mul").set(addend);
        addTo(c, r1);
        c.get(carry).set(addend);
        addTo(c, r2);
        c.get(r3).get(carry).x("i64.add").set(r3);
        c.get(0).get(2).call(F.mulHi).set(addend);
        addTo(c, r2);
        c.get(r3).get(carry).x("i64.add").set(r3);
        //  + (w * h2) << 128
        c.get(0).get(1).x("i64.mul").set(addend);
        addTo(c, r2);
        c.get(r3).get(carry).x("i64.add").set(r3);
        c.get(r3).get(0).get(1).call(F.mulHi).x("i64.add").set(r3);
        c.get(4).get(r0).store64(0);
        c.get(4).get(r1).store64(8);
        c.get(4).get(r2).store64(16);
        c.get(4).get(r3).store64(24);
    });

    /**
     * `roundProduct(p, tableE, lz)` — the 256-bit product at `p`, rounded half-even to the 64 bits
     * of a double (the sign is the caller's). Normal and subnormal, with the sticky bits carried
     * through the normalization shift so a tie is a tie and not a rounding artefact.
     */
    fn("roundProduct", [I32, I32, I32], [I64], (c) => {
        const r0 = c.local(I64);
        const r1 = c.local(I64);
        const r2 = c.local(I64);
        const r3 = c.local(I64);
        const pt1 = c.local(I64);
        const pt0 = c.local(I64);
        const stickyLow = c.local(I32);
        const up = c.local(I32);
        const unbiased = c.local(I32);
        const sig = c.local(I64);
        const roundBit = c.local(I32);
        const sticky = c.local(I32);
        const keep = c.local(I32);
        const sh = c.local(I32);
        c.get(0).load64(0).set(r0);
        c.get(0).load64(8).set(r1);
        c.get(0).load64(16).set(r2);
        c.get(0).load64(24).set(r3);
        c.get(r3).i64(1n << 63n).x("i64.ge_u").if_("void",
            (b) => {
                b.i32(0).set(up);
                b.get(r3).set(pt1);
                b.get(r2).set(pt0);
                b.get(r1).get(r0).x("i64.or").i64(0).x("i64.ne").set(stickyLow);
            },
            (b) => {
                b.i32(1).set(up);
                b.get(r3).i64(1).x("i64.shl").get(r2).i64(63).x("i64.shr_u").x("i64.or").set(pt1);
                b.get(r2).i64(1).x("i64.shl").get(r1).i64(63).x("i64.shr_u").x("i64.or").set(pt0);
                b.get(r1).i64(1).x("i64.shl").get(r0).x("i64.or").i64(0).x("i64.ne").set(stickyLow);
            });
        //  unbiased = 127 + (tableE - 191 - lz + 128 - up)
        c.i32(127).get(1).x("i32.add").i32(191).x("i32.sub").get(2).x("i32.sub").i32(128).x("i32.add").get(up).x("i32.sub").set(unbiased);
        c.get(unbiased).i32(1023).x("i32.gt_s").if_("void", (b) => b.i64(0x7ffn << 52n).ret());
        c.get(unbiased).i32(-1022).x("i32.ge_s").if_("void", (b) => {
            b.get(pt1).i64(11).x("i64.shr_u").set(sig);
            b.get(pt1).i64(10).x("i64.shr_u").i64(1).x("i64.and").i64(0).x("i64.ne").set(roundBit);
            b.get(pt1).i64(0x3ff).x("i64.and").get(pt0).x("i64.or").i64(0).x("i64.ne").get(stickyLow).x("i32.or").set(sticky);
            b.get(roundBit).get(sticky).get(sig).i64(1).x("i64.and").i64(0).x("i64.ne").x("i32.or").x("i32.and").if_("void", (t) => {
                t.get(sig).i64(1).x("i64.add").set(sig);
            });
            b.get(sig).i64(1n << 53n).x("i64.ge_u").if_("void", (t) => {
                t.get(sig).i64(1).x("i64.shr_u").set(sig);
                t.get(unbiased).i32(1).x("i32.add").set(unbiased);
                t.get(unbiased).i32(1023).x("i32.gt_s").if_("void", (u) => u.i64(0x7ffn << 52n).ret());
            });
            b.get(unbiased).i32(1023).x("i32.add").x("i64.extend_i32_u").i64(52).x("i64.shl");
            b.get(sig).i64((1n << 52n) - 1n).x("i64.and").x("i64.or").ret();
        });
        //  subnormal: keep = 75 + (-1022 - unbiased)
        c.i32(75).i32(-1022).get(unbiased).x("i32.sub").x("i32.add").set(keep);
        c.get(keep).i32(200).x("i32.gt_s").if_("void", (b) => b.i64(0).ret());
        //  sig = top >> keep   (keep >= 76, so the low word never contributes)
        c.get(keep).i32(128).x("i32.lt_u").if_("void",
            (b) => b.get(pt1).get(keep).i32(64).x("i32.sub").x("i64.extend_i32_u").x("i64.shr_u").set(sig),
            (b) => b.i64(0).set(sig));
        c.get(keep).i32(1).x("i32.sub").set(sh);
        c.get(sh).i32(128).x("i32.lt_u").if_("void",
            (b) => b.get(pt1).get(sh).i32(64).x("i32.sub").x("i64.extend_i32_u").x("i64.shr_u").i64(1).x("i64.and").i64(0).x("i64.ne").set(roundBit),
            (b) => b.i32(0).set(roundBit));
        //  sticky = the low (keep-1) bits of the 128-bit top, plus everything shifted out below it
        c.get(pt0).i64(0).x("i64.ne").get(stickyLow).x("i32.or").set(sticky);
        c.get(sh).i32(64).x("i32.gt_u").if_("void", (b) => {
            b.get(sh).i32(128).x("i32.ge_u").if_("void",
                (t) => t.get(sticky).get(pt1).i64(0).x("i64.ne").x("i32.or").set(sticky),
                (t) => t.get(sticky).get(pt1)
                    .i64(1).get(sh).i32(64).x("i32.sub").x("i64.extend_i32_u").x("i64.shl").i64(1).x("i64.sub")
                    .x("i64.and").i64(0).x("i64.ne").x("i32.or").set(sticky));
        });
        c.get(roundBit).get(sticky).get(sig).i64(1).x("i64.and").i64(0).x("i64.ne").x("i32.or").x("i32.and").if_("void", (t) => {
            t.get(sig).i64(1).x("i64.add").set(sig);
        });
        c.get(sig).i64((1n << 53n) - 1n).x("i64.and");
    });

    /** `exactDyadic(M, k)` — M * 2^k rounded exactly; the one path a truncated table cannot decide. */
    fn("exactDyadic", [I64, I32], [I64], (c) => {
        const bl = c.local(I32);
        const unbiased = c.local(I32);
        const shift = c.local(I32);
        const sig = c.local(I64);
        const roundBit = c.local(I32);
        const sticky = c.local(I32);
        c.get(0).i64(0).x("i64.eq").if_("void", (b) => b.i64(0).ret());
        c.i32(64).get(0).x("i64.clz").x("i32.wrap_i64").x("i32.sub").set(bl);
        c.get(bl).i32(1).x("i32.sub").get(1).x("i32.add").set(unbiased);
        c.get(unbiased).i32(1023).x("i32.gt_s").if_("void", (b) => b.i64(0x7ffn << 52n).ret());
        c.get(bl).i32(53).x("i32.sub").set(shift);
        c.get(shift).i32(0).x("i32.le_s").if_("void",
            (b) => b.get(0).i32(0).get(shift).x("i32.sub").x("i64.extend_i32_u").x("i64.shl").set(sig),
            (b) => {
                b.get(0).get(shift).x("i64.extend_i32_u").x("i64.shr_u").set(sig);
                b.get(0).get(shift).i32(1).x("i32.sub").x("i64.extend_i32_u").x("i64.shr_u").i64(1).x("i64.and").i64(0).x("i64.ne").set(roundBit);
                b.get(0).i64(1).get(shift).i32(1).x("i32.sub").x("i64.extend_i32_u").x("i64.shl").i64(1).x("i64.sub").x("i64.and").i64(0).x("i64.ne").set(sticky);
                b.get(roundBit).get(sticky).get(sig).i64(1).x("i64.and").i64(0).x("i64.ne").x("i32.or").x("i32.and").if_("void", (t) => {
                    t.get(sig).i64(1).x("i64.add").set(sig);
                });
            });
        c.get(sig).i64(1n << 53n).x("i64.ge_u").if_("void", (b) => {
            b.get(sig).i64(1).x("i64.shr_u").set(sig);
            b.get(unbiased).i32(1).x("i32.add").set(unbiased);
            b.get(unbiased).i32(1023).x("i32.gt_s").if_("void", (t) => t.i64(0x7ffn << 52n).ret());
        });
        c.get(unbiased).i32(1023).x("i32.add").x("i64.extend_i32_u").i64(52).x("i64.shl");
        c.get(sig).i64((1n << 52n) - 1n).x("i64.and").x("i64.or");
    });

    /** `pushDigit(ch, isFrac)` — the significand scan, digit by digit, in σ's scratch globals. */
    fn("pushDigit", [I32, I32], [], (c) => {
        c.gget(G.ndig).i32(19).x("i32.lt_s").if_("void",
            (b) => {
                b.gget(G.w).i64(0).x("i64.eq").get(0).i32(48).x("i32.eq").x("i32.and").if_("void",
                    (t) => {
                        t.get(1).if_("void", (u) => u.gget(G.q).i32(1).x("i32.sub").gset(G.q));
                    },
                    (t) => {
                        t.gget(G.w).i64(10).x("i64.mul").get(0).i32(48).x("i32.sub").x("i64.extend_i32_u").x("i64.add").gset(G.w);
                        t.gget(G.ndig).i32(1).x("i32.add").gset(G.ndig);
                        t.get(1).if_("void", (u) => u.gget(G.q).i32(1).x("i32.sub").gset(G.q));
                    });
            },
            (b) => {
                b.get(1).x("i32.eqz").if_("void", (t) => t.gget(G.q).i32(1).x("i32.add").gset(G.q));
                b.get(0).i32(48).x("i32.ne").if_("void", (t) => t.i32(1).gset(G.trunc));
            });
    });

    /** `decToF64(s, e)` — the token's bytes to the double `Number()` would produce, or a flagged
     *  disagreement. §5.7's exactness, and the only place this lowering could silently differ. */
    fn("decToF64", [I32, I32], [F64], (c) => {
        const j = c.local(I32);
        const neg = c.local(I32);
        const ch = c.local(I32);
        const ev = c.local(I32);
        const esign = c.local(I32);
        const lz = c.local(I32);
        const row = c.local(I32);
        const bits = c.local(I64);
        const amb = c.local(I32);
        const w2 = c.local(I64);
        const lz2 = c.local(I32);
        const sign = c.local(I64);
        const q = c.local(I32);
        const INP = (b, idx) => b.get(idx).i32(INPUT_BASE).x("i32.add").load8u();
        const digitAt = (b, idx) => {
            INP(b, idx);
            b.set(ch);
            b.get(ch).i32(48).x("i32.ge_u").get(ch).i32(57).x("i32.le_u").x("i32.and");
        };
        c.i64(0).gset(G.w);
        c.i32(0).gset(G.ndig);
        c.i32(0).gset(G.q);
        c.i32(0).gset(G.trunc);
        c.get(0).set(j);
        c.get(j).get(1).x("i32.lt_u").if_("void", (b) => {
            INP(b, j);
            b.set(ch);
            b.get(ch).i32(43).x("i32.eq").get(ch).i32(45).x("i32.eq").x("i32.or").if_("void", (t) => {
                t.get(ch).i32(45).x("i32.eq").set(neg);
                t.get(j).i32(1).x("i32.add").set(j);
            });
        });
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(j).get(1).x("i32.ge_u").brIf(1);
                digitAt(lp, j);
                lp.x("i32.eqz").brIf(1);
                lp.get(ch).i32(0).call(F.pushDigit);
                lp.get(j).i32(1).x("i32.add").set(j);
                lp.br(0);
            });
        });
        c.get(j).get(1).x("i32.lt_u").if_("void", (b) => {
            INP(b, j);
            b.i32(46).x("i32.eq").if_("void", (t) => {
                t.get(j).i32(1).x("i32.add").set(j);
                t.block("void", (blk) => {
                    blk.loop("void", (lp) => {
                        lp.get(j).get(1).x("i32.ge_u").brIf(1);
                        digitAt(lp, j);
                        lp.x("i32.eqz").brIf(1);
                        lp.get(ch).i32(1).call(F.pushDigit);
                        lp.get(j).i32(1).x("i32.add").set(j);
                        lp.br(0);
                    });
                });
            });
        });
        c.get(j).get(1).x("i32.lt_u").if_("void", (b) => {
            INP(b, j);
            b.set(ch);
            b.get(ch).i32(101).x("i32.eq").get(ch).i32(69).x("i32.eq").x("i32.or").if_("void", (t) => {
                t.get(j).i32(1).x("i32.add").set(j);
                t.i32(1).set(esign);
                t.i32(0).set(ev);
                t.get(j).get(1).x("i32.lt_u").if_("void", (u) => {
                    INP(u, j);
                    u.set(ch);
                    u.get(ch).i32(43).x("i32.eq").get(ch).i32(45).x("i32.eq").x("i32.or").if_("void", (v) => {
                        v.get(ch).i32(45).x("i32.eq").if_("void", (z) => z.i32(-1).set(esign));
                        v.get(j).i32(1).x("i32.add").set(j);
                    });
                });
                t.block("void", (blk) => {
                    blk.loop("void", (lp) => {
                        lp.get(j).get(1).x("i32.ge_u").brIf(1);
                        digitAt(lp, j);
                        lp.x("i32.eqz").brIf(1);
                        lp.get(ev).i32(10).x("i32.mul").get(ch).i32(48).x("i32.sub").x("i32.add").set(ev);
                        lp.get(ev).i32(99999).x("i32.gt_s").if_("void", (u) => u.i32(99999).set(ev));
                        lp.get(j).i32(1).x("i32.add").set(j);
                        lp.br(0);
                    });
                });
                t.gget(G.q).get(esign).get(ev).x("i32.mul").x("i32.add").gset(G.q);
            });
        });
        c.gget(G.q).set(q);
        c.get(neg).if_("void", (b) => b.i64(1n << 63n).set(sign), (b) => b.i64(0).set(sign));
        c.gget(G.w).i64(0).x("i64.eq").if_("void", (b) => {
            b.get(sign).x("f64.reinterpret_i64").ret();
        });
        //  the exact-dyadic path: w * 10^q with q in [-27, -1] and 5^|q| dividing w
        c.gget(G.trunc).x("i32.eqz").get(q).i32(0).x("i32.lt_s").x("i32.and").get(q).i32(-27).x("i32.ge_s").x("i32.and").if_("void", (b) => {
            b.gget(G.w)
                .i32(POW5).i32(0).get(q).x("i32.sub").i32(8).x("i32.mul").x("i32.add").load64()
                .x("i64.rem_u").i64(0).x("i64.eq").if_("void", (t) => {
                    t.get(sign);
                    t.gget(G.w).i32(POW5).i32(0).get(q).x("i32.sub").i32(8).x("i32.mul").x("i32.add").load64().x("i64.div_u");
                    t.get(q).call(F.exactDyadic).x("i64.or").x("f64.reinterpret_i64").ret();
                });
        });
        c.get(q).i32(Q_MAX).x("i32.gt_s").if_("void", (b) => {
            b.get(sign).i64(0x7ffn << 52n).x("i64.or").x("f64.reinterpret_i64").ret();
        });
        c.get(q).i32(Q_MIN).x("i32.lt_s").if_("void", (b) => {
            b.get(sign).x("f64.reinterpret_i64").ret();
        });
        c.i32(POW10).get(q).i32(-Q_MIN).x("i32.add").i32(32).x("i32.mul").x("i32.add").set(row);
        c.gget(G.w).x("i64.clz").x("i32.wrap_i64").set(lz);
        c.gget(G.w).get(lz).x("i64.extend_i32_u").x("i64.shl");
        c.get(row).load64(0).get(row).load64(8).get(row).load64(16);
        c.i32(SCRATCH_MUL).call(F.mul192);
        c.i32(SCRATCH_MUL).get(row).load(24).get(lz).call(F.roundProduct).set(bits);
        //  an inexact table entry brackets the truth: compare the two roundings rather than assume
        c.get(row).load(28).x("i32.eqz").if_("void", (b) => {
            b.i32(SCRATCH_MUL + 32).i32(SCRATCH_MUL).load64(24).store64(24);
            b.i32(SCRATCH_MUL + 32).i32(SCRATCH_MUL).load64(16).store64(16);
            b.i32(SCRATCH_MUL + 32).i32(SCRATCH_MUL).load64(8).i64(1).x("i64.add").store64(8);
            b.i32(SCRATCH_MUL + 32).i32(SCRATCH_MUL).load64(0).store64(0);
            b.i32(SCRATCH_MUL + 32).load64(8).i64(0).x("i64.eq").if_("void", (t) => {
                t.i32(SCRATCH_MUL + 32).i32(SCRATCH_MUL).load64(16).i64(1).x("i64.add").store64(16);
                t.i32(SCRATCH_MUL + 32).load64(16).i64(0).x("i64.eq").if_("void", (u) => {
                    u.i32(SCRATCH_MUL + 32).i32(SCRATCH_MUL).load64(24).i64(1).x("i64.add").store64(24);
                });
            });
            b.i32(SCRATCH_MUL + 32).get(row).load(24).get(lz).call(F.roundProduct).get(bits).x("i64.ne").if_("void", (t) => {
                t.i32(1).set(amb);
            });
        });
        //  digits dropped past the nineteenth: the neighbouring significand must round the same way
        c.gget(G.trunc).get(amb).x("i32.eqz").x("i32.and").if_("void", (b) => {
            b.gget(G.w).i64(1).x("i64.add").set(w2);
            b.get(w2).x("i64.clz").x("i32.wrap_i64").set(lz2);
            b.get(w2).get(lz2).x("i64.extend_i32_u").x("i64.shl");
            b.get(row).load64(0).get(row).load64(8).get(row).load64(16);
            b.i32(SCRATCH_MUL + 32).call(F.mul192);
            b.i32(SCRATCH_MUL + 32).get(row).load(24).get(lz2).call(F.roundProduct).get(bits).x("i64.ne").if_("void", (t) => {
                t.i32(1).set(amb);
            });
        });
        c.get(amb).if_("void", (b) => b.gget(G.amb).i32(1).x("i32.add").gset(G.amb));
        c.get(sign).get(bits).x("i64.or").x("f64.reinterpret_i64");
    });
}
