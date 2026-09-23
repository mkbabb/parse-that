// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.b — THE FROZEN `ParseIssue` CODE UNION, CLOSED BY CONSTRUCTION.
//
// `W3.md` §3 item 4: "every failure carries a code drawn from the frozen 8-code `ParseIssue` union
// … with NO FALLBACK ARM anywhere in the lowering". This module is the union's single authority in
// the fresh root, and it is written so that the closure is a PROPERTY OF THE BUILD rather than a
// property of a review:
//
//   * the eight names come from ONE place (`algebra/ops.mjs`'s `CODES`, transcribed from
//     `value.js/src/css/types.ts:11-19`); a second hand-typed list is the v12 shape at one remove
//     (§11 item 3 — OR05's 18 declared IDs against a 20-formula domain, the registry binding the
//     first 18, the last declared IDs MISBOUND rather than absent), so there is not one here;
//   * `selectCode` is a LOOKUP into a frozen, null-prototype table — not a `switch`, so it has no
//     `default:` arm to write, and not a `??`/`||` chain, so it has no silent substitution either;
//   * the set of codes the built graph can ever declare is FINITE and ENUMERABLE (the grammar map
//     is finite and closed, OP-22), so `assertGraphClosed` is a PROOF at construction rather than a
//     sample: it enumerates every code-bearing cell the graph reaches and halts on a non-member.
//     That is what lets the parse path carry no violation arm at all — a miss there is unreachable,
//     not merely unobserved, and a throw on the parse path would fail G-3 anyway.
//
// A NINTH CODE IS NOT A LOCAL DECISION. `W3.md` §3a: adding one is a contract change to a frozen
// surface; it halts the wave and goes to X·V and the owner. This module therefore never widens —
// it only ever refuses.

import { CODES } from "./algebra/ops.mjs";
import { R_ctor, R_disp, R_kw } from "./algebra/tables.mjs";
import { reifiedDispatchTerms } from "./reify/term-alg.mjs";

/** The eight, in `types.ts` declaration order. Frozen: the array a consumer holds cannot grow. */
export const FROZEN_CODES = Object.freeze([...CODES]);

/** The union's cardinality, written once so a drift is an equality failure and not a re-count. */
export const FROZEN_UNION_SIZE = 8;

if (FROZEN_CODES.length !== FROZEN_UNION_SIZE) {
    throw new Error(
        `HALT: the frozen ParseIssue union has ${FROZEN_CODES.length} members, not ${FROZEN_UNION_SIZE}. ` +
            `A ninth code is a contract change to a frozen surface (W3.md §3a) — it halts the wave and goes ` +
            `to X·V and the owner; it is never a local decision.`,
    );
}

/**
 * The selection table: keys are exactly the eight, prototype is null (so `selectCode("toString")`
 * cannot inherit a member), and the value is the code itself. `selectCode` is one property read.
 */
const TABLE = Object.freeze(
    FROZEN_CODES.reduce((t, code) => {
        t[code] = code;
        return t;
    }, Object.create(null)),
);

/** True iff `code` is one of the eight. No coercion, no normalization, no aliasing. */
export const isFrozenCode = (code) => typeof code === "string" && TABLE[code] !== undefined;

/**
 * THE CODE SELECTION, and the whole of it. A lookup, so there is no arm to default: a member
 * returns itself, a non-member returns `undefined` — never a substituted code. The construction
 * proof (`assertGraphClosed`) is what makes the second case unreachable in a built lowering.
 */
export const selectCode = (code) => TABLE[code];

/**
 * The two codes the ALGEBRA'S OWN OPERATORS raise, independently of any registry row: `END` raises
 * `trailing_input` (`js-alg.mjs` END, `wasm-alg.mjs` END), and every other leaf failure plus the
 * `REF` depth bound raises `css_syntax`. They are DECLARED here and VERIFIED mechanically against
 * both lowerings' sources by `scripts/css-recovery-closure.mjs` (`--assert-intrinsics`), so the
 * declaration cannot drift away from the bytes it claims to describe.
 */
export const INTRINSIC_CODES = Object.freeze(["css_syntax", "trailing_input"]);

