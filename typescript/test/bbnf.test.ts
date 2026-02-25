import { whitespace, regex, string, all, Parser, eof } from "../src/parse";
import { parserDebug } from "../src/parse/debug";

import { test, expect, describe, it } from "vitest";
import fs from "fs";
import {
    generateMathExpression,
    insertRandomWhitespace,
    reduceMathExpression,
} from "./utils";

import { BBNFToParser } from "../src/bbnf/generate";
import type { Nonterminals } from "../src/bbnf/types";

const comma = string(",").trim();
const div = string("/").trim();

const debugging = (x: Nonterminals) => {
    const logger = (...s: any[]) => {
        console.log(...s);
    };

    Object.entries(x).forEach(([key, value]) => {
        x[key] = parserDebug(value as any, key, false, logger);
    });
};

const mathParser = (grammar: string) => {
    const [nonterminals, ast] = BBNFToParser(grammar);

    nonterminals.expr = nonterminals.expr.map(reduceMathExpression);
    nonterminals.term = nonterminals.term.map(reduceMathExpression);
    const numberRegex = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
    nonterminals.number = regex(numberRegex)
        .trim()
        .map((v) => {
            return parseFloat(v);
        });

    return [nonterminals, ast] as const;
};

const CSSColorParser = (grammar: string) => {
    interface Color {
        type: string;
        r: number;
        g: number;
        b: number;
        a?: number;
    }

    const [nonterminals, ast] = BBNFToParser(grammar);

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

    nonterminals.color = nonterminals.color.map((color) => {
        return [color, "color"] as const;
    });
    return [nonterminals, ast] as const;
};

const CSSValueUnitParser = (grammar: string) => {
    const [nonterminals, ast] = BBNFToParser(grammar);

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

    // Unitless numbers produce a scalar from the grammar, not a [value, unit] tuple.
    // Wrap them to match the expected shape.
    nonterminals.unitless = nonterminals.number.map((value: number) => ({
        value,
        unit: "",
    }));

    // Dimension rules (length, angle, etc.) produce [value, unit] tuples.
    nonterminals.valueUnit = nonterminals.valueUnit.map((v: any) => {
        // If already an object with value/unit (from unitless override), pass through
        if (v && typeof v === "object" && "value" in v) {
            return v;
        }
        // Otherwise it's a [value, unit] tuple from a dimension rule
        const [value, unit] = v;
        return {
            value,
            unit: unit,
        } as const;
    });

    return [nonterminals, ast] as const;
};

const BBNFParserLeftRecursion = (grammar: string) => {
    const [nonterminals, ast] = BBNFToParser(grammar, true);

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
        if (v.length === 2 && v[1]) {
            return reduceMathExpression(v);
        } else {
            return v[0];
        }
    });

    return [nonterminals, ast] as const;
};

export const JSONParser = (grammar: string) => {
    const [nonterminals, ast] = BBNFToParser(grammar);

    // char* produces an array of individual characters — join them into a string
    nonterminals.string = nonterminals.string.map((chars: string[]) => {
        if (Array.isArray(chars)) {
            return chars.join("");
        }
        return chars;
    });

    nonterminals.number = nonterminals.number.map((v: string) => parseFloat(v));

    nonterminals.bool = nonterminals.bool.map((v: string) => v === "true");
    nonterminals.null = nonterminals.null.map(() => null);

    nonterminals.pair = nonterminals.pair.trim();
    nonterminals.object = nonterminals.object.map((pairs: any) => {
        if (pairs === undefined) {
            return {};
        }
        const obj: Record<string, any> = {};
        for (const [key, value] of pairs) {
            obj[key] = value;
        }
        return obj;
    });

    nonterminals.value = nonterminals.value.trim();
    return nonterminals.value;
};

