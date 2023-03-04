import { createParserContext, ParserContext, ParserState } from "./state";
import { parserDebug, parserPrint, statePrint } from "./debug";

type ExtractValue<T extends ReadonlyArray<Parser<any>>> = {
    [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
};

type ParserFunction<T = string> = (val: ParserState<T>) => ParserState<T>;

let PARSER_ID = 0;

const MEMO = new Map<number, ParserState<any>>();
const LEFT_RECURSION_COUNTS = new Map<string, number>();

let lastState: ParserState<any> | undefined;

export function mergeErrorState(state: ParserState<any>) {
    if (!lastState || (lastState && state.offset > lastState.offset)) {
        lastState = state;
    }
    return lastState;
}

export function getLazyParser<T>(fn: () => Parser<T>) {
    if (fn.parser) {
        return fn.parser;
    }
    return (fn.parser = fn());
}

export class Parser<T = string> {
    id: number = PARSER_ID++;
    state: ParserState<T> | undefined;

    constructor(public parser: ParserFunction<T>, public context: ParserContext = {}) {}

    reset() {
        this.id = 0;
        PARSER_ID = 0;
        lastState = undefined;

        MEMO.clear();
        LEFT_RECURSION_COUNTS.clear();
    }

    parse(val: string) {
        this.reset();
        const newState = this.parser(new ParserState(val));

        this.state = mergeErrorState(newState);
        this.state.isError = newState.isError;

        return newState.value;
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

            let cached = MEMO.get(this.id);

            if (cached && cached.offset >= state.offset) {
                return cached;
            } else if (this.atLeftRecursionLimit(state)) {
                return state.err(undefined);
            }

            LEFT_RECURSION_COUNTS.set(cijKey, cij + 1);
            const newState = this.parser(state);

            cached = MEMO.get(this.id);

            if (cached && cached.offset > newState.offset) {
                newState.offset = cached.offset;
            } else if (!cached) {
                MEMO.set(this.id, newState);
            }

            return newState;
        };
        return new Parser(
            memoize as ParserFunction<T>,
            createParserContext("memoize", this)
        );
    }

    mergeMemos<S>() {
        const mergeMemo = (state: ParserState<T>) => {
            let cached = MEMO.get(this.id);
            if (cached) {
                return cached;
            } else if (this.atLeftRecursionLimit(state)) {
                return state.err(undefined);
            }

            const newState = this.parser(state);

            cached = MEMO.get(this.id);
            if (!cached) {
                MEMO.set(this.id, newState);
            }
            return newState;
        };

        return new Parser(
            mergeMemo as ParserFunction<[T, S]>,
            createParserContext("mergeMemo", this)
        );
    }

    then<S>(next: Parser<S | T>) {
        if (isStringParsers(this, next)) {
            return concatStringParsers([this, next], "", (m) => [m?.[0], m?.[1]]);
        }

        const then = (state: ParserState<T>) => {
            const nextState1 = this.parser(state);

            if (!nextState1.isError) {
                const nextState2 = next.parser(nextState1);
                if (!nextState2.isError) {
                    return nextState2.ok([nextState1.value, nextState2.value]);
                }
            }
            mergeErrorState(state);
            return state.err(undefined);
        };

        return new Parser(
            then as ParserFunction<[T, S]>,
            createParserContext("then", this, this, next)
        );
    }

    or<S>(other: Parser<S | T>) {
        if (isStringParsers(this, other)) {
            return concatStringParsers([this, other], "|");
        }

        const or = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (!newState.isError) {
                return newState;
            }
            return other.parser(state);
        };

        return new Parser(
            or as ParserFunction<T | S>,
            createParserContext("or", this, this, other)
        );
    }

    chain<S>(fn: (value: T) => Parser<S | T>, chainError: boolean = false) {
        const chain = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (newState.isError) {
                return newState;
            } else if (newState.value || chainError) {
                return fn(newState.value).parser(newState);
            }
            return state;
        };

        return new Parser(chain, createParserContext("chain", this, fn));
    }

    map<S>(fn: (value: T) => S, mapError: boolean = false) {
        const map = (state: ParserState<T | S>) => {
            const newState = this.parser(state as ParserState<T>);

            if (!newState.isError || mapError) {
                return newState.ok(fn(newState.value));
            }
            return newState;
        };

        return new Parser(map as ParserFunction<S>, createParserContext("map", this));
    }

    mapState<S extends T>(fn: (state: ParserState<T>) => ParserState<S>) {
        const mapState = (state: ParserState<T>) => {
            const newState = this.parser(state);
            return fn(newState);
        };

        return new Parser(
            mapState as ParserFunction<S>,
            createParserContext("mapState", this)
        );
    }

    skip<S>(parser: Parser<T | S>) {
        const skip = (state: ParserState<T>) => {
            const nextState1 = this.parser(state);
            let nextState2;

            if (!nextState1.isError) {
                nextState2 = parser.parser(nextState1);
                if (!nextState2.isError) {
                    return nextState2.ok(nextState1.value);
                }
            }
            mergeErrorState(state);
            return state.err(undefined);
        };
        return new Parser(
            skip as ParserFunction<T>,
            createParserContext("skip", this, parser)
        );
    }

    next<S>(parser: Parser<S>) {
        const next = this.then(parser).map(([, b]) => {
            return b;
        }) as Parser<S>;
        next.context = createParserContext("next", this, parser);
        return next;
    }

    opt() {
        const opt = (state: ParserState<T>) => {
            const newState = this.parser(state);
            if (newState.isError) {
                mergeErrorState(state);
                return state.ok(undefined);
            }
            return newState;
        };
        return new Parser(opt as ParserFunction<T>, createParserContext("opt", this));
    }

    not<S>(parser?: Parser<S>) {
        const negate = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (newState.isError) {
                mergeErrorState(state);
                return state.ok(state.value);
            } else {
                return state.err(undefined);
            }
        };

        const not = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (newState.isError) {
                mergeErrorState(state);
                return newState;
            } else {
                const nextState = parser.parser(state);
                if (nextState.isError) {
                    return newState;
                } else {
                    mergeErrorState(state);
                    return state.err(undefined);
                }
            }
        };

        return new Parser(
            parser ? not : negate,
            createParserContext("not", this, parser)
        );
    }

    wrap<L, R>(start: Parser<L>, end: Parser<R>, discard: boolean = true) {
        if (!discard) {
            return all(start, this, end);
        }

        if (isStringParsers(start, this, end)) {
            return wrapStringParsers(start, this, end);
        }
        const wrap = start.next(this).skip(end) as Parser<T>;
        wrap.context = createParserContext("wrap", this, start, end);
        return wrap;
    }

    trim(parser: Parser<T> = whitespace as Parser<T>, discard: boolean = true) {
        if (!discard) {
            return all(parser, this, parser);
        }

        if (parser.context?.name === "whitespace") {
            if (isStringParsers(this, parser)) {
                return concatStringParsers(
                    [parser, this, parser],
                    "",
                    (m) => m?.[2]
                ) as Parser<T>;
            }

            const whitespaceTrim = (state: ParserState<T>) => {
                const newState = trimStateWhitespace(state);
                const tmpState = this.parser(newState);

                if (tmpState.isError) {
                    mergeErrorState(state);
                    return state.err(undefined);
                } else {
                    return trimStateWhitespace(tmpState);
                }
            };

            return new Parser(
                whitespaceTrim as ParserFunction<T>,
                createParserContext("trimWhitespace", this)
            ) as Parser<T>;
        }

        return this.wrap(parser, parser) as Parser<T>;
    }

    many(min: number = 0, max: number = Infinity) {
        const many = (state: ParserState<T>) => {
            const matches: T[] = [];
            let newState = state;

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
            mergeErrorState(state);
            return state.err([]) as ParserState<T[]>;
        };

        return new Parser(
            many as ParserFunction<T[]>,
            createParserContext("many", this, min, max)
        );
    }

    sepBy<S>(sep: Parser<S | T>, min: number = 0, max: number = Infinity) {
        const sepBy = (state: ParserState<T>) => {
            const matches: T[] = [];

            let newState = state;

            for (let i = 0; i < max; i += 1) {
                const tmpState = this.parser(newState);
                if (tmpState.isError) {
                    break;
                }
                newState = tmpState;
                matches.push(newState.value);

                const sepState = sep.parser(newState);
                if (sepState.isError) {
                    break;
                }
                newState = sepState as ParserState<T>;
            }

            if (matches.length > min) {
                return newState.ok(matches) as ParserState<T[]>;
            }
            mergeErrorState(state);
            return state.err([]) as ParserState<T[]>;
        };

        return new Parser(
            sepBy as ParserFunction<T[]>,
            createParserContext("sepBy", this, sep)
        );
    }

    eof() {
        const p = this.skip(eof()) as Parser<T>;
        p.context = createParserContext("eof", this);
        return p;
    }

    debug(
        name: string = "",
        recursivePrint: boolean = false,
        logger: (...s: any[]) => void = console.log
    ) {
        return parserDebug(this, name, recursivePrint, logger);
    }

    toString() {
        return parserPrint(this);
    }

    static lazy<T>(fn: () => Parser<T>) {
        const lazy = (state: ParserState<T>) => {
            return getLazyParser(fn).parser(state);
        };
        return new Parser<T>(lazy, createParserContext("lazy", undefined, fn));
    }
}

