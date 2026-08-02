# Novelty-first findings and resume handoff

Date: 2026-08-01

Status: **N1-A3 SOURCE CORRECTION BANKED — FRESH AUDIT REQUIRED — N2 BLOCKED — NO RELEASE**

## Exact owner state

- repository: `/Users/mkbabb/Programming/parse-that-css-totality`;
- branch: `codex/css-totality-combinators-20260729`;
- authenticated N1-A3 parent HEAD:
  `e663a91b5dca760ef181f0abf661cf7d1037010a`;
- immutable N1-A commit:
  `a04a7e658bee32a1fb252a4e5b4f3ce359a5947d`;
- immutable N1-A1 correction commit:
  `914957fb354e80b51207118f1cc5f01564111b7a`;
- immutable N1-A2 correction commit:
  `e663a91b5dca760ef181f0abf661cf7d1037010a`;
- protected pre-existing untracked paths: `data` and
  `docs/tranches/B/PARSER-RESURRECTION-HANDOFF-2026-07-31.md`;
- resurrection handoff SHA-256:
  `988d539431168a6cabbbc8a97a12da3c62a1c113032b84b58eecfbe5f9d03d3d`;
- A1 owner amendment SHA-256:
  `f13223e17eefbf7c6ef8ceb96aab317ad001e22342f6b9f3aac08c0ff97b2cb4`;
- accepted M2 speed control:
  `de36d57dccdd20068b8c11a78f6e83d42e7d681f`;
- host: Node `26.0.0`, V8 `14.6.202.33-node.19`, npm `11.12.1`,
  TypeScript `5.9.3`.

Current tracked production parser source was read but not modified. The
pre-existing untracked paths were neither read as authority nor staged.

## Source-only boundary packet

| Artifact | SHA-256 | Lines | Role |
|---|---|---:|---|
| `research/NOVELTY-FIRST-MECHANISM-ATLAS-2026-08-01.md` | `0ad39480dafa973c424fba9983780f150842cf0c4dded37075e9e1623a54a5c1` | 457 | Orthogonal mechanism atlas, primary sources, genealogy, cost/fatal/host effects, equivalence-retirement matrix. |
| `coordination/NOVELTY-PASS-REGISTRY-AND-EXPERIMENT-LAW-2026-08-01.md` | `76ce7afcee2d969b45fc0bd81574f4f306455973cdf18d025d7b4709a72020db` | 410 | N1–N3 registry, immutable N1-A/A1/A2 chronology, N1-A3 raw-authority correction, and blocked N2 dispatch. |
| `coordination/NOVELTY-EVIDENCE-REGISTRY.schema.json` | `0298093d279364c26f0b2cc7c6d05b2c5e082b86f2104690a9597a13dcd55317` | 386 | Strict ten-record Draft 2020-12 tagged union with safe numeric bounds and canonical decimal counters. |
| `coordination/NOVELTY-RAW-ROW.schema.json` | `fc51edf187deb239ce4e55eb89e5566e456d19d80661f1a9b6196fdd553e61f6` | 160 | Closed authenticated NDJSON schema for full ROW and resolved RUN truth. |
| `coordination/NOVELTY-EVIDENCE-REGISTRY.semantic.mjs` | `53998004bc3e85ec486c82052f18d416abb3286a71e52ee75a11568461ac5d1f` | 900 | Sole validator: strict recursive JSON, external trust, graph closure, exact raw projection, product relation, and lexical artifacts. |
| `coordination/NOVELTY-EVIDENCE-REGISTRY.semantic.test.mjs` | `157bedb86a1e3afcc9190d9b0c04d71fa7dacc75230ad32bd3814ee68442f692` | 556 | Gold/reversed controls and independent literal-code hostile runner; no shadow validator. |
| `coordination/NOVELTY-EVIDENCE-REGISTRY.baseline.json` | `dffe95ef86a13debb373ae3c20cb48f612e24d6771348899533f5da1cf7bf1ca` | 187 | Ten-record gold with one exact raw row and distinct authenticated descriptors. |
| `coordination/NOVELTY-EVIDENCE-REGISTRY.mutants.json` | `9107a27ee6a3b53c62963fcf73097384a330f814eb614e4d60f83f08fa550e7e` | 104 | 102 one-owner mutants with no embedded expected-code oracle. |
| `coordination/NOVELTY-EVIDENCE-REGISTRY.results.json` | `0d4dc73db88aa958b9fc417ead591fc3cc8bbf23b2865f04538c7fb9d7a130cc` | 742 | Gold controls 2/2 GREEN and hostiles 102/102 exact RED. |
| `artifacts/novelty-n1-a1-semantic-registry/raw.ndjson` | `2e33d38adb13d038553b6f1801f0e5c4f35cbe8d2ba79e103c4ca0f4097a3896` | 1 | Exact raw source for every performance-bearing ROW and resolved RUN field. |
| `artifacts/novelty-n1-a1-semantic-registry/MANIFEST.sha256` | `a6a54678c54451ba5ce225534a82baa6e378b5c6e09ca420783d8f812490d23f` | 15 | Exact source/fixture/results manifest. |

