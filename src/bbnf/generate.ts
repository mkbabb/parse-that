import { Parser, all, any, eof, regex, string } from "../parse";
import { Expression, Nonterminals, AST, BBNFGrammar, ProductionRule } from "./grammar";
import { removeAllLeftRecursion } from "./optimize";

export function BBNFToAST(input: string) {
    const parser = new BBNFGrammar().grammar().eof();
    const parsed = parser.parse(input);

    if (!parsed) {
        return [parser] as const;
    }

    const ast = parsed.reduce((acc, productionRule, ix) => {
        return acc.set(productionRule.name, productionRule);
    }, new Map<string, ProductionRule>()) as AST;

    return [parser, ast] as const;
}

export function ASTToParser(ast: AST) {
    function generateParser(name: string, expr: Expression): Parser<any> {
        switch (expr.type) {
            case "literal":
                return string(expr.value);
            case "nonterminal":
                const l = Parser.lazy(() => {
                    return nonterminals[expr.value];
                });
                l.context.name = expr.value as any;
                return l;

            case "epsilon":
                return eof().opt();

            case "group":
                return generateParser(name, expr.value);

            case "regex":
                return regex(expr.value);

            case "optionalWhitespace":
                return generateParser(name, expr.value).trim();

            case "optional":
                return generateParser(name, expr.value).opt();
            case "many":
                return generateParser(name, expr.value).many();
            case "many1":
                return generateParser(name, expr.value).many(1);
            case "skip":
                return generateParser(name, expr.value[0]).skip(
                    generateParser(name, expr.value[1])
                );
            case "next":
                return generateParser(name, expr.value[0]).next(
                    generateParser(name, expr.value[1])
                );
            case "minus":
                return generateParser(name, expr.value[0]).not(
                    generateParser(name, expr.value[1])
                );
            case "concatenation": {
                const parsers = expr.value.map((x) => generateParser(name, x));
                if (parsers.at(-1)?.context?.name === "eof") {
                    parsers.pop();
                }
                return all(...parsers);
            }
            case "alternation": {
                return any(...expr.value.map((x) => generateParser(name, x)));
            }
        }
    }

    const nonterminals: Nonterminals = {};

    for (const [name, productionRule] of ast.entries()) {
        nonterminals[name] = generateParser(name, productionRule.expression);
    }
    return nonterminals;
}

export function traverseAST(
    ast: Map<string, any>,
    callback: (node: Expression, parentNode?: Expression) => void
) {
    const stack: Expression[] = [...ast.values()].map((x) => x.expression).reverse();
    let parentNode;

    while (stack.length > 0) {
        const node = stack.pop();
        if (!node?.type) continue;

        callback(node, parentNode);

        parentNode = node;

        if (node.value instanceof Array) {
            for (let i = node.value.length - 1; i >= 0; i--) {
                stack.push(node.value[i]);
            }
        } else {
            stack.push(node.value as any);
        }
    }
}

export function dedupGroups(ast: AST) {
    traverseAST(ast, (node, parentNode) => {
        const parentType = parentNode?.type;

        if (
            node.type === "group" &&
            (parentType === "group" || parentType === "nonterminal")
        ) {
            const innerValue = node.value;
            node.value = innerValue.value;
            node.type = innerValue.type;
        }
    });
}

export function BBNFToParser(input: string, optimizeGraph: boolean = false) {
    let [parser, ast] = BBNFToAST(input);

    dedupGroups(ast);

    if (optimizeGraph) {
        ast = removeAllLeftRecursion(ast);
    }
    const nonterminals = ASTToParser(ast);
    return [nonterminals, ast] as const;
}
