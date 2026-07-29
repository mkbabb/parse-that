// Subpath entry: "@mkbabb/parse-that/diagnostics" (A.W3).
//
// The diagnostic tier — furthest-offset error merging plus the opt-in policy
// toggle. Recovered diagnostics travel on each returned ParserState.
export {
    mergeErrorState,
    enableDiagnostics,
    disableDiagnostics,
} from "./utils.js";
export type { Diagnostic, Suggestion, SecondarySpan } from "./state.js";
