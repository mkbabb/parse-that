# PT-0/U.W0 artifact reconciliation

Status: **harness repair verified; PT-0 and U.W0 remain RED.** This record
supersedes the historical pin receipt as current authority without rewriting
that receipt or its author record.

## Boundary

- Declared model: `gpt-5.6-sol`; reasoning effort: `xhigh`.
- Production source and sibling repositories were read-only.
- Value remains published-only on `@mkbabb/parse-that@1.0.0`; this work grants
  no PT-E/P00/P01 authority and publishes nothing.
- No stable pin capture was attempted because there was no five-repository
  quiescence window or clean disposable baseline.

## Minimal repairs

1. `rust/.cargo/config.toml` now resolves `csp-solver = "0.1"` to BBNF's exact
   `crates/csp-solver` 0.1.0 package. The previous path selected the independent
   0.6.0 workspace, so Cargo ignored the patch and refused `--locked`.
2. `rust/Cargo.lock` adds only BBNF's real `csp-solver` dependency on
   `include_dir` and the `include_dir`/`include_dir_macros` 0.7.4 nodes. No
   existing package version changed. A subsequent locked, offline resolution
   left the lock byte-identical at
   `016ced93ef6868b1ea12db29c9c2334090104c7d058dd2af41147e8db71132a0`.
3. The pin harness resolves `rustc` and Cargo through `rustup which` before
   hashing executable bytes. It continues to execute the selected commands for
   raw version evidence. The selected payload digests are now distinct:
   `rustc` is
   `95d199b3cc0a2e43a904e3ed6120738ce768b7300214023a56d60cbeacf76d36`
   and Cargo is
   `c6170b6af6c6205953bff3119c3c003744f5b85e9f76489d12e3e45094f1b296`.
4. Only the two new U.W0 test drivers required rustfmt changes. Production bytes
   were not formatted or modified.

## Bounded gates

| Gate | Result |
|---|---:|
| `cargo fmt --manifest-path rust/Cargo.toml --all -- --check` | GREEN |
| common pin-harness tests | 16 passed, 0 failed |
| locked offline workspace dependency resolution | GREEN; lock unchanged |
| byte-class/stripe controls | 6 passed, 0 failed |
| regex syntax witnesses | 22 passed, 3 RED |
| regex runtime witnesses | 1 passed, 7 RED |
| run/diagnostic witnesses with `diagnostics` | 1 passed, 4 RED |
| safe-API UI witnesses | 1 passed, 3 RED |
| direct/generated witnesses | 1 passed, 2 RED |
| bootstrap witnesses | 1 passed, 3 RED |

The 55 focused U.W0 tests therefore contain 33 controls/already-satisfied
properties and 22 named RED defects. RED remains independently observable for:

- capture identity, multiline flags, and Unicode word syntax;
- absolute/line anchors, ordered alternation, lazy repetition, Unicode word and
  property semantics;
- cross-source spans, incoherent parser state, invocation/unwind diagnostics;
- raw `Span`, `ParserState`, and `PaddedView` construction;
- direct/generated closing-bracket and malformed-pattern agreement;
- caller-rooted, source-tree-safe bootstrap without expand/Python rewriting.

## Provenance ruling

The historical stable receipt remains useful evidence of its recorded dirty
transaction, but not a valid current PT-0 pin: its equal Rust executable hashes
are hashes of the shared rustup proxy, and `npm run verify` correctly reports
receipt drift after the harness and repository changes. A pristine-baseline
provenance claim is therefore **UNPROVEN**, not repaired by recapturing today's
dirty trees. PT-0.W0 can close only after a bounded quiescence window, a clean
disposable baseline capture, two hostile critics, and adjudication on the same
bytes.
