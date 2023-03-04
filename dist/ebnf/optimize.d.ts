import { Alteration, AST, Expression } from "./grammar";
export declare function topologicalSort(ast: AST): AST;
export declare const findCommonPrefix: (e1: Expression, e2: Expression) => [Expression | null, Expression, Expression];
export declare const comparePrefix: (prefix: Expression, expr: Expression) => boolean;
export declare function rewriteTreeLeftRecursion(name: string, expr: Alteration): void;
export declare function removeDirectLeftRecursion(ast: AST): AST;
export declare function removeIndirectLeftRecursion(ast: AST): void;
export declare function removeAllLeftRecursion(ast: AST): AST;
