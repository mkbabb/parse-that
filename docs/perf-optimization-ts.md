# Optimizing parse-that (TypeScript): From 746 to 5,480 ops/s

A scannerless parser combinator vs. the field (TypeScript / V8)

---

## 1. The Problem

parse-that is a scannerless parser combinator library. Its BBNF (extended BNF) compiler takes a grammar string at runtime and produces a tree of Parser objects — closures composed via `.then()`, `.or()`, `.map()`, `.sepBy()`, etc. No lexer phase, no code generation, no build step. You write a grammar, you get a parser.

The cost of that flexibility: on a 35 KB JSON file, the BBNF-generated parser clocked 746 ops/s. `JSON.parse` does 25,000. Chevrotain (a lexer+parser toolkit) does 5,700. Even Parsimmon (another combinator lib) was competitive.

The question: how close can a zero-dependency, scannerless, runtime-compiled combinator library get to hand-tuned parser generators?

---

## 2. Methodology: Fair Benchmarking

### The Cardinal Sin We Found

Our initial Chevrotain benchmark ran with `outputCst: false` — recognizer-only mode. It validated syntax but built no JS objects. Meanwhile parse-that was constructing full `Object.fromEntries()` trees. Chevrotain looked 2x faster than it actually was.

We also discovered Chevrotain's string handling used `.slice(1, -1)` instead of `JSON.parse()`, silently producing wrong output on escaped strings (`"hello \"world\""` → broken). After fixing both issues, Chevrotain dropped from 5,749 to 4,029 ops/s.

**Rule:** every parser in the benchmark must produce output identical to `JSON.parse()`. Validated with `deepEqual` before measurement.

### Datasets

We adopted the canonical parser benchmark corpus used by simdjson, serde-rs, and RapidJSON:

| File | Size | Character |
|------|------|-----------|
| data.json | 35 KB | String-heavy, shallow objects |
| apache-builds.json | 124 KB | Moderate nesting, mixed types |
| twitter.json | 617 KB | Deep nesting, Unicode strings |
| citm_catalog.json | 1.7 MB | Balanced strings and numbers |
| canada.json | 2.1 MB | 99% numbers, 56K arrays (GeoJSON) |

### Competitors

All produce equivalent JS values (apples-to-apples):

- **JSON.parse** — native C++ baseline
- **Chevrotain** — lexer-based EmbeddedActionsParser with `this.ACTION()` value-building
- **Peggy** — PEG grammar, compiled to JS at startup
- **Nearley + moo** — Earley parser with moo lexer
- **Parsimmon** — combinator library (the closest architectural peer)
- **parse-that (BBNF)** — grammar-compiled combinators
- **parse-that (hand)** — hand-written combinators using the same primitives

---

## 3. Phase 1: The State Architecture (746 → ~2,500 ops/s)

### Immutable → Mutable ParserState

The original architecture allocated a new `ParserState` object on every combinator success/failure:

```ts
// Before: every .ok() / .err() creates a heap object
ok(value, offset) {
    return new ParserState(this.src, value, this.offset + offset, false);
}
```

For a 35 KB JSON file with ~4,700 combinator invocations per parse, that's 4,700 heap objects per parse — pure GC pressure.

The fix: a single mutable `ParserState` threaded through the entire parse. Combinators mutate `.offset`, `.value`, `.isError` in place:

```ts
// After: zero-alloc mutation
ok(value, offset = 0) {
    this.offset += offset;
    this.value = value;
    this.isError = false;
    return this;
}
```

This is the single most impactful optimization. It eliminated virtually all per-parse allocation from the combinator infrastructure itself. The remaining allocations are result construction (arrays, objects) — work the user actually asked for.

### Zero-Alloc save/restore

The old `save()` returned `{ offset, value }` — a heap object created ~6 times per JSON key-value pair. On the restore path (combinator failure), `value` is almost never needed. We replaced it with inline offset locals:

```ts
// Before (allocates):
const saved = state.save();
parser(state);
if (state.isError) { state.restore(saved); }

// After (zero-alloc):
const savedOffset = state.offset;
parser(state);
if (state.isError) { state.offset = savedOffset; state.isError = false; }
```

Applied across `then`, `or`, `skip`, `next`, `opt`, `many`, `sepBy`, `not`, `trim`.

---

## 4. Phase 2: BBNF Graph Optimizations (~2,500 → ~4,800 ops/s)

