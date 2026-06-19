# A — PROGRESS

Opened: 2026-06-18. Status: **DEVELOPMENT** (charter authored; waves pending ratification).

---

## Board

| Wave | Title | Status | Gate | Notes |
|---|---|---|---|---|
| **A.W0** | Manifest hygiene | `PENDING` | `manifest-gate.mjs` — born-RED (typesVersions stale path confirmed live: `dist/src/parse/` does not exist) | Lowest-risk; ships first as 0.9.1 |
| **A.W1** | CSS-parser removal | `PENDING` | `proof:no-css-surface` — born-RED (all 16 CSS symbols confirmed in `dist/index.d.ts` today) | Contracting change → 0.10.0; harvest scanners first |
| **A.W2** | Packrat `(id,offset)` FIX | `PENDING` | `memoize.test.ts` "id-only memo mis-restores" — born-RED (defective assertion currently PASSES; the fix makes it RED until SOUND assertion flips) | Surgical: 4 MEMO call sites in `packrat.ts` |
| **A.W3** | Subpath split + SpanParser | `PENDING` | Gate 1: subpath-gate.mjs (born-RED: `./core` subpath absent); Gate 2: span-dispatch.bench.ts (born-RED: SpanParser type absent) | Depends on A.W1 (clean parsers/); A.W2 can parallelize |

---

## Events

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
| inv-A-1 — zero CSS surface | RED (16 CSS symbols in dist today) |
| inv-A-2 — packrat sound | RED (defective MEMO keying confirmed) |
| inv-A-3 — manifest resolves | RED (typesVersions stale path confirmed) |
| inv-A-4 — json and csv unbroken | GREEN (no CSS deletion yet) |
| inv-A-5 — value.js edge unbroken | GREEN (value.js imports zero CSS symbols) |
