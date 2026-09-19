// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · LOWERING-WASM, THE SIGNATURE INSTANTIATED AS AN EMITTER.
//
// `wasmAlgebra(env)` answers the same twenty-two operations `jsAlgebra` answers, except that every
// operation ASSEMBLES A FUNCTION instead of closing over one. `buildGrammar(A)` is called with this
// `A` and never knows: a term's value here is a Wasm function index, and the grammar map is a map of
// indices. That is the candidate's whole claim, made concrete — the grammar file is authored once,
// against the signature, and the two lowerings are two instantiations of it.
//
// Every emitted term function has the type `() -> i32`: 1 for success with exactly one value pushed
// onto the value stack, 0 for failure with the stack left where it was. σ is the module's globals;
// `far` is the only thing a failure leaves behind (§5.6).

import { AT_DECLARATION_KINDS } from "../algebra/tables.mjs";
import { OPERATORS, SEPARATORS } from "../algebra/grammar/value.mjs";
import { CODES, KINDS } from "../algebra/ops.mjs";
import {
    JUMP_POSITIONS, KEYFRAME_PHASES, RANGE_PHASES, R_cls, R_ctor, R_disp, R_kw, SCROLLER_KEYWORDS,
    STEP_ALIASES, TIMELINE_AXES, TIMELINE_MODES, TIMING_KEYWORDS, labelIndex,
} from "../algebra/tables.mjs";
import { F64, I32 } from "./asm.mjs";
import {
    ARENA_BASE, DLAB_MAX, EXPSNAP_BASE, EXPSNAP_CAP, EXPSNAP_STRIDE, FARLAB_BASE, FARLAB_CAP,
    INPUT_BASE, T_ARR, T_LIST, T_NUM, T_SPAN, T_STR, T_STRB, T_TUPLE,
} from "./layout.mjs";
import { SCRATCH_LAB } from "./runtime.mjs";

const INF32 = 0x7fffffff;
const codeIndex = (code) => {
    const k = CODES.indexOf(code);
    if (k < 0) throw new Error(`HALT: '${code}' is not one of the eight frozen codes`);
    return k;
};
const kindIndex = (kind) => {
    const k = KINDS.indexOf(kind);
    if (k < 0) throw new Error(`HALT: '${kind}' is not one of K_C (§4.5)`);
    return k;
};

