# P5 — command, observation, and signature authority

Status: **PAPER RED / zero credit**.

P5 owns C10–C19 over concrete role, member bytes, argv, chronology, capability, invocation, freshness, membership, seal, and admission objects. C19 is special: the proposed predicate derives the message root, joins key and ledger identity to the external trust pin, and performs Ed25519 verification. Its mutant and two alternates change message authority, recompute the message root, and retain the real baseline signature, so validation must fail cryptographically.
