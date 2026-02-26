# Rust JSON Parser Performance: Research, Optimization, and Findings

A chronicle of taking `parse_that`'s Rust JSON parser from mid-tier combinator
performance (~400–750 MB/s) to scalar state-of-the-art (~1,600–1,730 MB/s),
surpassing jiter and simd-json on most datasets while remaining a general-purpose
parser combinator library.

**Platform**: Apple M-series (AArch64), Rust nightly, default codegen (no
`-C target-cpu=native`).

---

## Table of Contents

1. [Benchmark Matrix](#benchmark-matrix)
2. [Methodology](#methodology)
3. [Optimization Phases](#optimization-phases)
4. [Architecture Deep Dive](#architecture-deep-dive)
5. [Why Competitors Are Slower (or Faster)](#why-competitors-are-slower-or-faster)
6. [Compiler and Microarchitecture Theory](#compiler-and-microarchitecture-theory)
7. [Anti-Patterns: What Didn't Work](#anti-patterns-what-didnt-work)
8. [Lessons](#lessons)

---

## Benchmark Matrix

11 parsers × 6 datasets. All numbers are MB/s throughput, measured with the
`bencher` crate (statistical sampling, `black_box` on inputs, `b.bytes` set for
throughput calculation).

| Parser | data.json (35K) | canada (2.1M) | apache (127K) | twitter (632K) | citm_catalog (1.7M) | data-xl (39M) |
|---|---:|---:|---:|---:|---:|---:|
| sonic-rs | 2,307 | 1,520 | 1,892 | 2,511 | 3,019 | 2,769 |
| **parse_that (fast)** | **1,609** | **646** | **1,709** | **1,732** | **1,599** | **1,730** |
| simd-json | 1,395 | 498 | 1,456 | 1,530 | 1,327 | 1,655 |
| jiter | 1,341 | 579 | 1,137 | 1,027 | 992 | 1,402 |
| serde_json_borrow | 1,219 | 623 | 1,140 | 1,340 | 1,309 | 1,245 |
| **parse_that (combinator)** | 1,037 | 452 | 1,008 | 921 | 827 | 1,174 |
| nom | 615 | 399 | 722 | 514 | 627 | 619 |
| serde_json | 607 | 569 | 546 | 582 | 864 | 624 |
| winnow | 550 | 392 | 635 | 540 | 597 | 594 |
| pest | 259 | 160 | 283 | 244 | 257 | 268 |
| **parse_that (BBNF)** | **249** | **309** | **358** | **342** | **438** | **552** |

### Dataset Profiles

| File | Size | Character |
|---|---|---|
| `data.json` | 35 KB | Mixed types, moderate nesting |
| `canada.json` | 2.1 MB | 99% numbers (coordinates), minified, 56K-element arrays |
| `apache-builds.json` | 127 KB | String-heavy, `\/` escapes |
| `data-xl.json` | 39 MB | `data.json` × 1000, tests sustained throughput |
| `twitter.json` | 632 KB | Unicode-heavy, CJK text, many escape sequences |
| `citm_catalog.json` | 1.7 MB | Wide objects, many keys, integer-heavy, whitespace-heavy |

The six files exercise different bottlenecks: `canada.json` hammers number parsing,
`twitter.json` hammers string/escape handling, `citm_catalog.json` hammers object
key lookup and whitespace skipping, `data-xl.json` tests whether throughput
degrades with working-set size.

---

## Methodology

### Fairness Protocol

Every parser in the matrix must do equivalent work. Specifically:

1. **Full DOM materialization.** Every parser must build an in-memory tree of
   values — not just tokenize or validate. Pest was initially only running its PEG
   recognizer; we added a `consume()` pass that builds `JsonValue` variants from
   the `Pairs` iterator.

2. **String escape decoding.** All production parsers (serde_json, jiter,
   simd-json, sonic-rs) fully decode JSON escape sequences (`\"`, `\\`, `\n`,
   `\uXXXX`, UTF-16 surrogate pairs). An early audit revealed parse_that was
   returning raw borrowed slices without unescaping — a significant unfair
   advantage. We implemented full RFC 8259 escape decoding before accepting any
   numbers.

3. **`black_box` on inputs.** Every benchmark wraps the input reference in
   `black_box()` to prevent the compiler from hoisting parse results across
   iterations.

4. **No `target-cpu=native`.** All parsers compile with default codegen flags.
   sonic-rs would benefit from explicit NEON/AVX2 tuning, but we prioritize
   reproducibility.

5. **Equivalent allocation strategy.** Where a parser supports both borrowed and
   owned modes (simd-json, serde_json_borrow), we use the borrowed variant for
   fair comparison. simd-json's mandatory `.to_vec()` (mutable input requirement)
   is counted as inherent library overhead.

### Correctness Verification

61 tests validate the fast parser against serde_json as the reference
implementation:

- **Structural equivalence**: recursive tree comparison across all 6 datasets
- **String content equivalence**: byte-for-byte comparison of decoded strings
  (including `twitter.json`'s CJK text and escape sequences)
- **Edge cases**: empty strings, lone surrogates (rejected), `\uD83D\uDE00`
  surrogate pairs (decoded to U+1F600), all RFC 8259 escape types
- **`Cow` variant checks**: escape-free strings are `Cow::Borrowed` (zero-copy),
  strings with escapes are `Cow::Owned`

---

## Optimization Phases

### Phase 1–2: Foundation (Baseline → ~750 MB/s)

Starting from the combinator-based `json_parser()`:

- **`SpanParser` enum dispatch.** Replaced `Box<dyn ParserFn>` with a
  `SpanParser` enum for span-level operations (string scanning, number scanning,
  keyword matching). This eliminates vtable indirection for leaf parsers —
  the compiler can inline the enum `match` directly.

- **`dispatch_byte_multi` LUT.** A 256-entry lookup table maps the first byte of
  input to a parser index. This gives O(1) type discrimination — no sequential
  `or()` chain. The LUT fits in 512 bytes (256 × `Option<u16>`), well within L1
  data cache.

- **`memchr2` SIMD string scanning.** JSON strings are scanned for `"` and `\`
  using `memchr::memchr2`, which compiles to NEON `vceqq_u8` + `vorrq_u8` +
  `vshrn_n_u16` on AArch64. This processes 16 bytes per iteration versus
  byte-at-a-time scanning.

- **`fast_float2` number parsing.** The Eisel-Lemire algorithm for
  string-to-float conversion, matching jiter's `lexical-parse-float`.

- **`UnsafeCell` lazy initialization.** Replaced `RefCell<Option<Rc<Parser>>>`
  with `UnsafeCell<LazyParser>` in the `lazy()` combinator. Eliminates runtime
  borrow checking and reference counting on every recursive call.

### Phase 3: Monolithic Fast Path (~750 → ~1,100 MB/s)

The single highest-impact change: a hand-written recursive `json_value_fast()`
function that replaces the entire combinator chain for JSON parsing.

```
Before (combinator path, per value):
  Parser::call → Box<dyn ParserFn> vtable hop
    → dispatch_byte_multi closure → LUT lookup
      → matched Parser::call → another vtable hop
        → sep_by/wrap/trim_whitespace → more vtable hops

After (monolithic path, per value):
  json_value_fast() → inline match on first byte → direct recursion
```

This eliminated **3+ vtable indirections per value**. The entire JSON grammar
lives in one ~80-line function with inline first-byte dispatch. Whitespace is
skipped exactly once per value (before dispatch) and once after each separator.

**Key insight**: vtable hops aren't expensive in isolation (~2–3 ns each), but
JSON parsing processes millions of values per second. At 1 million values/second,
3 vtable hops × 3 ns = 9 μs/iteration — a measurable fraction of total parse
time. More importantly, vtable calls are **indirect branches** that pollute the
branch target buffer (BTB) and prevent inlining, which cascades into missed
optimizations.

### Phase 4: Integer Fast Path (~1,100 → ~1,600 MB/s)

`canada.json` is 99% numbers, mostly integers (latitude/longitude coordinates
with no decimal point). Every number previously went through:

1. `number_span_fast` — byte scan to find span boundaries
2. `fast_float2::parse(span)` — re-scans the same bytes as a float

For pure integers (no `.`, `e`, `E`), we accumulate the value inline during the
scan using a branchless loop:

```rust
let mut int_val: u64 = 0;
while i < len {
    let b = unsafe { *bytes.get_unchecked(i) };
    if !b.is_ascii_digit() { break; }
    int_val = int_val.wrapping_mul(10).wrapping_add((b & 0x0f) as u64);
    i += 1;
}
```

If no `.`/`e`/`E` follows, the integer is converted to `f64` directly — no float
parsing at all. The threshold is 16 digits with a `2^53` guard (integers beyond
`9_007_199_254_740_992` fall through to `fast_float2` for exact conversion).

On AArch64, the final integer-to-float conversion compiles to a single `ucvtf`
instruction (unsigned integer to floating-point), versus the multi-instruction
Eisel-Lemire pipeline.

### Phase 5: Data Structure and Microoptimizations

- **`HashMap` → `Vec<(Cow<str>, JsonValue)>` for objects.** JSON objects are
  stored as ordered pairs, not hash maps. This eliminates SipHash computation on
  every key insertion. For the typical JSON object (5–20 keys), linear scan is
  faster than hashing due to cache locality.

- **`u32` unaligned word-loads for keywords.** `true`, `false`, and `null` are
  matched by reading a `u32` (or `u32` + `u8`) in a single load and comparing
  against a compile-time constant:

  ```rust
  let word = unsafe { (bytes.as_ptr().add(offset) as *const u32).read_unaligned() };
  if word == u32::from_ne_bytes(*b"true") { ... }
  ```

  This replaces 4 sequential byte comparisons with 1 word comparison. On AArch64,
  unaligned loads have zero penalty (the load/store unit handles crossing cache
  lines transparently).

- **`std::hint::cold_path()`** on error branches. Tells the compiler that error
  returns are unlikely, allowing it to lay out the hot path linearly in memory
  (no taken branches in the common case).

- **`Vec::with_capacity(4)`** for arrays and objects. Small initial capacity
  avoids the `Vec` growth sequence `0 → 1 → 2 → 4` (three reallocations) for
  typical small containers, without over-allocating for the common `[lat, lng]`
  coordinate pairs.

### Phase 6: Honest String Decoding

An audit revealed that parse_that was not decoding JSON string escapes — returning
raw `\n` as two bytes instead of a newline character. All competitors do full
unescaping. We implemented a two-tier `Cow<'a, str>` approach:

**Fast path** (`json_string_decoded_fast`): SIMD-scan with `memchr2('"', '\\')`
hoping for no escapes. If the closing `"` is found before any `\`, return
`Cow::Borrowed(&str)` — zero allocation, zero copy.

**Cold path** (`json_string_unescape`, marked `#[cold]`): On first `\`, copy the
prefix into a `String`, then decode escapes one at a time:
- Simple escapes: `\"`, `\\`, `\/`, `\b`, `\f`, `\n`, `\r`, `\t`
- BMP codepoints: `\uXXXX` → `char::from_u32`
- Surrogate pairs: `\uD83D\uDE00` → compute `0x10000 + (high - 0xD800) << 10 + (low - 0xDC00)` → `char`

Between escape sequences, `memchr2` scans for the next `"` or `\`, copying
literal segments in bulk — amortizing the SIMD setup cost.

**Impact**: twitter.json (escape-heavy) dropped ~14%. All other datasets <3%
regression. The `#[cold]` annotation keeps the unescape function out of L1
icache, preserving the fast path's instruction density.

### Phase 7: Hybrid BBNF Codegen (~14 → ~249–552 MB/s)

The BBNF-generated parser was previously a pure generic-combinator path with
~115x overhead versus the fast path. Four codegen phases automatically detect
when grammar patterns match optimized static parsers and emit them:

**Phase A — Number regex substitution.** `is_json_number_regex()` detects the
canonical JSON number regex (`/-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/`) and
substitutes `sp_json_number()`, a monolithic byte scanner. On `canada.json`
(99% numbers), this alone reduced the BBNF/combinator ratio from 4.5x to ~3x.

**Phase B — Transparent alternation elimination.** Rules like
`value = object | array | string | number | bool | null` are "pure alternation"
— every branch is a nonterminal, and the rule adds no structural information.
The `find_transparent_alternations()` analysis pass detects these, and the
derive macro skips their enum variant. Previously each value parse produced:

```
Box::new(JsonEnum::value(Box::new(JsonEnum::string(span))))
```

Now it produces:

```
Box::new(JsonEnum::string(span))
```

One fewer Box allocation and one fewer enum tag per value. The `value()` method
returns `Parser<'a, Box<JsonEnum<'a>>>` directly instead of
`Parser<'a, JsonEnum<'a>>`.

**Phase C — Inline match dispatch.** Alternations with disjoint FIRST sets
(computed in `analysis.rs`) now emit a compile-time `match byte { ... }`
statement instead of `dispatch_byte_multi(vec![...])`. This eliminates the
`Vec` allocation, LUT construction, and per-branch vtable hop through
`Box<dyn ParserFn>`. Branch parsers are hoisted into `let` bindings before
the closure so they're constructed once at parser-build time.

```rust
// Before: runtime LUT → parsers[idx].call(state) (vtable hop)
// After:
let _branch_0 = /* parser for '{' */;
let _branch_1 = /* parser for '[' */;
Parser::new(move |state: &mut ParserState<'a>| {
    let byte = *state.src_bytes.get(state.offset)?;
    match byte {
        b'{' => _branch_0.call(state),
        b'[' => _branch_1.call(state),
        b'"' => _branch_2.call(state),
        // ...
        _ => None,
    }
})
```

**Phase D — SpanParser dual methods.** `find_span_eligible_rules()` identifies
rules whose body can be expressed entirely as a `SpanParser` (no recursion, no
heterogeneous output). For these rules, the derive macro emits both:

```rust
fn string_sp<'a>() -> SpanParser<'a> { sp_json_string_quoted() }
fn string<'a>() -> Parser<'a, JsonEnum<'a>> { ... }
```

In the Phase C inline match, span-eligible branches call `Self::rule_sp()`
directly — `SpanParser::call()` is `#[inline(always)]` with enum dispatch,
zero vtable hops.

**Benchmark results (BBNF / combinator ratio):**

| Benchmark | Before | After |
|-----------|--------|-------|
| canada | ~∞ | 1.45x |
| twitter | ~∞ | 2.46x |
| citm_catalog | ~∞ | 1.92x |
| data_xl | ~∞ | 2.08x |
| data | ~∞ | 3.97x |
| apache | ~∞ | 2.78x |

The BBNF parser is now within 1.5–4x of the hand-written combinator parser,
and within the same order of magnitude as nom, winnow, and serde_json —
all from a grammar file with zero hand-written Rust.

---

## Architecture Deep Dive

### Why the Fast Path Wins: 8 Compounding Factors

The monolithic parser's advantage is not one technique but the multiplicative
interaction of eight factors. Each contributes 5–30% individually; together they
compound to ~2.4x over the combinator path and ~1.2–1.7x over jiter/simd-json.

#### 1. L1 Instruction Cache Fit

The entire hot path — `json_value_fast` + `json_string_decoded_fast` +
`number_fast` + `skip_ws` — compiles to ~2.9 KB of machine code. The Apple M-series
L1 icache is 192 KB. The hot path fits in **1.5% of L1i**, meaning:

- Zero icache misses during parsing (confirmed by the absence of throughput
  degradation on `data-xl.json`, which is 39 MB)
- The instruction fetch unit can stream ahead without stalls
- No competition with other code for icache lines

By contrast, the combinator path's `Box<dyn ParserFn>` closures are scattered
across multiple allocations in the heap. Each vtable dispatch jumps to a different
address, thrashing the icache.

#### 2. Zero-Copy Borrowed Strings (`Cow::Borrowed`)

~95% of JSON strings contain no escape sequences. For these, we return a
`Cow::Borrowed(&'a str)` — a pointer + length into the original input buffer.
No allocation, no copy, no `String` construction.

Only strings with `\` trigger the cold unescape path, which allocates a `String`
and returns `Cow::Owned`. The `Cow` enum's discriminant is 1 byte; the branch
predictor quickly learns that `Borrowed` is the overwhelmingly common case.

#### 3. SIMD String Scanning (`memchr2`)

`memchr::memchr2(b'"', b'\\', slice)` compiles to:

```
; AArch64 NEON (conceptual)
vld1q_u8    v0, [slice]          ; load 16 bytes
vceqq_u8    v1, v0, vdup('"')    ; compare with '"'
vceqq_u8    v2, v0, vdup('\\')   ; compare with '\\'
vorrq_u8    v3, v1, v2           ; OR results
vshrn_n_u16 v4, v3, #4           ; narrow to bitmask
fmov        x0, d4               ; extract to GPR
rbit        x0, x0               ; reverse bits for ctz
clz         x0, x0               ; count leading zeros → position
```

This processes 16 bytes per iteration. A typical JSON string is 10–40 bytes,
meaning 1–3 SIMD iterations versus 10–40 scalar byte comparisons.

#### 4. Integer Fast Path

Pure integers bypass the entire Eisel-Lemire float pipeline:

```
wrapping_mul(10) + wrapping_add(digit)  →  ucvtf d0, x0
```

The `wrapping_mul`/`wrapping_add` sequence compiles to `madd` (multiply-add) on
AArch64 — a single-cycle instruction. The final `ucvtf` (unsigned convert to
float) is also single-cycle. Compare this to Eisel-Lemire, which involves:
mantissa extraction, exponent table lookup, 128-bit multiplication,
rounding-mode checks — ~15–20 instructions for the fast path alone.

On `canada.json` (99% integers), this saves ~10 instructions per number ×
~112K numbers = ~1.1M saved instructions.

#### 5. No `Arc`/`Rc` per Container

jiter wraps every array and object in `Arc<SmallVec<...>>` for cheap cloning.
This means every `[` and `{` incurs:
- An atomic reference count allocation (`Arc::new`)
- `SmallVec` inline-buffer setup (24 bytes on stack)
- Potential `SmallVec` spill to heap (if >2 elements for objects, >8 for arrays)

parse_that uses plain `Vec` — one heap allocation, no atomic operations, no
inline-buffer bookkeeping. For `canada.json`'s 56K-element coordinate arrays,
this avoids 56K × 2 atomic increments.

#### 6. Single-Pass Architecture

simd-json uses a 3-phase pipeline:
1. **Stage 1** (SIMD): Scan for structural characters (`{`, `}`, `[`, `]`, `:`,
   `,`, `"`), build a bitmap index
2. **Stage 2**: Walk the index to build a tape (type + offset pairs)
3. **Stage 3**: Materialize DOM values from the tape

Each phase reads the input (or its derived index) sequentially. The total work
is ~2.5 passes over the data.

parse_that reads each byte exactly once. The `match` on the first byte
dispatches directly to the appropriate handler, which consumes its extent and
returns. No index, no tape, no second pass.

For cache-resident data (<L2 size), single-pass wins because each byte is
hot in L1d when it's consumed. For data larger than L2, the advantage
compounds — simd-json's Stage 1 evicts the beginning of the input before
Stage 2 reads it.

#### 7. Branchless Whitespace Detection

```rust
match byte {
    b' ' | b'\t' | b'\n' | b'\r' => i += 1,
    _ => break,
}
```

LLVM compiles this to a 4-entry comparison that collapses to a bitmask test:

```asm
; AArch64 (conceptual — actual codegen may vary)
sub     w1, w0, #9        ; w0 = byte
cmp     w1, #4             ; is it in [9..13]? (\t, \n, \v, \f, \r)
ccmp    w0, #32, #4, hi   ; or is it ' '?
b.ne    .Lbreak
```

This is 3 instructions with no branch misprediction (the comparison chain uses
conditional compare `ccmp`, which is branchless).

#### 8. `u32` Keyword Loads

Matching `true` as four individual bytes requires 4 loads + 4 comparisons + 3
`and` operations = 11 micro-ops. Matching it as one `u32` requires 1 load + 1
comparison = 2 micro-ops. This is a 5.5x reduction in micro-ops per keyword.

JSON keywords appear frequently (`null` values in arrays, `true`/`false` in
boolean fields), so this adds up across large files.

---

## Why Competitors Are Slower (or Faster)

### sonic-rs (2.3–3.0 GB/s) — The Ceiling

sonic-rs is unreachable without a fundamentally different architecture:

- **AVX2/NEON pipelines**: Processes 32 bytes/iteration for strings, 64
  bytes/iteration for whitespace. `_mm256_cmpeq_epi8` + `_mm256_movemask_epi8`
  finds all `"` positions in 2 instructions.
- **`PCLMULQDQ` in-string tracking**: Carryless multiplication to track whether
  a `"` is inside or outside a string across 64-byte windows — 1 instruction
  replaces a stateful DFA.
- **`bumpalo` arena allocation**: All DOM nodes allocated from a bump arena.
  `alloc()` is a pointer bump (1 instruction). No `malloc`/`free` overhead, no
  fragmentation.
- **16-byte packed `Value`**: Union type that fits in 2 machine words. 4 values
  per 64-byte cache line.
- **`_mm_maddubs_epi16` integer parsing**: Parses 16 ASCII digits into an
  integer in 3 SIMD instructions (multiply-add on unsigned bytes).

These are architecture-level decisions that require the entire library to be
designed around SIMD. A parser combinator library cannot adopt them without
ceasing to be a combinator library.

### jiter (1.0–1.4 GB/s) — Closest Scalar Peer

jiter is primarily scalar, like parse_that. The gap comes from:

- **`Arc<SmallVec>` per container**: Atomic reference counting on every array
  and object construction. `Arc::new` requires an allocation + atomic store.
- **`SmallVec` overhead**: Inline buffer (24 bytes on stack) + overflow check on
  every `push`. For large arrays, the spill to heap is an additional allocation.
- **`JsonArray`/`JsonObject` newtype wrappers**: An extra layer of indirection
  that the compiler can sometimes but not always elide.
- **`Peek(u8)` type discrimination**: jiter's `Peek` type wraps a `u8` and goes
  through a `match` — functionally similar to our dispatch, but the extra newtype
  prevents the compiler from folding the match into a jump table as aggressively.

jiter does use techniques we adopted: Eisel-Lemire floats, direct recursive
dispatch, `Cow<str>` strings. The difference is in the container overhead.

### simd-json (1.3–1.7 GB/s) — Multi-Pass Tax

simd-json's 3-phase architecture (described above) means it reads data ~2.5x.
Additionally:

- **Mandatory `.to_vec()`**: simd-json requires mutable input (it writes sentinel
  bytes for SIMD alignment). The buffer clone is counted in benchmark time.
- **`halfbrown::HashMap`** for objects: A hybrid `Vec`/`HashMap` that switches
  representation at a threshold. The mode check on every insert adds overhead.
- **Tape intermediary**: Stage 2 builds a tape before Stage 3 materializes DOM
  values. The tape is a `Vec<Node>` that must be allocated and populated.

On files where SIMD Stage 1 dominates (heavily minified, long strings),
simd-json can beat us. On files with many small values (citm_catalog), the
multi-pass overhead makes it slower.

### serde_json (550–870 MB/s) — Protocol Overhead

serde_json uses Rust's `serde` framework, which imposes a visitor pattern:

1. `Deserializer::deserialize_any()` — virtual dispatch to determine type
2. `Visitor::visit_str()` / `visit_f64()` / etc. — virtual dispatch to
   construct value
3. `Value::String(String)` — always allocates an owned `String`

That's 2 virtual dispatches per value + mandatory string allocation. The
`Deserializer` also re-validates UTF-8 on borrowed strings (we trust the input
and use `from_utf8_unchecked`).

### nom (550–720 MB/s) — Combinator Depth

nom's JSON parser (from its examples) incurs:

- **12+ combinator calls per value**: `preceded` → `sp` → `alt` → 6 branches,
  each wrapped in `map`. Every combinator is a function call with an `IResult`
  return.
- **`char`-by-char string scanning**: `take_while1(is_string_character)` checks
  one byte at a time — no SIMD.
- **`HashMap` for objects**: `HashMap::default()` + `insert()` per key-value
  pair.
- **`nom::number::complete::double`**: stdlib float parsing, not Eisel-Lemire.

### winnow (550–635 MB/s) — Better nom, Same Limits

winnow (nom's successor) improves dispatch with `dispatch!` macro (first-byte
branching, similar to our LUT), but still:

- **Char-level string scanning**: `take_while(0.., |c| c != '"' && c != '\\')`
  — no SIMD batching.
- **`HashMap` for objects**.
- **`winnow::ascii::float`**: Better than stdlib but not Eisel-Lemire.

### pest (250–280 MB/s) — Two-Phase PEG

pest runs a PEG recognizer that produces a `Pairs` token tree, then a second
pass materializes DOM values. Every grammar rule creates a `Pair` allocation
(boxed span + rule ID). The interpretive PEG engine adds overhead versus compiled
recursive descent.

### BBNF (~249–552 MB/s) — Hybrid Codegen

parse_that's BBNF-generated parser (via `#[derive(Parser)]`) was originally
~14 MB/s — a ~115x gap versus the fast path. Four phases of automatic codegen
optimizations ("Hybrid BBNF Codegen") closed that to 1.5–4x:

| Phase | Technique | Impact |
|-------|-----------|--------|
| A | JSON number regex → `sp_json_number()` monolithic scanner | 5–15% (number-heavy) |
| B | Transparent alternation elimination — skip wrapper enum variants for pure-alternation rules like `value`, saving 1 Box + 1 enum tag per parse | ~20% |
| C | Inline match dispatch — compile-time `match byte {}` replaces runtime `dispatch_byte_multi` LUT, eliminates per-branch vtable hops | ~10% |
| D | SpanParser `_sp()` dual methods for leaf rules — span-eligible branches call `Self::rule_sp()` directly (no vtable hop, `#[inline(always)]`) | ~5–10% |

**Remaining overhead vs. combinator path (1.5–4x):**

- **`Box<JsonEnum>` allocations**: Every recursive value is still heap-allocated
  through the generic BBNF value type. Phase B eliminates one layer of boxing
  for transparent rules, but non-transparent rules still box.
- **Enum tag overhead**: Each value carries an enum discriminant. The combinator
  and fast paths use `JsonValue` (a smaller, purpose-built enum).
- **Generic whitespace trimming**: BBNF rules inject whitespace handling at
  every level — though dispatch_byte_multi elimination reduces the total vtable
  hops, the trim overhead remains.

**Remaining overhead vs. fast path (3–5x):**

All of the above, plus: no SIMD string decoding (`memchr2`), no integer fast
path (BBNF uses `sp_json_number()` which scans spans but still defers float
parsing to stdlib), no `Cow<str>` escape elision, no `Vec<(K,V)>` object
optimization. These are JSON-specific techniques that a generic grammar
framework cannot automatically apply.

---

## Compiler and Microarchitecture Theory

### Why Vtable Elimination Matters More Than You Think

A vtable call (`Box<dyn Fn>`) on AArch64 compiles to:

```asm
ldr   x8, [x0]          ; load vtable pointer
ldr   x9, [x8, #METHOD] ; load function pointer from vtable
blr   x9                 ; indirect branch to function
```

The `blr` (branch-link-register) is an indirect branch. The branch target
buffer (BTB) must predict the target address. In a JSON parser, the same
`Parser::call` vtable is used for different concrete types (string parser, number
parser, array parser), so the BTB sees **polymorphic dispatch** — the same
call site jumps to different addresses depending on which parser is active.

Modern BTBs (Apple M-series: ~6K entries, 3-level) can track a few targets per
site, but with 7+ JSON value types cycling through the same vtable, prediction
accuracy drops. Each misprediction costs 10–14 cycles (Apple M-series pipeline
depth).

The monolithic `match` statement, by contrast, compiles to a **direct jump
table**:

```asm
; Simplified — actual codegen uses a range check + subtraction + table
adrp  x8, .Ljumptable
add   x8, x8, :lo12:.Ljumptable
ldr   x9, [x8, w0, uxtw #3]   ; index into jump table
br    x9                        ; direct branch
```

The jump table target is fully determined by the input byte — no polymorphism.
The BTB sees consistent patterns and predicts nearly perfectly.

### Why `#[cold]` Matters for Icache

The `#[cold]` attribute on `json_string_unescape` tells LLVM to:

1. Place the function's code at the end of the `.text` section, far from hot code
2. Optimize for size (no loop unrolling, no function inlining)
3. Treat branches that lead to this function as unlikely (profile-guided layout)

This keeps the hot path — `json_value_fast`, `json_string_decoded_fast`,
`number_fast`, `skip_ws` — contiguous in memory. Contiguous code means the
instruction prefetcher (which streams ahead linearly) loads exactly the
instructions that will execute next, with no wasted icache lines on error
handling or rare escape-decoding code.

### Why `unsafe` Gets Unchecked Is Free

```rust
unsafe { *bytes.get_unchecked(i) }
```

eliminates a bounds check that would otherwise compile to:

```asm
cmp   x1, x2      ; compare index against length
b.hs  .Lpanic     ; branch to panic if out of bounds
```

The `cmp` + `b.hs` is only 2 instructions, but:

1. The branch to `.Lpanic` pollutes the branch predictor's pattern history
2. The comparison creates a data dependency — the CPU cannot speculatively
   load the byte until the comparison resolves (on some microarchitectures)
3. The panic path's code is pulled into the function body, expanding icache
   footprint

We use `get_unchecked` only where the bounds have been verified by a prior check
(e.g., `if offset >= bytes.len() { return None }` at the top of the function),
so the unsafe is sound.

### Why `wrapping_mul`/`wrapping_add` for Integer Accumulation

Rust's default integer arithmetic panics on overflow (in debug) or wraps (in
release). By explicitly using `wrapping_mul` and `wrapping_add`, we
communicate to LLVM that overflow is intentional, which:

1. Eliminates overflow check instructions in debug builds
2. Allows LLVM to fuse the multiply-add into a single `madd` instruction
   (multiply-accumulate, 1 cycle on AArch64)
3. Prevents LLVM from inserting `uadd.with.overflow` intrinsics that would
   generate conditional branches

The resulting loop body is:

```asm
.Ldigit_loop:
  ldrb  w3, [x1, x2]     ; load byte
  sub   w4, w3, #48       ; byte - '0'
  cmp   w4, #9            ; is it a digit?
  b.hi  .Ldone            ; if not, exit loop
  madd  x0, x0, x5, x4   ; int_val = int_val * 10 + digit
  add   x2, x2, #1        ; i++
  b     .Ldigit_loop
```

7 instructions per digit, dominated by the loop control overhead. The actual
accumulation is 1 instruction (`madd`).

### Why `Vec<(K, V)>` Beats `HashMap<K, V>` for JSON Objects

For a `HashMap` insertion:

1. Compute SipHash of key: ~15 ns for a 10-byte key (SipHash processes 8
   bytes per round, 2 rounds for short keys)
2. Probe hash table: 1–2 cache lines (16-byte buckets, Robin Hood probing)
3. Insert: write key + value + hash + metadata

For a `Vec::push((key, value))`:

1. Check capacity (usually passes — pre-allocated): 1 comparison
2. Write key + value at `vec.len()`: 1 store
3. Increment length: 1 add

The `Vec` path is ~3 instructions versus ~50+ for `HashMap`. For JSON objects
with <20 keys (the vast majority), even linear-scan lookup on the `Vec` is
faster than the hash computation alone.

---

## Anti-Patterns: What Didn't Work

### Capacity Heuristic Based on Remaining Input

An early optimization tried to estimate `Vec` capacity from the remaining input
size:

```rust
// DON'T DO THIS
let cap = std::cmp::min(remaining_bytes / 8, 1024);
Vec::with_capacity(cap)
```

This was **catastrophic** on `canada.json` (50–86% regression). The file contains
56K-element arrays of 2-element `[lat, lng]` pairs. The heuristic saw 2.1 MB
remaining and allocated 1024-element `Vec`s for every `[lat, lng]` pair — each
needing only 2 slots. The wasted allocations and cache pollution from oversized
buffers destroyed performance.

**Lesson**: Heuristics that look at global state (total input size) fail when
local structure varies. A fixed small capacity (4 or 8) works universally
because `Vec`'s geometric growth (2x) amortizes reallocation cost.

### `RefCell<Option<Rc<Parser>>>` for Lazy Initialization

The original `lazy()` combinator used `RefCell<Option<Rc<Parser>>>`:

- `RefCell`: runtime borrow check on every call (~3 instructions)
- `Option`: branch on `is_some()` on every call
- `Rc`: reference count increment on borrow, decrement on drop

Replacing with `UnsafeCell<LazyParser>` eliminated all three costs. The safety
argument: `lazy()` returns a `Parser` that is never shared across threads
(parsers are `!Send + !Sync`), and the `UnsafeCell` is only accessed through
the `Parser::call` path, which is single-threaded by construction.

---

## Lessons

1. **Monolithic beats modular for hot paths.** Combinator composition is
   excellent for expressiveness and maintainability, but each abstraction layer
   (trait object, closure, generic wrapper) adds indirection that prevents the
   compiler from seeing the full picture. For performance-critical paths, a
   single function with inline dispatch lets LLVM optimize globally.

2. **The multiplier effect is real.** No single optimization gave more than 30%.
   But 8 optimizations that each give 10–20% compound to 2.4x. The key is that
   they're orthogonal — each addresses a different bottleneck (icache, allocation,
   branch prediction, instruction count, SIMD, data structure).

3. **Audit for work equivalence before celebrating.** Our initial numbers showed
   parse_that beating simd-json by 2x. The real explanation was that we weren't
   decoding escape sequences. Honest benchmarks require honest work.

4. **Data structure choice matters more than algorithm choice.** Switching from
   `HashMap` to `Vec` for JSON objects was a larger win than the integer fast path
   on most datasets. The reason: `HashMap` overhead is per-object (and JSON has
   many objects), while the integer fast path only helps number-heavy files.

5. **`#[cold]` is the cheapest optimization.** One annotation on the unescape
   function kept it out of the icache with zero code changes. The hot path got
   faster by having less competition for icache lines.

6. **SIMD is available through libraries.** We didn't write any SIMD intrinsics.
   `memchr2` and `fast_float2` gave us SIMD string scanning and Eisel-Lemire
   floats as drop-in library calls. The ~100x human effort of hand-writing NEON
   intrinsics (like sonic-rs) is only justified when you've exhausted
   library-level SIMD.

7. **Generic frameworks can close the gap with automatic specialization.** The
   BBNF grammar framework started at ~115x overhead versus the fast path — the
   cost of treating every rule uniformly. Hybrid codegen (automatic pattern
   detection → specialized static parser substitution) closed this to 3–5x
   versus the fast path and 1.5–4x versus the hand-written combinator parser.
   The remaining gap is structural: `Box<Enum>` allocation per value, generic
   whitespace handling, and the absence of domain-specific techniques (SIMD
   strings, integer fast path, `Cow<str>` elision). These could be addressed
   by further codegen phases that detect more patterns, but the diminishing
   returns suggest the current balance of generality vs. performance is
   practical for most grammar-driven use cases.
