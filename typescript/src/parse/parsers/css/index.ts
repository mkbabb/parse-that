// CSS L1.5 parser — structural parse with typed values.
// Barrel re-exports all public types, the specificity function, and cssParser.

import { Parser } from "../../index.js";
import type { CssNode } from "./types.js";
import { isAtEnd, skipWs } from "./scan.js";
import { parseRule } from "./rule.js";

// Re-export all public types
export type {
    CssNode,
    CssQualifiedRule,
    CssAtMedia,
    CssAtSupports,
    CssAtFontFace,
    CssAtImport,
    CssAtKeyframes,
    CssGenericAtRule,
    CssCommentNode,
    CssDeclaration,
    CssValue,
    CssColor,
    CssSelector,
    KeyframeBlock,
    KeyframeStop,
    MediaQuery,
    MediaCondition,
    MediaFeature,
    RangeOp,
    SupportsCondition,
    Specificity,
} from "./types.js";

export { specificity } from "./specificity.js";

// Single-value reader: the first-char-dispatch single-pass CSS value reader.
// Exposed for consumers (e.g. value.js) that adopt the SOTA reader directly
// instead of re-implementing it (the §1.5 additive expose).
export { parseSingleValue, parseFunctionArgs } from "./value.js";

// ── Stylesheet entry point ──────────────────────────────────

export const cssParser = new Parser<CssNode[]>((state) => {
    const nodes: CssNode[] = [];

    for (;;) {
        skipWs(state);
        if (isAtEnd(state)) break;
        const node = parseRule(state);
        if (node !== undefined) {
            nodes.push(node);
        } else {
            if (isAtEnd(state)) break;
            const semi = state.src.indexOf(";", state.offset);
            const brace = state.src.indexOf("}", state.offset);
            const next = semi === -1 ? brace : brace === -1 ? semi : Math.min(semi, brace);
            if (next === -1) break;
            state.offset = next + 1;
        }
    }

    return state.ok(nodes);
});
