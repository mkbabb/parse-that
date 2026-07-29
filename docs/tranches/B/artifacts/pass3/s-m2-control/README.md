# Pass 3 S against accepted M2

Date: 2026-07-29

Candidate source parent: `f3ed3b6`

Control: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Disposition: **HELD — RED**

This assay replaces rejected M3 as the control coordinate. One process loads
the accepted M2 source from a detached read-only worktree while the current S
candidate remains on the active branch. Both grammars execute through their
own production `Parser.parseState` boundary. Batches alternate AB/BA and
every batch is retained.

The input, whole-name assertions, equal semantic snapshots, result
materialization and dual memory controls are the same as the corrected XR-21
harness.

## Result

| Plane | Exact-bootstrap 95% low | Median | 95% high |
|---|---:|---:|---:|
| 96-name matched-boundary sequence | 8.179× | 8.422× | 8.657× |
| 96-name raw internal sequence | 8.698× | 8.769× | 9.188× |
| 96-name immutable result | 4.420× | 4.561× | 4.813× |
| late success | 19.232× | 20.416× | 21.480× |
| unknown-head failure | 23.943× | 24.954× | 26.227× |
| diagnostics-on tail failure | 23.126× | 25.536× | 27.555× |

Accepted-M2 control makes the binding RED stronger. Neither the matched
boundary, raw internal plane, nor immutable result clears ≥10× at CI-low.

## Seal

- Candidate profile SHA-256:
  `7647b0439c92d2545f2235fe72744e295b77cbde4d0b241d585057aa855e73e1`.
- Candidate kernel remains the `2fc18dc` source:
  `e8c9b7e193fd13159fb82ce875043e21a152d578f4c5fb3c50b6a4f34e777faa`.
- M2 control:
  `de36d57dccdd20068b8c11a78f6e83d42e7d681f`.
- Node `26.0.0`; V8 `14.6.202.33-node.19`; Darwin arm64.
- Five process files live under `raw/`; `bootstrap-sample-96.json` enumerates
  all `5^5 = 3,125` resamples.

The temporary detached M2 worktree is not an artefact dependency. Its exact
commit is recorded above and it is removed after the manifest verifies.
