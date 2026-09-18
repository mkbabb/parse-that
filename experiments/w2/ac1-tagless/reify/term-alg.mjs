// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · THE TERM INSTANTIATION.
//
// The same twenty-two-operation signature, instantiated to produce JSON terms in `.g`'s encoding
// (`harness/w2/lib/term.mjs`): `{ op, args }` with `Arg = Term | {lit} | {ref} | {reg} | {label} |
// {code} | {kind}`. It is what `lowerings.<k>.grammar()` returns, and it is the reason the seat can
// hand the harness a walkable grammar without the grammar ever having been written as data: the
// data is a VIEW of the authored signature calls, produced by instantiating them.
//
// Every call allocates a FRESH object. Sharing one node between two use sites would make the term a
// DAG, and CL-1's walk reads a revisited object as a cycle — so freshness is load-bearing.
//
// `DISPATCH` carries two registry references and NOT its rows' terms, exactly as `ALGEBRA.md` §4.6
// writes it (`DISPATCH cls,disp`, arity 2) and §4.4 shapes `R_disp` (`{key → term}`, a registry).
// The consequence is measured and printed by the seat rather than left implicit: the structural
// walk reaches only what `grammar().terms` reaches, and the dispatch rows' terms are walked by the
// seat's own probe with `.g`'s own checkers.

import { buildGrammar } from "../algebra/grammar.mjs";

const lit = (v) => ({ lit: v });

/**
 * THE THIRD INSTANTIATION, and the one both lowerings hand the harness: `grammar()` is the authored
 * grammar reified to data. It is rebuilt on every call rather than cached — a module-level cache is
 * mutable process state on a path a probe walks (O-8/K-6) — and the construction is off the parse
 * path entirely.
 */
export function reifiedGrammar() {
    const g = buildGrammar(termAlgebra());
    return { entries: g.entries, terms: g.terms };
}

export function reifiedDispatchTerms() {
    return buildGrammar(termAlgebra()).dispatchTerms;
}

export function termAlgebra() {
    return {
        SCAN: (cls, min, max) => ({ op: "SCAN", args: [{ reg: `R_cls.${cls}` }, lit(min), lit(max)] }),
        LIT: (bytes) => ({ op: "LIT", args: [lit(bytes)] }),
        NUM: () => ({ op: "NUM", args: [] }),
        DIGITS: (radix, n) => ({ op: "DIGITS", args: [lit(radix), lit(n)] }),
        TEXT: (cls, min, max) => ({ op: "TEXT", args: [{ reg: `R_cls.${cls}` }, lit(min), lit(max)] }),
        KW: (cls, table) => ({ op: "KW", args: [{ reg: `R_cls.${cls}` }, { reg: `R_kw.${table}` }] }),
        END: () => ({ op: "END", args: [] }),
        SEQ: (...ops) => ({ op: "SEQ", args: ops }),
        ALT: (...ops) => ({ op: "ALT", args: ops }),
        CUT: () => ({ op: "CUT", args: [] }),
        PURE: (v) => ({ op: "PURE", args: [lit(v)] }),
        REP: (o, min, max, sep) => ({ op: "REP", args: sep ? [o, lit(min), lit(max), sep] : [o, lit(min), lit(max)] }),
        DROP: (kind, o) => ({ op: "DROP", args: [{ kind }, o] }),
        DISPATCH: (cls, table) => ({ op: "DISPATCH", args: [{ reg: `R_cls.${cls}` }, { reg: `R_disp.${table}` }] }),
        FAIL: (code, ...labels) => ({ op: "FAIL", args: [{ code }, ...labels.map((label) => ({ label }))] }),
        EXPECT: (o, ...labels) => ({ op: "EXPECT", args: [o, ...labels.map((label) => ({ label }))] }),
        CLAMP: (lo, hi, o) => ({ op: "CLAMP", args: [lit(lo), lit(hi), o] }),
        SCALE: (num, den, o) => ({ op: "SCALE", args: [lit(num), lit(den), o] }),
        CTOR: (row, ...ops) => ({ op: "CTOR", args: [{ reg: `R_ctor.${row}` }, ...ops] }),
        TRY: (o) => ({ op: "TRY", args: [o] }),
        RECOVER: (code, o, sync) => ({ op: "RECOVER", args: [{ code }, o, sync] }),
        REF: (name) => ({ op: "REF", args: [{ ref: name }] }),
    };
}
