// Leaf tokens and low-level scanning helpers for the CSS parser.
// These are internal — not exported from the package.

import { Parser, regex } from "../../index.js";
import type { ParserState } from "../../state.js";

// Color function names recognized as producing CssColor values
export const COLOR_FUNCTIONS = new Set([
    "rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch",
    "oklab", "oklch", "color", "color-mix",
]);

/** Try parser, return value or undefined. Restores offset on failure. */
export function tryParse<T>(parser: Parser<T>, state: ParserState<T>): T | undefined {
    const saved = state.offset;
    parser.call(state);
    if (state.isError) {
        state.offset = saved;
        state.isError = false;
        return undefined;
    }
    return state.value;
}

/** Skip whitespace (no comments). */
export function skipWs(state: ParserState<unknown>): void {
    const src = state.src;
    let i = state.offset;
    while (i < src.length && (src.charCodeAt(i) <= 32)) i++;
    state.offset = i;
}

/** Skip whitespace + CSS block comments. */
export function skipWsAndComments(state: ParserState<unknown>): void {
    const src = state.src;
    let i = state.offset;
    while (i < src.length) {
        const ch = src.charCodeAt(i);
        if (ch <= 32) { i++; continue; }
        if (ch === 47 /* / */ && i + 1 < src.length && src.charCodeAt(i + 1) === 42 /* * */) {
            const end = src.indexOf("*/", i + 2);
            if (end === -1) break;
            i = end + 2;
            continue;
        }
        break;
    }
    state.offset = i;
}

export function isAtEnd(state: ParserState<unknown>): boolean {
    return state.offset >= state.src.length;
}

export function charAt(state: ParserState<unknown>): number {
    return state.src.charCodeAt(state.offset);
}

/** Consume literal string at current offset, advancing on match. */
export function matchStr(state: ParserState<unknown>, s: string): boolean {
    if (state.src.startsWith(s, state.offset)) {
        state.offset += s.length;
        return true;
    }
    return false;
}

// Leaf token parsers
export const cssIdent = regex(/[-]?[a-zA-Z_][\w-]*|--[\w-]+/);
export const cssString_ = regex(/"(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'/);
export const cssComment_ = regex(/\/\*[\s\S]*?\*\//);
export const cssNumberRe = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
export const cssUnitRe = regex(
    /(?:px|em|rem|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc|Q|cap|ic|lh|rlh|vi|vb|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|deg|rad|grad|turn|ms|s|Hz|kHz|dpi|dpcm|dppx|fr)/i,
);

// Typed wrappers around tryParse for hot-path token consumption

export function parseIdent(state: ParserState<unknown>): string | undefined {
    return tryParse(cssIdent as Parser<unknown>, state) as string | undefined;
}

export function parseString(state: ParserState<unknown>): string | undefined {
    return tryParse(cssString_ as Parser<unknown>, state) as string | undefined;
}

export function parseNumber(state: ParserState<unknown>): string | undefined {
    return tryParse(cssNumberRe as Parser<unknown>, state) as string | undefined;
}

export function parseUnit(state: ParserState<unknown>): string | undefined {
    return tryParse(cssUnitRe as Parser<unknown>, state) as string | undefined;
}
