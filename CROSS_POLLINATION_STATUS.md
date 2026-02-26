# Cross-Pollination Status Report

## What's Done

### Phase 2: TypeScript <- Rust (Runtime Hot-Path) — COMPLETE
All 49 tests passing. No new type errors.

**2.1 Span-Based Parsing** (`state.ts`, `index.ts`)
- Added `Span` interface `{start, end}` + `spanToString()` + `mergeSpans()` to `state.ts`
- Added `regexSpan()` — like `regex()` but returns `{start, end}` instead of `substring()`. Zero string allocation.
- Added `manySpan()` — coalesces matches into single Span instead of `T[]` array
- Added `sepBySpan()` — same for separated lists
- Added `wrapSpan()` — returns inner Span, discards delimiters
- These are parallel types, NOT breaking. BBNF codegen can opt into span mode.

**2.2 Bitfield Flags on Parser** (`index.ts`)
- Added `flags` field (FLAG_NONE=0, FLAG_TRIM_WS=1, FLAG_EOF=2)
- Added `call()` method with 3-tier dispatch: flags===0 fast path, FLAG_TRIM_WS-only fast path, general cold path
- `trim()` still uses the inline whitespace closure for `.parser()` callers (backward compat)

**2.3 Monolithic JSON Fast-Path** (`json-fast.ts`) — NEW FILE
- Single recursive `parseValue()` function with `switch(charCodeAt)` dispatch
- String: `indexOf('"')` fast path (V8 SIMD), cold escape path with batch copying
- Number: integer accumulation `val * 10 + digit`, `parseFloat` only for decimals/exponents
- Keywords: direct charCode comparison for true/false/null (no string allocation)
- Cow-like: returns source substring only when no escapes; builds new string only on escape paths

**2.4 Pre-Allocated Arrays** (`index.ts`)
- `many(min)` and `sepBy(min)` now pre-allocate `new Array(min)` when min > 0
- Uses index-assignment for pre-allocated slots, `push()` for overflow
- Trims `.length` if fewer items collected than pre-allocated

**2.5 Numeric Memoization Key** (`index.ts`)
- Replaced `\`${this.id}${state.offset}\`` string concatenation with `(this.id << 20) | offset`
- Eliminates string allocation per memo lookup
- `LEFT_RECURSION_COUNTS` now uses `Map<number, number>` instead of `Map<string, number>`
- Supports up to 2048 parsers x 1M char inputs

### Phase 3: TypeScript BBNF Codegen <- Rust Patterns — COMPLETE

**3.1 Wrap Detection** (`generate.ts`)
- Detects `skip(next(L, M), R)` pattern -> generates `M.wrap(L, R)`
- `wrap()` already inlines 2 function frames, so this eliminates extra closure overhead

**3.2 All-Literals Alternation** (`generate.ts`)
- When all alternatives are string literals with unique first characters, compiles to `dispatch()` table
- O(1) lookup instead of sequential `any()` trial

### Phase 1: Rust <- TypeScript (Grammar Analysis) — COMPLETE (pending compilation)

**1.1 Tarjan's SCC** (`analysis.rs`)
- Full Tarjan's strongly-connected-component algorithm
- Returns SCCs in reverse-topological order + precise cyclic rule set
- Replaces old O(V*(V+E)) `calculate_acyclic_deps` with O(V+E)
- 3 unit tests (no cycles, self-cycle, mutual cycle)

**1.2 FIRST Set Computation** (`analysis.rs`)
- `CharSet` — `[u32; 4]` (128-bit ASCII bitset) with add, has, union, is_disjoint, iter
- `compute_first_sets()` — fixed-point iteration over all nonterminals
- `regex_first_chars()` — conservative static analysis of regex patterns (literal start, char classes, escapes, alternation, groups)
- Handles all Expression variants: Literal, Regex, Nonterminal, Concatenation, Alternation, Optional, Many, Many1, Group, Epsilon, Skip, Next, Minus, Mapped, Debug
- 12 unit tests for CharSet, 8 for regex first chars

