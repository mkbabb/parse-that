# P6 — exact machine controls over production-owned leaves

Status: `PAPER_V5_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 70 charged LOC`.

P6 owns audit mutation chronology and receipt aggregation. It owns no P0–P5
predicate. Every row resolves one source-owned leaf identity:

```text
LeafFunctionIdentity = {ownerModule,moduleSourceHash,astNodePath,bodyHash,leafId}
ControlRow = {controlId,profile,target,before,after,injectorOperation,
 leafFunctionIdentity,uniqueCode,disabledLeaf,ownerBypassResult,
 nonownerRetention,controlOfControl}
```

The production entry has no suppression, case, code, or audit argument. A
separate audit-only link wrapper may omit exactly one private leaf while all
enabled leaves retain identical `LeafFunctionIdentity`; it cannot substitute a
shadow predicate. Mutants contain no expected code. E07/E08 authenticate actual
before/after bytes and derive collateral before the owner leaf runs.

The compact registry values below expand exactly as follows:

- `disabled=OWNER` means the exact row `leafId` is the only disabled identity;
- `bypass=EXPOSED` means owner suppression admits that precise defect and no
  non-owner claims it;
- `retain=OTHER28_IDENTICAL` means all other 28 leaf receipts and function
  identities are byte-identical to baseline;
- `coc=ERASE_BASELINE` means inverse operation reconstructs baseline bytes,
  values, descriptors, membership, roots, and receipt.

## Exact 29-row P6 registry

| ID/profile | Concrete target | Before → after | Operation | Owner leaf / unique code | disabled / bypass / retain / coc |
|---|---|---|---|---|---|
| `C01 VALUE` | `DeclarationBytes.sha256` | `AUTH(DeclarationBytes.sha256)` → `XOR_BIT(AUTH(DeclarationBytes.sha256),0)` | `FLIP_BIT_0` | P0 `validateDeclarationHash` / `DECLARATION_HASH_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C02 VALUE` | `LedgerRoot` | `AUTH(LedgerRoot)` → `XOR_BIT(AUTH(LedgerRoot),0)` | `FLIP_BIT_0` | P0 `validateLedgerRoot` / `LEDGER_ROOT_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C03 VALUE` | `VersionRecord[1].parentVersion` | `0` → `1` | `SET_U53` | P0 `validateVersionParent` / `VERSION_PARENT_INVALID` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C04 VALUE` | `EffectIdentity[0].ordinal` | `0` → `1` | `SET_U53` | P0 `validateEffectKey` / `EFFECT_KEY_INVALID` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C05 VALUE` | `ExperimentSelectionReceipt.rowOrdinal` | `0` → `1` | `SET_U53` | P0 `validateExperimentSelection` / `EXPERIMENT_SELECTION_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C06 VALUE` | `Edit[0].startUtf16` | `1` → `2` | `SET_U53` | P2 `validateEditReplay` / `EDIT_REPLAY_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C07 VALUE` | `CompleteProduct.maxDepth` | `4` → `5` | `SET_U53` | P3 `validateTargetDepth` / `TARGET_DEPTH_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C08 VALUE` | `CompleteProduct.offset` | `3` → `2` | `SET_U53` | P3 `validateTargetProduct` / `TARGET_PRODUCT_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C09 VALUE` | `ObservedEvent[0].occurrence` | `0` → `1` | `SET_U53` | P4 `validateEffectOccurrence` / `EFFECT_OCCURRENCE_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C10 PREPIN` | `CandidateObservationSeal.role` | `"candidate"` → `"control"` | `SET_STRING` | P5 `validateRunRole` / `RUN_ROLE_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C11 PREPIN` | `InputDescriptor[source].size` | `AUTH(InputDescriptor[source].size)` → `AUTH(InputDescriptor[source].size)+1` | `INCREMENT_U53` | P5 `validateInputAuthorityPin` / `INPUT_AUTHORITY_PIN_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C12 PREPIN` | `ExecutablePin.sha256` | `AUTH(ExecutablePin.sha256)` → `XOR_BIT(AUTH(ExecutablePin.sha256),0)` | `FLIP_BIT_0` | P5 `validateExecutorHarnessBinding` / `EXECUTOR_HARNESS_BINDING_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C13 OBSERVATION` | `CommandCapture.argv0` | `ExecutablePin.path` → `ExecutablePin.path+"-mutant"` | `APPEND_STRING` | P5 `validateCommandCapture` / `COMMAND_CAPTURE_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C14 OBSERVATION` | `candidate.chronologyOrdinal` | `1` → `3` | `SET_U53` | P5 `validateRunChronology` / `RUN_CHRONOLOGY_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C15 PREPIN` | `capabilitySurfaceIds` | `[]` → `["network:any"]` | `INSERT_ARRAY_END` | P5 `validateCapabilityIsolation` / `CAPABILITY_ISOLATION_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C16 OBSERVATION` | `InvocationAuthority.callbackClosureRoot` | `AUTH(InvocationAuthority.callbackClosureRoot)` → `XOR_BIT(AUTH(InvocationAuthority.callbackClosureRoot),0)` | `FLIP_BIT_0` | P5 `validateInvocationAuthority` / `INVOCATION_AUTHORITY_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C17 OBSERVATION` | `freshnessAfter.fileDescriptors` | `[0,1,2]` → `[0,1,2,99]` | `INSERT_ARRAY_END` | P5 `validateFreshnessIsolation` / `FRESHNESS_ISOLATION_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C18 OBSERVATION` | `ObservationDescriptor[5:product]` | `present` → `absent` | `DELETE_MEMBER` | P5 `validateObservationMembershipRoot` / `OBSERVATION_MEMBERSHIP_ROOT_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C19 OBSERVATION` | `ObservationSealRoot` | `AUTH(ObservationSealRoot)` → `XOR_BIT(AUTH(ObservationSealRoot),0)` | `FLIP_BIT_0` | P5 `validatePostRunSeal` / `POST_RUN_SEAL_MISMATCH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C20 RAW` | `product blob top object` | `{"a":1}` → `{"a":1,"a":2}` | `INSERT_BYTES_BEFORE_RBRACE` | P1 `leafDuplicateKey` / `CANONICAL_DUPLICATE_KEY` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C21 RAW` | `product blob nested object` | `{"x":{"a":1}}` → `{"x":{"a":1,"a":2}}` | `INSERT_BYTES_BEFORE_INNER_RBRACE` | P1 `leafNestedDuplicateKey` / `CANONICAL_NESTED_DUPLICATE_KEY` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C22 RAW` | `product blob slash string` | `"/"` → `"\\/"` | `INSERT_BACKSLASH` | P1 `leafEscapedSlash` / `CANONICAL_ESCAPED_SLASH` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C23 RAW` | `product blob escape` | `"\\u00ff"` → `"\\u00FF"` | `UPPERCASE_HEX` | P1 `leafLowerHex` / `CANONICAL_HEX_CASE` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C24 RAW` | `product blob control` | `"\\n"` → `"\\u000a"` | `EXPAND_ESCAPE` | P1 `leafShortControl` / `CANONICAL_CONTROL_FORM` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C25 RAW` | `product blob key order` | `{"a":1,"b":2}` → `{"b":2,"a":1}` | `SWAP_MEMBERS` | P1 `leafKeyOrder` / `CANONICAL_KEY_ORDER` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C26 RAW` | `product blob integer` | `0` → `00` | `INSERT_ZERO` | P1 `leafIntegerForm` / `CANONICAL_INTEGER_FORM` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C27 RAW` | `product blob UTF-8 scalar` | `EF BF BD` → `ED A0 80` | `REPLACE_HEX_BYTES` | P1 `leafUtf8Scalar` / `CANONICAL_UTF8_SCALAR` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C28 RAW` | `product blob envelope` | `{"a":1}` → `20 7B 22 61 22 3A 31 7D` | `PREFIX_SPACE_BYTE` | P1 `leafEnvelopeWhitespace` / `CANONICAL_WHITESPACE` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |
| `C29 RAW` | `product blob tag` | `{"$":"point","at":0}` → `{"$":"unknown","at":0}` | `REPLACE_TAG_BYTES` | P1 `leafTaggedConstructor` / `CANONICAL_UNKNOWN_TAG` | OWNER / EXPOSED / OTHER28_IDENTICAL / ERASE_BASELINE |

