# P1 — canonical codec and production-consumed raw validation

Status: `PAPER_V4 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 155 charged LOC`. Paper ceiling: `120 nonblank lines`.

## Closed codec

P1 owns one strict UTF-8 JSON envelope: no BOM/whitespace; unique keys in
unsigned UTF-8 order; canonical safe integers; shortest scalar UTF-8; exact
short control escapes; literal slash/U+007F/U+0085; no duplicate key,
surrogate, overlong form, alternate escape, fraction/exponent, or trailing
byte. Decode followed by encode must reproduce every accepted byte exactly.

The only `$` tags remain `undefined`, special number, byte string, graph
reference, point, interval, EOF, line-column anchor, and depth delta. Each has
the v3 exact fields/payloads; unknown/missing/extra fields and tag aliases are
RED. P0/P3/P5 records use exact `kind` variants and cannot add tags.

## Production ownership of RAW and canonical reconstruction

P1—not P6—owns the ten RAW invariant leaves. P6 supplies a mutated raw byte
blob under a rebased audit bundle pin; production enters P1 once and the exact
owning leaf rejects before any generic decode result exists. That rejection is
the E07 receipt, not preemption.

| Leaf | Raw invariant/code |
|---|---|
| `leafDuplicateKey` | top duplicate / `CANONICAL_DUPLICATE_KEY` |
| `leafNestedDuplicateKey` | nested duplicate / `CANONICAL_NESTED_DUPLICATE_KEY` |
| `leafEscapedSlash` | escaped slash / `CANONICAL_ESCAPED_SLASH` |
| `leafLowerHex` | uppercase escape / `CANONICAL_HEX_CASE` |
| `leafShortControl` | long control spelling / `CANONICAL_CONTROL_FORM` |
| `leafKeyOrder` | unordered keys / `CANONICAL_KEY_ORDER` |
| `leafIntegerForm` | leading zero or noncanonical integer / `CANONICAL_INTEGER_FORM` |
| `leafUtf8Scalar` | invalid/overlong/non-scalar UTF-8 / `CANONICAL_UTF8_SCALAR` |
| `leafEnvelopeWhitespace` | BOM/whitespace/trailing byte / `CANONICAL_WHITESPACE` |
| `leafTaggedConstructor` | unknown/ill-typed tag / `CANONICAL_UNKNOWN_TAG` |

E08 validates VALUE reconstruction: the decoded primary mutation, exact
`CollateralManifest`, re-encoded canonical bytes, changed-field set, and
byte-identical complement. It owns only codec/collateral form; P0–P5 own the
semantic rejection. P1 exposes no audit token, evaluator, second decoder, or
fallback path.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E01` | `P1 -> P0` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | strict codec; P0 owns declaration/ledger schema |
| `E07` | `P1 -> P6` | `rawCodecValidation(raw: ByteString) -> OwnerValidationReceipt<P1Raw>` | P1 production leaf owns each RAW rejection |
| `E08` | `P1 -> P6` | `canonicalValueValidation(value: CanonicalValue, collateral: CollateralManifest) -> OwnerValidationReceipt<P1Value>` | exact induced collateral and unchanged complement |
| `E09` | `P1 -> P3` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | P5-authenticated candidate/control product bytes only |
| `E10` | `P1 -> P4` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | P5-authenticated candidate/control event bytes only |
| `E11` | `P1 -> P5` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | externally pinned bundle/pin/command schemas only |
| `E13` | `P1 -> P7` | `canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>` | codec, RAW leaves, VALUE collateral, and budgets |

No other edge exists. No scanner, token/index/tape, reparse, hidden evaluator,
CSS grammar, callback, or dual codec is permitted.
