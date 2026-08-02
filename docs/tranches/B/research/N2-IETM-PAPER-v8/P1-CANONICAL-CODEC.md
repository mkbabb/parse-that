# P1 — canonical codec and raw production inputs

Status: **PAPER RED / zero credit**.

P1 preserves the v7 authenticated canonical/raw fixtures and their operation
replays. N2-v8 additionally materializes `RawProductionInputV8` before/after
instances for every raw control. Each instance binds run, row, arm, fixture, and
product identity plus exact bytes. P1 predicates and injectors are complete
source byte strings with rooted function identities; no undefined helper,
message classification, caller decoder, or suppression argument exists.

RAW control-of-control retains the identical mutated instance and disables only
the exact owning full function identity.
