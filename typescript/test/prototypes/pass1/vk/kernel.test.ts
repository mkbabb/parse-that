import { describe, expect, it } from "vitest";
import { Parser, all, any, string } from "../../../../src/parse/index.js";
import { buildK, buildV, type Fixture, type Outcome } from "./kernel.js";
const nested: Fixture = <P>(g: Parameters<Fixture>[0] extends never ? never : any) => {
    let rule!: P;
    rule = g.choice(
        g.seq(g.literal("("), g.lazy(() => rule), g.literal(")")),
        g.literal("x"),
    );
    return rule;
};
const mutual: Fixture = <P>(g: any) => {
    let a!: P;
    let b!: P;
    a = g.choice(g.seq(g.literal("a"), g.lazy(() => b)), g.literal("x"));
    b = g.choice(g.seq(g.literal("b"), g.lazy(() => a)), g.literal("y"));
    return a;
};
const hostile: Fixture = (g) => g.choice(
    ...["v", "w", "x", "y", "z"].map((tail) =>
        g.seq(g.literal("a"), g.literal(tail))),
    g.literal("a"),
);
const stalled: Fixture = <P>(g: any) => {
    let loop!: P;
    loop = g.lazy(() => loop);
    return loop;
};
const product = (outcome: Outcome) => ({
    status: outcome.status, offset: outcome.offset, nodes: outcome.nodes,
    furthest: outcome.furthest, expected: outcome.expected, work: outcome.work,
    liveDepth: outcome.liveDepth, maxDepth: outcome.maxDepth, fault: outcome.fault,
});
const pair = (fixture: Fixture, source: string, limit?: number) => {
    const v = buildV(fixture).parse(source, limit);
    const k = buildK(fixture).parse(source, limit);
    expect(product(k)).toEqual(product(v));
    return [v, k] as const;
};
describe("P1-VK explicit control", () => {
    it.each([10, 1_000, 10_000])(
        "parses nested depth %i without the host stack",
        (depth) => {
            const source = "(".repeat(depth) + "x" + ")".repeat(depth);
            const [v] = pair(nested, source);
            expect(v).toMatchObject({
                status: "success",
                offset: source.length,
                nodes: depth * 2 + 1,
                maxDepth: depth + 1,
                liveDepth: 0,
            });
        },
    );
    it("returns equal typed Nesting faults before the configured limit", () => {
        const source = "(".repeat(100) + "x" + ")".repeat(100);
        const [v] = pair(nested, source, 32);
        expect(v).toMatchObject({
            status: "fault",
            fault: { kind: "Nesting", offset: 32 },
            maxDepth: 32,
            liveDepth: 0,
        });
    });
    it("returns a typed Progress fault for non-advancing recursion", () => {
        const [v] = pair(stalled, "");
        expect(v).toMatchObject({
            status: "fault",
            fault: { kind: "Progress", offset: 0 },
        });
    });
    it("keeps failure/work/depth evidence while rolling back hostile arms", () => {
        const [v] = pair(hostile, "a");
        expect(v).toMatchObject({
            status: "success",
            offset: 1,
            nodes: 1,
            furthest: 1,
            expected: ['"v"', '"w"', '"x"', '"y"', '"z"'],
            work: 11,
            maxDepth: 1,
        });
    });
    it("matches cursor, count, frontier, and depth on mismatch", () => {
        const [v] = pair(nested, "(((q");
        expect(v).toMatchObject({
            status: "mismatch",
            offset: 0,
            nodes: 0,
            furthest: 3,
            expected: ['"("', '"x"'],
            liveDepth: 0,
        });
    });
    it("supports consuming mutual recursion with an equal product", () => {
        const [v] = pair(mutual, "ababx");
        expect(v).toMatchObject({
            status: "success",
            offset: 5,
            nodes: 5,
            maxDepth: 5,
        });
    });
    it("reports route-specific execution instrumentation", () => {
        const [v, k] = pair(nested, "((x))");
        expect(v.metrics).toMatchObject({
            kind: "V",
            dispatches: expect.any(Number),
            calls: expect.any(Number),
            instructionPeak: expect.any(Number),
            callPeak: expect.any(Number),
            choicePeak: expect.any(Number),
        });
        expect(k.metrics).toMatchObject({
            kind: "K",
            bounces: expect.any(Number),
            transientAllocations: 6,
            executionContainers: 6,
        });
    });
    it("equals the direct 1.0 closure result on shallow nesting", () => {
        let direct!: Parser<number>;
        direct = any(
            all(string("("), Parser.lazy(() => direct), string(")"))
                .map((parts) => parts[1] + 2),
            string("x").map(() => 1),
        );
        const depth = 10;
        const source = "(".repeat(depth) + "x" + ")".repeat(depth);
        const [v, k] = pair(nested, source);
        expect([v.nodes, k.nodes]).toEqual([direct.parse(source), direct.parse(source)]);
    });
});