Every VALUE/PREPIN/OBSERVATION operation also carries the exact P1-derived
outer hash/root collateral and unchanged complement. Every RAW operation is
applied to a cloned actual sealed blob through E07.

## Receipt arithmetic and chronology

For `N=29`, exact future P6 receipts are:

```text
baseline N             = 29
owner rejection N      = 29
owner bypass N         = 29
nonowner N*(N-1)       = 812
erasure N              = 29
unknown                = 1
duplicate              = 1
total                  = 930
```

Order is baseline→owner rejection→owner bypass→nonowners C01..C29 excluding
owner→erasure for each control, then unknown→duplicate. No retry, omission,
reorder, message classification, count-only manifest, or aggregate substitute
is legal.

## Cross-interface edges

| Edge | Direction | Signature |
|---|---|---|
| `E07` | `P1 -> P6` | `rawCodecValidation(input: AuthenticatedRawMutation) -> OwnerValidationReceipt<P1Raw>` |
| `E08` | `P1 -> P6` | `canonicalValueValidation(before: AuthenticatedRawDomain, after: AuthenticatedRawDomain) -> OwnerValidationReceipt<P1Value>` |
| `E18` | `P6 -> P7` | `controlRegistryClaim() -> InterfaceClaim<MachineControlRegistry>` |
| `E19` | `P0 -> P6` | `declarationValidation(input: P0ValidationInput) -> OwnerValidationReceipt<P0>` |
| `E20` | `P2 -> P6` | `relocationValidation(input: P2ValidationInput) -> OwnerValidationReceipt<P2>` |
| `E21` | `P3 -> P6` | `productValidation(input: P3ValidationInput) -> OwnerValidationReceipt<P3>` |
| `E22` | `P4 -> P6` | `effectValidation(input: P4ValidationInput) -> OwnerValidationReceipt<P4>` |
| `E23` | `P5 -> P6` | `bundleRunValidation(input: P5ValidationInput) -> OwnerValidationReceipt<P5>` |

No other edge exists. Shadow predicates, synthetic detached RAW bytes,
caller collateral, suppression in production, fallback, CSS grammar, or
Fourier edge is RED.
