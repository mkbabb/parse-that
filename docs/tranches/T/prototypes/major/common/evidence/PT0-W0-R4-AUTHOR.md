# PT-0.W0 common harness R4 — author record

MODEL: `gpt-5.6-sol`; REASONING: `ultra`; WORKFLOW: `v2`

Status: **R4 COMMON-HARNESS REPAIR IMPLEMENTED; CAPTURE GREEN; PT-0 GATE
RED; ZERO PT-0 CREDIT.**

This record covers only the common evidence harness ordered by
`PT0-W0-R3-ADJUDICATION.md`. It grants no PT-0, product, package, performance,
wave, or movement credit. No Value repository path was configured, opened,
snapshotted, or mutated by this work.

## Frozen R4 harness

| Path | SHA-256 |
|---|---|
| `scripts/hash.mjs` | `531e3d4c4bbca14f5e1e2855db688ce2fbaa889a3833834ce135716f073e9032` |
| `scripts/pin.mjs` | `f922511aa09e880dabc1dcb71c64d2823ad52afed9929d17e6a446bb546e7478` |
| `test/scripts/hash.test.mjs` | `c8d1998a8a33ef12c468c30d40347adad9ebf69699a76dd7a6188ce20845fff0` |
| `test/scripts/pin.test.mjs` | `df615723533bfd3f8cc446b084db5f475d91361f17cf41d2353849c62093a9ea` |
| `profiles/pt0-parse-only.json` | `c2c1a781f2748e262fc08e7598b114801b02f96566f3ec81b10bd5c7f26327b1` |
| `pins.config.json` | `1c693805eda94d5605a49ae9f0af4ee8c48e2d20aa6907659c7989206de83e5e` |
| `README.md` | `59e60c5e44419701e6b42d05525e239a3718b3b47109387c0b734c09ab0541ef` |
| `package.json` | `b0406306174b694e3d2c2ec906bc626c623c57694f8c489f239d76bf3bb380fd` |

## Closed R3 findings

- The CLI accepts only `--profile` plus `--bundle`; it accepts no arbitrary
  configuration path. `pt0-parse-only` is an exact profile whose sole
  repository is `parse-that`. The config catalog has exact repository IDs and
  exact sibling roots, rejects additions/substitutions, and cannot disguise
  Value under another identifier.
- Receipt, run, and completion seal encode `capture_status: "GREEN"` separately
  from `gate_status: "RED"` and name scope `PT-0.W0.parse-only`.
- Git, Node, rustc, and Cargo version commands execute the same resolved payload
  whose bytes are hashed, with a post-execution byte comparison. npm is omitted
  because its launcher does not bind its implementation closure.
- Output roots and every existing output ancestor are resolved and rejected if
  symlinked. A bundle must be one direct, uniquely named child of `common/runs`.
- Receipt and run are exclusively created, file-synchronized, hard-linked
  without replacement, and directory-synchronized. `complete.json` is created
  last with the same durability sequence and binds receipt, run, config, and
  profile bytes. An unsealed pair has no authority.
- Verification requires exactly three regular canonical members, every member
  hash and byte count, every config/profile/receipt/run cross-hash, exact
  repository/tool payload allowlists, exact capture/gate/scope/profile fields,
  and Darwin/arm64 before replaying the two-census receipt.

The hostile suite covers simultaneous creators, failures after each prepared
member, symlinked ancestry, missing seal/member, corrupted member bytes,
config/profile additions and substitutions, status/profile/platform/receipt
hash mismatches, PATH/payload divergence, and observed file-plus-directory
synchronization.

## Twin test replay

The final 25-test payload ran twice:

```text
node --test test/scripts/*.test.mjs
25 passed; 0 failed; 0 skipped
```

Durations were normalized to `(TIME)` / `TIME`; both normalized outputs had
SHA-256
`7059ea711e954c1f0b5e29f63e3bfd2fffaca2ae93980bd86277e9f45e88ff53`.
All four JavaScript files also passed `node --check`.

## Real R4 bundle

Capture command:

```text
node scripts/pin.mjs capture --profile pt0-parse-only \
  --bundle runs/pt0-parse-only-r4-20260722T154643Z
```

The capture completed at `2026-07-22T15:46:49.872Z` on `darwin/arm64`.
It contains exactly `parse-that` and the tool allowlist
`git,node,rustc,cargo`; npm is absent.

| Member | Bytes | SHA-256 |
|---|---:|---|
| `runs/pt0-parse-only-r4-20260722T154643Z/receipt.json` | 164303 | `b4ed372b55b980a27defe334de4e49d2be15cacfb7e92478c2bc2503a64c3fd5` |
| `runs/pt0-parse-only-r4-20260722T154643Z/run.json` | 2800 | `79bc17cdd46bb790c44cb7665c8eeeb4cfa5d9f26002cf55381d6fda9fade354` |
| `runs/pt0-parse-only-r4-20260722T154643Z/complete.json` | 636 | `c072160f736f5325caa0beba773bd36ae29c98490c1c453db28135f23dbdd62c` |

