// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.b — THE RECOVERY LOWERING: A CLOSED AUTHENTICATED UNION WITH NO FALLBACK.
//
// `W3.md` §5 `.b`: "every rejection is a DESCRIPTION of the rejection, drawn from a union that is
// closed BY CONSTRUCTION rather than by review". This module is that projection, and it is the one
// place the fresh root turns a σ product into the frozen `ParseResult<T>`:
//
//     ParseResult<T> = { ok: true,  value, diagnostics: [] }
//                    | { ok: false,        diagnostics: [ParseIssue, ...ParseIssue[]] }
//                                                        (value.js/src/css/types.ts:25-27)
//
// It is LOWERING-AGNOSTIC on purpose: it takes a lowering and returns a recovery surface over it,
// so the JS target and the Wasm target are projected by THE SAME BYTES. G-5's dual-target identity
// then cannot be broken by the projection — only by the lowerings themselves, which is the only
// place a difference would mean anything.
//
// THREE CONSTRUCTION-TIME PROOFS, and no parse-time arm:
//   1. `assertClosedOperatorSet()` — COHESION §0n.1's carried obligation, wired. AC-2's closed-union
//      enforcement is kept as AC-1's analog: `buildGrammar` destructures EXACTLY the twenty-two
//      typed operations, and until now that was a COMMENT (`algebra/grammar.mjs:5`, "written against
//      the twenty-two"). Here it is a CHECK: the grammar is built once against a recording probe,
//      the operator names it actually destructures are read off, and both set-differences against
//      `OP_NAMES` must be empty. A 23rd operation — added to the signature, or destructured by the
//      grammar — HALTS at load, and since every recovery entry of BOTH lowerings is constructed
//      through this module, it halts both.
//   2. `assertLoweringSignature(lowering)` — the same closure read from the other end: the
//      lowering's own published registry must be exactly the twenty-two. A lowering that grew an
//      operation the signature does not carry halts here rather than shipping a target-only op.
//   3. `assertGraphClosed(lowering)` (`codes.mjs`) — every code the built graph can declare is a
//      member of the frozen eight, enumerated over a finite closed map.
//
// After those three, the parse path carries NO violation arm, NO `default:`, NO `else` and NO
// `??`/`||` substitution — the selection is a lookup (`codes.mjs`'s `selectCode`), and its miss case
// is unreachable rather than unobserved. That distinction is the whole of §11 item 3's guardrail:
// OR05 looked closed because eighteen of twenty formulas bound and the last two were MISBOUND. A
// fallback arm is the same disease — it makes an unbound case look bound.

import { buildGrammar } from "./algebra/grammar.mjs";
import { OPS, OP_NAMES } from "./algebra/ops.mjs";
import { assertGraphClosed, difference, selectCode } from "./codes.mjs";
import { boundaryIssue, promoteExpected } from "./diagnostics.mjs";
import { deepFreeze } from "./lowering-js/values.mjs";

/** The signature's cardinality, written once. `ALGEBRA.md` §4.1/§4.6 — OP-01 … OP-22. */
export const SIGNATURE_SIZE = 22;

const EMPTY_DIAGNOSTICS = Object.freeze([]);

/* ── proof 1: the operator set the grammar actually destructures ───────────────────────────── */

/**
 * `buildGrammar` is run against a probe that records every operation name it reads. The destructure
 * at `algebra/grammar.mjs:25` is the read; the stub each operation returns is enough for the
 * grammar to compose (it never inspects a term) and for its own `R_disp` resolution to pass.
 * Nothing is parsed, nothing is lowered, and no lowering is instantiated.
 */
export function destructuredOperators(build = buildGrammar) {
    const read = [];
    const stub = () => ({ probe: "operator" });
    const probe = new Proxy(Object.create(null), {
        get(_target, key) {
            if (typeof key === "string") read.push(key);
            return stub;
        },
    });
    build(probe);
    return read;
}

/**
 * COHESION §0n.1's carried obligation: a 23rd operation halts, and it halts at load.
 *
 * `build` is a parameter ONLY so the gate can run its POSITIVE CONTROL against this very function
 * (`scripts/css-recovery-closure.mjs`, negative controls): a check that cannot be made to fire is
 * decorative, and W2 G-4's rule — "a probe that cannot fail for its intended reason is itself a
 * defect" — binds the checks as well as the probes. Every production call takes the default.
 */