export function wasmAlgebra(env) {
    const { m, data, G, F, consts } = env;
    let seq = 0;
    const fn = (name, body) => {
        const idx = m.declare(`${name}#${seq++}`, [], [I32]);
        m.define(idx, body);
        return idx;
    };
    const site = (name) => {
        const k = env.sites.indexOf(name);
        if (k >= 0) return k;
        env.sites.push(name);
        return env.sites.length - 1;
    };

    /* ── the shapes every operation is built from ─────────────────────────────────────────── */

    /** σ's mark, in six locals: the five reported coordinates and the arena's real byte cursor. */
    const markLocals = (c) => ({
        m0: c.local(I32), m1: c.local(I32), m2: c.local(I32), m3: c.local(I32), m4: c.local(I32),
        ma: c.local(I32), vb: c.local(I32),
    });
    const take = (c, L) => {
        c.gget(G.i).set(L.m0);
        c.gget(G.clen).set(L.m1);
        c.gget(G.plen).set(L.m2);
        c.gget(G.dlen).set(L.m3);
        c.gget(G.depth).set(L.m4);
        c.gget(G.arena).set(L.ma);
        c.gget(G.vsp).set(L.vb);
    };
    const restore = (c, L) => {
        c.get(L.m0).gset(G.i);
        c.get(L.m1).gset(G.clen);
        c.get(L.m2).gset(G.plen);
        c.get(L.m3).gset(G.dlen);
        c.get(L.m4).gset(G.depth);
        c.get(L.ma).gset(G.arena);
        c.get(L.vb).gset(G.vsp);
    };
    const record = (c, L, name) => {
        c.i32(site(name)).get(L.m0).get(L.m1).get(L.m2).get(L.m3).get(L.m4).call(F.appendMark);
    };
    const pushConst = (c, ptr) => c.i32(ptr).call(F.push);
    const arg = (c, base, k) => c.get(base).i32(k).x("i32.add").call(F.slotGet);
    /** A node's f64 payload (`T_NUM` only) and its tag. */
    const tagOf = (c, emitPtr) => {
        emitPtr(c);
        c.load();
    };

    /* ── the twenty-two ───────────────────────────────────────────────────────────────────── */

    const A = {
        SCAN(clsName, min, max) {
            const tbl = env.classTable(clsName);
            const label = labelIndex(R_cls[clsName].label);
            const hi = max === Infinity ? INF32 : max;
            return fn(`SCAN:${clsName}`, (c) => {
                const from = c.local(I32);
                const end = c.local(I32);
                c.gget(G.i).set(from);
                c.i32(tbl).call(F.scanRun).set(end);
                c.get(end).get(from).x("i32.sub").i32(min).x("i32.lt_u")
                    .get(end).get(from).x("i32.sub").i32(hi).x("i32.gt_u").x("i32.or")
                    .if_("void", (b) => {
                        b.get(from).i32(codeIndex("css_syntax")).i32(label).call(F.fail).ret();
                    });
                c.get(end).gset(G.i);
                c.get(from).get(end).call(F.mkSpan).call(F.push);
                c.i32(1);
            });
        },

        LIT(bytes) {
            const ptr = env.literal(bytes);
            const len = bytes.length;
            const label = labelIndex(`'${bytes}'`);
            return fn(`LIT:${bytes}`, (c) => {
                const from = c.local(I32);
                c.gget(G.i).set(from);
                c.i32(ptr).i32(len).call(F.litMatch).x("i32.eqz").if_("void", (b) => {
                    b.get(from).i32(codeIndex("css_syntax")).i32(label).call(F.fail).ret();
                });
                c.get(from).i32(len).x("i32.add").gset(G.i);
                c.get(from).get(from).i32(len).x("i32.add").call(F.mkSpan).call(F.push);
                c.i32(1);
            });
        },

        NUM() {
            const label = labelIndex("<number>");
            return fn("NUM", (c) => {
                const from = c.local(I32);
                const end = c.local(I32);
                c.gget(G.i).set(from);
                c.call(F.numToken).set(end);
                c.get(end).i32(0).x("i32.lt_s").if_("void", (b) => {
                    b.get(from).i32(codeIndex("css_syntax")).i32(label).call(F.fail).ret();
                });
                c.get(from).get(end).call(F.appendP);
                c.get(end).gset(G.i);
                c.get(from).get(end).call(F.decToF64).call(F.mkNum).call(F.push);
                c.i32(1);
            });
        },

        DIGITS(radix, n) {
            const clsName = radix === 16 ? "hexdigit" : "digit";
            const tbl = env.classTable(clsName);
            const label = labelIndex(R_cls[clsName].label);
            return fn(`DIGITS:${radix}:${n}`, (c) => {
                const from = c.local(I32);
                const j = c.local(I32);
                const v = c.local(I32);
                const b = c.local(I32);
                c.gget(G.i).set(from);
                c.get(from).set(j);
                c.block("void", (blk) => {
                    blk.loop("void", (lp) => {
                        lp.get(j).get(from).i32(n).x("i32.add").x("i32.ge_u").brIf(1);
                        lp.get(j).gget(G.srclen).x("i32.ge_u").brIf(1);
                        lp.i32(tbl).get(j).i32(INPUT_BASE).x("i32.add").load8u().x("i32.add").load8u().x("i32.eqz").brIf(1);
                        lp.get(j).i32(1).x("i32.add").set(j);
                        lp.br(0);
                    });
                });
                c.get(j).get(from).x("i32.sub").i32(n).x("i32.ne").if_("void", (t) => {
                    t.get(from).i32(codeIndex("css_syntax")).i32(label).call(F.fail).ret();
                });
                c.get(from).get(j).call(F.appendP);
                c.get(j).gset(G.i);
                //  the digits' value, one radix step per byte (the class has already admitted them)
                c.i32(0).set(v);
                c.get(from).set(j);
                c.block("void", (blk) => {
                    blk.loop("void", (lp) => {
                        lp.get(j).gget(G.i).x("i32.ge_u").brIf(1);
                        lp.get(j).i32(INPUT_BASE).x("i32.add").load8u().set(b);
                        lp.get(b).i32(57).x("i32.gt_u").if_("void",
                            (t) => {
                                t.get(b).i32(97).x("i32.ge_u").if_("void",
                                    (u) => u.get(b).i32(87).x("i32.sub").set(b),
                                    (u) => u.get(b).i32(55).x("i32.sub").set(b));
                            },
                            (t) => t.get(b).i32(48).x("i32.sub").set(b));
                        lp.get(v).i32(radix).x("i32.mul").get(b).x("i32.add").set(v);
                        lp.get(j).i32(1).x("i32.add").set(j);
                        lp.br(0);
                    });
                });
                c.get(v).x("f64.convert_i32_u").call(F.mkNum).call(F.push);
                c.i32(1);
            });
        },

        TEXT(clsName, min, max) {
            const tbl = env.classTable(clsName);
            const label = labelIndex(R_cls[clsName].label);
            const hi = max === Infinity ? INF32 : max;
            return fn(`TEXT:${clsName}`, (c) => {
                const from = c.local(I32);
                const end = c.local(I32);
                c.gget(G.i).set(from);
                c.i32(tbl).call(F.scanRun).set(end);
                c.get(end).get(from).x("i32.sub").i32(min).x("i32.lt_u")
                    .get(end).get(from).x("i32.sub").i32(hi).x("i32.gt_u").x("i32.or")
                    .if_("void", (b) => {
                        b.get(from).i32(codeIndex("css_syntax")).i32(label).call(F.fail).ret();
                    });
                c.get(from).get(end).call(F.appendP);
                c.get(end).gset(G.i);
                c.get(from).get(end).get(from).x("i32.sub").call(F.mkStr).call(F.push);
                c.i32(1);
            });
        },

        KW(clsName, tableName) {
            const tbl = env.classTable(clsName);
            const blob = env.kwBlob(tableName);
            const kw = R_kw[tableName];
            const label = labelIndex(kw.label);
            const code = codeIndex(kw.code);
            return fn(`KW:${tableName}`, (c) => {
                const from = c.local(I32);
                const end = c.local(I32);
                const row = c.local(I32);
                c.gget(G.i).set(from);
                c.i32(tbl).call(F.scanRun).set(end);
                c.get(end).get(from).x("i32.eq").if_("void", (b) => {
                    b.get(from).i32(code).i32(label).call(F.fail).ret();
                });
                c.i32(blob).get(from).get(end).call(F.kwLookup).set(row);
                c.get(row).i32(0).x("i32.lt_s").if_("void", (b) => {
                    b.get(from).i32(code).i32(label).call(F.fail).ret();
                });
                c.get(from).get(end).call(F.appendP);
                c.get(end).gset(G.i);
                c.get(row).load().call(F.push); //               the row's pre-built value node
                c.i32(1);
            });
        },

        END() {
            const label = labelIndex("end of input");
            return fn("END", (c) => {
                c.gget(G.i).gget(G.srclen).x("i32.ne").if_("void", (b) => {
                    b.gget(G.i).i32(codeIndex("trailing_input")).i32(label).call(F.fail).ret();
                });
                pushConst(c, consts.UNIT);
                c.i32(1);
            });
        },

        SEQ(...ops) {
            return fn("SEQ", (c) => {
                const base = c.local(I32);
                c.gget(G.vsp).set(base);
                for (const op of ops) {
                    c.call(op).x("i32.eqz").if_("void", (b) => {
                        b.get(base).gset(G.vsp);
                        b.i32(0).ret();
                    });
                }
                c.get(base).i32(consts.UNIT).call(F.seqFinish);
                c.i32(1);
            });
        },

        ALT(...ops) {
            return fn("ALT", (c) => {
                const L = markLocals(c);
                const saved = c.local(I32);
                const maxOrigin = c.local(I32);
                c.i32(-1).set(maxOrigin);
                ops.forEach((op, k) => {
                    take(c, L);
                    c.gget(G.cut).set(saved);
                    c.i32(0).gset(G.cut);
                    c.call(op).if_("void", (b) => {
                        b.get(saved).gset(G.cut);
                        b.i32(1).ret();
                    });
                    c.get(L.vb).gset(G.vsp);
                    c.gget(G.cut).if_("void", (b) => {
                        //  a committed arm propagates WITHOUT restoring σ (§5.2)
                        b.get(saved).gset(G.cut);
                        b.i32(0).ret();
                    });
                    c.gget(G.origin).get(maxOrigin).x("i32.gt_s").if_("void", (b) => {
                        b.gget(G.origin).set(maxOrigin);
                    });
                    restore(c, L);
                    record(c, L, `ALT[${k}]`);
                    c.get(saved).gset(G.cut);
                });
                c.get(maxOrigin).gset(G.origin);
                c.i32(0);
            });
        },

        CUT() {
            return fn("CUT", (c) => {
                c.i32(1).gset(G.cut);
                pushConst(c, consts.UNIT);
                c.i32(1);
            });
        },

        PURE(lit) {
            const ptr = env.constNode(lit);
            return fn(`PURE:${String(lit)}`, (c) => {
                pushConst(c, ptr);
                c.i32(1);
            });
        },

        REP(op, min, max, sep) {
            const hi = max === Infinity ? INF32 : max;
            return fn("REP", (c) => {
                const L = markLocals(c);
                const base = c.local(I32);
                const count = c.local(I32);
                const lastOrigin = c.local(I32);
                const before = c.local(I32);
                const list = c.local(I32);
                c.gget(G.vsp).set(base);
                c.i32(-1).set(lastOrigin);
                c.block("void", (blk) => {
                    blk.loop("void", (lp) => {
                        lp.get(count).i32(hi).x("i32.ge_u").brIf(1);
                        take(lp, L);
                        if (sep) {
                            lp.get(count).i32(0).x("i32.gt_u").if_("void", (b) => {
                                b.call(sep).x("i32.eqz").if_("void", (t) => {
                                    t.gget(G.origin).set(lastOrigin);
                                    restore(t, L);
                                    record(t, L, "REP.sep");
                                    t.br(3);
                                });
                                b.get(L.vb).gset(G.vsp); //      the separator's value is not an item
                            });
                        }
                        lp.gget(G.i).set(before);
                        lp.call(op).x("i32.eqz").if_("void", (b) => {
                            b.gget(G.origin).set(lastOrigin);
                            restore(b, L);
                            record(b, L, "REP.item");
                            b.br(2);
                        });
                        lp.gget(G.i).get(before).x("i32.eq").if_("void", (b) => {
                            //  the progress law: a zero-width iteration is discarded and the loop stops
                            restore(b, L);
                            record(b, L, "REP.zero");
                            b.br(2);
                        });
                        lp.get(count).i32(1).x("i32.add").set(count);
                        lp.br(0);
                    });
                });
                c.get(count).i32(min).x("i32.lt_u").if_("void", (b) => {
                    b.get(lastOrigin).i32(0).x("i32.lt_s").if_("void",
                        (t) => t.gget(G.i).gset(G.origin),
                        (t) => t.get(lastOrigin).gset(G.origin));
                    b.get(base).gset(G.vsp);
                    b.i32(0).ret();
                });
                c.i32(T_LIST).get(base).get(count).call(F.mkSeqNode).set(list);
                c.get(base).gset(G.vsp);
                c.get(list).call(F.push);
                c.i32(1);
            });
        },

        DROP(kind, op) {
            const k = kindIndex(kind);
            return fn(`DROP:${kind}`, (c) => {
                const p = c.local(I32);
                const s = c.local(I32);
                const e = c.local(I32);
                c.call(op).x("i32.eqz").if_("void", (b) => b.i32(0).ret());
                c.gget(G.vsp).i32(1).x("i32.sub").gset(G.vsp);
                c.gget(G.vsp).call(F.slotGet).set(p);
                c.get(p).load(4).set(s);
                c.get(p).load(8).set(e);
                c.get(e).get(s).x("i32.gt_u").if_("void", (b) => {
                    b.get(s).get(e).get(s).x("i32.sub").i32(k).call(F.appendC);
                });
                pushConst(c, consts.UNIT);
                c.i32(1);
            });
        },

        DISPATCH(clsName, tableName) {
            const tbl = env.classTable(clsName);
            const disp = R_disp[tableName];
            const label = labelIndex(disp.label);
            const code = codeIndex(disp.code);
            const rowNames = [...new Set(Object.values(disp.rows))];
            const blob = env.dispBlob(tableName, rowNames);
            const idx = m.declare(`DISPATCH:${tableName}`, [], [I32]);
            env.deferred.push(() =>
                m.define(idx, (c) => {
                    const from = c.local(I32);
                    const end = c.local(I32);
                    const row = c.local(I32);
                    c.gget(G.i).set(from);
                    c.i32(tbl).call(F.scanRun).set(end);
                    c.get(end).get(from).x("i32.eq").if_("void", (b) => {
                        b.get(from).i32(code).i32(label).call(F.fail).ret();
                    });
                    c.i32(blob).get(from).get(end).call(F.kwLookup).set(row);
                    c.get(row).i32(0).x("i32.lt_s").if_("void", (b) => {
                        b.get(from).i32(code).i32(label).call(F.fail).ret();
                    });
                    c.get(from).get(end).call(F.appendP);
                    c.get(end).gset(G.i);
                    c.get(row).load8u().set(row);
                    rowNames.forEach((name, k) => {
                        c.get(row).i32(k).x("i32.eq").if_("void", (b) => {
                            const to = env.dispatchIndex[name];
                            if (to === undefined) throw new Error(`HALT: R_disp names '${name}', which the grammar does not define`);
                            b.call(to).ret();
                        });
                    });
                    c.i32(0);
                }));
            return idx;
        },

        FAIL(code, ...labels) {
            const ci = codeIndex(code);
            const idx = labels.map(labelIndex);
            return fn("FAIL", (c) => {
                for (const l of idx) c.gget(G.i).i32(ci).i32(l).call(F.raise);
                c.i32(0);
            });
        },

        EXPECT(op, ...labels) {
            const idx = labels.map(labelIndex);
            return fn("EXPECT", (c) => {
                const i0 = c.local(I32);
                const frame = c.local(I32);
                const k = c.local(I32);
                const code = c.local(I32);
                //  save `far` whole: a failure inside the body may move it, and §5.6 puts it back
                c.gget(G.expsp).i32(EXPSNAP_CAP).x("i32.ge_u").if_("void", (b) => b.i32(1).gset(G.ovf));
                c.gget(G.expsp).i32(EXPSNAP_STRIDE).x("i32.mul").i32(EXPSNAP_BASE).x("i32.add").set(frame);
                c.get(frame).gget(G.farf).store();
                c.get(frame).gget(G.farcode).store(4);
                c.get(frame).gget(G.farn).store(8);
                c.block("void", (blk) => {
                    blk.loop("void", (lp) => {
                        lp.get(k).gget(G.farn).x("i32.ge_u").brIf(1);
                        lp.get(frame).get(k).i32(4).x("i32.mul").x("i32.add");
                        lp.i32(FARLAB_BASE).get(k).i32(4).x("i32.mul").x("i32.add").load();
                        lp.store(12);
                        lp.get(k).i32(1).x("i32.add").set(k);
                        lp.br(0);
                    });
                });
                c.gget(G.expsp).i32(1).x("i32.add").gset(G.expsp);
                c.gget(G.i).set(i0);
                c.call(op).if_("void", (b) => {
                    b.gget(G.expsp).i32(1).x("i32.sub").gset(G.expsp);
                    b.i32(1).ret();
                });
                c.gget(G.expsp).i32(1).x("i32.sub").gset(G.expsp);
                c.gget(G.origin).get(i0).x("i32.ne").if_("void", (b) => b.i32(0).ret());
                c.gget(G.lastcode).set(code);
                //  σ.far := the saved far, then this site's own labels at i0
                c.get(frame).load().gset(G.farf);
                c.get(frame).load(4).gset(G.farcode);
                c.get(frame).load(8).gset(G.farn);
                c.i32(0).set(k);
                c.block("void", (blk) => {
                    blk.loop("void", (lp) => {
                        lp.get(k).gget(G.farn).x("i32.ge_u").brIf(1);
                        lp.i32(FARLAB_BASE).get(k).i32(4).x("i32.mul").x("i32.add");
                        lp.get(frame).get(k).i32(4).x("i32.mul").x("i32.add").load(12);
                        lp.store();
                        lp.get(k).i32(1).x("i32.add").set(k);
                        lp.br(0);
                    });
                });
                for (const l of idx) c.get(i0).get(code).i32(l).call(F.raise);
                c.i32(0);
            });
        },

        CLAMP(lo, hi, op) {
            return fn("CLAMP", (c) => {
                const p = c.local(I32);
                c.call(op).x("i32.eqz").if_("void", (b) => b.i32(0).ret());
                c.gget(G.vsp).i32(1).x("i32.sub").call(F.slotGet).set(p);
                c.get(p).load().i32(T_NUM).x("i32.eq").if_("void", (b) => {
                    b.get(p).loadf64(8).f64(lo).x("f64.max").f64(hi).x("f64.min").call(F.mkNum).set(p);
                    b.gget(G.vsp).i32(1).x("i32.sub").get(p).call(F.slotSet);
                });
                c.i32(1);
            });
        },

        SCALE(num, den, op) {
            return fn("SCALE", (c) => {
                const p = c.local(I32);
                c.call(op).x("i32.eqz").if_("void", (b) => b.i32(0).ret());
                c.gget(G.vsp).i32(1).x("i32.sub").call(F.slotGet).set(p);
                c.get(p).load().i32(T_NUM).x("i32.eq").if_("void", (b) => {
                    b.get(p).loadf64(8).f64(num).x("f64.mul").f64(den).x("f64.div").call(F.mkNum).set(p);
                    b.gget(G.vsp).i32(1).x("i32.sub").get(p).call(F.slotSet);
                });
                c.i32(1);
            });
        },

        CTOR(rowName, ...ops) {
            const row = R_ctor[rowName];
            const build = env.ctorFn(rowName);
            const labels = row.labels.map(labelIndex);
            const code = codeIndex(row.code);
            return fn(`CTOR:${rowName}`, (c) => {
                const base = c.local(I32);
                const count = c.local(I32);
                const p = c.local(I32);
                c.gget(G.vsp).set(base);
                for (const op of ops) {
                    c.call(op).x("i32.eqz").if_("void", (b) => {
                        b.get(base).gset(G.vsp);
                        b.i32(0).ret();
                    });
                }
                c.get(base).i32(consts.UNIT).call(F.seqFinish);
                c.get(base).i32(consts.UNIT).call(F.ctorArgs).set(count);
                c.get(base).get(count).call(build).set(p);
                c.get(base).gset(G.vsp);
                c.get(p).x("i32.eqz").if_("void", (b) => {
                    for (const l of labels) b.gget(G.i).i32(code).i32(l).call(F.raise);
                    b.i32(0).ret();
                });
                c.get(p).call(F.push);
                c.i32(1);
            });
        },

        TRY(op) {
            return fn("TRY", (c) => {
                const L = markLocals(c);
                take(c, L);
                c.call(op).if_("void", (b) => b.i32(1).ret());
                restore(c, L);
                record(c, L, "TRY");
                c.i32(0);
            });
        },

        RECOVER(code, op, sync) {
            const ci = codeIndex(code);
            const skipped = kindIndex("skipped");
            return fn("RECOVER", (c) => {
                const L = markLocals(c);
                const labN = c.local(I32);
                const k = c.local(I32);
                const end = c.local(I32);
                take(c, L);
                c.call(op).if_("void", (b) => b.i32(1).ret());
                restore(c, L);
                record(c, L, "RECOVER.body");
                //  the expectation list at the moment of the failure, before `sync` moves `far`
                c.gget(G.farn).set(labN);
                c.get(labN).i32(DLAB_MAX).x("i32.gt_u").if_("void", (b) => b.i32(DLAB_MAX).set(labN));
                c.block("void", (blk) => {
                    blk.loop("void", (lp) => {
                        lp.get(k).get(labN).x("i32.ge_u").brIf(1);
                        lp.i32(SCRATCH_LAB).get(k).i32(4).x("i32.mul").x("i32.add");
                        lp.i32(FARLAB_BASE).get(k).i32(4).x("i32.mul").x("i32.add").load();
                        lp.store();
                        lp.get(k).i32(1).x("i32.add").set(k);
                        lp.br(0);
                    });
                });
                c.call(sync).x("i32.eqz").gget(G.i).get(L.m0).x("i32.eq").x("i32.or").if_("void", (b) => {
                    restore(b, L);
                    record(b, L, "RECOVER.sync");
                    b.i32(0).ret();
                });
                c.gget(G.i).set(end);
                c.get(L.m1).gset(G.clen);
                c.get(L.m2).gset(G.plen);
                c.get(L.m3).gset(G.dlen);
                c.i32(ci).get(L.m0).get(end).i32(SCRATCH_LAB).get(labN).call(F.appendD);
                c.get(L.m0).get(end).get(L.m0).x("i32.sub").i32(skipped).call(F.appendC);
                c.get(L.m0).get(end).get(L.m0).x("i32.sub").i32(ci).call(F.appendRec);
                c.get(L.vb).gset(G.vsp);
                pushConst(c, consts.NONE);
                c.i32(1);
            });
        },

        REF(name) {
            const label = labelIndex("nesting <= 64");
            const idx = m.declare(`REF:${name}`, [], [I32]);
            env.deferred.push(() =>
                m.define(idx, (c) => {
                    const ok = c.local(I32);
                    const to = env.termIndex[name];
                    if (to === undefined) throw new Error(`HALT: REF '${name}' resolves to no production`);
                    c.gget(G.depth).i32(1).x("i32.add").gset(G.depth);
                    c.gget(G.depth).gget(G.theta).x("i32.gt_s").if_("void", (b) => {
                        b.gget(G.depth).i32(1).x("i32.sub").gset(G.depth);
                        b.gget(G.i).i32(codeIndex("css_syntax")).i32(label).call(F.fail).ret();
                    });
                    c.call(to).set(ok);
                    c.gget(G.depth).i32(1).x("i32.sub").gset(G.depth);
                    c.get(ok);
                }));
            return idx;
        },
    };
    return A;
}

