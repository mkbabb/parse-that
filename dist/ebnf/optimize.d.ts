import { EBNFAlternation, EBNFAST, EBNFExpression } from "./grammar";
export declare function topologicalSort(ast: EBNFAST): Map<string, EBNFExpression>;
export declare const findCommonPrefix: (e1: EBNFExpression, e2: EBNFExpression) => [EBNFExpression | null, EBNFExpression, EBNFExpression];
export declare const comparePrefix: (prefix: EBNFExpression, expr: EBNFExpression) => boolean;
export declare function removeDirectLeftRecursion(name: string, expr: EBNFAlternation, tailName: string): any[] | readonly [EBNFAlternation, EBNFAlternation];
export declare function rewriteTreeLeftRecursion(name: string, expr: EBNFAlternation): void;
export declare function removeLeftRecursion(ast: EBNFAST): EBNFAST;
