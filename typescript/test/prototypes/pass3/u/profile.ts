import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
    PerformanceObserver,
    performance,
} from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import {
    ParserState,
    disableDiagnostics,
} from "../../../../src/parse/index.js";
import { createResultProjector } from "../s/result.js";
import { RunState } from "../s/run-state.js";
import { literal, type Spanned } from "../s/kernel.js";
import {
    compileUnordered,
    required,
    type CompiledUnordered,
    type UnorderedFamily,
} from "./unordered.js";

const baselineRoot = process.env.P3_BASELINE_ROOT;
if (!baselineRoot) throw new Error("P3_BASELINE_ROOT is required");
const baselineApi = await import(pathToFileURL(resolve(
    baselineRoot,
    "src/parse/index.ts",
)).href) as typeof import("../../../../src/parse/index.js");
disableDiagnostics();
baselineApi.disableDiagnostics();

type Slot = Spanned<string>;
type Slots = Slot[];
type StateView = Readonly<{
    value: readonly Slot[];
    offset: number;
    isError: boolean;
    furthest: number;
    expected?: readonly string[];
    diagnostics: readonly unknown[];
}>;
type Timing = Readonly<{
    median: number;
    min: number;
    max: number;
    batches: readonly number[];
}>;

function rollbackClosure<T>(
    state: ParserState<T>,
    offset: number,
    value: T,
    diagnosticsLength: number,
    isError: boolean,
): ParserState<T> {
    state.offset = offset;
    state.value = value;
    state.diagnostics.length = diagnosticsLength;
    state.isError = isError;
    return state;
}

function makeMembers(texts: readonly string[]) {
    return texts.map(text => {
        const terminal = baselineApi.string(text);
        return new baselineApi.Parser<Slot>(state => {
            const start = state.offset;
            terminal.parser(state);
            return state.isError
                ? state
                : state.ok({
                    value: text,
                    span: { start, end: state.offset },
                });
        });
    });
}

function makeDirectControl(texts: readonly string[]) {
    const members = makeMembers(texts);
    return new baselineApi.Parser<Slots>(state => {
        const rootOffset = state.offset;
        const rootValue = state.value;
        const rootDiagnostics = state.diagnostics.length;
        const slots = new Array<Slot>(members.length);
        const used = new Uint8Array(members.length);
        const visited = new Set<string>();
        let mask = 0n;
        let distinct = 0;

        const search = (): boolean => {
            if (
                state.offset === state.src.length
                && distinct === members.length
            ) {
                state.value = [...slots];
                state.isError = false;
                return true;
            }
            const key = `${state.offset}/${mask.toString(36)}`;
            if (visited.has(key) || visited.size >= 10_000) return false;
            visited.add(key);

            for (let index = 0; index < members.length; index++) {
                if (used[index]) continue;
                const offset = state.offset;
                const value = state.value;
                const diagnostics = state.diagnostics.length;
                members[index].parser(state);
                if (state.isError) {
                    rollbackClosure(
                        state,
                        offset,
                        value,
                        diagnostics,
                        false,
                    );
                    continue;
                }
                used[index] = 1;
                mask |= 1n << BigInt(index);
                distinct++;
                slots[index] = state.value;
                if (search()) return true;
                used[index] = 0;
                mask &= ~(1n << BigInt(index));
                distinct--;
                rollbackClosure(state, offset, value, diagnostics, false);
            }
            return false;
        };

        return search()
            ? state
            : rollbackClosure(
                state,
                rootOffset,
                rootValue,
                rootDiagnostics,
                true,
            );
    });
}

function makeClosure(texts: readonly string[]) {
    const indices = new Map(texts.map((text, index) => [text, index]));
    const collected = baselineApi.any(...makeMembers(texts))
        .many(texts.length, texts.length)
        .eof();
    return new baselineApi.Parser<Slots>(state => {
        const rootOffset = state.offset;
        const rootValue = state.value;
        const rootDiagnostics = state.diagnostics.length;
        collected.parser(state);
        if (state.isError) {
            return rollbackClosure(
                state,
                rootOffset,
                rootValue,
                rootDiagnostics,
                true,
            );
        }

        const slots = new Array<Slot>(texts.length);
        const seen = new Uint8Array(texts.length);
        for (const slot of state.value) {
            const index = indices.get(slot.value);
            if (index === undefined || seen[index]) {
                return rollbackClosure(
                    state,
                    rootOffset,
                    rootValue,
                    rootDiagnostics,
                    true,
                );
            }
            seen[index] = 1;
            slots[index] = slot;
        }
        return state.ok(slots);
    });
}

