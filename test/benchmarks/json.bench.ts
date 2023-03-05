import { describe, bench, BenchOptions } from "vitest";
import fs from "fs";
import { insertRandomWhitespace } from "../utils";

import { JSONParser as EBNFJsonParser } from "./bbnf";
import { JSONParser as StandardJsonParser } from "./parse-that";

import { parse as ChevrotainJSONParser } from "./chevrotain";
import { json as ParsimmonJSONParser } from "./parsimmon";

const options = {
    iterations: 10,
} as BenchOptions;

const whitespace = /\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g;
let input = fs.readFileSync("data/data.json", "utf-8");
input = insertRandomWhitespace(input, 10);

fs.writeFileSync("data/tmp.json", input);
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
        "EEBNF",
        () => {
            EBNFJsonParser.parse(input);
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
