# A.W2 — Packrat (id, offset) soundness fix

- **Band:** core — **Class:** soundness fix (bounded blast radius; zero-consumer opt-in tier)
- **Gate:** `memoize.test.ts` — the SOUND assertion (born-RED on today's tree; GREEN only when `MEMO` is keyed on `getCijKey(p, state)` not `p.id`)
- **Decision:** D4 (CONSTELLATION-CAMPAIGN.md §1): FIX the packrat tier with the already-written `getCijKey` helper — do not kill it, do not leave known-unsound code in the codebase.
- **Dep:** A.W0 (preferred sequence: manifest hygiene first); **PARALLEL to A.W1** — the CSS parser never calls `memoize()` (zero blast radius from the CSS surface; confirmed: `grep -rn 'memoize' typescript/src/parse/parsers/` → 0 hits). A.W2 can land independently of A.W1 on the campaign DAG (both feed value.js O.W0 separately).

---

## Context

The packrat tier (`src/parse/packrat.ts`) provides opt-in memoization with count-bounded
seed-grow left-recursion via `memoize()` and `mergeMemos()`. The `MEMO` map stores
intermediate parse results keyed for fast lookup. The bug: line 61 reads `MEMO.get(p.id)`
and line 76 checks `MEMO.get(p.id)` — the key is the parser's integer `id` alone, ignoring
the current input offset.

The sound key is `getCijKey(p, state)` — `(parser.id << 20) | (state.offset & 0xFFFFF)` —
already written at line 36-38 of `packrat.ts` and already used for `LEFT_RECURSION_COUNTS`
(lines 41-42, 73). The function exists; the `MEMO` calls simply don't use it.

**The breach (verified live, 2026-06-18).** `memoize.test.ts` lines 88-103 pin the CURRENT
defective behavior: a memoized `P = memoize(regex(/[a-z]+/))` applied to `"Xhello!"` via
`string("X").next(P).skip(eof()).or(P)` should fail at offset 0 (the `[a-z]+` pattern cannot
match `"X"` there) but instead it restores the offset-6 cache entry —
`st.isError=false, st.offset=6, st.value="hello"` — a mis-restore caused by the id-only key.
The test currently ASSERTs this unsound result (the comment calls it "CURRENT (unsound)").

```
// memoize.test.ts:97-102 — today's assertions (PASSING on defective code)
expect(st.isError).toBe(false);  // WRONG: should be true
expect(st.offset).toBe(6);        // WRONG: should remain 0
expect(st.value).toBe("hello");   // WRONG: should not match at offset 0
// SOUND target (flips when (id, offset)-keying lands):
//   expect(st.isError).toBe(true);
```

The sound assertions are already written in the comment. A.W2 brings them live.

**Why KISS rules the fix here.** The `getCijKey` helper is already correct and already used
for `LEFT_RECURSION_COUNTS`. The fix is replacing 6 `MEMO` read/write sites: two
`MEMO.get(p.id)` calls (lines 61 and 76) and one `MEMO.set(p.id, …)` call (line 82) in
`memoize()`, plus the parallel `MEMO.get(p.id)` calls (lines 99, 112) and `MEMO.set(p.id, …)`
call (line 114) in `mergeMemos()` — with their `getCijKey`-keyed equivalents. No new algorithm,
no new data structure, no blast radius beyond the opt-in tier.

**The left-recursion grow still works after the fix.** The `mSL`, `sS`, and `math again` tests
exercise mutual and indirect left-recursion. These rely on the SAME parser being visited at
the SAME offset multiple times (the grow loop). Keying on `(id, offset)` is sound for this:
the grow loop increments `LEFT_RECURSION_COUNTS` for the same key, and the MEMO caches the
BEST result at each `(id, offset)` pair, not a cross-offset stale result. The fix does not
break seed-grow — it only prevents cross-offset mis-restores.

---

## Scope

### S1 — `MEMO` keys replaced with `getCijKey`

**Breach.** In `packrat.ts`, the `MEMO` map is `Map<number, ParserState<unknown>>`. All reads
and writes use `p.id` as the key — **6 sites** (verified by reading source):
- `memoize()` line 61: `MEMO.get(p.id)`
- `memoize()` line 76: `MEMO.get(p.id)`
- `memoize()` line 82: `MEMO.set(p.id, …)`
- `mergeMemos()` line 99: `MEMO.get(p.id)`
- `mergeMemos()` line 112: `MEMO.get(p.id)`
- `mergeMemos()` line 114: `MEMO.set(p.id, …)`

`LEFT_RECURSION_COUNTS` already uses `getCijKey(p, state)` correctly (lines 41-42, 73). The
`MEMO` map must use the same key.

**Cure.** Replace every `MEMO.get(p.id)` and `MEMO.set(p.id, …)` with `getCijKey`-keyed
equivalents. Because `getCijKey` requires both `p` and `state`, the cached offset-predicate
check (`cached.offset >= state.offset` at line 63 — a guard that prevents older shorter
results from replacing newer longer ones) becomes irrelevant at the same offset and can be
simplified; at distinct offsets the keys are distinct by construction. The simplification: at
a given `(id, offset)`, cache the first result produced (the seed), let the grow loop update
it if a longer result is found via the `cachedAfter.offset > state.offset` guard.

**Falsifiable check.** `grep 'MEMO.get(p.id)\|MEMO.set(p.id' typescript/src/parse/packrat.ts`
→ 0 matches. `grep 'getCijKey' typescript/src/parse/packrat.ts` → ≥6 matches (all MEMO
read/write sites).

### S2 — The SOUND assertion is active in `memoize.test.ts`

**Breach (born-RED target).** The test `"id-only memo mis-restores across offsets"` currently
asserts the UNSOUND result: `st.isError=false, st.offset=6, st.value="hello"`. The SOUND
assertions are present in the file — commented out at lines 101-102.

**Cure.** Flip the test: replace the three unsound `expect(…)` lines with the single sound
assertion `expect(st.isError).toBe(true)`. Update the test description to reflect the fix:
`"(id, offset)-keyed memo: same parser at two offsets is independent"`. The
`// SOUND target` comment block is removed (it becomes the live assertion).

**Falsifiable check — the BORN-RED gate.** On today's tree (before the packrat fix):
`cd typescript && npm test -- memoize` exits 1 because the new sound assertion
(`expect(st.isError).toBe(true)`) fails on the defective code which sets `isError=false`. On
the fixed tree: exits 0 — all seven tests in the describe block pass.

The gate is born-RED today because:
1. `memoize.test.ts` currently asserts `expect(st.isError).toBe(false)` (the unsound result).
2. Flipping it to `expect(st.isError).toBe(true)` makes it red on the current packrat code.
3. Only applying the `getCijKey` fix makes the test green.

This is the REAL runtime observable — not a source-shape check, not a string round-trip.
The gate exercises the actual `memoize()` function on an actual `ParserState` over a real
input string and reads the actual parse result.

### S3 — Left-recursion tests still pass (no regression)

**Constraint (the `mSL` / `sS` / `math again` tests).** The three existing left-recursion
tests (`should mSL`, `should sS`, `should math again`) must continue to pass after the fix.
These verify that the seed-grow mechanism still finds the longest derivation. They do not rely
on cross-offset sharing — each recursive call enters at the SAME offset, so `(id, offset)` keys
stay coherent through the grow loop.

**Falsifiable check.** `cd typescript && npm test -- memoize` reports all seven tests in the
describe block as passing.

### S4 — `resetPackrat` clears the (id, offset)-keyed MEMO

**Constraint.** `resetPackrat()` calls `MEMO.clear()` and `LEFT_RECURSION_COUNTS.clear()`.
After the fix the MEMO keys are `(id, offset)` numeric composites, not bare `p.id`. The clear
is already a full `Map.clear()` — no change needed. Verify: `resetPackrat()` is called in
`beforeEach` of the test suite; after `resetPackrat()` a fresh parse over the same parser at
the same offset has no cached result.

**Falsifiable check.** The `"default parse() does not clear the packrat cache"` test passes
(it seeds a cache entry, runs an unrelated parse, then verifies the cache entry survives —
this is not affected by the key change).

---

## Born-RED gate

**Gate:** The SOUND assertion flipped live in `memoize.test.ts` — exits 1 on today's packrat
code (unsound id-only key), exits 0 after the `getCijKey` fix.

**Concretely (the two-line change that makes the gate born-RED):**

```ts
// BEFORE (today — unsound, currently PASSING):
expect(st.isError).toBe(false);
expect(st.offset).toBe(6);
expect(st.value).toBe("hello");

// AFTER A.W2 gate authoring (born-RED, will pass only after the fix):
expect(st.isError).toBe(true);
// offset and value are undefined/stale — not asserted on the error path
```

**Why this is NOT a proxy.** The gate runs the actual `memoize()` closure, constructs a real
`ParserState("Xhello!")`, invokes the real parser function, and reads `st.isError`. No
source-grep, no file-presence check, no type-check pass stands between the assertion and the
defective runtime behavior.

**Today's result.** `cd typescript && npm test -- memoize` → all 7 tests PASS, including
the one that asserts the UNSOUND result. After flipping the assertion (the born-RED step):
the test exits 1 (1 failure: the sound assertion fails on the unsound code). After applying
the MEMO key fix: exits 0 (all 7 tests pass).

---

## Dependencies

- **A.W2 is PARALLEL to A.W1** (campaign DAG §5). The CSS parser never calls `memoize()`
  (verified: `grep -rn 'memoize' typescript/src/parse/parsers/` → 0 hits — not in CSS, JSON,
  or CSV parsers). The packrat tier is self-contained; the MEMO key fix has zero blast radius
  beyond the opt-in tier's own test suite. A.W2 can be authored, merged, and published as
  0.10.1 independently of A.W1's 0.10.0 cut.
- **No cross-repo dependency.** The packrat tier is entirely parse-that-owned. value.js does
  not call `memoize()` (verified: value.js imports only COMBINATOR primitives from parse-that —
  `Parser`, `all`, `any`, `regex`, `string`, `whitespace`, `dispatch`, `ParserState`,
  `mergeErrorState` — and has its own `memoize()` utility in `src/utils.ts` that is unrelated
  to parse-that's packrat tier; `parseSingleValue`/`parseFunctionArgs` are NEVER imported by
  value.js — confirmed by grep with zero hits). The blast radius is purely within parse-that's
  own test suite.

---

## What this wave does NOT change

- The `resetPackrat()` public API — unchanged (still called once per left-recursive parse).
- The `mergeMemos()` API — the key change is internal.
- The `LEFT_RECURSION_COUNTS` logic — already correct, already uses `getCijKey`.
- Any non-packrat combinator — `Parser`, `any`, `string`, `regex`, `dispatch`, span family,
  `splitBalanced`, `recover` — none affected.
- `proof:no-css-surface` (A.W1's gate) — this wave does not touch the CSS surface.
- The `"default path (no opt-in) has no packrat"` test — passes today, passes after.

---

## File deltas (implementation substrate — not authored in this wave)

| File | Change |
|---|---|
| `typescript/src/parse/packrat.ts` | 6 sites: replace `MEMO.get(p.id)` / `MEMO.set(p.id, …)` with `getCijKey(p, state as ParserState<unknown>)` keyed equivalents at lines 61, 76, 82 in `memoize()` and lines 99, 112, 114 in `mergeMemos()`; simplify the `cached.offset >= state.offset` guard (same-offset key means the guard is trivially true on first hit and the grow loop is unchanged) |
| `typescript/test/memoize.test.ts` | Flip the 3 unsound assertions → 1 sound assertion; update test description |
