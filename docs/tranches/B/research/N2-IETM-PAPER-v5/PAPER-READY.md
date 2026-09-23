# N2 IETM paper packet v5 status and machine manifest

Status: `PAPER_V5_RED / P7_EXECUTABLE_AST_BUDGET_UNBOUND / TWO_FRESH_REVIEWS_REQUIRED / ZERO_CREDIT`.

## Frozen inputs and terminal review intakes

- v4 commit/tree: `483dcb1bbfb6f949459597b5105a95a62432edb1` /
  `fa240134177478e4636b018ae3b2c73329cdd21d`;
- v4 manifest: `fa804b2976f5d7fbf9911ee21450fc6ae3b6e05cf1cd8528d7ec8473848db53f`;
- Review A owner intake:
  `ad71f616653e05c875188d1428137246bd3cedab2d9f59cce91ad635b5e14173`;
- Review B owner intake:
  `5b81c4ca12399dd8120b69935c5175d71cab0b8533dab772f5bfc88d2f49d5b9`.

V4 remains immutable. Reviews A and B are terminal AMEND/RED with zero
retrospective credit. V5 is a fresh paper packet only.

## Closed machine manifest

This JSON block is the sole machine manifest. Prose interface rows, leaf IDs,
control rows, arithmetic, and boundaries must structurally equal it. Arrays
are ordered; object key order is irrelevant; duplicate/unknown keys, coercion,
summary substitution, and count-only validation are RED.

