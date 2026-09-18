SERVED MODEL: claude-fable-5-1

# ALGEBRA.md — the Value-CSS semantic-and-recovery algebra (ratified, X.P.W2.c)

**Authority and lineage.** This is THE ALGEBRA CONTRACT of `W2.md` §3 item 1, ratified by the fresh
Fable adjudicator of `W2.md` §5 `.c` (L603–615; M-23 §1, L-14) over the two blind arms:
`draft-fable.md` (550 L · 53,945 B · sha256 `c185e15e29003d52a661eed1567ef9946f3d77c61c1280f102749a4f69698509`)
and `draft-opus.md` (743 L · 106,130 B · sha256
`29b24b4029f72f662fa23afca81bc03c1745e49ede2fd55b1e65338a0b2b9830`), both read whole, both
**superseded by this file and untouched** (dated evidence, E-3). Neither arm is the contract, and
this file is **not an average of them**: §0 records what was refuted in each against the evidence
corpus, what was ruled where they disagreed, and the cost of every rejected reading. It lives in
two homes — `docs/tranches/X/parse-that/algebra/ALGEBRA.md` (this repository) and
`<p2>/experiments/w2/contract/ALGEBRA.md` (the fresh root) — **byte-equal, sha256-asserted by G-1**.
After this seat closes, the only lawful edit is `X.P.W2.h`'s **appended** `§Selected` (§4a of
`W2.md`: sequenced, never parallel); every other correction is a dated addendum beside.

**What it binds.** Every candidate seat of phase 4 (`.d` / `.e` / `.f`), the harness seat `.g`,
and the adjudicator `.h`. A candidate that adds an operator, drops one, gives one a single lowering,
or picks a declared mark silently has left the contract; the registry diff (§4.6) is how that
shows. No bench bar is set anywhere in this file (COHESION §0j.E OC-1; `W2.md` §3a's last trigger
stays armed). This file stamps no verb, cures no gate but the ratified-contract half of G-1 and the
mapping half of G-6, and claims nothing about 52/52 (OP-8).

**Measurement law.** Every number below was re-measured at this seat on 2026-09-17 with the
command's shape stated; the two epoch-rule numbers (W1's bar-ledger arithmetic; the **1,636,680 µs**
reconstruction) are cited, never re-derived; no speed sentence appears in this file.

---

## 0. Adjudication record (L-14 — refute, rule, fold; never average)

### 0.1 Refuted from the Fable arm (`draft-fable.md`)

