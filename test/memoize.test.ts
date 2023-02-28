import { whitespace, regex, string, all, Parser, eof, lookBehind, lazy } from "../src";

import { test, expect, describe, it } from "vitest";
import fs from "fs";
import { generateMathExpression, reduceMathExpression } from "./utils";

import { addNonterminalsDebugging, generateParserFromEBNF } from "../src/ebnf/generate";
import { EBNFParser, formatEBNFGrammar } from "../src/ebnf/transform";
import { EBNFNonterminals } from "../src/ebnf/grammar";
import chalk from "chalk";

const digits = regex(/[0-9]+/);

describe("JSON Parser", () => {
    // it("should vibe", () => {
    //     const expr = Parser.lazy(() => expr.or(digits))
    //         .memoize()
    //         .eof()
    //         .debug("expr");

    //     const result = expr.parse("12356");
    // });

    it("should mSL", () => {
        const ms = string("s").debug("ms");
        const mSL = Parser.lazy(() =>
            mSL.debug("mSL1").then(mSL.debug("mSL2")).then(ms)
        )
            .opt()
            .memoize()
            .debug("mSL");

        const mz = string("z").debug("mz");
        const mZ = Parser.lazy(() => mz.or(mY))
            .memoize()
            .debug("mZ");

        const mY = Parser.lazy(() => mZ.then(mSL))
            .memoize()
            .eof()
            .debug("mY");

        const input = "zssss";

        const result = mY.debug("left").parse(input).flat(Infinity);
        console.log("vibegse", result);
    });

    // it("should sS", () => {
    //     const s = string("s").debug("s");
    //     const sS = Parser.lazy(() => s.then(sS).then(sS))
    //         .opt()
    //         .memoize()
    //         .debug("sS");

    //     const input = "sss";
    //     const result = sS.eof().debug("left").parse(input).flat(Infinity);
    //     console.log("vibegse", result);
    // });
});
