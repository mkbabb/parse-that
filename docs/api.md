# API

All exports are re-exported from the barrel `src/parse/index.ts`. Core types live in
`parser.ts`, leaf parsers in `leaf.ts`, span variants in `span.ts`, and domain parsers
under `parsers/`.

## `Parser<T>`

The main class used for building parsers. It takes a ParserFunction<T> and an optional
ParserContext as constructor arguments.

### `parse(val: string): T`

Applies the parser to a string and returns the result.

### `then<S>(next: Parser<S | T>): Parser<[T, S]>`

Applies the current parser, then applies the next parser if the first one succeeds.
Returns a new parser that will output an array of the results of both parsers.

### `or<S>(other: Parser<S | T>): Parser<T | S>`

Applies the current parser, if it fails, applies the other parser. Returns a new parser
that will output the result of the first parser that succeeds.

### `chain<S>(fn: (value: T) => Parser<S | T>, chainError: boolean = false): Parser<T | S>`

Applies the current parser, then applies the parser returned by the fn function using
the result of the previous parser as input. Returns a new parser that will output the
result of the last parser that succeeded.

### `map<S>(fn: (value: T) => S, mapError: boolean = false): Parser<S>`

Applies the current parser, then applies the fn function to the output of the first
parser. Returns a new parser that will output the result of the fn function.

### `skip<S>(parser: Parser<S>): Parser<T>`

Applies the current parser, then applies the parser but returns the output of the first
parser. Returns a new parser that will output the result of the first parser.

### `next<S>(parser: Parser<S>): Parser<S>`

Applies the current parser, then applies the parser but returns the output of the second
parser. Returns a new parser that will output the result of the second parser.

### `opt(): Parser<T | undefined>`

Applies the current parser, if it fails, returns an undefined value. Returns a new
parser that will output the result of the first parser or undefined.

### `not<S>(parser?: Parser<S>): Parser<T>`

Applies the current parser, if it succeeds, applies the parser and fails if it succeeds,
or returns the result of the first parser. If no parser is provided, it negates the
output of the first parser. Returns a new parser that will output the result of the
first parser if the second parser fails or nothing if it succeeds.

### `wrap<L, R>(start: Parser<L>, end: Parser<R>): Parser<T>`

Applies the start parser, then applies the current parser, then applies the end parser.
Returns a new parser that will output the result of the first parser.

### `trim(parser: Parser<T> = whitespace as Parser<T>): Parser<T>`

Applies the current parser with the given parser (default is whitespace) on both sides.
Returns a new parser that will output the result of the first parser.

### `many(min: number = 0, max: number = Infinity): Parser<T[]>`

Applies the current parser repeatedly, from min to max times. Returns a new parser that
will output an array of the results of all successful applications of the first parser.

### `sepBy<S>(sep: Parser<S>, min: number = 0, max: number = Infinity): Parser<T[]>`

Applies the current parser, followed by the sep parser and the first parser repeatedly,
from min to max times. Separator values are discarded. Returns an array of the element
parser results only. Strictly interleaving: `elem (sep elem)*`—never accepts trailing
separators.

### `debug(name: string = "", logger: (...s: any[]) => void = console.error): Parser<T>`

Wraps the parser with debug tracing. Logs a rich status line to stderr on each
invocation: badge (`Ok`/`Err`/`Done`), name, offset, and surrounding source lines
with a cursor at the active column. Nested debug calls indent automatically.

When diagnostics are enabled, the output includes expected sets, suggestions, and
secondary spans.

### `minus<S>(excluded: Parser<S>): Parser<T>`

EBNF set-difference: match self only if `excluded` fails at the same position.
Saves and restores `furthestOffset` so excluded's attempt doesn't pollute diagnostics.

### `recover<S>(sync: Parser<S>, sentinel: T): Parser<T>`

Error recovery: on failure, snapshots the current diagnostic state, invokes `sync`
to skip forward to a known recovery point, and returns `sentinel`. Enables multi-error
parsing when used inside `many()` loops.

### `memoize(): Parser<T>`

Caches parse results by `(parserId, offset)` key. On cache hit, restores offset and
returns the cached value. Required for left-recursive grammars.

### `chain<S>(fn: (value: T) => Parser<S>): Parser<S>`

Monadic bind: parse with self, then use the result to choose the next parser via `fn`.
Enables context-sensitive parsing.

### `toString(indent: number = 0): string`

Returns a string representation of the current parser with an optional indent value
(default is 0).

## ParserState<T>

A class representing the state of a parser after it has been applied to a string.

### `next(len: number): ParserState<T>`

Advances the offset by len in place and returns the same state.

### `ok(value: T): ParserState<T>`

Sets value and isError to false in place, returns the same state.

### `err(value?: T): ParserState<T>`

Sets value and isError to true in place, returns the same state.

### `addCursor(cursor: string): string`

Returns a new string with a cursor added at the current offset. Pretty prints the state
of the currently parsed string.

## Leaf Parsers (`leaf.ts`)

