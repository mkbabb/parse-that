# P1 — exhaustive canonical byte codec

Status: `PAPER_V2 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 170 charged LOC`. Paper budget: `100 nonblank lines`.

## Exact byte classes

P1 owns one strict UTF-8 JSON subset. No BOM/whitespace. Keys are unique and
strictly increasing by unsigned UTF-8 bytes. Integers are canonical safe base
10: `0` or `-? [1-9][0-9]*`; reject `-0`, leading zero, fraction, exponent,
overflow. Non-JSON values use declaration-owned tagged objects.

Canonical string encoding is exhaustive:

| Scalar/byte class | Only accepted spelling |
|---|---|
| U+0000–0007, U+000B, U+000E–001F | lowercase `\u00xx` |
| U+0008/0009/000A/000C/000D | `\b`/`\t`/`\n`/`\f`/`\r` |
| quote/backslash | `\"` / `\\` |
| U+0020–0021, U+0023–005B, U+005D–007E | literal ASCII |
| slash U+002F | literal `/`; escaped slash rejected |
| U+007F | literal one-byte UTF-8 `7f` |
| U+0080–10FFFF, including U+0085 | literal shortest UTF-8 scalar |

Surrogates, overlong UTF-8, non-scalars, uppercase hex, printable Unicode
escapes, long-form short controls, duplicate/unordered keys, alternate number
tags, and trailing bytes are RED. No Unicode normalization occurs. For every
accepted `B`, `encodeCanonical(decodeCanonical(B)) === B` byte-for-byte.

P1 performs no mutation, injector selection, policy, expected-result lookup,
hash ownership, product traversal, or audit suppression. It copies input,
returns frozen values, and exposes only codec operations.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E01` | `P1 -> P0` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | decode then encode returns identical bytes |
| `E07` | `P1 -> P6` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | codec only; P6 owns transforms |
| `E08` | `P1 -> P6` | `encodeCanonical(value: CanonicalValue) -> CanonicalBytes` | codec only; P6 owns transforms |
| `E09` | `P1 -> P3` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | candidate memo/product bytes only |
| `E10` | `P1 -> P4` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | candidate observed-event bytes only |
| `E11` | `P1 -> P5` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | owner fresh-control/pin bytes only |
| `E13` | `P1 -> P7` | `canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>` | exhaustive classes and byte-identity law |

No other edge or permissive/fallback codec exists. Codec implementation and
execution remain unauthorized.
