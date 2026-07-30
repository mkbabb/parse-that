# P4 owner adjudication

Date: 2026-07-30

Status: **P4 REJECT/FOLD — FORMATION RED — NO RELEASE**

This is the parser owner's independent ruling over the sealed P4 Sol design,
the sealed Luna prototype campaign, the root source correction, and the fresh
Sol jury. It does not grant implementation, formation, execution, consumer,
release, Value rebind, ABI-freeze, or BBNF credit.

## Result

The requested parse-that/full-CSS prototype has **not** been accomplished.

- Sol authored three designs but Luna implemented none of them.
- Luna implemented three different JSON mechanisms. Every genuine timing row
  is slower than accepted M2.
- Luna's CSS reader is handwritten recursive descent. It does not exercise
  the proposed mechanisms or an idiomatic parse-that combinator grammar.
- No executable 1,653-row CSS grammar, WPT manifest, Value/Keyframes adoption,
  equivalent complete result plane, or qualifying `>=10x` proof exists.
- P4 is negative archaeology, not a completed Sol/Luna/Sol pass.

The only next research family is `P5-EUW`, exceptional-unwind mismatch ABI.
It begins with a fatal public-ABI/taxonomy check and has zero performance or
implementation credit.

## Immutable inputs

| Input | Coordinate |
|---|---|
| Root P4 reopen | `d1df0f01c139ce8d51038815826de859f20b1557ee50911e2c1e9712579aae34` |
| Root full-CSS denominator | `2bc4abb218d3e9c8aba4164ca1c48df7cb714222b024290b60dc7e239e26433b` |
| Superseding root Luna source audit | `5614a7d844ef2ad6fe11b55de61c836bac27944965b2a5c74d2d917a949ca224` |
| Sol packet manifest | `1fb93c1b271e2fce3cfeb6fc8de1ace5634c78c4dfdd4eed376b636357696d22` |
| Sol design | `d818c2706f7d06b8f75dc6e75c6885c61030b38a61f65ba182ddb447eaac072d` |
| Luna packet manifest | `17cf671e88bd6406609881b99991eb6c5eb679fccfe5c6d9402875a6ef0e90d9` |
| Luna verdict | `b94d4940ab7ba69dd58c17bb69d82e7c869e93a71a971d4ce1b9aaa3e7f7eb44` |
| Fresh Sol jury predecessor manifest | `b3ca2da1096db1b04d26c6a03331f0f7996c3265bdfede24e6530d8a652f7dd7` |
| Fresh Sol jury A1 manifest | `3297c808d66ed3c528134a2567a4f85ba7602769270868abfd701fa80ce0b311` |
| Accepted M2 | `de36d57dccdd20068b8c11a78f6e83d42e7d681f` |

Corrected fresh-jury root:

```text
/Users/mkbabb/Documents/Codex/2026-07-29/parser-p4-fresh-sol-adjudication-a1/outputs
```

The root contains exactly eight files, no subdirectories, and seven sealed
entries. Two independent post-completion
`shasum -a 256 -c checksums.sha256` runs are green. The predecessor remains
immutable and independently reproduces its original 7/7 seal.

## Fresh-jury A1 correction

The predecessor jury ruling contained two documentary defects:

1. `MECHANISM-GENEALOGY.json:149` expands RSR as `record-slab runtime`.
   Sol's exact name is **Region-Slot Return ABI**.
2. `FULL-CSS-GATE.json:12` records a nonexistent Sol denominator hash
   `0388a66f…`. The actual file and Sol manifest both reproduce:

```text
0388a49c8ffe71045f30ab30c0d1e4a8fcdd332a93ac5e73bf0ff3ffd41e2815
```

A1 corrects exactly those two semantic fields. The adjudication, evidence
replay, and P5 dispatch are byte-identical to the predecessor. Only the
correction receipt, integrity ledger, and checksum manifest change
mechanically around them. The complete predecessor-to-A1 diff contains no
other semantic mutation.

The A1 identities are:

```text
0f62d70a8c1284eea9ef9eaae3a929a3687aba589900068f0588c905604de0ab  MECHANISM-GENEALOGY.json
6c0862cc2fb4673774397314a0ff10b8eb9ee052a25424e834f8b30da82eedcb  FULL-CSS-GATE.json
c0e206473adccfaf1d6b7a0628a7ad32721507b86b9c77ab0f1a49cf00b28f9f  RECEIPT.md
3df4f8ed108bada4e7110b97b3053a55dd26e1dd7acb78ac222c0d21e055bd86  INTEGRITY.md
3297c808d66ed3c528134a2567a4f85ba7602769270868abfd701fa80ce0b311  checksums.sha256
```

