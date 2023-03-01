import { Alteration, EBNFAST, Expression } from "./grammar";
export declare function topologicalSort(ast: EBNFAST): Map<string, Expression>;
export declare const findCommonPrefix: (e1: Expression, e2: Expression) => [Expression | null, Expression, Expression];
export declare const comparePrefix: (prefix: Expression, expr: Expression) => boolean;
export declare function rewriteTreeLeftRecursion(name: string, expr: Alteration): void;
export declare function removeDirectLeftRecursion(ast: EBNFAST): EBNFAST;
export declare function removeIndirectLeftRecursion(ast: EBNFAST): void;
export declare function removeAllLeftRecursion(ast: EBNFAST): Map<string, Expression>;
