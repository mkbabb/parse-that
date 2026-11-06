# Tranche U — checked kernel, canonical regex, and real consumers

Status: **FORMED; born RED**.

Tranche T owns the JavaScript/TypeScript definition algebra, invocation state,
package surface, and its half of the coordinate contract. U begins only from a
sealed `GESTALT-T` baseline. It replaces the unsafe Rust substrate, establishes
one regex language and execution route, proves the cross-language contract, and
makes packed value.js adoption a release gate.

## Lock projection

| Lock | U authority | Closure waves |
|---|---|---|
| PT-K | Rust run/arena/span safety, scanners, memory bounds, Apple/aarch64 kernels | U.W0–U.W2 |
| PT-R | regex grammar, HIR, Unicode, assertions, ordering, captures, VM, bootstrap | U.W3–U.W5 |
| PT-C | coordinate and semantic manifest; Rust/TS/WASM isomorphism | U.W6 |
| PT-V | packed value.js adoption and ask-letter closure | U.W7 |
| GESTALT-P1 | whole parse-that semantic, structure, package, and performance audit | U.W8 |
| GESTALT-P2 | fresh totality iteration after all P1 corrections | U.W9 |

Artifact truth and structure are cross-cutting planes. An output without a
source/semantic/generator/toolchain manifest is not an artifact; a graph without
all authored modules, package faces, generated inputs, tests, and copy/load edges
is not a topology.

## Directed product

```text
GESTALT-T
  ├─ U.W0 counterexamples ─→ U.W1 checked Rust kernel ─→ U.W2 scanners
  └─ T regex contract ─────→ U.W3 syntax/HIR ─────────→ U.W4 VM
                                      U.W2 + U.W4 ────→ U.W5 bootstrap
              T + U.W1–U.W5 ─────────────────────────→ U.W6 crossings
                                      U.W6 ───────────→ U.W7 value.js
                                                   all → U.W8 → U.W9
```

No wave may preserve an old route as a compatibility fallback. A replacement
and its deletion land atomically. Breaking changes are the expected form when
the incumbent contract is false.

## Structural constitution

The target is a small set of cohesive modules, not a transcription of current
filenames:

```text
rust/
  parse_that/src/
    run/          input, cursor, checkpoint, diagnostic, recovery
    combinator/   definition algebra and evaluation; no public raw executor
    scanner/      scalar and honest aarch64 kernels behind one contract
    value/        checked spans and borrowed/owned value boundaries
  regex/src/
    syntax/       token, parser, diagnostic
    hir/          node, class, repetition, assertion, capture
    compile/      instruction, program, analysis
    vm/           run, thread, capture, result
    unicode/      pinned generated tables and provenance
  bootstrap/src/  seed, stage, fixed_point
```

Names inside a directory strip the directory name: `syntax/token.rs`, never
`syntax/regex_token.rs`; `vm/run.rs`, never `regex_vm_run.rs`. A module exists
only when its files share one invariant and it owns a stable narrow surface.
Tests live outside production source in an isomorphic tree. Generated tables
stay whole when splitting would obscure provenance or consumption.

## Universal evidence gates

1. Every design/review spawn declares `gpt-5.6-sol`; its recorded model is
   checked before evidence is admitted. Inherited or mismatched metadata is RED.
2. Every graph cluster receives two fresh hostile reviews that assume it is
   wrong, followed by a fresh adjudicator that marks each claim correct,
   incorrect, or unproven. Accepted corrections cause re-extraction.
3. Semantic claims use differential or property witnesses over acceptance,
   value, span, diagnostic, captures, and termination—not consumer count.
4. Apple Silicon is the only native architecture surface. No x86 vocabulary,
   cfg, intrinsic, feature, benchmark, generated route, or documentation remains.
5. Clean build, test, package, and regeneration run twice from empty output
   directories and produce identical declared artifacts.
6. U closes only after two consecutive complete audits find no unresolved defect.

## Completion

U is complete when PT-K, PT-R, PT-C, and PT-V are GREEN; old SpanParser/CSS/regex
and scanner routes are absent; value.js consumes the packed candidate; and two
fresh whole-repository iterations prove semantic totality, structural
dirigibility, deterministic artifacts, and bounded performance. That immutable
baseline is the only parse-that input admitted to the bbnf-lang product cut.

