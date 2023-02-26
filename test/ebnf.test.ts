import { whitespace, regex, string, all, Parser } from "../src";

import { test, expect, describe, it } from "vitest";
import fs from "fs";
import { generateMathExpression, reduceMathExpression } from "./utils";

import { addNonterminalsDebugging, generateParserFromEBNF } from "../src/ebnf/generate";
import { EBNFParser } from "../src/ebnf/transform";
import { EBNFNonterminals } from "../src/ebnf/grammar";

const comma = string(",").trim();
const div = string("/").trim();

const debugging = (x: EBNFNonterminals) => {
    const logger = (...s: string[]) => {
        console.log(...s);
    };
    return addNonterminalsDebugging(x, logger);
};

const mathParser = (grammar: string) => {
    const [nonterminals, ast] = generateParserFromEBNF(grammar);

    nonterminals.expr = nonterminals.expr.map(reduceMathExpression);
    nonterminals.term = nonterminals.term.map(reduceMathExpression);
    const numberRegex = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
    nonterminals.number = regex(numberRegex)
        .trim()
        .map((v) => {
            return parseFloat(v);
        });

    return nonterminals.expr;
};

const CSSColorParser = (grammar: string) => {
    interface Color {
        type: string;
        r: number;
        g: number;
        b: number;
        a?: number;
    }

    const [nonterminals, ast] = generateParserFromEBNF(grammar);

    nonterminals.whitespace = whitespace;
    nonterminals.comma = comma;
    nonterminals.div = div;
    nonterminals.digit = regex(/\d|[a-fA-F]/).map((v) => {
        return v;
    });
    const numberRegex = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
    nonterminals.number = regex(numberRegex)
        .trim()
        .map((v) => {
            return parseFloat(v);
        });
    nonterminals.integer = regex(/\d+/).map(Number);
    nonterminals.percentage = nonterminals.percentage.map((value) => {
        return value / 100;
    });
    nonterminals.colorPercentage = nonterminals.colorPercentage.map((value) => {
        return value * 255;
    });

    nonterminals.hex = nonterminals.hex.map((digits) => {
        let hex = digits.join("");
        let alpha = 1;

        if (hex.length === 3 || hex.length === 4) {
            hex = hex.replace(/./g, "$&$&");
        }
        if (hex.length === 8) {
            alpha = parseInt(hex.slice(6, 8), 16) / 255;
            hex = hex.slice(0, 6);
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return {
            type: "rgb",
            r,
            g,
            b,
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

    debugging(nonterminals);

    return nonterminals.color;
};

const CSSValueUnitParser = (grammar: string) => {
    const [nonterminals, ast] = generateParserFromEBNF(grammar);

    nonterminals.whitespace = whitespace;
    nonterminals.comma = comma;
    nonterminals.div = div;
    nonterminals.digit = regex(/\d|[a-fA-F]/).map((v) => {
        return v;
    });
    const numberRegex = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
    nonterminals.number = regex(numberRegex)
        .trim()
        .map((v) => {
            return parseFloat(v);
        });
    nonterminals.integer = regex(/\d+/).map(Number);

    debugging(nonterminals);

    return nonterminals.valueUnit.map(([value, unit]) => {
        return {
            value,
            unit: unit,
        } as const;
    });
};

const EBNFParserLeftRecursion = (grammar: string) => {
    const [nonterminals, ast] = generateParserFromEBNF(grammar);

    nonterminals.integer = regex(/\d+/).trim().map(Number);
    nonterminals.string = regex(/[a-zA-Z]+/)
        .trim()
        .map((v) => {
            return v.charCodeAt(0);
        });
    nonterminals.vibes = string("vibes")
        .trim()
        .map((v) => {
            return -10;
        });
    nonterminals.whatzupwitu = string("whatzupwitu")
        .trim()
        .map((v) => {
            return 17;
        });

    nonterminals.expr = nonterminals.expr.trim().map((v) => {
        if (v.length === 2) {
            return reduceMathExpression(v);
        } else {
            return v[0];
        }
    });

    debugging(nonterminals);

    return nonterminals.expr;
};

describe("EBNF Parser", () => {
    it("should parse a simple math grammar", () => {
        const grammar = fs.readFileSync("./grammar/math.ebnf", "utf8");
        const parser = mathParser(grammar);

        for (let i = 0; i < 100; i++) {
            const expr = generateMathExpression();
            const parsed = parser.parse(expr);
            expect(parsed).toBe(eval(expr));
        }
    });

    it("should parse a CSS color grammar", () => {
        const grammar = fs.readFileSync("./grammar/css-color.ebnf", "utf8");
        const parser = CSSColorParser(grammar);

        const colors = [
            "#fff",
            "hsl(0 0 0 / 12)",
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

    it("should parse a CSS value unit grammar", () => {
        const grammar = fs.readFileSync("./grammar/css-value-unit.ebnf", "utf8");
        // fs.writeFileSync("./grammar/css-value-unit2.ebnf", formatGrammar(grammar));
        const parser = CSSValueUnitParser(grammar);

        const units = [
            "",
            "px",
            "em",
            "rem",
            "vh",
            "vw",
            "vmin",
            "vmax",
            "ch",
            "ex",
            "cm",
            "mm",
            "in",
            "pt",
            "pc",
            "deg",
            "grad",
            "rad",
            "turn",
            "s",
            "ms",
            "dpi",
            "dpcm",
            "dppx",
            "%",
            "fr",
        ];
        for (let i = 0; i < units.length; i++) {
            const unit = units[i];
            let value = Math.random() * 100;
            if (i % 3 === 0 || unit === "%") {
                value = Math.round(value);
            }

            const parsed = parser.parse(value + unit);

            expect(parsed.unit ?? "").toBe(unit);
            expect(parsed.value).toBe(value);
        }
    });

    it("should parse a EEBNF grammar", () => {
        let grammar = fs.readFileSync("./grammar/eebnf.ebnf", "utf8");

        const parser = EBNFParser(grammar);

        for (let i = 0; i < 10; i++) {
            grammar = parser.parse(grammar);
            fs.writeFileSync("./grammar/eebnf2.ebnf", grammar);
        }
    });

    it("should handle EBNF left recursion", () => {
        const grammar = `
    digits = /[0-9]+/ ;
    expr = 
          expr , ("*" , expr) 
        | expr , ("+" , expr)
        | expr , ("-" , expr) 
        | integer
        | whatzupwitu
        | vibes
        | string
        | digits ;
`;
        const parser = EBNFParserLeftRecursion(grammar);

        const tmp = `
    1 + 2 + 3 + whatzupwitu * vibes + a
`;
        const parsed = parser.parse(tmp);
        expect(parsed).toBeGreaterThan(0);
    });
});
