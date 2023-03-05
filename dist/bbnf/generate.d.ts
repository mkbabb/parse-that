import { Parser } from "../parse";
import { Nonterminals, AST } from "./grammar";
export declare function BBNFToAST(input: string): readonly [Parser<any[]>] | readonly [Parser<any[]>, AST];
export declare function ASTToParser(ast: AST): Nonterminals;
export declare function BBNFToParser(input: string, optimizeGraph?: boolean): readonly [Nonterminals, AST];
