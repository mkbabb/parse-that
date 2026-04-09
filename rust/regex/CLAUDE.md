# CLAUDE.md — rust/regex/ (bbnf-regex)

Bespoke regex engine: HIR + hand-written parser, NFA→DFA compilation,
structural classification, ByteSet algebra, HIR-tier equality saturation,
unified regex info pass, FIRST-set extraction.

A leaf crate with zero parser-combinator or grammar-IR dependencies. Used
by `parse_that` (re-exports the engine), by `bbnf` (DFA codegen + regex
classification + structural facts), and by `bbnf-ir` (FIRST sets + the
shared `CharSet128` substrate).

## Structure

```
rust/regex/
├── Cargo.toml
├── src/
│   ├── lib.rs              Crate root + module declarations + public re-exports
│   ├── unicode.rs          Unicode general-category property tables
│   ├── utf8.rs             Codepoint range → UTF-8 byte sequence expansion
│   ├── first.rs            Conservative FIRST char extraction (regex_first_chars + _from_hir)
│   ├── hir/
│   │   ├── mod.rs          Hir enum + ByteRange + CharClass + Look + Repetition + ParseOptions
│   │   └── parser/         Hand-written recursive-descent parser (Tranche T split)
│   │       ├── mod.rs      Parser struct + parse / parse_with entry points + recursive descent
│   │       ├── cursor.rs   Cursor primitives (peek/advance/expect/err)
│   │       ├── atom.rs     parse_atom + the dot constructor
│   │       ├── repetition.rs  parse_quantified + parse_repetition_bounds + parse_decimal
│   │       ├── group.rs    parse_group + parse_flags
│   │       ├── class.rs    parse_char_class + char-class items + unicode codepoint helpers
│   │       └── escape.rs   parse_escape + hex/unicode/property + shorthand digit/word/space
│   ├── automata/
│   │   ├── mod.rs          Re-exports
│   │   ├── nfa.rs          Thompson NFA construction + ByteSet transitions + ε-edges
│   │   ├── dfa.rs          NFA→DFA powerset + Hopcroft minimization + flat transition table
│   │   └── accel.rs        AccelStrategy / StateAccel — single-byte hot-loop acceleration
│   ├── classify/
│   │   ├── mod.rs          RegexClass enum + classify_known_pattern + classify_regex
│   │   └── structural.rs   classify_regex_from_hir — HIR-walking structural classifier
│   ├── sets/
│   │   ├── mod.rs          Re-exports
│   │   ├── byteset.rs      ByteSet (256-bit set: u64 × 4 — full byte range)
│   │   ├── charset.rs      CharSet128 (128-bit set: u64 × 2 — ASCII range)
│   │   └── equiv.rs        compute_byte_classes — byte equivalence classes for DFA compression
│   ├── algebra/
│   │   ├── mod.rs          Re-exports + extract_char_class_bytes + byteset_to_pattern + pattern_is_superset + try_union_patterns
│   │   ├── superset.rs     is_superset — pure ByteSet superset check
│   │   └── union.rs        try_union — pure ByteSet union
│   ├── info/                  (Tranche T split) — unified regex analysis
│   │   ├── mod.rs          RegexInfo + QuantifiedClassInfo + analyze + analyze_from_hir
│   │   ├── classify.rs     detect_negated_class / quantified_class / anchored / accel_candidate
│   │   ├── width.rs        is_nullable + compute_match_width + class_byte_width + utf8_len + count_hir_nodes
│   │   ├── literal_prefix.rs  extract_literal_prefix + extract_literal_suffix
│   │   ├── one_pass.rs     check_one_pass_eligible + first_chars_of_hir + is_hir_walkable
│   │   └── dfa_size.rs     estimate_dfa_size + estimate_nfa_states
│   └── egraph/                HIR e-graph (Tranche H + post-N rule retention)
│       ├── mod.rs          HirEGraph alias + build_hir_egraph + saturate_hir_egraph + extract_canonical + simplify_hir
│       ├── node.rs         HirENode (the e-node enum, derives Language)
│       ├── translate.rs    insert_hir + extract_hir (Hir ↔ HirENode bridges)
│       ├── cost.rs         RegexExtractionCost (embeds shared CostWeights)
│       └── rules/
│           ├── mod.rs      default_hir_rules — the 5 retained rewrite rules
│           ├── flatten.rs  FlattenAltConcat — Alt(Alt) / Concat(Concat) flattening
│           ├── redundant.rs   DeduplicateAlternation — drops repeated branches by canonical id
│           ├── superset.rs SupersetAbsorbClass — drops Alt branches whose ByteSet is subsumed
│           ├── union.rs    UnionMergeClass — merges two non-negated Class branches into one
│           ├── repetition.rs  AbsorbRepetition — merges adjacent same-sub repetitions in a Concat
│           └── util.rs     CharClass ↔ ByteSet projection + e-class payload accessors
├── tests/                  (Tranche O — 9 integration test files)
│   ├── algebra_superset.rs / algebra_union.rs
│   ├── egraph_simplify.rs
│   ├── egraph_rules_flatten.rs / redundant.rs / superset.rs / union.rs / repetition.rs
│   └── info.rs
└── benches/                (Tranche P — 4 bench binaries)
    ├── regex_parse.rs       HIR parser throughput on 50+ real-world patterns
    ├── regex_classify.rs    classify_known_pattern (string) + classify_regex_from_hir (HIR walk)
    ├── regex_hir_egraph.rs  simplify_hir end-to-end (build → CspScheduler → extract)
    └── regex_dfa_compile.rs Dfa::compile + Dfa::find_at hot loop
```

