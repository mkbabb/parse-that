import { bench, describe } from "vitest";
import { Parser, all, any } from "../../../../src/parse/index.js";
import { buildK, buildV, type Fixture, type Grammar, type Kernel } from "./kernel.js";
const choices = ["a", "b", "c", "d", "e", "f"], sequence = [..."abcdefghijkl"];
const choice6: Fixture = (g) => g.choice(...choices.map((text) => g.literal(text)));
const seq12: Fixture = (g) => g.seq(...sequence.map((text) => g.literal(text)));
const hostile: Fixture = (g) => g.choice(
    ...["v", "w", "x", "y", "z"].map((tail) =>
        g.seq(g.literal("a"), g.literal(tail))),
    g.literal("a"),
);
const recursive: Fixture = <P>(g: any) => {
    let rule!: P;
    rule = g.choice(
        g.seq(g.literal("("), g.lazy(() => rule), g.literal(")")),
        g.literal("x"),
    );
    return rule;
};
const direct = (fixture: Fixture): Parser<number> => fixture({
    literal: (text) => new Parser<number>((state) => {
        if (state.src.startsWith(text, state.offset)) return state.ok(1, text.length);
        const label = JSON.stringify(text);
        if (state.offset > state.furthest) {
            state.furthest = state.offset; state.expected = [label];
        } else if (!state.expected?.includes(label)) state.expected?.push(label);
        return state.err();
    }),
    seq: (...members) => all(...members).map(
        (values) => values.reduce((sum, value) => sum + value, 0),
    ),
    choice: (...arms) => any(...arms),
    lazy: (get) => Parser.lazy(get),
} satisfies Grammar<Parser<number>>);
const vChoice = buildV(choice6), kChoice = buildK(choice6), dChoice = direct(choice6);
const vSeq = buildV(seq12), kSeq = buildK(seq12), dSeq = direct(seq12);
const vHostile = buildV(hostile), kHostile = buildK(hostile), dHostile = direct(hostile);
let sink = 0, rotation = 0;
const valid = ["a", "d", "f"];
const warm = { time: 120, warmupTime: 60, iterations: 64, warmupIterations: 16 };
const deep = { time: 60, warmupTime: 20, iterations: 8, warmupIterations: 2 };
const consume = (kernel: Kernel, source: string) => {
    const out = kernel.parse(source);
    sink ^= out.offset + out.nodes + out.work;
};
const consumeDirect = (parser: Parser<number>, source: string) => {
    const out = parser.parseState(source);
    sink ^= out.offset + (out.isError ? 0 : out.value) + out.furthest + 1;
};
const gc = (globalThis as { gc?: () => void }).gc;
const measure = (make: () => unknown, count: number) => {
    gc?.(); const before = process.memoryUsage().heapUsed;
    const held = Array.from({ length: count }, make);
    gc?.(); sink ^= held.length;
    return (process.memoryUsage().heapUsed - before) / count;
};
console.log("P1-VK-ENV", JSON.stringify({
    node: process.version,
    v8: process.versions.v8,
    platform: `${process.platform}-${process.arch}`,
    vRetainedBytes: vChoice.retainedBytes,
    kConstructionUnits: kChoice.constructionUnits,
    empiricalBytes: gc ? {
        vGrammar: measure(() => buildV(choice6), 5_000),
        kGrammar: measure(() => buildK(choice6), 5_000),
        directGrammar: measure(() => direct(choice6), 5_000),
        vOutput: measure(() => vChoice.parse("f").nodes, 100_000),
        kOutput: measure(() => kChoice.parse("f").nodes, 100_000),
        directOutput: measure(() => dChoice.parseState("f").value, 100_000),
    } : "rerun with --expose-gc",
}));
for (const [v, k, d, source] of [
    [vChoice, kChoice, dChoice, "a"], [vChoice, kChoice, dChoice, "f"],
    [vChoice, kChoice, dChoice, "q"], [vHostile, kHostile, dHostile, "a"],
] as Array<[Kernel, Kernel, Parser<number>, string]>) {
    const vo = v.parse(source), ko = k.parse(source), state = d.parseState(source);
    const product = [state.offset, state.isError ? 0 : state.value, state.furthest,
        state.expected ?? []];
    if (JSON.stringify(product) !== JSON.stringify(
        [vo.offset, vo.nodes, vo.furthest, vo.expected],
    ) || JSON.stringify(product) !== JSON.stringify(
        [ko.offset, ko.nodes, ko.furthest, ko.expected],
    )) throw new Error(`unequal product ${source}: ${JSON.stringify(product)} / ${
        JSON.stringify([vo.offset, vo.nodes, vo.furthest, vo.expected])}`);
}
rotation = 0;
describe("construction/cold", () => {
    for (const [name, fixture] of [
        ["choice6", choice6], ["seq12", seq12], ["recursive", recursive],
    ] as const) {
        bench(`V construct ${name}`, () => { sink ^= buildV(fixture).constructionUnits; }, warm);
        bench(`K construct ${name}`, () => { sink ^= buildK(fixture).constructionUnits; }, warm);
    }
    bench("V cold valid", () => consume(buildV(choice6), "f"), warm);
    bench("K cold valid", () => consume(buildK(choice6), "f"), warm);
    bench("1.0 cold valid", () => consumeDirect(direct(choice6), "f"), warm);
});
describe("warm success/failure/transaction/optimizer", () => {
    bench("V rotating literals", () => consume(vChoice, valid[rotation++ % 3]), warm);
    bench("K rotating literals", () => consume(kChoice, valid[rotation++ % 3]), warm);
    bench("1.0 rotating literals", () => consumeDirect(dChoice, valid[rotation++ % 3]), warm);
    bench("V fixed sequence", () => consume(vSeq, "abcdefghijkl"), warm);
    bench("K fixed sequence", () => consume(kSeq, "abcdefghijkl"), warm);
    bench("1.0 fixed sequence", () => consumeDirect(dSeq, "abcdefghijkl"), warm);
    bench("V hostile late mismatch", () => consume(vSeq, "abcdefghijk!"), warm);
    bench("K hostile late mismatch", () => consume(kSeq, "abcdefghijk!"), warm);
    bench("1.0 hostile late mismatch", () => consumeDirect(dSeq, "abcdefghijk!"), warm);
    bench("V five checkpoints", () => consume(vHostile, "a"), warm);
    bench("K five checkpoints", () => consume(kHostile, "a"), warm);
    bench("1.0 five checkpoints", () => consumeDirect(dHostile, "a"), warm);
});
describe("recursion/memory", () => {
    for (const depth of [10, 1_000, 10_000]) {
        const source = "(".repeat(depth) + "x" + ")".repeat(depth);
        const v = buildV(recursive), k = buildK(recursive);
        bench(`V recursion ${depth}`, () => consume(v, source), deep);
        bench(`K recursion ${depth}`, () => consume(k, source), deep);
    }
    bench("V retain 100000 equal scalars", () => {
        const out = Array.from({ length: 100_000 }, () => vChoice.parse("f").nodes);
        sink ^= out[99_999];
    }, { iterations: 1, warmupIterations: 0, time: 0, warmupTime: 0 });
    bench("K retain 100000 equal scalars", () => {
        const out = Array.from({ length: 100_000 }, () => kChoice.parse("f").nodes);
        sink ^= out[99_999];
    }, { iterations: 1, warmupIterations: 0, time: 0, warmupTime: 0 });
});
