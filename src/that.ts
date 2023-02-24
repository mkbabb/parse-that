export class ParserState<T> {
    constructor(
        public src: string,
        public value: T = undefined,
        public offset: number = 0,
        public colNumber: number = 0,
        public lineNumber: number = 0,
        public isError: boolean = false
    ) {}

    ok<S>(value: S) {
        return new ParserState<S>(
            this.src,
            value,
            this.offset,
            this.colNumber,
            this.lineNumber
        );
    }

    err<S>(value?: S) {
        const nextState = this.ok(value);
        nextState.isError = true;
        return nextState;
    }

    slice(pos: number): string | undefined {
        return this.src.slice(this.offset, this.offset + pos);
    }

    next(offset: number = 1) {
        const ch = this.slice(offset);

        if (ch === undefined) {
            return this;
        }

        offset += this.offset;

        const lineNumber = ch.split("\n").length - 1 + this.lineNumber;
        const colNumber = ch.length - ch.lastIndexOf("\n") - 1;

        return new ParserState(this.src, ch, offset, colNumber, lineNumber);
    }

    addCursor(cursor: string = "^"): string {
        const MAX_LINES = 5;
        const MAX_LINE_LENGTH = 50;

        const lines = this.src.split("\n");
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

type ParserFunction<T = string> = (val: ParserState<T>) => ParserState<T>;

export class Parser<T = string> {
    constructor(public parser: ParserFunction<T>, public name?: string) {}

    parse(val: string) {
        return this.parser(new ParserState(val)).value as T;
    }

    then<S>(next: Parser<S | T>) {
        const then = (state: ParserState<T>) => {
            const nextState1 = this.parser(state);

            if (!nextState1.isError) {
                const nextState2 = next.parser(nextState1);
                if (!nextState2.isError) {
                    return nextState2.ok([nextState1.value, nextState2.value]);
                }
            }
            return state.err(undefined);
        };

        return new Parser(then as ParserFunction<[T, S]>, "then");
    }

    or<S>(other: Parser<S | T>) {
        const or = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (!newState.isError) {
                return newState;
            } else {
                return other.parser(state);
            }
        };

        return new Parser(or as ParserFunction<T | S>, "or");
    }

    chain<S>(fn: (value: T) => Parser<S | T>, chainError: boolean = false) {
        const chain = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (newState.isError) {
                return newState;
            } else if (newState.value || chainError) {
                return fn(newState.value).parser(newState);
            } else {
                return state;
            }
        };

        return new Parser(chain, "chain");
    }

    map<S>(fn: (value: T) => S, mapError: boolean = false) {
        const map = (state: ParserState<T | S>) => {
            const newState = this.parser(state as ParserState<T>);

            if (!newState.isError || mapError) {
                return newState.ok(fn(newState.value));
            } else {
                return newState;
            }
        };

        return new Parser(map as ParserFunction<S>, "map");
    }

    skip<S>(parser: Parser<S>) {
        return this.then(parser).map(([a]) => {
            return a;
        }) as Parser<T>;
    }
    next<S>(parser: Parser<S>) {
        return this.then(parser).map(([, b]) => {
            return b;
        }) as Parser<S>;
    }

    opt() {
        const opt = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (newState.isError) {
                return state.ok(undefined);
            } else {
                return newState;
            }
        };
        return new Parser(opt as ParserFunction<T>, "opt");
    }

    not<S>(parser?: Parser<S>) {
        const negate = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (newState.isError) {
                return state.ok(state.value);
            } else {
                return state.err(undefined);
            }
        };

        const not = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (newState.isError) {
                return newState;
            } else {
                const nextState = parser.parser(state);
                if (nextState.isError) {
                    return newState;
                } else {
                    return state.err(undefined);
                }
            }
        };

        return new Parser(parser ? not : negate, "not");
    }

    wrap<L, R>(start: Parser<L>, end: Parser<R>) {
        return start
            .then(this)
            .map(([, a]) => {
                return a;
            })
            .skip(end) as Parser<T>;
    }

    trim(parser = whitespace): Parser<T> {
        return this.wrap(parser, parser) as Parser<T>;
    }

    sepBy<S>(sep: Parser<S>, min: number = 0, max: number = Infinity) {
        return this.then(
            many(
                sep.then(this).map(([_, value]) => value),
                min,
                max
            )
        ).map(([value, values]) => [value, ...values]);
    }

    debug(name: string = "") {
        const debug = (state: ParserState<T>) => {
            const newState = this.parser(state);

            console.log(`\n${name} over ${this.name} at ${state.offset}:`);
            console.log(newState.isError ? "Error" : "Ok");

            console.log(newState.addCursor("^"));

            return newState;
        };

        return new Parser(debug, "debug");
    }
}

