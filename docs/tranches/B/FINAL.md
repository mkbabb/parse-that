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
| Runtime correctness | `IN_PROGRESS` | M2 banked; M3 rejected; S7 locally proves terminal/sequence and generic recovery; S8 recursion and U unordered are correctness-green but performance-RED; CSS-needed leaves remain open |
| Full-subject P1→P2→P3 | `RED / BLOCKED` | P1 lacks a row-complete hash-bound registry; P2 and P3 are blocked behind P1 |
| Isolated every-scale/result proof | `RED` | S7 clears terminal/sequence and generic recovery at 96 and 753 names; S8 generic recursion is 1.212–1.331× and balanced-discard recursion is 8.400–8.842× at 96; U D ranges from 1.427× to 6.156× at 4/8/16 and includes a 9.559× 33-member success-AB point; generic CSS-needed leaf and full-subject isolated planes remain open. Value stylesheet recovery and live Value/JSON receipts belong to execution after formation admission. |
| Formation Clean A / Clean B | `BLOCKED` | requires green isolated prototype proof |
| Formation admission | `BLOCKED` | requires both formation clean audits; creates zero execution credit |
| Full Value CSS coverage | `OPEN` | Value owns implementation; no execution receipt |
| JSON same-primitive consumption | `OPEN` | Named consumer only; no candidate receipt |
| Equivalent deletion/consolidation | `OPEN` | No consumer diffs |
| ≥10× every-scale CI-low | `RED` | S7 96-name recovery lows are 10.405× matched, 11.285× internal, 10.257× result, 20.569× late, 12.894× failure and 39.532× diagnostic failure; 753-name lows exceed 75×; remaining subject and consumer planes are not green |
| Allocation/deopt/GC sealed proof | `IN_PROGRESS` | S7 terminal/sequence/recovery evidence is sealed; S8 and U bank CPU/deopt/allocation evidence but retain RED rows and non-clean traces; remaining isolated subjects and later consumers are unsealed |
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
The latest prototype evidence, U, is banked at `19ad1ac`; scannerless
unordered correctness is HELD while performance remains RED at 4/8/16 and
one 33-member AB order. S is retired as an unordered family and D remains
private. S8 is banked at `27bf872`; its bounded-recursion correctness is HELD
while performance remains RED at the 96-leaf floor. S7 remains banked at
`20b5f52` with locally green
terminal/sequence/generic-recovery evidence and no formation credit. S6 is
banked at `062c147`, S5 at `926a3ad`, S4 at `75b76dd`, and `2fc18dc` owns the
preceding corrected S/recovery kernel and XR-21 amendment.

## Handoff

Resume from
`FINDINGS-AND-RESUME-HANDOFF-2026-07-29.md` and
`PROGRESS.md §Next executable boundary`. Preserve the active branch, banked
private prototype evidence and user-owned untracked `data` symlink. Resume
with the row-complete P1 registry and generic CSS-needed leaf proof; revisit
recursion only with a real Value/JSON-shaped AST product. Do not publish,
widen the API or begin Value-owned CSS work from this repository.
