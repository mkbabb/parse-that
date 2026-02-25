import { describe, bench, BenchOptions } from "vitest";
import fs from "fs";
import { generateMathExpression } from "../utils";

import { JSONParser as BBNFJsonParser } from "./bbnf";
import { JSONParser as StandardJsonParser } from "./parse-that";
import { parse as ChevrotainJSONParser } from "./chevrotain";
import { json as ParsimmonJSONParser } from "./parsimmon";

const options = {
    iterations: 5,
    time: 5000,
} as BenchOptions;

// ── JSON Parsing ────────────────────────────────────────────────────────

// Use raw data.json (35KB) — no whitespace inflation to keep benchmarks tractable
const jsonInput = fs.readFileSync("../data/json/data.json", "utf-8");

describe("JSON Parser", () => {
    bench(
        "JSON.parse (native baseline)",
        () => {
            JSON.parse(jsonInput);
        },
        options
    );

    bench(
        "parse-that (hand-written)",
        () => {
            StandardJsonParser.parse(jsonInput);
        },
        options
    );

    bench(
        "parse-that (BBNF-generated)",
        () => {
            BBNFJsonParser.parse(jsonInput);
        },
        options
    );

    bench(
        "Chevrotain",
        () => {
            ChevrotainJSONParser(jsonInput);
        },
        options
    );

    bench(
        "Parsimmon",
        () => {
            ParsimmonJSONParser.parse(jsonInput);
        },
        options
    );
});

// ── Math Expression Parsing ─────────────────────────────────────────────

import { regex, string, any, all, Parser } from "../../src/parse";
import { reduceMathExpression } from "../utils";
import { BBNFToParser } from "../../src/bbnf/generate";

// Hand-written math parser
const number = regex(/(\d+)?(\.\d+)?([eE][-+]?\d+)?/)
    .trim()
    .map((v) => parseFloat(v));
const addOp = any(string("+"), string("-")).trim();
const mulOp = any(string("*"), string("/")).trim();
const factor: Parser<any> = Parser.lazy(() =>
    number.or(string("(").next(expr as Parser<any>).skip(string(")")))
);
const term = all(factor, all(mulOp, factor).many()).map(reduceMathExpression);
const expr = all(term, all(addOp, term).many()).map(reduceMathExpression);

// BBNF-generated math parser
const mathGrammar = fs.readFileSync("../grammar/math.bbnf", "utf8");
const [mathNonterminals] = BBNFToParser(mathGrammar);
mathNonterminals.expr = mathNonterminals.expr.map(reduceMathExpression);
mathNonterminals.term = mathNonterminals.term.map(reduceMathExpression);
const numberRegex = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
mathNonterminals.number = regex(numberRegex)
    .trim()
    .map((v) => parseFloat(v));
const bbnfMathParser = mathNonterminals.expr;

// Generate test expressions
const mathExpressions = Array.from({ length: 50 }, () =>
    generateMathExpression(20)
);

describe("Math Expression Parser", () => {
    bench(
        "parse-that (hand-written)",
        () => {
            for (const e of mathExpressions) {
                expr.parse(e);
            }
        },
        options
    );

    bench(
        "parse-that (BBNF-generated)",
        () => {
            for (const e of mathExpressions) {
                bbnfMathParser.parse(e);
            }
        },
        options
    );

    bench(
        "eval() (native baseline)",
        () => {
            for (const e of mathExpressions) {
                eval(e);
            }
        },
        options
    );
});
