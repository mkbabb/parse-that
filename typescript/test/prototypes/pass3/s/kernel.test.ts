import { describe, expect, expectTypeOf, it } from "vitest";
import {
    all,
    any,
    disableDiagnostics,
    enableDiagnostics,
    ParserState,
    string,
} from "../../../../src/parse/index.js";
import {
    choice,
    compile,
    literal,
    sequence,
    type Span,
    type Spanned,
} from "./kernel.js";

describe("P3-S source-direct staged terminal", () => {
    it("preserves authored choice priority across prefix collisions", () => {
        const shortFirst = compile(choice(literal("a"), literal("ab")));
        const longFirst = compile(choice(literal("ab"), literal("a")));
        const emptyFirst = compile(choice(literal(""), literal("a")));
        const emptyLast = compile(choice(literal("a"), literal("")));

        expect(shortFirst.parseState("ab")).toMatchObject({
            value: "a",
            offset: 1,
            isError: false,
        });
        expect(longFirst.parseState("ab")).toMatchObject({
            value: "ab",
            offset: 2,
            isError: false,
        });
        expect(emptyFirst.parseState("a")).toMatchObject({
            value: "",
            offset: 0,
            isError: false,
        });
        expect(emptyLast.parseState("a")).toMatchObject({
            value: "a",
            offset: 1,
            isError: false,
        });
    });

    it("projects mapped values and exact UTF-16 spans without token materialization", () => {
        const parser = compile(choice(
            literal("é").map(() => 1 as const).spanned(),
            literal("\u{1D49C}").map(() => 2 as const).spanned(),
        ));
        const first = parser.parse("é");
        const second = parser.parse("\u{1D49C}");

        expectTypeOf(first).toEqualTypeOf<Spanned<1> | Spanned<2>>();
        expect(first).toEqual({ value: 1, span: { start: 0, end: 1 } });
        expect(second).toEqual({ value: 2, span: { start: 0, end: 2 } });
        expect(parser.plan.coldEdges).toBeGreaterThan(0);

        const nested = new ParserState<Spanned<1> | Spanned<2>>("xé");
        nested.offset = 1;
        parser.parser(nested);
        expect(nested.value).toEqual({ value: 1, span: { start: 1, end: 2 } });
    });

    it("returns the same start-offset frontier and ordered labels as literal choice", () => {
        enableDiagnostics();
        const parser = compile(choice(
            literal("color"),
            literal("column-gap"),
            literal("contain"),
        ));
        const state = parser.parseState("counter-reset");
        try {
            expect({
                offset: state.offset,
                value: state.value,
                furthest: state.furthest,
                expected: state.expected,
                diagnostics: state.diagnostics,
                isError: state.isError,
            }).toEqual({
                offset: 0,
                value: undefined,
                furthest: 0,
                expected: ['"color"', '"column-gap"', '"contain"'],
                diagnostics: [],
                isError: true,
            });
        } finally {
            disableDiagnostics();
        }
    });

    it("retains run isolation and does not mutate the grammar graph", () => {
        const grammar = literal("display")
            .map(value => value.length)
            .spanned();
        const parser = compile(grammar);
        const first = parser.parseState("display");
        const second = parser.parseState("!");

        expect(first.value).toEqual({
            value: 7,
            span: { start: 0, end: 7 } satisfies Span,
        });
        expect(second).not.toBe(first);
        expect(second.value).toBeUndefined();
        expect(parser.plan).toEqual({
            terminals: 1,
            states: 0,
            asciiAlphabet: 0,
            asciiCells: 0,
            coldEdges: 0,
            tableBytes: 0,
        });
    });

    it("matches closure choice values, offsets, and failure frontiers", () => {
        const names = ["color", "column-gap", "contain", "counter-reset"];
        const closure = any(...names.map(string));
        const staged = compile(choice(...names.map(literal)));

        for (const source of [...names, "content"]) {
            const left = closure.parseState(source);
            const right = staged.parseState(source);
            expect({
                value: right.value,
                offset: right.offset,
                isError: right.isError,
                furthest: right.furthest,
                expected: right.expected,
            }).toEqual({
                value: left.value,
                offset: left.offset,
                isError: left.isError,
                furthest: left.furthest,
                expected: left.expected,
            });
        }
    });

    it("fuses a fast terminal child into one transactional sequence", () => {
        enableDiagnostics();
        const names = ["color", "display", "position"];
        const closure = all(any(...names.map(string)), string(":"));
        const staged = compile(sequence(
            choice(...names.map(literal)),
            literal(":"),
        ));
        try {
            for (const source of ["color:", "display:", "position:", "color!"]) {
                const left = new ParserState<[string, string]>(source);
                const right = new ParserState<[string, ":"]>(source);
                closure.parser(left);
                staged.parser(right);
                expect({
                    value: right.value,
                    offset: right.offset,
                    isError: right.isError,
                    furthest: right.furthest,
                    expected: right.expected,
                }).toEqual({
                    value: left.value,
                    offset: left.offset,
                    isError: left.isError,
                    furthest: left.furthest,
                    expected: left.expected,
                });
            }

            expect(compile(
                sequence(literal("x"), literal("y"))
                    .map(value => value.join(""))
                    .spanned(),
            ).parse("xy")).toEqual({
                value: "xy",
                span: { start: 0, end: 2 },
            });
            expect(() => compile(choice(
                sequence(literal("a"), literal("b")),
                sequence(literal("a"), literal("c")),
            ))).toThrow("no compiled path");
        } finally {
            disableDiagnostics();
        }
    });
});