N1-A, N1-A1, and N1-A2 remain immutable chronology. N1-A1's externally pinned
validator passed its shipped `48/48`, but the fresh audit found that products
could cross-swap between fixtures, registry timing/counters need not match raw
bytes, and lexical path aliases passed. N1-A2 closes all three: the fixture
owns the row product, every registry measurement/identity/selection is derived
from a uniquely consumed strict raw line, and artifact paths are lexical normal
form. Its fresh audit then found unbound sink/RUN/ROW fields, rounded adjacent
large counters, and duplicate-key acceptance. N1-A3 closes those defects with
an authenticated complete ROW/RUN projection, decimal-string/`BigInt`
counters, safe remaining numeric bounds, and a recursive duplicate-key-aware
JSON parser. The N2 path remains absent. Another independent non-author replay
is required, so N1-A3 is not yet N2 authority.

For N1-A3, `jq empty`, both Ajv Draft 2020-12 strict compilations, Node syntax
checks, the ten-record/one-raw semantic gold, controls `2/2`, hostiles
`102/102`, the 15-entry manifest, N2-root absence, and `git diff --check` were
green. Strict TypeScript, 14/14 test files with 134/134 tests, and the
production build were green. The nine non-performance proofs cleared manifest,
no-CSS-surface, four subpaths, four packrat checks, no-span, and
no-dead-combinator. `proof:perf`, novelty benchmarks, prototypes, consumers,
browser, package, and release commands were deliberately not run.

## Independent research receipt

Two independent GPT Sol xhigh read-only views completed before owner synthesis:

1. genealogy/falsification against live source and P1–P6; and
2. Node/V8/WASM reachability plus complete-product and consumer economics.

Both reproduced the branch, handoff, A1, and pre-existing benchmark identities.
They agreed that ordinary memoization, event/arena projection, bytecode/VM,
leaf-WASM, tuple/name fusion, per-run recovery, continuation carriers, live
derivatives, and VPG-as-full-CSS collapse to existing or killed families. They
also agreed that cross-version dependency state is the strongest unexplored
center. Their differences were preserved as born-RED gates for direct-source
normalization, WASM, and GLL rather than resolved by preference.

## Adjudicated findings

### Leading center: N-IETM

Effect-aware, edit-indexed transactional memoization is the only leading KEEP.
Its novelty is cross-version reuse under explicit source, parser graph, action,
read-dependency, failure, recovery, and product identity—not a new return ABI or
same-run cache.

Every reusable cell binds consumed and examined intervals, failed arms and
negative reads, child dependencies, action/effect version, and the complete
immutable public product. Unknown-effect `.map`, `.mapState`, `.chain`, and
`.call` nodes rerun. Each edit result is compared to a fresh full M2 parse plus
the semantic-law envelope. Cold first parse remains binding; edit rows never
redefine a one-shot workload. N-IETM targets PL-BE only. Local edit rows may
report descriptive 2x/3x ratios, but cold index construction makes the family
ineligible for the active every-row PL-2X/PL-3X laws.

