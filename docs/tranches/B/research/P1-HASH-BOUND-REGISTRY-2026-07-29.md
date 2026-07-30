# P1 full-subject hash-bound registry

Date: 2026-07-29

Pass: `P1`

Disposition: **COMPLETE AS RECONCILIATION; FORMATION REMAINS RED**

This registry closes only the first full-subject reconciliation pass. A
`GREEN`, `RED`, `OPEN`, or `RETIRED` row is a complete P1 disposition when
its evidence and next challenge are exact. It is not implementation,
prototype-proof, formation-admission, candidate, consumer, release, Value,
Keyframes, or BBNF credit.

## Frozen evidence coordinates

The abbreviated commit names below resolve in this repository. Blob IDs bind
the exact source read by P1; manifest SHA-256 values bind generated evidence.

| ID | Commit / artefact | Bound object |
|---|---|---|
| `AR` | `273133b` | archaeology blob `532be6c52aa9b15440c5e5bcf61a6a9a203d3041`; Pass 1 agglomeration blob `45a102b4164e78578aed574801c8e9dbf8a7d2c9` |
| `R0` | `f1c767c` | round-zero portfolio blob `8147b5c0113f181516b8a01988e77ff3c8029f36` |
| `K0` | `79ef4b8` | hostile probe test blob `8e87a07db67c0669e0692e37bc099dac30b6cef3`; executable probe blob `ba19b145d3a0ce978f49453c478e15394d1aebe3` |
| `M2` | `de36d57` | state blob `6e757999a67817cef98bd221813a2eac185c10ce`; parser blob `05724d50465f09ee265a45781b3dd43f05870fdf` |
| `L0` | `059e129` | corrected leaf blob `02d1db1dcc9419e823f4ff4b52141cad068ecc19` |
| `XR` | `2fc18dc` | evidence-amendment blob `7cef2f194d14738d358fb11ab367a55b9dc2dcef` |
| `S7` | `20b5f52` | kernel blob `eaf52afa1d16f9ef7726a15f688ab1571f821b84`; run-state blob `4e2eb6b867aa00ff290b1ca2be1d2bccab78453e`; manifest-file SHA-256 `9b9ac24e49555178c70f2e61ce69fd3f4067e0097b171954f59ad75da80af187` |
| `S8` | `27bf872` | kernel blob `2b9733cd5b4d2496ce55c3ee4399996b86cacc5d`; hostile-test blob `ac9076d3bfdf95c789d30fdb6a89442213cca7e6`; manifest-file SHA-256 `ea50ec0eb643717d6645741db6166c5ad2beb65772d28bb7a45b5a85b6e61830` |
| `U` | `19ad1ac` | unordered source blob `0efd63da7a9f782e7a65f1e5c4a4270b23ec5f2f`; hostile-test blob `b97069db088e9df3f19b07d47d2bd8686ac476d2`; manifest-file SHA-256 `378d261ae342cabc76e11b7d42de081986139d5185d8626a14b385c60260c8d0` |
| `J0` | `cb41b0d` | incumbent JSON grammar blob `868df470c1468f62b200260c16a4111b735da7ec`; incumbent leaf blob `25905c23f76855525047309e3009460dc5907785` |

The accepted performance control is the production M2 state at `de36d57`.
`S7`, `S8`, and `U` are private, scannerless research surfaces, not a second
runtime or public API.

## Row-complete reconciliation

