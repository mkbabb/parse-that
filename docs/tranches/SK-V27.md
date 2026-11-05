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
