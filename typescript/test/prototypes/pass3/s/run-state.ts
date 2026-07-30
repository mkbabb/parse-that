import {
    ParserState,
    type Diagnostic,
    type SecondarySpan,
    type Suggestion,
} from "../../../../src/parse/state.js";
import {
    packratEnter,
    packratExit,
} from "../../../../src/parse/packrat.js";
import { isDiagnosticsEnabled } from "../../../../src/parse/utils.js";

export type StagedFault =
    | Readonly<{ kind: "Nesting"; offset: number; limit: number }>
    | Readonly<{ kind: "RecoveryNonProgress"; offset: number }>;

export interface StagedState<T = unknown> {
    src: string;
    value: T;
    offset: number;
    isError: boolean;
    furthest: number;
    expected?: string[];
    readonly suggestions: readonly Suggestion[];
    readonly secondarySpans: readonly SecondarySpan[];
    readonly diagnostics: readonly Diagnostic[];
    fault: StagedFault | undefined;
    liveDepth: number;
    maxDepth: number;
    readonly nestingLimit: number;
    enterLazy(): boolean;
    leaveLazy(): void;
    ok<S>(value: S, offset?: number): StagedState<S>;
    rollback(
        offset: number,
        value: T,
        diagnosticsLength: number,
        isError: boolean,
    ): this;
    pushDiagnostic(diagnostic: Diagnostic): void;
    clearFrontierExtras(): void;
}

const EMPTY_SUGGESTIONS = Object.freeze([]) as unknown as Suggestion[];
const EMPTY_SECONDARY_SPANS =
    Object.freeze([]) as unknown as SecondarySpan[];
const EMPTY_DIAGNOSTICS = Object.freeze([]) as unknown as Diagnostic[];
const EMPTY_EXPECTED = Object.freeze([]) as unknown as string[];

export class RunState<T = unknown> implements StagedState<T> {
    expected?: string[];
    suggestions: readonly Suggestion[] = EMPTY_SUGGESTIONS;
    secondarySpans: readonly SecondarySpan[] = EMPTY_SECONDARY_SPANS;
    diagnostics: readonly Diagnostic[] = EMPTY_DIAGNOSTICS;
    fault: StagedFault | undefined;
    liveDepth = 0;
    maxDepth = 0;

    constructor(
        public src: string,
        public value: T = undefined as T,
        public offset = 0,
        public isError = false,
        public furthest = -1,
        readonly nestingLimit = 256,
    ) {}

    ok<S>(value: S, offset = 0): RunState<S> {
        this.offset += offset;
        (this as RunState<unknown>).value = value;
        this.isError = this.fault !== undefined;
        return this as unknown as RunState<S>;
    }

    rollback(
        offset: number,
        value: T,
        diagnosticsLength: number,
        isError: boolean,
    ): this {
        if (this.offset !== offset) this.offset = offset;
        if (this.value !== value) this.value = value;
        if (this.diagnostics.length !== diagnosticsLength) {
            this.diagnostics = diagnosticsLength === 0
                ? EMPTY_DIAGNOSTICS
                : this.diagnostics.slice(0, diagnosticsLength);
        }
        this.isError = isError || this.fault !== undefined;
        return this;
    }

    pushDiagnostic(diagnostic: Diagnostic): void {
        if (this.diagnostics === EMPTY_DIAGNOSTICS) this.diagnostics = [];
        (this.diagnostics as Diagnostic[]).push(diagnostic);
    }

    enterLazy(): boolean {
        if (this.liveDepth >= this.nestingLimit) {
            this.fault ??= {
                kind: "Nesting",
                offset: this.offset,
                limit: this.nestingLimit,
            };
            this.isError = true;
            return false;
        }
        this.liveDepth++;
        this.maxDepth = Math.max(this.maxDepth, this.liveDepth);
        return true;
    }

    leaveLazy(): void {
        this.liveDepth--;
    }

    clearFrontierExtras(): void {
        this.suggestions = EMPTY_SUGGESTIONS;
        this.secondarySpans = EMPTY_SECONDARY_SPANS;
    }
}

export class StagedParser<T> {
    constructor(
        readonly parser: (state: StagedState<T>) => StagedState<T>,
        readonly nestingLimit = 256,
    ) {}

    parseState(source: string): RunState<T> {
        const epoch = packratEnter();
        try {
            const state = this.parser(
                new RunState<T>(
                    source,
                    undefined as T,
                    0,
                    false,
                    -1,
                    this.nestingLimit,
                ),
            ) as RunState<T>;
            if (state.fault) state.isError = true;
            if (state.isError && isDiagnosticsEnabled()) {
                const furthest = state.furthest >= 0
                    ? state.furthest
                    : state.offset;
                const view = new ParserState(source, undefined, furthest, true);
                view.expected = state.expected;
                view.suggestions = [...state.suggestions];
                view.secondarySpans = [...state.secondarySpans];
                view.furthest = furthest;
                console.error(view.toString());
            }
            return state;
        } finally {
            packratExit(epoch);
        }
    }

    parse(source: string): T {
        return this.parseState(source).value;
    }
}

export function collectRunDiagnostic(
    state: StagedState<unknown>,
    errorOffset: number,
): void {
    const furthest = state.furthest >= 0 ? state.furthest : errorOffset;
    const before = state.src.slice(0, furthest);
    const lastNl = before.lastIndexOf("\n");
    const line = lastNl === -1
        ? 1
        : before.slice(0, lastNl + 1).split("\n").length;
    const column = lastNl === -1 ? furthest : furthest - lastNl - 1;
    const expected = state.expected === undefined
        ? EMPTY_EXPECTED
        : Object.freeze([...state.expected]);
    const suggestions = state.suggestions.length === 0
        ? EMPTY_SUGGESTIONS
        : Object.freeze(state.suggestions.map(suggestion =>
            Object.freeze({ ...suggestion })
        ));
    const secondarySpans = state.secondarySpans.length === 0
        ? EMPTY_SECONDARY_SPANS
        : Object.freeze(state.secondarySpans.map(span =>
            Object.freeze({ ...span })
        ));
    state.pushDiagnostic(Object.freeze({
        offset: errorOffset,
        furthestOffset: furthest,
        line,
        column,
        expected,
        suggestions,
        secondarySpans,
        found: state.src.slice(furthest, furthest + 20).replace(/\n/g, "\\n"),
    }) as Diagnostic);
    state.furthest = -1;
    state.expected = undefined;
    state.clearFrontierExtras();
}