/* ── the built-graph enumeration ───────────────────────────────────────────────────────────── */

const REGISTRIES = Object.freeze({ R_kw, R_disp, R_ctor });

/** Every `{code}` argument and every `{reg}` reference the reified term tree reaches, with a site. */
function walkTerm(term, site, out, seen) {
    if (term === null || typeof term !== "object") return;
    if (seen.has(term)) return;
    seen.add(term);
    if (typeof term.code === "string") out.push({ code: term.code, site, via: "term-arg" });
    if (typeof term.reg === "string") {
        const [registry, row] = term.reg.split(".");
        const table = REGISTRIES[registry];
        if (table !== undefined && table[row] !== undefined && typeof table[row].code === "string") {
            out.push({ code: table[row].code, site: `${site} → ${term.reg}.code`, via: "registry-row" });
        }
        return;
    }
    if (Array.isArray(term.args)) for (const arg of term.args) walkTerm(arg, `${site}/${term.op}`, out, seen);
}

/**
 * Every code the BUILT GRAPH can declare, with the cell it was read from. Both halves of the
 * grammar map are walked: `terms` AND `dispatchTerms`. The harness's structural walk reaches only
 * `grammar().terms` (measured and declared at X.P.W2 — `VERDICT.md`, restated as X.P.W3.0's F-0.2),
 * so a closure proof that reached only the same half would inherit the same blind spot; the seven
 * dispatch productions are walked here for exactly that reason.
 */
export function graphCodeSites(lowering) {
    const out = [];
    const seen = new Set();
    const g = lowering.grammar();
    for (const [name, term] of Object.entries(g.terms)) walkTerm(term, `terms.${name}`, out, seen);
    for (const [name, term] of Object.entries(reifiedDispatchTerms())) {
        walkTerm(term, `dispatchTerms.${name}`, out, seen);
    }
    for (const [registry, table] of Object.entries(REGISTRIES)) {
        for (const [row, cells] of Object.entries(table)) {
            if (typeof cells.code === "string") out.push({ code: cells.code, site: `${registry}.${row}.code`, via: "registry-cell" });
        }
    }
    for (const code of INTRINSIC_CODES) out.push({ code, site: "algebra operators", via: "intrinsic" });
    return out;
}

/** The set difference `a \ b`, as a sorted array — the X·V 117-row idiom, printed in both directions. */
export const difference = (a, b) => [...new Set(a)].filter((x) => !new Set(b).has(x)).sort();

/**
 * The ⊆ direction, proven at construction over the finite closed graph. A non-member halts the
 * lowering it was found in — which is the only place a closure violation can be answered honestly,
 * because the parse path itself must stay total (G-3).
 */
export function assertGraphClosed(lowering) {
    const sites = graphCodeSites(lowering);
    const declared = [...new Set(sites.map((s) => s.code))].sort();
    const undeclared = sites.filter((s) => !isFrozenCode(s.code));
    if (undeclared.length > 0) {
        throw new Error(
            `HALT: the built graph of the '${lowering.kind}' lowering declares ${undeclared.length} code(s) outside the ` +
                `frozen eight: ${undeclared.map((s) => `${s.code} @ ${s.site}`).join(", ")}. Widening the union is a ` +
                `contract change to a frozen surface (W3.md §3a) — X·V and the owner, never here.`,
        );
    }
    return { declared, siteCount: sites.length, missing: difference(FROZEN_CODES, declared) };
}

/**
 * The authentication of this module against the contract itself: `list` is the code union read from
 * `value.js/src/css/types.ts` at a pinned commit. BOTH set-differences must be empty — an extra is a
 * widening, a missing is this module having narrowed the frozen surface behind the gate's back.
 */
export function assertFrozenUnion(list, where) {
    const extra = difference(list, FROZEN_CODES);
    const missing = difference(FROZEN_CODES, list);
    if (extra.length > 0 || missing.length > 0) {
        throw new Error(
            `HALT: the frozen union at ${where} is not the union this root declares. ` +
                `extra=[${extra.join(", ")}] missing=[${missing.join(", ")}]`,
        );
    }
    return { size: FROZEN_CODES.length, extra, missing };
}
