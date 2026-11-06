# Invocation-kernel v4 evidence

Status: **isolated carrier complete; production, cross-runtime, Value adoption,
and self-adjudication remain RED**.

Declared implementation model: `gpt-5.6-sol`; reasoning effort: `xhigh`;
delegation: none. The subject is confined to this directory. No v1/v2/v3,
production TypeScript/Rust, tranche verdict/lock, bbnf-lang, or Value file was
written.

## Baseline and carrier identity

`BASELINE.md` records the mandatory pre-source v3 run. Its 26-case JSON receipt
has SHA-256
`77e2eef38d9b40dfee1259bfb093e1289da3c6344ac7155d4632763ad7c78348`.
It captured all V4-R01-R14 failures, both R01/R02 shapes, exact H06 `"x"`, and
the 10,001-input H07 shape without weakening any witness.

The sorted v4 source hash ledger is
`6bc0e3fdc6296e3c0872208229104299ecc44e38a92a777df80f0a37005ca1dc`.
Individual source hashes are:

| module | SHA-256 |
|---|---|
| `control.ts` | `5b1b1301f8ed2e1d0528ba9078bea6b38dfed702cd2d9ddd8e5c1fa5fae08d4b` |
| `debug.ts` | `15c3457f1d564453954eaf980512c9216f4574dc86e562e58abd2759e5a918dc` |
| `index.ts` | `cadf0e285c04cec3f0f617be1470b98e2ad87377a9f35c490cecf497e51e6f59` |
| `journal.ts` | `75bbe65b58d46b4917df52bb1dbc4d5ccc63d8e94a4fc5f0ee194a6ee4068d9f` |
| `lr.ts` | `238a059f8ab8088b1f06b277f6526f7b9a6da94feec389d8a3cab9f846dd5f50` |
| `model.ts` | `2292509451740cf83e56e2a044ce456a27be213b2b16bf9107f98e934504ddb2` |
| `outcome.ts` | `867df215c96b9ba42690b86ed6eef9757c4087c1fb04ae1150197f33d8750fc0` |
| `parser.ts` | `7be3df0dd25e7765eb57f0dc76ea867d591a6365c64833b6b59c8b94dcdbc39a` |
| `run.ts` | `18b02e009552dec378f0616281e254ffd3715ee7ecc019dbc7636800a937b18b` |
| `seal.ts` | `f8a8a295f4149e5e975a054c289253875d731ad6dfaf091d064537d26ce286c4` |
| `types.ts` | `30dabc22cbd2dac55a67cc3874f4a660f243cd5f96c9027640b0a7a23c1fcd65` |

The exact topology test proves these eleven modules, the sole-ownership import
table, zero unresolved local edges, zero feature SCC, an import-only `index`, no
source import of `index`, exact root source mirrors, the four-file oracle
allowlist, and package-only public test imports.

## Semantic and state receipts

The two final full runs reported 24 pass, zero fail, one intentional extended-gate
skip, and wall times 34.84 s / 35.35 s. The separate extended runs reported 4/4 pass
with wall times 9.70 s / 8.61 s; their 10,000-SCC bodies took 6.377 s / 5.775 s.
Both included the 100,000-code-unit H08 and exact 10,001-input H07 shapes.

Focused gates also ran twice:

| command | replay 1 | replay 2 |
|---|---:|---:|
| `npm run test:hostile` | 13 pass, 0 fail, 1 routed extended skip; 5.12 s | 13 pass, 0 fail, 1 routed extended skip; 3.73 s |
| `npm run test:deep` | 7 pass, 0 fail, 1 routed extended skip; 3.98 s | 7 pass, 0 fail, 1 routed extended skip; 2.85 s |
| `npm run test:state` | 8 pass, 0 fail; 2.68 s | 8 pass, 0 fail; 2.40 s |
| `npm run test:oracle` | 1 pass; 36.51 s | 1 pass; 34.79 s |

