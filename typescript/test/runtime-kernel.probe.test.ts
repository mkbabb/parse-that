import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import {
    Parser,
    ParserState,
    all,
    any,
    disableDiagnostics,
    dispatch,
    enableDiagnostics,
    memoize,
    regex,
    resetPackrat,
    string,
    type Diagnostic,
    type Span,
} from "../src/parse/index.js";

const markerDiagnostic: Diagnostic = {
    offset: -1,
    furthestOffset: -1,
    line: 0,
    column: 0,
    expected: ["marker"],
    suggestions: [],
    secondarySpans: [],
    found: "",
};

function hostileFailure() {
    return new Parser<string>(state => {
        state.offset++;
        state.unsafeSetValue("dirty");
        state.diagnostics.push({ ...markerDiagnostic, offset: 1 });
        state.furthest = Math.max(state.furthest, state.offset);
        state.expected = ['"dirty"'];
        state.isError = true;
        return state;
    });
}

function seededState(src: string) {
    const state = new ParserState<unknown>(src, "seed");
    state.diagnostics.push(markerDiagnostic);
    return state;
}

beforeEach(() => {
    enableDiagnostics();
    resetPackrat();
});

afterEach(() => {
    resetPackrat();
    disableDiagnostics();
});

describe("runtime-kernel candidate obligations", () => {
    it("preserves one result slot per sequence member", () => {
        const exact = all(
            string("").map(() => undefined),
            string("f").map(() => false as const),
            string("0").map(() => 0 as const),
            string("").map(() => "" as const),
            string("x").map((): Span => ({ start: 2, end: 3 })),
        ).parse("f0x");
        expectTypeOf(exact).toEqualTypeOf<[undefined, false, 0, "", Span]>();
        expect(exact).toEqual([undefined, false, 0, "", { start: 2, end: 3 }]);

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

        const recovered = recovering.parseState("bad");
        expect(recovered.value).toBe("recovered");
        expect(recovered.diagnostics).toHaveLength(1);
        const valid = string("ok").parseState("ok");
        expect(valid.diagnostics).toEqual([]);
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
            diagnostics: state.diagnostics.length,
        }).toEqual({
            offset: 0,
            value: "seed",
            isError: true,
            furthest: 2,
            expected: ['"z"'],
            diagnostics: 0,
        });
    });

    it("uses the same complete transaction across composite failures", () => {
        const cases: Array<[string, Parser<unknown>, string]> = [
            ["then-first", hostileFailure().then(string("x")), "?"],
            ["then-second", string("a").then(hostileFailure()), "a?"],
            ["chain", string("a").chain(() => hostileFailure()), "a?"],
            ["skip", string("a").skip(hostileFailure()), "a?"],
            ["next", string("a").next(hostileFailure()), "a?"],
            ["all", all(string("a"), hostileFailure()), "a?"],
            ["wrap", hostileFailure().wrap(string("("), string(")")), "(?"],
            ["trim", hostileFailure().trim(), " ?"],
            ["many-min", hostileFailure().many(1), "?"],
            ["sepBy-min", hostileFailure().sepBy(string(","), 1), "?"],
            ["eof", string("a").eof(), "a!"],
        ];

        for (const [name, parser, src] of cases) {
            const state = seededState(src);
            parser.parser(state);
            expect({
                offset: state.offset,
                value: state.value,
                diagnostics: state.diagnostics,
                isError: state.isError,
                furthest: state.furthest,
            }, name).toEqual({
                offset: 0,
                value: "seed",
                diagnostics: [markerDiagnostic],
                isError: true,
                furthest: expect.any(Number),
            });
        }
    });

    it("truncates rejected effects across retries, assertions, and repetition", () => {
        const recovering = string("x").recover(string("a"), "recovered");
        const cases: Array<[string, Parser<unknown>, string, number, unknown]> = [
            ["or", hostileFailure().or(string("a")), "a", 1, "a"],
            ["any", any(hostileFailure(), string("a")), "a", 1, "a"],
            ["opt", hostileFailure().opt(), "?", 0, undefined],
            ["many", hostileFailure().many(), "?", 0, []],
            ["sepBy", hostileFailure().sepBy(string(",")), "?", 0, []],
            ["not", hostileFailure().not(), "?", 0, "seed"],
            ["not-excluded", string("a").not(hostileFailure()), "a?", 1, "a"],
            ["minus", string("a").minus(hostileFailure()), "a", 1, "a"],
            ["peek", recovering.peek(), "a", 0, "recovered"],
            ["lookAhead", string("a").lookAhead(recovering), "aa", 1, "a"],
        ];

        for (const [name, parser, src, offset, value] of cases) {
            const state = seededState(src);
            parser.parser(state);
            expect({
                offset: state.offset,
                value: state.value,
                diagnostics: state.diagnostics,
                isError: state.isError,
            }, name).toEqual({
                offset,
                value,
                diagnostics: [markerDiagnostic],
                isError: false,
            });
        }
    });

    it("makes recovery progress and nesting faults typed and terminal", () => {
        const stalled = seededState("a");
        string("x").recover(regex(/(?:)/), "recovered").parser(stalled);
        expect({
            offset: stalled.offset,
            value: stalled.value,
            diagnostics: stalled.diagnostics,
            fault: stalled.fault,
            isError: stalled.isError,
        }).toEqual({
            offset: 0,
            value: "seed",
            diagnostics: [markerDiagnostic],
            fault: { kind: "RecoveryNonProgress", offset: 0 },
            isError: true,
        });

        let nested!: Parser<string>;
        nested = Parser.lazy(() =>
            string("(").next(nested).skip(string(")")).or(string("x")),
        );
        const admitted = "(".repeat(255) + "x" + ")".repeat(255);
        const admittedState = nested.parseState(admitted);
        expect({
            value: admittedState.value,
            offset: admittedState.offset,
            fault: admittedState.fault,
            liveDepth: admittedState.liveDepth,
            maxDepth: admittedState.maxDepth,
        }).toEqual({
            value: "x",
            offset: admitted.length,
            fault: undefined,
            liveDepth: 0,
            maxDepth: 256,
        });

        const source = "(".repeat(4_096) + "x" + ")".repeat(4_096);
        let fallbackCalls = 0;
        const fallback = new Parser<string>(state => {
            fallbackCalls++;
            return state.ok("fallback");
        });
        const rejected = seededState(source);
        nested.or(fallback).parser(rejected);
        expect({
            fallbackCalls,
            offset: rejected.offset,
            value: rejected.value,
            diagnostics: rejected.diagnostics,
            isError: rejected.isError,
            fault: rejected.fault,
            liveDepth: rejected.liveDepth,
            maxDepth: rejected.maxDepth,
        }).toEqual({
            fallbackCalls: 0,
            offset: 0,
            value: "seed",
            diagnostics: [markerDiagnostic],
            isError: true,
            fault: { kind: "Nesting", offset: 256, limit: 256 },
            liveDepth: 0,
            maxDepth: 256,
        });

        const thrownState = new ParserState("");
        const throwing = Parser.lazy(() =>
            new Parser(() => {
                throw new Error("hostile callback");
            }),
        );
        expect(() => throwing.parser(thrownState)).toThrow("hostile callback");
        expect(thrownState.liveDepth).toBe(0);
    });

    it("never converts a typed fault into mismatch or invokes later work", () => {
        const cases: Array<[string, (counts: number[]) => Parser<unknown>]> = [
            ["or", counts => hostileFault().or(counted(counts))],
            ["any", counts => any(hostileFault(), counted(counts))],
            ["all", counts => all(hostileFault(), counted(counts))],
            ["opt", () => hostileFault().opt()],
            ["many", () => hostileFault().many()],
            ["sepBy", counts => hostileFault().sepBy(counted(counts))],
            ["recover", counts => hostileFault().recover(counted(counts), "r")],
            ["mapError", counts => hostileFault().map(() => {
                counts[0]++;
                return "mapped";
            }, true)],
        ];

        for (const [name, makeParser] of cases) {
            const counts = [0];
            const state = seededState("?");
            makeParser(counts).parser(state);
            expect({
                calls: counts[0],
                offset: state.offset,
                value: state.value,
                diagnostics: state.diagnostics,
                fault: state.fault,
                isError: state.isError,
            }, name).toEqual({
                calls: 0,
                offset: 0,
                value: "seed",
                diagnostics: [markerDiagnostic],
                fault: { kind: "Nesting", offset: 1, limit: 256 },
                isError: true,
            });
        }
    });
});

function hostileFault() {
    return new Parser<string>(state => {
        state.offset++;
        state.unsafeSetValue("fault-value");
        state.diagnostics.push({ ...markerDiagnostic, offset: 1 });
        state.fault = { kind: "Nesting", offset: state.offset, limit: 256 };
        state.isError = true;
        return state;
    });
}

function counted(counts: number[]) {
    return new Parser<string>(state => {
        counts[0]++;
        return state.ok("counted");
    });
}
