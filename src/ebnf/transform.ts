import { Expression, EBNFAST } from ".";

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

const nonterminalsToTrim = [
    "symbol",
    "identifier",
    "terminal",
    "pipe",
    "comma",
    "plus",
    "minus",
    "star",
    "div",
    "question",
    "eof",
    "optional_whitespace",
    "regex",
    "rhs",
    "rule",
    "grammar",
];

export const EBNFParser = (grammar: string) => {
    const [nonterminals, ast] = generateParserFromEBNF(grammar);

    for (const name of nonterminalsToTrim) {
        nonterminals[name] = nonterminals[name].trim();
    }

    nonterminals.symbol = nonterminals.symbol;

    nonterminals.identifier = nonterminals.identifier.map((v) => {
        return v.flat().join("");
    });

    nonterminals.terminal = nonterminals.terminal.map((v) => {
        return v.flat().join("");
    });

    nonterminals.regex = nonterminals.regex.map((v) => {
        const s = v.flat().join("");
        return s;
    });

    nonterminals.rhs = nonterminals.rhs.map((v) => {
        const a = v instanceof Array ? v.flat(Infinity) : v;
        const s = a.join(" ");
        return breakLineOnSeparator(s, "|");
    });

    nonterminals.rule = nonterminals.rule.map((v) => {
        const s = v.flat().join(" ");
        return s;
    });

    return nonterminals.grammar.map((rules) => {
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

function transformEBNFASTToTextMateRegExp(expression: Expression): string {
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
        case "minus":
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
