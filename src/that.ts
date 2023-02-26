import chalk from "chalk";

export class ParserState<T> {
    constructor(
        public src: string,
        public value: T = undefined,
        public offset: number = 0,
        public lineNumber: number = 0,
        public isError: boolean = false
    ) {}

    ok<S>(value: S) {
        return new ParserState<S>(
            this.src,
            value,
            this.offset,

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

        return new ParserState(this.src, ch, offset, lineNumber);
    }

    getColumnNumber(): number {
        const offset = this.offset;
        const lastNewline = this.src.lastIndexOf("\n", offset);
        const columnNumber = lastNewline === -1 ? offset : offset - (lastNewline + 1);

        return Math.max(0, columnNumber);
    }

    addCursor(cursor: string = "^"): string {
        const MAX_LINES = 5;
        const MAX_LINE_LENGTH = 80;

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

        const cursorLine = " ".repeat(this.getColumnNumber()) + cursor;

        lineSummaries.splice(lineIdx - startIdx + 1, 0, cursorLine);

        const lineNumberWidth = (endIdx + "").length;
        const resultLines = lineSummaries.map((line, idx) => {
            const lineNum = startIdx + idx + 1;
            const paddedLineNum = (lineNum + "").padStart(lineNumberWidth);
            return `${paddedLineNum} | ${line}`;
        });

        return resultLines.join("\n");
    }
}

type ParserFunction<T = string> = (val: ParserState<T>) => ParserState<T>;
type ParserContext = {
    name?: string;
    args?: any[];
};

export class Parser<T = string> {
    constructor(public parser: ParserFunction<T>, public context?: ParserContext) {}

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

        return new Parser(then as ParserFunction<[T, S]>, {
            name: "then",
            args: [next],
        });
    }

    or<S>(other: Parser<S | T>) {
        const or = (state: ParserState<T>) => {
            const newState = this.parser(state);

            if (!newState.isError) {
                return newState;
            }
            return other.parser(state);
        };

        return new Parser(or as ParserFunction<T | S>, {
            name: "or",
            args: [other],
        });
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

        return new Parser(chain, {
            name: "chain",
            args: [fn],
        });
    }

    map<S>(fn: (value: T) => S, mapError: boolean = false) {
        const map = (state: ParserState<T | S>) => {
            const newState = this.parser(state as ParserState<T>);

            if (!newState.isError || mapError) {
                return newState.ok(fn(newState.value));
            }
            return newState;
        };

        return new Parser(map as ParserFunction<S>, {
            name: "map",
            args: [this],
        });
    }

    skip<S>(parser: Parser<S>) {
        const skip = this.then(parser).map(([a]) => {
            return a;
        }) as Parser<T>;
        skip.context.name = "skip";
        return skip;
    }

    next<S>(parser: Parser<S>) {
        const next = this.then(parser).map(([, b]) => {
            return b;
        }) as Parser<S>;
        next.context.name = "next";
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
        return new Parser(opt as ParserFunction<T>, {
            name: "opt",
            args: [this],
        });
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

        return new Parser(parser ? not : negate, {
            name: "not",
            args: [parser],
        });
    }

    wrap<L, R>(start: Parser<L>, end: Parser<R>) {
        const wrap = start.next(this).skip(end) as Parser<T>;
        wrap.context.name = "wrap";
        wrap.context.args = [start, end];
        return wrap;
    }

    trim(parser: Parser<T> = whitespace as Parser<T>): Parser<T> {
        const trim = this.wrap(parser, parser.opt()) as Parser<T>;
        trim.context.name = "trim";
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

        return new Parser(many as ParserFunction<T[]>, {
            name: "many",
            args: [min, max],
        });
    }

    sepBy<S>(sep: Parser<S>, min: number = 0, max: number = Infinity) {
        const sepBy = this.then(
            sep
                .then(this)
                .map(([_, value]) => value)
                .many(min, max)
        ).map(([value, values]) => [value, ...values]);

        sepBy.context.name = "sepBy";
        sepBy.context.args = [sep, min, max];
        return sepBy;
    }

    debug(name: string = "", logger: (...s: any[]) => void = console.log) {
        name = chalk.italic(name);

        const debug = (state: ParserState<T>) => {
            const newState = this.parser(state);

            const stateBgColor = !newState.isError ? chalk.bgGreen : chalk.bgRed;

            const stateColor = !newState.isError ? chalk.green : chalk.red;

            logger(
                stateBgColor.bold(!newState.isError ? " Ok " : " Err "),
                stateColor(!newState.isError ? "✓" : "ｘ", `\t${name}\t`),
                `${this.toString()}`
            );

            const s = state.addCursor("^");
            logger(chalk.yellow(s) + "\n");

            return newState;
        };

        return new Parser(debug, {
            name: "debug",
            args: [name],
        });
    }

    static lazy<T>(fn: () => Parser<T>) {
        const lazy = (state: ParserState<T>) => fn().parser(state);
        return new Parser<T>(lazy, {
            name: "lazy",
            args: [fn],
        });
    }

    toString(indent: number = 0) {
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
    return new Parser(eof, {
        name: "eof",
    });
}

export function lazy<T>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<() => Parser<T>>
) {
    let method = descriptor.value!;

    descriptor.value = function () {
        const lazy = (state: ParserState<T>) =>
            method.apply(this, arguments).parser(state);
        return new Parser<T>(lazy, {
            name: "lazy",
            args: [method],
        });
    };
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

    return new Parser(parsers.length === 1 ? parsers[0].parser : any, {
        name: "any",
        args: parsers,
    }) as Parser<ExtractValue<T>[number]>;
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

    return new Parser(parsers.length === 1 ? parsers[0].parser : all, {
        name: "all",
        args: parsers,
    }) as Parser<ExtractValue<T>>;
}

export function string(str: string) {
    const string = (state: ParserState<string>) => {
        if (state.offset >= state.src.length) {
            return state.err(undefined);
        }

        const nextState = state.next(str.length);
        if (nextState.value === str) {
            return nextState;
        }
        return state.err(undefined);
    };

    return new Parser(string as ParserFunction<string>, {
        name: "string",
        args: [str],
    });
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
            const newState = state.next(match.length);
            return newState;
        } else if (match === "") {
            return state.ok(undefined);
        }
        return state.err(undefined);
    };

    return new Parser(regex as ParserFunction<string>, {
        name: "regex",
        args: [r],
    });
}

export const whitespace = regex(/\s*/);
whitespace.context.name = "whitespace";
