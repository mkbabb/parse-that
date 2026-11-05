SERVED MODEL: claude-opus-5-5

# X.P.W7 `.p` addendum — the 2.0.0 core cures against Tranche T, and the value.js rows retired (2026-09-23)

**Authority:** value.js `docs/tranches/X/parse-that/waves/W7.md` §`.p` and its §0ck ADDENDUM
(G-T); value.js COHESION §0ck decisions 6 and 7; §0ci R-1 (publishing unwalled) and R-3 (the paired
ratio; PT-PERF-LOAD retires into it). **Branch:** `x-p-w7`, cut from `cb9c0d4`, in the worktree
`../parse-that-x-p-w7`. This is a dated addendum beside Tranches T and U: it edits neither
(`docs/tranches/{T,U}` are that program's, untracked on master, and untouched here).

## What 2.0.0 carries from this unit

| Cure | Commit | Gate | Law |
|---|---|---|---|
| (a) `mapState` → `mapSpan((value, start, end) => …)`; no `Object.create(state)` | `41575eb` | P-1 | `%HaveSameMap(state, new ParserState)` after `mapSpan` on value.js's `badTerm` and `spanned` shapes |
| (b) the failure path is silent; with diagnostics off it allocates nothing | `1168bc2` | P-2 | 0 console bytes (diagnostics off and on); `expected` undefined; `suggestions`/`secondarySpans`/`diagnostics` keep their identity |
| (c) F-p-EOF: an empty-matching regex matches at end of input | `659d24d` | P-3 | `/\s*/` matches `''` on `""` and after the last token; `/[a-z]+/` still fails at EOF with its label |
| (d) a self-patching `lazy` | — | own bench | **not admitted**: measured, regressed (below) |
| (e) `all()` positional, documented as the 2.x contract | `8544424` | law test | `all(a, b.opt(), /\s*/, c)` on `"ac"` → `["a", undefined, undefined, "c"]` |
| (f) `90d4ec5` measured | — | P-5 | **kept**: HEAD with the cures reads at or below 0.8.2 on every entry, twice (below) |

The laws live in `typescript/test/x-p-w7-cures.test.ts`. Each was read RED on `cb9c0d4`'s source
before its cure (P-1: `term.mapSpan is not a function`, and the old `mapState` reads
`%HaveSameMap = false` on the published 0.8.2; P-2: the suggestions array is re-allocated on
failure; P-3: `/\s*/` fails on `""`).

## Each cure against T's completion criteria (G-T)

T's goal is one immutable definition graph run by one invocation-owned context. No cure here
contradicts it; three move toward it; none claims a T criterion GREEN.

1. *`Parser` stores definition only; no public raw executor or last-result observer.* (a) moves
   toward it: a user callback no longer receives the executor's live state or a prototype view of
   it, only the value and two coordinates. `Parser.parser` stays public: T.W1/T.W2 own it.
2. *Source, diagnostics, recovery, commitment and memo tables belong to one call.* (b) moves toward
   it: a parse no longer writes process-level output (the console); its failure evidence stays on
   the call's own state. The global diagnostics toggle remains (PT-GLOBAL-DIAGNOSTICS, T.W3).
3. *`parse` returns a discriminated result; `parseOrThrow` is the sole throwing shortcut.*
   Untouched (T.W2).
4. *Every combinator's declaration equals its runtime value and obeys checkpoint, progress and
   failure laws.* (c) makes `regex` obey one law at every offset, end of input included; (e)
   states `all()`'s runtime value as its declared tuple. `mapSpan`'s declaration
   `Parser<S>` equals its runtime value.
5. *No SCC crosses a feature-module boundary.* Untouched (T.W5).
6. *Clean build, pack, isolated install, type, ESM, browser and byte-budget probes.* The release
   gate below ran the pack, isolated install, ESM and declaration probes on the packed tarball.
   Browser and byte-budget probes were not run: T.W6 keeps them.
7. *Two fresh hostile audits.* Not claimed (T.W7).

## P-5 — the Parser-core paired ratio, and `90d4ec5` (§0ck 6)

Instrument: `typescript/test/benchmarks/paired/` (`99d8f8e`). One fresh `node --expose-gc` process
per cell holds both arms (the candidate's built `dist/parse.js`, the published 0.8.2's
`dist/parse.js`); gc before every pass; a pass sized so the 0.8.2 arm takes ≥ 20 ms; 11 rounds with
arm order alternating inside the cell and reversed between the 3 reps; `loadavg` before and after
every cell; ratio = median of per-round candidate/0.8.2 ratios, min/min recorded; a cell whose 0.8.2
passes spread ≥ 1.6× is set aside and re-run, never averaged in, and counted. Each entry also checks
the same product on both arms (same verdict; on success a deep-equal value): 0 mismatches.
Entries: `json` (the package's JSON grammar), `sequence`, `choice` (early arms fail), `reject`
(whole parses fail), `recursion` (lazy arithmetic), `recovery` (90/10), `span` (2.x `mapSpan`
against 0.8.2 `mapState`, the same product). Node v26.0.0.

**HEAD `cb9c0d4` + cures (a)(b)(c) vs 0.8.2** — median / worst kept cell, 3 cells each:

| Entry | Run 1 | Run 2 |
|---|---|---|
| json | .921 / .933 | .904 / .906 |
| sequence | .929 / .941 | .936 / .965 |
| choice | .651 / .656 | .657 / .659 |
| reject | .076 / .077 | .074 / .074 (2 cells kept) |
| recursion | .778 / .781 | .790 / .794 |
| recovery | .837 / .845 | .838 / .874 |
| span | .144 / .149 | .144 / .151 |

Set aside: 3 cells (run 1), 6 (run 2), all on 0.8.2's spread; in run 2 one `reject` cell spread in
all 4 attempts, so `reject` has 2 kept cells there. Load (1-min, per cell) 16.1–17.1 across both runs. The
`reject` and `span` ratios are large because 0.8.2 prints the error display on every failed parse
and `mapState` makes the state a prototype: the two defects (a) and (b) cure.

**Every entry at or below 1.00 in every kept cell, twice: `90d4ec5` is kept** and ships in 2.0.0.
The built `dist/*.js` that was measured is byte-identical (`cmp`) to the committed source's build.

**(d) self-patching `lazy`, candidate (cures + patch) vs baseline (cures)** — medians, 2 runs:
json 1.037 · 1.046, sequence .993 · .993, choice 1.011 · 1.002, reject .975 · .986, recursion
1.001 · 1.008, recovery 1.005 · 1.004, span 1.006 · .975. It regressed the JSON entry in both runs,
so it is not admitted; `lazy` keeps its closure-local cache.

## The release gate: T's `VALUE-VNEXT-COORDINATION.md` checkpoints

1. **Re-pin.** parse-that `x-p-w7` from `cb9c0d4`; master's dirty rows (`.cargo/config.toml`,
   `README.md`, `rust/**`, untracked `docs/{instructions,precepts}`, `docs/tranches/{B,T,U}`) and
   the Codex worktrees untouched. value.js consumes `@mkbabb/parse-that` 0.8.2 and
   `@mkbabb/bbnf-lang` 0.1.4 today; X.P.W7 `.v` drops both from its runtime (§0ck 7), and
   bbnf-lang 0.2.0 (`.t`/`.e`) builds on this 2.0.0.
2. **Operation census** (the consumers' actual 1.0-era operations, text census of value.js
   `src/css/bbnf` and bbnf-lang 0.1.4 `dist/bbnf.js`): `mapState` — 2 value.js sites (`badTerm`,
   `spanned`) and bbnf-lang's `mapStatePosition` → **REPLACE** by `mapSpan`; `reset()` — 2 value.js
   sites (the F-b-2 workaround) → **DELETE** (already gone since 1.0; value.js `.v` deletes the
   call); `new ParserState` — 2 value.js sites → value.js `.v` deletes them; `map`, `trim`, `wrap`,
   `many`, `opt`, `sepBy`, `eof`, `then`, `skip`, `next`, `minus`, `recover`, `memoize` → **KEEP**,
   unchanged semantics except `regex` at end of input (F-p-EOF, cured).
3. **Coordinates.** `mapSpan`'s `start` and `end` are UTF-16 code-unit offsets into the string
   given to `parse`/`parseState`, the same domain as `ParserState.offset`. No coercion.
4. **Packed crater.** `npm pack` → `mkbabb-parse-that-2.0.0.tgz` (65 files); installed alone into
   an isolated directory (no workspace link, no source import). Node ESM probe: a value-shaped
   CSS declaration grammar using `mapSpan` for a `badTerm`-shaped refusal and a comma span,
   `regex(/\s*/)` with no `?` workaround, `Parser.lazy`, `./packrat` and `./diagnostics` subpaths:
   5/5 declarations parse, `/\s*/` matches at EOF, 0 console bytes on failure with diagnostics off
   and on, `Parser.prototype.mapState` undefined. Declaration probe (`tsc --strict`, NodeNext):
   `mapSpan` infers `Parser<{ v; s; e }>`, `all(a, b.opt())` is `Parser<[string, string |
   undefined]>`, and `mapState` is a type error. GREEN.
5. **Versioned return.** This addendum is the return packet for this cut: the pins above, the
   API break (`mapState` removed, no alias; no console output), the census, the coordinate
   contract, the crater, and the release: `@mkbabb/parse-that` **2.0.0**, published under the
   owner's R-1 (§0ci), which is the owner acceptance this checkpoint asks for.

## The value.js rows in T and U (§0ck 7)

value.js's runtime carries no parse-that and no bbnf-lang after X.P.W7 `.v`: its CSS grammar is
compiled ahead of time by bbnf-lang's TypeScript emitter into a checked-in module that needs no
combinator runtime. Recorded here, beside the programs, without editing them:

- **U.W7 "packed value.js adoption" (lock PT-V, `docs/tranches/U/U.md` row and
  `waves/W7.md`) retires.** Its premise, value.js as a packed runtime consumer of the sealed
  parse-that, no longer holds. PT-R stays a language contract; TypeScript leaves stay on
  irregexp. U.W8/U.W9's GESTALT audits keep their scope minus the value.js consumer.
- **The VALUEJS-PT-E ask letter (`docs/tranches/A/VALUEJS-PT-E-2026-07-05.md`) closes.** Its
  `mapState` and benign-failure asks are answered by (a) and (b) in 2.0.0 (value.js
  `docs/tranches/V/apotheosis/parser-proof/PROFILE-ANALYSIS.md` §3 O-6).
- **T's value.js rows** (`VALUE-VNEXT-COORDINATION.md`, `VALUEJS-BANK-ADJUDICATION.md`): the
  V-next consumer they coordinate with no longer adopts a parse-that runtime. Their checkpoints
  served as this release's gate (above). The four cures are T's result/diagnostics surface's
  installment for this cut (W7 decision 3a); T's full per-call carrier (criteria 1–3) stays T's.
- **U's completion clause** ("the only parse-that input admitted to the bbnf-lang product cut" is
  U's sealed baseline) is amended for this cut only: bbnf-lang 0.2.0's TypeScript package builds on
  this 2.0.0.

## The ten inherited defect families (checkpoint 5 disposition)

| Family | Disposition at 2.0.0 |
|---|---|
| `PT-EOF-DIAGNOSTIC` | partly cured: F-p-EOF (regex at EOF) GREEN, P-3; EOF labelling otherwise unchanged, T.W3 |
| `PT-GLOBAL-DIAGNOSTICS` | partly: no console output from a parse (P-2); the global toggle remains RED, T.W3 |
| `PT-STATE-RESULT-DIVERGENCE` | partly: callbacks no longer see the state (P-1); the discriminated result remains RED, T.W2 |
| `PT-COMBINATOR-RUNTIME-TYPE-DIVERGENCE` | `all()`/`mapSpan` declarations equal runtime (law tests); the rest RED, T.W2 |
| `PT-CORE-SCC-AND-BUNDLE` | untouched, RED, T.W5 |
| `PT-ARTIFACT-SKIP` | untouched, RED, T.W0/T.W6 |
| `PT-LOADER-IDENTITY` | untouched, RED, T.W6 |
| `PT-NESTED-RECOVERY-ROLLBACK` | `90d4ec5`'s complete rollback ships (its laws GREEN in `runtime-kernel.probe.test.ts`); T.W3 owns closure |
| `PT-DISPATCH-DOMAIN-CONTRACT` | untouched, RED, T.W2 |
| `PT-RAW-CROSS-SOURCE-MEMO` | unchanged (its probe GREEN since 1.0); T.W4 owns closure |

## P-4 and PT-PERF-LOAD

`npm test` 143/143 twice. `proof:all` proofs 1–9 GREEN twice. `proof:perf` clauses (A) and (B')
GREEN; clause (C), an unpaired ns/parse against a checked-in 1,742 ns baseline, read RED at host
load 26–28 (2,970 and 3,560 ns), as it did before these cures at `cb9c0d4` (W6R: PT-PERF-LOAD).
value.js §0ci R-3 retires PT-PERF-LOAD into the paired ratio, which is P-5 above (json .90–.92 of
0.8.2). Rewriting clause (C) as a paired ratio lives in `typescript/scripts/`, outside this unit's
writable set: it is a residual for parse-that's own program.
