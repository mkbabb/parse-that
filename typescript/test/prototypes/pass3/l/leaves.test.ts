import { describe, expect, expectTypeOf, it } from "vitest";
import {
    disableDiagnostics,
    enableDiagnostics,
} from "../../../../src/parse/index.js";
import {
    compile,
    literal,
    sequence,
    sourceLeaf,
    type Spanned,
} from "../s/kernel.js";
import { RunState } from "../s/run-state.js";
import {
    asciiRun,
    stickySource,
} from "./leaves.js";
import {
    cssNameEnd,
    cssNumberEnd,
    DIGIT,
    jsonNumberEnd,
    jsonStringEnd,
    NAME_REST,
    NAME_START,
} from "./fixtures.js";

describe("P2-L generic source-direct leaves", () => {
    it("projects one source leaf with exact nonzero UTF-16 spans", () => {
        const parser = compile(sequence(
            literal("\u{1D49C}"),
            sourceLeaf("<css-number>", cssNumberEnd, (
                source,
                start,
                end,
            ) => Number(source.substring(start, end))).spanned(),
        ));

        const state = parser.parseState("\u{1D49C}-12.5e+2x");
        expectTypeOf(state.value).toEqualTypeOf<
            ["\u{1D49C}", Spanned<number>]
        >();
        expect(state).toMatchObject({
            value: [
                "\u{1D49C}",
                { value: -1250, span: { start: 2, end: 10 } },
            ],
            offset: 10,
            isError: false,
        });
    });

    it("rejects invalid, empty, and out-of-range matcher ends", () => {
        for (const end of [-1, 0, 2]) {
            const state = compile(sourceLeaf(
                "<hostile>",
                () => end,
            )).parseState("x");
            expect(state).toMatchObject({
                value: undefined,
                offset: 0,
                isError: true,
                furthest: 0,
            });
        }
        expect(compile(sourceLeaf(
            "<empty>",
            (_, start) => start,
            undefined,
            [],
            true,
        )).parseState("x")).toMatchObject({
            value: "",
            offset: 0,
            isError: false,
        });
        expect(() => sourceLeaf("<bad-code>", () => 1, undefined, [-1]))
            .toThrow("firstCodes must be UTF-16 code units");
    });

    it("keeps projection exceptions before the state commit", () => {
        const grammar = sourceLeaf<string>(
            "<throw>",
            (_, start) => start + 1,
            () => {
                throw new Error("projection");
            },
        );
        const parser = compile(grammar);
        const state = new RunState<string>("x");
        expect(() => parser.parser(state)).toThrow("projection");
        expect(state.offset).toBe(0);
    });

    it("supports generic sticky and declarative ASCII-run families", () => {
        const sticky = compile(stickySource(/[A-Za-z_][A-Za-z0-9_-]*/));
        const run = compile(asciiRun("<ascii-ident>", NAME_START, NAME_REST));
        for (const source of ["alpha", "_x9", "a-b", "x!"]) {
            expect(run.parseState(source)).toMatchObject({
                value: sticky.parseState(source).value,
                offset: sticky.parseState(source).offset,
                isError: false,
            });
        }
        expect(run.parseState("-x")).toMatchObject({
            offset: 0,
            isError: true,
        });
        expect(() => asciiRun("<bad>", new Uint8Array(4))).toThrow(
            "ASCII class tables must contain 128 entries",
        );
    });

    it("keeps CSS-shaped match policy outside the generic leaf", () => {
        const number = compile(sourceLeaf(
            "<css-number>",
            cssNumberEnd,
        ).spanned());
        for (const [source, value, end] of [
            ["12px", "12", 2],
            [".5%", ".5", 2],
            ["-0e+2x", "-0e+2", 5],
            ["1e+x", "1", 1],
        ] as const) {
            expect(number.parseState(source)).toMatchObject({
                value: { value, span: { start: 0, end } },
                offset: end,
                isError: false,
            });
        }
        expect(number.parseState("+.x")).toMatchObject({
            offset: 0,
            isError: true,
        });
    });

    it("shares the primitive with a stricter JSON-shaped number and string", () => {
        const number = compile(sourceLeaf(
            "<json-number>",
            jsonNumberEnd,
            (source, start, end) => Number(source.substring(start, end)),
            [45, ...DIGIT.keys()].filter(code => code === 45 || DIGIT[code]),
        ).spanned());
        expect(number.parseState("-12.5e2,")).toMatchObject({
            value: { value: -1250, span: { start: 0, end: 7 } },
            offset: 7,
            isError: false,
        });
        expect(number.parseState("01")).toMatchObject({
            value: { value: 0, span: { start: 0, end: 1 } },
            offset: 1,
            isError: false,
        });

        const string = compile(sourceLeaf(
            "<json-string>",
            jsonStringEnd,
            (source, start, end) => JSON.parse(source.substring(start, end)),
            [34],
        ).spanned());
        expect(string.parseState("\"a\\u0041\\\\b\"!")).toMatchObject({
            value: { value: "aA\\b", span: { start: 0, end: 12 } },
            offset: 12,
            isError: false,
        });
        for (const source of ["\"line\nbreak\"", "\"\\x\"", "\"open"]) {
            expect(string.parseState(source)).toMatchObject({
                offset: 0,
                isError: true,
            });
        }
    });

    it("preserves raw UTF-16 offsets through CSS-style names and escapes", () => {
        const name = compile(sourceLeaf(
            "<css-name>",
            cssNameEnd,
        ).spanned());
        const astral = "\u{1D49C}x";
        expect(name.parseState(astral)).toMatchObject({
            value: { value: astral, span: { start: 0, end: 3 } },
            offset: 3,
            isError: false,
        });
        expect(name.parseState("a\\31 b!")).toMatchObject({
            value: { value: "a\\31 b", span: { start: 0, end: 6 } },
            offset: 6,
            isError: false,
        });
        expect(name.parseState("a\\\r\nb")).toMatchObject({
            value: { value: "a", span: { start: 0, end: 1 } },
            offset: 1,
            isError: false,
        });
        expect(name.parseState(`x\uD800\u0000`)).toMatchObject({
            value: { value: `x\uD800`, span: { start: 0, end: 2 } },
            offset: 2,
            isError: false,
        });
        expect(name.parseState("\\")).toMatchObject({
            value: { value: "\\", span: { start: 0, end: 1 } },
            offset: 1,
            isError: false,
        });
    });

    it("keeps labels, rollback, and immutable recovery evidence exact", () => {
        enableDiagnostics();
        try {
            const recovered = compile(sourceLeaf(
                "<css-number>",
                cssNumberEnd,
            ).recover(literal(";"), Object.freeze({ kind: "opaque" })));
            const state = recovered.parseState(";");
            expect(state).toMatchObject({
                value: { kind: "opaque" },
                offset: 1,
                isError: false,
                diagnostics: [{
                    offset: 0,
                    furthestOffset: 0,
                    expected: ["<css-number>"],
                }],
            });
            expect(Object.isFrozen(state.diagnostics[0])).toBe(true);
            expect(Object.isFrozen(state.diagnostics[0].expected)).toBe(true);
        } finally {
            disableDiagnostics();
        }
    });
});
