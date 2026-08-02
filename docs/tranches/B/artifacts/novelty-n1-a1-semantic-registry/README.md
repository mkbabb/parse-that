# N1-A3 semantic-registry correction receipt

This source-only packet preserves immutable N1-A commit `a04a7e658bee32a1fb252a4e5b4f3ce359a5947d`
N1-A1 commit `914957fb354e80b51207118f1cc5f01564111b7a`, and N1-A2
commit `e663a91b5dca760ef181f0abf661cf7d1037010a` while correcting
N1-A2's unbound sink/RUN/ROW fields, unsafe counter comparison, and duplicate
JSON-key false-greens. It is not an N2 prototype, benchmark, runtime, CSS
implementation, candidate, package, or release.

The sole production validator is
`../../coordination/NOVELTY-EVIDENCE-REGISTRY.semantic.mjs`. Its trusted caller
pins the N1-A branch/head, N2 phase, absent N2 root, executable family, law
compatibility, packet counts, and registry/raw inventories outside submitted
records. `NOVELTY-RAW-ROW.schema.json` closes every authenticated NDJSON line.
The source-owned recursive JSON reader rejects decoded duplicate keys at every
object depth before schema validation. Authenticated bytes now own the complete
resolved RUN projection and every performance-bearing ROW field, including
artifact descriptors and sink. Counters use canonical unsigned decimal strings
and `BigInt` equality. The schema-valid gold packet has ten records, one exact
raw row, and multiple distinct real descriptors. The hostile runner calls the
same production validator for the gold packet, a reversed-order control, and
102 one-owner mutants; expected error codes exist only as test literals.

Run only the source validation:

```sh
node docs/tranches/B/coordination/NOVELTY-EVIDENCE-REGISTRY.semantic.test.mjs
```

The frozen N2 path remains absent. N2 dispatch remains blocked until another
fresh independent audit accepts N1-A3.
