# value.js → parse-that · EVIDENCE ADDENDUM to the standing 1.1.0 ask: four measured behaviours (PT-01 / PT-03 / PT-04 / PT-07)

**Provenance.** value.js mega-tranche, library band (M-12 tri-fold: four independent Opus sweeps →
a Fable design and an Opus design, blind to each other → a Fable arbiter who re-measured the
decisive numbers before adopting them). Full adjudication:
`value.js/docs/tranches/V/megatranche/registry/adjudicated/library-band.md` §5.5. Session
2026-07-27 · node v26.0.0 · darwin arm64. Measured against `@mkbabb/parse-that` **as published** —
dist bytes, not source.

**Standing of this letter — read before anything else.** The 1.1.0 ask is **owner-held**, and this
addendum does not move it, re-scope it, or add to it. **No code change is requested.** value.js
readopted parse-that as published by owner decree; every item below is a *behaviour we measured
while building on it*, attached as evidence so the ask has receipts rather than recollections. Where
an item interacts with our own open work, we say so and stop there — none of these is a defect
report, and none of them asks you to alter your formation posture or your release cadence.

---

## PT-01 · `label` is a no-op unless diagnostics are armed, and arming couples an unconditional `console.error`

Two dist reads, one coupling:

```
dist/diagnostics-DDazRHgl.js:14   state.expected = diagnosticsEnabled && label ? [label] : void 0
dist/packrat-entry-*.js:881       if (isDiagnosticsEnabled()) console.error(...)
```

So a consumer who attaches labels for better failure messages gets **nothing** unless the
diagnostics flag is armed — and the act of arming it turns on an **unconditional `console.error`**
on the same path. The two behaviours are reachable only together. A consumer wanting labelled
diagnostics without console output has no posture available today.

*Interaction on our side:* this is an input to how our parser band specifies rejection-shape
assertions; it is recorded, not escalated.

## PT-03 · `PACKRAT_ARMED` is a one-way latch — `resetPackrat()` does not disarm it

**The latch, read in the bundle:** `packrat-entry:678 let PACKRAT_ARMED = false` · `:722
PACKRAT_ARMED = true` · read at `:682` and `:714` — and **no assignment back to `false` anywhere in
the bundle**.

**The measurement** (probe `parsethat-surface-gaps.mjs`, executed):

| state | ns/parse |
|---|---|
| UNARMED | **93.9** |
| ARMED | **138.2** (**1.47×**) |
| after `resetPackrat()` | **139.3** — i.e. still armed |

`resetPackrat()` clears the memo store; it does **not** return the process to the unarmed cost.
Once anything in a process arms packrat, every later parse in that process pays the armed rate.

*Interaction on our side, stated so it cannot be misread:* this is an **input** to our own open
bench-bar recalibration item, **not its resolution** — it pre-empts nothing and asks for nothing.
It matters to us because a benchmark that arms the latch in an early case measures every later case
at the armed rate, which is a property of the harness, not of parse-that.

**Honest bound:** the 1.47× is **one machine, N=1** (node v26.0.0, darwin arm64), measured in
separate processes. We report it as a ratio observed once, not as a published figure.

## PT-04 · `Parser.lazy` arity 1, with a hard recursion ceiling at 7,761

Probe result: `Parser.lazy` has arity 1; the deepest successful nesting is **7,761**, and **7,762
throws a `RangeError`**. The ceiling is a thrown error rather than a returned failure, so it crosses
the boundary as an exception regardless of how the consumer handles parse failure.

Recorded as a measured limit of the published build on this runtime. No disposition proposed.

## PT-07 · Non-string inputs throw raw, and `.parse()` returns `undefined` on failure

Two shapes at the JS boundary, both measured:

- **5/5 non-string inputs throw a raw `TypeError`** from `parseState` — not a parse failure, an
  exception, before any parsing semantics apply.
- **`.parse()` returns `undefined` on failure** — indistinguishable, at the type level, from a
  successful parse that legitimately produced `undefined`.

Our own consequence, which is entirely ours to carry: value.js is making the JS-boundary guard a
**named invariant above parse-that** rather than asking the library to change either shape. We
mention it only so the reason this row exists is transparent.

---

## What is NOT in this letter

- No ask, no proposed API change, no version request. The 1.1.0 ask stands exactly as the owner
  holds it.
- No claim that any of the four is a bug. Three of them are documented-behaviour candidates; one
  (PT-03) is a latch whose *absence of a disarm path* we measured rather than inferred.
- Nothing that depends on you responding. If these four are already known, this letter is a
  duplicate receipt and costs you nothing.

---

*Sent by the value.js mega-tranche, 2026-07-27. Reply folds per E13; queued work, never an
interruption.*
