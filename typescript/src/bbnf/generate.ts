/* eslint-disable @typescript-eslint/no-explicit-any */
import { Parser, all, any, eof, regex, string } from "../parse/index.js";
import type { Expression, Nonterminals, AST, ProductionRule } from "./types.js";
import { BBNFGrammar } from "./grammar.js";
import { removeAllLeftRecursion } from "./optimize.js";

export function BBNFToAST(input: string) {
    const parser = new BBNFGrammar().grammar().eof();
    const parsed = parser.parse(input);

    if (!parsed) {
        return [parser] as const;
    }

    const ast = (parsed as ProductionRule[]).reduce(
        (acc, productionRule) => {
            return acc.set(productionRule.name.value, productionRule);
        },
        new Map<string, ProductionRule>(),
    ) as AST;

    return [parser, ast] as const;
}

export function ASTToParser(ast: AST) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function generateParser(name: string, expr: Expression): Parser<any> {
        switch (expr.type) {
            case "literal":
                return string(expr.value as string);
            case "nonterminal": {
                const l = Parser.lazy(() => {
                    return nonterminals[expr.value as string];
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                l.context.name = expr.value as any;
                return l;
            }

            case "epsilon":
                return eof().opt();

            case "group":
                return generateParser(name, expr.value as Expression);

            case "regex":
                return regex(expr.value as RegExp);

            case "optionalWhitespace":
                return generateParser(name, expr.value as any).trim();

            case "optional":
                return generateParser(name, expr.value as Expression).opt();
            case "many":
                return generateParser(name, expr.value as Expression).many();
            case "many1":
                return generateParser(name, expr.value as Expression).many(1);
            case "skip":
                return generateParser(
                    name,
                    (expr.value as [Expression, Expression])[0],
                ).skip(
                    generateParser(
                        name,
                        (expr.value as [Expression, Expression])[1],
                    ),
                );
            case "next":
                return generateParser(
                    name,
                    (expr.value as [Expression, Expression])[0],
                ).next(
                    generateParser(
                        name,
                        (expr.value as [Expression, Expression])[1],
                    ),
                );
            case "minus":
                return generateParser(
                    name,
                    (expr.value as [Expression, Expression])[0],
                ).not(
                    generateParser(
                        name,
                        (expr.value as [Expression, Expression])[1],
                    ),
                );
            case "concatenation": {
                const parsers = (expr.value as Expression[]).map((x) =>
                    generateParser(name, x),
                );
                if (parsers.at(-1)?.context?.name === "eof") {
                    parsers.pop();
                }
                return all(...parsers);
            }
            case "alternation": {
                return any(
                    ...(expr.value as Expression[]).map((x) =>
                        generateParser(name, x),
                    ),
                );
            }
        }
    }

    const nonterminals: Nonterminals = {};

    for (const [name, productionRule] of ast.entries()) {
        nonterminals[name] = generateParser(
            name,
            productionRule.expression,
        );
    }
    return nonterminals;
}

export function traverseAST(
    ast: AST,
    callback: (
        node: Expression,
        parentNode?: Expression,
    ) => Expression | undefined,
) {
    const recurse = (node: Expression, parentNode?: Expression) => {
        if (!node?.type) return;

        node = callback(node, parentNode) ?? node;
        parentNode = node;

        if (node?.value instanceof Array) {
            for (let i = node.value.length - 1; i >= 0; i--) {
                recurse(node.value[i] as Expression, parentNode);
            }
        } else if (node?.value && typeof node.value === "object") {
            recurse(node.value as Expression, parentNode);
        }
    };

    for (const [, productionRule] of ast.entries()) {
        recurse(productionRule.expression);
    }
}

export function dedupGroups(ast: AST) {
    traverseAST(ast, (node, parentNode) => {
        const parentType = parentNode?.type;

        if (
            parentType === "group" &&
            parentNode &&
            (node.type === "group" || node.type === "nonterminal")
        ) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (parentNode as any).value = node.value;
            parentNode.range = node.range;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (parentNode as any).type = node.type;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (parentNode as any).comment = {
                left: [
                    ...((parentNode as any).comment?.left ?? []),
                    ...((node as any).comment?.left ?? []),
                ],
                right: [
                    ...((parentNode as any).comment?.right ?? []),
                    ...((node as any).comment?.right ?? []),
                ],
            };
            return node.value as Expression;
        }
        return undefined;
    });
}

export function BBNFToParser(
    input: string,
    optimizeGraph: boolean = false,
) {
    const [, ast] = BBNFToAST(input);

    if (!ast) {
        throw new Error("Failed to parse BBNF grammar");
    }

    dedupGroups(ast);

    const finalAst = optimizeGraph ? removeAllLeftRecursion(ast) : ast;
    const nonterminals = ASTToParser(finalAst);
    return [nonterminals, finalAst] as const;
}
