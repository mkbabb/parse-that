import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    string,
    regex,
    any,
    dispatch,
    eof,
    Parser,
    ParserState,
    enableDiagnostics,
    disableDiagnostics,
} from "../src/parse/index.js";
import {
    summarizeLine,
    addCursor,
    statePrint,
    formatExpected,
} from "../src/parse/debug.js";

/** Strip ANSI escape codes for comparison. */
function stripAnsi(s: string): string {
    return s.replace(/\x1b\[[0-9;]*m/g, "");
}

describe("Diagnostics Infrastructure", () => {
    beforeEach(() => {
        enableDiagnostics();
    });

    afterEach(() => {
        disableDiagnostics();
    });

    describe("summarizeLine", () => {
        it("should pass through short lines", () => {
            expect(summarizeLine("hello world")).toBe("hello world");
        });

        it("should truncate long lines", () => {
            const long = "a".repeat(200);
            const result = summarizeLine(long, 100);
            expect(result.length).toBeLessThan(200);
            expect(result).toContain("...");
        });

        it("should center-truncate around column", () => {
            const long = "x".repeat(200);
            const result = summarizeLine(long, 100);
            expect(result).toContain("...");
        });
    });

    describe("formatExpected", () => {
        it("should format empty expected", () => {
            expect(formatExpected([])).toBe("");
        });

        it("should format single expected", () => {
            expect(formatExpected(['"hello"'])).toBe('expected "hello"');
        });

        it("should format two expected with 'or'", () => {
            expect(formatExpected(['"a"', '"b"'])).toBe(
                'expected "a" or "b"',
            );
        });

        it("should format three+ expected with Oxford comma", () => {
            expect(formatExpected(['"a"', '"b"', '"c"'])).toBe(
                'expected "a", "b", or "c"',
            );
        });
    });

    describe("Expected set tracking", () => {
        it("should accumulate labels at same offset", () => {
            const state = new ParserState("xyz");
            // string("a") fails at offset 0, string("b") also fails at offset 0
            const p = any(string("a"), string("b"), string("c"));
            p.parser(state);

            const expected = (state.expected ?? []);
            expect(expected).toContain('"a"');
            expect(expected).toContain('"b"');
            expect(expected).toContain('"c"');
        });

        it("should clear labels when advancing to new furthest", () => {
            const state = new ParserState("ax");
            // First "a" succeeds, then "b" fails at offset 1
            const p = string("a").skip(string("b"));
            p.parser(state);

            const expected = (state.expected ?? []);
            expect(expected).toContain('"b"');
            expect(expected).not.toContain('"a"');
        });

        it("should track regex labels", () => {
            const state = new ParserState("hello");
            const p = regex(/\d+/);
            p.parser(state);

            const expected = (state.expected ?? []);
            expect(expected.length).toBeGreaterThan(0);
            expect(expected[0]).toContain("\\d+");
        });

        it("should track eof label", () => {
            // Exercise the EOF flag path via call(): "hello world" leaves
            // " world" after "hello", so eof() fails and tracks its label on
            // the state it parsed into.
            const pEof = string("hello").eof();
            const state3 = new ParserState<string>("hello world");
            pEof.call(state3);

            const expected = (state3.expected ?? []);
            expect(expected).toContain("<end of input>");
        });
    });

    describe("Dispatch labels", () => {
        it("should build dispatch label from table", () => {
            const table: Record<string, Parser<string>> = {
                a: string("abc"),
                b: string("bcd"),
            };
            const p = dispatch(table);
            const state = new ParserState("xyz");
            p.parser(state);

            const expected = (state.expected ?? []);
            expect(expected.length).toBe(1);
            expect(expected[0]).toContain("one of");
        });
    });

    describe("Suggestions", () => {
        it("should track unclosed delimiter from wrap", () => {
            // Wrap: open "[" inner: string("hello") close: "]"
            // Input has no closing bracket
            const p = string("hello").wrap(string("["), string("]"));
            const state = new ParserState("[hello");
            p.parser(state);

            const suggestions = state.suggestions;
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions[0].kind).toBe("unclosed-delimiter");
            expect(suggestions[0].message).toContain("]");
        });

        it("should track secondary spans for unclosed delimiter", () => {
            const p = string("hello").wrap(string("["), string("]"));
            const state = new ParserState("[hello");
            p.parser(state);

            const spans = state.secondarySpans;
            expect(spans.length).toBeGreaterThan(0);
            expect(spans[0].label).toContain("opened here");
            expect(spans[0].offset).toBe(0);
        });
    });

    describe("statePrint", () => {
        it("should produce Ok badge for success", () => {
            const state = new ParserState("hello world");
            state.offset = 5;
            const output = stripAnsi(statePrint(state));
            expect(output).toContain("Ok");
            expect(output).toContain("5");
        });

        it("should produce Done badge when at EOF", () => {
            const state = new ParserState("hello");
            state.offset = 5;
            const output = stripAnsi(statePrint(state));
            expect(output).toContain("Done");
        });

        it("should produce Err badge for error", () => {
            const state = new ParserState("hello");
            state.isError = true;
            const output = stripAnsi(statePrint(state));
            expect(output).toContain("Err");
        });

        it("should include source context with line numbers", () => {
            const state = new ParserState("line1\nline2\nline3");
            state.offset = 6; // start of "line2"
            const output = stripAnsi(statePrint(state));
            expect(output).toContain("1");
            expect(output).toContain("2");
            expect(output).toContain("|");
        });
    });

    describe("addCursor", () => {
        it("should show cursor at correct position", () => {
            const state = new ParserState("hello world");
            state.offset = 5;
            const output = stripAnsi(addCursor(state, "^", false));
            expect(output).toContain("^");
            expect(output).toContain("hello world");
        });

        it("should handle multiline source", () => {
            const state = new ParserState("line1\nline2\nline3");
            state.offset = 8; // "ne" into line2
            const output = stripAnsi(addCursor(state, "^", false));
            expect(output).toContain("line1");
            expect(output).toContain("line2");
            expect(output).toContain("line3");
        });
    });
});
