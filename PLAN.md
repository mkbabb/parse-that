# Cross-Pollination Optimization Plan: TypeScript ↔ Rust

## Executive Summary

After comprehensive analysis of both codebases by 8 parallel research agents, we identified **14 discrete optimization work items** organized into 4 phases. The TypeScript side is ahead on grammar analysis (Tarjan SCC, FIRST sets, dispatch tables); the Rust side is ahead on runtime hot-path performance (SIMD scanning, zero-copy spans, enum dispatch, monolithic parsers). The plan ports each side's strengths to the other.

**v2 addendum:** After completing v1 (Phases 1–4), 4 additional research agents audited both codebases for remaining performance gaps, cross-language isomorphism, and integration of unfinished items. Phases 5–8 below capture those findings.

---

## Implementation Status

| Item | Status | Notes |
|------|--------|-------|
| **1.1** Tarjan SCC → Rust | **DONE** | `analysis.rs`: `tarjan_scc`, `topological_sort_scc`, `calculate_acyclic_deps_scc` |
| **1.2** FIRST Sets → Rust | **DONE** | `analysis.rs`: `CharSet`, `compute_first_sets`, `regex_first_chars` |
| **1.3** Dispatch Table Codegen | **PARTIAL** | Runtime exists (`dispatch_byte_multi`); codegen disabled (`if false`) due to Box<T>/T coercion |
| **1.4** Regex Coalescing | **NOT STARTED** | |
| **1.5** Left-Recursion Removal | **DONE** | `optimize.rs` complete, NOT wired into derive pipeline |
| **1.6** Ref Counting + Aliases | **DONE** | `compute_ref_counts`, `find_aliases` in analysis.rs; called in derive/lib.rs but results unused |
| **2.1** Span-Based Parsing (TS) | **DONE** | `Span` type in state.ts, `SpanParser` variants |
| **2.2** Bitfield Flags (TS) | **DONE** | `flags` field on Parser, `FLAG_TRIM_WS`, `FLAG_EOF` |
| **2.3** Monolithic JSON (TS) | **DONE** | `json-fast.ts` — not yet benchmarked |
| **2.4** Pre-Alloc Arrays (TS) | **DONE** | `many()`, `sepBy()` capacity hints |
| **2.5** Numeric Memo Key (TS) | **DONE** | Numeric key in memoization |
| **3.1** Wrap Detection (TS) | **DONE** | `check_for_wrapped` in generate.ts |
| **3.2** All-Literals Alternation (TS) | **DONE** | Optimized alternation in generate.ts |
| **4.1** Unified Benchmarks | **PARTIAL** | Benchmarks exist but no grammar compilation time tracking |
| **4.2** Fix Derive Crash | **UNBLOCKED** | SCC done (1.1), LR removal done (1.5) — needs wiring |

---

## Benchmark Baselines (Post-v1)

### Rust — `cargo bench` (nightly, release profile)

| Benchmark | File | Throughput |
|-----------|------|-----------|
| fast-path (SIMD) | data.json (35 KB) | 3,408 MB/s |
| fast-path (SIMD) | apache-builds (124 KB) | 3,072 MB/s |
| fast-path (SIMD) | twitter (617 KB) | 3,011 MB/s |
| fast-path (SIMD) | citm_catalog (1.7 MB) | 2,989 MB/s |
| fast-path (SIMD) | canada (2.1 MB) | 2,285 MB/s |
| combinator | data.json | 968 MB/s |
| combinator | apache-builds | 1,003 MB/s |
| combinator | twitter | 892 MB/s |
| combinator | citm_catalog | 814 MB/s |
| combinator | canada | 435 MB/s |
| BBNF-generated | data.json | 480 MB/s |
| BBNF-generated | apache-builds | 550 MB/s |
| BBNF-generated | twitter | 530 MB/s |
| BBNF-generated | citm_catalog | 390 MB/s |
| BBNF-generated | canada | 236 MB/s |

**Key gap:** BBNF-generated is ~2x slower than combinator, ~6x slower than fast-path.

### TypeScript — `vitest bench` (data.json 35 KB)

| Parser | ops/sec | vs JSON.parse |
|--------|---------|---------------|
| JSON.parse (native) | 25,126 | 1.0x |
| parse-that (hand) | 5,329 | 4.7x slower |
| parse-that (BBNF) | 4,756 | 5.3x slower |
| Chevrotain | 3,958 | 6.3x slower |
| Peggy | 1,080 | 23.3x slower |
| Parsimmon | 895 | 28.1x slower |
| Nearley + moo | 376 | 66.8x slower |

---

## Phases 1–4 (v1) — Original Plan

