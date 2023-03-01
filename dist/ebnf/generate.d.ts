import { EBNFNonterminals, EBNFAST } from "./grammar";
export declare function generateParserFromEBNF(input: string, optimizeGraph?: boolean): readonly [EBNFNonterminals, EBNFAST];
export declare const addNonterminalsDebugging: (nonterminals: EBNFNonterminals, logger: (...args: any[]) => void) => void;
