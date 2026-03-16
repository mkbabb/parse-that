---
title: Overview
order: 10
section: parse-that
---

# parse-that

A parser combinator library with isomorphic TypeScript and Rust implementations. Build parsers by composing small, reusable pieces—string matchers, regex patterns, and combinators like `then`, `or`, and `many`—into complex grammars.

## Features

- **Dual implementation**—TypeScript (npm) and Rust (crates.io) with matching APIs
- **Zero-copy spans**—parse without allocating substrings via the span combinator system
- **Error recovery**—`recover()` combinator collects multiple diagnostics in a single pass
- **Memoization**—built-in packrat memoization with left-recursion support
- **O(1) dispatch**—first-character lookup tables for fast alternation
- **Zero runtime deps**—the TypeScript package has no dependencies

## Installation

### TypeScript

```bash
npm install @mkbabb/parse-that
```

### Rust

```toml
[dependencies]
parse_that = "0.3"
```

## Quick Example

Build a parser for comma-separated integers wrapped in brackets:

```ts
import { Parser, string, regex, any } from "@mkbabb/parse-that";

// Match one integer (with optional sign)
const integer = regex(/-?\d+/).map(Number);

// Match a comma separator, trimming surrounding whitespace
const comma = string(",").trim();

// Match a bracketed list: "[1, 2, 3]"
const intList = integer
    .sepBy(comma, 1)
    .wrap(string("["), string("]"))
    .trim();

const result = intList.parse("[10, -20, 30]");
// result: [10, -20, 30]
```

## Core Concepts

### Parser\<T\>

Every parser is an instance of `Parser<T>`, where `T` is the type of value it produces on success. Parsers are immutable—each combinator method returns a new `Parser` rather than mutating the original.

### ParserState

Parsing operates on a mutable `ParserState` that tracks the current `offset` into the source string, the most recent `value`, and whether an error occurred (`isError`). Backtracking is handled automatically by combinators—on failure, the offset rewinds to where the combinator started.

### Composition

Parsers compose through method chaining:

```ts
// Sequence: parse A then B, return both values
const pair = parserA.then(parserB);       // Parser<[A, B]>

// Alternative: try A, fall back to B
const either = parserA.or(parserB);       // Parser<A | B>

// Transform the result
const mapped = integer.map(n => n * 2);   // Parser<number>
```

### Recursive Grammars

Use `Parser.lazy()` to define recursive parsers without forward-declaration issues:

```ts
const expr: Parser<any> = Parser.lazy(() =>
    any(number, expr.wrap(string("("), string(")")))
);
```

## Next Steps

- [Combinators](./combinators)—all combinator methods on `Parser<T>`
- [Leaf Parsers](./leaf-parsers)—primitive parser constructors
- [Span Combinators](./span-combinators)—zero-copy parsing with spans
