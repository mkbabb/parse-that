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
    createResultProjector,
} from "../s/result.js";
import {
    RunState,
} from "../s/run-state.js";
import type {
    Spanned,
} from "../s/kernel.js";
import {
    makeOverlapCandidate,
    OPAQUE,
    overlapSources,
    overlapSpecs,
    type OverlapSlot,
    type OverlapSlots,
} from "./overlap-fixture.js";

const baselineRoot = process.env.P2_BASELINE_ROOT;
if (!baselineRoot) throw new Error("P2_BASELINE_ROOT is required");
const api = await import(pathToFileURL(resolve(
    baselineRoot,
    "src/parse/index.ts",
)).href) as typeof import("../../../../src/parse/index.js");

type ControlArm = Readonly<{
    member: number;
    parser: Parser<OverlapSlot>;
}>;
type StateView = Readonly<{
    value: unknown;
    offset: number;
    isError: boolean;
    furthest: number;
    expected?: readonly string[];
    diagnostics: readonly unknown[];
    fault?: unknown;
}>;

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

function controlArms(count: number): readonly ControlArm[] {
    return overlapSpecs(count).flatMap(spec => {
        if (spec.kind === "choice") {
            return spec.texts.map(text => ({
                member: spec.member,
                parser: spanned(api.string(text)) as Parser<OverlapSlot>,
            }));
        }
        if (spec.kind === "recovery") {
            const expected = api.string(spec.expected) as unknown as Parser<
                string | typeof OPAQUE
            >;
            const recovered = expected.recover(
                api.string(spec.source),
                OPAQUE,
            );
            return [{
                member: spec.member,
                parser: spanned(recovered) as Parser<OverlapSlot>,
            }];
        }
        return [{
            member: spec.member,
            parser: spanned(api.string(spec.text)) as Parser<OverlapSlot>,
        }];
    });
}

function rollbackControl<T>(
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

function makeControl(count: number): Parser<OverlapSlots> {
    const arms = controlArms(count);
    return new api.Parser<OverlapSlots>(state => {
        const rootOffset = state.offset;
        const rootValue = state.value;
        const rootDiagnostics = state.diagnostics.length;
        const slots = new Array<OverlapSlot>(count);
        const used = new Uint8Array(count);
        const visited = new Set<string>();
        let usedMask = 0n;
        let distinct = 0;

        const search = (): boolean => {
            if (
                state.offset === state.src.length
                && distinct === count
            ) {
                state.value = [...slots];
                state.isError = false;
                return true;
            }
            const key = `${state.offset}/${usedMask.toString(36)}`;
            if (visited.has(key) || visited.size >= 10_000) return false;
            visited.add(key);

            for (const arm of arms) {
                if (used[arm.member]) continue;
                const offset = state.offset;
                const value = state.value;
                const diagnostics = state.diagnostics.length;
                arm.parser.parser(state as ParserState<OverlapSlot>);
                if (state.isError) {
                    rollbackControl(state, offset, value, diagnostics, false);
                    continue;
                }
                used[arm.member] = 1;
                usedMask |= 1n << BigInt(arm.member);
                distinct++;
                slots[arm.member] = state.value as OverlapSlot;
                if (search()) return true;
                used[arm.member] = 0;
                usedMask &= ~(1n << BigInt(arm.member));
                distinct--;
                rollbackControl(state, offset, value, diagnostics, false);
            }
            return false;
        };

        return search()
            ? state
            : rollbackControl(
                state,
                rootOffset,
                rootValue,
                rootDiagnostics,
                true,
            );
    });
}

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

function failureView(state: StateView) {
    const { value: _, ...failure } = view(state);
    return failure;
}

function median(values: readonly number[]): number {
    return [...values].sort((left, right) => left - right)[values.length >> 1];
}

let blackhole: unknown;
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

const counts = [4, 8, 16, 33] as const;
const points: unknown[] = [];
const audits = [];
const allocations = [];
const projectControl = createResultProjector();
const projectCandidate = createResultProjector(true);

for (const count of counts) {
    const control = makeControl(count);
    const candidate = makeOverlapCandidate(count);
    const sources = overlapSources(count);
    const failure = "~";
    const iterations = count === 4
        ? 2_000
        : count === 8
            ? 800
            : count === 16
                ? 200
                : 40;

    for (const source of sources) {
        const left = view(control.parseState(source));
        const right = view(candidate.parseState(source));
        if (!isDeepStrictEqual(left, right)) {
            throw new Error(`unequal success ${count}: ${JSON.stringify({
                control: left,
                candidate: right,
            })}`);
        }
        const metrics = candidate.metrics();
        if (metrics.residuals === 0) {
            throw new Error(`overlap fixture ${count} used no residual route`);
        }
    }
    const controlFailure = failureView(control.parseState(failure));
    const candidateFailure = failureView(candidate.parseState(failure));
    if (!isDeepStrictEqual(controlFailure, candidateFailure)) {
        throw new Error(`unequal failure ${count}: ${JSON.stringify({
            control: controlFailure,
            candidate: candidateFailure,
        })}`);
    }

    const planes = [
        {
            name: "state",
            control: () => view(control.parseState(sources[0])),
            candidate: () => view(candidate.parseState(sources[0])),
        },
        {
            name: "value",
            control: () => control.parseState(sources[1]).value,
            candidate: () => candidate.parseState(sources[1]).value,
        },
        {
            name: "internal",
            control: () => {
                const state = new api.ParserState<OverlapSlots>(sources[2]);
                control.parser(state);
                return view(state);
            },
            candidate: () => {
                const state = new RunState<OverlapSlot[]>(sources[2]);
                candidate.parser(state);
                return view(state);
            },
        },
        {
            name: "result",
            control: () => projectControl(
                control.parseState(sources[0]) as ParserState<unknown>,
            ),
            candidate: () => projectCandidate(
                candidate.parseState(sources[0]),
            ),
        },
        {
            name: "failure",
            control: () => failureView(control.parseState(failure)),
            candidate: () => failureView(candidate.parseState(failure)),
        },
    ] as const;

    for (const plane of planes) {
        const left = plane.control();
        const right = plane.candidate();
        if (!isDeepStrictEqual(left, right)) {
            throw new Error(`unequal ${count}/${plane.name}`);
        }
        points.push({
            count,
            plane: plane.name,
            sourceCodeUnits: plane.name === "failure"
                ? failure.length
                : sources[0].length,
            ...compare(plane.control, plane.candidate, iterations),
        });
    }

    candidate.parseState(sources[0]);
    audits.push({ count, metrics: candidate.metrics() });
    allocations.push({
        count,
        controlGrammar: retained(() => makeControl(count)),
        candidateGrammar: retained(() => makeOverlapCandidate(count)),
        controlResult: retained(() => control.parseState(sources[0])),
        candidateResult: retained(() => candidate.parseState(sources[0])),
    });
}

const output = {
    subject: "P2-UO-mixed-overlap",
    node: process.version,
    v8: process.versions.v8,
    baselineRoot,
    baselineControl:
        "accepted-M2 Parser leaves plus consumer-owned exhaustive slot search",
    counts,
    samples: 11,
    points,
    audits,
    allocations,
};
const serialized = `${JSON.stringify(output)}\n`;
const outputPath = process.env.P2_UO_OUTPUT;
if (outputPath) writeFileSync(outputPath, serialized);
console.log(serialized);
