/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Parser as ParserType, ParserFunction } from "./parser.js";
import type { ParserState, Span } from "./state.js";
import { createParserContext } from "./state.js";
import { mergeErrorState, reportUnclosedDelimiter } from "./utils.js";

// Late-bound Parser constructor to break circular dependency with parser.ts.
let _ParserCtor: any;
export function _setSpanParserClass(cls: any) {
    _ParserCtor = cls;
}

function makeParser<T>(parser: ParserFunction<T>, context?: any): ParserType<T> {
    return new _ParserCtor(parser, context);
}

type Parser<T> = ParserType<T>;

// ── Leaf Span Combinators ────────────────────────────────────

/**
 * Match exact string literal, returning a Span.
 */
export function stringSpan(s: string): Parser<Span> {
    const len = s.length;
    const label = `"${s}"`;

    const stringSpanParser = (state: ParserState<Span>) => {
        if (state.src.startsWith(s, state.offset)) {
            const start = state.offset;
            state.offset += len;
            (state as any).value = { start, end: state.offset };
            state.isError = false;
            return state;
        }
        mergeErrorState(state as ParserState<unknown>, label);
        state.isError = true;
        return state;
    };

    return makeParser(
        stringSpanParser as ParserFunction<Span>,
        createParserContext("string", undefined, s),
    );
}

/**
 * Like regex(), but returns a Span instead of a substring.
 * Avoids substring allocation entirely — use spanToString(span, src) when needed.
 */
export function regexSpan(r: RegExp): Parser<Span> {
    const flags = r.flags.replace(/y/g, "");
    const sticky = new RegExp(r, flags + "y");
    const label = `/${r.source}/${r.flags}`;

    const regexSpanParser = (state: ParserState<Span>) => {
        if (state.offset >= state.src.length) {
            state.isError = true;
            return state;
        }

        const savedOffset = state.offset;
        sticky.lastIndex = savedOffset;

        if (sticky.test(state.src)) {
            const end = sticky.lastIndex;
            if (end > savedOffset) {
                state.offset = end;
                (state as any).value = { start: savedOffset, end };
                state.isError = false;
                return state;
            }
            (state as any).value = { start: savedOffset, end: savedOffset };
            state.isError = false;
            return state;
        }

        mergeErrorState(state as ParserState<unknown>, label);
        state.isError = true;
        return state;
    };

    return makeParser(
        regexSpanParser as ParserFunction<Span>,
        createParserContext("regexSpan", undefined, r),
    );
}

/**
 * Like many(), but coalesces all matches into a single Span {start, end}
 * instead of building a T[] array.
 */
export function manySpan(
    inner: Parser<Span>,
    min: number = 0,
    max: number = Infinity,
): Parser<Span> {
    const manySpanParser = (state: ParserState<Span>) => {
        const start = state.offset;
        let count = 0;

        for (let i = 0; i < max; i++) {
            const savedOffset = state.offset;
            inner.call(state as any);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = false;
                break;
            }
            if (state.offset === savedOffset) break;
            count++;
        }

        if (count >= min) {
            (state as any).value = { start, end: state.offset };
            state.isError = false;
            return state;
        }
        mergeErrorState(state as ParserState<unknown>);
        state.isError = true;
        return state;
    };

    return makeParser(
        manySpanParser as ParserFunction<Span>,
        createParserContext("manySpan", inner as any, min, max),
    );
}

/**
 * Like sepBy(), but coalesces all matches into a single Span.
 * Strictly interleaving: `elem (sep elem)*`. Never accepts trailing separators.
 */
