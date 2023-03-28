import { Parser } from "../parse";
import { Expression, Nonterminals, AST, ProductionRule } from "./grammar";
export declare function BBNFToAST(input: string): readonly [Parser<ProductionRule[]>] | readonly [Parser<ProductionRule[]>, AST];
export declare function ASTToParser(ast: AST): Nonterminals;
export declare function traverseAST(ast: Map<string, any>, callback: (node: Expression, parentNode?: Expression) => void): void;
export declare function dedupGroups(ast: AST): void;
export declare function BBNFToParser(input: string, optimizeGraph?: boolean): readonly [Nonterminals, AST];
