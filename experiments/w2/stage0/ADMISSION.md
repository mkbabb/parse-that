SERVED MODEL: claude-opus-5[1m]

# Stage-0 admission — X.P.W2.g, 2026-09-17

`W2.md` §3e Stage 0: *"One ≤200-line spike per live candidate, run by `.g`, attacking only that
candidate's pre-declared Stage-0 falsifier (§3c). **Exactly three admitted**; the fourth, if it
survives its falsifier, is ranked by its falsifier margin and named **RESERVE** … Two or more Stage-0
kills → triumvirate (§3a)."*

Each spike attacks **one** falsifier, quoted verbatim from `ALGEBRA.md` §12 (which quotes `W2.md`
§3c), and nothing else. No spike builds a candidate, ranks candidates against each other, or sets a
bar. **Every verdict is a number**; the commands are below and reproduce.

| candidate            | spike                            | lines | verdict           | exit | margin (the measurement, not a judgement)                                              |
| -------------------- | -------------------------------- | ----- | ----------------- | ---- | -------------------------------------------------------------------------------------- |
| **AC-1** TAGLESS-TWIN | `ac1-signature-instantiation.mjs` | 179   | **SURVIVES**      | 0    | 6/6 σ coordinates restored exactly in BOTH instantiations; recovery traces agree; emitted module **0 imports**; the mutant emitter that drops `lenP` is caught |
| **AC-2** CLOSED-IR    | `ac2-ir-closure.mjs`              | 168   | **SURVIVES**      | 0    | IR kinds used 16, **0 outside** the ratified 22; 0 host functions (CL-1); **22/22** compile cases, no default arm; a 23rd kind throws; `recover` RUN on a malformed sheet → **1 issue, 1 skipped span**, well-formed control 0 issues |
| **AC-3** SPAN-ALGEBRA | `ac3-boundary-cost.mjs`           | 165   | **SURVIVES**      | 0    | median ratio **14.5 % · 17.9 % · 18.1 %** over three invocations of five replicates each, against a screen of ≥ 20 % — **per-replicate spreads 9.9–19.7 % · 12.7–23.2 % · 14.9–20.8 %: the spread STRADDLES the threshold in two of three runs while every median clears it** |
| **AC-4** SIBLINGS-ORACLE | `ac4-table-expressibility.mjs` | 135   | **KILLED**        | 1    | **58 of 65** slice decisions are registry rows; **7** (S-1..S-7) are carried by TERM SHAPE alone at the §4.4 row shapes, against a falsifier whose threshold is **one** |

**Kills: 1.** `W2.md` §3a's *"Stage 0 killing two or more of the four"* trigger does **not** fire, and
this seat did not treat one kill as licence to widen anything.

## The admission outcome (this fixes phase 4's candidate→seat assignment)

| seat           | candidate                | home (`W2.md` §4)             |
| -------------- | ------------------------ | ----------------------------- |
| **X.P.W2.d**   | **AC-1 TAGLESS-TWIN**    | `experiments/w2/ac1-tagless/` |
| **X.P.W2.e**   | **AC-2 CLOSED-IR**       | `experiments/w2/ac2-closed-ir/` |
| **X.P.W2.f**   | **AC-3 SPAN-ALGEBRA**    | `experiments/w2/ac3-span/` (+ `typescript/src/**` on `w2/ac3-scan-union` only) |
| **RESERVE**    | **NONE**                 | `experiments/w2/ac4-siblings/` stays the empty RESERVE slot |

**RESERVE is NONE, and that is a consequence, not a choice.** §3e names as RESERVE *"the fourth, if
it survives its falsifier"*; AC-4 did not. FF-6's entry rule (*"the RESERVE enters only if an admitted
candidate dies structurally at Stage 2"*) therefore has **no subject**: if one of AC-1/AC-2/AC-3 dies
structurally at Stage 2, there is nobody to promote and the field is three-minus-one. Recorded here
for `.h` and the orchestrator; it is not this seat's to rule.

## Reproduction

```
node experiments/w2/stage0/ac1-signature-instantiation.mjs      # exit 0 = survives
node experiments/w2/stage0/ac2-ir-closure.mjs                   # exit 0 = survives
node experiments/w2/stage0/ac3-boundary-cost.mjs                # forks 5 replicates; exit 0 = survives
node experiments/w2/stage0/ac4-table-expressibility.mjs         # exit 1 = killed
```

Substrate for every number above: node v26.0.0 · darwin arm64 · `<p2>` on `w2/harness` (base
`f5757082`) · the third cell is the vendored sha-pinned 4.0.0 (`8b5381…0c42`). AC-1, AC-2 and AC-4
were run **twice** and reproduced their verdicts and every margin figure identically; AC-3 was run
**three times** (its driver forks five child processes per invocation) and all three medians are in
the table, the tightest margin being **1.9 percentage points**.

## What each spike did NOT do

- It did not build its candidate, and it did not read another candidate's spike.
- It set **no bar**: AC-3's 20 % is the contract's own candidate-selection screen (`ALGEBRA.md` §12,
  *"NOT a performance bar"*), printed under `BAR: OWNER-GATED-PENDING-RATIFICATION`.
- It did not rank the three survivors against each other. Stage 0 is admission; adjudication is
  `.h`'s at Stage 5, on Stage 1–4 evidence that does not exist yet.

## The two findings this seat hands forward

- **AC-3's screen is noise-dominated on this box.** Four tracks share it; the per-replicate spread
  crosses the threshold in two of three runs while every median clears it. `.f` should re-measure its own
  posture at Stage 1 with the declared replicate rule, and `.h` should read the margin as **1.9
  percentage points at the tightest of three runs**, not as comfort.
- **AC-4's kill is its own predicted failure (a) reached early.** The band's differential-oracle
  evidence — 30,000 seeded inputs, zero acceptance disagreements — is untouched by it: an oracle
  bounds drift by **coverage**, and the falsifier asks the table to bound it by **construction**.
  The seven counter-examples (hue unwrapping · juxtaposition width · the legacy arm's existence ·
  R6's bare number · `CUT` placement · `recover-final-only` · the case-folding policy) are each
  quoted to the contract line that carries them in the spike's own output.
