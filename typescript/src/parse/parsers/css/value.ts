// CSS value parsing — dimensions, colors, functions, operators.

import type { ParserState } from "../../state.js";
import type { CssValue } from "./types.js";
import {
    COLOR_FUNCTIONS, isAtEnd, charAt, matchStr,
    parseString, parseNumber, parseUnit, parseIdent,
    skipWsAndComments,
} from "./scan.js";

export function parseSingleValue(state: ParserState<unknown>): CssValue | undefined {
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

    // / → slash (but not start of comment)
    if (ch === 47 && (state.offset + 1 >= state.src.length || state.src.charCodeAt(state.offset + 1) !== 42)) {
        state.offset++;
        return { type: "slash" };
    }

    // Number (may start with digit, -, +, .)
    // -- is a custom property ident, not a number
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

export function parseFunctionArgs(state: ParserState<unknown>): CssValue[] | undefined {
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
