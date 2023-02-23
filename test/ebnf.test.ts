import {
    Parser,
    whitespace,
    many,
    string,
    lazy,
    sequence,
    any,
    match,
} from "../src/that";

import { test, expect, describe, it } from "vitest";

type EBNFExpression =
    | EBNFLiteral
    | EBNFNonTerminal
    | EBNFGroup
    | EBNFOptional
    | EBNFRepetition
    | EBNFConcatenation
    | EBNFAlternation;

interface EBNFLiteral {
    type: "literal";
    value: string;
}

interface EBNFNonTerminal {
    type: "nonterminal";
    value: string;
}

interface EBNFGroup {
    type: "group";
    value: EBNFExpression[];
}

interface EBNFOptional {
    type: "optional";
    value: EBNFExpression;
}

interface EBNFRepetition {
    type: "repetition";
    value: EBNFExpression;
}

interface EBNFConcatenation {
    type: "concatenation";
    value: EBNFExpression[];
}

interface EBNFAlternation {
    type: "alternation";
    value: EBNFExpression[];
}

const comma = string(",").trim();
const equalSign = string("=").trim();
const semicolon = string(";").trim();

const ebnfIdentifier = match(/[_a-zA-Z][_a-zA-Z0-9]+/)
    .trim()
    .map((value) => {
        return value;
    });

const ebnfLiteral = match(/"[^"]+"/).map((value) => ({
    type: "literal",
    value: value.slice(1, -1),
}));

const ebnfNonTerminal = ebnfIdentifier.map((value) => {
    return {
        type: "nonterminal",
        value,
    };
});

const ebnfGroup = lazy(() => ebnfExpression)
    .sepBy(comma)
    .trim()
    .wrap(string("("), string(")"))
    .map((value) => ({
        type: "group",
        value,
    }));

const ebnfOptional = lazy(() => ebnfExpression)
    .trim()
    .wrap(string("["), string("]"))
    .map((value) => ({
        type: "optional",
        value,
    }));

const ebnfRepetition = lazy(() => ebnfExpression)
    .trim()
    .wrap(string("{"), string("}"))
    .map((value) => ({
        type: "repetition",
        value,
    }));

const ebnfConcatenation = lazy(() => ebnfTerm)
    .sepBy(whitespace)
    .map((value) => ({
        type: "concatenation",
        value,
    }));

const ebnfAlternation = lazy(() => ebnfConcatenation)
    .sepBy(string("|").trim())
    .map((value) => {
        return {
            type: "alternation",
            value,
        };
    });

const ebnfTerm = any(
    ebnfLiteral,
    ebnfNonTerminal,
    ebnfGroup,
    ebnfOptional,
    ebnfRepetition
);

const ebnfExpression = ebnfAlternation;

const ebnfProductionRule = sequence(
    ebnfIdentifier,
    equalSign,
    ebnfExpression,
    semicolon
).map(([name, , expression]) => {
    return { name, expression };
});

const ebnfGrammar = many(ebnfProductionRule);

export function parseEBNF(input: string) {
    const ast = ebnfGrammar.parse(input);

    const nonterminals: { [name: string]: Parser<any> } = {};

    function generateParser(expr: EBNFExpression): Parser<any> {
        switch (expr.type) {
            case "literal":
                return string(expr.value);
            case "nonterminal":
                return lazy(() => {
                    return nonterminals[expr.value];
                });
            case "group":
                return generateParser(expr.value[0]).map((v) => {
                    return v[0];
                });
            case "optional":
                return generateParser(expr.value).opt();
            case "repetition":
                return many(generateParser(expr.value));
            case "concatenation":
                return sequence(...expr.value.map(generateParser));
            case "alternation":
                return any(...expr.value.map(generateParser));
        }
    }

    for (const { name, expression } of ast) {
        nonterminals[name] = generateParser(expression);
    }

    return nonterminals;
}

describe("EBNF Parser", () => {
    it("Parse a simple math language", () => {
        const evaluateMathOperator = (operator: string, a: number, b: number) => {
            switch (operator) {
                case "+":
                    return a + b;
                case "-":
                    return a - b;
                case "*":
                    return a * b;
                case "/":
                    return a / b;
            }
        };

        const reduceMathExpression = ([num, rest]) => {
            return rest.reduce((acc, [operator, val]) => {
                return evaluateMathOperator(operator, acc, val);
            }, num);
        };

        const input = `
        expr = term { ("+" | "-") term };
        term = factor { ("*" | "/") factor };
        factor = number | "(" expr ")";
        number = digit { digit };
        digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
`;

        const nonterminals = parseEBNF(input);

        nonterminals.expr = nonterminals.expr.map(reduceMathExpression);
        nonterminals.term = nonterminals.term.map(reduceMathExpression);
        nonterminals.factor = nonterminals.factor.map((v) => {
            return v[0];
        });
        nonterminals.number = nonterminals.number.trim().map(([first, rest]) => {
            return parseInt(first + rest.join(""));
        });
        nonterminals.digit = nonterminals.digit.map((v) => {
            return v[0];
        });

        const parser = nonterminals.expr;

        const expr = "12 + 2 * 3 / 4 - 5";

        const num = parser.parse(expr);

        expect(num).toBe(eval(expr));
    });
});
