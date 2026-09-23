# N1-A4 byte-owned semantic-registry correction receipt

This source-only packet preserves immutable N1-A commit `a04a7e658bee32a1fb252a4e5b4f3ce359a5947d`
N1-A1 commit `914957fb354e80b51207118f1cc5f01564111b7a`, N1-A2 commit
`e663a91b5dca760ef181f0abf661cf7d1037010a`, and frozen N1-A3 commit
`164fc9a672d4dee20233b5547275affc4df16dd7` while correcting N1-A3's
pre-parse numeric-rounding and registry-byte authority false-greens. It is not
an N2 prototype, benchmark, runtime, CSS
implementation, candidate, package, or release.

The sole production validator is
`../../coordination/NOVELTY-EVIDENCE-REGISTRY.semantic.mjs`. Its trusted caller
pins the N1-A branch/head, N2 phase, absent N2 root, executable family, law
compatibility, packet counts, and registry/raw inventories outside submitted
records. `NOVELTY-RAW-ROW.schema.json` closes every authenticated NDJSON line.
The public validator receives registry bytes rather than caller-parsed objects.
Its source-owned recursive JSON reader rejects invalid UTF-8, decoded duplicate
keys at every object depth, noncanonical or unsafe numeric tokens, and unpaired
Unicode surrogates before schema validation in both registry and raw domains.
The v3 raw contract intentionally permits only canonical safe-integer JSON
number tokens and Unicode-scalar strings. It does not normalize canonically
equivalent strings. Authenticated bytes now own the complete
resolved RUN projection and every performance-bearing ROW field, including
artifact descriptors and sink. Counters use canonical unsigned decimal strings
and `BigInt` equality. The schema-valid gold packet has ten records, one exact
raw row, and multiple distinct real descriptors. The hostile runner calls the
same production validator for the gold packet, reversed-order and numeric/
Unicode boundary controls, and an expanded own-reason hostile set; expected
error codes exist only as test literals. Exact set membership is code-unit
based and does not use host locale collation.

Run only the source validation:

```sh
node docs/tranches/B/coordination/NOVELTY-EVIDENCE-REGISTRY.semantic.test.mjs
```

The frozen N2 path remains absent. N2 dispatch remains blocked until another
fresh independent audit accepts N1-A4.
