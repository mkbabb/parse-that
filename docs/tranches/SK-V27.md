# SK-V27 "LOCKSTEP": pointer

parse-that's waves from 2026-11-05 run under the joint bbnf-lang / parse-that / pprint programme sk-v27. The plan of record lives in bbnf-lang on branch `sk-v27`:

- `restart/skinny/tranches/sk-v27/PLAN.md`: the waves LW1..LW7, the lanes, the lockstep gate and the owner rulings X-1..X-10.
- `restart/skinny/tranches/sk-v27/LEDGER.md`: units, falsifiers and the design crosswalk.

What it means for parse-that, pending the owner's rulings:

- X-2: the one regex engine (`rust/regex`) is renamed `parse-that-regex`, with no bbnf vocabulary.
- X-3: the SIMD kernel library `rust/simd` (`parse-that-simd`) is the only `core::arch` code.
- X-5: `egraph`, `egraph-derive` and `csp-solver` move into this workspace, so the repo DAG becomes pprint → parse-that → bbnf-lang.
- U.W1 becomes LW2, U.W2 becomes LW4.PERF and U.W3-5 become LW3/LW4.RX. U.W7 is retired.

No release happens before LW6 (U-REL) and wf_d837f96c's close is on record. `.github/workflows/**`, `typescript/package.json` and `CHANGELOG.md` stay held until then.

## LW1 lockstep gate (2026-11-05)

Verdict: LW1 NOT CLOSED. The record is in bbnf-lang `sk-v27` `4f2c5772d` (LEDGER §5 gate rows). For this repo:
- `3a63bbd` makes the build hermetic: egraph, egraph-derive and csp-solver come from bbnf-lang `c9b93adb4`, and pprint from `2b4d2d48`, all as git+rev edges. `085acdd` migrates the `regex` test target to `parse_that::regex::{parse, parse_with}`.
- On CI the bbnf-lang edges still fail, because cargo has to update bbnf-lang's private `docs/precepts` submodule. The cure is X-5's move of those three crates into this workspace (LW2.TOPO-1).
- The suite is RED ×2 at `085acdd`: 458 passed, 12 failed.
  - json_test ×11: `JsonValue::String` keeps its quotes.
  - `test_nested_media`: stack overflow.
  - One prose doctest in `scan/quote_parity.rs`.
  - css_parse_test also needs the gitignored `data/css` (LW2.TOPO-6).
- The master working tree's uncommitted ByteClass8 and scanners work has not been captured yet (LW1.TOPO-3 remainder).

## LG-1 on CI (2026-11-06)

Verdict: still NOT CLOSED. The record is in bbnf-lang `sk-v27-lw1-gate` `b133466de` (LEDGER §5 LG-1 rows). For this repo:
- `957bf74` (merged into `sk-v27` as `eb03b36`): JSON strings and keys are their content again. AQ.4 had swapped in the quoted-span scanner, and `sp_quoted_string_content` now restores the content form. json_test is 29/8 ×2, and the 8 are the `data/json` corpus tests. With the corpus present it is 37/37 ×2.
- The quote-parity pseudo-code is now a `text` block, so `cargo test --doc` returns rc 0 ×2.
- CI is still RED at dependency resolution. The bbnf-lang edges need the private `docs/precepts` submodule. This is owner ruling R-a, or X-5's move together with PP-07.
- `test_nested_media` still overflows a 2 MiB debug stack. Each at-rule nesting level costs about 1.36 MiB, and the measurements are in bbnf-lang `evidence/LW1.LG1/`.

## LW2 lockstep gate (LG-2), third reading on CI, 2026-11-10

Verdict: NOT TAKEN, RED; nothing merged, PR #4 stays draft. The record is in bbnf-lang `lw2/lg2-r3` `0379fe71a` (LEDGER LG-2 third-reading row, `evidence/LW2.GATE/r3/`). For this repo, at `sk-v27-lw2` `e2d1af5` (CI `42752374625`):
- The repo-DAG and hermetic clean-clone job passes; `check-repo-dag.sh` rc 0 ×2 locally, with no edge into bbnf-lang.
- `ci-ok` is RED on exactly the held set: `test_nested_media` overflows its stack on `+stable` and macos-15 (PERF-3, cured on `lw2/s6-perf`, unmerged), and the 5 `debug_test::tests::test_css_*` fail on ubuntu (S4-B, cured on `lw2/s4b-regex-empty` `e028e8b`, unmerged).
- PERF-1's `rust/simd` crate is formed on `lw2/s6-perf` `011ba27`; PERF-1b is owed.

### LW2 LG-2, fourth reading (2026-11-11): NOT TAKEN, RED; nothing merged

Record: bbnf-lang seat branch `lw2/lg2-r4` `0a3ccb1b7` (LEDGER LG-2 fourth-reading row, `evidence/LW2.GATE/r4/`). For this repo, at `sk-v27-lw2` `5608b94` (PR #4, CI `42968913714`, 9/9 on attempts 1 and 2):
- `check-repo-dag.sh` rc 0 ×2, no edge into bbnf-lang, no gitlinks.
- The S4-B, PERF-3 and S6/S7 cures are merged; the held set from the third reading is gone.
- Hir ABI v1 (RX-2) is frozen: `abi_fingerprint` 1/1 ×2 at `0x0c587e007f6ccf7d`.
- The gate stays RED on bbnf-lang's side: TOPO-4's publish dry-run fails at `bbnf-ir` (this repo's crates publish rc 0 ×2), and LG-d/LG-e were not re-read in Phase 3. No master merge.
