/**
 * CSS L1.5 parser — structural parse with typed values.
 * Built from parse-that combinators, isomorphic to Rust implementation.
 */
import { Parser, regex, string, dispatch } from "../index.js";
import type { ParserState } from "../state.js";

// ── CSS AST types ───────────────────────────────────────────

export type CssNode =
    | CssQualifiedRule
    | CssAtMedia
    | CssAtSupports
    | CssAtFontFace
    | CssAtImport
    | CssAtKeyframes
    | CssGenericAtRule
    | CssCommentNode;

export interface CssQualifiedRule {
    type: "qualifiedRule";
    selectorList: CssSelector[];
    declarations: CssDeclaration[];
}

export interface CssAtMedia {
    type: "atMedia";
    prelude: string;
    body: CssNode[];
}

export interface CssAtSupports {
    type: "atSupports";
    prelude: string;
    body: CssNode[];
}

export interface CssAtFontFace {
    type: "atFontFace";
    declarations: CssDeclaration[];
}

export interface CssAtImport {
    type: "atImport";
    values: CssValue[];
}

export interface CssAtKeyframes {
    type: "atKeyframes";
    name: string;
    blocks: KeyframeBlock[];
}

export interface CssGenericAtRule {
    type: "genericAtRule";
    name: string;
    prelude: string;
    body: CssNode[] | null;
}

export interface CssCommentNode {
    type: "comment";
    value: string;
}

export interface CssDeclaration {
    property: string;
    values: CssValue[];
    important: boolean;
}

export type CssValue =
    | { type: "dimension"; value: number; unit: string }
    | { type: "number"; value: number }
    | { type: "percentage"; value: number }
    | { type: "color"; color: CssColor }
    | { type: "function"; name: string; args: CssValue[] }
    | { type: "string"; value: string }
    | { type: "ident"; value: string }
    | { type: "comma" }
    | { type: "slash" }
    | { type: "operator"; value: string };

export type CssColor =
    | { type: "hex"; value: string }
    | { type: "named"; value: string }
    | { type: "function"; name: string; args: CssValue[] };

export type CssSelector =
    | { type: "type"; value: string }
    | { type: "class"; value: string }
    | { type: "id"; value: string }
    | { type: "universal" }
    | {
          type: "attribute";
          name: string;
          matcher: string | null;
          value: string | null;
      }
    | { type: "pseudoClass"; value: string }
    | { type: "pseudoElement"; value: string }
    | { type: "pseudoFunction"; name: string; args: CssSelector[] }
    | { type: "compound"; parts: CssSelector[] }
    | {
          type: "complex";
          left: CssSelector;
          combinator: string;
          right: CssSelector;
      };

export interface KeyframeBlock {
    stops: KeyframeStop[];
    declarations: CssDeclaration[];
}

export type KeyframeStop =
    | { type: "from" }
    | { type: "to" }
    | { type: "percentage"; value: number };

// ── Helpers ─────────────────────────────────────────────────

const COLOR_FUNCTIONS = new Set([
    "rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch",
    "oklab", "oklch", "color", "color-mix",
]);