- **F-R1 — `SCALE` integer-only re-litigates the band's adjudicated arithmetic.** The draft fixes
  `SCALE num den` with _"integer `num, den`"_ (L201), writes oklch chroma as `SCALE 4 1000` (L443)
  and declares `rad` unrepresentable (M-7, L504). The evidence corpus says otherwise: cand-O's
  `spec.ts` (the band's _"ONE place a range lives"_) writes every percentage as
  `(value * percentRef) / 100` with `percentRef ∈ {255, 1, 100, 125, 150, 0.4}`, _"matching
  value.js's `value _ percentScale / 100`association exactly, so equivalence against the published
package is bit-for-bit"*; the incumbent's own sites are`channelToken(part, 0.4)` for oklab/oklch
(`grammar.ts:220`, `:224`), `125`for lab,`150`for lch. Measured at the vendored 4.0.0 over the
1001 values`0, 0.1, …, 100`: the incumbent's oklch percent-chroma **differs from `(v*4)/1000`on
370 of 1001** (first:`0.1%`→`0.0004000000000000001`vs`0.0004`) and **differs from
`(v*0.4)/100`on 0 of 1001**. The integer-only reading would fail EQ-1 against the adjudicated
expected values on 370 slice inputs, which §3c names a defect (*"discarding a band adjudication
re-litigates a ruled matter"*). **Ruled**:`SCALE num den`takes **f64 literals**; the form is`(v _ num) / den`, two IEEE operations in that order (§4.1 OP-18, §8 D-4). The same ruling
dissolves M-7: `rad`is`SCALE 180 π`with`π`the f64 literal`3.141592653589793`
(`0x400921FB54442D18`), which is the incumbent's `value _ 180 / Math.PI` (`grammar.ts:143`)
exactly — measured `oklch(50% 50% 1rad)`→ hue`57.29577951308232`, and 0 of 1001 divergences for
  every hue unit (§10.4).
- **F-R2 — EQ-1's serialization is stricter than the ruled comparison.** The draft emits every f64
  as its 8 bytes and claims the form _"distinguishes … every NaN payload"_ (L282). `W2.md` §3b rules
  EQ-1 _"via `Object.is`"_, under which all NaNs are one value. Measured on this box:
  `Object.is(NaN, -NaN)` → `true` while the 8-byte forms are `000000000000f87f` and
  `000000000000f8ff`. The WebAssembly core specification leaves NaN payload propagation
  nondeterministic, so a JS/Wasm pair can be `Object.is`-equal on every channel and byte-unequal
  under the draft's form — a spurious K-1 kill manufactured by the comparator. **Ruled**: the
  canonical serialization canonicalizes every NaN to one pattern and preserves `−0` (§6 EQ-1).
- **F-R3 — the `hue` term double-owns the unit span, failing the draft's own COMP-1.** L437 writes
  `SEQ[NUM, DROP keyword (KW IDENT hue-unit)]`. By the draft's own OP-05 (L176) `KW` **appends the
  span to P**; by its OP-11 (L187) `DROP` **appends the same span to C**. The bytes of `deg` are
  then owned twice, violating the draft's COMP-1 (i) _"pairwise disjoint"_ (L131–137) and its
  L-PURE, and the composition is ill-typed by the draft's own signatures (`DROP : Op<Span> → Op<Unit>`
  applied to `KW : Op<T>`). **Ruled**: a unit suffix is complement (`C.keyword`) consumed by
  `UNIT b ≝ DROP keyword (LIT b)`, one `ALT` arm per unit, each arm carrying its own `SCALE`
  (§10.1 `hue`); the invariant INV-OWN (§2.4) makes the double-ownership shape unconstructible.
- **F-R4 — "exactly one `REF` site" is contradicted by the draft's own slice.** The debt-3 clause
  (L316) and the bijection print (L518 _"REF sites: 1 (balanced-tail)"_) claim one back-edge, but
  §9.3's `declaration` (L481) is `… CUT, WS, REF value, …` — a **second** `REF`, and it references
  `value`, which the draft's own map marks _"no (W3)"_ (L342). As written, the slice's qualified rule
  parses no declaration without W3's grammar: the slice is not closed over itself. **Ruled**: the
  slice's declaration value is `REF value-slice` with `value-slice := color` wrapped in the frozen
  `CssScalar` shape the incumbent emits for a colour declaration (measured: `a{color:red}` →
  `{"kind":"scalar","payload":{"type":"color","value":{…}}}`), a **declared slice restriction** W3
  widens (§10.3); the slice then has exactly **two** `REF` sites (`balanced-tail`, `value-slice`),
  both counted by `Θ.depthBound`.

### 0.2 Refuted from the Opus arm (`draft-opus.md`)

- **O-R1 — HOLE-1 misroutes `AnimationTriggerValue`: the v12 shape inside the 52-map.** L312/L366
  declare _"no entry production returns it; it is reachable only through the X projection
  `collectAnimationOptions`"_. At the bytes: `types.ts:105` carries it as
  `CSSTimelineOptions.trigger?: AnimationTriggerValue`; `stylesheet.ts:53` defines the private
  production `parseAnimationTrigger`, run inside `parseDeclarations` at `:422` — i.e. **inside
  `P:stylesheet`**; `stylesheet.ts:879–890` (`collectTimelineOptions`) consumes it via
  `parseAnimationTrigger(serializeCssValue(triggered))`; `timeline.ts:101` serializes it
  (`serializeTrigger`, the `W:timeline-options` leg). `collectAnimationOptions` (`:827–873`) never
  touches it. The declared hole names a route that does not produce the value — precisely the
  misbinding G-6's falsifier names (_"an export mapped to a production that … is the misbinding
  defect"_). **Ruled**: `AnimationTriggerValue` is a **V** row constructed inside `P:stylesheet`
  (the `animation-trigger` declaration validator) and reached through `X:timeline-options` and
  `W:timeline-options`; there is no vocabulary hole (§9).
- **O-R2 — the X class does not "consume zero input bytes" uniformly.** L301/L354/L370/L518 state
  it for all seven collectors. At the bytes, `collectTimelineOptions` (`stylesheet.ts:879–890`)
  re-enters the parser three ways — `parseAnimationRange(serializeCssValue(value))` (`:874–876`,
  called three times), `parseTimelineScope(serializeCssValue(scoped))`,
  `parseAnimationTrigger(serializeCssValue(triggered))` — serializing `V` and parsing the bytes
  again; the other six are pure over `V` (`collectAnimationOptions` `:827–873` contains no parse
  call). **Ruled**: the class column is carried **per row**, and `collectTimelineOptions` is mapped
  `X (re-entrant: W then P)` with a declared hole for W3 — either the seed reads `V` directly or the
  re-parse is retained and named (§9 row 51).
- **O-R3 — no back-edge reference: the slice's `var()` tail is not a finite datum under the draft's
  own A-1.** A-1 (L45–52) makes every term _"a serializable datum"_; `DEPTH` (L168) is _"the only
  re-entrant operator"_ with arguments `T, N`. A term that re-enters itself must contain itself; the
  draft has no name/reference operator (⟨`grep -ci "\bREF\b"`⟩ → 0), so the `var(var(…))` row of
  G-11 has no finite, serializable term. **Ruled**: the grammar is a finite map `name → term` and
  `REF name` is the sole back-edge (§4.1 OP-22); the bound is the parse parameter `Θ.depthBound`
  (§2.3), the reading of _"depth an algebra parameter"_ that keeps one counter per σ.
- **O-R4 — `recover-declared` has no subject, and `REP` without `∞` misreads K-7.** L285–293 keep a
  second R-LAW-5 policy for _"the malformed qualified rule inside a `REP` over stylesheet items,
  where the recovering arm … sits inside a loop, not inside a choice"_ — but `recover-final-only`
  is a rule about `ALT` arms and never forbids a `RECOVER` that is a `REP` body; the retained policy
  is a declaration path with no construct behind it. L161 declares _"infinity is not an admissible
  argument (K-7's structural half)"_; K-7 is about **recursion**, and a `REP` under the progress
  law (§5.5) runs at most `len(S)` iterations by construction — the literal maximum manufactures a
  totality hole (item `max + 1` rejected) that no evidence row demands. **Ruled**: R-LAW-5 is
  `recover-final-only`, structural (§7); `REP` admits `∞` (§4.1 OP-12).
- Folded, not refuted: the draft's fifth state coordinate `ok` (L91) is redundant on the frozen
  surface — `ok ⟺ len(D) = 0` (`types.ts:26–27`) — and is not carried as state (§2.1).

### 0.3 The operator count, ruled: **22** — neither arm's set

The Fable arm proposes **20**, the Opus arm **22**. Neither enumeration survives §0.1/§0.2 intact;
the ratified set is derived row by row, and the count is what the derivation yields:

| arm row                      | disposition                                                                                                                                                                                                                                                      | ratified row          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Fable `SCAN` · Opus `CLASS`  | adopted (converge)                                                                                                                                                                                                                                               | OP-01 `SCAN`          |
| `LIT` (both)                 | adopted                                                                                                                                                                                                                                                          | OP-02 `LIT`           |
| `NUM` (both)                 | adopted; Opus's _"one operator so `1.`, `1e400`, `−0` are algebra decisions"_ folded as its clause                                                                                                                                                               | OP-03 `NUM`           |
| Fable `DIGITS`               | adopted — hex has no home in Opus's `REG-NUM` (four profiles, none hexadecimal)                                                                                                                                                                                  | OP-04 `DIGITS`        |
| — (neither arm)              | **added**: the frozen `V` carries raw-string leaves (`StyleRule.selectors`, `Declaration.name`, `unknown.prelude`); the Fable arm's §9.3 made `CTOR` read `S` for them (its L480), which its own OP-16 forbids; a leaf that injects bytes as a string must exist | OP-05 `TEXT`          |
| Fable `KW` · Opus `MAPCONST` | adopted in the fused form (scan + fold + lookup + provenance)                                                                                                                                                                                                    | OP-06 `KW`            |
| Opus `END`                   | adopted — `trailing_input` becomes an algebra product in both lowerings rather than a boundary act outside the registry                                                                                                                                          | OP-07 `END`           |
| `SEQ` · `ALT` · `REP` (both) | adopted                                                                                                                                                                                                                                                          | OP-08 · OP-09 · OP-12 |
| Fable `CUT` · Opus `COMMIT`  | adopted (converge)                                                                                                                                                                                                                                               | OP-10 `CUT`           |
| Fable `PURE` · Opus `OPT`    | `PURE` adopted; `OPT o v ≝ ALT[o, PURE v]` is a notation, not a row                                                                                                                                                                                              | OP-11 `PURE`          |
| Fable `DROP` · Opus `SKIP`   | adopted (converge)                                                                                                                                                                                                                                               | OP-13 `DROP`          |
| `DISPATCH` (both)            | adopted, Opus's _"no default arm"_ clause folded                                                                                                                                                                                                                 | OP-14 `DISPATCH`      |
| `FAIL` (both)                | adopted                                                                                                                                                                                                                                                          | OP-15 `FAIL`          |
| Opus `EXPECT`                | adopted — debt 1 needs composite relabelling; a last-arm `FAIL` fires only at the `ALT`'s own offset and cannot rename a deeper zero-width failure                                                                                                               | OP-16 `EXPECT`        |
| `CLAMP` · `SCALE` (both)     | adopted, `SCALE` per F-R1                                                                                                                                                                                                                                        | OP-17 · OP-18         |
| Fable `CTOR` · Opus `EMIT`   | adopted (converge)                                                                                                                                                                                                                                               | OP-19 `CTOR`          |
| Fable `TRY` · Opus `MARK`    | adopted (converge)                                                                                                                                                                                                                                               | OP-20 `TRY`           |
| `RECOVER` (both)             | adopted, Fable's yield (`none`), Opus's sentinel argument dropped (any `D` append ⇒ `ok:false` ⇒ `V = ⊥`, so the recovered value is internal only)                                                                                                               | OP-21 `RECOVER`       |
| Fable `REF` · Opus `DEPTH`   | `REF` adopted per O-R3; the bound is `Θ.depthBound`                                                                                                                                                                                                              | OP-22 `REF`           |
| Fable `LOOK`                 | **killed** — no §3b family, no slice term; the one use the arm named (juxtaposition strictness) is realized by `WS1` (§11 DM-2) with no operator; a registry row nothing exercises is a decoration G-2 pairs and no candidate can prove                          |                       |
| Opus `IDENT`                 | **killed as a row** — `IDENT ≝ SCAN ident 1 ∞`; ASCII case folding is a stated property of `KW`/`DISPATCH`/`LIT` (§5.1), not an operator                                                                                                                         |                       |
| Opus `NOTE`                  | **killed** — a third `D`-writer that makes "`ok:false` with a constructed `V`" expressible, which the frozen surface forbids; its slice use (the context posture) is `FAIL` with a code                                                                          |                       |

**Cost of the rejected readings, stated.** _Fable's 20 as-is_: `trailing_input` produced only by a
boundary act outside the registry (one diagnostic with no operator row — the K-3 shape for a
product); no composite relabelling; the slice's string leaves unowned (its own `CTOR` reads `S`);
one dead row (`LOOK`). _Opus's 22 as-is_: no finite back-edge (O-R3); a `D`-writer outside the
recovery path (`NOTE`); two notations counted as rows (`IDENT`, `OPT`); a manufactured totality
hole in `REP`; no hexadecimal leaf. The ratified 22 is closed: **any 23rd row is a contract
amendment by dated addendum, never a candidate's act** (§12 FF-5).

### 0.4 Folded wholesale

From the Opus arm: the A-1/CL-1 closure test (terms are data; a host function anywhere in a term
walk is red), the registry-row fingerprint (§4.6), COMP-1's a/b/c decomposition (§3), the NC-TEST
discriminator and its `StylesheetItem.children` application (§2.5), the class column for G-6's
reporter (Q-B4), the R-LAW-3 positive control, the substrate coordinates (`NESTING_LIMIT = 256`,
`state.ts:51`; `recover` at `parser.ts:679–723`), ESC-B1's framing of DM-3. From the Fable arm: the
typed-term model with σ and Θ (§2), COMP-1 as an ownership tiling (its M-0), the six complement
kinds, the four registries plus the label index, provenance on `KW`/`DISPATCH` keys, `PURE`, the
boundary BND-1, the farthest-failure diagnostic rule (spans re-ruled, §5.7), the slice terms
(corrected per F-R3/F-R4), the depth default 64 (its M-5; the corpus's maximum nesting of **8** is
X-P-W1.md R-b5, item 335), and the observation a-F1 that recovery exists to make `ok:false` total,
conservative and complete — never to manufacture `ok:true` (the frozen success arm is
`diagnostics: readonly []`, `types.ts:26`).

### 0.5 Anchors verified at true bytes before citation

`src/css/index.ts:2–34` → 33 type names; `:36–60` → 19 runtime names; **52** (double-run identical).
`src/css/types.ts:10–24` `ParseIssue`, codes at `:12–19` → **8**; `:26` the success arm
`diagnostics: readonly []`; `:27` the failure arm `readonly [ParseIssue, ...ParseIssue[]]`;
`:32–36` the four `CssTimingFunction` kinds; `:118–128` `StylesheetItem` (9 members) and
`Stylesheet`. `src/color/model.ts:29–37` `ColorIssue` → **7** codes, disjoint from the 8.
`src/css/grammar.ts:45–51` `failure()` defaults `start = 0, end = source.length`; `:138` the
percent form `value * percentScale / 100`; `:143` `value * 180 / Math.PI`; `:160` `CONTEXT_COLOR`
(**20** spellings); `:181` the R1 crash site; `:264` `transparent` → `rgb(0,0,0,0)`; `:295`
`color_non_finite` returned from `serializeCssColor`. `named-colors.ts` → **148** rows,
`transparent`/`currentcolor` absent. `n * 0.01 !== n / 100` for **114** of 1001 (double-run).
**One drift, recorded with INTENT**: `W2.md` §6 G-4 cites the substrate's `recover` at
`parser.ts:653`; at the clone-point bytes it is `typescript/src/parse/parser.ts:679–723` (the Opus
arm's R-B1, re-verified here). The gate's substance is unchanged.

---

## 1. The universe and the corpus clause

The closed input universe is the frozen 52-export surface of `@mkbabb/value.js/css`: **33 types**
(`src/css/index.ts:1–35`) + **19 runtime** (`:36–60`). W1's `harness/totality/manifest.json` is
the manifest of record (`node harness/totality/derive.mjs --check` → `manifest 52 == derived 52`);
this file's §9 maps every row of it and never carries a second manifest.

**C-CORP.** No candidate is evaluated on any corpus that is not a declared subset of this universe
plus the adjudicated fixtures: the band's R1–R5 rows held **spec-correct, never bug-compatible**;
the band's divergence ledger (`parser-band.md` L84–98) and the §10.5 third-cell rows; the GROUND-A
empty-arg cross-product (**21 heads × 10 fillings = 210**, `GROUND-A-denominator.md:207`); the R1
probe's own **18 × 9 + 10 = 172** inputs + **7** non-string; cand-F's 4,000-case mutation fuzz;
cand-O's replayable mulberry32 corpus (30,000 rows, seed pinned by `.g`). A corpus asymmetry
between candidates is a self-authored answer key and is forbidden.

---

## 2. The state — a parse is `S ↦ (V, C, P, D)`

### 2.1 The four product parts

| part                       | definition                                                                                                    | writers (closed)                                                                                                           | why separate                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **V** — semantic value     | exactly a frozen `/css` value type, **zero** extra properties; `⊥` when the parse fails                       | `CTOR` assembles; `NUM` · `DIGITS` · `TEXT` · `KW` · `DISPATCH` supply leaves                                              | `V` is assignable to the frozen type under an excess-property `tsc` fixture (G-10)                |
| **C** — byte complement    | ordered list of `(offset, length, kind)`, `kind ∈ K_C`, `length ≥ 1`                                          | `DROP`, `RECOVER` (the skipped span), the boundary (the residue)                                                           | every byte of `S` not injected into `V` has exactly one `C` owner — the accountant half of no-CST |
| **P** — provenance         | ordered list of `(start, end)`, `end > start`, one entry per byte-consuming leaf of `V` in construction order | `NUM` · `DIGITS` · `TEXT` · `KW` · `DISPATCH`                                                                              | position without tree position; an array, never a node field                                      |
| **D** — diagnostic journal | append-only ordered list of `ParseIssue` (`types.ts:10–24`, 8 codes), `expected[]` drawn from `L`             | `RECOVER` (one per recovered site) and the boundary's projection Π (exactly one on terminal failure) — **no other writer** | diagnostics are values, never effects (R-LAW-3); two writers, auditable by registry               |

The public surface projects the product: `ok ⟺ len(D) = 0 ⟺ V ≠ ⊥`; success ⇒
`{ok:true, value:V, diagnostics:[]}`; failure ⇒ `{ok:false, diagnostics:D}` with `len(D) ≥ 1`
(the non-empty tuple, `types.ts:27`, is an obligation the boundary discharges by construction,
§5.8). `C` and `P` are not exported; COMP-1 is asserted by the harness, never inferred from the
public API. There is no "ok with warnings": **recovery exists to make `ok:false` total,
conservative and complete**, never to yield `ok:true` around a defect.

### 2.2 The internal state σ

Operators are functions `σ → σ′ × (A ∣ ⊥)` on a record passed in and returned out — never a module
global:

```
σ = ⟨ i        : offset into S, 0 ≤ i ≤ len(S)
      C, P, D  : the three journals (append-only inside an operator; truncated only by TRY, RECOVER, REP)
      depth    : the REF nesting counter
      far      : the farthest-failure record ⟨f, code, labels[]⟩ (§5.6) — survives rollback
      arena    : Wasm lowering only — the value-arena watermark; the JS lowering reports 0 ⟩
```

### 2.3 The parse parameters Θ (O-8 made structural)

`Θ = ⟨ depthBound : 64 ⟩` — **exactly one field**. There is no arm flag (PT-01 folded: diagnostics
are always present), no memoization mode (PT-03 folded: no memoize operator exists), no
diagnostics level. The frozen entry signatures (`parseCssColor(source: string)` and the other
eighteen) admit no caller-supplied Θ, so the boundary binds Θ to the contract default; a lowering
may carry σ-scoped scratch tables (dropped with σ) but nothing process-global.

**O-8, checkable.** The algebra module exports no mutable binding and reads no process-global
(`globalThis`, module-level `let`/`var`, `process.env`); both lowerings' entries take `(S, Θ)` and
return the product. Structural witness: `grep -nE "^(let|var) " <algebra sources>` → 0 and the
bijection walk finds no operator with a free variable outside `(σ, Θ, its arguments)`. Runtime
witness: G-8's history-invariance and reset-residue legs. The counter-example is in the substrate at
the bytes (`packrat.ts:158` `let PACKRAT_ARMED = false`, set at `:297`, `resetPackrat()` at `:269`
not disarming; O-15 PT-03: 93.9 → 138.2 ns = 1.47×, reset leaves 139.3) and is not adopted.

### 2.4 INV-OWN — ownership is maintained at every step, not checked at the end

At every point of a parse, `[0, σ.i)` is exactly tiled by the spans of `C ∪ P` (pairwise disjoint,
complete, in `S` order). Every byte-consuming operator hands its span to exactly one owner:
`SCAN`/`LIT` yield a `Span` that **must** be consumed by `DROP` (→ `C`) or by the leaf operators
(→ `P`); a bare `Span`-typed term anywhere else is a typing error the bijection walk rejects.
`TRY`/`REP`/`RECOVER` truncate `C` and `P` to their mark when they restore `σ.i`, so the invariant
survives rollback. COMP-1 (§3) is INV-OWN at `σ.i = len(S)` plus the boundary's residue rule; a
lowering that satisfies INV-OWN cannot fail COMP-1 by accident, and a lowering that fails COMP-1 has
an operator that consumed without owning — the walk names it.

### 2.5 No CST — the discriminator (NC-TEST)

An artifact is a CST carrier iff some node type has a field typed as another **artifact** node type
whose population depends on the incidental bytes of the input (trivia, punctuation, spelling,
separator choice) — equivalently, `(V, C)` fused. The algebra's answer is structural: (1) no operator
constructs a node referring to another operator's node — `CTOR` builds `V` from a registry row whose
fields are the frozen type's fields; there is no `AlgebraNode` type; (2) every incidental byte is in
`C`, reachable only through `DROP`/`RECOVER`/the residue rule; (3) `V` is assignable to the frozen
types under an excess-property check. The construct that tests the discriminator, named rather
than hidden: `StylesheetItem` is recursive (`children: readonly StylesheetItem[]`, `types.ts:122,
123, 127`, and `Stylesheet = readonly StylesheetItem[]`). It is **not** a CST: the recursion mirrors
the specified nesting of the language's semantics, the field's type is another **frozen contract**
type, and not one incidental byte lives in it — every brace, space and comment between nested items
is in `C`. `V` may nest exactly as far as `types.ts` nests and no further. Carrier kinds (§4) have
no field that is both another carrier and a span.

---

## 3. COMP-1 — conservation and the malformed inverse, one law

> **COMP-1.** For **every** `S` in the closed universe — accepted or malformed — `weave(V, C, P) === S`,
> byte for byte.

`C` carries no bytes (its shape is `(offset, length, kind)`, fixed by `W2.md` §3b) and `V`'s leaves
cannot be re-rendered (`50%` and `0.5` construct the same leaf), so `weave` is **not a generator**:
it is the function that copies each owned interval's bytes from `S` by its owner's span, and COMP-1
is the statement that this copy is `S` — an **accounting identity** whose content is the tiling.
Both arms converged on this reading (Fable M-0; Opus's `weave` "concatenates the covered bytes");
it is ratified, and it decomposes so a violation names its sub-condition:

- **COMP-1a (completeness)** — `Ω = { [o, o+len) : (o, len, k) ∈ C } ∪ { [s, e) : (s, e) ∈ P }` covers
  `[0, len(S))`.
- **COMP-1b (disjointness)** — the intervals of `Ω` are pairwise disjoint.
- **COMP-1c (fidelity of kind)** — sorted by start, `C` and `P` interleave in `S` order, and every
  `C` entry's bytes satisfy its kind's predicate `π_k` (§4.5). A `ws` entry over `abc` fails here.

Why this is not weaker than "byte for byte": bytes skipped by recovery must land in `C.skipped` or
COMP-1a fails; a leaf claiming `50` while nothing claims `%` fails COMP-1a; a separator counted both
as leaf suffix and `punct` fails COMP-1b; a lowering that reorders leaf construction fails the
interleave; and each is a one-pass check over two sorted arrays, identical in both lowerings. The
two exported serializers (`W:color`, `W:timeline-options`, §9) are the `C`-free direction (`V` to a
canonical spelling); they are not `weave` and are never compared to it.

---

## 4. The closed operator set — **22 operators**, four registries, one label index

### 4.0 Typing

`Op<A>` for `A` in the closed carrier kinds `𝒦 = { Span, Num, Str, Unit, Tuple<…>, List<A>, Opt<A>,
T ∈ Frozen }`, `Frozen` = the 33 `/css` types and their constituent scalars (`Channel = number ∣
"none"`, `Alpha`, `JumpPosition`, the keyword unions). `Span` is `(start, end)` with no children;
`Tuple`/`List`/`Opt` hold carriers, never spans-with-children. `SEQ`'s tuple **omits** `Unit`-typed
components. Every operator has **exactly two lowerings** (JS on the combinator library's own
surface; Wasm as a zero-import routine over linear memory) and one registry row; no operator takes a
host function (CL-1: `typeof arg === "function"` anywhere in a term walk is red); there is no `bind`,
`chain`, `map(fn)`, `hostFn`, memoize, or `toString` (the substrate's `chain` at `parser.ts:127` is
not adopted). Argument kinds in the table: **T** term · **N** integer literal (`∞` admitted where
marked) · **F** f64 literal · **S** ASCII string literal · **L** label from `L` · **@R** an identifier
of registry `R` · **G** a production name of the grammar map.

### 4.1 The enumeration

| id    | operator   | arguments                                              | type          | semantics (both lowerings, observably)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | family                                              |
| ----- | ---------- | ------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| OP-01 | `SCAN`     | @R_cls cls, N min, N∞ max                              | `Op<Span>`    | consumes the maximal run of bytes in class `cls`; requires `min ≤ run ≤ max`; yields the span; **zero-width failure** `⟨css_syntax, [cls.label]⟩` at the start when `run < min` or `run > max` (the span is released)                                                                                                                                                                                                                                                                                                                                                                                             | token-class scan                                    |
| OP-02 | `LIT`      | S bytes                                                | `Op<Span>`    | matches `bytes` at `i`, ASCII case-insensitive; zero-width failure `⟨css_syntax, ["'" + bytes + "'"]⟩`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | token-class scan (fixed sequence)                   |
| OP-03 | `NUM`      | —                                                      | `Op<Num>`     | scans one css-syntax `<number-token>` (`[+-]? digits? (. digits)? ([eE] [+-]? digits)?`, ≥1 digit in the mantissa; `1.` is **not** a number, `parser-band.md` L94); converts by the JS `Number` grammar — the Wasm lowering carries its own decimal→f64 routine and must agree bit-for-bit (an EQ-1 obligation); non-finite results are values (`±Infinity`) and reach `CLAMP`/`CTOR` (DM-3); **appends `(start, end)` to P**; failure `⟨css_syntax, ["<number>"]⟩`                                                                                                                                               | value construction + provenance (leaf)              |
| OP-04 | `DIGITS`   | N radix ∈ {10, 16}, N n                                | `Op<Num>`     | exactly `n` digits in `radix`; integer value; **appends to P**; failure `⟨css_syntax, ["<hex-digit>"]⟩` or `["<digit>"]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | leaf                                                |
| OP-05 | `TEXT`     | @R_cls cls, N min, N∞ max                              | `Op<Str>`     | as `SCAN`, but **injects the bytes as a string value** (case preserved) and **appends to P** — the only leaf whose value is the bytes themselves (`Declaration.name`, `StyleRule.selectors`, `unknown.prelude`)                                                                                                                                                                                                                                                                                                                                                                                                   | leaf                                                |
| OP-06 | `KW`       | @R_cls cls, @R_kw table                                | `Op<T>`       | scans the maximal run of `cls` (min 1), ASCII-folds it, looks it up in `table` (closed, null-prototype); yields the row's value; **appends the span to P**; miss → zero-width failure `⟨table.code, [table.label]⟩` at the span's start (span released)                                                                                                                                                                                                                                                                                                                                                           | labelled zero-width failure · leaf                  |
| OP-07 | `END`      | —                                                      | `Op<Unit>`    | succeeds iff `i = len(S)`, consuming nothing; else zero-width failure `⟨trailing_input, ["end of input"]⟩` — the **only** source of that code                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | sequence (terminator)                               |
| OP-08 | `SEQ`      | T o₁ … oₙ, n ≥ 1                                       | `Op<Tuple>`   | runs in order threading σ; the first failure propagates with its origin (§5.6); **no rollback of its own** (the enclosing `TRY`/`ALT` owns the mark); yields the typed tuple minus `Unit` components                                                                                                                                                                                                                                                                                                                                                                                                              | sequence                                            |
| OP-09 | `ALT`      | T o₁ … oₙ, n ≥ 2                                       | `Op<A>`       | ordered committed choice, all arms `Op<A>`: each arm runs under an implicit `TRY`; an arm failing **before** its `CUT` restores σ and the next arm runs; an arm failing **after** its `CUT` propagates — no later arm runs; all arms fail → propagate with origin = the maximum of the arms' origins. **R-LAW-5**: `RECOVER` may appear only in the **last** arm's subtree (structural, §7)                                                                                                                                                                                                                       | ordered committed choice                            |
| OP-10 | `CUT`      | —                                                      | `Op<Unit>`    | marks the enclosing `ALT` arm committed from here; consumes nothing; illegal outside an `ALT` arm (a walk error)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | commit point                                        |
| OP-11 | `PURE`     | F ∣ S ∣ `none` ∣ `unit`                                | `Op<A>`       | consumes nothing, yields the literal; `OPT o v ≝ ALT[o, PURE v]` is a notation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | sequence (unit)                                     |
| OP-12 | `REP`      | T o, N min, N∞ max, T? sep                             | `Op<List<A>>` | iterates `o`, with `sep : Op<Unit>` between items; each `(sep, o)` pair runs under an implicit `TRY`; **progress law**: an iteration that succeeds consuming 0 bytes is discarded and the loop stops; a failing iteration restores to before its `sep` and stops; `count < min` → failure propagating the last iteration's origin; `count = max` stops. Iteration, not recursion: a 10,000-item stylesheet costs depth 0 and at most `len(S)` iterations                                                                                                                                                          | sequence (iteration)                                |
| OP-13 | `DROP`     | @K_C kind ∈ K_C ∖ {skipped, residue}, T o : `Op<Span>` | `Op<Unit>`    | runs `o`; if the span has length ≥ 1 **appends `(start, len, kind)` to C**; yields `unit`. `WS ≝ DROP ws (SCAN ws 0 ∞)` · `WS1 ≝ DROP ws (SCAN ws 1 ∞)` · `TOK b ≝ DROP punct (LIT b)` · `UNIT b ≝ DROP keyword (LIT b)` are notations                                                                                                                                                                                                                                                                                                                                                                            | span-into-C                                         |
| OP-14 | `DISPATCH` | @R_cls cls, @R_disp table                              | `Op<A>`       | scans the maximal run of `cls` (min 1), ASCII-folds, looks up `table` (closed, null-prototype, `key → term`, all terms `Op<A>`); **appends the key span to P** (a dispatch key is a semantic leaf — the `space`/`kind` field); runs the row's term; miss → zero-width failure `⟨table.code, [table.label]⟩` at the span's start. **No default arm**: an unknown head is a failure, never a fallback                                                                                                                                                                                                               | channel-table dispatch                              |
| OP-15 | `FAIL`     | @codes code, L l₁ … lₙ, n ≥ 1                          | `Op<⊥>`       | consumes nothing; fails with `code` and the labels — **the** labelled zero-width failure (debt 1); an empty label list is not constructible                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | labelled zero-width failure                         |
| OP-16 | `EXPECT`   | T o, L l₁ … lₙ, n ≥ 1                                  | `Op<A>`       | runs `o`; if `o` fails **without consuming** (origin = `o`'s start offset), the labels `o` merged at that offset are replaced by `l₁…lₙ` (§5.6); if `o` failed deeper, the failure passes through untouched                                                                                                                                                                                                                                                                                                                                                                                                       | named expectations (composite)                      |
| OP-17 | `CLAMP`    | F lo, F hi (±∞ admitted), T o : `Op<Num>`              | `Op<Num>`     | `min(max(v, lo), hi)` in that order; `"none"` passes through; NaN passes through to the `CTOR` guard (DM-3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | clamp (css-color-4 §8.1/§8.2/§9/§4.2 per `spec.ts`) |
| OP-18 | `SCALE`    | F num, F den, T o : `Op<Num>`                          | `Op<Num>`     | **`(v * num) / den`** — two IEEE-754 operations in that order, `num`/`den` f64 literals carried bit-identically in both lowerings (the registry fingerprint covers them); never a folded factor; `"none"` passes through (debt 4, F-R1)                                                                                                                                                                                                                                                                                                                                                                           | exact scale                                         |
| OP-19 | `CTOR`     | @R_ctor row, T o₁ … oₙ                                 | `Op<T>`       | runs the arguments as a `SEQ`, then applies the row's constructor to the tuple: a frozen-type value, **or** a labelled zero-width failure `⟨row.code, row.labels⟩` raised at the current offset (constructor guards: `steps` count integer ≥ 1 and `jump-none ⇒ ≥ 2`; `cubic-bezier` `x₁, x₂ ∈ [0,1]`; every colour constructor's finiteness guard, DM-3). Constructors are total functions `Tuple → T ∣ ⊥` that cannot read σ, consume bytes, or append to any journal; ASCII folding of a string leaf (`Declaration.name`) is a permitted pure operation. `o ⇒ CTOR r ≝ CTOR r [o]`                             | value construction                                  |
| OP-20 | `TRY`      | T o                                                    | `Op<A>`       | takes a mark `m = ⟨i, len(C), len(P), len(D), depth, arena⟩`; runs `o`; on failure **restores σ to `m` exactly** (truncating the three journals and the arena) and re-raises the failure; `far` alone survives (§5.6); on success passes through                                                                                                                                                                                                                                                                                                                                                                  | mark / rollback                                     |
| OP-21 | `RECOVER`  | @codes code, T o, T sync                               | `Op<Opt<A>>`  | runs `TRY o`; on success yields `some(a)`. On failure with `far = ⟨f, c, ls⟩`, from the mark `m`: runs `sync` **under discard** (whatever `sync` appends to `C`/`P` is truncated back); if `sync` fails or consumes 0 bytes → restore to `m` and propagate the original failure (**nothing appended**; R-LAW-4 progress); else (a) append `ParseIssue⟨code, start = m.i, end = i′, expected = ls, actual = S[m.i, i′)⟩` to `D`, (b) append `(m.i, i′ − m.i, skipped)` to `C`, (c) yield `none`. **Forbidden in any non-final `ALT` arm** (R-LAW-5); **admissible as a `REP` body** (a loop is not a choice, O-R4) | recover / resync with declared synchronization      |
| OP-22 | `REF`      | G name                                                 | `Op<A>`       | the **only back-edge**: refers to production `name` of the finite grammar map `G : name → term`; increments `depth` on entry, decrements on exit; `depth > Θ.depthBound` → labelled zero-width failure `⟨css_syntax, ["nesting ≤ 64"]⟩` — an ordinary `ok:false`, **never a `RangeError`** (debt 3, PT-04, G-11). Both lowerings count identically; the Wasm lowering's own stack is sized from `Θ.depthBound`, so the bound is the algebra's, not the host's                                                                                                                                                     | bounded back-edge (depth = algebra parameter)       |

**Count: 22** (`OP-01` … `OP-22`): terminals 7 (`SCAN LIT NUM DIGITS TEXT KW END`) · structure 6
(`SEQ ALT CUT PURE REP DROP`) · dispatch/failure 3 (`DISPATCH FAIL EXPECT`) · value 3
(`CLAMP SCALE CTOR`) · recovery/recursion 3 (`TRY RECOVER REF`). Notations (`WS`, `WS1`, `TOK`,
`UNIT`, `IDENT ≝ SCAN ident 1 ∞`, `OPT`, `⇒`) expand to the twenty-two; the bijection registry lists
the twenty-two and **no notation** — an expansion is not a row.

### 4.2 Capability-family coverage (`W2.md` §3b L246–251) — 13 of 13

| §3b family                                          | operator(s)                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| sequence                                            | OP-08 `SEQ` (+ OP-11 `PURE`, OP-12 `REP`, OP-07 `END`)              |
| ordered committed choice                            | OP-09 `ALT`                                                         |
| token-class scan                                    | OP-01 `SCAN`, OP-02 `LIT`                                           |
| span-into-`C`                                       | OP-13 `DROP`                                                        |
| channel-table dispatch                              | OP-14 `DISPATCH`                                                    |
| value construction with provenance append           | OP-03 `NUM`, OP-04 `DIGITS`, OP-05 `TEXT`, OP-06 `KW`, OP-19 `CTOR` |
| clamp                                               | OP-17 `CLAMP`                                                       |
| exact scale `(value * num) / den`                   | OP-18 `SCALE`                                                       |
| labelled zero-width failure with named expectations | OP-15 `FAIL`, OP-16 `EXPECT` (+ the miss paths of OP-06/OP-14)      |
| bounded back-edge (depth an algebra parameter)      | OP-22 `REF` with `Θ.depthBound`                                     |
| commit point                                        | OP-10 `CUT`                                                         |
| mark / rollback                                     | OP-20 `TRY`                                                         |
| recover / resync with declared synchronization      | OP-21 `RECOVER`                                                     |

### 4.3 What is deliberately absent, and why each absence is load-bearing

`bind`/`chain`/`flatMap` (an algebra finite on paper and open in practice — `W2.md` §12 exposure
(v)); `map(fn)` with a host closure (a one-lowering node, K-3; breaks CL-1); a `hostFn`/escape-hatch
node (AC-2's predicted failure (b), pre-forbidden); general lookahead (`LOOK`, §0.3 — `SCAN cls 0 0`
is the bounded negative lookahead for a class where one is ever needed); memoization as an operator
(PT-03's class); `debug`/`toString` (presentation, outside the algebra); a free `D`-writer (`NOTE`,
§0.3).

### 4.4 The registries (data; each row with two lowerings)

| registry                   | row shape                                         | slice contents (§10)                                                                                                                                                                                                                                                                                                                                                                                          | closure witness                                                                                                                                  |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`R_cls`** byte classes   | `{ label, table: Uint8Array(256) }`               | `ws` `{ \t\n\r\f}` · `ident` `[A-Za-z0-9_-]` (no escapes — the incumbent supports none, `grammar.ts:89–127`) · `digit` · `hexdigit` · `any-but-paren` `[^()]` · `any-but-brace-or-semi` `[^{};]` · `any-but-semi-or-close` `[^;}]` · `any-but-brace-close` `[^}]` — **8**                                                                                                                                     | the Wasm lowering embeds the same 256-byte tables in its data segment; the walk prints `sha256` of the concatenated tables per lowering          |
| **`R_kw`** keyword → value | `{ label, code, rows: {key → value} }`            | `named-color` (148, `src/css/named-colors.ts` → `Color<"rgb">`) · `transparent` (1 → `rgb(0,0,0,0)`, `grammar.ts:264`) · `context-color` (20, `grammar.ts:160` → the token `context`) · `none` (1) · `timing-keyword` (5) · `step-alias` (2) · `jump-position` (6 spellings → 4 values, `grammar.ts:457–460`) — **7 tables**                                                                                  | row count printed; a key present in one lowering's table and not the other's is the v12 misbinding shape and fails G-2                           |
| **`R_disp`** key → term    | `{ label, code, rows: {key → term} }`             | `color-head` (`rgb rgba hsl hsla oklch var` for the slice — 6 rows; W3 adds `hwb lab lch oklab color env`) · `timing-head` (`cubic-bezier steps linear` — 3) — **2 tables**                                                                                                                                                                                                                                   | as above                                                                                                                                         |
| **`R_ctor`** constructors  | `{ label, code, labels, arity, leafMap, guards }` | `rgb` `hsl` `oklch` (→ `Color<S>`, `leafMap = [space, c1, c2, c3, alpha]`) · `hex8 hex6 hex4 hex3` (→ `Color<"rgb">`) · `context` (its only result is `⟨color_context_required, ["context-free color"]⟩`) · `timing-keyword` · `step-alias` · `cubic-bezier` · `steps` · `linear-function` · `linear-stop` · `style-rule` · `declaration` · `value-color` (`CssScalar` over a colour) · `stylesheet` — **18** | arity and `leafMap` checked against the frozen type's field list by the walk; a field the frozen type lacks is an excess property and fails G-10 |
| **`L`** labels             | `string[]`, indexed                               | every `label` above + every `FAIL`/`EXPECT`/guard label the slice uses                                                                                                                                                                                                                                                                                                                                        | printed and `sha256`d; EQ-4 compares indices; the JS glue maps index → string **outside** the algebra                                            |
| **`codes`**                | the frozen 8 (`types.ts:12–19`)                   | `css_syntax` `trailing_input` `keyframe_selector_invalid` `color_context_required` `syntax_descriptor_invalid` `syntax_mismatch` `animation_option_invalid` `timeline_option_invalid`                                                                                                                                                                                                                         | a ninth code is a value.js contract change, not a W2 act (DM-3)                                                                                  |

### 4.5 `K_C` — the six complement kinds, each with a predicate `π_k`

`ws` (every byte in the `ws` class) · `comment` (`/* … */`, balanced, no nested open) · `punct` (a
single byte in `( ) , / % # ; : { } [ ] !`) · `keyword` (an ASCII-folded literal that is **not** a
leaf of `V`: `important`, a unit suffix `deg`) · `skipped` (bytes a `RECOVER` consumed — any bytes)
· `residue` (the unconsumed tail at the boundary — any bytes). A candidate that needs a seventh kind
has found a byte class the contract did not account for and returns it to the adjudicator, not to a
fallback. The Opus arm's `separator` and `case-spelling` are not kinds: a comma is `punct`, and case
spelling is a property of bytes already owned (`P` points into `S`, so spelling is preserved by
construction).

### 4.6 The bijection registry — what G-1/G-2 print, and how the v12 shape dies

Each operator carries a row in **both** lowerings:

```
(opId, name, arity, argKinds[], fingerprint, jsSymbol, wasmSymbol)
fingerprint = sha256(opId ‖ 0x00 ‖ name ‖ 0x00 ‖ arity ‖ 0x00 ‖ argKinds.join(","))
```

G-2 compares registries, not counts: (i) same length, (ii) same order, (iii) `fingerprint[i]` equal
pairwise, (iv) `jsSymbol[i]` and `wasmSymbol[i]` both present. **The v12 shape — 18 declared ids
over a 20-formula domain, misbound not absent — fails (iii) even when (i) passes.** A hole is
declared, never absent: a row with no Wasm symbol is written `wasmSymbol: DECLARED-ABSENT` with a
reason, so the pairing is visibly broken rather than silently short — and it is K-3. Registry rows
(`R_cls` tables, `R_kw`/`R_disp` keys, `R_ctor` arity/leafMap, `L`, and every `SCALE`/`CLAMP` f64
literal) are fingerprinted the same way. The contract's own rows, machine-readable (`.g`'s
`op-bijection.mjs --structural` reads this block):

