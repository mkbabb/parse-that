import { containsDelimiter, splitBalanced } from "../src/parse";
import { describe, it, expect } from "vitest";

describe("containsDelimiter", () => {
    it("returns true when delimiter is present", () => {
        expect(containsDelimiter("a, b, c", ",")).toBe(true);
    });

    it("returns false when delimiter is absent", () => {
        expect(containsDelimiter("no commas here", ",")).toBe(false);
    });
});

describe("splitBalanced", () => {
    it("no_delimiter", () => {
        expect(splitBalanced("no commas here", ",")).toEqual(["no commas here"]);
    });

    it("basic_split", () => {
        expect(splitBalanced("a, b, c", ",")).toEqual(["a", " b", " c"]);
    });

    it("nested_parens", () => {
        expect(splitBalanced(":is(.a, .b), .c", ",")).toEqual([
            ":is(.a, .b)",
            " .c",
        ]);
    });

    it("nested_brackets", () => {
        expect(splitBalanced('[attr="x,y"], .z', ",")).toEqual([
            '[attr="x,y"]',
            " .z",
        ]);
    });

    it("quoted_strings (double quotes)", () => {
        expect(splitBalanced('"a,b", c', ",")).toEqual(['"a,b"', " c"]);
    });

    it("quoted_strings (single quotes)", () => {
        expect(splitBalanced("'a,b', c", ",")).toEqual(["'a,b'", " c"]);
    });

    it("deep_nesting", () => {
        expect(splitBalanced(":is(:not(.a, .b), .c), .d", ",")).toEqual([
            ":is(:not(.a, .b), .c)",
            " .d",
        ]);
    });

    it("empty_segments", () => {
        expect(splitBalanced(",a,,b,", ",")).toEqual(["", "a", "", "b", ""]);
    });

    it("single_char_delimiter", () => {
        expect(splitBalanced(",", ",")).toEqual(["", ""]);
    });

    it("empty_input", () => {
        expect(splitBalanced("", ",")).toEqual([""]);
    });

    it("mixed_nesting_and_quotes", () => {
        expect(
            splitBalanced(
                ':is(.a, .b), [data-x="1,2"], \'hello, world\'',
                ","
            )
        ).toEqual([":is(.a, .b)", ' [data-x="1,2"]', " 'hello, world'"]);
    });
});
