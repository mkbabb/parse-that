// Rule parsing — declarations, keyframes, at-rules, qualified rules, and the
// top-level rule dispatcher that selects between comments, at-rules, and
// qualified rules based on the first character.

import type { ParserState } from "../../state.js";
import type { CssNode, CssDeclaration, CssValue, KeyframeBlock, KeyframeStop } from "./types.js";
import {
    isAtEnd, charAt, matchStr, skipWs, skipWsAndComments,
    parseIdent, parseString, parseNumber,
} from "./scan.js";
import { parseSingleValue } from "./value.js";
import { parseSelectorList } from "./selector.js";
import { parseMediaQueryList, parseSupportsCondition } from "./media.js";

// ── Declarations ────────────────────────────────────────────

function parseDeclaration(state: ParserState<unknown>): CssDeclaration | undefined {
    skipWsAndComments(state);
    const property = parseIdent(state);
    if (property === undefined) return undefined;
    skipWsAndComments(state);
    if (!matchStr(state, ":")) return undefined;
    skipWsAndComments(state);

    const values: CssValue[] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
        skipWsAndComments(state);
        if (isAtEnd(state)) break;
        const ch = charAt(state);
        if (ch === 59 || ch === 125) break; // ; or }
        const v = parseSingleValue(state);
        if (v === undefined) break;
        values.push(v);
    }

    matchStr(state, ";");
    return { property, values, important: false };
}

function parseDeclarationBlock(state: ParserState<unknown>): CssDeclaration[] | undefined {
    if (!matchStr(state, "{")) return undefined;
    const declarations: CssDeclaration[] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
        skipWsAndComments(state);
        if (isAtEnd(state)) return undefined;
        if (matchStr(state, "}")) break;

        const d = parseDeclaration(state);
        if (d !== undefined) {
            declarations.push(d);
        } else {
            // Skip to ; or } to recover from malformed declaration
            const rest = state.src.slice(state.offset);
            const idx = rest.search(/[;}]/);
            if (idx >= 0) {
                state.offset += idx;
                matchStr(state, ";");
            } else {
                break;
            }
        }
    }
    return declarations;
}

// ── Keyframes ───────────────────────────────────────────────

function parseKeyframeStop(state: ParserState<unknown>): KeyframeStop | undefined {
    if (matchStr(state, "from")) return { type: "from" };
    if (matchStr(state, "to")) return { type: "to" };
    const numStr = parseNumber(state);
    if (numStr !== undefined && matchStr(state, "%")) {
        return { type: "percentage", value: Number(numStr) };
    }
    return undefined;
}

function parseKeyframeBlock(state: ParserState<unknown>): KeyframeBlock | undefined {
    skipWsAndComments(state);
    const stops: KeyframeStop[] = [];
    const first = parseKeyframeStop(state);
    if (first === undefined) return undefined;
    stops.push(first);
    // eslint-disable-next-line no-constant-condition
    while (true) {
        skipWsAndComments(state);
        if (!matchStr(state, ",")) break;
        skipWsAndComments(state);
        const s = parseKeyframeStop(state);
        if (s === undefined) break;
        stops.push(s);
    }
    skipWsAndComments(state);
    const declarations = parseDeclarationBlock(state);
    if (declarations === undefined) return undefined;
    return { stops, declarations };
}

// ── At-rules ────────────────────────────────────────────────

/** Parse body rules inside braces (shared by @media, @supports, generic at-rules). */
function parseRuleBody(state: ParserState<unknown>): CssNode[] | undefined {
    const body: CssNode[] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
        skipWsAndComments(state);
        if (isAtEnd(state)) return undefined;
        if (matchStr(state, "}")) break;
        const node = parseRule(state);
        if (node !== undefined) {
            body.push(node);
        } else {
            const skip = state.src.slice(state.offset).search(/[;}]/);
            if (skip >= 0) { state.offset += skip; matchStr(state, ";"); }
            else break;
        }
    }
    return body;
}

