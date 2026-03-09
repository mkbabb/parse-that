/* eslint-disable @typescript-eslint/no-explicit-any */
import { createParserContext, ParserState } from "./state.js";
import type { ParserContext, Span } from "./state.js";
import { parserDebug, parserPrint } from "./debug.js";
import { mergeErrorState, resetErrorState, getLastState, getLastFurthestOffset, addSuggestion, isDiagnosticsEnabled, getLastExpected, getLastSuggestions, getLastSecondarySpans, collectDiagnostic, popLastDiagnostic, reportUnclosedDelimiter } from "./utils.js";
import { createLazyCached } from "./lazy.js";
import { trimStateWhitespace, eof, all, _initWhitespace, whitespace } from "./leaf.js";

type ExtractValue<T extends ReadonlyArray<Parser<unknown>>> = {
    [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
};

export type ParserFunction<T = string> = (
    val: ParserState<any>,
) => ParserState<any>;

let PARSER_ID = 0;

const MEMO = new Map<number, ParserState<unknown>>();
const LEFT_RECURSION_COUNTS = new Map<number, number>();

// Numeric memo key: eliminates string allocation per lookup.
// Max offset 2^20 (~1M chars) allows parser IDs up to 2^11 = 2048.
const MEMO_OFFSET_BITS = 20;
const MEMO_MAX_OFFSET = (1 << MEMO_OFFSET_BITS) - 1;

const FLAG_NONE = 0;
const FLAG_TRIM_WS = 1;
const FLAG_EOF = 2;

export class Parser<T = string> {
    id: number = PARSER_ID++;
    state: ParserState<T> | undefined;
    flags: number = FLAG_NONE;

    constructor(
        public parser: ParserFunction<T>,
        public context: ParserContext = {},
    ) {}

    reset() {
        resetErrorState();
        MEMO.clear();
        LEFT_RECURSION_COUNTS.clear();
    }

    parseState(val: string) {
        this.reset();

        const state = new ParserState(val) as ParserState<T>;
        this.parser(state);

        const lastState = getLastState();
        if (state.isError && lastState) {
            // Build error display from the furthest offset reached
            const lastFurthestOffset = getLastFurthestOffset();
            const errorState = new ParserState(val, undefined, lastFurthestOffset, true);
            this.state = errorState as ParserState<T>;
            console.error(this.state.toString());
        } else {
            this.state = state;
            if (state.isError) {
                console.error(state.toString());
            }
        }

        return state;
    }

    parse(val: string) {
        return this.parseState(val).value;
    }

    getCijKey(state: ParserState<T>): number {
        return (this.id << MEMO_OFFSET_BITS) | (state.offset & MEMO_MAX_OFFSET);
    }

    atLeftRecursionLimit(state: ParserState<T>) {
        const cij = LEFT_RECURSION_COUNTS.get(this.getCijKey(state)) ?? 0;
        return cij > state.src.length - state.offset;
    }

    memoize() {
        const memoize = (state: ParserState<T>) => {
            const cijKey = this.getCijKey(state);
            const cij = LEFT_RECURSION_COUNTS.get(cijKey) ?? 0;

            const cached = MEMO.get(this.id) as ParserState<T> | undefined;

            if (cached && cached.offset >= state.offset) {
                // Restore from cache into mutable state
                state.offset = cached.offset;
                state.value = cached.value;
                state.isError = cached.isError;
                return state;
            } else if (this.atLeftRecursionLimit(state)) {
                state.isError = true;
                return state;
            }

            LEFT_RECURSION_COUNTS.set(cijKey, cij + 1);
            this.parser(state);

            const cachedAfter = MEMO.get(this.id) as ParserState<T> | undefined;

            if (cachedAfter && cachedAfter.offset > state.offset) {
                state.offset = cachedAfter.offset;
            } else if (!cachedAfter) {
                // Clone before storing so the cache is immutable
                MEMO.set(this.id, state.clone() as ParserState<unknown>);
            }

            return state;
        };
        return new Parser(
            memoize as ParserFunction<T>,
            createParserContext("memoize", this),
        );
    }

    mergeMemos() {
        const mergeMemo = (state: ParserState<T>) => {
            const cached = MEMO.get(this.id) as ParserState<T> | undefined;
            if (cached) {
                state.offset = cached.offset;
                state.value = cached.value;
                state.isError = cached.isError;
                return state;
            } else if (this.atLeftRecursionLimit(state)) {
                state.isError = true;
                return state;
            }

            this.parser(state);

            const cachedAfter = MEMO.get(this.id) as ParserState<T> | undefined;
            if (!cachedAfter) {
                MEMO.set(this.id, state.clone() as ParserState<unknown>);
            }
            return state;
        };

        return new Parser(
            mergeMemo as ParserFunction<T>,
            createParserContext("mergeMemo", this),
        );
    }

    then<S>(next: Parser<S | T>) {
        const then = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            this.parser(state);

            if (!state.isError) {
                const value1 = state.value;
                next.parser(state as ParserState<S | T>);
                if (!state.isError) {
                    return state.ok([value1, state.value]);
                }
            }
            mergeErrorState(state as ParserState<unknown>);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        };

        return new Parser(
            then as ParserFunction<[T, S]>,
            createParserContext("then", this as Parser<unknown>, this, next),
        );
    }

    or<S>(other: Parser<S | T>) {
        const or = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            this.parser(state);

            if (!state.isError) {
                return state;
            }
            state.offset = savedOffset;
            state.isError = false;
            return other.parser(state as ParserState<S | T>);
        };

        return new Parser(
            or as ParserFunction<T | S>,
            createParserContext("or", this as Parser<unknown>, this, other),
        );
    }

    chain<S>(fn: (value: T) => Parser<S | T>, chainError: boolean = false) {
        const chain = (state: ParserState<T>) => {
            this.parser(state);

            if (state.isError) {
                return state;
            } else if (state.value || chainError) {
                return fn(state.value).parser(state as ParserState<S | T>);
            }
            return state;
        };

        return new Parser(
            chain as ParserFunction<S>,
            createParserContext("chain", this as Parser<unknown>, fn),
        );
    }

    map<S>(fn: (value: T) => S, mapError: boolean = false) {
        const map = (state: ParserState<T | S>) => {
            this.parser(state as ParserState<T>);

            if (!state.isError || mapError) {
                return state.ok(fn(state.value as T));
            }
            return state;
        };

        return new Parser(
            map as ParserFunction<S>,
            createParserContext("map", this as Parser<unknown>),
        );
    }

    mapState<S extends T>(
        fn: (
            newState: ParserState<T>,
            oldState: ParserState<T>,
        ) => ParserState<S>,
    ) {
        const mapState = (state: ParserState<T>) => {
            // Snapshot old offset before parsing (avoids full clone on success)
            const oldOffset = state.offset;
            const oldValue = state.value;
            this.parser(state);
            if (state.isError) {
                return state;
            }
            // Build a lightweight view for the old state
            const oldView = Object.create(state);
            oldView.offset = oldOffset;
            oldView.value = oldValue;
            return fn(state, oldView);
        };

        return new Parser(
            mapState as ParserFunction<S>,
            createParserContext("mapState", this as Parser<unknown>),
        );
    }

    skip<S>(parser: Parser<T | S>) {
        const skip = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            this.parser(state);

            if (!state.isError) {
                const value1 = state.value;
                parser.parser(state as ParserState<T | S>);
                if (!state.isError) {
                    return state.ok(value1);
                }
            }
            mergeErrorState(state as ParserState<unknown>);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        };
        return new Parser(
            skip as ParserFunction<T>,
            createParserContext("skip", this as Parser<unknown>, parser),
        );
    }

    next<S>(parser: Parser<S>) {
        const next = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            this.parser(state);

            if (!state.isError) {
                parser.parser(state as ParserState<any>);
                if (!state.isError) {
                    return state;
                }
            }
            mergeErrorState(state as ParserState<unknown>);
            state.offset = savedOffset;
            state.isError = true;
            return state;
        };
        return new Parser(
            next as ParserFunction<S>,
            createParserContext("next", this as Parser<unknown>, parser),
        );
    }

    opt() {
        const opt = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            this.parser(state);
            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                state.offset = savedOffset;
                return state.ok(undefined);
            }
            return state;
        };
        return new Parser(
            opt as ParserFunction<T | undefined>,
            createParserContext("opt", this as Parser<unknown>),
        );
    }

    not<S extends T>(parser?: Parser<S | T>) {
        const negate = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            const savedValue = state.value;
            this.parser(state);

            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                state.offset = savedOffset;
                return state.ok(savedValue);
            } else {
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
        };

        const not = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            this.parser(state);

            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                state.offset = savedOffset;
                state.isError = true;
                return state;
            } else {
                // self succeeded — check that excluded does NOT match
                // at the post-self position (consuming negative lookahead).
                const value1 = state.value;
                const offset1 = state.offset;
                parser!.parser(state as ParserState<S | T>);
                if (state.isError) {
                    // excluded failed at post-self position — success
                    state.offset = offset1;
                    state.value = value1 as any;
                    state.isError = false;
                    return state;
                } else {
                    // excluded matched — overall parse fails
                    mergeErrorState(state as ParserState<unknown>);
                    state.offset = savedOffset;
                    state.isError = true;
                    return state;
                }
            }
        };

        return new Parser(
            parser ? not : negate,
            createParserContext("not", this as Parser<unknown>, parser),
        );
    }

    /**
     * Set difference: match `this` only if `excluded` would NOT match at the
     * same starting position. Used for EBNF/BNF exception (`-`) semantics.
     */
    minus<S>(excluded: Parser<S>) {
        const inner = this;
        const minus = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            excluded.parser(state as ParserState<any>);
            if (!state.isError) {
                // excluded matched — fail
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            // excluded failed — try self
            state.offset = savedOffset;
            state.isError = false;
            inner.parser(state);
            return state;
        };

        return new Parser(
            minus as ParserFunction<T>,
            createParserContext("minus", this as Parser<unknown>, excluded),
        );
    }

    /**
     * Zero-width positive assertion: succeeds with `this`'s value when
     * `this` matches, but does NOT consume any input. The dual of
     * `not()` (no argument): where `not()` is zero-width negative
     * assertion, `peek()` is zero-width positive assertion.
     */
    peek() {
        const inner = this;
        const peek = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            inner.parser(state);
            if (state.isError) {
                state.offset = savedOffset;
                return state;
            }
            const value = state.value;
            state.offset = savedOffset;
            state.value = value;
            return state;
        };
        return new Parser(
            peek as ParserFunction<T>,
            createParserContext("peek", this as Parser<unknown>),
        );
    }

    /**
     * Consuming positive lookahead: parse `this`, then check that
     * `lookahead` matches at the resulting position without consuming it.
     * Returns `this`'s value; the lookahead is zero-width.
     * Mirrors Rust's `look_ahead()`.
     */
    lookAhead<S>(lookahead: Parser<S>) {
        const inner = this;
        const la = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            inner.parser(state);
            if (state.isError) {
                state.offset = savedOffset;
                return state;
            }
            const value = state.value;
            const offsetAfterSelf = state.offset;
            lookahead.parser(state as ParserState<any>);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            state.offset = offsetAfterSelf;
            (state as any).value = value;
            return state;
        };
        return new Parser(
            la as ParserFunction<T>,
            createParserContext("lookAhead", this as Parser<unknown>, lookahead),
        );
    }

    wrap<L, R>(start: Parser<L>, end: Parser<R>, discard: boolean = true) {
        if (!discard) {
            return all(start as Parser<unknown>, this as Parser<unknown>, end as Parser<unknown>);
        }

        // Inline start.next(this).skip(end) into a single closure
        // to eliminate 2 intermediate function frames per invocation.
        const inner = this;
        const wrapParser = (state: ParserState<T>) => {
            const savedOffset = state.offset;
            start.parser(state as any);
            if (state.isError) {
                state.offset = savedOffset;
                return state;
            }
            const openEnd = state.offset;
            inner.parser(state);
            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            const value = state.value;
            (end as Parser<unknown>).parser(state as any);
            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                reportUnclosedDelimiter(state.src.slice(savedOffset, openEnd), savedOffset);
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            (state as any).value = value;
            return state;
        };
        return new Parser(
            wrapParser as ParserFunction<T>,
            createParserContext("wrap", this as Parser<unknown>, start, end),
        );
    }

    /**
     * Call the parser with flag-based pre/post processing.
     * Fast path: flags === 0 just calls parser directly.
     */
    call(state: ParserState<T>): ParserState<T> {
        if (this.flags === 0) {
            return this.parser(state) as ParserState<T>;
        }
        // Fast path: trim_ws only (most common flag combination)
        if (this.flags === FLAG_TRIM_WS) {
            trimStateWhitespace(state);
            const savedOffset = state.offset;
            this.parser(state);
            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                state.offset = savedOffset;
                state.isError = true;
                return state as ParserState<T>;
            }
            trimStateWhitespace(state);
            return state as ParserState<T>;
        }
        // General cold path for multiple flags
        if (this.flags & FLAG_TRIM_WS) trimStateWhitespace(state);
        const savedOffset = state.offset;
        this.parser(state);
        if (state.isError) {
            mergeErrorState(state as ParserState<unknown>);
            state.offset = savedOffset;
            state.isError = true;
            return state as ParserState<T>;
        }
        if (this.flags & FLAG_TRIM_WS) trimStateWhitespace(state);
        if (this.flags & FLAG_EOF) {
            if (state.offset < state.src.length) {
                mergeErrorState(state as ParserState<unknown>, "<end of input>");
                if (isDiagnosticsEnabled()) {
                    addSuggestion({
                        kind: "trailing-content",
                        message: "unexpected trailing content after parsed value",
                    });
                }
                state.offset = savedOffset;
                state.isError = true;
            }
        }
        return state as ParserState<T>;
    }

    trim<S>(
        parser: Parser<S> = whitespace as unknown as Parser<S>,
        discard: boolean = true,
    ) {
        if (!discard) {
            return all(parser as Parser<unknown>, this as Parser<unknown>, parser as Parser<unknown>) as unknown as Parser<T[]>;
        }

        if (parser.context?.name === "whitespace") {
            // Flag-based: clone the parser and set FLAG_TRIM_WS.
            // The call() method handles the trim pre/post logic.
            const inner = this;
            const flaggedParser = new Parser(
                ((state: ParserState<T>) => inner.call(state)) as ParserFunction<T>,
                createParserContext("trimWhitespace", this as Parser<unknown>),
            ) as Parser<T>;
            flaggedParser.flags = this.flags | FLAG_TRIM_WS;
            // Also provide the inline version for direct .parser() callers
            const whitespaceTrim = (state: ParserState<T>) => {
                trimStateWhitespace(state);
                const savedOffset = state.offset;
                inner.parser(state);

                if (state.isError) {
                    mergeErrorState(state as ParserState<unknown>);
                    state.offset = savedOffset;
                    state.isError = true;
                    return state;
                } else {
                    trimStateWhitespace(state);
                    return state;
                }
            };

            return new Parser(
                whitespaceTrim as ParserFunction<T>,
                createParserContext("trimWhitespace", this as Parser<unknown>),
            ) as Parser<T>;
        }

        return this.wrap(parser, parser) as unknown as Parser<T>;
    }

    many(min: number = 0, max: number = Infinity) {
        const many = (state: ParserState<T>) => {
            const est = min > 0 ? min : 0;
            const matches: T[] = est > 0 ? new Array<T>(est) : [];
            let len = 0;

            for (let i = 0; i < max; i += 1) {
                const savedOffset = state.offset;
                this.parser(state);

                if (state.isError) {
                    state.offset = savedOffset;
                    state.isError = false;
                    break;
                }
                if (state.offset === savedOffset) break;
                if (len < est) {
                    matches[len] = state.value;
                } else {
                    matches.push(state.value);
                }
                len++;
            }

            // Trim pre-allocated slots if we collected fewer than est
            if (len < est) matches.length = len;

            if (len >= min) {
                return state.ok(matches) as ParserState<T[]>;
            }
            mergeErrorState(state as ParserState<unknown>);
            state.isError = true;
            (state as any).value = [];
            return state as unknown as ParserState<T[]>;
        };

        return new Parser(
            many as ParserFunction<T[]>,
            createParserContext("many", this as Parser<unknown>, min, max),
        );
    }

    /**
     * Strictly interleaving: `elem (sep elem)*`. Never accepts a trailing
     * separator — trailing sep acceptance is a grammar concern.
     */
    sepBy<S>(sep: Parser<S | T>, min: number = 0, max: number = Infinity) {
        const sepBy = (state: ParserState<T>) => {
            const est = min > 0 ? min : 0;
            const matches: T[] = est > 0 ? new Array<T>(est) : [];
            let len = 0;

            // Parse first element
            {
                const savedOffset = state.offset;
                this.parser(state);
                if (state.isError) {
                    state.offset = savedOffset;
                    state.isError = false;
                } else if (state.offset !== savedOffset) {
                    if (len < est) {
                        matches[len] = state.value;
                    } else {
                        matches.push(state.value);
                    }
                    len++;
                }
            }

            // Parse (sep elem)* — checkpoint before separator to reject
            // trailing separators.
            while (len > 0 && len < max) {
                const cpBeforeSep = state.offset;
                sep.parser(state as ParserState<S | T>);
                if (state.isError) {
                    state.offset = cpBeforeSep;
                    state.isError = false;
                    break;
                }

                const savedOffset = state.offset;
                this.parser(state);
                if (state.isError || state.offset === savedOffset) {
                    // Element after separator failed — backtrack past the
                    // separator to reject trailing separator.
                    state.offset = cpBeforeSep;
                    state.isError = false;
                    break;
                }
                if (len < est) {
                    matches[len] = state.value;
                } else {
                    matches.push(state.value);
                }
                len++;
            }

            // Trim pre-allocated slots if we collected fewer than est
            if (len < est) matches.length = len;

            if (len >= min) {
                return state.ok(matches) as ParserState<T[]>;
            }
            mergeErrorState(state as ParserState<unknown>);
            state.isError = true;
            (state as any).value = [];
            return state as unknown as ParserState<T[]>;
        };

        return new Parser(
            sepBy as ParserFunction<T[]>,
            createParserContext("sepBy", this as Parser<unknown>, sep),
        );
    }

    eof() {
        const p = this.skip(eof()) as Parser<T>;
        p.context = createParserContext("eof", this as Parser<unknown>);
        return p;
    }

    /**
     * Error recovery combinator. On success, returns the result normally.
     * On failure, snapshots the current diagnostic into the collected
     * diagnostics list, then runs `sync` to skip past the bad content
     * and returns `sentinel`.
     *
     * This enables `many()` / `sepBy()` loops to keep going — each failed
     * element produces a diagnostic but doesn't halt the overall parse.
     */
    recover(sync: Parser<unknown>, sentinel: T): Parser<T> {
        const inner = this;
        const recover = (state: ParserState<T>) => {
            const checkpoint = state.offset;
            inner.parser(state);

            if (!state.isError) {
                return state;
            }

            // Snapshot current error state into a diagnostic, then try
            // to sync forward. If sync fails, pop the diagnostic back
            // off — the error propagates normally (e.g. at EOF).
            collectDiagnostic(state.src, checkpoint);

            state.isError = false;
            state.offset = checkpoint;
            sync.parser(state as ParserState<unknown>);

            if (state.isError) {
                // Sync also failed — remove the collected diagnostic
                popLastDiagnostic();
                state.offset = checkpoint;
                state.isError = true;
                return state;
            }

            // Sync succeeded — return sentinel
            return state.ok(sentinel);
        };

        return new Parser(
            recover as ParserFunction<T>,
            createParserContext("recover", this as Parser<unknown>, sync, sentinel),
        );
    }

    debug(
        name: string = "",
        recursivePrint: boolean = false,
        logger: (...s: unknown[]) => void = console.log,
    ) {
        return parserDebug(this, name, recursivePrint, logger);
    }

    toString() {
        return parserPrint(this as Parser<unknown>);
    }

    static lazy<T>(fn: () => Parser<T>) {
        return new Parser<T>(
            createLazyCached(fn),
            createParserContext("lazy", undefined, fn),
        );
    }
}

// Initialize module-level singletons that depend on Parser
_initWhitespace();
