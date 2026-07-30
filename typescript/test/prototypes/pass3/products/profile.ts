import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import type {
    Parser,
    ParserState,
} from "../../../../src/parse/index.js";
import {
    disableDiagnostics as disableCandidateDiagnostics,
    enableDiagnostics as enableCandidateDiagnostics,
} from "../../../../src/parse/index.js";
import {
    resultFromState,
} from "../s/result.js";
import type {
    Spanned,
} from "../s/kernel.js";
import {
    compileFixtureProduct,
    compileJsonProduct,
    JSON_NUMBER_EXPRESSION,
    JSON_STRING_EXPRESSION,
    NAME_EXPRESSION,
    NUMBER_EXPRESSION,
    QUOTED_EXPRESSION,
    STATEMENT_SYNC_EXPRESSION,
    TRIVIA_EXPRESSION,
    URL_BODY_EXPRESSION,
    type FixtureAtom,
    type FixtureProduct,
    type FixtureStatement,
    type JsonProduct,
    type JsonValue,
} from "./products.js";

const baselineRoot = process.env.P2_BASELINE_ROOT;
if (!baselineRoot) throw new Error("P2_BASELINE_ROOT is required");
const api = await import(pathToFileURL(resolve(
    baselineRoot,
    "src/parse/index.ts",
)).href) as typeof import("../../../../src/parse/index.js");

function spanned<T>(parser: Parser<T>): Parser<Spanned<T>> {
    return new api.Parser((state: ParserState<Spanned<T>>) => {
        const start = state.offset;
        parser.parser(state as unknown as ParserState<T>);
        if (state.isError) return state;
        return state.ok({
            value: state.value as unknown as T,
            span: { start, end: state.offset },
        });
    });
}

function controlTrivia(): Parser<undefined> {
    return api.regex(TRIVIA_EXPRESSION)
        .many(0, 1)
        .map(() => undefined);
}

function buildJsonControl(): Parser<JsonProduct> {
    const trivia = controlTrivia();
    const comma = trivia.next(api.string(",")).skip(trivia);
    const colon = trivia.next(api.string(":")).skip(trivia);
    const string = api.regex(JSON_STRING_EXPRESSION).map(
        value => JSON.parse(value) as string,
    );
    const number = api.regex(JSON_NUMBER_EXPRESSION).map(Number);
    const boolean = api.string("true").or(api.string("false"))
        .map(value => value === "true");
    const nil = api.string("null").map(() => null);
    let value!: Parser<JsonValue>;
    const array: Parser<JsonValue[]> = api.Parser.lazy(() =>
        api.string("[")
            .next(trivia)
            .next(value.sepBy(comma))
            .skip(trivia)
            .skip(api.string("]"))
    );
    const object: Parser<{ [key: string]: JsonValue }> = api.Parser.lazy(() =>
        api.string("{")
            .next(trivia)
            .next(string.skip(colon).then(value).sepBy(comma))
            .skip(trivia)
            .skip(api.string("}"))
            .map(entries => Object.fromEntries(entries)),
    );
    value = api.any(object, array, string, number, boolean, nil);
    return trivia.next(spanned(value)).skip(trivia).eof();
}

