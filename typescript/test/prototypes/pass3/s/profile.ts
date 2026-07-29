import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { serialize } from "node:v8";
import {
    all,
    Parser,
    ParserState,
    any,
    disableDiagnostics,
    enableDiagnostics,
    string,
} from "../../../../src/parse/index.js";
import {
    choice,
    compile,
    literal,
    resultFromState,
    sequence,
    type Compiled,
    type Spanned,
} from "./kernel.js";

const baselineRoot = process.env.P3_BASELINE_ROOT;
const baselineApi = baselineRoot
    ? await import(pathToFileURL(resolve(
        baselineRoot,
        "src/parse/index.ts",
    )).href) as typeof import("../../../../src/parse/index.js")
    : await import("../../../../src/parse/index.js");
const baselineState = (source: string) =>
    new baselineApi.ParserState<unknown>(source) as ParserState<unknown>;

// Evenly sampled from the 753 non-custom, non-alias properties in
// @webref/css 8.7.1 (frozen 2026-07-29 assay input).
const sampleProperties = [
    "-webkit-box-align", "-webkit-text-stroke", "alignment-baseline",
    "animation-delay-start", "animation-range-center", "backdrop-filter",
    "background-origin", "background-repeat-inline", "block-size",
    "bookmark-state", "border-block-end-radius", "border-block-start-width",
    "border-bottom-radius", "border-end-end-radius", "border-inline",
    "border-inline-end-width", "border-inline-width", "border-radius",
    "border-spacing", "border-top-radius", "box-shadow-blur", "break-before",
    "clip", "column-count", "column-rule-inset", "column-rule-inset-start",
    "contain", "container-type", "corner-block-start", "corner-end-end",
    "corner-left", "corner-start-start-shape", "counter-reset", "d",
    "event-trigger-source", "fill-position", "flex-direction", "float-offset",
    "font-family", "font-style", "font-variant-caps", "font-width", "grid-area",
    "grid-row-end", "hyphenate-character", "image-rendering", "inset",
    "interest-delay", "justify-self", "line-height", "list-style-type",
    "margin-inline-end", "marker-mid", "mask-border-slice", "mask-position",
    "max-height", "min-width", "object-view-box", "order", "overflow-anchor",
    "overflow-clip-margin-inline", "overflow-x", "padding", "padding-left",
    "path-length", "place-self", "position-try", "reading-order", "row-gap",
    "row-rule-inset-end", "ruby-align", "rule-inset-cap", "rule-width",
    "scroll-margin-block-end", "scroll-margin-top", "scroll-padding-inline-end",
    "scroll-target-group", "shape-inside", "spatial-navigation-function",
    "stroke-alignment", "stroke-dashoffset", "stroke-repeat", "text-anchor",
    "text-decoration-inset", "text-decoration-style", "text-group-align",
    "text-spacing", "timeline-scope", "timeline-trigger-name", "transition",
    "unicode-bidi", "view-transition-class", "voice-pitch", "widows",
    "wrap-before", "zoom",
] as const;

const webrefPath = process.env.P3_WEBREF_CSS;
const authoredProperties: readonly string[] = webrefPath
    ? (JSON.parse(readFileSync(webrefPath, "utf8")) as {
        properties: Array<{
            name: string;
            legacyAliasOf?: string;
        }>;
    }).properties
        .filter(entry => !entry.legacyAliasOf && !entry.name.startsWith("--"))
        .map(entry => entry.name)
    : sampleProperties;
const properties = [...authoredProperties].sort(
    (left, right) => right.length - left.length || left.localeCompare(right),
);
const fullCorpus = webrefPath !== undefined;
const shape = process.env.P3_PROFILE_SHAPE === "recovery"
    ? "recovery"
    : process.env.P3_PROFILE_SHAPE === "sequence"
        ? "sequence"
        : "terminal";
const opaque = Object.freeze({ kind: "opaque", source: "bad;" } as const);

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

function makeClosure(): Parser<unknown> {
    const terminal = baselineApi.any(
        ...properties.map(name => spanned(baselineApi.string(name))),
    );
    if (shape === "terminal") return terminal;
    const declaration: Parser<unknown> = baselineApi.all(
        terminal,
        spanned(baselineApi.string(":")),
    );
    return shape === "recovery"
        ? declaration.recover(baselineApi.string("bad;"), opaque)
        : declaration;
}

