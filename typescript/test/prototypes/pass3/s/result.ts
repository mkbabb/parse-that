import type {
    Diagnostic,
    ParserState,
} from "../../../../src/parse/state.js";

type ResultState<T> = Readonly<{
    value: T;
    offset: number;
    isError: boolean;
    furthest: number;
    expected?: readonly string[];
    diagnostics: readonly Diagnostic[];
    fault: ParserState["fault"];
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
        fault: NonNullable<ParserState["fault"]>;
    }>);

const EMPTY = Object.freeze([]) as readonly never[];

/**
 * Consumer-side immutable projection of parse-owned provenance.
 * This is deliberately not part of the staged runtime or Compiled surface.
 */
export function createResultProjector<T>() {
    return (state: ResultState<T>): ParseResult<T> => {
        const diagnostics = state.diagnostics.length === 0
            ? EMPTY
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
        const expected = state.expected === undefined
            ? EMPTY
            : Object.freeze([...state.expected]);
        if (state.fault) {
            return Object.freeze({
                offset: state.offset,
                furthest: state.furthest,
                expected,
                diagnostics,
                kind: "fault",
                value: state.value,
                fault: Object.freeze({ ...state.fault }),
            });
        }
        if (state.isError) {
            return Object.freeze({
                offset: state.offset,
                furthest: state.furthest,
                expected,
                diagnostics,
                kind: "mismatch",
                value: state.value,
            });
        }
        return {
            diagnostics,
            kind: "ok",
            value: state.value,
        };
    };
}

const defaultProjector = createResultProjector<unknown>();

export function resultFromState<T>(state: ResultState<T>): ParseResult<T> {
    return defaultProjector(
        state as ResultState<unknown>,
    ) as ParseResult<T>;
}