```algebra-registry
OP-01 SCAN     cls,N,N∞
OP-02 LIT      S
OP-03 NUM      -
OP-04 DIGITS   N,N
OP-05 TEXT     cls,N,N∞
OP-06 KW       cls,kw
OP-07 END      -
OP-08 SEQ      T+
OP-09 ALT      T+
OP-10 CUT      -
OP-11 PURE     lit
OP-12 REP      T,N,N∞,T?
OP-13 DROP     kind,T
OP-14 DISPATCH cls,disp
OP-15 FAIL     code,L+
OP-16 EXPECT   T,L+
OP-17 CLAMP    F,F,T
OP-18 SCALE    F,F,T
OP-19 CTOR     ctor,T*
OP-20 TRY      T
OP-21 RECOVER  code,T,T
OP-22 REF      G
```

The contract text contains no target-conditional and imports neither lowering; G-1's grep (its
pattern quoted at `W2.md` §6 L686) ranges over `experiments/w2/*/`, which includes this file's
`<p2>` home, and this file is written so that grep returns 0 hits over it.

---

## 5. Semantics both lowerings must reproduce observably

### 5.1 Case and bytes

`LIT`, `KW` and `DISPATCH` fold ASCII case (`A–Z → a–z`) and nothing else; `TEXT` preserves case;
the incumbent folds `Declaration.name` (measured: `A { Color : RED !important }` → name `"color"`,
selectors `["A"]`), which the `declaration` constructor reproduces as a pure operation. Input is a
JS string; the algebra sees UTF-16 code units in the JS lowering and UTF-8 bytes in the Wasm
lowering — **offsets in `C`, `P`, `D` are code-unit offsets into `S`** in both, so the Wasm glue
converts once at the boundary and the products compare directly. Non-ASCII bytes belong to no
class but `any-but-*`; the slice corpus is ASCII, and W3 declares the non-ASCII posture.

