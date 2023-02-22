type ParserStateTuple<T = string> = [T | undefined, ParserState];
export declare class ParserState {
    val: string;
    offset: number;
    col_number: number;
    line_number: number;
    constructor(val: string, offset?: number, col_number?: number, line_number?: number);
    value(pos?: number): string | undefined;
    next(): ParserStateTuple;
}
type ParserFunction<T = string> = (val: ParserState) => ParserStateTuple<T>;
export declare class Parser<T = string> {
    parser: ParserFunction<T>;
    constructor(parser: ParserFunction<T>);
    parse(val: string): ParserStateTuple<T>;
    apply(val: ParserState): ParserStateTuple<T>;
    then<S = string>(next: Parser<S>): Parser<[T, S] | [T]>;
    or<S>(other: Parser<S>): Parser<T | S>;
    chain<S>(fn: (val: T) => Parser<S>): Parser<S>;
    map<S>(fn: (v: T) => S): any;
    opt(): Parser<any>;
}
export declare function lookAhead<T>(parser: Parser<T>): Parser<T>;
export declare function many<T>(parser: Parser<T>, lower?: number, upper?: number): Parser<T[]>;
export declare function sequence<T extends Parser<any>[]>(...parsers: [...T]): Parser<[...T]>;
export declare function match(regex: RegExp): Parser<string>;
export {};
