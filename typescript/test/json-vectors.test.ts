/**
 * Shared JSON test vectors — reads from grammar/tests/json/*.jsonl
 * and verifies the combinator parser handles valid inputs.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { jsonParser } from "../src/parse/parsers/json.js";

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

    describe("jsonParser — valid inputs", () => {
        validVectors.forEach((input, i) => {
            it(`parses valid vector #${i + 1}: ${input.substring(0, 40)}`, () => {
                const result = jsonParser.parse(input);
                expect(result).not.toBeUndefined();
            });
        });
    });
});
