import { Parser } from ".";
export declare class ParserState<T> {
    src: string;
    value: T;
    offset: number;
    isError: boolean;
    constructor(src: string, value?: T, offset?: number, isError?: boolean);
    ok<S>(value: S, offset?: number): ParserState<S>;
    err<S>(value?: S, offset?: number): ParserState<S>;
    from<S>(value: S, offset?: number): ParserState<S>;
    getColumnNumber(): number;
    getLineNumber(): number;
}
export declare const parserNames: readonly ["string", "regex", "then", "or", "chain", "map", "many", "lazy", "memoize", "mergeMemo", "not", "skip", "next", "trim", "trimWhitespace", "whitespace", "wrap", "sepBy", "any", "all", "opt", "lookAhead", "lookBehind", "eof", "regexConcat", "regexWrap", "debug"];
export type ParserContext<T = any> = {
    name?: (typeof parserNames)[number];
    parser?: Parser<T>;
    args?: any[];
};
export declare function createParserContext<T = any>(name: (typeof parserNames)[number], parser: Parser<T>, ...args: any[]): {
    name: "string" | "trim" | "map" | "regex" | "then" | "or" | "chain" | "many" | "lazy" | "memoize" | "mergeMemo" | "not" | "skip" | "next" | "trimWhitespace" | "whitespace" | "wrap" | "sepBy" | "any" | "all" | "opt" | "lookAhead" | "lookBehind" | "eof" | "regexConcat" | "regexWrap" | "debug";
    parser: Parser<T>;
    args: any[];
};
