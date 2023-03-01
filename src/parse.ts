/// #if !DEBUG
/// #else
import chalk from "chalk";
/// #endif

type ExtractValue<T extends ReadonlyArray<Parser<any>>> = {
    [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
};

const MAX_LINES = 5;
const MAX_LINE_LENGTH = 80;

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

    from<S>(value: S, offset: number = 0) {
        return new ParserState<S>(this.src, value, this.offset + offset, this.isError);
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
        /// #if DEBUG

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

            if (lineNum === lineIdx + 1) {
                return color(paddedLine);
            } else {
                return paddedLine;
            }
        });

        return resultLines.join("\n");
        /// #else
        return "";
        /// #endif
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

const LAZY_CACHE = new Map<number, Parser<any>>();
let LAZY_ID = 0;
let PARSER_ID = 0;

const MEMO = new Map<number, ParserState<any>>();
const LEFT_RECURSION_COUNTS = new Map<string, number>();

export class Parser<T = string> {
    id: number = PARSER_ID++;
    constructor(public parser: ParserFunction<T>, public context: ParserContext = {}) {}

    parse(val: string) {
        MEMO.clear();
        LAZY_CACHE.clear();
        LEFT_RECURSION_COUNTS.clear();
        return this.parser(new ParserState(val)).value as T;
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

    skip<S>(parser: Parser<T | S>) {
        const skip = (state: ParserState<T>) => {
            const nextState1 = this.parser(state);

            if (!nextState1.isError) {
                const nextState2 = parser.parser(nextState1);
                if (!nextState2.isError) {
                    return nextState2.ok(nextState1.value);
                }
            }
            return state.err(undefined);
        };
        return new Parser(
            skip as ParserFunction<T>,
            createParserContext("skip", parser)
        );
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
            const whitespaceTrim = (state: ParserState<T>) => {
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

    eof() {
        const p = this.skip(eof()) as Parser<T>;
        p.context = createParserContext("eof", this);
        return p;
    }

    static lazy<T>(fn: () => Parser<T>) {
        const id = LAZY_ID++;

        const lazy = (state: ParserState<T>) => {
            if (LAZY_CACHE.has(id)) {
                return LAZY_CACHE.get(id)!.parser(state);
            }
            const parser = fn();
            parser.id = id;
            LAZY_CACHE.set(id, parser);
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
                case "debug":
                    return `debug ${this.context.args[0]}`;
                case "memoize":
                    return `memoize ${this.context.args[0]}`;
                case "mergeMemo":
                    return `mergeMemo ${this.context.args[0]}`;
                case "eof":
                    return `${this.context.args[0]} eof`;
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
    return new Parser(eof, createParserContext("eof")) as Parser<any>;
}

export function lazy<T>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<() => Parser<T>>
) {
    let method = descriptor.value!;
    const id = LAZY_ID++;

    descriptor.value = function () {
        const lazy = (state: ParserState<T>) => {
            if (LAZY_CACHE.has(id)) {
                return LAZY_CACHE.get(id)!.parser(state);
            }
            const parser = method.apply(this, arguments);
            parser.id = id;
            LAZY_CACHE.set(id, parser);
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

export function lookAhead<T>(parser: Parser<T>): Parser<T> {
    const lookAhead = (state: ParserState<T>) => {
        const aheadState = parser.parser(state);

        if (aheadState.isError) {
            return state.err(undefined);
        } else {
            return state.ok(aheadState.value);
        }
    };
    return new Parser(
        lookAhead as ParserFunction<T>,
        createParserContext("lookAhead", parser)
    );
}

export function lookBehind<T>(parser: Parser<T>): Parser<T> {
    const lookBehind = (state: ParserState<T>) => {
        let behindState = parser.parser(state);

        while (behindState.offset > 0 && behindState.isError) {
            behindState.offset -= 1;
            behindState = parser.parser(behindState);
        }

        if (behindState.isError) {
            return state.err(undefined);
        } else {
            return state.ok(behindState.value);
        }
    };
    return new Parser(
        lookBehind as ParserFunction<T>,
        createParserContext("lookBehind", parser)
    );
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
