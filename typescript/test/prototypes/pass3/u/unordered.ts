import {
    analyze,
    choiceArms,
    compile,
    type Grammar,
} from "../s/kernel.js";
import {
    RunState,
    StagedParser,
    type StagedState,
} from "../s/run-state.js";
import { isDiagnosticsEnabled } from "../../../../src/parse/utils.js";

export type UnorderedKind = "all" | "some";
export type UnorderedFamily = "S" | "D";

type RequiredMember<T> = Readonly<{
    mode: "required";
    grammar: Grammar<T>;
    min: 1;
    max: 1;
}>;
type OptionalMember<T> = Readonly<{
    mode: "optional";
    grammar: Grammar<T>;
    min: 0;
    max: 1;
}>;
type RepeatedMember<T> = Readonly<{
    mode: "repeated";
    grammar: Grammar<T>;
    min: number;
    max: number;
}>;
export type UnorderedMember<T> =
    | RequiredMember<T>
    | OptionalMember<T>
    | RepeatedMember<T>;

export function required<T>(grammar: Grammar<T>): RequiredMember<T> {
    return { mode: "required", grammar, min: 1, max: 1 };
}

export function optional<T>(grammar: Grammar<T>): OptionalMember<T> {
    return { mode: "optional", grammar, min: 0, max: 1 };
}

export function repeated<T>(
    grammar: Grammar<T>,
    min = 1,
    max = 255,
): RepeatedMember<T> {
    if (
        !Number.isSafeInteger(min)
        || !Number.isSafeInteger(max)
        || min < 0
        || max < Math.max(1, min)
    ) {
        throw new RangeError("unordered repeat bounds are invalid");
    }
    return { mode: "repeated", grammar, min, max };
}

type MemberValue<M> = M extends UnorderedMember<infer T> ? T : never;
type MemberSlot<K extends UnorderedKind, M> =
    M extends RepeatedMember<infer T>
        ? readonly T[]
        : K extends "some"
            ? MemberValue<M> | undefined
            : M extends OptionalMember<infer T>
                ? T | undefined
                : MemberValue<M>;
export type UnorderedSlots<
    K extends UnorderedKind,
    M extends readonly UnorderedMember<unknown>[],
> = {
    -readonly [Index in keyof M]: MemberSlot<K, M[Index]>;
};

export type UnorderedMetrics = Readonly<{
    family: UnorderedFamily;
    explored: number;
    residuals: number;
    checkpoints: number;
    attempts: number;
}>;

export type CompiledUnordered<T> = Readonly<{
    parser: (state: StagedState<T>) => StagedState<T>;
    parseState: (source: string) => RunState<T>;
    metrics: () => UnorderedMetrics;
}>;

type Residual = Readonly<{
    routes: ReadonlyMap<number, readonly number[]>;
    wildcard: readonly number[];
}>;
type Arm = Readonly<{
    member: number;
    firstCodes: readonly number[];
    parser: (state: StagedState<unknown>) => StagedState<unknown>;
}>;

export function compileUnordered<
    const K extends UnorderedKind,
    const M extends readonly UnorderedMember<unknown>[],
