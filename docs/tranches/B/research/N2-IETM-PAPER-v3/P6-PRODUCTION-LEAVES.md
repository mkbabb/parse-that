# P6 — invariant-level canonical and raw codec hostiles

Status: `PAPER_V3 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 100 charged LOC`. Paper budget: `100 nonblank lines`.

P6 owns two disjoint stages. `VALUE` mutates a P1-decoded canonical value and
re-encodes through P1. `RAW` mutates authenticated bytes before P1 decode.
Production calls the named leaf directly; no message, substring, path, stack,
case ID, group token, or expected code selects ownership.

| Injector | Stage and exact mutation | Sole production leaf | Exact code |
|---|---|---|---|
| `IV_DECL_HASH` | VALUE: flip declaration hash nibble | `leafDeclarationHash` | `DECLARATION_HASH_MISMATCH` |
| `IV_LEDGER_ROOT` | VALUE: replace ledger root | `leafLedgerRoot` | `LEDGER_ROOT_MISMATCH` |
| `IV_VERSION_PARENT` | VALUE: replace child parent ordinal | `leafVersionParent` | `VERSION_PARENT_INVALID` |
| `IV_EDIT_START` | VALUE: shift edit start one UTF-16 unit | `leafEditReplay` | `EDIT_REPLAY_MISMATCH` |
| `IV_EFFECT_KEY` | VALUE: duplicate event identity key | `leafEffectKey` | `EFFECT_KEY_DUPLICATE` |
| `IV_EFFECT_CARDINALITY` | VALUE: replace cardinality | `leafEffectCardinality` | `EFFECT_CARDINALITY_MISMATCH` |
| `IV_DEPTH_DELTA` | VALUE: replace target depth delta | `leafTargetDepth` | `TARGET_DEPTH_MISMATCH` |
| `IV_PRODUCT_ROW` | VALUE: swap target product row | `leafTargetProduct` | `TARGET_PRODUCT_MISMATCH` |
| `IV_CONTROL_ROW` | VALUE: swap fresh-control row | `leafFreshControl` | `FRESH_CONTROL_ROW_MISMATCH` |
| `IR_DUP_KEY_TOP` | RAW: duplicate top-level key | `leafDuplicateKey` | `CANONICAL_DUPLICATE_KEY` |
| `IR_DUP_KEY_NESTED` | RAW: duplicate nested key | `leafNestedDuplicateKey` | `CANONICAL_NESTED_DUPLICATE_KEY` |
| `IR_ESCAPED_SLASH` | RAW: replace `/` with escaped slash | `leafEscapedSlash` | `CANONICAL_ESCAPED_SLASH` |
| `IR_UPPER_HEX` | RAW: uppercase one escape nibble | `leafLowerHex` | `CANONICAL_HEX_CASE` |
| `IR_LONG_CONTROL` | RAW: long-form one short control | `leafShortControl` | `CANONICAL_CONTROL_FORM` |
| `IR_KEY_ORDER` | RAW: swap adjacent object keys | `leafKeyOrder` | `CANONICAL_KEY_ORDER` |
| `IR_LEADING_ZERO` | RAW: add integer leading zero | `leafIntegerForm` | `CANONICAL_INTEGER_FORM` |
| `IR_INVALID_UTF8` | RAW: inject overlong UTF-8 | `leafUtf8Scalar` | `CANONICAL_UTF8_SCALAR` |
| `IR_WHITESPACE` | RAW: inject envelope whitespace | `leafEnvelopeWhitespace` | `CANONICAL_WHITESPACE` |
| `IR_UNKNOWN_TAG` | RAW: replace one declared tag | `leafTaggedConstructor` | `CANONICAL_UNKNOWN_TAG` |

The table is closed: exactly 19 injectors, 19 leaves, and 19 codes. Every row
requires baseline GREEN, production owner rejection, owner suppression, all 18
non-owner retentions, byte-identical unaffected records, erased mutation GREEN,
unknown ID rejection, duplicate/multi-use rejection, and production/audit
separation. The private audit wrapper counts inside P6; production exposes no
suppression token or count.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E07` | `P1 -> P6` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | canonical-value and raw-rejection hostiles only |
| `E08` | `P1 -> P6` | `encodeCanonical(value: CanonicalValue) -> CanonicalBytes` | canonical-value hostile reconstruction only |
| `E18` | `P6 -> P7` | `byteHostileClaim() -> InterfaceClaim<ByteHostileManifest>` | exact 19-row stage/injector/leaf/code/control table |

No other edge exists. Broad predicate groups, raw/value stage confusion,
hidden injector, false non-owner, or message routing is RED. No hostile
execution is authorized.
