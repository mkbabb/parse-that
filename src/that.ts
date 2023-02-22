import { Ok, Err, Result } from "./monad";

export type ParserStateTuple<T = string> = [T, ParserState];

export class ParserState {
    constructor(
        public value: string,
        public offset: number = 0,
        public colNumber: number = 0,
        public lineNumber: number = 0
    ) {}

    slice(pos: number): string | undefined {
        return this.value.slice(this.offset, this.offset + pos + 1);
    }

    next(offset: number = 1): ParserStateTuple {
        offset = offset < 0 ? this.value.length - offset : offset;
        const ch = this.slice(offset);

        if (ch !== undefined) {
            offset += this.offset;

            const lineNumber = ch.split("\n").length - 1 + this.lineNumber;
            const colNumber = ch.length - ch.lastIndexOf("\n") - 1;

            const val = new ParserState(this.value, offset, colNumber, lineNumber);
            return [ch, val];
        } else {
            return [ch, this];
        }
    }

    addCursor(cursor: string = "^"): string {
        const MAX_LINES = 5;
        const MAX_LINE_LENGTH = 50;

        const lines = this.value.split("\n");
        const lineIdx = Math.min(lines.length - 1, this.lineNumber);
        const startIdx = Math.max(lineIdx - MAX_LINES, 0);
        const endIdx = Math.min(lineIdx + MAX_LINES + 1, lines.length);

        const lineSummaries = lines.slice(startIdx, endIdx).map((line) => {
            if (line.length <= MAX_LINE_LENGTH) {
                return line;
            } else {
                return line.slice(0, MAX_LINE_LENGTH - 3) + "...";
            }
        });

        const cursorLine = " ".repeat(this.colNumber) + cursor;

        lineSummaries.splice(lineIdx - startIdx + 1, 0, cursorLine);

        return lineSummaries.join("\n");
    }
}

type ParserFunction<T = string> = (val: ParserState) => ParserStateTuple<T>;

export class Parser<T = string> {
    constructor(public parser: ParserFunction<Result<T>>, public name?: string) {}

    parse(val: string) {
        return this.apply(new ParserState(val))[0].value;
    }

    apply(state: ParserState) {
        return this.parser(state);
    }

    then<S>(next: Parser<S>) {
        const then = (state: ParserState) => {
            const [match1, nextState1] = this.apply(state);

            if (match1 instanceof Ok) {
                const [match2, rest2] = next.apply(nextState1);
                if (match2 instanceof Ok) {
                    return [
                        new Ok([match1.value, match2.value]),
                        rest2,
                    ] as ParserStateTuple<Ok<[T, S]>>;
                }
            }
            return [new Err(undefined), state] as ParserStateTuple<Err>;
        };
        return new Parser(then, "then");
    }

    or<S>(other: Parser<S>) {
        const or = (state: ParserState) => {
            const [match, newState] = this.apply(state);

            if (match instanceof Ok) {
                return [match, newState];
            } else {
                return other.apply(state);
            }
        };

        return new Parser(or as ParserFunction<Result<S>>, "or");
    }

    chain<S>(fn: (state: T) => Parser<S>) {
        const chain = (state: ParserState) => {
            const [match, newState] = this.apply(state);

            if (match instanceof Err) {
                return [match, newState];
            } else if (match.value) {
                return fn(match.value).apply(newState);
            } else {
                return [match, state];
            }
        };

        return new Parser(chain as ParserFunction<Result<S>>, "chain");
    }

    map<S>(fn: (value: T) => S) {
        const chain: Parser<S> = this.chain(
            (value) => new Parser((_) => [new Ok(fn(value)), _])
        );
        chain.name = "map";
        return chain;
    }

    skip<S>(parser: Parser<S>) {
        return this.then(parser).map(([a, _]) => a);
    }

    opt() {
        const opt = (state: ParserState) => {
            const [match, newState] = this.apply(state);

            if (match instanceof Err) {
                return [new Ok(undefined), state];
            } else {
                return [match, newState];
            }
        };
        return new Parser(opt as ParserFunction<Ok<T>>, "opt");
    }

    memoize() {
        const cache = new Map<number, ParserStateTuple<Result<T>>>();
        const memo = (state: ParserState) => {
            if (cache.has(state.offset)) {
                return cache.get(state.offset)!;
            } else {
                const [match, newState] = this.apply(state);
                cache.set(state.offset, [match, newState]);

                return [match, newState];
            }
        };

        return new Parser(memo as ParserFunction<Result<T>>, "memoize");
    }

    wrap<L, R>(start: Parser<L>, end: Parser<R>) {
        return start
            .then(this)
            .map(([, a]) => a)
            .skip(end);
    }

    trim<S>(parser: Parser<S>) {
        return this.wrap(parser, parser);
    }
}

export function lazy<T>(fn: () => Parser<T>) {
    return new Parser((state) => fn().apply(state), "lazy");
}

export function lookAhead<T>(parser: Parser<T>) {
    function inner(state: ParserState) {
        const [, newState] = state.next();
        const [match] = parser.apply(newState);
        return [match, state];
    }
    return new Parser(inner as ParserFunction<Result<T>>, "lookAhead");
}

export function many<T>(parser: Parser<T>, min: number = 0, max: number = Infinity) {
    const inner = (state: ParserState) => {
        const matches: T[] = [];

        for (let i = 0; i < max; i += 1) {
            const [match, newState] = parser.apply(state);

            if (match instanceof Err) {
                break;
            } else if (match) {
                matches.push(match.value);
            }
            state = newState;
        }

        if (matches.length >= min) {
            return [new Ok(matches), state] as ParserStateTuple<Ok<T[]>>;
        } else {
            return [new Err(""), state] as ParserStateTuple<Err>;
        }
    };

    return new Parser(inner, "many");
}

export function any<T extends any[]>(...parsers: T) {
    const inner = (state: ParserState) => {
        for (const parser of parsers) {
            const [match, newState] = parser.apply(state);
            if (match instanceof Ok) {
                return [match, newState];
            }
        }
        return [new Err(undefined), state];
    };

    return new Parser(inner, "any");
}

type ExtractValue<T extends ReadonlyArray<Parser<any>>> = {
    [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
};

export function all<T extends Parser<any>[]>(...parsers: T) {
    const inner = (state: ParserState): ParserStateTuple<Result<ExtractValue<T>>> => {
        const matches = [] as any;

        for (const parser of parsers) {
            const [match, newState] = parser.apply(state);

            if (match instanceof Err) {
                return [new Err(undefined), state];
            }
            matches.push(match.value);
            state = newState;
        }

        return [new Ok(matches), state];
    };

    return new Parser(inner, "all");
}

export function match(regex: RegExp) {
    const sticky = new RegExp(regex, regex.flags + "y");

    const inner = (state: ParserState) => {
        if (state.offset === state.value.length) {
            return [new Err(undefined), state];
        }

        sticky.lastIndex = state.offset;
        const match = state.value.match(sticky);

        if (match) {
            const [, newState] = state.next(match[0].length);

            return [new Ok(match[0]), newState];
        }

        return [new Err(undefined), state];
    };

    return new Parser(inner, "match");
}

export function sepBy<T, S>(
    parser: Parser<T>,
    separator: Parser<S>,
    min: number = 0,
    max: number = Infinity
) {
    return parser
        .then(
            many(
                separator.then(parser).map(([_, value]) => value),
                min,
                max
            )
        )
        .map(([value, values]) => [value, ...values]);
}

export const whitespace = match(/\s+/).opt();