function makeCandidate(
    texts: readonly string[],
    family: UnorderedFamily,
): CompiledUnordered<Slots> {
    return compileUnordered("all", texts.map(text =>
        required(literal(text).spanned())
    ), family) as unknown as CompiledUnordered<Slots>;
}

function view(state: StateView) {
    return {
        value: state.value,
        offset: state.offset,
        isError: state.isError,
        ...(state.isError
            ? { furthest: state.furthest, expected: state.expected }
            : {}),
        diagnostics: state.diagnostics,
    };
}

function summarize(batches: readonly number[]): Timing {
    const sorted = [...batches].sort((left, right) => left - right);
    return {
        median: sorted[sorted.length >> 1],
        min: sorted[0],
        max: sorted[sorted.length - 1],
        batches,
    };
}

let blackhole: unknown;
function time(fn: () => unknown, iterations: number): number {
    const start = performance.now();
    for (let index = 0; index < iterations; index++) blackhole = fn();
    return (performance.now() - start) * 1e6 / iterations;
}

function rotate<T>(
    values: readonly T[],
    consume: (value: T) => unknown,
): () => unknown {
    let cursor = 0;
    return () => consume(values[cursor++ % values.length]);
}

function pair(
    closure: () => unknown,
    candidate: () => unknown,
    iterations: number,
    candidateFirst: boolean,
) {
    for (let index = 0; index < iterations; index++) {
        blackhole = closure();
        blackhole = candidate();
    }
    const closureBatches: number[] = [];
    const candidateBatches: number[] = [];
    const order: string[] = [];
    for (let batch = 0; batch < 11; batch++) {
        if ((batch % 2 === 0) === candidateFirst) {
            order.push("candidate/closure");
            candidateBatches.push(time(candidate, iterations));
            closureBatches.push(time(closure, iterations));
        } else {
            order.push("closure/candidate");
            closureBatches.push(time(closure, iterations));
            candidateBatches.push(time(candidate, iterations));
        }
    }
    const baseline = summarize(closureBatches);
    const subject = summarize(candidateBatches);
    return {
        closure: baseline,
        candidate: subject,
        ratio: baseline.median / subject.median,
        order,
    };
}

function retained(factory: () => unknown, count = 200) {
    if (!global.gc) return undefined;
    for (let index = 0; index < 4; index++) blackhole = factory();
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

const hotMode = process.env.P3_U_HOT_MODE;
if (hotMode === "closure" || hotMode === "D") {
    const gc = new Map<number, { count: number; durationMs: number }>();
    const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
            const kind = (
                entry as unknown as { detail: { kind: number } }
            ).detail.kind;
            const aggregate = gc.get(kind) ?? { count: 0, durationMs: 0 };
            aggregate.count++;
            aggregate.durationMs += entry.duration;
            gc.set(kind, aggregate);
        }
    });
    observer.observe({ entryTypes: ["gc"] });
    const texts = Array.from(
        { length: 33 },
        (_, index) => String.fromCharCode(33 + index),
    );
    const sources = [
        texts.join(""),
        [...texts].reverse().join(""),
        [...texts.slice(1), texts[0]].join(""),
    ];
    const parser = hotMode === "closure"
        ? makeClosure(texts)
        : makeCandidate(texts, "D");
    const parse = rotate(sources, source => parser.parseState(source));
    for (let index = 0; index < 100_000; index++) blackhole = parse();
    const start = performance.now();
    for (let index = 0; index < 2_000_000; index++) blackhole = parse();
    const elapsedMs = performance.now() - start;
    await new Promise<void>(resolve => setImmediate(resolve));
    observer.disconnect();
    const json = `${JSON.stringify({
        mode: hotMode,
        count: 33,
        iterations: 2_000_000,
        elapsedMs,
        gc: Object.fromEntries(gc),
        final: blackhole,
    }, null, 2)}\n`;
    const output = process.env.P3_U_PROFILE_OUT;
    if (output) writeFileSync(output, json);
    console.log(json);
    process.exit(0);
}

