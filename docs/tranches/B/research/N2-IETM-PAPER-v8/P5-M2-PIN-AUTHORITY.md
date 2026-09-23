# P5 — concrete execution authority on paper

Status: **PAPER RED / zero credit**.

P5 now materializes concrete candidate/control command envelopes, input pins,
one immutable plan committing both roles before candidate start, a command
capture, observation membership, observation seal, unsigned admission message,
Ed25519 admission receipt, external trust pin, and signed authority ledger.

Every P5 fixture projects into the actual concrete field consumed by its
predicate: role, member bytes, argv0, chronology, capabilities, invocation
authority, freshness, membership, seal, or admission root. Roots are
domain-separated. Future output is not pre-pinned: only the plan/input/command
authority exists before a run; observation and admission roots are post-run
types. This paper packet executes neither role.