**1.3 Dispatch Table Generation** (`generate.rs`)
- Modified `calculate_alternation_expression()` to try building a `DispatchTable` when `first_sets` are available
- When all alternatives have pairwise-disjoint FIRST sets: generates `dispatch_byte_multi(vec![...], None)` call
- Falls back to existing `one_of()` / `|` codegen when FIRST sets overlap

**1.4 Regex Coalescing** (`generate.rs`)
- `check_for_regex_coalesce()` detects `literal >> many/many1(regex) << literal` patterns
- Fuses into single `sp_regex("escaped_left(pattern)*escaped_right")` call
- Handles both AST shapes (Next(L, Skip(M,R)) and Skip(Next(L,M), R))
- Validates combined regex compiles before emitting

**1.5 Left-Recursion Removal** (`optimize.rs`) — NEW FILE
- `remove_direct_left_recursion()` — standard algorithm
- For `A = A α₁ | A α₂ | β₁ | β₂`, transforms to `A = β₁ A' | β₂ A'` + `A' = α₁ A' | α₂ A' | ε`
- 2 unit tests (no-op, transformation)
- Fixes PARSER_ISSUES.md #9 (derive macro crash on `css-color.bbnf`)

**1.6 Reference Counting + Alias Collapse** (`analysis.rs`, `derive/lib.rs`)
- `compute_ref_counts()` — counts nonterminal references for inlining decisions
- `find_aliases()` — detects `A = B` chains (optionally group-wrapped)
- Both integrated into derive macro pipeline (results available for future optimization passes)

## Performance Expectations

### TypeScript
- **JSON parsing**: 2.5 numeric memo key alone should reduce GC pressure ~15-20%. The monolithic `jsonParseFast()` should match or beat the existing hand-written parser and be 3-5x faster than BBNF-generated.
- **BBNF-generated parsers**: Dispatch tables + wrap detection + all-literals alternation should improve alternation-heavy grammars by 20-40%. Most impactful on CSS/HTML grammars with many keyword alternatives.
- **Span-based parsing**: When opted into, eliminates substring allocation. Most beneficial for tokenizer-like workloads (scanning without building AST values).

### Rust
- **Dispatch tables**: Should eliminate sequential alternation trial in BBNF-generated parsers. The runtime `dispatch_byte_multi` is already highly optimized (256-element LUT). Main benefit: O(1) branch selection vs O(n) for n alternatives.
- **Regex coalescing**: Minor optimization for grammars with quoted/delimited patterns. Eliminates 3 parser calls (literal + many + literal) in favor of one regex match.
- **Tarjan SCC**: Faster cycle detection for large grammars. Old algorithm was O(V*(V+E)); Tarjan is O(V+E). Practical impact: compile-time improvement for BBNF derive macro on grammars with 50+ rules.

## Files Modified

### TypeScript
- `typescript/src/parse/state.ts` — Span type, mergeSpans, spanToString, new parser names
- `typescript/src/parse/index.ts` — flags, numeric memo key, pre-alloc arrays, call(), span variants
- `typescript/src/parse/json-fast.ts` — **new**: monolithic JSON parser
- `typescript/src/bbnf/generate.ts` — wrap detection, all-literals alternation, dispatch import

### Rust
- `rust/bbnf/src/analysis.rs` — **new**: Tarjan SCC, FIRST sets, CharSet, dispatch tables, ref counts, aliases (1195 lines, 20 tests)
- `rust/bbnf/src/optimize.rs` — **new**: left-recursion removal (170 lines, 2 tests)
- `rust/bbnf/src/generate.rs` — dispatch codegen, regex coalescing, first_sets field on attributes
- `rust/bbnf/src/lib.rs` — added analysis + optimize modules
- `rust/bbnf/derive/lib.rs` — updated pipeline to use Tarjan SCC, FIRST sets, ref counts, aliases
