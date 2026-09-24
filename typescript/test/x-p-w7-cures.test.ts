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
