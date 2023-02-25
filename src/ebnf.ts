import { Parser, string, lazy, all, any, match, createLanguage } from "../src/that";

type EBNFExpression =
    | EBNFLiteral
    | EBNFNonTerminal
    | EBNFGroup
    | EBNFOptional
    | EBNFSub
    | EBNFMany
    | EBNFMany1
    | EBNFSkip
    | EBNFNext
    | EBNFConcatenation
    | EBNFAlternation;

type EBNFProductionRule = {
    name: string;
    expression: EBNFExpression;
};

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
    value: EBNFExpression;
}

interface EBNFOptional {
    type: "optional";
    value: EBNFExpression;
}

interface EBNFSub {
    type: "subtraction";
    value: [EBNFExpression, EBNFExpression];
}

interface EBNFMany {
    type: "many";
    value: EBNFExpression;
}

interface EBNFMany1 {
    type: "many1";
    value: EBNFExpression;
}

interface EBNFSkip {
    type: "skip";
    value: [EBNFExpression, EBNFExpression];
}

interface EBNFNext {
    type: "next";
    value: [EBNFExpression, EBNFExpression];
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
const dot = string(".").trim();
const questionMark = string("?").trim();
const pipe = string("|").trim();

const plus = string("+").trim();
const minus = string("-").trim();
const mul = string("*").trim();
const div = string("/").trim();

const leftShift = string(">>").trim();
const rightShift = string("<<").trim();

const integer = match(/\d+/).trim().map(Number);

const terminator = any(semicolon, dot);

export const EBNFGrammar = createLanguage({
    identifier: () => {
        return match(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
    },

    literal: () =>
        any(
            match(/[^"\s]+/).wrap(string('"'), string('"')),
            match(/[^'\s]+/).wrap(string("'"), string("'"))
        ).map((value) => {
            return {
                type: "literal",
                value,
            };
        }) as Parser<EBNFLiteral>,

    nonterminal: (l) =>
        l.identifier.map((value) => {
            return {
                type: "nonterminal",
                value,
            };
        }) as Parser<EBNFNonTerminal>,

    group: (l) =>
        l.expression
            .trim()
            .wrap(string("("), string(")"))
            .map((value) => {
                return {
                    type: "group",
                    value,
                };
            }) as Parser<EBNFGroup>,

    optional: (l) =>
        l.term
            .trim()
            .skip(questionMark)
            .map((value) => {
                return {
                    type: "optional",
                    value,
                };
            }) as Parser<EBNFOptional>,

    optionalGroup: (l) =>
        l.expression
            .trim()
            .wrap(string("["), string("]"))
            .map((value) => {
                return {
                    type: "optional",
                    value,
                };
            }) as Parser<EBNFOptional>,

    subtraction: (l) =>
        all(l.term.skip(minus), l.term).map(([left, right]) => {
            return {
                type: "subtraction",
                value: [left, right],
            };
        }) as Parser<EBNFSub>,

    manyGroup: (l) =>
        l.expression
            .trim()
            .wrap(string("{"), string("}"))
            .map((value) => {
                return {
                    type: "many",
                    value,
                };
            }) as Parser<EBNFMany>,

    many: (l) =>
        l.term
            .trim()
            .skip(mul)
            .map((value) => {
                return {
                    type: "many",
                    value,
                };
            }) as Parser<EBNFMany>,

    many1: (l) =>
        l.term
            .trim()
            .skip(plus)
            .map((value) => {
                return {
                    type: "many1",
                    value,
                };
            }) as Parser<EBNFMany1>,

    next: (l) =>
        all(l.factor.skip(leftShift), any(l.skip, l.factor)).map(([left, right]) => {
            return {
                type: "next",
                value: [left, right],
            };
        }) as Parser<EBNFNext>,

    skip: (l) =>
        all(any(l.next, l.factor).skip(rightShift), l.factor).map(([left, right]) => {
            return {
                type: "skip",
                value: [left, right],
            };
        }) as Parser<EBNFSkip>,

    concatenation: (l) =>
        any(l.skip, l.next, l.factor)
            .sepBy(comma, 1)
            .map((value) => ({
                type: "concatenation",
                value,
            })) as Parser<EBNFConcatenation>,

    alternation: (l) =>
        any(l.concatenation, l.skip, l.next, l.factor)
            .sepBy(pipe, 1)
            .map((value) => ({
                type: "alternation",
                value,
            })) as Parser<EBNFAlternation>,

    term: (l) =>
        any(
            l.literal,
            l.nonterminal,
            l.group,
            l.optionalGroup,
            l.manyGroup
        ) as Parser<EBNFExpression>,

    factor: (l) =>
        any(
            l.optional,
            l.many,
            l.many1,
            l.subtraction,
            l.term
        ) as Parser<EBNFExpression>,

    expression: (l) =>
        any(
            l.alternation,
            l.concatenation,
            l.skip,
            l.next,
            l.factor
        ) as Parser<EBNFExpression>,

    productionRule: (l) =>
        all(l.identifier.skip(equalSign), l.expression.skip(terminator)).map(
            ([name, expression]) => {
                return { name, expression };
            }
        ) as Parser<EBNFProductionRule>,

    grammar: (l) => l.productionRule.many(),
});

export function generateParserFromEBNF(input: string) {
    const ast = EBNFGrammar.grammar.parse(input);

    const nonterminals: { [key: string]: Parser<any> } = {};

    function generateParser(expr: EBNFExpression): Parser<any> {
        switch (expr.type) {
            case "literal":
                return string(expr.value);
            case "nonterminal":
                return lazy(() => {
                    return nonterminals[expr.value];
                });

            case "group":
                return generateParser(expr.value);
            case "optional":
                return generateParser(expr.value).opt();

            case "many":
                return generateParser(expr.value).many();

            case "many1":
                return generateParser(expr.value).many(1);

            case "skip":
                return generateParser(expr.value[0]).skip(
                    generateParser(expr.value[1])
                );
            case "next":
                return generateParser(expr.value[0]).next(
                    generateParser(expr.value[1])
                );

            case "subtraction":
                return generateParser(expr.value[0]).not(generateParser(expr.value[1]));

            case "concatenation":
                return all(...expr.value.map(generateParser));
            case "alternation":
                return any(...expr.value.map(generateParser));
        }
    }

    for (const { name, expression } of ast) {
        nonterminals[name] = generateParser(expression);
    }

    return [nonterminals, ast] as const;
}
