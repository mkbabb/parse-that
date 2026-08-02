# P0 — ledger, typed selection, and epoch authority

Status: `PAPER_V6_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 120 charged LOC`.

P0 consumes only owner-admitted canonical declaration/ledger bytes through
P1. `LedgerRoot = SHA256("parse-that:N2:IETM:ledger:v6\0" ||
DeclarationBytes || LedgerBytes)`. Every version binds parent/edit/source hash
and one identity epoch. The owner-pinned ledger contains exactly one active
experiment-plan row; E26 derives the typed selection receipt without a caller
row label or ordinal.

The selection binds row, fixture/domain IDs, source version, epoch, candidate
and control artifact IDs, role policy, and plan policy. P5 may not choose or
rewrite it. Effect identities use epoch-qualified event keys and declarative
action-slot IDs; executable/callback/environment authority comes only from P5
actual invoked bytes and never from caller hashes.

P0 production leaves and full `LeafFunctionIdentity` formulas are derived from
the sole machine registry in PAPER-READY. P0 owns controls `C01–C05`. The
machine edge registry is sole authority; P0 participates in
`E01/E02/E04/E12/E19/E26`. Prose does not duplicate signatures or control
rows.

No executor, future output, external label, suppression argument, CSS grammar,
fallback, or parser→Fourier edge exists here.
