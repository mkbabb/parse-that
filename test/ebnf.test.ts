import { whitespace, match, string } from "../src/that";

import { test, expect, describe, it } from "vitest";
import fs from "fs";
import {
    generateMathExpression,
    insertRandomWhitespace,
    reduceMathExpression,
} from "./utils";

import { generateParserFromEBNF } from "../src/ebnf";

const comma = string(",").trim();
const div = string("/").trim();

const mathParser = (grammar: string) => {
    const [nonterminals, ast] = generateParserFromEBNF(grammar);

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
    return nonterminals.color;
};

const EBNFParser = (grammar: string) => {
    const [nonterminals, ast] = generateParserFromEBNF(grammar);

    nonterminals.symbol = nonterminals.symbol.trim();

    nonterminals.identifier = nonterminals.identifier.trim().map((v) => {
        return v.flat().join("");
    });
    nonterminals.terminal = nonterminals.terminal.trim().map((v) => {
        return v.flat().join("");
    });

    nonterminals.pipe = nonterminals.pipe.trim().map((v) => {
        return `\n\t${v}`;
    });
    nonterminals.comma = nonterminals.comma.trim();

    nonterminals.rhs = nonterminals.rhs.trim().map((v) => {
        return v instanceof Array ? v.flat(Infinity) : v;
    });

    nonterminals.rule = nonterminals.rule.trim().map((v) => {
        return v.flat().join(" ");
    });

    return nonterminals.grammar.trim().map((v) => {
        return v.flat().join("\n");
    });
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

    it("should parse a EBNF grammar", () => {
        let grammar = fs.readFileSync("./grammar/eebnf.ebnf", "utf8");
        const parser = EBNFParser(grammar);

        for (let i = 0; i < 10; i++) {
            grammar = parser.parse(grammar);
            fs.writeFileSync("./grammar/eebnf2.ebnf", grammar);
        }
    });
});
