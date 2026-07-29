# Pass 3 S evidence amendment

Date: 2026-07-29

Authority: hostile Sol falsification `XR-21`

Candidate parent: `96ad567995176281817aef1bfb84ef38707c2505`

Disposition: **HELD — CORRECTED 96-NAME ADMISSION IS RED**

Release: **NO RELEASE**

## Ruling

The large-graph source-direct signal survives. The S1 and S2 admission
framing does not. Their recorded timings used unequal top-level boundaries,
fixed control-first order, unretained batches, an observed minimum in place
of a confidence bound, and an ordered-prefix corpus that did not prove
whole-property recognition. The old `ADVANCE` words are withdrawn.

S remains a private parallel research runtime under `test/prototypes/**`.
It adds no production export, package subpath, CSS type, scanner plane,
successor coordinate, or release credit.

## Claim reconciliation

| Prior claim | Adjudication | Binding correction |
|---|---|---|
| Candidate and control used an equal timing boundary. | Rejected. | Both now enter through production `Parser.parseState`; the raw parser plane is reported separately as `internal`. |
| All 753 Webref property names were successful recognitions. | Rejected. | Webref order shadowed 487 names by an earlier prefix. The corrected assay sorts longest-first, asserts full value, span, final offset, and success for every source, and names the plane whole-name literal choice rather than CSS property parsing. |
| Candidate diagnostics matched duplicate choices. | Rejected, then repaired in the private prototype. | New-frontier labels are deduplicated; `all(string("x"), any(string("a"), string("ab"), string("a")))` and its staged peer agree at offset 1. |
| The 96-name S2 sample cleared admission. | Rejected. | Five corrected fresh processes yield 9.033–9.986× matched-boundary medians; exact-bootstrap 95% low is **9.033×**. |
| The full denominator established formal admission. | Rejected. | One corrected 753-name run remains large at 78.839×, but it is one process and therefore not a CI-low admission result. |
| Immutable result construction preserves the parser-state ratio. | Rejected. | The corrected 96-name immutable-result plane is 4.804× at exact-bootstrap 95% low. It is an explicit Amdahl bottleneck, not release evidence. |
| Approximate retained memory is universally 1.41× control. | Rejected. | Both authored-per-leaf-span and outer-span controls are now recorded. In the corrected 753-name run, staged `heapUsed + arrayBuffers` is about 560,964 bytes versus 412,533 authored-span bytes and 260,972 outer-span bytes: about 1.36× and 2.15× respectively. |
| Every trace event was a scavenge and every package test passed. | Rejected wording. | Historical traces contain 45 scavenges and three mark-compacts; the package suite is 132 passed plus two skipped. |

## Corrected executable evidence

The corrected sequence graph is still idiomatic combinator input:

```text
sequence(
  choice(...longestFirstNames.map(name => literal(name).spanned())),
  literal(":").spanned()
)
```

The control is the corresponding parse-that closure graph. Both sides return
the same exact two-slot value, UTF-16 spans, offset, error state, furthest
frontier, ordered labels, and recovery diagnostics. The corrected harness:

1. invokes both timed sides through `Parser.parseState`;
2. retains every timing batch;
3. alternates control/candidate and candidate/control order inside each
   process, with alternating first side across processes;
4. asserts the complete property-name value and span rather than only
   control/candidate equality;
5. records raw internal timing separately;
6. records immutable-result timing separately;
7. records authored-span and outer-span memory controls.

Five fresh 96-name process ratios:

| Plane | Exact-bootstrap 95% low | Median | 95% high | Ruling |
|---|---:|---:|---:|---|
| matched-boundary rotating success | 9.033× | 9.655× | 9.986× | **RED** |
| raw internal rotating success | 9.802× | 10.884× | 11.314× | **RED at CI-low** |
| immutable result | 4.804× | 5.008× | 5.060× | **RED** |
| late success | 19.021× | 22.099× | 23.186× | local green only |
| unknown-head failure | 23.732× | 26.299× | 28.179× | local green only |
| diagnostics-on tail failure | 24.544× | 28.576× | 30.111× | local green only |

The sequence candidate therefore remains below the formal ≥10× gate at the
small binding scale. The corrected result plane also proves that deep result
copying/freezing cannot be treated as free.

The recovery extension is likewise held. Its first corrected 96-name run is
9.365× matched-boundary and 4.828× immutable-result. Its correctness probes
do establish strict leaves, parser-provenanced successful recovery
diagnostics, rejected-outer-transaction truncation, and a typed
`RecoveryNonProgress` fault; they do not establish performance admission.

## Sealed inputs

Prototype source hashes for these artefacts:

```text
e8c9b7e193fd13159fb82ce875043e21a152d578f4c5fb3c50b6a4f34e777faa  kernel.ts
559b54db7c524a5ad9f223c030138e214c466c07ab6bfc82a1bd0315772a0651  kernel.test.ts
b7a352e2b977a9857174be7debb315757f22ee232410355dbb14215765bc4cc9  profile.ts
e22a6e016f55f7a6725d431139b6eb2be2db36d866f526b13363571a03813921  hot-profile.ts
```

The Webref input remains `@webref/css@8.7.1`, tarball SHA-1
`481d6fd53548a0248eab2785739835d4cb2fac10`, integrity
`sha512-O60bIKYKl5RpLYsWOnOlWzBCEa2NYKapaeg28gOxsjfHHFK51BWRFcwFNJG04lcZxE6yzrEhWzsW35Bjv5RRXA==`.
The local `data` symlink is a required checkout input and remains untracked
and unmodified.

Raw output and the exact-bootstrap distribution live at
`docs/tranches/B/artifacts/pass3/s-amended/`. Its manifest seals the files
after the source and evidence commit is known.

## Admission remainder

S can change disposition only after all of the following hold:

1. five or more corrected 753-name processes establish a formal CI-low;
2. the 96-name matched-boundary and equal-result planes both clear ≥10× or
   the design is replaced rather than waived;
3. an accepted M2 baseline is reproduced durably; rejected M3 is not the
   release control;
4. recovery, recursion, unordered composition, CSS source leaves, spans,
   diagnostics, and failure behavior use the same admitted runtime;
5. one immutable unpublished candidate pack is consumed by Value and one
   named same-primitive non-CSS grammar;
6. both consumers prove equivalent products and delete displaced machinery;
7. two fresh adversarial audits are clean.

Until then: **HELD, RED, NO RELEASE**.
