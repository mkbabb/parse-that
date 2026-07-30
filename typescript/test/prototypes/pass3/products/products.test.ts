import { describe, expect, it } from "vitest";
import {
    disableDiagnostics,
    enableDiagnostics,
} from "../../../../src/parse/index.js";
import {
    compileFixtureProduct,
    compileJsonProduct,
    span,
} from "./products.js";

describe("P2 shaped source-direct products", () => {
    it("builds recursive JSON values with an exact root UTF-16 span", () => {
        const source =
            " \r\n{\"𝒜\":[null,true,-12.5e2,{\"x\":\"a\\\\b\"}]} \t";
        const state = compileJsonProduct().parseState(source);

        expect(state).toMatchObject({
            value: {
                value: JSON.parse(source),
                span: span(3, source.length - 2),
            },
            offset: source.length,
            isError: false,
            diagnostics: [],
            fault: undefined,
        });
    });

    it("matches JSON.parse over the frozen valid corpus", async () => {
        const { readFile } = await import("node:fs/promises");
        const source = await readFile(
            new URL(
                "../../../../../grammar/tests/json/valid.jsonl",
                import.meta.url,
            ),
            "utf8",
        );
        const parser = compileJsonProduct();
        for (const input of source.split("\n").filter(Boolean)) {
            const state = parser.parseState(input);
            expect(state.isError, input).toBe(false);
            expect(state.value.value, input).toEqual(JSON.parse(input));
            expect(state.value.span, input).toEqual(span(0, input.length));
            expect(state.offset, input).toBe(input.length);
        }
    });

    it("rejects the frozen invalid corpus and preserves authored frontiers", async () => {
        const { readFile } = await import("node:fs/promises");
        const invalid = await readFile(
            new URL(
                "../../../../../grammar/tests/json/invalid.jsonl",
                import.meta.url,
            ),
            "utf8",
        );
        enableDiagnostics();
        try {
            const parser = compileJsonProduct();
            for (const source of [
                ...invalid.split("\n").filter(Boolean),
                "01",
                "[1,]",
                "{\"x\":}",
                "\"line\nbreak\"",
                "{\"x\":1}!",
                "\u0000",
            ]) {
                const state = parser.parseState(source);
                expect(state.isError, source).toBe(true);
                expect(state.offset, source).toBe(0);
                expect(state.furthest, source).toBeGreaterThanOrEqual(0);
                expect(state.expected?.length, source).toBeGreaterThan(0);
            }
        } finally {
            disableDiagnostics();
        }
    });

    it("keeps sticky nesting faults ahead of V8 stack failure", () => {
        const parser = compileJsonProduct(32);
        const state = parser.parseState(
            "[".repeat(64) + "null" + "]".repeat(64),
        );
        expect(state).toMatchObject({
            offset: 0,
            isError: true,
            fault: { kind: "Nesting", limit: 32 },
        });
        expect(state.maxDepth).toBe(32);
    });

    it("composes names, escapes, scalar leaves, URLs, and balanced calls", () => {
        const source = [
            "𝒜: 12px;",
            "title: \"a\\\\41\";",
            "image: url(foo.png);",
            "motion: calc(100% - 2px nested(1));",
            "\\31 x: .5;",
        ].join("\r\n");
        const state = compileFixtureProduct().parseState(source);

        expect(state.isError).toBe(false);
        expect(state.offset).toBe(source.length);
        expect(state.diagnostics).toEqual([]);
        expect(state.value).toHaveLength(5);
        expect(state.value[0]).toMatchObject({
            value: {
                kind: "statement",
                name: { value: "𝒜", span: span(0, 2) },
                body: [{
                    value: { kind: "dimension", value: 12, unit: "px" },
                }],
            },
        });
        expect(state.value[3].value).toMatchObject({
            kind: "statement",
            body: [{
                value: {
                    kind: "call",
                    name: "calc",
                    body: [
                        { value: { kind: "percentage", value: 100 } },
                        { value: { kind: "name", raw: "-" } },
                        {
                            value: {
                                kind: "dimension",
                                value: 2,
                                unit: "px",
                            },
                        },
                        { value: { kind: "call", name: "nested" } },
                    ],
                },
            }],
        });
    });

    it("returns successful immutable recovery evidence with opaque syntax", () => {
        enableDiagnostics();
        try {
            const source =
                "good: 1px;\r\nbad: @@@;\r\nnext: url(x/y);";
            const state = compileFixtureProduct().parseState(source);
            expect(state.isError).toBe(false);
            expect(state.offset).toBe(source.length);
            expect(state.value).toHaveLength(3);
            expect(state.value[1]).toEqual({
                value: { kind: "opaque" },
                span: span(12, 21),
            });
            expect(state.diagnostics).toHaveLength(1);
            expect(state.diagnostics[0]).toMatchObject({
                offset: 12,
                furthestOffset: 17,
            });
            expect(Object.isFrozen(state.diagnostics[0])).toBe(true);
            expect(Object.isFrozen(state.diagnostics[0].expected)).toBe(true);
        } finally {
            disableDiagnostics();
        }
    });

    it("preserves hostile UTF-16 inputs without a decoded-token plane", () => {
        const source = `x\uD800: \\31 x;\r\nnul: a\u0000;`;
        const state = compileFixtureProduct().parseState(source);
        expect(state.offset).toBe(source.length);
        expect(state.isError).toBe(false);
        expect(state.value[0]).toMatchObject({
            value: {
                name: { value: `x\uD800`, span: span(0, 2) },
                body: [{
                    value: { kind: "name", raw: "\\31 x" },
                    span: span(4, 9),
                }],
            },
        });
        expect(state.value[1].value).toEqual({ kind: "opaque" });
    });

    it("rejects invalid repeat bounds and stops nullable repetition", async () => {
        const { compile, literal, sourceLeaf } = await import("../s/kernel.js");
        expect(() => literal("x").many(-1)).toThrow(
            "repeat minimum must be a nonnegative safe integer",
        );
        const nullable = compile(sourceLeaf(
            "<empty>",
            (_, start) => start,
            undefined,
            [],
            true,
        ).many().eof()).parseState("");
        expect(nullable).toMatchObject({
            value: [],
            offset: 0,
            isError: false,
        });
    });
});