function makeOuterSpanClosure(): Parser<unknown> {
    const terminal = spanned(baselineApi.any(
        ...properties.map(baselineApi.string),
    ));
    if (shape === "terminal") return terminal;
    const declaration: Parser<unknown> = baselineApi.all(
        terminal,
        spanned(baselineApi.string(":")),
    );
    return shape === "recovery"
        ? declaration.recover(baselineApi.string("bad;"), opaque)
        : declaration;
}

function makeStaged(): Compiled<unknown> {
    const terminal = choice(...properties.map(name => literal(name).spanned()));
    if (shape === "terminal") {
        return compile(terminal) as unknown as Compiled<unknown>;
    }
    const declaration = sequence(terminal, literal(":").spanned());
    return (shape === "recovery"
        ? compile(declaration.recover(literal("bad;"), opaque))
        : compile(declaration)) as unknown as Compiled<unknown>;
}

const closure = makeClosure();
const staged = makeStaged();
const stagedBoundary = new Parser<unknown>(staged.parser);
const parseStaged = (source: string) => stagedBoundary.parseState(source);
const sources = properties.map((name, index) =>
    shape === "recovery" && index % 10 === 0
        ? "bad;"
        : shape === "terminal"
            ? name
            : `${name}:`
);
const late = sources.slice(-16);
let blackhole: unknown;

type Timing = Readonly<{
    median: number;
    min: number;
    max: number;
    iterations: number;
    samples: number;
    batches: readonly number[];
}>;

function summarize(values: readonly number[], iterations: number): Timing {
    const sorted = [...values].sort((left, right) => left - right);
    return {
        median: sorted[sorted.length >> 1],
        min: sorted[0],
        max: sorted[sorted.length - 1],
        iterations,
        samples: sorted.length,
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
    iterations = fullCorpus ? 20_000 : 50_000,
    samples = 11,
    warm = fullCorpus ? 20_000 : 50_000,
): Readonly<{
    closure: Timing;
    staged: Timing;
    order: readonly ("closure/staged" | "staged/closure")[];
}> {
    for (let index = 0; index < warm; index++) {
        blackhole = closureFn();
        blackhole = stagedFn();
    }
    const closureBatches: number[] = [];
    const stagedBatches: number[] = [];
    const order: ("closure/staged" | "staged/closure")[] = [];
    const stagedFirst = process.env.P3_PROFILE_FIRST === "staged";
    for (let batch = 0; batch < samples; batch++) {
        if ((batch % 2 === 0) === stagedFirst) {
            order.push("staged/closure");
            stagedBatches.push(time(stagedFn, iterations));
            closureBatches.push(time(closureFn, iterations));
        } else {
            order.push("closure/staged");
            closureBatches.push(time(closureFn, iterations));
            stagedBatches.push(time(stagedFn, iterations));
        }
    }
    return {
        closure: summarize(closureBatches, iterations),
        staged: summarize(stagedBatches, iterations),
        order,
    };
}

function retained(factory: () => unknown, count = 40) {
    if (!global.gc) return undefined;
    for (let index = 0; index < 4; index++) blackhole = factory();
    global.gc();
    const before = process.memoryUsage();
    const values = Array.from({ length: count }, factory);
    global.gc();
    const after = process.memoryUsage();
    blackhole = values[values.length - 1];
    return {
        heapUsed: (after.heapUsed - before.heapUsed) / count,
        arrayBuffers: (after.arrayBuffers - before.arrayBuffers) / count,
        external: (after.external - before.external) / count,
    };
}

function rotate<T>(values: readonly T[], parse: (value: T) => unknown) {
    let cursor = 0;
    return () => parse(values[cursor++ % values.length]);
}

function snapshot(state: ParserState<unknown>) {
    return {
        value: state.value,
        offset: state.offset,
        isError: state.isError,
        furthest: state.furthest,
        expected: state.expected,
        diagnostics: state.diagnostics,
    };
}

function parseRaw<T>(
    parser: (state: ParserState<T>) => unknown,
    source: string,
    createState: (source: string) => ParserState<T> =
        value => new ParserState<T>(value),
) {
    const state = createState(source);
    parser(state);
    return state;
}

function disableAllDiagnostics(): void {
    disableDiagnostics();
    baselineApi.disableDiagnostics();
}

function enableAllDiagnostics(): void {
    enableDiagnostics();
    baselineApi.enableDiagnostics();
}

disableAllDiagnostics();
for (const source of [...sources, "not-a-property"]) {
    const expected = snapshot(closure.parseState(source));
    const actualState = parseStaged(source);
    const actual = snapshot(actualState);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`unequal product for ${source}`);
    }
    if (source === "not-a-property" || source === "bad;") continue;
    const name = shape === "terminal" ? source : source.slice(0, -1);
    const head = shape === "terminal"
        ? actualState.value as Spanned<string>
        : (actualState.value as [Spanned<string>, Spanned<string>])[0];
    if (
        actualState.isError
        || actualState.offset !== source.length
        || head.value !== name
        || head.span.start !== 0
        || head.span.end !== name.length
    ) {
        throw new Error(`not a whole-name success for ${source}`);
    }
}

