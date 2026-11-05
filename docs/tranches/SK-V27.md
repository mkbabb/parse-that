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
