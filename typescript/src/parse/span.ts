import { Parser } from "./parser.js";
import type { ParserFunction } from "./parser.js";
import type { ParserState, ParserContext, Span } from "./state.js";
import { createParserContext } from "./state.js";
import { mergeErrorState, reportUnclosedDelimiter } from "./utils.js";

function makeParser<T>(parser: ParserFunction<T>, context?: ParserContext): Parser<T> {
    return new Parser(parser, context);
}

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
            state.unsafeSetValue({ start, end: state.offset });
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
                state.unsafeSetValue({ start: savedOffset, end });
                state.isError = false;
                return state;
            }
            state.unsafeSetValue({ start: savedOffset, end: savedOffset });
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
            state.unsafeCall(inner as Parser<unknown>);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = false;
                break;
            }
            if (state.offset === savedOffset) break;
            count++;
        }

        if (count >= min) {
            state.unsafeSetValue({ start, end: state.offset });
            state.isError = false;
            return state;
        }
        mergeErrorState(state as ParserState<unknown>);
        state.isError = true;
        return state;
    };

    return makeParser(
        manySpanParser as ParserFunction<Span>,
        createParserContext("manySpan", inner as Parser<unknown>, min, max),
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
            state.unsafeCall(inner as Parser<unknown>);
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
            state.unsafeCall(sep as Parser<unknown>);
            if (state.isError) {
                state.offset = cpBeforeSep;
                state.isError = false;
                break;
            }

            const savedOffset = state.offset;
            state.unsafeCall(inner as Parser<unknown>);
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
            state.unsafeSetValue({ start, end });
            state.isError = false;
            return state;
        }
        mergeErrorState(state as ParserState<unknown>);
        state.isError = true;
        return state;
    };

    return makeParser(
        sepBySpanParser as ParserFunction<Span>,
        createParserContext("sepBySpan", inner as Parser<unknown>, sep),
    );
}

/**
 * Like wrap(), but returns only the middle Span, merging adjacent spans.
 */
export function wrapSpan(
    inner: Parser<Span>,
    left: Parser<unknown>,
    right: Parser<unknown>,
): Parser<Span> {
    const wrapSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        state.unsafeCall(left);
        if (state.isError) {
            state.offset = savedOffset;
            return state;
        }
        const openEnd = state.offset;
        const innerStart = state.offset;
        state.unsafeCall(inner as Parser<unknown>);
        if (state.isError) {
            mergeErrorState(state as ParserState<unknown>);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        }
        const innerEnd = state.offset;
        state.unsafeCall(right);
        if (state.isError) {
            mergeErrorState(state as ParserState<unknown>);
            reportUnclosedDelimiter(state as ParserState<unknown>, state.src.slice(savedOffset, openEnd), savedOffset);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        }
        state.unsafeSetValue({ start: innerStart, end: innerEnd });
        state.isError = false;
        return state;
    };

    return makeParser(
        wrapSpanParser as ParserFunction<Span>,
        createParserContext("wrapSpan", inner as Parser<unknown>, left, right),
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
        state.unsafeCall(inner as Parser<unknown>);
        if (state.isError) {
            state.isError = false;
            state.unsafeSetValue({ start, end: start });
            return state;
        }
        return state;
    };

    return makeParser(
        optSpanParser as ParserFunction<Span>,
        createParserContext("opt", inner as Parser<unknown>),
    );
}

/**
 * Parse `keep` then `skip` — return only the Span from `keep`.
 */
export function skipSpan(keep: Parser<Span>, skip: Parser<unknown>): Parser<Span> {
    const skipSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        state.unsafeCall(keep as Parser<unknown>);
        if (state.isError) {
            state.offset = savedOffset;
            return state;
        }
        const span = state.value;
        state.unsafeCall(skip);
        if (state.isError) {
            mergeErrorState(state as ParserState<unknown>);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        }
        state.unsafeSetValue(span);
        state.isError = false;
        return state;
    };

    return makeParser(
        skipSpanParser as ParserFunction<Span>,
        createParserContext("skip", keep as Parser<unknown>, skip),
    );
}

/**
 * Parse `skip` then `keep` — return only the Span from `keep`.
 */
export function nextSpan(skip: Parser<unknown>, keep: Parser<Span>): Parser<Span> {
    const nextSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        state.unsafeCall(skip);
        if (state.isError) {
            state.offset = savedOffset;
            return state;
        }
        state.unsafeCall(keep as Parser<unknown>);
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
        createParserContext("next", skip as Parser<unknown>, keep),
    );
}

// ── Alternation Span Combinator ──────────────────────────────

/**
 * Alternation of span-producing parsers, returning a single Span.
 * Tries each parser in order — first success wins.
 * More efficient than `any(...).map(span => span)` since it avoids
 * boxing/unboxing through the generic alternation path.
 */
export function altSpan(...parsers: Parser<Span>[]): Parser<Span> {
    if (parsers.length === 0) {
        return makeParser(
            ((state: ParserState<Span>) => {
                state.isError = true;
                return state;
            }) as ParserFunction<Span>,
        );
    }

    if (parsers.length === 1) return parsers[0];

    const altSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;

        for (const parser of parsers) {
            state.unsafeCall(parser as Parser<unknown>);
            if (!state.isError) return state;
            state.offset = savedOffset;
            state.isError = false;
        }

        mergeErrorState(state as ParserState<unknown>);
        state.isError = true;
        return state;
    };

    return makeParser(
        altSpanParser as ParserFunction<Span>,
        createParserContext("altSpan", undefined, ...parsers),
    );
}

