# P1 — canonical codec over authenticated actual-byte domains

Status: `PAPER_V5_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 155 charged LOC`.

## Closed codec

P1 retains v4's strict UTF-8 canonical envelope and tagged constructors:
unique ordered keys; shortest scalar UTF-8; canonical safe integers and
escapes; no BOM, whitespace, duplicate key, surrogate, overlong form,
fraction/exponent, unknown field/tag, or trailing byte. Decode→encode is
byte-identical. There is one codec and no caller decoder.

P1 owns the ten RAW leaves and codes:

| Leaf | Code |
|---|---|
| `leafDuplicateKey` | `CANONICAL_DUPLICATE_KEY` |
| `leafNestedDuplicateKey` | `CANONICAL_NESTED_DUPLICATE_KEY` |
| `leafEscapedSlash` | `CANONICAL_ESCAPED_SLASH` |
| `leafLowerHex` | `CANONICAL_HEX_CASE` |
| `leafShortControl` | `CANONICAL_CONTROL_FORM` |
| `leafKeyOrder` | `CANONICAL_KEY_ORDER` |
| `leafIntegerForm` | `CANONICAL_INTEGER_FORM` |
| `leafUtf8Scalar` | `CANONICAL_UTF8_SCALAR` |
| `leafEnvelopeWhitespace` | `CANONICAL_WHITESPACE` |
| `leafTaggedConstructor` | `CANONICAL_UNKNOWN_TAG` |

## E07 — authenticated actual raw bytes

```text
AuthenticatedRawMutation = {
 role,rowId,selectionReceiptHash,inputPinRoot,observationSealRoot,
 blobDescriptor,externalSealPin,beforeBytes,beforeSize,beforeSha256,
 afterBytes,afterSize,afterSha256,injectorOperation,auditMutationPin
}
```

The before descriptor must be a unique member of an actual candidate/control
observation seal produced after execution. `beforeBytes` must match it. The
audit wrapper clones those bytes once, applies the registry operation, seals
the after descriptor and `auditMutationPin`, then calls the same P1 production
function. Detached synthetic bytes, summaries, unattached descriptors, caller
hashes, or a second codec are RED.

## E08 — production-derived collateral

```text
AuthenticatedRawDomain = {role,rowId,inputPinRoot,observationSealRoot,
 membershipBytes,membershipRoot,blobDescriptors,blobs,externalSealPin}
```

E08 receives authenticated baseline and mutated domains. P1 verifies roots,
decodes both, derives the concrete target path, exact changed byte/value set,
all induced descriptor/membership/outer-root fields, and byte-identical
unchanged complement. No caller supplies `CollateralManifest`, target path,
changed fields, or complement. P1 then returns the derived collateral with the
owning semantic leaf receipt; P6 only aggregates it.

## Cross-interface edges

| Edge | Direction | Signature |
|---|---|---|
| `E01` | `P1 -> P0` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` |
| `E07` | `P1 -> P6` | `rawCodecValidation(input: AuthenticatedRawMutation) -> OwnerValidationReceipt<P1Raw>` |
| `E08` | `P1 -> P6` | `canonicalValueValidation(before: AuthenticatedRawDomain, after: AuthenticatedRawDomain) -> OwnerValidationReceipt<P1Value>` |
| `E09` | `P1 -> P3` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` |
| `E10` | `P1 -> P4` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` |
| `E11` | `P1 -> P5` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` |
| `E13` | `P1 -> P7` | `canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>` |

No other edge exists. Production has no suppression argument, expected code,
hidden evaluator, scanner/token/index/tape, CSS grammar, or fallback.
