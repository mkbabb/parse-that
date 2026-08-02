# P6 — typed owner-validation receipts and closed hostile chronology

Status: `PAPER_V4 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 70 charged LOC`. Paper ceiling: `120 nonblank lines`.

P6 owns mutation transactions, control chronology, and receipt aggregation;
it owns no P0–P5 production predicate. Every semantic or codec rejection
arrives through E07/E08/E19–E23 from the exact owner leaf.

Edge direction is provider→consumer authority. The validation input is the
typed argument already present in each edge signature; the owner returns the
receipt. Invocation with that argument creates no second reverse authority or
undeclared callback edge.

```text
OwnerValidationReceipt<M> = {sequence,module,leaf,code,outcome,inputRoot,
 mutatedRoot,collateralRoot,productionPathHash,immutable}
CollateralManifest = {profile,primaryPaths[1..*],derivedPaths[0..*],
 unchangedComplementHash,outerRebaseRoot}
AuditReceipt = {sequence,injector,stage,ownerModule,ownerLeaf,expectedCode,
 mode,inputRoot,mutatedRoot,collateralRoot,ownerReceiptHash,outcome,immutable}
```

Profiles are exact: `CRAW={blob.size,blob.sha256,MembershipBytes,
MembershipHash,BundleRoot,AuditExternalPin.bundleRoot}`;
`CDECL=CRAW+{DeclarationBytesHash,LedgerRoot}`;
`CLEDGER=CRAW+{LedgerBytesHash,LedgerRoot}`;
`CEFFECT=CDECL+{effectTableBytes,effectTableHash}`;
`CEVENT=CRAW+{eventsBlobHash,runReceiptHash}`;
`CPRODUCT=CRAW+{productBlobHash,resultBlobHash,runReceiptHash}`;
`CCONTROL=CRAW+{membershipHash,runReceiptHash}`. The primary path is excluded
from derived paths; every other byte is covered by `unchangedComplementHash`.

| Injector | Stage | Exact owner leaf/code | Collateral |
|---|---|---|---|
| `IV_DECL_HASH` | VALUE | P0 `validateDeclarationHash` / `DECLARATION_HASH_MISMATCH` | `CDECL` |
| `IV_LEDGER_ROOT` | VALUE | P0 `validateLedgerRoot` / `LEDGER_ROOT_MISMATCH` | `CLEDGER` |
| `IV_VERSION_PARENT` | VALUE | P0 `validateVersionParent` / `VERSION_PARENT_INVALID` | `CLEDGER` |
| `IV_EDIT_START` | VALUE | P2 `validateEditReplay` / `EDIT_REPLAY_MISMATCH` | `CLEDGER` |
| `IV_EFFECT_KEY` | VALUE | P0 `validateEffectKey` / `EFFECT_KEY_INVALID` | `CEFFECT` |
| `IV_EFFECT_OCCURRENCE` | VALUE | P4 `validateEffectOccurrence` / `EFFECT_OCCURRENCE_MISMATCH` | `CEVENT` |
| `IV_DEPTH_DELTA` | VALUE | P3 `validateTargetDepth` / `TARGET_DEPTH_MISMATCH` | `CPRODUCT` |
| `IV_PRODUCT_ROW` | VALUE | P3 `validateTargetProduct` / `TARGET_PRODUCT_MISMATCH` | `CPRODUCT` |
| `IV_CONTROL_ROW` | VALUE | P5 `validateFreshControlRow` / `FRESH_CONTROL_ROW_MISMATCH` | `CCONTROL` |
| `IR_DUP_KEY_TOP` | RAW | P1 `leafDuplicateKey` / `CANONICAL_DUPLICATE_KEY` | `CRAW` |
| `IR_DUP_KEY_NESTED` | RAW | P1 `leafNestedDuplicateKey` / `CANONICAL_NESTED_DUPLICATE_KEY` | `CRAW` |
| `IR_ESCAPED_SLASH` | RAW | P1 `leafEscapedSlash` / `CANONICAL_ESCAPED_SLASH` | `CRAW` |
| `IR_UPPER_HEX` | RAW | P1 `leafLowerHex` / `CANONICAL_HEX_CASE` | `CRAW` |
| `IR_LONG_CONTROL` | RAW | P1 `leafShortControl` / `CANONICAL_CONTROL_FORM` | `CRAW` |
| `IR_KEY_ORDER` | RAW | P1 `leafKeyOrder` / `CANONICAL_KEY_ORDER` | `CRAW` |
| `IR_LEADING_ZERO` | RAW | P1 `leafIntegerForm` / `CANONICAL_INTEGER_FORM` | `CRAW` |
| `IR_INVALID_UTF8` | RAW | P1 `leafUtf8Scalar` / `CANONICAL_UTF8_SCALAR` | `CRAW` |
| `IR_WHITESPACE` | RAW | P1 `leafEnvelopeWhitespace` / `CANONICAL_WHITESPACE` | `CRAW` |
| `IR_UNKNOWN_TAG` | RAW | P1 `leafTaggedConstructor` / `CANONICAL_UNKNOWN_TAG` | `CRAW` |

Exact future receipt denominator is `420`: baseline `19`, owner rejection
`19`, owner-bypass `19`, all non-owner retentions `19*18=342`, erasure `19`,
unknown `1`, duplicate `1`. Sequence is baseline→reject→bypass→nonowners in
owner-ID order→erasure for each injector, then unknown→duplicate. No retry,
omission, reorder, aggregate substitute, message classification, or hidden
evaluator is legal. The audit wrapper alone owns bypass; production signatures
carry no suppression token.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E07` | `P1 -> P6` | `rawCodecValidation(raw: ByteString) -> OwnerValidationReceipt<P1Raw>` | P1 production leaf owns each RAW rejection |
| `E08` | `P1 -> P6` | `canonicalValueValidation(value: CanonicalValue, collateral: CollateralManifest) -> OwnerValidationReceipt<P1Value>` | exact induced collateral and unchanged complement |
| `E18` | `P6 -> P7` | `byteHostileClaim() -> InterfaceClaim<ByteHostileManifest>` | 19 rows, typed owner edges, 420 receipts, chronology, and budget |
| `E19` | `P0 -> P6` | `declarationValidation(input: P0ValidationInput) -> OwnerValidationReceipt<P0>` | four reachable P0 leaves; typed outcome and collateral root |
| `E20` | `P2 -> P6` | `relocationValidation(input: P2ValidationInput) -> OwnerValidationReceipt<P2>` | reachable edit-replay leaf; typed outcome and collateral root |
| `E21` | `P3 -> P6` | `productValidation(input: P3ValidationInput) -> OwnerValidationReceipt<P3>` | reachable depth/product leaves; typed complete-product outcome |
| `E22` | `P4 -> P6` | `effectValidation(input: P4ValidationInput) -> OwnerValidationReceipt<P4>` | reachable occurrence/order leaf; typed event outcome |
| `E23` | `P5 -> P6` | `bundleRunValidation(input: P5ValidationInput) -> OwnerValidationReceipt<P5>` | reachable bundle/control leaf; typed raw-root outcome |

No other edge exists. Shadow leaves, leaf copies, broad groups, preemption,
unstated collateral, fallback, reparse, callback, CSS grammar, or Fourier edge
is RED.
