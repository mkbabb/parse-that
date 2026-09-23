# N2 IETM paper v4 — Review A owner intake

Date: 2026-08-02

Status: **TERMINAL AMEND/RED — PAPER ONLY — ZERO CREDIT — V4 FROZEN**

## Frozen input

- packet commit: `483dcb1bbfb6f949459597b5105a95a62432edb1`;
- packet tree: `fa240134177478e4636b018ae3b2c73329cdd21d`;
- packet root: `docs/tranches/B/research/N2-IETM-PAPER-v4/`;
- manifest SHA-256:
  `fa804b2976f5d7fbf9911ee21450fc6ae3b6e05cf1cd8528d7ec8473848db53f`;
- manifest replay: `9/9 EXACT`;
- topology: `10 regular files / 36,791 bytes`;
- v4 mutation or reseal: `FORBIDDEN`;
- parser, source, prototype, Node, AST, test, build, benchmark, CSS, product,
  package, execution, candidate, release, and rebind credit: `0`.

This intake records the supplied independent Review A ruling without claiming
an external review-file identity that was not provided. It does not amend v4,
grant A4/N2e authority, or alter the independent N3 paper family.

## First exact falsifier

```text
P5_PREEXECUTION_OUTPUT_ROOT_ORACLE
```

V4's external P5 pin fixes `membershipHash` and `bundleRoot` before either run,
but those roots cover command, stdout, stderr, result, product, effects,
provenance, and process-start/process-end bytes that do not exist until after
execution. Candidate is permitted to run exactly once only after the pin, and
control may start only after candidate seal. V4 can satisfy all three claims
only through hidden prior execution, caller-authored future output, or
placeholder bytes. Each violates owner execution and actual-byte authority.

## Independent secondary findings

1. E08 accepts caller-supplied collateral without authenticated baseline and
   mutated raw domains; changed paths and the unchanged complement can remain
   assertions rather than production-derived facts.
2. P5 names `harnessHash` in the pin but has no harness bundle member whose
   bytes, size, and hash can be authenticated.
3. `CommandCapture` omits executable path/realpath/stat/SHA and `argv0`, so the
   invoked program is not closed by its command receipt.
4. P0/P4 action, callback, and environment hashes are declarations rather than
   production derivations from the invoked executable/harness/captures.

## Preserved structure

- E01–E25 endpoint structure and acyclicity remain useful paper evidence;
- P3 Coordinate closure and the sole graph visitor remain KEEP;
- typed source-version/identity epochs remain KEEP;
- the `420` and `240` receipt arithmetic is internally correct for v4's named
  row counts, while Review B determines whether those row sets are complete;
- the honest P7 executable-AST budget RED remains binding;
- none of these facts grants scientific, execution, or downstream credit.

## Root-routed correction boundary

The later root ruling authorizes only a fresh paper-v5 directory. It requires
separate immutable pre-run input/executor authority and post-run actual-byte
observation seals, independent candidate/control chronology, full command
capture, authenticated raw before/after domains, production-derived collateral
and invocation authority, and fail-closed capability/freshness snapshots.

This intake grants no v5 correctness or review credit. A5/B5, N2e, source, AST,
parser, benchmark, product, CSS, package, release, and rebind remain withheld.

## Exact boundary

- Review A result: `TERMINAL AMEND/RED`;
- v4: `FROZEN / UNCHANGED`;
- A4/B4 or retrospective review credit: `0`;
- scientific/equivalence/performance/novelty/CSS/product/law/release credit:
  `0`;
- authorized continuation: `PAPER V5 ONLY` under the separate root ruling;
- review dispatch or implementation authority: `NONE`.
