// Subpath entry: "@mkbabb/parse-that/core" (A.W3).
//
// The zero-side-effect primitive set: the Parser core, state, leaf parsers, the
// closure span combinators, lazy, and the balanced-split helpers. A consumer that
// imports only this never pulls the diagnostics accumulator, the packrat tier, or
// the json/csv domain parsers.
export { Parser, type ParserFunction } from "./parser.js";
export {
    ParserState,
    createParserContext,
    spanToString,
    mergeSpans,
} from "./state.js";
export type { ParserContext, Span } from "./state.js";
export { getLazyParser, createLazyCached, lazy } from "./lazy.js";
export {
    eof,
    any,
    dispatch,
    all,
    string,
    regex,
    trimStateWhitespace,
    whitespace,
} from "./leaf.js";
export {
    stringSpan,
    regexSpan,
    manySpan,
    sepBySpan,
    wrapSpan,
    optSpan,
    skipSpan,
    nextSpan,
    altSpan,
    takeUntilAnySpan,
    negateSpan,
    peekSpan,
    notSpan,
    minusSpan,
    lookAheadSpan,
} from "./span.js";
export { containsDelimiter, splitBalanced } from "./split.js";
