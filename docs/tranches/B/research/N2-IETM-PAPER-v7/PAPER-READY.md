# N2 IETM paper packet v7 status and sole machine authority

Status: `PAPER_V7_RED / TWO_FRESH_REVIEWS_REQUIRED / ZERO_CREDIT`.

## Frozen v6 terminal intake

V6 is frozen at `fa9c5ae8d516d05edf46a2a701779e08295d9cf2` /
`452d21e87579e76928b146ec3ed803a17979c316`. Its 10 files, 68,361 bytes,
9/9 manifest `9a3b59d35e0397cf81b2fd9caeee0f5baf9c8f00ea5bd85af1117a48bd2a5598`,
and sorted list `c4451dfc187ee7497e8e262112f5e47613f49d7e306275c36675a130efab7ee2`
remain immutable. Both reviews are terminal on
`FIXTURE_DOMAIN_AUTHORITY_BYTES_ABSENT`; all v6 credit remains zero.

## Authority

The JSON block is the sole machine registry. It materializes each control as a
distinct canonical fixture, closed exact schema, domain, baseline/audit member,
cardinality-one locator, byte replay, measured change mask, complement, and
collateral derivation. It also owns every input/plan/command/capture/seal/
signature/audit schema and equation, the paper owner-key and capability
policies, full leaf identities, exact suppression, all 994 nonowner pairs, and
control-of-control. Prose cannot supply a missing field or label.

