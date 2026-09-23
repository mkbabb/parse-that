import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import {
    Parser,
    ParserState,
    disableDiagnostics,
    enableDiagnostics,
} from "../../../../src/parse/index.js";
import {
    choice,
    compile,
    lazy,
    literal,
    sequence,
    type Compiled,
    type Grammar,
    type Spanned,
} from "./kernel.js";
import { createResultProjector } from "./result.js";
import { RunState, type StagedState } from "./run-state.js";

const baselineRoot = process.env.P3_BASELINE_ROOT;
if (!baselineRoot) throw new Error("P3_BASELINE_ROOT is required");
const baselineApi = await import(pathToFileURL(resolve(
    baselineRoot,
    "src/parse/index.ts",
)).href) as typeof import("../../../../src/parse/index.js");
const depth = Number(process.env.P3_RECURSION_DEPTH ?? 16);
if (!Number.isSafeInteger(depth) || depth < 0 || depth > 255) {
    throw new RangeError("P3_RECURSION_DEPTH must be an integer from 0 to 255");
}
const leafCount = Number(process.env.P3_RECURSION_LEAVES ?? 1);
const family = process.env.P3_RECURSION_FAMILY === "generic"
    ? "generic"
    : "fused";
const webrefPath = process.env.P3_WEBREF_CSS;
const corpus = webrefPath
    ? (JSON.parse(readFileSync(webrefPath, "utf8")) as {
        properties: Array<{ name: string; legacyAliasOf?: string }>;
    }).properties
        .filter(entry => !entry.legacyAliasOf && !entry.name.startsWith("--"))
        .map(entry => entry.name)
    : ["x"];
if (
    !Number.isSafeInteger(leafCount)
    || leafCount < 1
    || leafCount > corpus.length
) {
    throw new RangeError("P3_RECURSION_LEAVES exceeds the frozen corpus");
}
const leaves = (leafCount === corpus.length
    ? corpus
    : Array.from(
        { length: leafCount },
        (_, index) => corpus[Math.floor(index * corpus.length / leafCount)],
    )
).sort((left, right) => right.length - left.length || left.localeCompare(right));

function spanned<T>(parser: Parser<T>): Parser<Spanned<T>> {
    return new baselineApi.Parser(state => {
        const start = state.offset;
        parser.parser(state);
        if (state.isError) return state;
        return state.ok({
            value: state.value,
            span: { start, end: state.offset },
        });
    });
}

function makeClosure(): Parser<Spanned<string>> {
    let nested!: Parser<Spanned<string>>;
    nested = baselineApi.Parser.lazy(() => baselineApi.any(
        baselineApi.all(
            baselineApi.string("("),
            nested,
            baselineApi.string(")"),
        ).map(parts => parts[1]),
        baselineApi.any(...leaves.map(name =>
            spanned(baselineApi.string(name))
        )),
    )) as Parser<Spanned<string>>;
    return nested;
}

function makeStaged(): Compiled<Spanned<string>> {
    let nested!: Grammar<Spanned<string>>;
    const recurse = () => lazy(() => nested);
    nested = choice(
        family === "fused"
            ? literal("(").next(recurse()).skip(literal(")"))
            : sequence(literal("("), recurse(), literal(")"))
                .map(parts => parts[1]),
        choice(...leaves.map(name =>
            literal(name).spanned()
        )),
    );
    return compile(lazy(() => nested));
}

const closure = makeClosure();
const staged = makeStaged();
const successes = leaves.map(name =>
    "(".repeat(depth) + name + ")".repeat(depth)
);
const failure = "(".repeat(depth) + "not-a-property";
const projectClosure = createResultProjector();
const projectStaged = createResultProjector(true);
let blackhole: unknown;

type Timing = Readonly<{
    median: number;
    min: number;
    max: number;
    batches: readonly number[];
}>;

function summarize(values: readonly number[]): Timing {
    const sorted = [...values].sort((left, right) => left - right);
    return {
        median: sorted[sorted.length >> 1],
        min: sorted[0],
        max: sorted[sorted.length - 1],
        batches: values,
    };
}

function time(fn: () => unknown, iterations: number): number {
    const start = performance.now();
    for (let index = 0; index < iterations; index++) blackhole = fn();
    return (performance.now() - start) * 1e6 / iterations;
}

