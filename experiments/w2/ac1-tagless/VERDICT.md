SERVED MODEL: claude-opus-5[1m]

# AC-1 **TAGLESS-TWIN** — the seat's verdict (X.P.W2.d)

One grammar, authored once against a typed signature of twenty-two operations; two instantiations of
that signature — one that builds parse-that parsers, one that assembles a zero-import WebAssembly
module — and a third that builds JSON terms for the walk. `W2.md` §3c's question is whether that
survives contact with the §3d slice. It did, with two REDs that this seat traces to the contract's
own text and reports rather than patches.

Everything below is a reading of a command that ran; each is headed by the command. Every count was
taken from settled bytes and **double-run** (§6's table carries both runs' verdict lines).

- **home** `<p2>/.worktrees/ac1/experiments/w2/ac1-tagless` · branch `w2/ac1` (§4b)
- **substrate** `node v26.0.0 · v8 14.6.202.33-node.19 · darwin arm64`; `<p2>` worktree `81370815c595`,
  base `f5757082`; third cell `@mkbabb/value.js@4.0.0 /css`, vendored, sha `8b53813…320c42` == pinned
- **locks honoured** the Stage-2 bijection is printed in §2 **before the first timing number in this
  file** (§6's G-8 row and nothing earlier); one `<p2>` commit on its own branch; `CARGO_TARGET_DIR`
  unused (no Rust is elected); no gate took a third diagnose→edit→re-measure iteration.

---

## 1. The three predicted failures, probed FIRST

`W2.md` §3c names them: *signature leak · megamorphic IC collapse on the short-string leg ·
continuation inexpressibility*. They were probed before the gates, and two of the three FIRED — one
against the candidate's boundary (cured at the root, before/after pasted) and one against the
CONTRACT rather than the candidate.

### PF-1 — signature leak · **NOT OBSERVED**

⟨`node experiments/w2/ac1-tagless/probes/predicted-failures.mjs`⟩

```
algebra sources                     4
  ../algebra/ops.mjs           imports: (none)
  ../algebra/tables.mjs        imports: (none)
  ../algebra/grammar.mjs       imports: ./tables.mjs
  ../reify/term-alg.mjs        imports: ../algebra/grammar.mjs
algebra → lowering imports          0  (a leak here is the predicted failure)
target-conditional tokens (K-2)     0
operations the grammar destructures 22 — SCAN LIT NUM DIGITS TEXT KW END SEQ ALT CUT PURE REP DROP DISPATCH FAIL EXPECT CLAMP SCALE CTOR TRY RECOVER REF
outside the ratified 22             none
unused by the grammar               none
one buildGrammar for all three      yes — imported from algebra/grammar.mjs by the terms, the JS lowering and the Wasm lowering alike
REF back-edges the slice declares   balanced-tail, value-slice (§8 D-3)
```

and, at the other end of the same claim:

```
js.grammar() === wasm.grammar()     yes (byte-identical term data)
label index aligned                 true
```

**Recorded honestly: the first reading of the K-2 grep was 3, not 0.** The regex
`/isWasm|target\s*===|TARGET_JS|TARGET_WASM/` matched three *dispatch-target* variables named
`target` (`js-alg.mjs` ×1, `wasm-alg.mjs` ×2) — `const target = disp.rows[key]; if (target ===
undefined)`. No branch on a lowering target existed then or now; the token collided. The variables
were renamed (`toName`, `to`, `rowNames`), behaviour unchanged, and the reading is 0. **The
before-reading is published here rather than quietly re-run** — and the false-positive class is
filed for `.h` as **F-6**.

### PF-2 — megamorphic IC collapse on the short-string leg · **OBSERVED — but not where predicted**

The flag the brief names does not exist on the served runtime:

⟨`node --trace-ic …`⟩ → `node: bad option: --trace-ic` (node v26.0.0). Its documented successor is
used instead and the substitution is declared: ⟨`node --v8-options | grep log-ic`⟩ →
`--log-ic (Log inline cache state transitions for tools/ic-processor)`.

Method: the same 20,000-parse short-string leg (`entry("rgb(1 2 3)")`) is run twice per lowering —
once module-load-only, once with the loop — and the IC sites that reach **N (megamorphic)** are
diffed, so Node's own loader sites are subtracted rather than counted.

⟨`node --log-ic --logfile=… icrun.mjs` then the load-only diff⟩

```
JS LOWERING
  N-sites: module-load only = 48 ; load + 20,000 short-string parses = 49
  N-sites introduced BY THE PARSE LOOP:
    KeyedLoadIC@73:51|channels            ← values.mjs:73 `for (const key of Object.keys(v)) deepFreeze(v[key]);`
  parse-loop sites by final state: 336 monomorphic · 13 polymorphic · 1 megamorphic

WASM LOWERING (before)
  N-sites: load only = 42 ; +20,000 parses = 59
  N-sites introduced BY THE PARSE LOOP: 17
    KeyedLoadIC@252:41 × 15  (keys: ok i depth clen plen dlen markn recn root ovf amb arena farf farcode farn)
    KeyedLoadIC@347:51|channels      ← the boundary's deepFreeze
    KeyedStoreIC@227:61|channels     ← the decoder's dynamic-key record construction
```

The prediction was that **the combinator dispatch** collapses. It does not: the JS lowering's
~1,270 distinct parser objects leave the parse loop at 336 monomorphic / 13 polymorphic / **1**
megamorphic site, and that one site is **DM-1's deep-freeze walk**, which the contract makes
normative at the boundary and which G-8 measures as its own leg.

The 15 that were the candidate's own fault were **cured at the root, not reported around**: the
result block's fields were read as `RESULT[field]` (a keyed load over fifteen string keys) inside
`parse`; they are constants, and are now constant-index loads bound once at module scope. Re-measured:

```
WASM LOWERING (after)
  N-sites: load only = 42 ; +20,000 parses = 44
  N-sites introduced BY THE PARSE LOOP: 2
    KeyedLoadIC@368:51|channels      ← deepFreeze (DM-1; the JS lowering has the same site)
    KeyedStoreIC@249:61|channels     ← materializing a record with data-driven keys
```

17 → 2, and the two survivors are the contract's freeze mark and the inherent cost of turning an
arena record into a JS object. The differential was re-run after the edit: still 0 divergences
(§4).

### PF-3 — continuation inexpressibility · **OBSERVED — against the CONTRACT, not the candidate**

⟨`node experiments/w2/ac1-tagless/probes/predicted-failures.mjs`⟩

```
terms                               29
operations exercised                ALT CLAMP CTOR CUT DIGITS DISPATCH DROP END EXPECT KW LIT NUM PURE RECOVER REF REP SCALE SCAN SEQ TEXT
CL-1 closure leaks                  0
CUT outside an ALT arm (§5.2)       7
RECOVER in a non-final arm (R-LAW-5)0
unowned Span terms (INV-OWN)        0
unresolved REF targets              0
host closures required              0 — the grammar's only inputs are the twenty-two and the registries
```

No host closure was needed anywhere; four places where §10's letter could not be transcribed are
declared in §9 and every one of them was expressible **within** the twenty-two. **One thing was
not.** §10.3 writes

```
qualified-rule:= CTOR style-rule [ TEXT any-but-brace-or-semi 1 ∞, TOK "{", CUT, … ]
declaration   := CTOR declaration [ WS, TEXT ident 1 ∞, WS, TOK ":", CUT, … ]
```

and OP-10 says a `CUT` is "**illegal outside an `ALT` arm (a walk error)**", §5.2 adding that
`TRY`/`REP`/`RECOVER`/`REF` open a new scope. Both sites sit under `REP`/`RECOVER`, never under an
`ALT`. The walk therefore reads 7 hits (two distinct contract sites; the map carries `rule`,
`qualified-rule`, the copy inlined in `stylesheet`, and `declaration`).

**It cannot be cured inside the algebra.** The only construct that opens a `CUT` scope is `ALT`, and
OP-09 fixes its arity at **n ≥ 2** — a one-arm `ALT` is not in the signature. So §10.3's committed
prefix is inexpressible **legally**: the contract asks for a commit point where its own rule forbids
one. That is PF-3, landing on the contract. Filed as **F-2**; it is G-1's structural RED (§6).

---

## 2. Stage 2 — the operator bijection, printed BEFORE any timing

⟨`node harness/w2/op-bijection.mjs --candidate ac1`⟩ — run from the worktree root, unedited.

```
contract  name      js row          jsSymbol     wasm row        wasmSymbol     pairing
OP-01     SCAN      OP-01 SCAN      js:SCAN      OP-01 SCAN      wasm:SCAN      ok
OP-02     LIT       OP-02 LIT       js:LIT       OP-02 LIT       wasm:LIT       ok
OP-03     NUM       OP-03 NUM       js:NUM       OP-03 NUM       wasm:NUM       ok
OP-04     DIGITS    OP-04 DIGITS    js:DIGITS    OP-04 DIGITS    wasm:DIGITS    ok
OP-05     TEXT      OP-05 TEXT      js:TEXT      OP-05 TEXT      wasm:TEXT      ok
OP-06     KW        OP-06 KW        js:KW        OP-06 KW        wasm:KW        ok
OP-07     END       OP-07 END       js:END       OP-07 END       wasm:END       ok
OP-08     SEQ       OP-08 SEQ       js:SEQ       OP-08 SEQ       wasm:SEQ       ok
OP-09     ALT       OP-09 ALT       js:ALT       OP-09 ALT       wasm:ALT       ok
OP-10     CUT       OP-10 CUT       js:CUT       OP-10 CUT       wasm:CUT       ok
OP-11     PURE      OP-11 PURE      js:PURE      OP-11 PURE      wasm:PURE      ok
OP-12     REP       OP-12 REP       js:REP       OP-12 REP       wasm:REP       ok
OP-13     DROP      OP-13 DROP      js:DROP      OP-13 DROP      wasm:DROP      ok
OP-14     DISPATCH  OP-14 DISPATCH  js:DISPATCH  OP-14 DISPATCH  wasm:DISPATCH  ok
OP-15     FAIL      OP-15 FAIL      js:FAIL      OP-15 FAIL      wasm:FAIL      ok
OP-16     EXPECT    OP-16 EXPECT    js:EXPECT    OP-16 EXPECT    wasm:EXPECT    ok
OP-17     CLAMP     OP-17 CLAMP     js:CLAMP     OP-17 CLAMP     wasm:CLAMP     ok
OP-18     SCALE     OP-18 SCALE     js:SCALE     OP-18 SCALE     wasm:SCALE     ok
OP-19     CTOR      OP-19 CTOR      js:CTOR      OP-19 CTOR      wasm:CTOR      ok
OP-20     TRY       OP-20 TRY       js:TRY       OP-20 TRY       wasm:TRY       ok
OP-21     RECOVER   OP-21 RECOVER   js:RECOVER   OP-21 RECOVER   wasm:RECOVER   ok
OP-22     REF       OP-22 REF       js:REF       OP-22 REF       wasm:REF       ok
contract rows                 22
js rows                       22
wasm rows                     22
DECLARED-ABSENT wasm symbols  0
GREEN — 22 rows, both lowerings, fingerprints pairwise equal
```

Stage 2 (ii) — zero throws across the slice corpus including the non-string boundary inputs — is
§6's G-5 row: **GREEN**, 0/172 per production per lowering, 7/7 non-strings refused above the
algebra.

---

## 3. What was built, and the postures it was built under

The §3d slice, whole, in both lowerings: `P:color` (§10.1), `P:timing-function` (§10.2),
`P:stylesheet` (§10.3, the recovery scenario). 29 productions, 7 dispatch rows, the eight `R_cls`
tables, the seven `R_kw` tables, the two `R_disp` tables and the twenty `R_ctor` rows — all of them
data in `algebra/tables.mjs`, read by both lowerings, written twice nowhere.

- **lowering-js** — `jsAlgebra` instantiates the signature with parse-that's own `Parser` /
  `createParserContext`. The interpretation IS the parser: there is no intermediate representation.
- **lowering-wasm** — `wasmAlgebra` instantiates the same signature with an **emitter**; each
  operation assembles a Wasm function and a term's value is a function index. The module is
  187,341 bytes, 1,273 functions, 55,500 bytes of static data (the class tables, the keyword blobs
  with their pre-built value nodes, the interned strings, and the 192-bit power-of-ten table),
  sha256 `049b9904e829bedadf2dc12287013e33279a2079a43ddd4dd88c3a82611c6e22`.

**Declared postures** (`meta.postures`, written before a number was taken): full lowering, not
leaf-wasm · one boundary crossing per parse · code-unit span indices in both lowerings, a code unit
≥ 128 written as the `0xFF` marker and a span's *text* read back from the original string · scalar
only, no SIMD, one module for every host · a fixed 12 MB memory with no `memory.grow` and every
journal append bounds-checked · marks report `arena = 0` in BOTH lowerings · the decimal→f64
conversion correctly rounded in Wasm and **flagging** what it cannot decide · DM-1 freeze at `ENTRY`
only · `grammar()` is the term instantiation in both.

**The `arena` posture, stated plainly.** `ALGEBRA.md` line 238 and §6 EQ-5 both say *"the JS
lowering reports `arena = 0`"*, and `.g`'s serializer digests all six mark coordinates. A Wasm
watermark in the sixth slot would therefore diverge on every mark **by the contract's own
construction**. The Wasm lowering reports 0 there too; its arena is genuinely truncated on every
restore (the byte cursor is part of every mark and is restored with the other five), and the real
number rides `arenaHighWater()` — **304 B** on the short-string leg (§6, G-8). Filed as **F-3**.

**The number conversion.** `Number(s)` is one call in JS and a correctly-rounded 192-bit path in
Wasm. It was validated against `Number()` **before a byte was emitted**: 0 mismatches over the
20,433 distinct number tokens of the slice + fuzz corpora and 0 unflagged mismatches over 500,000
generated tokens (the flagged cases are the ones the routine reports it cannot decide, never
guesses). Over the 30,527-row differential it flagged **0**.

---

## 4. Stage 3 — the six products and the five laws

⟨`node harness/w2/eq-six.mjs --candidate ac1 --corpus experiments/w2/corpus/slice.json --fuzz-seed experiments/w2/corpus/fuzz-seed.json`⟩

```
product  divergences (js vs wasm)  first row
EQ-1     0                         -
EQ-2     0                         -
EQ-3     0                         -
EQ-4     0                         -
EQ-5     0                         -
EQ-6     2035                      s0180 "var(--brand)"
rows compared                           30527
label indices aligned across lowerings  true
third-cell differences                  233 (12 carrying a declared row)
RED — 2035 divergences between the two lowerings (K-1)
```

**EQ-1 through EQ-5: zero divergences over 30,527 rows** — the semantic value (by bytes, with `-0`
distinguished and every NaN canonicalized), the byte complement, provenance, the ordered diagnostic
journal and every rollback tuple, identical between a parse-that interpretation and a hand-assembled
Wasm module. The key **insertion** order (EQ-3's subject, digested beside EQ-1) is identical too.

**EQ-6 is not a divergence between the lowerings.** The verdict line says so because `eq-six` folds
EQ-6 into the same counter, but the table's own first five rows are 0 and the seat measured the
failure sets directly:

⟨`node experiments/w2/ac1-tagless/probes/comp1-and-third-cell.mjs`⟩

```
rows                                   30527
rows failing COMP-1 · js               2035
rows failing COMP-1 · wasm             2035
rows whose failure LISTS are identical 30527 of 30527 — EQ-6 is not a divergence between the lowerings
failures by law                        COMP-1c:2047
failures by kind (COMP-1c π_k)         keyword:2047
rows by corpus family                  var-context:4 · ground-a-guarded:9 · fuzz-wellformed:1262 · fuzz-malformed:760

  s0180 "var(--brand)" → kind 'keyword' over "--brand"
  s0181 "var(--brand, red)" → kind 'keyword' over "--brand, red"
  s0182 "var(--a(--b))" → kind 'keyword' over "--a"
  s0183 "var(--x, rgb(1 2 3))" → kind 'keyword' over "--x, rgb"
```

Every failure is **COMP-1c's kind column**, every one of kind `keyword`, and every one produced by
§10.1's own rule

```
balanced-tail := REP( ALT[ SEQ[TOK "(", REF balanced-tail, TOK ")"], DROP keyword (SCAN any-but-paren 1 ∞) ] ) 0 ∞
```

whose `DROP keyword` owns bytes like `--brand, red` that §4.5's π_keyword
(`/^[A-Za-z][A-Za-z0-9_-]*$/`) cannot admit. **There is no COMP-1a and no COMP-1b failure anywhere**
— the tiling is complete and non-overlapping; only the kind column is rejected. The counterfactual,
measured:

```
COUNTERFACTUAL — reading that ONE kind the way π_skipped and π_residue are read (>= 1 byte),
changing nothing else:
  failures remaining                   0 (rows 0)
```

No other kind of `K_C` is available: `skipped` is RECOVER's by §4.5, `punct` is one byte of
`"(),/%#;:{}[]!"`, `ws` and `comment` are lexical, `residue` is ENTRY's tail rule. Filed as **F-1**,
owner: the contract (§4.5 × §10.1) — a candidate cannot cure it without departing from §10's letter,
and departing from §10's letter is exactly what this seat is forbidden to do quietly.

⟨`node harness/w2/recovery-laws.mjs --candidate ac1`⟩

```
lowering  TRY sites  R-LAW-1 mismatches  R-LAW-2 COMP-1 failures  R-LAW-4 amplified  R-LAW-4 zero-width  R-LAW-3
js        2951       0                   13                       0                  0                   silent
wasm      2951       0                   13                       0                  0                   silent
RED — js: R-LAW-2 — 13 rows fail COMP-1 | wasm: R-LAW-2 — 13 rows fail COMP-1
```

R-LAW-1 **exact over 2,951 rollback sites per lowering, 0 coordinate mismatches**; R-LAW-3 silent
under the instrument that throws on any print; R-LAW-4 **0 amplified, 0 zero-width** recoveries;
R-LAW-5 structural, 0, with `.g`'s negative control firing (`1`). R-LAW-2's 13 rows are F-1 again,
measured on the slice alone.

---

## 5. The third differential cell

⟨`node experiments/w2/ac1-tagless/probes/comp1-and-third-cell.mjs`⟩

```
slice rows with a published counterpart 527
   210  incumbent THREW (the R1 class)
    11  incumbent ACCEPTS, the algebra rejects
     8  incumbent REJECTS, the algebra accepts
     4  both accept, V differs
by family  functional:2 · numeric-edge:3 · juxtaposition:3 · r6-bare-number:2 · clamp:4 · unsound-accept:7 · ground-a:210 · recovery-zero-sync:1 · edge:1
```

233 differences, and **210 of them are the incumbent throwing** — the shipping R1 crash class, on
the `ground-a` family, recorded as a fact about the incumbent and not a candidate defect (§10.5 and
G-5's own born-RED paste). The remaining 23 fall inside §10.5's declared classes (b) legacy 4-arg,
(c) clamps, (d) the seven unsound accepts, (e) juxtaposition, (f) `1e400`, (g) R6 bare-number s/l,
(j) recovery. The harness prints `12 carrying a declared row` because twelve corpus rows are tagged
individually while §10.5 declares eleven *classes*; the census above is published so nobody reads
221 untagged rows as surprises. Filed as **F-5** (a corpus-tagging observation for `.g`/`.h`, not a
defect of either).

---

## 6. The gate readings — BEFORE → AFTER

All nine gates this unit was to turn, each **double-run**, both runs' verdict lines identical.
BEFORE is the wave's baseline (all twelve born-RED at authoring; the candidate directory did not
exist).

| gate | before | after | reading |
| ---- | ------ | ----- | ------- |
| **G-1** one-algebra, ratified | RED | **RED** (contract half GREEN, structural half RED) | homes sha256-equal, 22 enumerated == stated, 0 target-conditionals in the contract text and 0 in all 12 declared sources; per-candidate walk: `ops∉22 0 · recover≺alt 0 · cut∉alt 7 · unowned-span 0 · closure-leak 0` in BOTH lowerings — the 7 are **F-2** |
| **G-2** op-bijection | RED | **GREEN** | 22 rows, both lowerings, fingerprints pairwise equal, 0 declared-absent (§2) |
| **G-3** six-product equality | RED | **RED** (EQ-1..EQ-5 GREEN, EQ-6 RED) | 30,527 rows · EQ-1..EQ-5 **0** divergences · labels aligned · EQ-6 2,035 rows, identical failure lists in both lowerings — **F-1** |
| **G-4** recovery laws | RED | **RED** (R-LAW-1/3/4/5 GREEN, R-LAW-2 RED) | 2,951 sites, 0 mismatches; silent; 0 amplified; 0 zero-width; 13 rows — **F-1** |
| **G-5** R1 zero-throw + JS boundary | RED | **GREEN** | 0/172 throws × 3 productions × 2 lowerings; 0 empty-diagnostic rejections; 7/7 non-strings refused above the algebra |
| **G-8** no-latch + allocation | RED | **RED** (five legs GREEN, reject leg RED) | run 1: js drift **1.000×**, wasm **0.897×** (envelope 0.80–1.25); steady-state js −3.3 B/parse, wasm **0.0**; wasm reset residue **1.001×**; arena high-water **304 B**; DM-1 freeze leg js 4834 → 2166 ns, wasm 1125 → 917 ns; **wasm reject path 2.1 B/parse**. Runs 2 and 3 (the double-run pair) reproduce the verdict and the legs — reset residue **0.963×** / **0.905×**, freeze leg wasm 1083 → 917 / 1020.5 → 916 ns, reject **2.1** / **2.2 B/parse** — **F-4** |
| **G-9** wasm zero-import + substrate | RED | **GREEN** | imports **0** over all kinds, `{}` by kind; no START section; exports closed (`run setTheta highWater reset memory`); memory 12,582,912 → 12,582,912 B over 2,000 steady-state parses; K-10 0 byte-identical files against the 3 forbidden ones; K-9 `node experiments/w2/ac1-tagless/build.mjs`, non-JS toolchain **none** |
| **G-10** source-direct idiom + no-CST | RED | **GREEN** | 139 graph nodes walked · `opt` under `all` **0** · `lazy` **0** · memoize **0**; all five textual zeros **0** over 7 declared source files; the excess-property `tsc --noEmit --strict` fixture PASSES both halves |
| **G-11** depth by construction + scan union | RED | **GREEN** | the 50,008-byte deep-nesting row returns `ok:false, 1 issue` in BOTH lowerings, never a `RangeError`; scan primitives reached as algebra leaves: `DIGITS DISPATCH KW LIT SCAN TEXT` in both |

G-7 is recorded through W1's bench and is not this unit's to turn; **no speed sentence appears in
this file outside G-8's own rows**, which are G-8 legs and not bench cells.

**G-8's reject leg, diagnosed rather than argued.** The gate's threshold is an exact
`rejectPerParse > 0`, measured as a `heapUsed` delta across one `gc()` around a 10,000-parse window.
The seat re-ran that window three times in one process, after the same 100,000 accepts the harness
runs first:

⟨`node --expose-gc rejone.mjs wasm` / `… js`⟩

```
wasm reject window 1: 21,864 B = 2.2 B/parse   window 2: -2,872 B = -0.3   window 3: 17,232 B = 1.7
js   reject window 1: -7,736 B = -0.8 B/parse  window 2: 108,104 B = 10.8  window 3: 29,928 B = 3.0
```

The JS lowering — which the gate scored `-0.1 B/parse` and passed — reads **+10.8 B/parse** in the
second window of the same experiment. A single `gc()` does not settle V8's heap at this magnitude,
so the leg's sign is not resolvable against an exact-zero threshold. The gate's verdict is published
as it printed (**RED**); the instrument's resolution is filed as **F-4** for `.h`. The seat did
**not** give the Wasm boundary a leaner reject path to pass the leg: both lowerings build the same
product through the same code, and tuning one of them to a leg is the disease the gate exists to
catch.

---

## 7. Findings for `.h`

| id | finding | owner | evidence |
| -- | ------- | ----- | -------- |
| **F-1** | §4.5's π_keyword cannot admit the bytes §10.1's `balanced-tail` gives `DROP keyword`; 2,047 COMP-1c failures over 2,035 rows, no COMP-1a/b anywhere, counterfactual **0**. No other `K_C` kind is available. It fails identically in both lowerings and will fail for every candidate authoring §10.1 | the contract (§4.5 × §10.1) | §4 |
| **F-2** | the contract's `CUT` idiom is outside an `ALT` arm at **14** lexical sites — §10.3's 7 (under `REP`/`RECOVER`, with no enclosing `ALT` in any reading) and §10.1/§10.2's 7 function heads (`SEQ[TOK "(", CUT, …]`, whose enclosing `ALT` exists only at run time, hidden from a lexical walk by the `R_disp` indirection). OP-10 and §5.2 call that a walk error, and the cure is inexpressible: the only scope-opener is `ALT` and OP-09 fixes its arity at n ≥ 2 | the contract (§10.1/§10.2/§10.3 × §5.2/OP-09) | §1 PF-3, §6 G-1, §9.5 |
| **F-3** | EQ-5's sixth coordinate is specified two ways: line 238/§6 say the JS lowering reports 0, while `.g`'s serializer digests all six and EQ-5 demands value equality per site. Any Wasm lowering reporting a real watermark diverges on every mark by construction | the contract (§2.3 × §6 EQ-5) | §3 |
| **F-4** | G-8's reject-path leg tests an exact zero with an instrument whose noise band spans ±10 B/parse at that window size — measured on the lowering the gate passed | `.g`'s instrument | §6 |
| **F-5** | the third-cell "declared" column counts individually-tagged ROWS (12) against §10.5's eleven declared CLASSES (233 differences, 210 of them the incumbent's own R1 throws) | `.g`'s corpus tagging | §5 |
| **F-6** | G-1's `target\s*===` grep has a false-positive class: a *dispatch* target variable reads as a compile-target conditional. Three hits, all innocent, renamed; a future candidate will hit it again | `.g`'s instrument / `W2.md` §6 G-1 | §1 PF-1 |
| **F-7** | §10.2's ALT order makes `linear(…)` unreachable under ordered committed choice: `KW ident timing-keyword` matches the ident run `linear`, the arm succeeds, and `END` then fails on `(`. Measured with §10.2's literal order: `ok:false trailing_input @6 expected ["end of input"]` — one of the four `CssTimingFunction` kinds §10.2 itself puts in the slice cannot parse. The realization puts the DISPATCH arm first (§9) | the contract (§10.2) | `algebra/grammar.mjs` L110-119 |
| **F-8** | §10.3 writes `value-slice := CTOR value-color [REF color-body]` while §8 D-3 states the slice has exactly two `REF` sites; both cannot hold. The realization takes the debt clause and inlines `color-body` | the contract (§10.3 × §8 D-3) | §9 |

---

## 8. Kill rules — each with its measurement

| rule | verdict | measurement |
| ---- | ------- | ----------- |
| **K-1** any divergence on any equality product between the two lowerings | **NOT HIT** | EQ-1..EQ-5 = 0 over 30,527 rows; EQ-6's 2,035 rows fail *identically* in both (30,527 of 30,527 failure lists equal), so no divergence between the lowerings exists — and the failure is declared and justified at its cause (F-1), which is Stage 3's own path for an explainable EQ failure |
| **K-2** any target-conditional in grammar/algebra source | **NOT HIT** | 0 over all 12 declared sources; the first reading of 3 is published in §1 with its cause and cure |
| **K-3** any operation with exactly one lowering | **NOT HIT** | 22/22 both lowerings, fingerprints pairwise equal, 0 DECLARED-ABSENT (§2) |
| **K-4** recovery expressible only backend-side | **NOT HIT** | `RECOVER` is OP-21 in both registries and exercised by `P:stylesheet` in both; R-LAW-1..5 measured on both (§4) |
| **K-5** strict Pareto domination on all printed bench legs | **N/A** | G-7 is W1's bench, not this unit's; no bench cell was run here |
| **K-6** observable cross-parse state | **NOT HIT** | history drift js 1.000× / wasm 0.897× inside the printed envelope; wasm reset residue 1.001×; steady-state heap 0.0 B/parse (§6) |
| **K-7** recursion unbounded by construction | **NOT HIT** | G-11 GREEN in both lowerings on the 50,008-byte row; and the shield clause is vacuous — `grep -rn "try {\|catch"` over all 12 declared sources returns **1 hit, and it is a comment** |
| **K-8** any throw on any universe/R1 corpus row | **NOT HIT** | G-5 GREEN: 0/172 × 3 productions × 2 lowerings, and 0 throws over the 30,527-row differential |
| **K-9** toolchain capture | **NOT HIT** | `meta.build.jsArtifactReproduction = ["node experiments/w2/ac1-tagless/build.mjs"]`; the audit reads `non-JS toolchain in that path: none` |
| **K-10** substrate breach | **NOT HIT** | the audit hashes the evidence root's 3 uncommitted `wasm32` working-tree files and finds **0** declared wasm sources byte-identical to any; nothing in this candidate reads, copies or cites them, and `committed wasm32 = 0 (exit 1, no output)` |

**The seat does not kill its own candidate.** Every kill rule is measured and none is hit; the two
REDs are the contract's, reproduce identically in both lowerings, and carry counterfactuals. The
terminal verb is G-12's and `.h`'s, not this seat's.

---

## 9. Declared deviations from §10's letter

Each was declared in the grammar file at the site, before measurement, and none needed anything
outside the twenty-two.

1. **`sync-rule`'s terminals** — §10.3 writes bare `SCAN`/`LIT`; INV-OWN (§2.4) requires a `DROP`
   owner and `.g`'s walk enforces it statically. `DROP` wrappers were added. `sync` runs under
   discard — everything it appends to `C` is truncated to the mark and the whole consumed span
   becomes one `skipped` entry — so the kinds are unobservable by construction, and COMP-1 is
   measured on every row (§4: no COMP-1a/b failure anywhere).
2. **`important`** — §10.3's `OPT(SEQ[…]) unit` cannot carry *whether the arm matched*: both arms
   yield `unit`. The expressible realization is `ALT[SEQ[…, PURE true], PURE false]`, so the
   constructor reads a value and `Declaration.important` is exact.
3. **`value-slice`** — F-8: `color-body` is inlined, leaving exactly the two `REF` back-edges §8 D-3
   names (`balanced-tail`, `value-slice`).
4. **§10.2's ALT order** — F-7: the `DISPATCH` arm is first, the minimal reordering that makes all
   four `CssTimingFunction` kinds reachable. It changes no other input's verdict: `linear` with no
   `(` falls through to the keyword arm because `head-linear`'s `TOK "("` fails BEFORE its `CUT`.
5. **The structural walk's blind spot, measured rather than left implicit.** `R_disp` rows carry
   term *names* (§4.4's `{key → term}` shape, `DISPATCH cls,disp` arity 2), so `grammar().terms`
   does not reach the seven dispatch heads and `.g`'s walk never sees them. The seat ran `.g`'s own
   checkers over `dispatchTerms` directly, as roots:

   ```
   dispatch terms           7
   ops outside the 22       none
   closure leaks            0
   unowned spans            0
   RECOVER in non-final arm 0
   CUT outside an ALT arm   7  head-rgb head-hsl head-oklch head-var head-cubic-bezier head-steps head-linear
   ```

   The first five lines are clean. The last one **enlarges F-2 rather than excusing it**: §10.1's and
   §10.2's function heads have exactly §10.3's shape — `SEQ[TOK "(", CUT, …]` — so under a lexical
   walk the contract's `CUT` idiom is outside an `ALT` arm at **14** sites (7 in `terms`, 7 in the
   dispatch rows), not 7. The two halves differ in one respect the seat states rather than blurs: the
   seven head `CUT`s **do** have an enclosing `ALT` at RUN TIME — a head is only ever entered through
   `color-body`'s or `timing`'s `ALT` via the `DISPATCH` arm, which is precisely the semantics `rgb(`
   wants — and the `R_disp` indirection is what hides that from a lexical checker; §10.3's seven have
   no enclosing `ALT` in either reading, lexical or dynamic, because only `REP`/`RECOVER` stand above
   them.

---

## 10. What this seat did not measure

- **G-7 / Stage 4 economics** — W1's bench, another unit's. G-8's legs are G-8's.
- **G-6 coverage-52** — `.g`'s reporter; this candidate declares `meta.artifacts.jsEntry` so the
  assay has a subject, but the reading is not this unit's gate.
- **G-12** — the kill ledger and graduation are `.h`'s and `.i`'s.
- **The dispatch heads under `.g`'s walk** — measured by the seat (§9.5), not by the harness, and
  named as a blind spot rather than papered over.
- **Arena truncation as a published coordinate** — reported as 0 by declared posture (F-3); the
  seat verified within the Wasm lowering that the byte cursor is part of every mark and restored
  with the other five coordinates, and that the high-water mark on the short-string leg is 304 B.