const counts = [4, 8, 16, 33] as const;
const results = [];
for (const count of counts) {
    const texts = Array.from(
        { length: count },
        (_, index) => String.fromCharCode(33 + index),
    );
    const reversed = [...texts].reverse();
    const sources = [
        texts.join(""),
        reversed.join(""),
        [...texts.slice(1), texts[0]].join(""),
        texts.filter((_, index) => index % 2 === 0)
            .concat(texts.filter((_, index) => index % 2 === 1))
            .join(""),
    ];
    const failure = `${reversed.slice(0, -1).join("")}~`;
    const closure = makeClosure(texts);
    const s = makeCandidate(texts, "S");
    const d = makeCandidate(texts, "D");

    for (const source of [...sources, failure]) {
        const expected = view(closure.parseState(source) as StateView);
        for (const [family, candidate] of [[
            "S",
            s,
        ], [
            "D",
            d,
        ]] as const) {
            const actual = view(candidate.parseState(source) as StateView);
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(JSON.stringify({
                    count,
                    source,
                    family,
                    expected,
                    actual,
                }));
            }
        }
    }

    const iterations = count <= 8 ? 10_000 : count === 16 ? 4_000 : 1_500;
    const projectClosure = createResultProjector();
    const projectCandidate = createResultProjector(true);
    const planes = [];
    for (const [family, candidate] of [[
        "S",
        s,
    ], [
        "D",
        d,
    ]] as const) {
        planes.push({
            family,
            successAB: pair(
                rotate(sources, source => closure.parseState(source)),
                rotate(sources, source => candidate.parseState(source)),
                iterations,
                false,
            ),
            successBA: pair(
                rotate(sources, source => closure.parseState(source)),
                rotate(sources, source => candidate.parseState(source)),
                iterations,
                true,
            ),
            internalAB: pair(
                rotate(sources, source => {
                    const state = new baselineApi.ParserState<Slots>(
                        source,
                    );
                    closure.parser(state);
                    return state;
                }),
                rotate(sources, source => {
                    const state = new RunState<Slots>(source);
                    candidate.parser(state);
                    return state;
                }),
                iterations,
                false,
            ),
            resultBA: pair(
                rotate(sources, source => projectClosure(
                    closure.parseState(source) as ParserState<unknown>,
                )),
                rotate(sources, source => projectCandidate(
                    candidate.parseState(source),
                )),
                iterations,
                true,
            ),
            failureAB: pair(
                () => closure.parseState(failure),
                () => candidate.parseState(failure),
                Math.max(250, iterations >> 2),
                false,
            ),
        });
    }

    const auditS = makeCandidate(texts, "S");
    const auditD = makeCandidate(texts, "D");
    auditS.parseState(sources[1]);
    auditD.parseState(sources[1]);
    results.push({
        count,
        iterations,
        sourceLengths: sources.map(source => source.length),
        stateAudit: {
            S: auditS.metrics(),
            D: auditD.metrics(),
        },
        retained: {
            closure: retained(() => makeClosure(texts)),
            direct: retained(() => makeDirectControl(texts)),
            S: retained(() => makeCandidate(texts, "S")),
            D: retained(() => makeCandidate(texts, "D")),
        },
        planes,
    });
}

const report = {
    node: process.version,
    v8: process.versions.v8,
    platform: `${process.platform}-${process.arch}`,
    baselineRoot: resolve(baselineRoot),
    baselineHead: "de36d57",
    baselineControl: "idiomatic any(...members).many(count,count).eof()",
    adversarialCeiling: "direct transaction/bitmask control retained separately",
    diagnostics: "disabled",
    counts,
    results,
};
const json = `${JSON.stringify(report, null, 2)}\n`;
const output = process.env.P3_U_PROFILE_OUT;
if (output) writeFileSync(output, json);
console.log(json);
