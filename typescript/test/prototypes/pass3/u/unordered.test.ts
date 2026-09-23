import { describe, expect, expectTypeOf, it } from "vitest";
import {
    disableDiagnostics,
    enableDiagnostics,
} from "../../../../src/parse/utils.js";
import {
    choice,
    literal,
    type Spanned,
} from "../s/kernel.js";
import {
    compileUnordered,
    optional,
    repeated,
    required,
    type UnorderedFamily,
} from "./unordered.js";
import {
    makeOverlapCandidate,
    OPAQUE,
    overlapSources,
} from "./overlap-fixture.js";

const families: readonly UnorderedFamily[] = ["S", "D"];

describe.each(families)("U %s unordered composition", family => {
    it("returns && values in authored slots for every input order", () => {
        const parser = compileUnordered("all", [
            required(literal("a").spanned()),
            required(literal("b").spanned()),
            required(literal("c").spanned()),
            required(literal("d").spanned()),
        ], family);

        for (const source of ["abcd", "dcba", "badc", "cadb"]) {
            const state = parser.parseState(source);
            expectTypeOf(state.value).toEqualTypeOf<[
                Spanned<"a">,
                Spanned<"b">,
                Spanned<"c">,
                Spanned<"d">,
            ]>();
            expect(state).toMatchObject({
                offset: 4,
                isError: false,
                value: [
                    { value: "a" },
                    { value: "b" },
                    { value: "c" },
                    { value: "d" },
                ],
            });
            for (const slot of state.value) {
                expect(source.slice(slot.span.start, slot.span.end))
                    .toBe(slot.value);
            }
        }
    });

    it("searches past locally valid short and long overlapping arms", () => {
        const shortFirst = compileUnordered("all", [
            required(literal("a")),
            required(literal("ab")),
        ], family);
        const longestDeadEnd = compileUnordered("all", [
            required(choice(literal("ab"), literal("a"))
                .map(value => value.toUpperCase())
                .spanned()),
            required(literal("bc")),
        ], family);

        expect(shortFirst.parseState("aba")).toMatchObject({
            offset: 3,
            isError: false,
            value: ["a", "ab"],
        });
        expect(longestDeadEnd.parseState("abc")).toMatchObject({
            offset: 3,
            isError: false,
            value: [{
                value: "A",
                span: { start: 0, end: 1 },
            }, "bc"],
        });
        expect(longestDeadEnd.metrics().attempts).toBeGreaterThan(2);
    });

    it("supports optional and bounded repeated authored slots", () => {
        const optionalGroup = compileUnordered("all", [
            required(literal("a")),
            optional(literal("b")),
        ], family);
        const repeatedGroup = compileUnordered("all", [
            required(literal("b")),
            repeated(literal("a"), 1, 3),
        ], family);

        expect(optionalGroup.parseState("a")).toMatchObject({
            value: ["a", undefined],
            offset: 1,
            isError: false,
        });
        expect(compileUnordered("all", [
            optional(literal("a")),
            optional(literal("b")),
        ], family).parseState("")).toMatchObject({
            value: [undefined, undefined],
            offset: 0,
            isError: false,
        });
        expect(optionalGroup.parseState("ba")).toMatchObject({
            value: ["a", "b"],
            offset: 2,
            isError: false,
        });
        expect(repeatedGroup.parseState("aaab")).toMatchObject({
            value: ["b", ["a", "a", "a"]],
            offset: 4,
            isError: false,
        });
        expect(repeatedGroup.parseState("aaaab").isError).toBe(true);
    });

    it("implements || as one or more distinct members and rejects duplicates", () => {
        const parser = compileUnordered("some", [
            required(literal("a")),
            required(literal("b")),
            required(literal("c")),
        ], family);

        expect(parser.parseState("ca")).toMatchObject({
            value: ["a", undefined, "c"],
            offset: 2,
            isError: false,
        });
        expect(parser.parseState("").isError).toBe(true);
        expect(parser.parseState("aa").isError).toBe(true);
    });

    it("rejects nullable members before parsing", () => {
        expect(() => compileUnordered("all", [
            required(choice(literal(""), literal("x"))),
            required(literal("y")),
        ], family)).toThrow("unordered member 0 is nullable");
    });

    it("rolls back recovery evidence from a rejected speculative path", () => {
        const opaque = Object.freeze({ kind: "opaque" } as const);
        const parser = compileUnordered("some", [
            required(literal("ok").recover(literal("bad"), opaque)),
            required(literal("bad!").spanned()),
        ], family);

        const rejectedRecovery = parser.parseState("bad!");
        expect(rejectedRecovery).toMatchObject({
            offset: 4,
            isError: false,
            value: [
                undefined,
                { value: "bad!", span: { start: 0, end: 4 } },
            ],
            diagnostics: [],
        });

        const acceptedRecovery = parser.parseState("bad");
        expect(acceptedRecovery).toMatchObject({
            offset: 3,
            isError: false,
            value: [opaque, undefined],
        });
        expect(acceptedRecovery.diagnostics).toHaveLength(1);
        expect(Object.isFrozen(acceptedRecovery.diagnostics[0])).toBe(true);
    });

    it("retains exact failure frontiers and authored labels", () => {
        const parser = compileUnordered("all", [
            required(literal("a")),
            required(literal("b")),
        ], family);

        enableDiagnostics();
        try {
            expect(parser.parseState("x")).toMatchObject({
                offset: 0,
                isError: true,
                furthest: 0,
                expected: ["\"a\"", "\"b\""],
            });
            expect(parser.parseState("ax")).toMatchObject({
                offset: 0,
                isError: true,
                furthest: 1,
                expected: ["\"b\""],
            });
        } finally {
            disableDiagnostics();
        }
    });

    it.each([4, 8, 16, 33])(
        "handles %i disjoint members without permutation materialization",
        count => {
            const texts = Array.from(
                { length: count },
                (_, index) => String.fromCharCode(33 + index),
            );
            const parser = compileUnordered("all", texts.map(text =>
                required(literal(text).spanned())
            ), family);
            const source = [...texts].reverse().join("");
            const state = parser.parseState(source);

            expect(state.offset).toBe(count);
            expect(state.isError).toBe(false);
            expect(state.value.map(slot => slot.value)).toEqual(texts);
            expect(parser.metrics().explored).toBe(count);
            expect(parser.metrics().explored).toBeLessThan(10_000);
        },
    );

    it("returns a typed fault before ambiguous search exceeds its cap", () => {
        const parser = compileUnordered("all", Array.from(
            { length: 16 },
            (_, index) => required(literal("a").map(() => index)),
        ), family, 1_000);
        const state = parser.parseState(`${"a".repeat(15)}x`);

        expect(state).toMatchObject({
            offset: 0,
            isError: true,
            fault: {
                kind: "UnorderedStateLimit",
                limit: 1_000,
            },
        });
        expect(parser.metrics().explored).toBe(1_000);
    });
});

describe("P2-UO mixed-overlap product", () => {
    it.each([4, 8, 16, 33])(
        "uses live residual search for %i authored members",
        count => {
            const parser = makeOverlapCandidate(count);
            for (const source of overlapSources(count)) {
                const state = parser.parseState(source);
                expect(state.offset).toBe(source.length);
                expect(state.isError).toBe(false);
                expect(state.value).toHaveLength(count);
                expect(state.value[0]).toMatchObject({ value: "a" });
                expect(state.value[1]).toMatchObject({ value: "b" });
                expect(state.value[2]).toMatchObject({ value: OPAQUE });
                expect(state.diagnostics).toHaveLength(1);
                expect(Object.isFrozen(state.diagnostics[0])).toBe(true);
                for (const slot of state.value) {
                    expect(slot.span.end).toBeGreaterThan(slot.span.start);
                }
                expect(parser.metrics().residuals).toBeGreaterThan(0);
                expect(parser.metrics().attempts).toBeGreaterThan(count);
                expect(parser.metrics().explored).toBeLessThan(10_000);
            }
        },
    );
});