The gates prove the exact committed foreign failure at offset 2 expecting
`"x"`; recovery-aware simultaneous value `[["a","a"],"a"]`; unreachable
callback prefix `"a"` at 1 with count zero; original callback throw after
balanced LIFO abort; zero terminal live frames/choices/transactions/heads/
participants/journal/nonterminal cells; truthful participant phase mutations;
terminal-only rule cache publication; checked coordinates; structured journal
addresses; and borrowed identity behavior.

The oracle receipt was byte-stable in each pair of fresh processes:

```json
{
  "schema": "parse-that.invocation-kernel-v4.oracle-receipt.v1",
  "seed": 1592639710,
  "structural": {"grammars":13025,"inputs":127,"comparisons":1654175},
  "generated": {"cases":10000,"discarded":0},
  "corpusSha256": "05dafb55fb7b1a57a17c205a503d739892f3958606330f517e44f47873206d23",
  "oracleResultSha256": "dce39b90a03d98c6eb52ca4fa1b4182e14f07ffd6531ac709648f27648352d55",
  "vmResultSha256": "dce39b90a03d98c6eb52ca4fa1b4182e14f07ffd6531ac709648f27648352d55",
  "discrepancies": 0,
  "exhaustion": 0
}
```

Every required generated category (`direct`, `indirect`, `mutual`, `nullable`,
`lateAdmitted`, `productive`, `unproductive`) and control category
(`nestedCut`, `siblingCut`, `foreignCut`, `cutThroughMany`, `recovery`,
`recoveredCut`, `memoRollback`, `memoReplay`, `resource`, `callbackThrow`,
`staleToken`, `conflictingToken`) has explicit metadata count 1. The independent
model imports no source code. There were zero discarded cases.

## Package and raw observations

The strict source/test typecheck completed in 2.64 s on its first recorded run;
all clean builds also recompiled the strict source. The final compiled public
suite contains the identical `semantics.test.js` and `surface.test.js` files
locally and packed. Its SHA-256 ledger is
`64f310a498950de9621e1aa2f6a90fd7349d9beabd7fb9d1f4b84e796f1c81b0`.

The clean distribution contains the 22 `ARTIFACTS.json` entries only. Its ledger
is `bde9252730679a24cf3945883edbc45ae9ca588b1019269a92e6e0e23aa6a216`
and its uncompressed JavaScript/declaration size is 94,207 bytes. The package
harness removes `dist`, proves absence, performs two byte-identical clean builds,
creates two byte-identical packs, checks the exact archive allowlist, installs the
tarball, replays the unchanged public bytes, and passes root ESM identity, Node
worker, Vite build, strict NodeNext declarations with `skipLibCheck:false`, deep
subpath rejection, and compile rejection of `_sealedGraph`. The final external
tarball receipt is stored next to the package harness because a tarball cannot
contain its own hash without changing that hash.

Two raw state measurements on the fixed 10,000-address input observed:

| observation | run 1 | run 2 |
|---|---:|---:|
| elapsed | 47,498,750 ns | 46,222,333 ns |
| heap delta | 17,066,576 bytes | 17,065,960 bytes |
| journal high-water | 10,000 | 10,000 |
| final journal | 0 | 0 |
| continuation high-water | 3 | 3 |
| terminal memo Done cells | 10,000 | 10,000 |

These are raw observations, not thresholds, regressions, or confidence intervals.

## Borrowed ownership

`succeed` constants and recovery fallbacks are borrowed immutable-by-contract
references retained by the grammar. Map results are borrowed references owned by
the callback. Memo/rule reuse within one invocation may return identical
references. The kernel never mutates, clones, or freezes user values and does not
promise callback side-effect replay. User mutation makes semantic determinism the
user's responsibility. Inspection replaces values and callbacks with placeholders
and returns no original reference.

## Retained and deleted v3 organs

Re-homed and justified by v4 tests: invariant opaque parser/rule generics; frozen
null-prototype references; draft/sealed separation; duplicate/dangling rejection;
frozen node arrays; iterative SCC/reverse/effect closure; public result algebra;
evaluation-local evidence and relative diagnostics; one-child recovery; visible
choice identities; typed resources; first-write journal/rollback/compaction;
head-owned approximants with terminal Done publication; deterministic improvement;
finite-approximant oracle concept; ESM root identity; archive allowlist; and packed
ESM/declaration craters.

