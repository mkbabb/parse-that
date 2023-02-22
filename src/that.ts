export type ParserStateTuple<T = string> = [T | undefined, ParserState];

export class ParserState {
    constructor(
        public val: string,
        public offset: number = 0,
        public colNumber: number = 0,
        public lineNumber: number = 0,
        public isError: boolean = false
    ) {}

    value(pos: number): string | undefined {
        return this.val.slice(this.offset, this.offset + pos + 1);
    }

    next(offset: number = 1): ParserStateTuple {
        offset = offset < 0 ? this.val.length - offset : offset;
        const ch = this.value(offset);

        if (ch !== undefined) {
            offset += this.offset;

            const lineNumber = ch.split("\n").length - 1 + this.lineNumber;
            const colNumber = ch.length - ch.lastIndexOf("\n") - 1;

            const val = new ParserState(this.val, offset, colNumber, lineNumber);
            return [ch, val];
        } else {
            return [ch, this];
        }
    }

    addCursor(cursor: string = "^"): string {
        const MAX_LINES = 5;
        const MAX_LINE_LENGTH = 50;

        // Get lines before and after current line
        const lines = this.val.split("\n");
        const lineIdx = Math.min(lines.length - 1, this.lineNumber);
        const startIdx = Math.max(lineIdx - MAX_LINES, 0);
        const endIdx = Math.min(lineIdx + MAX_LINES + 1, lines.length);

        // Generate summary of lines with ellipses
        const lineSummaries = lines.slice(startIdx, endIdx).map((line) => {
            if (line.length <= MAX_LINE_LENGTH) {
                return line;
            } else {
                return line.slice(0, MAX_LINE_LENGTH - 3) + "...";
            }
        });

        // Add cursor to current line
        const cursorLine = " ".repeat(this.colNumber) + cursor;

        // Insert cursor line into summaries
        lineSummaries.splice(lineIdx - startIdx + 1, 0, cursorLine);

        return lineSummaries.join("\n");
    }
}

type ParserFunction<T = string> = (val: ParserState) => ParserStateTuple<T>;
const optionalParsers = ["opt", "lookAhead", "many", "map", "chain"] as const;

export class Parser<T = string> {
    constructor(public parser: ParserFunction<T>, public name?: string) {}

    parse(val: string) {
        return this.apply(new ParserState(val))[0];
    }

    apply(val: ParserState): ParserStateTuple<T> {
        let [match, rest] = this.parser(val);

        if (match === undefined && !optionalParsers.includes(this.name as any)) {
            rest = new ParserState(
                val.val,
                val.offset,
                val.colNumber,
                val.lineNumber,
                true
            );
        }
        return [match, rest];
    }

    then<S = string>(next: Parser<S>) {
        const then = (val: ParserState) => {
            const [match1, rest1] = this.apply(val);

            if (!rest1.isError) {
                const [match2, rest2] = next.apply(rest1);
                if (!rest2.isError) {
                    return [[match1, match2], rest2] as ParserStateTuple<[T, S]>;
                }
            }
            return [[match1], val] as ParserStateTuple<[T]>;
        };

        return new Parser(then as ParserFunction<[T, S] | [T]>, "then");
    }

    or<S>(other: Parser<S>) {
        const or = (val: ParserState) => {
            const [match, rest] = this.apply(val);

            if (rest.isError) {
                return other.apply(val);
            }
            return [match, rest];
        };

        return new Parser(or as ParserFunction<T | S>, "or");
    }

    chain<S>(fn: (val: T) => Parser<S>) {
        const chain = (val: ParserState) => {
            const [match, rest] = this.apply(val);

            if (rest.isError) {
                return [match, rest];
            } else if (match) {
                return fn(match).apply(rest);
            } else {
                return [match, val];
            }
        };

        return new Parser(chain as ParserFunction<S>, "chain");
    }

    map<S>(fn: (val: T) => S) {
        const chain: Parser<S> = this.chain((val) => new Parser((_) => [fn(val), _]));
        chain.name = "map";
        return chain;
    }

    skip() {
        const skip = (val: ParserState) => {
            const [match, rest] = this.apply(val);

            if (rest.isError) {
                return [match, rest];
            } else {
                return [undefined, rest];
            }
        };
        return new Parser(skip as ParserFunction<undefined>, "skip");
    }

    opt(): Parser<T | undefined> {
        const opt = (val: ParserState) => {
            const [match, rest] = this.apply(val);

            if (rest.isError) {
                return [undefined, val];
            } else {
                return [match, rest];
            }
        };
        return new Parser(opt as ParserFunction<T | undefined>, "opt");
    }

    memoize() {
        const cache = new Map<number, ParserStateTuple<T>>();
        const memo = (val: ParserState) => {
            if (cache.has(val.offset)) {
                return cache.get(val.offset)!;
            } else {
                const [match, rest] = this.apply(val);
                cache.set(val.offset, [match, rest]);
                return [match, rest];
            }
        };
        return new Parser(memo as ParserFunction<T>, "memoize");
    }
}

export function lookAhead<T>(parser: Parser<T>) {
    function inner(val: ParserState): ParserStateTuple<T> {
        const [, rest] = val.next();
        const [match] = parser.apply(rest);
        return [match, val];
    }

    return new Parser(inner, "lookAhead");
}

export function many<T>(
    parser: Parser<T>,
    lower: number = 0,
    upper: number = Infinity
) {
    const inner = (val: ParserState): ParserStateTuple<T[]> => {
        const matches: T[] = [];
        let rest = val;

        for (let i = 0; i < upper; i += 1) {
            const [match, newRest] = parser.apply(rest);

            if (newRest.isError) {
                break;
            } else if (match) {
                matches.push(match);
            }
            rest = newRest;
        }

        if (matches.length >= lower) {
            return [matches, rest];
        } else {
            rest.isError = true;
            return [[], rest];
        }
    };

    return new Parser(inner, "many");
}

type ExtractValue<T extends ReadonlyArray<Parser<any>>> = {
    [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
};

export function sequence<T extends any[]>(...parsers: T) {
    const inner = (val: ParserState): ParserStateTuple<ExtractValue<T>> => {
        const matches = [] as any;
        let rest = val;

        for (const parser of parsers) {
            const [match, newRest] = parser.apply(rest);

            if (newRest.isError) {
                return [undefined, rest];
            }
            matches.push(match);
            rest = newRest;
        }

        return [matches, rest];
    };

    return new Parser(inner, "sequence");
}

export function any<T extends any[]>(...parsers: T) {
    const inner = (val: ParserState): ParserStateTuple => {
        for (const parser of parsers) {
            const [match, rest] = parser.apply(val);
            if (!rest.isError) {
                return [match, rest];
            }
        }
        return [undefined, val];
    };
    return new Parser(inner, "any");
}

export function match(regex: RegExp) {
    const sticky = new RegExp(regex, regex.flags + "y");

    const inner = (val: ParserState): ParserStateTuple => {
        sticky.lastIndex = val.offset;
        const match = val.val.match(sticky);

        if (match) {
            const [, rest] = val.next(match[0].length);
            return [match[0], rest];
        } else {
            return [undefined, val];
        }
    };

    return new Parser(inner, "match");
}
