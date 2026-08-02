# N1-A2 semantic-registry correction receipt

This source-only packet preserves immutable N1-A commit `a04a7e658bee32a1fb252a4e5b4f3ce359a5947d`
and N1-A1 commit `914957fb354e80b51207118f1cc5f01564111b7a` while
correcting N1-A1's product-cross-swap, opaque-raw, and lexical-path
false-greens. It is not an N2 prototype, benchmark, runtime, CSS
implementation, candidate, package, or release.

The sole production validator is
`../../coordination/NOVELTY-EVIDENCE-REGISTRY.semantic.mjs`. Its trusted caller
pins the N1-A branch/head, N2 phase, absent N2 root, executable family, law
compatibility, packet counts, and registry/raw inventories outside submitted
records. `NOVELTY-RAW-ROW.schema.json` closes every authenticated NDJSON line;
the validator derives row identities, fixture selection, products, timings,
aggregate count, and mechanism counters from those bytes. The schema-valid
gold packet has ten records and one internally exact raw row. The hostile
runner calls that validator for the gold packet, a reversed-order control, and
71 one-owner mutants; expected error codes exist only as test literals.

Run only the source validation:

```sh
node docs/tranches/B/coordination/NOVELTY-EVIDENCE-REGISTRY.semantic.test.mjs
```

The frozen N2 path remains absent. N2 dispatch remains blocked until another
fresh independent audit accepts N1-A2.
