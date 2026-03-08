// CSS selector parsing — simple, compound, and complex selectors.

import type { ParserState } from "../../state.js";
import type { CssSelector } from "./types.js";
import {
    isAtEnd, charAt, matchStr, skipWs, skipWsAndComments,
    parseIdent, parseString,
} from "./scan.js";

export function parseSelectorList(state: ParserState<unknown>): CssSelector[] | undefined {
    const first = parseComplexSelector(state);
    if (first === undefined) return undefined;
    const list = [first];
    // eslint-disable-next-line no-constant-condition
    while (true) {
        skipWsAndComments(state);
        if (!matchStr(state, ",")) break;
        skipWsAndComments(state);
        const sel = parseComplexSelector(state);
        if (sel === undefined) break;
        list.push(sel);
    }
    return list;
}

function parseComplexSelector(state: ParserState<unknown>): CssSelector | undefined {
    const left = parseCompoundSelector(state);
    if (left === undefined) return undefined;

    const cp = state.offset;
    skipWs(state);

    // Combinator: >, +, ~
    let combinator: string | undefined;
    const ch = isAtEnd(state) ? 0 : charAt(state);
    if (ch === 62 || ch === 43 || ch === 126) { // > + ~
        combinator = state.src[state.offset];
        state.offset++;
        skipWs(state);
    } else if (state.offset > cp && !isAtEnd(state)) {
        // Descendant combinator (whitespace between selectors)
        const next = charAt(state);
        if (next === 46 || next === 35 || next === 91 || next === 58 || next === 42 ||
            (next >= 97 && next <= 122) || (next >= 65 && next <= 90) || next === 95) {
            combinator = " ";
        } else {
            state.offset = cp;
        }
    } else {
        state.offset = cp;
    }

    if (combinator !== undefined) {
        const right = parseComplexSelector(state);
        if (right !== undefined) {
            return { type: "complex", left, combinator, right };
        }
        state.offset = cp;
    }

    return left;
}

function parseCompoundSelector(state: ParserState<unknown>): CssSelector | undefined {
    const parts: CssSelector[] = [];

    if (matchStr(state, "*")) {
        parts.push({ type: "universal" });
    } else {
        const saved = state.offset;
        const name = parseIdent(state);
        if (name !== undefined) {
            // ident( is a function call, not a type selector
            if (!isAtEnd(state) && charAt(state) === 40) {
                state.offset = saved;
            } else {
                parts.push({ type: "type", value: name });
            }
        }
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const s = parseSimpleSelectorSuffix(state);
        if (s === undefined) break;
        parts.push(s);
    }

    if (parts.length === 0) return undefined;
    if (parts.length === 1) return parts[0];
    return { type: "compound", parts };
}

function parseSimpleSelectorSuffix(state: ParserState<unknown>): CssSelector | undefined {
    if (isAtEnd(state)) return undefined;
    const ch = charAt(state);

    // .class
    if (ch === 46) {
        state.offset++;
        const name = parseIdent(state);
        if (name === undefined) { state.offset--; return undefined; }
        return { type: "class", value: "." + name };
    }
    // #id
    if (ch === 35) {
        state.offset++;
        const name = parseIdent(state);
        if (name === undefined) { state.offset--; return undefined; }
        return { type: "id", value: "#" + name };
    }
    // [attr]
    if (ch === 91) return parseAttributeSelector(state);
    // :pseudo or ::pseudo-element
    if (ch === 58) return parsePseudoSelector(state);
    // *
    if (ch === 42) { state.offset++; return { type: "universal" }; }

    return undefined;
}

function parseAttributeSelector(state: ParserState<unknown>): CssSelector | undefined {
    if (!matchStr(state, "[")) return undefined;
    skipWs(state);
    const name = parseIdent(state);
    if (name === undefined) return undefined;
    skipWs(state);

    let matcher: string | null = null;
    let value: string | null = null;
    const m = state.src.slice(state.offset).match(/^[~|^$*]?=/);
    if (m) {
        matcher = m[0];
        state.offset += m[0].length;
        skipWs(state);
        value = parseString(state) ?? parseIdent(state) ?? null;
        skipWs(state);
    }
    if (!matchStr(state, "]")) return undefined;
    return { type: "attribute", name, matcher, value };
}

function parsePseudoSelector(state: ParserState<unknown>): CssSelector | undefined {
    const isElement = matchStr(state, "::");
    if (!isElement && !matchStr(state, ":")) return undefined;

    const name = parseIdent(state);
    if (name === undefined) return undefined;

    if (matchStr(state, "(")) {
        skipWsAndComments(state);
        // nth-* pseudo-functions use An+B notation
        if (name.startsWith("nth-")) {
            const m = state.src.slice(state.offset).match(
                /^(?:(?:[+-]?\d*n\s*(?:[+-]\s*\d+)?)|(?:[+-]?\d+)|even|odd)/
            );
            if (m) state.offset += m[0].length;
            skipWsAndComments(state);
            if (!matchStr(state, ")")) return undefined;
            return {
                type: "pseudoFunction",
                name,
                args: m ? [{ type: "type", value: m[0] } as CssSelector] : [],
            };
        }
        const args = parseSelectorList(state) ?? [];
        skipWsAndComments(state);
        if (!matchStr(state, ")")) return undefined;
        return { type: "pseudoFunction", name, args };
    }

    return isElement
        ? { type: "pseudoElement", value: name }
        : { type: "pseudoClass", value: name };
}
