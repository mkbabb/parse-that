import { Parser, all, any, eof, regex, string } from "../parse";
import { Expression, Nonterminals, AST, EBNFGrammar } from ".";
import { removeAllLeftRecursion } from "./optimize";
import chalk from "chalk";

function generateParserFromAST(ast: AST) {
    function generateParser(name: string, expr: Expression): Parser<any> {
        switch (expr.type) {
            case "literal":
                return string(expr.value);
            case "nonterminal":
                const l = Parser.lazy(() => {
                    return nonterminals[expr.value];
                });
                l.context.name = chalk.bold.blue(expr.value) as any;
                return l;

            case "comment":
            case "epsilon":
                return eof().opt();

            case "eof":
                return eof();

            case "group":
                return generateParser(name, expr.value);

            case "regex":
                return regex(expr.value);

            case "optionalWhitespace":
                return generateParser(name, expr.value).trim();

            case "coalesce":
                return any(...expr.value.map((x) => generateParser(name, x)));

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

    for (const [name, expression] of ast.entries()) {
        nonterminals[name] = generateParser(name, expression);
    }
    return nonterminals;
}

export function generateParserFromEBNF(input: string, optimizeGraph: boolean = false) {
    const comments = new Map<number, any>();
    const parser = new EBNFGrammar().grammar().trim();
    const parsed = parser.parse(input);

    if (!parsed) {
        throw new Error("Failed to parse EBNF grammar");
    }

    let ast = parsed.reduce((acc, { name, expression, type }, ix) => {
        if (type === "comment") {
            comments.set(ix, expression.value);
        }
        acc.set(name, expression);
        return acc;
    }, new Map<string, Expression>()) as AST;

    if (optimizeGraph) {
        ast = removeAllLeftRecursion(ast);
    }
    const nonterminals = generateParserFromAST(ast);
    return [nonterminals, ast] as const;
}

export const addNonterminalsDebugging = (
    nonterminals: Nonterminals,
    logger: (...args: any[]) => void
) => {
    Object.entries(nonterminals).forEach(([k, v]) => {
        nonterminals[k] = v.debug(k, logger);
    });
};
