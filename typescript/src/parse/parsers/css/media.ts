// Media query and @supports condition parsers (L1.75).

import type { ParserState } from "../../state.js";
import type { RangeOp, MediaFeature, MediaCondition, MediaQuery, SupportsCondition, CssValue } from "./types.js";
import {
    isAtEnd, charAt, skipWsAndComments, parseIdent,
} from "./scan.js";
import { parseSingleValue } from "./value.js";

function parseRangeOp(state: ParserState<unknown>): RangeOp | undefined {
    if (isAtEnd(state)) return undefined;
    const ch = charAt(state);
    if (ch === 60) { // <
        if (state.src.charCodeAt(state.offset + 1) === 61) { state.offset += 2; return "<="; }
        state.offset++; return "<";
    }
    if (ch === 62) { // >
        if (state.src.charCodeAt(state.offset + 1) === 61) { state.offset += 2; return ">="; }
        state.offset++; return ">";
    }
    if (ch === 61) { state.offset++; return "="; }
    return undefined;
}

function parseMediaFeature(state: ParserState<unknown>): MediaFeature | undefined {
    if (isAtEnd(state) || charAt(state) !== 40) return undefined; // (
    state.offset++;
    skipWsAndComments(state);

    const cp = state.offset;
    const name = parseIdent(state);
    if (name === undefined) { state.offset = cp; return undefined; }
    skipWsAndComments(state);

    // Range op after name
    const rangeCp = state.offset;
    const op = parseRangeOp(state);
    if (op !== undefined) {
        skipWsAndComments(state);
        const value = parseSingleValue(state);
        if (value !== undefined) {
            skipWsAndComments(state);
            // Check for interval: value op name op value
            const rangeCp2 = state.offset;
            const op2 = parseRangeOp(state);
            if (op2 !== undefined) {
                skipWsAndComments(state);
                const value2 = parseSingleValue(state);
                if (value2 !== undefined) {
                    skipWsAndComments(state);
                    if (!isAtEnd(state) && charAt(state) === 41) {
                        state.offset++;
                        return { type: "rangeInterval", name, lo: value, loOp: op, hi: value2, hiOp: op2 };
                    }
                }
                state.offset = rangeCp2;
            }
            if (!isAtEnd(state) && charAt(state) === 41) {
                state.offset++;
                return { type: "range", name, op, value };
            }
        }
        state.offset = rangeCp;
    }

    // Plain feature: name: value or bare name
    if (!isAtEnd(state) && charAt(state) === 58) { // :
        state.offset++;
        skipWsAndComments(state);
        const value = parseSingleValue(state) ?? null;
        skipWsAndComments(state);
        if (!isAtEnd(state) && charAt(state) === 41) {
            state.offset++;
            return { type: "plain", name, value };
        }
        state.offset = cp;
        return undefined;
    }

    // Bare feature name: (color)
    if (!isAtEnd(state) && charAt(state) === 41) {
        state.offset++;
        return { type: "plain", name, value: null };
    }

    state.offset = cp;
    return undefined;
}

function parseMediaCondition(state: ParserState<unknown>): MediaCondition | undefined {
    skipWsAndComments(state);

    // Check for "not" prefix
    const cp = state.offset;
    const ident = parseIdent(state);
    if (ident === "not") {
        skipWsAndComments(state);
        const inner = parseMediaCondition(state);
        if (inner !== undefined) {
            return { type: "not", condition: inner };
        }
        state.offset = cp;
    } else if (ident !== undefined) {
        state.offset = cp;
    }

    // Parse a feature
    const feature = parseMediaFeature(state);
    if (feature === undefined) return undefined;
    let result: MediaCondition = { type: "feature", feature };

    // Check for "and" / "or" chains
    while (true) {
        skipWsAndComments(state);
        const kwCp = state.offset;
        const kw = parseIdent(state);
        if (kw === "and") {
            skipWsAndComments(state);
            const next = parseMediaCondition(state);
            if (next !== undefined) {
                const conditions: MediaCondition[] = result.type === "and" ? result.conditions : [result];
                conditions.push(next);
                result = { type: "and", conditions };
                continue;
            }
            state.offset = kwCp;
            break;
        } else if (kw === "or") {
            skipWsAndComments(state);
            const next = parseMediaCondition(state);
            if (next !== undefined) {
                const conditions: MediaCondition[] = result.type === "or" ? result.conditions : [result];
                conditions.push(next);
                result = { type: "or", conditions };
                continue;
            }
            state.offset = kwCp;
            break;
        } else {
            if (kw !== undefined) state.offset = kwCp;
            break;
        }
    }

    return result;
}

