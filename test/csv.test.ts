import { regex, all, Parser, any, lazy, string } from "../src/parse/parse";
import { test, expect, describe, it } from "vitest";
import fs from "fs";

const delim = string(",").trim();
const doubleQuotes = string('"');
const singleQuotes = string("'");

const token = any(
    regex(/[^"]+/).wrap(doubleQuotes, doubleQuotes),
    regex(/[^']+/).wrap(singleQuotes, singleQuotes),
    regex(/[^,]+/)
);

const line = token.sepBy(delim).trim();
const csv = line.many();

describe("CSV Parser", () => {
    it("should parse an empty input", () => {
        const result = csv.parse("");
        expect(result).toEqual([]);
    });

    it("should parse a single value", () => {
        const result = csv.parse("hello");
        expect(result).toEqual([["hello"]]);
    });

    it("should parse multiple values with no quotes", () => {
        const result = csv.parse("hello,world,123");
        expect(result).toEqual([["hello", "world", "123"]]);
    });

    it("should parse values with double quotes", () => {
        const result = csv.parse('"hello, world", "123"');
        expect(result).toEqual([["hello, world", "123"]]);
    });

    it("should parse values with single quotes", () => {
        const result = csv.parse("'hello, world', '123'");
        expect(result).toEqual([["hello, world", "123"]]);
    });

    it("should handle leading/trailing spaces and line breaks", () => {
        const result = csv.parse('\n "hello" , "world" , "123" \n');
        expect(result).toEqual([["hello", "world", "123"]]);
    });

    it("should parse a multi-line input with quoted lines", () => {
        const input = `
        "name","age","address"
        "John Doe","30","123 Main St."
        "Jane Smith","25","456 Oak Ave."
`;
        const result = csv.parse(input);
        expect(result).toEqual([
            ["name", "age", "address"],
            ["John Doe", "30", "123 Main St."],
            ["Jane Smith", "25", "456 Oak Ave."],
        ]);
    });

    it("should parse a multi-line input with quoted lines and line breaks", () => {
        const input = `"name","age","address"\r\n"John Doe","30","123 Main St."\r\n"Jane Smith","25","456 Oak Ave."`;
        const result = csv.parse(input);
        expect(result).toEqual([
            ["name", "age", "address"],
            ["John Doe", "30", "123 Main St."],
            ["Jane Smith", "25", "456 Oak Ave."],
        ]);
    });

    it("should parse a csv file", () => {
        const filepath = "./data/data.csv";
        const input = fs.readFileSync(filepath, "utf-8");
        const result = csv.parse(input);
    });
});
