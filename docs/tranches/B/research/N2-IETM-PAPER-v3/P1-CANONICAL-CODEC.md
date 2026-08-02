# P1 — exhaustive canonical byte and tagged-value codec

Status: `PAPER_V3 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 170 charged LOC`. Paper budget: `100 nonblank lines`.

## Canonical JSON envelope

P1 owns one strict UTF-8 JSON subset. No BOM or whitespace. Object keys are
unique and strictly increasing by unsigned UTF-8 bytes. Integers are canonical
safe base 10: `0` or optional minus plus `[1-9][0-9]*`; reject `-0`, leading
zero, fraction, exponent, and overflow. Arrays preserve order and length.

| Scalar/byte class | Only accepted spelling |
|---|---|
| U+0000–0007, U+000B, U+000E–001F | lowercase `\u00xx` |
| U+0008/0009/000A/000C/000D | `\b`/`\t`/`\n`/`\f`/`\r` |
| quote/backslash | `\"` / `\\` |
| U+0020–0021, U+0023–005B, U+005D–007E | literal ASCII |
| slash U+002F | literal `/`; escaped slash rejected |
| U+007F | literal one-byte UTF-8 `7f` |
| U+0080–10FFFF, including U+0085 | literal shortest UTF-8 scalar |

Surrogates, overlong UTF-8, non-scalars, uppercase hex, printable escapes,
long-form short controls, duplicate/unordered keys, and trailing bytes are RED.

## Closed tagged encodings

The following are the only non-JSON semantic constructors; `$` is the first
key and remaining keys appear exactly in the shown unsigned-byte order:

| Constructor | Exact canonical object and payload law |
|---|---|
| Undefined | `{"$":"undefined"}` |
| NumberTag | `{"$":"number","value":"-0"|"NaN"|"+Infinity"|"-Infinity"}` |
| ByteString | `{"$":"bytes","hex":lower-even-hex}` |
| GraphRef | `{"$":"graphRef","id":safe-nonnegative-integer}` |
| Point | `{"$":"coordinate","bias":"before"|"after","kind":"point","offset":safe-nonnegative-integer}` |
| Interval | `{"$":"coordinate","end":integer,"endBias":bias,"kind":"interval","start":integer,"startBias":bias}` with `start<=end` |
| Eof | `{"$":"coordinate","kind":"eof"}` |
| LineColumnAnchor | `{"$":"coordinate","kind":"lineColumn","point":Point}` |
| DepthDelta | `{"$":"coordinate","kind":"depthDelta","value":safe-integer}` |

Unknown tags/fields, missing fields, extra fields, wrong payload types, alias
tags, noncanonical tag order, and JSON `null` substituted for a tag are RED.
`$` is reserved to this table. P0/P3/P5 records and algebraic variants are
ordinary canonical JSON objects whose consuming schema requires an exact
`kind` string, field set, payload domain, and cardinality; they cannot invent
another `$` tag. JSON null/boolean/string/safe-integer remain primitives.
For every accepted byte string `B`, `encodeCanonical(decodeCanonical(B)) ===
B` byte-for-byte. P1 returns deeply frozen values and performs no mutation,
injector selection, product traversal, hash ownership, policy, or suppression.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E01` | `P1 -> P0` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | declaration, ledger, table decode; byte identity required |
| `E07` | `P1 -> P6` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | canonical-value and raw-rejection hostiles only |
| `E08` | `P1 -> P6` | `encodeCanonical(value: CanonicalValue) -> CanonicalBytes` | canonical-value hostile reconstruction only |
| `E09` | `P1 -> P3` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | typed candidate memo/product bytes only |
| `E10` | `P1 -> P4` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | typed candidate observed-event bytes only |
| `E11` | `P1 -> P5` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | owner raw-control bundle and pin metadata only |
| `E13` | `P1 -> P7` | `canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>` | JSON classes, tag table, and byte-identity law |

No permissive codec or fallback exists. Codec execution remains unauthorized.
