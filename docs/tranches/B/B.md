# Tranche B — Scannerless runtime formation and release

Tranche B closes the parser-development question: whether one small,
source-direct parse-that runtime can execute the Value-owned full CSS grammar
and the parse-that JSON grammar with exact products and a formal ≥10× CI-low,
without a tokenizer, scanner facade, compatibility path, or second runtime.

## Thesis

Authored combinators remain the grammar. A compact runtime may lower only the
generic source-direct operations that two live grammars consume. The candidate
is admitted by equivalent values, UTF-16 spans, diagnostics, recovery and
failure behavior at every binding scale, then packaged once, consumed before
publication, and released only after displaced machinery is deleted.

## Goal criterion

One released parse-that coordinate supplies the minimum generic runtime used
by Value's sole full-CSS grammar and parse-that's non-CSS JSON grammar. Both
consumers are source-direct, scannerless, semantically equivalent, simpler
after migration, and ≥10× faster at CI-low on the frozen equal-work planes.

## Invariants

1. Parse-that owns reusable combinators, run state, exact slots, UTF-16 spans,
   diagnostics, recovery, recursion, memo policy and runtime performance.
2. Value owns the sole CSS grammar, CSS AST/results, canonical inverses,
   transform/path domains, public CSS behavior, consumer and UI.
3. The named non-CSS consumer is
   `typescript/src/parse/parsers/json.ts`; it must consume the same admitted
   runtime primitives, not a CSS-specialized route or benchmark-only adapter.
4. BBNF is receipt-only after Value W3 freeze. It creates no CSS parser,
   registry or release prerequisite.
5. Keyframes consumes CSS, transform, path and canonical inverse behavior
   through Value. Parse-that exports no Keyframes or domain type.
6. No tokenizer, token array, token-event tape, scanner facade, separate
   lexing stage, raw-source alias, generated compatibility layer, fallback
   interpreter, dual parser path or global trivia machinery may land.
7. Source-direct terminals may classify source code units and use typed
   tables only inside combinator semantics. They do not materialize a
   scanner-shaped intermediate representation.
8. An unpublished immutable candidate tarball precedes both consumer
   receipts. Publication follows both receipts and clean audits.
9. The ≥10× threshold binds the exact-bootstrap confidence interval's lower
   bound at every declared grammar scale. A point estimate, observed minimum
   or large-graph result cannot waive a smaller RED scale.
10. Generic exports need two proven consumers or are pruned. `/utils` is
    retained only if two exact external consumers are proven.
11. This is tranche development. Research kernels remain under
    `test/prototypes/**`; production execution does not land until the
    candidate, consumer, deletion and admission evidence is complete.
12. KISS and net deletion govern every production cut. No process-only proof
    apparatus substitutes for executable tests, profiles and consumer diffs.

## Wave

| Wave | Goal | Agents | Closes on | Status |
|---|---|---:|---|---|
| [B.W0 - Candidate-to-Release Closure](waves/W0.md) | Form, falsify, consume and release one generic runtime without parallel surfaces. | 1 serial parser owner; no spawned task | All wave hard gates, immutable pack and consumer receipts, release tag/pack, released-coordinate Value rebind | `in_progress` |

## Ordered release path

The single wave executes these boundaries in order. A later boundary cannot
borrow credit from an earlier prototype.

1. **Formation repair.** Reconcile archaeology, M1/M2/M3, S-family evidence
   and hostile audits; keep every RED plane RED.
2. **Runtime convergence.** Resolve exact transactions, slots, source
   projection, recovery, diagnostics, bounded recursion, memo policy,
   unordered composition, allocation, IC/deopt/GC and result materialization
   through the smallest private executable kernel.
3. **Value grammar proof.** Value authors the sole scannerless CSS Syntax,
   selectors, at-rules, VDS, Webref and named-extension grammar against the
   candidate runtime, with WPT/browser differentials and canonical inverse
   behavior.
4. **JSON consumer proof.** The parse-that JSON grammar consumes the same
   primitive surface; equivalent output and displaced-path deletion are
   recorded. BBNF is not substituted.
