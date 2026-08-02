# P1 — canonical codec and authenticated audit domains

Status: `PAPER_V6_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 155 charged LOC`.

P1 owns one strict UTF-8 canonical envelope: unique ordered keys, shortest
scalar encoding, canonical safe integers/escapes, exact tagged constructors,
and decode→encode byte identity. BOM, whitespace, duplicate key, surrogate,
overlong encoding, alternate escape, unknown/extra field, fraction/exponent,
and trailing byte are RED.

E07 accepts exactly:

```text
RawProductionInput = {role,rowId,planRoot,inputPinRoot,observationSealRoot,
 observationAdmissionReceipt,blobDescriptor,baselineOwnerPin,
 auditMutantEnvelope,auditAdmissionReceipt}
```

The descriptor resolves with cardinality one to a blob in an admitted actual
observation seal. The audit envelope clones those exact bytes and carries the
source-owned control row, fixture/domain, locator, operation, before/after,
changed mask, collateral profile, and audit-only admission. Detached or
synthetic bytes are RED.

E08 accepts authenticated baseline and mutated domains, not caller collateral:

```text
ValueDomain = {role,rowId,planRoot,inputPinRoot,observationSealRoot,
 membershipBytes,descriptors,blobs,ownerOrAuditAdmissionReceipt}
```

P1 derives the unique target, changed bytes/values, dependent descriptor and
root changes, allowed collateral, and byte-identical complement. Missing,
duplicate, or zero-cardinality locator and no-op mutation own exact machine
controls. The production entry has no suppression argument or expected code.

P1 leaves are the unique `C20–C29` identities derived from PAPER-READY. It
participates in `E01/E07/E08/E09/E10/E11/E13`; signatures live only in the
machine edge registry. No second codec, reparse, scanner/token plane, CSS
grammar, or fallback exists.
