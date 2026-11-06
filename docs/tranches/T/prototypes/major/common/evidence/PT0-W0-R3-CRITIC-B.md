# PT-0.W0 R3 hostile critic B

MODEL: `gpt-5.6-sol`; REASONING: `ultra`; WORKFLOW: `v2`

The frozen subject is the same byte set listed by
`PT0-W0-R3-CRITIC-A.md`. This critic did not inspect Critic A.

Verdict: **REJECT.** Narrow parse-only census and single-file no-clobber facts
stand; the evidence contract does not.

## Findings

1. **P1 — receipt/run are neither atomically published nor jointly verified.**
   A receipt collision or crash after GREEN run publication leaves an
   authoritative-looking orphan. Verification accepts a missing, mismatched, or
   non-arm64 run. Publish one indivisible bundle and verify its run contract,
   config, status, and receipt digest.
2. **P1 — the machine contract contradicts the declared RED gate.** Parse-only
   evidence calls itself `PT-0.W0` and `GREEN`. Use an exact partial profile and
   separate `capture_status` from the still-RED PT-0 gate.
3. **P1 — the Value boundary is not enforced by the API.** Arbitrary sibling
   repositories can be supplied under disguised identifiers, and lexical path
   confinement permits symlink escape. Enforce exact permitted repository
   profiles and resolved-path confinement.
4. **P2 — executable bytes and version output are not from one proved payload.**
   Hashing a rustup-selected target while invoking a bare PATH command permits
   identity divergence. Execute the resolved target.
5. **P2 — publication is not crash-durable.** Temporary files and the containing
   directory are never synced before success is reported.

## Positive facts

- All frozen hashes matched.
- R3 contains exactly parse-that; the default and parse-only configurations
  contain no Value repository.
- R3 records Darwin/arm64 and distinct selected Rust payload hashes.
- The two historical output hashes remain unchanged.

No file was edited and Critic A's report was not inspected.
