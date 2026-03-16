---
title: Span Combinators
order: 13
section: parse-that
---

# Span Combinators

Span combinators are zero-copy alternatives to the standard combinators. Instead of extracting substrings, they return `Span` objects—pairs of `{start, end}` offsets into the source string. This avoids substring allocation entirely during parsing; you materialize text only when needed.

```ts
import {
    stringSpan, regexSpan, manySpan, sepBySpan,
    wrapSpan, optSpan, skipSpan, nextSpan,
    mergeSpans, spanToString,
} from "@mkbabb/parse-that";
```

## The Span Type

```ts
interface Span {
    start: number;
    end: number;
}
```

Convert a span to its string content with `spanToString`:

```ts
const span: Span = { start: 0, end: 5 };
const text = spanToString(span, "hello world"); // "hello"
```

Merge two adjacent spans into one covering both regions:

```ts
const merged = mergeSpans(
    { start: 0, end: 5 },
    { start: 5, end: 11 }
); // { start: 0, end: 11 }
```

## Leaf Span Parsers

### `stringSpan(s)`

Match an exact string literal, returning a `Span` instead of the matched string.

```ts
const arrow = stringSpan("=>");
// On "=> x", produces { start: 0, end: 2 }
```

**Signature:** `stringSpan(s: string): Parser<Span>`

### `regexSpan(r)`

Match a regex pattern, returning a `Span` instead of a substring. The regex is converted to sticky mode internally.

```ts
const digits = regexSpan(/\d+/);
// On "  42abc" at offset 2, produces { start: 2, end: 4 }
```

**Signature:** `regexSpan(r: RegExp): Parser<Span>`

## Composite Span Combinators

### `manySpan(inner, min?, max?)`

Like `.many()`, but coalesces all matches into a single `Span` covering the entire matched region instead of building an array.

```ts
const word = regexSpan(/\w/);
const words = manySpan(word, 1);
// On "hello", produces { start: 0, end: 5 }
```

**Signature:** `manySpan(inner: Parser<Span>, min?: number, max?: number): Parser<Span>`

### `sepBySpan(inner, sep, min?, max?)`

Like `.sepBy()`, but coalesces all element matches into a single `Span`. Strictly interleaving: `elem (sep elem)*`. Never accepts trailing separators.

```ts
const item = regexSpan(/\w+/);
const comma = stringSpan(",").trim();
const list = sepBySpan(item, comma);
// On "a, b, c", produces { start: 0, end: 7 }
```

**Signature:** `sepBySpan(inner: Parser<Span>, sep: Parser<any>, min?: number, max?: number): Parser<Span>`

### `wrapSpan(inner, left, right)`

Parse `left`, then `inner`, then `right`. Returns only the inner `Span`. Reports unclosed delimiters in diagnostics when `right` fails.

```ts
const parens = wrapSpan(
    regexSpan(/[^)]+/),
    stringSpan("("),
    stringSpan(")")
);
// On "(content)", produces { start: 1, end: 8 }
```

**Signature:** `wrapSpan(inner: Parser<Span>, left: Parser<any>, right: Parser<any>): Parser<Span>`

### `optSpan(inner)`

Try to match `inner`. On failure, return an empty span `{start: pos, end: pos}` at the current position instead of failing.

```ts
const maybeDigits = optSpan(regexSpan(/\d+/));
// On "abc", produces { start: 0, end: 0 }
// On "123", produces { start: 0, end: 3 }
```

**Signature:** `optSpan(inner: Parser<Span>): Parser<Span>`

### `skipSpan(keep, skip)`

Parse `keep` then `skip`, but return only `keep`'s span.

```ts
const token = skipSpan(regexSpan(/\w+/), regexSpan(/\s*/));
// On "hello  ", produces { start: 0, end: 5 }
```

**Signature:** `skipSpan(keep: Parser<Span>, skip: Parser<any>): Parser<Span>`

### `nextSpan(skip, keep)`

Parse `skip` then `keep`, but return only `keep`'s span.

```ts
const value = nextSpan(stringSpan("="), regexSpan(/\w+/));
// On "=foo", produces { start: 1, end: 4 }
```

**Signature:** `nextSpan(skip: Parser<any>, keep: Parser<Span>): Parser<Span>`

## When to Use Spans

Span combinators are ideal when:

- **You are scanning**—tokenizers and lexers that identify regions without needing the text content
- **You are formatting**—pretty-printers that rearrange source regions without interpreting them
- **Performance matters**—avoiding thousands of `substring()` calls in tight loops

For parsers that need to inspect or transform the matched text (like converting `"42"` to the number `42`), use the standard `string()`, `regex()`, and `.map()` combinators instead. You can freely mix span and non-span parsers in the same grammar.
