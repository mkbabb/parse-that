import { Parser } from "../parse";
import { Nonterminals, AST } from "./grammar";
export declare function generateASTFromEBNF(input: string): readonly [Parser<any[]>] | readonly [Parser<any[]>, AST];
export declare function generateParserFromAST(ast: AST): Nonterminals;
export declare function generateParserFromEBNF(input: string, optimizeGraph?: boolean): readonly [Nonterminals, AST];
