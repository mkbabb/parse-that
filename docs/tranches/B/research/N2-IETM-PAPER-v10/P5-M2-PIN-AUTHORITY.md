# P5 — command, observation, and cryptographic admission

Status: **PAPER RED / zero credit**.

C10–C18 retain concrete command and observation relations. C19 now atomically changes observationRoot, recomputes/stores messageRoot, retains the baseline signature, and recomputes every enclosing root. Its three invalid variants therefore satisfy derived-root equality and are specified to reach and fail Ed25519 verification.
