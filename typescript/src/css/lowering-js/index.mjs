// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · LOWERING-JS, the boundary BND-1 (§5.8) and the product.
//
// Six steps, in order, shared with the Wasm lowering's own `ENTRY`: refuse a non-string ABOVE the
// algebra; build σ; run the production; close the tiling with `residue`; apply Π on failure;
// project `(V, D)`. No `try/catch` exists in `ENTRY` (DM-4) — a throw escaping it is K-8 and the
// probe is entitled to see it.

import { buildGrammar } from "../algebra/grammar.mjs";
import { L, labelIndex } from "../algebra/tables.mjs";
import { registryRows } from "../algebra/ops.mjs";
import { reifiedDispatchTerms, reifiedGrammar } from "../reify/term-alg.mjs";
// One substrate load for the lowering, in the module that instantiates the signature over it
// (`js-alg.mjs` already imports it and this file already imports `js-alg.mjs`): a second
// `tsImport` of the same library would be a second `Parser` class, and `instanceof` across the two
// would be false. COHESION §0n.5 / OP-7 — the fresh root's own `typescript/src/parse/**`.
import { INPUT_BOUND, capacityBreaches, capacityProduct } from "../bounds.mjs";
import {
    ARENA_CAP, C_CAP, D_CAP, EXPSNAP_CAP, MARK_CAP, P_CAP, REC_CAP, VSTACK_CAP,
} from "../lowering-wasm/layout.mjs";
import { createParserContext, jsAlgebra, newSigma, noteC, Parser } from "./js-alg.mjs";
import { deepFreeze, NONE_OPT, UNIT } from "./values.mjs";

/**
 * Θ, as this lowering carries it. `depthBound` is the one lazy back-edge's bound; the nine
 * capacities (X.P.W3.f, COHESION §0p/§0q) are the fixed regions of the Wasm memory model, each
 * VALUE read from the build's own layout constants — the JS lowering has no fixed regions of its
 * own, and it carries the SAME bounds so that the two targets answer identically at every one of
 * them. The input window is the one derived value (`bounds.mjs` CLASS3_PROOF). A caller's Θ may
 * move `depthBound` only: a capacity is a property of the memory model, not an option.
 */
const DEFAULT_THETA = Object.freeze({
    depthBound: 64,
    input: INPUT_BOUND,
    marks: MARK_CAP,
    recoveries: REC_CAP,
    D: D_CAP,
    C: C_CAP,
    P: P_CAP,
    vstack: VSTACK_CAP,
    arena: ARENA_CAP,
    expsnap: EXPSNAP_CAP,
});

export function makeJsLowering() {
    const ctx = { terms: {}, dispatch: {} };
    const A = jsAlgebra(ctx);
    const g = buildGrammar(A);
    Object.assign(ctx.terms, g.terms);
    Object.assign(ctx.dispatch, g.dispatchTerms);

    /** The root wrapper: it is where σ is born, and the only place it is. */
    const rootFor = (prod, theta) => {
        const body = ctx.terms[g.entries[prod]];
        if (!body) throw new Error(`HALT: '${prod}' is not an entry of the grammar map`);
        return new Parser(
            (state) => {
                state.w2 = newSigma(state.src, theta);
                body.parser(state);
                return state;
            },
            createParserContext("ENTRY", body, [prod]),
        );
    };

    const roots = Object.create(null);
    for (const prod of Object.keys(g.entries)) roots[prod] = rootFor(prod, DEFAULT_THETA);

    function parse(prod, source, theta) {
        //  the input window, BEFORE the run — the one capacity checked before any σ exists (class 1)
        if (source.length > DEFAULT_THETA.input) return capacityProduct(["input"], source, { C: 0, P: 0 });
        const root = theta && theta.depthBound !== DEFAULT_THETA.depthBound ? rootFor(prod, theta) : roots[prod];
        const state = root.parseState(source);
        const sg = state.w2;
        if (state.offset < source.length) {
            sg.C.push([state.offset, source.length - state.offset, "residue"]);
            noteC(sg);
        }
        if (state.isError) {
            const f = sg.far.f < 0 ? 0 : sg.far.f;
            const actual = source.slice(f);
            sg.D.push({
                code: sg.far.code === null ? "css_syntax" : sg.far.code,
                start: f,
                end: source.length,
                expected: sg.far.labels.map((idx) => L[idx]),
                actual: actual === "" ? null : actual,
            });
        }
        //  the journals' bounds, AFTER the run and after Π — the same counters the Wasm result block
        //  reports (class 1: monotone or never restored in this grammar) and the class-2 peaks,
        //  against the same declared values, in the same naming order
        const peaks = { C: sg.Chw, P: sg.Phw };
        const breached = capacityBreaches({
            marks: sg.marks.length, recoveries: sg.recoveries.length, D: sg.D.length, C: sg.Chw, P: sg.Phw,
        });
        if (breached.length > 0) return capacityProduct(breached, source, peaks);
        const ok = sg.D.length === 0;
        return {
            ok,
            V: ok ? state.value : undefined,
            C: sg.C,
            P: sg.P,
            D: sg.D,
            far: { f: sg.far.f, code: sg.far.code, labels: sg.far.labels.map((idx) => L[idx]) },
            sigma: { i: state.offset, depth: sg.depth, arena: 0 },
            marks: sg.marks,
            recoveries: sg.recoveries,
            peaks,
        };
    }

    const boundaryIssue = () => ({
        code: "css_syntax",
        start: 0,
        end: 0,
        expected: ["<string>"],
        actual: null,
    });

    const entryWith = (prod, freeze) => (source) => {
        if (typeof source !== "string") return { ok: false, diagnostics: [boundaryIssue()] };
        const p = parse(prod, source);
        if (!p.ok) return { ok: false, diagnostics: p.D };
        return { ok: true, value: freeze ? deepFreeze(p.V) : p.V, diagnostics: [] };
    };

    return {
        kind: "js",
        registry: () => registryRows((name) => `js:${name}`),
        labels: () => L.slice(),
        grammar: () => reifiedGrammar(),
        parse,
        entry: (prod) => entryWith(prod, true),
        entryNoFreeze: (prod) => entryWith(prod, false),
        parserGraph: () => Object.values(roots),
        arenaHighWater: () => 0,
        theta: () => DEFAULT_THETA,
        /** Exposed for the seat's own probes; not part of the adapter contract. */
        internals: { ctx, entries: g.entries, dispatchTerms: g.dispatchTerms },
    };
}


export { labelIndex, NONE_OPT, UNIT, reifiedDispatchTerms, reifiedGrammar };
