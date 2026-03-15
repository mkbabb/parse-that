// Barrel re-exports — all sub-modules
export { Parser, type ParserFunction } from "./parser.js";
export { ParserState, createParserContext, spanToString, mergeSpans } from "./state.js";
export type { ParserContext, Span } from "./state.js";
export { mergeErrorState, enableDiagnostics, disableDiagnostics, collectDiagnostic, getCollectedDiagnostics, clearCollectedDiagnostics } from "./utils.js";
export type { Suggestion, SecondarySpan, Diagnostic } from "./utils.js";
export { getLazyParser, createLazyCached, lazy } from "./lazy.js";
export { eof, any, dispatch, all, string, regex, trimStateWhitespace, whitespace } from "./leaf.js";
export { stringSpan, regexSpan, manySpan, sepBySpan, wrapSpan, optSpan, skipSpan, nextSpan, altSpan, takeUntilAnySpan } from "./span.js";
export { containsDelimiter, splitBalanced } from "./split.js";
export * from "./parsers/index.js";
