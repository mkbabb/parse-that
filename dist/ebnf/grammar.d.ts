import { Parser } from "../parse";
export type Expression = Literal | Nonterminal | Group | Regex | Optional | Minus | Many | Many1 | Skip | Next | Concatenation | Alteration | Epsilon | OptionalWhitespace;
interface BaseExpression<T, V = string> {
    type: T;
    value: V;
    comment?: string[];
}
export type Nonterminal = BaseExpression<"nonterminal">;
export type Literal = BaseExpression<"literal">;
export type Regex = BaseExpression<"regex", RegExp>;
export type Epsilon = BaseExpression<"epsilon">;
export type Group = BaseExpression<"group", Expression>;
export type ManyGroup = BaseExpression<"many", Expression>;
export type OptionalGroup = BaseExpression<"optional", Expression>;
export type Optional = BaseExpression<"optional", Expression>;
export type OptionalWhitespace = BaseExpression<"optionalWhitespace", undefined>;
export type Minus = BaseExpression<"minus", [Expression, Expression]>;
export type Many = BaseExpression<"many", Expression>;
export type Many1 = BaseExpression<"many1", Expression>;
export type Skip = BaseExpression<"skip", [Expression, Expression]>;
export type Next = BaseExpression<"next", [Expression, Expression]>;
export type Concatenation = BaseExpression<"concatenation", Expression[]>;
export type Alteration = BaseExpression<"alternation", Expression[]>;
export type ProductionRule = {
    expression: Expression;
    name: string;
    comment: {
        above?: string[];
        below?: string[];
    };
};
export type AST = Map<string, ProductionRule>;
export type Nonterminals = {
    [key: string]: Parser<any>;
};
export declare class EBNFGrammar {
    identifier(): Parser<string>;
    literal(): Parser<Literal>;
    epsilon(): Parser<Epsilon>;
    nonterminal(): Parser<Nonterminal>;
    group(): any;
    regex(): Parser<Regex>;
    optional(): any;
    optionalGroup(): any;
    optionalWhitespace(): any;
    minus(): Parser<Minus>;
    manyGroup(): any;
    many(): any;
    many1(): any;
    next(): any;
    skip(): any;
    concatenation(): any;
    alternation(): any;
    bigComment(): Parser<string>;
    comment(): Parser<string>;
    term(): any;
    factor(): any;
    expression(): any;
    productionRule(): Parser<ProductionRule>;
    grammar(): Parser<ProductionRule[]>;
}
export {};
