import { whitespace, match, string, all } from "../src/that";

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

    nonterminals.pipe = nonterminals.pipe.trim();
    nonterminals.comma = nonterminals.comma.trim();
    nonterminals.star = nonterminals.star.trim();
    nonterminals.plus = nonterminals.plus.trim();
    nonterminals.question = nonterminals.question.trim();
    nonterminals.dash = nonterminals.dash.trim();

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
            }
        }

        return rules.join("\n");
    });
};

const EBNFParserLeftRecursion = (grammar: string) => {
    const [nonterminals, ast] = generateParserFromEBNF(grammar);

    nonterminals.integer = match(/\d+/).trim().map(Number);
    nonterminals.string = match(/[a-zA-Z]+/).trim();

    nonterminals.expr = nonterminals.expr.trim().map((v) => {
        return v.flat();
    });

    nonterminals.myVibes = nonterminals.myVibes.trim().map(reduceMathExpression);

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

    it("should parse a EBNF grammar", () => {
        let grammar = fs.readFileSync("./grammar/eebnf.ebnf", "utf8");

        const parser = EBNFParser(grammar);

        for (let i = 0; i < 10; i++) {
            grammar = parser.parse(grammar);
            fs.writeFileSync("./grammar/eebnf2.ebnf", grammar);
        }
    });

    it("should handle EBNF left recursion", () => {
        const grammar = `
    expr = expr , "+" , expr | integer | string ;
    myVibes = expr ;
`;
        const parser = EBNFParserLeftRecursion(grammar);

        const tmp = `1+2+3`;
        const parsed = parser.parse(tmp);
        console.log(parsed);
    });
});