The BBNF compiler transforms a grammar string into a directed graph of Parser nodes. The naive approach — walk the AST, emit combinators — leaves massive optimization headroom on the table.

### Tarjan's SCC for Build Order

The grammar `value = object | array | string | number | bool | null` with `object` containing `value` creates a cycle. The naive topological sort either breaks on cycles or builds parsers in suboptimal order, requiring extra lazy wrappers.

We replaced it with Tarjan's algorithm for strongly connected components. This gives us:

1. **Exact cycle detection:** only rules participating in actual recursion need `Parser.lazy()` wrappers. Non-cyclic rules (the majority) get direct references — eliminating one function-call indirection per invocation.
2. **Optimal build order:** leaves first, dependents after. Every non-cyclic rule references a fully-constructed parser, not a lazy thunk.
3. **SCC grouping:** mutually recursive rules (e.g., `value ↔ object ↔ array`) are identified as a single component and resolved together.

For the JSON grammar, this reduces the number of lazy wrappers from ~8 to exactly 2 (the `value ↔ object` and `value ↔ array` cycles). Each eliminated lazy wrapper removes one closure resolution + one indirect call from every invocation of that rule.

### FIRST-Set Dispatch Tables

The `value` rule in JSON has 6 alternatives. The naive `any()` combinator tries them sequentially:

```ts
any(object, array, string, number, bool, null)
```

For a number token, it fails on `object` (not `{`), fails on `array` (not `[`), fails on `string` (not `"`), then finally matches `number`. Three wasted attempts per number. On canada.json (111,000 numbers), that's 333,000 failed parser invocations.

The BBNF compiler computes FIRST sets for each alternative — the set of characters that can appear at the start of a match. For JSON:

```
object  → { '{' }
array   → { '[' }
string  → { '"' }
number  → { '-', '0'..'9' }
bool    → { 't', 'f' }
null    → { 'n' }
```

All disjoint. The compiler builds an `Int8Array(128)` lookup table mapping each ASCII character to its alternative index:

```ts
const tbl = new Int8Array(128).fill(-1);
tbl['{'.charCodeAt(0)] = 0;  // → object
tbl['['.charCodeAt(0)] = 1;  // → array
tbl['"'.charCodeAt(0)] = 2;  // → string
// ... digits, minus → number; t,f → bool; n → null
```

At parse time: one `charCodeAt` + one array lookup → direct dispatch. O(1) instead of O(n) alternatives. Zero failed attempts.

This is formally equivalent to the LL(1) lookahead table in classical parser theory, but computed at runtime from the grammar's FIRST sets rather than generated at compile time. The condition `isPerfect` (all FIRST sets disjoint, no nullable alternatives) ensures the dispatch is unambiguous.

### Regex Coalescing

When the BBNF compiler sees a chain of character-level alternatives:

```
digit = "0" | "1" | "2" | ... | "9" ;
```

It coalesces them into a single `regex(/[0-9]/)` call instead of 10 `string()` alternatives. One regex engine call vs. 10 sequential `charCodeAt` comparisons. The regex engine's DFA is faster than our combinator dispatch for character classes.

### Alias Chain Collapsing

Grammars frequently contain alias rules: `ws = whitespace ;` `comma = "," , ws ;`. The naive compiler wraps each in a Parser node. The optimizer detects single-alternative rules with no semantic actions and collapses them: `ws` becomes a direct reference to the `whitespace` parser, skipping one indirection per invocation.

### Inline all(2) Specialization

The generic `all(...parsers)` combinator creates an array, loops over parsers, and pushes results. For the overwhelmingly common 2-element case (e.g., `pair = key , value`), the BBNF compiler emits a specialized `all2()` closure that avoids the loop and directly constructs `[v1, v2]`. Eliminates array iteration overhead and reduces to two direct calls.

---

## 5. Phase 3: V8-Specific Findings (~4,800 → ~5,480 ops/s)

We deployed parallel research agents to profile allocation, V8 deopts, IC polymorphism, and competitor techniques. Key findings:

### RegExp.exec() Allocates on Every Match

The `regex()` combinator is the workhorse — every token (strings, numbers, whitespace) goes through it. The original implementation:

```ts
const match = sticky.exec(state.src);  // Allocates RegExpMatchArray
if (match) state.ok(match[0], ...);
```

`exec()` returns a `RegExpMatchArray` — a heap object with `.index`, `.input`, `.groups`, and the match string. For the JSON parser, that's 1,380 heap allocations per parse of data.json. ~30% of all allocation.

