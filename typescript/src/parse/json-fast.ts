/**
 * Monolithic JSON fast-path parser.
 *
 * Single recursive function with switch(charCodeAt) dispatch.
 * Ported from rust/parse_that/src/parsers/json.rs — same architecture:
 *   - String: indexOf('"') fast path (V8 SIMD), cold escape path
 *   - Number: integer accumulation val * 10 + digit, parseFloat for decimals
 *   - Keywords: direct charCode comparison for true/false/null
 *   - Cow-like: return source substring only when no escapes
 */

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

// Character codes
const CH_SPACE = 32;
const CH_TAB = 9;
const CH_LF = 10;
const CH_CR = 13;
const CH_QUOTE = 34; // "
const CH_BACKSLASH = 92; // \
const CH_SLASH = 47; // /
const CH_LBRACE = 123; // {
const CH_RBRACE = 125; // }
const CH_LBRACKET = 91; // [
const CH_RBRACKET = 93; // ]
const CH_COLON = 58; // :
const CH_COMMA = 44; // ,
const CH_MINUS = 45; // -
const CH_PLUS = 43; // +
const CH_DOT = 46; // .
const CH_0 = 48;
const CH_9 = 57;
const CH_E_LOWER = 101; // e
const CH_E_UPPER = 69; // E
const CH_t = 116;
const CH_f = 102;
const CH_n = 110;
const CH_b = 98;
const CH_r = 114;
const CH_u = 117;

function skipWs(src: string, offset: number): number {
    while (offset < src.length) {
        const c = src.charCodeAt(offset);
        if (c === CH_SPACE || c === CH_TAB || c === CH_LF || c === CH_CR) {
            offset++;
        } else {
            break;
        }
    }
    return offset;
}

// Escape map for JSON string escape sequences
const ESCAPE_MAP: Record<number, string> = {
    [CH_QUOTE]: '"',
    [CH_BACKSLASH]: "\\",
    [CH_SLASH]: "/",
    [CH_b]: "\b",
    [CH_f]: "\f",
    [CH_n]: "\n",
    [CH_r]: "\r",
    [CH_t]: "\t",
};

function parseString(
    src: string,
    offset: number,
): [string, number] | undefined {
    if (src.charCodeAt(offset) !== CH_QUOTE) return undefined;
    offset++; // skip opening "

    // Fast path: indexOf for unescaped strings (V8 uses SIMD for this)
    const closeIdx = src.indexOf('"', offset);
    if (closeIdx === -1) return undefined;

    // Check if there are any backslashes in the range
    const bsIdx = src.indexOf("\\", offset);
    if (bsIdx === -1 || bsIdx > closeIdx) {
        // No escapes — zero-copy substring
        return [src.substring(offset, closeIdx), closeIdx + 1];
    }

    // Cold path: has escape sequences, build string
    let result = src.substring(offset, bsIdx);
    offset = bsIdx;

    while (offset < src.length) {
        const c = src.charCodeAt(offset);
        if (c === CH_QUOTE) {
            return [result, offset + 1];
        }
        if (c === CH_BACKSLASH) {
            offset++;
            if (offset >= src.length) return undefined;
            const esc = src.charCodeAt(offset);
            if (esc === CH_u) {
                // Unicode escape \uXXXX
                if (offset + 4 >= src.length) return undefined;
                const hex = src.substring(offset + 1, offset + 5);
                const code = parseInt(hex, 16);
                if (isNaN(code)) return undefined;
                result += String.fromCharCode(code);
                offset += 5;
            } else {
                const mapped = ESCAPE_MAP[esc];
                if (mapped === undefined) return undefined;
                result += mapped;
                offset++;
            }
        } else {
            // Batch non-escape characters
            const nextSpecial = src.indexOf("\\", offset);
            const nextQuote = src.indexOf('"', offset);
            if (nextQuote === -1) return undefined;
            const end =
                nextSpecial === -1
                    ? nextQuote
                    : Math.min(nextSpecial, nextQuote);
            result += src.substring(offset, end);
            offset = end;
        }
    }
    return undefined;
}

function parseNumber(src: string, offset: number): [number, number] | undefined {
    const start = offset;
    let isFloat = false;

    // Optional minus
    if (offset < src.length && src.charCodeAt(offset) === CH_MINUS) {
        offset++;
    }

    // Integer part
    if (offset >= src.length) return undefined;
    const firstDigit = src.charCodeAt(offset);
    if (firstDigit < CH_0 || firstDigit > CH_9) return undefined;

    if (firstDigit === CH_0) {
        offset++; // leading zero — only valid alone
    } else {
        // Accumulate digits
        while (offset < src.length) {
            const c = src.charCodeAt(offset);
            if (c < CH_0 || c > CH_9) break;
            offset++;
        }
    }

    // Decimal part
    if (offset < src.length && src.charCodeAt(offset) === CH_DOT) {
        isFloat = true;
        offset++;
        if (offset >= src.length) return undefined;
        const c = src.charCodeAt(offset);
        if (c < CH_0 || c > CH_9) return undefined;
        while (offset < src.length) {
            const c = src.charCodeAt(offset);
            if (c < CH_0 || c > CH_9) break;
            offset++;
        }
    }

    // Exponent part
    if (offset < src.length) {
        const c = src.charCodeAt(offset);
        if (c === CH_E_LOWER || c === CH_E_UPPER) {
            isFloat = true;
            offset++;
            if (offset < src.length) {
                const sign = src.charCodeAt(offset);
                if (sign === CH_PLUS || sign === CH_MINUS) offset++;
            }
            if (offset >= src.length) return undefined;
            const c2 = src.charCodeAt(offset);
            if (c2 < CH_0 || c2 > CH_9) return undefined;
            while (offset < src.length) {
                const c3 = src.charCodeAt(offset);
                if (c3 < CH_0 || c3 > CH_9) break;
                offset++;
            }
        }
    }

    if (offset === start) return undefined;

    // For simple integers, use integer arithmetic. parseFloat for the rest.
    if (!isFloat && offset - start <= 15) {
        let val = 0;
        let neg = false;
        let i = start;
        if (src.charCodeAt(i) === CH_MINUS) {
            neg = true;
            i++;
        }
        while (i < offset) {
            val = val * 10 + (src.charCodeAt(i) - CH_0);
            i++;
        }
        return [neg ? -val : val, offset];
    }

    return [parseFloat(src.substring(start, offset)), offset];
}

