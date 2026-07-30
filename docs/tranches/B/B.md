# Tranche B — Scannerless runtime formation and release

Tranche B closes the parser-development question: whether one small,
source-direct parse-that runtime can execute the Value-owned full CSS grammar
and the parse-that JSON grammar with exact products and a formal ≥10× CI-low,
without a tokenizer, scanner facade, compatibility path, or second runtime.

## Thesis

Authored combinators remain the grammar. A compact runtime may lower only the
generic source-direct operations that two live grammars consume. Formation is
admitted only after three full-subject passes, isolated equivalent-product
prototype proof at every frozen scale and result plane, and two clean
formation audits. Execution then freezes and packages one candidate, consumes
it before publication, and releases only after displaced machinery is deleted.

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
4. BBNF is receipt-only after `V.L6.css-path-abi-freeze`. It creates no CSS
   parser, registry or release prerequisite.
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
| [B.W0 - Candidate-to-Release Closure](waves/W0.md) | Form, falsify, consume and release one generic runtime without parallel surfaces. | 1 serial writer; bounded disjoint research, prototype and critic seats | All wave hard gates, immutable pack and consumer receipts, release tag/pack, released-coordinate Value rebind | `in_progress` |

## Ordered formation and release path

The single wave executes these boundaries in order. A later boundary cannot
borrow credit from an earlier prototype.

### Formation — zero execution or release credit

1. **P1 full-subject pass.** Reconcile archaeology, M1/M2/M3, S-family
   evidence and hostile audits across transactions, slots, source projection,
   recovery, diagnostics, recursion, memo policy, unordered composition,
   allocation, IC/deopt/GC and result materialization.
2. **P2 full-subject pass.** Challenge the complete P1 subject and implement
   or retire its surviving incompatible mechanisms without narrowing the
   denominator.
3. **P3 full-subject pass.** Re-run the complete subject adversarially and
   converge only evidence-backed, consumed generic mechanisms.
4. **Isolated prototype proof.** On a frozen private prototype, establish
   equivalent values, UTF-16 spans, diagnostics, recovery and failures plus
   exact-bootstrap ≥10× CI-low at every binding scale and result plane.
5. **Formation Clean A.** A fresh hostile audit accepts the P1→P2→P3 record,
   frozen prototype and isolated proof.
6. **Formation Clean B and admission.** A second independent hostile audit
   accepts the same evidence. Only this boundary admits formation; it creates
   no candidate-consumption, execution, publication or release credit.

### Execution and release

The root receipt reported at SHA prefix `060995` is modeled only as
`P.exec.PB1-order-ack`: an execution-phase acknowledgment of the future
execution order and authority. It feeds step 7 only after formation
admission. It does not feed P1 and carries zero formation, candidate,
consumption, proof, publication or release credit.

7. **Private/formal source freeze.** Translate the admitted prototype into
   the smallest locally correct and reproducible production-source candidate.
8. **Immutable unpublished candidate.** Produce one `npm pack` tarball from
   the frozen source with exact commit, file manifest and SHA-256. Later
   evidence names this object; no consumer reads a mutable link or dirty head.
9. **Exact-SHA consumption.** Value and parse-that's `jsonParser` consume the
   same candidate tarball. Value authors the sole scannerless CSS Syntax,
   selectors, at-rules, VDS, Webref and named-extension grammar; JSON uses the
   same generic primitives. BBNF is not substituted.
10. **Consumer equivalence, deletion and formal proof.** Value and JSON return
   exact receipts for values, spans, diagnostics, recovery and failures;
   delete displaced machinery; run WPT/browser differentials; and establish
   corrected AB/BA exact-bootstrap ≥10× CI-low at every frozen binding scale
   and equal semantic plane, with allocation, CPU, deopt and GC artefacts.
11. **Execution clean audits.** Two fresh adversarial passes accept the
    frozen source, exact tarball, consumer diffs and formal evidence.
12. **Release.** Publish the accepted successor only after gates 7–11 are
   green.
13. **Value released-coordinate rebind.** Rebind Value to the released
   coordinate and rerun its tests, build, browser/WPT differentials and pack
   proof.
14. **Post-W3 ABI receipt.** Send BBNF the frozen generic surface after
   Value `V.L6.css-path-abi-freeze`; no implementation dependency or
   competing parser is introduced.

## Critical files and ownership

