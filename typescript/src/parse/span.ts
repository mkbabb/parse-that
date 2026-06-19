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

// ── SpanParser tagged-union (A.W3) ───────────────────────────
//
// The closure-based span combinators above each allocate a unique closure
// shape; when a hot loop invokes them through `state.unsafeCall(parser)` the
// V8 inline cache at that call site goes megamorphic (>4 distinct function
// targets → generic `CallFunction` dispatch, documented in
// `perf-optimization-ts.md §5`). The `SpanParser` discriminated union is the
// `future-research.md §7` cure: a numeric `kind` tag + a single `switch` in
// `callSpan()` that V8 lowers to a jump table. No closure-per-combinator, one
// monomorphic call site, the scan body inlined per arm.
//
// This is the Rust `SpanParser`/`SpanKind` enum (rust/parse_that/src/
// span_parser/mod.rs) ported to a TS tagged union. It is a parallel,
// allocation-free dispatch lane that composes back into the `Parser<Span>`
// combinator tier via `spanParserToParser()`.

/**
 * Discriminated-union tag for {@link SpanParser}. A numeric (const) enum so the
 * `switch (sp.kind)` in {@link callSpan} is jump-table eligible under V8 —
 * dense small integers, not string compares.
 */
export const enum SpanParserKind {
    String = 0,
    Regex = 1,
    TakeUntilAny = 2,
    Many = 3,
    SepBy = 4,
    Wrap = 5,
    Opt = 6,
    Skip = 7,
    Next = 8,
    Alt = 9,
}

/**
 * A span-producing parser expressed as a tagged-union node. Each variant
 * carries its configuration inline (no captured closure). Nesting children are
 * themselves `SpanParser` nodes, so an entire span grammar is one flat data
 * structure dispatched by {@link callSpan}.
 */
export type SpanParser =
    | { kind: SpanParserKind.String; needle: string; len: number; label: string }
    | { kind: SpanParserKind.Regex; sticky: RegExp; label: string }
    | { kind: SpanParserKind.TakeUntilAny; lut: Uint8Array; label: string }
    | { kind: SpanParserKind.Many; inner: SpanParser; min: number; max: number }
    | { kind: SpanParserKind.SepBy; inner: SpanParser; sep: SpanParser; min: number; max: number }
    | { kind: SpanParserKind.Wrap; left: SpanParser; inner: SpanParser; right: SpanParser }
    | { kind: SpanParserKind.Opt; inner: SpanParser }
    | { kind: SpanParserKind.Skip; keep: SpanParser; skip: SpanParser }
    | { kind: SpanParserKind.Next; skip: SpanParser; keep: SpanParser }
    | { kind: SpanParserKind.Alt; alts: SpanParser[] };

// ── SpanParser constructors ──────────────────────────────────

/** Tagged `stringSpan`. */
export function stringSpanNode(s: string): SpanParser {
    return { kind: SpanParserKind.String, needle: s, len: s.length, label: `"${s}"` };
}

/** Tagged `regexSpan`. Compiles to a sticky RegExp once, at construction. */
export function regexSpanNode(r: RegExp): SpanParser {
    const flags = r.flags.replace(/y/g, "");
    const sticky = new RegExp(r, flags + "y");
    return { kind: SpanParserKind.Regex, sticky, label: `/${r.source}/${r.flags}` };
}

/** Tagged `takeUntilAnySpan` — LUT byte-class scanner, no regex NFA. */
export function takeUntilAnyNode(excluded: string): SpanParser {
    const lut = new Uint8Array(128);
    for (let i = 0; i < excluded.length; i++) {
        const code = excluded.charCodeAt(i);
        if (code < 128) lut[code] = 1;
    }
    return {
        kind: SpanParserKind.TakeUntilAny,
        lut,
        label: `[^${excluded.replace(/[\\\]]/g, "\\$&")}]+`,
    };
}

/** Tagged `manySpan`. */
export function manySpanNode(inner: SpanParser, min = 0, max = Infinity): SpanParser {
    return { kind: SpanParserKind.Many, inner, min, max };
}

/** Tagged `sepBySpan`. */
export function sepBySpanNode(inner: SpanParser, sep: SpanParser, min = 0, max = Infinity): SpanParser {
    return { kind: SpanParserKind.SepBy, inner, sep, min, max };
}

/** Tagged `wrapSpan`. */
export function wrapSpanNode(left: SpanParser, inner: SpanParser, right: SpanParser): SpanParser {
    return { kind: SpanParserKind.Wrap, left, inner, right };
}

/** Tagged `optSpan`. */
export function optSpanNode(inner: SpanParser): SpanParser {
    return { kind: SpanParserKind.Opt, inner };
}

/** Tagged `skipSpan` — parse `keep` then `skip`, return `keep`'s span. */
export function skipSpanNode(keep: SpanParser, skip: SpanParser): SpanParser {
    return { kind: SpanParserKind.Skip, keep, skip };
}

/** Tagged `nextSpan` — parse `skip` then `keep`, return `keep`'s span. */
export function nextSpanNode(skip: SpanParser, keep: SpanParser): SpanParser {
    return { kind: SpanParserKind.Next, skip, keep };
}

/** Tagged `altSpan` — first matching alternative wins. */
export function altSpanNode(...alts: SpanParser[]): SpanParser {
    return { kind: SpanParserKind.Alt, alts };
}

// ── callSpan: the single jump-table dispatch ─────────────────

/**
 * Dispatch a {@link SpanParser} against `state`. The `switch (sp.kind)` is the
 * one and only call site for the entire span tier — V8 keeps it monomorphic and
 * lowers the dense numeric `kind` to a jump table. On success the matched span
 * is written via `state.unsafeSetValue` and `state.offset` is advanced; on
 * failure `state.isError` is set and `state.offset` is left at the entry point
 * for the caller's backtrack (each arm restores on its own failure).
 */
