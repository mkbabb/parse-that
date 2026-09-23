import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import type {
    Parser,
    ParserState,
} from "../../../../src/parse/index.js";
import {
    choice,
    compile,
    literal,
    type Compiled,
    type Spanned,
} from "../s/kernel.js";

const baselineRoot = process.env.P2_BASELINE_ROOT;
const webrefPath = process.env.P2_WEBREF_CSS;
if (!baselineRoot) throw new Error("P2_BASELINE_ROOT is required");
if (!webrefPath) throw new Error("P2_WEBREF_CSS is required");

const api = await import(pathToFileURL(resolve(
    baselineRoot,
    "src/parse/index.ts",
)).href) as typeof import("../../../../src/parse/index.js");
const webrefBytes = readFileSync(webrefPath);
const entries = (JSON.parse(webrefBytes.toString("utf8")) as {
    properties: Array<{ name: string; legacyAliasOf?: string }>;
}).properties.filter(entry =>
    !entry.legacyAliasOf && !entry.name.startsWith("--")
);
if (entries.length !== 753) {
    throw new Error(`expected 753 canonical properties, received ${entries.length}`);
}

const order = (names: readonly string[]) => [...names].sort(
    (left, right) => right.length - left.length || left.localeCompare(right),
);
const allNames = order(entries.map(entry => entry.name));
const scales = [4, 8, 16, 33, 96, 753] as const;
const unicodeNames = order([
    "éclair", "Ωmega", "中-value", "😀-astral",
    "écho", "Ω-range", "中-axis", "😀-timeline",
]);

function sample(names: readonly string[], count: number): readonly string[] {
    if (count === names.length) return names;
    return order(Array.from({ length: count }, (_, index) =>
        names[Math.floor(index * (names.length - 1) / (count - 1))]
    ));
}

function spanned<T>(parser: Parser<T>): Parser<Spanned<T>> {
    return new api.Parser(state => {
        const start = state.offset;
        parser.parser(state);
        return state.isError
            ? state
            : state.ok({
                value: state.value,
                span: { start, end: state.offset },
            });
    });
}

function makeControl(names: readonly string[]): Parser<Spanned<string>> {
    return api.any(...names.map(name =>
        spanned(api.string(name))
    )).skip(api.eof());
}

function makeCandidate(names: readonly string[]): Compiled<Spanned<string>> {
    return compile(
        choice(...names.map(name => literal(name).spanned())).eof(),
    );
}

type StateView = Readonly<{
    value: unknown;
    offset: number;
    isError: boolean;
    furthest: number;
    expected?: readonly string[];
    diagnostics: readonly unknown[];
    fault?: unknown;
}>;

function view(state: StateView): StateView {
    return {
        value: state.value,
        offset: state.offset,
        isError: state.isError,
        furthest: state.furthest,
        expected: state.expected,
        diagnostics: state.diagnostics,
        fault: state.fault,
    };
}

function assertEqual(
    control: Parser<Spanned<string>>,
    candidate: Compiled<Spanned<string>>,
    sources: readonly string[],
): void {
    for (const source of [...sources, "~not-a-name"]) {
        const left = view(control.parseState(source) as StateView);
        const right = view(candidate.parseState(source) as StateView);
        if (!isDeepStrictEqual(left, right)) {
            throw new Error(`unequal product for ${JSON.stringify(source)}: ${
                JSON.stringify({ control: left, candidate: right })
            }`);
        }
    }
}

let blackhole: unknown;
function ns(fn: () => unknown, iterations: number): number {
    const started = performance.now();
    for (let index = 0; index < iterations; index++) blackhole = fn();
    return (performance.now() - started) * 1e6 / iterations;
}

function median(values: readonly number[]): number {
    return [...values].sort((left, right) => left - right)[values.length >> 1];
}

function compare(
    control: () => unknown,
    candidate: () => unknown,
    iterations: number,
    warm: number,
) {
    for (let index = 0; index < warm; index++) {
        blackhole = control();
        blackhole = candidate();
    }
    const controlBatches: number[] = [];
    const candidateBatches: number[] = [];
    const order: string[] = [];
    for (let batch = 0; batch < 11; batch++) {
        if ((batch & 1) === 0) {
            order.push("control/candidate");
            controlBatches.push(ns(control, iterations));
            candidateBatches.push(ns(candidate, iterations));
        } else {
            order.push("candidate/control");
            candidateBatches.push(ns(candidate, iterations));
            controlBatches.push(ns(control, iterations));
        }
    }
    const controlMedian = median(controlBatches);
    const candidateMedian = median(candidateBatches);
    return {
        control: { median: controlMedian, batches: controlBatches },
        candidate: { median: candidateMedian, batches: candidateBatches },
        ratio: controlMedian / candidateMedian,
        order,
    };
}

function retained(factory: () => unknown, count = 64) {
    if (!global.gc) return undefined;
    for (let index = 0; index < 8; index++) blackhole = factory();
    global.gc();
    const before = process.memoryUsage();
    const values = Array.from({ length: count }, factory);
    global.gc();
    const after = process.memoryUsage();
    blackhole = values;
    return {
        heapUsed: (after.heapUsed - before.heapUsed) / count,
        arrayBuffers: (after.arrayBuffers - before.arrayBuffers) / count,
        external: (after.external - before.external) / count,
    };
}