`test()` returns a boolean and still advances `lastIndex`, but allocates nothing:

```ts
if (sticky.test(state.src)) {
    state.offset = sticky.lastIndex;
    state.value = state.src.substring(savedOffset, sticky.lastIndex);
}
```

`substring()` creates only the string we need. Net: 1,380 fewer objects per parse, ~108 KB less GC pressure. The wall-clock improvement is modest (~1-2%), but GC variance drops significantly — fewer nursery fills, fewer minor GC pauses during sustained parsing.

Custom `matchFunction` users (who access capture groups) still get `exec()`.

### The Megamorphic IC Problem

Every `Parser` object stores its parse function in `.parser`. Each combinator creates a unique closure shape — `string()` produces one, `regex()` another, `map()` another. When `any()` loops over alternatives calling `parser.parser(state)`, V8's inline cache at that call site sees 6+ different function targets (one per alternative). V8's megamorphic threshold is 4.

Beyond 4 targets, V8 falls back to generic dispatch — `Builtin: CallFunction_ReceiverIsNotNullOrUndefined` appeared at 5.9% of total CPU time in our profiles. No inlining, no speculative optimization, just a hashtable lookup on every call.

This is structural to the closure-based combinator pattern. The FIRST-set dispatch table mitigates it (fewer calls, not fewer targets), but doesn't solve it. A future architecture using tagged unions + switch dispatch could eliminate it entirely, but that's a fundamental API redesign.

### The dispatch() Combinator

We surfaced the BBNF compiler's FIRST-set dispatch as a public API:

```ts
const jsonValue = dispatch({
    "{": jsonObject,
    "[": jsonArray,
    '"': jsonString,
    "-": jsonNumber,
    "0-9": jsonNumber,
    "t": jsonBool,
    "f": jsonBool,
    "n": jsonNull,
});
```

This gave the hand-written parser the same O(1) alternation as BBNF. The hand parser jumped from 4,267 to 5,480 ops/s — now the fastest non-native parser in the benchmark, faster than both BBNF and Chevrotain.

### Inlining wrap()

`parser.wrap(start, end)` was implemented as `start.next(this).skip(end)` — a chain of two combinator nodes, each with its own closure, saved offset, error handling. That's 4 function calls per invocation (2 combinators x 2 inner calls each).

Inlining into a single closure:

```ts
wrap(start, end) {
    const inner = this;
    return new Parser((state) => {
        const savedOffset = state.offset;
        start.parser(state);
        if (state.isError) { state.offset = savedOffset; return state; }
        inner.parser(state);
        if (state.isError) { /* restore */ }
        const value = state.value;
        end.parser(state);
        if (state.isError) { /* restore */ }
        state.value = value;
        return state;
    });
}
```

3 direct calls instead of 4 indirect calls. On canada.json (56,000 arrays), this eliminates ~112,000 function frames.

### String Unescape Fast Path

98%+ of JSON strings contain no escape sequences. But both parsers were calling `JSON.parse(s)` on every string — a full C++ round-trip to validate and unescape. The fast path:

```ts
s.indexOf("\\") === -1 ? s.slice(1, -1) : JSON.parse(s)
```

`indexOf` + `slice` is pure V8-inlined string operations. `JSON.parse` is only called for the rare strings that actually contain backslashes. Measured ~20% improvement on string-heavy documents.

### Identity Map Elimination

The BBNF benchmark had:

```ts
nonterminals.pair = nonterminals.pair.map(([k, v]) => [k, v]);
```

A no-op that destructures and re-creates the same `[key, value]` tuple. 720 array allocations per parse, ~34 KB, for nothing. The `all2()` combinator already produces `[key, value]`. Deleted.

### Correctness: Zero-Progress Guards

`many()` and `sepBy()` enter infinite loops when the inner parser succeeds without consuming input. This surfaced as OOM crashes in `csv.test.ts` where `line.many()` matched empty-separated tokens. The fix:

```ts
if (state.offset === savedOffset) break;
```

After a successful inner parse, if the offset didn't advance, we break out of the loop. Matches the semantics of PEG's `*` operator: zero-width matches terminate repetition.

---

## 6. Allocation Profile (Post-Optimization)

Instrumented measurement on data.json (35 KB, per parse):

