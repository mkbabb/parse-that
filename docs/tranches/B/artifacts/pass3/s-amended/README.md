# Pass 3 S corrected evidence

Date: 2026-07-29

Parent: `96ad567995176281817aef1bfb84ef38707c2505`

Disposition: **HELD — RED**

This directory contains the XR-21-corrected S evidence. The harness uses
longest-first whole-name inputs, asserts complete value/span consumption,
times both sides through `Parser.parseState`, alternates AB/BA order, retains
every batch, reports a separate raw-internal plane, and records both
authored-span and outer-span memory controls.

## Files

- `raw/sample-96-sequence-{1..5}.json`: five fresh corrected sequence
  processes, alternating first side across processes.
- `bootstrap-sample-96.json`: exact `5^5 = 3,125` bootstrap distribution of
  the five-process median.
- `raw/full-753-sequence-1.json`: one corrected full-denominator observation;
  signal only, not a confidence bound.
- `raw/sample-96-recovery-1.json`: first corrected recovery/result
  observation; signal only, not a confidence bound.
- `MANIFEST.sha256`: exact file hashes, excluding the manifest itself.

## Binding result

| Plane | Exact-bootstrap 95% low | Median | 95% high |
|---|---:|---:|---:|
| 96-name matched-boundary sequence | 9.033× | 9.655× | 9.986× |
| 96-name raw internal sequence | 9.802× | 10.884× | 11.314× |
| 96-name immutable result | 4.804× | 5.008× | 5.060× |

The formal ≥10× gate is RED. The one-process full result of 78.839× does not
waive the small scale or immutable-result failure.

## Source seal

```text
e8c9b7e193fd13159fb82ce875043e21a152d578f4c5fb3c50b6a4f34e777faa  typescript/test/prototypes/pass3/s/kernel.ts
559b54db7c524a5ad9f223c030138e214c466c07ab6bfc82a1bd0315772a0651  typescript/test/prototypes/pass3/s/kernel.test.ts
b7a352e2b977a9857174be7debb315757f22ee232410355dbb14215765bc4cc9  typescript/test/prototypes/pass3/s/profile.ts
e22a6e016f55f7a6725d431139b6eb2be2db36d866f526b13363571a03813921  typescript/test/prototypes/pass3/s/hot-profile.ts
```

Environment: Node `26.0.0`, V8 `14.6.202.33-node.19`, Darwin arm64.
Standards input: `@webref/css@8.7.1`, SHA-1
`481d6fd53548a0248eab2785739835d4cb2fac10`, integrity
`sha512-O60bIKYKl5RpLYsWOnOlWzBCEa2NYKapaeg28gOxsjfHHFK51BWRFcwFNJG04lcZxE6yzrEhWzsW35Bjv5RRXA==`.
