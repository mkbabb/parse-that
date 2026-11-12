// The failure contract's expected set (sk-v27 LW3.COMP-4b, the TS half):
// the furthest offset and the expected labels at it, sorted and deduplicated
// by construction. The order is code-point order (the labels' UTF-8 byte
// order), the order the Rust runtimes and the failure contract use.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    any,
    disableDiagnostics,
    enableDiagnostics,
    ParserState,
    string,
} from "../src/parse/index.js";

function failAt(parser: ReturnType<typeof any>, input: string) {
    const state = new ParserState(input);
    parser.parser(state);
    expect(state.isError).toBe(true);
    return { furthest: state.furthest, expected: state.expected ?? [] };
}

describe("failure_reports_sorted_expected_set", () => {
    beforeEach(() => enableDiagnostics());
    afterEach(() => disableDiagnostics());

    it("two alternatives failing at one offset give one sorted set in both orders", () => {
        const ab = failAt(any(string("a"), string("b")), "x");
        const ba = failAt(any(string("b"), string("a")), "x");
        expect(ab).toEqual({ furthest: 0, expected: ['"a"', '"b"'] });
        expect(ba).toEqual(ab);
    });

    it("a label met twice at one offset is kept once", () => {
        const twice = failAt(any(string("b"), string("a"), string("b")), "x");
        expect(twice.expected).toEqual(['"a"', '"b"']);
    });

    it("a later failure at a smaller offset does not replace the set", () => {
        const deep = any(string("a").then(any(string("c"), string("b"))), string("z"));
        expect(failAt(deep, "ax")).toEqual({ furthest: 1, expected: ['"b"', '"c"'] });
    });

    it("the order is code-point order, not UTF-16 code-unit order", () => {
        // U+FF5E (one code unit) sorts before U+1F600 (a surrogate pair) by
        // code point and by UTF-8 bytes; by code units it would sort after.
        const wide = failAt(any(string("\u{1F600}"), string("\u{FF5E}")), "x");
        expect(wide.expected).toEqual(['"\u{FF5E}"', '"\u{1F600}"']);
    });
});
