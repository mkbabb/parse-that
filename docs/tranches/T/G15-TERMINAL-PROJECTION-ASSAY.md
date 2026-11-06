# G15 terminal-projection consumer assay

- Assayed: `2026-07-22`
- Mode: bounded formation-only package/source audit
- Status: **RED — uplift candidate only; no consumable artifact**
- Product, publication, handback, consumer, wave, lock, or tranche credit: **zero**

This record preserves the Value V·π G15 relay as consumer evidence for a future
T execution epoch. It neither imports Value prototype bytes nor authorizes
parse-that product work. The reported Value hashes below are immutable
coordination inputs; this assay independently verifies only parse-that bytes.

## Consumer evidence received

| Evidence | SHA-256 / result |
|---|---|
| G15 feature | `a88dc7dfb1d452d8bcf103d359cd058722db7ad93ed598622f6e1cfc8d5b3a58` |
| CSSWG source commit | `08f2f799da6a306e8bf5daca208683717f26d643` |
| CSSWG `Overview.bs` | `3f129d17407f9bd027291bcfb8015beb86fc229bf5efe505b49ec2dc30be4390` |
| consume-number excerpt | `3d9bc61ac4fbaa5a1038354c260e2289bc334b9837b9faf5acab840439cc5708` |
| original candidate set | `6b3b2057519a595b83f70b317ccc88b08b0e34d232f20feaf580409b55da0d40` |
| fresh holdout | `b06c6345fe88149eb5cb90ff38a617dc08d5b26e8ae081ddfe80b9178322c63c`; four candidates `180/180`, including transaction/composition/introspection/no-ID-growth |
| benchmark raw / result | `0bb3348aa75deb938fef37735fa4a4b69a7f4312f26a73c48e7ccb3828b48ee1` / `9269e6ec1769e9137f283bc0096b9d87b052714c7a26e8c572a9a0af4b1a55dd` |
| H one-regex plus map | geometric ratio `1.0299`; one-sided 95% upper `1.0772`; FAIL |
| D dispatch | geometric ratio `1.0748`; one-sided 95% upper `1.1179`; FAIL |
| B / S structured | `4.41x` / `3.77x` versus deposed |
| corrected H2 grammar | `8c3ac689f2e24635216ac0499f23166996ac0136e0b6876e82a8da4f75eb95aa`; exploratory approximately 2.4% behind deposed |

The relay reports that H3 projection micro-optimization and H4 guarded common
fast path did not improve reliably. These figures are consumer-reported, not a
parse-that benchmark reproduction or release proof.

## Published parse-that authority

The only consumable TypeScript artifact remains
`@mkbabb/parse-that@1.0.0`, tag `v1.0.0`, commit
`7eab78c89961001a689952c091fdbbf64af735da`. Current TypeScript source is
byte-identical to that tag.

| Artifact | SHA-256 |
|---|---|
| `typescript/package.json` | `f53ca9b85c43e65c1f3f8a21414f990211d8d0e6a7f07df805557cdb6b50f4ff` |
| `typescript/src/parse/leaf.ts` | `fce839c2c22858c1133d6576c3a053cdde0a88e4c0d2a838a5011dec08ba8a07` |
| `typescript/src/parse/parser.ts` | `16978b12a0674a218e4af041606232d0d81fc57f3f6d7bdb29149173b4fe3c50` |
| `typescript/dist/leaf.d.ts` | `ca3a8e2cb9257f9d56e95b247c4b58e46524ae68a84172ea217d3eb3c4a24869` |
| `typescript/dist/parser.d.ts` | `009bcebba834146cde9b92ef46184ddff8776d69fca2747bc38bff8e085cb642` |
| `typescript/dist/packrat-entry-CS1td-8B.js` | `1f8674c3d325579363356e1fd091a3735ae9a7ac9da0cb61a4ca0ebfb6d474a8` |

`regex` accepts an optional
`(RegExpMatchArray | null) -> string | null` projection and returns
`Parser<string>`. It cannot express a generic terminal projection such as
`regex<T>` without type abuse. General semantic projection therefore requires
the separate `Parser.map` combinator, which constructs a second parser and
context and calls the predecessor parser before applying the projection.

No public or handback-authorized artifact adds generic terminal projection,
leaf-to-map fusion, or an alternative idiomatic engine path. Invocation-kernel
v4 and U.W0 remain private formation/preseal research. `U.md` is still
`FORMED; born RED` at
`3ff4193ee3a5ea7b5696bd3eb91940ddc767e76eb56a7b1179b149ea098c147c`;
the handoff boundary is
`891fb11d2b747200c6a9adbcb696d5c45a1b41cbb7c465e57bf96219290997cc`.

## Future uplift obligation

G15 establishes a measured consumer seam, not a preselected API. A future T
wave must compare at least:

1. generic terminal-owned projection with one parser/context identity;
2. grammar-derived leaf/map fusion performed by the engine or compiler; and
3. a no-extra-wrapper specialization that preserves the ordinary combinator
   algebra and introspection.

The winning design must be grammar-general, preserve exact success/failure,
transaction, composition, diagnostic, exception, memo, and parser-identity
semantics, show no parser-ID growth beyond its declared construction, and beat
the exact published-1.0/deposed controls under fresh local grammar-by-engine
A/B measurement. A custom `Parser`, CSS scanner, semantic shortcut, cast,
weakened grammar, or Value-private candidate is inadmissible.

This evidence joins `TRANSACTION-ASSAY.md`: terminal projection and full
transaction semantics must share one coherent engine design rather than land
as unrelated wrapper patches.

**RED / NO ARTIFACT. G15 IS A FUTURE T UPLIFT CANDIDATE ONLY.**
