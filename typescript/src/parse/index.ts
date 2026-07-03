// Barrel re-exports — all sub-modules
export { Parser, type ParserFunction } from "./parser.js";
export { ParserState, createParserContext, spanToString, mergeSpans } from "./state.js";
export type { ParserContext, Span } from "./state.js";
export { mergeErrorState, enableDiagnostics, disableDiagnostics, collectDiagnostic, getCollectedDiagnostics, clearCollectedDiagnostics, skipWhitespace, skipBlockComments } from "./utils.js";
export type { Suggestion, SecondarySpan, Diagnostic } from "./utils.js";
export { getLazyParser, createLazyCached, lazy } from "./lazy.js";
export { memoize, mergeMemos, resetPackrat } from "./packrat.js";
export { eof, any, dispatch, all, string, regex, trimStateWhitespace, whitespace } from "./leaf.js";
// The 15 closure-based `*Span` builders were EXCISED in the 1.0.0 cut (S.H2,
// fold row 48): a zero-consumer surface, deprecated in 0.13.0 (PT-Q4). Gate:
// proof:no-span-surface.
export { containsDelimiter, splitBalanced } from "./split.js";
export * from "./parsers/index.js";
