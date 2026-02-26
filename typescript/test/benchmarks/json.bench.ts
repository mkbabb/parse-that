import { describe, bench, BenchOptions } from "vitest";
import fs from "fs";
import { insertRandomWhitespace } from "../utils";

import { JSONParser as BBNFJsonParser } from "./bbnf";
import { JSONParser as StandardJsonParser } from "./parse-that";

import { parse as ChevrotainJSONParser } from "./chevrotain";
import { json as ParsimmonJSONParser } from "./parsimmon";

const options = {
    iterations: 10,
} as BenchOptions;

const whitespace = /\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g;
let input = fs.readFileSync("../data/json/data.json", "utf-8");
input = insertRandomWhitespace(input, 10);
// input = input.replaceAll(whitespace, "");

describe("JSON Parser", () => {
    bench(
        "Standard",
        () => {
            StandardJsonParser.parse(input);
        },
        options
    );

    bench(
        "BBNF",
        () => {
            BBNFJsonParser.parse(input);
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
