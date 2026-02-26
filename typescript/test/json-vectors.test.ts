/**
 * Shared JSON test vectors — reads from grammar/tests/json/*.jsonl
 * and verifies BBNF-generated, hand-written, and fast parsers all agree.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { BBNFToParser } from "../src/bbnf/generate.js";
import { jsonParseFast } from "../src/parse/json-fast.js";

function readVectors(filename: string): string[] {
    const filePath = path.resolve(
        __dirname,
        "../../grammar/tests/json",
        filename,
    );
    const content = fs.readFileSync(filePath, "utf-8");
    return content
        .split("\n")
        .filter((line) => line.trim().length > 0);
}

// Build the BBNF JSON parser (with EOF requirement for full-input validation)
const jsonBbnf = fs.readFileSync(
    path.resolve(__dirname, "../../grammar/json.bbnf"),
    "utf-8",
);
const [nonterminals] = BBNFToParser(jsonBbnf);
const bbnfParser = nonterminals!.value.eof();

describe("JSON shared test vectors", () => {
    const validVectors = readVectors("valid.jsonl");
    const invalidVectors = readVectors("invalid.jsonl");

    describe("BBNF parser — valid inputs", () => {
        validVectors.forEach((input, i) => {
            it(`parses valid vector #${i + 1}: ${input.substring(0, 40)}`, () => {
                const state = bbnfParser.parseState(input);
                expect(state.isError).toBe(false);
            });
        });
    });

    describe("BBNF parser — invalid inputs", () => {
        invalidVectors.forEach((input, i) => {
            it(`rejects invalid vector #${i + 1}: ${input.substring(0, 40)}`, () => {
                const state = bbnfParser.parseState(input);
                expect(state.isError).toBe(true);
            });
        });
    });

    describe("json-fast — valid inputs", () => {
        validVectors.forEach((input, i) => {
            it(`parses valid vector #${i + 1}: ${input.substring(0, 40)}`, () => {
                const result = jsonParseFast(input);
                expect(result).not.toBeUndefined();
            });
        });
    });

    describe("json-fast — invalid inputs", () => {
        invalidVectors.forEach((input, i) => {
            it(`rejects invalid vector #${i + 1}: ${input.substring(0, 40)}`, () => {
                const result = jsonParseFast(input);
                expect(result).toBeUndefined();
            });
        });
    });

    describe("JSON.parse agreement on valid inputs", () => {
        validVectors.forEach((input, i) => {
            it(`agrees with JSON.parse on vector #${i + 1}`, () => {
                const expected = JSON.parse(input);
                const fast = jsonParseFast(input);
                expect(fast).toEqual(expected);
            });
        });
    });
});
