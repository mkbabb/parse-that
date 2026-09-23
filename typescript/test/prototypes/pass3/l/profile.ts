import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
    Parser,
} from "../../../../src/parse/index.js";
import {
    compile,
    sourceLeaf,
    type Spanned,
} from "../s/kernel.js";
import {
    cssNameEnd,
    cssNumberEnd,
    jsonNumberEnd,
    jsonStringEnd,
    NAME_REST,
    NAME_START,
} from "./fixtures.js";
import {
    asciiRun,
    stickySource,
} from "./leaves.js";

const baselineRoot = process.env.P2_BASELINE_ROOT;
const baselineApi = baselineRoot
    ? await import(pathToFileURL(resolve(
        baselineRoot,
        "src/parse/index.ts",
    )).href) as typeof import("../../../../src/parse/index.js")
    : await import("../../../../src/parse/index.js");

type Shape = Readonly<{
    name: string;
    expression: RegExp;
    matchEnd: (source: string, start: number) => number;
    valid: (length: number) => string;
    invalid: string;
    firstCodes: readonly number[];
    project?: (value: string) => unknown;
    ascii?: true;
}>;

const shapes: readonly Shape[] = [
    {
        name: "ascii-name",
        expression: /[A-Za-z_][A-Za-z0-9_-]*/,
        matchEnd: (source, start) => {
            const first = source.charCodeAt(start);
            if (first >= 128 || NAME_START[first] === 0) return -1;
            let end = start + 1;
            while (end < source.length) {
                const code = source.charCodeAt(end);
                if (code >= 128 || NAME_REST[code] === 0) break;
                end++;
            }
            return end;
        },
        valid: length => `a${"b".repeat(Math.max(0, length - 2))}9`,
        invalid: "!",
        firstCodes: [...NAME_START.keys()].filter(code => NAME_START[code] > 0),
        ascii: true,
    },
    {
        name: "css-name",
        expression:
            /(?:[-_A-Za-z0-9\u0080-\uFFFF]|\\(?:[0-9A-Fa-f]{1,6}(?:\r\n|[ \t\n\f\r])?|[^\n\f\r]|$))+/,
        matchEnd: cssNameEnd,
        valid: length => `a${"b".repeat(Math.max(0, length - 4))}\\31 x`,
        invalid: "\n",
        firstCodes: [],
    },
    {
        name: "css-number",
        expression:
            /[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?/,
        matchEnd: cssNumberEnd,
        valid: length => `${"1".repeat(Math.max(1, length - 4))}.5e2`,
        invalid: "+.x",
        firstCodes: [43, 45, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
        project: Number,
    },
    {
        name: "json-number",
        expression: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
        matchEnd: jsonNumberEnd,
        valid: length => `${"1".repeat(Math.max(1, length - 4))}.5e2`,
        invalid: "-x",
        firstCodes: [45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
        project: Number,
    },
    {
        name: "json-string",
        expression:
            /"(?:[^"\\\u0000-\u001F]|\\(?:["\\/bfnrt]|u[0-9A-Fa-f]{4}))*"/,
        matchEnd: jsonStringEnd,
        valid: length => `"${"a".repeat(Math.max(0, length - 2))}"`,
        invalid: "\"open",
        firstCodes: [34],
        project: JSON.parse,
    },
];
const lengths = [8, 64, 4_096] as const;
const samples = 11;
let blackhole: unknown;

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

function snapshot(state: {
    value: unknown;
    offset: number;
    isError: boolean;
    furthest: number;
    expected?: readonly string[];
    diagnostics: readonly unknown[];
}) {
    return {
        value: state.value,
        offset: state.offset,
        isError: state.isError,
        furthest: state.furthest,
        expected: state.expected,
        diagnostics: state.diagnostics,
    };
}

function median(values: readonly number[]): number {
    return [...values].sort((left, right) => left - right)[values.length >> 1];
}

function ns(fn: () => unknown, iterations: number): number {
    const start = performance.now();
    for (let index = 0; index < iterations; index++) blackhole = fn();
    return (performance.now() - start) * 1e6 / iterations;
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

function retained(factory: () => unknown, count = 256) {
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

function makeCandidate(
    shape: Shape,
    family: "callback" | "sticky" | "ascii",
    project: boolean,
) {
    const sourceProject = project
        ? (source: string, start: number, end: number) =>
            shape.project!(source.substring(start, end))
        : undefined;
    const grammar = family === "sticky"
        ? stickySource(shape.expression, sourceProject, shape.firstCodes)
        : family === "ascii"
            ? asciiRun(
                `/${shape.expression.source}/${shape.expression.flags}`,
                NAME_START,
                NAME_REST,
                sourceProject,
            )
            : sourceLeaf(
                `/${shape.expression.source}/${shape.expression.flags}`,
                shape.matchEnd,
                sourceProject,
                shape.firstCodes,
            );
    return compile(grammar.spanned());
}

const points = [];
const equality = [];
for (const shape of shapes) {
    const families = shape.ascii
        ? ["callback", "sticky", "ascii"] as const
        : ["callback", "sticky"] as const;
    const planes = shape.project
        ? ["capture", "value"] as const
        : ["capture"] as const;
    for (const plane of planes) {
        const base = baselineApi.regex(shape.expression);
        const control = spanned(
            plane === "value" ? base.map(shape.project!) : base,
        );
        for (const family of families) {
            const candidate = makeCandidate(shape, family, plane === "value");
            for (const length of lengths) {
                const source = shape.valid(length);
                const expected = snapshot(control.parseState(source));
                const actual = snapshot(candidate.parseState(source));
                equality.push({
                    shape: shape.name,
                    plane,
                    family,
                    length,
                    success:
                        JSON.stringify(actual) === JSON.stringify(expected),
                    failure: JSON.stringify(
                        snapshot(candidate.parseState(shape.invalid)),
                    ) === JSON.stringify(
                        snapshot(control.parseState(shape.invalid)),
                    ),
                });
                const iterations = length >= 4_096 ? 2_000 : 30_000;
                points.push({
                    shape: shape.name,
                    plane,
                    family,
                    length,
                    success: compare(
                        () => control.parseState(source),
                        () => candidate.parseState(source),
                        iterations,
                    ),
                    failure: compare(
                        () => control.parseState(shape.invalid),
                        () => candidate.parseState(shape.invalid),
                        iterations,
                    ),
                });
            }
        }
    }
}

const memory = shapes.flatMap(shape => {
    const families = shape.ascii
        ? ["callback", "sticky", "ascii"] as const
        : ["callback", "sticky"] as const;
    return [
        {
            shape: shape.name,
            family: "control",
            retained: retained(() =>
                spanned(baselineApi.regex(shape.expression))
            ),
        },
        ...families.map(family => ({
            shape: shape.name,
            family,
            retained: retained(() => makeCandidate(shape, family, false)),
        })),
    ];
});

const result = {
    schema: "p2-source-leaf-v1",
    node: process.version,
    v8: process.versions.v8,
    baselineRoot: baselineRoot ?? "current",
    lengths,
    samples,
    equality,
    points,
    memory,
};
const output = JSON.stringify(result, null, 2);
if (process.env.P2_PROFILE_OUTPUT) {
    writeFileSync(process.env.P2_PROFILE_OUTPUT, `${output}\n`);
}
process.stdout.write(`${output}\n`);