function buildFixtureControl(): Parser<FixtureProduct> {
    const trivia = controlTrivia();
    const name = api.regex(NAME_EXPRESSION);
    const magnitude = api.regex(NUMBER_EXPRESSION).map(Number);
    const unit = spanned(name);
    const number = spanned(magnitude.map(
        value => ({ kind: "number", value }) as const,
    ));
    const percentage = spanned(
        magnitude
            .skip(api.string("%"))
            .map(value => ({ kind: "percentage", value }) as const),
    );
    const dimension = spanned(
        magnitude
            .then(unit)
            .map(([value, suffix]) => ({
                kind: "dimension",
                value,
                unit: suffix.value,
            }) as const),
    );
    const string = spanned(
        api.regex(QUOTED_EXPRESSION)
            .map(raw => ({ kind: "string", raw }) as const),
    );
    const url = spanned(
        api.string("url(")
            .next(trivia)
            .next(api.regex(URL_BODY_EXPRESSION))
            .skip(trivia)
            .skip(api.string(")"))
            .map(raw => ({ kind: "url", raw }) as const),
    );
    const bareName = spanned(
        name.map(raw => ({ kind: "name", raw }) as const),
    );
    let atom!: Parser<Spanned<FixtureAtom>>;
    const call: Parser<Spanned<FixtureAtom>> = api.Parser.lazy(() =>
        spanned(
            name
                .then(
                    api.string("(")
                        .next(trivia)
                        .next(atom.skip(trivia).many())
                        .skip(api.string(")")),
                )
                .map(([callee, body]) => ({
                    kind: "call",
                    name: callee,
                    body,
                }) as const),
        )
    );
    atom = api.any(
        call,
        url,
        percentage,
        dimension,
        number,
        string,
        bareName,
    );
    const statement = spanned(name)
        .skip(trivia)
        .skip(api.string(":"))
        .skip(trivia)
        .then(atom.skip(trivia).many(1))
        .skip(api.string(";"))
        .map(([statementName, body]: [
            Spanned<string>,
            Spanned<FixtureAtom>[],
        ]) => ({
            kind: "statement",
            name: statementName,
            body,
        }) as const) as Parser<FixtureStatement>;
    const opaque: Readonly<{ kind: "opaque" }> = Object.freeze({
        kind: "opaque",
    });
    const sync = api.regex(STATEMENT_SYNC_EXPRESSION);
    return trivia
        .next(
            spanned(
                statement.recover(sync, opaque as FixtureStatement),
            ).skip(trivia).many(),
        )
        .eof();
}

function jsonSource(count: number): string {
    return ` \r\n${JSON.stringify({
        name: "𝒜",
        values: Array.from({ length: count }, (_, index) => ({
            index,
            active: (index & 1) === 0,
            payload: index % 7 === 0 ? null : `x\\${index}`,
        })),
    })}\t`;
}

function fixtureSource(count: number): string {
    const shapes = [
        (index: number) => `p${index}: ${index}.5px;`,
        (index: number) => `q${index}: calc(100% - ${index}px nested(1));`,
        (index: number) => `r${index}: url(asset/${index}.svg);`,
        (index: number) => `s${index}: "a\\\\41";`,
        (index: number) => `bad${index}: @@@;`,
    ] as const;
    return Array.from(
        { length: count },
        (_, index) => shapes[index % shapes.length](index),
    ).join("\r\n");
}

