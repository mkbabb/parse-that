// X.P.W7 .p — the 2.0.0 general-library cures, one law per gate.
//   P-1 mapSpan keeps every per-parse state on ParserState's own hidden class.
//   P-2 a failing parse writes 0 console bytes and allocates no error arrays.
//   P-3 a regex that can match empty matches '' at end of input.
import { setFlagsFromString } from "node:v8";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    Parser,
    ParserState,
    all,
    any,
    disableDiagnostics,
    enableDiagnostics,
    regex,
    string,
    whitespace,
} from "../src/parse/index.js";

setFlagsFromString("--allow-natives-syntax");
// Compiled after the flag is set, so the intrinsic parses.
const haveSameMap = new Function("a", "b", "return %HaveSameMap(a, b);") as (a: unknown, b: unknown) => boolean;

// value.js's two span shapes (src/css/bbnf/value.ts `badTerm`,
// src/css/bbnf/stylesheet.ts `spanned`), ported to mapSpan.
const term = regex(/[a-z]+/).then(regex(/\s*/)).map(([t]) => t);
const badTerm = term.mapSpan((_, start, end) =>
    Object.freeze({ kind: "invalid", reason: "css_syntax", span: Object.freeze({ start, end }) }));
const spanned = <T>(p: Parser<unknown>, action: (value: unknown, start: number, end: number) => T) =>
    p.mapSpan((value, start, end) => action(value, start, end));
const listComma = spanned(string(","), (_, start) => ({ comma: start }));

describe("P-1 mapSpan: no state is ever a prototype", () => {
    it("badTerm shape: value and span, state map unchanged", () => {
        const state = new ParserState("abc  ");
        badTerm.parser(state);
        expect(state.isError).toBe(false);
        expect(state.value).toEqual({ kind: "invalid", reason: "css_syntax", span: { start: 0, end: 5 } });
        expect(haveSameMap(state, new ParserState("x"))).toBe(true);
    });

    it("spanned shape inside a sequence: offsets are the rule's own", () => {
        const p = all(string("a"), listComma, string("b"));
        const state = p.parseState("a,b");
        expect(state.value).toEqual(["a", { comma: 1 }, "b"]);
        expect(haveSameMap(state, new ParserState("x"))).toBe(true);
    });

    it("a failing inner parser leaves mapSpan's callback uncalled", () => {
        const fn = vi.fn();
        const state = regex(/[0-9]+/).mapSpan(fn).parseState("abc");
        expect(state.isError).toBe(true);
        expect(fn).not.toHaveBeenCalled();
        expect(haveSameMap(state, new ParserState("x"))).toBe(true);
    });

    it("mapState is gone from the surface", () => {
        expect((Parser.prototype as unknown as Record<string, unknown>).mapState).toBeUndefined();
    });
});

describe("P-2 the failure path is silent and allocation-free", () => {
    afterEach(() => {
        disableDiagnostics();
        vi.restoreAllMocks();
    });

    function captureConsole() {
        let bytes = 0;
        const count = (...args: unknown[]) => { bytes += args.map(String).join(" ").length; };
        for (const m of ["error", "warn", "log", "info", "debug", "trace"] as const) {
            vi.spyOn(console, m).mockImplementation(count);
        }
        const write = (chunk: unknown) => { bytes += String(chunk).length; return true; };
        vi.spyOn(process.stdout, "write").mockImplementation(write as typeof process.stdout.write);
        vi.spyOn(process.stderr, "write").mockImplementation(write as typeof process.stderr.write);
        return () => bytes;
    }

    // Fails at several increasing offsets, so the furthest frontier advances.
    const failing = all(string("("), regex(/[0-9]+/).sepBy(string(","), 1), string(")"));
    const choice = any(string("alpha"), string("beta"), regex(/[0-9]+/));

    it("diagnostics off: 0 console bytes, no error arrays allocated", () => {
        const bytes = captureConsole();
        const state = new ParserState("(1,22,333x)");
        const { suggestions, secondarySpans, diagnostics } = state;
        failing.parser(state);
        choice.parser(state);
        expect(state.isError).toBe(true);
        expect(state.furthest).toBe(9);
        expect(state.expected).toBeUndefined();
        expect(state.suggestions).toBe(suggestions);
        expect(state.secondarySpans).toBe(secondarySpans);
        expect(state.diagnostics).toBe(diagnostics);
        expect([suggestions.length, secondarySpans.length, diagnostics.length]).toEqual([0, 0, 0]);

        const top = failing.parseState("(1,22,333x)");
        expect(top.isError).toBe(true);
        expect(top.expected).toBeUndefined();
        expect(failing.parse("(1,x")).toBeUndefined();
        expect(bytes()).toBe(0);
    });

    it("diagnostics on: still 0 console bytes; the evidence is on the state", () => {
        enableDiagnostics();
        const bytes = captureConsole();
        const top = failing.parseState("(1,22,333x)");
        expect(top.isError).toBe(true);
        expect(top.furthest).toBe(9);
        expect(top.expected).toEqual(['","', '")"']);
        expect(bytes()).toBe(0);
    });
});

describe("P-3 F-p-EOF: an empty-matching regex matches at end of input", () => {
    it("/\\s*/ matches '' on empty input and after the last token", () => {
        const ws = regex(/\s*/);
        const empty = ws.parseState("");
        expect([empty.isError, empty.offset]).toEqual([false, 0]);
        const mid = ws.parseState("x");
        expect(empty.value).toBe(mid.value);

        const tail = all(string("abc"), regex(/\s*/)).parseState("abc");
        expect([tail.isError, tail.offset]).toEqual([false, 3]);
        expect(whitespace.parseState("").isError).toBe(false);
        expect(regex(/a?/).parseState("").isError).toBe(false);
    });

    it("a regex that cannot match empty still fails at end of input", () => {
        const state = regex(/[a-z]+/).parseState("");
        expect([state.isError, state.offset, state.furthest]).toEqual([true, 0, 0]);
    });
});
