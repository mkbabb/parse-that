import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    Parser,
    ParserState,
    all,
    clearCollectedDiagnostics,
    disableDiagnostics,
    dispatch,
    enableDiagnostics,
    getCollectedDiagnostics,
    memoize,
    regex,
    resetPackrat,
    string,
} from "../src/parse/index.js";

beforeEach(() => {
    enableDiagnostics();
    clearCollectedDiagnostics();
    resetPackrat();
});

afterEach(() => {
    clearCollectedDiagnostics();
    resetPackrat();
    disableDiagnostics();
});

describe("runtime-kernel candidate obligations", () => {
    it("preserves one result slot per sequence member", () => {
        expect(all(string("a").opt(), string("b")).parse("b")).toEqual([
            undefined,
            "b",
        ]);
        expect(all(string("x")).parse("x")).toEqual(["x"]);
        expect(all(string("a").opt(), string("b"), string("c")).parse("bc"))
            .toEqual([undefined, "b", "c"]);
        expect(all(
            string("a").opt(), string("b"), string("c"), string("d"),
        ).parse("bcd")).toEqual([undefined, "b", "c", "d"]);

        const state = new ParserState("a!", "seed");
        all(string("a"), string("b")).parser(state);
        expect({
            offset: state.offset,
            value: state.value,
            furthest: state.furthest,
            expected: state.expected,
            isError: state.isError,
        }).toEqual({
            offset: 0,
            value: "seed",
            furthest: 1,
            expected: ['"b"'],
            isError: true,
        });
    });

    it("records a labelled regex failure at EOF", () => {
        const state = new ParserState("");
        regex(/[a-z]+/).parser(state);

        expect({
            isError: state.isError,
            offset: state.offset,
            furthest: state.furthest,
            expected: state.expected,
        }).toEqual({
            isError: true,
            offset: 0,
            furthest: 0,
            expected: ["/[a-z]+/"],
        });
    });

    it("dispatches a non-ASCII code point without corrupting the table", () => {
        expect(dispatch({ é: string("é") }).parse("é")).toBe("é");
    });

    it("does not reuse a raw memo cell across source strings", () => {
        const word = memoize(regex(/[a-z]+/));
        resetPackrat();

        const first = new ParserState("hello");
        word.parser(first);
        const second = new ParserState("world");
        word.parser(second);

        expect(second.value).toBe("world");
    });

    it("scopes recovered diagnostics to the parse that produced them", () => {
        const recovering = string("ok").recover(regex(/.+/), "recovered");

        expect(recovering.parse("bad")).toBe("recovered");
        expect(getCollectedDiagnostics()).toHaveLength(1);
        expect(string("ok").parse("ok")).toBe("ok");
        expect(getCollectedDiagnostics()).toEqual([]);
    });

    it("rolls back the complete checkpoint when a speculative arm is rejected", () => {
        const rejected = string("a")
            .skip(string("!"))
            .recover(regex(/[^?]*\?/), "recovered")
            .skip(string("z"));
        const parser = rejected.or(string("a")).skip(string("!"));
        const state = new ParserState("a?x", "seed");

        parser.parser(state);

        expect({
            offset: state.offset,
            value: state.value,
            isError: state.isError,
            furthest: state.furthest,
            expected: state.expected,
            diagnostics: getCollectedDiagnostics().length,
        }).toEqual({
            offset: 0,
            value: "seed",
            isError: true,
            furthest: 1,
            expected: ['"!"'],
            diagnostics: 0,
        });
    });

    it("parses deeply nested lazy recursion without using the host stack", () => {
        let nested!: Parser<string>;
        nested = Parser.lazy(() =>
            string("(").next(nested).skip(string(")")).or(string("x")),
        );
        const depth = 4_096;
        const source = "(".repeat(depth) + "x" + ")".repeat(depth);

        expect(() => nested.parse(source)).not.toThrow();
    });
});