/**
 * Byte-class scanner: match one or more characters NOT in `excluded`.
 * TS equivalent of Rust's `take_until_any_span` — uses a LUT for O(1)
 * per-character lookup instead of regex NFA overhead.
 */
export function takeUntilAnySpan(excluded: string): Parser<Span> {
    // Build 128-entry ASCII lookup table.
    const lut = new Uint8Array(128);
    for (let i = 0; i < excluded.length; i++) {
        const code = excluded.charCodeAt(i);
        if (code < 128) lut[code] = 1;
    }

    const label = `[^${excluded.replace(/[\\\]]/g, "\\$&")}]+`;

    const scanner = (state: ParserState<Span>) => {
        const { src, offset } = state;
        let pos = offset;
        const len = src.length;

        while (pos < len) {
            const ch = src.charCodeAt(pos);
            if (ch < 128 && lut[ch]) break;
            pos++;
        }

        if (pos > offset) {
            state.unsafeSetValue({ start: offset, end: pos });
            state.offset = pos;
            state.isError = false;
        } else {
            mergeErrorState(state as ParserState<unknown>, label);
            state.isError = true;
        }
        return state;
    };

    return makeParser(
        scanner as ParserFunction<Span>,
        createParserContext("takeUntilAnySpan", undefined, excluded),
    );
}

// ── Assertion Span Combinators ──────────────────────────────

/**
 * Zero-width negative assertion: succeed with an empty Span when `inner`
 * fails, fail when `inner` succeeds. Never consumes input.
 * Mirrors Rust `negate_span()`.
 */
export function negateSpan(inner: Parser<Span>): Parser<Span> {
    const negateSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        state.unsafeCall(inner as Parser<unknown>);
        if (state.isError) {
            state.offset = savedOffset;
            state.isError = false;
            state.unsafeSetValue({ start: savedOffset, end: savedOffset });
            return state;
        }
        state.offset = savedOffset;
        state.isError = true;
        return state;
    };

    return makeParser(
        negateSpanParser as ParserFunction<Span>,
        createParserContext("negateSpan", undefined, inner),
    );
}

/**
 * Zero-width positive assertion: succeed with `inner`'s Span when `inner`
 * matches, but don't consume input.
 * Mirrors Rust `peek_span()`.
 */
export function peekSpan(inner: Parser<Span>): Parser<Span> {
    const peekSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        state.unsafeCall(inner as Parser<unknown>);
        if (state.isError) {
            state.offset = savedOffset;
            return state;
        }
        const value = state.value;
        state.offset = savedOffset;
        state.unsafeSetValue(value);
        return state;
    };

    return makeParser(
        peekSpanParser as ParserFunction<Span>,
        createParserContext("peekSpan", undefined, inner),
    );
}

/**
 * Consuming negative lookahead for Spans: parse `inner`, then reject
 * if `excluded` matches at the resulting position.
 * Mirrors Rust `not_span()`.
 */
export function notSpan(inner: Parser<Span>, excluded: Parser<unknown>): Parser<Span> {
    const notSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        state.unsafeCall(inner as Parser<unknown>);
        if (state.isError) {
            state.offset = savedOffset;
            return state;
        }
        const value = state.value;
        const offsetAfterInner = state.offset;
        state.unsafeCall(excluded as Parser<unknown>);
        if (state.isError) {
            // excluded failed — success
            state.offset = offsetAfterInner;
            state.isError = false;
            state.unsafeSetValue(value);
            return state;
        }
        // excluded matched — fail
        state.offset = savedOffset;
        state.isError = true;
        return state;
    };

    return makeParser(
        notSpanParser as ParserFunction<Span>,
        createParserContext("notSpan", undefined, inner, excluded),
    );
}

/**
 * Set difference for Spans: reject if `excluded` matches at the same
 * start position, then try `inner`.
 * Mirrors Rust `minus_span()`.
 */
export function minusSpan(inner: Parser<Span>, excluded: Parser<unknown>): Parser<Span> {
    const minusSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        state.unsafeCall(excluded as Parser<unknown>);
        if (!state.isError) {
            // excluded matched — fail
            state.offset = savedOffset;
            state.isError = true;
            return state;
        }
        // excluded failed — try inner
        state.offset = savedOffset;
        state.isError = false;
        state.unsafeCall(inner as Parser<unknown>);
        return state;
    };

    return makeParser(
        minusSpanParser as ParserFunction<Span>,
        createParserContext("minusSpan", undefined, inner, excluded),
    );
}

/**
 * Consuming positive lookahead for Spans: parse `inner`, then check
 * that `lookahead` matches at the resulting position (zero-width).
 * Returns `inner`'s Span.
 * Mirrors Rust `look_ahead_span()`.
 */
export function lookAheadSpan(inner: Parser<Span>, lookahead: Parser<unknown>): Parser<Span> {
    const lookAheadSpanParser = (state: ParserState<Span>) => {
        const savedOffset = state.offset;
        state.unsafeCall(inner as Parser<unknown>);
        if (state.isError) {
            state.offset = savedOffset;
            return state;
        }
        const value = state.value;
        const offsetAfterInner = state.offset;
        state.unsafeCall(lookahead as Parser<unknown>);
        if (state.isError) {
            state.offset = savedOffset;
            state.isError = true;
            return state;
        }
        state.offset = offsetAfterInner;
        state.isError = false;
        state.unsafeSetValue(value);
        return state;
    };

    return makeParser(
        lookAheadSpanParser as ParserFunction<Span>,
        createParserContext("lookAheadSpan", undefined, inner, lookahead),
    );
}
