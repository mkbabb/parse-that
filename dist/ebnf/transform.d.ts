import { AST } from "./grammar";
export declare const EBNFParser: (grammar: string) => import("../parse").Parser<any>;
type TextMateProductionRule = {
    name: string;
    match: string;
};
type TextMateLanguage = {
    name: string;
    scopeName: string;
    fileTypes: string[];
    patterns: TextMateProductionRule[];
};
export declare function transformEBNFASTToTextMateLanguage(ast: AST): TextMateLanguage;
export {};
