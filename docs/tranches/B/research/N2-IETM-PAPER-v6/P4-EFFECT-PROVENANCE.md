# P4 — epoch-qualified effects from admitted observations

Status: `PAPER_V6_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 70 charged LOC`.

P4 consumes the ledger-selected epoch table and P5 candidate/control
ObservationAdmissionReceipts. Every event binds source version, epoch, row,
phase, ordinal, occurrence, run, action slot, post-run
`returnedParserTopologyRoot`, production-derived invocation authority, payload,
exception identity, and actual effect ordering. Caller action/callback/
environment hashes are absent.

Candidate and control must match their already committed ExperimentPlan roles
and independent pins. Missing/duplicate event, cross-epoch authority, fallback
lookup, adaptive control, or evidence-authored trace is RED. N3 remains a typed
pending dependency and supplies no accepted authority here.

P4 owns `C09` and participates in `E04/E06/E10/E16/E22/E25`. P5 alone invokes
callbacks. P4 has no reparse, fallback, dual path, CSS grammar, or Fourier edge.
