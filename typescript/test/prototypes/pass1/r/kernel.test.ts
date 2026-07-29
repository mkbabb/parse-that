import { describe, expect, expectTypeOf, it } from "vitest";
import { capture, choice, literal, parse, recover, seq } from "./kernel.js";
import type { Parser, Span } from "./kernel.js";

const recovering = () =>
    recover(seq(literal("a"), literal("!")), literal("a?"), "recovered");

describe("P1-R run-owned journaled closures", () => {
    it("meets the corrected born-RED a?x checkpoint law", () => {
        const rejected = seq(recovering(), literal("z"));
        const parser = seq(choice(rejected, literal("a")), literal("!"));
        const result = parse(parser, "a?x", { initial: "seed" });
        expect({
            offset: result.offset,
            value: result.value,
            isError: result.isError,
            furthest: result.furthest,
            expected: result.expected,
            diagnostics: result.diagnostics.length,
        }).toEqual({
            offset: 0,
            value: "seed",
            isError: true,
            furthest: 2,
            expected: ['"z"'],
            diagnostics: 0,
        });
    });

    it("truncates a nested recovery when its outer branch loses", () => {
        const parser = choice(
            seq(recovering(), literal("z")),
            literal("a?"),
        );
        const result = parse(parser, "a?");
        expect(result.kind).toBe("ok");
        expect(result.value).toBe("a?");
        expect(result.diagnostics).toEqual([]);
        expect(result.furthest).toBe(2);
        expect(result.expected).toEqual(['"z"']);
    });

    it("joins tied frontier labels once", () => {
        const result = parse(
            choice(literal("a"), literal("b"), literal("a")),
            "x",
        );
        expect(result).toMatchObject({
            kind: "mismatch",
            offset: 0,
            furthest: 0,
            expected: ['"a"', '"b"'],
            work: 3,
        });
    });

    it("keeps work monotone through five rejected alternatives", () => {
        const result = parse(
            choice(
                literal("a"),
                literal("b"),
                literal("c"),
                literal("d"),
                literal("e"),
                literal("z"),
            ),
            "z",
        );
        expect(result.kind).toBe("ok");
        expect(result.work).toBe(6);
        expect(result.expected).toEqual([
            '"a"',
            '"b"',
            '"c"',
            '"d"',
            '"e"',
        ]);
    });

    it("retains exact falsy slots, tuple type, and numeric capture", () => {
        const parser = seq(
            literal("u", undefined),
            literal("f", false),
            literal("0", 0),
            literal("s", ""),
            capture(literal("e")),
        );
        const result = parse(parser, "uf0se");
        if (result.kind !== "ok") throw new Error("fixture must succeed");
        expectTypeOf(result.value).toEqualTypeOf<
            [undefined, false, 0, "", Span]
        >();
        expect(result.value).toEqual([
            undefined,
            false,
            0,
            "",
            { start: 4, end: 5 },
        ]);
        expect(result.captures).toEqual([{ start: 4, end: 5 }]);
        expect(typeof result.value[4].start).toBe("number");
        expect(typeof result.value[4].end).toBe("number");
    });

    it("isolates two nested and two sequential runs completely", () => {
        const nested: unknown[] = [];
        const invocations: unknown[] = [];
        const atom = literal("a");
        const nesting: Parser<string> = run => {
            nested.push(parse(recovering(), "a?"));
            const answer = atom(run);
            invocations.push(answer);
            return answer;
        };
        const first = parse(nesting, "a");
        const second = parse(nesting, "a");
        expect(first).not.toBe(second);
        expect(invocations[0]).not.toBe(invocations[1]);
        expect(first.diagnostics).not.toBe(second.diagnostics);
        expect((nested[0] as typeof first).diagnostics).not.toBe(
            (nested[1] as typeof first).diagnostics,
        );
        expect((nested[0] as typeof first).diagnostics).toHaveLength(1);
        expect(first.diagnostics).toEqual([]);
        expect(Object.isFrozen(atom)).toBe(true);
        expect("state" in atom || "memo" in atom || "result" in atom).toBe(false);
    });

    it("turns a result replayed into another run into a typed fault", () => {
        const atom = literal("a");
        let stale: ReturnType<typeof atom> | undefined;
        const replay: Parser<string> = run => (stale ??= atom(run));
        expect(parse(replay, "a").kind).toBe("ok");
        expect(parse(replay, "a")).toMatchObject({
            kind: "fault",
            offset: 0,
            fault: { kind: "ForeignResult", offset: 0 },
        });
    });

    it("faults a recovery whose sync succeeds without progress", () => {
        const result = parse(
            recover(literal("a"), literal(""), "recovered"),
            "x",
        );

        expect(result).toMatchObject({
            kind: "fault",
            offset: 0,
            fault: { kind: "RecoveryNonProgress", offset: 0 },
        });
        expect(result.diagnostics).toEqual([]);
    });

    it("returns a configured nesting fault before approaching host limits", () => {
        let nested!: Parser<unknown>;
        const recurse: Parser<unknown> = run => nested(run);
        nested = choice(
            seq(literal("("), recurse, literal(")")),
            literal("x"),
        );
        const depth = 10_000;
        const result = parse(
            nested,
            "(".repeat(depth) + "x" + ")".repeat(depth),
            { maxDepth: 32 },
        );

        if (result.kind !== "fault") throw new Error("fixture must fault");
        expect(result.fault).toMatchObject({ kind: "Nesting", limit: 32 });
        expect(result.maxDepth).toBe(32);
        expect(result.offset).toBe(0);
        expect(result.work).toBeGreaterThan(0);
    });
});
