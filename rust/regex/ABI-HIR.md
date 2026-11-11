# parse-that-regex Hir ABI

**Version 1, FROZEN** (sk-v27 LW2.RX-2, 2026-11-11). OR-7 is ruled Route A,
PROVISIONAL (RULINGS 2026-11-10b): regex-automata 0.4.14 is the determinizer,
fed by this `Hir`, so the `Hir` types are frozen and no state type of ours is.
`Look` carries `WordBoundary` and `NotWordBoundary` (A-9) before the freeze.

The descriptor below is generated from the types by
`tests/abi_fingerprint.rs` (every enum matched without a wildcard, every
struct destructured without `..`, every field bound to its type, layouts by
`size_of`/`align_of` on 64-bit hosts). The test asserts that it equals this
block and that its FNV-1a 64 digest is `RECORDED`.

- FNV-1a 64 of the block: `0x0c587e007f6ccf7d`
- sha256 of the block (`text` fence contents, final newline included): `149c6a93375d0807583831d5186eed9f259223ae4a2aea51a3a1de8abbe9abd5`

Any change to a frozen type is an addendum here (a new version line and new
digests), cited in the API-freeze seam record (bbnf-lang
`restart/skinny/tranches/sk-v27/LW2-SEAMS.md`). If OR-7 reopens to Route B, the
state type is frozen by addendum.

```text
parse-that-regex Hir ABI v1 (sk-v27 LW2.RX-2, OR-7 Route A)
enum Hir size=32 align=8
  Empty
  Literal(Vec<u8>)
  Class(CharClass)
  Look(Look)
  Repetition(Repetition)
  Group(Box<Hir>)
  Concat(Vec<Hir>)
  Alternation(Vec<Hir>)
enum Look size=1 align=1
  Start
  End
  StartLF
  EndLF
  StartCRLF
  EndCRLF
  WordBoundary
  NotWordBoundary
enum CharClass size=32 align=8
  Bytes { ranges: Vec<ByteRange>, negated: bool }
  Unicode { ranges: Vec<CodepointRange>, negated: bool }
struct Repetition size=24 align=8
  sub: Box<Hir>, min: u32, max: Option<u32>, greedy: bool
struct ByteRange size=2 align=1
  start: u8, end: u8
struct CodepointRange size=8 align=4
  start: char, end: char
```

## Scope

Frozen: `Hir`, `Look`, `CharClass`, `Repetition`, `ByteRange`,
`CodepointRange` (`src/hir/mod.rs`). Not frozen: `ParseError`,
`ParseOptions`, the parser and printer, and the in-house automata
(`src/automata/`), which refuse a word boundary (no look-behind in a byte DFA)
until Route A's determinizer is wired.
