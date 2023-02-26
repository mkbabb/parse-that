import { EBNFExpression, EBNFAST } from "./grammar";

// Helper function to escape a string for use in a regular expression
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
