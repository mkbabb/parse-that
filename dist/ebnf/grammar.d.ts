import { Parser } from "..";
export type EBNFExpression = EBNFLiteral | EBNFNonterminal | EBNFGroup | EBNFRegex | EBNFOptional | EBNFSub | EBNFMany | EBNFMany1 | EBNFSkip | EBNFNext | EBNFConcatenation | EBNFAlternation | EBNFEpsilon;
export interface EBNFLiteral {
    type: "literal";
    value: string;
}
export interface EBNFNonterminal {
    type: "nonterminal";
    value: string;
}
export interface EBNFEpsilon {
    type: "epsilon";
    value: undefined;
}
export interface EBNFGroup {
    type: "group";
    value: EBNFExpression;
}
export interface EBNFRegex {
    type: "regex";
    value: RegExp;
}
export interface EBNFOptional {
    type: "optional";
    value: EBNFExpression;
}
export interface EBNFSub {
    type: "minus";
    value: [EBNFExpression, EBNFExpression];
}
export interface EBNFMany {
    type: "many";
    value: EBNFExpression;
}
export interface EBNFMany1 {
    type: "many1";
    value: EBNFExpression;
}
export interface EBNFSkip {
    type: "skip";
    value: [EBNFExpression, EBNFExpression];
}
export interface EBNFNext {
    type: "next";
    value: [EBNFExpression, EBNFExpression];
}
export interface EBNFConcatenation {
    type: "concatenation";
    value: EBNFExpression[];
}
export interface EBNFAlternation {
    type: "alternation";
    value: EBNFExpression[];
}
export type EBNFProductionRule = {
    name: string;
    expression: EBNFExpression;
};
export type EBNFAST = Map<string, EBNFExpression>;
export type EBNFNonterminals = {
    [key: string]: Parser<any>;
};
export declare class EBNFGrammar {
    identifier(): Parser<string>;
    literal(): Parser<EBNFLiteral>;
    nonterminal(): Parser<EBNFNonterminal>;
    group(): any;
    regex(): Parser<EBNFRegex>;
    optional(): any;
    optionalGroup(): any;
    subtraction(): Parser<EBNFSub>;
    manyGroup(): any;
    many(): any;
    many1(): any;
    next(): any;
    skip(): any;
    concatenation(): any;
    alternation(): any;
    term(): any;
    factor(): any;
    expression(): any;
    productionRule(): Parser<EBNFProductionRule>;
    grammar(): Parser<EBNFProductionRule[]>;
}