### `eof<T>(): Parser<T | undefined>`

Returns a new parser that succeeds if the end of the input has been reached, otherwise
fails.

### `string(str: string): Parser<string>`

Returns a new parser that succeeds if the input string starts with the provided str,
otherwise fails.

### `regex(r: RegExp): Parser<string>`

Returns a new parser that succeeds if the input string matches the provided r regular
expression, otherwise fails.

### `any<T extends any[]>(...parsers: T): Parser<ExtractValue<T>[number]>`

Returns a new parser that applies all parsers in the input list until one succeeds, then
returns its output.

### `all<T extends any[]>(...parsers: T): Parser<ExtractValue<T>>`

Returns a new parser that applies all parsers in the input list in order and returns an
array of their outputs.

### `dispatch(table: Record<string, Parser>, fallback?: Parser): Parser`

O(1) first-character dispatch. Branches on the first byte of input to select a parser
from the lookup table. Falls back to the fallback parser if no match.

### `whitespace: Parser<string>`

A pre-defined regular expression parser that matches any whitespace character.

## Lazy Evaluation (`lazy.ts`)

### `Parser.lazy<T>(fn: () => Parser<T>): Parser<T>`

Static method. Wraps a parser factory in a lazy thunk — the inner parser is created on
first use. Required for recursive grammars.

### `lazy<T>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<() => Parser<T>>)`

Decorator form. Lazily initializes a parser returned by a method.

## Span Variants (`span.ts`)

Zero-copy parsers that return `Span` (start/end offsets) instead of materialized strings.

### `regexSpan(r: RegExp): Parser<Span>`

Like `regex()`, but returns a Span instead of the matched string.

### `manySpan(parser: Parser<Span>, min?, max?): Parser<Span>`

Like `.many()`, but merges consecutive spans into one.

### `sepBySpan(parser: Parser<Span>, sep: Parser, min?, max?): Parser<Span>`

Like `.sepBy()`, but merges consecutive spans into one.

### `wrapSpan(parser: Parser<Span>, start: Parser, end: Parser): Parser<Span>`

Like `.wrap()`, but returns a merged span covering start through end.

### `optSpan(parser: Parser<Span>): Parser<Span>`

Like `.opt()`, but returns a zero-length span on miss instead of `undefined`.

### `skipSpan(skip: Parser, keep: Parser<Span>): Parser<Span>`

Parses `skip` then `keep`, returns only the keep span.

### `nextSpan(skip: Parser, keep: Parser<Span>): Parser<Span>`

Alias for `skipSpan`—parses skip then keep, returns keep's span.

### `altSpan(...parsers: Parser<Span>[]): Parser<Span>`

Alternation of span-producing parsers. Tries each in order, first success wins.
More efficient than `any(...).map(span => span)` since it avoids boxing through
the generic alternation path.

### `takeUntilAnySpan(excluded: string): Parser<Span>`

Byte-class scanner: match one or more characters NOT in `excluded`. Uses a 128-entry
ASCII lookup table for O(1) per-character checks instead of regex NFA overhead.
TS equivalent of Rust's `take_until_any_span`.

## Domain Parsers (`parsers/`)

### `jsonParser(): Parser<JsonValue>`

Combinator-based JSON parser. Returns a `JsonValue` discriminated union:
`null | boolean | number | string | JsonValue[] | Record<string, JsonValue>`.

### `csvParser(): Parser<string[][]>`

RFC 4180 CSV parser. Handles quoted fields with escaped double-quotes.

### `escapedString(): Parser<string>`

Parses backslash-escaped characters (`\n`, `\t`, `\"`, `\uXXXX`, etc.).

### `quotedString(quote?: string): Parser<string>`

Parses a quoted string with escape handling. Defaults to double quotes.

### `numberParser(): Parser<number>`

Parses a JSON-style number (integer or decimal with optional exponent).

## Diagnostics (`utils.ts` / `debug.ts`)

Structured error diagnostics — opt-in, zero overhead when off.

### `enableDiagnostics(): void`

Activates diagnostic accumulation. Leaf parsers begin recording expected labels at the
furthest offset; `wrap()` and EOF checks emit suggestions and secondary spans.

### `disableDiagnostics(): void`

Deactivates diagnostics and clears accumulated state.

### `Suggestion`

```ts
interface Suggestion {
    kind: "unclosed-delimiter" | "trailing-content";
    message: string;
    openOffset?: number;
}
```

Structured hint emitted by `wrap()` (unclosed delimiters) and EOF checks (trailing
content).

### `SecondarySpan`

```ts
interface SecondarySpan {
    offset: number;
    label: string;
}
```

Points to a related source location — e.g., where an unclosed delimiter was opened.

### `formatExpected(expected: string[]): string`

Formats an expected set with Oxford comma: `expected X, Y, or Z`.

### `addCursor(state, cursor?, error?): string`

Renders ±4 lines of source context around the current offset with gutter line numbers,
a cursor at the active column, and ANSI coloring (red for errors, green for success).