Current packrat is not the prototype substrate: its completed cells contain
only offset/value/error; its epoch tables are deliberately fresh per top parse;
and they omit grammar/source/action/edit/diagnostic identities. The private F0
uses immutable source versions, completed entries with full examined/EOF and
effect/product identity, and a persistent shift interval index. Recovery,
diagnostics, faults, opaque RegExp, arbitrary callbacks, and custom parsers are
initially non-reusable. No public API widens.

### Unresolved born-RED holds

- N-DNF survives only long enough to prove that deterministic whole-grammar
  direct-source normalization removes S/C/V/P3 work rather than emitting it in
  a new shape.
- N-WRR survives only long enough to prove that compiled WASM control, linear
  memory, sparse eligibility, and exact region projection remove V/E/L/F2 work
  beyond the existing BBNF WASM VM/check/formatter benches.

Neither has prototype authority from its label. Failure of the structural
non-isomorphism predicate retires it before timing.

### Fatal-only and retired axes

- N-GLL may run one tiny descriptor/GSS hostile probe only; it is killed on a
  single live descriptor, absent shared tail, forest/product duplication, or
  the first deterministic-row law miss.
- Raw-UTF-16 VPG is pruned as a full-CSS runtime because strings, comments, and
  escapes make delimiter stack action context-sensitive. A table observation
  may fold into a surviving compiler without a symbol tape.
- selective same-version memo, Pika/reverse DP, event/arena, leaf-WASM, regional
  parallelism, and direct CSS fusion receive no independent dispatch.

## Corrections bound for the next executor

1. M2 is the performance control, not the semantic oracle. Current rollback,
   typed depth, recovery, provenance, and immutable-product laws remain binding.
2. `jsonParser` lacks EOF; whole-document rows append EOF or assert final
   offset.
3. Value currently imports no parse-that code. Its malformed known declaration
   behavior is fail-whole. A recovery-labeled replacement without that product
   is invalid.
4. The 753 Webref rows are names, not CSS grammar coverage. Nine WPT-derived
   seeds are seeds, not conformance.
5. Generic, semantic-law, Value, Keyframes, and standards products remain
   different IDs with different byte-complete obligations.

## Exact next boundary

Do not create a prototype until a fresh independent audit accepts N1-A3, its
committed SHA is the sole dispatch input, and the still-absent root is assigned.

Then execute only in this order:

1. fresh independent source audit of the N1-A3 15-entry manifest, both strict
   schemas, gold/raw ROW/RUN derivation, controls, 102 hostile dispositions,
   duplicate-key rejection, external trust boundary, product relation, path
   normal form, and absent root;
2. only after acceptance, exactly one N-IETM Luna xhigh greenfield prototype against accepted and
   rebuilt M2 plus the semantic-law envelope, using the frozen
   generic/Value/standards suites;
3. fresh Sol xhigh hostile critique of the immutable N-IETM root;
4. owner agglomeration; and
5. stop. N-DNF, N-WRR, and N-GLL remain NO-GO until a later explicit owner
   authority resolves their born-RED predicates.

An interrupted root freezes permanently. A correction uses a new absent root.
No current or failed evidence root is resumed.

## Convergence and credit

- novelty source Pass N1-A: research `2/2`, owner synthesis `1/1`, immutable
  chronology `1/1`;
- N1-A1 collection correction: immutable at `914957f`; fresh audit completed
  and found three material false-greens;
- N1-A2 correction: immutable at `e663a91`; fresh audit completed and found
  four material false-green classes;
- N1-A3 correction: gold controls `2/2`, raw rows `1/1`, hostiles `102/102`,
  fresh independent acceptance `0/1` — **banked but not dispatch authority**;
- N2 prototypes: `0/4`;
- N3 critiques/agglomeration: `0/5`;
- strict 3x, strict 2x, measured break-even: each `0/5`;
- Value receiver: `14/34 = 41.18%`;
- full CSS/WPT/browser, product execution, package, API, consumer migration,
  release, Value/Keyframes/BBNF/Fourier credit: **0**.

This closes only the owner correction turn. The long-horizon parser goal
remains active, N2 is blocked on the fresh audit, and no successor exists.
