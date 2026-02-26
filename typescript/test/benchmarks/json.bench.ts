import { describe, bench, BenchOptions } from "vitest";
import fs from "fs";

import { JSONParser as BBNFJsonParser } from "./bbnf";
import { JSONParser as StandardJsonParser } from "./parse-that";
import { parse as ChevrotainJSONParser } from "./chevrotain";
import { json as ParsimmonJSONParser } from "./parsimmon";

const options = {
    iterations: 10,
} as BenchOptions;

const input = fs.readFileSync("../data/json/data.json", "utf-8");

// Suppress console.log from parse-that error reporting
const origLog = console.log;

describe("JSON Parser", () => {
    bench(
        "Standard",
        () => {
            console.log = () => {};
            try { StandardJsonParser.parse(input); }
            finally { console.log = origLog; }
        },
        options,
    );

    bench(
        "BBNF",
        () => {
            console.log = () => {};
            try { BBNFJsonParser.parse(input); }
            finally { console.log = origLog; }
        },
        options,
    );

    bench(
        "Chevrotain",
        () => {
            ChevrotainJSONParser(input);
        },
        options,
    );

    bench(
        "Parsimmon",
        () => {
            ParsimmonJSONParser.tryParse(input);
        },
        options,
    );
});