>(
    kind: K,
    members: M,
    family: UnorderedFamily,
    stateLimit = 10_000,
): CompiledUnordered<UnorderedSlots<K, M>> {
    if (members.length === 0) {
        throw new RangeError("unordered composition requires a member");
    }
    if (!Number.isSafeInteger(stateLimit) || stateLimit < 1) {
        throw new RangeError("unordered stateLimit must be a positive integer");
    }

    const analyses = members.map(member => analyze(member.grammar));
    const nullable = analyses.findIndex(analysis => analysis.nullable);
    if (nullable >= 0) {
        throw new TypeError(`unordered member ${nullable} is nullable`);
    }
    const arms: Arm[] = members.flatMap((member, memberIndex) =>
        choiceArms(member.grammar).map(grammar => ({
            member: memberIndex,
            firstCodes: analyze(grammar).firstCodes,
            parser: compile(grammar).parser as (
                state: StagedState<unknown>,
            ) => StagedState<unknown>,
        }))
    );
    let disjoint = members.every(member => member.max === 1);
    const disjointRoutes = new Map<number, number>();
    if (disjoint) {
        for (let index = 0; index < arms.length; index++) {
            const codes = arms[index].firstCodes;
            if (
                codes.length !== 1
                || disjointRoutes.has(codes[0])
            ) {
                disjoint = false;
                disjointRoutes.clear();
                break;
            }
            disjointRoutes.set(codes[0], index);
        }
    }
    const bits = members.map((_, index) => 1n << BigInt(index));
    const residualCache = new Map<string, Residual>();
    let lastMetrics: UnorderedMetrics = {
        family,
        explored: 0,
        residuals: 0,
        checkpoints: 0,
        attempts: 0,
    };

    const genericRoot = ((state: StagedState<unknown[]>) => {
        const rootOffset = state.offset;
        const rootValue = state.value;
        const rootDiagnostics = state.diagnostics.length;
        const counts = new Uint16Array(members.length);
        const slots: unknown[] = members.map(member =>
            member.mode === "repeated" ? [] : undefined
        );
        const visited = new Set<string>();
        let usedMask = 0n;
        let distinct = 0;
        let explored = 0;
        let residuals = 0;
        let checkpoints = 0;
        let attempts = 0;

        const countsKey = () => {
            let repeatedKey = "";
            for (let index = 0; index < members.length; index++) {
                if (members[index].max > 1) {
                    repeatedKey += `.${index}:${counts[index]}`;
                }
            }
            return `${usedMask.toString(36)}${repeatedKey}`;
        };
        const available = (index: number) =>
            counts[index] < members[index].max;
        const accepted = () => {
            if (
                state.offset !== state.src.length
                || (kind === "some" && distinct === 0)
            ) {
                return false;
            }
            for (let index = 0; index < members.length; index++) {
                const count = counts[index];
                if (kind === "all") {
                    if (count < members[index].min) return false;
                } else if (count > 0 && count < members[index].min) {
                    return false;
                }
            }
            return true;
        };
        const failLimit = () => {
            state.fault ??= {
                kind: "UnorderedStateLimit",
                offset: state.offset,
                limit: stateLimit,
            };
            state.isError = true;
            return false;
        };
        const makeResidual = (key: string): Residual | undefined => {
            const cached = residualCache.get(key);
            if (cached) return cached;
            if (residualCache.size >= stateLimit) {
                failLimit();
                return undefined;
            }
            const routes = new Map<number, number[]>();
            const wildcard: number[] = [];
            for (let index = 0; index < arms.length; index++) {
                const arm = arms[index];
                if (!available(arm.member)) continue;
                const codes = arm.firstCodes;
                if (codes.length === 0) {
                    wildcard.push(index);
                    continue;
                }
                for (const code of codes) {
                    const route = routes.get(code);
                    if (route) route.push(index);
                    else routes.set(code, [index]);
                }
            }
            const residual = { routes, wildcard };
            residualCache.set(key, residual);
            return residual;
        };
        const candidateIndices = (): readonly number[] | undefined => {
            if (family === "S" || isDiagnosticsEnabled()) {
                const indices: number[] = [];
                for (let index = 0; index < arms.length; index++) {
                    if (available(arms[index].member)) indices.push(index);
                }
                return indices;
            }
            residuals++;
            const residual = makeResidual(countsKey());
            if (!residual) return undefined;
            const routed = residual.routes.get(
                state.src.charCodeAt(state.offset),
            );
            if (residual.wildcard.length === 0) return routed ?? [];
            if (!routed) return residual.wildcard;
            return [...routed, ...residual.wildcard].sort(
                (left, right) => left - right,
            );
        };

        const search = (): boolean => {
            if (accepted()) {
                state.value = slots.map((slot, index) =>
                    members[index].mode === "repeated"
                        ? [...slot as unknown[]]
                        : slot
                );
                state.isError = false;
                return true;
            }
            const key = `${state.offset}/${countsKey()}`;
            if (visited.has(key)) return false;
            if (visited.size >= stateLimit) return failLimit();
            visited.add(key);
            explored++;

            const candidates = candidateIndices();
            if (!candidates || state.fault) return false;
            if (candidates.length === 0) {
                state.furthest = Math.max(state.furthest, state.offset);
                return false;
            }
            for (const armIndex of candidates) {
                const arm = arms[armIndex];
                const index = arm.member;
                const offset = state.offset;
                const value = state.value;
                const diagnostics = state.diagnostics.length;
                const previousCount = counts[index];
                const previousSlot = slots[index];
                const repeatedLength = members[index].mode === "repeated"
                    ? (previousSlot as unknown[]).length
                    : 0;
                checkpoints++;
                attempts++;
                arm.parser(state as StagedState<unknown>);
                if (state.fault) return false;
                if (state.isError) {
                    state.rollback(offset, value, diagnostics, false);
                    continue;
                }
                if (state.offset === offset) {
                    throw new TypeError(
                        `unordered member ${index} became nullable`,
                    );
                }

                counts[index]++;
                if (previousCount === 0) {
                    usedMask |= bits[index];
                    distinct++;
                }
                if (members[index].mode === "repeated") {
                    (previousSlot as unknown[]).push(state.value);
                } else {
                    slots[index] = state.value;
                }
                if (search()) return true;

                counts[index] = previousCount;
                if (previousCount === 0) {
                    usedMask &= ~bits[index];
                    distinct--;
                }
                if (members[index].mode === "repeated") {
                    (previousSlot as unknown[]).length = repeatedLength;
                } else {
                    slots[index] = previousSlot;
                }
                state.rollback(offset, value, diagnostics, false);
                if (state.fault) return false;
            }
            return false;
        };

        const success = search();
        lastMetrics = {
            family,
            explored,
            residuals,
            checkpoints,
            attempts,
        };
        if (success) return state;
        return state.rollback(
            rootOffset,
            rootValue,
            rootDiagnostics,
            true,
        );
    }) as (
        state: StagedState<UnorderedSlots<K, M>>,
    ) => StagedState<UnorderedSlots<K, M>>;
    const disjointRoot = ((state: StagedState<unknown[]>) => {
        const rootOffset = state.offset;
        const rootValue = state.value;
        const rootDiagnostics = state.diagnostics.length;
        const counts = new Uint8Array(members.length);
        const slots: unknown[] = members.map(() => undefined);
        let distinct = 0;
        let attempts = 0;

        while (state.offset < state.src.length) {
            const armIndex = disjointRoutes.get(
                state.src.charCodeAt(state.offset),
            );
            if (armIndex === undefined) {
                state.furthest = Math.max(state.furthest, state.offset);
                break;
            }
            const arm = arms[armIndex];
            const member = arm.member;
            if (counts[member] !== 0) break;
            attempts++;
            arm.parser(state as StagedState<unknown>);
            if (state.isError) break;
            counts[member] = 1;
            distinct++;
            slots[member] = state.value;
        }

        let success = state.offset === state.src.length
            && (kind === "all" || distinct > 0);
        if (success && kind === "all") {
            for (let index = 0; index < members.length; index++) {
                if (counts[index] < members[index].min) {
                    success = false;
                    break;
                }
            }
        }
        lastMetrics = {
            family,
            explored: attempts,
            residuals: 0,
            checkpoints: attempts,
            attempts,
        };
        if (success) {
            state.value = slots;
            state.isError = false;
            return state;
        }
        return state.rollback(
            rootOffset,
            rootValue,
            rootDiagnostics,
            true,
        );
    }) as (
        state: StagedState<UnorderedSlots<K, M>>,
    ) => StagedState<UnorderedSlots<K, M>>;
    const root = (
        family === "D" && disjoint
            ? ((state: StagedState<UnorderedSlots<K, M>>) =>
                isDiagnosticsEnabled()
                    ? genericRoot(state)
                    : disjointRoot(state))
            : genericRoot
    );
    const boundary = new StagedParser(root);

    return {
        parser: root,
        parseState: source => boundary.parseState(source),
        metrics: () => lastMetrics,
    };
}
