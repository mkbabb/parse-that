import {
    whitespace,
    regex,
    string,
    all,
    Parser,
    eof,
    lookBehind,
    lazy,
    any,
} from "../src/parse";

import { expect, describe, it } from "vitest";
import fs from "fs";

import { BBNFToParser } from "../src/ebnf/generate";
import { generateMathExpression, reduceMathExpression } from "./utils";

const digits = regex(/[0-9]+/);

describe("Memoization & left recursion", () => {
    it("should 123456", () => {
        const expr = Parser.lazy(() => expr.or(digits)).memoize();
        const result = expr.parse("12356");
        expect(result).toEqual("12356");
    });

    it("should mSL", () => {
        const ms = string("s");
        const mSL = Parser.lazy(() => mSL.then(mSL).then(ms))
            .opt()
            .memoize();
        const mz = string("z");
        const mZ = Parser.lazy(() => mZ.or(mY).or(mz)).memoize();

        const mY = Parser.lazy(() => mZ.then(mSL)).memoize();

        const input = "zss";

        const result = mY.parse(input)?.flat(Infinity) ?? [];
        const sCount = result.filter((x) => x === "s").length;
        expect(sCount).toBe(input.length - 1);
    });

    it("should sS", () => {
        const s = string("s");
        const sS = Parser.lazy(() => s.then(sS).then(sS))
            .opt()
            .memoize();

        const input = "ssssssssssssssss";

        const result = sS.eof().parse(input)?.flat(Infinity) ?? [];
        const sCount = result.filter((x) => x === "s").length;

        expect(sCount).toBe(input.length);
    });

    it("should sS from EEBNF", () => {
        const grammar = fs.readFileSync("./grammar/sS.ebnf", "utf-8");
        const [nonterminals, ast] = BBNFToParser(grammar);

        nonterminals.sS = nonterminals.sS.mergeMemos().memoize();
        const sentence = "s".repeat(100);

        const result = nonterminals.sS.parse(sentence).flat(Infinity) ?? [];

        const sCount = result.filter((x) => x === "s").length;
        expect(sCount).toBe(sentence.length);
    });

    it("should math from EEBNF", () => {
        const grammar = fs.readFileSync("./grammar/math-ambiguous.ebnf", "utf-8");
        const [nonterminals, ast] = BBNFToParser(grammar);

        nonterminals.expression = nonterminals.expression.memoize().trim();

        const parser = nonterminals.expression;

        for (let i = 0; i < 100; i++) {
            const expr = generateMathExpression(10);
            const parsed = parser.parse(expr) ?? [];
            const flat = parsed.flat(Infinity).join("");
            expect(flat).toEqual(expr.replaceAll(" ", ""));
        }
    });
    it("should math again", () => {
        const operators = any(string("+"), string("-"), string("*"), string("/"));
        const number = regex(/-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
        const expression = Parser.lazy(() =>
            all(expression, operators.then(expression).opt()).mergeMemos().or(number)
        )
            .opt()
            .trim()
            .memoize();

        const parser = expression;

        for (let i = 0; i < 1; i++) {
            const expr = generateMathExpression(10);
            const parsed = parser.parse(expr) ?? [];
            const flat = parsed.flat(Infinity).join("");
            expect(flat).toEqual(expr.replaceAll(" ", ""));
        }
    });
});
