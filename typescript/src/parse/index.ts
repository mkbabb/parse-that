/* eslint-disable @typescript-eslint/no-explicit-any */
import { createParserContext, ParserState } from "./state.js";
import type { ParserContext } from "./state.js";
import { parserDebug, parserPrint } from "./debug.js";

type ExtractValue<T extends ReadonlyArray<Parser<unknown>>> = {
    [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
};

export type ParserFunction<T = string> = (
    val: ParserState<any>,
) => ParserState<any>;

let PARSER_ID = 0;

const MEMO = new Map<number, ParserState<unknown>>();
const LEFT_RECURSION_COUNTS = new Map<string, number>();

let lastFurthestOffset = -1;
let lastState: ParserState<unknown> | undefined;

export function mergeErrorState(state: ParserState<unknown>) {
    if (state.offset > lastFurthestOffset) {
        lastFurthestOffset = state.offset;
        lastState = state;
    }
    return lastState;
}

export function getLazyParser<T>(
    fn: (() => Parser<T>) & { parser?: Parser<T> },
): Parser<T> {
    if (fn.parser) {
        return fn.parser;
    }
    return (fn.parser = fn());
}

// Closure-local lazy cache — avoids mutating function objects (megamorphic IC pollution)
function createLazyCached<T>(fn: () => Parser<T>): (state: ParserState<T>) => ParserState<T> {
    let cached: Parser<T> | undefined;
    return (state: ParserState<T>) => {
        if (!cached) cached = fn();
        return cached.parser(state) as ParserState<T>;
    };
}

export class Parser<T = string> {
    id: number = PARSER_ID++;
    state: ParserState<T> | undefined;

    constructor(
        public parser: ParserFunction<T>,
        public context: ParserContext = {},
    ) {}

    reset() {
        lastState = undefined;
        lastFurthestOffset = -1;
        MEMO.clear();
        LEFT_RECURSION_COUNTS.clear();
    }

    parseState(val: string) {
        this.reset();

        const state = new ParserState(val) as ParserState<T>;
        this.parser(state);

        if (state.isError && lastState) {
            // Build error display from the furthest offset reached
            const errorState = new ParserState(val, undefined, lastFurthestOffset, true);
            this.state = errorState as ParserState<T>;
            console.log(this.state.toString());
        } else {
            this.state = state;
            if (state.isError) {
                console.log(state.toString());
            }
        }

        return state;
    }

    parse(val: string) {
        return this.parseState(val).value;
    }

    getCijKey(state: ParserState<T>) {
        return `${this.id}${state.offset}`;
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
                const value1 = state.value;
                const offset1 = state.offset;
                state.offset = savedOffset;
                state.isError = false;
                parser!.parser(state as ParserState<S | T>);
                if (state.isError) {
                    // parser! failed — return the first parser's result
                    state.offset = offset1;
                    state.value = value1 as any;
                    state.isError = false;
                    return state;
                } else {
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

    trim<S>(
        parser: Parser<S> = whitespace as unknown as Parser<S>,
        discard: boolean = true,
    ) {
        if (!discard) {
            return all(parser as Parser<unknown>, this as Parser<unknown>, parser as Parser<unknown>) as unknown as Parser<T[]>;
        }

        if (parser.context?.name === "whitespace") {
            const whitespaceTrim = (state: ParserState<T>) => {
                trimStateWhitespace(state);
                const savedOffset = state.offset;
                this.parser(state);

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
            const matches: T[] = [];

            for (let i = 0; i < max; i += 1) {
                const savedOffset = state.offset;
                this.parser(state);

                if (state.isError) {
                    state.offset = savedOffset;
                    state.isError = false;
                    break;
                }
                if (state.offset === savedOffset) break;
                matches.push(state.value);
            }

            if (matches.length >= min) {
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

    sepBy<S>(sep: Parser<S | T>, min: number = 0, max: number = Infinity) {
        const sepBy = (state: ParserState<T>) => {
            const matches: T[] = [];

            for (let i = 0; i < max; i += 1) {
                const savedOffset = state.offset;
                this.parser(state);
                if (state.isError) {
                    state.offset = savedOffset;
                    state.isError = false;
                    break;
                }
                if (state.offset === savedOffset) break;
                matches.push(state.value);

                const sepOffset = state.offset;
                sep.parser(state as ParserState<S | T>);
                if (state.isError) {
                    state.offset = sepOffset;
                    state.isError = false;
                    break;
                }
            }

            if (matches.length >= min) {
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

export function eof<T>() {
    const eof = (state: ParserState<T>) => {
        if (state.offset >= state.src.length) {
            return state.ok(undefined);
        } else {
            mergeErrorState(state as ParserState<unknown>);
            state.isError = true;
            return state;
        }
    };
    return new Parser(
        eof,
        createParserContext("eof", undefined),
    ) as Parser<unknown>;
}

/**
 * Method decorator that wraps a parser-returning method in a lazy parser.
 * Defers parser construction until first invocation, then caches.
 */
export function lazy<T>(
    target: unknown,
    _propertyName: string,
    descriptor: TypedPropertyDescriptor<() => Parser<T>>,
) {
    const method = descriptor.value!.bind(target)!;

    descriptor.value = function () {
        return new Parser<T>(
            createLazyCached(method),
            createParserContext("lazy", undefined, method),
        );
    };
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

    return new Parser(
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

    const dispatchParser = (state: ParserState<T>) => {
        const ch = state.src.charCodeAt(state.offset);
        const idx = ch < 128 ? tbl[ch] : -1;
        if (idx >= 0) {
            return parsers[idx].parser(state);
        }
        if (fallback) {
            return fallback.parser(state);
        }
        mergeErrorState(state as ParserState<unknown>);
        state.isError = true;
        return state;
    };

    return new Parser(
        dispatchParser as ParserFunction<T>,
        createParserContext("dispatch", undefined, ...parsers),
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function all<T extends Array<Parser<any>>>(...parsers: T) {
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

    return new Parser(
        parsers.length === 1 ? parsers[0].parser : allParser,
        createParserContext("all", undefined, ...parsers),
    ) as Parser<Result>;
}

// Step 2: string() with startsWith + single-char charCodeAt fast path
export function string(str: string) {
    const len = str.length;

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
            mergeErrorState(state as ParserState<unknown>);
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
            mergeErrorState(state as ParserState<unknown>);
            state.isError = true;
            return state;
        }) as ParserFunction<string>;
    }

    return new Parser(
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

        mergeErrorState(state as ParserState<unknown>);
        state.isError = true;
        return state;
    };

    return new Parser(
        regexParser as ParserFunction<string>,
        createParserContext("regex", undefined, r),
    );
}

// Step 5: Inline whitespace trimming with charCode loop + fast-exit
const trimStateWhitespace = <T>(state: ParserState<T>): ParserState<T> => {
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

export const whitespace = regex(/\s*/);
whitespace.context.name = "whitespace";

export { createParserContext, ParserState } from "./state.js";
export type { ParserContext } from "./state.js";
