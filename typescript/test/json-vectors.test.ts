/**
 * Shared JSON test vectors — reads from grammar/tests/json/*.jsonl
 * and verifies hand-written and fast parsers all agree.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
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

describe("JSON shared test vectors", () => {
    const validVectors = readVectors("valid.jsonl");
    const invalidVectors = readVectors("invalid.jsonl");

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
