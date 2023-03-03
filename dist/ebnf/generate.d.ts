import { Nonterminals, AST } from "./grammar";
export declare function generateASTFromEBNF(input: string): AST;
export declare function generateParserFromAST(ast: AST): Nonterminals;
export declare function generateParserFromEBNF(input: string, optimizeGraph?: boolean): readonly [Nonterminals, AST];
export declare const addNonterminalsDebugging: (nonterminals: Nonterminals, logger: (...args: any[]) => void) => void;