```json
{
  "schema": "parse-that/n2-ietm-paper-v5-manifest/v1",
  "status": "PAPER_V5_RED",
  "fatalReason": "P7_EXECUTABLE_AST_BUDGET_UNBOUND",
  "files": 10,
  "interfaces": ["P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7"],
  "budgets": {"P0": 120, "P1": 155, "P2": 90, "P3": 150, "P4": 70, "P5": 85, "P6": 70, "P7": 110, "total": 850},
  "p7ActualChargedLoc": null,
  "edgeCount": 26,
  "edges": [
    ["E01", "P1", "P0", "decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue"],
    ["E02", "P0", "P2", "openLedger(root: LedgerRoot) -> VersionLedgerView"],
    ["E03", "P2", "P3", "relocationMap(from: VersionOrdinal, to: VersionOrdinal) -> RelocationMapResult"],
    ["E04", "P0", "P4", "selectEffectTable(root: LedgerRoot, sourceVersion: U53, identityEpochId: Id) -> SelectedEffectTable"],
    ["E05", "P5", "P3", "freshControl(selection: ExperimentSelectionReceipt) -> ControlObservationSeal"],
    ["E06", "P5", "P4", "freshControl(selection: ExperimentSelectionReceipt) -> ControlObservationSeal"],
    ["E07", "P1", "P6", "rawCodecValidation(input: AuthenticatedRawMutation) -> OwnerValidationReceipt<P1Raw>"],
    ["E08", "P1", "P6", "canonicalValueValidation(before: AuthenticatedRawDomain, after: AuthenticatedRawDomain) -> OwnerValidationReceipt<P1Value>"],
    ["E09", "P1", "P3", "decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue"],
    ["E10", "P1", "P4", "decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue"],
    ["E11", "P1", "P5", "decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue"],
    ["E12", "P0", "P7", "declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>"],
    ["E13", "P1", "P7", "canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>"],
    ["E14", "P2", "P7", "relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>"],
    ["E15", "P3", "P7", "coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>"],
    ["E16", "P4", "P7", "effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>"],
    ["E17", "P5", "P7", "runAuthorityClaim() -> InterfaceClaim<PrePinAndPostRunSeal>"],
    ["E18", "P6", "P7", "controlRegistryClaim() -> InterfaceClaim<MachineControlRegistry>"],
    ["E19", "P0", "P6", "declarationValidation(input: P0ValidationInput) -> OwnerValidationReceipt<P0>"],
    ["E20", "P2", "P6", "relocationValidation(input: P2ValidationInput) -> OwnerValidationReceipt<P2>"],
    ["E21", "P3", "P6", "productValidation(input: P3ValidationInput) -> OwnerValidationReceipt<P3>"],
    ["E22", "P4", "P6", "effectValidation(input: P4ValidationInput) -> OwnerValidationReceipt<P4>"],
    ["E23", "P5", "P6", "bundleRunValidation(input: P5ValidationInput) -> OwnerValidationReceipt<P5>"],
    ["E24", "P5", "P3", "candidateRun(selection: ExperimentSelectionReceipt) -> CandidateObservationSeal"],
    ["E25", "P5", "P4", "candidateRun(selection: ExperimentSelectionReceipt) -> CandidateObservationSeal"],
    ["E26", "P0", "P5", "selectExperiment(root: LedgerRoot) -> ExperimentSelectionReceipt"]
  ],
  "productionLeaves": {
    "P0": ["validateDeclarationHash", "validateLedgerRoot", "validateVersionParent", "validateEffectKey", "validateExperimentSelection"],
    "P1": ["leafDuplicateKey", "leafNestedDuplicateKey", "leafEscapedSlash", "leafLowerHex", "leafShortControl", "leafKeyOrder", "leafIntegerForm", "leafUtf8Scalar", "leafEnvelopeWhitespace", "leafTaggedConstructor"],
    "P2": ["validateEditReplay"],
    "P3": ["validateTargetDepth", "validateTargetProduct"],
    "P4": ["validateEffectOccurrence"],
    "P5": ["validateRunRole", "validateInputAuthorityPin", "validateExecutorHarnessBinding", "validateCommandCapture", "validateRunChronology", "validateCapabilityIsolation", "validateInvocationAuthority", "validateFreshnessIsolation", "validateObservationMembershipRoot", "validatePostRunSeal"]
  },
  "p5": {
    "inputKinds": ["source", "fixture", "artifact", "executor", "harness", "runtime", "toolchain", "environmentDeclaration", "capabilityDeclaration"],
    "observationKinds": ["commandCapture", "rawSpawnReceipt", "stdout", "stderr", "result", "product", "effects", "provenance", "semanticEnvelope", "invocationAuthority", "freshnessBefore", "freshnessAfter"],
    "candidateRuns": 1,
    "controlRuns": 1,
    "candidateSealBeforeControlPin": true,
    "futureOutputsInPrePin": false,
    "n3CapabilityDependency": "PENDING_NOT_CONSUMED"
  },
  "controlColumns": ["controlId", "profile", "target", "before", "after", "injectorOperation", "leafId", "uniqueCode", "disabledLeaf", "ownerBypassResult", "nonownerRetention", "controlOfControl"],
  "controls": [
    ["C01", "VALUE", "DeclarationBytes.sha256", "AUTH(DeclarationBytes.sha256)", "XOR_BIT(AUTH(DeclarationBytes.sha256),0)", "FLIP_BIT_0", "P0.validateDeclarationHash", "DECLARATION_HASH_MISMATCH", "P0.validateDeclarationHash", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C02", "VALUE", "LedgerRoot", "AUTH(LedgerRoot)", "XOR_BIT(AUTH(LedgerRoot),0)", "FLIP_BIT_0", "P0.validateLedgerRoot", "LEDGER_ROOT_MISMATCH", "P0.validateLedgerRoot", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C03", "VALUE", "VersionRecord[1].parentVersion", "0", "1", "SET_U53", "P0.validateVersionParent", "VERSION_PARENT_INVALID", "P0.validateVersionParent", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C04", "VALUE", "EffectIdentity[0].ordinal", "0", "1", "SET_U53", "P0.validateEffectKey", "EFFECT_KEY_INVALID", "P0.validateEffectKey", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C05", "VALUE", "ExperimentSelectionReceipt.rowOrdinal", "0", "1", "SET_U53", "P0.validateExperimentSelection", "EXPERIMENT_SELECTION_MISMATCH", "P0.validateExperimentSelection", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C06", "VALUE", "Edit[0].startUtf16", "1", "2", "SET_U53", "P2.validateEditReplay", "EDIT_REPLAY_MISMATCH", "P2.validateEditReplay", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C07", "VALUE", "CompleteProduct.maxDepth", "4", "5", "SET_U53", "P3.validateTargetDepth", "TARGET_DEPTH_MISMATCH", "P3.validateTargetDepth", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C08", "VALUE", "CompleteProduct.offset", "3", "2", "SET_U53", "P3.validateTargetProduct", "TARGET_PRODUCT_MISMATCH", "P3.validateTargetProduct", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C09", "VALUE", "ObservedEvent[0].occurrence", "0", "1", "SET_U53", "P4.validateEffectOccurrence", "EFFECT_OCCURRENCE_MISMATCH", "P4.validateEffectOccurrence", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C10", "PREPIN", "CandidateObservationSeal.role", "candidate", "control", "SET_STRING", "P5.validateRunRole", "RUN_ROLE_MISMATCH", "P5.validateRunRole", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C11", "PREPIN", "InputDescriptor[source].size", "AUTH(InputDescriptor[source].size)", "AUTH(InputDescriptor[source].size)+1", "INCREMENT_U53", "P5.validateInputAuthorityPin", "INPUT_AUTHORITY_PIN_MISMATCH", "P5.validateInputAuthorityPin", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C12", "PREPIN", "ExecutablePin.sha256", "AUTH(ExecutablePin.sha256)", "XOR_BIT(AUTH(ExecutablePin.sha256),0)", "FLIP_BIT_0", "P5.validateExecutorHarnessBinding", "EXECUTOR_HARNESS_BINDING_MISMATCH", "P5.validateExecutorHarnessBinding", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C13", "OBSERVATION", "CommandCapture.argv0", "ExecutablePin.path", "ExecutablePin.path+-mutant", "APPEND_STRING", "P5.validateCommandCapture", "COMMAND_CAPTURE_MISMATCH", "P5.validateCommandCapture", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C14", "OBSERVATION", "candidate.chronologyOrdinal", "1", "3", "SET_U53", "P5.validateRunChronology", "RUN_CHRONOLOGY_MISMATCH", "P5.validateRunChronology", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C15", "PREPIN", "capabilitySurfaceIds", "[]", "[network:any]", "INSERT_ARRAY_END", "P5.validateCapabilityIsolation", "CAPABILITY_ISOLATION_MISMATCH", "P5.validateCapabilityIsolation", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C16", "OBSERVATION", "InvocationAuthority.callbackClosureRoot", "AUTH(InvocationAuthority.callbackClosureRoot)", "XOR_BIT(AUTH(InvocationAuthority.callbackClosureRoot),0)", "FLIP_BIT_0", "P5.validateInvocationAuthority", "INVOCATION_AUTHORITY_MISMATCH", "P5.validateInvocationAuthority", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C17", "OBSERVATION", "freshnessAfter.fileDescriptors", "[0,1,2]", "[0,1,2,99]", "INSERT_ARRAY_END", "P5.validateFreshnessIsolation", "FRESHNESS_ISOLATION_MISMATCH", "P5.validateFreshnessIsolation", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C18", "OBSERVATION", "ObservationDescriptor[5:product]", "present", "absent", "DELETE_MEMBER", "P5.validateObservationMembershipRoot", "OBSERVATION_MEMBERSHIP_ROOT_MISMATCH", "P5.validateObservationMembershipRoot", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C19", "OBSERVATION", "ObservationSealRoot", "AUTH(ObservationSealRoot)", "XOR_BIT(AUTH(ObservationSealRoot),0)", "FLIP_BIT_0", "P5.validatePostRunSeal", "POST_RUN_SEAL_MISMATCH", "P5.validatePostRunSeal", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C20", "RAW", "product blob top object", "{a:1}", "{a:1,a:2}", "INSERT_BYTES_BEFORE_RBRACE", "P1.leafDuplicateKey", "CANONICAL_DUPLICATE_KEY", "P1.leafDuplicateKey", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C21", "RAW", "product blob nested object", "{x:{a:1}}", "{x:{a:1,a:2}}", "INSERT_BYTES_BEFORE_INNER_RBRACE", "P1.leafNestedDuplicateKey", "CANONICAL_NESTED_DUPLICATE_KEY", "P1.leafNestedDuplicateKey", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C22", "RAW", "product blob slash string", "slash literal", "escaped slash", "INSERT_BACKSLASH", "P1.leafEscapedSlash", "CANONICAL_ESCAPED_SLASH", "P1.leafEscapedSlash", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C23", "RAW", "product blob escape", "u00ff", "u00FF", "UPPERCASE_HEX", "P1.leafLowerHex", "CANONICAL_HEX_CASE", "P1.leafLowerHex", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C24", "RAW", "product blob control", "short newline escape", "u000a", "EXPAND_ESCAPE", "P1.leafShortControl", "CANONICAL_CONTROL_FORM", "P1.leafShortControl", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C25", "RAW", "product blob key order", "{a:1,b:2}", "{b:2,a:1}", "SWAP_MEMBERS", "P1.leafKeyOrder", "CANONICAL_KEY_ORDER", "P1.leafKeyOrder", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C26", "RAW", "product blob integer", "0", "00", "INSERT_ZERO", "P1.leafIntegerForm", "CANONICAL_INTEGER_FORM", "P1.leafIntegerForm", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C27", "RAW", "product blob UTF-8 scalar", "EF BF BD", "ED A0 80", "REPLACE_HEX_BYTES", "P1.leafUtf8Scalar", "CANONICAL_UTF8_SCALAR", "P1.leafUtf8Scalar", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C28", "RAW", "product blob envelope", "7B 22 61 22 3A 31 7D", "20 7B 22 61 22 3A 31 7D", "PREFIX_SPACE_BYTE", "P1.leafEnvelopeWhitespace", "CANONICAL_WHITESPACE", "P1.leafEnvelopeWhitespace", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C29", "RAW", "product blob tag", "point tag", "unknown tag", "REPLACE_TAG_BYTES", "P1.leafTaggedConstructor", "CANONICAL_UNKNOWN_TAG", "P1.leafTaggedConstructor", "EXPOSED", "OTHER28_IDENTICAL", "ERASE_BASELINE"],
    ["C30", "SOURCE", "moduleSet", "[P0..P7]", "[P0..P7,P8]", "INSERT_MODULE", "P7.leafModuleSet", "SOURCE_MODULE_SET", "P7.leafModuleSet", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C31", "SOURCE", "authorizedSourceBytes[0]", "AUTH(authorizedSourceBytes[0])", "XOR_BIT(AUTH(authorizedSourceBytes[0]),0)", "FLIP_BIT_0", "P7.leafSourceHash", "SOURCE_HASH_MISMATCH", "P7.leafSourceHash", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C32", "SOURCE", "PAPER-READY prose byte[0]", "AUTH(PAPER-READY prose byte[0])", "XOR_BIT(AUTH(PAPER-READY prose byte[0]),0)", "FLIP_BIT_0", "P7.leafProseHash", "PROSE_HASH_MISMATCH", "P7.leafProseHash", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C33", "SOURCE", "edge E26", "present", "absent", "DELETE_EDGE", "P7.leafEdgeGraph", "EDGE_MISSING", "P7.leafEdgeGraph", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C34", "SOURCE", "edge E26 direction", "P0->P5", "P5->P0", "REVERSE_EDGE", "P7.leafReverseEdge", "EDGE_REVERSE", "P7.leafReverseEdge", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C35", "SOURCE", "import kind", "static", "dynamic", "REPLACE_IMPORT_KIND", "P7.leafDynamicImport", "DYNAMIC_IMPORT", "P7.leafDynamicImport", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C36", "SOURCE", "direct call", "f()", "eval(f())", "WRAP_EVAL", "P7.leafDynamicCode", "DYNAMIC_CODE", "P7.leafDynamicCode", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C37", "SOURCE", "owned access", "o.x", "Reflect.get(o,x)", "REPLACE_EXPRESSION", "P7.leafReflection", "REFLECTION_EDGE", "P7.leafReflection", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C38", "SOURCE", "dependency graph edge", "declared", "omitted", "DELETE_DEPENDENCY", "P7.leafDependencyGraph", "DEPENDENCY_HIDDEN", "P7.leafDependencyGraph", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C39", "SOURCE", "scalar state", "direct", "eventTape+projection", "REPLACE_SUBSTRATE", "P7.leafForbiddenSubstrate", "FORBIDDEN_SUBSTRATE", "P7.leafForbiddenSubstrate", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C40", "SOURCE", "P5 charged LOC", "85", "86", "INSERT_LOGIC_LINE", "P7.leafModuleBudget", "MODULE_LOC_EXCEEDED", "P7.leafModuleBudget", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C41", "SOURCE", "total charged LOC", "850", "851", "INSERT_LOGIC_LINE", "P7.leafTotalBudget", "TOTAL_LOC_EXCEEDED", "P7.leafTotalBudget", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C42", "SOURCE", "astTool.sha256", "AUTH(astTool.sha256)", "XOR_BIT(AUTH(astTool.sha256),0)", "FLIP_BIT_0", "P7.leafAstToolPin", "AST_TOOL_PIN_MISMATCH", "P7.leafAstToolPin", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"],
    ["C43", "SOURCE", "claim.sourceJoin", "AUTH(claim.sourceJoin)", "XOR_BIT(AUTH(claim.sourceJoin),0)", "FLIP_BIT_0", "P7.leafClaimSourceJoin", "CLAIM_SOURCE_DRIFT", "P7.leafClaimSourceJoin", "EXPOSED", "OTHER13_IDENTICAL", "ERASE_BASELINE"]
  ],
  "controlArithmetic": {
    "P6": {"rows": 29, "baseline": 29, "ownerReject": 29, "ownerBypass": 29, "nonownerRetention": 812, "erasure": 29, "unknown": 1, "duplicate": 1, "total": 930},
    "P7": {"rows": 14, "baseline": 14, "ownerReject": 14, "ownerBypass": 14, "nonownerRetention": 182, "erasure": 14, "unknown": 1, "duplicate": 1, "total": 240},
    "totalRows": 43,
    "totalReceipts": 1170
  },
  "ownership": {"selection": "P0", "candidateExecutor": "P5", "controlExecutor": "P5", "productComparator": "P3", "effectComparator": "P4", "auditChronology": "P6", "sourceAstVerifier": "P7"},
  "pendingDependencies": [{"provider": "N3", "receipt": "CapabilityCapsuleReceipt", "status": "PENDING_NOT_CONSUMED"}],
  "forbidden": ["future-output-prepin", "caller-output", "hidden-prior-run", "hidden-evaluator", "reparse", "callback-outside-P5", "fallback", "dual-path", "scanner-token-index-tape", "css-grammar-in-parse-that", "parse-that-to-fourier"],
  "credit": {"authority": 0, "scientific": 0, "equivalence": 0, "performance": 0, "novelty": 0, "css": 0, "product": 0, "law": 0, "release": 0},
  "authorized": {"paperV5": true, "reviewA5": false, "reviewB5": false, "n2e": false, "source": false, "execution": false, "prototype": false, "benchmark": false}
}
```

## Exact boundary

- packet topology: `P0–P7 + PAPER-READY + PAPER-MANIFEST`;
- active edges: `26`, each duplicated exactly at its two prose endpoints;
- production control rows: `29 P6 + 14 P7 = 43`;
- future receipt denominator: `930 + 240 = 1,170`;
- candidate/control executions performed: `0 / 0`;
- P7 actual charged LOC: `UNBOUND / null`;
- fresh v5 reviews: `0/2`, not dispatched;
- N3 dependency: `PENDING_NOT_CONSUMED`;
- N2e/source/Node/AST/parser/prototype/benchmark/product/CSS/Fourier work:
  `WITHHELD`;
- all credit: `0`.

`PAPER-MANIFEST.sha256` covers the nine non-manifest packet files. V5 cannot
self-author a review, source release, budget exception, correction packet, or
implementation.