*(Kept for reference — see Implementation Status above for current state)*

### Phase 1: Rust ← TypeScript (Grammar Analysis)

#### 1.1 Port Tarjan's SCC to Rust ✅
**Source:** `typescript/src/bbnf/analysis.ts:60-128`
**Target:** `rust/bbnf/src/analysis.rs`

Replace `calculate_acyclic_deps` (O(V*(V+E))) and `topological_sort` (heuristic weight sort) with Tarjan SCC + Kahn's algorithm on the condensation DAG:
- `tarjan_scc()` → SCCs + `scc_index` + `cyclic_rules`
- `topological_sort_scc()` → Kahn's with depth-score intra-SCC ordering
- `calculate_acyclic_deps_scc()` → diamond-aware DFS (matching old codegen semantics)
- `calculate_non_acyclic_deps_scc()` → complement of acyclic

**Note:** The old `calculate_acyclic_deps` has a deliberate semantic quirk: diamond dependencies (convergent paths) are classified as non-acyclic due to a single-visited-set DFS. The codegen depends on this for correct type boxing. The new `calculate_acyclic_deps_scc` preserves this behavior.

#### 1.2 Port FIRST Set Computation to Rust ✅
**Target:** `rust/bbnf/src/analysis.rs`
- `CharSet` — `[u32; 4]` 128-bit ASCII bitset
- `compute_first_sets()` — fixed-point iteration
- `regex_first_chars()` — conservative regex static analysis

#### 1.3 Port Dispatch Table Generation to Rust Codegen ⚠️ PARTIAL
**Target:** `rust/bbnf/src/generate.rs` — `calculate_alternation_expression()`

Runtime `dispatch_byte_multi` exists. Codegen is disabled (`if false`) because the generated parsers return `Box<Enum>` for non-acyclic rules, but dispatch arms need uniform types. Needs a type-coercion wrapper or a change to how alternation types are resolved.

#### 1.4 Port Regex Coalescing to Rust Codegen — NOT STARTED
Detect `literal >> regex << literal` → fuse into single `sp_regex()`.

#### 1.5 Port Left-Recursion Removal to Rust ✅ (not wired)
**Target:** `rust/bbnf/src/optimize.rs` — complete implementation, tested.
Not yet integrated into `derive/lib.rs` pipeline. Needs opt-in flag matching TS design.

#### 1.6 Port Reference Counting + Alias Collapse ✅ (results unused)
`compute_ref_counts` and `find_aliases` implemented and called. Results stored but not yet consumed by codegen for inlining or alias collapse decisions.

### Phase 2: TypeScript ← Rust (Runtime Hot-Path) ✅

All items implemented: Span type, bitfield flags, monolithic JSON, pre-alloc arrays, numeric memo key.

### Phase 3: TypeScript BBNF Codegen ✅

Wrap detection and all-literals alternation both implemented.

### Phase 4: Shared Infrastructure

- **4.1** Benchmarks exist but no compilation-time tracking
- **4.2** Derive crash fix is unblocked (SCC + LR removal both done), needs integration

---

## Phase 5: Rust BBNF Performance — Closing the 2x Gap

The BBNF-generated Rust parsers run at ~50% of handwritten combinator throughput. These items target the gap.

### 5.1 Enable Dispatch Table Codegen
**Blocker:** `Box<Enum>` vs `Enum` type mismatch in alternation arms.
**Fix:** In `calculate_alternation_expression`, wrap dispatch arms with `Box::new()` when the alternation result type is `Box<Enum>`. Or: introduce a `dispatch_byte_multi_boxed` variant.
**Impact:** Eliminates O(n) sequential `.or()` chains for JSON `value` (7 alternatives) and similar rules. Expected: 15-30% improvement on string-heavy workloads.

### 5.2 Eliminate Redundant `trim()` Wrappers in Generated Parsers
**Observation:** The Rust BBNF codegen wraps many sub-parsers in `trim(whitespace())` even when the grammar's `ignore_whitespace` flag is already handled at the top level. The handwritten combinator avoids this.
**Fix:** Track whitespace context during codegen. If the parent already trims, skip redundant inner trims.
**Impact:** Moderate — reduces function call overhead per parse step.

### 5.3 Inline Single-Reference Nonterminals
**Uses:** Phase 1.6 `compute_ref_counts` (already computed, unused).
**Fix:** When a nonterminal has `ref_count == 1`, inline its parser body at the call site instead of generating a separate function + function call.
**Impact:** Reduces indirect call overhead. Particularly effective for wrapper rules.

