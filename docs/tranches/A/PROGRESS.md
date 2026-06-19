# A — PROGRESS

Opened: 2026-06-18. **CLOSED + PUBLISHED 2026-06-19 → `@mkbabb/parse-that@0.11.0` live on npm.**
Branch `tranche-a` (pushed to origin). All gates GREEN; 108 tests pass; tsc 0.

---

## Board

| Wave | Title | Status | Gate | Notes |
|---|---|---|---|---|
| **A.W0** | Manifest hygiene | ✅ `DONE` (0.9.1) | `proof:manifest` GREEN | typesVersions purged, sideEffects:false |
| **A.W1** | CSS-parser removal | ✅ `DONE` (0.10.0) | `proof:no-css-surface` GREEN | 8 src + 6 test files deleted (incl. expose.test.ts, a 6th CSS-surface test the charter missed); scanners harvested; bundle 75.3→51.0 kB (−32%). **Gate CORRECTED**: the charter grepped `index.d.ts` (only `export *` lines — UNSOUND); the real gate observes the runtime export surface of the bundled `dist/parse.js` |
| **A.W2** | Packrat `(id,offset)` FIX | ✅ `DONE` (folded into 0.11.0) | `memoize.test.ts` SOUND flip GREEN + 4 LR tests | **Charter premise FALSIFIED**: the "surgical key-swap" breaks left-recursion (the id-only MEMO is the load-bearing recursion-breaker). The CORRECT fix landed: the full Warth-Douglass-Millstein packrat-with-LR (position-keyed seed-grow + in-progress marker + a general multi-occurrence ε rule). Stress-tested + adversarially re-verified |
| **A.W3** | Subpath split + SpanParser | ✅ `DONE` (0.11.0) | Gate 1 `proof:subpath` GREEN; Gate 2 **FALSIFIED** | Subpath split (./core ./diagnostics ./packrat ./utils) ships. SpanParser tagged-union measured **~10–14% SLOWER** on V8/TS (the §7 jump-table hypothesis does not transfer from Rust) → RETIRED from the public surface, kept module-internal as the codegen data foundation. future-research.md §7 re-scoped |

---

## Events

### 2026-06-19 — Tranche A IMPLEMENTED, CLOSED, PUBLISHED (0.11.0)

Implemented via team-lead orchestration (surgical waves direct; A.W2/A.W3 via a
3-agent + adversarial-verify workflow in isolated worktrees). Three findings shaped
the close, each a vindication of the campaign's observable-truth discipline:

1. **A.W1 gate was unsound as charted.** The `proof:no-css-surface` gate grepped
   `dist/index.d.ts` for CSS symbols — but the barrel re-exports via `export *`, so
   the symbols live in `dist/parsers/css/*.d.ts`, never inlined in `index.d.ts`. The
   gate would have passed GREEN with the CSS parser still shipping. CORRECTED to
   observe the bundled runtime export surface of `dist/parse.js`.

2. **A.W2's "surgical fix" (D4) was algorithmically unsound.** Swapping `MEMO.get(p.id)`
   → `MEMO.get(getCijKey(...))` makes the soundness test pass but BREAKS left-recursion
   (2 LR tests collapse): the id-only seed is the load-bearing recursion-breaker, and
   `.trim()` shifts the re-entry offset so position-keying misses it. The correct fix
   is the full WDM packrat-with-LR — which the original author had correctly flagged as
   "a from-scratch reimplementation." It landed, stress-tested (200 iters, n≤24) and
   adversarially re-verified with fresh probes.

3. **A.W3's SpanParser perf hypothesis (D7/§7) was FALSIFIED.** The tagged-union is
   ~10–14% SLOWER than closures on V8/TS (the opposite of the Rust regime). The agent
   reported the missed target honestly rather than fabricating. Retired from the public
   API; kept internal as the BBNF-codegen data foundation. future-research.md §7 re-scoped.

Final: 0.9.1 (W0) → 0.10.0 (W1) → 0.11.0 (W2+W3 folded). Published to npm, branch pushed.

### 2026-06-18 — Charter authored

- Tranche A.md authored from the Constellation Campaign blueprint (§2) and
  primary source evidence:
  - `typesVersions` stale path confirmed live (`ls dist/src/` → no such directory)
  - CSS surface zero-consumer confirmed (value.js imports core combinators only;
    `grep -rn "parseSingleValue\|parseFunctionArgs\|cssParser"` in value.js/src → 0 hits)
  - Packrat bug confirmed: `MEMO` keyed on `p.id` at packrat.ts:62,77,82,99,113;
    `getCijKey` already written at packrat.ts:36-38 but only used for `LEFT_RECURSION_COUNTS`
  - CSS parser line counts: 1,202 LoC source, 2,075 LoC tests (confirmed live with `wc -l`)
  - `all()` drop-undefined footgun (leaf.ts:125) recorded in KILL/deferred ledger (D8)
  - `dist/index.d.ts` confirmed: `export * from './parsers/index.js'` re-exports all 16 CSS symbols
- PROGRESS.md created.

---

## Born-RED evidence (wave gates)

### A.W0 gate — born-RED today

```
$ ls /Users/mkbabb/Programming/parse-that/typescript/dist/src/
ls: /Users/mkbabb/Programming/parse-that/typescript/dist/src/: No such file or directory
```

The `typesVersions["*"]["*"][0]` value of `"dist/src/parse/index.d.ts"` does
not resolve. The gate fires.

### A.W1 gate — born-RED today

```
$ grep -c "cssParser\|parseSingleValue\|CssNode\|MediaQuery\|KeyframeBlock" \
    /Users/mkbabb/Programming/parse-that/typescript/dist/index.d.ts
16  (16 CSS symbols present in the built dist)
```

All 16 CSS surface symbols present. The `proof:no-css-surface` gate would
exit 1 if run on today's tree.

### A.W2 gate — born-RED today (surgical)

`memoize.test.ts:98`:
```ts
expect(st.isError).toBe(false);  // currently PASSES (defective)
```
After applying the S1 MEMO fix WITHOUT the S2 assertion flip, this line
would FAIL — `st.isError` becomes `true` (the correct, sound result).
The born-RED moment is the fix without the assertion update.
The gate flips GREEN only when the S1 fix + S2 assertion flip land together.

### A.W3 gate — born-RED today

```
$ node --input-type=module <<'EOF'
import { Parser } from "@mkbabb/parse-that/core";
EOF
# → Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './core' is not defined
```

The `./core` subpath is absent from `package.json exports`. Gate 1 fires.
Gate 2 (SpanParser bench) is vacuously RED: `SpanParser` type does not exist
in `span.ts`; the bench import would fail at module resolution.

---

## Invariant status

| Invariant | Status |
|---|---|
| inv-A-1 — zero CSS surface | ✅ GREEN (49 runtime exports, zero CSS; gate observes the bundled surface) |
| inv-A-2 — packrat sound | ✅ GREEN (full WDM (id,offset) seed-grow; 7/7 memoize, stress-verified) |
| inv-A-3 — manifest resolves | ✅ GREEN (typesVersions purged, sideEffects:false) |
| inv-A-4 — json and csv unbroken | ✅ GREEN (108 tests pass) |
| inv-A-5 — value.js edge unbroken | ✅ GREEN (value.js imports core combinators only; re-pins ^0.11.0 at O.W2) |
