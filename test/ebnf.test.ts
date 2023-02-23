import {
    Parser,
    whitespace,
    many,
    string,
    lazy,
    sequence,
    any,
    match,
    lookAhead,
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
    | EBNFRepetition
    | EBNFStar
    | EBNFSkipLeft
    | EBNFSkipRight
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
    value: EBNFExpression;
}

interface EBNFOptional {
    type: "optional";
    value: EBNFExpression;
}

interface EBNFRepetition {
    type: "repetition";
    value: EBNFExpression;
}

interface EBNFStar {
    type: "star";
    value: [number, EBNFExpression];
}

interface EBNFSkipLeft {
    type: "skipLeft";
    value: [EBNFExpression, EBNFExpression];
}
interface EBNFSkipRight {
    type: "skipRight";
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
const star = string("*").trim();
const questionMark = string("?").trim();
const pipe = string("|").trim();
const div = string("/").trim();
const plus = string("+").trim();
const minus = string("-").trim();

const integer = match(/\d+/).trim().map(Number);

const ebnfIdentifier = match(/[_a-zA-Z][_a-zA-Z0-9]*/)
    .trim()
    .map((value) => {
        return value;
    });

const ebnfLiteral = match(/"[^"]+"/).map(
    (value) =>
        ({
            type: "literal",
            value: value.slice(1, -1),
        } as EBNFLiteral)
);

const ebnfNonTerminal = ebnfIdentifier.map((value) => {
    return {
        type: "nonterminal",
        value,
    } as EBNFNonTerminal;
});

const ebnfGroup = lazy(() => ebnfExpression)
    .trim()
    .wrap(string("("), string(")"))
    .map(
        (value) =>
            ({
                type: "group",
                value,
            } as EBNFGroup)
    );

const ebnfOptional = lazy(() => ebnfExpression)
    .trim()
    .wrap(string("["), string("]"))
    .map(
        (value) =>
            ({
                type: "optional",
                value,
            } as EBNFOptional)
    );

const ebnfRepetition = lazy(() => ebnfExpression)
    .trim()
    .wrap(string("{"), string("}"))
    .map(
        (value) =>
            ({
                type: "repetition",
                value,
            } as EBNFRepetition)
    );

const ebnfStar = sequence(
    integer,
    star,
    lazy(() => ebnfExpression)
).map(([value, , expression]) => {
    return {
        type: "star",
        value: [value, expression],
    } as EBNFStar;
});

const leftShift = string(">>").trim();
const rightShift = string("<<").trim();

const ebnfSkipLeft: Parser<EBNFSkipLeft> = sequence(
    lazy(() => {
        return ebnfSubTerm;
    }),
    leftShift,
    lazy(() => {
        return ebnfSubTerm;
    })
).map(([left, , right]) => {
    return {
        type: "skipLeft",
        value: [left, right],
    } as EBNFSkipLeft;
});

const ebnfSkipRight: Parser<EBNFSkipRight> = sequence(
    lazy(() => {
        return ebnfSubTerm;
    }),
    rightShift,
    lazy(() => {
        return ebnfSubTerm;
    })
).map(([left, , right]) => {
    return {
        type: "skipRight",
        value: [left, right],
    } as EBNFSkipRight;
});

const ebnfConcatenation = lazy(() => ebnfTerm)
    .sepBy(comma, 1)
    .map(
        (value) =>
            ({
                type: "concatenation",
                value,
            } as EBNFConcatenation)
    );

const ebnfAlternation: Parser<EBNFAlternation> = lazy(() =>
    ebnfConcatenation.or(ebnfTerm)
)
    .sepBy(pipe, 1)
    .map((value) => {
        return {
            type: "alternation",
            value,
        } as EBNFAlternation;
    });

const ebnfTerm = any(
    ebnfLiteral,
    ebnfNonTerminal,
    ebnfGroup,
    ebnfOptional,
    ebnfRepetition,
    ebnfStar
);

const ebnfSubTerm = any(ebnfAlternation, ebnfConcatenation, ebnfTerm);

const ebnfExpression = any(
    ebnfSkipLeft,
    ebnfSkipRight,
    ebnfAlternation,
    ebnfConcatenation,
    ebnfTerm
);

const terminator = any(semicolon, dot);

const ebnfProductionRule = sequence(
    ebnfIdentifier,
    equalSign,
    ebnfExpression,
    terminator
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

            case "skipLeft":
                return generateParser(expr.value[0])
                    .then(generateParser(expr.value[1]))
                    .map(([, v]) => {
                        return v;
                    });

            case "skipRight":
                return generateParser(expr.value[0])
                    .then(generateParser(expr.value[1]))
                    .map(([v]) => {
                        return v;
                    });

            case "repetition":
                return many(generateParser(expr.value));
            case "star":
                return many(generateParser(expr.value[1]), expr.value[0]);

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
});
