import { Parser } from "./parse";
export declare class ParserState<T> {
    src: string;
    value: T;
    offset: number;
    isError: boolean;
    furthest: number;
    constructor(src: string, value?: T, offset?: number, isError?: boolean, furthest?: number);
    ok<S>(value: S, offset?: number): ParserState<S>;
    err<S>(value?: S, offset?: number): ParserState<S>;
    from<S>(value: S, offset?: number): ParserState<S>;
    getColumnNumber(): number;
    getLineNumber(): number;
}
export declare const parserNames: readonly ["string", "regex", "then", "or", "chain", "map", "many", "lazy", "memoize", "mergeMemo", "not", "skip", "next", "trim", "trimWhitespace", "whitespace", "wrap", "sepBy", "any", "all", "opt", "lookAhead", "lookBehind", "eof", "regexConcat", "regexWrap", "debug", "mapState"];
export type ParserContext<T = any> = {
    name?: (typeof parserNames)[number];
    parser?: Parser<T>;
    args?: any[];
};
export declare function createParserContext<T = any>(name: (typeof parserNames)[number], parser: Parser<T>, ...args: any[]): {
    name: "string" | "regex" | "then" | "or" | "chain" | "map" | "many" | "lazy" | "memoize" | "mergeMemo" | "not" | "skip" | "next" | "trim" | "trimWhitespace" | "whitespace" | "wrap" | "sepBy" | "any" | "all" | "opt" | "lookAhead" | "lookBehind" | "eof" | "regexConcat" | "regexWrap" | "debug" | "mapState";
    parser: Parser<T>;
    args: any[];
};