These corrections change neither genealogy, ordering, nor credit.

## Dispatch breach

Sol `LUNA-DISPATCH.md:55-72` required four isolated packets:

1. P4-A Region-Slot Return ABI;
2. P4-B Capture-Index Semantic Fusion;
3. P4-C Compressed Transactional Provenance Trail; and
4. P4-A+C composition;

plus a live-dispatch JSON grammar with exact EOF.

Luna instead implemented F1 fused terminal/action, F2 region builder, and F3
capture-index/source-slice inside one family-switched runtime.

There is no:

- signed-step RSR ABI, numeric/reference slab, authored output-slot ABI,
  accepted-root reachability walk, or root finalizer;
- independent CTPT numeric provenance trail;
- RSR+CTPT composition;
- isolated CISF packet; or
- live-dispatch candidate JSON grammar.

Luna's `lib/json.mjs:36-51` uses generic ordered choice and omits the exact
whole-document EOF boundary. Sol's designs are therefore **UNIMPLEMENTED**;
Luna's F1/F2/F3 are separate negative families.

## CSS reachability proof

Luna's 432 CSS timing rows do not execute F1, F2, or F3.

- `lib/css.mjs:25-28` calls only `R.literal(text)` without an action. F1's
  action-fusion branches in `lib/runtime.mjs:137-145,168-170` are unreachable.
- CSS never calls `R.seq`, `many`, or `sepBy`. F2's region paths at
  `lib/runtime.mjs:218-290` are unreachable.
- CSS never calls `R.captureRegex`. F3's seam at
  `lib/runtime.mjs:187-203` is unreachable.
- `lib/css.mjs:301-307` wraps one handwritten stylesheet reader in
  `new R.Parser`.

The reader manually implements `skipTrivia`, identifiers, numbers, strings,
URLs, component values, declarations, rules, recovery, arrays, and nodes.
Control and candidate CSS lanes time the same parsing body. Their
`0.8213x–1.2065x` range is parity/noise. It provides zero mechanism,
combinator, second-consumer, full-CSS, or profile-attribution credit.

The handwritten reader may remain only as shaped oracle material. It cannot
become a parser candidate or Value grammar.

## Exact Luna replay

| Product | Mechanism | Rows | Ratio range | Disposition |
|---|---|---:|---:|---|
| JSON | F1 fused action | 144 | `0.5016008538x–0.8851739895x` | `PRUNE` |
| JSON | F2 region | 144 | `0.2614486180x–0.7717843666x` | `PRUNE` |
| JSON | F3 capture | 144 | `0.4891519073x–0.9709897281x` | `MOVE` source-index observation only |
| CSS | fused label | 144 | `0.8392944040x–1.2064622339x` | zero-credit same-body noise |
| CSS | region label | 144 | `0.8538809833x–1.1938655615x` | zero-credit same-body noise |
| CSS | capture label | 144 | `0.8212606680x–1.1840649154x` | zero-credit same-body noise |

All 432 genuine mechanism rows are JSON rows below `1x`. No row reaches
`10x`; withholding bootstrap was correct.

The matrix is one process per configuration, not seven. Each process uses one
fixed AB or BA order across all eleven batches. The supplied seed changes
neither fixtures nor order. The verification bank is:

```text
complete-state equality   93 / 186
value equality           126 / 186
result equality          126 / 186
```

The state view omits fault, live depth, maximum depth, and nesting limit. The
result is only `{ok,value,span,diagnostics}`. JSON invalid/failure/frontier
behavior is RED. Cold-first imports M2 before timing. Allocation, IC, deopt,
GC, alternating-shape, exact bootstrap, 1,439/1,653, WPT, and actual
two-consumer planes are absent.

## Genealogy