| Surface | Owner | Rule |
|---|---|---|
| `typescript/src/parse/{parser,state,leaf,lazy,packrat,utils}.ts` | parse-that | Generic runtime only; production changes require consumed prototype proof and net consolidation. |
| `typescript/src/parse/parsers/json.ts` | parse-that non-CSS consumer | Same-primitive receipt and deletion/equivalence evidence. |
| `typescript/test/prototypes/**` | parse-that research | Private, executable, removable; never exported. |
| `typescript/test/**`, `docs/tranches/B/**` | parse-that | Correctness, performance, audit and durable handoff evidence. |
| Value CSS grammar, AST, inverses, transform/path and UI | Value | Parse-that reads receipts only and does not write this surface. |
| Keyframes CSS/path/serializer migration | Keyframes through Value | Consumer receipt only. |
| BBNF | BBNF after `V.L6.css-path-abi-freeze` | ABI receipt only. |

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
13. the BBNF receipt after `V.L6.css-path-abi-freeze` names only the frozen
    generic surface;
14. no raw alias, scanner/token plane, fallback runtime, public CSS surface
    or unconsumed export exists;
15. the integrity close checks find no unauthorized stash/reset, dirty
    evidence input or unsealed artefact.

## Current formation evidence

S7 is banked at `20b5f52`. It locally clears the declared 96-name
terminal/sequence/recovery CI-low planes against accepted M2: 10.405×
matched, 11.285× internal, 10.257× result, 20.569× late, 12.894× failure and
39.532× diagnostic failure; every corresponding 753-name low exceeds 75×.
This evidence grants no P3, formation, candidate, consumption, execution or
release credit. P1 reconciliation is complete at `69f72f7`; the formation
remainder includes complete P2/P3, every-subject proof and both clean pairs.
Value-owned stylesheet recovery and live Value/JSON receipts are later
execution work and grant no
isolated-formation credit.

S8 is banked at `27bf872`. Cached recursion, mutual recursion and typed
parse-owned nesting are correctness-green, but generic recursive
success/result is only 1.212–1.331× and balanced-discard fusion is only
8.400–8.842× at the binding 96-leaf scale. Its full-denominator signal does
not waive that RED row. S8 grants no formation, candidate, consumer,
execution or release credit.

U is banked at `19ad1ac`. Its 24 unordered tests (12 per S/D family) plus 13
S-kernel regressions prove bounded scannerless `&&`/`||` semantics, authored
slots, spans, recovery rollback, diagnostic labels, overlap correctness and
4/8/16/33-member termination. S is retired as an unordered family: it
enumerates available arms and has no disjoint-FIRST route. D keeps a private
compiled-FIRST fast path plus bounded residual search for overlap, but every
formal timed fixture is disjoint (`residuals: 0`). Its disjoint point
estimates remain RED: 1.427–2.371× at four members, 2.708–3.406× at eight,
4.607–6.156× at sixteen, and a 9.559× success-AB point at thirty-three.
Residual-overlap performance was unmeasured at that coordinate.

P2-UO is banked at `68055bd`. A domain-neutral 4/8/16/33-member product
forces the D residual route on every timed success while preserving exact
authored slots, UTF-16 spans and one immutable successful recovery diagnostic.
Its accepted-M2 equal-plane AB/BA ratios are only 0.7362–2.2994×; binding
state, internal and result points are slower than control, and stable
8/16/33-member grammar heap is about 2.06–2.40× control. D is therefore
terminally retired with S. The fixture does not prove same-FIRST speculative
recovery: recovery has a unique FIRST code and that hostile case remains
explicitly routed.

P2-L is banked at `5822ae2`. All 51 CSS/JSON-shaped leaf capture, value and
failure products are equal at 8/64/4096 UTF-16 units, but success is only
0.0718–1.3079×. Callback loops, declarative ASCII tables and a public sticky
wrapper are killed.

P2 shaped products are banked at `d62b73a`. The recursive JSON product passes
the frozen 33-valid/7-invalid corpus, while the domain-neutral
stylesheet-shaped product exercises exact spans, names/escapes, scalar
values, URL, balanced calls, immutable successful recovery and opaque
syntax. Across 20 matched AB/BA state/value/result/failure points, JSON is
0.8728–1.0021×, the fixture is 1.0937–1.2920×, and failures are
1.1658–1.2041×. Candidate retained heap is about 1.166× control. The staged
full-product family and its private source-leaf seam are therefore killed,
not advanced. The corpus remains reproducible falsification evidence only.

P2 remains active for row-complete full-subject disposition and
cold/hot/memo/allocation/optimizer evidence reconciliation. No unordered
candidate survives. The live production parser source remains rejected M3
at `90d4ec5`; M2 at `de36d57` remains the performance control. No bootstrap,
P3, formation, execution or release credit follows.

## Debt and terminal dispositions

There is no silent deferral. Open work is owned by B.W0 and keeps the tranche
open. A mechanism that cannot meet a gate is `RETIRED` with evidence; an
out-of-scope domain surface is `ARCHIVED` under its owning repository. BBNF
work before `V.L6.css-path-abi-freeze` and any parse-that-owned CSS grammar
are permanently out of scope.

## Brittleness window

None. The current package remains green while private candidates are formed.
Any future production carve must declare and restore its own bounded window
inside B.W0 before integration.
