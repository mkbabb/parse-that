---
title: Combinators
order: 11
section: parse-that
---

# Combinators

All combinators are methods on `Parser<T>`. Each returns a new parser without mutating the original.

## Sequencing

### `.then(next)` / `.skip(parser)` / `.next(parser)`

Sequence two parsers. `.then()` keeps both values as a tuple, `.skip()` keeps only the left value, `.next()` keeps only the right value.

```ts
string("a").then(string("b")).parse("ab");  // ["a", "b"]
regex(/\w+/).skip(string(";")).parse("hi;"); // "hi"
string("x=").next(regex(/\d+/)).parse("x=42"); // "42"
```

## Alternation

### `.or(other)`

Try `this` first. If it fails, try `other`. Returns `Parser<T | S>`.

```ts
string("true").or(regex(/\d+/)).parse("42"); // "42"
```

## Transformation

### `.map(fn)` / `.chain(fn)`

`.map()` transforms a successful result. `.chain()` uses the result to select the next parser dynamically.

```ts
const num = regex(/\d+/).map(Number);       // Parser<number>
const tagged = regex(/\w+/).chain(tag =>
    tag === "num" ? regex(/\d+/).map(Number) : regex(/.+/)
);
```

## Repetition

### `.many(min?, max?)`

Match `this` zero or more times (or between `min` and `max` times). Returns an array.

```ts
const digits = regex(/\d/).many(1);
digits.parse("123"); // ["1", "2", "3"]
```

**Signature:** `many(min?: number, max?: number): Parser<T[]>`

### `.sepBy(sep, min?, max?)`

Match `this` separated by `sep`. Strictly interleaving: `elem (sep elem)*`. Never accepts a trailing separator.

```ts
const csv = regex(/\w+/).sepBy(string(","));
csv.parse("a,b,c"); // ["a", "b", "c"]
```

**Signature:** `sepBy<S>(sep: Parser<S>, min?: number, max?: number): Parser<T[]>`

## Optionality

### `.opt()`

Try `this`. On failure, succeed with `undefined` instead.

```ts
const maybeSign = string("-").opt();
maybeSign.parse("-");  // "-"
maybeSign.parse("3");  // undefined
```

**Signature:** `opt(): Parser<T | undefined>`

## Wrapping and Trimming

### `.wrap(start, end)` / `.trim(parser?)`

`.wrap()` parses delimiters around `this` and discards them. `.trim()` strips surrounding whitespace (or a custom parser) from both sides.

```ts
expr.wrap(string("("), string(")")).parse("(42)"); // 42
regex(/\w+/).trim().parse("  hello  ");            // "hello"
```

## Negation and Lookahead

### `.not(parser?)`

Without an argument: zero-width negative assertion. Succeeds (without consuming input) if `this` would fail.

With an argument: consuming negative lookahead. Parses `this`, then checks that `parser` does NOT match at the resulting position.

```ts
// Zero-width: succeed if NOT at "end"
const notEnd = string("end").not();

// Consuming: match a word that isn't "class"
const ident = regex(/\w+/).not(string("class"));
```

**Signature:** `not<S>(parser?: Parser<S>): Parser<T>`

### `.peek()` / `.lookAhead(lookahead)`

`.peek()` is a zero-width positive assertion—succeeds with `this`'s value without consuming input. `.lookAhead()` parses `this`, then asserts `lookahead` matches at the resulting position (zero-width). Returns `this`'s value.

### `.minus(excluded)`

Set difference (EBNF `-` semantics). Match `this` only if `excluded` would NOT match at the same starting position.

```ts
const ident = regex(/\w+/).minus(any(string("if"), string("else")));
```

## Error Recovery

### `.recover(sync, sentinel)`

On success, returns the result normally. On failure, collects a diagnostic snapshot, then runs `sync` to skip past the bad content and returns `sentinel`. This lets `many()` or `sepBy()` loops continue past errors.

```ts
const item = jsonValue.recover(
    regex(/[^,\]\}]+/),  // sync: skip to next delimiter
    null                  // sentinel: placeholder value
);
const array = item.sepBy(comma).wrap(lbracket, rbracket);
```

**Signature:** `recover(sync: Parser<unknown>, sentinel: T): Parser<T>`

## Memoization

### `.memoize()`

Enable packrat memoization with left-recursion support. Caches results by parser ID and input offset using numeric keys (no string allocation).

**Signature:** `memoize(): Parser<T>`

## Recursion

### `Parser.lazy(fn)`

Static method for defining recursive parsers. The factory function `fn` is called lazily on first use and cached.

```ts
const expr: Parser<number> = Parser.lazy(() =>
    num.or(expr.wrap(string("("), string(")")))
);
```

**Signature:** `static lazy<T>(fn: () => Parser<T>): Parser<T>`

## End of Input

### `.eof()`

Assert that the input is fully consumed after `this` succeeds.

```ts
const full = jsonValue.eof();
```

**Signature:** `eof(): Parser<T>`
