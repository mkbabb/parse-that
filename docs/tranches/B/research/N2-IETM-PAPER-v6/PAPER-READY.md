# N2 IETM paper packet v6 status and machine authority

Status: `PAPER_V6_RED / P7_EXECUTABLE_AST_BUDGET_UNBOUND / TWO_FRESH_REVIEWS_REQUIRED / ZERO_CREDIT`.

## Frozen v5 and terminal review boundary

- v5 commit/tree: `787d2b93ca6f0da376fa8e09188ce01d9e20c951` /
  `696b8c749cc0f6ccc87b11b47ee323f304f63a74`;
- v5 manifest: `f1b84e452ead7b5b7b6032f2b0258185832243217264230175c46ef5c201f3be`;
- Review A terminal first reason: `P5_INPUT_AUTHORITY_PIN_ROOT_UNDEFINED`;
- Review B terminal first reason: `P5_MACHINE_PROSE_CONTROL_AUTHORITY_DRIFT`.

V5 remains immutable negative evidence. Review A also binds environment and
capability inputs outside membership, pre-spawn topology prophecy, adaptive
control selection, an absent trusted command envelope, absent audit rebase,
and a detachable post-run pin. Review B also binds invalid pseudo-JSON,
partial leaf identity, omitted P7 leaves, unauthenticated sealed mutants, and
fixtures/locators/baselines without cardinality-one authority. Both reviews
grant zero A4/B4/source/execution credit.

V6 keeps only the reviewed structure: 26 typed edges, 43 ordered controls,
1,170 derived future receipts, typed ledger selection, an unconsumed N3
dependency, and the honest P7 executable-budget RED. It replaces every
reviewed authority defect atomically in paper form.

## Sole machine authority

The JSON block below is the only machine authority for interfaces, typed
edges, production leaves, fixture domains, controls, audit rebases,
arithmetic, and boundaries. P0–P7 reference IDs only. Arrays are ordered;
objects have closed keys; strings are strings, never prose-shaped objects.
Future source must strict-parse and structurally exact-match this block.

