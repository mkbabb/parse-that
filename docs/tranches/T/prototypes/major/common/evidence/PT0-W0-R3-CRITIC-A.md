# PT-0.W0 R3 hostile critic A

MODEL: `gpt-5.6-sol`; REASONING: `ultra`; WORKFLOW: `v2`

Subject frozen before review:

- `scripts/pin.mjs`: `15d32e5b77c0c2c20bfa8d8e1a08d31320c94c1e76925fd3b95bdc4d0a25e228`
- `scripts/hash.mjs`: `6caf102037591f25ba096cbce213a8e02347bd469a6681da9a30d41f91f466a2`
- `test/scripts/pin.test.mjs`: `ac9097b496dfbe23359f208926e2263d265f568dc4e01f45c26c8d0ffa82894a`
- `pins.config.json`: `18ada6596f99ad0b463ae21b26984d7702ea6da08030cbef7280b24d705134f5`
- `README.md`: `62d6fddd68a59b5c0e5e8fff3ef0059da9c2218c9bdec2030b0aa5a5c159e4fe`
- parse-only config: `cd82e57181cddb95231a61c3bf761630a58c933ff722f37f3f1421483816c543`
- R3 stable receipt: `eb08c60c3fe61758874ecc10ad574e1247a481aad6bef88a056b3936295ba581`
- R3 run bytes: `6a3037cac9461c4dc057cf206a4a0d3f4edf0778597aad3c3bf1889ad5ec8bb7`

Verdict: **REJECT R3 as a clean evidence repair.** Accept only the narrow
per-file no-replacement and bounded parse-only census facts. Full PT-0 remains
RED.

## Findings

1. **P1 — the receipt/run pair is neither atomic nor jointly verified.** The
   GREEN run is published before the receipt; a crash, signal, collision, or
   competing creator can leave an orphan or mismatched pair. Verification never
   reads the run path. The EEXIST replay proves one completed file is not
   replaced, not pair integrity.
2. **P1 — output confinement is lexical and permits symlink escape.** A symlinked
   component below an allowed output root can redirect creation outside that
   root. Resolve and reject symlinked output ancestors before census and publish.
3. **P1 — categorical zero-Value-read authority is unproven.** The checked-in
   configurations contain no Value operand, but alternate configurations may add
   arbitrary sibling repositories, and spawned tools inherit an ambient
   environment without a read-denial trace. The exact default and parse-only
   configurations exclude Value; a universal no-read claim does not follow.
4. **P2 — selected Rust payload and version command can diverge.** Rust payload
   bytes come from `rustup which`; version bytes come from a separate bare
   PATH-resolved command. Invoke the resolved payload itself.
5. **P2 — the machine contract overstates the artifact.** The parse-only receipt
   says `PT-0.W0` and the run says `GREEN`, while the governing prose correctly
   grants zero full-gate credit. Machine bytes must distinguish capture health
   from gate status and name a parse-only scope.
6. **P2 — hostile cases are absent from tests.** Missing cases include concurrent
   publication, injected pair failure, symlinked output ancestry,
   missing/mismatched run verification, alternate-config scope, and PATH-wrapper
   divergence.

## Positive facts

- Same-directory hard-link publication gives atomic single-file visibility and
  no replacement.
- Explicit distinct capture targets and the sealed historical defaults are
  enforced.
- R3 contains exactly one parse-that repository and no Value path.
- Historical overwritten outputs remain byte-identical at
  `74a0c99e01c3de91c599f0c76617a8746067d26ef9425225e39cfd83ddc4e2eb`
  and `844475a73917d106823ad567760aef10e994d98b6b69c6a5f123f6b318283c2e`.

No file was edited and Critic B's report was not inspected.
