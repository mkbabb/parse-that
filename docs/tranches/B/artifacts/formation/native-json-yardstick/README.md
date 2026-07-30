# Native JSON feasibility yardstick

Date: 2026-07-29

Status: **FEASIBILITY RED; NO REOPENING; NO CANDIDATE; NO RELEASE**

Control: accepted M2
`de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Control `typescript/src/parse/parsers/json.ts` Git blob:
`868df470c1468f62b200260c16a4111b735da7ec`.

Generated-source fixture Git blob:
`2c2e10d467fef17c062b5729f16ca4385760cf19`.

Root reopening authority:
`PARSER-P3-ROOT-FEASIBILITY-RULING-2026-07-29.md`, SHA-256
`8fe9a26b9f98eb4567e4cca0e5b1f8d230366dde1f2342d212c78aa199bdc5e9`.

## Question

P3 ended with zero surviving candidates. Root permits another implementation
campaign only if a mechanistically new, two-consumer, scannerless primitive
already clears `>=10x` on a small-scale equal-product immutable-result
preflight and predicts the missing whole-product gain.

This assay measures the accepted-M2 logical `jsonParser` against native
`JSON.parse` on the exact P3 generated JSON sources. It asks how much headroom
exists even against a consumer-specialized native semantic-work yardstick
before another generic runtime experiment is justified.

`JSON.parse` is not an admissible candidate, generic primitive, control
replacement, or lower-bound proof. It supplies no parse-that diagnostics,
recovery, failure provenance, typed faults, or Value-shaped consumption. The
assay therefore grants no correctness, formation, execution, or release
credit.

## Equal work

Two planes are timed:

- `value`: both sides return deeply equal JavaScript JSON values;
- `immutable-result`: both sides additionally allocate and freeze the same
  success envelope, `{ ok, value, span, diagnostics }`, with frozen span and
  empty diagnostics.

Every process first asserts exact deep equality. Each point then uses eleven
alternating control/yardstick batches. Seven independent Node processes are
aggregated with a deterministic 20,000-sample bootstrap of the process
medians.

Runtime: Node `v26.0.0`, V8 `14.6.202.33-node.19`.

## Results

Ratios are accepted-M2 time divided by native-yardstick time.
`Need beyond native` is `10 / optimistic bootstrap high`: the minimum speed
an admissible candidate would still need over the native yardstick to clear
the binding `10x` threshold.

| Scale | Plane | Median | Bootstrap 95% | Need beyond native |
|---:|---|---:|---:|---:|
| 4 | value | 6.3249x | 5.7796–6.3428x | 1.5766x |
| 4 | immutable result | 5.0050x | 4.9513–5.0985x | 1.9614x |
| 8 | value | 6.2719x | 6.2018–6.5793x | 1.5199x |
| 8 | immutable result | 6.0826x | 6.0293–6.1943x | 1.6144x |
| 16 | value | 6.9816x | 6.6898–7.0120x | 1.4261x |
| 16 | immutable result | 6.5890x | 6.3323–6.6830x | 1.4963x |
| 33 | value | 7.3558x | 7.2057–7.7563x | 1.2893x |
| 33 | immutable result | 7.1090x | 6.0999–7.3436x | 1.3617x |
| 96 | value | 7.7056x | 7.5938–7.8125x | 1.2800x |
| 96 | immutable result | 7.4348x | 7.2902–7.5846x | 1.3185x |
| 753 | value | 8.5195x | 7.8431–8.6014x | 1.1626x |
| 753 | immutable result | 7.6391x | 7.5550–7.8563x | 1.2729x |

The binding small-scale immutable-result rows are decisive for dispatching a
new campaign: even native `JSON.parse` reaches only 5.0050x at scale 4 and
6.0826x at scale 8. At the optimistic confidence bound, an admissible generic
candidate would still need to beat the native yardstick by 1.9614x and
1.6144x respectively while also adding the omitted parser semantics.

## Ruling

No concrete mechanism currently satisfies root's reopening condition.
In particular, moving cursor/error status from mutable state fields into a
numeric offset return does not predict a nearly twofold win over native
`JSON.parse`, does not itself supply a distinct two-consumer need, and would
be another unqualified closure-runtime campaign. It is not implemented.

This is an honest feasibility-RED result, not a threshold waiver. Parser
formation remains at:

```text
P1 COMPLETE
  -> P2 COMPLETE
  -> P3 COMPLETE
  -> isolated every-subject >=10x proof RED / no candidate
  -> formation Clean A/B BLOCKED
  -> formation admission BLOCKED
```

The next research implementation may begin only when a named generic
mechanism supplies exact Value and logical `parse-that#jsonParser` needs, a
credible source for the missing gain, and a `>=10x` small-scale immutable
result before bootstrap. No candidate pack, API change, execution edge,
Value migration, BBNF handoff, or release follows from this yardstick.
