import { Parser } from ".";

export class ParserState<T> {
    constructor(
        public src: string,
        public value: T = undefined,
        public offset: number = 0,
        public isError: boolean = false,
        public furthest: number = 0
    ) {}

    ok<S>(value: S, offset: number = 0) {
        offset += this.offset;
        return new ParserState<S>(this.src, value, offset, false);
    }

    err<S>(value?: S, offset: number = 0) {
        const nextState = this.ok(value, offset);
        nextState.isError = true;
        return nextState;
    }

    from<S>(value: S, offset: number = 0) {
        offset += this.offset;
        return new ParserState<S>(this.src, value, offset, this.isError);
    }

    join<S>(...states: ParserState<S>[]) {
        this.furthest = Math.max(this.furthest, ...states.map((s) => s?.furthest ?? 0));
        return this;
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
}

export const parserNames = [
    "string",
    "regex",
    "then",
    "or",
    "chain",
    "map",
    "many",
    "lazy",
    "memoize",
    "mergeMemo",
    "not",
    "skip",
    "next",
    "trim",
    "trimWhitespace",
    "whitespace",
    "wrap",
    "sepBy",
    "any",
    "all",
    "opt",
    "lookAhead",
    "lookBehind",
    "eof",
    "regexConcat",
    "regexWrap",
    "debug",
    "mapState",
] as const;

export type ParserContext<T = any> = {
    name?: (typeof parserNames)[number];
    parser?: Parser<T>;
    args?: any[];
};

// TODO: maybe reintroduce debug check.
export function createParserContext<T = any>(
    name: (typeof parserNames)[number],
    parser: Parser<T>,
    ...args: any[]
) {
    return {
        name,
        parser,
        args,
    };
}