### 5.2 `ALT`, `CUT`, `TRY`

Each `ALT` arm runs under an implicit `TRY`. A `CUT` inside an arm sets the arm committed; a
committed arm's failure propagates out of the `ALT` **without restoring σ** (the consumed bytes stay
owned by `C`/`P`, INV-OWN intact); an uncommitted arm's failure restores and the next arm runs.
`far` (§5.6) is never restored by any rollback. A `CUT` is scoped to its nearest enclosing `ALT`
arm, through `SEQ`/`CTOR`/`EXPECT`/`DROP` but not through `TRY`, `REP`, `RECOVER` or `REF` (those
open a new scope; a `CUT` directly under them is a walk error).

### 5.3 `REP`

See OP-12. The restored-before-`sep` rule means `1, 2,` yields two items and leaves `,` for the
continuation (which then fails with `expected` naming what may follow).

### 5.4 `RECOVER`

See OP-21. "Under discard" is exact: `sync` is any term; its own journal writes are truncated to the
mark and the whole consumed span becomes **one** `skipped` entry. Nested recovery is admissible
(`REF` into a production that recovers); each site appends exactly one issue (R-LAW-4).

### 5.5 Progress and totality by construction

Every loop consumes ≥1 byte per iteration or stops (`REP` progress law; `RECOVER`'s `sync` ≥1
byte); every back-edge counts `depth` against `Θ.depthBound`; every leaf failure is zero-width and
every operator is total on its typed input. A parse therefore terminates in `O(len(S) · G)` steps
for a fixed grammar, with no host recursion limit ever reached; K-7 is discharged structurally, and
G-11's row (`var(var(…))` nested past 10,000) returns `ok:false` at depth 65 in both lowerings.

### 5.6 The failure record `far` and the merge rule (EQ-4 depends on this being exact)

