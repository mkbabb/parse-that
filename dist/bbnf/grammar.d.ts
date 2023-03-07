import { Parser } from "../parse";
export type Expression = Literal | Nonterminal | Group | Regex | Optional | Minus | Many | Many1 | Skip | Next | Concatenation | Alteration | Epsilon | OptionalWhitespace;
interface Token<T, V = string> {
    type: T;
    value: V;
    range?: {
        start: number;
        end: number;
    };
}
export type Comment = Token<"comment">;
interface ExpressionToken<T, V = string> extends Token<T, V> {
    comment?: {
        left: string[];
        right: string[];
    };
}
export type Nonterminal = ExpressionToken<"nonterminal">;
export type Literal = ExpressionToken<"literal">;
export type Regex = ExpressionToken<"regex", RegExp>;
export type Epsilon = ExpressionToken<"epsilon">;
export type Group = ExpressionToken<"group", Expression>;
export type ManyGroup = ExpressionToken<"many", Expression>;
export type OptionalGroup = ExpressionToken<"optional", Expression>;
export type Optional = ExpressionToken<"optional", Expression>;
export type OptionalWhitespace = ExpressionToken<"optionalWhitespace", undefined>;
export type Minus = ExpressionToken<"minus", [Expression, Expression]>;
export type Many = ExpressionToken<"many", Expression>;
export type Many1 = ExpressionToken<"many1", Expression>;
export type Skip = ExpressionToken<"skip", [Expression, Expression]>;
export type Next = ExpressionToken<"next", [Expression, Expression]>;
export type Concatenation = ExpressionToken<"concatenation", Expression[]>;
export type Alteration = ExpressionToken<"alternation", Expression[]>;
export type ProductionRule = {
    name: Nonterminal;
    expression: Expression;
    comment: {
        above: Comment[];
        below: Comment[];
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
export declare class BBNFGrammar {
    options: Options;
    constructor(options?: Partial<Options>);
    identifier(): Parser<string>;
    literal(): Parser<Literal>;
    epsilon(): Parser<Epsilon>;
    nonterminal(): Parser<Nonterminal>;
    blockComment(): Parser<any>;
    lineComment(): Parser<any>;
    comment(): Parser<any>;
    trimBigComment(e: Parser<any>): Parser<Expression>;
    group(): any;
    regex(): Parser<Regex>;
    optionalGroup(): any;
    manyGroup(): any;
    lhs(): Parser<any>;
    term(): any;
    factor(): any;
    binaryFactor(): any;
    concatenation(): any;
    alternation(): any;
    rhs(): any;
    productionRule(): Parser<ProductionRule>;
    grammar(): Parser<ProductionRule[]>;
}
export {};
