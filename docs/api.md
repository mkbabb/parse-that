# Parser Combinator Library API

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

### `sepBy<S>(sep: Parser<S>, min: number = 0, max: number = Infinity): Parser<(T | S)[]>`

Applies the current parser, followed by the sep parser and the first parser repeatedly,
from min to max times. Returns a new parser that will output an array of the results of
all successful applications of the first and second parsers.

### `debug(name: string = "", logger: (...s: any[]) => void = console.log): Parser<T>`

Applies the current parser and logs a debug message with the name provided (default is
"") and the logger function provided (default is console.log). Returns a new parser that
will output the result of the first parser.

### `toString(indent: number = 0): string`

Returns a string representation of the current parser with an optional indent value
(default is 0).

## ParserState<T>

A class representing the state of a parser after it has been applied to a string.

### `constructor(public src: string, public offset: number = 0, public value?: T, public isError = false, public errorOffset = offset)`

Creates a new instance of a parser state.

### `next(len: number): ParserState<T>`

Returns a new parser state with the offset incremented by len.

### `ok(value: T): ParserState<T>`

Returns a new parser state with the value and isError set to false.

### `err(value?: T): ParserState<T>`

Returns a new parser state with the value and isError set to true, and the errorOffset
set to the current offset.

### `addCursor(cursor: string): string`

Returns a new string with a cursor added at the current offset.

## Functions

### `eof<T>(): Parser<T | undefined>`

Returns a new parser that succeeds if the end of the input has been reached, otherwise
fails.

### `lazy<T>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<() => Parser<T>>)`

void A decorator function that lazily initializes a parser.

### `any<T extends any[]>(...parsers: T): Parser<ExtractValue<T>[number]>`

Returns a new parser that applies all parsers in the input list until one succeeds, then
returns its output.

### `all<T extends any[]>(...parsers: T): Parser<ExtractValue<T>>`

Returns a new parser that applies all parsers in the input list in order and returns an
array of their outputs.

### `string(str: string): Parser<string>`

Returns a new parser that succeeds if the input string starts with the provided str,
otherwise fails.

### `regex(r: RegExp): Parser<string>`

Returns a new parser that succeeds if the input string matches the provided r regular
expression, otherwise fails.

### `whitespace: Parser<string>`

A pre-defined regular expression parser that matches any whitespace character.