export function callSpan(sp: SpanParser, state: ParserState<Span>): void {
    switch (sp.kind) {
        case SpanParserKind.String: {
            if (state.src.startsWith(sp.needle, state.offset)) {
                const start = state.offset;
                state.offset += sp.len;
                state.unsafeSetValue({ start, end: state.offset });
                state.isError = false;
            } else {
                mergeErrorState(state as ParserState<unknown>, sp.label);
                state.isError = true;
            }
            return;
        }
        case SpanParserKind.Regex: {
            if (state.offset >= state.src.length) {
                state.isError = true;
                return;
            }
            const savedOffset = state.offset;
            sp.sticky.lastIndex = savedOffset;
            if (sp.sticky.test(state.src)) {
                const end = sp.sticky.lastIndex;
                state.offset = end;
                state.unsafeSetValue({ start: savedOffset, end });
                state.isError = false;
            } else {
                mergeErrorState(state as ParserState<unknown>, sp.label);
                state.isError = true;
            }
            return;
        }
        case SpanParserKind.TakeUntilAny: {
            const src = state.src;
            const offset = state.offset;
            const len = src.length;
            const lut = sp.lut;
            let pos = offset;
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
                mergeErrorState(state as ParserState<unknown>, sp.label);
                state.isError = true;
            }
            return;
        }
        case SpanParserKind.Many: {
            const start = state.offset;
            let count = 0;
            for (let i = 0; i < sp.max; i++) {
                const savedOffset = state.offset;
                callSpan(sp.inner, state);
                if (state.isError) {
                    state.offset = savedOffset;
                    state.isError = false;
                    break;
                }
                if (state.offset === savedOffset) break;
                count++;
            }
            if (count >= sp.min) {
                state.unsafeSetValue({ start, end: state.offset });
                state.isError = false;
            } else {
                mergeErrorState(state as ParserState<unknown>);
                state.isError = true;
            }
            return;
        }
        case SpanParserKind.SepBy: {
            const start = state.offset;
            let count = 0;
            let end = state.offset;
            {
                const savedOffset = state.offset;
                callSpan(sp.inner, state);
                if (state.isError) {
                    state.offset = savedOffset;
                    state.isError = false;
                } else if (state.offset !== savedOffset) {
                    end = state.offset;
                    count++;
                }
            }
            while (count > 0 && count < sp.max) {
                const cpBeforeSep = state.offset;
                callSpan(sp.sep, state);
                if (state.isError) {
                    state.offset = cpBeforeSep;
                    state.isError = false;
                    break;
                }
                const savedOffset = state.offset;
                callSpan(sp.inner, state);
                if (state.isError || state.offset === savedOffset) {
                    state.offset = cpBeforeSep;
                    state.isError = false;
                    break;
                }
                end = state.offset;
                count++;
            }
            if (count >= sp.min) {
                state.unsafeSetValue({ start, end });
                state.isError = false;
            } else {
                mergeErrorState(state as ParserState<unknown>);
                state.isError = true;
            }
            return;
        }
        case SpanParserKind.Wrap: {
            const savedOffset = state.offset;
            callSpan(sp.left, state);
            if (state.isError) {
                state.offset = savedOffset;
                return;
            }
            const innerStart = state.offset;
            callSpan(sp.inner, state);
            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                state.offset = savedOffset;
                state.isError = true;
                return;
            }
            const innerEnd = state.offset;
            callSpan(sp.right, state);
            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                state.offset = savedOffset;
                state.isError = true;
                return;
            }
            state.unsafeSetValue({ start: innerStart, end: innerEnd });
            state.isError = false;
            return;
        }
        case SpanParserKind.Opt: {
            const start = state.offset;
            callSpan(sp.inner, state);
            if (state.isError) {
                state.isError = false;
                state.unsafeSetValue({ start, end: start });
            }
            return;
        }
        case SpanParserKind.Skip: {
            const savedOffset = state.offset;
            callSpan(sp.keep, state);
            if (state.isError) {
                state.offset = savedOffset;
                return;
            }
            const span = state.value;
            callSpan(sp.skip, state);
            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                state.offset = savedOffset;
                state.isError = true;
                return;
            }
            state.unsafeSetValue(span);
            state.isError = false;
            return;
        }
        case SpanParserKind.Next: {
            const savedOffset = state.offset;
            callSpan(sp.skip, state);
            if (state.isError) {
                state.offset = savedOffset;
                return;
            }
            callSpan(sp.keep, state);
            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                state.offset = savedOffset;
                state.isError = true;
            }
            return;
        }
        case SpanParserKind.Alt: {
            const savedOffset = state.offset;
            const alts = sp.alts;
            for (let i = 0; i < alts.length; i++) {
                callSpan(alts[i]!, state);
                if (!state.isError) return;
                state.offset = savedOffset;
                state.isError = false;
            }
            mergeErrorState(state as ParserState<unknown>);
            state.isError = true;
            return;
        }
    }
}

/**
 * Bridge a {@link SpanParser} tagged node into the `Parser<Span>` combinator
 * tier, so a span grammar built from the allocation-free dispatch lane composes
 * with the rest of parse-that (`.map`, `.then`, `any`, …).
 */
export function spanParserToParser(sp: SpanParser): Parser<Span> {
    const driver = (state: ParserState<Span>) => {
        callSpan(sp, state);
        return state;
    };
    return makeParser(
        driver as ParserFunction<Span>,
        createParserContext("regexSpan", undefined, sp),
    );
}
