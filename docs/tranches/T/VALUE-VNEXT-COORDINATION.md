# Value V-next coordination boundary

Status: **binding external coordination for the active parse-that major session**.
This file records what was observed; it grants no authority to mutate value.js or
to feed an unreleased parser candidate into its mega-tranche.

## Observed packet history

Initial capture on 2026-07-18 after the owner required continuing coordination:

- value.js: `/Users/mkbabb/Programming/value.js`
- HEAD: `c654824e0b252cda7f8490b67f182a48c48cc0ed`
- HEAD subject: `docs(V·mail): land I-11/I-12 — the vnext kickoff prompt +
  context packets (r2 true-Fable); the mega-tranche formation opens`
- NUL-delimited porcelain SHA-256 at observation:
  `67abe419bb83f4de65ae898d27d6333244f09f4911367b7efb671780992f852b`
- major-session handoff SHA-256:
  `80bb33310689b9bf110a57d18567b4497db54ebe408ed8dfe862e06a6a320e28`
- machine packet SHA-256:
  `f7d60b452300dacf3a8a382c37a2d82b5fd05e28c96ae42ea2a50e9e3a6a9b9c`
- V-next plan SHA-256:
  `86cbd9e89917ce7f51063319048e833a7205b1015f26c7b8be59787b620833d4`
- parser/CSS program SHA-256:
  `2290dd651d138f5cb624d083c917ba8955bda617669672074844f10922d08340`

The value checkout is actively dirty in Tranche T/V formation and audit work.
It is read-only to this campaign. Every later coordination decision must re-pin
HEAD, packet hashes, and dirty ownership; these values are not timeless aliases.

Live content re-census at 2026-07-18T22:35Z found that HEAD and the
NUL-delimited porcelain SHA-256 still match the initial capture, but content
inside the untracked `docs/tranches/V/vnext/` directory has advanced. Porcelain
path identity is therefore not a content receipt. The current artifacts are:

- major-session handoff:
  `76b2f725996397416ebb36b0f53e2a68e39f233aa348d0406e47738953e24ff3`;
- append-only live coordination JSON:
  `a2e0c505ccc1f7ff7a9c9ebecbffa03ff44a2674b9f9a37e91911a4ae559916b`;
- frozen historical YAML, unchanged:
  `f7d60b452300dacf3a8a382c37a2d82b5fd05e28c96ae42ea2a50e9e3a6a9b9c`;
- 190-wave V-next plan:
  `936322b863071996a8e344cbb3aab3db5f0d62169ddfd6a9a093cbf8be14be9a`;
- parser/CSS/color program:
  `5a45e40ace430e27a7df0d09c9d95dcb7263b5c28fd362e30183b41d60caae4e`.

At that first content census, `docs/tranches/V/vnext` contained 73 files and
1,245,998 bytes. Hashing the lexically sorted relative-file `shasum -a 256`
ledger yielded tree receipt
`c76d8e99662131ea3f2c2824ec8656fd01743cded37a2932e8560fd4472886e8`.
Later checks must repeat the same ledger algorithm so additions, removals, and
content edits are all visible.

The current handoff says live event 1 is expired because SK-V25 advanced; its
payload still pins V3 and old dirty counts. Value P00, not this campaign, owns
the append-only replacement snapshot before P01. No P03 mutation intent or
acknowledgement is current. This campaign must compare content hashes—not only
status paths—at every later coordination checkpoint.

A second live recheck at 2026-07-18T22:54Z observed further formation drift
while V4 remained isolated. HEAD, the coarse porcelain digest, handoff, live
JSON, plan, and frozen YAML did not move, but:

- all-untracked porcelain SHA-256 is
  `d8df136d9821214c9b8dd7950ae4fa56dca8157f33d9efa8aa1be7a712d7cc6b`;
- `PARSER-CSS-COLOR.md` is now
  `45447611e147c7470900a929adc8a4370c435a3ae3c212ab39e32a9c74d49621`;
- the V-next tree is now 78 files / 1,334,757 bytes with the same sorted-ledger
  receipt algorithm yielding
  `665e5860ba1f288b0c51c9ca89ed2705f5f01db1667c06305022bb39685d742f`.

