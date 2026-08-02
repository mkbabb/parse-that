# P5 — complete pre-run pins and post-run seals

Status: `PAPER_V7_RED / ZERO_CREDIT / SOURCE_WITHHELD`.

PAPER-READY is authoritative for the exact ordered fields and root equations
of `InputAuthorityPinV7`, `ExperimentPlanV7`, `CommandEnvelopeV7`,
`CommandCaptureV7`, `ObservationMemberV7`, `ObservationSealV7`,
`OwnerAdmissionReceiptV7`, and `AuditMutantEnvelopeV7`. The machine registry
also binds the paper key bytes/hash, ED25519 policy, rotation ledger, signature
payload, and deny-by-default capability policy.

Both role pins and complete command envelopes enter one immutable plan before
candidate start. Candidate runs once and is admitted before the already-fixed
control runs once. Actual PID/time/output/effect/product/topology bytes exist
only in the post-run capture/seal; an owner signature binds the recomputed root
after execution. No external or detachable pin exists.

Distinct fixtures/domains `C10–C19` bind role, input pin, command capture,
chronology, capability, invocation, freshness, membership, seal, and admission
controls. P5 participates only in `E05/E06/E11/E17/E23–E26`; caller output,
adaptive control, hidden runs, CSS grammar, and Fourier authority are absent.