| Source | Count | Avoidable? |
|--------|-------|------------|
| ~~RegExpMatchArray~~ | ~~1,380~~ → 0 | Eliminated via test() |
| all2 tuples [k,v] | 720 | Structural (needed for Object.fromEntries) |
| ~~Identity pair.map~~ | ~~720~~ → 0 | Eliminated |
| sepBy result arrays | 181 | Structural (user's output) |
| JSON.parse strings | ~80 (escaped only) | Reduced from 1,290 via fast-path |
| Object.fromEntries | 135 | User's output |
| **Total** | **~1,116** | **Down from ~3,317** |

Per-parse allocation dropped from ~357 KB to ~180 KB. Minor GC frequency halved.

---

## 7. Final Results

| Dataset | JSON.parse | Hand | BBNF | Chevrotain | Peggy | Parsimmon | Nearley |
|---------|-----------|------|------|------------|-------|-----------|---------|
| data.json (35 KB) | 24,738 | 5,480 | 4,779 | 4,100 | 1,107 | 985 | 386 |
| apache-builds (124 KB) | 7,149 | 1,477 | 1,328 | 1,035 | 299 | 243 | 82 |
| twitter (555 KB) | 1,566 | 243 | 213 | 166 | 63 | 44 | 21 |
| citm_catalog (1.7 MB) | 680 | 117 | 102 | 76 | 24 | 17 | 8 |
| canada (2.1 MB) | 133 | 56 | 44 | 29 | 15 | 7 | 4 |

All values ops/s. Higher is better.

**BBNF improvement:** 746 → 4,779 (6.4x)
**Hand-written with dispatch:** 5,480 — fastest non-native parser

### Ratios vs. Chevrotain (value-building mode)

| Dataset | Hand/Chev | BBNF/Chev |
|---------|-----------|-----------|
| data.json | 1.34x | 1.17x |
| apache-builds | 1.43x | 1.28x |
| twitter | 1.46x | 1.28x |
| citm_catalog | 1.54x | 1.34x |
| canada | 1.93x | 1.52x |

The advantage grows with file size. On number-heavy data (canada.json), dispatch eliminates the most wasted work.

---

## 8. What We Learned

1. **Mutable state is the single biggest win.** Immutable-state combinators are elegant but allocate on every call. A single threaded `ParserState` with in-place mutation eliminated ~4,000 heap objects per parse. This is the difference between "academic exercise" and "production viable."
2. **FIRST-set dispatch turns O(n) alternation into O(1).** Classical LL(1) lookahead tables work at runtime too. The BBNF compiler computes them automatically; the `dispatch()` combinator exposes them manually. Both beat sequential `any()` by 1.1-1.9x depending on the grammar.
3. **Scannerless can beat lexer-based.** Chevrotain's 2-phase architecture (moo lexer → parser) creates `IToken` objects for every token. parse-that's scannerless approach avoids token object allocation entirely. The sticky-regex `test()` + `substring()` path is effectively a zero-alloc "inline lexer" that never materializes tokens.
4. **V8's megamorphic IC ceiling is real but manageable.** The closure-per-combinator pattern causes megamorphic dispatch at alternation boundaries. FIRST-set dispatch reduces the number of calls (not the polymorphism), which is enough. A full fix would require a tagged-union architecture — a future project.
5. **Fair benchmarks require value construction.** A recognizer that doesn't build output is not comparable to a parser that does. Every benchmark must validate `deepEqual(result, JSON.parse(input))` or the numbers are meaningless.
6. **Tarjan's SCC > naive topo sort for grammar compilation.** Exact cycle detection means minimal lazy wrappers. Non-cyclic rules get direct references. The compiler builds less, the parser calls less.

---

## 9. Phase 4: Cross-Pollination from Rust

Techniques proven in the Rust implementation were ported back to TypeScript:

### `regexSpan()` — Zero-Alloc Discarded Matches

When the BBNF compiler detects that a regex result is discarded (right side of
`skip`, left side of `next`), it emits `regexSpan()` instead of `regex()`.
`regexSpan()` uses `test()` + offset tracking without calling `substring()`,
avoiding string allocation for tokens whose value is never consumed.

### Flag-Based `trim()` with Inline `call()`

The `trim()` combinator previously created a new closure wrapper. Now it sets a
`FLAG_TRIM_WS` bit on the parser and uses a `call()` method with a fast-path
check: `if (this.flags === 0)` falls through to `this.parser(state)` directly.
The trim logic (whitespace skip before + after) is inlined in the flag branch.

### Numeric Memo Keys

The memoization key was `\`${this.id}${state.offset}\`` — string concatenation
per lookup. Now it's `(this.id << 20) | (state.offset & 0xFFFFF)` — a single
integer. Eliminates per-lookup string allocation for inputs up to ~1M chars
with up to 2048 parser IDs.

### Pre-Allocated Arrays in `many()` / `sepBy()`

When `min > 0`, the result array is pre-allocated with `new Array(min)` and
filled via index assignment instead of `push()`. For `sepBy(comma, 1)` on
objects with 10+ keys, this avoids the `[] → push → push → ...` growth
sequence.

### `wrap()` Detection in BBNF Codegen

The BBNF compiler detects `skip(next(L, M), R)` patterns and emits
`M.wrap(L, R)` — which is already inlined to 3 direct calls instead of the
4 indirect calls from chaining `skip` and `next` combinators.

### All-Literals Dispatch

When all alternatives in an alternation are string literals, the BBNF compiler
emits `dispatch()` with character-keyed routing instead of `any()`. This gives
O(1) keyword dispatch for patterns like `"true" | "false" | "null"`.

### Monolithic JSON Fast Path (`json-fast.ts`)

A hand-written recursive JSON parser using the same `ParserState` infrastructure
but with zero combinator overhead — direct byte dispatch, inline string/number
scanning, and `JSON.parse()` only for escaped strings. Equivalent to the Rust
fast path in architecture.

---

## 10. Phase 5: BBNF Language Extensions

The TypeScript BBNF library (`@mkbabb/bbnf-lang`) was extended with grammar-level
features that complement the parser performance work.

### @import System

Added multi-file grammar support via `@import` directives:

```bbnf
@import "path/to/base.bbnf" ;
@import { number, integer } from "path/to/common.bbnf" ;
```

**Parser additions** (`grammar.ts`):
- `importDirective()` parser handling both glob and selective import forms
- `grammarWithImports()` returns `ParsedGrammar` (imports + rules)

**Multi-file API** (`generate.ts`):
- `BBNFToASTWithImports(input)` — parses a single file with import extraction
- `BBNFToASTFromFiles(files: Map<string, string>)` — merges multiple files
  into a single `ParsedGrammar`, applying selective filtering

The grammar-level FIRST-set dispatch and SCC optimizations (Phase 2) apply
unchanged to imported rules — the merged AST is indistinguishable from a
single-file grammar.

### Tarjan SCC + FIRST Sets from Rust

The same algorithmic improvements applied to the Rust LSP were originally
developed and proven in the TypeScript BBNF compiler:

- **Tarjan's SCC** for minimal `Parser.lazy()` wrappers (Phase 2)
- **FIRST-set dispatch tables** for O(1) alternation (Phase 2)
- **Name index** for O(1) nonterminal lookup during compilation

These remain the foundation of the TS BBNF compiler's performance. The Rust
LSP analysis code (`bbnf/src/analysis.rs`) was subsequently optimized using the
same techniques, with the added benefit of SCC-ordered FIRST set computation
(processing SCCs in topological order instead of global fixed-point iteration).

---

## 11. Commit Log

```
b1bdbfe feat: extend import support to TypeScript library and proc-macro
fe25063 perf(ts): dispatch tables, regexSpan, flag-based trim, json-fast parser
f95f85c perf(ts): inline ok() in regex hot path
fdf0adf perf(ts): inline wrap(), add dispatch() combinator
ae94498 perf(ts): regex test()+substring(), remove identity pair.map()
f93841a fix(ts): many()/sepBy() zero-progress guard, string fast-path, enable all tests
4cbab60 fix(bench): Chevrotain must JSON.parse strings for fair comparison
1188104 chore(ts): stabilize test CWD via vitest setupFiles
2a5d6e0 fix(bench): honest apples-to-apples comparison, fix BBNF string rule
757c514 bench(ts): drop Ohm and data-xl from benchmark matrix
4b25df3 bench(ts): add nearley, ohm-js, apache-builds, data-xl datasets
26f5941 perf(bbnf): alias chain collapsing, inline all(2) specialization
d1fbdc4 perf(ts): zero-alloc save/restore, fair multi-parser benchmark
67388ac perf(bbnf): Tarjan's SCC, FIRST-set dispatch, regex coalescing
c1d7ea5 perf(ts): mutable ParserState, zero-alloc combinators
```