const construction = samplePair(
    makeClosure,
    makeStaged,
    fullCorpus ? 25 : 250,
    7,
    fullCorpus ? 10 : 25,
);
const rotating = samplePair(
    rotate(sources, source => closure.parseState(source)),
    rotate(sources, parseStaged),
);
const internal = samplePair(
    rotate(sources, source => parseRaw(closure.parser, source)),
    rotate(sources, source => parseRaw(staged.parser, source)),
);
const result = samplePair(
    rotate(sources, source => resultFromState(
        closure.parseState(source) as ParserState<unknown>,
    )),
    rotate(sources, source => resultFromState(parseStaged(source))),
);
const lateResult = samplePair(
    rotate(late, source => closure.parseState(source)),
    rotate(late, parseStaged),
);
const failure = samplePair(
    () => closure.parseState("not-a-property"),
    () => parseStaged("not-a-property"),
);

enableAllDiagnostics();
const diagnosticSources = shape === "recovery"
    ? ["bad;"]
    : shape === "sequence"
        ? properties.map(name => `${name}!`)
        : ["not-a-property"];
for (const source of diagnosticSources) {
    const expected = snapshot(parseRaw(
        closure.parser,
        source,
        baselineState,
    ));
    const actual = snapshot(parseRaw(staged.parser, source));
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`unequal diagnostic product for ${source}`);
    }
}
const diagnosticFailure = samplePair(
    rotate(diagnosticSources, source => parseRaw(
        closure.parser,
        source,
        baselineState,
    )),
    rotate(diagnosticSources, source => parseRaw(staged.parser, source)),
    fullCorpus ? 100 : 5_000,
);
disableAllDiagnostics();

const example = parseStaged(sources[sources.length - 1]);
const retainedClosure = retained(makeClosure);
const retainedOuterSpanClosure = retained(makeOuterSpanClosure);
const retainedStaged = retained(makeStaged);
const raw = {
    metadata: {
        node: process.versions.node,
        v8: process.versions.v8,
        platform: process.platform,
        arch: process.arch,
        shape,
        webref: {
            package: "@webref/css",
            version: "8.7.1",
            canonicalProperties: 753,
            assayedProperties: properties.length,
            source: fullCorpus ? webrefPath : "frozen-even-sample",
        },
        choiceOrder: "longest-first, then lexical",
        timingBoundary: "Parser.parseState for both sides",
        baseline: {
            root: baselineRoot ?? "current checkout",
            sha: process.env.P3_BASELINE_SHA ?? "current checkout",
        },
    },
    unit: "ns/op",
    plan: staged.plan,
    semanticsDigest: serialize(snapshot(example)).toString("hex"),
    planes: {
        construction,
        rotating,
        internal,
        result,
        late: lateResult,
        failure,
        diagnosticFailure,
    },
    retained: {
        authoredSpanClosure: retainedClosure,
        outerSpanClosure: retainedOuterSpanClosure,
        staged: retainedStaged,
    },
    ratios: {
        rotating: rotating.closure.median / rotating.staged.median,
        internal: internal.closure.median / internal.staged.median,
        result: result.closure.median / result.staged.median,
        late: lateResult.closure.median / lateResult.staged.median,
        failure: failure.closure.median / failure.staged.median,
        diagnosticFailure:
            diagnosticFailure.closure.median
            / diagnosticFailure.staged.median,
        construction:
            construction.staged.median / construction.closure.median,
        constructionAmortizationParses:
            (construction.staged.median - construction.closure.median)
            / (rotating.closure.median - rotating.staged.median),
    },
};
console.log(JSON.stringify(raw));
