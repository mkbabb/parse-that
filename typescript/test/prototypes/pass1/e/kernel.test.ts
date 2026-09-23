import { describe, expect, expectTypeOf, it } from "vitest";
import { capture, choice, literal, runProjected, runRecognition, select, seq, type Kernel, type Span } from "./kernel.js";
const exact = seq(
    literal("u", undefined),
    literal("f", false),
    literal("z", 0),
    literal("e", ""),
    capture(literal("😀", "discarded")),
);
function fiveWay() {
    const register = choice(
        literal("0", undefined, 0),
        literal("1", undefined, 1),
        literal("2", undefined, 2),
        literal("3", undefined, 3),
        literal("4", undefined, 4),
    );
    return select(register, [
        literal("A", "alpha"),
        literal("B", "bravo"),
        literal("C", "charlie"),
        literal("D", "delta"),
        literal("E", "echo"),
    ] as const);
}
describe("P1-E columnar recognition and projection", () => {
    it("keeps projected and recognition-only evidence identical on every fixture", () => {
        const parser = choice(exact, seq(literal("q", 0), capture(literal("x", ""))));
        for (const source of ["ufze😀", "qx", "ufzeX", "nothing"]) {
            const projected = runProjected(parser, source);
            const recognized = runRecognition(parser, source);
            expect({
                ok: projected.ok,
                offset: projected.offset,
                furthest: projected.furthest,
                work: projected.work,
            }).toEqual({
                ok: recognized.ok,
                offset: recognized.offset,
                furthest: recognized.furthest,
                work: recognized.work,
            });
            expect(recognized.eventCount).toBe(0);
        }
    });

    it("truncates rejected events while failure and work remain monotone", () => {
        const parser = choice(
            seq(capture(literal("a", "")), literal("x", "")),
            seq(capture(literal("a", "")), literal("c", "")),
        );
        expect(runProjected(parser, "ac")).toMatchObject({
            ok: true,
            offset: 2,
            furthest: 1,
            work: 4,
            eventCount: 2,
            value: [{ start: 0, end: 1 }, ""],
        });
    });

    it("retains the corrected checkpoint frontier after outer rollback", () => {
        const rejected = seq(
            literal("a", ""),
            literal("?", ""),
            literal("z", ""),
        );
        const parser = seq(choice(rejected, literal("a", "")), literal("!", ""));
        expect(runProjected(parser, "a?x")).toMatchObject({
            ok: false,
            offset: 0,
            furthest: 2,
            eventCount: 0,
        });
    });

    it("projects every exact tuple slot, including undefined and falsy values", () => {
        const result = runProjected(exact, "ufze😀");
        expect(result).toMatchObject({
            ok: true,
            offset: 6,
            value: [undefined, false, 0, "", { start: 4, end: 6 }],
        });
        if (!result.ok) throw new Error("fixture must succeed");
        expectTypeOf(result.value).toEqualTypeOf<
            readonly [undefined, false, 0, "", Span]
        >();
    });

    it("keeps nested captures as UTF-16 offsets and sink mode materializes nothing", () => {
        const nested = capture(seq(
            literal("A", ""),
            capture(literal("😀", "")),
            literal("B", ""),
        ));
        expect(runProjected(nested, "A😀B")).toMatchObject({
            value: { start: 0, end: 4 },
            eventCount: 1,
        });
        expect(runRecognition(nested, "A😀B")).toEqual({
            ok: true,
            offset: 4,
            furthest: -1,
            work: 4,
            eventCount: 0,
            journalPeak: 0,
        });
    });

    it("selects five prebuilt parsers from the one eager scalar", () => {
        const parser = fiveWay();
        for (const [source, value] of [
            ["0A", "alpha"],
            ["1B", "bravo"],
            ["2C", "charlie"],
            ["3D", "delta"],
            ["4E", "echo"],
        ]) {
            expect(runProjected(parser, source)).toMatchObject({
                ok: true,
                offset: 2,
                eventCount: 1,
                value,
            });
        }
    });

    it("names the arbitrary .chain(value => parser) counterexample: unbounded length prefix", () => {
        type HasArbitraryChain = "chain" extends keyof Kernel<unknown> ? true : false;
        const hasArbitraryChain: HasArbitraryChain = false;
        const bounded = fiveWay();
        const arbitraryChainValueToParser = (count: number) =>
            literal("F".repeat(count), "");

        expect(hasArbitraryChain).toBe(false);
        expect(runRecognition(arbitraryChainValueToParser(5), "FFFFF").ok).toBe(true);
        expect(runRecognition(bounded, "5FFFFF")).toMatchObject({
            ok: false,
            offset: 0,
        });
        // Expressing `count => literal("F".repeat(count), ...)` would require
        // a general semantic value and parser construction during this run.
    });

    it("retains output byte-for-byte equal to the direct closure fixture", () => {
        const closureFixture = (): readonly [undefined, false, 0, "", Span] =>
            [undefined, false, 0, "", { start: 4, end: 6 }];
        const result = runProjected(exact, "ufze😀");
        if (!result.ok) throw new Error("fixture must succeed");
        expect(JSON.stringify(result.value)).toBe(JSON.stringify(closureFixture()));
    });

    it("isolates source, event, and result data across sequential runs", () => {
        const first = runProjected(exact, "ufze😀");
        const second = runProjected(exact, "ufze😀");
        if (!first.ok || !second.ok) throw new Error("fixtures must succeed");
        expect(first.value).not.toBe(second.value);
        expect(first.value[4]).not.toBe(second.value[4]);
        (first.value[4] as Span).end = 0;
        expect(second.value[4]).toEqual({ start: 4, end: 6 });
        expect(runRecognition(exact, "bad")).toMatchObject({ ok: false, offset: 0 });
        expect(runProjected(exact, "ufze😀")).toMatchObject({ ok: true, offset: 6 });
    });
});