```json
{
  "schema": "parse-that/n2-ietm-paper-v7-authority/v1",
  "status": "PAPER_V7_RED",
  "fatalReason": "TWO_FRESH_REVIEWS_REQUIRED",
  "files": 10,
  "frozenV6": {
    "commit": "fa9c5ae8d516d05edf46a2a701779e08295d9cf2",
    "tree": "452d21e87579e76928b146ec3ed803a17979c316",
    "manifestSha256": "9a3b59d35e0397cf81b2fd9caeee0f5baf9c8f00ea5bd85af1117a48bd2a5598",
    "sortedHashListSha256": "c4451dfc187ee7497e8e262112f5e47613f49d7e306275c36675a130efab7ee2",
    "terminalReason": "FIXTURE_DOMAIN_AUTHORITY_BYTES_ABSENT"
  },
  "rootEquations": {
    "fixtureDomainAuthorityRoot": "SHA256(UTF8(parse-that:N2:fixture-domain:v7\\0)||ordered raw SHA256 bytes for C01..C43 BASELINE then AUDIT_MUTANT)",
    "schemaAuthorityRoot": "SHA256(UTF8(JSON.stringify ordered exact schema objects)))",
    "inputPinRoot": "SHA256(UTF8(parse-that:N2:input-pin:v7\\0)||CanonicalBinary(InputAuthorityPinV7))",
    "experimentPlanRoot": "SHA256(UTF8(parse-that:N2:experiment-plan:v7\\0)||CanonicalBinary(ExperimentPlanV7))",
    "commandEnvelopeRoot": "SHA256(UTF8(parse-that:N2:command-envelope:v7\\0)||CanonicalBinary(CommandEnvelopeV7))",
    "observationMembershipRoot": "SHA256(UTF8(parse-that:N2:observation-membership:v7\\0)||CanonicalBinary(ordered ObservationMemberV7 descriptors))",
    "observationSealRoot": "SHA256(UTF8(parse-that:N2:observation-seal:v7\\0)||CanonicalBinary(ObservationSealV7))",
    "ownerAdmissionSignaturePayload": "CanonicalBinary({schema,rootKind,root,role,planRoot,issuedOrdinal,keyId,policyRoot})",
    "auditMutantRoot": "SHA256(UTF8(parse-that:N2:audit-mutant:v7\\0)||CanonicalBinary(AuditMutantEnvelopeV7))",
    "nonownerRetentionRoot": "SHA256(UTF8 exact ordered controlId|leafId lines)"
  },
  "authorityRoots": {
    "fixtureDomainAuthorityRoot": "20f5ea2c7fb2763cd1f38065d61f67a870fbfa28e01dbc883909a3a25401bafb",
    "schemaAuthorityRoot": "61f91d7cf34df032bf012ea86a7c758d3fd46b4d5202938bc291c2072b4080d9",
    "nonownerRetentionRoot": "c43f54dc680e4381d978a706fb65be8882dd4a96beff67ede079e9cde6d35213"
  },
  "machineSchemas": {
    "InputAuthorityPinV7": [
      "schema",
      "role",
      "selectionReceipt",
      "sourceVersion",
      "identityEpochId",
      "inputMembers",
      "executablePin",
      "harnessPin",
      "runtimePin",
      "toolchainPin",
      "commandEnvelopeRoot",
      "boundedEnvironmentKeyValues",
      "capabilitySurfaceIds",
      "filesystemBounds",
      "processBounds",
      "networkBounds",
      "fileDescriptorBounds",
      "staticReturnedTopologyConstraint",
      "ownerId",
      "signaturePolicyRoot"
    ],
    "ExperimentPlanV7": [
      "schema",
      "selectionReceipt",
      "candidateInputPinRoot",
      "candidateInputAdmissionReceipt",
      "controlInputPinRoot",
      "controlInputAdmissionReceipt",
      "candidateCommandEnvelopeRoot",
      "controlCommandEnvelopeRoot",
      "executionOrder"
    ],
    "CommandEnvelopeV7": [
      "schema",
      "executablePath",
      "executableRealpath",
      "device",
      "inode",
      "mode",
      "size",
      "mtimeNs",
      "sha256",
      "argv0",
      "argv",
      "argvCardinality",
      "cwd",
      "boundedEnvironmentKeyValues",
      "runtimePin",
      "toolchainPin",
      "filesystemBounds",
      "processBounds",
      "networkBounds",
      "fileDescriptorBounds",
      "capabilitySurfaceIds"
    ],
    "CommandCaptureV7": [
      "schema",
      "commandEnvelopeRoot",
      "executablePreStat",
      "executablePostStat",
      "actualArgv0",
      "actualArgv",
      "actualCwd",
      "actualEnvironment",
      "pid",
      "ppid",
      "startSequence",
      "endSequence",
      "exitCode",
      "signal",
      "stdoutDescriptor",
      "stderrDescriptor",
      "rawSpawnReceipt"
    ],
    "ObservationMemberV7": [
      "memberId",
      "kind",
      "path",
      "bytes",
      "sha256",
      "mode",
      "nlink"
    ],
    "ObservationSealV7": [
      "schema",
      "role",
      "experimentPlanRoot",
      "inputPinRoot",
      "selectionHash",
      "observationMembershipRoot",
      "chronologyOrdinal"
    ],
    "OwnerAdmissionReceiptV7": [
      "schema",
      "rootKind",
      "root",
      "role",
      "planRoot",
      "issuedOrdinal",
      "keyId",
      "policyRoot",
      "signatureBytes"
    ],
    "AuditMutantEnvelopeV7": [
      "schema",
      "controlId",
      "fixtureId",
      "domainId",
      "schemaId",
      "locatorRef",
      "beforeMember",
      "afterMember",
      "injectorRef",
      "rebaseRef",
      "productionAdmissionRoot",
      "auditPolicyRoot"
    ],
    "ControlRowV7": [
      "controlId",
      "profile",
      "fixtureId",
      "domainId",
      "schemaId",
      "locatorRef",
      "beforeMemberPath",
      "afterMemberPath",
      "injectorRef",
      "rebaseRef",
      "leafFunctionIdentity",
      "uniqueCode",
      "disabledLeafFunctionIdentity",
      "ownerSuppression",
      "controlOfControl",
      "nonownerRetentionRange"
    ]
  },
  "signatureAuthority": {
    "policy": {
      "policyId": "N2-V7-PAPER-ED25519",
      "algorithm": "ED25519",
      "keyId": "N2-V7-OWNER-KEY-01",
      "payloadSchema": "OwnerAdmissionReceiptV7",
      "signatureCardinality": 1,
      "keyRotation": "PINNED_MONOTONIC_OWNER_LEDGER",
      "paperOnly": true
    },
    "ownerKeyPin": {
      "publicKeyBytesHex": "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
      "publicKeySha256": "630dcd2966c4336691125448bbb25b4ff412a49c732db2c8abc1b8581bd710dd",
      "trustedOutsideSubmittedEvidence": true
    }
  },
  "capabilityPolicy": {
    "policyId": "N2-V7-CAPABILITY-DENY-BY-DEFAULT",
    "allowedSurfaceIds": [],
    "forbiddenSurfaceIds": [
      "network:any",
      "filesystem:outside-plan",
      "process:child-unplanned",
      "fd:undeclared"
    ],
    "unmeasuredSurfaceOutcome": "RED"
  },
  "schemas": [
    {
      "schemaId": "SCHEMA-C01-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C01.before.bin",
      "baselineRawSha256": "2c5315a0d6d5f54a747aa21f1f1aaa8beee24a29941ee9f2c65102acfd2a9576",
      "auditMemberPath": "fixtures/C01.after.bin",
      "auditRawSha256": "264485eba433ab7c84b30025b3e01b5e04b2bf983687d88e32e46fe9ac40c759",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C02-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C02.before.bin",
      "baselineRawSha256": "cc1e0669ddc5566b01412bd9c594e9810fb9606f221f00ec17bd843fb800dd32",
      "auditMemberPath": "fixtures/C02.after.bin",
      "auditRawSha256": "67b72fff833f63b27bea25e48f249ff432d979c8854291f976bf8c8dd1622dda",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C03-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C03.before.bin",
      "baselineRawSha256": "0c5418f031278eb40c418c485119f4bfe8ce561f89dfcd81bad9a69b9f032ad1",
      "auditMemberPath": "fixtures/C03.after.bin",
      "auditRawSha256": "3ef7284745d6eafa9bcb8cab00dc2bff4f4567a7b037940e8dd6bae1698d6692",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C04-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C04.before.bin",
      "baselineRawSha256": "f70ac3844624cbd8adf52e216908c14fc75a7004683aefc71c665c69ca266a38",
      "auditMemberPath": "fixtures/C04.after.bin",
      "auditRawSha256": "ce5ea1739aa1ef5383224667bc7bc160e7259b9aec6ae8ac9e2794a5e10bb756",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C05-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C05.before.bin",
      "baselineRawSha256": "cbceb9b98bb85d3fa9e08917b14783f5ff846d22cc3a57e4fbf0bdcea1316374",
      "auditMemberPath": "fixtures/C05.after.bin",
      "auditRawSha256": "8ab3dda1ce8123e4cdfccb277dbc4def62143da1cbcb7123a7093b1a2c6ed768",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C06-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C06.before.bin",
      "baselineRawSha256": "04c1ba0b0f19189f7f260caf32e59dab8336a2e9714c54d6ebaa1539a9a96f00",
      "auditMemberPath": "fixtures/C06.after.bin",
      "auditRawSha256": "8316c7b67455af3b84aa55396d8e6c92c9937736eed43e9ea9847827220073f2",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C07-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C07.before.bin",
      "baselineRawSha256": "040930e3e463ca54c9cabb2515ba2a0e4e7b724347d35b2655b7c8ada09255f6",
      "auditMemberPath": "fixtures/C07.after.bin",
      "auditRawSha256": "55dedf69f116ced76402f0d179cc702d8d9e931442aabaf7a64d646205558444",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C08-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C08.before.bin",
      "baselineRawSha256": "e0c18692ad5cfd79714fd3c3d438ad24e7f13b22c35ee8f99e07e059ee443e28",
      "auditMemberPath": "fixtures/C08.after.bin",
      "auditRawSha256": "f7072d781d5e6fabadaa6577460b0341495bb307ce0285865a06567993bd3442",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C09-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C09.before.bin",
      "baselineRawSha256": "d5ee65ef58dbfc2b93bb20d1af6489a2ee32bc3c509fac83570e356fc1a55497",
      "auditMemberPath": "fixtures/C09.after.bin",
      "auditRawSha256": "c55b99da1cefcdd7b994454a93ff390e0783e664cdec1d0507cacb78be33a43b",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C10-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C10.before.bin",
      "baselineRawSha256": "36e5b7b7ed4c8f974a02b5b90da2e31d655894fc12a6c4363d501a0c29006b2c",
      "auditMemberPath": "fixtures/C10.after.bin",
      "auditRawSha256": "0f41447ef44e1b1a4defaec34072a1d65c993ae2cbe6d00e4bb13b102b4856ca",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C11-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C11.before.bin",
      "baselineRawSha256": "6a051ccf1857d7e081addf115121107b2a5b74d303af231624507c8299a8aa89",
      "auditMemberPath": "fixtures/C11.after.bin",
      "auditRawSha256": "23faa9b4c159f00ba8a6c76591592c31f81edf3e64fb98ab20750473fdcb406e",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C12-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C12.before.bin",
      "baselineRawSha256": "738394974f061bacd77775d5e81898561ba12830725c765656a986828708da78",
      "auditMemberPath": "fixtures/C12.after.bin",
      "auditRawSha256": "10653ffa84b3d8a29d4404288a6f17f294e2468f8b4ca9bc222063133e171e96",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C13-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C13.before.bin",
      "baselineRawSha256": "940e95645f08fb0f6f003d7eb0bf1a992d502b10aed23a465633ed0aec8ca163",
      "auditMemberPath": "fixtures/C13.after.bin",
      "auditRawSha256": "0d56fefddb77f1bd3219c266463dc9cf7101064ad2e2c9f0221ff3c9cd4c2636",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C14-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C14.before.bin",
      "baselineRawSha256": "c1e3de0b34cfd4907b913bf90b06c04d2d2e7e251069a7e39fb9ead8e9fa106c",
      "auditMemberPath": "fixtures/C14.after.bin",
      "auditRawSha256": "15178d19c45f218d40c27a805a93cf59f1fa2f138a1eae7352b0bfea57b89e3c",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C15-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C15.before.bin",
      "baselineRawSha256": "46de9bd5096559b15f3db442907e239f570c6505631cd32ace0b40711d0584ce",
      "auditMemberPath": "fixtures/C15.after.bin",
      "auditRawSha256": "1fb683b4bfd11ae4aad4102ee572421547195b54e9d808885374756ae3f6973f",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C16-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C16.before.bin",
      "baselineRawSha256": "86a37ddf33bbe434e5b8d550311c6e426a56c58d3c9860cfa45ccb12f88e6cb7",
      "auditMemberPath": "fixtures/C16.after.bin",
      "auditRawSha256": "3ee559e51f3340d288ae7dd9ce5415e5f287bdb93d5cf997df313dcdca0bb792",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C17-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C17.before.bin",
      "baselineRawSha256": "6ecbb2be83a6a02f3203905b173301e21a92175c65a9a5b4a03b9ca1c872ac4c",
      "auditMemberPath": "fixtures/C17.after.bin",
      "auditRawSha256": "d9d1dd02acb2e9abd0c558b1911d71528256a20a22e5006155533f4c7fa97cb2",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C18-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C18.before.bin",
      "baselineRawSha256": "46e97721913a5a962555e528a6e2ef4788cf6ffd72cb4b4de69fd8e9cac9b489",
      "auditMemberPath": "fixtures/C18.after.bin",
      "auditRawSha256": "2826697bf79c5aa6ea0295622b65939158dbb21e8a670f673fcd556283a60bc1",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C19-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C19.before.bin",
      "baselineRawSha256": "0842506ce41ca21af5b662f395b1ba4d748ac78771416a499d71a23530ca0345",
      "auditMemberPath": "fixtures/C19.after.bin",
      "auditRawSha256": "92e26b7ca5d5549650c44e6670e5298b2fe0d740d0abbc841d1a41fb21259d02",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C20-V1",
      "kind": "EXACT_RAW_CODEC_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C20.before.bin",
      "baselineRawSha256": "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862",
      "auditMemberPath": "fixtures/C20.after.bin",
      "auditRawSha256": "1c53ee0df7b12fd4d65b976120c7fa6b847dc41dffd7f0331c3237a1ceab1756",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C21-V1",
      "kind": "EXACT_RAW_CODEC_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C21.before.bin",
      "baselineRawSha256": "9568cb6e932779f25ed1080bf2ed0d20022373cf27187f3a64a24c717bc13950",
      "auditMemberPath": "fixtures/C21.after.bin",
      "auditRawSha256": "06d55db68c2ab40693c6dbd8e3d358b352a269731d9ead4defe3e067a6eb6af7",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C22-V1",
      "kind": "EXACT_RAW_CODEC_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C22.before.bin",
      "baselineRawSha256": "df7e940f72aa93cbcb6d70cc35124b0767c7a0e353043c7c24b660ea9be7b952",
      "auditMemberPath": "fixtures/C22.after.bin",
      "auditRawSha256": "7040fb3de3d569faa7bf72a920e4375290a0c4333d824ccc47c3e3e5ffcdaab5",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C23-V1",
      "kind": "EXACT_RAW_CODEC_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C23.before.bin",
      "baselineRawSha256": "e63d8a91f82cd40b18f62aa1790f6df8757dd72b5c93a919c8c11d6b0043ac4d",
      "auditMemberPath": "fixtures/C23.after.bin",
      "auditRawSha256": "6ce03defa1f190707faf0c56c80e85b76e3d5e7a9ae73ce1799578dbdd1759ba",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C24-V1",
      "kind": "EXACT_RAW_CODEC_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C24.before.bin",
      "baselineRawSha256": "d7a5e915306d21dc1937ad5616f1dc9682e759e75ef51dd05fd9ddc98a078ea1",
      "auditMemberPath": "fixtures/C24.after.bin",
      "auditRawSha256": "46f7b04715e2e1f162a9f3cb90a946a48e653b15117c2de6ed7cf60c029d2219",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C25-V1",
      "kind": "EXACT_RAW_CODEC_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C25.before.bin",
      "baselineRawSha256": "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777",
      "auditMemberPath": "fixtures/C25.after.bin",
      "auditRawSha256": "3fb75453225c732a76b7899ea2096dda1455189c89817239732182f73fe5a09f",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C26-V1",
      "kind": "EXACT_RAW_CODEC_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C26.before.bin",
      "baselineRawSha256": "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
      "auditMemberPath": "fixtures/C26.after.bin",
      "auditRawSha256": "f1534392279bddbf9d43dde8701cb5be14b82f76ec6607bf8d6ad557f60f304e",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C27-V1",
      "kind": "EXACT_RAW_CODEC_FIXTURE",
      "encoding": "BINARY",
      "baselineMemberPath": "fixtures/C27.before.bin",
      "baselineRawSha256": "83d544ccc223c057d2bf80d3f2a32982c32c3c0db8e2674820da5064783fb097",
      "auditMemberPath": "fixtures/C27.after.bin",
      "auditRawSha256": "91a681b998555fb475479817b126c94e57e52011fa1842c5d188795a4a05226b",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C28-V1",
      "kind": "EXACT_RAW_CODEC_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C28.before.bin",
      "baselineRawSha256": "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862",
      "auditMemberPath": "fixtures/C28.after.bin",
      "auditRawSha256": "3b48504afb5cf21924953df99e5b1b3210705a89dc4e60e291371ed395083730",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C29-V1",
      "kind": "EXACT_RAW_CODEC_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C29.before.bin",
      "baselineRawSha256": "1682c75ee9c9e6e2ad0f984a14fd9bd8e08d4da016cd0ca57c0b706a1b68a171",
      "auditMemberPath": "fixtures/C29.after.bin",
      "auditRawSha256": "47ac97bdd184ad5542f777e463e6bc225284c803afe82b2defeb549cec355d33",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C30-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C30.before.bin",
      "baselineRawSha256": "98c0c9f04b66b0043709691b18289e607ceeddcd69878b5ebebd9907cdc97f27",
      "auditMemberPath": "fixtures/C30.after.bin",
      "auditRawSha256": "36fdbca2d2becef86566dcae9a411cb31135f89c072eb4442403dbb707fdc91f",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C31-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C31.before.bin",
      "baselineRawSha256": "30869d35b828d751c1a26cb015eb08c1c3cfe14552529a18ee67cc2f9493bf90",
      "auditMemberPath": "fixtures/C31.after.bin",
      "auditRawSha256": "7740dcb134cb3ec1db3d19fb69a851cc50cadd47b2c9a6ce87f9e0d33f1b0dea",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C32-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "BINARY",
      "baselineMemberPath": "fixtures/C32.before.bin",
      "baselineRawSha256": "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
      "auditMemberPath": "fixtures/C32.after.bin",
      "auditRawSha256": "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C33-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C33.before.bin",
      "baselineRawSha256": "4dd6f8e2eb5a8f7d7eb51bf423c1f7e77b5ce00ca0060784dc1d8b2011656523",
      "auditMemberPath": "fixtures/C33.after.bin",
      "auditRawSha256": "d0033617a14f4c8342e0fc856000919d5590d5d514d94db70dc19f1c44b0f1ee",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C34-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C34.before.bin",
      "baselineRawSha256": "c2d517519067c80763325717d2d6c379eeec2806a4d5dac866df70b6b45b28df",
      "auditMemberPath": "fixtures/C34.after.bin",
      "auditRawSha256": "9cbe240a89e2747232a5a4beb499c9e5c5f75098cfc7da63e5d89a1d7c3e0893",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C35-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C35.before.bin",
      "baselineRawSha256": "e72787eddfbbf5f9f987d376a57803f59f9fa1308ce02d72e5d6c1b5755c5ff9",
      "auditMemberPath": "fixtures/C35.after.bin",
      "auditRawSha256": "b819beaf7e6666574907ae7fe1e8946a080631c06cda1edba050825ca84596a4",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C36-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C36.before.bin",
      "baselineRawSha256": "ca8b98125703115ef9987354c67890e2fade4e895c3ee52dd6162612c8850691",
      "auditMemberPath": "fixtures/C36.after.bin",
      "auditRawSha256": "3fbb45338d9f7fe44410412d8055ace055bd748ec5232ce5524146d2e799d2a5",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C37-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C37.before.bin",
      "baselineRawSha256": "fe8d2a7a954913fc985a63ff1bfc24fb3bc746c3e07c38a1b5a2e05974d49c77",
      "auditMemberPath": "fixtures/C37.after.bin",
      "auditRawSha256": "3adc0899fb6115cf669e00036ed1f121822e5f516e43523a179793b76f9e2440",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C38-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C38.before.bin",
      "baselineRawSha256": "76b8262d606376b7b42a88c8be3869dbabae6bebfacc38256c58bc8b54163b05",
      "auditMemberPath": "fixtures/C38.after.bin",
      "auditRawSha256": "d2116d17e3aee0910a13990ab2f583ff1cc704b230c14d361ff09629ed95dfa7",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C39-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C39.before.bin",
      "baselineRawSha256": "e098e3f78eb6f111e83ef1bb2683de43c31fd1f902f613b9a61c801f802768ab",
      "auditMemberPath": "fixtures/C39.after.bin",
      "auditRawSha256": "87ec2883779b147671e22987c39e538746751c622e6f10173a9c9e5e7bb9bc96",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C40-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C40.before.bin",
      "baselineRawSha256": "679b720aba6bd9213c3701b17f79d987f2b005af3ba08b32a8854b945b565fd2",
      "auditMemberPath": "fixtures/C40.after.bin",
      "auditRawSha256": "046375f911b35789fd8a0830abf597a02c74003b02021f1eab2c18a4d666056f",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C41-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C41.before.bin",
      "baselineRawSha256": "86bb08de33ce38157f80ab1f9c57dc90b37a06c39bb654136d5c890044bf90cf",
      "auditMemberPath": "fixtures/C41.after.bin",
      "auditRawSha256": "ecc09afb9503c0efa7f73f1897a227cb99b1b1ea24dcd2561b6149736dd8dda9",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C42-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C42.before.bin",
      "baselineRawSha256": "c83b0128ec3f7900ad59ec3bb2dc1c2d57ad0ed4d36e081d8ca63e399c374f3d",
      "auditMemberPath": "fixtures/C42.after.bin",
      "auditRawSha256": "7317552a8b62bde861bed494ff4ee4857b96fa6d98de604862b7dde7e80d8b17",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    },
    {
      "schemaId": "SCHEMA-C43-V1",
      "kind": "CLOSED_EXACT_DOMAIN_FIXTURE",
      "encoding": "UTF8",
      "baselineMemberPath": "fixtures/C43.before.bin",
      "baselineRawSha256": "5d63b4a2d9c2c892819cffd7a0370d6a2fb2198c67abe86c9da83a0e593b7b3e",
      "auditMemberPath": "fixtures/C43.after.bin",
      "auditRawSha256": "50afc088b8f7f05aceb36a28249675ce505433ccad27026a3e7329e29c973d9f",
      "unknownMembersForbidden": true,
      "acceptedRoles": [
        "BASELINE",
        "AUDIT_MUTANT"
      ]
    }
  ],
  "fixtures": [
    {
      "fixtureId": "FX-C01",
      "domainId": "DM-C01",
      "schemaId": "SCHEMA-C01-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C01.before.bin",
          "bytesHex": "7b226465636c61726174696f6e536861323536223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
          "bytes": 88,
          "sha256": "2c5315a0d6d5f54a747aa21f1f1aaa8beee24a29941ee9f2c65102acfd2a9576"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C01.after.bin",
          "bytesHex": "7b226465636c61726174696f6e536861323536223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
          "bytes": 88,
          "sha256": "264485eba433ab7c84b30025b3e01b5e04b2bf983687d88e32e46fe9ac40c759"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C02",
      "domainId": "DM-C02",
      "schemaId": "SCHEMA-C02-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C02.before.bin",
          "bytesHex": "7b226c6564676572526f6f74223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
          "bytes": 81,
          "sha256": "cc1e0669ddc5566b01412bd9c594e9810fb9606f221f00ec17bd843fb800dd32"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C02.after.bin",
          "bytesHex": "7b226c6564676572526f6f74223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
          "bytes": 81,
          "sha256": "67b72fff833f63b27bea25e48f249ff432d979c8854291f976bf8c8dd1622dda"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C03",
      "domainId": "DM-C03",
      "schemaId": "SCHEMA-C03-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C03.before.bin",
          "bytesHex": "7b2276657273696f6e73223a5b7b7d2c7b22706172656e7456657273696f6e223a307d5d7d",
          "bytes": 37,
          "sha256": "0c5418f031278eb40c418c485119f4bfe8ce561f89dfcd81bad9a69b9f032ad1"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C03.after.bin",
          "bytesHex": "7b2276657273696f6e73223a5b7b7d2c7b22706172656e7456657273696f6e223a317d5d7d",
          "bytes": 37,
          "sha256": "3ef7284745d6eafa9bcb8cab00dc2bff4f4567a7b037940e8dd6bae1698d6692"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C04",
      "domainId": "DM-C04",
      "schemaId": "SCHEMA-C04-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C04.before.bin",
          "bytesHex": "7b226566666563744964656e746974696573223a5b7b226f7264696e616c223a307d5d7d",
          "bytes": 36,
          "sha256": "f70ac3844624cbd8adf52e216908c14fc75a7004683aefc71c665c69ca266a38"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C04.after.bin",
          "bytesHex": "7b226566666563744964656e746974696573223a5b7b226f7264696e616c223a317d5d7d",
          "bytes": 36,
          "sha256": "ce5ea1739aa1ef5383224667bc7bc160e7259b9aec6ae8ac9e2794a5e10bb756"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C05",
      "domainId": "DM-C05",
      "schemaId": "SCHEMA-C05-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C05.before.bin",
          "bytesHex": "7b22726f774f7264696e616c223a307d",
          "bytes": 16,
          "sha256": "cbceb9b98bb85d3fa9e08917b14783f5ff846d22cc3a57e4fbf0bdcea1316374"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C05.after.bin",
          "bytesHex": "7b22726f774f7264696e616c223a317d",
          "bytes": 16,
          "sha256": "8ab3dda1ce8123e4cdfccb277dbc4def62143da1cbcb7123a7093b1a2c6ed768"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C06",
      "domainId": "DM-C06",
      "schemaId": "SCHEMA-C06-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C06.before.bin",
          "bytesHex": "7b226564697473223a5b7b2273746172745574663136223a317d5d7d",
          "bytes": 28,
          "sha256": "04c1ba0b0f19189f7f260caf32e59dab8336a2e9714c54d6ebaa1539a9a96f00"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C06.after.bin",
          "bytesHex": "7b226564697473223a5b7b2273746172745574663136223a327d5d7d",
          "bytes": 28,
          "sha256": "8316c7b67455af3b84aa55396d8e6c92c9937736eed43e9ea9847827220073f2"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C07",
      "domainId": "DM-C07",
      "schemaId": "SCHEMA-C07-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C07.before.bin",
          "bytesHex": "7b226d61784465707468223a347d",
          "bytes": 14,
          "sha256": "040930e3e463ca54c9cabb2515ba2a0e4e7b724347d35b2655b7c8ada09255f6"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C07.after.bin",
          "bytesHex": "7b226d61784465707468223a357d",
          "bytes": 14,
          "sha256": "55dedf69f116ced76402f0d179cc702d8d9e931442aabaf7a64d646205558444"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C08",
      "domainId": "DM-C08",
      "schemaId": "SCHEMA-C08-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C08.before.bin",
          "bytesHex": "7b226f6666736574223a337d",
          "bytes": 12,
          "sha256": "e0c18692ad5cfd79714fd3c3d438ad24e7f13b22c35ee8f99e07e059ee443e28"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C08.after.bin",
          "bytesHex": "7b226f6666736574223a327d",
          "bytes": 12,
          "sha256": "f7072d781d5e6fabadaa6577460b0341495bb307ce0285865a06567993bd3442"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C09",
      "domainId": "DM-C09",
      "schemaId": "SCHEMA-C09-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C09.before.bin",
          "bytesHex": "7b226576656e7473223a5b7b226f6363757272656e6365223a307d5d7d",
          "bytes": 29,
          "sha256": "d5ee65ef58dbfc2b93bb20d1af6489a2ee32bc3c509fac83570e356fc1a55497"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C09.after.bin",
          "bytesHex": "7b226576656e7473223a5b7b226f6363757272656e6365223a317d5d7d",
          "bytes": 29,
          "sha256": "c55b99da1cefcdd7b994454a93ff390e0783e664cdec1d0507cacb78be33a43b"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C10",
      "domainId": "DM-C10",
      "schemaId": "SCHEMA-C10-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C10.before.bin",
          "bytesHex": "7b2263616e646964617465223a7b22726f6c65223a2263616e646964617465227d7d",
          "bytes": 34,
          "sha256": "36e5b7b7ed4c8f974a02b5b90da2e31d655894fc12a6c4363d501a0c29006b2c"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C10.after.bin",
          "bytesHex": "7b2263616e646964617465223a7b22726f6c65223a22636f6e74726f6c227d7d",
          "bytes": 32,
          "sha256": "0f41447ef44e1b1a4defaec34072a1d65c993ae2cbe6d00e4bb13b102b4856ca"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C11",
      "domainId": "DM-C11",
      "schemaId": "SCHEMA-C11-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C11.before.bin",
          "bytesHex": "7b22696e70757444657363726970746f7273223a5b7b2273697a65223a317d5d7d",
          "bytes": 33,
          "sha256": "6a051ccf1857d7e081addf115121107b2a5b74d303af231624507c8299a8aa89"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C11.after.bin",
          "bytesHex": "7b22696e70757444657363726970746f7273223a5b7b2273697a65223a327d5d7d",
          "bytes": 33,
          "sha256": "23faa9b4c159f00ba8a6c76591592c31f81edf3e64fb98ab20750473fdcb406e"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C12",
      "domainId": "DM-C12",
      "schemaId": "SCHEMA-C12-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C12.before.bin",
          "bytesHex": "7b2263617074757265223a7b226172677630223a222f6f70742f6e6f6465227d7d",
          "bytes": 33,
          "sha256": "738394974f061bacd77775d5e81898561ba12830725c765656a986828708da78"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C12.after.bin",
          "bytesHex": "7b2263617074757265223a7b226172677630223a222f6f70742f6e6f64652d6d7574616e74227d7d",
          "bytes": 40,
          "sha256": "10653ffa84b3d8a29d4404288a6f17f294e2468f8b4ca9bc222063133e171e96"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C13",
      "domainId": "DM-C13",
      "schemaId": "SCHEMA-C13-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C13.before.bin",
          "bytesHex": "7b2263616e646964617465223a7b226368726f6e6f6c6f67794f7264696e616c223a317d7d",
          "bytes": 37,
          "sha256": "940e95645f08fb0f6f003d7eb0bf1a992d502b10aed23a465633ed0aec8ca163"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C13.after.bin",
          "bytesHex": "7b2263616e646964617465223a7b226368726f6e6f6c6f67794f7264696e616c223a337d7d",
          "bytes": 37,
          "sha256": "0d56fefddb77f1bd3219c266463dc9cf7101064ad2e2c9f0221ff3c9cd4c2636"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C14",
      "domainId": "DM-C14",
      "schemaId": "SCHEMA-C14-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C14.before.bin",
          "bytesHex": "7b226361706162696c69747953757266616365496473223a5b5d7d",
          "bytes": 27,
          "sha256": "c1e3de0b34cfd4907b913bf90b06c04d2d2e7e251069a7e39fb9ead8e9fa106c"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C14.after.bin",
          "bytesHex": "7b226361706162696c69747953757266616365496473223a5b226e6574776f726b3a616e79225d7d",
          "bytes": 40,
          "sha256": "15178d19c45f218d40c27a805a93cf59f1fa2f138a1eae7352b0bfea57b89e3c"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C15",
      "domainId": "DM-C15",
      "schemaId": "SCHEMA-C15-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C15.before.bin",
          "bytesHex": "7b2263616c6c6261636b436c6f73757265526f6f74223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
          "bytes": 90,
          "sha256": "46de9bd5096559b15f3db442907e239f570c6505631cd32ace0b40711d0584ce"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C15.after.bin",
          "bytesHex": "7b2263616c6c6261636b436c6f73757265526f6f74223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
          "bytes": 90,
          "sha256": "1fb683b4bfd11ae4aad4102ee572421547195b54e9d808885374756ae3f6973f"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C16",
      "domainId": "DM-C16",
      "schemaId": "SCHEMA-C16-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C16.before.bin",
          "bytesHex": "7b226166746572223a7b2266696c6544657363726970746f7273223a5b302c312c325d7d7d",
          "bytes": 37,
          "sha256": "86a37ddf33bbe434e5b8d550311c6e426a56c58d3c9860cfa45ccb12f88e6cb7"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C16.after.bin",
          "bytesHex": "7b226166746572223a7b2266696c6544657363726970746f7273223a5b302c312c322c39395d7d7d",
          "bytes": 40,
          "sha256": "3ee559e51f3340d288ae7dd9ce5415e5f287bdb93d5cf997df313dcdca0bb792"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C17",
      "domainId": "DM-C17",
      "schemaId": "SCHEMA-C17-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C17.before.bin",
          "bytesHex": "7b2264657363726970746f7273223a7b2270726f64756374223a747275657d7d",
          "bytes": 32,
          "sha256": "6ecbb2be83a6a02f3203905b173301e21a92175c65a9a5b4a03b9ca1c872ac4c"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C17.after.bin",
          "bytesHex": "7b2264657363726970746f7273223a7b7d7d",
          "bytes": 18,
          "sha256": "d9d1dd02acb2e9abd0c558b1911d71528256a20a22e5006155533f4c7fa97cb2"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C18",
      "domainId": "DM-C18",
      "schemaId": "SCHEMA-C18-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C18.before.bin",
          "bytesHex": "7b226f62736572766174696f6e5365616c526f6f74223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
          "bytes": 90,
          "sha256": "46e97721913a5a962555e528a6e2ef4788cf6ffd72cb4b4de69fd8e9cac9b489"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C18.after.bin",
          "bytesHex": "7b226f62736572766174696f6e5365616c526f6f74223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
          "bytes": 90,
          "sha256": "2826697bf79c5aa6ea0295622b65939158dbb21e8a670f673fcd556283a60bc1"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C19",
      "domainId": "DM-C19",
      "schemaId": "SCHEMA-C19-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C19.before.bin",
          "bytesHex": "7b2272656365697074223a7b226f62736572766174696f6e5365616c526f6f74223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d",
          "bytes": 102,
          "sha256": "0842506ce41ca21af5b662f395b1ba4d748ac78771416a499d71a23530ca0345"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C19.after.bin",
          "bytesHex": "7b2272656365697074223a7b226f62736572766174696f6e5365616c526f6f74223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d",
          "bytes": 102,
          "sha256": "92e26b7ca5d5549650c44e6670e5298b2fe0d740d0abbc841d1a41fb21259d02"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C20",
      "domainId": "DM-C20",
      "schemaId": "SCHEMA-C20-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C20.before.bin",
          "bytesHex": "7b2261223a317d",
          "bytes": 7,
          "sha256": "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C20.after.bin",
          "bytesHex": "7b2261223a312c2261223a327d",
          "bytes": 13,
          "sha256": "1c53ee0df7b12fd4d65b976120c7fa6b847dc41dffd7f0331c3237a1ceab1756"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C21",
      "domainId": "DM-C21",
      "schemaId": "SCHEMA-C21-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C21.before.bin",
          "bytesHex": "7b2278223a7b2261223a317d7d",
          "bytes": 13,
          "sha256": "9568cb6e932779f25ed1080bf2ed0d20022373cf27187f3a64a24c717bc13950"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C21.after.bin",
          "bytesHex": "7b2278223a7b2261223a312c2261223a327d7d",
          "bytes": 19,
          "sha256": "06d55db68c2ab40693c6dbd8e3d358b352a269731d9ead4defe3e067a6eb6af7"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C22",
      "domainId": "DM-C22",
      "schemaId": "SCHEMA-C22-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C22.before.bin",
          "bytesHex": "222f22",
          "bytes": 3,
          "sha256": "df7e940f72aa93cbcb6d70cc35124b0767c7a0e353043c7c24b660ea9be7b952"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C22.after.bin",
          "bytesHex": "225c2f22",
          "bytes": 4,
          "sha256": "7040fb3de3d569faa7bf72a920e4375290a0c4333d824ccc47c3e3e5ffcdaab5"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C23",
      "domainId": "DM-C23",
      "schemaId": "SCHEMA-C23-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C23.before.bin",
          "bytesHex": "225c753030666622",
          "bytes": 8,
          "sha256": "e63d8a91f82cd40b18f62aa1790f6df8757dd72b5c93a919c8c11d6b0043ac4d"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C23.after.bin",
          "bytesHex": "225c753030464622",
          "bytes": 8,
          "sha256": "6ce03defa1f190707faf0c56c80e85b76e3d5e7a9ae73ce1799578dbdd1759ba"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C24",
      "domainId": "DM-C24",
      "schemaId": "SCHEMA-C24-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C24.before.bin",
          "bytesHex": "225c6e22",
          "bytes": 4,
          "sha256": "d7a5e915306d21dc1937ad5616f1dc9682e759e75ef51dd05fd9ddc98a078ea1"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C24.after.bin",
          "bytesHex": "225c753030306122",
          "bytes": 8,
          "sha256": "46f7b04715e2e1f162a9f3cb90a946a48e653b15117c2de6ed7cf60c029d2219"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C25",
      "domainId": "DM-C25",
      "schemaId": "SCHEMA-C25-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C25.before.bin",
          "bytesHex": "7b2261223a312c2262223a327d",
          "bytes": 13,
          "sha256": "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C25.after.bin",
          "bytesHex": "7b2262223a322c2261223a317d",
          "bytes": 13,
          "sha256": "3fb75453225c732a76b7899ea2096dda1455189c89817239732182f73fe5a09f"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C26",
      "domainId": "DM-C26",
      "schemaId": "SCHEMA-C26-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C26.before.bin",
          "bytesHex": "30",
          "bytes": 1,
          "sha256": "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C26.after.bin",
          "bytesHex": "3030",
          "bytes": 2,
          "sha256": "f1534392279bddbf9d43dde8701cb5be14b82f76ec6607bf8d6ad557f60f304e"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C27",
      "domainId": "DM-C27",
      "schemaId": "SCHEMA-C27-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C27.before.bin",
          "bytesHex": "efbfbd",
          "bytes": 3,
          "sha256": "83d544ccc223c057d2bf80d3f2a32982c32c3c0db8e2674820da5064783fb097"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C27.after.bin",
          "bytesHex": "eda080",
          "bytes": 3,
          "sha256": "91a681b998555fb475479817b126c94e57e52011fa1842c5d188795a4a05226b"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C28",
      "domainId": "DM-C28",
      "schemaId": "SCHEMA-C28-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C28.before.bin",
          "bytesHex": "7b2261223a317d",
          "bytes": 7,
          "sha256": "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C28.after.bin",
          "bytesHex": "207b2261223a317d",
          "bytes": 8,
          "sha256": "3b48504afb5cf21924953df99e5b1b3210705a89dc4e60e291371ed395083730"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C29",
      "domainId": "DM-C29",
      "schemaId": "SCHEMA-C29-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C29.before.bin",
          "bytesHex": "7b2224223a22706f696e74222c226174223a307d",
          "bytes": 20,
          "sha256": "1682c75ee9c9e6e2ad0f984a14fd9bd8e08d4da016cd0ca57c0b706a1b68a171"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C29.after.bin",
          "bytesHex": "7b2224223a22756e6b6e6f776e222c226174223a307d",
          "bytes": 22,
          "sha256": "47ac97bdd184ad5542f777e463e6bc225284c803afe82b2defeb549cec355d33"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C30",
      "domainId": "DM-C30",
      "schemaId": "SCHEMA-C30-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C30.before.bin",
          "bytesHex": "7b226d6f64756c65536574223a5b225030222c225031222c225032222c225033222c225034222c225035222c225036222c225037225d7d",
          "bytes": 55,
          "sha256": "98c0c9f04b66b0043709691b18289e607ceeddcd69878b5ebebd9907cdc97f27"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C30.after.bin",
          "bytesHex": "7b226d6f64756c65536574223a5b225030222c225031222c225032222c225033222c225034222c225035222c225036222c225037222c225038225d7d",
          "bytes": 60,
          "sha256": "36fdbca2d2becef86566dcae9a411cb31135f89c072eb4442403dbb707fdc91f"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C31",
      "domainId": "DM-C31",
      "schemaId": "SCHEMA-C31-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C31.before.bin",
          "bytesHex": "7b22736f7572636548617368223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
          "bytes": 81,
          "sha256": "30869d35b828d751c1a26cb015eb08c1c3cfe14552529a18ee67cc2f9493bf90"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C31.after.bin",
          "bytesHex": "7b22736f7572636548617368223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
          "bytes": 81,
          "sha256": "7740dcb134cb3ec1db3d19fb69a851cc50cadd47b2c9a6ce87f9e0d33f1b0dea"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C32",
      "domainId": "DM-C32",
      "schemaId": "SCHEMA-C32-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C32.before.bin",
          "bytesHex": "00",
          "bytes": 1,
          "sha256": "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C32.after.bin",
          "bytesHex": "01",
          "bytes": 1,
          "sha256": "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C33",
      "domainId": "DM-C33",
      "schemaId": "SCHEMA-C33-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C33.before.bin",
          "bytesHex": "7b226564676573223a7b22453236223a747275657d7d",
          "bytes": 22,
          "sha256": "4dd6f8e2eb5a8f7d7eb51bf423c1f7e77b5ce00ca0060784dc1d8b2011656523"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C33.after.bin",
          "bytesHex": "7b226564676573223a7b7d7d",
          "bytes": 12,
          "sha256": "d0033617a14f4c8342e0fc856000919d5590d5d514d94db70dc19f1c44b0f1ee"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C34",
      "domainId": "DM-C34",
      "schemaId": "SCHEMA-C34-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C34.before.bin",
          "bytesHex": "7b226564676573223a7b22453236223a7b22646972656374696f6e223a2250302d3e5035227d7d7d",
          "bytes": 40,
          "sha256": "c2d517519067c80763325717d2d6c379eeec2806a4d5dac866df70b6b45b28df"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C34.after.bin",
          "bytesHex": "7b226564676573223a7b22453236223a7b22646972656374696f6e223a2250352d3e5030227d7d7d",
          "bytes": 40,
          "sha256": "9cbe240a89e2747232a5a4beb499c9e5c5f75098cfc7da63e5d89a1d7c3e0893"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C35",
      "domainId": "DM-C35",
      "schemaId": "SCHEMA-C35-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C35.before.bin",
          "bytesHex": "7b22696d706f727473223a5b7b226b696e64223a22737461746963227d5d7d",
          "bytes": 31,
          "sha256": "e72787eddfbbf5f9f987d376a57803f59f9fa1308ce02d72e5d6c1b5755c5ff9"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C35.after.bin",
          "bytesHex": "7b22696d706f727473223a5b7b226b696e64223a2264796e616d6963227d5d7d",
          "bytes": 32,
          "sha256": "b819beaf7e6666574907ae7fe1e8946a080631c06cda1edba050825ca84596a4"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C36",
      "domainId": "DM-C36",
      "schemaId": "SCHEMA-C36-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C36.before.bin",
          "bytesHex": "7b2263616c6c73223a5b22662829225d7d",
          "bytes": 17,
          "sha256": "ca8b98125703115ef9987354c67890e2fade4e895c3ee52dd6162612c8850691"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C36.after.bin",
          "bytesHex": "7b2263616c6c73223a5b226576616c2866282929225d7d",
          "bytes": 23,
          "sha256": "3fbb45338d9f7fe44410412d8055ace055bd748ec5232ce5524146d2e799d2a5"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C37",
      "domainId": "DM-C37",
      "schemaId": "SCHEMA-C37-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C37.before.bin",
          "bytesHex": "7b226d656d626572416363657373223a5b226f2e78225d7d",
          "bytes": 24,
          "sha256": "fe8d2a7a954913fc985a63ff1bfc24fb3bc746c3e07c38a1b5a2e05974d49c77"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C37.after.bin",
          "bytesHex": "7b226d656d626572416363657373223a5b225265666c6563742e676574286f2c7829225d7d",
          "bytes": 37,
          "sha256": "3adc0899fb6115cf669e00036ed1f121822e5f516e43523a179793b76f9e2440"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C38",
      "domainId": "DM-C38",
      "schemaId": "SCHEMA-C38-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C38.before.bin",
          "bytesHex": "7b22646570656e64656e63794772617068223a7b22646570656e64656e63792d30223a226465636c61726564227d7d",
          "bytes": 47,
          "sha256": "76b8262d606376b7b42a88c8be3869dbabae6bebfacc38256c58bc8b54163b05"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C38.after.bin",
          "bytesHex": "7b22646570656e64656e63794772617068223a7b22646570656e64656e63792d30223a226f6d6974746564227d7d",
          "bytes": 46,
          "sha256": "d2116d17e3aee0910a13990ab2f583ff1cc704b230c14d361ff09629ed95dfa7"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C39",
      "domainId": "DM-C39",
      "schemaId": "SCHEMA-C39-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C39.before.bin",
          "bytesHex": "7b2272756e74696d65223a7b22737562737472617465223a22646972656374227d7d",
          "bytes": 34,
          "sha256": "e098e3f78eb6f111e83ef1bb2683de43c31fd1f902f613b9a61c801f802768ab"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C39.after.bin",
          "bytesHex": "7b2272756e74696d65223a7b22737562737472617465223a226576656e74546170652b70726f6a656374696f6e227d7d",
          "bytes": 48,
          "sha256": "87ec2883779b147671e22987c39e538746751c622e6f10173a9c9e5e7bb9bc96"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C40",
      "domainId": "DM-C40",
      "schemaId": "SCHEMA-C40-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C40.before.bin",
          "bytesHex": "7b226d6f64756c6573223a7b225035223a7b22636861726765644c6f63223a38357d7d7d",
          "bytes": 36,
          "sha256": "679b720aba6bd9213c3701b17f79d987f2b005af3ba08b32a8854b945b565fd2"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C40.after.bin",
          "bytesHex": "7b226d6f64756c6573223a7b225035223a7b22636861726765644c6f63223a38367d7d7d",
          "bytes": 36,
          "sha256": "046375f911b35789fd8a0830abf597a02c74003b02021f1eab2c18a4d666056f"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C41",
      "domainId": "DM-C41",
      "schemaId": "SCHEMA-C41-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C41.before.bin",
          "bytesHex": "7b22746f74616c436861726765644c6f63223a3835307d",
          "bytes": 23,
          "sha256": "86bb08de33ce38157f80ab1f9c57dc90b37a06c39bb654136d5c890044bf90cf"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C41.after.bin",
          "bytesHex": "7b22746f74616c436861726765644c6f63223a3835317d",
          "bytes": 23,
          "sha256": "ecc09afb9503c0efa7f73f1897a227cb99b1b1ea24dcd2561b6149736dd8dda9"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C42",
      "domainId": "DM-C42",
      "schemaId": "SCHEMA-C42-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C42.before.bin",
          "bytesHex": "7b22617374546f6f6c223a7b22736861323536223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d",
          "bytes": 89,
          "sha256": "c83b0128ec3f7900ad59ec3bb2dc1c2d57ad0ed4d36e081d8ca63e399c374f3d"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C42.after.bin",
          "bytesHex": "7b22617374546f6f6c223a7b22736861323536223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d",
          "bytes": 89,
          "sha256": "7317552a8b62bde861bed494ff4ee4857b96fa6d98de604862b7dde7e80d8b17"
        }
      ],
      "memberCardinality": 2
    },
    {
      "fixtureId": "FX-C43",
      "domainId": "DM-C43",
      "schemaId": "SCHEMA-C43-V1",
      "members": [
        {
          "role": "BASELINE",
          "path": "fixtures/C43.before.bin",
          "bytesHex": "7b22636c61696d223a7b22736f757263654a6f696e223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d",
          "bytes": 91,
          "sha256": "5d63b4a2d9c2c892819cffd7a0370d6a2fb2198c67abe86c9da83a0e593b7b3e"
        },
        {
          "role": "AUDIT_MUTANT",
          "path": "fixtures/C43.after.bin",
          "bytesHex": "7b22636c61696d223a7b22736f757263654a6f696e223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d",
          "bytes": 91,
          "sha256": "50afc088b8f7f05aceb36a28249675ce505433ccad27026a3e7329e29c973d9f"
        }
      ],
      "memberCardinality": 2
    }
  ],
  "domains": [
    {
      "domainId": "DM-C01",
      "fixtureId": "FX-C01",
      "schemaId": "SCHEMA-C01-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/declarationSha256",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 21,
        "beforeByteLength": 66,
        "afterByteStart": 21,
        "afterByteLength": 66,
        "valueBeforeHex": "223030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022",
        "valueAfterHex": "223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "FLIP_BIT_0",
        "inputMemberPath": "fixtures/C01.before.bin",
        "outputMemberPath": "fixtures/C01.after.bin",
        "mask": {
          "beforeStart": 22,
          "beforeLength": 1,
          "afterStart": 22,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "264485eba433ab7c84b30025b3e01b5e04b2bf983687d88e32e46fe9ac40c759"
      },
      "measuredComplement": {
        "prefixBytes": 22,
        "suffixBytes": 65,
        "bytesHex": "7b226465636c61726174696f6e536861323536223a22303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
        "sha256": "62b550f9337ca70562e5e1e699f7fa334b062f2cfa7e20004ee50a47b98ccee4"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C01/members/BASELINE/sha256",
          "before": "2c5315a0d6d5f54a747aa21f1f1aaa8beee24a29941ee9f2c65102acfd2a9576",
          "after": "2c5315a0d6d5f54a747aa21f1f1aaa8beee24a29941ee9f2c65102acfd2a9576",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C01/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "264485eba433ab7c84b30025b3e01b5e04b2bf983687d88e32e46fe9ac40c759",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C01/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "264485eba433ab7c84b30025b3e01b5e04b2bf983687d88e32e46fe9ac40c759",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C02",
      "fixtureId": "FX-C02",
      "schemaId": "SCHEMA-C02-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/ledgerRoot",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 14,
        "beforeByteLength": 66,
        "afterByteStart": 14,
        "afterByteLength": 66,
        "valueBeforeHex": "223030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022",
        "valueAfterHex": "223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "FLIP_BIT_0",
        "inputMemberPath": "fixtures/C02.before.bin",
        "outputMemberPath": "fixtures/C02.after.bin",
        "mask": {
          "beforeStart": 15,
          "beforeLength": 1,
          "afterStart": 15,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "67b72fff833f63b27bea25e48f249ff432d979c8854291f976bf8c8dd1622dda"
      },
      "measuredComplement": {
        "prefixBytes": 15,
        "suffixBytes": 65,
        "bytesHex": "7b226c6564676572526f6f74223a22303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
        "sha256": "88958b48a5cb43a7d349f676b027ecbf4237c74bfe48b8a92d313bc3159df049"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C02/members/BASELINE/sha256",
          "before": "cc1e0669ddc5566b01412bd9c594e9810fb9606f221f00ec17bd843fb800dd32",
          "after": "cc1e0669ddc5566b01412bd9c594e9810fb9606f221f00ec17bd843fb800dd32",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C02/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "67b72fff833f63b27bea25e48f249ff432d979c8854291f976bf8c8dd1622dda",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C02/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "67b72fff833f63b27bea25e48f249ff432d979c8854291f976bf8c8dd1622dda",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C03",
      "fixtureId": "FX-C03",
      "schemaId": "SCHEMA-C03-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/versions/1/parentVersion",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 33,
        "beforeByteLength": 1,
        "afterByteStart": 33,
        "afterByteLength": 1,
        "valueBeforeHex": "30",
        "valueAfterHex": "31"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SET_CANONICAL_U53",
        "inputMemberPath": "fixtures/C03.before.bin",
        "outputMemberPath": "fixtures/C03.after.bin",
        "mask": {
          "beforeStart": 33,
          "beforeLength": 1,
          "afterStart": 33,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "3ef7284745d6eafa9bcb8cab00dc2bff4f4567a7b037940e8dd6bae1698d6692"
      },
      "measuredComplement": {
        "prefixBytes": 33,
        "suffixBytes": 3,
        "bytesHex": "7b2276657273696f6e73223a5b7b7d2c7b22706172656e7456657273696f6e223a7d5d7d",
        "sha256": "a81d078f6be4b5efb92f171d4cdcb87cff56b7c06969a83d1b6e4a362147b0ab"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C03/members/BASELINE/sha256",
          "before": "0c5418f031278eb40c418c485119f4bfe8ce561f89dfcd81bad9a69b9f032ad1",
          "after": "0c5418f031278eb40c418c485119f4bfe8ce561f89dfcd81bad9a69b9f032ad1",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C03/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "3ef7284745d6eafa9bcb8cab00dc2bff4f4567a7b037940e8dd6bae1698d6692",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C03/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "3ef7284745d6eafa9bcb8cab00dc2bff4f4567a7b037940e8dd6bae1698d6692",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C04",
      "fixtureId": "FX-C04",
      "schemaId": "SCHEMA-C04-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/effectIdentities/0/ordinal",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 32,
        "beforeByteLength": 1,
        "afterByteStart": 32,
        "afterByteLength": 1,
        "valueBeforeHex": "30",
        "valueAfterHex": "31"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SET_CANONICAL_U53",
        "inputMemberPath": "fixtures/C04.before.bin",
        "outputMemberPath": "fixtures/C04.after.bin",
        "mask": {
          "beforeStart": 32,
          "beforeLength": 1,
          "afterStart": 32,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "ce5ea1739aa1ef5383224667bc7bc160e7259b9aec6ae8ac9e2794a5e10bb756"
      },
      "measuredComplement": {
        "prefixBytes": 32,
        "suffixBytes": 3,
        "bytesHex": "7b226566666563744964656e746974696573223a5b7b226f7264696e616c223a7d5d7d",
        "sha256": "1d5507fd9a902f42c79a80258c9497bfc354eb5c05bc4fcd0b98700938e0f5ce"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C04/members/BASELINE/sha256",
          "before": "f70ac3844624cbd8adf52e216908c14fc75a7004683aefc71c665c69ca266a38",
          "after": "f70ac3844624cbd8adf52e216908c14fc75a7004683aefc71c665c69ca266a38",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C04/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "ce5ea1739aa1ef5383224667bc7bc160e7259b9aec6ae8ac9e2794a5e10bb756",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C04/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "ce5ea1739aa1ef5383224667bc7bc160e7259b9aec6ae8ac9e2794a5e10bb756",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C05",
      "fixtureId": "FX-C05",
      "schemaId": "SCHEMA-C05-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/rowOrdinal",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 14,
        "beforeByteLength": 1,
        "afterByteStart": 14,
        "afterByteLength": 1,
        "valueBeforeHex": "30",
        "valueAfterHex": "31"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SET_CANONICAL_U53",
        "inputMemberPath": "fixtures/C05.before.bin",
        "outputMemberPath": "fixtures/C05.after.bin",
        "mask": {
          "beforeStart": 14,
          "beforeLength": 1,
          "afterStart": 14,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "8ab3dda1ce8123e4cdfccb277dbc4def62143da1cbcb7123a7093b1a2c6ed768"
      },
      "measuredComplement": {
        "prefixBytes": 14,
        "suffixBytes": 1,
        "bytesHex": "7b22726f774f7264696e616c223a7d",
        "sha256": "18af172aaa4c86ba80552f50125d045ca0c3acc430c85d6a7233a1353b13efc9"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C05/members/BASELINE/sha256",
          "before": "cbceb9b98bb85d3fa9e08917b14783f5ff846d22cc3a57e4fbf0bdcea1316374",
          "after": "cbceb9b98bb85d3fa9e08917b14783f5ff846d22cc3a57e4fbf0bdcea1316374",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C05/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "8ab3dda1ce8123e4cdfccb277dbc4def62143da1cbcb7123a7093b1a2c6ed768",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C05/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "8ab3dda1ce8123e4cdfccb277dbc4def62143da1cbcb7123a7093b1a2c6ed768",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C06",
      "fixtureId": "FX-C06",
      "schemaId": "SCHEMA-C06-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/edits/0/startUtf16",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 24,
        "beforeByteLength": 1,
        "afterByteStart": 24,
        "afterByteLength": 1,
        "valueBeforeHex": "31",
        "valueAfterHex": "32"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SET_CANONICAL_U53",
        "inputMemberPath": "fixtures/C06.before.bin",
        "outputMemberPath": "fixtures/C06.after.bin",
        "mask": {
          "beforeStart": 24,
          "beforeLength": 1,
          "afterStart": 24,
          "afterLength": 1
        },
        "insertHex": "32",
        "expectedOutputSha256": "8316c7b67455af3b84aa55396d8e6c92c9937736eed43e9ea9847827220073f2"
      },
      "measuredComplement": {
        "prefixBytes": 24,
        "suffixBytes": 3,
        "bytesHex": "7b226564697473223a5b7b2273746172745574663136223a7d5d7d",
        "sha256": "62d48add740217c1f570e9eae29d41901bae43c23674f1fa44b94153aef0ffe5"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C06/members/BASELINE/sha256",
          "before": "04c1ba0b0f19189f7f260caf32e59dab8336a2e9714c54d6ebaa1539a9a96f00",
          "after": "04c1ba0b0f19189f7f260caf32e59dab8336a2e9714c54d6ebaa1539a9a96f00",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C06/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "8316c7b67455af3b84aa55396d8e6c92c9937736eed43e9ea9847827220073f2",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C06/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "8316c7b67455af3b84aa55396d8e6c92c9937736eed43e9ea9847827220073f2",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C07",
      "fixtureId": "FX-C07",
      "schemaId": "SCHEMA-C07-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/maxDepth",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 12,
        "beforeByteLength": 1,
        "afterByteStart": 12,
        "afterByteLength": 1,
        "valueBeforeHex": "34",
        "valueAfterHex": "35"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SET_CANONICAL_U53",
        "inputMemberPath": "fixtures/C07.before.bin",
        "outputMemberPath": "fixtures/C07.after.bin",
        "mask": {
          "beforeStart": 12,
          "beforeLength": 1,
          "afterStart": 12,
          "afterLength": 1
        },
        "insertHex": "35",
        "expectedOutputSha256": "55dedf69f116ced76402f0d179cc702d8d9e931442aabaf7a64d646205558444"
      },
      "measuredComplement": {
        "prefixBytes": 12,
        "suffixBytes": 1,
        "bytesHex": "7b226d61784465707468223a7d",
        "sha256": "9cfcdc1235d487ecb13774116732256046ed1849d2b97fc2b4823a4f9b0b422d"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C07/members/BASELINE/sha256",
          "before": "040930e3e463ca54c9cabb2515ba2a0e4e7b724347d35b2655b7c8ada09255f6",
          "after": "040930e3e463ca54c9cabb2515ba2a0e4e7b724347d35b2655b7c8ada09255f6",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C07/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "55dedf69f116ced76402f0d179cc702d8d9e931442aabaf7a64d646205558444",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C07/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "55dedf69f116ced76402f0d179cc702d8d9e931442aabaf7a64d646205558444",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C08",
      "fixtureId": "FX-C08",
      "schemaId": "SCHEMA-C08-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/offset",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 10,
        "beforeByteLength": 1,
        "afterByteStart": 10,
        "afterByteLength": 1,
        "valueBeforeHex": "33",
        "valueAfterHex": "32"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SET_CANONICAL_U53",
        "inputMemberPath": "fixtures/C08.before.bin",
        "outputMemberPath": "fixtures/C08.after.bin",
        "mask": {
          "beforeStart": 10,
          "beforeLength": 1,
          "afterStart": 10,
          "afterLength": 1
        },
        "insertHex": "32",
        "expectedOutputSha256": "f7072d781d5e6fabadaa6577460b0341495bb307ce0285865a06567993bd3442"
      },
      "measuredComplement": {
        "prefixBytes": 10,
        "suffixBytes": 1,
        "bytesHex": "7b226f6666736574223a7d",
        "sha256": "73d1d371e22050c5a9e5f5cfda1a685f702102d78bbccae1fe3582a7d2de1cfe"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C08/members/BASELINE/sha256",
          "before": "e0c18692ad5cfd79714fd3c3d438ad24e7f13b22c35ee8f99e07e059ee443e28",
          "after": "e0c18692ad5cfd79714fd3c3d438ad24e7f13b22c35ee8f99e07e059ee443e28",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C08/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "f7072d781d5e6fabadaa6577460b0341495bb307ce0285865a06567993bd3442",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C08/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "f7072d781d5e6fabadaa6577460b0341495bb307ce0285865a06567993bd3442",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C09",
      "fixtureId": "FX-C09",
      "schemaId": "SCHEMA-C09-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/events/0/occurrence",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 25,
        "beforeByteLength": 1,
        "afterByteStart": 25,
        "afterByteLength": 1,
        "valueBeforeHex": "30",
        "valueAfterHex": "31"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SET_CANONICAL_U53",
        "inputMemberPath": "fixtures/C09.before.bin",
        "outputMemberPath": "fixtures/C09.after.bin",
        "mask": {
          "beforeStart": 25,
          "beforeLength": 1,
          "afterStart": 25,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "c55b99da1cefcdd7b994454a93ff390e0783e664cdec1d0507cacb78be33a43b"
      },
      "measuredComplement": {
        "prefixBytes": 25,
        "suffixBytes": 3,
        "bytesHex": "7b226576656e7473223a5b7b226f6363757272656e6365223a7d5d7d",
        "sha256": "5111ee3c16567453ba65f6a5dde8a9738dc4cc5442145801f675e2527a977ce5"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C09/members/BASELINE/sha256",
          "before": "d5ee65ef58dbfc2b93bb20d1af6489a2ee32bc3c509fac83570e356fc1a55497",
          "after": "d5ee65ef58dbfc2b93bb20d1af6489a2ee32bc3c509fac83570e356fc1a55497",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C09/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "c55b99da1cefcdd7b994454a93ff390e0783e664cdec1d0507cacb78be33a43b",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C09/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "c55b99da1cefcdd7b994454a93ff390e0783e664cdec1d0507cacb78be33a43b",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C10",
      "fixtureId": "FX-C10",
      "schemaId": "SCHEMA-C10-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/candidate/role",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 21,
        "beforeByteLength": 11,
        "afterByteStart": 21,
        "afterByteLength": 9,
        "valueBeforeHex": "2263616e64696461746522",
        "valueAfterHex": "22636f6e74726f6c22"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SET_CANONICAL_STRING",
        "inputMemberPath": "fixtures/C10.before.bin",
        "outputMemberPath": "fixtures/C10.after.bin",
        "mask": {
          "beforeStart": 23,
          "beforeLength": 8,
          "afterStart": 23,
          "afterLength": 6
        },
        "insertHex": "6f6e74726f6c",
        "expectedOutputSha256": "0f41447ef44e1b1a4defaec34072a1d65c993ae2cbe6d00e4bb13b102b4856ca"
      },
      "measuredComplement": {
        "prefixBytes": 23,
        "suffixBytes": 3,
        "bytesHex": "7b2263616e646964617465223a7b22726f6c65223a2263227d7d",
        "sha256": "ab7a03943d9fd77745551ba9aa6dc242bb87a9394367e25a70351e59ff51925f"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C10/members/BASELINE/sha256",
          "before": "36e5b7b7ed4c8f974a02b5b90da2e31d655894fc12a6c4363d501a0c29006b2c",
          "after": "36e5b7b7ed4c8f974a02b5b90da2e31d655894fc12a6c4363d501a0c29006b2c",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C10/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "0f41447ef44e1b1a4defaec34072a1d65c993ae2cbe6d00e4bb13b102b4856ca",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C10/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "0f41447ef44e1b1a4defaec34072a1d65c993ae2cbe6d00e4bb13b102b4856ca",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C11",
      "fixtureId": "FX-C11",
      "schemaId": "SCHEMA-C11-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/inputDescriptors/0/size",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 29,
        "beforeByteLength": 1,
        "afterByteStart": 29,
        "afterByteLength": 1,
        "valueBeforeHex": "31",
        "valueAfterHex": "32"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SET_CANONICAL_U53",
        "inputMemberPath": "fixtures/C11.before.bin",
        "outputMemberPath": "fixtures/C11.after.bin",
        "mask": {
          "beforeStart": 29,
          "beforeLength": 1,
          "afterStart": 29,
          "afterLength": 1
        },
        "insertHex": "32",
        "expectedOutputSha256": "23faa9b4c159f00ba8a6c76591592c31f81edf3e64fb98ab20750473fdcb406e"
      },
      "measuredComplement": {
        "prefixBytes": 29,
        "suffixBytes": 3,
        "bytesHex": "7b22696e70757444657363726970746f7273223a5b7b2273697a65223a7d5d7d",
        "sha256": "031585d57ecbb814521104da26ed267fa1cecf9a6c38334c66cb4312db19cd50"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C11/members/BASELINE/sha256",
          "before": "6a051ccf1857d7e081addf115121107b2a5b74d303af231624507c8299a8aa89",
          "after": "6a051ccf1857d7e081addf115121107b2a5b74d303af231624507c8299a8aa89",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C11/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "23faa9b4c159f00ba8a6c76591592c31f81edf3e64fb98ab20750473fdcb406e",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C11/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "23faa9b4c159f00ba8a6c76591592c31f81edf3e64fb98ab20750473fdcb406e",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C12",
      "fixtureId": "FX-C12",
      "schemaId": "SCHEMA-C12-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/capture/argv0",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 20,
        "beforeByteLength": 11,
        "afterByteStart": 20,
        "afterByteLength": 18,
        "valueBeforeHex": "222f6f70742f6e6f646522",
        "valueAfterHex": "222f6f70742f6e6f64652d6d7574616e7422"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "APPEND_UTF8",
        "inputMemberPath": "fixtures/C12.before.bin",
        "outputMemberPath": "fixtures/C12.after.bin",
        "mask": {
          "beforeStart": 30,
          "beforeLength": 0,
          "afterStart": 30,
          "afterLength": 7
        },
        "insertHex": "2d6d7574616e74",
        "expectedOutputSha256": "10653ffa84b3d8a29d4404288a6f17f294e2468f8b4ca9bc222063133e171e96"
      },
      "measuredComplement": {
        "prefixBytes": 30,
        "suffixBytes": 3,
        "bytesHex": "7b2263617074757265223a7b226172677630223a222f6f70742f6e6f6465227d7d",
        "sha256": "738394974f061bacd77775d5e81898561ba12830725c765656a986828708da78"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C12/members/BASELINE/sha256",
          "before": "738394974f061bacd77775d5e81898561ba12830725c765656a986828708da78",
          "after": "738394974f061bacd77775d5e81898561ba12830725c765656a986828708da78",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C12/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "10653ffa84b3d8a29d4404288a6f17f294e2468f8b4ca9bc222063133e171e96",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C12/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "10653ffa84b3d8a29d4404288a6f17f294e2468f8b4ca9bc222063133e171e96",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C13",
      "fixtureId": "FX-C13",
      "schemaId": "SCHEMA-C13-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/candidate/chronologyOrdinal",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 34,
        "beforeByteLength": 1,
        "afterByteStart": 34,
        "afterByteLength": 1,
        "valueBeforeHex": "31",
        "valueAfterHex": "33"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SET_CANONICAL_U53",
        "inputMemberPath": "fixtures/C13.before.bin",
        "outputMemberPath": "fixtures/C13.after.bin",
        "mask": {
          "beforeStart": 34,
          "beforeLength": 1,
          "afterStart": 34,
          "afterLength": 1
        },
        "insertHex": "33",
        "expectedOutputSha256": "0d56fefddb77f1bd3219c266463dc9cf7101064ad2e2c9f0221ff3c9cd4c2636"
      },
      "measuredComplement": {
        "prefixBytes": 34,
        "suffixBytes": 2,
        "bytesHex": "7b2263616e646964617465223a7b226368726f6e6f6c6f67794f7264696e616c223a7d7d",
        "sha256": "256004b043f4b604492dfc041295f922ee93b58ba1b259f4538e421f1811216a"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C13/members/BASELINE/sha256",
          "before": "940e95645f08fb0f6f003d7eb0bf1a992d502b10aed23a465633ed0aec8ca163",
          "after": "940e95645f08fb0f6f003d7eb0bf1a992d502b10aed23a465633ed0aec8ca163",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C13/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "0d56fefddb77f1bd3219c266463dc9cf7101064ad2e2c9f0221ff3c9cd4c2636",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C13/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "0d56fefddb77f1bd3219c266463dc9cf7101064ad2e2c9f0221ff3c9cd4c2636",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C14",
      "fixtureId": "FX-C14",
      "schemaId": "SCHEMA-C14-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/capabilitySurfaceIds",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 24,
        "beforeByteLength": 2,
        "afterByteStart": 24,
        "afterByteLength": 15,
        "valueBeforeHex": "5b5d",
        "valueAfterHex": "5b226e6574776f726b3a616e79225d"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "INSERT_ARRAY_END",
        "inputMemberPath": "fixtures/C14.before.bin",
        "outputMemberPath": "fixtures/C14.after.bin",
        "mask": {
          "beforeStart": 25,
          "beforeLength": 0,
          "afterStart": 25,
          "afterLength": 13
        },
        "insertHex": "226e6574776f726b3a616e7922",
        "expectedOutputSha256": "15178d19c45f218d40c27a805a93cf59f1fa2f138a1eae7352b0bfea57b89e3c"
      },
      "measuredComplement": {
        "prefixBytes": 25,
        "suffixBytes": 2,
        "bytesHex": "7b226361706162696c69747953757266616365496473223a5b5d7d",
        "sha256": "c1e3de0b34cfd4907b913bf90b06c04d2d2e7e251069a7e39fb9ead8e9fa106c"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C14/members/BASELINE/sha256",
          "before": "c1e3de0b34cfd4907b913bf90b06c04d2d2e7e251069a7e39fb9ead8e9fa106c",
          "after": "c1e3de0b34cfd4907b913bf90b06c04d2d2e7e251069a7e39fb9ead8e9fa106c",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C14/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "15178d19c45f218d40c27a805a93cf59f1fa2f138a1eae7352b0bfea57b89e3c",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C14/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "15178d19c45f218d40c27a805a93cf59f1fa2f138a1eae7352b0bfea57b89e3c",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C15",
      "fixtureId": "FX-C15",
      "schemaId": "SCHEMA-C15-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/callbackClosureRoot",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 23,
        "beforeByteLength": 66,
        "afterByteStart": 23,
        "afterByteLength": 66,
        "valueBeforeHex": "223030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022",
        "valueAfterHex": "223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "FLIP_BIT_0",
        "inputMemberPath": "fixtures/C15.before.bin",
        "outputMemberPath": "fixtures/C15.after.bin",
        "mask": {
          "beforeStart": 24,
          "beforeLength": 1,
          "afterStart": 24,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "1fb683b4bfd11ae4aad4102ee572421547195b54e9d808885374756ae3f6973f"
      },
      "measuredComplement": {
        "prefixBytes": 24,
        "suffixBytes": 65,
        "bytesHex": "7b2263616c6c6261636b436c6f73757265526f6f74223a22303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
        "sha256": "852cddc3695240dbd20cd23b638bf57746aba12e8bb8f82e72dd3ea8d6237694"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C15/members/BASELINE/sha256",
          "before": "46de9bd5096559b15f3db442907e239f570c6505631cd32ace0b40711d0584ce",
          "after": "46de9bd5096559b15f3db442907e239f570c6505631cd32ace0b40711d0584ce",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C15/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "1fb683b4bfd11ae4aad4102ee572421547195b54e9d808885374756ae3f6973f",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C15/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "1fb683b4bfd11ae4aad4102ee572421547195b54e9d808885374756ae3f6973f",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C16",
      "fixtureId": "FX-C16",
      "schemaId": "SCHEMA-C16-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/after/fileDescriptors",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 28,
        "beforeByteLength": 7,
        "afterByteStart": 28,
        "afterByteLength": 10,
        "valueBeforeHex": "5b302c312c325d",
        "valueAfterHex": "5b302c312c322c39395d"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "INSERT_ARRAY_END",
        "inputMemberPath": "fixtures/C16.before.bin",
        "outputMemberPath": "fixtures/C16.after.bin",
        "mask": {
          "beforeStart": 34,
          "beforeLength": 0,
          "afterStart": 34,
          "afterLength": 3
        },
        "insertHex": "2c3939",
        "expectedOutputSha256": "3ee559e51f3340d288ae7dd9ce5415e5f287bdb93d5cf997df313dcdca0bb792"
      },
      "measuredComplement": {
        "prefixBytes": 34,
        "suffixBytes": 3,
        "bytesHex": "7b226166746572223a7b2266696c6544657363726970746f7273223a5b302c312c325d7d7d",
        "sha256": "86a37ddf33bbe434e5b8d550311c6e426a56c58d3c9860cfa45ccb12f88e6cb7"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C16/members/BASELINE/sha256",
          "before": "86a37ddf33bbe434e5b8d550311c6e426a56c58d3c9860cfa45ccb12f88e6cb7",
          "after": "86a37ddf33bbe434e5b8d550311c6e426a56c58d3c9860cfa45ccb12f88e6cb7",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C16/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "3ee559e51f3340d288ae7dd9ce5415e5f287bdb93d5cf997df313dcdca0bb792",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C16/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "3ee559e51f3340d288ae7dd9ce5415e5f287bdb93d5cf997df313dcdca0bb792",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C17",
      "fixtureId": "FX-C17",
      "schemaId": "SCHEMA-C17-V1",
      "locator": {
        "type": "DESCRIPTOR_ID",
        "path": "product",
        "cardinalityBefore": 1,
        "cardinalityAfter": 0,
        "beforeByteStart": 26,
        "beforeByteLength": 4,
        "afterByteStart": 16,
        "afterByteLength": 0,
        "valueBeforeHex": "74727565",
        "valueAfterHex": ""
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "DELETE_UNIQUE_LOCATOR",
        "inputMemberPath": "fixtures/C17.before.bin",
        "outputMemberPath": "fixtures/C17.after.bin",
        "mask": {
          "beforeStart": 16,
          "beforeLength": 14,
          "afterStart": 16,
          "afterLength": 0
        },
        "insertHex": "",
        "expectedOutputSha256": "d9d1dd02acb2e9abd0c558b1911d71528256a20a22e5006155533f4c7fa97cb2"
      },
      "measuredComplement": {
        "prefixBytes": 16,
        "suffixBytes": 2,
        "bytesHex": "7b2264657363726970746f7273223a7b7d7d",
        "sha256": "d9d1dd02acb2e9abd0c558b1911d71528256a20a22e5006155533f4c7fa97cb2"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C17/members/BASELINE/sha256",
          "before": "6ecbb2be83a6a02f3203905b173301e21a92175c65a9a5b4a03b9ca1c872ac4c",
          "after": "6ecbb2be83a6a02f3203905b173301e21a92175c65a9a5b4a03b9ca1c872ac4c",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C17/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "d9d1dd02acb2e9abd0c558b1911d71528256a20a22e5006155533f4c7fa97cb2",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C17/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "d9d1dd02acb2e9abd0c558b1911d71528256a20a22e5006155533f4c7fa97cb2",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C18",
      "fixtureId": "FX-C18",
      "schemaId": "SCHEMA-C18-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/observationSealRoot",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 23,
        "beforeByteLength": 66,
        "afterByteStart": 23,
        "afterByteLength": 66,
        "valueBeforeHex": "223030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022",
        "valueAfterHex": "223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "FLIP_BIT_0",
        "inputMemberPath": "fixtures/C18.before.bin",
        "outputMemberPath": "fixtures/C18.after.bin",
        "mask": {
          "beforeStart": 24,
          "beforeLength": 1,
          "afterStart": 24,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "2826697bf79c5aa6ea0295622b65939158dbb21e8a670f673fcd556283a60bc1"
      },
      "measuredComplement": {
        "prefixBytes": 24,
        "suffixBytes": 65,
        "bytesHex": "7b226f62736572766174696f6e5365616c526f6f74223a22303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
        "sha256": "a1610ad474f8e6559ad920f5b248f413ec4b521fedbd05e573d467102bea179c"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C18/members/BASELINE/sha256",
          "before": "46e97721913a5a962555e528a6e2ef4788cf6ffd72cb4b4de69fd8e9cac9b489",
          "after": "46e97721913a5a962555e528a6e2ef4788cf6ffd72cb4b4de69fd8e9cac9b489",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C18/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "2826697bf79c5aa6ea0295622b65939158dbb21e8a670f673fcd556283a60bc1",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C18/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "2826697bf79c5aa6ea0295622b65939158dbb21e8a670f673fcd556283a60bc1",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C19",
      "fixtureId": "FX-C19",
      "schemaId": "SCHEMA-C19-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/receipt/observationSealRoot",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 34,
        "beforeByteLength": 66,
        "afterByteStart": 34,
        "afterByteLength": 66,
        "valueBeforeHex": "223030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022",
        "valueAfterHex": "223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "FLIP_BIT_0",
        "inputMemberPath": "fixtures/C19.before.bin",
        "outputMemberPath": "fixtures/C19.after.bin",
        "mask": {
          "beforeStart": 35,
          "beforeLength": 1,
          "afterStart": 35,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "92e26b7ca5d5549650c44e6670e5298b2fe0d740d0abbc841d1a41fb21259d02"
      },
      "measuredComplement": {
        "prefixBytes": 35,
        "suffixBytes": 66,
        "bytesHex": "7b2272656365697074223a7b226f62736572766174696f6e5365616c526f6f74223a22303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d",
        "sha256": "86322aa6a21a855096813c087dcd26c7e216ffeaeafa14e072fb24fd9e756138"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C19/members/BASELINE/sha256",
          "before": "0842506ce41ca21af5b662f395b1ba4d748ac78771416a499d71a23530ca0345",
          "after": "0842506ce41ca21af5b662f395b1ba4d748ac78771416a499d71a23530ca0345",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C19/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "92e26b7ca5d5549650c44e6670e5298b2fe0d740d0abbc841d1a41fb21259d02",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C19/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "92e26b7ca5d5549650c44e6670e5298b2fe0d740d0abbc841d1a41fb21259d02",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C20",
      "fixtureId": "FX-C20",
      "schemaId": "SCHEMA-C20-V1",
      "locator": {
        "type": "RAW_JSON_OBJECT",
        "path": "/",
        "cardinalityBefore": 1,
        "cardinalityAfter": 2,
        "beforeByteStart": 0,
        "beforeByteLength": 7,
        "afterByteStart": 0,
        "afterByteLength": 13,
        "valueBeforeHex": "7b2261223a317d",
        "valueAfterHex": "7b2261223a312c2261223a327d"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "INSERT_DUPLICATE_KEY",
        "inputMemberPath": "fixtures/C20.before.bin",
        "outputMemberPath": "fixtures/C20.after.bin",
        "mask": {
          "beforeStart": 6,
          "beforeLength": 0,
          "afterStart": 6,
          "afterLength": 6
        },
        "insertHex": "2c2261223a32",
        "expectedOutputSha256": "1c53ee0df7b12fd4d65b976120c7fa6b847dc41dffd7f0331c3237a1ceab1756"
      },
      "measuredComplement": {
        "prefixBytes": 6,
        "suffixBytes": 1,
        "bytesHex": "7b2261223a317d",
        "sha256": "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C20/members/BASELINE/sha256",
          "before": "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862",
          "after": "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C20/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "1c53ee0df7b12fd4d65b976120c7fa6b847dc41dffd7f0331c3237a1ceab1756",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C20/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "1c53ee0df7b12fd4d65b976120c7fa6b847dc41dffd7f0331c3237a1ceab1756",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C21",
      "fixtureId": "FX-C21",
      "schemaId": "SCHEMA-C21-V1",
      "locator": {
        "type": "RAW_JSON_OBJECT",
        "path": "/x",
        "cardinalityBefore": 1,
        "cardinalityAfter": 2,
        "beforeByteStart": 0,
        "beforeByteLength": 13,
        "afterByteStart": 0,
        "afterByteLength": 19,
        "valueBeforeHex": "7b2278223a7b2261223a317d7d",
        "valueAfterHex": "7b2278223a7b2261223a312c2261223a327d7d"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "INSERT_NESTED_DUPLICATE_KEY",
        "inputMemberPath": "fixtures/C21.before.bin",
        "outputMemberPath": "fixtures/C21.after.bin",
        "mask": {
          "beforeStart": 11,
          "beforeLength": 0,
          "afterStart": 11,
          "afterLength": 6
        },
        "insertHex": "2c2261223a32",
        "expectedOutputSha256": "06d55db68c2ab40693c6dbd8e3d358b352a269731d9ead4defe3e067a6eb6af7"
      },
      "measuredComplement": {
        "prefixBytes": 11,
        "suffixBytes": 2,
        "bytesHex": "7b2278223a7b2261223a317d7d",
        "sha256": "9568cb6e932779f25ed1080bf2ed0d20022373cf27187f3a64a24c717bc13950"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C21/members/BASELINE/sha256",
          "before": "9568cb6e932779f25ed1080bf2ed0d20022373cf27187f3a64a24c717bc13950",
          "after": "9568cb6e932779f25ed1080bf2ed0d20022373cf27187f3a64a24c717bc13950",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C21/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "06d55db68c2ab40693c6dbd8e3d358b352a269731d9ead4defe3e067a6eb6af7",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C21/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "06d55db68c2ab40693c6dbd8e3d358b352a269731d9ead4defe3e067a6eb6af7",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C22",
      "fixtureId": "FX-C22",
      "schemaId": "SCHEMA-C22-V1",
      "locator": {
        "type": "RAW_JSON_STRING",
        "path": "/",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 0,
        "beforeByteLength": 3,
        "afterByteStart": 0,
        "afterByteLength": 4,
        "valueBeforeHex": "222f22",
        "valueAfterHex": "225c2f22"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "INSERT_BACKSLASH",
        "inputMemberPath": "fixtures/C22.before.bin",
        "outputMemberPath": "fixtures/C22.after.bin",
        "mask": {
          "beforeStart": 1,
          "beforeLength": 1,
          "afterStart": 1,
          "afterLength": 2
        },
        "insertHex": "5c2f",
        "expectedOutputSha256": "7040fb3de3d569faa7bf72a920e4375290a0c4333d824ccc47c3e3e5ffcdaab5"
      },
      "measuredComplement": {
        "prefixBytes": 1,
        "suffixBytes": 1,
        "bytesHex": "2222",
        "sha256": "12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C22/members/BASELINE/sha256",
          "before": "df7e940f72aa93cbcb6d70cc35124b0767c7a0e353043c7c24b660ea9be7b952",
          "after": "df7e940f72aa93cbcb6d70cc35124b0767c7a0e353043c7c24b660ea9be7b952",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C22/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "7040fb3de3d569faa7bf72a920e4375290a0c4333d824ccc47c3e3e5ffcdaab5",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C22/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "7040fb3de3d569faa7bf72a920e4375290a0c4333d824ccc47c3e3e5ffcdaab5",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C23",
      "fixtureId": "FX-C23",
      "schemaId": "SCHEMA-C23-V1",
      "locator": {
        "type": "RAW_JSON_STRING",
        "path": "/",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 0,
        "beforeByteLength": 8,
        "afterByteStart": 0,
        "afterByteLength": 8,
        "valueBeforeHex": "225c753030666622",
        "valueAfterHex": "225c753030464622"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "UPPERCASE_ESCAPE_HEX",
        "inputMemberPath": "fixtures/C23.before.bin",
        "outputMemberPath": "fixtures/C23.after.bin",
        "mask": {
          "beforeStart": 5,
          "beforeLength": 2,
          "afterStart": 5,
          "afterLength": 2
        },
        "insertHex": "4646",
        "expectedOutputSha256": "6ce03defa1f190707faf0c56c80e85b76e3d5e7a9ae73ce1799578dbdd1759ba"
      },
      "measuredComplement": {
        "prefixBytes": 5,
        "suffixBytes": 1,
        "bytesHex": "225c75303022",
        "sha256": "bb4655308340a887a700baeb8beb6dc7986fc7bf082374d0cbce6a9a00cac387"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C23/members/BASELINE/sha256",
          "before": "e63d8a91f82cd40b18f62aa1790f6df8757dd72b5c93a919c8c11d6b0043ac4d",
          "after": "e63d8a91f82cd40b18f62aa1790f6df8757dd72b5c93a919c8c11d6b0043ac4d",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C23/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "6ce03defa1f190707faf0c56c80e85b76e3d5e7a9ae73ce1799578dbdd1759ba",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C23/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "6ce03defa1f190707faf0c56c80e85b76e3d5e7a9ae73ce1799578dbdd1759ba",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C24",
      "fixtureId": "FX-C24",
      "schemaId": "SCHEMA-C24-V1",
      "locator": {
        "type": "RAW_JSON_STRING",
        "path": "/",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 0,
        "beforeByteLength": 4,
        "afterByteStart": 0,
        "afterByteLength": 8,
        "valueBeforeHex": "225c6e22",
        "valueAfterHex": "225c753030306122"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "EXPAND_SHORT_ESCAPE",
        "inputMemberPath": "fixtures/C24.before.bin",
        "outputMemberPath": "fixtures/C24.after.bin",
        "mask": {
          "beforeStart": 2,
          "beforeLength": 1,
          "afterStart": 2,
          "afterLength": 5
        },
        "insertHex": "7530303061",
        "expectedOutputSha256": "46f7b04715e2e1f162a9f3cb90a946a48e653b15117c2de6ed7cf60c029d2219"
      },
      "measuredComplement": {
        "prefixBytes": 2,
        "suffixBytes": 1,
        "bytesHex": "225c22",
        "sha256": "491a8669f95d3552993b2deef0d3d9fcf5a70d53804121ca10d964abc7639419"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C24/members/BASELINE/sha256",
          "before": "d7a5e915306d21dc1937ad5616f1dc9682e759e75ef51dd05fd9ddc98a078ea1",
          "after": "d7a5e915306d21dc1937ad5616f1dc9682e759e75ef51dd05fd9ddc98a078ea1",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C24/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "46f7b04715e2e1f162a9f3cb90a946a48e653b15117c2de6ed7cf60c029d2219",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C24/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "46f7b04715e2e1f162a9f3cb90a946a48e653b15117c2de6ed7cf60c029d2219",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C25",
      "fixtureId": "FX-C25",
      "schemaId": "SCHEMA-C25-V1",
      "locator": {
        "type": "RAW_JSON_OBJECT",
        "path": "/",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 0,
        "beforeByteLength": 13,
        "afterByteStart": 0,
        "afterByteLength": 13,
        "valueBeforeHex": "7b2261223a312c2262223a327d",
        "valueAfterHex": "7b2262223a322c2261223a317d"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "SWAP_OBJECT_MEMBERS",
        "inputMemberPath": "fixtures/C25.before.bin",
        "outputMemberPath": "fixtures/C25.after.bin",
        "mask": {
          "beforeStart": 2,
          "beforeLength": 10,
          "afterStart": 2,
          "afterLength": 10
        },
        "insertHex": "62223a322c2261223a31",
        "expectedOutputSha256": "3fb75453225c732a76b7899ea2096dda1455189c89817239732182f73fe5a09f"
      },
      "measuredComplement": {
        "prefixBytes": 2,
        "suffixBytes": 1,
        "bytesHex": "7b227d",
        "sha256": "28cf004f7c136ce5badd908afd15696a5c0fa7b70af4a35c397339bc48841e00"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C25/members/BASELINE/sha256",
          "before": "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777",
          "after": "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C25/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "3fb75453225c732a76b7899ea2096dda1455189c89817239732182f73fe5a09f",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C25/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "3fb75453225c732a76b7899ea2096dda1455189c89817239732182f73fe5a09f",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C26",
      "fixtureId": "FX-C26",
      "schemaId": "SCHEMA-C26-V1",
      "locator": {
        "type": "RAW_JSON_NUMBER",
        "path": "/",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 0,
        "beforeByteLength": 1,
        "afterByteStart": 0,
        "afterByteLength": 2,
        "valueBeforeHex": "30",
        "valueAfterHex": "3030"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "PREFIX_ZERO",
        "inputMemberPath": "fixtures/C26.before.bin",
        "outputMemberPath": "fixtures/C26.after.bin",
        "mask": {
          "beforeStart": 1,
          "beforeLength": 0,
          "afterStart": 1,
          "afterLength": 1
        },
        "insertHex": "30",
        "expectedOutputSha256": "f1534392279bddbf9d43dde8701cb5be14b82f76ec6607bf8d6ad557f60f304e"
      },
      "measuredComplement": {
        "prefixBytes": 1,
        "suffixBytes": 0,
        "bytesHex": "30",
        "sha256": "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C26/members/BASELINE/sha256",
          "before": "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
          "after": "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C26/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "f1534392279bddbf9d43dde8701cb5be14b82f76ec6607bf8d6ad557f60f304e",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C26/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "f1534392279bddbf9d43dde8701cb5be14b82f76ec6607bf8d6ad557f60f304e",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C27",
      "fixtureId": "FX-C27",
      "schemaId": "SCHEMA-C27-V1",
      "locator": {
        "type": "RAW_UTF8_SCALAR",
        "path": "/",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 0,
        "beforeByteLength": 3,
        "afterByteStart": 0,
        "afterByteLength": 3,
        "valueBeforeHex": "efbfbd",
        "valueAfterHex": "eda080"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "REPLACE_WITH_SURROGATE_ENCODING",
        "inputMemberPath": "fixtures/C27.before.bin",
        "outputMemberPath": "fixtures/C27.after.bin",
        "mask": {
          "beforeStart": 0,
          "beforeLength": 3,
          "afterStart": 0,
          "afterLength": 3
        },
        "insertHex": "eda080",
        "expectedOutputSha256": "91a681b998555fb475479817b126c94e57e52011fa1842c5d188795a4a05226b"
      },
      "measuredComplement": {
        "prefixBytes": 0,
        "suffixBytes": 0,
        "bytesHex": "",
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C27/members/BASELINE/sha256",
          "before": "83d544ccc223c057d2bf80d3f2a32982c32c3c0db8e2674820da5064783fb097",
          "after": "83d544ccc223c057d2bf80d3f2a32982c32c3c0db8e2674820da5064783fb097",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C27/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "91a681b998555fb475479817b126c94e57e52011fa1842c5d188795a4a05226b",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C27/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "91a681b998555fb475479817b126c94e57e52011fa1842c5d188795a4a05226b",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C28",
      "fixtureId": "FX-C28",
      "schemaId": "SCHEMA-C28-V1",
      "locator": {
        "type": "RAW_ENVELOPE",
        "path": "/",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 0,
        "beforeByteLength": 7,
        "afterByteStart": 0,
        "afterByteLength": 8,
        "valueBeforeHex": "7b2261223a317d",
        "valueAfterHex": "207b2261223a317d"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "PREFIX_SPACE",
        "inputMemberPath": "fixtures/C28.before.bin",
        "outputMemberPath": "fixtures/C28.after.bin",
        "mask": {
          "beforeStart": 0,
          "beforeLength": 0,
          "afterStart": 0,
          "afterLength": 1
        },
        "insertHex": "20",
        "expectedOutputSha256": "3b48504afb5cf21924953df99e5b1b3210705a89dc4e60e291371ed395083730"
      },
      "measuredComplement": {
        "prefixBytes": 0,
        "suffixBytes": 7,
        "bytesHex": "7b2261223a317d",
        "sha256": "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C28/members/BASELINE/sha256",
          "before": "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862",
          "after": "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C28/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "3b48504afb5cf21924953df99e5b1b3210705a89dc4e60e291371ed395083730",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C28/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "3b48504afb5cf21924953df99e5b1b3210705a89dc4e60e291371ed395083730",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C29",
      "fixtureId": "FX-C29",
      "schemaId": "SCHEMA-C29-V1",
      "locator": {
        "type": "RAW_TAGGED_VALUE",
        "path": "/$",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 0,
        "beforeByteLength": 20,
        "afterByteStart": 0,
        "afterByteLength": 22,
        "valueBeforeHex": "7b2224223a22706f696e74222c226174223a307d",
        "valueAfterHex": "7b2224223a22756e6b6e6f776e222c226174223a307d"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "REPLACE_TAG",
        "inputMemberPath": "fixtures/C29.before.bin",
        "outputMemberPath": "fixtures/C29.after.bin",
        "mask": {
          "beforeStart": 6,
          "beforeLength": 5,
          "afterStart": 6,
          "afterLength": 7
        },
        "insertHex": "756e6b6e6f776e",
        "expectedOutputSha256": "47ac97bdd184ad5542f777e463e6bc225284c803afe82b2defeb549cec355d33"
      },
      "measuredComplement": {
        "prefixBytes": 6,
        "suffixBytes": 9,
        "bytesHex": "7b2224223a22222c226174223a307d",
        "sha256": "6488e9c21c2a2f382bd1279496a273e4cbe1e5e310098b5438a2b0029b6e6fac"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C29/members/BASELINE/sha256",
          "before": "1682c75ee9c9e6e2ad0f984a14fd9bd8e08d4da016cd0ca57c0b706a1b68a171",
          "after": "1682c75ee9c9e6e2ad0f984a14fd9bd8e08d4da016cd0ca57c0b706a1b68a171",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C29/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "47ac97bdd184ad5542f777e463e6bc225284c803afe82b2defeb549cec355d33",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C29/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "47ac97bdd184ad5542f777e463e6bc225284c803afe82b2defeb549cec355d33",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C30",
      "fixtureId": "FX-C30",
      "schemaId": "SCHEMA-C30-V1",
      "locator": {
        "type": "MACHINE_DECLARATION_PATH",
        "path": "/moduleSet",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 13,
        "beforeByteLength": 41,
        "afterByteStart": 13,
        "afterByteLength": 46,
        "valueBeforeHex": "5b225030222c225031222c225032222c225033222c225034222c225035222c225036222c225037225d",
        "valueAfterHex": "5b225030222c225031222c225032222c225033222c225034222c225035222c225036222c225037222c225038225d"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "APPEND_MODULE",
        "inputMemberPath": "fixtures/C30.before.bin",
        "outputMemberPath": "fixtures/C30.after.bin",
        "mask": {
          "beforeStart": 53,
          "beforeLength": 0,
          "afterStart": 53,
          "afterLength": 5
        },
        "insertHex": "2c22503822",
        "expectedOutputSha256": "36fdbca2d2becef86566dcae9a411cb31135f89c072eb4442403dbb707fdc91f"
      },
      "measuredComplement": {
        "prefixBytes": 53,
        "suffixBytes": 2,
        "bytesHex": "7b226d6f64756c65536574223a5b225030222c225031222c225032222c225033222c225034222c225035222c225036222c225037225d7d",
        "sha256": "98c0c9f04b66b0043709691b18289e607ceeddcd69878b5ebebd9907cdc97f27"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C30/members/BASELINE/sha256",
          "before": "98c0c9f04b66b0043709691b18289e607ceeddcd69878b5ebebd9907cdc97f27",
          "after": "98c0c9f04b66b0043709691b18289e607ceeddcd69878b5ebebd9907cdc97f27",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C30/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "36fdbca2d2becef86566dcae9a411cb31135f89c072eb4442403dbb707fdc91f",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C30/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "36fdbca2d2becef86566dcae9a411cb31135f89c072eb4442403dbb707fdc91f",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C31",
      "fixtureId": "FX-C31",
      "schemaId": "SCHEMA-C31-V1",
      "locator": {
        "type": "MACHINE_DECLARATION_PATH",
        "path": "/sourceHash",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 14,
        "beforeByteLength": 66,
        "afterByteStart": 14,
        "afterByteLength": 66,
        "valueBeforeHex": "223030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022",
        "valueAfterHex": "223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "FLIP_BIT_0",
        "inputMemberPath": "fixtures/C31.before.bin",
        "outputMemberPath": "fixtures/C31.after.bin",
        "mask": {
          "beforeStart": 15,
          "beforeLength": 1,
          "afterStart": 15,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "7740dcb134cb3ec1db3d19fb69a851cc50cadd47b2c9a6ce87f9e0d33f1b0dea"
      },
      "measuredComplement": {
        "prefixBytes": 15,
        "suffixBytes": 65,
        "bytesHex": "7b22736f7572636548617368223a22303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d",
        "sha256": "b0f23ca87445b75032d580018faaadccd581d5ef387d8d0638a4c0d932823bc8"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C31/members/BASELINE/sha256",
          "before": "30869d35b828d751c1a26cb015eb08c1c3cfe14552529a18ee67cc2f9493bf90",
          "after": "30869d35b828d751c1a26cb015eb08c1c3cfe14552529a18ee67cc2f9493bf90",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C31/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "7740dcb134cb3ec1db3d19fb69a851cc50cadd47b2c9a6ce87f9e0d33f1b0dea",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C31/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "7740dcb134cb3ec1db3d19fb69a851cc50cadd47b2c9a6ce87f9e0d33f1b0dea",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C32",
      "fixtureId": "FX-C32",
      "schemaId": "SCHEMA-C32-V1",
      "locator": {
        "type": "BYTE_OFFSET",
        "path": "0",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 0,
        "beforeByteLength": 1,
        "afterByteStart": 0,
        "afterByteLength": 1,
        "valueBeforeHex": "00",
        "valueAfterHex": "01"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "FLIP_BIT_0",
        "inputMemberPath": "fixtures/C32.before.bin",
        "outputMemberPath": "fixtures/C32.after.bin",
        "mask": {
          "beforeStart": 0,
          "beforeLength": 1,
          "afterStart": 0,
          "afterLength": 1
        },
        "insertHex": "01",
        "expectedOutputSha256": "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a"
      },
      "measuredComplement": {
        "prefixBytes": 0,
        "suffixBytes": 0,
        "bytesHex": "",
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C32/members/BASELINE/sha256",
          "before": "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
          "after": "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C32/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C32/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C33",
      "fixtureId": "FX-C33",
      "schemaId": "SCHEMA-C33-V1",
      "locator": {
        "type": "EDGE_ID",
        "path": "E26",
        "cardinalityBefore": 1,
        "cardinalityAfter": 0,
        "beforeByteStart": 16,
        "beforeByteLength": 4,
        "afterByteStart": 10,
        "afterByteLength": 0,
        "valueBeforeHex": "74727565",
        "valueAfterHex": ""
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "DELETE_EDGE",
        "inputMemberPath": "fixtures/C33.before.bin",
        "outputMemberPath": "fixtures/C33.after.bin",
        "mask": {
          "beforeStart": 10,
          "beforeLength": 10,
          "afterStart": 10,
          "afterLength": 0
        },
        "insertHex": "",
        "expectedOutputSha256": "d0033617a14f4c8342e0fc856000919d5590d5d514d94db70dc19f1c44b0f1ee"
      },
      "measuredComplement": {
        "prefixBytes": 10,
        "suffixBytes": 2,
        "bytesHex": "7b226564676573223a7b7d7d",
        "sha256": "d0033617a14f4c8342e0fc856000919d5590d5d514d94db70dc19f1c44b0f1ee"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C33/members/BASELINE/sha256",
          "before": "4dd6f8e2eb5a8f7d7eb51bf423c1f7e77b5ce00ca0060784dc1d8b2011656523",
          "after": "4dd6f8e2eb5a8f7d7eb51bf423c1f7e77b5ce00ca0060784dc1d8b2011656523",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C33/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "d0033617a14f4c8342e0fc856000919d5590d5d514d94db70dc19f1c44b0f1ee",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C33/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "d0033617a14f4c8342e0fc856000919d5590d5d514d94db70dc19f1c44b0f1ee",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C34",
      "fixtureId": "FX-C34",
      "schemaId": "SCHEMA-C34-V1",
      "locator": {
        "type": "EDGE_ID",
        "path": "E26",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 29,
        "beforeByteLength": 8,
        "afterByteStart": 29,
        "afterByteLength": 8,
        "valueBeforeHex": "2250302d3e503522",
        "valueAfterHex": "2250352d3e503022"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "REVERSE_EDGE",
        "inputMemberPath": "fixtures/C34.before.bin",
        "outputMemberPath": "fixtures/C34.after.bin",
        "mask": {
          "beforeStart": 31,
          "beforeLength": 5,
          "afterStart": 31,
          "afterLength": 5
        },
        "insertHex": "352d3e5030",
        "expectedOutputSha256": "9cbe240a89e2747232a5a4beb499c9e5c5f75098cfc7da63e5d89a1d7c3e0893"
      },
      "measuredComplement": {
        "prefixBytes": 31,
        "suffixBytes": 4,
        "bytesHex": "7b226564676573223a7b22453236223a7b22646972656374696f6e223a2250227d7d7d",
        "sha256": "d6d8692508b78ebba673d1538e58430c22afb523b0068b4332fe7ababd281a50"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C34/members/BASELINE/sha256",
          "before": "c2d517519067c80763325717d2d6c379eeec2806a4d5dac866df70b6b45b28df",
          "after": "c2d517519067c80763325717d2d6c379eeec2806a4d5dac866df70b6b45b28df",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C34/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "9cbe240a89e2747232a5a4beb499c9e5c5f75098cfc7da63e5d89a1d7c3e0893",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C34/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "9cbe240a89e2747232a5a4beb499c9e5c5f75098cfc7da63e5d89a1d7c3e0893",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C35",
      "fixtureId": "FX-C35",
      "schemaId": "SCHEMA-C35-V1",
      "locator": {
        "type": "AST_NODE_PATH",
        "path": "/imports/0/kind",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 20,
        "beforeByteLength": 8,
        "afterByteStart": 20,
        "afterByteLength": 9,
        "valueBeforeHex": "2273746174696322",
        "valueAfterHex": "2264796e616d696322"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "REPLACE_IMPORT_KIND",
        "inputMemberPath": "fixtures/C35.before.bin",
        "outputMemberPath": "fixtures/C35.after.bin",
        "mask": {
          "beforeStart": 21,
          "beforeLength": 4,
          "afterStart": 21,
          "afterLength": 5
        },
        "insertHex": "64796e616d",
        "expectedOutputSha256": "b819beaf7e6666574907ae7fe1e8946a080631c06cda1edba050825ca84596a4"
      },
      "measuredComplement": {
        "prefixBytes": 21,
        "suffixBytes": 6,
        "bytesHex": "7b22696d706f727473223a5b7b226b696e64223a226963227d5d7d",
        "sha256": "57c52c94ec95b7029d39ba5e94309963203f4ea9dba300ccf6365ce3d1473fc5"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C35/members/BASELINE/sha256",
          "before": "e72787eddfbbf5f9f987d376a57803f59f9fa1308ce02d72e5d6c1b5755c5ff9",
          "after": "e72787eddfbbf5f9f987d376a57803f59f9fa1308ce02d72e5d6c1b5755c5ff9",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C35/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "b819beaf7e6666574907ae7fe1e8946a080631c06cda1edba050825ca84596a4",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C35/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "b819beaf7e6666574907ae7fe1e8946a080631c06cda1edba050825ca84596a4",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C36",
      "fixtureId": "FX-C36",
      "schemaId": "SCHEMA-C36-V1",
      "locator": {
        "type": "AST_NODE_PATH",
        "path": "/calls/0",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 10,
        "beforeByteLength": 5,
        "afterByteStart": 10,
        "afterByteLength": 11,
        "valueBeforeHex": "2266282922",
        "valueAfterHex": "226576616c286628292922"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "WRAP_EVAL",
        "inputMemberPath": "fixtures/C36.before.bin",
        "outputMemberPath": "fixtures/C36.after.bin",
        "mask": {
          "beforeStart": 11,
          "beforeLength": 2,
          "afterStart": 11,
          "afterLength": 8
        },
        "insertHex": "6576616c28662829",
        "expectedOutputSha256": "3fbb45338d9f7fe44410412d8055ace055bd748ec5232ce5524146d2e799d2a5"
      },
      "measuredComplement": {
        "prefixBytes": 11,
        "suffixBytes": 4,
        "bytesHex": "7b2263616c6c73223a5b2229225d7d",
        "sha256": "52ea27beedaf88b60b0f45b7d6a479d0d37dc1e3f230e45b1c283daf6b6410b2"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C36/members/BASELINE/sha256",
          "before": "ca8b98125703115ef9987354c67890e2fade4e895c3ee52dd6162612c8850691",
          "after": "ca8b98125703115ef9987354c67890e2fade4e895c3ee52dd6162612c8850691",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C36/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "3fbb45338d9f7fe44410412d8055ace055bd748ec5232ce5524146d2e799d2a5",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C36/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "3fbb45338d9f7fe44410412d8055ace055bd748ec5232ce5524146d2e799d2a5",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C37",
      "fixtureId": "FX-C37",
      "schemaId": "SCHEMA-C37-V1",
      "locator": {
        "type": "AST_NODE_PATH",
        "path": "/memberAccess/0",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 17,
        "beforeByteLength": 5,
        "afterByteStart": 17,
        "afterByteLength": 18,
        "valueBeforeHex": "226f2e7822",
        "valueAfterHex": "225265666c6563742e676574286f2c782922"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "REPLACE_WITH_REFLECTION",
        "inputMemberPath": "fixtures/C37.before.bin",
        "outputMemberPath": "fixtures/C37.after.bin",
        "mask": {
          "beforeStart": 18,
          "beforeLength": 3,
          "afterStart": 18,
          "afterLength": 16
        },
        "insertHex": "5265666c6563742e676574286f2c7829",
        "expectedOutputSha256": "3adc0899fb6115cf669e00036ed1f121822e5f516e43523a179793b76f9e2440"
      },
      "measuredComplement": {
        "prefixBytes": 18,
        "suffixBytes": 3,
        "bytesHex": "7b226d656d626572416363657373223a5b22225d7d",
        "sha256": "78f65ad50cb69b9d2dbfae88e3e456a19868e2dcda9e8b2bc10174a7076a40b9"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C37/members/BASELINE/sha256",
          "before": "fe8d2a7a954913fc985a63ff1bfc24fb3bc746c3e07c38a1b5a2e05974d49c77",
          "after": "fe8d2a7a954913fc985a63ff1bfc24fb3bc746c3e07c38a1b5a2e05974d49c77",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C37/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "3adc0899fb6115cf669e00036ed1f121822e5f516e43523a179793b76f9e2440",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C37/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "3adc0899fb6115cf669e00036ed1f121822e5f516e43523a179793b76f9e2440",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C38",
      "fixtureId": "FX-C38",
      "schemaId": "SCHEMA-C38-V1",
      "locator": {
        "type": "EDGE_ID",
        "path": "dependency-0",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 35,
        "beforeByteLength": 10,
        "afterByteStart": 35,
        "afterByteLength": 9,
        "valueBeforeHex": "226465636c6172656422",
        "valueAfterHex": "226f6d697474656422"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "DELETE_DEPENDENCY",
        "inputMemberPath": "fixtures/C38.before.bin",
        "outputMemberPath": "fixtures/C38.after.bin",
        "mask": {
          "beforeStart": 36,
          "beforeLength": 6,
          "afterStart": 36,
          "afterLength": 5
        },
        "insertHex": "6f6d697474",
        "expectedOutputSha256": "d2116d17e3aee0910a13990ab2f583ff1cc704b230c14d361ff09629ed95dfa7"
      },
      "measuredComplement": {
        "prefixBytes": 36,
        "suffixBytes": 5,
        "bytesHex": "7b22646570656e64656e63794772617068223a7b22646570656e64656e63792d30223a226564227d7d",
        "sha256": "d8a9ed55bc0df2bf15a2163f7747492350aa8402cf9279e469f0fea9b3557371"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C38/members/BASELINE/sha256",
          "before": "76b8262d606376b7b42a88c8be3869dbabae6bebfacc38256c58bc8b54163b05",
          "after": "76b8262d606376b7b42a88c8be3869dbabae6bebfacc38256c58bc8b54163b05",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C38/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "d2116d17e3aee0910a13990ab2f583ff1cc704b230c14d361ff09629ed95dfa7",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C38/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "d2116d17e3aee0910a13990ab2f583ff1cc704b230c14d361ff09629ed95dfa7",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C39",
      "fixtureId": "FX-C39",
      "schemaId": "SCHEMA-C39-V1",
      "locator": {
        "type": "AST_NODE_PATH",
        "path": "/runtime/substrate",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 24,
        "beforeByteLength": 8,
        "afterByteStart": 24,
        "afterByteLength": 22,
        "valueBeforeHex": "2264697265637422",
        "valueAfterHex": "226576656e74546170652b70726f6a656374696f6e22"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "REPLACE_SUBSTRATE",
        "inputMemberPath": "fixtures/C39.before.bin",
        "outputMemberPath": "fixtures/C39.after.bin",
        "mask": {
          "beforeStart": 25,
          "beforeLength": 6,
          "afterStart": 25,
          "afterLength": 20
        },
        "insertHex": "6576656e74546170652b70726f6a656374696f6e",
        "expectedOutputSha256": "87ec2883779b147671e22987c39e538746751c622e6f10173a9c9e5e7bb9bc96"
      },
      "measuredComplement": {
        "prefixBytes": 25,
        "suffixBytes": 3,
        "bytesHex": "7b2272756e74696d65223a7b22737562737472617465223a22227d7d",
        "sha256": "ddae528326b3f6e542247fdd08cb48280ec3bc4d1d154e033bfc0843d8dd6baf"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C39/members/BASELINE/sha256",
          "before": "e098e3f78eb6f111e83ef1bb2683de43c31fd1f902f613b9a61c801f802768ab",
          "after": "e098e3f78eb6f111e83ef1bb2683de43c31fd1f902f613b9a61c801f802768ab",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C39/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "87ec2883779b147671e22987c39e538746751c622e6f10173a9c9e5e7bb9bc96",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C39/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "87ec2883779b147671e22987c39e538746751c622e6f10173a9c9e5e7bb9bc96",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C40",
      "fixtureId": "FX-C40",
      "schemaId": "SCHEMA-C40-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/modules/P5/chargedLoc",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 31,
        "beforeByteLength": 2,
        "afterByteStart": 31,
        "afterByteLength": 2,
        "valueBeforeHex": "3835",
        "valueAfterHex": "3836"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "INCREMENT_U53",
        "inputMemberPath": "fixtures/C40.before.bin",
        "outputMemberPath": "fixtures/C40.after.bin",
        "mask": {
          "beforeStart": 32,
          "beforeLength": 1,
          "afterStart": 32,
          "afterLength": 1
        },
        "insertHex": "36",
        "expectedOutputSha256": "046375f911b35789fd8a0830abf597a02c74003b02021f1eab2c18a4d666056f"
      },
      "measuredComplement": {
        "prefixBytes": 32,
        "suffixBytes": 3,
        "bytesHex": "7b226d6f64756c6573223a7b225035223a7b22636861726765644c6f63223a387d7d7d",
        "sha256": "d54a066c766bbda14daa8be6c8b0f5d4cb05110b880821b12dea9130212e2315"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C40/members/BASELINE/sha256",
          "before": "679b720aba6bd9213c3701b17f79d987f2b005af3ba08b32a8854b945b565fd2",
          "after": "679b720aba6bd9213c3701b17f79d987f2b005af3ba08b32a8854b945b565fd2",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C40/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "046375f911b35789fd8a0830abf597a02c74003b02021f1eab2c18a4d666056f",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C40/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "046375f911b35789fd8a0830abf597a02c74003b02021f1eab2c18a4d666056f",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C41",
      "fixtureId": "FX-C41",
      "schemaId": "SCHEMA-C41-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/totalChargedLoc",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 19,
        "beforeByteLength": 3,
        "afterByteStart": 19,
        "afterByteLength": 3,
        "valueBeforeHex": "383530",
        "valueAfterHex": "383531"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "INCREMENT_U53",
        "inputMemberPath": "fixtures/C41.before.bin",
        "outputMemberPath": "fixtures/C41.after.bin",
        "mask": {
          "beforeStart": 21,
          "beforeLength": 1,
          "afterStart": 21,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "ecc09afb9503c0efa7f73f1897a227cb99b1b1ea24dcd2561b6149736dd8dda9"
      },
      "measuredComplement": {
        "prefixBytes": 21,
        "suffixBytes": 1,
        "bytesHex": "7b22746f74616c436861726765644c6f63223a38357d",
        "sha256": "eba3d1b76b42f69a1487d740cc7c252884310af6992372b8812281adbf67c46b"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C41/members/BASELINE/sha256",
          "before": "86bb08de33ce38157f80ab1f9c57dc90b37a06c39bb654136d5c890044bf90cf",
          "after": "86bb08de33ce38157f80ab1f9c57dc90b37a06c39bb654136d5c890044bf90cf",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C41/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "ecc09afb9503c0efa7f73f1897a227cb99b1b1ea24dcd2561b6149736dd8dda9",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C41/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "ecc09afb9503c0efa7f73f1897a227cb99b1b1ea24dcd2561b6149736dd8dda9",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C42",
      "fixtureId": "FX-C42",
      "schemaId": "SCHEMA-C42-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/astTool/sha256",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 21,
        "beforeByteLength": 66,
        "afterByteStart": 21,
        "afterByteLength": 66,
        "valueBeforeHex": "223030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022",
        "valueAfterHex": "223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "FLIP_BIT_0",
        "inputMemberPath": "fixtures/C42.before.bin",
        "outputMemberPath": "fixtures/C42.after.bin",
        "mask": {
          "beforeStart": 22,
          "beforeLength": 1,
          "afterStart": 22,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "7317552a8b62bde861bed494ff4ee4857b96fa6d98de604862b7dde7e80d8b17"
      },
      "measuredComplement": {
        "prefixBytes": 22,
        "suffixBytes": 66,
        "bytesHex": "7b22617374546f6f6c223a7b22736861323536223a22303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d",
        "sha256": "c0e45a7702f7479b58cd96df01013e5f33c505c6cfddf67254f4341da8f552d8"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C42/members/BASELINE/sha256",
          "before": "c83b0128ec3f7900ad59ec3bb2dc1c2d57ad0ed4d36e081d8ca63e399c374f3d",
          "after": "c83b0128ec3f7900ad59ec3bb2dc1c2d57ad0ed4d36e081d8ca63e399c374f3d",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C42/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "7317552a8b62bde861bed494ff4ee4857b96fa6d98de604862b7dde7e80d8b17",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C42/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "7317552a8b62bde861bed494ff4ee4857b96fa6d98de604862b7dde7e80d8b17",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    },
    {
      "domainId": "DM-C43",
      "fixtureId": "FX-C43",
      "schemaId": "SCHEMA-C43-V1",
      "locator": {
        "type": "JSON_POINTER",
        "path": "/claim/sourceJoin",
        "cardinalityBefore": 1,
        "cardinalityAfter": 1,
        "beforeByteStart": 23,
        "beforeByteLength": 66,
        "afterByteStart": 23,
        "afterByteLength": 66,
        "valueBeforeHex": "223030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022",
        "valueAfterHex": "223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022"
      },
      "operationReplay": {
        "algorithm": "REPLACE_EXACT_BYTE_MASK",
        "injectorOperation": "FLIP_BIT_0",
        "inputMemberPath": "fixtures/C43.before.bin",
        "outputMemberPath": "fixtures/C43.after.bin",
        "mask": {
          "beforeStart": 24,
          "beforeLength": 1,
          "afterStart": 24,
          "afterLength": 1
        },
        "insertHex": "31",
        "expectedOutputSha256": "50afc088b8f7f05aceb36a28249675ce505433ccad27026a3e7329e29c973d9f"
      },
      "measuredComplement": {
        "prefixBytes": 24,
        "suffixBytes": 66,
        "bytesHex": "7b22636c61696d223a7b22736f757263654a6f696e223a22303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d",
        "sha256": "e6b4c91f4589f4446f78b56844c3d3cf4c9f85acbfd52b2697f789afe5adc308"
      },
      "collateral": [
        {
          "path": "/fixtures/FX-C43/members/BASELINE/sha256",
          "before": "5d63b4a2d9c2c892819cffd7a0370d6a2fb2198c67abe86c9da83a0e593b7b3e",
          "after": "5d63b4a2d9c2c892819cffd7a0370d6a2fb2198c67abe86c9da83a0e593b7b3e",
          "law": "PRODUCTION_PIN_UNCHANGED"
        },
        {
          "path": "/fixtures/FX-C43/members/AUDIT_MUTANT/sha256",
          "before": null,
          "after": "50afc088b8f7f05aceb36a28249675ce505433ccad27026a3e7329e29c973d9f",
          "law": "AUDIT_MEMBER_DERIVED"
        },
        {
          "path": "/domains/DM-C43/operationReplay/expectedOutputSha256",
          "before": null,
          "after": "50afc088b8f7f05aceb36a28249675ce505433ccad27026a3e7329e29c973d9f",
          "law": "AUDIT_REPLAY_DERIVED"
        }
      ]
    }
  ],
  "controls": [
    {
      "controlId": "C01",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C01",
      "domainId": "DM-C01",
      "schemaId": "SCHEMA-C01-V1",
      "locatorRef": "DM-C01#/locator",
      "beforeMemberPath": "fixtures/C01.before.bin",
      "afterMemberPath": "fixtures/C01.after.bin",
      "injectorRef": "DM-C01#/operationReplay",
      "rebaseRef": "DM-C01#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P0",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)",
        "astNodePath": "/validateDeclarationHash",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateDeclarationHash)",
        "leafId": "validateDeclarationHash"
      },
      "uniqueCode": "DECLARATION_HASH_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P0",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)",
        "astNodePath": "/validateDeclarationHash",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateDeclarationHash)",
        "leafId": "validateDeclarationHash"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C01",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateDeclarationHash)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C01",
        "domainId": "DM-C01",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 0,
        "count": 28
      }
    },
    {
      "controlId": "C02",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C02",
      "domainId": "DM-C02",
      "schemaId": "SCHEMA-C02-V1",
      "locatorRef": "DM-C02#/locator",
      "beforeMemberPath": "fixtures/C02.before.bin",
      "afterMemberPath": "fixtures/C02.after.bin",
      "injectorRef": "DM-C02#/operationReplay",
      "rebaseRef": "DM-C02#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P0",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)",
        "astNodePath": "/validateLedgerRoot",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateLedgerRoot)",
        "leafId": "validateLedgerRoot"
      },
      "uniqueCode": "LEDGER_ROOT_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P0",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)",
        "astNodePath": "/validateLedgerRoot",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateLedgerRoot)",
        "leafId": "validateLedgerRoot"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C02",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateLedgerRoot)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C02",
        "domainId": "DM-C02",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 28,
        "count": 28
      }
    },
    {
      "controlId": "C03",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C03",
      "domainId": "DM-C03",
      "schemaId": "SCHEMA-C03-V1",
      "locatorRef": "DM-C03#/locator",
      "beforeMemberPath": "fixtures/C03.before.bin",
      "afterMemberPath": "fixtures/C03.after.bin",
      "injectorRef": "DM-C03#/operationReplay",
      "rebaseRef": "DM-C03#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P0",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)",
        "astNodePath": "/validateVersionParent",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateVersionParent)",
        "leafId": "validateVersionParent"
      },
      "uniqueCode": "VERSION_PARENT_INVALID",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P0",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)",
        "astNodePath": "/validateVersionParent",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateVersionParent)",
        "leafId": "validateVersionParent"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C03",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateVersionParent)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C03",
        "domainId": "DM-C03",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 56,
        "count": 28
      }
    },
    {
      "controlId": "C04",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C04",
      "domainId": "DM-C04",
      "schemaId": "SCHEMA-C04-V1",
      "locatorRef": "DM-C04#/locator",
      "beforeMemberPath": "fixtures/C04.before.bin",
      "afterMemberPath": "fixtures/C04.after.bin",
      "injectorRef": "DM-C04#/operationReplay",
      "rebaseRef": "DM-C04#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P0",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)",
        "astNodePath": "/validateEffectKey",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateEffectKey)",
        "leafId": "validateEffectKey"
      },
      "uniqueCode": "EFFECT_KEY_INVALID",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P0",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)",
        "astNodePath": "/validateEffectKey",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateEffectKey)",
        "leafId": "validateEffectKey"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C04",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateEffectKey)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C04",
        "domainId": "DM-C04",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 84,
        "count": 28
      }
    },
    {
      "controlId": "C05",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C05",
      "domainId": "DM-C05",
      "schemaId": "SCHEMA-C05-V1",
      "locatorRef": "DM-C05#/locator",
      "beforeMemberPath": "fixtures/C05.before.bin",
      "afterMemberPath": "fixtures/C05.after.bin",
      "injectorRef": "DM-C05#/operationReplay",
      "rebaseRef": "DM-C05#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P0",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)",
        "astNodePath": "/validateExperimentSelection",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateExperimentSelection)",
        "leafId": "validateExperimentSelection"
      },
      "uniqueCode": "EXPERIMENT_SELECTION_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P0",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P0)",
        "astNodePath": "/validateExperimentSelection",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateExperimentSelection)",
        "leafId": "validateExperimentSelection"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C05",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P0:/validateExperimentSelection)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C05",
        "domainId": "DM-C05",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 112,
        "count": 28
      }
    },
    {
      "controlId": "C06",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C06",
      "domainId": "DM-C06",
      "schemaId": "SCHEMA-C06-V1",
      "locatorRef": "DM-C06#/locator",
      "beforeMemberPath": "fixtures/C06.before.bin",
      "afterMemberPath": "fixtures/C06.after.bin",
      "injectorRef": "DM-C06#/operationReplay",
      "rebaseRef": "DM-C06#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P2",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P2)",
        "astNodePath": "/validateEditReplay",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P2:/validateEditReplay)",
        "leafId": "validateEditReplay"
      },
      "uniqueCode": "EDIT_REPLAY_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P2",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P2)",
        "astNodePath": "/validateEditReplay",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P2:/validateEditReplay)",
        "leafId": "validateEditReplay"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C06",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P2:/validateEditReplay)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C06",
        "domainId": "DM-C06",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 140,
        "count": 28
      }
    },
    {
      "controlId": "C07",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C07",
      "domainId": "DM-C07",
      "schemaId": "SCHEMA-C07-V1",
      "locatorRef": "DM-C07#/locator",
      "beforeMemberPath": "fixtures/C07.before.bin",
      "afterMemberPath": "fixtures/C07.after.bin",
      "injectorRef": "DM-C07#/operationReplay",
      "rebaseRef": "DM-C07#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P3",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P3)",
        "astNodePath": "/validateTargetDepth",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P3:/validateTargetDepth)",
        "leafId": "validateTargetDepth"
      },
      "uniqueCode": "TARGET_DEPTH_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P3",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P3)",
        "astNodePath": "/validateTargetDepth",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P3:/validateTargetDepth)",
        "leafId": "validateTargetDepth"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C07",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P3:/validateTargetDepth)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C07",
        "domainId": "DM-C07",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 168,
        "count": 28
      }
    },
    {
      "controlId": "C08",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C08",
      "domainId": "DM-C08",
      "schemaId": "SCHEMA-C08-V1",
      "locatorRef": "DM-C08#/locator",
      "beforeMemberPath": "fixtures/C08.before.bin",
      "afterMemberPath": "fixtures/C08.after.bin",
      "injectorRef": "DM-C08#/operationReplay",
      "rebaseRef": "DM-C08#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P3",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P3)",
        "astNodePath": "/validateTargetProduct",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P3:/validateTargetProduct)",
        "leafId": "validateTargetProduct"
      },
      "uniqueCode": "TARGET_PRODUCT_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P3",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P3)",
        "astNodePath": "/validateTargetProduct",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P3:/validateTargetProduct)",
        "leafId": "validateTargetProduct"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C08",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P3:/validateTargetProduct)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C08",
        "domainId": "DM-C08",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 196,
        "count": 28
      }
    },
    {
      "controlId": "C09",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C09",
      "domainId": "DM-C09",
      "schemaId": "SCHEMA-C09-V1",
      "locatorRef": "DM-C09#/locator",
      "beforeMemberPath": "fixtures/C09.before.bin",
      "afterMemberPath": "fixtures/C09.after.bin",
      "injectorRef": "DM-C09#/operationReplay",
      "rebaseRef": "DM-C09#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P4",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P4)",
        "astNodePath": "/validateEffectOccurrence",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P4:/validateEffectOccurrence)",
        "leafId": "validateEffectOccurrence"
      },
      "uniqueCode": "EFFECT_OCCURRENCE_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P4",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P4)",
        "astNodePath": "/validateEffectOccurrence",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P4:/validateEffectOccurrence)",
        "leafId": "validateEffectOccurrence"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C09",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P4:/validateEffectOccurrence)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C09",
        "domainId": "DM-C09",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 224,
        "count": 28
      }
    },
    {
      "controlId": "C10",
      "profile": "PREPIN_REBASE",
      "fixtureId": "FX-C10",
      "domainId": "DM-C10",
      "schemaId": "SCHEMA-C10-V1",
      "locatorRef": "DM-C10#/locator",
      "beforeMemberPath": "fixtures/C10.before.bin",
      "afterMemberPath": "fixtures/C10.after.bin",
      "injectorRef": "DM-C10#/operationReplay",
      "rebaseRef": "DM-C10#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validatePlanRole",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validatePlanRole)",
        "leafId": "validatePlanRole"
      },
      "uniqueCode": "RUN_ROLE_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validatePlanRole",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validatePlanRole)",
        "leafId": "validatePlanRole"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C10",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validatePlanRole)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C10",
        "domainId": "DM-C10",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 252,
        "count": 28
      }
    },
    {
      "controlId": "C11",
      "profile": "PREPIN_REBASE",
      "fixtureId": "FX-C11",
      "domainId": "DM-C11",
      "schemaId": "SCHEMA-C11-V1",
      "locatorRef": "DM-C11#/locator",
      "beforeMemberPath": "fixtures/C11.before.bin",
      "afterMemberPath": "fixtures/C11.after.bin",
      "injectorRef": "DM-C11#/operationReplay",
      "rebaseRef": "DM-C11#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateInputAuthorityPin",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateInputAuthorityPin)",
        "leafId": "validateInputAuthorityPin"
      },
      "uniqueCode": "INPUT_AUTHORITY_PIN_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateInputAuthorityPin",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateInputAuthorityPin)",
        "leafId": "validateInputAuthorityPin"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C11",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateInputAuthorityPin)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C11",
        "domainId": "DM-C11",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 280,
        "count": 28
      }
    },
    {
      "controlId": "C12",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C12",
      "domainId": "DM-C12",
      "schemaId": "SCHEMA-C12-V1",
      "locatorRef": "DM-C12#/locator",
      "beforeMemberPath": "fixtures/C12.before.bin",
      "afterMemberPath": "fixtures/C12.after.bin",
      "injectorRef": "DM-C12#/operationReplay",
      "rebaseRef": "DM-C12#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateCommandEnvelopeCapture",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateCommandEnvelopeCapture)",
        "leafId": "validateCommandEnvelopeCapture"
      },
      "uniqueCode": "COMMAND_ENVELOPE_CAPTURE_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateCommandEnvelopeCapture",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateCommandEnvelopeCapture)",
        "leafId": "validateCommandEnvelopeCapture"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C12",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateCommandEnvelopeCapture)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C12",
        "domainId": "DM-C12",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 308,
        "count": 28
      }
    },
    {
      "controlId": "C13",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C13",
      "domainId": "DM-C13",
      "schemaId": "SCHEMA-C13-V1",
      "locatorRef": "DM-C13#/locator",
      "beforeMemberPath": "fixtures/C13.before.bin",
      "afterMemberPath": "fixtures/C13.after.bin",
      "injectorRef": "DM-C13#/operationReplay",
      "rebaseRef": "DM-C13#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateRunChronology",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateRunChronology)",
        "leafId": "validateRunChronology"
      },
      "uniqueCode": "RUN_CHRONOLOGY_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateRunChronology",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateRunChronology)",
        "leafId": "validateRunChronology"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C13",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateRunChronology)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C13",
        "domainId": "DM-C13",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 336,
        "count": 28
      }
    },
    {
      "controlId": "C14",
      "profile": "PREPIN_REBASE",
      "fixtureId": "FX-C14",
      "domainId": "DM-C14",
      "schemaId": "SCHEMA-C14-V1",
      "locatorRef": "DM-C14#/locator",
      "beforeMemberPath": "fixtures/C14.before.bin",
      "afterMemberPath": "fixtures/C14.after.bin",
      "injectorRef": "DM-C14#/operationReplay",
      "rebaseRef": "DM-C14#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateCapabilityIsolation",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateCapabilityIsolation)",
        "leafId": "validateCapabilityIsolation"
      },
      "uniqueCode": "CAPABILITY_ISOLATION_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateCapabilityIsolation",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateCapabilityIsolation)",
        "leafId": "validateCapabilityIsolation"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C14",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateCapabilityIsolation)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C14",
        "domainId": "DM-C14",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 364,
        "count": 28
      }
    },
    {
      "controlId": "C15",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C15",
      "domainId": "DM-C15",
      "schemaId": "SCHEMA-C15-V1",
      "locatorRef": "DM-C15#/locator",
      "beforeMemberPath": "fixtures/C15.before.bin",
      "afterMemberPath": "fixtures/C15.after.bin",
      "injectorRef": "DM-C15#/operationReplay",
      "rebaseRef": "DM-C15#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateInvocationAuthority",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateInvocationAuthority)",
        "leafId": "validateInvocationAuthority"
      },
      "uniqueCode": "INVOCATION_AUTHORITY_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateInvocationAuthority",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateInvocationAuthority)",
        "leafId": "validateInvocationAuthority"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C15",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateInvocationAuthority)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C15",
        "domainId": "DM-C15",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 392,
        "count": 28
      }
    },
    {
      "controlId": "C16",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C16",
      "domainId": "DM-C16",
      "schemaId": "SCHEMA-C16-V1",
      "locatorRef": "DM-C16#/locator",
      "beforeMemberPath": "fixtures/C16.before.bin",
      "afterMemberPath": "fixtures/C16.after.bin",
      "injectorRef": "DM-C16#/operationReplay",
      "rebaseRef": "DM-C16#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateFreshnessIsolation",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateFreshnessIsolation)",
        "leafId": "validateFreshnessIsolation"
      },
      "uniqueCode": "FRESHNESS_ISOLATION_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateFreshnessIsolation",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateFreshnessIsolation)",
        "leafId": "validateFreshnessIsolation"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C16",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateFreshnessIsolation)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C16",
        "domainId": "DM-C16",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 420,
        "count": 28
      }
    },
    {
      "controlId": "C17",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C17",
      "domainId": "DM-C17",
      "schemaId": "SCHEMA-C17-V1",
      "locatorRef": "DM-C17#/locator",
      "beforeMemberPath": "fixtures/C17.before.bin",
      "afterMemberPath": "fixtures/C17.after.bin",
      "injectorRef": "DM-C17#/operationReplay",
      "rebaseRef": "DM-C17#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateObservationMembershipRoot",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationMembershipRoot)",
        "leafId": "validateObservationMembershipRoot"
      },
      "uniqueCode": "OBSERVATION_MEMBERSHIP_ROOT_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateObservationMembershipRoot",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationMembershipRoot)",
        "leafId": "validateObservationMembershipRoot"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C17",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationMembershipRoot)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C17",
        "domainId": "DM-C17",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 448,
        "count": 28
      }
    },
    {
      "controlId": "C18",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C18",
      "domainId": "DM-C18",
      "schemaId": "SCHEMA-C18-V1",
      "locatorRef": "DM-C18#/locator",
      "beforeMemberPath": "fixtures/C18.before.bin",
      "afterMemberPath": "fixtures/C18.after.bin",
      "injectorRef": "DM-C18#/operationReplay",
      "rebaseRef": "DM-C18#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateObservationSeal",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationSeal)",
        "leafId": "validateObservationSeal"
      },
      "uniqueCode": "OBSERVATION_SEAL_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateObservationSeal",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationSeal)",
        "leafId": "validateObservationSeal"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C18",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationSeal)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C18",
        "domainId": "DM-C18",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 476,
        "count": 28
      }
    },
    {
      "controlId": "C19",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C19",
      "domainId": "DM-C19",
      "schemaId": "SCHEMA-C19-V1",
      "locatorRef": "DM-C19#/locator",
      "beforeMemberPath": "fixtures/C19.before.bin",
      "afterMemberPath": "fixtures/C19.after.bin",
      "injectorRef": "DM-C19#/operationReplay",
      "rebaseRef": "DM-C19#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateObservationAdmission",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationAdmission)",
        "leafId": "validateObservationAdmission"
      },
      "uniqueCode": "OBSERVATION_ADMISSION_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P5",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P5)",
        "astNodePath": "/validateObservationAdmission",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationAdmission)",
        "leafId": "validateObservationAdmission"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C19",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P5:/validateObservationAdmission)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C19",
        "domainId": "DM-C19",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 504,
        "count": 28
      }
    },
    {
      "controlId": "C20",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C20",
      "domainId": "DM-C20",
      "schemaId": "SCHEMA-C20-V1",
      "locatorRef": "DM-C20#/locator",
      "beforeMemberPath": "fixtures/C20.before.bin",
      "afterMemberPath": "fixtures/C20.after.bin",
      "injectorRef": "DM-C20#/operationReplay",
      "rebaseRef": "DM-C20#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafDuplicateKey",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafDuplicateKey)",
        "leafId": "leafDuplicateKey"
      },
      "uniqueCode": "CANONICAL_DUPLICATE_KEY",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafDuplicateKey",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafDuplicateKey)",
        "leafId": "leafDuplicateKey"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C20",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafDuplicateKey)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C20",
        "domainId": "DM-C20",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 532,
        "count": 28
      }
    },
    {
      "controlId": "C21",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C21",
      "domainId": "DM-C21",
      "schemaId": "SCHEMA-C21-V1",
      "locatorRef": "DM-C21#/locator",
      "beforeMemberPath": "fixtures/C21.before.bin",
      "afterMemberPath": "fixtures/C21.after.bin",
      "injectorRef": "DM-C21#/operationReplay",
      "rebaseRef": "DM-C21#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafNestedDuplicateKey",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafNestedDuplicateKey)",
        "leafId": "leafNestedDuplicateKey"
      },
      "uniqueCode": "CANONICAL_NESTED_DUPLICATE_KEY",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafNestedDuplicateKey",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafNestedDuplicateKey)",
        "leafId": "leafNestedDuplicateKey"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C21",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafNestedDuplicateKey)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C21",
        "domainId": "DM-C21",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 560,
        "count": 28
      }
    },
    {
      "controlId": "C22",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C22",
      "domainId": "DM-C22",
      "schemaId": "SCHEMA-C22-V1",
      "locatorRef": "DM-C22#/locator",
      "beforeMemberPath": "fixtures/C22.before.bin",
      "afterMemberPath": "fixtures/C22.after.bin",
      "injectorRef": "DM-C22#/operationReplay",
      "rebaseRef": "DM-C22#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafEscapedSlash",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafEscapedSlash)",
        "leafId": "leafEscapedSlash"
      },
      "uniqueCode": "CANONICAL_ESCAPED_SLASH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafEscapedSlash",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafEscapedSlash)",
        "leafId": "leafEscapedSlash"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C22",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafEscapedSlash)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C22",
        "domainId": "DM-C22",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 588,
        "count": 28
      }
    },
    {
      "controlId": "C23",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C23",
      "domainId": "DM-C23",
      "schemaId": "SCHEMA-C23-V1",
      "locatorRef": "DM-C23#/locator",
      "beforeMemberPath": "fixtures/C23.before.bin",
      "afterMemberPath": "fixtures/C23.after.bin",
      "injectorRef": "DM-C23#/operationReplay",
      "rebaseRef": "DM-C23#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafLowerHex",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafLowerHex)",
        "leafId": "leafLowerHex"
      },
      "uniqueCode": "CANONICAL_HEX_CASE",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafLowerHex",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafLowerHex)",
        "leafId": "leafLowerHex"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C23",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafLowerHex)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C23",
        "domainId": "DM-C23",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 616,
        "count": 28
      }
    },
    {
      "controlId": "C24",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C24",
      "domainId": "DM-C24",
      "schemaId": "SCHEMA-C24-V1",
      "locatorRef": "DM-C24#/locator",
      "beforeMemberPath": "fixtures/C24.before.bin",
      "afterMemberPath": "fixtures/C24.after.bin",
      "injectorRef": "DM-C24#/operationReplay",
      "rebaseRef": "DM-C24#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafShortControl",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafShortControl)",
        "leafId": "leafShortControl"
      },
      "uniqueCode": "CANONICAL_CONTROL_FORM",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafShortControl",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafShortControl)",
        "leafId": "leafShortControl"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C24",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafShortControl)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C24",
        "domainId": "DM-C24",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 644,
        "count": 28
      }
    },
    {
      "controlId": "C25",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C25",
      "domainId": "DM-C25",
      "schemaId": "SCHEMA-C25-V1",
      "locatorRef": "DM-C25#/locator",
      "beforeMemberPath": "fixtures/C25.before.bin",
      "afterMemberPath": "fixtures/C25.after.bin",
      "injectorRef": "DM-C25#/operationReplay",
      "rebaseRef": "DM-C25#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafKeyOrder",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafKeyOrder)",
        "leafId": "leafKeyOrder"
      },
      "uniqueCode": "CANONICAL_KEY_ORDER",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafKeyOrder",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafKeyOrder)",
        "leafId": "leafKeyOrder"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C25",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafKeyOrder)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C25",
        "domainId": "DM-C25",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 672,
        "count": 28
      }
    },
    {
      "controlId": "C26",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C26",
      "domainId": "DM-C26",
      "schemaId": "SCHEMA-C26-V1",
      "locatorRef": "DM-C26#/locator",
      "beforeMemberPath": "fixtures/C26.before.bin",
      "afterMemberPath": "fixtures/C26.after.bin",
      "injectorRef": "DM-C26#/operationReplay",
      "rebaseRef": "DM-C26#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafIntegerForm",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafIntegerForm)",
        "leafId": "leafIntegerForm"
      },
      "uniqueCode": "CANONICAL_INTEGER_FORM",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafIntegerForm",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafIntegerForm)",
        "leafId": "leafIntegerForm"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C26",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafIntegerForm)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C26",
        "domainId": "DM-C26",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 700,
        "count": 28
      }
    },
    {
      "controlId": "C27",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C27",
      "domainId": "DM-C27",
      "schemaId": "SCHEMA-C27-V1",
      "locatorRef": "DM-C27#/locator",
      "beforeMemberPath": "fixtures/C27.before.bin",
      "afterMemberPath": "fixtures/C27.after.bin",
      "injectorRef": "DM-C27#/operationReplay",
      "rebaseRef": "DM-C27#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafUtf8Scalar",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafUtf8Scalar)",
        "leafId": "leafUtf8Scalar"
      },
      "uniqueCode": "CANONICAL_UTF8_SCALAR",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafUtf8Scalar",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafUtf8Scalar)",
        "leafId": "leafUtf8Scalar"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C27",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafUtf8Scalar)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C27",
        "domainId": "DM-C27",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 728,
        "count": 28
      }
    },
    {
      "controlId": "C28",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C28",
      "domainId": "DM-C28",
      "schemaId": "SCHEMA-C28-V1",
      "locatorRef": "DM-C28#/locator",
      "beforeMemberPath": "fixtures/C28.before.bin",
      "afterMemberPath": "fixtures/C28.after.bin",
      "injectorRef": "DM-C28#/operationReplay",
      "rebaseRef": "DM-C28#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafEnvelopeWhitespace",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafEnvelopeWhitespace)",
        "leafId": "leafEnvelopeWhitespace"
      },
      "uniqueCode": "CANONICAL_WHITESPACE",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafEnvelopeWhitespace",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafEnvelopeWhitespace)",
        "leafId": "leafEnvelopeWhitespace"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C28",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafEnvelopeWhitespace)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C28",
        "domainId": "DM-C28",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 756,
        "count": 28
      }
    },
    {
      "controlId": "C29",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C29",
      "domainId": "DM-C29",
      "schemaId": "SCHEMA-C29-V1",
      "locatorRef": "DM-C29#/locator",
      "beforeMemberPath": "fixtures/C29.before.bin",
      "afterMemberPath": "fixtures/C29.after.bin",
      "injectorRef": "DM-C29#/operationReplay",
      "rebaseRef": "DM-C29#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafTaggedConstructor",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafTaggedConstructor)",
        "leafId": "leafTaggedConstructor"
      },
      "uniqueCode": "CANONICAL_UNKNOWN_TAG",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P1",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P1)",
        "astNodePath": "/leafTaggedConstructor",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafTaggedConstructor)",
        "leafId": "leafTaggedConstructor"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C29",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P1:/leafTaggedConstructor)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C29",
        "domainId": "DM-C29",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 784,
        "count": 28
      }
    },
    {
      "controlId": "C30",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C30",
      "domainId": "DM-C30",
      "schemaId": "SCHEMA-C30-V1",
      "locatorRef": "DM-C30#/locator",
      "beforeMemberPath": "fixtures/C30.before.bin",
      "afterMemberPath": "fixtures/C30.after.bin",
      "injectorRef": "DM-C30#/operationReplay",
      "rebaseRef": "DM-C30#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafModuleSet",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafModuleSet)",
        "leafId": "leafModuleSet"
      },
      "uniqueCode": "SOURCE_MODULE_SET",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafModuleSet",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafModuleSet)",
        "leafId": "leafModuleSet"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C30",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafModuleSet)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C30",
        "domainId": "DM-C30",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 812,
        "count": 13
      }
    },
    {
      "controlId": "C31",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C31",
      "domainId": "DM-C31",
      "schemaId": "SCHEMA-C31-V1",
      "locatorRef": "DM-C31#/locator",
      "beforeMemberPath": "fixtures/C31.before.bin",
      "afterMemberPath": "fixtures/C31.after.bin",
      "injectorRef": "DM-C31#/operationReplay",
      "rebaseRef": "DM-C31#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafSourceHash",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafSourceHash)",
        "leafId": "leafSourceHash"
      },
      "uniqueCode": "SOURCE_HASH_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafSourceHash",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafSourceHash)",
        "leafId": "leafSourceHash"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C31",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafSourceHash)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C31",
        "domainId": "DM-C31",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 825,
        "count": 13
      }
    },
    {
      "controlId": "C32",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C32",
      "domainId": "DM-C32",
      "schemaId": "SCHEMA-C32-V1",
      "locatorRef": "DM-C32#/locator",
      "beforeMemberPath": "fixtures/C32.before.bin",
      "afterMemberPath": "fixtures/C32.after.bin",
      "injectorRef": "DM-C32#/operationReplay",
      "rebaseRef": "DM-C32#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafProseHash",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafProseHash)",
        "leafId": "leafProseHash"
      },
      "uniqueCode": "PROSE_HASH_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafProseHash",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafProseHash)",
        "leafId": "leafProseHash"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C32",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafProseHash)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C32",
        "domainId": "DM-C32",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 838,
        "count": 13
      }
    },
    {
      "controlId": "C33",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C33",
      "domainId": "DM-C33",
      "schemaId": "SCHEMA-C33-V1",
      "locatorRef": "DM-C33#/locator",
      "beforeMemberPath": "fixtures/C33.before.bin",
      "afterMemberPath": "fixtures/C33.after.bin",
      "injectorRef": "DM-C33#/operationReplay",
      "rebaseRef": "DM-C33#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafEdgeGraph",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafEdgeGraph)",
        "leafId": "leafEdgeGraph"
      },
      "uniqueCode": "EDGE_MISSING",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafEdgeGraph",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafEdgeGraph)",
        "leafId": "leafEdgeGraph"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C33",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafEdgeGraph)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C33",
        "domainId": "DM-C33",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 851,
        "count": 13
      }
    },
    {
      "controlId": "C34",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C34",
      "domainId": "DM-C34",
      "schemaId": "SCHEMA-C34-V1",
      "locatorRef": "DM-C34#/locator",
      "beforeMemberPath": "fixtures/C34.before.bin",
      "afterMemberPath": "fixtures/C34.after.bin",
      "injectorRef": "DM-C34#/operationReplay",
      "rebaseRef": "DM-C34#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafReverseEdge",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafReverseEdge)",
        "leafId": "leafReverseEdge"
      },
      "uniqueCode": "EDGE_REVERSE",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafReverseEdge",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafReverseEdge)",
        "leafId": "leafReverseEdge"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C34",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafReverseEdge)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C34",
        "domainId": "DM-C34",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 864,
        "count": 13
      }
    },
    {
      "controlId": "C35",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C35",
      "domainId": "DM-C35",
      "schemaId": "SCHEMA-C35-V1",
      "locatorRef": "DM-C35#/locator",
      "beforeMemberPath": "fixtures/C35.before.bin",
      "afterMemberPath": "fixtures/C35.after.bin",
      "injectorRef": "DM-C35#/operationReplay",
      "rebaseRef": "DM-C35#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafDynamicImport",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDynamicImport)",
        "leafId": "leafDynamicImport"
      },
      "uniqueCode": "DYNAMIC_IMPORT",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafDynamicImport",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDynamicImport)",
        "leafId": "leafDynamicImport"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C35",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDynamicImport)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C35",
        "domainId": "DM-C35",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 877,
        "count": 13
      }
    },
    {
      "controlId": "C36",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C36",
      "domainId": "DM-C36",
      "schemaId": "SCHEMA-C36-V1",
      "locatorRef": "DM-C36#/locator",
      "beforeMemberPath": "fixtures/C36.before.bin",
      "afterMemberPath": "fixtures/C36.after.bin",
      "injectorRef": "DM-C36#/operationReplay",
      "rebaseRef": "DM-C36#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafDynamicCode",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDynamicCode)",
        "leafId": "leafDynamicCode"
      },
      "uniqueCode": "DYNAMIC_CODE",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafDynamicCode",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDynamicCode)",
        "leafId": "leafDynamicCode"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C36",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDynamicCode)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C36",
        "domainId": "DM-C36",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 890,
        "count": 13
      }
    },
    {
      "controlId": "C37",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C37",
      "domainId": "DM-C37",
      "schemaId": "SCHEMA-C37-V1",
      "locatorRef": "DM-C37#/locator",
      "beforeMemberPath": "fixtures/C37.before.bin",
      "afterMemberPath": "fixtures/C37.after.bin",
      "injectorRef": "DM-C37#/operationReplay",
      "rebaseRef": "DM-C37#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafReflection",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafReflection)",
        "leafId": "leafReflection"
      },
      "uniqueCode": "REFLECTION_EDGE",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafReflection",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafReflection)",
        "leafId": "leafReflection"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C37",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafReflection)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C37",
        "domainId": "DM-C37",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 903,
        "count": 13
      }
    },
    {
      "controlId": "C38",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C38",
      "domainId": "DM-C38",
      "schemaId": "SCHEMA-C38-V1",
      "locatorRef": "DM-C38#/locator",
      "beforeMemberPath": "fixtures/C38.before.bin",
      "afterMemberPath": "fixtures/C38.after.bin",
      "injectorRef": "DM-C38#/operationReplay",
      "rebaseRef": "DM-C38#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafDependencyGraph",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDependencyGraph)",
        "leafId": "leafDependencyGraph"
      },
      "uniqueCode": "DEPENDENCY_HIDDEN",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafDependencyGraph",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDependencyGraph)",
        "leafId": "leafDependencyGraph"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C38",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafDependencyGraph)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C38",
        "domainId": "DM-C38",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 916,
        "count": 13
      }
    },
    {
      "controlId": "C39",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C39",
      "domainId": "DM-C39",
      "schemaId": "SCHEMA-C39-V1",
      "locatorRef": "DM-C39#/locator",
      "beforeMemberPath": "fixtures/C39.before.bin",
      "afterMemberPath": "fixtures/C39.after.bin",
      "injectorRef": "DM-C39#/operationReplay",
      "rebaseRef": "DM-C39#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafForbiddenSubstrate",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafForbiddenSubstrate)",
        "leafId": "leafForbiddenSubstrate"
      },
      "uniqueCode": "FORBIDDEN_SUBSTRATE",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafForbiddenSubstrate",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafForbiddenSubstrate)",
        "leafId": "leafForbiddenSubstrate"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C39",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafForbiddenSubstrate)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C39",
        "domainId": "DM-C39",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 929,
        "count": 13
      }
    },
    {
      "controlId": "C40",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C40",
      "domainId": "DM-C40",
      "schemaId": "SCHEMA-C40-V1",
      "locatorRef": "DM-C40#/locator",
      "beforeMemberPath": "fixtures/C40.before.bin",
      "afterMemberPath": "fixtures/C40.after.bin",
      "injectorRef": "DM-C40#/operationReplay",
      "rebaseRef": "DM-C40#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafModuleBudget",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafModuleBudget)",
        "leafId": "leafModuleBudget"
      },
      "uniqueCode": "MODULE_LOC_EXCEEDED",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafModuleBudget",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafModuleBudget)",
        "leafId": "leafModuleBudget"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C40",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafModuleBudget)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C40",
        "domainId": "DM-C40",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 942,
        "count": 13
      }
    },
    {
      "controlId": "C41",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C41",
      "domainId": "DM-C41",
      "schemaId": "SCHEMA-C41-V1",
      "locatorRef": "DM-C41#/locator",
      "beforeMemberPath": "fixtures/C41.before.bin",
      "afterMemberPath": "fixtures/C41.after.bin",
      "injectorRef": "DM-C41#/operationReplay",
      "rebaseRef": "DM-C41#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafTotalBudget",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafTotalBudget)",
        "leafId": "leafTotalBudget"
      },
      "uniqueCode": "TOTAL_LOC_EXCEEDED",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafTotalBudget",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafTotalBudget)",
        "leafId": "leafTotalBudget"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C41",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafTotalBudget)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C41",
        "domainId": "DM-C41",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 955,
        "count": 13
      }
    },
    {
      "controlId": "C42",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C42",
      "domainId": "DM-C42",
      "schemaId": "SCHEMA-C42-V1",
      "locatorRef": "DM-C42#/locator",
      "beforeMemberPath": "fixtures/C42.before.bin",
      "afterMemberPath": "fixtures/C42.after.bin",
      "injectorRef": "DM-C42#/operationReplay",
      "rebaseRef": "DM-C42#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafAstToolPin",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafAstToolPin)",
        "leafId": "leafAstToolPin"
      },
      "uniqueCode": "AST_TOOL_PIN_MISMATCH",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafAstToolPin",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafAstToolPin)",
        "leafId": "leafAstToolPin"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C42",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafAstToolPin)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C42",
        "domainId": "DM-C42",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 968,
        "count": 13
      }
    },
    {
      "controlId": "C43",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C43",
      "domainId": "DM-C43",
      "schemaId": "SCHEMA-C43-V1",
      "locatorRef": "DM-C43#/locator",
      "beforeMemberPath": "fixtures/C43.before.bin",
      "afterMemberPath": "fixtures/C43.after.bin",
      "injectorRef": "DM-C43#/operationReplay",
      "rebaseRef": "DM-C43#/collateral",
      "leafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafClaimSourceJoin",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafClaimSourceJoin)",
        "leafId": "leafClaimSourceJoin"
      },
      "uniqueCode": "CLAIM_SOURCE_DRIFT",
      "disabledLeafFunctionIdentity": {
        "ownerModule": "P7",
        "moduleSourceHashFormula": "SHA256(OWNER_MODULE_BYTES:P7)",
        "astNodePath": "/leafClaimSourceJoin",
        "bodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafClaimSourceJoin)",
        "leafId": "leafClaimSourceJoin"
      },
      "ownerSuppression": {
        "wrapperIdentity": "AUDIT_WRAPPER:C43",
        "removesExactBodyHashFormula": "SHA256(AST_NODE_BYTES:P7:/leafClaimSourceJoin)",
        "productionSuppressionArgument": false
      },
      "controlOfControl": {
        "fixtureId": "FX-C43",
        "domainId": "DM-C43",
        "operation": "REPLACE_AUDIT_MEMBER_WITH_BASELINE_MEMBER",
        "expected": "GREEN_BYTE_IDENTICAL"
      },
      "nonownerRetentionRange": {
        "start": 981,
        "count": 13
      }
    }
  ],
  "nonownerRetentions": [
    [
      "C01",
      "validateLedgerRoot"
    ],
    [
      "C01",
      "validateVersionParent"
    ],
    [
      "C01",
      "validateEffectKey"
    ],
    [
      "C01",
      "validateExperimentSelection"
    ],
    [
      "C01",
      "validateEditReplay"
    ],
    [
      "C01",
      "validateTargetDepth"
    ],
    [
      "C01",
      "validateTargetProduct"
    ],
    [
      "C01",
      "validateEffectOccurrence"
    ],
    [
      "C01",
      "validatePlanRole"
    ],
    [
      "C01",
      "validateInputAuthorityPin"
    ],
    [
      "C01",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C01",
      "validateRunChronology"
    ],
    [
      "C01",
      "validateCapabilityIsolation"
    ],
    [
      "C01",
      "validateInvocationAuthority"
    ],
    [
      "C01",
      "validateFreshnessIsolation"
    ],
    [
      "C01",
      "validateObservationMembershipRoot"
    ],
    [
      "C01",
      "validateObservationSeal"
    ],
    [
      "C01",
      "validateObservationAdmission"
    ],
    [
      "C01",
      "leafDuplicateKey"
    ],
    [
      "C01",
      "leafNestedDuplicateKey"
    ],
    [
      "C01",
      "leafEscapedSlash"
    ],
    [
      "C01",
      "leafLowerHex"
    ],
    [
      "C01",
      "leafShortControl"
    ],
    [
      "C01",
      "leafKeyOrder"
    ],
    [
      "C01",
      "leafIntegerForm"
    ],
    [
      "C01",
      "leafUtf8Scalar"
    ],
    [
      "C01",
      "leafEnvelopeWhitespace"
    ],
    [
      "C01",
      "leafTaggedConstructor"
    ],
    [
      "C02",
      "validateDeclarationHash"
    ],
    [
      "C02",
      "validateVersionParent"
    ],
    [
      "C02",
      "validateEffectKey"
    ],
    [
      "C02",
      "validateExperimentSelection"
    ],
    [
      "C02",
      "validateEditReplay"
    ],
    [
      "C02",
      "validateTargetDepth"
    ],
    [
      "C02",
      "validateTargetProduct"
    ],
    [
      "C02",
      "validateEffectOccurrence"
    ],
    [
      "C02",
      "validatePlanRole"
    ],
    [
      "C02",
      "validateInputAuthorityPin"
    ],
    [
      "C02",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C02",
      "validateRunChronology"
    ],
    [
      "C02",
      "validateCapabilityIsolation"
    ],
    [
      "C02",
      "validateInvocationAuthority"
    ],
    [
      "C02",
      "validateFreshnessIsolation"
    ],
    [
      "C02",
      "validateObservationMembershipRoot"
    ],
    [
      "C02",
      "validateObservationSeal"
    ],
    [
      "C02",
      "validateObservationAdmission"
    ],
    [
      "C02",
      "leafDuplicateKey"
    ],
    [
      "C02",
      "leafNestedDuplicateKey"
    ],
    [
      "C02",
      "leafEscapedSlash"
    ],
    [
      "C02",
      "leafLowerHex"
    ],
    [
      "C02",
      "leafShortControl"
    ],
    [
      "C02",
      "leafKeyOrder"
    ],
    [
      "C02",
      "leafIntegerForm"
    ],
    [
      "C02",
      "leafUtf8Scalar"
    ],
    [
      "C02",
      "leafEnvelopeWhitespace"
    ],
    [
      "C02",
      "leafTaggedConstructor"
    ],
    [
      "C03",
      "validateDeclarationHash"
    ],
    [
      "C03",
      "validateLedgerRoot"
    ],
    [
      "C03",
      "validateEffectKey"
    ],
    [
      "C03",
      "validateExperimentSelection"
    ],
    [
      "C03",
      "validateEditReplay"
    ],
    [
      "C03",
      "validateTargetDepth"
    ],
    [
      "C03",
      "validateTargetProduct"
    ],
    [
      "C03",
      "validateEffectOccurrence"
    ],
    [
      "C03",
      "validatePlanRole"
    ],
    [
      "C03",
      "validateInputAuthorityPin"
    ],
    [
      "C03",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C03",
      "validateRunChronology"
    ],
    [
      "C03",
      "validateCapabilityIsolation"
    ],
    [
      "C03",
      "validateInvocationAuthority"
    ],
    [
      "C03",
      "validateFreshnessIsolation"
    ],
    [
      "C03",
      "validateObservationMembershipRoot"
    ],
    [
      "C03",
      "validateObservationSeal"
    ],
    [
      "C03",
      "validateObservationAdmission"
    ],
    [
      "C03",
      "leafDuplicateKey"
    ],
    [
      "C03",
      "leafNestedDuplicateKey"
    ],
    [
      "C03",
      "leafEscapedSlash"
    ],
    [
      "C03",
      "leafLowerHex"
    ],
    [
      "C03",
      "leafShortControl"
    ],
    [
      "C03",
      "leafKeyOrder"
    ],
    [
      "C03",
      "leafIntegerForm"
    ],
    [
      "C03",
      "leafUtf8Scalar"
    ],
    [
      "C03",
      "leafEnvelopeWhitespace"
    ],
    [
      "C03",
      "leafTaggedConstructor"
    ],
    [
      "C04",
      "validateDeclarationHash"
    ],
    [
      "C04",
      "validateLedgerRoot"
    ],
    [
      "C04",
      "validateVersionParent"
    ],
    [
      "C04",
      "validateExperimentSelection"
    ],
    [
      "C04",
      "validateEditReplay"
    ],
    [
      "C04",
      "validateTargetDepth"
    ],
    [
      "C04",
      "validateTargetProduct"
    ],
    [
      "C04",
      "validateEffectOccurrence"
    ],
    [
      "C04",
      "validatePlanRole"
    ],
    [
      "C04",
      "validateInputAuthorityPin"
    ],
    [
      "C04",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C04",
      "validateRunChronology"
    ],
    [
      "C04",
      "validateCapabilityIsolation"
    ],
    [
      "C04",
      "validateInvocationAuthority"
    ],
    [
      "C04",
      "validateFreshnessIsolation"
    ],
    [
      "C04",
      "validateObservationMembershipRoot"
    ],
    [
      "C04",
      "validateObservationSeal"
    ],
    [
      "C04",
      "validateObservationAdmission"
    ],
    [
      "C04",
      "leafDuplicateKey"
    ],
    [
      "C04",
      "leafNestedDuplicateKey"
    ],
    [
      "C04",
      "leafEscapedSlash"
    ],
    [
      "C04",
      "leafLowerHex"
    ],
    [
      "C04",
      "leafShortControl"
    ],
    [
      "C04",
      "leafKeyOrder"
    ],
    [
      "C04",
      "leafIntegerForm"
    ],
    [
      "C04",
      "leafUtf8Scalar"
    ],
    [
      "C04",
      "leafEnvelopeWhitespace"
    ],
    [
      "C04",
      "leafTaggedConstructor"
    ],
    [
      "C05",
      "validateDeclarationHash"
    ],
    [
      "C05",
      "validateLedgerRoot"
    ],
    [
      "C05",
      "validateVersionParent"
    ],
    [
      "C05",
      "validateEffectKey"
    ],
    [
      "C05",
      "validateEditReplay"
    ],
    [
      "C05",
      "validateTargetDepth"
    ],
    [
      "C05",
      "validateTargetProduct"
    ],
    [
      "C05",
      "validateEffectOccurrence"
    ],
    [
      "C05",
      "validatePlanRole"
    ],
    [
      "C05",
      "validateInputAuthorityPin"
    ],
    [
      "C05",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C05",
      "validateRunChronology"
    ],
    [
      "C05",
      "validateCapabilityIsolation"
    ],
    [
      "C05",
      "validateInvocationAuthority"
    ],
    [
      "C05",
      "validateFreshnessIsolation"
    ],
    [
      "C05",
      "validateObservationMembershipRoot"
    ],
    [
      "C05",
      "validateObservationSeal"
    ],
    [
      "C05",
      "validateObservationAdmission"
    ],
    [
      "C05",
      "leafDuplicateKey"
    ],
    [
      "C05",
      "leafNestedDuplicateKey"
    ],
    [
      "C05",
      "leafEscapedSlash"
    ],
    [
      "C05",
      "leafLowerHex"
    ],
    [
      "C05",
      "leafShortControl"
    ],
    [
      "C05",
      "leafKeyOrder"
    ],
    [
      "C05",
      "leafIntegerForm"
    ],
    [
      "C05",
      "leafUtf8Scalar"
    ],
    [
      "C05",
      "leafEnvelopeWhitespace"
    ],
    [
      "C05",
      "leafTaggedConstructor"
    ],
    [
      "C06",
      "validateDeclarationHash"
    ],
    [
      "C06",
      "validateLedgerRoot"
    ],
    [
      "C06",
      "validateVersionParent"
    ],
    [
      "C06",
      "validateEffectKey"
    ],
    [
      "C06",
      "validateExperimentSelection"
    ],
    [
      "C06",
      "validateTargetDepth"
    ],
    [
      "C06",
      "validateTargetProduct"
    ],
    [
      "C06",
      "validateEffectOccurrence"
    ],
    [
      "C06",
      "validatePlanRole"
    ],
    [
      "C06",
      "validateInputAuthorityPin"
    ],
    [
      "C06",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C06",
      "validateRunChronology"
    ],
    [
      "C06",
      "validateCapabilityIsolation"
    ],
    [
      "C06",
      "validateInvocationAuthority"
    ],
    [
      "C06",
      "validateFreshnessIsolation"
    ],
    [
      "C06",
      "validateObservationMembershipRoot"
    ],
    [
      "C06",
      "validateObservationSeal"
    ],
    [
      "C06",
      "validateObservationAdmission"
    ],
    [
      "C06",
      "leafDuplicateKey"
    ],
    [
      "C06",
      "leafNestedDuplicateKey"
    ],
    [
      "C06",
      "leafEscapedSlash"
    ],
    [
      "C06",
      "leafLowerHex"
    ],
    [
      "C06",
      "leafShortControl"
    ],
    [
      "C06",
      "leafKeyOrder"
    ],
    [
      "C06",
      "leafIntegerForm"
    ],
    [
      "C06",
      "leafUtf8Scalar"
    ],
    [
      "C06",
      "leafEnvelopeWhitespace"
    ],
    [
      "C06",
      "leafTaggedConstructor"
    ],
    [
      "C07",
      "validateDeclarationHash"
    ],
    [
      "C07",
      "validateLedgerRoot"
    ],
    [
      "C07",
      "validateVersionParent"
    ],
    [
      "C07",
      "validateEffectKey"
    ],
    [
      "C07",
      "validateExperimentSelection"
    ],
    [
      "C07",
      "validateEditReplay"
    ],
    [
      "C07",
      "validateTargetProduct"
    ],
    [
      "C07",
      "validateEffectOccurrence"
    ],
    [
      "C07",
      "validatePlanRole"
    ],
    [
      "C07",
      "validateInputAuthorityPin"
    ],
    [
      "C07",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C07",
      "validateRunChronology"
    ],
    [
      "C07",
      "validateCapabilityIsolation"
    ],
    [
      "C07",
      "validateInvocationAuthority"
    ],
    [
      "C07",
      "validateFreshnessIsolation"
    ],
    [
      "C07",
      "validateObservationMembershipRoot"
    ],
    [
      "C07",
      "validateObservationSeal"
    ],
    [
      "C07",
      "validateObservationAdmission"
    ],
    [
      "C07",
      "leafDuplicateKey"
    ],
    [
      "C07",
      "leafNestedDuplicateKey"
    ],
    [
      "C07",
      "leafEscapedSlash"
    ],
    [
      "C07",
      "leafLowerHex"
    ],
    [
      "C07",
      "leafShortControl"
    ],
    [
      "C07",
      "leafKeyOrder"
    ],
    [
      "C07",
      "leafIntegerForm"
    ],
    [
      "C07",
      "leafUtf8Scalar"
    ],
    [
      "C07",
      "leafEnvelopeWhitespace"
    ],
    [
      "C07",
      "leafTaggedConstructor"
    ],
    [
      "C08",
      "validateDeclarationHash"
    ],
    [
      "C08",
      "validateLedgerRoot"
    ],
    [
      "C08",
      "validateVersionParent"
    ],
    [
      "C08",
      "validateEffectKey"
    ],
    [
      "C08",
      "validateExperimentSelection"
    ],
    [
      "C08",
      "validateEditReplay"
    ],
    [
      "C08",
      "validateTargetDepth"
    ],
    [
      "C08",
      "validateEffectOccurrence"
    ],
    [
      "C08",
      "validatePlanRole"
    ],
    [
      "C08",
      "validateInputAuthorityPin"
    ],
    [
      "C08",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C08",
      "validateRunChronology"
    ],
    [
      "C08",
      "validateCapabilityIsolation"
    ],
    [
      "C08",
      "validateInvocationAuthority"
    ],
    [
      "C08",
      "validateFreshnessIsolation"
    ],
    [
      "C08",
      "validateObservationMembershipRoot"
    ],
    [
      "C08",
      "validateObservationSeal"
    ],
    [
      "C08",
      "validateObservationAdmission"
    ],
    [
      "C08",
      "leafDuplicateKey"
    ],
    [
      "C08",
      "leafNestedDuplicateKey"
    ],
    [
      "C08",
      "leafEscapedSlash"
    ],
    [
      "C08",
      "leafLowerHex"
    ],
    [
      "C08",
      "leafShortControl"
    ],
    [
      "C08",
      "leafKeyOrder"
    ],
    [
      "C08",
      "leafIntegerForm"
    ],
    [
      "C08",
      "leafUtf8Scalar"
    ],
    [
      "C08",
      "leafEnvelopeWhitespace"
    ],
    [
      "C08",
      "leafTaggedConstructor"
    ],
    [
      "C09",
      "validateDeclarationHash"
    ],
    [
      "C09",
      "validateLedgerRoot"
    ],
    [
      "C09",
      "validateVersionParent"
    ],
    [
      "C09",
      "validateEffectKey"
    ],
    [
      "C09",
      "validateExperimentSelection"
    ],
    [
      "C09",
      "validateEditReplay"
    ],
    [
      "C09",
      "validateTargetDepth"
    ],
    [
      "C09",
      "validateTargetProduct"
    ],
    [
      "C09",
      "validatePlanRole"
    ],
    [
      "C09",
      "validateInputAuthorityPin"
    ],
    [
      "C09",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C09",
      "validateRunChronology"
    ],
    [
      "C09",
      "validateCapabilityIsolation"
    ],
    [
      "C09",
      "validateInvocationAuthority"
    ],
    [
      "C09",
      "validateFreshnessIsolation"
    ],
    [
      "C09",
      "validateObservationMembershipRoot"
    ],
    [
      "C09",
      "validateObservationSeal"
    ],
    [
      "C09",
      "validateObservationAdmission"
    ],
    [
      "C09",
      "leafDuplicateKey"
    ],
    [
      "C09",
      "leafNestedDuplicateKey"
    ],
    [
      "C09",
      "leafEscapedSlash"
    ],
    [
      "C09",
      "leafLowerHex"
    ],
    [
      "C09",
      "leafShortControl"
    ],
    [
      "C09",
      "leafKeyOrder"
    ],
    [
      "C09",
      "leafIntegerForm"
    ],
    [
      "C09",
      "leafUtf8Scalar"
    ],
    [
      "C09",
      "leafEnvelopeWhitespace"
    ],
    [
      "C09",
      "leafTaggedConstructor"
    ],
    [
      "C10",
      "validateDeclarationHash"
    ],
    [
      "C10",
      "validateLedgerRoot"
    ],
    [
      "C10",
      "validateVersionParent"
    ],
    [
      "C10",
      "validateEffectKey"
    ],
    [
      "C10",
      "validateExperimentSelection"
    ],
    [
      "C10",
      "validateEditReplay"
    ],
    [
      "C10",
      "validateTargetDepth"
    ],
    [
      "C10",
      "validateTargetProduct"
    ],
    [
      "C10",
      "validateEffectOccurrence"
    ],
    [
      "C10",
      "validateInputAuthorityPin"
    ],
    [
      "C10",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C10",
      "validateRunChronology"
    ],
    [
      "C10",
      "validateCapabilityIsolation"
    ],
    [
      "C10",
      "validateInvocationAuthority"
    ],
    [
      "C10",
      "validateFreshnessIsolation"
    ],
    [
      "C10",
      "validateObservationMembershipRoot"
    ],
    [
      "C10",
      "validateObservationSeal"
    ],
    [
      "C10",
      "validateObservationAdmission"
    ],
    [
      "C10",
      "leafDuplicateKey"
    ],
    [
      "C10",
      "leafNestedDuplicateKey"
    ],
    [
      "C10",
      "leafEscapedSlash"
    ],
    [
      "C10",
      "leafLowerHex"
    ],
    [
      "C10",
      "leafShortControl"
    ],
    [
      "C10",
      "leafKeyOrder"
    ],
    [
      "C10",
      "leafIntegerForm"
    ],
    [
      "C10",
      "leafUtf8Scalar"
    ],
    [
      "C10",
      "leafEnvelopeWhitespace"
    ],
    [
      "C10",
      "leafTaggedConstructor"
    ],
    [
      "C11",
      "validateDeclarationHash"
    ],
    [
      "C11",
      "validateLedgerRoot"
    ],
    [
      "C11",
      "validateVersionParent"
    ],
    [
      "C11",
      "validateEffectKey"
    ],
    [
      "C11",
      "validateExperimentSelection"
    ],
    [
      "C11",
      "validateEditReplay"
    ],
    [
      "C11",
      "validateTargetDepth"
    ],
    [
      "C11",
      "validateTargetProduct"
    ],
    [
      "C11",
      "validateEffectOccurrence"
    ],
    [
      "C11",
      "validatePlanRole"
    ],
    [
      "C11",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C11",
      "validateRunChronology"
    ],
    [
      "C11",
      "validateCapabilityIsolation"
    ],
    [
      "C11",
      "validateInvocationAuthority"
    ],
    [
      "C11",
      "validateFreshnessIsolation"
    ],
    [
      "C11",
      "validateObservationMembershipRoot"
    ],
    [
      "C11",
      "validateObservationSeal"
    ],
    [
      "C11",
      "validateObservationAdmission"
    ],
    [
      "C11",
      "leafDuplicateKey"
    ],
    [
      "C11",
      "leafNestedDuplicateKey"
    ],
    [
      "C11",
      "leafEscapedSlash"
    ],
    [
      "C11",
      "leafLowerHex"
    ],
    [
      "C11",
      "leafShortControl"
    ],
    [
      "C11",
      "leafKeyOrder"
    ],
    [
      "C11",
      "leafIntegerForm"
    ],
    [
      "C11",
      "leafUtf8Scalar"
    ],
    [
      "C11",
      "leafEnvelopeWhitespace"
    ],
    [
      "C11",
      "leafTaggedConstructor"
    ],
    [
      "C12",
      "validateDeclarationHash"
    ],
    [
      "C12",
      "validateLedgerRoot"
    ],
    [
      "C12",
      "validateVersionParent"
    ],
    [
      "C12",
      "validateEffectKey"
    ],
    [
      "C12",
      "validateExperimentSelection"
    ],
    [
      "C12",
      "validateEditReplay"
    ],
    [
      "C12",
      "validateTargetDepth"
    ],
    [
      "C12",
      "validateTargetProduct"
    ],
    [
      "C12",
      "validateEffectOccurrence"
    ],
    [
      "C12",
      "validatePlanRole"
    ],
    [
      "C12",
      "validateInputAuthorityPin"
    ],
    [
      "C12",
      "validateRunChronology"
    ],
    [
      "C12",
      "validateCapabilityIsolation"
    ],
    [
      "C12",
      "validateInvocationAuthority"
    ],
    [
      "C12",
      "validateFreshnessIsolation"
    ],
    [
      "C12",
      "validateObservationMembershipRoot"
    ],
    [
      "C12",
      "validateObservationSeal"
    ],
    [
      "C12",
      "validateObservationAdmission"
    ],
    [
      "C12",
      "leafDuplicateKey"
    ],
    [
      "C12",
      "leafNestedDuplicateKey"
    ],
    [
      "C12",
      "leafEscapedSlash"
    ],
    [
      "C12",
      "leafLowerHex"
    ],
    [
      "C12",
      "leafShortControl"
    ],
    [
      "C12",
      "leafKeyOrder"
    ],
    [
      "C12",
      "leafIntegerForm"
    ],
    [
      "C12",
      "leafUtf8Scalar"
    ],
    [
      "C12",
      "leafEnvelopeWhitespace"
    ],
    [
      "C12",
      "leafTaggedConstructor"
    ],
    [
      "C13",
      "validateDeclarationHash"
    ],
    [
      "C13",
      "validateLedgerRoot"
    ],
    [
      "C13",
      "validateVersionParent"
    ],
    [
      "C13",
      "validateEffectKey"
    ],
    [
      "C13",
      "validateExperimentSelection"
    ],
    [
      "C13",
      "validateEditReplay"
    ],
    [
      "C13",
      "validateTargetDepth"
    ],
    [
      "C13",
      "validateTargetProduct"
    ],
    [
      "C13",
      "validateEffectOccurrence"
    ],
    [
      "C13",
      "validatePlanRole"
    ],
    [
      "C13",
      "validateInputAuthorityPin"
    ],
    [
      "C13",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C13",
      "validateCapabilityIsolation"
    ],
    [
      "C13",
      "validateInvocationAuthority"
    ],
    [
      "C13",
      "validateFreshnessIsolation"
    ],
    [
      "C13",
      "validateObservationMembershipRoot"
    ],
    [
      "C13",
      "validateObservationSeal"
    ],
    [
      "C13",
      "validateObservationAdmission"
    ],
    [
      "C13",
      "leafDuplicateKey"
    ],
    [
      "C13",
      "leafNestedDuplicateKey"
    ],
    [
      "C13",
      "leafEscapedSlash"
    ],
    [
      "C13",
      "leafLowerHex"
    ],
    [
      "C13",
      "leafShortControl"
    ],
    [
      "C13",
      "leafKeyOrder"
    ],
    [
      "C13",
      "leafIntegerForm"
    ],
    [
      "C13",
      "leafUtf8Scalar"
    ],
    [
      "C13",
      "leafEnvelopeWhitespace"
    ],
    [
      "C13",
      "leafTaggedConstructor"
    ],
    [
      "C14",
      "validateDeclarationHash"
    ],
    [
      "C14",
      "validateLedgerRoot"
    ],
    [
      "C14",
      "validateVersionParent"
    ],
    [
      "C14",
      "validateEffectKey"
    ],
    [
      "C14",
      "validateExperimentSelection"
    ],
    [
      "C14",
      "validateEditReplay"
    ],
    [
      "C14",
      "validateTargetDepth"
    ],
    [
      "C14",
      "validateTargetProduct"
    ],
    [
      "C14",
      "validateEffectOccurrence"
    ],
    [
      "C14",
      "validatePlanRole"
    ],
    [
      "C14",
      "validateInputAuthorityPin"
    ],
    [
      "C14",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C14",
      "validateRunChronology"
    ],
    [
      "C14",
      "validateInvocationAuthority"
    ],
    [
      "C14",
      "validateFreshnessIsolation"
    ],
    [
      "C14",
      "validateObservationMembershipRoot"
    ],
    [
      "C14",
      "validateObservationSeal"
    ],
    [
      "C14",
      "validateObservationAdmission"
    ],
    [
      "C14",
      "leafDuplicateKey"
    ],
    [
      "C14",
      "leafNestedDuplicateKey"
    ],
    [
      "C14",
      "leafEscapedSlash"
    ],
    [
      "C14",
      "leafLowerHex"
    ],
    [
      "C14",
      "leafShortControl"
    ],
    [
      "C14",
      "leafKeyOrder"
    ],
    [
      "C14",
      "leafIntegerForm"
    ],
    [
      "C14",
      "leafUtf8Scalar"
    ],
    [
      "C14",
      "leafEnvelopeWhitespace"
    ],
    [
      "C14",
      "leafTaggedConstructor"
    ],
    [
      "C15",
      "validateDeclarationHash"
    ],
    [
      "C15",
      "validateLedgerRoot"
    ],
    [
      "C15",
      "validateVersionParent"
    ],
    [
      "C15",
      "validateEffectKey"
    ],
    [
      "C15",
      "validateExperimentSelection"
    ],
    [
      "C15",
      "validateEditReplay"
    ],
    [
      "C15",
      "validateTargetDepth"
    ],
    [
      "C15",
      "validateTargetProduct"
    ],
    [
      "C15",
      "validateEffectOccurrence"
    ],
    [
      "C15",
      "validatePlanRole"
    ],
    [
      "C15",
      "validateInputAuthorityPin"
    ],
    [
      "C15",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C15",
      "validateRunChronology"
    ],
    [
      "C15",
      "validateCapabilityIsolation"
    ],
    [
      "C15",
      "validateFreshnessIsolation"
    ],
    [
      "C15",
      "validateObservationMembershipRoot"
    ],
    [
      "C15",
      "validateObservationSeal"
    ],
    [
      "C15",
      "validateObservationAdmission"
    ],
    [
      "C15",
      "leafDuplicateKey"
    ],
    [
      "C15",
      "leafNestedDuplicateKey"
    ],
    [
      "C15",
      "leafEscapedSlash"
    ],
    [
      "C15",
      "leafLowerHex"
    ],
    [
      "C15",
      "leafShortControl"
    ],
    [
      "C15",
      "leafKeyOrder"
    ],
    [
      "C15",
      "leafIntegerForm"
    ],
    [
      "C15",
      "leafUtf8Scalar"
    ],
    [
      "C15",
      "leafEnvelopeWhitespace"
    ],
    [
      "C15",
      "leafTaggedConstructor"
    ],
    [
      "C16",
      "validateDeclarationHash"
    ],
    [
      "C16",
      "validateLedgerRoot"
    ],
    [
      "C16",
      "validateVersionParent"
    ],
    [
      "C16",
      "validateEffectKey"
    ],
    [
      "C16",
      "validateExperimentSelection"
    ],
    [
      "C16",
      "validateEditReplay"
    ],
    [
      "C16",
      "validateTargetDepth"
    ],
    [
      "C16",
      "validateTargetProduct"
    ],
    [
      "C16",
      "validateEffectOccurrence"
    ],
    [
      "C16",
      "validatePlanRole"
    ],
    [
      "C16",
      "validateInputAuthorityPin"
    ],
    [
      "C16",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C16",
      "validateRunChronology"
    ],
    [
      "C16",
      "validateCapabilityIsolation"
    ],
    [
      "C16",
      "validateInvocationAuthority"
    ],
    [
      "C16",
      "validateObservationMembershipRoot"
    ],
    [
      "C16",
      "validateObservationSeal"
    ],
    [
      "C16",
      "validateObservationAdmission"
    ],
    [
      "C16",
      "leafDuplicateKey"
    ],
    [
      "C16",
      "leafNestedDuplicateKey"
    ],
    [
      "C16",
      "leafEscapedSlash"
    ],
    [
      "C16",
      "leafLowerHex"
    ],
    [
      "C16",
      "leafShortControl"
    ],
    [
      "C16",
      "leafKeyOrder"
    ],
    [
      "C16",
      "leafIntegerForm"
    ],
    [
      "C16",
      "leafUtf8Scalar"
    ],
    [
      "C16",
      "leafEnvelopeWhitespace"
    ],
    [
      "C16",
      "leafTaggedConstructor"
    ],
    [
      "C17",
      "validateDeclarationHash"
    ],
    [
      "C17",
      "validateLedgerRoot"
    ],
    [
      "C17",
      "validateVersionParent"
    ],
    [
      "C17",
      "validateEffectKey"
    ],
    [
      "C17",
      "validateExperimentSelection"
    ],
    [
      "C17",
      "validateEditReplay"
    ],
    [
      "C17",
      "validateTargetDepth"
    ],
    [
      "C17",
      "validateTargetProduct"
    ],
    [
      "C17",
      "validateEffectOccurrence"
    ],
    [
      "C17",
      "validatePlanRole"
    ],
    [
      "C17",
      "validateInputAuthorityPin"
    ],
    [
      "C17",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C17",
      "validateRunChronology"
    ],
    [
      "C17",
      "validateCapabilityIsolation"
    ],
    [
      "C17",
      "validateInvocationAuthority"
    ],
    [
      "C17",
      "validateFreshnessIsolation"
    ],
    [
      "C17",
      "validateObservationSeal"
    ],
    [
      "C17",
      "validateObservationAdmission"
    ],
    [
      "C17",
      "leafDuplicateKey"
    ],
    [
      "C17",
      "leafNestedDuplicateKey"
    ],
    [
      "C17",
      "leafEscapedSlash"
    ],
    [
      "C17",
      "leafLowerHex"
    ],
    [
      "C17",
      "leafShortControl"
    ],
    [
      "C17",
      "leafKeyOrder"
    ],
    [
      "C17",
      "leafIntegerForm"
    ],
    [
      "C17",
      "leafUtf8Scalar"
    ],
    [
      "C17",
      "leafEnvelopeWhitespace"
    ],
    [
      "C17",
      "leafTaggedConstructor"
    ],
    [
      "C18",
      "validateDeclarationHash"
    ],
    [
      "C18",
      "validateLedgerRoot"
    ],
    [
      "C18",
      "validateVersionParent"
    ],
    [
      "C18",
      "validateEffectKey"
    ],
    [
      "C18",
      "validateExperimentSelection"
    ],
    [
      "C18",
      "validateEditReplay"
    ],
    [
      "C18",
      "validateTargetDepth"
    ],
    [
      "C18",
      "validateTargetProduct"
    ],
    [
      "C18",
      "validateEffectOccurrence"
    ],
    [
      "C18",
      "validatePlanRole"
    ],
    [
      "C18",
      "validateInputAuthorityPin"
    ],
    [
      "C18",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C18",
      "validateRunChronology"
    ],
    [
      "C18",
      "validateCapabilityIsolation"
    ],
    [
      "C18",
      "validateInvocationAuthority"
    ],
    [
      "C18",
      "validateFreshnessIsolation"
    ],
    [
      "C18",
      "validateObservationMembershipRoot"
    ],
    [
      "C18",
      "validateObservationAdmission"
    ],
    [
      "C18",
      "leafDuplicateKey"
    ],
    [
      "C18",
      "leafNestedDuplicateKey"
    ],
    [
      "C18",
      "leafEscapedSlash"
    ],
    [
      "C18",
      "leafLowerHex"
    ],
    [
      "C18",
      "leafShortControl"
    ],
    [
      "C18",
      "leafKeyOrder"
    ],
    [
      "C18",
      "leafIntegerForm"
    ],
    [
      "C18",
      "leafUtf8Scalar"
    ],
    [
      "C18",
      "leafEnvelopeWhitespace"
    ],
    [
      "C18",
      "leafTaggedConstructor"
    ],
    [
      "C19",
      "validateDeclarationHash"
    ],
    [
      "C19",
      "validateLedgerRoot"
    ],
    [
      "C19",
      "validateVersionParent"
    ],
    [
      "C19",
      "validateEffectKey"
    ],
    [
      "C19",
      "validateExperimentSelection"
    ],
    [
      "C19",
      "validateEditReplay"
    ],
    [
      "C19",
      "validateTargetDepth"
    ],
    [
      "C19",
      "validateTargetProduct"
    ],
    [
      "C19",
      "validateEffectOccurrence"
    ],
    [
      "C19",
      "validatePlanRole"
    ],
    [
      "C19",
      "validateInputAuthorityPin"
    ],
    [
      "C19",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C19",
      "validateRunChronology"
    ],
    [
      "C19",
      "validateCapabilityIsolation"
    ],
    [
      "C19",
      "validateInvocationAuthority"
    ],
    [
      "C19",
      "validateFreshnessIsolation"
    ],
    [
      "C19",
      "validateObservationMembershipRoot"
    ],
    [
      "C19",
      "validateObservationSeal"
    ],
    [
      "C19",
      "leafDuplicateKey"
    ],
    [
      "C19",
      "leafNestedDuplicateKey"
    ],
    [
      "C19",
      "leafEscapedSlash"
    ],
    [
      "C19",
      "leafLowerHex"
    ],
    [
      "C19",
      "leafShortControl"
    ],
    [
      "C19",
      "leafKeyOrder"
    ],
    [
      "C19",
      "leafIntegerForm"
    ],
    [
      "C19",
      "leafUtf8Scalar"
    ],
    [
      "C19",
      "leafEnvelopeWhitespace"
    ],
    [
      "C19",
      "leafTaggedConstructor"
    ],
    [
      "C20",
      "validateDeclarationHash"
    ],
    [
      "C20",
      "validateLedgerRoot"
    ],
    [
      "C20",
      "validateVersionParent"
    ],
    [
      "C20",
      "validateEffectKey"
    ],
    [
      "C20",
      "validateExperimentSelection"
    ],
    [
      "C20",
      "validateEditReplay"
    ],
    [
      "C20",
      "validateTargetDepth"
    ],
    [
      "C20",
      "validateTargetProduct"
    ],
    [
      "C20",
      "validateEffectOccurrence"
    ],
    [
      "C20",
      "validatePlanRole"
    ],
    [
      "C20",
      "validateInputAuthorityPin"
    ],
    [
      "C20",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C20",
      "validateRunChronology"
    ],
    [
      "C20",
      "validateCapabilityIsolation"
    ],
    [
      "C20",
      "validateInvocationAuthority"
    ],
    [
      "C20",
      "validateFreshnessIsolation"
    ],
    [
      "C20",
      "validateObservationMembershipRoot"
    ],
    [
      "C20",
      "validateObservationSeal"
    ],
    [
      "C20",
      "validateObservationAdmission"
    ],
    [
      "C20",
      "leafNestedDuplicateKey"
    ],
    [
      "C20",
      "leafEscapedSlash"
    ],
    [
      "C20",
      "leafLowerHex"
    ],
    [
      "C20",
      "leafShortControl"
    ],
    [
      "C20",
      "leafKeyOrder"
    ],
    [
      "C20",
      "leafIntegerForm"
    ],
    [
      "C20",
      "leafUtf8Scalar"
    ],
    [
      "C20",
      "leafEnvelopeWhitespace"
    ],
    [
      "C20",
      "leafTaggedConstructor"
    ],
    [
      "C21",
      "validateDeclarationHash"
    ],
    [
      "C21",
      "validateLedgerRoot"
    ],
    [
      "C21",
      "validateVersionParent"
    ],
    [
      "C21",
      "validateEffectKey"
    ],
    [
      "C21",
      "validateExperimentSelection"
    ],
    [
      "C21",
      "validateEditReplay"
    ],
    [
      "C21",
      "validateTargetDepth"
    ],
    [
      "C21",
      "validateTargetProduct"
    ],
    [
      "C21",
      "validateEffectOccurrence"
    ],
    [
      "C21",
      "validatePlanRole"
    ],
    [
      "C21",
      "validateInputAuthorityPin"
    ],
    [
      "C21",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C21",
      "validateRunChronology"
    ],
    [
      "C21",
      "validateCapabilityIsolation"
    ],
    [
      "C21",
      "validateInvocationAuthority"
    ],
    [
      "C21",
      "validateFreshnessIsolation"
    ],
    [
      "C21",
      "validateObservationMembershipRoot"
    ],
    [
      "C21",
      "validateObservationSeal"
    ],
    [
      "C21",
      "validateObservationAdmission"
    ],
    [
      "C21",
      "leafDuplicateKey"
    ],
    [
      "C21",
      "leafEscapedSlash"
    ],
    [
      "C21",
      "leafLowerHex"
    ],
    [
      "C21",
      "leafShortControl"
    ],
    [
      "C21",
      "leafKeyOrder"
    ],
    [
      "C21",
      "leafIntegerForm"
    ],
    [
      "C21",
      "leafUtf8Scalar"
    ],
    [
      "C21",
      "leafEnvelopeWhitespace"
    ],
    [
      "C21",
      "leafTaggedConstructor"
    ],
    [
      "C22",
      "validateDeclarationHash"
    ],
    [
      "C22",
      "validateLedgerRoot"
    ],
    [
      "C22",
      "validateVersionParent"
    ],
    [
      "C22",
      "validateEffectKey"
    ],
    [
      "C22",
      "validateExperimentSelection"
    ],
    [
      "C22",
      "validateEditReplay"
    ],
    [
      "C22",
      "validateTargetDepth"
    ],
    [
      "C22",
      "validateTargetProduct"
    ],
    [
      "C22",
      "validateEffectOccurrence"
    ],
    [
      "C22",
      "validatePlanRole"
    ],
    [
      "C22",
      "validateInputAuthorityPin"
    ],
    [
      "C22",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C22",
      "validateRunChronology"
    ],
    [
      "C22",
      "validateCapabilityIsolation"
    ],
    [
      "C22",
      "validateInvocationAuthority"
    ],
    [
      "C22",
      "validateFreshnessIsolation"
    ],
    [
      "C22",
      "validateObservationMembershipRoot"
    ],
    [
      "C22",
      "validateObservationSeal"
    ],
    [
      "C22",
      "validateObservationAdmission"
    ],
    [
      "C22",
      "leafDuplicateKey"
    ],
    [
      "C22",
      "leafNestedDuplicateKey"
    ],
    [
      "C22",
      "leafLowerHex"
    ],
    [
      "C22",
      "leafShortControl"
    ],
    [
      "C22",
      "leafKeyOrder"
    ],
    [
      "C22",
      "leafIntegerForm"
    ],
    [
      "C22",
      "leafUtf8Scalar"
    ],
    [
      "C22",
      "leafEnvelopeWhitespace"
    ],
    [
      "C22",
      "leafTaggedConstructor"
    ],
    [
      "C23",
      "validateDeclarationHash"
    ],
    [
      "C23",
      "validateLedgerRoot"
    ],
    [
      "C23",
      "validateVersionParent"
    ],
    [
      "C23",
      "validateEffectKey"
    ],
    [
      "C23",
      "validateExperimentSelection"
    ],
    [
      "C23",
      "validateEditReplay"
    ],
    [
      "C23",
      "validateTargetDepth"
    ],
    [
      "C23",
      "validateTargetProduct"
    ],
    [
      "C23",
      "validateEffectOccurrence"
    ],
    [
      "C23",
      "validatePlanRole"
    ],
    [
      "C23",
      "validateInputAuthorityPin"
    ],
    [
      "C23",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C23",
      "validateRunChronology"
    ],
    [
      "C23",
      "validateCapabilityIsolation"
    ],
    [
      "C23",
      "validateInvocationAuthority"
    ],
    [
      "C23",
      "validateFreshnessIsolation"
    ],
    [
      "C23",
      "validateObservationMembershipRoot"
    ],
    [
      "C23",
      "validateObservationSeal"
    ],
    [
      "C23",
      "validateObservationAdmission"
    ],
    [
      "C23",
      "leafDuplicateKey"
    ],
    [
      "C23",
      "leafNestedDuplicateKey"
    ],
    [
      "C23",
      "leafEscapedSlash"
    ],
    [
      "C23",
      "leafShortControl"
    ],
    [
      "C23",
      "leafKeyOrder"
    ],
    [
      "C23",
      "leafIntegerForm"
    ],
    [
      "C23",
      "leafUtf8Scalar"
    ],
    [
      "C23",
      "leafEnvelopeWhitespace"
    ],
    [
      "C23",
      "leafTaggedConstructor"
    ],
    [
      "C24",
      "validateDeclarationHash"
    ],
    [
      "C24",
      "validateLedgerRoot"
    ],
    [
      "C24",
      "validateVersionParent"
    ],
    [
      "C24",
      "validateEffectKey"
    ],
    [
      "C24",
      "validateExperimentSelection"
    ],
    [
      "C24",
      "validateEditReplay"
    ],
    [
      "C24",
      "validateTargetDepth"
    ],
    [
      "C24",
      "validateTargetProduct"
    ],
    [
      "C24",
      "validateEffectOccurrence"
    ],
    [
      "C24",
      "validatePlanRole"
    ],
    [
      "C24",
      "validateInputAuthorityPin"
    ],
    [
      "C24",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C24",
      "validateRunChronology"
    ],
    [
      "C24",
      "validateCapabilityIsolation"
    ],
    [
      "C24",
      "validateInvocationAuthority"
    ],
    [
      "C24",
      "validateFreshnessIsolation"
    ],
    [
      "C24",
      "validateObservationMembershipRoot"
    ],
    [
      "C24",
      "validateObservationSeal"
    ],
    [
      "C24",
      "validateObservationAdmission"
    ],
    [
      "C24",
      "leafDuplicateKey"
    ],
    [
      "C24",
      "leafNestedDuplicateKey"
    ],
    [
      "C24",
      "leafEscapedSlash"
    ],
    [
      "C24",
      "leafLowerHex"
    ],
    [
      "C24",
      "leafKeyOrder"
    ],
    [
      "C24",
      "leafIntegerForm"
    ],
    [
      "C24",
      "leafUtf8Scalar"
    ],
    [
      "C24",
      "leafEnvelopeWhitespace"
    ],
    [
      "C24",
      "leafTaggedConstructor"
    ],
    [
      "C25",
      "validateDeclarationHash"
    ],
    [
      "C25",
      "validateLedgerRoot"
    ],
    [
      "C25",
      "validateVersionParent"
    ],
    [
      "C25",
      "validateEffectKey"
    ],
    [
      "C25",
      "validateExperimentSelection"
    ],
    [
      "C25",
      "validateEditReplay"
    ],
    [
      "C25",
      "validateTargetDepth"
    ],
    [
      "C25",
      "validateTargetProduct"
    ],
    [
      "C25",
      "validateEffectOccurrence"
    ],
    [
      "C25",
      "validatePlanRole"
    ],
    [
      "C25",
      "validateInputAuthorityPin"
    ],
    [
      "C25",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C25",
      "validateRunChronology"
    ],
    [
      "C25",
      "validateCapabilityIsolation"
    ],
    [
      "C25",
      "validateInvocationAuthority"
    ],
    [
      "C25",
      "validateFreshnessIsolation"
    ],
    [
      "C25",
      "validateObservationMembershipRoot"
    ],
    [
      "C25",
      "validateObservationSeal"
    ],
    [
      "C25",
      "validateObservationAdmission"
    ],
    [
      "C25",
      "leafDuplicateKey"
    ],
    [
      "C25",
      "leafNestedDuplicateKey"
    ],
    [
      "C25",
      "leafEscapedSlash"
    ],
    [
      "C25",
      "leafLowerHex"
    ],
    [
      "C25",
      "leafShortControl"
    ],
    [
      "C25",
      "leafIntegerForm"
    ],
    [
      "C25",
      "leafUtf8Scalar"
    ],
    [
      "C25",
      "leafEnvelopeWhitespace"
    ],
    [
      "C25",
      "leafTaggedConstructor"
    ],
    [
      "C26",
      "validateDeclarationHash"
    ],
    [
      "C26",
      "validateLedgerRoot"
    ],
    [
      "C26",
      "validateVersionParent"
    ],
    [
      "C26",
      "validateEffectKey"
    ],
    [
      "C26",
      "validateExperimentSelection"
    ],
    [
      "C26",
      "validateEditReplay"
    ],
    [
      "C26",
      "validateTargetDepth"
    ],
    [
      "C26",
      "validateTargetProduct"
    ],
    [
      "C26",
      "validateEffectOccurrence"
    ],
    [
      "C26",
      "validatePlanRole"
    ],
    [
      "C26",
      "validateInputAuthorityPin"
    ],
    [
      "C26",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C26",
      "validateRunChronology"
    ],
    [
      "C26",
      "validateCapabilityIsolation"
    ],
    [
      "C26",
      "validateInvocationAuthority"
    ],
    [
      "C26",
      "validateFreshnessIsolation"
    ],
    [
      "C26",
      "validateObservationMembershipRoot"
    ],
    [
      "C26",
      "validateObservationSeal"
    ],
    [
      "C26",
      "validateObservationAdmission"
    ],
    [
      "C26",
      "leafDuplicateKey"
    ],
    [
      "C26",
      "leafNestedDuplicateKey"
    ],
    [
      "C26",
      "leafEscapedSlash"
    ],
    [
      "C26",
      "leafLowerHex"
    ],
    [
      "C26",
      "leafShortControl"
    ],
    [
      "C26",
      "leafKeyOrder"
    ],
    [
      "C26",
      "leafUtf8Scalar"
    ],
    [
      "C26",
      "leafEnvelopeWhitespace"
    ],
    [
      "C26",
      "leafTaggedConstructor"
    ],
    [
      "C27",
      "validateDeclarationHash"
    ],
    [
      "C27",
      "validateLedgerRoot"
    ],
    [
      "C27",
      "validateVersionParent"
    ],
    [
      "C27",
      "validateEffectKey"
    ],
    [
      "C27",
      "validateExperimentSelection"
    ],
    [
      "C27",
      "validateEditReplay"
    ],
    [
      "C27",
      "validateTargetDepth"
    ],
    [
      "C27",
      "validateTargetProduct"
    ],
    [
      "C27",
      "validateEffectOccurrence"
    ],
    [
      "C27",
      "validatePlanRole"
    ],
    [
      "C27",
      "validateInputAuthorityPin"
    ],
    [
      "C27",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C27",
      "validateRunChronology"
    ],
    [
      "C27",
      "validateCapabilityIsolation"
    ],
    [
      "C27",
      "validateInvocationAuthority"
    ],
    [
      "C27",
      "validateFreshnessIsolation"
    ],
    [
      "C27",
      "validateObservationMembershipRoot"
    ],
    [
      "C27",
      "validateObservationSeal"
    ],
    [
      "C27",
      "validateObservationAdmission"
    ],
    [
      "C27",
      "leafDuplicateKey"
    ],
    [
      "C27",
      "leafNestedDuplicateKey"
    ],
    [
      "C27",
      "leafEscapedSlash"
    ],
    [
      "C27",
      "leafLowerHex"
    ],
    [
      "C27",
      "leafShortControl"
    ],
    [
      "C27",
      "leafKeyOrder"
    ],
    [
      "C27",
      "leafIntegerForm"
    ],
    [
      "C27",
      "leafEnvelopeWhitespace"
    ],
    [
      "C27",
      "leafTaggedConstructor"
    ],
    [
      "C28",
      "validateDeclarationHash"
    ],
    [
      "C28",
      "validateLedgerRoot"
    ],
    [
      "C28",
      "validateVersionParent"
    ],
    [
      "C28",
      "validateEffectKey"
    ],
    [
      "C28",
      "validateExperimentSelection"
    ],
    [
      "C28",
      "validateEditReplay"
    ],
    [
      "C28",
      "validateTargetDepth"
    ],
    [
      "C28",
      "validateTargetProduct"
    ],
    [
      "C28",
      "validateEffectOccurrence"
    ],
    [
      "C28",
      "validatePlanRole"
    ],
    [
      "C28",
      "validateInputAuthorityPin"
    ],
    [
      "C28",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C28",
      "validateRunChronology"
    ],
    [
      "C28",
      "validateCapabilityIsolation"
    ],
    [
      "C28",
      "validateInvocationAuthority"
    ],
    [
      "C28",
      "validateFreshnessIsolation"
    ],
    [
      "C28",
      "validateObservationMembershipRoot"
    ],
    [
      "C28",
      "validateObservationSeal"
    ],
    [
      "C28",
      "validateObservationAdmission"
    ],
    [
      "C28",
      "leafDuplicateKey"
    ],
    [
      "C28",
      "leafNestedDuplicateKey"
    ],
    [
      "C28",
      "leafEscapedSlash"
    ],
    [
      "C28",
      "leafLowerHex"
    ],
    [
      "C28",
      "leafShortControl"
    ],
    [
      "C28",
      "leafKeyOrder"
    ],
    [
      "C28",
      "leafIntegerForm"
    ],
    [
      "C28",
      "leafUtf8Scalar"
    ],
    [
      "C28",
      "leafTaggedConstructor"
    ],
    [
      "C29",
      "validateDeclarationHash"
    ],
    [
      "C29",
      "validateLedgerRoot"
    ],
    [
      "C29",
      "validateVersionParent"
    ],
    [
      "C29",
      "validateEffectKey"
    ],
    [
      "C29",
      "validateExperimentSelection"
    ],
    [
      "C29",
      "validateEditReplay"
    ],
    [
      "C29",
      "validateTargetDepth"
    ],
    [
      "C29",
      "validateTargetProduct"
    ],
    [
      "C29",
      "validateEffectOccurrence"
    ],
    [
      "C29",
      "validatePlanRole"
    ],
    [
      "C29",
      "validateInputAuthorityPin"
    ],
    [
      "C29",
      "validateCommandEnvelopeCapture"
    ],
    [
      "C29",
      "validateRunChronology"
    ],
    [
      "C29",
      "validateCapabilityIsolation"
    ],
    [
      "C29",
      "validateInvocationAuthority"
    ],
    [
      "C29",
      "validateFreshnessIsolation"
    ],
    [
      "C29",
      "validateObservationMembershipRoot"
    ],
    [
      "C29",
      "validateObservationSeal"
    ],
    [
      "C29",
      "validateObservationAdmission"
    ],
    [
      "C29",
      "leafDuplicateKey"
    ],
    [
      "C29",
      "leafNestedDuplicateKey"
    ],
    [
      "C29",
      "leafEscapedSlash"
    ],
    [
      "C29",
      "leafLowerHex"
    ],
    [
      "C29",
      "leafShortControl"
    ],
    [
      "C29",
      "leafKeyOrder"
    ],
    [
      "C29",
      "leafIntegerForm"
    ],
    [
      "C29",
      "leafUtf8Scalar"
    ],
    [
      "C29",
      "leafEnvelopeWhitespace"
    ],
    [
      "C30",
      "leafSourceHash"
    ],
    [
      "C30",
      "leafProseHash"
    ],
    [
      "C30",
      "leafEdgeGraph"
    ],
    [
      "C30",
      "leafReverseEdge"
    ],
    [
      "C30",
      "leafDynamicImport"
    ],
    [
      "C30",
      "leafDynamicCode"
    ],
    [
      "C30",
      "leafReflection"
    ],
    [
      "C30",
      "leafDependencyGraph"
    ],
    [
      "C30",
      "leafForbiddenSubstrate"
    ],
    [
      "C30",
      "leafModuleBudget"
    ],
    [
      "C30",
      "leafTotalBudget"
    ],
    [
      "C30",
      "leafAstToolPin"
    ],
    [
      "C30",
      "leafClaimSourceJoin"
    ],
    [
      "C31",
      "leafModuleSet"
    ],
    [
      "C31",
      "leafProseHash"
    ],
    [
      "C31",
      "leafEdgeGraph"
    ],
    [
      "C31",
      "leafReverseEdge"
    ],
    [
      "C31",
      "leafDynamicImport"
    ],
    [
      "C31",
      "leafDynamicCode"
    ],
    [
      "C31",
      "leafReflection"
    ],
    [
      "C31",
      "leafDependencyGraph"
    ],
    [
      "C31",
      "leafForbiddenSubstrate"
    ],
    [
      "C31",
      "leafModuleBudget"
    ],
    [
      "C31",
      "leafTotalBudget"
    ],
    [
      "C31",
      "leafAstToolPin"
    ],
    [
      "C31",
      "leafClaimSourceJoin"
    ],
    [
      "C32",
      "leafModuleSet"
    ],
    [
      "C32",
      "leafSourceHash"
    ],
    [
      "C32",
      "leafEdgeGraph"
    ],
    [
      "C32",
      "leafReverseEdge"
    ],
    [
      "C32",
      "leafDynamicImport"
    ],
    [
      "C32",
      "leafDynamicCode"
    ],
    [
      "C32",
      "leafReflection"
    ],
    [
      "C32",
      "leafDependencyGraph"
    ],
    [
      "C32",
      "leafForbiddenSubstrate"
    ],
    [
      "C32",
      "leafModuleBudget"
    ],
    [
      "C32",
      "leafTotalBudget"
    ],
    [
      "C32",
      "leafAstToolPin"
    ],
    [
      "C32",
      "leafClaimSourceJoin"
    ],
    [
      "C33",
      "leafModuleSet"
    ],
    [
      "C33",
      "leafSourceHash"
    ],
    [
      "C33",
      "leafProseHash"
    ],
    [
      "C33",
      "leafReverseEdge"
    ],
    [
      "C33",
      "leafDynamicImport"
    ],
    [
      "C33",
      "leafDynamicCode"
    ],
    [
      "C33",
      "leafReflection"
    ],
    [
      "C33",
      "leafDependencyGraph"
    ],
    [
      "C33",
      "leafForbiddenSubstrate"
    ],
    [
      "C33",
      "leafModuleBudget"
    ],
    [
      "C33",
      "leafTotalBudget"
    ],
    [
      "C33",
      "leafAstToolPin"
    ],
    [
      "C33",
      "leafClaimSourceJoin"
    ],
    [
      "C34",
      "leafModuleSet"
    ],
    [
      "C34",
      "leafSourceHash"
    ],
    [
      "C34",
      "leafProseHash"
    ],
    [
      "C34",
      "leafEdgeGraph"
    ],
    [
      "C34",
      "leafDynamicImport"
    ],
    [
      "C34",
      "leafDynamicCode"
    ],
    [
      "C34",
      "leafReflection"
    ],
    [
      "C34",
      "leafDependencyGraph"
    ],
    [
      "C34",
      "leafForbiddenSubstrate"
    ],
    [
      "C34",
      "leafModuleBudget"
    ],
    [
      "C34",
      "leafTotalBudget"
    ],
    [
      "C34",
      "leafAstToolPin"
    ],
    [
      "C34",
      "leafClaimSourceJoin"
    ],
    [
      "C35",
      "leafModuleSet"
    ],
    [
      "C35",
      "leafSourceHash"
    ],
    [
      "C35",
      "leafProseHash"
    ],
    [
      "C35",
      "leafEdgeGraph"
    ],
    [
      "C35",
      "leafReverseEdge"
    ],
    [
      "C35",
      "leafDynamicCode"
    ],
    [
      "C35",
      "leafReflection"
    ],
    [
      "C35",
      "leafDependencyGraph"
    ],
    [
      "C35",
      "leafForbiddenSubstrate"
    ],
    [
      "C35",
      "leafModuleBudget"
    ],
    [
      "C35",
      "leafTotalBudget"
    ],
    [
      "C35",
      "leafAstToolPin"
    ],
    [
      "C35",
      "leafClaimSourceJoin"
    ],
    [
      "C36",
      "leafModuleSet"
    ],
    [
      "C36",
      "leafSourceHash"
    ],
    [
      "C36",
      "leafProseHash"
    ],
    [
      "C36",
      "leafEdgeGraph"
    ],
    [
      "C36",
      "leafReverseEdge"
    ],
    [
      "C36",
      "leafDynamicImport"
    ],
    [
      "C36",
      "leafReflection"
    ],
    [
      "C36",
      "leafDependencyGraph"
    ],
    [
      "C36",
      "leafForbiddenSubstrate"
    ],
    [
      "C36",
      "leafModuleBudget"
    ],
    [
      "C36",
      "leafTotalBudget"
    ],
    [
      "C36",
      "leafAstToolPin"
    ],
    [
      "C36",
      "leafClaimSourceJoin"
    ],
    [
      "C37",
      "leafModuleSet"
    ],
    [
      "C37",
      "leafSourceHash"
    ],
    [
      "C37",
      "leafProseHash"
    ],
    [
      "C37",
      "leafEdgeGraph"
    ],
    [
      "C37",
      "leafReverseEdge"
    ],
    [
      "C37",
      "leafDynamicImport"
    ],
    [
      "C37",
      "leafDynamicCode"
    ],
    [
      "C37",
      "leafDependencyGraph"
    ],
    [
      "C37",
      "leafForbiddenSubstrate"
    ],
    [
      "C37",
      "leafModuleBudget"
    ],
    [
      "C37",
      "leafTotalBudget"
    ],
    [
      "C37",
      "leafAstToolPin"
    ],
    [
      "C37",
      "leafClaimSourceJoin"
    ],
    [
      "C38",
      "leafModuleSet"
    ],
    [
      "C38",
      "leafSourceHash"
    ],
    [
      "C38",
      "leafProseHash"
    ],
    [
      "C38",
      "leafEdgeGraph"
    ],
    [
      "C38",
      "leafReverseEdge"
    ],
    [
      "C38",
      "leafDynamicImport"
    ],
    [
      "C38",
      "leafDynamicCode"
    ],
    [
      "C38",
      "leafReflection"
    ],
    [
      "C38",
      "leafForbiddenSubstrate"
    ],
    [
      "C38",
      "leafModuleBudget"
    ],
    [
      "C38",
      "leafTotalBudget"
    ],
    [
      "C38",
      "leafAstToolPin"
    ],
    [
      "C38",
      "leafClaimSourceJoin"
    ],
    [
      "C39",
      "leafModuleSet"
    ],
    [
      "C39",
      "leafSourceHash"
    ],
    [
      "C39",
      "leafProseHash"
    ],
    [
      "C39",
      "leafEdgeGraph"
    ],
    [
      "C39",
      "leafReverseEdge"
    ],
    [
      "C39",
      "leafDynamicImport"
    ],
    [
      "C39",
      "leafDynamicCode"
    ],
    [
      "C39",
      "leafReflection"
    ],
    [
      "C39",
      "leafDependencyGraph"
    ],
    [
      "C39",
      "leafModuleBudget"
    ],
    [
      "C39",
      "leafTotalBudget"
    ],
    [
      "C39",
      "leafAstToolPin"
    ],
    [
      "C39",
      "leafClaimSourceJoin"
    ],
    [
      "C40",
      "leafModuleSet"
    ],
    [
      "C40",
      "leafSourceHash"
    ],
    [
      "C40",
      "leafProseHash"
    ],
    [
      "C40",
      "leafEdgeGraph"
    ],
    [
      "C40",
      "leafReverseEdge"
    ],
    [
      "C40",
      "leafDynamicImport"
    ],
    [
      "C40",
      "leafDynamicCode"
    ],
    [
      "C40",
      "leafReflection"
    ],
    [
      "C40",
      "leafDependencyGraph"
    ],
    [
      "C40",
      "leafForbiddenSubstrate"
    ],
    [
      "C40",
      "leafTotalBudget"
    ],
    [
      "C40",
      "leafAstToolPin"
    ],
    [
      "C40",
      "leafClaimSourceJoin"
    ],
    [
      "C41",
      "leafModuleSet"
    ],
    [
      "C41",
      "leafSourceHash"
    ],
    [
      "C41",
      "leafProseHash"
    ],
    [
      "C41",
      "leafEdgeGraph"
    ],
    [
      "C41",
      "leafReverseEdge"
    ],
    [
      "C41",
      "leafDynamicImport"
    ],
    [
      "C41",
      "leafDynamicCode"
    ],
    [
      "C41",
      "leafReflection"
    ],
    [
      "C41",
      "leafDependencyGraph"
    ],
    [
      "C41",
      "leafForbiddenSubstrate"
    ],
    [
      "C41",
      "leafModuleBudget"
    ],
    [
      "C41",
      "leafAstToolPin"
    ],
    [
      "C41",
      "leafClaimSourceJoin"
    ],
    [
      "C42",
      "leafModuleSet"
    ],
    [
      "C42",
      "leafSourceHash"
    ],
    [
      "C42",
      "leafProseHash"
    ],
    [
      "C42",
      "leafEdgeGraph"
    ],
    [
      "C42",
      "leafReverseEdge"
    ],
    [
      "C42",
      "leafDynamicImport"
    ],
    [
      "C42",
      "leafDynamicCode"
    ],
    [
      "C42",
      "leafReflection"
    ],
    [
      "C42",
      "leafDependencyGraph"
    ],
    [
      "C42",
      "leafForbiddenSubstrate"
    ],
    [
      "C42",
      "leafModuleBudget"
    ],
    [
      "C42",
      "leafTotalBudget"
    ],
    [
      "C42",
      "leafClaimSourceJoin"
    ],
    [
      "C43",
      "leafModuleSet"
    ],
    [
      "C43",
      "leafSourceHash"
    ],
    [
      "C43",
      "leafProseHash"
    ],
    [
      "C43",
      "leafEdgeGraph"
    ],
    [
      "C43",
      "leafReverseEdge"
    ],
    [
      "C43",
      "leafDynamicImport"
    ],
    [
      "C43",
      "leafDynamicCode"
    ],
    [
      "C43",
      "leafReflection"
    ],
    [
      "C43",
      "leafDependencyGraph"
    ],
    [
      "C43",
      "leafForbiddenSubstrate"
    ],
    [
      "C43",
      "leafModuleBudget"
    ],
    [
      "C43",
      "leafTotalBudget"
    ],
    [
      "C43",
      "leafAstToolPin"
    ]
  ],
  "counts": {
    "schemas": 43,
    "fixtures": 43,
    "domains": 43,
    "controls": 43,
    "p6Controls": 29,
    "p7Controls": 14,
    "nonownerRetentions": 994,
    "edges": 26,
    "futureReceipts": 1170
  },
  "controlArithmetic": {
    "P6": {
      "rows": 29,
      "baseline": 29,
      "ownerReject": 29,
      "ownerBypass": 29,
      "nonownerRetention": 812,
      "erasureAndNoOp": 29,
      "unknown": 1,
      "duplicate": 1,
      "total": 930
    },
    "P7": {
      "rows": 14,
      "baseline": 14,
      "ownerReject": 14,
      "ownerBypass": 14,
      "nonownerRetention": 182,
      "erasureAndNoOp": 14,
      "unknown": 1,
      "duplicate": 1,
      "total": 240
    },
    "totalRows": 43,
    "totalReceipts": 1170
  },
  "edges": [
    [
      "E01",
      "P1",
      "P0",
      "decodeCanonical(bytes:CanonicalBytes)->CanonicalValue"
    ],
    [
      "E02",
      "P0",
      "P2",
      "openLedger(root:LedgerRoot)->VersionLedgerView"
    ],
    [
      "E03",
      "P2",
      "P3",
      "relocationMap(from:VersionOrdinal,to:VersionOrdinal)->RelocationMapResult"
    ],
    [
      "E04",
      "P0",
      "P4",
      "selectEffectTable(root:LedgerRoot,sourceVersion:U53,identityEpochId:Id)->SelectedEffectTable"
    ],
    [
      "E05",
      "P5",
      "P3",
      "freshControl(receipt:ObservationAdmissionReceipt)->AdmittedObservation"
    ],
    [
      "E06",
      "P5",
      "P4",
      "freshControl(receipt:ObservationAdmissionReceipt)->AdmittedObservation"
    ],
    [
      "E07",
      "P1",
      "P6",
      "rawCodecValidation(input:RawProductionInput)->OwnerValidationReceipt<P1Raw>"
    ],
    [
      "E08",
      "P1",
      "P6",
      "canonicalValueValidation(before:ValueDomain,after:ValueDomain)->OwnerValidationReceipt<P1Value>"
    ],
    [
      "E09",
      "P1",
      "P3",
      "decodeCanonical(bytes:CanonicalBytes)->CanonicalValue"
    ],
    [
      "E10",
      "P1",
      "P4",
      "decodeCanonical(bytes:CanonicalBytes)->CanonicalValue"
    ],
    [
      "E11",
      "P1",
      "P5",
      "decodeCanonical(bytes:CanonicalBytes)->CanonicalValue"
    ],
    [
      "E12",
      "P0",
      "P7",
      "declarationLedgerClaim()->InterfaceClaim<DeclarationLedger>"
    ],
    [
      "E13",
      "P1",
      "P7",
      "canonicalCodecClaim()->InterfaceClaim<CanonicalCodec>"
    ],
    [
      "E14",
      "P2",
      "P7",
      "relocationAlgebraClaim()->InterfaceClaim<RelocationAlgebra>"
    ],
    [
      "E15",
      "P3",
      "P7",
      "coordinateProductClaim()->InterfaceClaim<CoordinateProductSchema>"
    ],
    [
      "E16",
      "P4",
      "P7",
      "effectProvenanceClaim()->InterfaceClaim<EffectProvenance>"
    ],
    [
      "E17",
      "P5",
      "P7",
      "runAuthorityClaim()->InterfaceClaim<ExperimentPlanAndObservationSeal>"
    ],
    [
      "E18",
      "P6",
      "P7",
      "controlRegistryClaim()->InterfaceClaim<MachineControlRegistry>"
    ],
    [
      "E19",
      "P0",
      "P6",
      "declarationValidation(input:P0ValidationInput)->OwnerValidationReceipt<P0>"
    ],
    [
      "E20",
      "P2",
      "P6",
      "relocationValidation(input:P2ValidationInput)->OwnerValidationReceipt<P2>"
    ],
    [
      "E21",
      "P3",
      "P6",
      "productValidation(input:P3ValidationInput)->OwnerValidationReceipt<P3>"
    ],
    [
      "E22",
      "P4",
      "P6",
      "effectValidation(input:P4ValidationInput)->OwnerValidationReceipt<P4>"
    ],
    [
      "E23",
      "P5",
      "P6",
      "bundleRunValidation(input:P5ValidationInput)->OwnerValidationReceipt<P5>"
    ],
    [
      "E24",
      "P5",
      "P3",
      "candidateRun(receipt:ObservationAdmissionReceipt)->AdmittedObservation"
    ],
    [
      "E25",
      "P5",
      "P4",
      "candidateRun(receipt:ObservationAdmissionReceipt)->AdmittedObservation"
    ],
    [
      "E26",
      "P0",
      "P5",
      "selectExperiment(root:LedgerRoot)->ExperimentSelectionReceipt"
    ]
  ],
  "productionLeaves": {
    "P0": [
      "validateDeclarationHash",
      "validateLedgerRoot",
      "validateVersionParent",
      "validateEffectKey",
      "validateExperimentSelection"
    ],
    "P1": [
      "leafDuplicateKey",
      "leafNestedDuplicateKey",
      "leafEscapedSlash",
      "leafLowerHex",
      "leafShortControl",
      "leafKeyOrder",
      "leafIntegerForm",
      "leafUtf8Scalar",
      "leafEnvelopeWhitespace",
      "leafTaggedConstructor"
    ],
    "P2": [
      "validateEditReplay"
    ],
    "P3": [
      "validateTargetDepth",
      "validateTargetProduct"
    ],
    "P4": [
      "validateEffectOccurrence"
    ],
    "P5": [
      "validatePlanRole",
      "validateInputAuthorityPin",
      "validateCommandEnvelopeCapture",
      "validateRunChronology",
      "validateCapabilityIsolation",
      "validateInvocationAuthority",
      "validateFreshnessIsolation",
      "validateObservationMembershipRoot",
      "validateObservationSeal",
      "validateObservationAdmission"
    ],
    "P6": [],
    "P7": [
      "leafModuleSet",
      "leafSourceHash",
      "leafProseHash",
      "leafEdgeGraph",
      "leafReverseEdge",
      "leafDynamicImport",
      "leafDynamicCode",
      "leafReflection",
      "leafDependencyGraph",
      "leafForbiddenSubstrate",
      "leafModuleBudget",
      "leafTotalBudget",
      "leafAstToolPin",
      "leafClaimSourceJoin"
    ]
  },
  "experimentLaw": {
    "planCommitsBothRolesBeforeCandidate": true,
    "candidateRuns": 1,
    "candidateAdmissionBeforeControlSpawn": true,
    "controlRuns": 1,
    "adaptiveControl": false,
    "futureOutputsInInputPin": false,
    "preRunTopology": "STATIC_CONSTRAINT_ONLY",
    "postRunTopology": "ACTUAL_RETURNED_PARSER_TOPOLOGY_ROOT",
    "observationAdmission": "OWNER_SIGNATURE_AFTER_ACTUAL_ROOT_RECOMPUTATION",
    "n3Dependency": "PENDING_NOT_CONSUMED"
  },
  "forbidden": [
    "future-output-prepin",
    "adaptive-control",
    "caller-output",
    "caller-reissue",
    "hidden-prior-run",
    "hidden-evaluator",
    "reparse",
    "callback-outside-P5",
    "fallback",
    "dual-path",
    "scanner-token-index-tape",
    "css-grammar-in-parse-that",
    "parse-that-to-fourier"
  ],
  "credit": {
    "authority": 0,
    "scientific": 0,
    "equivalence": 0,
    "performance": 0,
    "novelty": 0,
    "css": 0,
    "product": 0,
    "law": 0,
    "release": 0
  },
  "authorized": {
    "paperV7": true,
    "reviewA7": false,
    "reviewB7": false,
    "n2e": false,
    "source": false,
    "astTool": false,
    "execution": false,
    "prototype": false,
    "benchmark": false
  }
}
```

## Boundary

The registry exact-counts 43 schemas, fixtures, domains, controls and full leaf
identities; 994 explicit nonowner retentions; 26 edges; and 1,170 future
receipts. It performs zero parser/product executions. N2e, source, AST tooling,
prototype, benchmark, package, CSS, Value/Keyframes/Fourier execution, release,
rebind, and every credit dimension remain withheld. Two fresh reviews are
required and are not dispatched.
