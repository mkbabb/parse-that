# P6-SIR-A2 owner adjudication and A3 carrier amendment

Date: 2026-07-30

Status: **A2 AMEND BEFORE ADMISSIBLE TIMING — FAILURE-OFFSET CARRIER
REQUIRED — A3 ROUTED — ZERO CREDIT — NO RELEASE**

## Ruling

P6-SIR-A2 closes the complete typed-fault checkpoint and native-oracle defects
found in A1. It does not preserve accepted M2's public failure offset for a
terminal `trim()` mismatch after leading whitespace.

Fresh Sol proves this is not repairable from A2's signed return and existing
run fields. On source `" x"`:

| Parser | A2 return | A2 frontier | M2 offset | A2 offset |
|---|---:|---:|---:|---:|
| `string("a").trim()` | `-1` | `1` | `1` | `0` |
| `string("a").trim().or(string("z"))` | `-1` | `1` | `0` | `0` |

The two A2 executions have byte-for-byte equal existing run state, including
`frontier = 1` and `frontierLabel = "\"a\""`, but M2 requires different
public offsets. Frontier is sticky failure evidence, not rollback provenance.
No projection over the current A2 state can distinguish the required results.

A2 is therefore pre-timing RED. Its seven raw rows reproduce arithmetically,
but none is admissible for disposing of the conforming signed-step atom.
`KILL/PRUNE` remains revoked.

## Bound identities

- A2 Luna root:
  `/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-luna-a2/outputs`
- A2 Luna manifest SHA-256:
  `67ddf60281af3a0493aeb9b0b4101895e6147d585be70332c7b959e3102f90e9`
- A2 Luna raw SHA-256:
  `5ff0c4faad24585cb97378576839aef9cf5038e66b222820dc543f851701b598`
- A2 Luna runtime SHA-256:
  `453a828cc11db031b53af58f8dfc9c3aef93775029685586494a4a5d95c2d579`
- A2 Luna worker SHA-256:
  `ea14a051badf9ed05cefeb88b2b38d39349f34e6020f1e098eb527173045288d`
- A2 fresh-Sol task:
  `019fb1bb-7b9e-7790-acb1-63366e2d2051`
- A2 fresh-Sol root:
  `/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-a2-fresh-sol-adjudication/outputs`
- A2 fresh-Sol checksum-manifest SHA-256:
  `97e72af8de2b54a0dc020b9ab150292a0442524ae0d43480509bc1385ec22d51`
- A2 fresh-Sol report SHA-256:
  `d3891230a38932e21db67b404a5c8d5f0ebfcf85207c783e492333060b6394f2`
- A2 fresh-Sol findings SHA-256:
  `bf5e2954b219bd444d686a04e14cbf3a94776a7d04c6d4bf57f779f00784ba7d`
- A2 fresh-Sol mutant receipt SHA-256:
  `e95bc2b3b4d647261eab2752c1cfd5526e4def8d5e673a4f1c90a1516274b801`
- A2 fresh-Sol replay receipt SHA-256:
  `23fde433046ba9ec9ed7aa51856b2449d2c0a0a5b4171ed75020f31e1b2a4d73`
- A2 fresh-Sol integrity receipt SHA-256:
  `be4c3ae2d8537d6c0439c006df110ea2e74553b23497c0416710dd61da0a28a6`

The owner independently observed exactly six fresh-Sol regular files, no
subdirectories, and two green 5/5 checksum passes. All four JSON receipts
parse. The A2 Luna packet remains exactly eight regular files with no
subdirectories and two green 7/7 manifest passes. The protected parser tree
remained at `9870f4f6a6f123e8779f0d20f682705ec72b98ed`, with only the
pre-existing untracked `data` symlink.

The integrity receipt discloses one removed `/tmp/p6_a2_packet_probe.json`
capture. It changed no protected, packet, raw, source, or repository byte and
does not affect the disposition.

## What A2 closes

Fresh Sol did not trust the packet's fifteen-row label. Its independent
21-position typed-fault sweep covers:

- left and right children of `then`, `skip`, and `next`;
- start, inner, and end of `wrap`;
- left and right-after-left-mismatch of `or`;
- first, separator, and later positions of `sepBy`;
- inner and sync children of `recover`; and
- direct, `map`, `trim`, `lazy`, and `dispatch` pass-through paths.

All 21 positions preserve the exact `-2` return, complete scalar checkpoint,
sticky frontier and provenance, frozen singleton identity, owner-versus-pass-
through policy, and recursively frozen public typed result.

The actual global `JSON.parse` was independently observed four times, once per
exact fixture. Its values, accepted M2, rebuilt M2, and A2 are recursively
frozen and equal 4/4. Lazy caching/recursion, static grammar-time dispatch,
zero-width success at a nonzero cursor, the signed return domain, and the
cursor/status alias trap are also green.

These corrections close A1's defects. They do not cure the ordinary mismatch
offset defect and grant no later credit.

## Exact ordinary-mismatch defect

The accepted-M2/A2 routine-mismatch matrix has 23 rows. Seventeen are equal.
Six terminal pass-through paths are not:

| Path | M2 offset | A2 offset | Frontier |
|---|---:|---:|---:|
| root `trim` | `1` | `0` | `1` |
| root `trim`, entry cursor `2` | `3` | `2` | `3` |
| `map(trim)` | `1` | `0` | `1` |
| `lazy(trim)` | `1` | `0` | `1` |
| `dispatch -> trim` | `1` | `0` | `1` |
| failed left alternative, then right `trim` | `1` | `0` | `1` |