function isStringParsers(...parsers: Parser<any>[]) {
    return parsers.every(
        (p) =>
            (p.context?.name === "string" ||
                p.context?.name === "regex" ||
                p.context?.name === "whitespace") &&
            p.context?.args
    );
}

function stringParserValue(p: Parser<any>) {
    if (p.context?.name === "string") {
        return p.context?.args[0].replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    } else if (p.context?.name === "regex" || p.context?.name === "whitespace") {
        return p.context?.args[0].source;
    }
}

function concatStringParsers(
    parsers: Parser<any>[],
    delim: string = "",
    matchFunction?: (m: RegExpMatchArray) => any
): Parser<string> {
    const s = parsers.map((s) => `(${stringParserValue(s)})`).join(delim);
    const r = new RegExp(s);
    const rP = regex(r, matchFunction);

    if (delim !== "|") {
        rP.context = createParserContext("regexConcat", this, r);
    }
    return rP;
}

function wrapStringParsers<L, T, R>(
    left: Parser<L>,
    p: Parser<T>,
    right: Parser<R>
): Parser<string> {
    const rP = concatStringParsers([left, p, right], "", (m) => {
        return m?.[2];
    });
    rP.context.name = "regexWrap";
    return rP;
}

export function eof<T>() {
    const eof = (state: ParserState<T>) => {
        if (state.offset >= state.src.length) {
            return state.ok(undefined);
        } else {
            return state.err();
        }
    };
    return new Parser(eof, createParserContext("eof", undefined)) as Parser<any>;
}

