import {
    Parser,
    whitespace,
    many,
    string,
    lazy,
    sequence,
    any,
    match,
    createLanguage,
} from "../src/that";

import { test, expect, describe, it } from "vitest";
import {
    generateMathExpression,
    insertRandomWhitespace,
    reduceMathExpression,
} from "./utils";

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
const equalSign = string("=")
    .trim()
    .map((v) => {
        return v;
    });
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

const EBNFGrammar = createLanguage({
    identifier: () => {
        return match(/[_a-zA-Z][_a-zA-Z0-9]*/)
            .trim()
            .map((v) => {
                return v;
            });
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
        sequence(l.term.skip(minus), l.term).map(([left, right]) => {
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
        sequence(l.factor.skip(leftShift), l.subExpression).map(([left, right]) => {
            return {
                type: "next",
                value: [left, right],
            };
        }) as Parser<EBNFNext>,

    skip: (l) =>
        sequence(l.subExpression2.skip(rightShift), l.factor).map(([left, right]) => {
            return {
                type: "skip",
                value: [left, right],
            };
        }) as Parser<EBNFSkip>,

    concatenation: (l) =>
        l.factor.sepBy(comma, 1).map((value) => ({
            type: "concatenation",
            value,
        })) as Parser<EBNFConcatenation>,

    alternation: (l) =>
        l.subExpression.sepBy(pipe, 1).map((value) => ({
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

    subExpression2: (l) => any(l.concatenation, l.next, l.factor),

    subExpression: (l) => any(l.skip, l.subExpression2),

    expression: (l) => any(l.alternation, l.subExpression) as Parser<EBNFExpression>,

    productionRule: (l) =>
        sequence(l.identifier.skip(equalSign), l.expression.skip(terminator)).map(
            ([name, expression]) => {
                return { name, expression };
            }
        ) as Parser<EBNFProductionRule>,

    grammar: (l) => many(l.productionRule),
});

export function generateParserFromEBNF(input: string) {
    const ast = EBNFGrammar.grammar.parse(input);

    const nonterminals: { [key: string]: Parser<any> } = {};

    function generateParser(expr: EBNFExpression): Parser<any> {
        switch (expr.type) {
            case "literal":
                return string(expr.value).map((v) => {
                    return v;
                });
            case "nonterminal":
                return lazy(() => {
                    return nonterminals[expr.value];
                });

            case "group":
                return generateParser(expr.value);
            case "optional":
                return generateParser(expr.value).opt();

            case "many":
                return many(generateParser(expr.value)).map((v) => {
                    return v;
                });

            case "many1":
                return many(generateParser(expr.value), 1);

            case "skip":
                return generateParser(expr.value[0]).skip(
                    generateParser(expr.value[1])
                );
            case "next":
                return generateParser(expr.value[0]).next(
                    generateParser(expr.value[1])
                );

            case "subtraction":
                return sequence(
                    generateParser(expr.value[0]).not(generateParser(expr.value[1]))
                );

            case "concatenation":
                return sequence(...expr.value.map(generateParser));
            case "alternation":
                return any(...expr.value.map(generateParser));
        }
    }

    for (const { name, expression } of ast) {
        nonterminals[name] = generateParser(expression);
    }

    return [nonterminals, ast] as const;
}

const mathParser = () => {
    const grammar = `
    expr = term, { ("+" | "-"), term };
    term = factor, { ("*" | "/"), factor };
    factor = number | "(", expr, ")";
    vibes = 3 * "vibes";
`;
    const nonterminals = parseEBNF(grammar);

    nonterminals.expr = nonterminals.expr.map(reduceMathExpression);
    nonterminals.term = nonterminals.term.map(reduceMathExpression);
    const numberRegex = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
    nonterminals.number = match(numberRegex)
        .trim()
        .map((v) => {
            return parseFloat(v);
        });

    return nonterminals.expr;
};

const CSSColorParser = () => {
    interface Color {
        type: string;
        r: number;
        g: number;
        b: number;
        a?: number;
    }

    const grammar = `
    sep =  comma | whitespace;
    alphaSep =  div | sep;

    colorType = "rgb" | "hsl" | "hsv" | "hwb" | "lab" | "lch";
    percentage = integer << "%";
    colorValue = percentage | number;

    colorFunction = 
        colorType,
        ("(" >>
            colorValue        ),
            (sep >> colorValue),
            (sep >> colorValue),
            ([ (alphaSep >> colorValue) ]
        << ")");
    
    hex = "#", (3 * digit | 6 * digit);
    
    color = hex | colorFunction;
`;
    const nonterminals = parseEBNF(grammar);

    nonterminals.whitespace = whitespace;
    nonterminals.comma = comma;
    nonterminals.div = div;
    nonterminals.digit = match(/\d|[a-fA-F]/).map((v) => {
        return v;
    });
    const numberRegex = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
    nonterminals.number = match(numberRegex)
        .trim()
        .map((v) => {
            return parseFloat(v);
        });
    nonterminals.integer = match(/\d+/).map(Number);
    nonterminals.percentage = nonterminals.percentage.map((value) => {
        return value / 100;
    });

    nonterminals.hex = nonterminals.hex.map(([, digits]) => {
        digits = digits.flat();

        const r = digits.length === 3 ? digits[0] + digits[0] : digits.slice(0, 2);
        const g = digits.length === 3 ? digits[1] + digits[1] : digits.slice(2, 4);
        const b = digits.length === 3 ? digits[2] + digits[2] : digits.slice(4, 6);

        return {
            type: "rgb",
            r: parseInt(r, 16),
            g: parseInt(g, 16),
            b: parseInt(b, 16),
        } as Color;
    });

    nonterminals.colorFunction = nonterminals.colorFunction.map(
        ([type, r, g, b, a]) => {
            const color: Color = {
                type,
                r,
                g,
                b,
                a,
            };
            return color;
        }
    );
    return nonterminals.color;
};

const EBNFParser = () => {
    const grammar = `
letter = 
      "A" | "B" | "C" | "D" | "E" | "F" | "G"
    | "H" | "I" | "J" | "K" | "L" | "M" | "N"
    | "O" | "P" | "Q" | "R" | "S" | "T" | "U"
    | "V" | "W" | "X" | "Y" | "Z" | "a" | "b"
    | "c" | "d" | "e" | "f" | "g" | "h" | "i"
    | "j" | "k" | "l" | "m" | "n" | "o" | "p"
    | "q" | "r" | "s" | "t" | "u" | "v" | "w"
    | "x" | "y" | "z" ;

digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;

symbol_0 = 
      "[" | "]" | "{" | "}" | "(" | ")" | "<" | ">"
    | "'" | '"' | "=" | "|" | "." | "," | ";" ;
symbol = whitespace >> symbol_0 << whitespace ;

character = letter | digit | symbol | "_" | whitespace ;

identifier_0 = letter , { letter | digit | "_" } ;
identifier = whitespace >> identifier_0 << whitespace ;

terminal_0 = 
      "'" >> (character - "'")+ << "'" | '"' >> (character - '"')+ << '"' ;
terminal = whitespace >> terminal_0, "ad" << whitespace ;

lhs_0 = identifier ;
rhs_0 = identifier
    | terminal
    | "[" , rhs_0 , "]"
    | "{" , rhs_0 , "}"
    | "(" , rhs_0 , ")"
    | rhs_0 , "|" , rhs_0
    | rhs_0 , "," , rhs_0 ;

lhs = whitespace >> lhs_0 << whitespace ;
rhs = whitespace >> rhs_0 << whitespace ;

rule = lhs << "=" , rhs << ";" ;
grammar = rule* ;
`;
    const [nonterminals, ast] = generateParserFromEBNF(grammar);

    nonterminals.whitespace = whitespace;

    // nonterminals.symbol = nonterminals.symbol.trim();

    nonterminals.identifier = nonterminals.identifier.map((v) => {
        return v.flat().join("");
    });
    // nonterminals.terminal = nonterminals.terminal.trim().map((v) => {
    //     return v.flat().join("");
    // });
    // nonterminals.lhs = nonterminals.lhs.trim().map((v) => {
    //     return v;
    // });
    // nonterminals.rhs = nonterminals.rhs.trim().map((v) => {
    //     return v;
    // });

    // nonterminals.rule = nonterminals.rule.trim();

    // return nonterminals.grammar;
    return nonterminals.token;
};

describe("EBNF Parser", () => {
    it("should parse a simple math grammar", () => {
        const parser = mathParser();

        for (let i = 0; i < 100; i++) {
            const expr = insertRandomWhitespace(generateMathExpression());
            const parsed = parser.parse(expr);
            expect(parsed).toBe(eval(expr));
        }
    });

    it("should parse a CSS color grammar", () => {
        const parser = CSSColorParser();

        const colors = [
            "hsl(0 0 0 / 1)",
            "rgb(100%, 100%, 100% / 1)",
            "rgb(10%, 11%, 12%)",
            "rgb(255, 255, 255, 1)",
            "rgb(255, 255, 255)",
            "#fff",
            "#ffffff",
        ];

        for (const color of colors) {
            const parsed = parser.parse(color);

            expect(parsed).toBeTruthy();
        }
    });

    it("should parse a EBNF grammar", () => {
        const parser = EBNFParser();

        const grammar = `
        "mygayestvibes"
`;

        const parsed = parser.parse(grammar);

        expect(parsed).toBeTruthy();
    });
});