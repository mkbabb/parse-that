// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · THE SIGNATURE, as data.
//
// The twenty-two operations of `ALGEBRA.md` §4.1/§4.6 and nothing else. This file is the typed
// signature's name list and its registry-row shape; it is TARGET-INDEPENDENT by construction —
// it imports neither lowering, and no row here mentions a target. The grammar (`grammar.mjs`) is
// authored once against these names; each lowering instantiates them.
//
// `argKinds` is transcribed from `ALGEBRA.md` §4.6's `algebra-registry` block, cell for cell, and
// `arity` is derived from it by §4.6's own rule rather than typed a second time — a hand-typed
// arity is the v12 shape (a second list that can drift from the first).

/** The twenty-two, in contract order. `symbol` is the lowering's own; it is NOT here. */
export const OPS = [
    ["OP-01", "SCAN", "cls,N,N∞"],
    ["OP-02", "LIT", "S"],
    ["OP-03", "NUM", "-"],
    ["OP-04", "DIGITS", "N,N"],
    ["OP-05", "TEXT", "cls,N,N∞"],
    ["OP-06", "KW", "cls,kw"],
    ["OP-07", "END", "-"],
    ["OP-08", "SEQ", "T+"],
    ["OP-09", "ALT", "T+"],
    ["OP-10", "CUT", "-"],
    ["OP-11", "PURE", "lit"],
    ["OP-12", "REP", "T,N,N∞,T?"],
    ["OP-13", "DROP", "kind,T"],
    ["OP-14", "DISPATCH", "cls,disp"],
    ["OP-15", "FAIL", "code,L+"],
    ["OP-16", "EXPECT", "T,L+"],
    ["OP-17", "CLAMP", "F,F,T"],
    ["OP-18", "SCALE", "F,F,T"],
    ["OP-19", "CTOR", "ctor,T*"],
    ["OP-20", "TRY", "T"],
    ["OP-21", "RECOVER", "code,T,T"],
    ["OP-22", "REF", "G"],
].map(([opId, name, argKinds]) => ({ opId, name, argKinds }));

export const OP_NAMES = OPS.map((o) => o.name);

/**
 * §4.6's arity derivation, from the block's own argKinds cell:
 *   "-" → 0 · "T+" → 1+ · "T*" → 0+ · a trailing "?" → n-1/n · else the comma-separated count.
 */
export function arityOf(argKinds) {
    if (argKinds === "-") return "0";
    const parts = argKinds.split(",");
    const last = parts[parts.length - 1];
    if (parts.length === 1 && last.endsWith("+")) return "1+";
    if (parts.length === 1 && last.endsWith("*")) return "0+";
    if (last.endsWith("+")) return `${parts.length - 1}+`;
    if (last.endsWith("*")) return `${parts.length - 1}+`;
    if (last.endsWith("?")) return `${parts.length - 1}/${parts.length}`;
    return String(parts.length);
}

/** The registry rows a lowering publishes: the contract's four cells plus ITS OWN symbol. */
export function registryRows(symbolFor) {
    return OPS.map((o) => ({
        opId: o.opId,
        name: o.name,
        arity: arityOf(o.argKinds),
        argKinds: o.argKinds,
        symbol: symbolFor(o.name),
    }));
}

/** The eight frozen `ParseIssue` codes, `types.ts:12-19`, in declaration order. */
export const CODES = [
    "css_syntax",
    "trailing_input",
    "keyframe_selector_invalid",
    "color_context_required",
    "syntax_descriptor_invalid",
    "syntax_mismatch",
    "animation_option_invalid",
    "timeline_option_invalid",
];

/** `K_C`, §4.5, in the harness serializer's order. */
export const KINDS = ["ws", "comment", "punct", "keyword", "skipped", "residue"];

/** A shared sentinel for the `Unit` carrier: `SEQ` drops these from its tuple. */
export const UNIT = Symbol.for("w2.ac1.unit");