/** Try parser, return value or undefined. Restores offset on failure. */
function tryParse<T>(parser: Parser<T>, state: ParserState<T>): T | undefined {
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
function skipWs(state: ParserState<unknown>): void {
    const src = state.src;
    let i = state.offset;
    while (i < src.length && (src.charCodeAt(i) <= 32)) i++;
    state.offset = i;
}

/** Skip whitespace + comments. */
function skipWsAndComments(state: ParserState<unknown>): void {
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

function isAtEnd(state: ParserState<unknown>): boolean {
    return state.offset >= state.src.length;
}

function charAt(state: ParserState<unknown>): number {
    return state.src.charCodeAt(state.offset);
}

// ── Leaf tokens ─────────────────────────────────────────────

const cssIdent = regex(/[-]?[a-zA-Z_][\w-]*|--[\w-]+/);
const cssString_ = regex(/"(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'/);
const cssComment_ = regex(/\/\*[\s\S]*?\*\//);
const cssNumberRe = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
const cssUnitRe = regex(
    /(?:px|em|rem|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc|Q|cap|ic|lh|rlh|vi|vb|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|deg|rad|grad|turn|ms|s|Hz|kHz|dpi|dpcm|dppx|fr)/i,
);

// ── Raw-state parsers (for performance in hot loops) ────────

function parseIdent(state: ParserState<unknown>): string | undefined {
    return tryParse(cssIdent as Parser<unknown>, state) as string | undefined;
}

function parseString(state: ParserState<unknown>): string | undefined {
    return tryParse(cssString_ as Parser<unknown>, state) as string | undefined;
}

function parseNumber(state: ParserState<unknown>): string | undefined {
    return tryParse(cssNumberRe as Parser<unknown>, state) as string | undefined;
}

function parseUnit(state: ParserState<unknown>): string | undefined {
    return tryParse(cssUnitRe as Parser<unknown>, state) as string | undefined;
}

function matchStr(state: ParserState<unknown>, s: string): boolean {
    if (state.src.startsWith(s, state.offset)) {
        state.offset += s.length;
        return true;
    }
    return false;
}

// ── CSS Value parser ────────────────────────────────────────

function parseSingleValue(state: ParserState<unknown>): CssValue | undefined {
    if (isAtEnd(state)) return undefined;
    const ch = charAt(state);

    // # → hex color
    if (ch === 35) {
        const m = state.src.slice(state.offset).match(/^#[0-9a-fA-F]{3,8}/);
        if (m) {
            state.offset += m[0].length;
            return { type: "color", color: { type: "hex", value: m[0] } };
        }
    }

    // " or ' → string
    if (ch === 34 || ch === 39) {
        const s = parseString(state);
        if (s !== undefined) return { type: "string", value: s };
    }

    // , → comma
    if (ch === 44) { state.offset++; return { type: "comma" }; }

    // / → slash
    if (ch === 47 && (state.offset + 1 >= state.src.length || state.src.charCodeAt(state.offset + 1) !== 42)) {
        state.offset++;
        return { type: "slash" };
    }

    // Number (may start with digit, -, +, .)
    // But -- is a custom property ident, not a number
    const isDoubleDash = ch === 45 && state.offset + 1 < state.src.length &&
        state.src.charCodeAt(state.offset + 1) === 45;
    if (!isDoubleDash && ((ch >= 48 && ch <= 57) || ch === 45 || ch === 43 || ch === 46)) {
        const numStr = parseNumber(state);
        if (numStr !== undefined) {
            const num = Number(numStr);
            if (matchStr(state, "%")) return { type: "percentage", value: num };
            const unit = parseUnit(state);
            if (unit !== undefined) return { type: "dimension", value: num, unit };
            return { type: "number", value: num };
        }
        // Standalone + or - (operator in calc)
        if (ch === 43 || ch === 45) {
            state.offset++;
            return { type: "operator", value: String.fromCharCode(ch) };
        }
    }

    // Function call: ident(
    const saved = state.offset;
    const name = parseIdent(state);
    if (name !== undefined) {
        if (matchStr(state, "(")) {
            const args = parseFunctionArgs(state);
            if (args === undefined) { state.offset = saved; return undefined; }
            if (COLOR_FUNCTIONS.has(name)) {
                return { type: "color", color: { type: "function", name, args } };
            }
            return { type: "function", name, args };
        }
        return { type: "ident", value: name };
    }

    return undefined;
}

function parseFunctionArgs(state: ParserState<unknown>): CssValue[] | undefined {
    const args: CssValue[] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
        skipWsAndComments(state);
        if (isAtEnd(state)) return undefined;
        if (matchStr(state, ")")) return args;
        const v = parseSingleValue(state);
        if (v !== undefined) {
            args.push(v);
        } else {
            // Skip unknown byte
            state.offset++;
        }
    }
}

// ── CSS Selector parser ─────────────────────────────────────

function parseSelectorList(state: ParserState<unknown>): CssSelector[] | undefined {
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
        // Descendant combinator (whitespace)
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
            // If followed by (, it's not a type selector
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

// ── Declaration parser ──────────────────────────────────────

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
            // Skip to ; or } to recover
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

function parseAtRule(state: ParserState<unknown>): CssNode | undefined {
    if (!matchStr(state, "@")) return undefined;
    const name = parseIdent(state);
    if (name === undefined) return undefined;
    skipWsAndComments(state);

    switch (name) {
        case "media":
        case "supports": {
            const idx = state.src.indexOf("{", state.offset);
            if (idx === -1) return undefined;
            const prelude = state.src.slice(state.offset, idx).trim();
            state.offset = idx;
            if (!matchStr(state, "{")) return undefined;

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
            return name === "media"
                ? { type: "atMedia", prelude, body }
                : { type: "atSupports", prelude, body };
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
                body = [];
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    skipWsAndComments(state);
                    if (isAtEnd(state)) break;
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

// ── Rule ────────────────────────────────────────────────────

function parseRule(state: ParserState<unknown>): CssNode | undefined {
    skipWs(state);
    if (isAtEnd(state)) return undefined;

    // Comment
    if (charAt(state) === 47 && state.offset + 1 < state.src.length &&
        state.src.charCodeAt(state.offset + 1) === 42) {
        const end = state.src.indexOf("*/", state.offset + 2);
        if (end === -1) return undefined;
        const value = state.src.slice(state.offset, end + 2);
        state.offset = end + 2;
        return { type: "comment", value };
    }

    // At-rule
    if (charAt(state) === 64) return parseAtRule(state);

    // Qualified rule
    return parseQualifiedRule(state);
}

// ── Stylesheet (entry point) ────────────────────────────────

export const cssParser = new Parser<CssNode[]>((state) => {
    const nodes: CssNode[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
        skipWs(state);
        if (isAtEnd(state)) break;
        const node = parseRule(state);
        if (node !== undefined) {
            nodes.push(node);
        } else {
            if (isAtEnd(state)) break;
            const rest = state.src.slice(state.offset);
            const skip = rest.search(/[;}]/);
            if (skip >= 0) {
                state.offset += skip;
                if (!matchStr(state, ";") && !matchStr(state, "}")) {
                    if (!isAtEnd(state)) state.offset++;
                    else break;
                }
            } else {
                if (!isAtEnd(state)) state.offset++;
                else break;
            }
        }
    }

    return state.ok(nodes);
});