/* ── the constructors (the Wasm half of each `R_ctor` row) ────────────────────────────────── */

/**
 * Each answers the built node, or 0 for the row's labelled zero-width failure (OP-19) — the same
 * two outcomes `CTORS` answers in the JS lowering, and the same guards, written over arena nodes.
 * The KEYS are interned byte strings in the data segment: the record a lowering builds carries its
 * own field names, so the boundary's walk needs no shape table and no per-row knowledge.
 */
export function emitCtors(env) {
    const { m, data, G, F, consts } = env;
    const out = {};
    const declare = (rowName, body) => {
        const idx = m.declare(`ctor:${rowName}`, [I32, I32], [I32]);
        m.define(idx, body);
        out[rowName] = idx;
        return idx;
    };
    const KEY = (s) => data.stringNode(s);
    const arg = (c, k) => c.get(0).i32(k).x("i32.add").call(F.slotGet);

    /** `colorOf(space, c1, c2, c3, alpha)` — `{ space, channels: [c1, c2, c3], alpha }`, in order. */
    const colorOf = (c, space, emitCh, emitAlpha) => {
        const abase = c.local(I32);
        const arr = c.local(I32);
        const rbase = c.local(I32);
        c.gget(G.vsp).set(abase);
        emitCh(c);
        c.i32(T_ARR).get(abase).i32(3).call(F.mkSeqNode).set(arr);
        c.get(abase).gset(G.vsp);
        c.gget(G.vsp).set(rbase);
        c.i32(KEY("space")).call(F.push);
        c.i32(data.stringNode(space)).call(F.push);
        c.i32(KEY("channels")).call(F.push);
        c.get(arr).call(F.push);
        c.i32(KEY("alpha")).call(F.push);
        emitAlpha(c);
        c.call(F.push);
        c.get(rbase).i32(3).call(F.mkRec);
        c.get(rbase).gset(G.vsp);
    };

    /** `Number.isFinite` over a `T_NUM` leaf; any non-number leaf passes, exactly as `finite` does. */
    const finiteGuard = (c, n) => {
        const p = c.local(I32);
        for (let k = 0; k < n; k++) {
            arg(c, k);
            c.set(p);
            c.get(p).load().i32(T_NUM).x("i32.eq").if_("void", (b) => {
                b.get(p).loadf64(8).get(p).loadf64(8).x("f64.eq")
                    .get(p).loadf64(8).x("f64.abs").f64(Infinity).x("f64.ne").x("i32.and")
                    .x("i32.eqz").if_("void", (t) => t.i32(0).ret());
            });
        }
    };

    const channels3 = (c) => {
        arg(c, 0);
        c.call(F.push);
        arg(c, 1);
        c.call(F.push);
        arg(c, 2);
        c.call(F.push);
    };

    //  X.P.W3.h: the slice's three heads and the ten the value grammar's landing added (E-h1) — one
    //  shape, `{space, channels, alpha}` over finite leaves, the row's own `space`
    for (const rowName of ["rgb", "hsl", "oklch", "hwb", "lab", "lch", "oklab", "xyz", "srgb-linear", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020"]) {
        const space = R_ctor[rowName].space;
        declare(rowName, (c) => {
            finiteGuard(c, 4);
            colorOf(c, space, channels3, (b) => arg(b, 3));
        });
    }

    /**
     * `color(xyz-d50 …)` → `xyz` (X.P.W3.h): the row's Bradford matrix over three NUMBER leaves
     * (`none` is a `T_STRB` and fails the guard, as the incumbent's "concrete xyz-d50" does), each
     * result `m[0]*x + m[1]*y + m[2]*z` in the incumbent's own operation order — two products
     * added, then the third product added — and every result finite (the incumbent's `xyz()`
     * factory checks the ADAPTED channels). No fused multiply-add exists in the instruction set,
     * so the f64 arithmetic is the JS engine's, operation for operation.
     */
    declare("xyz-d50", (c) => {
        const M = R_ctor["xyz-d50"].matrix;
        const p = c.local(I32);
        const x = c.local(F64);
        const y = c.local(F64);
        const z = c.local(F64);
        const out = [c.local(F64), c.local(F64), c.local(F64)];
        for (let k = 0; k < 3; k++) {
            arg(c, k);
            c.set(p);
            c.get(p).load().i32(T_NUM).x("i32.ne").if_("void", (b) => b.i32(0).ret());
        }
        finiteGuard(c, 4);
        arg(c, 0);
        c.loadf64(8).set(x);
        arg(c, 1);
        c.loadf64(8).set(y);
        arg(c, 2);
        c.loadf64(8).set(z);
        for (let r = 0; r < 3; r++) {
            c.f64(M[r * 3]).get(x).x("f64.mul")
                .f64(M[r * 3 + 1]).get(y).x("f64.mul").x("f64.add")
                .f64(M[r * 3 + 2]).get(z).x("f64.mul").x("f64.add")
                .set(out[r]);
            //  Number.isFinite over the adapted channel: equal to itself and not ±Infinity
            c.get(out[r]).get(out[r]).x("f64.eq").get(out[r]).x("f64.abs").f64(Infinity).x("f64.ne").x("i32.and")
                .x("i32.eqz").if_("void", (b) => b.i32(0).ret());
        }
        colorOf(c, "xyz", (b) => {
            for (let r = 0; r < 3; r++) b.get(out[r]).call(F.mkNum).call(F.push);
        }, (b) => arg(b, 3));
    });
    declare("hex8", (c) => colorOf(c, "rgb", channels3, (b) => arg(b, 3)));
    declare("hex6", (c) => colorOf(c, "rgb", channels3, (b) => b.i32(data.numNode(1))));
    declare("hex4", (c) => colorOf(c, "rgb", channels3, (b) => arg(b, 3)));
    declare("hex3", (c) => colorOf(c, "rgb", channels3, (b) => b.i32(data.numNode(1))));
    declare("context", (c) => c.i32(0)); //                      its only result is the failure (§10.1)

    /** `a[0].rgb3[k]` / `a[0].rgba4[k]` — the keyword row's pre-built record, read back. */
    const kwChannel = (c, k) => {
        arg(c, 0);
        c.load(12); //                                           the record's single value pointer
        c.i32(8 + k * 4).x("i32.add").load();
    };
    declare("named-color", (c) =>
        colorOf(c, "rgb", (b) => {
            for (let k = 0; k < 3; k++) {
                kwChannel(b, k);
                b.call(F.push);
            }
        }, (b) => b.i32(data.numNode(1))));
    declare("transparent", (c) =>
        colorOf(c, "rgb", (b) => {
            for (let k = 0; k < 3; k++) {
                kwChannel(b, k);
                b.call(F.push);
            }
        }, (b) => kwChannel(b, 3)));

    const rec = (c, pairs) => {
        const rbase = c.local(I32);
        c.gget(G.vsp).set(rbase);
        for (const [key, emitVal] of pairs) {
            c.i32(KEY(key)).call(F.push);
            emitVal(c);
            c.call(F.push);
        }
        c.get(rbase).i32(pairs.length).call(F.mkRec);
        c.get(rbase).gset(G.vsp);
    };

    /** A `T_NUM` leaf's integer value, for indexing a closed table of pre-built strings. */
    const tokenIndex = (c, k) => {
        arg(c, k);
        c.loadf64(8).x("i32.trunc_f64_s");
    };
    const strTable = (names) => data.blob(`strtab:${names.join(",")}`, names.flatMap((n) => u32le(data.stringNode(n))), 4);

    const TIMING_TAB = strTable(TIMING_KEYWORDS);
    const JUMP_TAB = strTable(JUMP_POSITIONS);

    declare("timing-keyword", (c) =>
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("keyword"))],
            ["name", (b) => {
                tokenIndex(b, 0);
                b.i32(4).x("i32.mul").i32(TIMING_TAB).x("i32.add").load();
            }],
        ]));

    declare("step-alias", (c) => {
        const alias = c.local(I32);
        tokenIndex(c, 0);
        c.set(alias);
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("steps"))],
            ["count", (b) => {
                //  both aliases expand to one step; the count is the row's, read from the table
                b.i32(data.blob("stepcount", STEP_ALIASES.flatMap((s) => u32le(data.numNode(s.count))), 4));
                b.get(alias).i32(4).x("i32.mul").x("i32.add").load();
            }],
            ["position", (b) => {
                b.i32(data.blob("steppos", STEP_ALIASES.flatMap((s) => u32le(data.stringNode(JUMP_POSITIONS[s.position]))), 4));
                b.get(alias).i32(4).x("i32.mul").x("i32.add").load();
            }],
        ]);
    });

    declare("cubic-bezier", (c) => {
        const p = c.local(I32);
        for (const k of [0, 2]) {
            arg(c, k);
            c.set(p);
            c.get(p).loadf64(8).f64(0).x("f64.ge").get(p).loadf64(8).f64(1).x("f64.le").x("i32.and")
                .x("i32.eqz").if_("void", (b) => b.i32(0).ret());
        }
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("cubic-bezier"))],
            ["x1", (b) => arg(b, 0)],
            ["y1", (b) => arg(b, 1)],
            ["x2", (b) => arg(b, 2)],
            ["y2", (b) => arg(b, 3)],
        ]);
    });

    declare("steps", (c) => {
        const count = c.local(F64);
        const pos = c.local(I32);
        arg(c, 0);
        c.loadf64(8).set(count);
        tokenIndex(c, 1);
        c.set(pos);
        //  Number.isInteger: equal to its own floor, and finite (floor(Infinity) is Infinity)
        c.get(count).get(count).x("f64.floor").x("f64.eq")
            .get(count).x("f64.abs").f64(Infinity).x("f64.ne").x("i32.and")
            .x("i32.eqz").if_("void", (b) => b.i32(0).ret());
        c.get(count).f64(1).x("f64.lt").if_("void", (b) => b.i32(0).ret());
        c.get(pos).i32(JUMP_POSITIONS.indexOf("jump-none")).x("i32.eq")
            .get(count).f64(2).x("f64.lt").x("i32.and").if_("void", (b) => b.i32(0).ret());
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("steps"))],
            ["count", (b) => arg(b, 0)],
            ["position", (b) => {
                b.get(pos).i32(4).x("i32.mul").i32(JUMP_TAB).x("i32.add").load();
            }],
        ]);
    });

    /** A `T_LIST`'s elements as a bare array — the `.l` projection, in Wasm. */
    const listToArr = (c, emitPtr) => {
        const p = c.local(I32);
        const abase = c.local(I32);
        const k = c.local(I32);
        const arr = c.local(I32);
        emitPtr(c);
        c.set(p);
        c.gget(G.vsp).set(abase);
        c.i32(0).set(k);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(p).load(4).x("i32.ge_u").brIf(1);
                lp.get(p).get(k).i32(4).x("i32.mul").x("i32.add").load(8).call(F.push);
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.i32(T_ARR).get(abase).get(p).load(4).call(F.mkSeqNode).set(arr);
        c.get(abase).gset(G.vsp);
        c.get(arr);
    };

    declare("linear-function", (c) =>
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("linear-function"))],
            ["stops", (b) => listToArr(b, (u) => arg(u, 0))],
        ]));
    declare("linear-stop", (c) =>
        rec(c, [
            ["output", (b) => arg(b, 0)],
            ["input", (b) => listToArr(b, (u) => arg(u, 1))],
        ]));

    /** An empty bare array — `selectors: []` for a rule whose prelude is absent (`{ … }`). */
    const emptyArr = (c) => c.i32(T_ARR).gget(G.vsp).i32(0).call(F.mkSeqNode);

    /**
     * X.P.W3.l: the prelude leaf is OPTIONAL (`{ color: red }` is a rule with `selectors: []` at
     * the incumbent — `splitTopLevel("", ",")` is `[]`), so the constructor branches on its leaf
     * COUNT (`c.get(1)`, the `value-call` idiom): two leaves are prelude + list, one is the list.
     */
    declare("style-rule", (c) => {
        c.get(1).i32(2).x("i32.eq").if_(I32,
            (t) => rec(t, [
                ["kind", (b) => b.i32(data.stringNode("style"))],
                ["selectors", (b) => {
                    arg(b, 0);
                    b.call(F.splitSelectors);
                }],
                ["declarations", (b) => listToArr(b, (u) => arg(u, 1))],
            ]),
            (e) => rec(e, [
                ["kind", (b) => b.i32(data.stringNode("style"))],
                ["selectors", (b) => emptyArr(b)],
                ["declarations", (b) => listToArr(b, (u) => arg(u, 0))],
            ]));
    });

    /**
     * X.P.W3.j (J-2 / J-6): the name run reaches the constructor with its trailing whitespace
     * still on it (space is a `decl-name` byte, because the incumbent trims a slice it has already
     * cut at the colon), so the span is TRIMMED — `trimWs` answers a `T_STR` node, whose text the
     * boundary reads back from the ORIGINAL string — and it is NOT folded here. `mkFold` would
     * materialize folded bytes out of the input buffer, where a code unit >= 128 stands as the
     * 0xFF marker, and would answer `ÿ` where the JS lowering answers the character: measured as
     * a two-cell G-5 value divergence before this form was written. `.toLowerCase()` is the
     * surface's (`entry.mjs` `sheetOver`), where it is the incumbent's own operation.
     */
    declare("declaration", (c) =>
        rec(c, [
            ["name", (b) => {
                const p = b.local(I32);
                arg(b, 0);
                b.set(p);
                b.get(p).load(4).get(p).load(4).get(p).load(8).x("i32.add").call(F.trimWs);
            }],
            ["value", (b) => arg(b, 1)],
            ["important", (b) => arg(b, 2)],
        ]));

    /**
     * X.P.W3.j (J-4): a comment is the RECOVERY SENTINEL — `stylesheet`'s own constructor filters
     * `consts.NONE` out of the item list, so a comment leaves nothing in `V` and nothing in `D`,
     * which is the incumbent's `cursor = end + 2`. The JS half is `() => NONE_OPT`.
     */
    declare("sheet-comment", (c) => c.i32(consts.NONE));

    declare("value-color", (c) =>
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("scalar"))],
            ["payload", (b) =>
                rec(b, [
                    ["type", (u) => u.i32(data.stringNode("color"))],
                    ["value", (u) => arg(u, 0)],
                ])],
        ]));

    /* ── X.P.W3.h — the value shapes (`algebra/grammar/value.mjs`), the same CTOR family as the
          rows in `tables.mjs`, the JS functions in `js-alg.mjs` and the node table in `bounds.mjs` ── */

    /** `{kind:"scalar", payload:{type, …}}` — the one nesting every scalar shape shares. */
    const scalarRec = (c, type, pairs) =>
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("scalar"))],
            ["payload", (b) => rec(b, [["type", (u) => u.i32(data.stringNode(type))], ...pairs])],
        ]);

    /** `[number, unit?]` — the unit leaf is absent for a bare number; the count is the second parameter. */
    declare("value-number", (c) => {
        finiteGuard(c, 1);
        scalarRec(c, "number", [
            ["value", (b) => arg(b, 0)],
            ["unit", (b) => {
                b.get(1).i32(2).x("i32.eq").if_(I32, (t) => arg(t, 1), (t) => t.i32(data.stringNode("")));
            }],
        ]);
    });

    declare("value-keyword", (c) => scalarRec(c, "keyword", [["value", (b) => arg(b, 0)]]));

    const OPERATOR_TAB = strTable(OPERATORS);
    declare("value-operator", (c) =>
        scalarRec(c, "keyword", [
            ["value", (b) => {
                tokenIndex(b, 0);
                b.i32(4).x("i32.mul").i32(OPERATOR_TAB).x("i32.add").load();
            }],
        ]));

    /**
     * One leaf is an empty string's own two quotes (a `T_STR`, used as is); three are open, the
     * interior pieces, close — all `T_STR` spans of the SOURCE, contiguous by construction, so the
     * value is the span from the opening quote's start to the closing quote's end and no piece is
     * read (the JS constructor re-joins the pieces; the bytes are the same bytes).
     */
    declare("value-string", (c) => {
        const open = c.local(I32);
        const close = c.local(I32);
        const s = c.local(I32);
        const e = c.local(I32);
        c.get(1).i32(1).x("i32.eq").if_("void", (b) => {
            scalarRec(b, "keyword", [["value", (u) => arg(u, 0)]]);
            b.ret();
        });
        arg(c, 0);
        c.set(open);
        arg(c, 2);
        c.set(close);
        c.get(open).load(4).set(s);
        c.get(close).load(4).get(close).load(8).x("i32.add").set(e);
        scalarRec(c, "keyword", [["value", (u) => u.get(s).get(e).get(s).x("i32.sub").call(F.mkStr)]]);
    });

    /**
     * A closed name list as a `kwLookup` blob: `[u32 count]` then `[u8 keyLen][key…][u8 1][u8 0]`,
     * so `F.kwLookup(blob, s, e)` answers >= 0 exactly when the folded span is one of the names.
     */
    const nameBlob = (names) =>
        data.blob(`names:${names.join(",")}`, [...u32le(names.length), ...names.flatMap((n) => [n.length, ...[...n].map((ch) => ch.charCodeAt(0)), 1, 0])], 4);

    /**
     * The group rows' shared reading (`js-alg.mjs` groupItems): the items array — `first` (leaf 1)
     * then every non-UNIT element of the `T_LIST` `rest` (leaf 2), a UNIT being a separator
     * followed by nothing — as a `T_ARR`, or 0 when a leading (leaf 0 non-empty) or trailing
     * (last of `rest` UNIT) comma/slash separator (leaf 3, the separator index, not `space`)
     * stands with fewer than two items. Answers the array pointer, or returns 0 from the caller.
     */
    const SPACE_INDEX = SEPARATORS.indexOf("space");
    const groupItems = (c) => {
        const rest = c.local(I32);
        const abase = c.local(I32);
        const k = c.local(I32);
        const n = c.local(I32);
        const item = c.local(I32);
        const count = c.local(I32);
        const edge = c.local(I32);
        const arr = c.local(I32);
        arg(c, 2);
        c.set(rest);
        c.get(rest).load(4).set(n);
        c.gget(G.vsp).set(abase);
        arg(c, 1);
        c.call(F.push);
        c.i32(1).set(count);
        c.i32(0).set(k);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(n).x("i32.ge_u").brIf(1);
                lp.get(rest).get(k).i32(4).x("i32.mul").x("i32.add").load(8).set(item);
                lp.get(item).i32(consts.UNIT).x("i32.ne").if_("void", (b) => {
                    b.get(item).call(F.push);
                    b.get(count).i32(1).x("i32.add").set(count);
                });
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        //  a leading separator run (leaf 0 non-empty) or a trailing one (the last of `rest` a UNIT)
        arg(c, 0);
        c.load(4).i32(0).x("i32.gt_u").set(edge);
        c.get(n).i32(0).x("i32.gt_u").if_("void", (b) => {
            b.get(rest).get(n).i32(1).x("i32.sub").i32(4).x("i32.mul").x("i32.add").load(8).i32(consts.UNIT).x("i32.eq")
                .get(edge).x("i32.or").set(edge);
        });
        tokenIndex(c, 3);
        c.i32(SPACE_INDEX).x("i32.ne").get(edge).x("i32.and").get(count).i32(2).x("i32.lt_u").x("i32.and").if_("void", (b) => {
            b.get(abase).gset(G.vsp);
            b.i32(0).ret();
        });
        c.i32(T_ARR).get(abase).get(count).call(F.mkSeqNode).set(arr);
        c.get(abase).gset(G.vsp);
        c.get(arr);
    };

    /** The argument array, bare (the `stylesheet` row's precedent), or the group guard's failure. */
    declare("value-args", (c) => groupItems(c));

    /** The incumbent's three name rules, over the row's own lists (`grammar.ts` parseValueInternal). */
    declare("value-call", (c) => {
        const row = R_ctor["value-call"];
        const ZERO_ARG = nameBlob(row.zeroArg);
        const EMPTY_OK = nameBlob(row.emptyOk);
        const name = c.local(I32);
        const s = c.local(I32);
        const e = c.local(I32);
        const n = c.local(I32);
        const args = c.local(I32);
        arg(c, 0);
        c.set(name);
        c.get(name).load(4).set(s);
        c.get(s).get(name).load(8).x("i32.add").set(e);
        //  the array leaf is present for a non-empty body (two leaves); an empty body is the empty array
        c.get(1).i32(2).x("i32.eq").if_("void",
            (b) => {
                arg(b, 1);
                b.set(args);
            },
            (b) => b.i32(T_ARR).gget(G.vsp).i32(0).call(F.mkSeqNode).set(args));
        c.get(args).load(4).set(n);
        c.i32(ZERO_ARG).get(s).get(e).call(F.kwLookup).i32(0).x("i32.ge_s").if_("void", (b) => {
            //  sibling-index() / sibling-count() take nothing
            b.get(n).i32(0).x("i32.ne").if_("void", (t) => t.i32(0).ret());
        }, (b) => {
            b.get(n).x("i32.eqz").if_("void", (t) => {
                //  an empty body is lawful only for scroll(), view() and a `--*` name
                t.i32(EMPTY_OK).get(s).get(e).call(F.kwLookup).i32(0).x("i32.lt_s").if_("void", (u) => {
                    u.get(e).get(s).x("i32.sub").i32(2).x("i32.lt_u")
                        .get(s).i32(INPUT_BASE).x("i32.add").load8u().i32(45).x("i32.ne").x("i32.or")
                        .get(s).i32(INPUT_BASE + 1).x("i32.add").load8u().i32(45).x("i32.ne").x("i32.or")
                        .if_("void", (v) => v.i32(0).ret());
                });
            });
        });
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("call"))],
            ["name", (b) => b.get(name)],
            ["args", (b) => b.get(args)],
        ]);
    });

    /** `first` alone when it is the only item, else the list over the items. */
    const SEPARATOR_TAB = strTable(SEPARATORS);
    const LIST_KIND = data.stringNode("list");
    declare("value-group", (c) => {
        const arr = c.local(I32);
        groupItems(c);
        c.set(arr);
        c.get(arr).x("i32.eqz").if_("void", (b) => b.i32(0).ret());
        c.get(arr).load(4).i32(1).x("i32.eq").if_("void", (b) => b.get(arr).load(8).ret());
        rec(c, [
            ["kind", (b) => b.i32(LIST_KIND)],
            ["separator", (b) => {
                tokenIndex(b, 3);
                b.i32(4).x("i32.mul").i32(SEPARATOR_TAB).x("i32.add").load();
            }],
            ["items", (b) => b.get(arr)],
        ]);
    });

    /**
     * `parseCssValues`: a list is itself (its `kind` value is the interned `"list"` node, compared
     * by pointer), any other value a one-item space list.
     */
    declare("value-wrap", (c) => {
        const v = c.local(I32);
        const abase = c.local(I32);
        const arr = c.local(I32);
        arg(c, 0);
        c.set(v);
        c.get(v).load(12).i32(LIST_KIND).x("i32.eq").if_("void", (b) => b.get(v).ret());
        c.gget(G.vsp).set(abase);
        c.get(v).call(F.push);
        c.i32(T_ARR).get(abase).i32(1).call(F.mkSeqNode).set(arr);
        c.get(abase).gset(G.vsp);
        rec(c, [
            ["kind", (b) => b.i32(LIST_KIND)],
            ["separator", (b) => b.i32(data.stringNode("space"))],
            ["items", (b) => b.get(arr)],
        ]);
    });

    /** `stylesheet` is the one row whose value IS the projection: the list minus every recovered hole. */
    declare("stylesheet", (c) => {
        const p = c.local(I32);
        const abase = c.local(I32);
        const k = c.local(I32);
        const n = c.local(I32);
        const item = c.local(I32);
        const arr = c.local(I32);
        arg(c, 0);
        c.set(p);
        c.gget(G.vsp).set(abase);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(p).load(4).x("i32.ge_u").brIf(1);
                lp.get(p).get(k).i32(4).x("i32.mul").x("i32.add").load(8).set(item);
                lp.get(item).i32(consts.NONE).x("i32.ne").if_("void", (b) => {
                    b.get(item).call(F.push);
                    b.get(n).i32(1).x("i32.add").set(n);
                });
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.i32(T_ARR).get(abase).get(n).call(F.mkSeqNode).set(arr);
        c.get(abase).gset(G.vsp);
        c.get(arr);
    });

    /* ── X.P.W3.i — the animation shapes (`algebra/grammar/animation.mjs`), the same CTOR family as
          the rows in `tables.mjs`, the JS functions in `js-alg.mjs` and the node table in
          `bounds.mjs`. Every record below carries its pairs in the SAME ORDER the JS constructor
          writes them, because G-5 compares the materialized value's JSON and key order is bytes. ── */

    const RANGE_PHASE_TAB = strTable(RANGE_PHASES);
    const KEYFRAME_PHASE_TAB = strTable(KEYFRAME_PHASES);
    const TIMELINE_MODE_TAB = strTable(TIMELINE_MODES);
    const SCROLLER_TAB = strTable(SCROLLER_KEYWORDS);
    const AXIS_TAB = strTable(TIMELINE_AXES);
    const AUTO_BLOB = nameBlob(["auto"]);

    /** An i32 index already on the stack becomes the interned string node of a `strTable`. */
    const fromTab = (c, tab) => c.i32(4).x("i32.mul").i32(tab).x("i32.add").load();

    /**
     * A record whose PAIR COUNT is decided at run time — `{kind:"scroll"}` and
     * `{kind:"scroll",scroller,axis}` are one constructor with two to four pairs. `mkRec(base,pairs)`
     * already takes its count as a value, so the only thing this adds over `rec` is a counter.
     */
    const recDyn = (c, emit) => {
        const rbase = c.local(I32);
        const np = c.local(I32);
        c.gget(G.vsp).set(rbase);
        c.i32(0).set(np);
        const pair = (b, key, emitVal) => {
            b.i32(KEY(key)).call(F.push);
            emitVal(b);
            b.call(F.push);
            b.get(np).i32(1).x("i32.add").set(np);
        };
        emit(c, pair);
        c.get(rbase).get(np).call(F.mkRec);
        c.get(rbase).gset(G.vsp);
    };

    /**
     * One `LENGTH_PERCENTAGE` token as its own source text. The leaves are the token's contiguous
     * `TEXT` pieces (one to five, the count is the second parameter), so the span runs from the
     * FIRST piece's start to the LAST piece's end and no piece is read — the `value-string` idiom,
     * and the same bytes the JS constructor re-joins.
     */
    declare("lp-text", (c) => {
        const first = c.local(I32);
        const last = c.local(I32);
        const s = c.local(I32);
        arg(c, 0);
        c.set(first);
        c.get(0).get(1).x("i32.add").i32(1).x("i32.sub").call(F.slotGet).set(last);
        c.get(first).load(4).set(s);
        c.get(s);
        c.get(last).load(4).get(last).load(8).x("i32.add").get(s).x("i32.sub");
        c.call(F.mkStr);
    });

    /** `^auto$` under `/i` — the folded span against a one-name table; the text is kept as authored. */
    declare("lp-auto", (c) => {
        const p = c.local(I32);
        const s = c.local(I32);
        arg(c, 0);
        c.set(p);
        c.get(p).load(4).set(s);
        c.i32(AUTO_BLOB).get(s).get(s).get(p).load(8).x("i32.add").call(F.kwLookup).i32(0).x("i32.lt_s")
            .if_("void", (b) => b.i32(0).ret());
        c.get(p);
    });

    /** `RangeBoundary`'s three shapes and `AnimationRangeValue`'s two — one row each, no branching. */
    const phaseName = (b) => {
        tokenIndex(b, 0);
        fromTab(b, RANGE_PHASE_TAB);
    };
    declare("range-phase", (c) => rec(c, [["phase", phaseName]]));
    declare("range-phase-offset", (c) => rec(c, [["phase", phaseName], ["offset", (b) => arg(b, 1)]]));
    declare("range-offset", (c) => rec(c, [["offset", (b) => arg(b, 0)]]));
    declare("range-single", (c) => rec(c, [["start", (b) => arg(b, 0)]]));
    declare("range-pair", (c) => rec(c, [["start", (b) => arg(b, 0)], ["end", (b) => arg(b, 1)]]));

    /** `KeyframeSelector`. `from`/`to` carry their own percent (0 and 1) as the table's own value. */
    const PERCENT_KIND = data.stringNode("percent");
    const NAMED_KIND = data.stringNode("named");
    declare("keyframe-word", (c) =>
        rec(c, [["kind", (b) => b.i32(PERCENT_KIND)], ["value", (b) => arg(b, 0)]]));

    declare("keyframe-percent", (c) => {
        const v = c.local(F64);
        arg(c, 0);
        c.loadf64(8).set(v);
        //  `Number.isFinite(v) && v >= 0 && v <= 100`: NaN fails both comparisons and ±Infinity one
        c.get(v).f64(0).x("f64.ge").get(v).f64(100).x("f64.le").x("i32.and").x("i32.eqz")
            .if_("void", (b) => b.i32(0).ret());
        rec(c, [
            ["kind", (b) => b.i32(PERCENT_KIND)],
            ["value", (b) => b.get(v).f64(100).x("f64.div").call(F.mkNum)],
        ]);
    });

    const keyframeName = (b) => {
        tokenIndex(b, 0);
        fromTab(b, KEYFRAME_PHASE_TAB);
    };
    declare("keyframe-named", (c) => {
        const o = c.local(F64);
        c.get(1).i32(1).x("i32.eq").if_("void", (b) => {
            rec(b, [["kind", (u) => u.i32(NAMED_KIND)], ["name", keyframeName]]);
            b.ret();
        });
        arg(c, 1);
        c.loadf64(8).f64(100).x("f64.div").set(o);
        c.get(o).f64(0).x("f64.ge").get(o).f64(1).x("f64.le").x("i32.and").x("i32.eqz")
            .if_("void", (b) => b.i32(0).ret());
        rec(c, [
            ["kind", (b) => b.i32(NAMED_KIND)],
            ["name", keyframeName],
            ["offset", (b) => b.get(o).call(F.mkNum)],
        ]);
    });

    /** `AnimationTimelineValue`'s four rows. */
    declare("timeline-mode", (c) =>
        rec(c, [["kind", (b) => {
            tokenIndex(b, 0);
            fromTab(b, TIMELINE_MODE_TAB);
        }]]));

    declare("timeline-name", (c) => {
        const p = c.local(I32);
        const s = c.local(I32);
        arg(c, 0);
        c.set(p);
        c.get(p).load(4).set(s);
        //  `^--`: the grammar already guarantees at least three code units, so both reads are inside
        c.get(s).i32(INPUT_BASE).x("i32.add").load8u().i32(45).x("i32.ne")
            .get(s).i32(INPUT_BASE + 1).x("i32.add").load8u().i32(45).x("i32.ne").x("i32.or")
            .if_("void", (b) => b.i32(0).ret());
        rec(c, [["kind", (b) => b.i32(data.stringNode("name"))], ["name", (b) => b.get(p)]]);
    });

    /**
     * `scroll()`: one table, rows 0..2 the scrollers and 3..6 the axes, so "is it a scroller" is an
     * index comparison. A second scroller or a second axis is the incumbent's `else return failure`
     * — the sets are disjoint, so a repeat has nowhere else to go.
     */
    const SCROLLERS_N = SCROLLER_KEYWORDS.length;
    declare("timeline-scroll", (c) => {
        const p = c.local(I32);
        const n = c.local(I32);
        const k = c.local(I32);
        const item = c.local(I32);
        const idx = c.local(I32);
        const scroller = c.local(I32);
        const axis = c.local(I32);
        arg(c, 0);
        c.set(p);
        c.get(p).load(4).set(n);
        c.i32(-1).set(scroller);
        c.i32(-1).set(axis);
        c.i32(0).set(k);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(n).x("i32.ge_u").brIf(1);
                lp.get(p).get(k).i32(4).x("i32.mul").x("i32.add").load(8).set(item);
                lp.get(item).loadf64(8).x("i32.trunc_f64_s").set(idx);
                lp.get(idx).i32(SCROLLERS_N).x("i32.lt_s").if_("void",
                    (b) => {
                        b.get(scroller).i32(-1).x("i32.ne").if_("void", (t) => t.i32(0).ret());
                        b.get(idx).set(scroller);
                    },
                    (b) => {
                        b.get(axis).i32(-1).x("i32.ne").if_("void", (t) => t.i32(0).ret());
                        b.get(idx).i32(SCROLLERS_N).x("i32.sub").set(axis);
                    });
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        recDyn(c, (u, pair) => {
            pair(u, "kind", (b) => b.i32(data.stringNode("scroll")));
            u.get(scroller).i32(-1).x("i32.ne").if_("void", (b) => {
                pair(b, "scroller", (t) => {
                    t.get(scroller);
                    fromTab(t, SCROLLER_TAB);
                });
            });
            u.get(axis).i32(-1).x("i32.ne").if_("void", (b) => {
                pair(b, "axis", (t) => {
                    t.get(axis);
                    fromTab(t, AXIS_TAB);
                });
            });
        });
    });

    /**
     * `view()`: an axis keyword (a `T_NUM` table index) or an inset token (a `T_STR` of the source),
     * told apart by the leaf's OWN node tag — the two vocabularies are disjoint, which is why the
     * incumbent's ordered `if/else if` and this type test reach the same verdict.
     */
    declare("timeline-view", (c) => {
        const p = c.local(I32);
        const n = c.local(I32);
        const k = c.local(I32);
        const item = c.local(I32);
        const axis = c.local(I32);
        const ins = c.local(I32);
        const in0 = c.local(I32);
        const in1 = c.local(I32);
        arg(c, 0);
        c.set(p);
        c.get(p).load(4).set(n);
        c.i32(-1).set(axis);
        c.i32(0).set(ins);
        c.i32(0).set(k);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(n).x("i32.ge_u").brIf(1);
                lp.get(p).get(k).i32(4).x("i32.mul").x("i32.add").load(8).set(item);
                lp.get(item).load().i32(T_NUM).x("i32.eq").if_("void",
                    (b) => {
                        b.get(axis).i32(-1).x("i32.ne").if_("void", (t) => t.i32(0).ret());
                        b.get(item).loadf64(8).x("i32.trunc_f64_s").set(axis);
                    },
                    (b) => {
                        b.get(ins).i32(2).x("i32.ge_s").if_("void", (t) => t.i32(0).ret());
                        b.get(ins).x("i32.eqz").if_("void", (t) => t.get(item).set(in0), (t) => t.get(item).set(in1));
                        b.get(ins).i32(1).x("i32.add").set(ins);
                    });
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        recDyn(c, (u, pair) => {
            pair(u, "kind", (b) => b.i32(data.stringNode("view")));
            u.get(axis).i32(-1).x("i32.ne").if_("void", (b) => {
                pair(b, "axis", (t) => {
                    t.get(axis);
                    fromTab(t, AXIS_TAB);
                });
            });
            u.get(ins).i32(0).x("i32.gt_s").if_("void", (b) => {
                pair(b, "inset", (t) => {
                    t.get(ins).i32(2).x("i32.eq").if_(I32,
                        (v) => rec(v, [["start", (w) => w.get(in0)], ["end", (w) => w.get(in1)]]),
                        (v) => rec(v, [["start", (w) => w.get(in0)]]));
                });
            });
        });
    });

    /** One comma part: the `T_LIST` of value tokens the part's `REP` produced, as a bare array. */
    declare("animation-option", (c) => listToArr(c, (u) => arg(u, 0)));

    /** The animation declaration's comma list, as the bare array of its parts: `first` then `rest`. */
    declare("animation-option-list", (c) => {
        const rest = c.local(I32);
        const n = c.local(I32);
        const k = c.local(I32);
        const abase = c.local(I32);
        const arr = c.local(I32);
        arg(c, 1);
        c.set(rest);
        c.get(rest).load(4).set(n);
        c.gget(G.vsp).set(abase);
        arg(c, 0);
        c.call(F.push);
        c.i32(0).set(k);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(n).x("i32.ge_u").brIf(1);
                lp.get(rest).get(k).i32(4).x("i32.mul").x("i32.add").load(8).call(F.push);
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.i32(T_ARR).get(abase).get(n).i32(1).x("i32.add").call(F.mkSeqNode).set(arr);
        c.get(abase).gset(G.vsp);
        c.get(arr);
    });

    /* ── X.P.W3.l — the at-rule and nesting families (`algebra/grammar/stylesheet.mjs` L-1…L-6),
          the same CTOR family as the rows in `tables.mjs`, the JS functions in `js-alg.mjs` and the
          node table in `bounds.mjs`. Every record's pairs are in the JS constructor's order (G-5
          compares JSON bytes); every leaf an `OPT` may leave out is read by COUNT (`c.get(1)`);
          every string answered is a SPAN of the source (`T_STR`, the J-6 posture), never bytes
          materialized out of the input buffer. ── */

    const AT_KIND_TAB = strTable(AT_DECLARATION_KINDS);
    const ANIMATION_BLOB = nameBlob(["animation"]);
    const EMPTY_STR = data.stringNode("");
    /** A `T_STR`'s start and end (`start + len`) as two i32s on the stack. */
    const strEnd = (c, p) => c.get(p).load(4).get(p).load(8).x("i32.add");

    /** L-4: the mixed reading — the prelude (optional) and the items, comment holes included. */
    declare("style-rule-mixed", (c) => {
        c.get(1).i32(2).x("i32.eq").if_(I32,
            (t) => rec(t, [
                ["kind", (b) => b.i32(data.stringNode("style"))],
                ["selectors", (b) => {
                    arg(b, 0);
                    b.call(F.splitSelectors);
                }],
                ["items", (b) => listToArr(b, (u) => arg(u, 1))],
            ]),
            (e) => rec(e, [
                ["kind", (b) => b.i32(data.stringNode("style"))],
                ["selectors", (b) => emptyArr(b)],
                ["items", (b) => listToArr(b, (u) => arg(u, 0))],
            ]));
    });

    declare("at-keyframes", (c) =>
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("keyframes"))],
            ["name", (b) => arg(b, 0)],
            ["rules", (b) => listToArr(b, (u) => arg(u, 1))],
        ]));

    declare("keyframe-rule", (c) => {
        c.get(1).i32(2).x("i32.eq").if_(I32,
            (t) => rec(t, [
                ["prelude", (b) => arg(b, 0)],
                ["declarations", (b) => listToArr(b, (u) => arg(u, 1))],
            ]),
            (e) => rec(e, [
                ["prelude", (b) => b.i32(EMPTY_STR)],
                ["declarations", (b) => listToArr(b, (u) => arg(u, 0))],
            ]));
    });

    /** The head's `at-rule-name` row index (a `T_NUM` leaf) names the kind, off the closed table. */
    declare("at-declarations", (c) =>
        rec(c, [
            ["kind", (b) => {
                tokenIndex(b, 0);
                fromTab(b, AT_KIND_TAB);
            }],
            ["prelude", (b) => arg(b, 1)],
            ["declarations", (b) => listToArr(b, (u) => arg(u, 2))],
        ]));

    declare("at-scope", (c) => {
        c.get(1).i32(2).x("i32.eq").if_(I32,
            (t) => rec(t, [
                ["kind", (b) => b.i32(data.stringNode("scope"))],
                ["prelude", (b) => arg(b, 0)],
                ["children", (b) => listToArr(b, (u) => arg(u, 1))],
            ]),
            (e) => rec(e, [
                ["kind", (b) => b.i32(data.stringNode("scope"))],
                ["prelude", (b) => b.i32(EMPTY_STR)],
                ["children", (b) => listToArr(b, (u) => arg(u, 0))],
            ]));
    });

    declare("at-starting-style", (c) =>
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("starting-style"))],
            ["children", (b) => listToArr(b, (u) => arg(u, 0))],
        ]));

    declare("at-unknown-block", (c) => {
        c.get(1).i32(2).x("i32.eq").if_(I32,
            (t) => rec(t, [
                ["kind", (b) => b.i32(data.stringNode("unknown"))],
                ["prelude", (b) => arg(b, 0)],
                ["body", (b) => arg(b, 1)],
            ]),
            (e) => rec(e, [
                ["kind", (b) => b.i32(data.stringNode("unknown"))],
                ["prelude", (b) => b.i32(EMPTY_STR)],
                ["body", (b) => arg(b, 0)],
            ]));
    });

    declare("at-unknown-stmt", (c) =>
        rec(c, [
            ["kind", (b) => b.i32(data.stringNode("unknown"))],
            ["prelude", (b) => {
                b.get(1).i32(1).x("i32.eq").if_(I32, (t) => arg(t, 0), (e) => e.i32(EMPTY_STR));
            }],
            ["body", (b) => b.i32(consts.NULL)],
        ]));

    /**
     * L-3: the raw body is the SPAN from its first piece's start to its last piece's end — every
     * piece is a `T_STR` span (a text run, or a nested block already answered as one), and the
     * pieces are contiguous by construction (the `REP` consumes them back to back), so the span
     * is exactly the JS `join("")`. No pieces is the empty string.
     */
    declare("raw-text", (c) => {
        const p = c.local(I32);
        const n = c.local(I32);
        const first = c.local(I32);
        const last = c.local(I32);
        const s = c.local(I32);
        arg(c, 0);
        c.set(p);
        c.get(p).load(4).set(n);
        c.get(n).x("i32.eqz").if_(I32,
            (t) => t.i32(0).i32(0).call(F.mkStr),
            (e) => {
                e.get(p).load(8).set(first);
                e.get(p).get(n).i32(1).x("i32.sub").i32(4).x("i32.mul").x("i32.add").load(8).set(last);
                e.get(first).load(4).set(s);
                e.get(s);
                strEnd(e, last);
                e.get(s).x("i32.sub").call(F.mkStr);
            });
    });

    /**
     * L-3: a nested block, braces included. Its leaves are the pieces list (always) and the two
     * braces when `TEXT` read them (each is absent when the doubled-brace `LIT` arm dropped it);
     * the leaves are told apart by TAG (`T_LIST` against `T_STR`) and by ORDER (the first string
     * is the opening brace). An absent brace stands one code unit outside its neighbour: the
     * opening brace ends where the first piece starts, the closing one starts where the last
     * piece ends — and with no pieces at all, two code units from the opening brace. Both
     * lowerings compute the same offsets, so the materialized text is the same bytes.
     */
    declare("raw-block", (c) => {
        const k = c.local(I32);
        const item = c.local(I32);
        const open = c.local(I32);
        const list = c.local(I32);
        const close = c.local(I32);
        const n = c.local(I32);
        const start = c.local(I32);
        const end = c.local(I32);
        const last = c.local(I32);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(1).x("i32.ge_u").brIf(1);
                lp.get(0).get(k).x("i32.add").call(F.slotGet).set(item); //  the k-th leaf, k a LOCAL
                lp.get(item).load().i32(T_LIST).x("i32.eq").if_("void",
                    (b) => b.get(item).set(list),
                    (b) => b.get(list).x("i32.eqz").if_("void", (t) => t.get(item).set(open), (t) => t.get(item).set(close)));
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.get(list).load(4).set(n);
        //  start: the opening brace's own start, else one before the first piece (else one before the closing brace)
        c.get(open).if_(I32,
            (t) => t.get(open).load(4),
            (e) => e.get(n).if_(I32,
                (t) => t.get(list).load(8).load(4).i32(1).x("i32.sub"),
                (u) => u.get(close).if_(I32, (t) => t.get(close).load(4).i32(1).x("i32.sub"), (v) => v.i32(0))));
        c.set(start);
        //  end: the closing brace's own end, else one after the last piece, else two after the start
        c.get(close).if_(I32,
            (t) => strEnd(t, close),
            (e) => e.get(n).if_(I32,
                (t) => {
                    t.get(list).get(n).i32(1).x("i32.sub").i32(4).x("i32.mul").x("i32.add").load(8).set(last);
                    strEnd(t, last);
                    t.i32(1).x("i32.add");
                },
                (u) => u.get(start).i32(2).x("i32.add")));
        c.set(end);
        c.get(start).get(end).get(start).x("i32.sub").call(F.mkStr);
    });

    /**
     * X.P.W3.n — a SIMPLE BLOCK inside a prelude (css-syntax-3 §5.4.9). Its three leaves are always
     * present and contiguous — `TEXT("lparen",1,1)` · the inner `raw-text` run · `TEXT("rparen",1,1)`
     * — so the block is the SPAN from the opening paren's start to the closing paren's end, which is
     * byte for byte the JS lowering's `a[0] + a[1] + a[2]`. `value-string`'s own reading, without
     * that row's scalar wrapper.
     */
    declare("paren-block", (c) => {
        const k = c.local(I32);
        const item = c.local(I32);
        const open = c.local(I32);
        const list = c.local(I32);
        const close = c.local(I32);
        const n = c.local(I32);
        const start = c.local(I32);
        const end = c.local(I32);
        const last = c.local(I32);
        c.block("void", (blk) => {
            blk.loop("void", (lp) => {
                lp.get(k).get(1).x("i32.ge_u").brIf(1);
                lp.get(0).get(k).x("i32.add").call(F.slotGet).set(item); //  the k-th leaf, k a LOCAL
                lp.get(item).load().i32(T_LIST).x("i32.eq").if_("void",
                    (b) => b.get(item).set(list),
                    (b) => b.get(list).x("i32.eqz").if_("void", (t) => t.get(item).set(open), (t) => t.get(item).set(close)));
                lp.get(k).i32(1).x("i32.add").set(k);
                lp.br(0);
            });
        });
        c.get(list).load(4).set(n);
        //  start: the opening brace's own start, else one before the first piece (else one before the closing brace)
        c.get(open).if_(I32,
            (t) => t.get(open).load(4),
            (e) => e.get(n).if_(I32,
                (t) => t.get(list).load(8).load(4).i32(1).x("i32.sub"),
                (u) => u.get(close).if_(I32, (t) => t.get(close).load(4).i32(1).x("i32.sub"), (v) => v.i32(0))));
        c.set(start);
        //  end: the closing brace's own end, else one after the last piece, else two after the start
        c.get(close).if_(I32,
            (t) => strEnd(t, close),
            (e) => e.get(n).if_(I32,
                (t) => {
                    t.get(list).get(n).i32(1).x("i32.sub").i32(4).x("i32.mul").x("i32.add").load(8).set(last);
                    strEnd(t, last);
                    t.i32(1).x("i32.add");
                },
                (u) => u.get(start).i32(2).x("i32.add")));
        c.set(end);
        c.get(start).get(end).get(start).x("i32.sub").call(F.mkStr);
    });

    /**
     * L-6: the trimmed name when it is `animation` or `animation-*` (ASCII-folded — `kwLookup`
     * folds the span it compares), else 0, the row's labelled zero-width failure. The `T_STR` the
     * runtime's `trimWs` answers is the same node the `declaration` constructor then trims again
     * (idempotent), so the name is the same span in both arms.
     */
    declare("animation-property", (c) => {
        const p = c.local(I32);
        const t = c.local(I32);
        const a = c.local(I32);
        const n = c.local(I32);
        arg(c, 0);
        c.set(p);
        c.get(p).load(4);
        strEnd(c, p);
        c.call(F.trimWs).set(t);
        c.get(t).load(4).set(a);
        c.get(t).load(8).set(n);
        c.get(n).i32(9).x("i32.lt_u").if_("void", (b) => b.i32(0).ret());
        c.i32(ANIMATION_BLOB).get(a).get(a).i32(9).x("i32.add").call(F.kwLookup).i32(0).x("i32.lt_s").if_("void", (b) => b.i32(0).ret());
        c.get(n).i32(9).x("i32.eq").if_("void", (b) => b.get(t).ret());
        c.get(a).i32(9).x("i32.add").i32(INPUT_BASE).x("i32.add").load8u().i32(45).x("i32.ne").if_("void", (b) => b.i32(0).ret());
        c.get(t);
    });

    return out;
}

const u32le = (n) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];

export { u32le };
