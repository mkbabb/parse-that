# Tranche B — FINAL

Status: **OPEN — NOT A CLOSE REPORT**

Release: **NO RELEASE**

This file owns the terminal gate ledger required by the canonical tranche
packet. It must not be read as a close claim while any row is open or RED.

## Goal reconciliation

The goal is not met. No admitted runtime, immutable consumed candidate,
Value CSS receipt, JSON receipt, formal ≥10× all-scale CI-low, clean audit
pair, release or Value released-coordinate rebind exists.

## Completion ledger

| Gate | Status | Evidence |
|---|---|---|
| Canonical parent/PROGRESS/wave/coordination/FINAL | `IN_PROGRESS` | `B.md`, `PROGRESS.md`, `waves/W0.md`, `coordination/CONSTELLATION.md`, this file |
| Runtime correctness | `IN_PROGRESS` | M2 is the accepted control; live production remains rejected M3. Transaction/run-state/slot/span/recovery/result laws and shaped fixtures are correctness-green; every replacement family is retired and no candidate exists |
| Full-subject P1→P2→P3 | `IN_PROGRESS` | P1 is complete at `69f72f7`; P2 is row-complete at `c3d42d4`; P3 is next and has no credit yet |
| Isolated every-scale/result proof | `RED` | S7's warmed terminal/recovery subset is local only. S8 recursion, P2-UO, P2-L and shaped products are RED. P2-C puts construction at 0.0597–0.0785×, cold at 0.0696–0.0846×, and stabilized success below 10× at every scale under 753. Live Value receipts belong to later execution. |
| Formation Clean A / Clean B | `BLOCKED` | requires green isolated prototype proof |
| Formation admission | `BLOCKED` | requires both formation clean audits; creates zero execution credit |
| Full Value CSS coverage | `OPEN` | Value owns implementation; no execution receipt |
| JSON same-primitive consumption | `OPEN` | Named consumer only; no candidate receipt |
| Equivalent deletion/consolidation | `OPEN` | No consumer diffs |
| ≥10× every-scale CI-low | `RED` | S7 96-name recovery lows are 10.405× matched, 11.285× internal, 10.257× result, 20.569× late, 12.894× failure and 39.532× diagnostic failure; 753-name lows exceed 75×; remaining subject and consumer planes are not green |
| Allocation/deopt/GC sealed proof | `RED` | S7's local hot evidence is sealed; S8, U, P2-L, shaped products, P2-UO and P2-C bank CPU/deopt/allocation evidence but every candidate is retired and mixed traces are not a final seal |
| Immutable unpublished candidate | `OPEN` | none |
| Execution Clean A / Clean B | `BLOCKED` | requires exact-pack consumer evidence |
| `/utils` two-consumer proof or prune | `OPEN` | unresolved |
| Parse-that release | `OPEN` | no successor |
| Value released-coordinate rebind | `BLOCKED` | requires parse-that release |
| BBNF ABI receipt after `V.L6.css-path-abi-freeze` | `BLOCKED` | requires the exact Value freeze and frozen runtime |
| Integrity close | `OPEN` | tranche active |

## Commits

No close commit exists. Banked formation-research commits are recorded in
`PROGRESS.md`; none admits formation or carries execution/release credit. The
accepted-M2 control is `c480578`
(`perf(runtime-prototype): bind corrected S assay to accepted M2 control`).
The latest prototype evidence, cold/hot dispatch, is banked at `d323f56`.
The compiled table is 12.7–16.8× slower to construct, 11.9–14.4× slower
through its first parse, below 10× on stabilized success under 753 names and
only 1.4996× on Unicode cold edges. It is terminally retired. Mixed-overlap U
remains banked at `68055bd`; D is retired with S. Shaped products remain at
`d62b73a`; recursive JSON and the stylesheet-shaped fixture are
correctness-green, but the staged family is killed. P2-L remains at
`5822ae2`; callback-loop, ASCII-table, public sticky-wrapper, and the private
source-leaf seam are killed. P1 is complete at `69f72f7`; P2 is row-complete
at `c3d42d4` with zero admitted candidates. S8 is banked at `27bf872`; its
bounded-recursion correctness is HELD while performance remains RED at the
96-leaf floor. S7 remains banked at `20b5f52` with locally green
terminal/sequence/generic-recovery evidence and no formation credit. S6 is
banked at `062c147`, S5 at `926a3ad`, S4 at `75b76dd`, and `2fc18dc` owns the
preceding corrected S/recovery kernel and XR-21 amendment.

## Handoff

Resume from
`FINDINGS-AND-RESUME-HANDOFF-2026-07-29.md` and
`PROGRESS.md §Next executable boundary`. Preserve the active branch, banked
private prototype evidence and user-owned untracked `data` symlink. Resume
P3 with the same-FIRST recovery hostile case and smallest direct
closure-kernel surface cut. Do not reopen a retired family without a new exact
two-consumer need. Do not publish, widen the API or begin Value-owned CSS work
from this repository.