function parseAtRule(state: ParserState<unknown>): CssNode | undefined {
    if (!matchStr(state, "@")) return undefined;
    const name = parseIdent(state);
    if (name === undefined) return undefined;
    skipWsAndComments(state);

    switch (name) {
        case "media": {
            const queries = parseMediaQueryList(state);
            skipWsAndComments(state);
            if (!matchStr(state, "{")) return undefined;
            const body = parseRuleBody(state);
            if (body === undefined) return undefined;
            return { type: "atMedia", queries, body };
        }
        case "supports": {
            const condition = parseSupportsCondition(state);
            if (condition === undefined) return undefined;
            skipWsAndComments(state);
            if (!matchStr(state, "{")) return undefined;
            const body = parseRuleBody(state);
            if (body === undefined) return undefined;
            return { type: "atSupports", condition, body };
        }
        case "font-face": {
            skipWsAndComments(state);
            const declarations = parseDeclarationBlock(state);
            if (declarations === undefined) return undefined;
            return { type: "atFontFace", declarations };
        }
        case "import": {
            skipWsAndComments(state);
            const values: CssValue[] = [];
            // eslint-disable-next-line no-constant-condition
            while (true) {
                skipWsAndComments(state);
                if (isAtEnd(state) || charAt(state) === 59) break;
                const v = parseSingleValue(state);
                if (v === undefined) break;
                values.push(v);
            }
            matchStr(state, ";");
            return { type: "atImport", values };
        }
        case "keyframes":
        case "-webkit-keyframes":
        case "-moz-keyframes": {
            skipWsAndComments(state);
            const kfName = parseIdent(state) ?? parseString(state);
            if (kfName === undefined) return undefined;
            skipWsAndComments(state);
            if (!matchStr(state, "{")) return undefined;

            const blocks: KeyframeBlock[] = [];
            // eslint-disable-next-line no-constant-condition
            while (true) {
                skipWsAndComments(state);
                if (isAtEnd(state)) return undefined;
                if (matchStr(state, "}")) break;
                const block = parseKeyframeBlock(state);
                if (block !== undefined) {
                    blocks.push(block);
                } else {
                    const skip = state.src.slice(state.offset).search(/}/);
                    if (skip >= 0) state.offset += skip;
                    else break;
                }
            }
            return { type: "atKeyframes", name: kfName, blocks };
        }
        default: {
            const rest = state.src.slice(state.offset);
            const idx = rest.search(/[{;]/);
            let prelude = "";
            let hasBlock = false;
            if (idx >= 0) {
                prelude = rest.slice(0, idx).trim();
                state.offset += idx;
                if (matchStr(state, "{")) hasBlock = true;
                else matchStr(state, ";");
            }

            let body: CssNode[] | null = null;
            if (hasBlock) {
                body = parseRuleBody(state) ?? [];
            }
            return { type: "genericAtRule", name, prelude, body };
        }
    }
}

// ── Qualified rule ──────────────────────────────────────────

function parseQualifiedRule(state: ParserState<unknown>): CssNode | undefined {
    const selectorList = parseSelectorList(state);
    if (selectorList === undefined) return undefined;
    skipWsAndComments(state);
    const declarations = parseDeclarationBlock(state);
    if (declarations === undefined) return undefined;
    return { type: "qualifiedRule", selectorList, declarations };
}

// ── Top-level rule dispatcher ───────────────────────────────

export function parseRule(state: ParserState<unknown>): CssNode | undefined {
    skipWs(state);
    if (isAtEnd(state)) return undefined;

    // Comment node
    if (charAt(state) === 47 && state.offset + 1 < state.src.length &&
        state.src.charCodeAt(state.offset + 1) === 42) {
        const end = state.src.indexOf("*/", state.offset + 2);
        if (end === -1) return undefined;
        const value = state.src.slice(state.offset, end + 2);
        state.offset = end + 2;
        return { type: "comment", value };
    }

    // @ → at-rule
    if (charAt(state) === 64) return parseAtRule(state);

    // Otherwise → qualified rule (selector + declaration block)
    return parseQualifiedRule(state);
}
