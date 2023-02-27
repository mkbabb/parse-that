import { Parser, regex, all, any, string, lazy } from "../../src";
import { test, expect, describe, it, bench, BenchOptions } from "vitest";
import fs from "fs";
import { insertRandomWhitespace } from "../utils";

import { jsonValue } from "../json.test";
import { JSONParser } from "../ebnf.test";

import { parse as ChevrotainJSONParser } from "./chevrotain";
import { json as ParsimmonJSONParser } from "./parsimmon";

const options = {
    iterations: 100,
} as BenchOptions;

const whitespace = /\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g;
let input = fs.readFileSync("data/data-large.json", "utf-8");
input = insertRandomWhitespace(input, 100);

const jsonValueEBNF = JSONParser(fs.readFileSync("./grammar/json.ebnf", "utf-8"));

describe("JSON Parser", () => {
    bench(
        "Standard",
        () => {
            jsonValue.parse(input);
        },
        options
    );

    bench(
        "EEBNF",
        () => {
            jsonValueEBNF.parse(input);
        },
        options
    );

    bench(
        "Chevrotain",
        () => {
            ChevrotainJSONParser(input);
        },
        options
    );

    bench(
        "Parsimmon",
        () => {
            ParsimmonJSONParser.parse(input);
        },
        options
    );
});
