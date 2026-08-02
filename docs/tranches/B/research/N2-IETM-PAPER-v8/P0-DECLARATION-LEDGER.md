# P0 — declaration and external ledger authority

Status: **PAPER RED / zero credit**.

P0 owns the concrete `AuthorityLedgerV8`, `AuthorityTrustPinV8`,
declaration, version, identity-epoch, and experiment-selection objects rooted by
the machine registry. The issuer public key and ledger root are supplied only
through the owner validator argument. Submitted evidence cannot declare trust,
replace the key, or replace the ledger. The ledger admission signature is over
the unsigned, domain-separated ledger root; its signature bytes are outside
that root.

P0 exports typed production instances to P6. Every P0 control joins authenticated
v7 fixture bytes to the exact concrete field read by its source-bound predicate.
