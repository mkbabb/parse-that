# P5-EUW owner Sol adjudication

Date: 2026-07-30

Status: **P5-EUW KILL — FORMATION RED — NO RELEASE**

This is the fresh owner adjudication required after the corrected P4 jury and
sealed Luna P5 packet. It independently checks the Luna evidence, challenges
its legacy-ABI premise under the clean-break/no-compatibility law, executes
both legal one-executor variants, and binds the terminal result.

## Sealed Luna intake

Root:

```text
/Users/mkbabb/Documents/Codex/2026-07-29/parser-p5-euw-luna/outputs
```

The root contains 28 files. `checksums.sha256` has SHA-256
`e2d8fb3e344088dfa4af963b542ce22296f6485f16120f397791d271962765fc`;
its 27 entries independently verify twice. All JSON is valid. All nine `.mjs`
files and all result/profile paths are explicit phase-zero sentinels: zero
raw rows, no executable runner, no candidate runtime, no CSS vertical, no
timing, and no profile process.

The accepted-M2 source identities reproduce independently:

```text
efec8b86685cdc592aae0a6c179b59bac257b31395f01ae4c07bf5fb8458348b  json.ts
4962e0212883ba16bc8a7639a8668d86c4fc8030ba9a49efb6126f3ba46cd8f5  parser.ts
ff9eb71f301e646d899b1f63c4ff85326991ad1b98a6b219748babead1b7f125  state.ts
```

Luna's static census is correct: accepted M2 exports
`ParserFunction(state) => ParserState`, exposes `Parser.parser`, and real
`latex-paper` source constructs custom `Parser` bodies and invokes
`.parser(state)` directly.

## Hostile correction

`P5-ZERO-ABI-001` is not sufficient by itself. The tranche requires clean
breaking changes and forbids legacy wrappers, aliases, shims, fallbacks, and
parallel executors. A surviving one-executor ABI may therefore migrate
consumers atomically instead of preserving the old raw signature.

The legacy consumer proves migration cost; it does not prove that a clean
successor ABI is illegal. The owner retest consequently admits exactly two
variants:

1. cursor-return clean break:
   `(state, cursor) => nextCursor`, ordinary value written to state, frozen
   singleton thrown on routine mismatch;
2. same-state success:
   `(state) => sameState` on success, frozen singleton thrown on routine
   mismatch.

Each variant has one executor and zero compatibility route. The first changes
the raw success and failure ABI. The second retains the success signature but
changes raw mismatch. Both preserve the timed public parse product.

## Executable assay

Evidence:

```text
docs/tranches/B/artifacts/pass6/euw-clean-break/
typescript/test/prototypes/pass6/euw/
```

One `makeJson(api)` factory reproduces the accepted dispatch-based grammar for
M2 and both candidates. The timed control is the exact M2 exported
`jsonParser`; the rebuilt M2 instance is equality-only. Four nested,
alternating object/array fixtures preserve exact JSON values and immutable
public state/result projections in all 14 process rows.

The run uses fourteen unique PIDs: seven paired processes per variant, ten
balanced AB/BA batches per process, 2,000 parses per arm per batch, and
seed-varied fixture order. Control and candidate grammar construction are
outside the hot-success timing boundary. Node is `v26.0.0`; V8 is
`14.6.202.33-node.19`.

Exact raw ranges:

```text
cursor  0.6076393886458284x – 0.7527093116738474x
state   0.6148784530068562x – 0.7001295581738501x
```

Every row is below `1x`, hence every row is more than fourteenfold below the
required `10x` floor. Bootstrap is correctly withheld. CSS, broader equality,
allocation, IC, deopt, GC, and retained heap are not reached.

The candidate equality plane is success-only. This limitation favors the
candidates: adding failure, recovery, diagnostics, faults, spans, or full CSS
cannot make a currently slower hot-success runtime satisfy the raw floor.

## Ruling

P5-EUW is terminally killed on executable performance, not on legacy
preservation:

- `FOLD` Luna's ABI census and consumer anchors;
- `AMEND` the claim that old raw signature preservation is independently
  mandatory;
- `KILL` cursor-return plus exceptional mismatch;
- `KILL` same-state success plus exceptional mismatch;
- `PRUNE` all EUW timing, CSS, and profile continuation; and
- grant zero formation, admission, candidate, product, API, release, Value,
  Keyframes, ABI-freeze, or BBNF credit.

The accidentally created fresh-Sol task
`019fb175-70a5-7c31-a4c9-29f7faa9dbc9` is breach evidence only. It read the
drive seed, wrote zero regular files/content bytes, created only an empty
output directory, terminated, and was archived. It is not authority.

## Next formation seam

EUW isolates thrown routine mismatch as harmful on the smallest live JSON
product. It does not execute the original P4 signed-return observation.
P4 RSR was designed as signed cursor/error plus regions/slabs/finalization;
Luna never implemented it. The owner P4 ruling split the signed-return
observation from, and pruned, its region/finalizer machinery.

The only non-contrived next assay is therefore the held scalar seam alone:
one signed integer return, nonnegative cursor on success and negative
mismatch/fault tag, ordinary value written directly, one executor, no region,
slab, journal, finalizer, compiler, VM, generated grammar, scanner, wrapper,
fallback, or alternate path. This is explicit unimplemented-debt
falsification, not a claim that P4 RSR survived.

It starts with the same exact-M2 scale-4 immutable-result raw floor. Any raw
ratio below `10x` kills it before bootstrap, CSS, or broader work.