export function assertClosedOperatorSet(build = buildGrammar) {
    const destructured = destructuredOperators(build);
    const extra = difference(destructured, OP_NAMES);
    const missing = difference(OP_NAMES, destructured);
    const duplicated = destructured.filter((name, i) => destructured.indexOf(name) !== i);
    if (
        OPS.length !== SIGNATURE_SIZE ||
        destructured.length !== SIGNATURE_SIZE ||
        extra.length > 0 ||
        missing.length > 0 ||
        duplicated.length > 0
    ) {
        throw new Error(
            `HALT: the grammar is not authored against exactly the ${SIGNATURE_SIZE}. ` +
                `signature=${OPS.length} destructured=${destructured.length} ` +
                `extra=[${extra.join(", ")}] missing=[${missing.join(", ")}] duplicated=[${[...new Set(duplicated)].join(", ")}]. ` +
                `A 23rd operation is a change to the typed signature both lowerings instantiate — it halts ` +
                `BOTH of them here (COHESION §0n.1), and it is not a local decision.`,
        );
    }
    return { signature: OPS.length, destructured: destructured.length, extra, missing };
}

/** The closure read from the lowering's end: its published registry is exactly the twenty-two. */
export function assertLoweringSignature(lowering) {
    const published = lowering.registry().map((row) => row.name);
    const extra = difference(published, OP_NAMES);
    const missing = difference(OP_NAMES, published);
    if (published.length !== SIGNATURE_SIZE || extra.length > 0 || missing.length > 0) {
        throw new Error(
            `HALT: the '${lowering.kind}' lowering publishes ${published.length} operations, not ${SIGNATURE_SIZE}. ` +
                `extra=[${extra.join(", ")}] missing=[${missing.join(", ")}].`,
        );
    }
    return { published: published.length, extra, missing };
}

/** The check is wired at LOAD, not offered as a function nobody calls. */
export const OPERATOR_CLOSURE = Object.freeze(assertClosedOperatorSet());

/* ── the projection ────────────────────────────────────────────────────────────────────────── */

/**
 * One σ diagnostic, lowered to one frozen `ParseIssue`. The code is a LOOKUP; the expectations are
 * σ's own labels promoted to named productions in σ's own order (`diagnostics.mjs`); the span and
 * the observed text are carried through unchanged, because they are measurements and this module
 * does not measure.
 */
const issueOf = (raw) =>
    Object.freeze({
        code: selectCode(raw.code),
        start: raw.start,
        end: raw.end,
        expected: Object.freeze(promoteExpected(raw.expected)),
        actual: raw.actual,
    });

/**
 * A recovery surface over one lowering. Construction proves the closure; the returned entries are
 * total functions of their argument and carry no `try`/`catch` — a throw escaping one is K-8 and the
 * probe is entitled to see it (DM-4), never something this module hides.
 */
export function makeRecoveryLowering(lowering) {
    assertClosedOperatorSet();
    assertLoweringSignature(lowering);
    const closure = assertGraphClosed(lowering);
    const entries = Object.keys(lowering.grammar().entries);

    const recover = (prod, source) => {
        if (typeof source !== "string") return { ok: false, diagnostics: Object.freeze([boundaryIssue()]) };
        const p = lowering.parse(prod, source);
        if (p.ok) return { ok: true, value: deepFreeze(p.V), diagnostics: EMPTY_DIAGNOSTICS };
        return { ok: false, diagnostics: Object.freeze(p.D.map(issueOf)) };
    };

    return {
        kind: lowering.kind,
        entries: () => entries.slice(),
        closure: () => ({ ...closure, declared: closure.declared.slice(), missing: closure.missing.slice() }),
        /** The frozen entry: `(source) => ParseResult<T>`, one per production the grammar names. */
        entry: (prod) => {
            if (!entries.includes(prod)) {
                throw new Error(`HALT: '${prod}' is not an entry of the grammar map — [${entries.join(", ")}]`);
            }
            return (source) => recover(prod, source);
        },
        /** The raw σ product beside the frozen result, for the closure gate's own measurements. */
        probe: (prod, source) => ({
            result: recover(prod, source),
            sigma: typeof source === "string" ? lowering.parse(prod, source) : null,
        }),
    };
}

/**
 * Both recovery surfaces, over the declared adapter. Loaded dynamically so that a consumer of the
 * JS half never pays for instantiating the Wasm module, and so that this file's own import graph
 * stays free of either lowering — the projection is agnostic by construction, not by discipline.
 */
export async function loadRecoveryLowerings() {
    const { lowerings } = await import("./harness-adapter.mjs");
    return { js: makeRecoveryLowering(lowerings.js), wasm: makeRecoveryLowering(lowerings.wasm) };
}
