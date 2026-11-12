# parse_that::kernel ABI

**Version 4, FROZEN** (sk-v27 LW3.COMP-4b, 2026-11-12). Version 3 was the
transactional recognition kernel as it entered parse_that (LW3.COMP-1a, from
`e31fbfedc`); version 4 adds the failure contract to `Failure`.

`parse_that::kernel::KERNEL_ABI` names the version. Generated code asserts it
in const context (`const _: () = assert!(parse_that::kernel::KERNEL_ABI == 4);`),
so an older parse_that cannot satisfy a newer generated boundary. Only one
version is selectable: there is no feature or flag that brings back ABI 3.

## The failure contract

Restated from the parser generator's oracle contract (sk-v27 LW3.COMP-4a,
compiler design C1-8); no type is shared with the generator (X-5): parse-that
takes no edge into it.

- A rejected input reports the **furthest offset** a failed attempt reached
  and the **set of expected labels at that offset**.
- The set is **sorted and deduplicated by construction**. A label is an
  interned id (`Label`, `u16`) into the module's label table. The generator
  writes that table sorted by the labels' bytes, so id order is label order;
  `Expected` is a bit set over the table (bit *i* = label *i*), iterated in
  ascending id order, one bit per label. No label string is carried.
- **Merge.** Two failures merge to the further one. At an **equal** offset they
  merge to one failure whose set is the union of both: commutative,
  associative, idempotent. A failure at a smaller offset never replaces or
  widens the further one.
- **Labels enter through `label(run, label, parser)`.** A mismatch at the
  operation's own entry offset reports `{label}` as its whole set there; a
  mismatch further in keeps the inner set. Terminals called without `label`
  report the empty set.
- **Bound.** `LABEL_CAPACITY` = 256 labels per module table. A generator
  refuses a module whose table would exceed it; within the bound the set is
  always complete.
- **Cost.** `Failure`, `Expected` and `Step` stay `Copy`; no path, success
  or failure, allocates (`tests/kernel_allocation.rs`). `label` does no work
  on a match. `Step<Span>` grows by the set's 32 bytes per `Failure` (72 bytes at ABI 4), which the paired
  success-path cell measures (`benches/kernel/success_path.rs`, S12-P4-6).

## Layout

The descriptor below is generated from the types by
`parse_that::kernel::abi::abi_descriptor`: every public enum matched without
a wildcard, every struct destructured without `..`, every field bound to its
type, layouts by `size_of`/`align_of` on 64-bit hosts.
`tests/kernel_abi.rs` asserts that it equals this block and that the block's
FNV-1a 64 digest is the one recorded there.

- FNV-1a 64 of the block: `0x6d8eb39ae6bf44f9`
- sha256 of the block (`text` fence contents, final newline included): `2336e775fc89b9f447143fb09e67cda8c83c25110b9640024572c79655aab1aa`

Any change to a kernel type, variant, field, layout or constant is an addendum
here (a new version line, a new block and new digests), and each consumer
that pins parse_that names it in its own seam record.

```text
parse_that::kernel ABI 4 (sk-v27 LW3.COMP-4b)
const KERNEL_ABI = 4
const LABEL_CAPACITY = 256
const RegexPlan::DEAD = 0xffffffff
struct Input size=24 align=8
  bytes: &[u8]
  empty_source_id: Option<EmptySourceId>
struct Cursor size=32 align=8
  source: &[u8]
  empty_source_id: Option<EmptySourceId>
  offset: usize
struct Span size=40 align=8
  bytes: &[u8]
  empty_source_id: Option<EmptySourceId>
  start: usize
  end: usize
struct Label size=2 align=2
  0: u16 (an id into the module's label table, < LABEL_CAPACITY)
struct Expected size=32 align=8
  words: [u64; LABEL_CAPACITY / 64] (bit i = label id i)
struct Failure size=64 align=8
  at: Cursor
  expected: Expected
enum Fault size=48 align=8
  StalledRepeat { at: Cursor }
  ForeignOutcome { at: Cursor }
  FullParseAfterProgress { at: Cursor }
  ResourceLimit { at: Cursor, kind: ResourceKind, limit: usize }
enum ResourceKind size=1 align=1
  InputBytes
  Nesting
  Work
  Events
enum Step<()> size=72 align=8
enum Step<usize> size=72 align=8
enum Step<Span> size=72 align=8
  Matched(T)
  Mismatch(Failure)
  Fault(Fault)
enum InputError size=24 align=8
  OutOfBounds { offset: usize, len: usize }
  ForeignCursor
  ReversedSpan { start: usize, end: usize }
struct RegexPlan size=64 align=8
enum RegexPlanError size=1 align=1
  ClassCount
  StateShape
  ByteClass
  TransitionShape
  TransitionTarget
struct RegexTerminal size=64 align=8
struct Run<NoSink> size=40 align=8
struct NoSink size=8 align=8
struct ModuleResult<NoSink> size=104 align=8
```
