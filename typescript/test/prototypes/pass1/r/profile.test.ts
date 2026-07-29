import { platform } from "node:os";
import { versions } from "node:process";
import { afterAll, beforeAll, bench, expect } from "vitest";
import { Parser as LegacyParser, ParserState, all, any, disableDiagnostics, enableDiagnostics, string } from "../../../../src/parse/index.js";
import { capture, choice, literal, parse, recover, seq } from "./kernel.js";
import type { Outcome, Parser } from "./kernel.js";

const options = { time: 100, iterations: 1_000 };
const letters = ["a", "b", "c", "d", "e", "z"] as const;
const baseChoice = any(...letters.map(string));
const runChoice = choice(...letters.map(text => literal(text)));
const baseSeq = all(...Array.from({ length: 12 }, () => string("a")));
const runSeq = seq(...Array.from({ length: 12 }, () => literal("a")));
const baseCapture = string("a").map(() => ({ start: 0, end: 1 }));
const runCapture = capture(literal("a"));
const recovery = recover(literal("ok"), literal("bad"), "recovered");
const hostile = choice(
    seq(recover(seq(literal("a"), literal("!")), literal("a?"), "r"), literal("z")),
    literal("a?"),
);
const sample = (fn: () => unknown) => () => { void fn(); };

function base<T>(parser: LegacyParser<T>, source: string) {
    const state = new ParserState(source);
    parser.parser(state);
    return {
        kind: state.isError ? "mismatch" : "ok",
        value: state.value,
        offset: state.offset,
        furthest: state.furthest,
        expected: state.expected ?? [],
    };
}
function product<T>(result: Outcome<T>) {
    return {
        kind: result.kind,
        value: result.value,
        offset: result.offset,
        furthest: result.furthest,
        expected: result.expected,
    };
}
function buildBase() {
    let nested!: LegacyParser<string>;
    nested = LegacyParser.lazy(() =>
        string("(").next(nested).skip(string(")")).or(string("x")),
    );
    return [any(...letters.map(string)), all(...Array.from({ length: 12 }, () => string("a"))), nested] as const;
}
function buildRun() {
    let nested!: Parser<unknown>;
    const recurse: Parser<unknown> = run => nested(run);
    nested = choice(seq(literal("("), recurse, literal(")")), literal("x"));
    return [choice(...letters.map(text => literal(text))), seq(...Array.from({ length: 12 }, () => literal("a"))), nested] as const;
}

beforeAll(() => {
    enableDiagnostics();
    expect(base(baseChoice, "z")).toEqual(product(parse(runChoice, "z")));
    expect(base(baseChoice, "x")).toEqual(product(parse(runChoice, "x")));
    expect(base(baseSeq, "a".repeat(12))).toEqual(product(parse(runSeq, "a".repeat(12))));
    expect(base(baseCapture, "a")).toEqual(product(parse(runCapture, "a")));
    console.info(JSON.stringify({ profile: "P1-R", node: versions.node, v8: versions.v8, platform: platform() }));
});
afterAll(disableDiagnostics);

bench("construction/1.0: 6-way + 12-seq + recursive", sample(buildBase), options);
bench("construction/P1-R: 6-way + 12-seq + recursive", sample(buildRun), options);
bench("cold/1.0: construct + late success", sample(() => base(buildBase()[0], "z")), options);
bench("cold/P1-R: construct + late success", sample(() => product(parse(buildRun()[0], "z"))), options);
let baseIndex = 0, runIndex = 0;
bench("warm success/1.0: rotating early-middle-late", sample(() => base(baseChoice, letters[[0, 2, 5][baseIndex++ % 3]])), options);
bench("warm success/P1-R: rotating early-middle-late", sample(() => product(parse(runChoice, letters[[0, 2, 5][runIndex++ % 3]]))), options);
bench("warm failure/1.0: six-way mismatch", sample(() => base(baseChoice, "x")), options);
bench("warm failure/P1-R: six-way mismatch", sample(() => product(parse(runChoice, "x"))), options);
bench("fixed sequence/1.0: 12 members", sample(() => base(baseSeq, "a".repeat(12))), options);
bench("fixed sequence/P1-R: 12 members", sample(() => product(parse(runSeq, "a".repeat(12)))), options);
bench("transaction/P1-R: five rejected arms", sample(() => parse(runChoice, "z")), options);
let recoveryIndex = 0;
bench("recovery/P1-R: 90 valid / 10 recovered", sample(() => parse(recovery, ++recoveryIndex % 10 ? "ok" : "bad")), options);
bench("recovery/P1-R: hostile outer rollback", sample(() => parse(hostile, "a?")), options);
bench("capture/1.0 equal span", sample(() => base(baseCapture, "a")), options);
bench("capture/P1-R equal span", sample(() => product(parse(runCapture, "a"))), options);
