import { EBNFExpression, EBNFAST } from "./grammar";

import fs from "fs";
import { generateParserFromEBNF } from "./generate";

function breakLineOnSeparator(input: string, separator: string): string {
    const lines = input.split(separator);

    if (lines.length === 1) {
        return input;
    }

    input = lines
        .map((line, i) => {
            if (i === lines.length - 1) {
                return separator + line;
            } else if (i === 0) {
                return line;
            }

            const groups = line.split(",");

            if (groups.length > 1) {
                return `\n\t${separator} ` + line;
            } else {
                return separator + line;
            }
        })
        .join("");

    const maxLineLength = 66;

    if (input.length > maxLineLength) {
        let di = maxLineLength;

        for (let i = 0; i < input.length; i += di) {
            const nearestSepIx = i === 0 ? maxLineLength : i + di;
            const nearestSep = input.indexOf(separator, nearestSepIx);

            if (nearestSep === -1) {
                break;
            }
            input =
                input.slice(0, nearestSep) +
                `\n\t${separator}` +
                input.slice(nearestSep + 1);
        }
    }

    return input;
}

export const EBNFParser = (grammar: string) => {
    const [nonterminals, ast] = generateParserFromEBNF(grammar);

    nonterminals.symbol = nonterminals.symbol.trim();

    nonterminals.identifier = nonterminals.identifier.trim().map((v) => {
        return v.flat().join("");
    });

    nonterminals.terminal = nonterminals.terminal.trim().map((v) => {
        return v.flat().join("");
    });

    nonterminals.pipe = nonterminals.pipe.trim();
    nonterminals.comma = nonterminals.comma.trim();
    nonterminals.plus = nonterminals.plus.trim();
    nonterminals.minus = nonterminals.minus.trim();
    nonterminals.star = nonterminals.star.trim();
    nonterminals.div = nonterminals.div.trim();
    nonterminals.question = nonterminals.question.trim();
    nonterminals.eof = nonterminals.eof.trim();

    nonterminals.regex = nonterminals.regex.trim().map((v) => {
        const s = v.flat().join("");
        return s;
    });

    nonterminals.rhs = nonterminals.rhs.trim().map((v) => {
        const a = v instanceof Array ? v.flat(Infinity) : v;
        const s = a.join(" ");
        return breakLineOnSeparator(s, "|");
    });

    nonterminals.rule = nonterminals.rule.trim().map((v) => {
        const s = v.flat().join(" ");
        return s;
    });

    return nonterminals.grammar.trim().map((rules) => {
        let lastIx = 0;

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];

            if (rule.length > 80) {
                rules[i] = rule + "\n";
                if (i > 0 && lastIx !== i - 1) {
                    rules[i - 1] = rules[i - 1] + "\n";
                }
                lastIx = i;
            } else if (i - lastIx > 2) {
                rules[i] = rule + "\n";
                lastIx = i;
            }
        }
        return rules.join("\n");
    });

    // debugging(nonterminals);
};

export const formatEBNFGrammar = (
    grammar: string,
    eebnfGrammarPath: string,
    outfilePath?: string
) => {
    const eebnfGrammar = fs.readFileSync(eebnfGrammarPath, "utf8");
    const ebnfParser = EBNFParser(eebnfGrammar);
    const formatted = ebnfParser.parse(grammar);

    if (outfilePath !== undefined) {
        fs.writeFileSync(outfilePath, formatted);
    }
    return formatted;
};

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

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

function transformEBNFASTToTextMateRegExp(expression: EBNFExpression): string {
    switch (expression.type) {
        case "literal":
            return escapeRegExp(expression.value);
        case "nonterminal":
            return `($${expression.value})`;
        case "epsilon":
            return "";
        case "group":
            return `(${transformEBNFASTToTextMateRegExp(expression.value)})`;
        case "regex":
            return expression.value.source;
        case "optional":
            return `(${transformEBNFASTToTextMateRegExp(expression.value)})?`;
        case "subtraction":
            return `${transformEBNFASTToTextMateRegExp(
                expression.value[0]
            )}(?!${transformEBNFASTToTextMateRegExp(expression.value[1])})`;
        case "many":
            return `(${transformEBNFASTToTextMateRegExp(expression.value)})*`;
        case "many1":
            return `(${transformEBNFASTToTextMateRegExp(expression.value)})+`;
        case "skip":
            return `${transformEBNFASTToTextMateRegExp(
                expression.value[0]
            )}(?:${transformEBNFASTToTextMateRegExp(expression.value[1])})?`;
        case "next":
            return `${transformEBNFASTToTextMateRegExp(
                expression.value[0]
            )}(?=${transformEBNFASTToTextMateRegExp(expression.value[1])})`;
        case "concatenation":
            return expression.value.map(transformEBNFASTToTextMateRegExp).join("");
        case "alternation":
            return expression.value
                .map((expr) => `(${transformEBNFASTToTextMateRegExp(expr)})`)
                .join("|");
    }
}

export function transformEBNFASTToTextMateLanguage(ast: EBNFAST): TextMateLanguage {
    const rules: TextMateProductionRule[] = [];

    // Traverse the EBNF AST and transform each production rule into a TextMate production rule
    for (const [name, expr] of ast) {
        rules.push({
            name,
            match: transformEBNFASTToTextMateRegExp(expr),
        });
    }
    // Create and return the TextMate language object
    return {
        name: "EEBNF",
        scopeName: "source.eebnf",
        fileTypes: ["eebnf"],
        patterns: rules,
    };
}