function samplePair(
    closureFn: () => unknown,
    stagedFn: () => unknown,
    iterations = Math.max(500, Math.floor(80_000 / (depth + 1))),
    samples = 11,
): Readonly<{ closure: Timing; staged: Timing; ratio: number }> {
    for (let index = 0; index < iterations; index++) {
        blackhole = closureFn();
        blackhole = stagedFn();
    }
    const closureBatches: number[] = [];
    const stagedBatches: number[] = [];
    const stagedFirst = process.env.P3_PROFILE_FIRST === "staged";
    for (let batch = 0; batch < samples; batch++) {
        if ((batch % 2 === 0) === stagedFirst) {
            stagedBatches.push(time(stagedFn, iterations));
            closureBatches.push(time(closureFn, iterations));
        } else {
            closureBatches.push(time(closureFn, iterations));
            stagedBatches.push(time(stagedFn, iterations));
        }
    }
    const closureTiming = summarize(closureBatches);
    const stagedTiming = summarize(stagedBatches);
    return {
        closure: closureTiming,
        staged: stagedTiming,
        ratio: closureTiming.median / stagedTiming.median,
    };
}

function rotate<T>(
    values: readonly T[],
    consume: (value: T) => unknown,
): () => unknown {
    let cursor = 0;
    return () => consume(values[cursor++ % values.length]);
}

function snapshot(state: Pick<
    StagedState<Spanned<string>>,
    | "value"
    | "offset"
    | "isError"
    | "furthest"
    | "expected"
    | "diagnostics"
>) {
    return {
        value: state.value,
        offset: state.offset,
        isError: state.isError,
        furthest: state.furthest,
        expected: state.expected,
        diagnostics: state.diagnostics,
    };
}

function assertEqual(source: string): void {
    const expected = snapshot(closure.parseState(source));
    const actual = snapshot(staged.parseState(source));
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(JSON.stringify({ source, expected, actual }));
    }
}

disableDiagnostics();
baselineApi.disableDiagnostics();
for (const success of successes) {
    assertEqual(success);
}
assertEqual(failure);

const successPlane = samplePair(
    rotate(successes, source => closure.parseState(source)),
    rotate(successes, source => staged.parseState(source)),
);
const internalPlane = samplePair(
    rotate(successes, source => {
        const state = new baselineApi.ParserState<Spanned<string>>(source);
        closure.parser(state);
        return state;
    }),
    rotate(successes, source => {
        const state = new RunState<Spanned<string>>(source);
        staged.parser(state);
        return state;
    }),
);
const resultPlane = samplePair(
    rotate(successes, source => projectClosure(
        closure.parseState(source) as ParserState<Spanned<string>>,
    )),
    rotate(successes, source => projectStaged(staged.parseState(source))),
);
const failurePlane = samplePair(
    () => closure.parseState(failure),
    () => staged.parseState(failure),
);

enableDiagnostics();
baselineApi.enableDiagnostics();
assertEqual(failure);
const diagnosticFailurePlane = samplePair(
    () => {
        const state = new baselineApi.ParserState<Spanned<string>>(failure);
        closure.parser(state);
        return state;
    },
    () => {
        const state = new RunState<Spanned<string>>(failure);
        staged.parser(state);
        return state;
    },
    Math.max(250, Math.floor(20_000 / (depth + 1))),
);
disableDiagnostics();
baselineApi.disableDiagnostics();

const nesting = staged.parseState("(".repeat(4_096));
if (
    nesting.fault?.kind !== "Nesting"
    || nesting.liveDepth !== 0
    || nesting.maxDepth !== 256
) {
    throw new Error(`invalid nesting boundary: ${JSON.stringify(nesting)}`);
}

const output = `${JSON.stringify({
    metadata: {
        node: process.versions.node,
        v8: process.versions.v8,
        depth,
        leaves: leaves.length,
        family,
        webref: webrefPath,
        baseline: {
            root: baselineRoot,
            sha: process.env.P3_BASELINE_SHA,
        },
        boundary: "equal recursive value/offset/frontier/labels/diagnostics",
    },
    semantics: {
        success: snapshot(staged.parseState(successes[0])),
        failure: snapshot(staged.parseState(failure)),
        nesting: {
            offset: nesting.offset,
            fault: nesting.fault,
            liveDepth: nesting.liveDepth,
            maxDepth: nesting.maxDepth,
        },
    },
    planes: {
        success: successPlane,
        internal: internalPlane,
        result: resultPlane,
        failure: failurePlane,
        diagnosticFailure: diagnosticFailurePlane,
    },
})}\n`;
if (process.env.P3_PROFILE_OUTPUT) {
    writeFileSync(process.env.P3_PROFILE_OUTPUT, output);
} else {
    process.stdout.write(output);
}
