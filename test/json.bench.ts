import { Parser, regex, all, any, string, lazy } from "../src";
import { test, expect, describe, it, bench, BenchOptions } from "vitest";
import fs from "fs";

import { jsonValue } from "./json.test";
import { JSONParser } from "./ebnf.test";
import { insertRandomWhitespace } from "./utils";

const options = {
    iterations: 10,
} as BenchOptions;

const whitespace = /\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g;
let input = fs.readFileSync("data/data.json", "utf-8");
// input = insertRandomWhitespace(input, 100);

const jsonValueEBNF = JSONParser(fs.readFileSync("./grammar/json.ebnf", "utf-8"));

describe("JSON Parser", () => {
    bench(
        "should parse a JSON file",
        () => {
            jsonValue.parse(input);
        },
        options
    );

    bench(
        "should parse a JSON file using EEBNF",
        () => {
            jsonValueEBNF.parse(input);
        },
        options
    );
});
