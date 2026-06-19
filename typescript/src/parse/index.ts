// Barrel re-exports — all sub-modules
export { Parser, type ParserFunction } from "./parser.js";
export { ParserState, createParserContext, spanToString, mergeSpans } from "./state.js";
export type { ParserContext, Span } from "./state.js";
export { mergeErrorState, enableDiagnostics, disableDiagnostics, collectDiagnostic, getCollectedDiagnostics, clearCollectedDiagnostics, skipWhitespace, skipBlockComments } from "./utils.js";
export type { Suggestion, SecondarySpan, Diagnostic } from "./utils.js";
export { getLazyParser, createLazyCached, lazy } from "./lazy.js";
export { memoize, mergeMemos, resetPackrat } from "./packrat.js";
export { eof, any, dispatch, all, string, regex, trimStateWhitespace, whitespace } from "./leaf.js";
export { stringSpan, regexSpan, manySpan, sepBySpan, wrapSpan, optSpan, skipSpan, nextSpan, altSpan, takeUntilAnySpan, negateSpan, peekSpan, notSpan, minusSpan, lookAheadSpan } from "./span.js";
// NOTE: the SpanParser tagged-union (span.ts) is intentionally NOT re-exported —
// it measured ~10–14% slower than the closure span combinators on V8/TS (A.W3
// bench); the §7 jump-table hypothesis is falsified for the TS lane. It is kept
// module-internal as the BBNF-codegen data foundation, not a public dispatch API.
export { containsDelimiter, splitBalanced } from "./split.js";
export * from "./parsers/index.js";