describe("BBNF Parser", () => {
    it("should parse a simple math grammar", () => {
        const grammar = fs.readFileSync("../grammar/math.bbnf", "utf8");
        const [nonterminals] = mathParser(grammar);
        const parser = nonterminals.expr;

        for (let i = 0; i < 100; i++) {
            const expr = generateMathExpression();
            const parsed = parser.parse(expr);
            expect(parsed).toBe(eval(expr));
        }
    });

    it("should parse a CSS color grammar", () => {
        const grammar = fs.readFileSync("../grammar/css-color.bbnf", "utf8");
        const [nonterminals] = CSSColorParser(grammar);
        const parser = nonterminals.color;

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
        const grammar = fs.readFileSync("../grammar/css-value-unit.bbnf", "utf8");
        const colorGrammar = fs.readFileSync("../grammar/css-color.bbnf", "utf8");

        const [nonterminals] = CSSValueUnitParser(grammar);
        const [colorNonterminals] = CSSColorParser(colorGrammar);

        nonterminals.color = colorNonterminals.color;
        const parser = nonterminals.valueUnit;

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

    it("should parse a CSS keyframes grammar", () => {
        const grammar = fs.readFileSync("../grammar/css-keyframes.bbnf", "utf8");
        const [nonterminals, ast] = BBNFToParser(grammar);

        nonterminals.KEYFRAMES_RULE = nonterminals.KEYFRAMES_RULE.trim();

        const keyframes = /* css */ `
            @keyframes matrixExample {
                from {
                    top: 0px; background-color: red;
                    transform: matrix3d(
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1);
                }
                to {
                    top: 200px; background-color: blue;
                    transform: matrix3d(
                        -0.6,       1.34788, 0,        0,
                        -2.34788,  -0.6,     0,        0,
                         0,         0,       1,        0,
                         0,         0,      10,        1);
                }
              }
    `;
        // debugging(nonterminals);
        const parsed = nonterminals.KEYFRAMES_RULE.parse(keyframes);
        // console.log(chalk.bold.green(parsed));
    });

    it("should parse an BBNF grammar", () => {
        let grammar = fs.readFileSync("../grammar/bbnf.bbnf", "utf8");

        const [nonterminals, ast] = BBNFToParser(grammar);
        const parser = nonterminals.grammar;

        for (let i = 0; i < 10; i++) {
            grammar = parser.eof().parse(grammar).flat(Infinity).join("");
            expect(grammar).toBeTruthy();
            fs.writeFileSync("../grammar/bbnf.out", grammar, "utf8");
        }
    });

    it("should handle BBNF left recursion", () => {
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
        const [nonterminals, ast] = BBNFParserLeftRecursion(grammar);
        const parser = nonterminals.expr;

        const tmp = `
            1 + 2 + 3 + 4
        `;
        const parsed = parser.parse(tmp);
        expect(parsed).toBeGreaterThan(0);
    });

    it("should parse JSON data", () => {
        const grammar = fs.readFileSync("../grammar/json.bbnf", "utf8");

        const parser = JSONParser(grammar);

        const jsonData = fs.readFileSync("../data/json/data.json", "utf8");
        const parsed = parser.parse(jsonData);

        expect(parsed).toEqual(JSON.parse(jsonData));
    });

    it("should parse regular expressions", () => {
        const grammar = fs.readFileSync("../grammar/regex.bbnf", "utf8");

        const [nonterminals, ast] = BBNFToParser(grammar);

        const regexExamples = [
            /[A-Z]\w+/,
            /(a|b)*abb/,
            /^((cat))*$/,
            /[^a-zA-Z0-9]/,
            /(?=(\d))ab/,
            /[\dA-Fa-f]{8}-[\dA-Fa-f]{4}-[\dA-Fa-f]{4}-[\dA-Fa-f]{4}-[\dA-Fa-f]{12}/,
            /^(?=.{8,}).*\w\b$/y,
        ];

        nonterminals.regex = nonterminals.regex.map((regex) => {
            return regex;
        });

        // debugging(nonterminals);

        const parser = nonterminals.regex;

        for (const r of regexExamples) {
            const parsed = parser.parse(r.toString());
            // console.log(chalk.green(parsed));
        }
    });

    it("should parse an ambiguous BBNF grammar", () => {
        let grammar = fs.readFileSync("../grammar/g4.bbnf", "utf8");

        const [nonterminals, ast] = BBNFToParser(grammar, true);

        const sentences = [
            "the big cat ate the green green woman",
            "the woman hit the man with the banana",
        ];

        const memoFuncs = ["sentence"];

        for (const key of Object.keys(nonterminals)) {
            nonterminals[key] = nonterminals[key].trim();
            if (memoFuncs.includes(key)) {
                nonterminals[key] = nonterminals[key].memoize();
            }
        }

        const parser = nonterminals.sentence;
        // debugging(nonterminals);

        for (const sentence of sentences) {
            const parsed = parser.parse(sentence);
            // console.log(chalk.green(parsed));
        }
    });

    it("should parse an EBNF grammar", () => {
        let grammar = fs.readFileSync("../grammar/ebnf.bbnf", "utf8");

        for (let i = 0; i < 10; i++) {
            const [nonterminals, ast] = BBNFToParser(grammar);
            nonterminals.S = regex(/\s*/);

            const parser = nonterminals.grammar.trim();
            const result = parser.parse(grammar);
            grammar = result.flat(Infinity).join("");

            expect(result).toBeTruthy();
            expect(grammar).toBeTruthy();
        }
    });

    it("should parse a CSS selectors grammar", () => {
        const grammar = fs.readFileSync("../grammar/css-selectors.bbnf", "utf8");
        const [nonterminals] = BBNFToParser(grammar);

        const selectors = [
            "div",
            ".class",
            "#id",
            "div.class",
            "div > p",
            "div p",
            "div + p",
            "div ~ p",
            "a:hover",
            "p::first-line",
            "[href]",
            '[type="text"]',
            "div, span, p",
        ];

        const parser = nonterminals.selectorList;
        for (const sel of selectors) {
            const parsed = parser.parse(sel);
            expect(parsed).toBeTruthy();
        }
    });

    it("should parse a CSS values grammar", () => {
        const grammar = fs.readFileSync("../grammar/css-values.bbnf", "utf8");
        const [nonterminals] = BBNFToParser(grammar);

        const values = [
            "10px",
            "2.5em",
            "100%",
            "45deg",
            "1.5s",
            "#ff0000",
            "red",
            "transparent",
        ];

        const parser = nonterminals.value;
        for (const val of values) {
            const parsed = parser.parse(val);
            expect(parsed).toBeTruthy();
        }
    });

    it("should parse a CSV grammar", () => {
        const grammar = fs.readFileSync("../grammar/csv.bbnf", "utf8");
        const [nonterminals] = BBNFToParser(grammar);

        const csvData = `name,age,city
"John Doe",30,NYC`;

        const parser = nonterminals.csv;
        const parsed = parser.parse(csvData);
        expect(parsed).toBeTruthy();
    });
});