The new P00/P01 control is a historical, execution-only BBNF capsule, not an
active-session dependency: `BBNF-HOST-CONTROL.json` at
`ba6ef2eef8e356e1a0d94e831d79500f5664eda1224e533cb295e407be234e54`
pins BBNF `v1.0.5@6914618918e3e76b47be66006810b708b8443425` plus the exact
historical parse-that 0.6 source commit it consumed. Value rebuilds both from
clean content-addressed archives and must never read this dirty SK-V25 tree.
This campaign may later consume the frozen behavior as casualty/oracle evidence;
it gains no legacy-preservation duty and may not provide a shim. Any deliberate
break receives an explicit return disposition.

## Two intentionally separate tracks

Value V-next P00–P07 owns a full-CSS prototype against the **published**
`@mkbabb/parse-that@1.0.0`. It may accept only a necessity-proven, non-novel,
public-compatible 1.0.1 repair. Its 190-wave plan explicitly routes opaque parser
graphs, per-run execution, new combinators, result/package resets, left-recursion
policy, Tape/SoA/Pratt experiments, and BBNF/host/emitter work out to this major
session.

This major session owns that breaking research and implementation. It must not:

- make Value formation depend on V3 or another speculative surface;
- modify value.js, its P-band receipts, corpus, or prototype;
- misclassify a Value-only CSS requirement as a generic parser primitive;
- offer an alias, shim, compatibility overload, or dual execution path;
- publish or nominate a release before the major-session return is separately
  accepted.

The separation is not a legacy exception. V-next remains on its current published
dependency while this session constructs a clean-breaking candidate in an isolated
prototype. A later shipping cut has one API and one execution path; Value adopts it
only through a versioned, owner-accepted return.

## Current incoming defect registry

The live handoff carries ten independently reproduced npm 1.0 defect families:

- `PT-COMBINATOR-RUNTIME-TYPE-DIVERGENCE`;
- `PT-CORE-SCC-AND-BUNDLE`;
- `PT-ARTIFACT-SKIP`;
- `PT-EOF-DIAGNOSTIC`;
- `PT-GLOBAL-DIAGNOSTICS`;
- `PT-LOADER-IDENTITY`;
- `PT-NESTED-RECOVERY-ROLLBACK`;
- `PT-DISPATCH-DOMAIN-CONTRACT`;
- `PT-RAW-CROSS-SOURCE-MEMO`;
- `PT-STATE-RESULT-DIVERGENCE`.

V4 evidence must map each ID to an actually reproduced V4 gate, a named later
lock that remains RED, or an explicit out-of-scope disposition. Presence in the
incoming registry is not proof that the invocation carrier closes it. Package,
surface, and combinator defects cannot be silently credited to an execution-only
prototype.

## Reconciliation checkpoints

1. **Before a parse-that production transpose**, re-read the current V-next
   P00–P07 state, necessity-fix ledger, CSS corpus/projection digests, and accepted
   package receipt. Drift or an active overlapping writer blocks the cut.
2. **Before freezing the new combinator/result surface**, ingest the completed
   full-CSS prototype's actual operation census. Every used 1.0 operation receives
   a KEEP/REPLACE/DELETE disposition and a source/runtime/type vector; no imagined
   CSS consumer substitutes for that evidence.
3. **At coordinate boundaries**, distinguish original/processed UTF-16 code units,
   UTF-8 byte offsets, and BBNF grammar/backend bytes. Value's `SourceText` mapping
   remains a consumer contract; parse-that does not silently coerce its domains.
4. **At package proof**, install the packed major candidate into an isolated
   Value-shaped CSS crater built from the returned corpus. This is evidence only;
   no workspace source edge or mutation of the active Value checkout is allowed.
5. **Before return**, replay the ten inherited defect families plus every
   necessity-fix and CSS ingestion vector that Value returns. Any breaking
   discrepancy stays RED and named.

## Required return packet

The major session returns, without mutating Value:

- exact parse-that, Rust, bbnf, and relevant Value pins plus dirty-state proofs;
- API-break and consumer-casualty ledger with no compatibility aliases;
- CSS corpus commands, environments, raw evidence digests, and semantic projection;
- coordinate-domain and recovery/diagnostic contracts;
- implemented package manifests, artifact digests, source graph, and generated
  provenance;
