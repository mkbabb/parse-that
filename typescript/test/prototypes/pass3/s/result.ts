import type {
    Diagnostic,
} from "../../../../src/parse/state.js";
import type { StagedFault } from "./run-state.js";

type ResultState<T> = Readonly<{
    value: T;
    offset: number;
    isError: boolean;
    furthest: number;
    expected?: readonly string[];
    diagnostics: readonly Diagnostic[];
    fault: StagedFault | undefined;
}>;

type ImmutableField<T> = T extends readonly (infer U)[]
    ? readonly Readonly<U>[]
    : T;
export type ResultDiagnostic = {
    readonly [K in keyof Diagnostic]: ImmutableField<Diagnostic[K]>;
};
type ResultEvidence = Readonly<{
    offset: number;
    furthest: number;
    expected: readonly string[];
    diagnostics: readonly ResultDiagnostic[];
}>;
export type ParseResult<T> =
    | Readonly<{
        kind: "ok";
        value: T;
        diagnostics: readonly ResultDiagnostic[];
    }>
    | (ResultEvidence & Readonly<{ kind: "mismatch"; value: unknown }>)
    | (ResultEvidence & Readonly<{
        kind: "fault";
        value: unknown;
        fault: StagedFault;
    }>);

const EMPTY = Object.freeze([]) as readonly never[];

/**
 * Consumer-side immutable projection of parse-owned provenance.
 * This is deliberately not part of the staged runtime or Compiled surface.
 */
export function createResultProjector<T>(
    diagnosticsAreImmutable = false,
) {
    return (state: ResultState<T>): ParseResult<T> => {
        const diagnostics = diagnosticsAreImmutable
            ? state.diagnostics.length === 0
                ? state.diagnostics as readonly ResultDiagnostic[]
                : Object.freeze(
                    state.diagnostics,
                ) as readonly ResultDiagnostic[]
            : state.diagnostics.length === 0
            ? EMPTY
            : Object.isFrozen(state.diagnostics)
                && Object.isFrozen(state.diagnostics[0])
                ? state.diagnostics as readonly ResultDiagnostic[]
                : Object.freeze(state.diagnostics.map(diagnostic =>
                    Object.freeze({
                        ...diagnostic,
                        expected: Object.freeze([...diagnostic.expected]),
                        suggestions: Object.freeze(
                            diagnostic.suggestions.map(suggestion =>
                                Object.freeze({ ...suggestion })
                            ),
                        ),
                        secondarySpans: Object.freeze(
                            diagnostic.secondarySpans.map(span =>
                                Object.freeze({ ...span })
                            ),
                        ),
                    }) as ResultDiagnostic
                ));
        const fault = state.fault;
        if (!fault && !state.isError) {
            return {
                diagnostics,
                kind: "ok",
                value: state.value,
            };
        }
        const expected = state.expected === undefined
            ? EMPTY
            : Object.freeze([...state.expected]);
        if (fault) {
            return Object.freeze({
                offset: state.offset,
                furthest: state.furthest,
                expected,
                diagnostics,
                kind: "fault",
                value: state.value,
                fault: Object.freeze({ ...fault }),
            });
        }
        return Object.freeze({
            offset: state.offset,
            furthest: state.furthest,
            expected,
            diagnostics,
            kind: "mismatch",
            value: state.value,
        });
    };
}

const defaultProjector = createResultProjector<unknown>();

export function resultFromState<T>(state: ResultState<T>): ParseResult<T> {
    return defaultProjector(
        state as ResultState<unknown>,
    ) as ParseResult<T>;
}