5. **Formal admission.** Corrected AB/BA batch profiles, exact bootstrap
   CI-low, allocation, CPU, deopt and GC artefacts prove ≥10× at every frozen
   scale and equal semantic plane. Two fresh adversarial passes return clean.
6. **Immutable candidate.** Produce one unpublished `npm pack` tarball with
   exact source commit and SHA-256; Value and JSON consume that identical
   object and return receipts.
7. **Release.** Publish the successor only after gates 1–6 are green, then
   rebind Value to the released coordinate and rerun its tests, build,
   browser/WPT differentials and pack proof.
8. **Post-W3 ABI receipt.** Send BBNF the frozen generic surface after Value
   W3; no implementation dependency or competing parser is introduced.

## Critical files and ownership

| Surface | Owner | Rule |
|---|---|---|
| `typescript/src/parse/{parser,state,leaf,lazy,packrat,utils}.ts` | parse-that | Generic runtime only; production changes require consumed prototype proof and net consolidation. |
| `typescript/src/parse/parsers/json.ts` | parse-that non-CSS consumer | Same-primitive receipt and deletion/equivalence evidence. |
| `typescript/test/prototypes/**` | parse-that research | Private, executable, removable; never exported. |
| `typescript/test/**`, `docs/tranches/B/**` | parse-that | Correctness, performance, audit and durable handoff evidence. |
| Value CSS grammar, AST, inverses, transform/path and UI | Value | Parse-that reads receipts only and does not write this surface. |
| Keyframes CSS/path/serializer migration | Keyframes through Value | Consumer receipt only. |
| BBNF | BBNF after Value W3 | ABI receipt only. |

## Completion criterion — hard gates

Tranche B closes only when:

1. the canonical parent, `PROGRESS.md`, wave, coordination and `FINAL.md`
   reconcile every M/S-family disposition and hostile amendment;
2. focused and package tests, strict TypeScript, build, subpath and export
   proofs are green with exact pass/skip counts;
3. the runtime returns equivalent values, exact slots, UTF-16 spans,
   diagnostics, successful recovery diagnostics, rollback, typed faults and
   failure frontiers across success, mismatch and hostile inputs;
4. recursion faults before V8 `RangeError`, memo data is run/source-owned,
   unordered composition is deterministic and no speculative side effect
   leaks;
5. executable Value-owned CSS coverage spans the frozen CSS Syntax,
   selectors, at-rules, VDS and Webref denominator plus separately named
   Value additions, with WPT and browser differentials;
6. the JSON consumer uses the same generic primitives and returns the
   frozen equivalent products;
7. consumer diffs prove deletion or consolidation of displaced parser,
   scanner, serializer and compatibility machinery;
8. ≥10× holds at exact-bootstrap CI-low for every frozen binding scale and
   equal semantic plane, including successful recovery and result
   materialization;
9. CPU, heap/allocation, IC/hidden-class, optimization/deoptimization and GC
   artefacts are sealed to source, environment, input and candidate pack;
10. `/utils` has two exact consumers or is pruned before release;
11. one immutable unpublished candidate tarball is consumed by Value and
    JSON, and two clean adversarial passes accept the same object;
12. the successor is released, Value rebinds to the released coordinate,
    and its full gates remain green;
13. the BBNF post-W3 receipt names only the frozen generic surface;
14. no raw alias, scanner/token plane, fallback runtime, public CSS surface
    or unconsumed export exists;
15. the integrity close checks find no unauthorized stash/reset, dirty
    evidence input or unsealed artefact.

## Debt and terminal dispositions

There is no silent deferral. Open work is owned by B.W0 and keeps the tranche
open. A mechanism that cannot meet a gate is `RETIRED` with evidence; an
out-of-scope domain surface is `ARCHIVED` under its owning repository. BBNF
work before Value W3 and any parse-that-owned CSS grammar are permanently
out of scope.

## Brittleness window

None. The current package remains green while private candidates are formed.
Any future production carve must declare and restore its own bounded window
inside B.W0 before integration.
