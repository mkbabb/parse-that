# PT-0.W0 receipt overwrite incident — 2026-07-22

Status: **HISTORICAL RECEIPT EXACT BYTES NOT RECOVERED; HASH-AND-METADATA
PROVENANCE PRESERVED; PT-0 AND U.W0 REMAIN RED.**

This additive incident record neither recreates nor blesses an absent receipt
and does not supersede `PT0-UW0-RECONCILIATION.md` as current authority.

## Historical identity

The historical `receipts/pins.json`, captured at
`2026-07-19T02:48:32.394Z`, was 941192 bytes with SHA-256
`24433d35b686400864a47078048219bbf567ccb52530a9980ca3ff33a4098c9c`.
Its census SHA-256 was
`b1cc1809b0bb75fbc0b084db9277da68bb436e930287d33e1377bfaee0fb1d2d`,
its configuration SHA-256 was
`c1e9a7e15ef744065c897e9d30b6c27811fe2e0752bbcda534b7cf40375df7dd`,
and its volatile-run SHA-256 was
`ae67248d9b37f94815b16a4d134a6cd18c43bc0574adf7dd0aeca6525c0a5706`.
Those facts remain independently recorded in `PT0-W0-AUTHOR.md`.

A bounded read-only recovery search covered the repository, duplicate and crater
repositories, output temporary names, Trash and Darwin temporary roots, Spotlight,
all reachable and unreachable Git objects, Codex session artifacts, editor history,
and Codex/OpenAI caches. It found no exact copy. Session artifacts contain only
explicitly truncated fragments. No local snapshot was available and no external
backup was inspected, so the exact status is **not recovered in bounded search**,
not universal proof of destruction. Summaries or fragments must never be presented
as reconstructed receipt bytes.

## Replacement incident

At `2026-07-22T14:25:00.160Z`, root ran the default `npm run pin` before the
path-level ownership report had returned. The command atomically replaced the
historical path with a 2062077-byte receipt having SHA-256
`74a0c99e01c3de91c599f0c76617a8746067d26ef9425225e39cfd83ddc4e2eb`.
The paired 8009-byte `runs/pins.run.json` has SHA-256
`844475a73917d106823ad567760aef10e994d98b6b69c6a5f123f6b318283c2e`
and census SHA-256
`d05cbffa72efde7c8ceda80ba170f242f0a2abe51bca6b0b02f46bc75abe2c31`.
Its `GREEN` status proves only that its two capture censuses matched during that
transaction.

Immediate verification was RED. The replacement capture, verification, and
field-level comparison performed a read-only snapshot of active Value worktree
bytes and localized subsequent drift to:

- `docs/tranches/V/apotheosis/pi/denominator/tools/occurrence-owner-v9/analyzer.mjs`;
- `docs/tranches/V/apotheosis/pi/denominator/tools/occurrence-owner-v9/test.mjs`.

That read-only snapshot violated the governing no-snapshot boundary. No message
was sent to Value and no Value byte was mutated. Because later bytes did not
match the capture, the replacement pair is historical interval evidence only
and has no current verification, PT0-ART, Value, product, movement, or acceptance
authority. Neither current output is renamed, copied, reconstructed, or
overwritten by this record.

## Binding correction

`PT0-UW0-RECONCILIATION.md` remains controlling. PT-0 and U.W0 remain RED. Every
future capture uses an immutable, uniquely named output or fails if the target
already exists; the historical default paths are never capture targets again.
The default configuration now treats Value as an unavailable sealed boundary:
no default test, snapshot, capture, or verify reads it, and this partial evidence
earns zero PT-0 full-gate credit.
U.W0 remains preseal research until T.W0-W7 and sealed `GESTALT-T` close.
