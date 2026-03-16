---
title: Leaf Parsers
order: 12
section: parse-that
---

# Leaf Parsers

Leaf parsers are the primitive building blocks. They match literal strings, patterns, or structural conditions directly against the input. All are standalone functions imported from the library.

```ts
import { string, regex, eof, any, all, dispatch } from "@mkbabb/parse-that";
```

## `string(s)`

Match an exact string literal. Uses `charCodeAt` for single-character strings and `startsWith` for longer ones.

```ts
const arrow = string("=>");
arrow.parse("=>"); // "=>"
```

**Signature:** `string(s: string): Parser<string>`

## `regex(r, matchFunction?)`

Match a regular expression at the current position. The regex is internally converted to sticky mode (`/y` flag) so it anchors to the current offset.

Without `matchFunction`, uses `test()` + `substring()` to avoid allocating a `RegExpMatchArray`. When a custom `matchFunction` is provided, the full `exec()` result is passed to it.

```ts
const ident = regex(/[a-zA-Z_]\w*/);
ident.parse("foo_bar"); // "foo_bar"

// With custom match function: extract a capture group
const quoted = regex(/"([^"]*)"/, m => m?.[1] ?? null);
quoted.parse('"hello"'); // "hello"
```

**Signature:** `regex(r: RegExp, matchFunction?: (match: RegExpMatchArray | null) => string | null): Parser<string>`

## `eof()`

Succeed only when the input is fully consumed (offset >= source length). Returns `undefined` on success.

```ts
const full = regex(/\d+/).skip(eof());
full.parse("123"); // "123"
full.parse("123x"); // error
```

**Signature:** `eof(): Parser<unknown>`

## `any(...parsers)`

Ordered alternation: try each parser in sequence, return the first success. Equivalent to chaining `.or()` but accepts any number of alternatives.

```ts
const literal = any(
    string("true").map(() => true),
    string("false").map(() => false),
    string("null").map(() => null),
);
literal.parse("false"); // false
```

**Signature:** `any<T>(...parsers: Parser<T>[]): Parser<T>`

## `all(...parsers)`

Sequential composition: parse each parser in order, return an array of all values. If any parser fails, the whole sequence fails and backtracks.

```ts
const triple = all(regex(/\w+/), string(":"), regex(/\d+/));
triple.parse("age:30"); // ["age", ":", "30"]
```

**Signature:** `all<T>(...parsers: Parser<T>[]): Parser<T[]>`

## `dispatch(table)`

O(1) first-character dispatch for alternation. Maps ASCII characters to parsers via a lookup table, avoiding the sequential trial of `any()`.

Keys in the table can be:
- Single characters: `"a"`, `"{"`
- Character ranges: `"0-9"`, `"a-z"`
- Multiple characters: `"tf"` (matches `t` or `f`)

```ts
const jsonValue = dispatch({
    '"': jsonString,
    "0-9": jsonNumber,
    "-": jsonNumber,
    "{": jsonObject,
    "[": jsonArray,
    "t": string("true").map(() => true),
    "f": string("false").map(() => false),
    "n": string("null").map(() => null),
});
```

**Signature:** `dispatch<T>(table: Record<string, Parser<T>>): Parser<T>`

## `whitespace`

A pre-built `regex(/\s*/)` parser for matching optional whitespace. Used internally by `.trim()` when no custom parser is provided.

```ts
import { whitespace } from "@mkbabb/parse-that";

const token = string("hello").skip(whitespace);
```

Note: for hot paths, the library uses an optimized `trimStateWhitespace` function that operates with a `charCodeAt` loop instead of regex, and is invoked automatically when you use `.trim()` with the default whitespace parser.

## Domain Parsers

The library also ships higher-level parsers built from these primitives:

```ts
import { jsonParser, csvParser } from "@mkbabb/parse-that";

// Full JSON parser with dispatch-based value routing
const json = jsonParser();
json.parse('{"key": [1, 2, 3]}');

// RFC 4180 CSV parser
const csv = csvParser();
csv.parse('name,age\n"Alice",30');
```

Utility parsers for common patterns:

```ts
import { escapedString, quotedString, numberParser } from "@mkbabb/parse-that";

// String with escape sequences (\n, \t, \uXXXX, etc.)
const str = escapedString('"');

// Quoted string with configurable quote character
const q = quotedString("'");

// IEEE 754 number (integers, floats, exponents)
const num = numberParser();
```
