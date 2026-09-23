# P4 — effect provenance

Status: `PAPER_V7_RED / ZERO_CREDIT / SOURCE_WITHHELD`.

`SCHEMA-C09-V1`, `FX-C09`, and `DM-C09` make effect occurrence authority
byte-exact. Events remain epoch-qualified and bind actual admitted run,
topology, callback invocation, payload, exception, and order. Caller action,
callback, or environment hashes have no authority. N3 remains
`PENDING_NOT_CONSUMED`.

P4 participates only in `E04/E06/E10/E16/E22/E25`; P5 alone invokes callbacks.
No fallback, dual path, CSS grammar, or Fourier edge exists.