export function lazy<T>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<() => Parser<T>>
) {
    const method = descriptor.value.bind(target)!;

    descriptor.value = function () {
        const lazy = (state: ParserState<T>) => {
            return getLazyParser(method).parser(state) as ParserState<T>;
        };
        return new Parser<T>(lazy, createParserContext("lazy", undefined, method));
    };
}

export function any<T extends any[]>(...parsers: T) {
    if (isStringParsers(...parsers)) {
        return concatStringParsers(parsers, "|") as Parser<ExtractValue<T>[number]>;
    }

    const any = (state: ParserState<T>) => {
        for (const parser of parsers) {
            const newState = parser.parser(state);
            if (!newState.isError) {
                return newState;
            }
        }
        mergeErrorState(state);
        return state.err(undefined);
    };

    return new Parser(
        parsers.length === 1 ? parsers[0].parser : any,
        createParserContext("any", undefined, ...parsers)
    ) as Parser<ExtractValue<T>[number]>;
}

export function all<T extends any[]>(...parsers: T) {
    const all = (state: ParserState<ExtractValue<T>>): ParserState<ExtractValue<T>> => {
        const matches = [] as any;

        for (const parser of parsers) {
            const newState = parser.parser(state);

            if (newState.isError) {
                return newState;
            }

            // TODO! hack or ...?
            if (newState.value !== undefined) {
                matches.push(newState.value);
            }
            state = newState;
        }
        mergeErrorState(state);
        return state.ok(matches);
    };

    return new Parser(
        parsers.length === 1 ? parsers[0].parser : all,
        createParserContext("all", undefined, ...parsers)
    ) as Parser<ExtractValue<T>>;
}

export function string(str: string) {
    const string = (state: ParserState<string>) => {
        if (state.offset >= state.src.length) {
            return state.err(undefined);
        }
        const s = state.src.slice(state.offset, state.offset + str.length);
        if (s === str) {
            return state.ok(s, s.length);
        }
        mergeErrorState(state);
        return state.err(undefined);
    };

    return new Parser(
        string as ParserFunction<string>,
        createParserContext("string", undefined, str)
    );
}

export function regex(
    r: RegExp,
    matchFunction: (match: RegExpMatchArray) => any = (m) => m?.[0]
) {
    const flags = r.flags.replace(/y/g, "");
    const sticky = new RegExp(r, flags + "y");

    const regex = (state: ParserState<string>) => {
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
        mergeErrorState(state);
        return state.err(undefined);
    };

    return new Parser(
        regex as ParserFunction<string>,
        createParserContext("regex", undefined, r)
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
