import type { Parser } from "./parser.js";
import { statePrint } from "./debug.js";

/**
 * Zero-copy span: stores start/end offsets into the source string.
 * Call toString(src) for lazy materialization of the substring.
 */
export interface Span {
    start: number;
    end: number;
}

export function spanToString(span: Span, src: string): string {
    return src.substring(span.start, span.end);
}

export function mergeSpans(a: Span, b: Span): Span {
    return { start: a.start, end: b.end };
}

export class ParserState<T = unknown> {
    /** Parser names/descriptions that were expected at the failure point. */
    expected?: string[];

    constructor(
        public src: string,
        public value: T = undefined as T,
        public offset: number = 0,
        public isError: boolean = false,
        public furthest: number = 0,
    ) {}

    ok<S>(value: S, offset: number = 0): ParserState<S> {
        this.offset += offset;
        this.unsafeSetValue(value);
        this.isError = false;
        return this as unknown as ParserState<S>;
    }

    err<S>(value?: S, offset: number = 0): ParserState<S> {
        this.offset += offset;
        this.unsafeSetValue(value);
        this.isError = true;
        return this as unknown as ParserState<S>;
    }

    from<S>(value: S, offset: number = 0): ParserState<S> {
        this.offset += offset;
        this.unsafeSetValue(value);
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

    /** Type-erased value setter — single choke point for the mutable-state cast pattern. */
    unsafeSetValue(value: unknown): void {
        (this as ParserState<unknown>).value = value as T;
    }

    /** Type-erased parser invocation via .call() — single choke point for combinator type casts. */
    unsafeCall(parser: Parser<unknown>): void {
        parser.call(this as ParserState<unknown>);
    }

    /** Type-erased raw parser invocation via .parser() — for internal combinator plumbing. */
    unsafeCallRaw(parser: Parser<unknown>): void {
        parser.parser(this as ParserState<unknown>);
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

    /** Returns 1-based line and 0-based column for any offset. */
    getLineAndColumn(offset: number = this.offset): { line: number; column: number } {
        const lastNewline = this.src.lastIndexOf("\n", offset - 1);
        const line = lastNewline === -1
            ? 1
            : this.src.slice(0, lastNewline + 1).split("\n").length;
        const column = lastNewline === -1 ? offset : offset - lastNewline - 1;
        return { line, column };
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
    "minus",
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
    "eof",
    "dispatch",
    "debug",
    "mapState",
    "regexSpan",
    "manySpan",
    "sepBySpan",
    "wrapSpan",
    "altSpan",
    "takeUntilAnySpan",
    "recover",
    "peek",
    "lookAhead",
    "negateSpan",
    "peekSpan",
    "notSpan",
    "minusSpan",
    "lookAheadSpan",
] as const;

export type ParserContext = {
    name?: (typeof parserNames)[number];
    parser?: Parser<unknown>;
    args?: unknown[];
};

export function createParserContext(
    name: (typeof parserNames)[number],
    parser: Parser<unknown> | undefined,
    ...args: unknown[]
) {
    return {
        name,
        parser,
        args,
    };
}