The completion seal binds config bytes/hash
`3199` / `1c693805eda94d5605a49ae9f0af4ee8c48e2d20aa6907659c7989206de83e5e`
and profile bytes/hash
`276` / `c2c1a781f2748e262fc08e7598b114801b02f96566f3ec81b10bd5c7f26327b1`.
All members are mode `0600`; the bundle directory is mode `0700`.

The exact verify command ran twice and returned the same completion digest:

```text
node scripts/pin.mjs verify --profile pt0-parse-only \
  --bundle runs/pt0-parse-only-r4-20260722T154643Z
PT-0 parse-only bundle verified: c072160f736f5325caa0beba773bd36ae29c98490c1c453db28135f23dbdd62c
```

A same-path capture replay exited `1` before census with:

```text
EEXIST: file already exists, mkdir '.../runs/pt0-parse-only-r4-20260722T154643Z'
```

This append-only author record was written after the two required verification
replays, so it is intentionally not a member of that earlier source census.

## Exact selected tool identities

| Tool | Payload SHA-256 | Version-output SHA-256 |
|---|---|---|
| Git | `12bed4523661307059b879b9b54e77a73176e9d27d27a0e40363271d8f0668ba` | `b6d9afe6e5be5d40f0e18a09a0708100902e19a4d0e11fb5d3930d59785cb1aa` |
| Node | `08dad0581f00a0cabf4d49ec92ca1f25fdfd01c2c18fa8e92b35f04d4c24c164` | `4ba81b51ceb2a5121a3018c8d23adc26a59dd3e470a2a6c7e75eb7c31327adfd` |
| rustc | `95d199b3cc0a2e43a904e3ed6120738ce768b7300214023a56d60cbeacf76d36` | `d5f79f5406781b8544d4eeb2e4d29a85352b8348d3c2fd0056c76e46eda02ac2` |
| Cargo | `c6170b6af6c6205953bff3119c3c003744f5b85e9f76489d12e3e45094f1b296` | `81def4d843d4c9dc8af475715cb356caef3d673603434c57e5ea75d522a6a97e` |

## Historical-byte preservation

The following hashes were taken before R4 edits and matched again after the
capture, both verification replays, and the EEXIST replay:

| Historical path | Before = after SHA-256 |
|---|---|
| `evidence/PT0-UW0-RECONCILIATION.md` | `cc4c293cf876d1505a68d5206673d43dadb8b26b2b100f144de95a28414a2c19` |
| `evidence/PT0-W0-AUTHOR.md` | `2a436943e844a094a5a867584fa055ddc9aec1a2e36dad1fd24151d3d8e748a2` |
| `evidence/PT0-W0-R3-ADJUDICATION.md` | `a32aa235c84c66d342e06e297e27363dda71a0ce16601d9db2304ebf9c868da5` |
| `evidence/PT0-W0-R3-CRITIC-A.md` | `36a6e315903a4bd2cc2eba365e9ab9786d4efa441e11d5b645ae7d3d688e59e9` |
| `evidence/PT0-W0-R3-CRITIC-B.md` | `63ba8cb32e9e26a3972be2480915964c2cb7d7d4bba4b9de005d709d8f79a5e4` |
| `evidence/PT0-W0-RECEIPT-OVERWRITE-INCIDENT-2026-07-22.md` | `db6db896482317f06d5c310f57968c257a9fe9de83bfd3028a861278c540a938` |
| `receipts/pins.json` | `74a0c99e01c3de91c599f0c76617a8746067d26ef9425225e39cfd83ddc4e2eb` |
| `runs/pins.run.json` | `844475a73917d106823ad567760aef10e994d98b6b69c6a5f123f6b318283c2e` |
| `runs/pt0-parse-only-r2.receipt.json` | `9ef888aa6aad8d807f9352a0acd28bbc2472636cc4aeb2fcb270fc026aed96b7` |
| `runs/pt0-parse-only-r2.run.json` | `71bf52c33a88b9382dd101904b0cde8af6e6d9929ddb4a1a749b7d8a9db64e77` |
| `runs/pt0-parse-only-r3.receipt.json` | `eb08c60c3fe61758874ecc10ad574e1247a481aad6bef88a056b3936295ba581` |
| `runs/pt0-parse-only-r3.run.json` | `6a3037cac9461c4dc057cf206a4a0d3f4edf0778597aad3c3bf1889ad5ec8bb7` |
| `runs/pt0-parse-only.config.json` | `cd82e57181cddb95231a61c3bf761630a58c933ff722f37f3f1421483816c543` |
| `runs/pt0-parse-only.receipt.json` | `66355aa0accf7bfd1cf7f81d56bcc33b422bc5bb387fd7fe1c7d2165e0656e3b` |
| `runs/pt0-parse-only.run.json` | `a44137808f2d87446c553cb47f14bd8b35bcc08e38d0f8fc266a1889319e3b75` |

## Remaining RED

The machine gate remains exactly `RED`. This parse-only capture does not bind
Value or close the full PT-0 denominator, and hostile R4 review has not begun.
No movement is authorized by this author record.
