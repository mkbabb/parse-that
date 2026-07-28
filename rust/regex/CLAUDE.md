# CLAUDE.md — rust/regex/ (bbnf-regex)

Compile-time regex authority for BBNF: bespoke HIR parsing, direct structural
analysis, private NFA→DFA construction, and checked table-plan emission.

The crate is a leaf. It has no dependency on `parse-that`, grammar IR, egraph,
CSP, proc-macro infrastructure, or a runtime matching engine.

## Ownership boundary

- `RegexInfo` walks the parsed HIR directly. It reports language/soundness facts
  and planner hints but does not rewrite the language.
- `RegexTablePlan` is the only public compiled-automata artifact. Its fields are
  private; `compile`, `from_hir`, `from_parts`, and `from_bytes` all validate the
  complete table.
- NFA and DFA types are private compiler machinery under `src/automata/`.
- Runtime matching belongs to generated parsers (currently `parse-that`).
  `bbnf-regex` deliberately exposes no `find`/`find_at` execution API.
- Position assertions fail closed during table compilation until the generated
  parser boundary can encode their input-context semantics.

## Structure

```
rust/regex/
├── src/
│   ├── lib.rs              public analysis and table-plan exports
│   ├── table_plan.rs       checked ABI + stable BBRTBL01 serialization
│   ├── hir/                owning HIR + hand-written parser
│   ├── automata/           private Thompson NFA and minimized byte-class DFA
│   ├── info/               direct HIR structural/fixed-point/planner analysis
│   ├── classify.rs         semantic regex families
│   ├── first.rs            conservative ASCII FIRST sets
│   ├── algebra/            byte-class set algebra
│   ├── sets/               ByteSet, CharSet128, byte equivalence classes
│   ├── unicode.rs          Unicode property tables
│   └── utf8.rs             codepoint-range to UTF-8 sequence expansion
├── tests/
│   ├── info.rs             RegexInfo laws and regressions
│   ├── table_plan.rs       adversarial external ABI tests
│   ├── regex_info_oracle.rs
│   └── fixtures/skv26/     immutable pre-prune corpus and three-plane oracle
└── benches/
    ├── regex_parse.rs
    ├── regex_classify.rs
    └── regex_dfa_compile.rs
```

## Invariants

- No `regex` crate dependency; parsing and compilation are bespoke.
- No runtime parser dependency or backedge.
- Table transitions are state-major `u32`; `u32::MAX` is the dead sentinel.
- `byte_classes` has exactly 256 entries and every class is in range.
- State/class dimensions, start state, accept vector, transition length, and
  every live target are checked before a `RegexTablePlan` exists.
- Stable serialization is little-endian `BBRTBL01` and rejects trailing bytes,
  nonzero reserved bits, invalid booleans, and invalid table contents.
- The SK-V26 oracle preserves the sealed language and soundness evidence. Three
  corrected FIRST sets explicitly record the former two-child nullable-prefix
  bug; one raw-HIR planner estimate records the removed egraph normalization.
- Tests live in `tests/` and exercise the crate through public APIs.

## Dependencies

- `smallvec` — compact private NFA storage and byte-set utilities.
- `serde` (optional) — existing `CharSet128` boundary support.
- `divan` and `mimalloc` are development-only benchmark dependencies.
