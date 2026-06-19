// Subpath entry: "@mkbabb/parse-that/diagnostics" (A.W3).
//
// The diagnostic accumulation tier — furthest-offset error merging plus the
// opt-in collected-diagnostics buffer and its enable/disable toggles. The
// Diagnostic/Suggestion/SecondarySpan shapes travel with it.
export {
    mergeErrorState,
    enableDiagnostics,
    disableDiagnostics,
    collectDiagnostic,
    getCollectedDiagnostics,
    clearCollectedDiagnostics,
} from "./utils.js";
export type { Suggestion, SecondarySpan, Diagnostic } from "./utils.js";
