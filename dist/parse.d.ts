export declare class ParserState<T> {
    src: string;
    value: T;
    offset: number;
    lineNumber: number;
    isError: boolean;
    constructor(src: string, value?: T, offset?: number, lineNumber?: number, isError?: boolean);
    ok<S>(value: S): ParserState<S>;
    err<S>(value?: S): ParserState<S>;
    slice(pos: number): string | undefined;
    next(offset?: number): any;
    getColumnNumber(): number;
    addCursor(cursor?: string): string;
}
type ParserFunction<T = string> = (val: ParserState<T>) => ParserState<T>;
type ParserContext = {
    name?: string;
    args?: any[];
};
export declare class Parser<T = string> {
    parser: ParserFunction<T>;
    context?: ParserContext;
    constructor(parser: ParserFunction<T>, context?: ParserContext);
    parse(val: string): T;
    then<S>(next: Parser<S | T>): Parser<[T, S]>;
    or<S>(other: Parser<S | T>): Parser<T | S>;
    chain<S>(fn: (value: T) => Parser<S | T>, chainError?: boolean): Parser<T | S>;
    map<S>(fn: (value: T) => S, mapError?: boolean): Parser<S>;
    skip<S>(parser: Parser<S>): Parser<T>;
    next<S>(parser: Parser<S>): Parser<S>;
    opt(): Parser<T>;
    not<S>(parser?: Parser<S>): Parser<any>;
    wrap<L, R>(start: Parser<L>, end: Parser<R>): Parser<T>;
    trim(parser?: Parser<T>): Parser<T>;
    many(min?: number, max?: number): Parser<T[]>;
    sepBy<S>(sep: Parser<S>, min?: number, max?: number): Parser<T[]>;
    debug(name?: string, logger?: (...s: any[]) => void): Parser<T>;
    static lazy<T>(fn: () => Parser<T>): Parser<T>;
    toString(indent?: number): string;
}
export declare function eof<T>(): Parser<any>;
export declare function lazy<T>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<() => Parser<T>>): void;
type ExtractValue<T extends ReadonlyArray<Parser<any>>> = {
    [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
};
export declare function any<T extends any[]>(...parsers: T): Parser<ExtractValue<T>[number]>;
export declare function all<T extends any[]>(...parsers: T): Parser<ExtractValue<T>>;
export declare function string(str: string): Parser<string>;
export declare function regex(r: RegExp): Parser<string>;
export declare const whitespace: Parser<string>;
export {};
