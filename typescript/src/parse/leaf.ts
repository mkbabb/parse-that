/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Parser as ParserType, ParserFunction } from "./parser.js";
import type { ParserState, Span } from "./state.js";
import { createParserContext } from "./state.js";
import { mergeErrorState } from "./utils.js";

// Late-bound Parser constructor to break circular dependency with parser.ts.
// parser.ts calls _setLeafParserClass() after defining Parser.
let _ParserCtor: any;
export function _setLeafParserClass(cls: any) {
    _ParserCtor = cls;
}

// Type-safe wrapper that constructs a Parser using the late-bound constructor
function makeParser<T>(parser: ParserFunction<T>, context?: any): ParserType<T> {
    return new _ParserCtor(parser, context);
}

// Re-export type alias for use in return types
type Parser<T> = ParserType<T>;

export function eof<T>() {
    const eof = (state: ParserState<T>) => {
        if (state.offset >= state.src.length) {
            return state.ok(undefined);
        } else {
            mergeErrorState(state as ParserState<unknown>, "<end of input>");
            state.isError = true;
            return state;
        }
    };
    return makeParser(
        eof,
        createParserContext("eof", undefined),
    ) as Parser<unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function any<T extends Array<Parser<any>>>(...parsers: T) {
    type Result = T[number] extends Parser<infer V> ? V : never;
    const anyParser = (state: ParserState<Result>) => {
        const savedOffset = state.offset;
        for (const parser of parsers) {
            parser.parser(state);
            if (!state.isError) {
                return state;
            }
            state.offset = savedOffset;
            state.isError = false;
        }
        mergeErrorState(state as ParserState<unknown>);
        state.isError = true;
        return state;
    };

    return makeParser(
        parsers.length === 1 ? parsers[0].parser : anyParser,
        createParserContext("any", undefined, ...parsers),
    ) as Parser<Result>;
}

/**
 * O(1) first-character dispatch for alternation.
 * Maps ASCII characters to parsers for instant lookup instead of
 * sequential trial-and-error like any().
 *
 * @param table - Maps characters (or char ranges) to parsers.
 *   Keys can be single chars ("a"), ranges ("0-9"), or multi-char ("tf" = 't' or 'f').
 * @param fallback - Optional parser to try when no table entry matches.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dispatch<T>(table: Record<string, Parser<T>>, fallback?: Parser<T>) {
    const tbl = new Int8Array(128).fill(-1);
    const parsers: Parser<T>[] = [];

    for (const [chars, parser] of Object.entries(table)) {
        let idx = parsers.indexOf(parser);
        if (idx === -1) {
            idx = parsers.length;
            parsers.push(parser);
        }
        // Support "0-9" range syntax
        if (chars.length === 3 && chars[1] === '-') {
            const lo = chars.charCodeAt(0);
            const hi = chars.charCodeAt(2);
            for (let c = lo; c <= hi; c++) tbl[c] = idx;
        } else {
            for (let i = 0; i < chars.length; i++) {
                tbl[chars.charCodeAt(i)] = idx;
            }
        }
    }

    // Pre-compute label at construction time
    const labelChars = Object.keys(table).map(k => {
        if (k.length === 3 && k[1] === '-') return `'${k[0]}'-'${k[2]}'`;
        return [...k].map(c => `'${c}'`).join(", ");
    }).join(", ");
    const label = `one of [${labelChars}]`;

    const dispatchParser = (state: ParserState<T>) => {
        const ch = state.src.charCodeAt(state.offset);
        const idx = ch < 128 ? tbl[ch] : -1;
        if (idx >= 0) {
            return parsers[idx].parser(state);
        }
        if (fallback) {
            return fallback.parser(state);
        }
        mergeErrorState(state as ParserState<unknown>, label);
        state.isError = true;
        return state;
    };

    return makeParser(
        dispatchParser as ParserFunction<T>,
        createParserContext("dispatch", undefined, ...parsers),
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function all<T extends Array<Parser<any>>>(...parsers: T) {
    type ExtractValue<T extends ReadonlyArray<Parser<unknown>>> = {
        [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
    };
    type Result = ExtractValue<T>;
    const allParser = (state: ParserState<Result>): ParserState<Result> => {
        const matches: unknown[] = [];
        const savedOffset = state.offset;

        for (const parser of parsers) {
            parser.parser(state);

            if (state.isError) {
                state.offset = savedOffset;
                state.isError = true;
                return state as ParserState<Result>;
            }

            if (state.value !== undefined) {
                matches.push(state.value);
            }
        }
        return state.ok(matches) as ParserState<Result>;
    };

    return makeParser(
        parsers.length === 1 ? parsers[0].parser : allParser,
        createParserContext("all", undefined, ...parsers),
    ) as Parser<Result>;
}

// Step 2: string() with startsWith + single-char charCodeAt fast path
export function string(str: string) {
    const len = str.length;
    const label = `"${str}"`;

    let stringParser: ParserFunction<string>;

    if (len === 1) {
        const code = str.charCodeAt(0);
        stringParser = ((state: ParserState<string>) => {
            if (state.src.charCodeAt(state.offset) === code) {
                state.offset += 1;
                (state as any).value = str;
                state.isError = false;
                return state;
            }
            mergeErrorState(state as ParserState<unknown>, label);
            state.isError = true;
            return state;
        }) as ParserFunction<string>;
    } else {
        stringParser = ((state: ParserState<string>) => {
            if (state.src.startsWith(str, state.offset)) {
                state.offset += len;
                (state as any).value = str;
                state.isError = false;
                return state;
            }
            mergeErrorState(state as ParserState<unknown>, label);
            state.isError = true;
            return state;
        }) as ParserFunction<string>;
    }

    return makeParser(
        stringParser,
        createParserContext("string", undefined, str),
    );
}

// regex() with test()+substring() for zero-alloc default path,
// exec() only when matchFunction needs full RegExpMatchArray.
export function regex(
    r: RegExp,
    matchFunction?: (match: RegExpMatchArray | null) => string | null,
) {
    const flags = r.flags.replace(/y/g, "");
    const sticky = new RegExp(r, flags + "y");
    const hasCustomMatch = matchFunction != null;
    const label = `/${r.source}/${r.flags}`;

    const regexParser = (state: ParserState<string>) => {
        if (state.offset >= state.src.length) {
            state.isError = true;
            return state;
        }

        const savedOffset = state.offset;
        sticky.lastIndex = savedOffset;

        if (hasCustomMatch) {
            // Custom match functions need the full RegExpMatchArray
            const execResult = sticky.exec(state.src);
            const match = matchFunction!(execResult);
            if (match) {
                return state.ok(match, sticky.lastIndex - savedOffset);
            } else if (match === "") {
                return state.ok(undefined);
            }
        } else if (sticky.test(state.src)) {
            // test() advances lastIndex without allocating a RegExpMatchArray.
            // Inline ok() to set offset directly (avoids += arithmetic).
            const end = sticky.lastIndex;
            if (end > savedOffset) {
                state.offset = end;
                (state as any).value = state.src.substring(savedOffset, end);
                state.isError = false;
                return state;
            }
            // Empty match
            (state as any).value = undefined;
            state.isError = false;
            return state;
        }

        mergeErrorState(state as ParserState<unknown>, label);
        state.isError = true;
        return state;
    };

    return makeParser(
        regexParser as ParserFunction<string>,
        createParserContext("regex", undefined, r),
    );
}

// Step 5: Inline whitespace trimming with charCode loop + fast-exit
export const trimStateWhitespace = <T>(state: ParserState<T>): ParserState<T> => {
    const src = state.src;
    const len = src.length;
    let offset = state.offset;

    // Fast-exit: most calls hit non-whitespace immediately
    if (offset >= len || src.charCodeAt(offset) > 32) return state;

    while (offset < len) {
        const c = src.charCodeAt(offset);
        // space=32, tab=9, lf=10, vt=11, ff=12, cr=13
        if (c === 32 || (c >= 9 && c <= 13)) {
            offset++;
        } else {
            break;
        }
    }
    state.offset = offset;
    return state;
};

// For backward compatibility, we export `whitespace` as a const that
// is initialized after Parser class registration. The `_initWhitespace`
// function is called by parser.ts after it registers the Parser class.
export let whitespace: ReturnType<typeof regex>;
export function _initWhitespace() {
    whitespace = regex(/\s*/);
    whitespace.context.name = "whitespace";
}