| Row | Full subject | P1 finding | Status | Exact evidence | P2 challenge |
|---|---|---|---|---|---|
| `P1-01` | Ownership and release order | Parse-that owns only generic runtime mechanics. Value owns the sole CSS grammar, results, inverse behavior, transform/path domains, consumer, and UI. JSON is the named non-CSS consumer. BBNF is receipt-only after `V.L6.css-path-abi-freeze`. The unpublished immutable pack precedes consumer receipts. | `GREEN` | `AR`; authority `302c623`; U reconciliation `8373167`; resume binding `cb41b0d` | Reject any CSS/domain export, dirty-head proof, mutable link, or consumer-before-pack order. |
| `P1-02` | Archaeology and prior claims | Prior scanner/token/event-tape CSS paths, stale completion claims, unequal recognizer/parser assays, rejected M3 control, prefix-shadow corpus, fixed-order minima, and one-control memory claims are not admissible evidence. | `GREEN` | `AR`, `R0`, `XR` | Re-audit every surviving claim against equal boundary, product, order, scale, and source hash. |
| `P1-03` | Scalar transaction and rollback | Offset, value, diagnostic length, and error status have one rollback choke point; faults are sticky. M2 and later prototypes prove restoration across choice, sequence, recovery, and unordered speculation. | `GREEN` | `K0`, `M2`, `S7`, `U` | Preserve one scalar checkpoint shape while introducing generic source terminals. |
| `P1-04` | Run-scoped state and isolation | Recovery diagnostics and raw memo cells are parse-owned. S6/S7 isolate run builders; no mutable evidence or raw memo state may survive between sources. | `GREEN` | `M2`, `S7`; S6 source/evidence `062c147` | Falsify re-entrancy, alternating sources, thrown projections, and diagnostics toggles. |
| `P1-05` | Exact sequence slots | Falsy values and authored slots are preserved. Fixed sequences allocate one result array and use one outer transaction. | `GREEN` | `K0`, `L0`, `S7`, `U` | Re-run with source terminals returning `undefined`, `false`, `0`, empty string, and spans. |
| `P1-06` | UTF-16 source positions and spans | Existing literal, sequence, recursion, and unordered fixtures preserve code-unit offsets, including astral input. Coverage is not yet complete for NUL, lone surrogates, CRLF, escapes, and long source leaves. | `OPEN` | `K0`, `S7`, `S8`, `U` | Add hostile generic-leaf fixtures at nonzero offsets; keep one generic span form. |
| `P1-07` | Diagnostics and recovery | S7 collects immutable entries and nested evidence once, resets the failure frontier, retains an O(1) run builder, and seals only the outer collection at consumer projection. Successful parses may retain immutable recovery evidence without widening the generic result API. | `GREEN` | `S7` | Prove identical frontier, labels, recovery spans, and failures through source leaves and nested products. |
| `P1-08` | Result materialization | Compiler-owned `.result` was unconsumed and pruned. Equal immutable consumer projection is timed; provenance survives failure and typed faults. | `GREEN` | S5 `926a3ad`; `S7` | Keep result ownership colocated with consumers and time all equivalent projection work. |
| `P1-09` | Literal terminal dispatch | Compact source-direct terminal tables, prefix winners, exact labels, and authored-span projection are locally correct. S7 clears the frozen 96/753 terminal, sequence, and recovery planes at exact-bootstrap CI-low. | `GREEN` | `S7`; accepted control `c480578`; S4 `75b76dd` | Generalize only consumed source leaves; do not extrapolate terminal speed to the full subject. |
| `P1-10` | Cold/hot dispatch | Terminal hot paths are strong and cold Unicode edges remain source-direct. No full-subject cold-start, warm dispatch, or alternating-grammar proof exists. | `OPEN` | `L0`, `S7` | Measure construction, first parse, stabilized hot parse, Unicode cold edge, and alternating grammar shapes. |
| `P1-11` | Recursion and nesting | Cached generic recursion, mutual recursion, parse-owned live/max depth, and sticky `NestingFault` are correctness-green. The generic 96-leaf planes are only 1.212–1.331×; balanced-discard fusion is 8.400–8.842× there. | `RED` | `S8` | Re-test only against an isolated Value/JSON-shaped AST and nested-span product; retire the narrow fusion absent two consumed needs. |
| `P1-12` | Memo policy | M2 makes raw memo cells source-owned and run-safe. No evidence admits broad packrat use, a new registry, or memoization as the default candidate policy. | `OPEN` | `K0`, `M2` | Measure only repeated live subgraphs; otherwise retain opt-in policy or prune unused seams. |
| `P1-13` | Unordered `&&` / `\|\|` | Bounded scannerless semantics, exact slots/spans, rollback, diagnostics, optional/repeat, and typed state-cap termination are correct. S enumerates all arms and is retired. D routes only disjoint FIRST sets and searches bounded overlap, but small-scale performance is RED. | `RED` | `U` | Challenge D against Value-shaped mixed overlap; keep it private unless every binding point clears before bootstrap. |
| `P1-14` | Generic CSS-needed leaves | The incumbent sticky `regex` is generic and scannerless but materializes substrings; the private staged compiler supports only literals. No hash-bound source-leaf tournament yet proves identifiers/names, escapes, number prefixes, strings, URLs, or delimiter content without CSS-owned types. | `OPEN` | `J0`; `typescript/src/parse/leaf.ts`; Value prototype used as oracle only | Compare the incumbent with the smallest generic source-terminal families on isolated CSS- and JSON-shaped fixtures; reject scanner-shaped products. |
| `P1-15` | Allocation and retained heap | S7 removes repeated diagnostic copying, but U retains about 1.9–2.6× the grammar heap of the idiomatic control. Full-subject allocation and materialization remain unsealed. | `RED` | `S7`, `U` | Measure grammar construction, per-run allocation, retained heap, span wrappers, string materialization, and two equal memory controls. |
| `P1-16` | IC, hidden classes, deopt, and GC | S7 terminal evidence has monomorphic parse-state ICs and no named staged-boundary bailout. S8/U mixed traces contain deoptimizations and are not clean seals. | `RED` | `S7`, `S8`, `U` | Seal source/data/Node/V8/order/batches; separate hot-only traces from diagnostics-on and failure traces. |
| `P1-17` | Frozen isolated Value-shaped product | Formation may use isolated source-direct stylesheet-shaped fixtures with equal values, spans, recovery diagnostics, opaque unknown syntax, and failures. It may not claim a live Value receipt. No complete fixture exists. | `OPEN` | Ownership at `302c623`; Value formation tuple recorded in `cb41b0d` authority | Build a domain-neutral fixture adapter around consumer-owned test types; no CSS surface enters parse-that. |
| `P1-18` | Frozen isolated JSON-shaped product | The incumbent JSON grammar uses `dispatch`, sticky regex leaves, recursion, trim, repetition, and consumer projection. No candidate-equivalent isolated product or ≥10× every-plane proof exists. | `OPEN` | `J0`; frozen JSON vector tests in repository | Exercise the same generic source primitives as the Value-shaped fixture and compare exact `JSON.parse` products/failures. |
| `P1-19` | Public surface and pruning | No new public surface is admitted. `/utils` lacks two exact consumer receipts. Production source stays at accepted M2 while formation prototypes remain private. | `OPEN` | `M2`, `J0`; authority `302c623` | Produce a two-consumer surface ledger with net deletion; prune every unconsumed helper and `/utils` if the proof fails. |
| `P1-20` | Full CSS, WPT/browser, and consumer UI | Full standards-bounded CSS coverage, WPT/browser differentials, canonical inverses, UI, and Keyframes migration are Value-owned execution obligations after parse-that formation admission. They are part of the long-horizon acceptance criterion but cannot close P1 or isolated formation. | `OPEN / ROUTED` | `P1-01`; constellation authority `cb41b0d` | Keep runtime mechanics sufficient for exact source provenance; accept only immutable Value receipts after candidate packing. |

## P1 ruling

The subject is now row-complete and hash-bound. P1 closes as a
reconciliation pass with eight `GREEN`, seven `OPEN`, four `RED`, and one
`OPEN / ROUTED` row. Those outcomes keep formation RED, but no subject is
absent or silently deferred.

P2 begins with `P1-14`, because generic source leaves are the nearest shared
need and unblock the isolated Value/JSON-shaped products. `P1-11` recursion
and `P1-13` unordered composition are not reopened without a real shaped
product. The next source transaction may modify only private prototype paths
and their focused tests/profiles.