### 5.4 Collapse Alias Chains
**Uses:** Phase 1.6 `find_aliases` (already computed, unused).
**Fix:** When rule A is an alias for B (A ::= B), replace all references to A's parser with B's parser directly.
**Impact:** Eliminates one function call per alias step.

### 5.5 Wire Left-Recursion Removal into Derive Pipeline
**Uses:** Phase 1.5 `optimize.rs` (complete, not wired).
**Fix:** Add opt-in attribute `#[parser(optimize_left_recursion)]` to derive macro. Call `remove_left_recursion()` on the AST before codegen.
**Impact:** Fixes `css-color.bbnf` crash (PARSER_ISSUES.md #9) and enables broader grammar support.

### 5.6 Specialize String Literal Matching
**Observation:** BBNF-generated parsers use `sp_string("true")` which does byte-by-byte comparison. The handwritten combinator uses `memcmp`-style comparison for keywords.
**Fix:** For literals ≤ 8 bytes, generate `sp_string_short()` that reads into a u64 and compares in one instruction. For longer literals, use `starts_with` on the byte slice.
**Impact:** Small but cumulative for keyword-heavy grammars (JSON `true`/`false`/`null`).

### 5.7 Fuse `skip` + `next` Sequences
**Observation:** `a >> b` generates `sp_skip(a).sp_then(b)` — two parse steps. When `a` is a literal, skip can be fused into the offset advance of `b`.
**Fix:** Detect `sp_skip(sp_string(lit)).sp_then(p)` patterns in codegen → generate `sp_expect_then(lit, p)` that validates the literal and advances the offset in one step.
**Impact:** Reduces per-rule overhead for delimited content.

### 5.8 Pre-Compute Escape-Free String Fast Path
**Observation:** The BBNF JSON string parser handles escapes on every character. The fast-path parser uses `memchr` to scan to the next `"` or `\`.
**Fix:** Generate string parsers that use `memchr2(b'"', b'\\', ...)` for the happy path (no escapes), falling back to character-by-character only when `\` is found.
**Impact:** Large improvement for string-heavy workloads (twitter.json is ~80% strings).

---

## Phase 6: TypeScript Performance — Beyond 5x

### 6.1 Benchmark `json-fast.ts`
**Status:** Monolithic JSON scanner is written but never benchmarked.
**Action:** Add `json-fast` to `json-comprehensive.bench.ts`. Compare against `JSON.parse`, `parse-that (hand)`, and `parse-that (BBNF)`.
**Target:** Within 3x of `JSON.parse` for large files.

### 6.2 Avoid `substring()` in Hot Regex Paths
**Observation:** `regex()` in index.ts still calls `input.substring(offset)` to create a search string for `RegExp.exec()`. This allocates on every call.
**Fix:** Use `RegExp.lastIndex` with the `y` (sticky) flag to match at a specific offset without creating a substring. This is already partially done — verify it's complete.
**Impact:** Significant for regex-heavy grammars.

### 6.3 Flatten `all()` / Sequence Chains
**Observation:** BBNF-generated sequences often produce nested `all(a, all(b, c))` instead of flat `all(a, b, c)`.
**Fix:** In TS BBNF codegen, detect when a sequence element is itself a sequence and flatten into a single `all()` call.
**Impact:** Reduces stack depth and intermediate tuple allocation.

### 6.4 `charCodeAt` Dispatch in `string()` Combinator
**Observation:** The TS `string()` combinator currently uses `startsWith`. For single-char strings, `charCodeAt(offset) === code` is faster.
**Fix:** Specialize `string()` for single-character patterns.
**Impact:** Small per-call improvement, cumulative.

### 6.5 Pool / Reuse ParserState Objects
**Observation:** Each parse step creates a new `ParserState` object (or modifies one). Object allocation pressure is high.
**Fix:** Use a flyweight/pool pattern — pre-allocate a `ParserState` and mutate in place, cloning only at branch points (`.or()`, `oneOf()`).
**Impact:** Reduces GC pressure on large inputs.

### 6.6 TypedArray-Backed Memo Table
**Observation:** Even with numeric keys (Phase 2.5), `Map<number, ParserState>` has overhead from V8's hash map implementation.
**Fix:** For parsers with known small ID space, use a flat `Array<ParserState | undefined>` indexed by `id * maxLen + offset`. Falls back to Map for large grammars.
**Impact:** O(1) lookup with cache-friendly memory layout.

### 6.7 `TextDecoder`-Free Number Parsing
**Observation:** `parseFloat` is called for every JSON number. For integers, manual accumulation (`val * 10 + digit`) is faster.
**Fix:** Already implemented in `json-fast.ts` — propagate the pattern to the BBNF-generated number parser.

---

## Phase 7: Cross-Language Isomorphism

Ensure the TS and Rust implementations share the same API surface, combinator names, semantics, and BBNF grammar handling where not language-specific.

### 7.1 Combinator Name Alignment

| Concept | TypeScript | Rust | Action |
|---------|-----------|------|--------|
| Sequence | `all(a, b)` | `sp_then` / macro `seq!` | Document equivalence |
| Alternation | `any(a, b)` / `oneOf` | `sp_or` / `one_of` | Rename Rust `one_of` → `any_of` OR alias |
| Optional | `optional(p)` | `sp_option(p)` | Already equivalent |
| Many | `many(p, min, max)` | `sp_many(p, min, max)` | TS has min/max, verify Rust does too |
| Skip left | `a.skip(b)` | `sp_skip(a).sp_then(b)` | Document: TS skip = "parse a, discard b"; Rust sp_skip = "discard a, keep b" — **REVERSED SEMANTICS** |
| Trim | `p.trim(ws)` | `sp_trim(p, ws)` | Equivalent |
| Map | `p.map(f)` | `sp_map(p, f)` | Equivalent |
| Wrap | `p.wrap(l, r)` | N/A in combinators | Add `sp_wrap(p, l, r)` to Rust |
| Lazy | `Parser.lazy(() => p)` | `lazy(|| p)` | Equivalent |

**Priority:** Fix the `skip` semantic inversion documentation. Add `sp_wrap` to Rust combinators.

### 7.2 Error Reporting Alignment
- **TS:** Returns `ParserState` with `isError: true`, `error: string`, `offset: number`
- **Rust:** Returns `ParseError` with `message: String`, `offset: usize`, `expected: Vec<String>`

**Action:** Add `expected` field to TS error state. Add structured error types to Rust matching TS patterns.

### 7.3 BBNF Grammar Parsing Parity
Both sides parse BBNF grammars. Verify identical behavior:
- **Operator precedence**: `>>`, `<<`, `|`, `*`, `+`, `?`
- **String escape sequences**: `\n`, `\t`, `\\`, `\"`
- **Regex syntax**: `/pattern/flags` — verify same flag support
- **Nonterminal reference resolution**: case-sensitivity, error on undefined

**Action:** Create a shared test suite of `.bbnf` files with expected AST output. Both parsers must produce structurally identical ASTs.

### 7.4 BBNF Codegen Equivalence
For each BBNF grammar, the generated parser should produce the same parse tree (modulo language-specific type representations):
- **Sequence results**: TS produces tuples/arrays, Rust produces tuples — equivalent
- **Alternation results**: TS produces tagged unions (via enum-like), Rust produces enum variants — equivalent
- **Optional results**: TS produces `T | null`, Rust produces `Option<T>` — equivalent

**Action:** Create a JSON test oracle: for each test input, both sides output a normalized JSON parse tree. Diff them.

### 7.5 `many()` / `sepBy()` Min/Max Semantics
**TS:** `many(p, min?, max?)` with default `min=0, max=Infinity`
**Rust:** `sp_many(p, min, max)` — verify defaults match

**Action:** Add test cases for edge cases: `many(p, 0, 0)`, `many(p, 3, 3)`, `many(p, 2, 5)` on both sides.

### 7.6 Whitespace Handling Parity
**TS BBNF:** `ignore_whitespace` option — auto-trims between tokens
**Rust BBNF:** `ignore_whitespace` attribute — same concept

**Action:** Verify the whitespace regex is identical. Verify trim is applied at the same parse points.

### 7.7 Memoization Semantics
**TS:** `parser.memoize()` — opt-in per parser
**Rust:** `sp_memoize()` — same pattern

**Action:** Verify memoization key semantics match (parser ID + offset). Verify cache invalidation behavior.

### 7.8 Shared Grammar Test Suite
Create `grammar/tests/` directory with:
- `json-valid.txt` / `json-invalid.txt` — JSON test vectors
- `math-expressions.txt` — arithmetic test vectors
- `expected-outputs/` — canonical parse results in JSON format

Both TS and Rust test suites should read from this shared directory.

### 7.9 API Documentation Parity
Ensure both READMEs document:
- All combinators with equivalent names cross-referenced
- Semantic differences clearly called out
- Performance characteristics

### 7.10 BBNF Language Specification
Create `grammar/BBNF.md` — the formal specification of BBNF syntax and semantics. Both implementations are conformance targets. This already partially exists in scattered comments — consolidate.

### 7.11 Shared BBNF Grammar Linting
Both TS and Rust should warn on:
- Unused nonterminals
- Undefined nonterminal references
- Left-recursive rules (unless opt-in)
- Ambiguous alternations (FIRST set overlap)

The Rust LSP (`bbnf/lsp/`) already has some of these diagnostics. Port to TS.

---

## Phase 8: Integration of Unfinished v1 Items

### 8.1 Enable Dispatch Codegen (completes 1.3)
**Blocker:** The alternation codegen produces `Box<Enum>` for non-acyclic rules, but `dispatch_byte_multi` expects uniform unboxed types.
**Fix options:**
1. Generate `.map(|v| Box::new(v))` around each dispatch arm
2. Create `dispatch_byte_multi_boxed()` that auto-boxes results
3. Refactor type inference so alternations always produce the same type wrapper

**Priority:** High — this is the single biggest remaining win for Rust BBNF performance.

### 8.2 Wire Left-Recursion into Pipeline (completes 1.5)
**Action:** In `derive/lib.rs`, after AST parsing and before SCC analysis:
```rust
if parser_container_attrs.optimize_left_recursion {
    let ast = remove_left_recursion(&ast);
}
```
Add `optimize_left_recursion: bool` to `ParserAttributes`. Parse from `#[parser(optimize_left_recursion)]`.

### 8.3 Consume Ref Counts + Aliases in Codegen (completes 1.6)
**Action:** In `calculate_nonterminal_generated_parsers`:
- If `ref_count == 1` and rule is acyclic → inline the parser body
- If rule is an alias (`find_aliases` result) → emit a `pub fn alias() -> Parser { target() }` or inline

---

## Execution Order (v2)

```
Phase 5 (Rust BBNF perf):
  5.1 Dispatch codegen ────────── HIGH (biggest win, unblocks 8.1)
  5.2 Redundant trim removal ─── MEDIUM
  5.3 Inline single-ref ──────── MEDIUM (uses 1.6)
  5.4 Alias collapse ─────────── LOW (uses 1.6)
  5.5 Wire LR removal ────────── MEDIUM (unblocks 4.2)
  5.6 String literal specialize ─ LOW
  5.7 Fuse skip+next ─────────── MEDIUM
  5.8 Escape-free string path ── HIGH (big win for string-heavy)

Phase 6 (TS perf):
  6.1 Benchmark json-fast ─────── HIGH (validate 2.3)
  6.2 Avoid substring in regex ── MEDIUM
  6.3 Flatten all() chains ────── MEDIUM
  6.4 charCodeAt dispatch ─────── LOW
  6.5 ParserState pooling ─────── MEDIUM
  6.6 TypedArray memo table ───── LOW
  6.7 Manual number parsing ───── LOW (already in json-fast)

Phase 7 (Isomorphism):
  7.1 Name alignment ──────────── LOW effort, HIGH value
  7.3 Grammar parsing parity ──── HIGH value
  7.8 Shared test suite ───────── HIGH value (enables 7.4)
  7.10 BBNF spec ──────────────── MEDIUM effort

Phase 8 (Integration):
  8.1 = 5.1 (same item)
  8.2 Wire LR removal ─────────── MEDIUM
  8.3 Consume ref counts ──────── LOW
```

**Recommended priority order:** 5.1 → 5.8 → 6.1 → 5.5/8.2 → 7.8 → 7.3 → 5.2 → 5.7 → 6.2 → 6.3 → remainder

---

## Test Commands

```bash
# TypeScript
cd typescript && npm test                                              # 49 tests
cd typescript && npx vitest bench test/benchmarks/json.bench.ts        # quick bench
cd typescript && npx vitest bench test/benchmarks/json-comprehensive.bench.ts  # full matrix

# Rust
cd rust && cargo test --workspace                                      # 263 tests
cd rust && cargo bench -p parse_that --bench parse_that                # fast-path
cd rust && cargo bench -p parse_that --bench parse_that_bbnf           # BBNF-generated
cd rust && cargo bench -p parse_that --bench parse_that_combinator     # combinator path
```

---

## Risk Assessment

| Item | Risk | Mitigation |
|------|------|------------|
| 5.1 Dispatch codegen Box issue | Medium — type system complexity | Start with `.map(Box::new)` wrapper; refactor later |
| 5.8 memchr in BBNF-generated | Low — proven pattern in fast-path | Copy from fast-path implementation |
| 6.5 ParserState pooling | High — subtle mutation bugs | Extensive test coverage, clone-on-branch semantics |
| 7.3 Grammar parity | Medium — unknown divergences | Build shared test oracle first |
| 7.1 Name alignment | Low — backward-compat aliases | Add aliases, deprecate old names |
