import { createParserContext, ParserState } from "./state.js";
import type { ParserContext, Span } from "./state.js";
import { parserDebug, parserPrint } from "./debug.js";
import { mergeErrorState, addSuggestion, isDiagnosticsEnabled, collectDiagnostic, popLastDiagnostic, reportUnclosedDelimiter } from "./utils.js";
import { createLazyCached } from "./lazy.js";
import { trimStateWhitespace, eof, all, _initWhitespace, whitespace } from "./leaf.js";
import { packratEnter, packratExit } from "./packrat.js";

type ExtractValue<T extends ReadonlyArray<Parser<unknown>>> = {
    [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- type-erased function pointer; `any` required for variance
export type ParserFunction<T = string> = (
    val: ParserState<any>,
) => ParserState<any>;

let PARSER_ID = 0;

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

    parseState(val: string) {
        // PT-Q1 — open a packrat epoch at the parseState ENTRY boundary. A nested
        // top-level parse (e.g. a `.map` callback that re-parses a different src
        // mid-grow) gets its OWN clean packrat tables and, on return, the parent's
        // tables are restored from the snapshot. The try/finally guarantees the
        // restore even if the parse throws — re-entrancy SOUND, with the LR
        // machinery unwound on any throw. packrat is opt-in / off the default LL(1)
        // path, so this snapshot is a no-op-cost reference swap for non-memoized
        // grammars.
        const epoch = packratEnter();
        try {
            return this.parseStateInner(val);
        } finally {
            packratExit(epoch);
        }
    }

    private parseStateInner(val: string) {
        const state = new ParserState(val) as ParserState<T>;
        this.parser(state);

        if (state.isError) {
            // Build the error display at the furthest offset the parse reached.
            // The furthest-offset / expected-set / diagnostics now live on the
            // state instance, so the display is rendered directly from it: copy
            // the error tracking onto a view positioned at `furthest`.
            const furthest = state.furthest >= 0 ? state.furthest : state.offset;
            const errorState = new ParserState(val, undefined, furthest, true);
            errorState.expected = state.expected;
            errorState.suggestions = state.suggestions;
            errorState.secondarySpans = state.secondarySpans;
            errorState.furthest = furthest;
            this.state = errorState as ParserState<T>;
            if (isDiagnosticsEnabled()) {
                console.error(this.state.toString());
            }
        } else {
            this.state = state;
        }

        return state;
    }

    parse(val: string) {
        return this.parseState(val).value;
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

    chain<S>(fn: (value: T) => Parser<S | T>) {
        // C-16 Option A (fold row 50): on a SUCCESSFUL parse, always thread the
        // value into the continuation. The pre-1.0.0 code gated the continuation
        // on `state.value || chainError`, so a falsy-but-valid seed (0 / '' /
        // false) was silently dropped. The retired `chainError` param was
        // dead-on-error (the isError branch already returns first) and had zero
        // callers across value.js + parse-that — removed in the 1.0.0 breaking cut.
        const chain = (state: ParserState<T>) => {
            this.parser(state);

            if (state.isError) {
                return state;
            }
            return fn(state.value).parser(state as ParserState<S | T>);
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
                state.unsafeCallRaw(parser as Parser<unknown>);
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
                    state.unsafeSetValue(value1);
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
            state.unsafeCallRaw(excluded as Parser<unknown>);
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
            state.unsafeCallRaw(lookahead as Parser<unknown>);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            state.offset = offsetAfterSelf;
            state.unsafeSetValue(value);
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
            state.unsafeCallRaw(start as Parser<unknown>);
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
            state.unsafeCallRaw(end as Parser<unknown>);
            if (state.isError) {
                mergeErrorState(state as ParserState<unknown>);
                reportUnclosedDelimiter(state as ParserState<unknown>, state.src.slice(savedOffset, openEnd), savedOffset);
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            state.unsafeSetValue(value);
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
                addSuggestion(state as ParserState<unknown>, {
                    kind: "trailing-content",
                    message: "unexpected trailing content after parsed value",
                });
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
            state.unsafeSetValue([]);
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
            state.unsafeSetValue([]);
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
            collectDiagnostic(state as ParserState<unknown>, checkpoint);

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
