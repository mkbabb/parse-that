import type {
    Diagnostic,
    SecondarySpan,
    Suggestion,
} from "../../../../src/parse/state.js";

export type Span = Readonly<{ start: number; end: number }>;
export type Spanned<T> = Readonly<{ value: T; span: Span }>;
export type ClosureFault =
    | Readonly<{ kind: "Nesting"; offset: number; limit: number }>
    | Readonly<{ kind: "RecoveryNonProgress"; offset: number }>;

const EMPTY_EXPECTED = Object.freeze([]) as readonly string[];
const EMPTY_DIAGNOSTICS = Object.freeze([]) as readonly Diagnostic[];
const EMPTY_SECONDARY = Object.freeze([]) as readonly SecondarySpan[];
const EMPTY_SUGGESTIONS = Object.freeze([]) as readonly Suggestion[];

let diagnosticsEnabled = false;

export function enableClosureDiagnostics(): void {
    diagnosticsEnabled = true;
}

export function disableClosureDiagnostics(): void {
    diagnosticsEnabled = false;
}

export class ClosureState<T = unknown> {
    expected?: string[];
    suggestions: readonly Suggestion[] = EMPTY_SUGGESTIONS;
    secondarySpans: readonly SecondarySpan[] = EMPTY_SECONDARY;
    diagnostics: readonly Diagnostic[] = EMPTY_DIAGNOSTICS;
    fault: ClosureFault | undefined;
    liveDepth = 0;
    maxDepth = 0;

    constructor(
        readonly src: string,
        public value: T = undefined as T,
        public offset = 0,
        public isError = false,
        public furthest = -1,
        readonly nestingLimit = 256,
    ) {}

    ok<U>(value: U): ClosureState<U> {
        (this as ClosureState<unknown>).value = value;
        this.isError = this.fault !== undefined;
        return this as unknown as ClosureState<U>;
    }

    fail(label?: string): this {
        if (this.offset > this.furthest) {
            this.furthest = this.offset;
            this.expected = diagnosticsEnabled && label ? [label] : undefined;
            this.suggestions = EMPTY_SUGGESTIONS;
            this.secondarySpans = EMPTY_SECONDARY;
        } else if (
            diagnosticsEnabled
            && label
            && this.offset === this.furthest
        ) {
            if (this.expected) {
                if (!this.expected.includes(label)) this.expected.push(label);
            } else {
                this.expected = [label];
            }
        }
        this.isError = true;
        return this;
    }

    rollback(
        offset: number,
        value: unknown,
        diagnosticLength: number,
        isError: boolean,
    ): this {
        this.offset = offset;
        (this as ClosureState<unknown>).value = value;
        if (this.diagnostics.length !== diagnosticLength) {
            this.diagnostics = diagnosticLength === 0
                ? EMPTY_DIAGNOSTICS
                : this.diagnostics.slice(0, diagnosticLength);
        }
        this.isError = isError || this.fault !== undefined;
        return this;
    }

    pushDiagnostic(diagnostic: Diagnostic): void {
        if (this.diagnostics === EMPTY_DIAGNOSTICS) this.diagnostics = [];
        (this.diagnostics as Diagnostic[]).push(diagnostic);
    }

    resetFrontier(): void {
        this.furthest = -1;
        this.expected = undefined;
        this.suggestions = EMPTY_SUGGESTIONS;
        this.secondarySpans = EMPTY_SECONDARY;
    }
}

type Runner<T> = (state: ClosureState<unknown>) => ClosureState<T>;

export class Closure<T> {
    constructor(readonly run: Runner<T>) {}

    map<U>(project: (value: T) => U): Closure<U> {
        const inner = this.run;
        return new Closure(state => {
            inner(state);
            if (!state.isError) state.ok(project(state.value as T));
            return state as ClosureState<U>;
        });
    }

    or<U>(other: Closure<U>): Closure<T | U> {
        return choice(
            this as Closure<unknown>,
            other as Closure<unknown>,
        ) as Closure<T | U>;
    }

    then<U>(other: Closure<U>): Closure<[T, U]> {
        const first = this.run;
        const second = other.run;
        return new Closure(state => {
            const offset = state.offset;
            const value = state.value;
            const diagnostics = state.diagnostics.length;
            first(state);
            if (state.isError) {
                return state.rollback(
                    offset,
                    value,
                    diagnostics,
                    true,
                ) as ClosureState<[T, U]>;
            }
            const left = state.value as T;
            second(state);
            if (state.isError) {
                return state.rollback(
                    offset,
                    value,
                    diagnostics,
                    true,
                ) as ClosureState<[T, U]>;
            }
            return state.ok([left, state.value as U]);
        });
    }

