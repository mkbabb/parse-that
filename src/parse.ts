import chalk from "chalk";

/// #if DEBUG
console.log(chalk.yellow("DEBUG MODE ENABLED"));
/// #endif

type ExtractValue<T extends ReadonlyArray<Parser<any>>> = {
    [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
};

export class ParserState<T> {
    constructor(
        public src: string,
        public value: T = undefined,
        public offset: number = 0,
        public isError: boolean = false
    ) {}

    ok<S>(value: S, offset: number = 0) {
        return new ParserState<S>(this.src, value, this.offset + offset);
    }

    err<S>(value?: S, offset: number = 0) {
        const nextState = this.ok(value, offset);
        nextState.isError = true;
        return nextState;
    }

    getColumnNumber(): number {
        const offset = this.offset;
        const lastNewline = this.src.lastIndexOf("\n", offset);
        const columnNumber = lastNewline === -1 ? offset : offset - (lastNewline + 1);

        return Math.max(0, columnNumber);
    }

    getLineNumber(): number {
        const lines = this.src.slice(0, this.offset).split("\n");
        const lineNumber = lines.length - 1;
        return Math.max(0, lineNumber);
    }

    addCursor(cursor: string = "^", error: boolean = false): string {
        const MAX_LINES = 5;
        const MAX_LINE_LENGTH = 80;

        const color = (error ? chalk.red : chalk.green).bold;

        const lines = this.src.split("\n");
        const lineIdx = Math.min(lines.length - 1, this.getLineNumber());
        const startIdx = Math.max(lineIdx - MAX_LINES, 0);
        const endIdx = Math.min(lineIdx + MAX_LINES + 1, lines.length);

        const lineSummaries = lines.slice(startIdx, endIdx).map((line) => {
            if (line.length <= MAX_LINE_LENGTH) {
                return line;
            } else {
                return line.slice(0, MAX_LINE_LENGTH - 3) + "...";
            }
        });

        const cursorLine = " ".repeat(this.getColumnNumber()) + color(cursor);

        lineSummaries.splice(lineIdx - startIdx + 1, 0, cursorLine);

        const lineNumberWidth = (endIdx + "").length;
        const resultLines = lineSummaries.map((line, idx) => {
            const lineNum = startIdx + idx + 1;
            const paddedLineNum = (lineNum + "").padStart(lineNumberWidth);

            const paddedLine = `${paddedLineNum} | ${line}`;

            // if the line is the current line, highlight it
            if (lineNum === lineIdx + 1) {
                return color(paddedLine);
            } else {
                return paddedLine;
            }
        });

        return resultLines.join("\n");
    }
}

type ParserFunction<T = string> = (val: ParserState<T>) => ParserState<T>;
type ParserContext = {
    name?: string;
    args?: any[];
};

const createParserContext = (name: string, ...args: any[]) => {
    /// #if DEBUG
    return {
        name,
        args,
    };
    /// #else
    return {};
    /// #endif
};

const WHITESPACE = /\s*/y;

const trimStateWhitespace = <T>(state: ParserState<T>) => {
    if (state.offset >= state.src.length) {
        return state;
    }

    WHITESPACE.lastIndex = state.offset;
    const match = state.src.match(WHITESPACE)?.[0] ?? "";

    return state.ok(state.value, match.length);
};

const lazyCache = new Map<number, Parser<any>>();
let lazyId = 0;

export class Parser<T = string> {
    constructor(public parser: ParserFunction<T>, public context: ParserContext = {}) {}

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

        return new Parser(
            then as ParserFunction<[T, S]>,
            createParserContext("then", next)
        );
    }

    or<S>(other: Parser<S | T>) {
        const or = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (!newState.isError) {
                return newState;
            }
            return other.parser(state);
        };

        return new Parser(
            or as ParserFunction<T | S>,
            createParserContext("or", other)
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

        return new Parser(chain, createParserContext("chain", fn));
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

    skip<S>(parser: Parser<S>) {
        const skip = this.then(parser).map(([a]) => {
            return a;
        }) as Parser<T>;
        skip.context = createParserContext("skip", parser);
        return skip;
    }

    next<S>(parser: Parser<S>) {
        const next = this.then(parser).map(([, b]) => {
            return b;
        }) as Parser<S>;
        next.context = createParserContext("next", parser);
        return next;
    }

    opt() {
        const opt = (state: ParserState<T>) => {
            const newState = this.parser(state);
            if (newState.isError) {
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

        return new Parser(parser ? not : negate, createParserContext("not", parser));
    }

    wrap<L, R>(start: Parser<L>, end: Parser<R>) {
        const wrap = start.next(this).skip(end) as Parser<T>;
        wrap.context = createParserContext("wrap", start, end);
        return wrap;
    }

    trim(parser: Parser<T> = whitespace as Parser<T>): Parser<T> {
        if (parser.context?.name === "whitespace") {
            const whitespaceTrim = <T>(state: ParserState<T>) => {
                const newState = trimStateWhitespace(state);
                const tmpState = this.parser(newState);

                if (tmpState.isError) {
                    return state.err(undefined);
                } else {
                    return trimStateWhitespace(tmpState);
                }
            };
            return new Parser(
                whitespaceTrim as ParserFunction<T>,
                createParserContext("trim", parser)
            );
        }
        const trim = this.wrap(parser, parser.opt()) as Parser<T>;
        trim.context = createParserContext("trim", parser);
        return trim;
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
            } else {
                return state.err([]) as ParserState<T[]>;
            }
        };

        return new Parser(
            many as ParserFunction<T[]>,
            createParserContext("many", min, max)
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
            return state.err([]) as ParserState<T[]>;
        };

        return new Parser(
            sepBy as ParserFunction<T[]>,
            createParserContext("sepBy", sep)
        );
    }

    debug(name: string = "", logger: (...s: any[]) => void = console.log) {
        /// #if DEBUG
        name = chalk.italic(name);

        const debug = (state: ParserState<T>) => {
            const newState = this.parser(state);
            const stateBgColor = !newState.isError ? chalk.bgGreen : chalk.bgRed;
            const stateColor = !newState.isError ? chalk.green : chalk.red;

            logger(
                stateBgColor.bold(!newState.isError ? " Ok ✓ " : " Err ｘ "),
                stateColor(`\t${name}\t${newState.offset}\t`),
                chalk.yellow(`${this.toString()}`)
            );
            logger(state.addCursor("^", newState.isError) + "\n");

            return newState;
        };
        return new Parser(debug, createParserContext("debug", name, logger));
        /// #else
        return this;
        /// #endif
    }

    static lazy<T>(fn: () => Parser<T>) {
        const id = lazyId++;

        const lazy = (state: ParserState<T>) => {
            if (lazyCache.has(id)) {
                return lazyCache.get(id)!.parser(state);
            }
            const parser = fn();
            lazyCache.set(id, parser);
            return parser.parser(state);
        };

        return new Parser<T>(lazy, createParserContext("lazy", fn));
    }

    toString(indent: number = 0) {
        /// #if DEBUG
        const name = this.context?.name ?? "unknown";
        const s = (() => {
            switch (name) {
                case "string":
                    return `"${this.context.args[0]}"`;
                case "regex":
                    return `${this.context.args[0]}`;

                case "wrap":
                case "trim":
                    return `wrap(${this.context.args[0]}, ${this.context.args[1]})`;
                case "not":
                    return `!${this.context.args[0]}`;
                case "opt":
                    return `${this.context.args[0]}?`;
                case "next":
                    return ` (next ${this.context.args[0]}) `;
                case "skip":
                    return ` (skip ${this.context.args[0]}) `;
                case "then":
                    return `( then ${this.context.args[0]}) `;
                case "map":
                    const original = this.context.args[0].toString();
                    return `${original}`;
                case "any":
                case "all":
                    const delim = name === "any" ? " | " : " , ";

                    return `(${this.context.args
                        .map((a) => a.toString(indent + 1))
                        .join(delim)})`;

                case "many":
                    return `${this.context.args[0]} ... ${this.context.args[1]}`;

                case "sepBy":
                    return `sepBy ${this.context.args[0]}`;

                case "lazy":
                    return `() => ${this.context.args[0]}`;
            }
        })();
        if (s !== undefined) {
            return s;
        } else {
            return chalk.bold(name);
        }
        /// #else
        return name;
        /// #endif
    }
}

export function eof<T>() {
    const eof = (state: ParserState<T>) => {
        if (state.offset >= state.src.length) {
            return state.ok(undefined);
        } else {
            return state.err();
        }
    };
    return new Parser(eof, createParserContext("eof"));
}

export function lazy<T>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<() => Parser<T>>
) {
    let method = descriptor.value!;
    const id = lazyId++;

    descriptor.value = function () {
        const lazy = (state: ParserState<T>) => {
            if (lazyCache.has(id)) {
                return lazyCache.get(id)!.parser(state);
            }

            const parser = method.apply(this, arguments);
            lazyCache.set(id, parser);
            return parser.parser(state);
        };

        return new Parser<T>(lazy, createParserContext("lazy", method));
    };
}

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

    return new Parser(
        parsers.length === 1 ? parsers[0].parser : any,
        createParserContext("any", ...parsers)
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
            if (newState.value !== undefined) {
                matches.push(newState.value);
            }

            state = newState;
        }
        return state.ok(matches);
    };

    return new Parser(
        parsers.length === 1 ? parsers[0].parser : all,
        createParserContext("all", ...parsers)
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
        return state.err(undefined);
    };

    return new Parser(
        string as ParserFunction<string>,
        createParserContext("string", str)
    );
}

export function regex(r: RegExp) {
    const sticky = new RegExp(r, r.flags + "y");

    const regex = (state: ParserState<string>) => {
        if (state.offset >= state.src.length) {
            return state.err(undefined);
        }

        sticky.lastIndex = state.offset;
        const match = state.src.match(sticky)?.[0];

        if (match) {
            return state.ok(match, match.length);
        } else if (match === "") {
            return state.ok(undefined);
        }

        return state.err(undefined);
    };

    return new Parser(regex as ParserFunction<string>, createParserContext("regex", r));
}

export const whitespace = regex(/\s*/);
whitespace.context.name = "whitespace";
