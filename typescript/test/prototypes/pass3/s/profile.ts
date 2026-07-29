import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
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
    sequence,
    type Compiled,
    type Spanned,
} from "./kernel.js";

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
const properties: readonly string[] = webrefPath
    ? (JSON.parse(readFileSync(webrefPath, "utf8")) as {
        properties: Array<{
            name: string;
            legacyAliasOf?: string;
        }>;
    }).properties
        .filter(entry => !entry.legacyAliasOf && !entry.name.startsWith("--"))
        .map(entry => entry.name)
    : sampleProperties;
const fullCorpus = webrefPath !== undefined;
const shape = process.env.P3_PROFILE_SHAPE === "sequence"
    ? "sequence"
    : "terminal";

function spanned<T>(parser: Parser<T>): Parser<Spanned<T>> {
    return new Parser(state => {
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
    const terminal = any(...properties.map(name => spanned(string(name))));
    return shape === "sequence"
        ? all(terminal, spanned(string(":")))
        : terminal;
}

function makeStaged(): Compiled<unknown> {
    const terminal = choice(...properties.map(name => literal(name).spanned()));
    return (shape === "sequence"
        ? compile(sequence(terminal, literal(":").spanned()))
        : compile(terminal)) as unknown as Compiled<unknown>;
}

const closure = makeClosure();
const staged = makeStaged();
const sources = properties.map(name => shape === "sequence" ? `${name}:` : name);
const late = sources.slice(-16);
let blackhole: unknown;

type Timing = Readonly<{
    median: number;
    min: number;
    max: number;
    iterations: number;
    samples: number;
}>;

function sample(
    fn: () => unknown,
    iterations = fullCorpus ? 20_000 : 50_000,
    samples = 11,
    warm = fullCorpus ? 20_000 : 50_000,
): Timing {
    for (let index = 0; index < warm; index++) blackhole = fn();
    const values: number[] = [];
    for (let batch = 0; batch < samples; batch++) {
        const start = performance.now();
        for (let index = 0; index < iterations; index++) blackhole = fn();
        values.push((performance.now() - start) * 1e6 / iterations);
    }
    values.sort((left, right) => left - right);
    return {
        median: values[samples >> 1],
        min: values[0],
        max: values[samples - 1],
        iterations,
        samples,
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
) {
    const state = new ParserState<T>(source);
    parser(state);
    return state;
}

disableDiagnostics();
for (const source of [...sources, "not-a-property"]) {
    const expected = snapshot(closure.parseState(source));
    const actual = snapshot(staged.parseState(source));
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`unequal product for ${source}`);
    }
}

const constructionClosure = sample(
    makeClosure,
    fullCorpus ? 25 : 250,
    7,
    fullCorpus ? 10 : 25,
);
const constructionStaged = sample(
    makeStaged,
    fullCorpus ? 25 : 250,
    7,
    fullCorpus ? 10 : 25,
);
const closureRotating = sample(rotate(sources, source => closure.parseState(source)));
const stagedRotating = sample(rotate(sources, source => staged.parseState(source)));
const closureLate = sample(rotate(late, source => closure.parseState(source)));
const stagedLate = sample(rotate(late, source => staged.parseState(source)));
const closureFailure = sample(() => closure.parseState("not-a-property"));
const stagedFailure = sample(() => staged.parseState("not-a-property"));

enableDiagnostics();
const diagnosticSources = shape === "sequence"
    ? properties.map(name => `${name}!`)
    : ["not-a-property"];
for (const source of diagnosticSources) {
    const expected = snapshot(parseRaw(closure.parser, source));
    const actual = snapshot(parseRaw(staged.parser, source));
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`unequal diagnostic product for ${source}`);
    }
}
const closureDiagnosticFailure = sample(
    rotate(diagnosticSources, source => parseRaw(closure.parser, source)),
    fullCorpus ? 100 : 5_000,
);
const stagedDiagnosticFailure = sample(
    rotate(diagnosticSources, source => parseRaw(staged.parser, source)),
    fullCorpus ? 100 : 5_000,
);
disableDiagnostics();

const example = staged.parseState(sources[sources.length - 1]);
const retainedClosure = retained(makeClosure);
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
    },
    unit: "ns/op",
    plan: staged.plan,
    semanticsDigest: serialize(snapshot(example)).toString("hex"),
    planes: {
        construction: { closure: constructionClosure, staged: constructionStaged },
        rotating: { closure: closureRotating, staged: stagedRotating },
        late: { closure: closureLate, staged: stagedLate },
        failure: { closure: closureFailure, staged: stagedFailure },
        diagnosticFailure: {
            closure: closureDiagnosticFailure,
            staged: stagedDiagnosticFailure,
        },
    },
    retained: {
        closure: retainedClosure,
        staged: retainedStaged,
    },
    ratios: {
        rotating: closureRotating.median / stagedRotating.median,
        late: closureLate.median / stagedLate.median,
        failure: closureFailure.median / stagedFailure.median,
        diagnosticFailure:
            closureDiagnosticFailure.median / stagedDiagnosticFailure.median,
        construction: constructionStaged.median / constructionClosure.median,
        constructionAmortizationParses:
            (constructionStaged.median - constructionClosure.median)
            / (closureRotating.median - stagedRotating.median),
    },
};
console.log(JSON.stringify(raw));
