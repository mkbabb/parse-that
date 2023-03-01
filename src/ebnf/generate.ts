import { Parser, all, any, eof, regex, string } from "..";
import { EBNFExpression, EBNFNonterminals, EBNFAST, EBNFGrammar } from "./grammar";
import { removeAllLeftRecursion } from "./optimize";
import chalk from "chalk";

function generateParserFromAST(ast: EBNFAST) {
    function generateParser(name: string, expr: EBNFExpression): Parser<any> {
        switch (expr.type) {
            case "literal":
                return string(expr.value);
            case "nonterminal":
                const l = Parser.lazy(() => {
                    return nonterminals[expr.value];
                });
                l.context.name = chalk.blue(expr.value);
                return l;

            case "epsilon":
                // TODO maybe change this to return Parser.of(null), or something
                return eof().opt();

            case "eof":
                return eof();

            case "group":
                return generateParser(name, expr.value);

            case "regex":
                return regex(expr.value);

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
            case "subtraction":
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

    const nonterminals: EBNFNonterminals = {};

    for (const [name, expression] of ast.entries()) {
        nonterminals[name] = generateParser(name, expression);
    }
    return nonterminals;
}

export function generateParserFromEBNF(input: string, optimizeGraph: boolean = false) {
    let ast = new EBNFGrammar()
        .grammar()
        .parse(input)
        .reduce((acc, { name, expression }) => {
            acc.set(name, expression);
            return acc;
        }, new Map<string, EBNFExpression>()) as EBNFAST;

    if (optimizeGraph) {
        ast = removeAllLeftRecursion(ast);
    }
    const nonterminals = generateParserFromAST(ast);
    return [nonterminals, ast] as const;
}

export const addNonterminalsDebugging = (
    nonterminals: EBNFNonterminals,
    logger: (...args: any[]) => void
) => {
    Object.entries(nonterminals).forEach(([k, v]) => {
        nonterminals[k] = v.debug(k, logger);
    });
};
