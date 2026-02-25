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

let lastState: ParserState<unknown> | undefined;

export function mergeErrorState(state: ParserState<unknown>) {
    if (!lastState || state.offset > lastState.offset) {
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

export class Parser<T = string> {
    id: number = PARSER_ID++;
    state: ParserState<T> | undefined;

    constructor(
        public parser: ParserFunction<T>,
        public context: ParserContext = {},
    ) {}

    reset() {
        lastState = undefined;
        MEMO.clear();
        LEFT_RECURSION_COUNTS.clear();
    }

    parseState(val: string) {
        this.reset();

        const newState = this.parser(new ParserState(val) as ParserState<T>);

        this.state = mergeErrorState(newState as ParserState<unknown>) as ParserState<T>;
        this.state.isError = newState.isError;

        if (this.state.isError) {
            console.log(this.state.toString());
        }

        return newState;
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

            let cached = MEMO.get(this.id) as ParserState<T> | undefined;

            if (cached && cached.offset >= state.offset) {
                return cached;
            } else if (this.atLeftRecursionLimit(state)) {
                return state.err(undefined as unknown as T);
            }

            LEFT_RECURSION_COUNTS.set(cijKey, cij + 1);
            const newState = this.parser(state);

            cached = MEMO.get(this.id) as ParserState<T> | undefined;

            if (cached && cached.offset > newState.offset) {
                newState.offset = cached.offset;
            } else if (!cached) {
                MEMO.set(this.id, newState as ParserState<unknown>);
            }

            return newState;
        };
        return new Parser(
            memoize as ParserFunction<T>,
            createParserContext("memoize", this),
        );
    }

    mergeMemos() {
        const mergeMemo = (state: ParserState<T>) => {
            let cached = MEMO.get(this.id) as ParserState<T> | undefined;
            if (cached) {
                return cached;
            } else if (this.atLeftRecursionLimit(state)) {
                return state.err(undefined as unknown as T);
            }

            const newState = this.parser(state);

            cached = MEMO.get(this.id) as ParserState<T> | undefined;
            if (!cached) {
                MEMO.set(this.id, newState as ParserState<unknown>);
            }
            return newState;
        };

        return new Parser(
            mergeMemo as ParserFunction<T>,
            createParserContext("mergeMemo", this),
        );
    }

    then<S>(next: Parser<S | T>) {
        const then = (state: ParserState<T>) => {
            const nextState1 = this.parser(state);

            if (!nextState1.isError) {
                const nextState2 = next.parser(nextState1 as ParserState<S | T>);
                if (!nextState2.isError) {
                    return nextState2.ok([nextState1.value, nextState2.value]);
                }
            }
            mergeErrorState(state as ParserState<unknown>);
            return state.err(undefined);
        };

        return new Parser(
            then as ParserFunction<[T, S]>,
            createParserContext("then", this as Parser<unknown>, this, next),
        );
    }

    or<S>(other: Parser<S | T>) {
        const or = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (!newState.isError) {
                return newState;
            }
            return other.parser(state as ParserState<S | T>);
        };

        return new Parser(
            or as ParserFunction<T | S>,
            createParserContext("or", this as Parser<unknown>, this, other),
        );
    }

    chain<S>(fn: (value: T) => Parser<S | T>, chainError: boolean = false) {
        const chain = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (newState.isError) {
                return newState;
            } else if (newState.value || chainError) {
                return fn(newState.value).parser(newState as ParserState<S | T>);
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
            const newState = this.parser(state as ParserState<T>);

            if (!newState.isError || mapError) {
                return newState.ok(fn(newState.value));
            }
            return newState;
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
            const newState = this.parser(state);
            return fn(newState, state);
        };

        return new Parser(
            mapState as ParserFunction<S>,
            createParserContext("mapState", this as Parser<unknown>),
        );
    }

    skip<S>(parser: Parser<T | S>) {
        const skip = (state: ParserState<T>) => {
            const nextState1 = this.parser(state);

            if (!nextState1.isError) {
                const nextState2 = parser.parser(nextState1 as ParserState<T | S>);
                if (!nextState2.isError) {
                    return nextState2.ok(nextState1.value);
                }
            }
            mergeErrorState(state as ParserState<unknown>);
            return state.err(undefined);
        };
        return new Parser(
            skip as ParserFunction<T>,
            createParserContext("skip", this as Parser<unknown>, parser),
        );
    }

    next<S>(parser: Parser<S>) {
        const next = this.then(parser).map(([, b]) => {
            return b;
        }) as Parser<S>;
        next.context = createParserContext("next", this as Parser<unknown>, parser);
        return next;
    }

    opt() {
        const opt = (state: ParserState<T>) => {
            const newState = this.parser(state);
            if (newState.isError) {
                mergeErrorState(state as ParserState<unknown>);
                return state.ok(undefined);
            }
            return newState;
        };
        return new Parser(
            opt as ParserFunction<T | undefined>,
            createParserContext("opt", this as Parser<unknown>),
        );
    }

    not<S extends T>(parser?: Parser<S | T>) {
        const negate = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (newState.isError) {
                mergeErrorState(state as ParserState<unknown>);
                return state.ok(state.value);
            } else {
                return state.err(undefined);
            }
        };

        const not = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (newState.isError) {
                mergeErrorState(state as ParserState<unknown>);
                return newState;
            } else {
                const nextState = parser!.parser(state as ParserState<S | T>);
                if (nextState.isError) {
                    return newState;
                } else {
                    mergeErrorState(state as ParserState<unknown>);
                    return state.err(undefined);
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

        const wrap = (start as Parser<unknown>)
            .next(this as Parser<unknown>)
            .skip(end as Parser<unknown>) as Parser<T>;
        wrap.context = createParserContext("wrap", this as Parser<unknown>, start, end);
        return wrap;
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
                const newState = trimStateWhitespace(state);
                const tmpState = this.parser(newState);

                if (tmpState.isError) {
                    mergeErrorState(state as ParserState<unknown>);
                    return state.err(undefined);
                } else {
                    return trimStateWhitespace(tmpState);
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
            let newState: ParserState<T> = state;

            for (let i = 0; i < max; i += 1) {
                const tmpState = this.parser(newState);

                if (tmpState.isError) {
                    break;
                }
                matches.push(tmpState.value);
                newState = tmpState;
            }

            if (matches.length >= min) {
                return newState.ok(matches) as ParserState<T[]>;
            }
            mergeErrorState(state as ParserState<unknown>);
            return state.err([]) as unknown as ParserState<T[]>;
        };

        return new Parser(
            many as ParserFunction<T[]>,
            createParserContext("many", this as Parser<unknown>, min, max),
        );
    }

    sepBy<S>(sep: Parser<S | T>, min: number = 0, max: number = Infinity) {
        const sepBy = (state: ParserState<T>) => {
            const matches: T[] = [];

            let newState: ParserState<T> = state;

            for (let i = 0; i < max; i += 1) {
                const tmpState = this.parser(newState);
                if (tmpState.isError) {
                    break;
                }
                newState = tmpState;
                matches.push(newState.value);

                const sepState = sep.parser(newState as ParserState<S | T>);
                if (sepState.isError) {
                    break;
                }
                newState = sepState as ParserState<T>;
            }

            if (matches.length > min) {
                return newState.ok(matches) as ParserState<T[]>;
            }
            mergeErrorState(state as ParserState<unknown>);
            return state.err([]) as unknown as ParserState<T[]>;
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
        const lazy = (state: ParserState<T>) => {
            return getLazyParser(fn).parser(state) as ParserState<T>;
        };
        return new Parser<T>(
            lazy,
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
            return state.err();
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
        const lazy = (state: ParserState<T>) => {
            return getLazyParser(method).parser(state) as ParserState<T>;
        };
        return new Parser<T>(
            lazy,
            createParserContext("lazy", undefined, method),
        );
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function any<T extends Array<Parser<any>>>(...parsers: T) {
    type Result = T[number] extends Parser<infer V> ? V : never;
    const anyParser = (state: ParserState<Result>) => {
        for (const parser of parsers) {
            const newState = parser.parser(state);
            if (!newState.isError) {
                return newState;
            }
        }
        mergeErrorState(state as ParserState<unknown>);
        return state.err(undefined);
    };

    return new Parser(
        parsers.length === 1 ? parsers[0].parser : anyParser,
        createParserContext("any", undefined, ...parsers),
    ) as Parser<Result>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function all<T extends Array<Parser<any>>>(...parsers: T) {
    type Result = ExtractValue<T>;
    const allParser = (state: ParserState<Result>): ParserState<Result> => {
        const matches: unknown[] = [];

        let currentState: ParserState<unknown> = state as ParserState<unknown>;

        for (const parser of parsers) {
            const newState = parser.parser(currentState);

            if (newState.isError) {
                return newState as ParserState<Result>;
            }

            if (newState.value !== undefined) {
                matches.push(newState.value);
            }
            currentState = newState;
        }
        mergeErrorState(currentState);
        return currentState.ok(matches) as ParserState<Result>;
    };

    return new Parser(
        parsers.length === 1 ? parsers[0].parser : allParser,
        createParserContext("all", undefined, ...parsers),
    ) as Parser<Result>;
}

export function string(str: string) {
    const stringParser = (state: ParserState<string>) => {
        if (state.offset >= state.src.length) {
            return state.err(undefined);
        }
        const s = state.src.slice(state.offset, state.offset + str.length);
        if (s === str) {
            return state.ok(s, s.length);
        }
        mergeErrorState(state as ParserState<unknown>);
        return state.err(undefined);
    };

    return new Parser(
        stringParser as ParserFunction<string>,
        createParserContext("string", undefined, str),
    );
}

export function regex(
    r: RegExp,
    matchFunction: (match: RegExpMatchArray | null) => string | null = (m) =>
        m?.[0] ?? null,
) {
    const flags = r.flags.replace(/y/g, "");
    const sticky = new RegExp(r, flags + "y");

    const regexParser = (state: ParserState<string>) => {
        if (state.offset >= state.src.length) {
            return state.err(undefined);
        }

        sticky.lastIndex = state.offset;
        const match = matchFunction(state.src.match(sticky));

        if (match) {
            return state.ok(match, sticky.lastIndex - state.offset);
        } else if (match === "") {
            return state.ok(undefined);
        }
        mergeErrorState(state as ParserState<unknown>);
        return state.err(undefined);
    };

    return new Parser(
        regexParser as ParserFunction<string>,
        createParserContext("regex", undefined, r),
    );
}

const WHITESPACE = /\s*/y;
const trimStateWhitespace = <T>(state: ParserState<T>) => {
    if (state.offset >= state.src.length) {
        return state;
    }

    WHITESPACE.lastIndex = state.offset;
    const match = state.src.match(WHITESPACE)?.[0] ?? "";
    return state.ok(state.value, match.length);
};

export const whitespace = regex(/\s*/);
whitespace.context.name = "whitespace";

export { createParserContext, ParserState } from "./state.js";
export type { ParserContext } from "./state.js";
