import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
    disableDiagnostics,
    enableDiagnostics,
    type Parser,
    type ParserState,
} from "../../../../src/parse/index.js";
import {
    choice,
    literal,
    type Spanned,
} from "../s/kernel.js";
import {
    compileUnordered,
    required,
} from "../u/unordered.js";

const baselineRoot = process.env.P3_BASELINE_ROOT;
if (!baselineRoot) throw new Error("P3_BASELINE_ROOT is required");
const api = await import(pathToFileURL(resolve(
    baselineRoot,
    "src/parse/index.ts",
)).href) as typeof import("../../../../src/parse/index.js");

const OPAQUE = Object.freeze({ kind: "opaque" } as const);
type Slot = Spanned<string | typeof OPAQUE>;
const components = ["ab", "bad;", "c03;"] as const;

function permutations<T>(values: readonly T[]): T[][] {
    if (values.length === 0) return [[]];
    return values.flatMap((value, index) =>
        permutations([
            ...values.slice(0, index),
            ...values.slice(index + 1),
        ]).map(rest => [value, ...rest])
    );
}
const sources = permutations(components).map(parts => parts.join(""));

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

function control(): Parser<readonly Slot[]> {
    const arms = [
        { member: 0, parser: spanned(api.string("ab")) },
        { member: 0, parser: spanned(api.string("a")) },
        { member: 1, parser: spanned(api.string("b")) },
        {
            member: 2,
            parser: spanned(
                (api.string("good;") as unknown as Parser<
                    string | typeof OPAQUE
                >).recover(api.string("bad;"), OPAQUE),
            ),
        },
        { member: 3, parser: spanned(api.string("c03;")) },
    ] as const;
    return new api.Parser(state => {
        const rootOffset = state.offset;
        const rootValue = state.value;
        const rootDiagnostics = state.diagnostics.length;
        const slots = new Array<Slot>(4);
        const used = new Uint8Array(4);
        const visited = new Set<string>();
        let usedMask = 0n;

        const rollback = (
            offset: number,
            value: unknown,
            diagnostics: number,
            isError: boolean,
        ) => {
            state.offset = offset;
            state.value = value as readonly Slot[];
            state.diagnostics.length = diagnostics;
            state.isError = isError;
        };
        const search = (distinct: number): boolean => {
            if (state.offset === state.src.length && distinct === 4) {
                state.value = [...slots];
                state.isError = false;
                return true;
            }
            const key = `${state.offset}/${usedMask.toString(36)}`;
            if (visited.has(key)) return false;
            visited.add(key);
            for (const arm of arms) {
                if (used[arm.member]) continue;
                const offset = state.offset;
                const value = state.value;
                const diagnostics = state.diagnostics.length;
                arm.parser.parser(state as ParserState<never>);
                if (state.isError) {
                    rollback(offset, value, diagnostics, false);
                    continue;
                }
                used[arm.member] = 1;
                usedMask |= 1n << BigInt(arm.member);
                slots[arm.member] = state.value as Slot;
                if (search(distinct + 1)) return true;
                used[arm.member] = 0;
                usedMask &= ~(1n << BigInt(arm.member));
                rollback(offset, value, diagnostics, false);
            }
            return false;
        };

        if (search(0)) return state;
        rollback(rootOffset, rootValue, rootDiagnostics, true);
        return state;
    });
}

function candidate() {
    return compileUnordered("all", [
        required(choice(literal("ab"), literal("a")).spanned()),
        required(literal("b").spanned()),
        required(
            literal("good;")
                .recover(literal("bad;"), OPAQUE)
                .spanned(),
        ),
        required(literal("c03;").spanned()),
    ], "D");
}

function view(state: {
    value: unknown;
    offset: number;
    isError: boolean;
    furthest: number;
    expected?: readonly string[];
    diagnostics: readonly unknown[];
    fault?: unknown;
}) {
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

const controlParser = control();
const candidateParser = candidate();
const modes = [false, true].map(diagnostics => {
    if (diagnostics) {
        api.enableDiagnostics();
        enableDiagnostics();
    } else {
        api.disableDiagnostics();
        disableDiagnostics();
    }
    const cases = sources.map(source => {
        const left = view(controlParser.parseState(source));
        const right = view(candidateParser.parseState(source));
        return {
            source,
            control: left,
            candidate: right,
            equal: JSON.stringify(left) === JSON.stringify(right),
        };
    });
    return {
        diagnostics,
        cases,
        equal: cases.every(entry => entry.equal),
    };
});
api.disableDiagnostics();
disableDiagnostics();

const [off, on] = modes;
const diagnosticOffset = (entry: (typeof off.cases)[number]) =>
    (entry.control.diagnostics[0] as { furthestOffset: number }).furthestOffset;
const candidateDiagnosticOffset = (entry: (typeof off.cases)[number]) =>
    (entry.candidate.diagnostics[0] as { furthestOffset: number }).furthestOffset;
const controlOffsets = off.cases.map(diagnosticOffset);
const candidateOffsets = off.cases.map(candidateDiagnosticOffset);
if (
    off.equal
    || !on.equal
    || off.cases.filter(entry => !entry.equal).length !== 4
    || JSON.stringify(controlOffsets) !== JSON.stringify([10, 6, 1, 1, 10, 5])
    || JSON.stringify(candidateOffsets) !== JSON.stringify([10, 10, 2, 2, 10, 6])
) {
    throw new Error("same-FIRST hostile disposition drifted");
}
for (const mode of modes) {
    for (const entry of mode.cases) {
        if (
            JSON.stringify(entry.control.value)
                !== JSON.stringify(entry.candidate.value)
            || entry.control.offset !== entry.candidate.offset
            || entry.control.isError !== entry.candidate.isError
        ) {
            throw new Error(`semantic product drift for ${entry.source}`);
        }
    }
}

const output = {
    subject: "P3-same-FIRST-recovery",
    baseline: "de36d57dccdd20068b8c11a78f6e83d42e7d681f",
    modes,
    equal: modes.every(entry => entry.equal),
};
if (process.env.P3_SF_OUTPUT) {
    writeFileSync(process.env.P3_SF_OUTPUT, `${JSON.stringify(output)}\n`);
}
console.log(JSON.stringify(output));
