/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Parser as ParserType, ParserFunction } from "./parser.js";
import type { ParserState, Span } from "./state.js";
import { createParserContext } from "./state.js";
import { mergeErrorState, addSuggestion, addSecondarySpan, isDiagnosticsEnabled } from "./utils.js";

// Late-bound Parser constructor to break circular dependency with parser.ts.
let _ParserCtor: any;
export function _setSpanParserClass(cls: any) {
    _ParserCtor = cls;
}

function makeParser<T>(parser: ParserFunction<T>, context?: any): ParserType<T> {
    return new _ParserCtor(parser, context);
}

type Parser<T> = ParserType<T>;

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
            inner.parser(state as any);
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

        for (let i = 0; i < max; i++) {
            const savedOffset = state.offset;
            inner.parser(state as any);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = false;
                break;
            }
            if (state.offset === savedOffset) break;
            count++;

            const sepOffset = state.offset;
            sep.parser(state as any);
            if (state.isError) {
                state.offset = sepOffset;
                state.isError = false;
                break;
            }
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
        left.parser(state as any);
        if (state.isError) {
            state.offset = savedOffset;
            return state;
        }
        const openEnd = state.offset;
        const innerStart = state.offset;
        inner.parser(state as any);
        if (state.isError) {
            mergeErrorState(state as ParserState<unknown>);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        }
        const innerEnd = state.offset;
        right.parser(state as any);
        if (state.isError) {
            mergeErrorState(state as ParserState<unknown>);
            if (isDiagnosticsEnabled()) {
                const openText = state.src.slice(savedOffset, openEnd);
                const closeText = openText === "{" ? "}" : openText === "[" ? "]" : openText === "(" ? ")" : openText;
                addSuggestion({
                    kind: "unclosed-delimiter",
                    message: `close the delimiter with \`${closeText}\``,
                    openOffset: savedOffset,
                });
                addSecondarySpan(savedOffset, `unclosed \`${openText}\` opened here`);
            }
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