    next<U>(other: Closure<U>): Closure<U> {
        return pair(this, other, false) as Closure<U>;
    }

    skip<U>(other: Closure<U>): Closure<T> {
        return pair(this, other, true) as Closure<T>;
    }

    many(min = 0): Closure<T[]> {
        if (!Number.isSafeInteger(min) || min < 0) {
            throw new RangeError(
                "repeat minimum must be a nonnegative safe integer",
            );
        }
        const inner = this.run;
        return new Closure(state => {
            const rootOffset = state.offset;
            const rootValue = state.value;
            const rootDiagnostics = state.diagnostics.length;
            const values: T[] = [];
            while (true) {
                const offset = state.offset;
                const value = state.value;
                const diagnostics = state.diagnostics.length;
                inner(state);
                if (state.isError) {
                    state.rollback(
                        offset,
                        value,
                        diagnostics,
                        state.fault !== undefined,
                    );
                    if (state.isError) {
                        return state.rollback(
                            rootOffset,
                            rootValue,
                            rootDiagnostics,
                            true,
                        ) as ClosureState<T[]>;
                    }
                    break;
                }
                if (state.offset === offset) {
                    state.rollback(offset, value, diagnostics, false);
                    break;
                }
                values.push(state.value as T);
            }
            if (values.length >= min) return state.ok(values);
            return state.rollback(
                rootOffset,
                rootValue,
                rootDiagnostics,
                true,
            ) as ClosureState<T[]>;
        });
    }

    sepBy<U>(separator: Closure<U>, min = 0): Closure<T[]> {
        if (!Number.isSafeInteger(min) || min < 0) {
            throw new RangeError(
                "repeat minimum must be a nonnegative safe integer",
            );
        }
        const element = this.run;
        const sep = separator.run;
        return new Closure(state => {
            const rootOffset = state.offset;
            const rootValue = state.value;
            const rootDiagnostics = state.diagnostics.length;
            const values: T[] = [];
            const firstOffset = state.offset;
            const firstValue = state.value;
            const firstDiagnostics = state.diagnostics.length;
            element(state);
            if (state.isError) {
                state.rollback(
                    firstOffset,
                    firstValue,
                    firstDiagnostics,
                    state.fault !== undefined,
                );
            } else if (state.offset !== firstOffset) {
                values.push(state.value as T);
            }

            while (!state.isError && values.length > 0) {
                const offset = state.offset;
                const value = state.value;
                const diagnostics = state.diagnostics.length;
                sep(state);
                if (!state.isError) element(state);
                if (state.isError || state.offset === offset) {
                    state.rollback(
                        offset,
                        value,
                        diagnostics,
                        state.fault !== undefined,
                    );
                    break;
                }
                values.push(state.value as T);
            }
            if (!state.isError && values.length >= min) {
                return state.ok(values);
            }
            return state.rollback(
                rootOffset,
                rootValue,
                rootDiagnostics,
                true,
            ) as ClosureState<T[]>;
        });
    }

    eof(): Closure<T> {
        return this.skip(eof());
    }

    recover<U>(sync: Closure<unknown>, sentinel: U): Closure<T | U> {
        const inner = this.run;
        const synchronize = sync.run;
        return new Closure(state => {
            const offset = state.offset;
            const value = state.value;
            const diagnostics = state.diagnostics.length;
            inner(state);
            if (!state.isError) return state as ClosureState<T | U>;
            if (state.fault) {
                return state.rollback(
                    offset,
                    value,
                    diagnostics,
                    true,
                ) as ClosureState<T | U>;
            }
            collectDiagnostic(state, offset);
            state.rollback(offset, value, state.diagnostics.length, false);
            synchronize(state);
            if (state.isError) {
                return state.rollback(
                    offset,
                    value,
                    diagnostics,
                    true,
                ) as ClosureState<T | U>;
            }
            if (state.offset === offset) {
                state.fault ??= {
                    kind: "RecoveryNonProgress",
                    offset,
                };
                return state.rollback(
                    offset,
                    value,
                    diagnostics,
                    true,
                ) as ClosureState<T | U>;
            }
            return state.ok(sentinel);
        });
    }

    spanned(): Closure<Spanned<T>> {
        const inner = this.run;
        return new Closure(state => {
            const start = state.offset;
            inner(state);
            if (!state.isError) {
                state.ok({
                    value: state.value as T,
                    span: { start, end: state.offset },
                });
            }
            return state as ClosureState<Spanned<T>>;
        });
    }
}