- packed Node/Vite/worker/declaration plus Value-shaped CSS crater results;
- explicit adoption recommendation, rejection, or remaining blocker;
- release/version proposal owned by the later acceptance session, never an implied
  publish action here.

Until those fields exist and V-next explicitly accepts them, the superseding V4
candidate and every predecessor prototype are local evidence only.

## 2026-07-19 delegated boundary and read-only adjudication

The active Value formation task sent a direct coordination notice from Codex
task `019f7399-10f6-7743-8494-a4574b44d604`. It resolves the remaining lane
ambiguity: the CSS prototype will consume published `@mkbabb/parse-that@1.0.0`
only. Value is not carrying parse-that novelty or an uplift candidate in this
tranche. A minor parser repair is admissible there only if the CSS prototype
first proves it necessary and the repair remains public-compatible. The Sol
research under `docs/tranches/B` stays banked, uncommitted evidence for this
session's T/U adjudication; it is not an implementation request or design
authority.

A fresh read-only census at 2026-07-19T00:41Z observed:

- Value HEAD remains
  `c654824e0b252cda7f8490b67f182a48c48cc0ed`, and the coarse porcelain digest
  remains `67abe419bb83f4de65ae898d27d6333244f09f4911367b7efb671780992f852b`;
- the all-file porcelain digest has advanced to
  `98d34f1dec95071e6d6bf292c9d17671e0ebbc4ffe11afe8be9ef40ebef8ab63`;
- `docs/tranches/V/vnext` now contains 101 files / 1,783,051 bytes, with sorted
  relative-file ledger digest
  `28dba547dcaf0790d65da4c317978d2962230ac7e08a6228485217fc4d882076`;
- `PLAN.md` is
  `a8779379ac167bf5c0fe04d96d41762e35fbd8aa753caa850819f56507233499`,
  `PARSER-CSS-COLOR.md` remains
  `3a0a22d79cd9732488050bc2a4ed184bb23f323e9bc822638a1901aad58ace81`,
  and the append-only live stream remains
  `5c0f02a54f502145b944fc415e0418a2b8849a747fca426209e97a42982506d3`;
- sequence 2 in that stream still pins BBNF `RUN-LEDGER.md` at
  `26fd3c42411f8950f0769f5021bd7f1b5eb818c3144f6a0ac6a7d99d5775d0c2`,
  while the live ledger at this census is
  `22dfbc6ce19c82ee170ff7399e40e02bfa19fbc71e637da3742bdb6a5aecc129`;
- `P01-INDEPENDENT-AUTHORSHIP.json` remains `born_red`: its execution input
  epoch is pending, both author receipt arrays are empty, and adjudication is
  pending. It describes an execution gate but proves no CSS proposal or parser
  necessity;
- the historical BBNF-v1.0.5 host capsule remains
  `ba6ef2eef8e356e1a0d94e831d79500f5664eda1224e533cb295e407be234e54`.

The adjudication is therefore exact:

1. Value's PT-E V2 snapshot and P00/P01 controls are valid consumer constraints,
   but their current snapshot is expired by normal campaign motion. Value must
   append a new same-tip snapshot before CSS authorship; parse-that does not edit
   or backfill its stream.
2. No Value-authored CSS corpus, necessity ledger, operation census, accepted
   crater packet, mutation intent, or acknowledgement exists yet. Consequently
   PT-V remains RED and no parse-that source change is justified from Value.
3. Invocation V4 is a narrow control in the five-family major portfolio. It is
   neither the replacement selection nor a package offered to Value.
4. T/U may investigate breaking mechanisms and may eventually return a packed
   major candidate, but it cannot source-link, install into, or steer Value's
   published lane. Conversely, Value's P-band gates cannot choose the T/U
   architecture.
5. At the next natural checkpoint, re-census every Value V-next file and ingest
   the then-terminal P00/P01 packets. A coarse porcelain hash is never sufficient.

This ruling supersedes earlier wording that called V4 “the superseding
candidate.” V4 survives only as measured control evidence pending the full
portfolio and lock adjudication.
