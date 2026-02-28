// Barrel re-exports — all sub-modules
export { Parser, type ParserFunction } from "./parser.js";
export { ParserState, createParserContext, spanToString, mergeSpans } from "./state.js";
export type { ParserContext, Span } from "./state.js";
export { mergeErrorState } from "./utils.js";
export { getLazyParser, createLazyCached, lazy } from "./lazy.js";
export { eof, any, dispatch, all, string, regex, trimStateWhitespace, whitespace } from "./leaf.js";
export { regexSpan, manySpan, sepBySpan, wrapSpan } from "./span.js";
export * from "./parsers/index.js";