function rotate<T>(items: readonly T[], consume: (item: T) => unknown) {
    let cursor = 0;
    return () => consume(items[cursor++ % items.length]);
}

api.disableDiagnostics();
const rows = [];
const allocations = [];

for (const count of scales) {
    const names = sample(allNames, count);
    const sources = [
        names[0],
        names[Math.floor(names.length / 3)],
        names[Math.floor(2 * names.length / 3)],
        names[names.length - 1],
    ];
    const control = makeControl(names);
    const candidate = makeCandidate(names);
    assertEqual(control, candidate, sources);

    const iterations = count <= 8
        ? 2_000
        : count <= 33
            ? 500
            : count === 96
                ? 150
                : 20;
    const hotIterations = count <= 8
        ? 20_000
        : count <= 33
            ? 8_000
            : count === 96
                ? 2_000
                : 250;
    const shapeNames = Array.from({ length: 6 }, (_, shape) =>
        names.map(name => `${String.fromCharCode(97 + shape)}${name}`)
    );
    const controls = shapeNames.map(makeControl);
    const candidates = shapeNames.map(makeCandidate);
    const shapeSources = shapeNames.map(namesForShape =>
        namesForShape[namesForShape.length >> 1]
    );
    for (let index = 0; index < controls.length; index++) {
        assertEqual(controls[index], candidates[index], [shapeSources[index]]);
    }

    rows.push({
        count,
        construction: compare(
            () => makeControl(names),
            () => makeCandidate(names),
            iterations,
            Math.max(2, Math.floor(iterations / 20)),
        ),
        coldBuildAndParse: compare(
            () => makeControl(names).parseState(sources[0]),
            () => makeCandidate(names).parseState(sources[0]),
            iterations,
            Math.max(2, Math.floor(iterations / 20)),
        ),
        stabilizedHot: compare(
            rotate(sources, source => view(
                control.parseState(source) as StateView,
            )),
            rotate(sources, source => view(
                candidate.parseState(source) as StateView,
            )),
            hotIterations,
            hotIterations,
        ),
        alternatingShapes: compare(
            rotate(controls.map((parser, index) => () =>
                view(parser.parseState(shapeSources[index]) as StateView)
            ), run => run()),
            rotate(candidates.map((parser, index) => () =>
                view(parser.parseState(shapeSources[index]) as StateView)
            ), run => run()),
            hotIterations,
            hotIterations,
        ),
        failureHot: compare(
            () => view(control.parseState("~not-a-name") as StateView),
            () => view(candidate.parseState("~not-a-name") as StateView),
            hotIterations,
            hotIterations,
        ),
    });
    allocations.push({
        count,
        controlGrammar: retained(() => makeControl(names)),
        candidateGrammar: retained(() => makeCandidate(names)),
        controlResult: retained(() => control.parseState(sources[0])),
        candidateResult: retained(() => candidate.parseState(sources[0])),
    });
}

const unicodeControl = makeControl(unicodeNames);
const unicodeCandidate = makeCandidate(unicodeNames);
assertEqual(unicodeControl, unicodeCandidate, unicodeNames);
const unicode = {
    plan: unicodeCandidate.plan,
    hot: compare(
        rotate(unicodeNames, source =>
            view(unicodeControl.parseState(source) as StateView)
        ),
        rotate(unicodeNames, source =>
            view(unicodeCandidate.parseState(source) as StateView)
        ),
        10_000,
        10_000,
    ),
    coldBuildAndParse: compare(
        () => makeControl(unicodeNames).parseState(unicodeNames[0]),
        () => makeCandidate(unicodeNames).parseState(unicodeNames[0]),
        1_000,
        50,
    ),
};

const corpus = {
    package: "@webref/css@8.7.1",
    sourceSha256: createHash("sha256").update(webrefBytes).digest("hex"),
    namesSha256: createHash("sha256")
        .update(`${JSON.stringify(allNames)}\n`)
        .digest("hex"),
    count: allNames.length,
    names: allNames,
};
const output = {
    subject: "P2-C-cold-hot-dispatch",
    environment: {
        node: process.version,
        v8: process.versions.v8,
        platform: process.platform,
        arch: process.arch,
    },
    baseline: {
        root: baselineRoot,
        sha: "de36d57dccdd20068b8c11a78f6e83d42e7d681f",
    },
    samples: 11,
    scales,
    rows,
    unicode,
    allocations,
    corpus: {
        package: corpus.package,
        sourceSha256: corpus.sourceSha256,
        namesSha256: corpus.namesSha256,
        count: corpus.count,
    },
};

if (process.env.P2_C_OUTPUT) {
    writeFileSync(process.env.P2_C_OUTPUT, `${JSON.stringify(output)}\n`);
}
if (process.env.P2_C_CORPUS_OUTPUT) {
    writeFileSync(
        process.env.P2_C_CORPUS_OUTPUT,
        `${JSON.stringify(corpus)}\n`,
    );
}
console.log(JSON.stringify(output));
