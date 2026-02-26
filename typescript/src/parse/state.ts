import type { Parser } from "./index.js";
import { statePrint } from "./debug.js";

export class ParserState<T = unknown> {
    constructor(
        public src: string,
        public value: T = undefined as T,
        public offset: number = 0,
        public isError: boolean = false,
        public furthest: number = 0,
    ) {}

    ok<S>(value: S, offset: number = 0): ParserState<S> {
        this.offset += offset;
        (this as any).value = value;
        this.isError = false;
        return this as unknown as ParserState<S>;
    }

    err<S>(value?: S, offset: number = 0): ParserState<S> {
        this.offset += offset;
        (this as any).value = value;
        this.isError = true;
        return this as unknown as ParserState<S>;
    }

    from<S>(value: S, offset: number = 0): ParserState<S> {
        this.offset += offset;
        (this as any).value = value;
        return this as unknown as ParserState<S>;
    }

    save(): { offset: number; value: T } {
        return { offset: this.offset, value: this.value };
    }

    restore(saved: { offset: number; value: any }): this {
        this.offset = saved.offset;
        this.value = saved.value;
        this.isError = false;
        return this;
    }

    clone(): ParserState<T> {
        return new ParserState<T>(
            this.src,
            this.value,
            this.offset,
            this.isError,
            this.furthest,
        );
    }

    getColumnNumber(): number {
        const offset = this.offset;
        const lastNewline = this.src.lastIndexOf("\n", offset);
        const columnNumber =
            lastNewline === -1 ? offset : offset - (lastNewline + 1);
        return Math.max(0, columnNumber);
    }

    getLineNumber(): number {
        const newlineIndex = this.src.lastIndexOf("\n", this.offset);
        return newlineIndex >= 0
            ? this.src.slice(0, newlineIndex).split("\n").length
            : 0;
    }

    toString() {
        return statePrint(this as ParserState<unknown>);
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
    "dispatch",
    "debug",
    "mapState",
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParserContext = {
    name?: (typeof parserNames)[number];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser?: Parser<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args?: any[];
};

export function createParserContext(
    name: (typeof parserNames)[number],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser: Parser<any> | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
) {
    return {
        name,
        parser,
        args,
    };
}
