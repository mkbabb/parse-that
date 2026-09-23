SERVED MODEL: claude-opus-5[1m]

# ALGEBRA — DATED ADDENDA, 2026-09-18 (E-2 · E-3 · E-4 · E-5 · E-8)

**An addendum BESIDE `ALGEBRA.md`, never a patch of it (E-3).** `ALGEBRA.md` was ratified by
X.P.W2.c, carries `§Selected` as its one lawful post-`.c` text change (FF-5), and is immutable from
here. This file is the **ONE** dated addendum `COHESION.md` **§0n.3** orders — _"landed by **X.P.W3's
first act** as ONE dated addendum-beside to `ALGEBRA.md` (both homes, sha256-equal), never by `.i`"_ —
and it lands in both homes, byte-identical:

- `value.js:docs/tranches/X/parse-that/algebra/ALGEBRA-ADDENDA-2026-09-18.md`
- `<p2>:experiments/w2/contract/ALGEBRA-ADDENDA-2026-09-18.md`

**The immutability and the equality, measured at this seat before this file was written:**

```
⟨cmd⟩ shasum -a 256 value.js:…/algebra/ALGEBRA.md  <p2>:experiments/w2/contract/ALGEBRA.md
67c8253abaecb29a0b16a862bf63ad25ff1140d91f06248c843b9c253fc537de   (901 L · 157,010 B)
67c8253abaecb29a0b16a862bf63ad25ff1140d91f06248c843b9c253fc537de   (901 L · 157,010 B)
```

`<p2>` = `/Users/mkbabb/Programming/parse-that-css-totality-p2`. The **promoted seed** is
`<p2>/typescript/src/css/**` (17 files) — X.P.W2's graduated AC-1 TAGLESS-TWIN, the survivor ruled at
`COHESION.md` §0n.1 word (a). Every measurement below was taken at that tree, with the harness's own
literal commands, each figure **double-run and byte-identical across runs**.

**What this addendum is for.** Five contract items (E-2 · E-3 · E-4 · E-5 · E-8) were raised to the
owner by name at X.P.W2's close, ruled at `COHESION.md` §0n.3, and given to X.P.W3's first act to
land. Two of them (E-2, E-3) change what the contract says and therefore what the seed must encode;
three (E-4, E-5, E-8) ratify a deviation the seed already carried as a **declared** deviation, which
is why the seed does not move for them. Each item below states the ruling, the contract change, and
the measurement — never one without the others.

---

## E-2 · §4.5 × §10.1 — `balanced-tail`'s `DROP` is re-kinded `keyword` → `skipped`

### The ruling (`COHESION.md` §0n.3, verbatim)

> **E-2 (G-3's cause, §4.5 × §10.1).** Cure **(3)**: the `balanced-tail` `DROP` is re-kinded to
> `skipped` — the dropped tail of an unknown function is skipped opaque text, not a keyword and not a
> seventh kind. W3's open seat re-measures the cure on the promoted seed (population 2,035 → 0, no
> other product moved); if it can cite an OP-13 invariant that (3) breaks, it falls back to **(1)**
> the seventh kind `opaque` and re-indexes `.g`'s serializer. (2) widening `π_keyword` is REFUSED —
> it admits non-identifiers as keywords.

### The contract change

**§10.1**'s last term reads, from this date:

```
balanced-tail := REP (ALT[ SEQ[TOK "(", REF balanced-tail, TOK ")"],  DROP skipped (SCAN any-but-paren 1 ∞) ]) 0 ∞
```

**§4.5**'s `skipped` gloss is read in its general form, and the generalization is stated rather than
assumed: `skipped` is _bytes no leaf of `V` claims and no other kind's predicate admits_ — bytes a
`RECOVER` consumed are its principal population, not its definition. `π_skipped` is _any bytes_,
which §4.5 already says; nothing about it is widened here, only its reach named.

**Why the defect existed.** §4.5's `π_keyword` is _"an ASCII-folded literal that is **not** a leaf of
`V`: `important`, a unit suffix `deg`"_. The tail of `var(--brand)` is `--brand`, which is not a
literal of that class; the `DROP` claimed it as `keyword` anyway, and **COMP-1c (fidelity of kind)**
therefore failed on every row whose colour body reached the `var` dispatch arm. §3's own sentence
names this exact shape: _"A `ws` entry over `abc` fails here."_

**The six kinds stay six.** Cure (1) — a seventh kind `opaque` — is the fallback the ruling reserves
for a cited **OP-13** break; this seat looked for one at the bytes and found none (the measurements
below are the looking: `C` tiles, `Ω` covers, `EQ-2`/`EQ-3` agree, and the serializer is not
re-indexed). Cure (2) — widening `π_keyword` — is **REFUSED** by the ruling, and this addendum does
not take it: it would admit non-identifiers as keywords and dissolve the predicate that makes
COMP-1c a check rather than a label.

