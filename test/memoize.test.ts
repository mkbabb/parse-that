import { whitespace, regex, string, all, Parser, eof, lookBehind, lazy } from "../src";

import { expect, describe, it } from "vitest";
import fs from "fs";

import { generateParserFromEBNF } from "../src/ebnf/generate";
import { generateMathExpression, reduceMathExpression } from "./utils";

const digits = regex(/[0-9]+/);

describe("JSON Parser", () => {
    it("should expr", () => {
        const expr = Parser.lazy(() => expr.or(digits))
            .memoize()
            .eof();

        const result = expr.parse("12356");
        expect(result).toEqual("12356");
    });

    it("should mSL", () => {
        const ms = string("s");
        const mSL = Parser.lazy(() => mSL.then(mSL).then(ms))
            .opt()
            .memoize();
        const mz = string("z");
        const mZ = Parser.lazy(() => mz.or(mY)).memoize();

        const mY = Parser.lazy(() => mZ.then(mSL))
            .memoize()
            .eof();

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

    // it("should sS from EEBNF", () => {
    //     const grammar = fs.readFileSync("./grammar/sS.ebnf", "utf-8");
    //     const [nonterminals, ast] = generateParserFromEBNF(grammar);
    //     const sentences = ["ssssss"];

    //     nonterminals.sS = nonterminals.sS.memoize();

    //     for (const sentence of sentences) {
    //         const result = nonterminals.sS.parse(sentence).flat(Infinity);

    //         const sCount = result.filter((x) => x === "s").length;
    //         expect(sCount).toBe(sentence.length);
    //     }
    // });

    it("should math from EEBNF", () => {
        // const grammar = fs.readFileSync("./grammar/math-ambiguous.ebnf", "utf-8");
        // const [nonterminals, ast] = generateParserFromEBNF(grammar);

        // for (const key of Object.keys(nonterminals)) {
        //     nonterminals[key] = nonterminals[key].trim();
        // }
        // nonterminals.expression = nonterminals.expression.memoize().debug("expression");

        // const parser = nonterminals.expression;
        const expression = Parser.lazy(() =>
            expression.then(string("+")).then(expression).or(digits.debug("digits"))
        )
            .opt()
            // .debug("expression")
            .memoize();
        const parser = expression;

        for (let i = 0; i < 1; i++) {
            const expr = "1+3";
            const parsed = parser.parse(expr);
            expect(parsed).toEqual([["1", "+"], "3"]);
            console.log(parsed);
        }
    });
});