```json
{
  "schema": "parse-that/n2-ietm-paper-v6-authority/v1",
  "status": "PAPER_V6_RED",
  "fatalReason": "P7_EXECUTABLE_AST_BUDGET_UNBOUND",
  "files": 10,
  "interfaces": ["P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7"],
  "budgets": {"P0": 120, "P1": 155, "P2": 90, "P3": 150, "P4": 70, "P5": 85, "P6": 70, "P7": 110, "total": 850},
  "p7ActualChargedLoc": null,
  "edgeCount": 26,
  "edges": [
    ["E01", "P1", "P0", "decodeCanonical(bytes:CanonicalBytes)->CanonicalValue"],
    ["E02", "P0", "P2", "openLedger(root:LedgerRoot)->VersionLedgerView"],
    ["E03", "P2", "P3", "relocationMap(from:VersionOrdinal,to:VersionOrdinal)->RelocationMapResult"],
    ["E04", "P0", "P4", "selectEffectTable(root:LedgerRoot,sourceVersion:U53,identityEpochId:Id)->SelectedEffectTable"],
    ["E05", "P5", "P3", "freshControl(receipt:ObservationAdmissionReceipt)->AdmittedObservation"],
    ["E06", "P5", "P4", "freshControl(receipt:ObservationAdmissionReceipt)->AdmittedObservation"],
    ["E07", "P1", "P6", "rawCodecValidation(input:RawProductionInput)->OwnerValidationReceipt<P1Raw>"],
    ["E08", "P1", "P6", "canonicalValueValidation(before:ValueDomain,after:ValueDomain)->OwnerValidationReceipt<P1Value>"],
    ["E09", "P1", "P3", "decodeCanonical(bytes:CanonicalBytes)->CanonicalValue"],
    ["E10", "P1", "P4", "decodeCanonical(bytes:CanonicalBytes)->CanonicalValue"],
    ["E11", "P1", "P5", "decodeCanonical(bytes:CanonicalBytes)->CanonicalValue"],
    ["E12", "P0", "P7", "declarationLedgerClaim()->InterfaceClaim<DeclarationLedger>"],
    ["E13", "P1", "P7", "canonicalCodecClaim()->InterfaceClaim<CanonicalCodec>"],
    ["E14", "P2", "P7", "relocationAlgebraClaim()->InterfaceClaim<RelocationAlgebra>"],
    ["E15", "P3", "P7", "coordinateProductClaim()->InterfaceClaim<CoordinateProductSchema>"],
    ["E16", "P4", "P7", "effectProvenanceClaim()->InterfaceClaim<EffectProvenance>"],
    ["E17", "P5", "P7", "runAuthorityClaim()->InterfaceClaim<ExperimentPlanAndObservationSeal>"],
    ["E18", "P6", "P7", "controlRegistryClaim()->InterfaceClaim<MachineControlRegistry>"],
    ["E19", "P0", "P6", "declarationValidation(input:P0ValidationInput)->OwnerValidationReceipt<P0>"],
    ["E20", "P2", "P6", "relocationValidation(input:P2ValidationInput)->OwnerValidationReceipt<P2>"],
    ["E21", "P3", "P6", "productValidation(input:P3ValidationInput)->OwnerValidationReceipt<P3>"],
    ["E22", "P4", "P6", "effectValidation(input:P4ValidationInput)->OwnerValidationReceipt<P4>"],
    ["E23", "P5", "P6", "bundleRunValidation(input:P5ValidationInput)->OwnerValidationReceipt<P5>"],
    ["E24", "P5", "P3", "candidateRun(receipt:ObservationAdmissionReceipt)->AdmittedObservation"],
    ["E25", "P5", "P4", "candidateRun(receipt:ObservationAdmissionReceipt)->AdmittedObservation"],
    ["E26", "P0", "P5", "selectExperiment(root:LedgerRoot)->ExperimentSelectionReceipt"]
  ],
  "fixtureLaw": {
    "authority": "PACKET_MANIFEST_AUTHENTICATES_MACHINE_ROW_BYTES",
    "materialization": "OWNER_ADMISSION_MUST_BIND_BYTE_IDENTICAL_FIXTURE_AND_DOMAIN",
    "locatorCardinality": 1,
    "baselineSource": "AUTHENTICATED_FIXTURE_ONLY",
    "hardcodedRuntimeFragments": false
  },
  "leafFunctionIdentityFields": ["ownerModule", "moduleSourceHashFormula", "astNodePath", "bodyHashFormula", "leafId"],
  "controlIds": ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09", "C10", "C11", "C12", "C13", "C14", "C15", "C16", "C17", "C18", "C19", "C20", "C21", "C22", "C23", "C24", "C25", "C26", "C27", "C28", "C29", "C30", "C31", "C32", "C33", "C34", "C35", "C36", "C37", "C38", "C39", "C40", "C41", "C42", "C43"],
  "productionLeaves": {
    "P0": ["validateDeclarationHash", "validateLedgerRoot", "validateVersionParent", "validateEffectKey", "validateExperimentSelection"],
    "P1": ["leafDuplicateKey", "leafNestedDuplicateKey", "leafEscapedSlash", "leafLowerHex", "leafShortControl", "leafKeyOrder", "leafIntegerForm", "leafUtf8Scalar", "leafEnvelopeWhitespace", "leafTaggedConstructor"],
    "P2": ["validateEditReplay"],
    "P3": ["validateTargetDepth", "validateTargetProduct"],
    "P4": ["validateEffectOccurrence"],
    "P5": ["validatePlanRole", "validateInputAuthorityPin", "validateCommandEnvelopeCapture", "validateRunChronology", "validateCapabilityIsolation", "validateInvocationAuthority", "validateFreshnessIsolation", "validateObservationMembershipRoot", "validateObservationSeal", "validateObservationAdmission"],
    "P6": [],
    "P7": ["leafModuleSet", "leafSourceHash", "leafProseHash", "leafEdgeGraph", "leafReverseEdge", "leafDynamicImport", "leafDynamicCode", "leafReflection", "leafDependencyGraph", "leafForbiddenSubstrate", "leafModuleBudget", "leafTotalBudget", "leafAstToolPin", "leafClaimSourceJoin"]
  },
  "auditProfiles": {
    "VALUE_REBASE": "derive target and collateral from authenticated before/after ValueDomain; rederive only audit descriptors, membership, plan, seal, and audit admission",
    "RAW_REBASE": "clone the admitted actual blob bytes; mutate the unique locator; rederive only audit descriptor, membership, seal, and audit admission",
    "PREPIN_REBASE": "mutate the admitted immutable input fixture; rederive audit input pin and immutable two-role audit plan without issuing a production owner receipt",
    "OBSERVATION_REBASE": "mutate admitted actual observation bytes; rederive audit descriptor, membership, seal, and audit admission without changing production bytes",
    "SOURCE_REBASE": "rebase the authorized source fixture and its audit pin so the owning structural leaf receives the mutant"
  },
  "subcontrols": {
    "MISSING_LOCATOR": {"operation": "DELETE_UNIQUE_LOCATOR", "expectedCode": "AUDIT_LOCATOR_MISSING", "cardinalityAfter": 0},
    "DUPLICATE_LOCATOR": {"operation": "DUPLICATE_UNIQUE_LOCATOR", "expectedCode": "AUDIT_LOCATOR_DUPLICATE", "cardinalityAfter": 2},
    "EXACT_NO_OP": {"operation": "REPLACE_AFTER_WITH_BEFORE_BYTES", "expected": "GREEN_BYTE_IDENTICAL", "cardinalityAfter": 1}
  },
  "controlColumns": ["controlId", "profile", "fixtureId", "domainId", "locatorType", "locator", "locatorCardinality", "beforeEncoding", "beforeHex", "afterEncoding", "afterHex", "injectorOperation", "changedMask", "collateralProfile", "injectorId", "leafFunctionIdentity", "uniqueCode", "disabledLeaf", "ownerBypassResult", "nonownerRetentionSelector", "controlOfControl"],
  "controls": [
    {
      "controlId": "C01", "profile": "VALUE_REBASE", "fixtureId": "FX-P0-DECLARATION", "domainId": "DM-P0-DECLARATION", "locatorType": "JSON_POINTER", "locator": "/declarationSha256", "locatorCardinality": 1, "beforeEncoding": "HEX32", "beforeHex": "0000000000000000000000000000000000000000000000000000000000000000", "afterEncoding": "HEX32", "afterHex": "0100000000000000000000000000000000000000000000000000000000000000", "injectorOperation": "FLIP_BIT_0", "changedMask": ["/declarationSha256"], "collateralProfile": "REHASH_DECLARATION_AUDIT_ONLY", "injectorId": "INJ-C01", "leafFunctionIdentity": {"ownerModule": "P0", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)", "astNodePath": "/validateDeclarationHash", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateDeclarationHash)", "leafId": "validateDeclarationHash"}, "uniqueCode": "DECLARATION_HASH_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C01", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C02", "profile": "VALUE_REBASE", "fixtureId": "FX-P0-LEDGER", "domainId": "DM-P0-LEDGER", "locatorType": "JSON_POINTER", "locator": "/ledgerRoot", "locatorCardinality": 1, "beforeEncoding": "HEX32", "beforeHex": "0000000000000000000000000000000000000000000000000000000000000000", "afterEncoding": "HEX32", "afterHex": "0100000000000000000000000000000000000000000000000000000000000000", "injectorOperation": "FLIP_BIT_0", "changedMask": ["/ledgerRoot"], "collateralProfile": "REHASH_LEDGER_AUDIT_ONLY", "injectorId": "INJ-C02", "leafFunctionIdentity": {"ownerModule": "P0", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)", "astNodePath": "/validateLedgerRoot", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateLedgerRoot)", "leafId": "validateLedgerRoot"}, "uniqueCode": "LEDGER_ROOT_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C02", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C03", "profile": "VALUE_REBASE", "fixtureId": "FX-P0-VERSION", "domainId": "DM-P0-VERSION", "locatorType": "JSON_POINTER", "locator": "/versions/1/parentVersion", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "30", "afterEncoding": "CANONICAL_U53", "afterHex": "31", "injectorOperation": "SET_CANONICAL_U53", "changedMask": ["/versions/1/parentVersion"], "collateralProfile": "REHASH_VERSION_LEDGER_AUDIT_ONLY", "injectorId": "INJ-C03", "leafFunctionIdentity": {"ownerModule": "P0", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)", "astNodePath": "/validateVersionParent", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateVersionParent)", "leafId": "validateVersionParent"}, "uniqueCode": "VERSION_PARENT_INVALID", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C03", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C04", "profile": "VALUE_REBASE", "fixtureId": "FX-P0-EFFECT", "domainId": "DM-P0-EFFECT", "locatorType": "JSON_POINTER", "locator": "/effectIdentities/0/ordinal", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "30", "afterEncoding": "CANONICAL_U53", "afterHex": "31", "injectorOperation": "SET_CANONICAL_U53", "changedMask": ["/effectIdentities/0/ordinal"], "collateralProfile": "REHASH_EFFECT_TABLE_AUDIT_ONLY", "injectorId": "INJ-C04", "leafFunctionIdentity": {"ownerModule": "P0", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)", "astNodePath": "/validateEffectKey", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateEffectKey)", "leafId": "validateEffectKey"}, "uniqueCode": "EFFECT_KEY_INVALID", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C04", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C05", "profile": "VALUE_REBASE", "fixtureId": "FX-P0-SELECTION", "domainId": "DM-P0-SELECTION", "locatorType": "JSON_POINTER", "locator": "/rowOrdinal", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "30", "afterEncoding": "CANONICAL_U53", "afterHex": "31", "injectorOperation": "SET_CANONICAL_U53", "changedMask": ["/rowOrdinal"], "collateralProfile": "REHASH_SELECTION_AUDIT_ONLY", "injectorId": "INJ-C05", "leafFunctionIdentity": {"ownerModule": "P0", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)", "astNodePath": "/validateExperimentSelection", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateExperimentSelection)", "leafId": "validateExperimentSelection"}, "uniqueCode": "EXPERIMENT_SELECTION_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C05", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C06", "profile": "VALUE_REBASE", "fixtureId": "FX-P2-EDIT", "domainId": "DM-P2-EDIT", "locatorType": "JSON_POINTER", "locator": "/edits/0/startUtf16", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "31", "afterEncoding": "CANONICAL_U53", "afterHex": "32", "injectorOperation": "SET_CANONICAL_U53", "changedMask": ["/edits/0/startUtf16"], "collateralProfile": "REHASH_EDIT_LEDGER_AUDIT_ONLY", "injectorId": "INJ-C06", "leafFunctionIdentity": {"ownerModule": "P2", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P2)", "astNodePath": "/validateEditReplay", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P2:/validateEditReplay)", "leafId": "validateEditReplay"}, "uniqueCode": "EDIT_REPLAY_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C06", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C07", "profile": "VALUE_REBASE", "fixtureId": "FX-P3-PRODUCT", "domainId": "DM-P3-PRODUCT", "locatorType": "JSON_POINTER", "locator": "/maxDepth", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "34", "afterEncoding": "CANONICAL_U53", "afterHex": "35", "injectorOperation": "SET_CANONICAL_U53", "changedMask": ["/maxDepth"], "collateralProfile": "REHASH_PRODUCT_AUDIT_ONLY", "injectorId": "INJ-C07", "leafFunctionIdentity": {"ownerModule": "P3", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P3)", "astNodePath": "/validateTargetDepth", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P3:/validateTargetDepth)", "leafId": "validateTargetDepth"}, "uniqueCode": "TARGET_DEPTH_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C07", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C08", "profile": "VALUE_REBASE", "fixtureId": "FX-P3-PRODUCT", "domainId": "DM-P3-PRODUCT", "locatorType": "JSON_POINTER", "locator": "/offset", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "33", "afterEncoding": "CANONICAL_U53", "afterHex": "32", "injectorOperation": "SET_CANONICAL_U53", "changedMask": ["/offset"], "collateralProfile": "REHASH_PRODUCT_AUDIT_ONLY", "injectorId": "INJ-C08", "leafFunctionIdentity": {"ownerModule": "P3", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P3)", "astNodePath": "/validateTargetProduct", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P3:/validateTargetProduct)", "leafId": "validateTargetProduct"}, "uniqueCode": "TARGET_PRODUCT_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C08", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C09", "profile": "VALUE_REBASE", "fixtureId": "FX-P4-EVENT", "domainId": "DM-P4-EVENT", "locatorType": "JSON_POINTER", "locator": "/events/0/occurrence", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "30", "afterEncoding": "CANONICAL_U53", "afterHex": "31", "injectorOperation": "SET_CANONICAL_U53", "changedMask": ["/events/0/occurrence"], "collateralProfile": "REHASH_EFFECT_OBSERVATION_AUDIT_ONLY", "injectorId": "INJ-C09", "leafFunctionIdentity": {"ownerModule": "P4", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P4)", "astNodePath": "/validateEffectOccurrence", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P4:/validateEffectOccurrence)", "leafId": "validateEffectOccurrence"}, "uniqueCode": "EFFECT_OCCURRENCE_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C09", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C10", "profile": "PREPIN_REBASE", "fixtureId": "FX-P5-PLAN", "domainId": "DM-P5-PLAN", "locatorType": "JSON_POINTER", "locator": "/candidate/role", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_JSON_STRING", "beforeHex": "2263616e64696461746522", "afterEncoding": "CANONICAL_JSON_STRING", "afterHex": "22636f6e74726f6c22", "injectorOperation": "SET_CANONICAL_STRING", "changedMask": ["/candidate/role"], "collateralProfile": "REPIN_BOTH_ROLE_PLAN_AUDIT_ONLY", "injectorId": "INJ-C10", "leafFunctionIdentity": {"ownerModule": "P5", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)", "astNodePath": "/validatePlanRole", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validatePlanRole)", "leafId": "validatePlanRole"}, "uniqueCode": "RUN_ROLE_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C10", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C11", "profile": "PREPIN_REBASE", "fixtureId": "FX-P5-INPUT-PIN", "domainId": "DM-P5-INPUT-PIN", "locatorType": "JSON_POINTER", "locator": "/inputDescriptors/0/size", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "31", "afterEncoding": "CANONICAL_U53", "afterHex": "32", "injectorOperation": "SET_CANONICAL_U53", "changedMask": ["/inputDescriptors/0/size"], "collateralProfile": "REPIN_INPUT_AND_PLAN_AUDIT_ONLY", "injectorId": "INJ-C11", "leafFunctionIdentity": {"ownerModule": "P5", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)", "astNodePath": "/validateInputAuthorityPin", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateInputAuthorityPin)", "leafId": "validateInputAuthorityPin"}, "uniqueCode": "INPUT_AUTHORITY_PIN_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C11", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C12", "profile": "OBSERVATION_REBASE", "fixtureId": "FX-P5-COMMAND", "domainId": "DM-P5-COMMAND", "locatorType": "JSON_POINTER", "locator": "/capture/argv0", "locatorCardinality": 1, "beforeEncoding": "UTF8", "beforeHex": "2f6f70742f6e6f6465", "afterEncoding": "UTF8", "afterHex": "2f6f70742f6e6f64652d6d7574616e74", "injectorOperation": "APPEND_UTF8", "changedMask": ["/capture/argv0"], "collateralProfile": "RESEAL_COMMAND_OBSERVATION_AUDIT_ONLY", "injectorId": "INJ-C12", "leafFunctionIdentity": {"ownerModule": "P5", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)", "astNodePath": "/validateCommandEnvelopeCapture", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateCommandEnvelopeCapture)", "leafId": "validateCommandEnvelopeCapture"}, "uniqueCode": "COMMAND_ENVELOPE_CAPTURE_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C12", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C13", "profile": "OBSERVATION_REBASE", "fixtureId": "FX-P5-CHRONOLOGY", "domainId": "DM-P5-CHRONOLOGY", "locatorType": "JSON_POINTER", "locator": "/candidate/chronologyOrdinal", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "31", "afterEncoding": "CANONICAL_U53", "afterHex": "33", "injectorOperation": "SET_CANONICAL_U53", "changedMask": ["/candidate/chronologyOrdinal"], "collateralProfile": "RESEAL_CHRONOLOGY_AUDIT_ONLY", "injectorId": "INJ-C13", "leafFunctionIdentity": {"ownerModule": "P5", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)", "astNodePath": "/validateRunChronology", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateRunChronology)", "leafId": "validateRunChronology"}, "uniqueCode": "RUN_CHRONOLOGY_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C13", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C14", "profile": "PREPIN_REBASE", "fixtureId": "FX-P5-CAPABILITY", "domainId": "DM-P5-CAPABILITY", "locatorType": "JSON_POINTER", "locator": "/capabilitySurfaceIds", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_JSON", "beforeHex": "5b5d", "afterEncoding": "CANONICAL_JSON", "afterHex": "5b226e6574776f726b3a616e79225d", "injectorOperation": "INSERT_ARRAY_END", "changedMask": ["/capabilitySurfaceIds"], "collateralProfile": "REPIN_CAPABILITY_AND_PLAN_AUDIT_ONLY", "injectorId": "INJ-C14", "leafFunctionIdentity": {"ownerModule": "P5", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)", "astNodePath": "/validateCapabilityIsolation", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateCapabilityIsolation)", "leafId": "validateCapabilityIsolation"}, "uniqueCode": "CAPABILITY_ISOLATION_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C14", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C15", "profile": "OBSERVATION_REBASE", "fixtureId": "FX-P5-INVOCATION", "domainId": "DM-P5-INVOCATION", "locatorType": "JSON_POINTER", "locator": "/callbackClosureRoot", "locatorCardinality": 1, "beforeEncoding": "HEX32", "beforeHex": "0000000000000000000000000000000000000000000000000000000000000000", "afterEncoding": "HEX32", "afterHex": "0100000000000000000000000000000000000000000000000000000000000000", "injectorOperation": "FLIP_BIT_0", "changedMask": ["/callbackClosureRoot"], "collateralProfile": "RESEAL_INVOCATION_AUDIT_ONLY", "injectorId": "INJ-C15", "leafFunctionIdentity": {"ownerModule": "P5", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)", "astNodePath": "/validateInvocationAuthority", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateInvocationAuthority)", "leafId": "validateInvocationAuthority"}, "uniqueCode": "INVOCATION_AUTHORITY_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C15", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C16", "profile": "OBSERVATION_REBASE", "fixtureId": "FX-P5-FRESHNESS", "domainId": "DM-P5-FRESHNESS", "locatorType": "JSON_POINTER", "locator": "/after/fileDescriptors", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_JSON", "beforeHex": "5b302c312c325d", "afterEncoding": "CANONICAL_JSON", "afterHex": "5b302c312c322c39395d", "injectorOperation": "INSERT_ARRAY_END", "changedMask": ["/after/fileDescriptors"], "collateralProfile": "RESEAL_FRESHNESS_AUDIT_ONLY", "injectorId": "INJ-C16", "leafFunctionIdentity": {"ownerModule": "P5", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)", "astNodePath": "/validateFreshnessIsolation", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateFreshnessIsolation)", "leafId": "validateFreshnessIsolation"}, "uniqueCode": "FRESHNESS_ISOLATION_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C16", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C17", "profile": "OBSERVATION_REBASE", "fixtureId": "FX-P5-MEMBERSHIP", "domainId": "DM-P5-MEMBERSHIP", "locatorType": "DESCRIPTOR_ID", "locator": "product", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_BOOL", "beforeHex": "74727565", "afterEncoding": "CANONICAL_BOOL", "afterHex": "66616c7365", "injectorOperation": "DELETE_UNIQUE_LOCATOR", "changedMask": ["/descriptors/product"], "collateralProfile": "RESEAL_MISSING_MEMBER_AUDIT_ONLY", "injectorId": "INJ-C17", "leafFunctionIdentity": {"ownerModule": "P5", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)", "astNodePath": "/validateObservationMembershipRoot", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationMembershipRoot)", "leafId": "validateObservationMembershipRoot"}, "uniqueCode": "OBSERVATION_MEMBERSHIP_ROOT_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C17", "controlOfControl": "MISSING_LOCATOR"
    },
    {
      "controlId": "C18", "profile": "OBSERVATION_REBASE", "fixtureId": "FX-P5-SEAL", "domainId": "DM-P5-SEAL", "locatorType": "JSON_POINTER", "locator": "/observationSealRoot", "locatorCardinality": 1, "beforeEncoding": "HEX32", "beforeHex": "0000000000000000000000000000000000000000000000000000000000000000", "afterEncoding": "HEX32", "afterHex": "0100000000000000000000000000000000000000000000000000000000000000", "injectorOperation": "FLIP_BIT_0", "changedMask": ["/observationSealRoot"], "collateralProfile": "RESEAL_OBSERVATION_AUDIT_ONLY", "injectorId": "INJ-C18", "leafFunctionIdentity": {"ownerModule": "P5", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)", "astNodePath": "/validateObservationSeal", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationSeal)", "leafId": "validateObservationSeal"}, "uniqueCode": "OBSERVATION_SEAL_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C18", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C19", "profile": "OBSERVATION_REBASE", "fixtureId": "FX-P5-ADMISSION", "domainId": "DM-P5-ADMISSION", "locatorType": "JSON_POINTER", "locator": "/receipt/observationSealRoot", "locatorCardinality": 1, "beforeEncoding": "HEX32", "beforeHex": "0000000000000000000000000000000000000000000000000000000000000000", "afterEncoding": "HEX32", "afterHex": "0100000000000000000000000000000000000000000000000000000000000000", "injectorOperation": "FLIP_BIT_0", "changedMask": ["/receipt/observationSealRoot"], "collateralProfile": "READMISSION_AUDIT_ONLY", "injectorId": "INJ-C19", "leafFunctionIdentity": {"ownerModule": "P5", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)", "astNodePath": "/validateObservationAdmission", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationAdmission)", "leafId": "validateObservationAdmission"}, "uniqueCode": "OBSERVATION_ADMISSION_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C19", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C20", "profile": "RAW_REBASE", "fixtureId": "FX-P1-RAW", "domainId": "DM-P1-RAW", "locatorType": "RAW_JSON_OBJECT", "locator": "/", "locatorCardinality": 1, "beforeEncoding": "UTF8_JSON", "beforeHex": "7b2261223a317d", "afterEncoding": "UTF8_JSON_MUTANT", "afterHex": "7b2261223a312c2261223a327d", "injectorOperation": "INSERT_DUPLICATE_KEY", "changedMask": ["/raw/bytes"], "collateralProfile": "RESEAL_RAW_BLOB_AUDIT_ONLY", "injectorId": "INJ-C20", "leafFunctionIdentity": {"ownerModule": "P1", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)", "astNodePath": "/leafDuplicateKey", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafDuplicateKey)", "leafId": "leafDuplicateKey"}, "uniqueCode": "CANONICAL_DUPLICATE_KEY", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C20", "controlOfControl": "DUPLICATE_LOCATOR"
    },
    {
      "controlId": "C21", "profile": "RAW_REBASE", "fixtureId": "FX-P1-RAW", "domainId": "DM-P1-RAW", "locatorType": "RAW_JSON_OBJECT", "locator": "/x", "locatorCardinality": 1, "beforeEncoding": "UTF8_JSON", "beforeHex": "7b2278223a7b2261223a317d7d", "afterEncoding": "UTF8_JSON_MUTANT", "afterHex": "7b2278223a7b2261223a312c2261223a327d7d", "injectorOperation": "INSERT_NESTED_DUPLICATE_KEY", "changedMask": ["/raw/bytes"], "collateralProfile": "RESEAL_RAW_BLOB_AUDIT_ONLY", "injectorId": "INJ-C21", "leafFunctionIdentity": {"ownerModule": "P1", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)", "astNodePath": "/leafNestedDuplicateKey", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafNestedDuplicateKey)", "leafId": "leafNestedDuplicateKey"}, "uniqueCode": "CANONICAL_NESTED_DUPLICATE_KEY", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C21", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C22", "profile": "RAW_REBASE", "fixtureId": "FX-P1-RAW", "domainId": "DM-P1-RAW", "locatorType": "RAW_JSON_STRING", "locator": "/", "locatorCardinality": 1, "beforeEncoding": "UTF8_JSON", "beforeHex": "222f22", "afterEncoding": "UTF8_JSON_MUTANT", "afterHex": "225c2f22", "injectorOperation": "INSERT_BACKSLASH", "changedMask": ["/raw/bytes"], "collateralProfile": "RESEAL_RAW_BLOB_AUDIT_ONLY", "injectorId": "INJ-C22", "leafFunctionIdentity": {"ownerModule": "P1", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)", "astNodePath": "/leafEscapedSlash", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafEscapedSlash)", "leafId": "leafEscapedSlash"}, "uniqueCode": "CANONICAL_ESCAPED_SLASH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C22", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C23", "profile": "RAW_REBASE", "fixtureId": "FX-P1-RAW", "domainId": "DM-P1-RAW", "locatorType": "RAW_JSON_STRING", "locator": "/", "locatorCardinality": 1, "beforeEncoding": "UTF8_JSON", "beforeHex": "225c753030666622", "afterEncoding": "UTF8_JSON_MUTANT", "afterHex": "225c753030464622", "injectorOperation": "UPPERCASE_ESCAPE_HEX", "changedMask": ["/raw/bytes"], "collateralProfile": "RESEAL_RAW_BLOB_AUDIT_ONLY", "injectorId": "INJ-C23", "leafFunctionIdentity": {"ownerModule": "P1", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)", "astNodePath": "/leafLowerHex", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafLowerHex)", "leafId": "leafLowerHex"}, "uniqueCode": "CANONICAL_HEX_CASE", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C23", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C24", "profile": "RAW_REBASE", "fixtureId": "FX-P1-RAW", "domainId": "DM-P1-RAW", "locatorType": "RAW_JSON_STRING", "locator": "/", "locatorCardinality": 1, "beforeEncoding": "UTF8_JSON", "beforeHex": "225c6e22", "afterEncoding": "UTF8_JSON_MUTANT", "afterHex": "225c753030306122", "injectorOperation": "EXPAND_SHORT_ESCAPE", "changedMask": ["/raw/bytes"], "collateralProfile": "RESEAL_RAW_BLOB_AUDIT_ONLY", "injectorId": "INJ-C24", "leafFunctionIdentity": {"ownerModule": "P1", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)", "astNodePath": "/leafShortControl", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafShortControl)", "leafId": "leafShortControl"}, "uniqueCode": "CANONICAL_CONTROL_FORM", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C24", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C25", "profile": "RAW_REBASE", "fixtureId": "FX-P1-RAW", "domainId": "DM-P1-RAW", "locatorType": "RAW_JSON_OBJECT", "locator": "/", "locatorCardinality": 1, "beforeEncoding": "UTF8_JSON", "beforeHex": "7b2261223a312c2262223a327d", "afterEncoding": "UTF8_JSON_MUTANT", "afterHex": "7b2262223a322c2261223a317d", "injectorOperation": "SWAP_OBJECT_MEMBERS", "changedMask": ["/raw/bytes"], "collateralProfile": "RESEAL_RAW_BLOB_AUDIT_ONLY", "injectorId": "INJ-C25", "leafFunctionIdentity": {"ownerModule": "P1", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)", "astNodePath": "/leafKeyOrder", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafKeyOrder)", "leafId": "leafKeyOrder"}, "uniqueCode": "CANONICAL_KEY_ORDER", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C25", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C26", "profile": "RAW_REBASE", "fixtureId": "FX-P1-RAW", "domainId": "DM-P1-RAW", "locatorType": "RAW_JSON_NUMBER", "locator": "/", "locatorCardinality": 1, "beforeEncoding": "UTF8_JSON", "beforeHex": "30", "afterEncoding": "UTF8_JSON_MUTANT", "afterHex": "3030", "injectorOperation": "PREFIX_ZERO", "changedMask": ["/raw/bytes"], "collateralProfile": "RESEAL_RAW_BLOB_AUDIT_ONLY", "injectorId": "INJ-C26", "leafFunctionIdentity": {"ownerModule": "P1", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)", "astNodePath": "/leafIntegerForm", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafIntegerForm)", "leafId": "leafIntegerForm"}, "uniqueCode": "CANONICAL_INTEGER_FORM", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C26", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C27", "profile": "RAW_REBASE", "fixtureId": "FX-P1-RAW", "domainId": "DM-P1-RAW", "locatorType": "RAW_UTF8_SCALAR", "locator": "/", "locatorCardinality": 1, "beforeEncoding": "RAW_BYTES", "beforeHex": "efbfbd", "afterEncoding": "RAW_BYTES_MUTANT", "afterHex": "eda080", "injectorOperation": "REPLACE_WITH_SURROGATE_ENCODING", "changedMask": ["/raw/bytes"], "collateralProfile": "RESEAL_RAW_BLOB_AUDIT_ONLY", "injectorId": "INJ-C27", "leafFunctionIdentity": {"ownerModule": "P1", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)", "astNodePath": "/leafUtf8Scalar", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafUtf8Scalar)", "leafId": "leafUtf8Scalar"}, "uniqueCode": "CANONICAL_UTF8_SCALAR", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C27", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C28", "profile": "RAW_REBASE", "fixtureId": "FX-P1-RAW", "domainId": "DM-P1-RAW", "locatorType": "RAW_ENVELOPE", "locator": "/", "locatorCardinality": 1, "beforeEncoding": "UTF8_JSON", "beforeHex": "7b2261223a317d", "afterEncoding": "UTF8_JSON_MUTANT", "afterHex": "207b2261223a317d", "injectorOperation": "PREFIX_SPACE", "changedMask": ["/raw/bytes"], "collateralProfile": "RESEAL_RAW_BLOB_AUDIT_ONLY", "injectorId": "INJ-C28", "leafFunctionIdentity": {"ownerModule": "P1", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)", "astNodePath": "/leafEnvelopeWhitespace", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafEnvelopeWhitespace)", "leafId": "leafEnvelopeWhitespace"}, "uniqueCode": "CANONICAL_WHITESPACE", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C28", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C29", "profile": "RAW_REBASE", "fixtureId": "FX-P1-RAW", "domainId": "DM-P1-RAW", "locatorType": "RAW_TAGGED_VALUE", "locator": "/$", "locatorCardinality": 1, "beforeEncoding": "UTF8_JSON", "beforeHex": "7b2224223a22706f696e74222c226174223a307d", "afterEncoding": "UTF8_JSON_MUTANT", "afterHex": "7b2224223a22756e6b6e6f776e222c226174223a307d", "injectorOperation": "REPLACE_TAG", "changedMask": ["/raw/bytes"], "collateralProfile": "RESEAL_RAW_BLOB_AUDIT_ONLY", "injectorId": "INJ-C29", "leafFunctionIdentity": {"ownerModule": "P1", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)", "astNodePath": "/leafTaggedConstructor", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafTaggedConstructor)", "leafId": "leafTaggedConstructor"}, "uniqueCode": "CANONICAL_UNKNOWN_TAG", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P6_CONTROL_IDS_EXCEPT_C29", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C30", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-SOURCE", "domainId": "DM-P7-SOURCE", "locatorType": "MACHINE_DECLARATION_PATH", "locator": "/moduleSet", "locatorCardinality": 1, "beforeEncoding": "UTF8", "beforeHex": "50302c50312c50322c50332c50342c50352c50362c5037", "afterEncoding": "UTF8", "afterHex": "50302c50312c50322c50332c50342c50352c50362c50372c5038", "injectorOperation": "APPEND_MODULE", "changedMask": ["/moduleSet"], "collateralProfile": "REBASE_SOURCE_AUDIT_PIN", "injectorId": "INJ-C30", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafModuleSet", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafModuleSet)", "leafId": "leafModuleSet"}, "uniqueCode": "SOURCE_MODULE_SET", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C30", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C31", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-SOURCE", "domainId": "DM-P7-SOURCE", "locatorType": "MACHINE_DECLARATION_PATH", "locator": "/sourceHash", "locatorCardinality": 1, "beforeEncoding": "HEX32", "beforeHex": "0000000000000000000000000000000000000000000000000000000000000000", "afterEncoding": "HEX32", "afterHex": "0100000000000000000000000000000000000000000000000000000000000000", "injectorOperation": "FLIP_BIT_0", "changedMask": ["/sourceHash"], "collateralProfile": "KEEP_PRODUCTION_SOURCE_PIN", "injectorId": "INJ-C31", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafSourceHash", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafSourceHash)", "leafId": "leafSourceHash"}, "uniqueCode": "SOURCE_HASH_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C31", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C32", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-PROSE", "domainId": "DM-P7-PROSE", "locatorType": "BYTE_OFFSET", "locator": "0", "locatorCardinality": 1, "beforeEncoding": "RAW_BYTES", "beforeHex": "00", "afterEncoding": "RAW_BYTES", "afterHex": "01", "injectorOperation": "FLIP_BIT_0", "changedMask": ["/prose/0"], "collateralProfile": "REBASE_PROSE_AUDIT_PIN", "injectorId": "INJ-C32", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafProseHash", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafProseHash)", "leafId": "leafProseHash"}, "uniqueCode": "PROSE_HASH_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C32", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C33", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-EDGE", "domainId": "DM-P7-EDGE", "locatorType": "EDGE_ID", "locator": "E26", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_BOOL", "beforeHex": "74727565", "afterEncoding": "CANONICAL_BOOL", "afterHex": "66616c7365", "injectorOperation": "DELETE_EDGE", "changedMask": ["/edges/E26"], "collateralProfile": "REBASE_GRAPH_AUDIT_PIN", "injectorId": "INJ-C33", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafEdgeGraph", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafEdgeGraph)", "leafId": "leafEdgeGraph"}, "uniqueCode": "EDGE_MISSING", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C33", "controlOfControl": "MISSING_LOCATOR"
    },
    {
      "controlId": "C34", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-EDGE", "domainId": "DM-P7-EDGE", "locatorType": "EDGE_ID", "locator": "E26", "locatorCardinality": 1, "beforeEncoding": "UTF8", "beforeHex": "50302d3e5035", "afterEncoding": "UTF8", "afterHex": "50352d3e5030", "injectorOperation": "REVERSE_EDGE", "changedMask": ["/edges/E26/from", "/edges/E26/to"], "collateralProfile": "REBASE_GRAPH_AUDIT_PIN", "injectorId": "INJ-C34", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafReverseEdge", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafReverseEdge)", "leafId": "leafReverseEdge"}, "uniqueCode": "EDGE_REVERSE", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C34", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C35", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-AST", "domainId": "DM-P7-AST", "locatorType": "AST_NODE_PATH", "locator": "/imports/0/kind", "locatorCardinality": 1, "beforeEncoding": "UTF8", "beforeHex": "737461746963", "afterEncoding": "UTF8", "afterHex": "64796e616d6963", "injectorOperation": "REPLACE_IMPORT_KIND", "changedMask": ["/imports/0/kind"], "collateralProfile": "REBASE_SOURCE_AND_AST_AUDIT_PIN", "injectorId": "INJ-C35", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafDynamicImport", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDynamicImport)", "leafId": "leafDynamicImport"}, "uniqueCode": "DYNAMIC_IMPORT", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C35", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C36", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-AST", "domainId": "DM-P7-AST", "locatorType": "AST_NODE_PATH", "locator": "/calls/0", "locatorCardinality": 1, "beforeEncoding": "UTF8", "beforeHex": "662829", "afterEncoding": "UTF8", "afterHex": "6576616c2866282929", "injectorOperation": "WRAP_EVAL", "changedMask": ["/calls/0"], "collateralProfile": "REBASE_SOURCE_AND_AST_AUDIT_PIN", "injectorId": "INJ-C36", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafDynamicCode", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDynamicCode)", "leafId": "leafDynamicCode"}, "uniqueCode": "DYNAMIC_CODE", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C36", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C37", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-AST", "domainId": "DM-P7-AST", "locatorType": "AST_NODE_PATH", "locator": "/memberAccess/0", "locatorCardinality": 1, "beforeEncoding": "UTF8", "beforeHex": "6f2e78", "afterEncoding": "UTF8", "afterHex": "5265666c6563742e676574286f2c7829", "injectorOperation": "REPLACE_WITH_REFLECTION", "changedMask": ["/memberAccess/0"], "collateralProfile": "REBASE_SOURCE_AND_AST_AUDIT_PIN", "injectorId": "INJ-C37", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafReflection", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafReflection)", "leafId": "leafReflection"}, "uniqueCode": "REFLECTION_EDGE", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C37", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C38", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-GRAPH", "domainId": "DM-P7-GRAPH", "locatorType": "EDGE_ID", "locator": "dependency-0", "locatorCardinality": 1, "beforeEncoding": "UTF8", "beforeHex": "6465636c61726564", "afterEncoding": "UTF8", "afterHex": "6f6d6974746564", "injectorOperation": "DELETE_DEPENDENCY", "changedMask": ["/dependencyGraph/dependency-0"], "collateralProfile": "REBASE_GRAPH_AUDIT_PIN", "injectorId": "INJ-C38", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafDependencyGraph", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDependencyGraph)", "leafId": "leafDependencyGraph"}, "uniqueCode": "DEPENDENCY_HIDDEN", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C38", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C39", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-SUBSTRATE", "domainId": "DM-P7-SUBSTRATE", "locatorType": "AST_NODE_PATH", "locator": "/runtime/substrate", "locatorCardinality": 1, "beforeEncoding": "UTF8", "beforeHex": "646972656374", "afterEncoding": "UTF8", "afterHex": "6576656e74546170652b70726f6a656374696f6e", "injectorOperation": "REPLACE_SUBSTRATE", "changedMask": ["/runtime/substrate"], "collateralProfile": "REBASE_SOURCE_AND_AST_AUDIT_PIN", "injectorId": "INJ-C39", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafForbiddenSubstrate", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafForbiddenSubstrate)", "leafId": "leafForbiddenSubstrate"}, "uniqueCode": "FORBIDDEN_SUBSTRATE", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C39", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C40", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-BUDGET", "domainId": "DM-P7-BUDGET", "locatorType": "JSON_POINTER", "locator": "/modules/P5/chargedLoc", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "3835", "afterEncoding": "CANONICAL_U53", "afterHex": "3836", "injectorOperation": "INCREMENT_U53", "changedMask": ["/modules/P5/chargedLoc"], "collateralProfile": "REBASE_METRIC_AUDIT_PIN", "injectorId": "INJ-C40", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafModuleBudget", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafModuleBudget)", "leafId": "leafModuleBudget"}, "uniqueCode": "MODULE_LOC_EXCEEDED", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C40", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C41", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-BUDGET", "domainId": "DM-P7-BUDGET", "locatorType": "JSON_POINTER", "locator": "/totalChargedLoc", "locatorCardinality": 1, "beforeEncoding": "CANONICAL_U53", "beforeHex": "383530", "afterEncoding": "CANONICAL_U53", "afterHex": "383531", "injectorOperation": "INCREMENT_U53", "changedMask": ["/totalChargedLoc"], "collateralProfile": "REBASE_METRIC_AUDIT_PIN", "injectorId": "INJ-C41", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafTotalBudget", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafTotalBudget)", "leafId": "leafTotalBudget"}, "uniqueCode": "TOTAL_LOC_EXCEEDED", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C41", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C42", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-TOOL", "domainId": "DM-P7-TOOL", "locatorType": "JSON_POINTER", "locator": "/astTool/sha256", "locatorCardinality": 1, "beforeEncoding": "HEX32", "beforeHex": "0000000000000000000000000000000000000000000000000000000000000000", "afterEncoding": "HEX32", "afterHex": "0100000000000000000000000000000000000000000000000000000000000000", "injectorOperation": "FLIP_BIT_0", "changedMask": ["/astTool/sha256"], "collateralProfile": "REBASE_TOOL_AUDIT_PIN", "injectorId": "INJ-C42", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafAstToolPin", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafAstToolPin)", "leafId": "leafAstToolPin"}, "uniqueCode": "AST_TOOL_PIN_MISMATCH", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C42", "controlOfControl": "EXACT_NO_OP"
    },
    {
      "controlId": "C43", "profile": "SOURCE_REBASE", "fixtureId": "FX-P7-CLAIM", "domainId": "DM-P7-CLAIM", "locatorType": "JSON_POINTER", "locator": "/claim/sourceJoin", "locatorCardinality": 1, "beforeEncoding": "HEX32", "beforeHex": "0000000000000000000000000000000000000000000000000000000000000000", "afterEncoding": "HEX32", "afterHex": "0100000000000000000000000000000000000000000000000000000000000000", "injectorOperation": "FLIP_BIT_0", "changedMask": ["/claim/sourceJoin"], "collateralProfile": "REBASE_CLAIM_AUDIT_PIN", "injectorId": "INJ-C43", "leafFunctionIdentity": {"ownerModule": "P7", "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)", "astNodePath": "/leafClaimSourceJoin", "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafClaimSourceJoin)", "leafId": "leafClaimSourceJoin"}, "uniqueCode": "CLAIM_SOURCE_DRIFT", "disabledLeaf": "SAME_LEAF_FUNCTION_IDENTITY", "ownerBypassResult": "DEFECT_EXPOSED", "nonownerRetentionSelector": "P7_CONTROL_IDS_EXCEPT_C43", "controlOfControl": "EXACT_NO_OP"
    }
  ],
  "controlArithmetic": {
    "P6": {"rows": 29, "baseline": 29, "ownerReject": 29, "ownerBypass": 29, "nonownerRetention": 812, "erasureAndNoOp": 29, "unknown": 1, "duplicate": 1, "total": 930},
    "P7": {"rows": 14, "baseline": 14, "ownerReject": 14, "ownerBypass": 14, "nonownerRetention": 182, "erasureAndNoOp": 14, "unknown": 1, "duplicate": 1, "total": 240},
    "totalRows": 43,
    "totalReceipts": 1170
  },
  "auditEnvelope": {
    "formula": "SHA256(parse-that:N2:audit-mutant:v6\\0||canonical(controlRow,fixtureId,domainId,locator,beforeHex,afterHex,injectorOperation,changedMask,collateralProfile,productionAdmissionRoot))",
    "admission": "OWNER_SIGNED_AUDIT_ADMISSION_OVER_AUDIT_MUTANT_ROOT",
    "productionAdmissionReuse": false,
    "sameLeafFunctionIdentity": true,
    "productionSuppressionArgument": false
  },
  "experiment": {
    "planCommitsBothRolesBeforeCandidate": true,
    "candidateRuns": 1,
    "candidateAdmissionBeforeControlSpawn": true,
    "controlRuns": 1,
    "adaptiveControl": false,
    "futureOutputsInInputPin": false,
    "preRunTopology": "STATIC_CONSTRAINT_ONLY",
    "postRunTopology": "ACTUAL_RETURNED_PARSER_TOPOLOGY_ROOT",
    "observationAdmission": "OWNER_SIGNED_AFTER_ACTUAL_ROOT_RECOMPUTATION",
    "n3CapabilityDependency": "PENDING_NOT_CONSUMED"
  },
  "ownership": {"selection": "P0", "candidateExecutor": "P5", "controlExecutor": "P5", "productComparator": "P3", "effectComparator": "P4", "auditChronology": "P6", "sourceAstVerifier": "P7"},
  "forbidden": ["future-output-prepin", "adaptive-control", "caller-output", "caller-reissue", "hidden-prior-run", "hidden-evaluator", "reparse", "callback-outside-P5", "fallback", "dual-path", "scanner-token-index-tape", "css-grammar-in-parse-that", "parse-that-to-fourier"],
  "credit": {"authority": 0, "scientific": 0, "equivalence": 0, "performance": 0, "novelty": 0, "css": 0, "product": 0, "law": 0, "release": 0},
  "authorized": {"paperV6": true, "reviewA6": false, "reviewB6": false, "n2e": false, "source": false, "astTool": false, "execution": false, "prototype": false, "benchmark": false}
}
```

## Derived boundary

- topology: exactly `P0–P7 + PAPER-READY + PAPER-MANIFEST`;
- typed edges: `26`;
- full production identities: `43`, including all `14` P7 leaves;
- controls: `29 P6 + 14 P7 = 43`;
- future receipts: `930 + 240 = 1,170`;
- candidate/control runs: `0/0`;
- P7 executable/AST charged LOC: `null / RED`;
- fresh v6 reviews: `0/2`, not dispatched;
- N3 capsule authority: `PENDING_NOT_CONSUMED`;
- N2e/source/AST/Node/parser/prototype/benchmark/product/CSS/Fourier: `WITHHELD`;
- every credit dimension: `0`.

`PAPER-MANIFEST.sha256` covers the nine non-manifest files. This paper cannot
self-author reviews, source, budget relief, execution, product mutation, or a
successor packet.
