// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — the carrier kinds 𝒦 (`ALGEBRA.md` §4.0) as the JS lowering represents them, and the
// pure helpers BOTH lowerings must agree on byte for byte. Everything here is a total function of
// its arguments: no σ, no journals, no host state.

/** `Unit` — dropped from every `SEQ` tuple. */
export const UNIT = Symbol("unit");
/** `Opt<A>`'s `none` — what a recovered site yields (OP-21). */
export const NONE_OPT = Symbol("none-opt");

export const span = (s, e) => ({ s, e });
export const tuple = (t) => ({ t });
export const list = (l) => ({ l });
export const isTuple = (v) => Boolean(v) && typeof v === "object" && Array.isArray(v.t);
export const isList = (v) => Boolean(v) && typeof v === "object" && Array.isArray(v.l);

/** ASCII case folding — `A-Z → a-z` and nothing else (§5.1). */
export function asciiFold(str) {
    let out = "";
    for (let k = 0; k < str.length; k++) {
        const c = str.charCodeAt(k);
        out += c >= 65 && c <= 90 ? String.fromCharCode(c + 32) : str[k];
    }
    return out;
}

/**
 * `CLAMP`'s arithmetic (OP-17), written so the two lowerings cannot drift: `min(max(v, lo), hi)` in
 * that order. `Math.max(-0, 0)` is `+0` and `f64.max(-0, 0)` is `+0`; `Math.min(NaN, hi)` is `NaN`
 * and `f64.min(NaN, hi)` is `NaN`. The two instruction sets agree on both edge cases, which is why
 * this form — and not `v < lo ? lo : v` — is the one both carry.
 */
export const clampValue = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/** `SCALE`'s arithmetic (OP-18, debt D-4): two IEEE-754 operations, in this order, never folded. */
export const scaleValue = (v, num, den) => (v * num) / den;

/**
 * The `style-rule` constructor's selector split: top-level "," only, each side trimmed of the ws
 * class. A pure string operation over an already-owned span (§10.3), identical in both lowerings.
 */
export function splitSelectors(prelude) {
    const out = [];
    let depth = 0;
    let start = 0;
    for (let k = 0; k < prelude.length; k++) {
        const c = prelude[k];
        if (c === "(" || c === "[") depth++;
        else if (c === ")" || c === "]") depth = depth > 0 ? depth - 1 : 0;
        else if (c === "," && depth === 0) {
            out.push(trimWs(prelude.slice(start, k)));
            start = k + 1;
        }
    }
    out.push(trimWs(prelude.slice(start)));
    return out;
}

const WS_CHARS = " \t\n\r\f";
export function trimWs(str) {
    let a = 0;
    let b = str.length;
    while (a < b && WS_CHARS.includes(str[a])) a++;
    while (b > a && WS_CHARS.includes(str[b - 1])) b--;
    return str.slice(a, b);
}

/** DM-1: `ENTRY` deep-freezes `V` on success; the algebra's constructors never freeze. */
export function deepFreeze(v) {
    if (v === null || typeof v !== "object" || Object.isFrozen(v)) return v;
    Object.freeze(v);
    for (const key of Object.keys(v)) deepFreeze(v[key]);
    return v;
}