### The measurement (promoted seed; both lowerings; `--at typescript/src/css`)

```
⟨cmd⟩ node harness/w2/eq-six.mjs --candidate ac1 --at typescript/src/css \
        --corpus experiments/w2/corpus/slice.json --fuzz-seed experiments/w2/corpus/fuzz-seed.json

  BEFORE                                          AFTER
  EQ-1  0                                         EQ-1  0
  EQ-2  0                                         EQ-2  0
  EQ-3  0                                         EQ-3  0
  EQ-4  0                                         EQ-4  0
  EQ-5  0                                         EQ-5  0
  EQ-6  2035   s0180 "var(--brand)"               EQ-6  0      -
  rows compared 30527                             rows compared 30527
  labels aligned true                             labels aligned true
  third-cell differences 233 (12 declared)        third-cell differences 233 (12 declared)
  RED — exit 1                                    GREEN — 30527 rows, six products, zero divergences
```

**2,035 → 0, and no other product moved** — EQ-1..EQ-5 were 0 and are 0; the corpus is the same
30,527 rows (527 slice + 30,000 seeded fuzz); the label index is aligned across lowerings before and
after; the third cell's 233 differences and their 12 declared rows are **unchanged to the digit**, so
nothing was bought from the incumbent comparison.

**A second gate moved, and it is named rather than pocketed.** The same COMP-1c disease was G-4's
carried RED (`R-LAW-2`), and cure (3) discharges it:

```
⟨cmd⟩ node harness/w2/recovery-laws.mjs --candidate ac1 --at typescript/src/css

  BEFORE   js   2951 TRY sites · R-LAW-1 0 · R-LAW-2 COMP-1 failures 13 · R-LAW-4 0/0 · R-LAW-3 silent
           wasm 2951 TRY sites · R-LAW-1 0 · R-LAW-2 COMP-1 failures 13 · R-LAW-4 0/0 · R-LAW-3 silent
           RED — js: R-LAW-2 — 13 rows fail COMP-1 | wasm: R-LAW-2 — 13 rows fail COMP-1

  AFTER    js   2951 TRY sites · R-LAW-1 0 · R-LAW-2 COMP-1 failures  0 · R-LAW-4 0/0 · R-LAW-3 silent
           wasm 2951 TRY sites · R-LAW-1 0 · R-LAW-2 COMP-1 failures  0 · R-LAW-4 0/0 · R-LAW-3 silent
           GREEN — five laws green on both lowerings
```

The TRY-site population is identical (2,951 both sides, both lowerings), so the 13 were **cured, not
avoided**. §0n.3 named G-3 and G-4 as E-2's two carried REDs; both are discharged by the one cure the
ruling chose, which is the strongest available evidence that the diagnosis was of the disease and not
of a symptom.

---

## E-3 · the `CUT` idiom — `DISPATCH` joins §5.2's pass-through list; §10.3's two inert `CUT`s are struck

### The ruling (`COHESION.md` §0n.3, verbatim)

> **E-3 (the `CUT` idiom).** `DISPATCH` joins §5.2's pass-through list; §10.3's two inert `CUT`s are
> struck (measured inert over 30,527 rows, `.f`). G-1's structural walk then measures the contract,
> not an encoding.

### The contract change

**§5.2**, third sentence, reads from this date:

> A `CUT` is scoped to its nearest enclosing `ALT` arm, through `SEQ`/`CTOR`/`EXPECT`/`DROP`/**`DISPATCH`**
> but not through `TRY`, `REP`, `RECOVER` or `REF` (those open a new scope; a `CUT` directly under
> them is a walk error).

`DISPATCH` belongs on the pass-through side by the same reasoning the other four are there: it
selects a row and continues in the _same_ arm of the _same_ `ALT`, restoring nothing and opening no
new rollback scope. Every `CUT` in §10.1 and §10.2 stands inside a dispatch row (`rgb`, `hsl`,
`oklch`, `var`, `cubic-bezier`, `steps`, `linear`) reached from the colour/timing `ALT`, so without
this clause seven correct commitments read as walk errors and the walk measures the encoding rather
than the contract.

**§10.3** loses two `CUT`s. `qualified-rule` reads

```
qualified-rule:= CTOR style-rule [ TEXT any-but-brace-or-semi 1 ∞, TOK "{",
                                   REP declaration 0 ∞ (SEQ[WS, TOK ";", WS]), OPT(SEQ[WS, TOK ";"]) unit, WS, TOK "}" ]
```

and `declaration` reads

```
declaration   := CTOR declaration [ WS, TEXT ident 1 ∞, WS, TOK ":", WS, REF value-slice,
                                    OPT(SEQ[WS, TOK "!", WS, UNIT "important"]) unit, WS ]
```

Both struck `CUT`s stood directly under a scope-opening operator — `qualified-rule`'s under
`stylesheet`'s `RECOVER`, `declaration`'s under `qualified-rule`'s `REP` — so by §5.2's own last
clause they committed nothing and were walk errors as encoded. `.f` measured them inert over 30,527
rows; this addendum strikes them, and the seed follows.

### The measurement (promoted seed)

`.g`'s own `structuralReport` (`harness/w2/lib/term.mjs`), executed read-only against each lowering's
`grammar()` at the graduated location:

```
                                  cutOutsideAlt   opsOutsideContract   recoverInNonFinalAlt   unownedSpans   closureLeaks
  BEFORE (candidate directory)    7  (js · wasm)  0                    0                      0              0
  AFTER  (promoted seed)          0  (js · wasm)  0                    0                      0              0
```

The seven were `stylesheet`×2 · `rule`×2 · `qualified-rule`×2 · `declaration`×1 — the two struck
terms, counted once per reified site. **G-1's structural half turns from RED to GREEN at the
graduated location by this strike**, which is what the ruling's closing sentence predicted.

**Two things this measurement does NOT claim, stated because a reader would otherwise infer them.**
(i) `CUT` now appears in the walk's `opsUnexercised` list, because the seven surviving `CUT`s live in
`grammar().dispatchTerms` and `.g`'s walk reaches only `grammar().terms` — a blind spot the seed's own
`algebra/grammar.mjs` header already MEASURED and declared (`VERDICT.md`), not one this addendum
creates. (ii) `op-bijection.mjs --structural` does **not** accept `--at`, so its literal invocation
still walks `experiments/w2/ac1-tagless/**` — the untouched candidate directory — and still prints
`cut∉alt 7 · RED`. That is a true reading of a tree this addendum did not change, and it is filed as a
finding for `.g` in `execution/D/X-P-W3.md`, not silenced here.

**Nothing else moved.** Every product and every other gate reading is identical before and after the
strike — EQ-1..EQ-6 all 0 over 30,527 rows, third cell 233 (12 declared), `r1-candidates` 0/172 on
three productions × two lowerings with boundary 7/7, `depth-scan` GREEN, `wasm-audit` GREEN,
`op-bijection --candidate` 22 / 22 / 22 with DECLARED-ABSENT 0. The emitted module shrank exactly as
two struck operators should make it shrink: **187,341 B / 1,273 functions → 187,131 B / 1,266
functions**, static data unchanged at 55,500 B, and the build re-runs byte-identically
(`7ce0382b2271658592166e4ac2eb5df3de2ba7240b376defaa5791be89a7baa4`).

---

## E-4 · §10.2 — the `DISPATCH` arm is FIRST

### The ruling (`COHESION.md` §0n.3, verbatim)

> **E-4 (§10.2).** The `DISPATCH` arm first — the minimal reorder, measured by `.d` and `.e` as
> moving exactly 3 slice rows REJECT → ok.

### The contract change

**§10.2**'s `EXPECT` arm order reads, from this date:

```
timing        := SEQ[WS, EXPECT(ALT[ DISPATCH ident timing-head { … },
                                     CTOR timing-keyword [KW ident timing-keyword],
                                     CTOR step-alias    [KW ident step-alias] ],
                                "<timing-function>"), WS, END]
```

**Why the original order was a contract defect, not a candidate's bug.** Under ORDERED COMMITTED
choice (OP-09), `KW ident timing-keyword` matches the ident run `linear`, that arm SUCCEEDS, the `ALT`
returns, and the enclosing `END` then fails on `(` — so one of the four `CssTimingFunction` kinds
§10.2 itself puts in the slice could not parse. Measured with §10.2's literal order:
`"linear(0, 0.5 50%, 1)"` → `ok:false`, `trailing_input` @6, `expected ["end of input"]`. The reorder
is minimal and changes no other input's verdict: `linear` with no `(` still falls through to the
keyword arm, because `head-linear`'s `TOK "("` fails **before** its `CUT`.

### The disposition at the seed — NO CHANGE, and that is the point

The promoted seed already encodes the dispatch-first order, and encoded it as a **declared
deviation** written at authoring, with the contract defect named as a finding rather than patched
silently (`algebra/grammar.mjs`, the block above `timing`). This addendum makes the contract agree
with the encoding the ruling chose; the seed's bytes are unchanged, and the _"exactly 3 slice rows
REJECT → ok"_ figure is **`.d`'s and `.e`'s W2 measurement, cited by id and not re-derived here** —
dated evidence is read, not re-taken (the epoch rule).

---

## E-5 · §6 EQ-5 — the sixth coordinate leaves the cross-lowering tuple

### The ruling (`COHESION.md` §0n.3, verbatim)

> **E-5 (EQ-5's sixth coordinate).** Dropped from the cross-lowering tuple; the arena watermark is
> printed as a G-8 row (AC-1's bytes already read so: 0 in both + `arenaHighWater()`).

### The contract change

**§6**'s EQ-5 row reads, from this date: after every `TRY` failure in the corpus, the compared tuple
is `⟨i, len(C), len(P), len(D), depth⟩` post-restore vs the mark, and the count of sites must agree.
The **arena** coordinate is **not** compared across lowerings: it is a Wasm-only quantity (`ALGEBRA.md`
line 238 and §6 already say _"the JS lowering reports `arena = 0`"_), so comparing it across the two
lowerings compares a number with a constant and can only ever report the asymmetry it was told to
expect. It is **not deleted** — it is printed, as its own **G-8 row**, via `arenaHighWater()`, where a
watermark is a measurement rather than an equality.

EQ-5's falsifier is unchanged and still bites: _"a candidate restoring four of five coordinates leaks
a span and passes COMP-1 by accident on the next input"_ — five coordinates, five compared.

### The measurement

```
⟨cmd⟩ node harness/w2/eq-six.mjs --candidate ac1 --at typescript/src/css …   → EQ-5  0
⟨cmd⟩ node --expose-gc harness/w2/alloc-latch.mjs --candidate ac1 --at typescript/src/css
        js    arena high-water    0 B     "wasm only; the JS lowering reports 0"
        wasm  arena high-water  304 B
```

AC-1's bytes already read exactly as the ruling's parenthesis says: `0` in both for the compared
tuple, and the watermark on its own G-8 row.

---

## E-8 · §8 D-3 — `color-body` is inlined, and the two-`REF` count stands

### The ruling (`COHESION.md` §0n.3, verbatim)

> **E-8 (F-8).** `color-body` inlined in the letter; §8 D-3's two-`REF` count stands.

### The contract change

**§10.3**'s `value-slice` reads, from this date, with `color-body` **inlined** rather than reached by
a third back-edge:

```
value-slice   := CTOR value-color [ EXPECT(ALT[hex, named, transparent, context, functional], "<color>") ]
```

`color-body` remains the name of that one shared body wherever the letter needs to speak of it; it is
no longer a `REF` target. **§8 D-3's count stands**: the slice has exactly **two** `REF` back-edges,
`balanced-tail` and `value-slice`, and `REF` is the operator that counts `depth` against
`Θ.depthBound` — a third site would have made D-3 false, and D-3 binds every candidate.

### The measurement

```
⟨cmd⟩ (read-only) structuralReport(lowerings.{js,wasm}.grammar())
  refs.targets      2   —  balanced-tail · value-slice        (= §8 D-3's two back-edges, exactly)
  refs.sites        5   —  balanced-tail→balanced-tail · stylesheet→value-slice · rule→value-slice
                           · qualified-rule→value-slice · declaration→value-slice
  refs.unresolved   []
⟨cmd⟩ grep -n 'REF_TARGETS' <p2>/typescript/src/css/algebra/grammar.mjs
  export const REF_TARGETS = ["balanced-tail", "value-slice"];
```

Five syntactic sites over **two** distinct targets: `REF` is resolved by name against a finite closed
map (OP-22), never by search, so the back-edge count is the target count and not the site count. The
seed already inlined `color-body` as a declared deviation with the D-3 tension recorded rather than
resolved silently; this addendum ratifies that reading, and the seed's bytes are unchanged.

---

## WHAT THIS ADDENDUM DOES NOT DO

It stamps **no verb** on any wave. It adds **no operator** — the set is **22**, closed, and a
twenty-third halts the wave to X·V and the owner, never a local decision. It adds **no complement
kind** — `K_C` stays the six of §4.5, and cure (1)'s seventh kind `opaque` is **not** taken. It widens
**no `ParseIssue` code** — the frozen union stays eight, and a ninth is a contract change to a frozen
surface (`W3.md` §3a). It sets **no bench bar**, publishes **no ratio**, and restates **no budget**
against anything but **1,636,680 µs** (`COHESION.md` §0j.E OC-1: the table is RECORDED-NOT-GATING;
_"inventing a bar is a defect"_). It resolves **none** of §11's declared marks (DM-1..DM-7) and
**none** of §10.5's eleven third-cell divergence rows — those are `.d`'s ledger and `.e`'s
adjudication, and the third cell's 233 differences (12 carrying a declared row) are unmoved by every
change above.

`ALGEBRA.md` §0–§3, §4.0–§4.4, §4.6, §5.1, §5.3–§5.8, §7, §9, §11, §12, §13 and `§Selected` are read
**exactly as ratified**. The reader holds the two files together, `ALGEBRA.md` first and this one
beside.