A raised failure is `⟨x, code, label⟩` at origin offset `x` (the failing operator's start).
`far = ⟨f, code, labels[]⟩` is updated on every raise: `x > f` → `far := ⟨x, code, [label]⟩`;
`x = f` → append `label` if absent (order preserved; `code` unchanged — the first code raised at `f`
wins); `x < f` → ignored. A propagating failure carries its origin `x`: `SEQ` propagates its child's;
`ALT` (all arms failed) propagates `max` of the arms' origins; `TRY`, `REP`, `CTOR`, `DROP`, `KW`,
`DISPATCH`, `RECOVER`(when passing through) preserve it; `REF`'s depth failure originates at `i`.
`EXPECT o ls`: let `F₀ = far` before `o` and `i₀ = i`; if `o` fails with origin `i₀`, then
`far := F₀` and the raise `⟨i₀, code, l⟩` is performed for each `l ∈ ls` in order (so if `F₀.f > i₀`
the relabel is ignored, correctly); otherwise the failure passes through. `far` survives every
rollback (it is the only σ field that does).

### 5.7 The terminal projection Π (the boundary's one `D` write)

On terminal failure (the entry production fails or leaves `i < len(S)` — impossible with `END` in
the entry, but the rule is stated for totality), Π appends exactly one issue:
`⟨far.code, start = far.f, end = len(S), expected = far.labels, actual = S.slice(far.f) ∣∣ null⟩`
(the `∣∣ null` is the incumbent's own convention, `grammar.ts:57`). This is a **declared third-cell
divergence** from the incumbent, whose `failure()` reports `start = 0, end = source.length`
(`grammar.ts:50–51`, measured: `red x` → `(0, 5)`, `expected: ["color"]`) — DM-6.

### 5.8 The boundary BND-1 — above the algebra, shared by both lowerings

Each parsing runtime export is `ENTRY(prod)`, a JS function that (1) if `typeof source !== "string"`
returns `{ok:false, diagnostics:[⟨css_syntax, 0, 0, ["<string>"], null⟩]}` **without constructing
σ** — the algebra never sees a non-string, so the Wasm lowering (bytes in) needs no counterpart; this
is why BND-1 is not an operator and K-3 does not apply (PT-07; measured: the incumbent throws a raw
`TypeError` on 7 of 7 non-string shapes); (2) builds σ over `S` with Θ; (3) runs `prod`; (4)
**closes the tiling**: if `i < len(S)`, appends `(i, len(S) − i, residue)` to `C`; (5) on failure,
applies Π; (6) if `len(D) = 0` returns `{ok:true, value: V, diagnostics: []}` with `V` deep-frozen
(DM-1), else `{ok:false, diagnostics: D}` — `len(D) ≥ 1` by construction (Π appends one; recovery
appended ≥1). **A throw escaping `ENTRY` is K-8; no `try/catch` exists in `ENTRY`** (DM-4). The
Wasm lowering's `ENTRY` marshals `S` in, runs the module, reads `(V, C, P, D, far, arena)` out, and
materializes `V` from the arena — the same six steps.

---

## 6. The six equality products (EQ-1..EQ-6) — comparison per product

Mechanism (all six): a **canonical structural serialization** per product, byte-compared across the
JS lowering, the Wasm lowering, and (third cell) the vendored sha-pinned published 4.0.0
(`dist/subpaths/css.js` = `8b5381305ea26236326f06a38559247b2089a5be7fa78abe43640d0556320c42`, W1's
copy). The serializer is one function in the harness (`.g`'s), never per candidate.

| id   | product           | canonical serialization                                                                                                                                                                                                                                                | "exact" means                                                                                                                                                                                | the falsifier the comparison must survive                                                                                                                                                                                                                                                                  |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EQ-1 | `V`               | frozen-type-directed walk, field order = the frozen type's declaration order (`types.ts`); every f64 as 8 bytes big-endian **with every NaN canonicalized to `7FF8000000000000` and `−0` preserved**; strings length-prefixed UTF-8; `"none"` a tag byte; `⊥` one byte | **`Object.is` per f64 channel** — `−0 ≠ 0`, all NaN equal (F-R2)                                                                                                                             | `===` passes a candidate disagreeing on `−0`; a payload-sensitive form kills a correct pair on Wasm's nondeterministic NaN payloads                                                                                                                                                                        |
| EQ-2 | `C`               | `(offset u32, length u32, kind u8)*` in list order                                                                                                                                                                                                                     | same order, same triples; COMP-1 holds on both (checked first)                                                                                                                               | a candidate merging two adjacent spans of different kind passes a weave-only check and fails the triple check                                                                                                                                                                                              |
| EQ-3 | `P`               | `(start u32, end u32)*` in list order                                                                                                                                                                                                                                  | leaf construction order must match — `R_ctor.leafMap` fixes it                                                                                                                               | a candidate building `V` bottom-up in one lowering and top-down in the other has identical `V` and different `P`                                                                                                                                                                                           |
| EQ-4 | `D`               | `(code u8, start u32, end u32, n u16, labelIdx u16 × n, actualTag u8)*` in journal order; `actual` is derivable from `(start, end, S)` and compared as presence                                                                                                        | **structural, never rendered strings**; labels compared as indices into `L`; a lowering whose labels appear only under an "armed" mode has no such mode to be in — Θ has no arm flag (PT-01) | a rendered-string comparison differs by number formatting alone; a label-set comparison hides ordering drift; the incumbent transports a `ColorIssue` code through the label slot (`rgb(0 0 0 / 200%)` → `expected: ["color_out_of_range"]`), which the third cell will show and the two lowerings may not |
| EQ-5 | rollback          | after every `TRY` failure in the corpus, the tuple `⟨i, len(C), len(P), len(D), depth, arena⟩` post-restore vs the mark; the JS lowering reports `arena = 0`; the count of sites must also agree                                                                       | value equality per site; **cost asymmetry declared, not equalized** — G-8 prints the two lowerings' rollback cost as separate rows                                                           | a candidate restoring four of five coordinates leaks a span and passes COMP-1 by accident on the next input                                                                                                                                                                                                |
| EQ-6 | malformed inverse | COMP-1a/b/c on every `ok:false` input; the sorted `Ω` printed as `(start, end, owner)*`                                                                                                                                                                                | the tiling passes in both **and** EQ-2/EQ-3's bytes agree                                                                                                                                    | a candidate skipping bytes without entering `C` fails COMP-1a and names the interval; double coverage fails COMP-1b                                                                                                                                                                                        |

EQ-1 across the **two lowerings** admits no divergence (K-1). Third-cell divergences are declared
rows (§10.5), never silent expectations and never a candidate's bug.

---

## 7. The five recovery laws — each an executable probe (G-4)

| law                                                             | statement (binding)                                                                                                                                                                                                                       | probe (fails for its intended reason)                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R-LAW-1** rollback exactness                                  | for every `TRY` that fails, post-restore `⟨i, len(C), len(P), len(D), depth, arena⟩` equals the mark; `far` alone survives; the lowerings may differ in **cost** (arena truncation vs an allocation-free failing path) but never in value | instrument every `TRY` site over slice + R1 + fuzz; print `(sites, mismatches)` per lowering; **positive control**: a harness-side mutant skipping the `P` truncation must print `mismatches > 0` or the probe is decorative                                                                                                                                                                                             |
| **R-LAW-2** complement conservation                             | bytes consumed by `RECOVER`'s `sync` appear as one `C.skipped` entry; COMP-1 holds on every malformed input                                                                                                                               | run COMP-1a/b/c on every `ok:false` row; print the first uncovered or doubly-owned byte; positive control: a mutant `RECOVER` omitting step (b) must fail                                                                                                                                                                                                                                                                |
| **R-LAW-3** diagnostic purity                                   | no operator emits an effect; `D` is the only diagnostic channel                                                                                                                                                                           | monkey-patch `console.error`, `console.warn`, `console.log`, `process.stdout.write` to **throw**; run the full corpus in both lowerings; any throw fails. Positive control (Opus arm, measured): the pinned 4.0.0 over 11 rows prints 0; the clone-point substrate prints unconditionally once armed (`parser.ts:66–68`, `utils.ts:6`) — the probe can fire and does not fire spuriously                                 |
| **R-LAW-4** non-amplification + progress                        | `N` malformed sites ⇒ exactly `N` issues; a `sync` consuming 0 bytes fails the recovery instead of re-entering                                                                                                                            | rows with `N ∈ {1, 2, 3, 5, 8}` planted sites → `len(D) = N` printed per row; a `sync` of `SCAN any-but-semi-or-close 0 ∞` planted at a `;` matches 0 bytes at offset 0 of the failure — the probe asserts termination within 1 s and the propagated failure (a hang or `N²` fails). The substrate's `RecoveryNonProgress` fault (`parser.ts:707–711`) is the mechanism without the assertion; this law is the assertion |
| **R-LAW-5** `alt`/`recover`, **declared: `recover-final-only`** | `RECOVER` is forbidden in any non-final `ALT` arm (a recovered arm succeeds with `none` and starves later arms); it is admissible as a `REP` body and in a final arm; the bijection walk enforces it structurally                         | `op-bijection.mjs --structural` prints `RECOVER-in-nonfinal-ALT: 0`; the negative-control grammar `ALT[RECOVER(a), b]` prints `1` and exits non-zero. Cost of the rejected reading (`recover-declared`): a totality property that depends on a per-site declaration a reviewer must read rather than a structure a walk can check, and (O-R4) no construct in the slice or the universe needs it                         |

---

## 8. The debts and postures — contract clauses, each with its provenance

| #               | clause (binding on every candidate)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | provenance · measured                                                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-1**         | every failure a `KW`/`DISPATCH` miss, `FAIL`, `EXPECT` or `CTOR` guard raises carries **named expectations** from `L`; `expected: []` and any regex-derived expectation are forbidden (`grep -c '(?!)' <algebra + grammar sources>` → 0)                                                                                                                                                                                                                                                                                                                                                                                                 | `parser-band.md` "WHAT CAND-O OWES CAND-F" item 1; the incumbent's distance measured by the Opus arm: 6 of 25 rejections with `expected: []`, 1 carrying a `ColorIssue` code in the label slot |
| **D-2**         | the reject path is its own measured leg (`reject-non-throwing`) in W1's bench; head-dispatch order and early `CUT` after the head are the declared knobs; **no averaging across legs**; a reject-path number without its own row is not a number                                                                                                                                                                                                                                                                                                                                                                                         | band item 2; `W2.md` §6 G-7; W1's bar ledger owns the arithmetic (epoch rule)                                                                                                                  |
| **D-3**         | recursion bounded **by construction**: `REF` is the only back-edge, `depth` the only counter, `Θ.depthBound` the parameter; the slice has exactly two `REF` sites (`balanced-tail`, `value-slice`); any `try/catch` shield exists only if the raw-σ-over-corpus instrument (cand-O's, held binding) proves it non-load-bearing (K-7, DM-4). The emergent ceiling is **shape-dependent** and not a contract property: 7,761 (`W2.md` G-11) / 7,759 (W1, F-1) / 256 (`NESTING_LIMIT`, `state.ts:51`, a returned failure) / 1,048,575 (a linear `lazy` chain) — four coordinates, one substrate; only the declared parameter is contractual | band item 3; O-15 PT-04; X-P-W1.md R-8; Opus arm A.7                                                                                                                                           |
| **D-4**         | `SCALE num den` is `(v * num) / den` with f64 literals — the incumbent's `value * percentScale / 100` association and cand-O's `(value * percentRef) / 100`; a folded factor (`* 2.55`, `* 0.004`) is a defect. Pinned at the vendored 4.0.0 over the 1001-value domain: rgb `(v*255)/100`, hsl s/l `(v*1)/100`, oklch L `(v*1)/100`, oklch C `(v*0.4)/100`, alpha `(v*1)/100`, hex alpha `(a*1)/255`, `grad` `(v*0.9)/1`, `turn` `(v*360)/1`, `rad` `(v*180)/π`, linear-stop `(v*1)/100` — **0 of 1001 divergences on each**; `n * 0.01 !== n / 100` for **114** of 1001 is why the form is law                                         | band item 4 (_"2.55 is inexact in binary; 100% must be exactly 255"_); `spec.ts` header; F-R1                                                                                                  |
| **D-5**         | the GROUND-A empty-arg class is a **generated** cross-product in `.g`'s corpus — 21 heads × 10 fillings = 210 — plus the R1 probe's 18 × 9 + 10 = 172; never hand-listed; every row `ok:false` with a named expectation                                                                                                                                                                                                                                                                                                                                                                                                                  | band item 5; `GROUND-A-denominator.md:207`; `r1-published-totality.mjs`                                                                                                                        |
| **PT-01**       | diagnostics are products of the algebra (`D`), present on every parse; Θ has no arm flag; a lowering whose `expected[]` is empty unless something is "armed" reads diagnostics-ABSENT and fails EQ-4                                                                                                                                                                                                                                                                                                                                                                                                                                     | INBOX O-15 PT-01; the coupling at the clone-point bytes `parser.ts:66–68`                                                                                                                      |
| **PT-03 / O-8** | no process-global mutable state, no one-way latch, no memoize operator                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | INBOX O-15 PT-03 (1.47×, reset leaves 139.3); `packrat.ts:158/224/269/273/297`; §2.3                                                                                                           |
| **PT-07**       | non-string inputs die at BND-1 as `ok:false` with one `css_syntax` issue — never a raw `TypeError`; `.parse()`-truthiness entry is forbidden (the substrate's `parse()` returns `undefined` for a failure **and** for a successful `undefined`, `parser.ts:74–76`)                                                                                                                                                                                                                                                                                                                                                                       | INBOX O-15 PT-07; band R1 table (published 7/7 non-string throw)                                                                                                                               |
| **R1**          | zero throws over the 172 + 7; every rejection carries ≥1 issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | band L23–31 (published `parseCssColor` **102/172 + 7/7**); the crash site `grammar.ts:181`; `W2.md` §6 G-5 (X-P-W2.md B.1 reproduces 324/1,548 at HEAD)                                        |
| **band**        | hue **unwrapped** at parse time (`hsl(480 …)` → 480; measured at the incumbent: `[480, 0.5, 0.5]`); clamps per cand-O's `spec.ts` (rgb `[0,255]`, hsl/hwb s,l,w,b `[0,1]`, lab/lch L `[0,100]`, oklab/oklch L `[0,1]`, lch/oklch C `[0,∞)`, lab/oklab a,b and `color()` unclamped, alpha `[0,1]`); legacy comma forms for `rgb/rgba/hsl/hsla` only; a bare `<number>` for hsl/hwb s/l/w/b **is a percentage** (R6, `numberIsPercentage`); non-finite per DM-3; juxtaposition per DM-2                                                                                                                                                    | `parser-band.md` L15, L84–98, L104; `spec.ts`                                                                                                                                                  |

---

## 9. The totality contract — 52 → named production, ∅ both ways, holes declared

**Classes** (one per row, carried into G-6's reporter as its own column — Opus Q-B4, ratified): **P**
= parse production (`S` to `(V, C, P, D)`, an algebra subject with two lowerings) · **V** =
vocabulary (the codomain of an `R_ctor` row, or a constituent reached inside one) · **K** = algebra
carrier (the ruler, not the measured) · **W** = serializer (`V` to a canonical spelling; the
`C`-free direction) · **X** = value projection (`V` to `V′`). **W and X rows are the declared holes
of the algebra**: nine runtime exports that are realized **once, in TypeScript, over `V`**, with no
Wasm lowering obligation because they parse no bytes — except row 51, which re-enters `P` through
`W` (O-R2) and is declared as such. They are **in the map, never absent**; their owner is
**X.P.W3** (`typescript/src/css/**`), and each names the condition under which it would become a
`P` row (it would not: a projection over `V` reads no `S`). A **row grammar** the reporter parses:
`^\|\s*(\d+)\s*\|\s*\`(\w+)\`\s*\|\s*(type|runtime)\s*\|\s*([PVKWX])\s*\|\s*\`([^\`]+)\`\s\*\|`
(cells 1–5: number, export, kind, class, production).

| #   | export                       | kind    | class | production                     | slice                                          | note                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------- | ------- | ----- | ------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `AnimationRangeValue`        | type    | V     | `V:animation-range-value`      | —                                              | codomain of `P:animation-range`                                                                                                                                                                                                                                                                                                                                                          |
| 2   | `AnimationTimelineValue`     | type    | V     | `V:animation-timeline-value`   | —                                              | codomain of `P:animation-timeline`                                                                                                                                                                                                                                                                                                                                                       |
| 3   | `AnimationTriggerValue`      | type    | V     | `V:animation-trigger-value`    | —                                              | constructed inside `P:stylesheet` (`parseAnimationTrigger`, `stylesheet.ts:53`, run at `:422`); a field of `V:timeline-options` (`types.ts:105`); reached by `X:timeline-options` and `W:timeline-options` (O-R1)                                                                                                                                                                        |
| 4   | `CSSAnimationOptions`        | type    | V     | `V:animation-options`          | —                                              | codomain of `X:animation-options`                                                                                                                                                                                                                                                                                                                                                        |
| 5   | `CSSPropertyDescriptor`      | type    | V     | `V:property-descriptor`        | —                                              | inside `P:stylesheet` (`property` item)                                                                                                                                                                                                                                                                                                                                                  |
| 6   | `CSSTimelineOptions`         | type    | V     | `V:timeline-options`           | —                                              | codomain of `X:timeline-options`; domain of `W:timeline-options`                                                                                                                                                                                                                                                                                                                         |
| 7   | `CollectedRule`              | type    | V     | `V:collected-rule`             | —                                              | the X-class envelope                                                                                                                                                                                                                                                                                                                                                                     |
| 8   | `CssColor`                   | type    | V     | `V:color`                      | **slice**                                      | codomain of `P:color`; domain of `W:color`                                                                                                                                                                                                                                                                                                                                               |
| 9   | `CssColorSpace`              | type    | V     | `V:color-space`                | slice (6 of 13 keys)                           | the `space` leaf; `R_disp color-head` keys (13 spellings, `types.ts:6–8`)                                                                                                                                                                                                                                                                                                                |
| 10  | `CssLinearStop`              | type    | V     | `V:linear-stop`                | **slice**                                      | inside `P:timing-function` (`linear-function` arm)                                                                                                                                                                                                                                                                                                                                       |
| 11  | `CssTimingFunction`          | type    | V     | `V:timing-function`            | **slice**                                      | codomain of `P:timing-function`, 4 kinds                                                                                                                                                                                                                                                                                                                                                 |
| 12  | `CustomFunctionDescriptor`   | type    | V     | `V:custom-function-descriptor` | —                                              | inside `P:stylesheet` (`function` item)                                                                                                                                                                                                                                                                                                                                                  |
| 13  | `CustomFunctionParameter`    | type    | V     | `V:custom-function-parameter`  | —                                              | inside `V:custom-function-descriptor`                                                                                                                                                                                                                                                                                                                                                    |
| 14  | `CustomFunctionRule`         | type    | V     | `V:custom-function-rule`       | —                                              | `P:stylesheet` item kind `function`                                                                                                                                                                                                                                                                                                                                                      |
| 15  | `Declaration`                | type    | V     | `V:declaration`                | **slice**                                      | `declaration` ctor; domain of `X:declarations`                                                                                                                                                                                                                                                                                                                                           |
| 16  | `KeyframeRule`               | type    | V     | `V:keyframe-rule`              | —                                              | inside `V:keyframes-block`                                                                                                                                                                                                                                                                                                                                                               |
| 17  | `KeyframeSelector`           | type    | V     | `V:keyframe-selector`          | —                                              | codomain of `P:keyframe-selector`                                                                                                                                                                                                                                                                                                                                                        |
| 18  | `KeyframesBlock`             | type    | V     | `V:keyframes-block`            | —                                              | `P:stylesheet` item kind `keyframes`                                                                                                                                                                                                                                                                                                                                                     |
| 19  | `ParseIssue`                 | type    | K     | `K:issue`                      | —                                              | the element type of `D` (8 codes; every code has a named site: `css_syntax` scans/`FAIL`/guards · `trailing_input` `END` · `keyframe_selector_invalid` `P:keyframe-selector` · `color_context_required` `context` ctor · `syntax_descriptor_invalid`/`syntax_mismatch` `P:syntax-coerce` · `animation_option_invalid`/`timeline_option_invalid` `P:stylesheet`'s declaration validators) |
| 20  | `ParseResult`                | type    | K     | `K:result`                     | —                                              | the boundary's projection of `(V, D)` (§5.8); `C` and `P` are not exported                                                                                                                                                                                                                                                                                                               |
| 21  | `PropertyRule`               | type    | V     | `V:property-rule`              | —                                              | `P:stylesheet` item kind `property`                                                                                                                                                                                                                                                                                                                                                      |
| 22  | `RangeBoundary`              | type    | V     | `V:range-boundary`             | —                                              | inside `V:animation-range-value`                                                                                                                                                                                                                                                                                                                                                         |
| 23  | `RangePhase`                 | type    | V     | `V:range-phase`                | —                                              | `R_kw range-phase` (7)                                                                                                                                                                                                                                                                                                                                                                   |
| 24  | `ScrollTimelineDescriptor`   | type    | V     | `V:scroll-timeline-descriptor` | —                                              | `P:stylesheet` item kind `scroll-timeline`                                                                                                                                                                                                                                                                                                                                               |
| 25  | `ScrollerKeyword`            | type    | V     | `V:scroller-keyword`           | —                                              | `R_kw scroller` (3)                                                                                                                                                                                                                                                                                                                                                                      |
| 26  | `StyleRule`                  | type    | V     | `V:style-rule`                 | **slice**                                      | `style-rule` ctor (the qualified rule)                                                                                                                                                                                                                                                                                                                                                   |
| 27  | `Stylesheet`                 | type    | V     | `V:stylesheet`                 | slice (recovery scenario)                      | codomain of `P:stylesheet`                                                                                                                                                                                                                                                                                                                                                               |
| 28  | `StylesheetItem`             | type    | V     | `V:stylesheet-item`            | slice (`style` only)                           | the 9-member union (`types.ts:118–127`); the slice's `rule` is `qualified-rule` alone (§10.3)                                                                                                                                                                                                                                                                                            |
| 29  | `TimelineAxis`               | type    | V     | `V:timeline-axis`              | —                                              | `R_kw axis` (4)                                                                                                                                                                                                                                                                                                                                                                          |
| 30  | `TimelineScopeValue`         | type    | V     | `V:timeline-scope-value`       | —                                              | constructed inside `P:stylesheet` (`parseTimelineScope`, `:44`); reached by `X:timeline-options`                                                                                                                                                                                                                                                                                         |
| 31  | `TriggerType`                | type    | V     | `V:trigger-type`               | —                                              | `R_kw trigger` (4)                                                                                                                                                                                                                                                                                                                                                                       |
| 32  | `ViewInset`                  | type    | V     | `V:view-inset`                 | —                                              | inside `V:animation-timeline-value` (`view` arm)                                                                                                                                                                                                                                                                                                                                         |
| 33  | `ViewTimelineDescriptor`     | type    | V     | `V:view-timeline-descriptor`   | —                                              | `P:stylesheet` item kind `view-timeline`                                                                                                                                                                                                                                                                                                                                                 |
| 34  | `parseCssColor`              | runtime | P     | `P:color`                      | **slice — deep**                               | §10.1                                                                                                                                                                                                                                                                                                                                                                                    |
| 35  | `parseCssScalar`             | runtime | P     | `P:scalar`                     | — (W3)                                         | `ALT[dimension, percentage, number, keyword]`; calls `P:color` first at the incumbent — the R1 blast radius                                                                                                                                                                                                                                                                              |
| 36  | `parseCssValue`              | runtime | P     | `P:value`                      | — (W3; `value-slice` is its slice restriction) | `ALT[color, scalar, call, list]`; `call` reuses `balanced-tail`                                                                                                                                                                                                                                                                                                                          |
| 37  | `parseCssValues`             | runtime | P     | `P:value-list`                 | — (W3)                                         | `REP value 1 ∞ (WS, TOK ",", WS)`                                                                                                                                                                                                                                                                                                                                                        |
| 38  | `parseKeyframeSelector`      | runtime | P     | `P:keyframe-selector`          | — (W3)                                         | code `keyframe_selector_invalid`                                                                                                                                                                                                                                                                                                                                                         |
| 39  | `parseTimingFunction`        | runtime | P     | `P:timing-function`            | **slice — whole**                              | §10.2                                                                                                                                                                                                                                                                                                                                                                                    |
| 40  | `serializeCssColor`          | runtime | W     | `W:color`                      | —                                              | **hole (W)**: `CssColor → Result<string, ColorIssue>` — a different issue union (`model.ts:29–37`); owner W3                                                                                                                                                                                                                                                                             |
| 41  | `coerceToSyntax`             | runtime | P     | `P:syntax-coerce`              | — (W3)                                         | two inputs `(source, syntax)`: a production parameterised by a `<syntax>` descriptor; codes `syntax_descriptor_invalid`, `syntax_mismatch`                                                                                                                                                                                                                                               |
| 42  | `parseAnimationRange`        | runtime | P     | `P:animation-range`            | — (W3)                                         | `SEQ[range-boundary, OPT(SEQ[WS1, range-boundary])]`                                                                                                                                                                                                                                                                                                                                     |
| 43  | `parseAnimationTimeline`     | runtime | P     | `P:animation-timeline`         | — (W3)                                         | `DISPATCH timeline-head {auto, none, scroll, view} + name`                                                                                                                                                                                                                                                                                                                               |
| 44  | `serializeTimelineOptions`   | runtime | W     | `W:timeline-options`           | —                                              | **hole (W)**; serializes `AnimationTriggerValue` at `timeline.ts:101`; owner W3                                                                                                                                                                                                                                                                                                          |
| 45  | `collectAnimationOptions`    | runtime | X     | `X:animation-options`          | —                                              | **hole (X)**: `Declaration[] → CSSAnimationOptions[]`, pure over `V` (`stylesheet.ts:827–873`, no parse call); owner W3                                                                                                                                                                                                                                                                  |
| 46  | `collectCustomFunctions`     | runtime | X     | `X:custom-functions`           | —                                              | **hole (X)**: `Stylesheet → CollectedRule<CustomFunctionRule>[]`; owner W3                                                                                                                                                                                                                                                                                                               |
| 47  | `collectDeclarations`        | runtime | X     | `X:declarations`               | —                                              | **hole (X)**: `Declaration[] → ReadonlyMap`; owner W3                                                                                                                                                                                                                                                                                                                                    |
| 48  | `collectKeyframes`           | runtime | X     | `X:keyframes`                  | —                                              | **hole (X)**; owner W3                                                                                                                                                                                                                                                                                                                                                                   |
| 49  | `collectPropertyDescriptors` | runtime | X     | `X:property-descriptors`       | —                                              | **hole (X)**; owner W3                                                                                                                                                                                                                                                                                                                                                                   |
| 50  | `collectStyleRules`          | runtime | X     | `X:style-rules`                | —                                              | **hole (X)**; owner W3                                                                                                                                                                                                                                                                                                                                                                   |
| 51  | `collectTimelineOptions`     | runtime | X     | `X:timeline-options`           | —                                              | **hole (X, re-entrant)**: `Declaration[] → CSSTimelineOptions`, but at the bytes it serializes `V` and re-parses through `P:animation-range` (×3), `P:timeline-scope`, `P:animation-trigger` (`stylesheet.ts:874–890`) — O-R2; W3 rules whether the seed reads `V` directly or retains the `W ∘ P` re-entry, and names it either way                                                     |
| 52  | `parseStylesheet`            | runtime | P     | `P:stylesheet`                 | **slice — the recovery scenario**              | §10.3                                                                                                                                                                                                                                                                                                                                                                                    |

**Set differences.** Universe − map = ∅ (52 rows, one per `index.ts` name in file order); map −
universe = ∅ (no row names an export absent from `index.ts:1–60`). By class: **V 31 · K 2 · P 10 · W
2 · X 7** (types 31 + 2 = 33; runtime 10 + 2 + 7 = 19). **Holes declared: 9** (W 2 + X 7), each
owner-named; vocabulary holes: **0** (HOLE-1 dissolved, O-R1). Re-derivable from the settled bytes
by the row grammar above (this seat's receipts carry the double-run). **G-6 posture**: this map
**reports**, it does not cure — the inherited baseline is \*\*0 TOTAL / 3 PARTIAL / 16 ABSENT runtime

- 33 types ABSENT** (GATE-VERDICT P-2) and the fresh root's own distance is **0 / 0 / 52 ABSENT**
  (W1's `derive.mjs`, `p2-native`); this file claims **no verb\*\* for any row (OP-8); the survivor's
  slice rows reach their verb only by the reporter's re-run assay.

---

## 10. The shared slice as terms (§3d; identical across candidates)

Notation: `WS ≝ DROP ws (SCAN ws 0 ∞)` · `WS1 ≝ DROP ws (SCAN ws 1 ∞)` · `TOK b ≝ DROP punct (LIT b)`
· `UNIT b ≝ DROP keyword (LIT b)` · `IDENT ≝ SCAN ident 1 ∞` · `OPT o v ≝ ALT[o, PURE v]` ·
`o ⇒ CTOR r ≝ CTOR r [o]` · `o ⇒ SCALE n d ≝ SCALE n d o`. Every line expands to the twenty-two
operators and the registries. Each entry production ends in `END`.

### 10.1 `P:color` (`parseCssColor` deep)

```
color         := SEQ[WS, EXPECT(ALT[hex, named, transparent, context, functional], "<color>"), WS, END]
hex           := SEQ[TOK "#", ALT[ CTOR hex8 [D2, D2, D2, D2], CTOR hex6 [D2, D2, D2],
                                   CTOR hex4 [D1, D1, D1, D1], CTOR hex3 [D1, D1, D1] ]]
                 D2 ≝ DIGITS 16 2 · D1 ≝ DIGITS 16 1 · hex4/hex3 double the nibble (v*17); alpha = SCALE 1 255
named         := KW ident named-color                    (148 rows → Color<"rgb">, alpha 1)
transparent   := KW ident transparent                    (→ rgb(0,0,0,0); NOT a named-color row, grammar.ts:264)
context       := CTOR context [KW ident context-color]   (20 spellings → ⟨color_context_required, ["context-free color"]⟩)
functional    := DISPATCH ident color-head {
   rgb ∣ rgba : SEQ[TOK "(", CUT, WS, ALT[modern-rgb, legacy-rgb], WS, TOK ")"]  ⇒ CTOR rgb
   hsl ∣ hsla : SEQ[TOK "(", CUT, WS, ALT[modern-hsl, legacy-hsl], WS, TOK ")"]  ⇒ CTOR hsl
   oklch      : SEQ[TOK "(", CUT, WS, ok-l, WS1, ok-c, WS1, hue, alpha-slash, WS, TOK ")"] ⇒ CTOR oklch
   var        : SEQ[TOK "(", CUT, balanced-tail, TOK ")"] ⇒ CTOR context      (ONE context node; the value is the failure) }
modern-rgb    := SEQ[rgb-ch, WS1, rgb-ch, WS1, rgb-ch, alpha-slash]
legacy-rgb    := SEQ[rgb-ch, sep, rgb-ch, sep, rgb-ch, OPT(SEQ[sep, alpha]) 1]
rgb-ch        := CLAMP 0 255 (ALT[ SEQ[NUM, TOK "%"] ⇒ SCALE 255 100,  NUM,  KW ident none ])
modern-hsl    := SEQ[hue, WS1, pct-ch, WS1, pct-ch, alpha-slash]
legacy-hsl    := SEQ[hue, sep, pct-only, sep, pct-only, OPT(SEQ[sep, alpha]) 1]
hue           := ALT[ SEQ[NUM, UNIT "deg"]  ⇒ SCALE 1 1,     SEQ[NUM, UNIT "grad"] ⇒ SCALE 0.9 1,
                      SEQ[NUM, UNIT "rad"]  ⇒ SCALE 180 π,   SEQ[NUM, UNIT "turn"] ⇒ SCALE 360 1,
                      NUM,  KW ident none ]                  (UNWRAPPED — 480 stays 480; π = 3.141592653589793)
pct-ch        := CLAMP 0 1 (ALT[ SEQ[NUM, TOK "%"] ⇒ SCALE 1 100,  NUM ⇒ SCALE 1 100,  KW ident none ])   (R6)
pct-only      := CLAMP 0 1 (ALT[ SEQ[NUM, TOK "%"] ⇒ SCALE 1 100,  KW ident none ])
ok-l          := CLAMP 0 1 (ALT[ SEQ[NUM, TOK "%"] ⇒ SCALE 1 100,  NUM,  KW ident none ])
ok-c          := CLAMP 0 ∞ (ALT[ SEQ[NUM, TOK "%"] ⇒ SCALE 0.4 100,  NUM,  KW ident none ])   (100% = 0.4, grammar.ts:220)
alpha-slash   := OPT(SEQ[WS, TOK "/", WS, alpha]) 1
alpha         := CLAMP 0 1 (ALT[ SEQ[NUM, TOK "%"] ⇒ SCALE 1 100,  NUM,  KW ident none ])   (§4.2: 1.5 → 1)
sep           := SEQ[WS, TOK ",", WS]
balanced-tail := REP (ALT[ SEQ[TOK "(", REF balanced-tail, TOK ")"],  DROP keyword (SCAN any-but-paren 1 ∞) ]) 0 ∞
```

Juxtaposition (DM-2): `WS1` between modern channels is the **strict** reading; the band's
token-stream reading (accept `rgb(50%20%30%)`) is `WS` there — the slice adopts the band's reading
(`WS`) and the flip is one notation, no operator; the corpus row is declared either way. The
GROUND-A cross-product (`rgb()`, `rgb( )`, `rgb(/)`, … 210 rows) falls through `CUT` into the
channel `ALT`s, each yielding one issue with named expectations and a tiled `C`; no path reaches
`grammar.ts:181`'s `undefined`. Every colour constructor guards finiteness on unclamped channels
(DM-3).

### 10.2 `P:timing-function` (`parseTimingFunction` whole — the second value shape)

```
timing        := SEQ[WS, EXPECT(ALT[ CTOR timing-keyword [KW ident timing-keyword],
                                     CTOR step-alias [KW ident step-alias],
                                     DISPATCH ident timing-head {
                                       cubic-bezier : SEQ[TOK "(", CUT, WS, NUM, sep, NUM, sep, NUM, sep, NUM, WS, TOK ")"]
                                                      ⇒ CTOR cubic-bezier      (guard x1, x2 ∈ [0,1] → ⟨css_syntax, ["x1 in [0,1]", "x2 in [0,1]"]⟩)
                                       steps        : SEQ[TOK "(", CUT, WS, NUM, OPT(SEQ[sep, KW ident jump-position]) "jump-end", WS, TOK ")"]
                                                      ⇒ CTOR steps             (guards: integer ≥ 1; jump-none ⇒ ≥ 2)
                                       linear       : SEQ[TOK "(", CUT, WS, REP linear-stop 2 ∞ sep, WS, TOK ")"]
                                                      ⇒ CTOR linear-function } ],
                                "<timing-function>"), WS, END]
linear-stop   := CTOR linear-stop [NUM, REP (SEQ[WS1, NUM, TOK "%"] ⇒ SCALE 1 100) 0 2]   (input: [] ∣ [n] ∣ [n, n])
```

`types.ts:32–36`'s four kinds ↔ four constructor rows; `JumpPosition`'s four values ↔ the six
spellings of `R_kw jump-position` (`grammar.ts:457–460`); `step-start`/`step-end` → `steps` with
count 1 (measured at the incumbent).

### 10.3 `P:stylesheet` — the malformed qualified rule (the recovery scenario)

```
stylesheet    := SEQ[ REP (SEQ[WS, RECOVER css_syntax rule sync-rule]) 0 ∞, WS, END ] ⇒ CTOR stylesheet
rule          := qualified-rule                            (DECLARED SLICE RESTRICTION: the at-rule arm is W3's; inputs whose
                                                            prelude begins with "@" are excluded from the slice corpus)
qualified-rule:= CTOR style-rule [ TEXT any-but-brace-or-semi 1 ∞, TOK "{", CUT,
                                   REP declaration 0 ∞ (SEQ[WS, TOK ";", WS]), OPT(SEQ[WS, TOK ";"]) unit, WS, TOK "}" ]
                 (the ctor splits selectors on top-level "," and trims — a pure string operation; measured: selectors ["A"])
declaration   := CTOR declaration [ WS, TEXT ident 1 ∞, WS, TOK ":", CUT, WS, REF value-slice,
                                    OPT(SEQ[WS, TOK "!", WS, UNIT "important"]) unit, WS ]
                 (ctor folds the name; `important` = whether the OPT arm matched; measured: name "color", important true)
value-slice   := CTOR value-color [REF color-body]        (DECLARED SLICE RESTRICTION of P:value: the frozen CssScalar
                                                            {kind:"scalar", payload:{type:"color", value}} the incumbent emits
                                                            for a colour declaration; W3 replaces it with P:value)
color-body    := EXPECT(ALT[hex, named, transparent, context, functional], "<color>")   (color without WS/END — the one shared body)
sync-rule     := ALT[ SEQ[SCAN any-but-semi-or-close 1 ∞, OPT(ALT[LIT ";", LIT "}"]) unit],  LIT ";",  LIT "}" ]
                 (≥ 1 byte by construction — R-LAW-4 progress; runs under discard, one C.skipped entry)
```

The scenario `a { color: red } GARBAGE ) ; b { color: blue }`: the first rule parses; `GARBAGE ) ;`
fails `rule` at the `;` before any `CUT` (`TEXT` eats `GARBAGE ) `, `TOK "{"` fails, origin at the
`;`); `RECOVER` runs `sync-rule` from the mark, consuming `GARBAGE ) ;` into one `C.skipped` entry
and appending one `⟨css_syntax, start = m, end = m + 12, expected = ["'{'"], actual = "GARBAGE ) ;"⟩`;
the loop continues, the second rule parses; the product is `ok:false` with `len(D) = 1`, and `Ω`
tiles the whole input (EQ-6). A second garbage site gives `len(D) = 2` (R-LAW-4). The incumbent has
no recovery — measured: one issue at `(13, 38)`, `expected: ["rule"]`, the rest of the input as
`actual` — a declared third-cell divergence (§10.5 (j)). The positive control `a{color:red}` →
`ok:true` with the frozen `StyleRule` shape (measured at the incumbent, §0.1 F-R4).

### 10.4 Expected values (inherit the band verbatim; every arithmetic form pinned at the incumbent)

Hue unwrapped; clamps per `spec.ts` (§8 band row); `hsl(120 50 50) ≡ hsl(120 50% 50%)` → `[120,
0.5, 0.5]` (R6 — the incumbent's `[120, 50, 50]` is a declared divergence); every `SCALE` literal
above reproduces the incumbent bit-for-bit over the 1001-value domain (§8 D-4: 0 divergences on
each of the ten forms); `rad` → `(v*180)/π`, measured `oklch(50% 50% 1rad)` → `57.29577951308232`.

### 10.5 Third-cell declared divergence rows (carried into `.g`'s corpus; never silent expectations)

(a) issue spans — Π's `[f, len(S))` and `RECOVER`'s `[m, m + skip)` vs the incumbent's `[0,
len(S))` (DM-6); (b) legacy 4-arg `rgba(1, 2, 3, 0.5)` / `hsla(…)` — incumbent **rejects** (band
GAP P-012/P-015; measured); (c) clamps — incumbent unclamped (`rgb(300 -20 3)` → `[300, −20, 3]`;
`oklch(1.5 -1 30)` → `[1.5, −1, 30]`) and rejects `alpha > 1` where §4.2 clamps; (d) the seven
unsound accepts the incumbent admits (`rgb(1,2,3,)`, `rgb(1 2 3 / )`, `rgb(1, 2 3)`, `hsl(120%, …)`,
`lch(50% 50% 50%)`, `rgb(1. 2 3)`, `hwb(120, 30%, 40%)` — band L86–95) which the algebra rejects;
(e) juxtaposition — incumbent rejects all three rows (measured), the band's reading accepts (DM-2);
(f) `1e400` — incumbent rejects outright (`lab(50 1e400 0)` → `css_syntax`, `expected: []`), the
algebra clamps where a clamp exists and rejects unclamped non-finite with a named label (DM-3); (g)
R6 bare-number hsl s/l; (h) named expectations where the incumbent has `expected: []` (6 of 25
measured) or a `ColorIssue` code in the label slot; (i) W1's R-9 rows — A-F2 `color-mix()`
(incumbent rejects; the slice rejects too, with `<color>` — labels differ) and D-F2 `@@@ { }`
(incumbent accepts as `unknown`; `@`-preludes are excluded from the slice corpus by the §10.3
restriction, so the row is not compared in W2); (j) recovery — `N` sites give the incumbent 1 issue
and the algebra `N`; (k) `trailing_input` where the incumbent reports `css_syntax` (`red x`).

---

## 11. Declared marks — rows, never silent picks; each with its owner-escalation path

| id       | mark                                                                                    | ratified position                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | measured today                                                                                                                                                                                                                                             | escalation path                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DM-1** | runtime `Object.freeze` on `V`                                                          | **NORMATIVE at the boundary** — `ENTRY` deep-freezes `V` on success; the algebra's constructors do not freeze (the Wasm arena is immutable by construction); G-8 measures the freeze as its own leg                                                                                                                                                                                                                                                                                                                                                                                                          | the vendored 4.0.0 **deep-freezes** every sampled `V`: `Object.isFrozen` true on `value`, `value.channels`, `stops`, `stops[1]`, `stops[1].input`, the sheet, `item[0]`, `declarations` (8 of 8); cand-O paid 1.01–1.02× (band, cited)                     | owner may rule freezing non-normative; the single flip site is `ENTRY` step (6); the frozen `Readonly<…>` types are unaffected either way                                                                                                                                                                                                                                                                                                         |
| **DM-2** | token juxtaposition width                                                               | the band's **token-stream reading** (accept `rgb(50%20%30%)`, `rgb(1.5.5 3)`, `hsl(120 50%50%)`) is realized with `WS` between modern channels; the strict reading is `WS1` — one notation, no operator; the dissent (cand-F strict; the incumbent strict) is **preserved, not settled**                                                                                                                                                                                                                                                                                                                     | the incumbent rejects all three (`ok:false css_syntax`, measured)                                                                                                                                                                                          | **owner** (`parser-band.md` DISSENT: _"the owner may still overrule toward strictness"_); until ruled the rows stay declared in `.g`'s corpus and never become a silent expectation                                                                                                                                                                                                                                                               |
| **DM-3** | non-finite numerals, and the cross-union binding gap (both arms found it: a-F2, ESC-B1) | the band's **posture** stands: clamp where a clamp exists (`rgb(1e400 0 0)` → 255), reject an unclamped non-finite channel. The band's **code** `color_non_finite` is a `ColorIssue` code (`model.ts:31`, 7 codes) and **not constructible** on the frozen `ParseIssue` union (`types.ts:12–19`, 8 codes); the only lawful binding is ratified as the **interim contract row every phase-4 seat implements identically**: the colour constructor's finiteness guard raises `⟨css_syntax, ["<finite-number>"]⟩` — a named expectation (D-1), not a smuggled code. This rules the _binding_, not the _posture_ | `lab(50 1e400 0)` → incumbent `css_syntax`, `expected: []`; `rgb(0 0 0 / 200%)` → `expected: ["color_out_of_range"]` (a `ColorIssue` code already riding a label slot in shipped code); `serializeCssColor` returns `color_non_finite` at `grammar.ts:295` | **owner**, two questions: (i) GROUND-C — are `±Infinity` admitted at all (band DISSENT); (ii) a ninth `ParseIssue` code on the frozen surface is a value.js `src/css/types.ts` change routed through X·V (L1/L5 surfaces), outside every X·P bound — if granted, the guard's code flips in one `R_ctor` cell and the label stays. ESC-B1's ask (_"before phase 4 dispatches"_) is discharged by this row: three seats cannot invent three answers |
| **DM-4** | the `try/catch` shield                                                                  | **NONE**: with `REF` counted and `REP` iterating there is no unbounded recursion (D-3); a candidate that adds a shield must run the raw-σ-over-corpus instrument (cand-O's, binding) and prove it non-load-bearing (K-7)                                                                                                                                                                                                                                                                                                                                                                                     | the substrate's own depth route returns a failure, never throws (`enterLazy`, `state.ts:111–124`); W1's `Parser.lazy` ceiling (7,759) is a thrown `RangeError` on a different shape                                                                        | owner (band DISSENT: _"if the wave lands with the depth-bounded tail, cand-F's position becomes tenable"_ — that condition is met structurally here); `.h` records whether removal is ruled or carried                                                                                                                                                                                                                                            |
| **DM-5** | `Θ.depthBound` default                                                                  | **64**: the 403-string oracle corpus's maximum bracket nesting is **8** (X-P-W1.md R-b5, item 335); 64 is 8× that; G-11's `var(var(…))` past 10,000 returns `ok:false` at depth 65 in both lowerings                                                                                                                                                                                                                                                                                                                                                                                                         | the emergent ceilings (D-3) are 256 / 7,759 / 7,761 / 1,048,575 by shape — none contractual                                                                                                                                                                | ratified here as the contract default; the owner may re-set; W3 re-ratifies for stylesheet nesting (`@scope` children) with its own measured corpus                                                                                                                                                                                                                                                                                               |
| **DM-6** | issue span rule                                                                         | Π `[far.f, len(S))`, `RECOVER` `[m, m + skip)`; a declared third-cell divergence on every rejected input                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | incumbent `[0, len(S))` (`grammar.ts:50–51`; `red x` → `(0, 5)`)                                                                                                                                                                                           | ratified; no owner ruling needed — the published span is a documented default, not a contract                                                                                                                                                                                                                                                                                                                                                     |
| **DM-7** | hsl/hwb bare `<number>` for s/l/w/b                                                     | **is a percentage** (R6; cand-O `numberIsPercentage`; css-color-4 §8.2/§8.3) → `hsl(120 50 50)` = `[120, 0.5, 0.5]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | incumbent `[120, 50, 50]` (band R6 _"two spec-identical spellings disagree 100×"_; measured)                                                                                                                                                               | ratified as the band's adjudication; a declared divergence row                                                                                                                                                                                                                                                                                                                                                                                    |
| **DM-8** | the exact-scale literals                                                                | f64 literals per `spec.ts`/the incumbent (F-R1); `(v * num) / den`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 0 of 1001 divergences on each of ten forms (§8 D-4)                                                                                                                                                                                                        | ratified; the Fable arm's integer-only reading is recorded as the rejected reading with its cost (370/1001 on oklch chroma alone)                                                                                                                                                                                                                                                                                                                 |

---

## 12. The candidate field, fixed (`W2.md` §3c L304–407; grown never)

The field is **exactly four live candidates and two pre-killed non-candidates**. Each candidate is
a distinct answer to _"how does one algebra become two artifacts?"_; each hosts this contract's
twenty-two operators, the registries and the §10 slice **unchanged**, and is measured against the
falsifier written here before any measurement. Directories per `W2.md` §4; Stage-0 assignment of the
third admitted seat's home is recorded in `W2-CLOSE.md`.

| id       | name                     | the architecture in one sentence                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | predicted failures (§3c, dispositioned by `.h`)                                                                                                                                                              | Stage-0 falsifier (verbatim from `W2.md` §3c)                                                                                                                                                   | home                                                             |
| -------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **AC-1** | TAGLESS-TWIN             | the grammar is authored once against a typed signature of the 22 operations; lowering-JS instantiates it with the combinator library's own constructors (the interpretation IS the shipped parser); lowering-Wasm instantiates the same signature with an emitter assembling a zero-import module                                                                                                                                                                                                   | (a) signature leak (K-2) · (b) megamorphic IC collapse on the short-string leg (`--trace-ic`, G-7) · (c) continuation inexpressibility for `TRY`/`RECOVER` (K-3/K-4)                                         | _"a 20-line signature sketch of `recover`/`rollback` that cannot be given a Wasm-emitting instantiation on paper → killed"_                                                                     | `experiments/w2/ac1-tagless/**`                                  |
| **AC-2** | CLOSED-IR                | the algebra as a finite closed union of IR node kinds (this file's 22, no fallback kind), the grammar one authenticated datum; **the seat declares its lowering moment** — build-time emit (IR → TS on the combinator surface + Wasm bytes) or init-time compile (IR → combinator graph at module init, the primary mode); parse-time interpretation is the named degeneration, and landing there is the kill                                                                                       | (a) double-interpretation tax · (b) the escape-hatch node (K-3; CL-1 makes it unconstructible) · (c) label/PC drift (the 18-vs-20 defect structurally; G-2) · (d) toolchain capture in build-time mode (K-9) | _"the IR node set for the slice grammar exceeds its own declared closure, or the init-time compiler's totality cannot be demonstrated for `recover` → killed"_                                  | `experiments/w2/ac2-closed-ir/**`                                |
| **AC-3** | SPAN-ALGEBRA             | a branchless char-class scanner (the `R_cls` tables; scalar JS shaped for auto-vectorization; the identical tables under `v128` or scalar fallback in Wasm) produces spans that the algebra's terminals (`SCAN`/`TEXT`/`KW`/`DISPATCH`) consume; the scanner is a combinator-library citizen (`typescript/src/**`, branch `w2/ac3-scan-union`); **the seat declares its posture** — SIMD/scalar full lowering vs leaf-wasm (wasm scan leaves, parse in JS — a weaker question, recorded either way) | (a) token-boundary divergence at the juxtaposition rows and numeric edges (`1.`, `1e400`) · (b) short-string inversion (per-leg print) · (c) the boundary eats the win · (d) arena latch (K-6)               | _"measured mean boundary cost per leaf call ≥ 20 % of the whole-parse budget on a grammarless microbench → killed (a screen threshold internal to candidate selection, NOT a performance bar)"_ | `experiments/w2/ac3-span/**` + `typescript/src/**` on its branch |
| **AC-4** | SIBLINGS-ORACLE          | no compiler: cand-O's four-file TypeScript architecture (1,209 lines, band-measured: 112 + 223 + 480 + 200 + 194) and a zero-import Wasm sibling, both consuming the **same machine-readable table** (this file's registries — `R_cls`, `R_kw`, `R_disp`, `R_ctor`, `L`, the `SCALE`/`CLAMP` literals — extracted from one source); the algebra is normative as specification + table + differential oracle                                                                                         | (a) drift with nothing to stop it (30,001) · (b) maintenance doubles · (c) the one-algebra claim thins (K-2/K-3 bind the table; every semantic decision must be a table row)                                 | _"any semantic decision in the slice demonstrably NOT expressible as a table row consumed by both siblings → killed"_                                                                           | `experiments/w2/ac4-siblings/**` (RESERVE slot if not admitted)  |
| **NC-0** | GENERATOR                | the BUILD-V12 shape (one builder emitting both targets) — **pre-killed by citation**: v1–v11 + the v12 predicate-closure inconsistency (18 declared predicate ids over a 20-formula domain, misbound not absent; handoff §5); revival requires resume-protocol steps 3–7 plus a separate owner release no W2 seat may grant itself                                                                                                                                                                  | —                                                                                                                                                                                                            | not evaluated                                                                                                                                                                                   | —                                                                |
| **NC-1** | WASM-PRIMARY, DERIVED JS | the algebra written once in Rust with the JS target derived mechanically — **pre-killed definitionally**: the surviving hypothesis requires JS _source-direct on the combinator library's own surface_; a derived typed-array interpreter is the generated-source posture the pause killed (handoff §3.2: 1,965,705 bytes, target ABSENT) and fails G-10 on arrival                                                                                                                                 | —                                                                                                                                                                                                            | not evaluated; no spike is spent on a tautology                                                                                                                                                 | —                                                                |

**Field-fix clauses (binding so phase 4 cannot re-scope):**

- **FF-1** — the ids, names and directories above are closed; no fifth live candidate, no renamed
  candidate, no merged candidate. Two or more Stage-0 kills → `W2.md` §3a triumvirate, halt.
- **FF-2** — each candidate's Stage-2 registry (§4.6) must be **exactly** these 22 rows with these
  fingerprints in this order, both lowerings; a 23rd row, a missing row, or a row with one symbol is
  the v12 shape and is killed unmeasured (G-2, K-2/K-3). A capability a candidate finds it needs is
  returned to the adjudicator as a finding — never added.
- **FF-3** — the slice is §10 verbatim, including its two declared restrictions (`rule :=
qualified-rule`; `value-slice`); a candidate's expected values are the band's (§10.4); the
  third-cell rows of §10.5 are declared in `.g`'s corpus once, for all candidates.
- **FF-4** — declared postures are recorded **before** measurement in each seat's `VERDICT.md`: AC-2
  its lowering moment; AC-3 its scan posture (SIMD/scalar vs leaf-wasm); AC-4 the table's
  provenance and the proof that every §10 semantic decision is a row of it.
- **FF-5** — no seat edits this file, W1's instruments, `.g`'s harness or its own falsifier; the
  only lawful text change after `.c` is `.h`'s appended `§Selected`. A candidate that "needs" a
  contract change has produced a finding for `.h`, carried as a declared-divergence row.
- **FF-6** — the RESERVE (the fourth survivor of Stage 0, ranked by falsifier margin) enters only if
  an admitted candidate dies structurally at Stage 2, before any timing — the sole entry rule.
- **FF-7** — every declared mark of §11 is implemented at its ratified position by every candidate;
  a candidate that flips a mark has re-litigated a ruled matter (§3c) and the flip is a defect, not a
  design choice.

**The stated prior, carried to be scored** (`W2.md` §3c, verbatim): _"AC-3 dies on its predicted
boundary/inversion failures, AC-4 survives Stage 0 but loses the one-algebra argument at Stage 2/3,
and AC-1 or AC-2 survives — AC-2 preferred if its init-time compile is total."_ The kill ledger
scores it CONFIRMED / REFUTED per clause; a wave that ends confirming its author's prior with no
surprises should be suspected of having measured the prior instead of the candidates.

---

## 13. What G-1 and G-6 read from this file (self-check at the settled bytes)

- **G-1 (ratified-contract half)**: the operator set is enumerated with a count (**22**, §4.1, and
  the `algebra-registry` block of §4.6); the contract imports neither lowering and contains no
  target-conditional (the G-1 grep, run over this file, returns 0); the two homes are sha256-equal
  (this seat's receipts carry both digests). The structural half (`op-bijection.mjs --structural`)
  is `.g`'s to build and turns when the harness exists.
- **G-6 (mapping half)**: 52 rows, ∅ both ways, the class column, 9 declared holes with owners, 0
  vocabulary holes; **no verb claimed** (OP-8). The reporter joins by the §9 row grammar against
  W1's manifest and never a second manifest.
- **Sub-gate §5 `.c`**: named refutations recorded (§0.1 F-R1..F-R4, §0.2 O-R1..O-R4); every §3
  debt clause survives into the ratified text (§8); the operator↔lowering bijection is printable
  (§4.6); the declared marks are rows with escalation paths (§11); the field is fixed (§12).

_Ratified 2026-09-17 by `X.P.W2.c` (served model `claude-fable-5-1`), the second Fable sitting of
`W2.md` §5; read-only against every tree but its two homes; `/Users/mkbabb/Programming/parse-that`,
`~/.codex`, `~/Documents/Codex`, every frozen root, glass-ui, value.js `src/**`, W1's instruments and
the two sealed author arms untouched. The blind drafts remain beside this file, unchanged._

---

## §Selected — the field after adjudication (appended 2026-09-17 by `X.P.W2.h`; FF-5's one lawful post-`.c` text change)

The adjudication of record is `docs/tranches/X/parse-that/waves/W2-KILL-LEDGER.md`; this section
records its outcome beside the ratified contract and changes no clause above.

| id   | terminal verb         | rule · number                                                                                                                                                      |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-1 | SURVIVES-TO-W3 (tied) | K-1..K-4, K-6..K-10 not hit; K-5 unevaluable (G-7 has no cell-registration surface in W1's bench)                                                                  |
| AC-2 | SURVIVES-TO-W3 (tied) | as AC-1                                                                                                                                                            |
| AC-3 | KILLED(K-3)           | 12 of 22 operators' control flow has one lowering (JS) for both targets; the parse structure was never lowered to Wasm — the posture §12 names "a weaker question" |
| AC-4 | KILLED(K-2)           | carrier-analog: 7 of 65 slice decisions not expressible as §4.4 rows (Stage 0)                                                                                     |

**Selected architecture: OWNER-OWED (E-1).** AC-1 and AC-2 are a measured tie on every kill rule
this wave can evaluate; the owner names the survivor or orders Stage 4 so K-5 can. Until that word,
`.i` does not open and §12's field stands as above.

**Contract defects the ledger returns to this file's owner, as dated addenda-beside (E-3), before
either survivor can read G-3 green:** E-2 §4.5 × §10.1 (`DROP keyword` over `balanced-tail`'s
bytes — 2,035 rows / 2,047 COMP-1c occurrences in every lowering; three measured cures) · E-3 §5.2
× §10.1–10.3 (`CUT` under `DISPATCH`/`REP`/`RECOVER`; the two §10.3 `CUT`s measured inert) · E-4
§10.2 (`ALT` order makes `linear(…)` unreachable; `DISPATCH` arm first) · E-5 §2.2/§6 EQ-5 (the
sixth coordinate) · E-8 §10.3 × §8 D-3 (`REF` count). No clause above is edited by this append.