function pair<A, B>(
    firstParser: Closure<A>,
    secondParser: Closure<B>,
    takeFirst: boolean,
): Closure<A | B> {
    const first = firstParser.run;
    const second = secondParser.run;
    return new Closure(state => {
        const offset = state.offset;
        const value = state.value;
        const diagnostics = state.diagnostics.length;
        first(state);
        if (state.isError) {
            return state.rollback(offset, value, diagnostics, true);
        }
        const left = state.value;
        second(state);
        if (state.isError) {
            return state.rollback(offset, value, diagnostics, true);
        }
        if (takeFirst) state.value = left;
        return state;
    }) as Closure<A | B>;
}

export function literal<const T extends string>(text: T): Closure<T> {
    const length = text.length;
    const label = `"${text}"`;
    if (length === 1) {
        const code = text.charCodeAt(0);
        return new Closure(state => {
            if (state.src.charCodeAt(state.offset) !== code) {
                return state.fail(label) as ClosureState<T>;
            }
            state.offset++;
            return state.ok(text);
        });
    }
    return new Closure(state => {
        if (!state.src.startsWith(text, state.offset)) {
            return state.fail(label) as ClosureState<T>;
        }
        state.offset += length;
        return state.ok(text);
    });
}

export function regex(expression: RegExp): Closure<string | undefined> {
    const sticky = new RegExp(
        expression.source,
        expression.flags.replace(/y/g, "") + "y",
    );
    const label = `/${expression.source}/${expression.flags}`;
    return new Closure(state => {
        const start = state.offset;
        sticky.lastIndex = start;
        if (!sticky.test(state.src)) {
            return state.fail(label) as ClosureState<string | undefined>;
        }
        const end = sticky.lastIndex;
        if (end === start) return state.ok(undefined);
        state.offset = end;
        return state.ok(state.src.substring(start, end));
    });
}

export function choice<const P extends readonly Closure<unknown>[]>(
    ...parsers: P
): Closure<P[number] extends Closure<infer T> ? T : never> {
    const runners = parsers.map(parser => parser.run);
    return new Closure(state => {
        const offset = state.offset;
        const value = state.value;
        const diagnostics = state.diagnostics.length;
        for (const run of runners) {
            run(state);
            if (!state.isError) return state;
            state.rollback(
                offset,
                value,
                diagnostics,
                state.fault !== undefined,
            );
            if (state.isError) return state;
        }
        return state.rollback(offset, value, diagnostics, true);
    }) as Closure<P[number] extends Closure<infer T> ? T : never>;
}

export function lazy<T>(get: () => Closure<T>): Closure<T> {
    let parser: Closure<T> | undefined;
    return new Closure(state => {
        if (state.liveDepth >= state.nestingLimit) {
            state.fault ??= {
                kind: "Nesting",
                offset: state.offset,
                limit: state.nestingLimit,
            };
            state.isError = true;
            return state as ClosureState<T>;
        }
        state.liveDepth++;
        state.maxDepth = Math.max(state.maxDepth, state.liveDepth);
        try {
            parser ??= get();
            return parser.run(state);
        } finally {
            state.liveDepth--;
        }
    });
}

export function eof(): Closure<undefined> {
    return new Closure(state =>
        state.offset >= state.src.length
            ? state.ok(undefined)
            : state.fail("<end of input>") as ClosureState<undefined>
    );
}

export class ClosureParser<T> {
    constructor(
        readonly grammar: Closure<T>,
        readonly nestingLimit = 256,
    ) {
        if (!Number.isSafeInteger(nestingLimit) || nestingLimit < 1) {
            throw new RangeError(
                "nestingLimit must be a positive safe integer",
            );
        }
    }

    parseState(source: string): ClosureState<T> {
        return this.grammar.run(
            new ClosureState(source, undefined, 0, false, -1, this.nestingLimit),
        );
    }

    parse(source: string): T {
        return this.parseState(source).value;
    }
}

function collectDiagnostic(
    state: ClosureState<unknown>,
    errorOffset: number,
): void {
    const furthest = state.furthest >= 0 ? state.furthest : errorOffset;
    const lastNewline = state.src.lastIndexOf("\n", furthest - 1);
    const line = lastNewline < 0
        ? 1
        : state.src.slice(0, lastNewline + 1).split("\n").length;
    const column = lastNewline < 0 ? furthest : furthest - lastNewline - 1;
    const expected = state.expected
        ? Object.freeze([...state.expected])
        : EMPTY_EXPECTED;
    const suggestions = state.suggestions.length === 0
        ? EMPTY_SUGGESTIONS
        : Object.freeze(state.suggestions.map(value =>
            Object.freeze({ ...value })
        ));
    const secondarySpans = state.secondarySpans.length === 0
        ? EMPTY_SECONDARY
        : Object.freeze(state.secondarySpans.map(value =>
            Object.freeze({ ...value })
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
    state.resetFrontier();
}
