import { performance } from "node:perf_hooks";
import process from "node:process";
import {
    all,
    any,
    clearCollectedDiagnostics,
    dispatch,
    regex,
    string,
} from "../dist/parse.js";

if (typeof global.gc !== "function") {
    throw new Error("run with: node --expose-gc scripts/runtime-kernel-probe.mjs");
}

const tokens = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"];
const leaves = tokens.map(string);
const sequential = any(...leaves);
const dispatched = dispatch(Object.fromEntries(tokens.map((s, i) => [s[0], leaves[i]])));
const recovered = regex(/[a-z]+/).recover(regex(/[^;]*;?/), "recovered");
const fused = all(string("a"), string("b"), string("c"));
const nested = string("a")
    .then(string("b"))
    .then(string("c"))
    .map(([[a, b], c]) => [a, b, c]);

let cursor = 0;
function parseSequentialSuccess() {
    return sequential.parse(tokens[cursor++ % tokens.length]);
}
function parseDispatchSuccess() {
    return dispatched.parse(tokens[cursor++ % tokens.length]);
}
function parseSequentialFailure() {
    return sequential.parse("!");
}
function parseDispatchFailure() {
    return dispatched.parse("!");
}
function parseRecoveryMixed() {
    const input = cursor++ % 10 === 0 ? "123;" : "alpha";
    const value = recovered.parse(input);
    clearCollectedDiagnostics();
    return value;
}

function medianNsPerOp(fn, iterations = 250_000) {
    for (let i = 0; i < 25_000; i++) fn();
    const samples = [];
    for (let sample = 0; sample < 7; sample++) {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) fn();
        samples.push(((performance.now() - start) * 1e6) / iterations);
    }
    samples.sort((a, b) => a - b);
    return samples[samples.length >> 1];
}

function retainedBytesPerOp(fn, count = 100_000) {
    for (let i = 0; i < 10_000; i++) fn();
    global.gc();
    const before = process.memoryUsage().heapUsed;
    const sink = Array.from({ length: count }, fn);
    global.gc();
    const bytes = (process.memoryUsage().heapUsed - before) / count;
    if (sink.length !== count) throw new Error("unreachable");
    return bytes;
}

function constructionNsPerOp(factory, count = 25_000) {
    const sink = new Array(count);
    const start = performance.now();
    for (let i = 0; i < count; i++) sink[i] = factory();
    const elapsed = ((performance.now() - start) * 1e6) / count;
    if (sink.length !== count) throw new Error("unreachable");
    return elapsed;
}

function coldParseNsPerOp(factory, input, count = 25_000) {
    const parsers = Array.from({ length: count }, factory);
    const start = performance.now();
    for (let i = 0; i < count; i++) parsers[i].parse(input);
    return ((performance.now() - start) * 1e6) / count;
}

for (const token of tokens) {
    if (sequential.parse(token) !== dispatched.parse(token)) {
        throw new Error(`success output mismatch: ${token}`);
    }
}
if (sequential.parse("!") !== dispatched.parse("!")) {
    throw new Error("failure output mismatch");
}
if (JSON.stringify(fused.parse("abc")) !== JSON.stringify(nested.parse("abc"))) {
    throw new Error("allocation-control output mismatch");
}

const results = {
    runtime: { node: process.version, v8: process.versions.v8 },
    constructionNsPerOp: {
        fused: constructionNsPerOp(() => all(string("a"), string("b"), string("c"))),
        nested: constructionNsPerOp(() =>
            string("a")
                .then(string("b"))
                .then(string("c"))
                .map(([[a, b], c]) => [a, b, c]),
        ),
    },
    coldParseNsPerOp: {
        fused: coldParseNsPerOp(
            () => all(string("a"), string("b"), string("c")),
            "abc",
        ),
        nested: coldParseNsPerOp(
            () =>
                string("a")
                    .then(string("b"))
                    .then(string("c"))
                    .map(([[a, b], c]) => [a, b, c]),
            "abc",
        ),
    },
    parseNsPerOp: {
        sequentialSuccess: medianNsPerOp(parseSequentialSuccess),
        dispatchSuccess: medianNsPerOp(parseDispatchSuccess),
        sequentialFailure: medianNsPerOp(parseSequentialFailure),
        dispatchFailure: medianNsPerOp(parseDispatchFailure),
        recovery90Success10Recovered: medianNsPerOp(parseRecoveryMixed),
    },
    retainedOutputBytesPerOp: {
        fused: retainedBytesPerOp(() => fused.parse("abc")),
        nested: retainedBytesPerOp(() => nested.parse("abc")),
    },
};

console.log(JSON.stringify(results, null, 2));
