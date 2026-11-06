# PT-0.W0 R3 adjudication

MODEL: `gpt-5.6-sol`; REASONING: `ultra`; WORKFLOW: `v2`

Verdict: **REJECT R3.** Narrow parse-only census and single-file
no-replacement facts are valid. The evidence contract is not sealed, and full
PT-0 credit remains zero.

## Proven rulings

| Critic finding | Ruling | Proof |
|---|---|---|
| Receipt/run are not atomic or jointly verified | **Correct** | Capture publishes the run before the receipt; verification never reads the run. A crash, collision, missing run, stale run, or wrong-platform run is therefore not detected as a pair failure. |
| Symlinked output ancestry can escape | **Correct** | Output validation is lexical; file creation follows parent symlinks. |
| Categorical zero-Value-read authority | **Correct, narrowed** | The two frozen configurations omit Value, proving declared-operand exclusion. Arbitrary alternate sibling profiles and ambient child processes mean a universal filesystem non-read claim is unproven. No actual R3 Value read was proved. |
| Rust payload/version identity can diverge | **Correct** | Payload bytes use `rustup which`; version bytes use a separate bare PATH command. |
| Machine GREEN contradicts RED prose | **Partly correct** | GREEN was intended to mean two matching censuses, so no literal prose contradiction is proved. The JSON nevertheless lacks parse-only scope and separate capture/gate status; a machine consumer cannot recover the distinction. |
| Hostile cases are absent | **Correct** | There are no pair-race, fault-injection, symlink-ancestry, missing/mismatched-run, profile, PATH-divergence, or durability tests. |
| Exact Value/repository profile is unenforced | **Correct** | Arbitrary sibling repositories may be supplied under arbitrary identifiers. |
| Publication is not crash-durable | **Correct** | File and containing directory data are not synchronized. |

Independent finding: the captured npm executable is a 54-byte
`#!/usr/bin/env node` launcher, not the bound npm implementation closure. npm is
not required by the harness runtime and should not be represented as a complete
tool identity without binding that closure.

## Facts retained

- All declared R3 subject hashes match.
- The stable receipt is `eb08c60c3fe61758874ecc10ad574e1247a481aad6bef88a056b3936295ba581`;
  its run is `6a3037cac9461c4dc057cf206a4a0d3f4edf0778597aad3c3bf1889ad5ec8bb7`,
  and their embedded receipt digest matches.
- The parse-only config is
  `cd82e57181cddb95231a61c3bf761630a58c933ff722f37f3f1421483816c543`
  and declares only parse-that.
- The run records Darwin/arm64 and selected rustc/Cargo payloads are distinct.
- Same-directory hard-link publication gives complete single-file visibility
  and refuses replacement.
- Historical replacement files remain
  `74a0c99e01c3de91c599f0c76617a8746067d26ef9425225e39cfd83ddc4e2eb`
  and `844475a73917d106823ad567760aef10e994d98b6b69c6a5f123f6b318283c2e`.
- Fresh replay passed 18/18 tests.

## Required R4 boundary

R4 remains confined to the common harness and append-only evidence:

1. exact named profiles and repository allowlists;
2. distinct machine-readable capture and still-RED PT-0 gate status;
3. execution of the exact payload whose bytes are hashed;
4. rejection of symlinked output ancestry;
5. durable receipt/run preparation followed by one final no-replace completion
   seal binding both hashes; no unsealed pair is authoritative;
6. verification of seal, receipt, run, config, profile, Darwin/arm64, statuses,
   and all cross-hashes;
7. concurrent, injected-failure, symlink, missing/mismatched member or seal,
   profile, payload-divergence, and durability tests.

Preserve R3 and every historical output byte. Do not read or mutate Value, do not
change production source, and do not grant PT-0 or product movement credit.