function parseValue(
    src: string,
    offset: number,
): [JsonValue, number] | undefined {
    offset = skipWs(src, offset);
    if (offset >= src.length) return undefined;

    const ch = src.charCodeAt(offset);

    switch (ch) {
        case CH_QUOTE: {
            // String
            return parseString(src, offset) as
                | [JsonValue, number]
                | undefined;
        }

        case CH_LBRACE: {
            // Object
            offset = skipWs(src, offset + 1);
            if (offset < src.length && src.charCodeAt(offset) === CH_RBRACE) {
                return [{}, offset + 1];
            }

            const obj: { [key: string]: JsonValue } = {};
            for (;;) {
                const keyResult = parseString(src, offset);
                if (!keyResult) return undefined;
                const [key, afterKey] = keyResult;

                offset = skipWs(src, afterKey);
                if (
                    offset >= src.length ||
                    src.charCodeAt(offset) !== CH_COLON
                )
                    return undefined;

                const valResult = parseValue(src, offset + 1);
                if (!valResult) return undefined;
                const [val, afterVal] = valResult;

                obj[key] = val;
                offset = skipWs(src, afterVal);
                if (offset >= src.length) return undefined;

                const c = src.charCodeAt(offset);
                if (c === CH_COMMA) {
                    offset = skipWs(src, offset + 1);
                    continue;
                }
                if (c === CH_RBRACE) {
                    return [obj, offset + 1];
                }
                return undefined;
            }
        }

        case CH_LBRACKET: {
            // Array
            offset = skipWs(src, offset + 1);
            if (
                offset < src.length &&
                src.charCodeAt(offset) === CH_RBRACKET
            ) {
                return [[], offset + 1];
            }

            const arr: JsonValue[] = [];
            for (;;) {
                const elemResult = parseValue(src, offset);
                if (!elemResult) return undefined;
                const [elem, afterElem] = elemResult;

                arr.push(elem);
                offset = skipWs(src, afterElem);
                if (offset >= src.length) return undefined;

                const c = src.charCodeAt(offset);
                if (c === CH_COMMA) {
                    offset = offset + 1;
                    continue;
                }
                if (c === CH_RBRACKET) {
                    return [arr, offset + 1];
                }
                return undefined;
            }
        }

        case CH_MINUS:
        case CH_0:
        case CH_0 + 1:
        case CH_0 + 2:
        case CH_0 + 3:
        case CH_0 + 4:
        case CH_0 + 5:
        case CH_0 + 6:
        case CH_0 + 7:
        case CH_0 + 8:
        case CH_0 + 9:
            // Number
            return parseNumber(src, offset) as
                | [JsonValue, number]
                | undefined;

        case CH_t: {
            // true
            if (
                offset + 4 <= src.length &&
                src.charCodeAt(offset + 1) === 114 && // r
                src.charCodeAt(offset + 2) === 117 && // u
                src.charCodeAt(offset + 3) === 101 // e
            ) {
                return [true, offset + 4];
            }
            return undefined;
        }

        case CH_f: {
            // false
            if (
                offset + 5 <= src.length &&
                src.charCodeAt(offset + 1) === 97 && // a
                src.charCodeAt(offset + 2) === 108 && // l
                src.charCodeAt(offset + 3) === 115 && // s
                src.charCodeAt(offset + 4) === 101 // e
            ) {
                return [false, offset + 5];
            }
            return undefined;
        }

        case CH_n: {
            // null
            if (
                offset + 4 <= src.length &&
                src.charCodeAt(offset + 1) === 117 && // u
                src.charCodeAt(offset + 2) === 108 && // l
                src.charCodeAt(offset + 3) === 108 // l
            ) {
                return [null, offset + 4];
            }
            return undefined;
        }

        default:
            return undefined;
    }
}

/**
 * Parse a complete JSON document. Returns the parsed value or undefined on failure.
 */
export function jsonParseFast(src: string): JsonValue | undefined {
    const result = parseValue(src, 0);
    if (!result) return undefined;
    const [value, offset] = result;
    // Ensure all input consumed (trailing whitespace ok)
    const finalOffset = skipWs(src, offset);
    if (finalOffset < src.length) return undefined;
    return value;
}
