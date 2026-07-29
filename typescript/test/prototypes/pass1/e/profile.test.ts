import { performance } from "node:perf_hooks";
import { serialize } from "node:v8";
import { bench, describe } from "vitest";
import { capture, choice, literal, runProjected, runRecognition, seq } from "./kernel.js";

const captures = Array.from({ length: 12 }, () => capture(literal("a", "")));
const heavy = seq(...captures);
const heavySource = "a".repeat(12);
const fixed = seq(...Array.from({ length: 12 }, () => literal("a", "")));
const dispatch = choice(...["aa", "bb", "cc", "dd", "ee", "ff"].map(x => literal(x, x)));
const hostile = literal("aaaaaaaaab", "");
const transaction = choice(
    ...["c", "d", "e", "f", "g"].map(x =>
        seq(capture(literal("a", "")), literal(x, ""))),
    seq(capture(literal("a", "")), literal("b", "")),
);
const closureOutput = () =>
    Array.from({ length: 12 }, (_, start) => ({ start, end: start + 1 }));
const directClosure = () => {
    const value: { start: number; end: number }[] = [];
    for (let start = 0; start < heavySource.length; start++) {
        if (heavySource.charCodeAt(start) !== 97) return { ok: false, offset: 0 };
        value.push({ start, end: start + 1 });
    }
    return { ok: true, offset: 12, furthest: -1, work: 12, value };
};
let blackhole: unknown;

type Timing = { median: number; min: number; max: number; iterations: number; samples: number };
function sample(fn: () => unknown, iterations = 4_000, samples = 7): Timing {
    for (let i = 0; i < 1_000; i++) blackhole = fn();
    const values: number[] = [];
    for (let sample = 0; sample < samples; sample++) {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) blackhole = fn();
        values.push((performance.now() - start) * 1e6 / iterations);
    }
    values.sort((a, b) => a - b);
    return { median: values[samples >> 1], min: values[0], max: values[samples - 1], iterations, samples };
}

function heapBytes(factory: () => unknown): number | null {
    const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc;
    if (!gc) return null;
    gc();
    const before = process.memoryUsage().heapUsed;
    let retained = Array.from({ length: 100_000 }, factory);
    gc();
    const bytes = (process.memoryUsage().heapUsed - before) / retained.length;
    blackhole = retained[retained.length - 1];
    retained = [];
    gc();
    return bytes;
}

const projectedCapture = sample(() => runProjected(heavy, heavySource));
const sinkCapture = sample(() => runRecognition(heavy, heavySource));
const product = runProjected(heavy, heavySource);
if (!product.ok) throw new Error("capture profile fixture must succeed");
const raw = {
    metadata: { node: process.versions.node, v8: process.versions.v8, platform: process.platform, arch: process.arch },
    unit: "ns/op",
    planes: {
        construction6: sample(() => choice(...["a", "b", "c", "d", "e", "f"].map(x => literal(x, x)))),
        construction12: sample(() => seq(...Array.from({ length: 12 }, () => literal("a", "")))),
        coldValid: sample(() => runProjected(seq(literal("a", ""), literal("b", "")), "ab")),
        warmSuccess: sample(() => runProjected(dispatch, "ff")),
        warmFailure: sample(() => runProjected(hostile, "aaaaaaaaac")),
        transaction: sample(() => runProjected(transaction, "ab")),
        captureProjected: projectedCapture,
        captureRecognition: sinkCapture,
        captureDirectClosure: sample(directClosure),
    },
    evidence: { transaction: runProjected(transaction, "ab"), capture: runRecognition(heavy, heavySource) },
    retained: {
        serializedCandidate: serialize(product.value).byteLength,
        serializedClosure: serialize(closureOutput()).byteLength,
        candidateHeapBytesPer100k: heapBytes(() => {
            const result = runProjected(heavy, heavySource);
            return result.ok ? result.value : undefined;
        }),
        closureHeapBytesPer100k: heapBytes(closureOutput),
    },
    recognitionSpeedupPercent: (1 - sinkCapture.median / projectedCapture.median) * 100,
    allocationModel: { projectedJournalArrays: 4, projectedEventRows: 12, directJournalArrays: 0 },
};
console.log(`P1_E_RAW_PROFILE=${JSON.stringify(raw)}`);

describe("P1-E equal-product profile", () => {
    bench("fixed sequence projected", () => { blackhole = runProjected(fixed, heavySource); }, { time: 300 });
    bench("hostile late mismatch", () => { blackhole = runProjected(hostile, "aaaaaaaaac"); }, { time: 300 });
    bench("five rejected arms then success", () => { blackhole = runProjected(transaction, "ab"); }, { time: 300 });
    bench("capture retained output", () => { blackhole = runProjected(heavy, heavySource); }, { time: 300 });
    bench("capture recognition-only", () => { blackhole = runRecognition(heavy, heavySource); }, { time: 300 });
    bench("capture direct closure output", () => { blackhole = directClosure(); }, { time: 300 });
});
