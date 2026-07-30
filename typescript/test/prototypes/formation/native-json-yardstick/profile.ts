import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { jsonSource } from "../../pass3/p3/products.js";

const baselineRoot = process.env.P3_BASELINE_ROOT;
if (!baselineRoot) throw new Error("P3_BASELINE_ROOT is required");

const { jsonParser } = await import(pathToFileURL(resolve(
    baselineRoot,
    "typescript/src/parse/parsers/json.ts",
)).href) as typeof import("../../../../src/parse/parsers/json.js");

const scales = [4, 8, 16, 33, 96, 753] as const;
const samples = 11;
let blackhole: unknown;

function median(values: readonly number[]): number {
    return [...values].sort((left, right) => left - right)[values.length >> 1];
}

function ns(run: () => unknown, iterations: number): number {
    const start = performance.now();
    for (let index = 0; index < iterations; index++) blackhole = run();
    return (performance.now() - start) * 1e6 / iterations;
}

function compare(
    control: () => unknown,
    yardstick: () => unknown,
    iterations: number,
) {
    for (let index = 0; index < iterations; index++) {
        blackhole = control();
        blackhole = yardstick();
    }
    const controlBatches: number[] = [];
    const yardstickBatches: number[] = [];
    const order: string[] = [];
    for (let batch = 0; batch < samples; batch++) {
        if ((batch & 1) === 0) {
            order.push("control/yardstick");
            controlBatches.push(ns(control, iterations));
            yardstickBatches.push(ns(yardstick, iterations));
        } else {
            order.push("yardstick/control");
            yardstickBatches.push(ns(yardstick, iterations));
            controlBatches.push(ns(control, iterations));
        }
    }
    const controlMedian = median(controlBatches);
    const yardstickMedian = median(yardstickBatches);
    return {
        control: { median: controlMedian, batches: controlBatches },
        yardstick: { median: yardstickMedian, batches: yardstickBatches },
        ratio: controlMedian / yardstickMedian,
        order,
    };
}

function successResult(value: unknown, end: number) {
    return Object.freeze({
        ok: true,
        value,
        span: Object.freeze({ start: 0, end }),
        diagnostics: Object.freeze([]),
    } as const);
}

const points = [];
for (const scale of scales) {
    const source = jsonSource(scale);
    const controlValue = jsonParser.parse(source);
    const yardstickValue = JSON.parse(source);
    if (!isDeepStrictEqual(controlValue, yardstickValue)) {
        throw new Error(`unequal JSON value at scale ${scale}`);
    }
    const controlResult = successResult(controlValue, source.length);
    const yardstickResult = successResult(yardstickValue, source.length);
    if (!isDeepStrictEqual(controlResult, yardstickResult)) {
        throw new Error(`unequal JSON result at scale ${scale}`);
    }
    const iterations = scale <= 8
        ? 1_000
        : scale <= 16
        ? 500
        : scale <= 33
        ? 200
        : scale <= 96
        ? 50
        : 5;
    for (const plane of [
        {
            name: "value",
            control: () => jsonParser.parse(source),
            yardstick: () => JSON.parse(source),
        },
        {
            name: "immutable-result",
            control: () => successResult(jsonParser.parse(source), source.length),
            yardstick: () => successResult(JSON.parse(source), source.length),
        },
    ] as const) {
        points.push({
            scale,
            plane: plane.name,
            sourceCodeUnits: source.length,
            ...compare(plane.control, plane.yardstick, iterations),
        });
    }
}

const output = {
    subject: "formation-native-json-yardstick",
    meaning: "Native semantic-work yardstick only; not a parser candidate or admission control",
    node: process.version,
    v8: process.versions.v8,
    baseline: "de36d57dccdd20068b8c11a78f6e83d42e7d681f",
    samples,
    scales,
    points,
};
const serialized = `${JSON.stringify(output)}\n`;
const outputPath = process.env.NATIVE_JSON_YARDSTICK_OUTPUT;
if (outputPath) writeFileSync(outputPath, serialized);
console.log(serialized);
