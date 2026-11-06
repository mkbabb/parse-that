# Invocation-kernel v4 born-RED baseline

Status: **captured before any v4 source existed**. Declared implementation model:
`gpt-5.6-sol`; reasoning effort: `xhigh`; delegation: none.

The binding v3 adjudication, both reviews, the P2 execution adjudication, tranche
README, Value V-next coordination file, W0-W7, and every v3 non-review source,
test, script, configuration, package, README, and license file were read before
this run. V3 was used only through the external adapter; no v3 module is an
implementation dependency.

## Exact command and inputs

Run from this directory on Node `v26.0.0` and npm `11.12.1`:

```sh
node test/external/baseline-v3.mjs
```

The command executed all V4-R01-R14 witnesses, both R01 sizes, both R02 shapes,
and H01-H10. H06 used the inherited grammar `A <- A B / epsilon`, `B <- "x"`
on the verbatim input `"x"`. H07 used 10,001 `"a"` code units and an explicit
200,000-step budget. H10 executed the v3 `npm test` and `npm pack --dry-run
--json` command families.

The machine-readable, exact result is
`test/external/baseline-v3-results.json`. It contains 26 top-level case records
and has SHA-256
`77e2eef38d9b40dfee1259bfb093e1289da3c6344ac7155d4632763ad7c78348`.

## Born-RED reductions

| witness | exact v3 observation |
|---|---|
| V4-R01 1,250 / 10,000 | both threw `RangeError: Maximum call stack size exceeded` |
| V4-R02 15,000 maps / 5,000 rules | both threw the same `RangeError` while sealing |
| V4-R03 | success `['a','b']` at 2, rather than committed failure at 2 expecting `"x"` |
| V4-R04 | `['a',['a','a']]` at 3, rather than `[['a','a'],'a']` |
| V4-R05 | threw `unreachable-b`; callback count 1 |
| V4-R06 | original `boom` survived and numeric state was zero, but opens 1 / closes-or-aborts 0 |
| V4-R07 | concrete `GrammarBuilder`, callable `_sealedGraph`, original callback recovered by identity |
| V4-R08 | 15 synthetic `rule` events while participant-time nonterminal cache census was zero |
| V4-R09 | string-composed rule/memo address functions and `string` journal keys found |
| V4-R10 | every invalid coordinate returned; negative zero remained negative zero |
| V4-R11 | runtime identities happened to match, but the binding borrowed immutable-by-contract law was absent |
| V4-R12 | no versioned receipt, control categories, or stable three-digest proof |
| V4-R13 | no shared compiled public-suite ledger or packed replay |
| V4-R14 | six-module non-Goldilocks source tree and no source-isomorphic mirrors |

H01-H06 and H08-H10 reproduced the bounded v3 behavior recorded by the
adjudication. Exact H07 returned typed `step-budget` resource failure at offset
7,992; it did not expose a partial success. These inherited greens do not weaken
any v4 witness.

## File hashes

| file | SHA-256 |
|---|---|
| `test/external/v3-adapter.mjs` | `19afa9845fd0d0b35c9a717d9305a8f41c8951809387fbfc8cfaf92c244aca37` |
| `test/external/witnesses.mjs` | `a86c054a5147bc0211fc7fcb83cc553c953659f08eb2ac5a3229487e3937dbbe` |
| `test/external/baseline-v3.mjs` | `9f76ac0199fcec7ee980fdfee0aa35f2a381ed2ca0495b77867c5a5915dbdb37` |
| `test/external/baseline-v3-results.json` | `77e2eef38d9b40dfee1259bfb093e1289da3c6344ac7155d4632763ad7c78348` |

The adjudicated sorted 39-file v3 non-review/non-adjudication ledger remains
`aab52f429856122bcf8ad54d626ab9ad91ec7fa055e686ac0597543903cc5483`.
The current local full-file listing (including generated distribution paths) was
also pinned independently as
`ac37ea779035bba095a473c25008137b86e0ec337e427644f2932d41be5806f1`.
