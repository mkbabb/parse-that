# Novelty N1-A4 owner audit

Date: 2026-08-01

Status: **CLEAN SOURCE AUTHORITY — COMMIT/PIN REQUIRED BEFORE N2 — N-IETM PRIOR-ART-AWARE ONLY — ZERO DOWNSTREAM CREDIT**

## First falsifier and correction

N1-A3 is immutable false-green chronology. Its recursive reader converted JSON
number lexemes through `Number(...)`, so authenticated raw PID
`1.0000000000000000001` rounded to registry PID `1`, passed Ajv `integer`, and
was admitted. The CLI also parsed registry bytes with `JSON.parse`, retaining
the same rounding, duplicate-key, and unpaired-surrogate exposure.

N1-A4 replaces that boundary rather than adding a PID-specific check:

- the public validator receives registry bytes, not caller-parsed records;
- one strict byte parser owns registry and raw decoding;
- invalid UTF-8, decoded duplicate keys, noncanonical numeric aliases,
  integers outside `±9007199254740991`, and unpaired Unicode surrogates reject
  before Ajv;
- only canonical safe-integer number tokens are admitted;
- the raw contract is v3 and explicitly owns Unicode-scalar strings;
- registry declared-count maxima match the exact numeric domain;
- exact Set membership replaces locale collation; and
- hostile token injection uses path-addressed unique sentinels.

## Independent audit result

A fresh non-author read-only audit found no material false-green:

- public baseline: GREEN, 10 records and 1 raw row;
- controls: `8/8` GREEN;
- hostiles: `130/130` RED with exact unique own-reason codes;
- independent checks covered safe boundaries, fraction/exponent/`-0`, range,
  invalid UTF-8, decoded duplicates, escaped scalar boundaries, unpaired
  surrogates, code-unit-distinct Set membership, and raw↔registry drift;
- manifest: `15/15` unique entries;
- scoped packet: 16 regular files including the manifest, 157,075 bytes, all
  mode `0644`/nlink1, no scoped symlink or special node;
- stat/hash identity before and after checks:
  `1d720ae84454c805c37f7fddf0c5690eb07eefa37b10cb4f03abda234898a06d`;
- N2 root `/Users/mkbabb/Documents/Codex/2026-08-01/parser-novelty-n2-ietm-f0`
  remained absent;
- `git diff --check`, strict TypeScript, 14/14 Vitest files with 134/134 tests,
  manifest/no-CSS/four-subpath/four-packrat/no-span/no-dead-combinator proofs:
  GREEN.

No build, benchmark, prototype, parser-product, CSS, browser, API, package, or
release command was run by the independent audit.

## Exact packet identities

| Artifact | SHA-256 |
|---|---|
| 15-entry manifest | `f5d51872a5a72024bd46473695ddd26deee1460a50110315e29f4b1f62edaf26` |
| registry schema | `9520d29a401947527ea8e26a19180cdb0797c253f0f6253cc9662b04ad8aeb23` |
| raw schema | `48507dccc084755c9b3dea4bf39d0dbb1ce30b3d49e8157b656c3d48b3af8e8d` |
| production validator | `3976b24b0327e8fab0f38771a8736d75bc3d52741c0c1ffc8e9291f2f253c992` |
| hostile runner | `2fb2e23e05ee2f14127304ce51f9bb5c8ddead358f2c42532f57a5ed8ef0ea39` |
| baseline | `633d1d7fdc28b703667a00bc5c54a440e2f1cb33cde3b1c910f02e2b2cf096cf` |
| mutants | `f9f3d6970459d8492546b74ca3c9238602c6b30576628b3c93dc791886882cfb` |
| executable results | `154450d4337088848821e8ae58342dd2d2ccd64e60a8cf86b42e99ac832dfa1a` |
| raw row | `c4b0a43d3831ecf685274728aa8a3ae67d14a173cf816357ffbd571dabfd6c9d` |

## Owner disposition

N1-A4 is accepted as source authority once the commit containing this audit and
the prior-art adjudication is pinned. This acceptance does not establish broad
N-IETM novelty. The algorithmic substrate is prior art; only the conservative
parse-that callback/environment/effect/complete-product integration hypothesis
may be tested.

After the commit and a fresh absent-root check, exactly one existing genuine
Luna xhigh task may write the isolated N2 root. It must run the fatal
Ohm/Dubroy/GPeg equivalence and callback/effect/product controls before timing,
target PL-BE only, preserve raw receipts, and stop on first RED. N-DNF, N-WRR,
N-GLL, production source, CSS ownership, consumers, packages, and releases
remain closed.
