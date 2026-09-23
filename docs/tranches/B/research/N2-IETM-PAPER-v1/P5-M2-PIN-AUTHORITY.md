# P5 — owner-side accepted and rebuilt M2 pin authority

Status: `PAPER_ONLY / ZERO_CREDIT / SOURCE_WITHHELD`

Future source budget: `1 module / 60 nonblank noncomment LOC maximum`.
Paper budget: `100 nonblank lines maximum`.

## External pin record

P5 is owned outside submitted candidate evidence. The owner constructs one
immutable `TrustedM2Pins` record from actual bytes, not caller metadata. It
binds accepted M2 commit `de36d57dccdd20068b8c11a78f6e83d42e7d681f`, the
rebuilt-M2 source coordinate, exact source-manifest paths/bytes/counts/SHA-256,
artifact paths/bytes/counts/SHA-256, build and run commands, exit/status/stdout/
stderr bytes, Node/V8/toolchain bytes, compile-cache policy, semantic-envelope
bytes/hash, fixture bytes/hash, and exact row/product IDs.

Every source-manifest and artifact hash is recomputed from owner-held bytes.
The immutable pin record is passed separately from evidence and is not decoded
from the candidate envelope. Submitted rows can reference a pinned row ID but
cannot supply commit, path, command, runtime, artifact, manifest, hash,
semantic envelope, fixture, or expected product.

Accepted M2 remains the speed control. The semantic envelope separately binds
the current rollback, typed-depth, recovery, diagnostics, provenance, EOF and
complete-product obligations so an accepted-M2 defect cannot weaken equality.
Whole-document JSON rows append EOF or assert the final offset.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E06` | `P5 -> P3` | `controlPins(row: RowIdentity) -> TrustedM2Pins` | owner bytes, never submitted evidence |
| `E14` | `P5 -> P7` | `m2PinClaim() -> InterfaceClaim<M2PinAuthority>` | external manifest/artifact byte ownership |

P5 has no other interface input or output. P3 uses exact row/product pins; P7
verifies ownership and hashes. Neither may amend the record.

## Fatal paper checks

Self-hashed metadata, absent source bytes, unbound toolchain strings, synthetic
M2 dispatch, shared candidate/control artifact, caller-provided expected
product, missing EOF, semantic-envelope drift, or one-sided warm/cache policy
is `RED`. P5 grants no benchmark credit and authorizes no build or command.
