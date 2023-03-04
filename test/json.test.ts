import { Parser, regex, all, any, string, lazy } from "../src/parse";
import { test, expect, describe, it, bench } from "vitest";
import fs from "fs";

const comma = string(",").trim();
const colon = string(":").trim();

const jsonNull = string("null").map(() => null);
const jsonBool = any(string("true"), string("false")).map((v) => v === "true");
const jsonNumber = regex(/-?(0|[1-9]\d*)(\.\d+)?/).map((v) => parseFloat(v));

const stringChar = regex(/[^"\\]+/);
const jsonString = stringChar
    .many(1)
    .wrap(string('"'), string('"'))
    .map((v) => v.join(""));
const jsonArray = Parser.lazy(() =>
    jsonValue
        .sepBy(comma)
        .opt()
        .trim()
        .wrap(string("["), string("]"))
        .map((values) => {
            return values ?? [];
        })
);
const jsonObject = Parser.lazy(() =>
    jsonString
        .skip(colon)
        .then(jsonValue)
        .sepBy(comma)
        .trim()
        .opt()
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

export const jsonValue: Parser<any> = any(
    jsonObject,
    jsonArray,
    jsonString,
    jsonNumber,
    jsonBool,
    jsonNull
);

describe("JSON Parser", () => {
    // it("should parse a null value", () => {
    //     const result = jsonValue.parse("null");
    //     expect(result).toBe(null);
    // });

    // it("should parse a boolean value", () => {
    //     const result1 = jsonValue.parse("true");
    //     expect(result1).toBe(true);
    //     const result2 = jsonValue.parse("false");
    //     expect(result2).toBe(false);
    // });

    // it("should parse a number value", () => {
    //     const result = jsonValue.parse("123.45");
    //     expect(result).toBe(123.45);
    // });

    // it("should parse a string value", () => {
    //     const result = jsonValue.parse('"hello, world"');
    //     expect(result).toBe("hello, world");
    // });

    // it("should parse an empty array", () => {
    //     const result = jsonValue.parse("[]");
    //     expect(result).toEqual([]);
    // });

    // it("should parse an array with values", () => {
    //     const result = jsonValue.parse('[ 1, "two", false ]');
    //     expect(result).toEqual([1, "two", false]);
    // });

    // it("should parse an empty object", () => {
    //     const result = jsonValue.parse("{}");
    //     expect(result).toEqual({});
    // });

    it("should parse an object with key-value pairs", () => {
        const result = jsonValue.parse(
            '{ "name": "John", "age": 30, "isStudent": true }'
        );
        expect(result).toEqual({ name: "John", age: 30, isStudent: true });
    });

    it("should read a JSON file", () => {
        const input = fs.readFileSync("data/data-large.json", "utf-8");
        const result = jsonValue.parse(input);
        expect(result).toEqual(JSON.parse(input));
    });
});