export function eof<T>() {
    const eof = (state: ParserState<T>) => {
        if (state.offset >= state.src.length) {
            return state.ok(state.value);
        } else {
            return state.err();
        }
    };
    return new Parser(eof, "eof");
}

export function lazy<T>(fn: () => Parser<T>) {
    const lazy = (state: ParserState<T>) => fn().parser(state);

    return new Parser<T>(lazy, "lazy");
}

export function many<T>(parser: Parser<T>, min: number = 0, max: number = Infinity) {
    const many = (state: ParserState<T>) => {
        const matches: T[] = [];

        for (let i = 0; i < max; i += 1) {
            const newState = parser.parser(state);

            if (newState.isError) {
                break;
            }
            matches.push(newState.value);
            state = newState;
        }

        if (matches.length >= min) {
            return state.ok(matches) as ParserState<T[]>;
        } else {
            return state.err([]) as ParserState<T[]>;
        }
    };

    return new Parser(many as ParserFunction<T[]>, "many");
}

type ExtractValue<T extends ReadonlyArray<Parser<any>>> = {
    [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
};

export function any<T extends any[]>(...parsers: T) {
    const any = (state: ParserState<T>) => {
        for (const parser of parsers) {
            const newState = parser.parser(state);

            if (!newState.isError) {
                return newState;
            }
        }
        return state.err(undefined);
    };

    return new Parser(any as ParserFunction<ExtractValue<T>[number]>, "any");
}

export function sequence<T extends any[]>(...parsers: T) {
    const all = (state: ParserState<ExtractValue<T>>): ParserState<ExtractValue<T>> => {
        const matches = [] as any;

        for (const parser of parsers) {
            const newState = parser.parser(state);

            if (newState.isError) {
                return newState;
            }
            matches.push(newState.value);
            state = newState;
        }

        return state.ok(matches);
    };

    return new Parser(all, "all");
}

export function string(str: string) {
    const string = (state: ParserState<string>) => {
        const nextState = state.next(str.length);
        if (nextState.value === str) {
            return nextState;
        }
        return state.err(undefined);
    };

    return new Parser(string as ParserFunction<string>, "string");
}

export function match(regex: RegExp) {
    const sticky = new RegExp(regex, regex.flags + "y");

    const match = (state: ParserState<string>) => {
        if (
            state.offset >= state.src.length
        ) {
            return state.err(undefined);
        }

        sticky.lastIndex = state.offset;
        const match = state.src.match(sticky)?.[0];

        if (match) {
            const newState = state.next(match.length);
            return newState;
        }
        return state.err(undefined);
    };

    return new Parser(match as ParserFunction<string>, "match");
}

export function sepBy<T, S>(
    parser: Parser<T>,
    separator: Parser<S>,
    min: number = 0,
    max: number = Infinity
) {
    return parser.sepBy(separator, min, max);
}

export const whitespace = match(/\s+/).opt();

export function createLanguage<T>(parsers: {
    [K in keyof T]: (lang: { [K in keyof T]: Parser<T[K]> }) => Parser<T[K]>;
}) {
    for (const [key, func] of Object.entries(parsers)) {
        parsers[key] = lazy(() => func(parsers).debug(key));
    }
    return parsers as { [K in keyof T]: Parser<T[K]> };
}
