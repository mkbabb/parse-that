import { Parser, match, all, any, sepBy, string, lazy, many } from "../src/that";
import { test, expect, describe, it } from "vitest";

const comma = string(",").trim();

const jsonNull = match(/null/).map(() => null);
const jsonBool = any(match(/true/), match(/false/)).map((value) => value === "true");
const jsonNumber = match(/-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/).map(Number);

const stringChar = any(
    match(/[^"\\]+/),
    match(/\\"/).map(() => '"'),
    match(/\\\\/).map(() => "\\")
);
const jsonString = many(stringChar, 1)
    .wrap(string('"'), string('"'))
    .map((value) => value.join(""));

const jsonArray = lazy(() =>
    sepBy(jsonValue, comma)
        .opt()
        .trim()
        .wrap(string("["), string("]"))
        .map((values) => {
            return values ?? [];
        })
);
const jsonObject = lazy(() =>
    sepBy(jsonString.skip(string(":")).then(jsonValue), comma)
        .opt()
        .trim()
        .wrap(string("{"), string("}"))
).map((pairs) => {
    if (pairs === undefined) {
        return {};
    }
    const obj: Record<string, any> = {};
    for (const [key, value] of pairs) {
        obj[key] = value;
    }
    return obj;
});

const jsonValue: Parser<any> = any(
    jsonNull,
    jsonBool,
    jsonNumber,
    jsonString,
    jsonArray,
    jsonObject
).trim();

describe("JSON Parser", () => {
    it("should parse a null value", () => {
        const result = jsonValue.parse("null");
        expect(result).toBe(null);
    });

    it("should parse a boolean value", () => {
        const result1 = jsonValue.parse("true");
        expect(result1).toBe(true);
        const result2 = jsonValue.parse("false");
        expect(result2).toBe(false);
    });

    it("should parse a number value", () => {
        const result = jsonValue.parse("123.45");
        expect(result).toBe(123.45);
    });

    it("should parse a string value", () => {
        const result = jsonValue.parse('"hello, world"');
        expect(result).toBe("hello, world");
    });

    it("should parse an empty array", () => {
        const result = jsonValue.parse("[]");
        expect(result).toEqual([]);
    });

    it("should parse an array with values", () => {
        const result = jsonValue.parse('[1, "two", false]');
        expect(result).toEqual([1, "two", false]);
    });

    it("should parse an empty object", () => {
        const result = jsonValue.parse("{}");
        expect(result).toEqual({});
    });

    it("should parse an object with key-value pairs", () => {
        const result = jsonValue.parse(
            '{"name": "John", "age": 30, "isStudent": true}'
        );
        expect(result).toEqual({ name: "John", age: 30, isStudent: true });
    });
});
