import { Parser } from "../parse";
export type Expression = Literal | Nonterminal | Group | Regex | Optional | Minus | Many | Many1 | Skip | Next | Concatenation | Alteration | Epsilon | OptionalWhitespace;
interface BaseExpression<T, V = string> {
    type: T;
    value: V;
    comment?: {
        left: string[];
        right: string[];
    };
    line?: number;
    column?: number;
    offset?: number;
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
        above: string[];
        below: string[];
    };
};
export type AST = Map<string, ProductionRule>;
export type Nonterminals = {
    [key: string]: Parser<any>;
};
type Options = {
    debug: boolean;
    comments: boolean;
};
export declare class EBNFGrammar {
    options: Options;
    constructor(options?: Partial<Options>);
    identifier(): Parser<string>;
    literal(): Parser<Expression>;
    epsilon(): Parser<Epsilon>;
    nonterminal(): Parser<Nonterminal>;
    bigComment(): Parser<string>;
    comment(): Parser<string>;
    trimBigComment(e: Parser<any>): Parser<Expression>;
    group(): any;
    regex(): Parser<Regex>;
    optionalGroup(): any;
    manyGroup(): any;
    lhs(): Parser<string>;
    term(): any;
    factor(): any;
    binaryFactor(): any;
    concatenation(): any;
    alternation(): any;
    rhs(): any;
    productionRule(): Parser<ProductionRule>;
    grammar(): Parser<any[]>;
}
export {};
