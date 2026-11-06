# Invocation kernel v4

Status: **isolated clean-break prototype; no production transpose authority**.

This package is the v4 carrier authorized by the v3 execution adjudication. It
has one sealed graph, one iterative invocation loop, demand-admitted recursive
participants, scoped cut owners, terminal structured caches, and an opaque public
parser/grammar surface. It does not import or alias v3 and exposes no compatibility
route, fallback executor, graph acquisition method, or workspace-source consumer
shortcut.

Values returned by `succeed`, recovery, and map callbacks are **borrowed
immutable-by-contract** references. The kernel never mutates, clones, or freezes
them. Constant and recovery references may retain identity across invocations;
memo and rule reuse may return the same callback-owned identity within one
invocation. User mutation and callback side effects are outside deterministic
kernel semantics.

The source topology and sole ownership are exactly `types`, `model`, `seal`,
`parser`, `outcome`, `journal`, `control`, `lr`, `run`, `debug`, and import-only
`index`. Root tests mirror those modules. The independent oracle is confined to
`test/oracle/{model,corpus,adapter,receipt.test}.ts`; reusable tests live in
`test/public`; package orchestration lives in `test/package`.

Run from the parse-that repository root:

```sh
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v4 run typecheck
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v4 test
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v4 run test:hostile
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v4 run test:deep
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v4 run test:oracle
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v4 run test:state
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v4 run test:extended
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v4 run test:package
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v4 run measure
```

See `BASELINE.md` for the pre-implementation v3 born-RED receipt and
`EVIDENCE.md` for exact v4 results, hashes, retained/deleted organs, Value
coordination, and remaining RED production/cross-runtime gates.

The final bounded receipt is 24 pass, zero fail, plus one intentionally routed
10,000-SCC extended-gate skip in `npm test`; `npm run test:extended` is 4/4.
The independent receipt is exactly 13,025 grammars × 127 inputs = 1,654,175
comparisons plus 10,000 generated cases, zero discard/exhaustion/discrepancy.
Its corpus SHA-256 is
`05dafb55fb7b1a57a17c205a503d739892f3958606330f517e44f47873206d23`;
oracle and VM both hash to
`dce39b90a03d98c6eb52ca4fa1b4182e14f07ffd6531ac709648f27648352d55`.
The source ledger is
`6bc0e3fdc6296e3c0872208229104299ecc44e38a92a777df80f0a37005ca1dc`,
the clean distribution ledger is
`bde9252730679a24cf3945883edbc45ae9ca588b1019269a92e6e0e23aa6a216`,
and the identical local/packed public-suite ledger is
`64f310a498950de9621e1aa2f6a90fd7349d9beabd7fb9d1f4b84e796f1c81b0`.
The non-self-referential final tarball receipt is
`test/package/PACKAGE-RECEIPT.json`.