Deleted rather than copied: recursive solve/evaluate control; whole-input
prepopulation; recursive Tarjan/effect/minimum/guard walks; foreign-cut
backtracking; transient cache RuleCell variants; synthetic RuleCell events; array
truncation cleanup; exported concrete builder; `_sealedGraph`; `bindingOf`; graph/
callback/executor escape; string memo/rule/head addresses; unchecked public offset
casts; flat tests; source-only public tests; packed smoke substitution; combined
oracle/compiler; and checked v3 distribution as source. No v3 module is imported.

## Read-only Value coordination

The final pre-evidence read-only re-pin observed Value HEAD
`c654824e0b252cda7f8490b67f182a48c48cc0ed`; all-untracked NUL porcelain digest
`d8df136d9821214c9b8dd7950ae4fa56dca8157f33d9efa8aa1be7a712d7cc6b`;
handoff `76b2f725996397416ebb36b0f53e2a68e39f233aa348d0406e47738953e24ff3`;
live JSON `a2e0c505ccc1f7ff7a9c9ebecbffa03ff44a2674b9f9a37e91911a4ae559916b`;
PLAN `936322b863071996a8e344cbb3aab3db5f0d62169ddfd6a9a093cbf8be14be9a`;
PARSER-CSS-COLOR `45447611e147c7470900a929adc8a4370c435a3ae3c212ab39e32a9c74d49621`;
and frozen YAML `f7d60b452300dacf3a8a382c37a2d82b5fd05e28c96ae42ea2a50e9e3a6a9b9c`.
The CSS hash drifted again after the earlier live census, the checkout is actively
dirty, current event 1 is expired and V3-named, and there is no current production/
P03 acknowledgement.

The ten current Value defect IDs are routed without closure inflation:

| Value defect | v4 disposition |
|---|---|
| combinator runtime/type divergence | reproduced v4 public runtime/type gate; production/Value adoption still RED |
| core SCC/bundle | v4 source graph and Vite artifact gates pass; production core/bundle transpose still RED |
| artifact skip | reproduced by absent-dist clean build, manifest, archive, and packed-suite gate |
| EOF diagnostic | reproduced by public full-parse EOF offset/label gate |
| global diagnostics | reproduced by two invocation-local recovered-diagnostic sources; production remains RED |
| loader identity | reproduced by installed ESM identity, worker, Vite, and deep-subpath gates |
| nested recovery rollback | reproduced by H01/H04, typed transactions, and balanced control/state gates |
| dispatch domain | out of this invocation prototype; ASCII/Unicode dispatch and JS/Rust/WASM domain proof remain W6 RED |
| raw cross-source memo | reproduced by invocation-local memo callback count across repeated runs |
| state/result divergence | reproduced by discriminated public results, compile-time narrowing, and terminal census; production remains RED |

No Value file was written and no Value requirement is claimed adopted.

## Remaining RED crossings

- No parse-that production TypeScript, Rust, WASM, bbnf, or Value source was
  transposed. This package is private and isolated.
- The v4 bank is not yet a tracked, scoped-clean release subject and has not run
  from two clean tracked checkouts.
- Two fresh hostile auditors and a fresh adjudicator with verified metadata have
  not accepted it; this implementation does not self-adjudicate.
- W7 paired semantic/allocation/throughput/cold-start/bundle comparisons against
  `ef10d5b`, raw samples, and confidence intervals remain RED.
- UTF-16-to-UTF-8/Rust/WASM coordinate conversion and boundary corpora remain RED.
- Value's completed operation census, necessity ledger, stable accepted packet,
  packed Value-shaped CSS crater, return packet, and owner acknowledgement remain
  RED. Active packet drift independently blocks any cut.
- No publish, version proposal, release nomination, or production P03 authority is
  implied.

The carrier stops here, before production, for independent review and
adjudication.