Sequencing, `wrap`, `sepBy`, recovery, and a choice with `trim` on the left
restore their owned entry offsets correctly. The defect is specifically a
terminal pass-through mismatch after `trim` has consumed leading whitespace
and no later atomic owner restores rollback provenance.

## Raw disposition

The sealed raw has seven unique PIDs and seeds, seventy alternating AB/BA
batches, 2,000 xorshift32 selections per arm per batch, equal immutable
products and sinks, and exact `sum(control ns) / sum(candidate ns)` ratios:

`1.0303266072517632`, `1.1305752389506087`,
`1.02413030094481`, `1.0077265665666135`,
`0.8990906550417849`, `1.156210755774298`, and
`0.9108513914588788`.

The exact range is `0.8990906550417849x`–`1.156210755774298x`. Every row is
below `10x`, but all were launched after the incomplete preflight. Therefore:

- A2 packet: **AMEND**;
- A2 typed-fault and oracle repair: **GREEN**;
- A2 ordinary-mismatch equality: **RED**;
- A2 raw arithmetic: **GREEN, INADMISSIBLE**;
- conforming signed-step atom `KILL/PRUNE`: **NOT ESTABLISHED**;
- genealogy: **SPLIT from P4 RSR**;
- surrounding topology: **FOLD into P3 `19c1e12`**; and
- novelty, formation, product, API, CSS, execution, and release credit:
  **ZERO**.

Bootstrap, CSS, profiles, allocation, GC, IC, deopt, candidate packing, and
consumer work remain withheld.

## P6-A3 carrier amendment

The user-directed iterative search remains open, so the owner authorizes one
same-seat correctness amendment rather than rejecting the atom on A2.
Resume the existing Luna xhigh seat
`019fb16a-09d7-7d80-ae5f-3d894e25855d`; create no task. Its sole new writer
root is:

`/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-luna-a3/outputs/**`

A3 may add exactly one parse-local scalar named by role as
`failureOffset`. It is result provenance, not a control discriminator:

1. initialize it to the parse entry offset;
2. update it only to preserve the exact accepted-M2 ordinary-failure offset;
3. save/restore it with every atomic owner that restores rollback;
4. propagate it unchanged through direct, `map`, `trim`, `lazy`, and
   `dispatch` pass-through paths except where the terminal leaf/trivia
   composition establishes the M2 failure offset;
5. read it only when projecting the public ordinary-failure result; and
6. never branch, dispatch, select success/mismatch/fault, index a table, or
   alter the `{-2,-1} union [0, source.length]` return alphabet from it.

No second scalar, status/cursor alias, checkpoint object, wrapper, metadata
envelope, journal, region, slab, tape, token, scanner, compiler, VM, generated
grammar, fallback, alternate executor, program counter, continuation,
trampoline, or per-parse control container is permitted. A3 is a P6
correctness amendment, not a new family and not a cost-removal edge.

Before timing, A3 must independently assert:

1. all 21 typed-fault positions and the complete run/public-result snapshot;
2. all 23 ordinary-mismatch offset/frontier rows, including the
   indistinguishable A/B witness and nonzero entry cursor;
3. atomic ownership of `failureOffset` for `or`, `then`, `skip`, `next`,
   `wrap`, `sepBy`, and `recover`;
4. pass-through behavior for direct, `map`, `trim`, `lazy`, and `dispatch`;
5. no read of `failureOffset` on the parse control path;
6. safe signed return, zero-width, sticky typed fault/frontier, recursion,
   immutable dispatch, alias, allocation, and forbidden-mechanism probes; and
7. four independent `JSON.parse`/accepted-M2/rebuilt-M2/A3 frozen product
   comparisons.

Only after every pre-timing row is green may A3 create new exact accepted-M2
live `jsonParser` scale-4 raw: seven fresh processes/seeds, ten AB/BA batches,
2,000 deterministic selections per arm/batch, equal sinks and immutable
products, ratio `sum(control ns) / sum(candidate ns)`. Any admissible row
below `10x` kills the conforming signed-step atom before bootstrap or CSS.

## No-contrivance boundary

A3 does not weaken the 10x or scannerless laws. It does not reopen P1–P5,
authorize a renamed P7, or permit a domain-neutral fixture to stand in for a
real consumer. The sealed cost lower bound remains:

```text
10x budget                       187,063 us
native matching                  144,501 us
required products                167,382 us
matching + products              311,883 us
budget multiple                  1.667261831575459x
native scale-4 / scale-8         5.005x / 6.083x
```

No distinct next family is admissible without a genuinely new reached
cost-removal edge. If A3 is correctness-green but any raw row is below `10x`,
the signed-step atom is terminally killed. If A3 cannot represent exact
failure offsets under its one-scalar law, it is rejected before timing.

The later isolated second-consumer product, if ever reached, remains the
lossless nested-record grammar with nested components, opaque recovery
provenance, original UTF-16 spans, canonical serialize/reparse, and nonzero
mechanism counters in exact live `jsonParser` and the shaped product. Only a
fully green generic proof may open the real Value-owned CSS vertical and the
binding 1,717/1,653 Webref, 1,503/1,439 property/function/type, Values 5
60-row overlay, and Keyframes 53-reference/51-file denominator.

## Boundary

A3 remains isolated tranche-development research. Production source, CSS,
Value, Keyframes, API, formation, candidate packing, release, ABI freeze, and
BBNF remain blocked. Release status is `NO RELEASE`.