type StateView = Readonly<{
    value: unknown;
    offset: number;
    isError: boolean;
    furthest: number;
    expected?: readonly string[];
    diagnostics: readonly unknown[];
    fault: unknown;
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

function failureView(state: StateView): Omit<StateView, "value"> {
    const { value: _, ...failure } = view(state);
    return failure;
}

const samples = 11;
let blackhole: unknown;
type ProjectableState = Parameters<typeof resultFromState<unknown>>[0];

function projectResult(state: unknown) {
    return resultFromState(state as ProjectableState);
}

function median(values: readonly number[]): number {
    return [...values].sort((left, right) => left - right)[values.length >> 1];
}

function ns(fn: () => unknown, iterations: number): number {
    const started = performance.now();
    for (let index = 0; index < iterations; index++) blackhole = fn();
    return (performance.now() - started) * 1e6 / iterations;
}

function compare(
    control: () => unknown,
    candidate: () => unknown,
    iterations: number,
) {
    for (let index = 0; index < iterations; index++) {
        blackhole = control();
        blackhole = candidate();
    }
    const controlBatches: number[] = [];
    const candidateBatches: number[] = [];
    const order: string[] = [];
    for (let batch = 0; batch < samples; batch++) {
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

function retained(factory: () => unknown, count = 128) {
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

const jsonControl = buildJsonControl();
const jsonCandidate = compileJsonProduct();
const fixtureControl = buildFixtureControl();
const fixtureCandidate = compileFixtureProduct();
const scales = [8, 96, 753] as const;
const points: unknown[] = [];

for (const scale of scales) {
    const iterations = scale === 8 ? 400 : scale === 96 ? 40 : 5;
    for (const product of [
        {
            name: "json",
            source: jsonSource(scale),
            control: jsonControl,
            candidate: jsonCandidate,
        },
        {
            name: "fixture",
            source: fixtureSource(scale),
            control: fixtureControl,
            candidate: fixtureCandidate,
        },
    ] as const) {
        const controlState = product.control.parseState(product.source);
        const candidateState = product.candidate.parseState(product.source);
        if (!isDeepStrictEqual(view(candidateState), view(controlState))) {
            throw new Error(
                `unequal ${product.name}/${scale}: `
                + JSON.stringify({
                    control: view(controlState),
                    candidate: view(candidateState),
                }),
            );
        }
        const planes = [
            {
                name: "state",
                control: () => view(
                    product.control.parseState(product.source),
                ),
                candidate: () => view(
                    product.candidate.parseState(product.source),
                ),
            },
            {
                name: "value",
                control: () => product.control.parse(product.source),
                candidate: () => product.candidate.parse(product.source),
            },
            {
                name: "result",
                control: () => projectResult(
                    product.control.parseState(product.source),
                ),
                candidate: () => projectResult(
                    product.candidate.parseState(product.source),
                ),
            },
        ] as const;
        for (const plane of planes) {
            const left = plane.control();
            const right = plane.candidate();
            if (!isDeepStrictEqual(left, right)) {
                throw new Error(
                    `unequal ${product.name}/${scale}/${plane.name}`,
                );
            }
            points.push({
                product: product.name,
                scale,
                plane: plane.name,
                sourceCodeUnits: product.source.length,
                ...compare(plane.control, plane.candidate, iterations),
            });
        }
    }
}

for (const failure of [
    {
        name: "json-failure",
        source: "{\"x\":[1,]}",
        control: jsonControl,
        candidate: jsonCandidate,
    },
    {
        name: "fixture-failure",
        source: "open: calc(1px;",
        control: fixtureControl,
        candidate: fixtureCandidate,
    },
] as const) {
    enableCandidateDiagnostics();
    api.enableDiagnostics();
    const report = console.error;
    let left: Omit<StateView, "value">;
    let right: Omit<StateView, "value">;
    try {
        console.error = () => undefined;
        left = failureView(failure.control.parseState(failure.source));
        right = failureView(failure.candidate.parseState(failure.source));
    } finally {
        console.error = report;
        disableCandidateDiagnostics();
        api.disableDiagnostics();
    }
    if (!isDeepStrictEqual(left, right)) {
        throw new Error(`unequal ${failure.name}: ${JSON.stringify({
            control: left,
            candidate: right,
        })}`);
    }
    points.push({
        product: failure.name,
        scale: 1,
        plane: "failure",
        sourceCodeUnits: failure.source.length,
        ...compare(
            () => failure.control.parseState(failure.source),
            () => failure.candidate.parseState(failure.source),
            1_000,
        ),
    });
}

const allocationSource = fixtureSource(96);
const output = {
    subject: "P2-shaped-products",
    node: process.version,
    v8: process.versions.v8,
    baselineRoot,
    samples,
    scales,
    failureValueDelta:
        "candidate scalar rollback clears stale rejected values; M2 retains them",
    points,
    allocations: {
        control: retained(() => fixtureControl.parseState(allocationSource)),
        candidate: retained(
            () => fixtureCandidate.parseState(allocationSource),
        ),
    },
};
const serialized = `${JSON.stringify(output)}\n`;
const outputPath = process.env.P2_PRODUCTS_OUTPUT;
if (outputPath) writeFileSync(outputPath, serialized);
console.log(serialized);
