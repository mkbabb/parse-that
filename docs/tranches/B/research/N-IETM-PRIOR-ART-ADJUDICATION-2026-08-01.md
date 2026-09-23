# N-IETM prior-art adjudication

Date: 2026-08-01

Status: **ALGORITHMIC SUBSTRATE FOLDS TO PRIOR ART — PARSE-THAT INTEGRATION HYPOTHESIS ONLY — ZERO NOVELTY/PRODUCT CREDIT**

## Ruling

N-IETM is not a defensible claim to invention of incremental packrat parsing.
Persistent memo reuse across edits, examined-region invalidation, relocation,
shifting interval indexes, transactional parser state, selective/state-aware
memoization, incremental semantic reuse, and immutable error-bearing trees all
have material prior art. The next private experiment may continue only as a
prior-art-aware integration and equivalence assay for parse-that's callback-rich
ABI.

Canonical wording:

> N-IETM is a prior-art-aware integration experiment. Its examined-region
> invalidation, cross-edit memo reuse, relocation, shifting interval index, and
> transactional/selective-memo foundations are established prior art. No broad
> algorithm-novelty claim is made. The open local hypothesis is whether
> parse-that can conservatively bind grammar, action, environment, source-read,
> diagnostic-policy, and effect identity across versions while preserving its
> complete callback-rich observable product—values, slots, UTF-16 spans,
> failures, faults, rollback, recovery, diagnostics, provenance, depth,
> selection, and final offset—and still achieve unit-bearing PL-BE. Even that
> narrower contribution remains unproved and is an integration hypothesis
> unless comparative evidence establishes otherwise.

Local non-isomorphism to parse-that's killed M1–P6 mechanisms does not imply
world novelty. PL-BE can establish local utility; it cannot establish novelty.

## Decisive primary sources

1. Dubroy and Warth, *Incremental Packrat Parsing*, DOI
   [10.1145/3136014.3136022](https://doi.org/10.1145/3136014.3136022):
   preserves memo tables across edits, tracks examined rather than merely
   consumed regions, invalidates overlaps, relocates unaffected success and
   failure results, and requires fresh-parse equivalence.
2. Yedidia and Chong, *Fast Incremental PEG Parsing*, DOI
   [10.1145/3486608.3486900](https://doi.org/10.1145/3486608.3486900):
   adds shifting interval trees, tree-shaped memo entries, dynamic parsers, and
   explicit cold/memory costs.
3. Ohm's documented Matcher exposes `replaceInputRange()` and reuse of prior
   partial results; incremental semantics reuse unaffected CST/attribute
   results. See the [API reference](https://ohmjs.org/docs/api-reference),
   [incremental semantics](https://ohmjs.org/docs/incremental-semantics), and
   [v18 migration chronology](https://ohmjs.org/docs/releases/ohm-js-18.0).
   Removal from a later public API does not restore novelty.
4. Laurent and Mens, transactional parser state under backtracking and
   memoization, DOI
   [10.1145/2997364.2997370](https://doi.org/10.1145/2997364.2997370).
5. Chida et al., state-dependent packrat memoization, DOI
   [10.1145/3377555.3377898](https://doi.org/10.1145/3377555.3377898).
6. Thielecke, parsing-action effects, DOI
   [10.1016/j.scico.2013.04.010](https://doi.org/10.1016/j.scico.2013.04.010);
   Hedin, incremental attributes with side effects, DOI
   [10.1007/3-540-51364-7_14](https://doi.org/10.1007/3-540-51364-7_14);
   Acar, Blelloch, and Harper, selective memoization, DOI
   [10.1145/604131.604133](https://doi.org/10.1145/604131.604133).
7. Tree-sitter's [edited-tree reuse](https://tree-sitter.github.io/tree-sitter/using-parsers/3-advanced-parsing.html)
   and Roslyn's [incremental identity](https://learn.microsoft.com/en-sg/dotnet/api/microsoft.codeanalysis.syntaxnode.isincrementallyidenticalto)
   and [full-fidelity trees](https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/get-started/syntax-analysis)
   establish mature adjacent product models.

## Narrow local hypothesis

The experiment remains useful because parse-that exposes arbitrary `.map`,
`.chain`, `.mapState`, custom parser, and RegExp callback behavior while its
observable result includes more than a CST or match length. A reusable cell is
eligible only if all source reads and grammar/action/environment/policy/effect
identities are closed. Unknown or opaque callbacks are non-reusable. A hit must
atomically equal a fresh parse across the complete result, not just value and
offset. In-progress left-recursive work never crosses a source version.

This may yield a useful conservative integration contract. It is not currently
claimed as a new parsing algorithm.

## Fatal-first experiment order

Before timing, F0 must close these independent controls:

1. `OHM-ALGORITHM-EQUIVALENCE`: compare a representable grammar and immutable
   edit stream with pinned Ohm v17 Matcher or a faithful Dubroy/Warth control.
   Reproducing its examined/failure/CST behavior grants no novelty.
2. `GPEG-STRUCTURE-EQUIVALENCE`: identify whether the proposed shifting index
   or tree entries add anything beyond GPeg.
3. `CALLBACK-ENVIRONMENT-IDENTITY`: mutate captured scalars/objects, module
   globals, and environment while source and function object stay unchanged.
4. `UNOBSERVED-SOURCE-READ`: a callback reads outside the declared interval;
   an edit there must invalidate or the callback must remain non-reusable.
5. `EFFECT-EXACTLY-ONCE`: failed arms, backtracking, left-recursive seed/grow,
   and recovery must reproduce the fresh effect sequence exactly once.
6. `DIAGNOSTIC-POLICY-IDENTITY`: flip diagnostic, recovery, fault, depth, or
   provenance policy without changing source.
7. `NEGATIVE-EOF`: cover failed choice, negative lookahead, EOF, and the exact
   `string("ab").or(string(""))` examined-versus-consumed witness.
8. `UTF16-RELOCATION`: astral/lone-surrogate edits before reused regions must
   preserve spans, line/column, found windows, and source slices.
9. `BRANCHING-VERSIONS`: two children of one source version may not
   cross-contaminate cells or callbacks.
10. `COMPLETE-PRODUCT`: exact value, slots, spans, ordinary failures, typed
    faults, rollback, recovery, diagnostics, provenance, depth, selection,
    freeze/extensibility, and final offset.
11. Differential grammar/edit/callback fuzzing against a cold fresh parse.
12. Per-leaf bypass/control-of-control with no expected-code oracle.

Any mismatch retires the affected reuse class before performance measurement.
If conservative eligibility removes meaningful reuse or measured K cannot
repay cold construction, memory/GC, package, and migration costs, retire the
family locally as well.

## Credit and boundary

This document changes classification, not execution authority. It grants no
prototype, parser, CSS, Value, consumer, package, release, or novelty credit.
The sole possible N2 action remains one isolated PL-BE integration experiment
after the N1-A4 byte-authority packet is independently accepted and committed.
