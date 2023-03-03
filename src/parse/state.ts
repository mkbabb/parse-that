/// #if DEBUG
import chalk from "chalk";
/// #else
/// #endif
import { Parser } from ".";
import { addCursor } from "./string";

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
        return addCursor.call(this, cursor, error);
        /// #else
        return "";
        /// #endif
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
] as const;

export type ParserContext<T = any> = {
    name?: (typeof parserNames)[number];
    parser?: Parser<T>;
    args?: any[];
};

export function createParserContext<T = any>(
    name: (typeof parserNames)[number],
    parser: Parser<T>,
    ...args: any[]
) {
    /// #if DEBUG
    return {
        name,
        parser,
        args,
    };
    /// #else
    return {
        // name,
    };
    /// #endif
}