## Key Types

- **`Hir`** — the high-level intermediate representation enum:
  `Empty`, `Literal(Vec<u8>)`, `Class(CharClass)`, `Look(Look)`,
  `Repetition(Repetition)`, `Group(Box<Hir>)`, `Concat(Vec<Hir>)`,
  `Alternation(Vec<Hir>)`. Owning, no lifetime.
- **`CharClass`** — `Bytes { ranges: Vec<ByteRange>, negated: bool }` or
  `Unicode { ranges: Vec<CodepointRange>, negated: bool }`. Has an
  explicit negated flag — never expanded eagerly.
- **`Nfa`** / **`Dfa`** — Thompson NFA + minimized DFA over byte
  equivalence classes. `Dfa::compile(pattern)` is the full pipeline
  (parse → NFA → DFA → minimize). `Dfa::find_at(bytes, offset)` is the
  hot match loop.
- **`RegexInfo`** — single-pass unified analysis result. Computed by
  `analyze(pattern)` or `analyze_from_hir(pattern, &hir)`. Holds
  classification, literal prefix/suffix, negated_class, quantified_class,
  is_anchored, hir_size_estimate, first_chars (CharSet128), nullable,
  must_consume, one_pass_eligible, min/max_match_len, dfa_size_estimate,
  accel_candidate, hir_walkable. Every consumer caches this by
  pattern identity.
- **`RegexClass`** — semantic pattern category enum (JsonNumber,
  JsonString, Numeric, HexDigits, Identifier, QuotedString, etc.).
  Drives `FnDescriptor` specialization in bbnf and inline scanner
  selection in `bbnf::generate::fast_paths`.
- **`CharSet128`** — 128-bit ASCII byte set. The shared substrate for
  FIRST/FOLLOW sets across the workspace.
- **`ByteSet`** — 256-bit full byte set, used by NFA transitions and
  the algebra module.
- **`HirENode`** — e-node enum parallel to `Hir` (with `Id` children
  instead of `Box<Hir>` / `Vec<Hir>`). Derives `Language` via
  `egraph_derive::Language`.

## E-graph integration

`RegexInfo::analyze_from_hir` runs the HIR through `egraph::simplify_hir`
before any downstream analysis. `simplify_hir` does build → saturate
(via `CspScheduler` over the 5 default rules) → cost-guided extract.
Every analysis (FIRST sets, nullable, width, DFA sizing) therefore sees
the canonicalized HIR with zero caller-side awareness.

`BBNF_HIR_EGRAPH_REPORT=1` prints the per-rule fire counts for the HIR
saturation, mirroring the grammar tier's `BBNF_EGRAPH_REPORT`.

## Conventions

- **No inline tests in `src/`** (Tranche O). All tests live in `tests/`
  as integration test binaries; they import via `use bbnf_regex::...`.
- **No `regex` crate dependency**. Pattern parsing, classification,
  and matching are all bespoke.
- **`smallvec` for compact storage** in NFA states and HIR children.
- **Negated classes are first-class** — never expanded eagerly into
  positive form. The `CharClass::Bytes { negated }` flag flows through
  the entire pipeline.
- **Tests use `bbnf_regex::*` paths** — every public type is reachable
  via the crate root re-exports in `lib.rs`.
- **Benches use `bencher` (not criterion)** — the parse-that workspace
  convention. `mimalloc` is the global allocator.

## Dependencies

- **smallvec** — compact storage in NFA states + HIR children.
- **serde** (optional, default-off) — derive `Serialize`/`Deserialize`
  on the public types when the `serde` feature is enabled.
- **egraph** + **egraph-derive** + **csp-solver** — local-path deps via
  `parse-that/rust/.cargo/config.toml`'s `[patch.crates-io]` table. The
  HIR e-graph tier consumes this substrate identically to the grammar
  tier in `bbnf-ir`.

[dev-dependencies]
- **bencher** — bench harness for the 4 bench binaries.
- **mimalloc** — global allocator for benches.
