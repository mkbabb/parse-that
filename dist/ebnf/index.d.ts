import { Parser } from "../parse";
export type Expression = Literal | Comment | Nonterminal | Group | Regex | Optional | Minus | Many | Many1 | Skip | Next | Concatenation | Alteration | Epsilon | OptionalWhitespace | Coalesce | EOF;
export interface Literal {
    type: "literal";
    value: string;
}
export interface Comment {
    type: "comment";
    value: string;
}
export interface Nonterminal {
    type: "nonterminal";
    value: string;
}
export interface Epsilon {
    type: "epsilon";
    value: undefined;
}
export interface EOF {
    type: "eof";
    value: undefined;
}
export interface OptionalWhitespace {
    type: "optionalWhitespace";
    value: undefined;
}
export interface Coalesce {
    type: "coalesce";
    value: Expression[];
}
export interface Group {
    type: "group";
    value: Expression;
}
export interface Regex {
    type: "regex";
    value: RegExp;
}
export interface Optional {
    type: "optional";
    value: Expression;
}
export interface Minus {
    type: "minus";
    value: [Expression, Expression];
}
export interface Many {
    type: "many";
    value: Expression;
}
export interface Many1 {
    type: "many1";
    value: Expression;
}
export interface Skip {
    type: "skip";
    value: [Expression, Expression];
}
export interface Next {
    type: "next";
    value: [Expression, Expression];
}
export interface Concatenation {
    type: "concatenation";
    value: Expression[];
}
export interface Alteration {
    type: "alternation";
    value: Expression[];
}
export type ProductionRule = {
    type: "productionRule" | "comment";
    expression: Expression;
    name?: string;
};
export type AST = Map<string, Expression>;
export type Nonterminals = {
    [key: string]: Parser<any>;
};
export declare class EBNFGrammar {
    identifier(): Parser<string>;
    literal(): Parser<Literal>;
    epsilon(): Parser<Epsilon>;
    nonterminal(): Parser<Nonterminal>;
    group(): any;
    eof(): Parser<EOF>;
    regex(): Parser<Regex>;
    optional(): any;
    optionalGroup(): any;
    optionalWhitespace(): any;
    coalesce(): any;
    subtraction(): Parser<Minus>;
    manyGroup(): any;
    many(): any;
    many1(): any;
    next(): any;
    skip(): any;
    concatenation(): any;
    alternation(): any;
    bigComment(): Parser<ProductionRule>;
    term(): any;
    factor(): any;
    comment(): Parser<ProductionRule>;
    expression(): any;
    productionRule(): Parser<ProductionRule>;
    grammar(): Parser<ProductionRule[]>;
}