function parseMediaQuery(state: ParserState<unknown>): MediaQuery | undefined {
    skipWsAndComments(state);

    let modifier: string | null = null;
    let mediaType: string | null = null;
    const conditions: MediaCondition[] = [];

    const cp = state.offset;
    const ident = parseIdent(state);

    if (ident !== undefined) {
        if (ident === "not" || ident === "only") {
            modifier = ident;
            skipWsAndComments(state);
            const mt = parseIdent(state);
            if (mt !== undefined) {
                mediaType = mt;
            } else {
                // "not" might be a condition prefix — backtrack
                state.offset = cp;
                modifier = null;
            }
        } else {
            // Direct media type (screen, print, all)
            mediaType = ident;
        }
    }

    if (mediaType !== null) {
        // Check for "and" <condition>
        skipWsAndComments(state);
        const kwCp = state.offset;
        const kw = parseIdent(state);
        if (kw === "and") {
            skipWsAndComments(state);
            const cond = parseMediaCondition(state);
            if (cond !== undefined) {
                conditions.push(cond);
            }
        } else {
            if (kw !== undefined) state.offset = kwCp;
        }
    } else {
        // No media type — must be a condition
        state.offset = cp;
        modifier = null;
        const cond = parseMediaCondition(state);
        if (cond === undefined) return undefined;
        conditions.push(cond);
    }

    return { modifier, mediaType, conditions };
}

export function parseMediaQueryList(state: ParserState<unknown>): MediaQuery[] {
    const queries: MediaQuery[] = [];

    const q = parseMediaQuery(state);
    if (q === undefined) return queries;
    queries.push(q);

    while (true) {
        skipWsAndComments(state);
        if (isAtEnd(state) || charAt(state) !== 44) break; // ,
        state.offset++;
        skipWsAndComments(state);
        const next = parseMediaQuery(state);
        if (next === undefined) break;
        queries.push(next);
    }

    return queries;
}

// ── Supports condition parser ───────────────────────────────

function parseSupportsConditionChain(result: SupportsCondition, state: ParserState<unknown>): SupportsCondition {
    while (true) {
        skipWsAndComments(state);
        const kwCp = state.offset;
        const kw = parseIdent(state);
        if (kw === "and") {
            skipWsAndComments(state);
            const next = parseSupportsCondition(state);
            if (next !== undefined) {
                const conds = result.type === "and" ? result.conditions : [result];
                conds.push(next);
                result = { type: "and", conditions: conds };
                continue;
            }
            state.offset = kwCp;
        } else if (kw === "or") {
            skipWsAndComments(state);
            const next = parseSupportsCondition(state);
            if (next !== undefined) {
                const conds = result.type === "or" ? result.conditions : [result];
                conds.push(next);
                result = { type: "or", conditions: conds };
                continue;
            }
            state.offset = kwCp;
        } else {
            if (kw !== undefined) state.offset = kwCp;
        }
        break;
    }
    return result;
}

export function parseSupportsCondition(state: ParserState<unknown>): SupportsCondition | undefined {
    skipWsAndComments(state);

    // Check for "not" prefix
    const cp = state.offset;
    const ident = parseIdent(state);
    if (ident === "not") {
        skipWsAndComments(state);
        const inner = parseSupportsCondition(state);
        if (inner !== undefined) {
            const result: SupportsCondition = { type: "not", condition: inner };
            return parseSupportsConditionChain(result, state);
        }
        state.offset = cp;
    } else if (ident !== undefined) {
        state.offset = cp;
    }

    // Try (property: value) declaration test or nested condition
    if (!isAtEnd(state) && charAt(state) === 40) { // (
        state.offset++;
        skipWsAndComments(state);

        // Try nested condition first
        const innerCp = state.offset;
        const inner = parseSupportsCondition(state);
        if (inner !== undefined) {
            skipWsAndComments(state);
            if (!isAtEnd(state) && charAt(state) === 41) {
                state.offset++;
                return parseSupportsConditionChain(inner, state);
            }
            state.offset = innerCp;
        }

        // Try declaration: property: value
        const property = parseIdent(state);
        if (property !== undefined) {
            skipWsAndComments(state);
            if (!isAtEnd(state) && charAt(state) === 58) { // :
                state.offset++;
                skipWsAndComments(state);

                const values: CssValue[] = [];
                while (true) {
                    skipWsAndComments(state);
                    if (isAtEnd(state) || charAt(state) === 41) break;
                    const v = parseSingleValue(state);
                    if (v === undefined) break;
                    values.push(v);
                }

                if (!isAtEnd(state) && charAt(state) === 41) {
                    state.offset++;
                    const result: SupportsCondition = { type: "declaration", property, value: values };
                    return parseSupportsConditionChain(result, state);
                }
            }
        }

        // Backtrack past the '('
        state.offset = cp;
    }

    return undefined;
}