| Item | Owner ruling |
|---|---|
| RSR | `SPLIT`: retain the signed-step observation as zero-credit control-ABI research; `PRUNE` regions/finalizer as P1-R/P1-E/F2/deferred-allocation recurrence |
| CISF | `PRUNE`: recurrence of F1/F3, source leaf, callback projection, sticky RegExp, source slice, and additional `/d` products |
| CTPT | `FOLD`: retain exact recovery/provenance obligations under S6/S7; prune the named storage family |
| F1 | `PRUNE`: all genuine rows lose |
| F2 | `PRUNE`: all genuine rows lose; dynamic `a8+` properties undercut the fixed-shape claim |
| F3 | `MOVE`: retain UTF-16 span/source-index law; prune as a performance family |
| P5-SRA | `PRUNE`: region/arena/journal/finalizer relabel |
| P5-TOL | `PRUNE`: violates locally atomic raw-parser failure unless it adds forbidden analysis, annotations, or dual executors |
| P5-EUW | `KEEP` for one fatal isolated preflight only |

No P4 mechanism survives as an implementation candidate.

## P5-EUW ruling

EUW is mechanistically distinct: routine mismatch would propagate through one
frozen singleton exception, while success returns a cursor and writes the
ordinary final value. It introduces no region, journal, scanner, compiler,
VM, table, finalizer, or second grammar.

It is also likely to fail before timing. Accepted M2 exports
`ParserFunction`, exposes `Parser.parser` publicly, and has direct raw callers.
Those callers currently receive a `ParserState` on mismatch. If EUW needs a
wrapper, internal/external executor split, fallback, or changed failure
behavior to preserve that surface, its phase-zero ABI gate kills it.

If ABI and exact equality somehow pass, the first timing cell is only live
dispatch JSON, scale 4, alternating hot immutable result, with seven fresh
paired processes. Every raw ratio and the exact-bootstrap 95% lower bound must
be `>=10x`. Any sub-10× row stops the packet. Only then may exception
allocation/deopt/GC/IC/heap assays and the scale-4/33 JSON plus real
Value-owned combinator CSS vertical run.

The CSS vertical must be authored once against control/candidate generic
primitives and prove nonzero EUW activity. A handwritten parser body is a
fatal recurrence. It must never be called full CSS.

Modern V8 background does not grant credit:

- V8 documents that hot RegExp moves to native code after tier-up:
  <https://v8.dev/blog/regexp-tier-up>.
- V8's `/d` facility produces an additional indices product:
  <https://v8.dev/features/regexp-match-indices>.
- TurboFan supports structured exception handling, but that is not evidence
  that throwing routine mismatch is fast:
  <https://v8.dev/blog/launching-ignition-and-turbofan>.

The future EUW packet must pin the exact V8 source/runtime coordinate and
attribute reached-catch deoptimizations. Background features are not a
substitute for the fatal measurements.

## Full-CSS state

The denominator remains:

```text
Webref raw/active P/F/T     1,503 / 1,439
Webref raw/active all       1,717 / 1,653
legacy aliases                         64 explicit PRUNE
manual/prose                           109
CSS Values 5 overlay                    60, non-additive
CSS Syntax decisions/entries/algorithms 25 / 10 / 11
Keyframes references/files              53 / 51
Value extensions                         hsv / kelvin
```

Standard Webref families include `ictcp()`, `jzazbz()`, and `jzczhz()`.
The WPT denominator has 18 pinned subtrees. None is executable or measured in
P4. Full CSS, Value adoption, Keyframes deletion, and
`V.L6.css-path-abi-freeze` remain RED/BLOCKED.

## Exact state and handoff

Branch at audit start:

```text
codex/css-totality-combinators-20260729
HEAD 4d0399bcd58007dda3b77e3d0eb7d4931679a519
tracked tree clean
untracked user-owned data symlink untouched
```

Next boundary:

1. bind this P4 ruling and its two jury corrections in `B.md`, `PROGRESS.md`,
   `FINAL.md`, `waves/W0.md`, `coordination/CONSTELLATION.md`, and the durable
   findings/resume handoff;
2. keep full CSS, formation Clean A/B, candidate packing, product work,
   release, Value rebind, ABI freeze, and BBNF blocked;
3. do not implement P5-EUW until its isolated fatal packet is explicitly
   authorized;
4. if authorized, run phase-zero ABI/taxonomy first and stop on the first
   fatal condition; and
5. after an EUW kill, require a new genuinely distinct formation family. Do
   not reopen RSR/CISF/CTPT, F1/F2/F3, SRA, or TOL.

This is an audit-backed resume boundary, not completion of the long-horizon
goal.