export function sepBySpan<S>(
    inner: Parser<Span>,
    sep: Parser<S>,
    min: number = 0,
    max: number = Infinity,
): Parser<Span> {
    const sepBySpanParser = (state: ParserState<Span>) => {
        const start = state.offset;
        let count = 0;
        let end = state.offset;

        // Parse first element
        {
            const savedOffset = state.offset;
            inner.call(state as any);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = false;
            } else if (state.offset !== savedOffset) {
                end = state.offset;
                count++;
            }
        }

        // Parse (sep elem)* — checkpoint before separator to reject
        // trailing separators.
        while (count > 0 && count < max) {
            const cpBeforeSep = state.offset;
            sep.call(state as any);
            if (state.isError) {
                state.offset = cpBeforeSep;
                state.isError = false;
                break;
            }

            const savedOffset = state.offset;
            inner.call(state as any);
            if (state.isError || state.offset === savedOffset) {
                // Element after separator failed — backtrack past the
                // separator to reject trailing separator.
                state.offset = cpBeforeSep;
                state.isError = false;
                break;
            }
            end = state.offset;
            count++;
        }

        if (count >= min) {
            (state as any).value = { start, end };
            state.isError = false;
            return state;
        }
        mergeErrorState(state as ParserState<unknown>);
        state.isError = true;
        return state;
    };

    return makeParser(
        sepBySpanParser as ParserFunction<Span>,
        createParserContext("sepBySpan", inner as any, sep),
    );
}

/**
 * Like wrap(), but returns only the middle Span, merging adjacent spans.
 */
export function wrapSpan(
    inner: Parser<Span>,
    left: Parser<any>,
    right: Parser<any>,
): Parser<Span> {
    const wrapSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        left.call(state as any);
        if (state.isError) {
            state.offset = savedOffset;
            return state;
        }
        const openEnd = state.offset;
        const innerStart = state.offset;
        inner.call(state as any);
        if (state.isError) {
            mergeErrorState(state as ParserState<unknown>);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        }
        const innerEnd = state.offset;
        right.call(state as any);
        if (state.isError) {
            mergeErrorState(state as ParserState<unknown>);
            reportUnclosedDelimiter(state.src.slice(savedOffset, openEnd), savedOffset);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        }
        (state as any).value = { start: innerStart, end: innerEnd };
        state.isError = false;
        return state;
    };

    return makeParser(
        wrapSpanParser as ParserFunction<Span>,
        createParserContext("wrapSpan", inner as any, left, right),
    );
}

// ── Additional Span Combinators ─────────────────────────────

/**
 * Optional span: returns the inner Span if matched, or an empty Span at
 * the current position on failure.
 */
export function optSpan(inner: Parser<Span>): Parser<Span> {
    const optSpanParser = (state: ParserState<Span>) => {
        const start = state.offset;
        inner.call(state as any);
        if (state.isError) {
            state.isError = false;
            (state as any).value = { start, end: start };
            return state;
        }
        return state;
    };

    return makeParser(
        optSpanParser as ParserFunction<Span>,
        createParserContext("opt", inner as any),
    );
}

/**
 * Parse `keep` then `skip` — return only the Span from `keep`.
 */
export function skipSpan(keep: Parser<Span>, skip: Parser<any>): Parser<Span> {
    const skipSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        keep.call(state as any);
        if (state.isError) {
            state.offset = savedOffset;
            return state;
        }
        const span = (state as any).value;
        skip.call(state as any);
        if (state.isError) {
            mergeErrorState(state as ParserState<unknown>);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        }
        (state as any).value = span;
        state.isError = false;
        return state;
    };

    return makeParser(
        skipSpanParser as ParserFunction<Span>,
        createParserContext("skip", keep as any, skip),
    );
}

/**
 * Parse `skip` then `keep` — return only the Span from `keep`.
 */
export function nextSpan(skip: Parser<any>, keep: Parser<Span>): Parser<Span> {
    const nextSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        skip.call(state as any);
        if (state.isError) {
            state.offset = savedOffset;
            return state;
        }
        keep.call(state as any);
        if (state.isError) {
            mergeErrorState(state as ParserState<unknown>);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        }
        return state;
    };

    return makeParser(
        nextSpanParser as ParserFunction<Span>,
        createParserContext("next", skip as any, keep),
    );
}
