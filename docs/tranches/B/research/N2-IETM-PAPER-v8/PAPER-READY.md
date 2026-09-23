# N2 IETM paper v8 — concrete authority reset

Status: **PAPER RED / ZERO CREDIT / TWO FRESH REVIEWS REQUIRED**

This packet freezes N2-v7 as immutable negative chronology and resets the paper
authority around concrete typed instances. It preserves all 43 authenticated v7
fixture/schema/domain objects while closing the two v7 failures:

- every control has a rooted before/after production instance and an exact
  fixture-to-consumed-field projection join;
- proposed predicate and injector modules are exact source bytes with full
  source/function identities and no undefined helper;
- the nonowner domain is global: 43 × 42 = 1,806 ordered pairs over full
  function-identity roots;
- owner suppression and control-of-control retain the identical mutant instance
  and disable the identical owning function identity;
- issuer key, authority ledger, and signatures are pinned at the external
  validator boundary, never by a submitted trust boolean.

The machine block is sole authority. Prose supplies no rows, identities,
instances, roots, outcomes, trust, or credit.

## Machine registry

```json
{
  "schema": "parse-that.n2.ietm.paper.v8",
  "status": "PAPER_RED",
  "fatalReason": "TWO_FRESH_REVIEWS_REQUIRED",
  "files": 10,
  "frozenV7": {
    "commit": "1cf937cf2491e84e045f76079ee5e99ceed3115c",
    "tree": "16c2bdf767ef08c2d647394e42a76dd791c60762",
    "paperSha256": "4e3811bf32ed7c74ad3c2981499a565f898a965a0ceac9451e29de623979327a",
    "manifestSha256": "bcb69cdee5353d59324c1b3393d4f902cd3b4d270f106f3e0fcf8bf600803d04",
    "disposition": "IMMUTABLE_AMEND_RED_ZERO_CREDIT"
  },
  "rootLaw": {
    "hash": "H(domain,fields)=SHA256(u32be(|domain|)||UTF8(domain)||u32be(|fields|)||each(u32be(|field|)||field))",
    "canonicalObject": "lexicographically sorted UTF8 JSON; arrays retain order; integers are safe decimal"
  },
  "concreteSchemas": {
    "DeclarationV8": [
      "schema",
      "declarationSha256"
    ],
    "LedgerV8": [
      "schema",
      "root",
      "version",
      "parent"
    ],
    "EffectTableV8": [
      "schema",
      "entries"
    ],
    "ExperimentSelectionReceiptV8": [
      "schema",
      "rowId",
      "selectionRoot"
    ],
    "EditLedgerV8": [
      "schema",
      "versions",
      "edits"
    ],
    "CompleteProductV8": [
      "schema",
      "entryDepth",
      "maxDepthDelta",
      "value",
      "spans",
      "slots",
      "frontier",
      "rollback",
      "recovery",
      "diagnostics",
      "fault",
      "provenance"
    ],
    "ObservedEventV8": [
      "schema",
      "identityEpochId",
      "eventId",
      "rowId",
      "phase",
      "ordinal",
      "payload"
    ],
    "CommandEnvelopeV8": [
      "schema",
      "role",
      "executablePath",
      "executableRealpath",
      "executableStat",
      "executableSha256",
      "argv0",
      "argv",
      "cwd",
      "environment",
      "runtime",
      "toolchain",
      "filesystemBounds",
      "processBounds",
      "networkBounds",
      "fileDescriptorBounds",
      "capabilitySurfaceIds"
    ],
    "InputAuthorityPinV8": [
      "schema",
      "role",
      "selectionReceiptRoot",
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
      "authorityLedgerRoot"
    ],
    "CommandCaptureV8": [
      "schema",
      "role",
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
      "rawSpawnReceipt",
      "invocationAuthority",
      "freshnessBefore",
      "freshnessAfter"
    ],
    "ObservationMembershipV8": [
      "schema",
      "role",
      "descriptors"
    ],
    "ObservationSealV8": [
      "schema",
      "role",
      "experimentPlanRoot",
      "inputPinRoot",
      "selectionRoot",
      "observationMembershipRoot",
      "chronologyOrdinal",
      "returnedParserTopologyRoot"
    ],
    "ObservationSealAuthorityV8": [
      "schema",
      "seal",
      "observationSealRoot"
    ],
    "OwnerAdmissionMessageV8": [
      "schema",
      "rootKind",
      "root",
      "role",
      "experimentPlanRoot",
      "issuedOrdinal",
      "keyId",
      "policyRoot",
      "authorityLedgerRoot"
    ],
    "OwnerAdmissionReceiptV8": [
      "schema",
      "message",
      "messageRoot",
      "signatureBytesHex"
    ],
    "AuditMutantEnvelopeV8": [
      "schema",
      "controlId",
      "fixtureId",
      "domainId",
      "schemaId",
      "productionBeforeRoot",
      "productionAfterRoot",
      "projectionJoinRoot",
      "injectorModuleRoot",
      "auditPolicyRoot"
    ],
    "RawProductionInputV8": [
      "schema",
      "rowId",
      "runId",
      "armId",
      "fixtureId",
      "productId",
      "blob"
    ],
    "ValueDomainV8": [
      "schema",
      "domainId",
      "coordinateKind",
      "before",
      "after"
    ],
    "SourceVerifierInputV8": [
      "schema",
      "controlId",
      "payload",
      "authorizedSourcePinRoot"
    ],
    "AuthorityLedgerV8": [
      "schema",
      "ledgerId",
      "version",
      "predecessorRoot",
      "issuerKeyId",
      "issuerPublicKeySha256",
      "grantPolicyRoot",
      "revocationRoot",
      "authorizedExperimentId"
    ],
    "AuthorityTrustPinV8": [
      "schema",
      "transport",
      "submittedEvidenceField",
      "issuerKeyId",
      "algorithm",
      "publicKeyBytesHex",
      "publicKeySha256",
      "ledgerRoot",
      "keyRotationPolicy",
      "revocationPolicy"
    ],
    "ProductionInstanceV8": [
      "schema",
      "controlId",
      "kind",
      "payload"
    ],
    "LeafFunctionIdentityV8": [
      "schema",
      "ownerModule",
      "ownerModulePath",
      "moduleSourceBytesHex",
      "moduleSourceSha256",
      "astNodePath",
      "predicateId",
      "predicateBodyBytesHex",
      "predicateBodySha256",
      "injectorId",
      "injectorBodyBytesHex",
      "injectorBodySha256",
      "leafId",
      "leafFunctionIdentityRoot"
    ],
    "ControlRowV8": [
      "schema",
      "controlId",
      "profile",
      "fixtureId",
      "domainId",
      "sourceSchemaId",
      "productionKind",
      "destinationPath",
      "productionBeforeRoot",
      "productionAfterRoot",
      "projectionJoinRoot",
      "leafFunctionIdentity",
      "uniqueCode",
      "outcomes",
      "nonownerRetentionRange"
    ],
    "NonownerRetentionV8": [
      "controlId",
      "nonownerLeafFunctionIdentityRoot"
    ]
  },
  "externalAuthority": {
    "transport": "OWNER_VALIDATOR_ARGUMENT_ONLY",
    "evidenceMayOverride": false,
    "policy": {
      "schema": "AuthorityPolicyV8",
      "policyId": "N2-V8-ED25519-EXTERNAL-OWNER",
      "algorithm": "ED25519",
      "keyRotation": "MONOTONIC_EXTERNAL_LEDGER",
      "revocation": "EXTERNAL_LEDGER_REVOCATION_ROOT_REQUIRED",
      "submittedTrustBoolean": "FORBIDDEN"
    },
    "policyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f",
    "trustPin": {
      "schema": "AuthorityTrustPinV8",
      "transport": "OWNER_VALIDATOR_ARGUMENT_ONLY",
      "submittedEvidenceField": "FORBIDDEN",
      "issuerKeyId": "N2-V8-OWNER-KEY-01",
      "algorithm": "ED25519",
      "publicKeyBytesHex": "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8",
      "publicKeySha256": "56475aa75463474c0285df5dbf2bcab73da651358839e9b77481b2eab107708c",
      "ledgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff",
      "keyRotationPolicy": "MONOTONIC_EXTERNAL_LEDGER",
      "revocationPolicy": "LEDGER_ROOT_EXACT_MATCH"
    },
    "trustPinRoot": "ff7d69d72f9ae9cffd655145a99af1ba598c889b68445ef8936438e662e3d03c",
    "ledger": {
      "schema": "AuthorityLedgerV8",
      "ledgerId": "N2-V8-OWNER-LEDGER",
      "version": 1,
      "predecessorRoot": "0000000000000000000000000000000000000000000000000000000000000000",
      "issuerKeyId": "N2-V8-OWNER-KEY-01",
      "issuerPublicKeySha256": "56475aa75463474c0285df5dbf2bcab73da651358839e9b77481b2eab107708c",
      "grantPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f",
      "revocationRoot": "429888429a149e77760000d31fb36913bdac48a5600de2d59becf68651dc4b4a",
      "authorizedExperimentId": "N2-IETM-PAPER-v8"
    },
    "ledgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff",
    "ledgerAdmissionReceipt": {
      "schema": "AuthorityLedgerAdmissionReceiptV8",
      "ledgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff",
      "issuerKeyId": "N2-V8-OWNER-KEY-01",
      "signatureBytesHex": "bc7befbd7b984fc1673b8a4229ba013879644b08d4c25542a86ac5fe4f0324f6ca887568e0d8f6e0e87b37352fa5cc0612af5d66494a37190705dfec0b289a06"
    }
  },
  "authorityObjects": {
    "policy": {
      "schema": "AuthorityPolicyV8",
      "policyId": "N2-V8-ED25519-EXTERNAL-OWNER",
      "algorithm": "ED25519",
      "keyRotation": "MONOTONIC_EXTERNAL_LEDGER",
      "revocation": "EXTERNAL_LEDGER_REVOCATION_ROOT_REQUIRED",
      "submittedTrustBoolean": "FORBIDDEN"
    },
    "policyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f",
    "ledger": {
      "schema": "AuthorityLedgerV8",
      "ledgerId": "N2-V8-OWNER-LEDGER",
      "version": 1,
      "predecessorRoot": "0000000000000000000000000000000000000000000000000000000000000000",
      "issuerKeyId": "N2-V8-OWNER-KEY-01",
      "issuerPublicKeySha256": "56475aa75463474c0285df5dbf2bcab73da651358839e9b77481b2eab107708c",
      "grantPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f",
      "revocationRoot": "429888429a149e77760000d31fb36913bdac48a5600de2d59becf68651dc4b4a",
      "authorizedExperimentId": "N2-IETM-PAPER-v8"
    },
    "ledgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff",
    "trustPin": {
      "schema": "AuthorityTrustPinV8",
      "transport": "OWNER_VALIDATOR_ARGUMENT_ONLY",
      "submittedEvidenceField": "FORBIDDEN",
      "issuerKeyId": "N2-V8-OWNER-KEY-01",
      "algorithm": "ED25519",
      "publicKeyBytesHex": "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8",
      "publicKeySha256": "56475aa75463474c0285df5dbf2bcab73da651358839e9b77481b2eab107708c",
      "ledgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff",
      "keyRotationPolicy": "MONOTONIC_EXTERNAL_LEDGER",
      "revocationPolicy": "LEDGER_ROOT_EXACT_MATCH"
    },
    "trustPinRoot": "ff7d69d72f9ae9cffd655145a99af1ba598c889b68445ef8936438e662e3d03c",
    "selection": {
      "schema": "ExperimentSelectionReceiptV8",
      "rowId": "ROW-N2-V8",
      "selectionRoot": "57a0c056a8461b12636e97eb100cc9706bb0d8b2b99094607559cf520c3a90c8"
    },
    "selectionRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
    "candidateEnvelope": {
      "schema": "CommandEnvelopeV8",
      "executablePath": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
      "executableRealpath": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
      "executableStat": {
        "device": "1",
        "inode": "2",
        "mode": "0755",
        "size": "123456",
        "mtimeNs": "1000"
      },
      "executableSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "argv0": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
      "cwd": "/experiment",
      "environment": [
        [
          "NODE_DISABLE_COMPILE_CACHE",
          "1"
        ],
        [
          "NODE_OPTIONS",
          ""
        ]
      ],
      "runtime": {
        "node": "26.0.0",
        "v8": "14.6"
      },
      "toolchain": {
        "typescript": "5.9.2"
      },
      "filesystemBounds": [
        "/experiment"
      ],
      "processBounds": {
        "children": 0
      },
      "networkBounds": {
        "allowed": false
      },
      "fileDescriptorBounds": [
        0,
        1,
        2
      ],
      "capabilitySurfaceIds": [],
      "role": "candidate",
      "argv": [
        "/opt/homebrew/Cellar/node/26.0.0/bin/node",
        "candidate.mjs",
        "ROW-N2-V8"
      ]
    },
    "candidateEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
    "controlEnvelope": {
      "schema": "CommandEnvelopeV8",
      "executablePath": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
      "executableRealpath": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
      "executableStat": {
        "device": "1",
        "inode": "2",
        "mode": "0755",
        "size": "123456",
        "mtimeNs": "1000"
      },
      "executableSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "argv0": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
      "cwd": "/experiment",
      "environment": [
        [
          "NODE_DISABLE_COMPILE_CACHE",
          "1"
        ],
        [
          "NODE_OPTIONS",
          ""
        ]
      ],
      "runtime": {
        "node": "26.0.0",
        "v8": "14.6"
      },
      "toolchain": {
        "typescript": "5.9.2"
      },
      "filesystemBounds": [
        "/experiment"
      ],
      "processBounds": {
        "children": 0
      },
      "networkBounds": {
        "allowed": false
      },
      "fileDescriptorBounds": [
        0,
        1,
        2
      ],
      "capabilitySurfaceIds": [],
      "role": "control",
      "argv": [
        "/opt/homebrew/Cellar/node/26.0.0/bin/node",
        "control.mjs",
        "ROW-N2-V8"
      ]
    },
    "controlEnvelopeRoot": "d01a2db5e3bfc660775f09caa224d62c4646bd6950b8a103d02e4c50bc58211e",
    "candidatePin": {
      "schema": "InputAuthorityPinV8",
      "role": "candidate",
      "selectionReceiptRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
      "sourceVersion": "SOURCE-V0",
      "identityEpochId": "EPOCH-0",
      "inputMembers": [
        {
          "path": "fixtures/input.css",
          "bytes": "17",
          "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        }
      ],
      "executablePin": {
        "path": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
        "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "stat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        }
      },
      "harnessPin": {
        "path": "candidate.mjs",
        "sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
      },
      "runtimePin": {
        "node": "26.0.0",
        "v8": "14.6"
      },
      "toolchainPin": {
        "typescript": "5.9.2"
      },
      "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
      "boundedEnvironmentKeyValues": [
        [
          "NODE_DISABLE_COMPILE_CACHE",
          "1"
        ],
        [
          "NODE_OPTIONS",
          ""
        ]
      ],
      "capabilitySurfaceIds": [],
      "filesystemBounds": [
        "/experiment"
      ],
      "processBounds": {
        "children": 0
      },
      "networkBounds": {
        "allowed": false
      },
      "fileDescriptorBounds": [
        0,
        1,
        2
      ],
      "staticReturnedTopologyConstraint": {
        "kind": "NO_DYNAMIC_CHAIN",
        "allowedRoots": [
          "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        ]
      },
      "ownerId": "parser-owner",
      "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
    },
    "candidatePinRoot": "ad9c5c61b2f4cf6bdc318c704c0f1ef7ba4581589236e843f7d64ff4030c4452",
    "controlPin": {
      "schema": "InputAuthorityPinV8",
      "role": "control",
      "selectionReceiptRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
      "sourceVersion": "SOURCE-V0",
      "identityEpochId": "EPOCH-0",
      "inputMembers": [
        {
          "path": "fixtures/input.css",
          "bytes": "17",
          "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        }
      ],
      "executablePin": {
        "path": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
        "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "stat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        }
      },
      "harnessPin": {
        "path": "control.mjs",
        "sha256": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
      },
      "runtimePin": {
        "node": "26.0.0",
        "v8": "14.6"
      },
      "toolchainPin": {
        "typescript": "5.9.2"
      },
      "commandEnvelopeRoot": "d01a2db5e3bfc660775f09caa224d62c4646bd6950b8a103d02e4c50bc58211e",
      "boundedEnvironmentKeyValues": [
        [
          "NODE_DISABLE_COMPILE_CACHE",
          "1"
        ],
        [
          "NODE_OPTIONS",
          ""
        ]
      ],
      "capabilitySurfaceIds": [],
      "filesystemBounds": [
        "/experiment"
      ],
      "processBounds": {
        "children": 0
      },
      "networkBounds": {
        "allowed": false
      },
      "fileDescriptorBounds": [
        0,
        1,
        2
      ],
      "staticReturnedTopologyConstraint": {
        "kind": "NO_DYNAMIC_CHAIN",
        "allowedRoots": [
          "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        ]
      },
      "ownerId": "parser-owner",
      "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
    },
    "controlPinRoot": "d5cfeb3eeea4a8192dec3f6ebabf847fa0e5732d1edb5ef8a773f5e5b4ecce43",
    "plan": {
      "schema": "ExperimentPlanV8",
      "selectionReceiptRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
      "candidate": {
        "inputPinRoot": "ad9c5c61b2f4cf6bdc318c704c0f1ef7ba4581589236e843f7d64ff4030c4452",
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b"
      },
      "control": {
        "inputPinRoot": "d5cfeb3eeea4a8192dec3f6ebabf847fa0e5732d1edb5ef8a773f5e5b4ecce43",
        "commandEnvelopeRoot": "d01a2db5e3bfc660775f09caa224d62c4646bd6950b8a103d02e4c50bc58211e"
      },
      "executionOrder": [
        "candidate:prepin",
        "candidate:execute-once",
        "candidate:seal",
        "control:prepin-already-fixed",
        "control:execute-once",
        "control:seal"
      ],
      "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
    },
    "planRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
    "capture": {
      "schema": "CommandCaptureV8",
      "role": "candidate",
      "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
      "executablePreStat": {
        "device": "1",
        "inode": "2",
        "mode": "0755",
        "size": "123456",
        "mtimeNs": "1000"
      },
      "executablePostStat": {
        "device": "1",
        "inode": "2",
        "mode": "0755",
        "size": "123456",
        "mtimeNs": "1000"
      },
      "actualArgv0": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
      "actualArgv": [
        "/opt/homebrew/Cellar/node/26.0.0/bin/node",
        "candidate.mjs",
        "ROW-N2-V8"
      ],
      "actualCwd": "/experiment",
      "actualEnvironment": [
        [
          "NODE_DISABLE_COMPILE_CACHE",
          "1"
        ],
        [
          "NODE_OPTIONS",
          ""
        ]
      ],
      "pid": "101",
      "ppid": "1",
      "startSequence": "1",
      "endSequence": "2",
      "exitCode": 0,
      "signal": null,
      "stdoutDescriptor": {
        "path": "raw/stdout.bin",
        "bytes": "0",
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      "stderrDescriptor": {
        "path": "raw/stderr.bin",
        "bytes": "0",
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      "rawSpawnReceipt": {
        "path": "raw/spawn.json",
        "sha256": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      },
      "invocationAuthority": {
        "actionDefinitionRoot": "1111111111111111111111111111111111111111111111111111111111111111",
        "callbackClosureRoot": "2222222222222222222222222222222222222222222222222222222222222222",
        "environmentRoot": "3333333333333333333333333333333333333333333333333333333333333333"
      },
      "freshnessBefore": {
        "fileDescriptors": [
          0,
          1,
          2
        ],
        "processes": [
          "self"
        ],
        "network": [],
        "filesystem": [
          "/experiment"
        ]
      },
      "freshnessAfter": {
        "fileDescriptors": [
          0,
          1,
          2
        ],
        "processes": [
          "self"
        ],
        "network": [],
        "filesystem": [
          "/experiment"
        ]
      }
    },
    "captureRoot": "b465902cec366cc7ccd00d93f1db7238bcc36c9cd308306911e75c2291bcfca9",
    "membership": {
      "schema": "ObservationMembershipV8",
      "role": "candidate",
      "descriptors": {
        "capture": {
          "path": "raw/capture.json",
          "sha256": "b465902cec366cc7ccd00d93f1db7238bcc36c9cd308306911e75c2291bcfca9"
        },
        "product": {
          "path": "raw/product.bin",
          "sha256": "4444444444444444444444444444444444444444444444444444444444444444"
        },
        "effects": {
          "path": "raw/effects.bin",
          "sha256": "5555555555555555555555555555555555555555555555555555555555555555"
        },
        "stdout": {
          "path": "raw/stdout.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "stderr": {
          "path": "raw/stderr.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        }
      }
    },
    "membershipRoot": "cf96f7332469d012cc130ea2ed356ae7d5acb871197ac076741d7dd77602d4cf",
    "seal": {
      "schema": "ObservationSealV8",
      "role": "candidate",
      "experimentPlanRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
      "inputPinRoot": "ad9c5c61b2f4cf6bdc318c704c0f1ef7ba4581589236e843f7d64ff4030c4452",
      "selectionRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
      "observationMembershipRoot": "cf96f7332469d012cc130ea2ed356ae7d5acb871197ac076741d7dd77602d4cf",
      "chronologyOrdinal": 3,
      "returnedParserTopologyRoot": "6666666666666666666666666666666666666666666666666666666666666666"
    },
    "sealRoot": "8ae531b2b09c28e2d6c261c266c68c4661c4b68bdc39339769d61af7dd46cd48",
    "sealAuthority": {
      "schema": "ObservationSealAuthorityV8",
      "seal": {
        "schema": "ObservationSealV8",
        "role": "candidate",
        "experimentPlanRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
        "inputPinRoot": "ad9c5c61b2f4cf6bdc318c704c0f1ef7ba4581589236e843f7d64ff4030c4452",
        "selectionRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
        "observationMembershipRoot": "cf96f7332469d012cc130ea2ed356ae7d5acb871197ac076741d7dd77602d4cf",
        "chronologyOrdinal": 3,
        "returnedParserTopologyRoot": "6666666666666666666666666666666666666666666666666666666666666666"
      },
      "observationSealRoot": "8ae531b2b09c28e2d6c261c266c68c4661c4b68bdc39339769d61af7dd46cd48"
    },
    "admissionMessage": {
      "schema": "OwnerAdmissionMessageV8",
      "rootKind": "OBSERVATION_SEAL",
      "root": "8ae531b2b09c28e2d6c261c266c68c4661c4b68bdc39339769d61af7dd46cd48",
      "role": "candidate",
      "experimentPlanRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
      "issuedOrdinal": 4,
      "keyId": "N2-V8-OWNER-KEY-01",
      "policyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f",
      "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
    },
    "admissionMessageRoot": "aa765ccc30b09a7b7851bb30e63a87e6e9cb8899ccc7d3353433a8083d843918",
    "admissionReceipt": {
      "schema": "OwnerAdmissionReceiptV8",
      "message": {
        "schema": "OwnerAdmissionMessageV8",
        "rootKind": "OBSERVATION_SEAL",
        "root": "8ae531b2b09c28e2d6c261c266c68c4661c4b68bdc39339769d61af7dd46cd48",
        "role": "candidate",
        "experimentPlanRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
        "issuedOrdinal": 4,
        "keyId": "N2-V8-OWNER-KEY-01",
        "policyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f",
        "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
      },
      "messageRoot": "aa765ccc30b09a7b7851bb30e63a87e6e9cb8899ccc7d3353433a8083d843918",
      "signatureBytesHex": "40caa818b4e22e72172fcb5ec90aa6328dc9fe50f11176769dc7d80a0bcf97be4667d01bb55a297ce73cd4c3234f84446c7c6fa32ea9bde14b9e5a2a4a9a4601"
    },
    "ledgerAdmissionReceipt": {
      "schema": "AuthorityLedgerAdmissionReceiptV8",
      "ledgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff",
      "issuerKeyId": "N2-V8-OWNER-KEY-01",
      "signatureBytesHex": "bc7befbd7b984fc1673b8a4229ba013879644b08d4c25542a86ac5fe4f0324f6ca887568e0d8f6e0e87b37352fa5cc0612af5d66494a37190705dfec0b289a06"
    }
  },
  "authorityRoots": {
    "concreteAuthorityRoot": "e6591e0fff436b58bd05194a51642c49ef885c80e060ccc7c816bb24a2f8113c",
    "productionInstanceRoot": "01c160257d4bd151afe503e07a3e387dbc1610db9d4fb3f5eeb5a322b38619c7",
    "sourceModuleRoot": "cb101c766d031f19eec520b92245baf7fd4686dc8eb171ddb399085e3ca763d4",
    "projectionJoinRoot": "50f3211a2e714757507bd604152c13ede4319cbb2a4ec286d23f39717d25006a",
    "nonownerRetentionRoot": "8173e2b92f739c082036230eca8b09539824ff9f23385dafdea0c41861f188f3"
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
  "productionInstances": [
    {
      "controlId": "C01",
      "role": "BEFORE",
      "root": "6f7e5790f2c1ba420f4fdf6578c97873e44cbe5199458c023fc44927c4589df8",
      "instance": {
        "schema": "DeclarationV8",
        "declarationSha256": "0000000000000000000000000000000000000000000000000000000000000000"
      }
    },
    {
      "controlId": "C01",
      "role": "AFTER",
      "root": "35faa34c38ed2167f6d2351064b080416b26a55163a4d18bba7cb6fdce301889",
      "instance": {
        "schema": "DeclarationV8",
        "declarationSha256": "1000000000000000000000000000000000000000000000000000000000000000"
      }
    },
    {
      "controlId": "C02",
      "role": "BEFORE",
      "root": "b893a3f3c0c8313324e98cb7f3b06e89cdf53e128c45e3d1b38fd5cb60e2d80a",
      "instance": {
        "schema": "LedgerV8",
        "ledgerRoot": "0000000000000000000000000000000000000000000000000000000000000000"
      }
    },
    {
      "controlId": "C02",
      "role": "AFTER",
      "root": "d7f2df5ce25ac4e1f94e848170f79f0893b71cf43bc3010508fbb5cc414e2904",
      "instance": {
        "schema": "LedgerV8",
        "ledgerRoot": "1000000000000000000000000000000000000000000000000000000000000000"
      }
    },
    {
      "controlId": "C03",
      "role": "BEFORE",
      "root": "51dc6d9792053beffba9a8987754100c375469977226caf78afcadd0d3c3b959",
      "instance": {
        "schema": "LedgerV8",
        "versions": [
          {},
          {
            "parentVersion": 0
          }
        ]
      }
    },
    {
      "controlId": "C03",
      "role": "AFTER",
      "root": "55525cdb22568799ae99752e5282ce45ba3e50cc1201ea0e72371134043bdc31",
      "instance": {
        "schema": "LedgerV8",
        "versions": [
          {},
          {
            "parentVersion": 1
          }
        ]
      }
    },
    {
      "controlId": "C04",
      "role": "BEFORE",
      "root": "5604247c44a150b216362c2967ceceda4e425b405b6a660f086f7ab297775b07",
      "instance": {
        "schema": "EffectTableV8",
        "effectIdentities": [
          {
            "ordinal": 0
          }
        ]
      }
    },
    {
      "controlId": "C04",
      "role": "AFTER",
      "root": "58fd093369e662b9219df538173e82c50f32e78c07ab6ad6699fe9e484868aa0",
      "instance": {
        "schema": "EffectTableV8",
        "effectIdentities": [
          {
            "ordinal": 1
          }
        ]
      }
    },
    {
      "controlId": "C05",
      "role": "BEFORE",
      "root": "2898df3ea641684753830e952ed187efe23c74c74234dc6ff3d1fa9b95f0c4e0",
      "instance": {
        "schema": "ExperimentSelectionReceiptV8",
        "rowOrdinal": 0
      }
    },
    {
      "controlId": "C05",
      "role": "AFTER",
      "root": "a4d39bf40e8494c0b5e84a4efcbf0616a3c2ac265ba40fab4ef595d915cb0279",
      "instance": {
        "schema": "ExperimentSelectionReceiptV8",
        "rowOrdinal": 1
      }
    },
    {
      "controlId": "C06",
      "role": "BEFORE",
      "root": "2328009d2a602f05322d17e08faf1773549f7d68f6f70d1900377836ff37426a",
      "instance": {
        "schema": "EditLedgerV8",
        "edits": [
          {
            "startUtf16": 1
          }
        ]
      }
    },
    {
      "controlId": "C06",
      "role": "AFTER",
      "root": "982fc09006cdd9efb616b713cf931cff82353c6aef504e586dd1d58ad28adf26",
      "instance": {
        "schema": "EditLedgerV8",
        "edits": [
          {
            "startUtf16": 2
          }
        ]
      }
    },
    {
      "controlId": "C07",
      "role": "BEFORE",
      "root": "8b4104f0d909018c2e301690e97c9247d1f418e83efae7fd7bca02033701a1a4",
      "instance": {
        "schema": "CompleteProductV8",
        "maxDepth": 4
      }
    },
    {
      "controlId": "C07",
      "role": "AFTER",
      "root": "f9e7307053e6f7e1bf3975659cfe60ec8e90207ca12aa732ecb6384247366165",
      "instance": {
        "schema": "CompleteProductV8",
        "maxDepth": 5
      }
    },
    {
      "controlId": "C08",
      "role": "BEFORE",
      "root": "3ea4bdec4aba59d048cc336d3c9cf4526d9043fe2e5ad400c71f36fe21a07271",
      "instance": {
        "schema": "CompleteProductV8",
        "offset": 3
      }
    },
    {
      "controlId": "C08",
      "role": "AFTER",
      "root": "cd6f0ac3cccf6cd7aa2b963257035107b79b5e0594f16da7b53d35cef5981d5b",
      "instance": {
        "schema": "CompleteProductV8",
        "offset": 2
      }
    },
    {
      "controlId": "C09",
      "role": "BEFORE",
      "root": "f5717ec430cfa3b9b2ca39d27362b6e03a22c155c7003042f386dca45cae2f03",
      "instance": {
        "schema": "ObservedEventV8",
        "events": [
          {
            "occurrence": 0
          }
        ]
      }
    },
    {
      "controlId": "C09",
      "role": "AFTER",
      "root": "5b0ad511d1baff8aa9f1068620930c66bb3518aeff16c92dcb92bf4b6b077978",
      "instance": {
        "schema": "ObservedEventV8",
        "events": [
          {
            "occurrence": 1
          }
        ]
      }
    },
    {
      "controlId": "C10",
      "role": "BEFORE",
      "root": "acb56ddd4722ec8ff3f82d22f8f9d610d7746b0d57d6113da9e7e38cb2323a63",
      "instance": {
        "schema": "InputAuthorityPinV8",
        "role": "candidate",
        "selectionReceiptRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
        "sourceVersion": "SOURCE-V0",
        "identityEpochId": "EPOCH-0",
        "inputMembers": [
          {
            "path": "fixtures/input.css",
            "bytes": "17",
            "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
          }
        ],
        "executablePin": {
          "path": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "stat": {
            "device": "1",
            "inode": "2",
            "mode": "0755",
            "size": "123456",
            "mtimeNs": "1000"
          }
        },
        "harnessPin": {
          "path": "candidate.mjs",
          "sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
        },
        "runtimePin": {
          "node": "26.0.0",
          "v8": "14.6"
        },
        "toolchainPin": {
          "typescript": "5.9.2"
        },
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "boundedEnvironmentKeyValues": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "capabilitySurfaceIds": [],
        "filesystemBounds": [
          "/experiment"
        ],
        "processBounds": {
          "children": 0
        },
        "networkBounds": {
          "allowed": false
        },
        "fileDescriptorBounds": [
          0,
          1,
          2
        ],
        "staticReturnedTopologyConstraint": {
          "kind": "NO_DYNAMIC_CHAIN",
          "allowedRoots": [
            "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ]
        },
        "ownerId": "parser-owner",
        "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
      }
    },
    {
      "controlId": "C10",
      "role": "AFTER",
      "root": "b6b76fdb205e3e6989bc117d6398e605d2a26cc52ed61242ce10aefeb329e0b8",
      "instance": {
        "schema": "InputAuthorityPinV8",
        "role": "control",
        "selectionReceiptRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
        "sourceVersion": "SOURCE-V0",
        "identityEpochId": "EPOCH-0",
        "inputMembers": [
          {
            "path": "fixtures/input.css",
            "bytes": "17",
            "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
          }
        ],
        "executablePin": {
          "path": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "stat": {
            "device": "1",
            "inode": "2",
            "mode": "0755",
            "size": "123456",
            "mtimeNs": "1000"
          }
        },
        "harnessPin": {
          "path": "candidate.mjs",
          "sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
        },
        "runtimePin": {
          "node": "26.0.0",
          "v8": "14.6"
        },
        "toolchainPin": {
          "typescript": "5.9.2"
        },
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "boundedEnvironmentKeyValues": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "capabilitySurfaceIds": [],
        "filesystemBounds": [
          "/experiment"
        ],
        "processBounds": {
          "children": 0
        },
        "networkBounds": {
          "allowed": false
        },
        "fileDescriptorBounds": [
          0,
          1,
          2
        ],
        "staticReturnedTopologyConstraint": {
          "kind": "NO_DYNAMIC_CHAIN",
          "allowedRoots": [
            "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ]
        },
        "ownerId": "parser-owner",
        "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
      }
    },
    {
      "controlId": "C11",
      "role": "BEFORE",
      "root": "21b7bc763d057b49c634b9edc4551a04ed1f631bf0f4d5a290a82d0296e012ad",
      "instance": {
        "schema": "InputAuthorityPinV8",
        "role": "candidate",
        "selectionReceiptRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
        "sourceVersion": "SOURCE-V0",
        "identityEpochId": "EPOCH-0",
        "inputMembers": [
          {
            "path": "fixtures/input.css",
            "bytes": 1,
            "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
          }
        ],
        "executablePin": {
          "path": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "stat": {
            "device": "1",
            "inode": "2",
            "mode": "0755",
            "size": "123456",
            "mtimeNs": "1000"
          }
        },
        "harnessPin": {
          "path": "candidate.mjs",
          "sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
        },
        "runtimePin": {
          "node": "26.0.0",
          "v8": "14.6"
        },
        "toolchainPin": {
          "typescript": "5.9.2"
        },
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "boundedEnvironmentKeyValues": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "capabilitySurfaceIds": [],
        "filesystemBounds": [
          "/experiment"
        ],
        "processBounds": {
          "children": 0
        },
        "networkBounds": {
          "allowed": false
        },
        "fileDescriptorBounds": [
          0,
          1,
          2
        ],
        "staticReturnedTopologyConstraint": {
          "kind": "NO_DYNAMIC_CHAIN",
          "allowedRoots": [
            "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ]
        },
        "ownerId": "parser-owner",
        "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
      }
    },
    {
      "controlId": "C11",
      "role": "AFTER",
      "root": "69f8e56ee9e37badbb86f74bc5174af347c64c700a5759a53643d0f006410e3b",
      "instance": {
        "schema": "InputAuthorityPinV8",
        "role": "candidate",
        "selectionReceiptRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
        "sourceVersion": "SOURCE-V0",
        "identityEpochId": "EPOCH-0",
        "inputMembers": [
          {
            "path": "fixtures/input.css",
            "bytes": 2,
            "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
          }
        ],
        "executablePin": {
          "path": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "stat": {
            "device": "1",
            "inode": "2",
            "mode": "0755",
            "size": "123456",
            "mtimeNs": "1000"
          }
        },
        "harnessPin": {
          "path": "candidate.mjs",
          "sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
        },
        "runtimePin": {
          "node": "26.0.0",
          "v8": "14.6"
        },
        "toolchainPin": {
          "typescript": "5.9.2"
        },
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "boundedEnvironmentKeyValues": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "capabilitySurfaceIds": [],
        "filesystemBounds": [
          "/experiment"
        ],
        "processBounds": {
          "children": 0
        },
        "networkBounds": {
          "allowed": false
        },
        "fileDescriptorBounds": [
          0,
          1,
          2
        ],
        "staticReturnedTopologyConstraint": {
          "kind": "NO_DYNAMIC_CHAIN",
          "allowedRoots": [
            "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ]
        },
        "ownerId": "parser-owner",
        "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
      }
    },
    {
      "controlId": "C12",
      "role": "BEFORE",
      "root": "8224c8bbd9ced92e3350b1d7bd8fc66773e9453c8491676cc18e9a307192e41b",
      "instance": {
        "schema": "CommandCaptureV8",
        "role": "candidate",
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "executablePreStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "executablePostStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "actualArgv0": "/opt/node",
        "actualArgv": [
          "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "candidate.mjs",
          "ROW-N2-V8"
        ],
        "actualCwd": "/experiment",
        "actualEnvironment": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "pid": "101",
        "ppid": "1",
        "startSequence": "1",
        "endSequence": "2",
        "exitCode": 0,
        "signal": null,
        "stdoutDescriptor": {
          "path": "raw/stdout.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "stderrDescriptor": {
          "path": "raw/stderr.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "rawSpawnReceipt": {
          "path": "raw/spawn.json",
          "sha256": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        },
        "invocationAuthority": {
          "actionDefinitionRoot": "1111111111111111111111111111111111111111111111111111111111111111",
          "callbackClosureRoot": "2222222222222222222222222222222222222222222222222222222222222222",
          "environmentRoot": "3333333333333333333333333333333333333333333333333333333333333333"
        },
        "freshnessBefore": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        },
        "freshnessAfter": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        }
      }
    },
    {
      "controlId": "C12",
      "role": "AFTER",
      "root": "1ff2e6390a81ce64fc5b591286b204cd50726970494102edb1b41b75d5b95676",
      "instance": {
        "schema": "CommandCaptureV8",
        "role": "candidate",
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "executablePreStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "executablePostStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "actualArgv0": "/opt/node-mutant",
        "actualArgv": [
          "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "candidate.mjs",
          "ROW-N2-V8"
        ],
        "actualCwd": "/experiment",
        "actualEnvironment": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "pid": "101",
        "ppid": "1",
        "startSequence": "1",
        "endSequence": "2",
        "exitCode": 0,
        "signal": null,
        "stdoutDescriptor": {
          "path": "raw/stdout.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "stderrDescriptor": {
          "path": "raw/stderr.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "rawSpawnReceipt": {
          "path": "raw/spawn.json",
          "sha256": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        },
        "invocationAuthority": {
          "actionDefinitionRoot": "1111111111111111111111111111111111111111111111111111111111111111",
          "callbackClosureRoot": "2222222222222222222222222222222222222222222222222222222222222222",
          "environmentRoot": "3333333333333333333333333333333333333333333333333333333333333333"
        },
        "freshnessBefore": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        },
        "freshnessAfter": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        }
      }
    },
    {
      "controlId": "C13",
      "role": "BEFORE",
      "root": "d40f9f673c844b0d3ab304acabf8751dfce9ea727363ce3af2806def14330d2e",
      "instance": {
        "schema": "ObservationSealAuthorityV8",
        "seal": {
          "schema": "ObservationSealV8",
          "role": "candidate",
          "experimentPlanRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
          "inputPinRoot": "ad9c5c61b2f4cf6bdc318c704c0f1ef7ba4581589236e843f7d64ff4030c4452",
          "selectionRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
          "observationMembershipRoot": "cf96f7332469d012cc130ea2ed356ae7d5acb871197ac076741d7dd77602d4cf",
          "chronologyOrdinal": 1,
          "returnedParserTopologyRoot": "6666666666666666666666666666666666666666666666666666666666666666"
        },
        "observationSealRoot": "8ae531b2b09c28e2d6c261c266c68c4661c4b68bdc39339769d61af7dd46cd48"
      }
    },
    {
      "controlId": "C13",
      "role": "AFTER",
      "root": "c747618b70a74be567467452a260b44dad485c07732ad2a295c2b05bbbbdf42d",
      "instance": {
        "schema": "ObservationSealAuthorityV8",
        "seal": {
          "schema": "ObservationSealV8",
          "role": "candidate",
          "experimentPlanRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
          "inputPinRoot": "ad9c5c61b2f4cf6bdc318c704c0f1ef7ba4581589236e843f7d64ff4030c4452",
          "selectionRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
          "observationMembershipRoot": "cf96f7332469d012cc130ea2ed356ae7d5acb871197ac076741d7dd77602d4cf",
          "chronologyOrdinal": 3,
          "returnedParserTopologyRoot": "6666666666666666666666666666666666666666666666666666666666666666"
        },
        "observationSealRoot": "8ae531b2b09c28e2d6c261c266c68c4661c4b68bdc39339769d61af7dd46cd48"
      }
    },
    {
      "controlId": "C14",
      "role": "BEFORE",
      "root": "acb56ddd4722ec8ff3f82d22f8f9d610d7746b0d57d6113da9e7e38cb2323a63",
      "instance": {
        "schema": "InputAuthorityPinV8",
        "role": "candidate",
        "selectionReceiptRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
        "sourceVersion": "SOURCE-V0",
        "identityEpochId": "EPOCH-0",
        "inputMembers": [
          {
            "path": "fixtures/input.css",
            "bytes": "17",
            "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
          }
        ],
        "executablePin": {
          "path": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "stat": {
            "device": "1",
            "inode": "2",
            "mode": "0755",
            "size": "123456",
            "mtimeNs": "1000"
          }
        },
        "harnessPin": {
          "path": "candidate.mjs",
          "sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
        },
        "runtimePin": {
          "node": "26.0.0",
          "v8": "14.6"
        },
        "toolchainPin": {
          "typescript": "5.9.2"
        },
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "boundedEnvironmentKeyValues": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "capabilitySurfaceIds": [],
        "filesystemBounds": [
          "/experiment"
        ],
        "processBounds": {
          "children": 0
        },
        "networkBounds": {
          "allowed": false
        },
        "fileDescriptorBounds": [
          0,
          1,
          2
        ],
        "staticReturnedTopologyConstraint": {
          "kind": "NO_DYNAMIC_CHAIN",
          "allowedRoots": [
            "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ]
        },
        "ownerId": "parser-owner",
        "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
      }
    },
    {
      "controlId": "C14",
      "role": "AFTER",
      "root": "2fe972f561b33a73d23df9a38d62db033ed32ed26a629a2ee29f8a7038418681",
      "instance": {
        "schema": "InputAuthorityPinV8",
        "role": "candidate",
        "selectionReceiptRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
        "sourceVersion": "SOURCE-V0",
        "identityEpochId": "EPOCH-0",
        "inputMembers": [
          {
            "path": "fixtures/input.css",
            "bytes": "17",
            "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
          }
        ],
        "executablePin": {
          "path": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "stat": {
            "device": "1",
            "inode": "2",
            "mode": "0755",
            "size": "123456",
            "mtimeNs": "1000"
          }
        },
        "harnessPin": {
          "path": "candidate.mjs",
          "sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
        },
        "runtimePin": {
          "node": "26.0.0",
          "v8": "14.6"
        },
        "toolchainPin": {
          "typescript": "5.9.2"
        },
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "boundedEnvironmentKeyValues": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "capabilitySurfaceIds": [
          "network:any"
        ],
        "filesystemBounds": [
          "/experiment"
        ],
        "processBounds": {
          "children": 0
        },
        "networkBounds": {
          "allowed": false
        },
        "fileDescriptorBounds": [
          0,
          1,
          2
        ],
        "staticReturnedTopologyConstraint": {
          "kind": "NO_DYNAMIC_CHAIN",
          "allowedRoots": [
            "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ]
        },
        "ownerId": "parser-owner",
        "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
      }
    },
    {
      "controlId": "C15",
      "role": "BEFORE",
      "root": "cb5f1613339d693dc6341af4f3fc0f1fb59e209abed9992024551d5e568c4f07",
      "instance": {
        "schema": "CommandCaptureV8",
        "role": "candidate",
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "executablePreStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "executablePostStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "actualArgv0": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
        "actualArgv": [
          "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "candidate.mjs",
          "ROW-N2-V8"
        ],
        "actualCwd": "/experiment",
        "actualEnvironment": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "pid": "101",
        "ppid": "1",
        "startSequence": "1",
        "endSequence": "2",
        "exitCode": 0,
        "signal": null,
        "stdoutDescriptor": {
          "path": "raw/stdout.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "stderrDescriptor": {
          "path": "raw/stderr.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "rawSpawnReceipt": {
          "path": "raw/spawn.json",
          "sha256": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        },
        "invocationAuthority": {
          "actionDefinitionRoot": "1111111111111111111111111111111111111111111111111111111111111111",
          "callbackClosureRoot": "0000000000000000000000000000000000000000000000000000000000000000",
          "environmentRoot": "3333333333333333333333333333333333333333333333333333333333333333"
        },
        "freshnessBefore": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        },
        "freshnessAfter": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        }
      }
    },
    {
      "controlId": "C15",
      "role": "AFTER",
      "root": "67a073f8943a4cbd532abce77a8332232b3e955f1f6e3380b8a6fe8463078c3d",
      "instance": {
        "schema": "CommandCaptureV8",
        "role": "candidate",
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "executablePreStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "executablePostStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "actualArgv0": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
        "actualArgv": [
          "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "candidate.mjs",
          "ROW-N2-V8"
        ],
        "actualCwd": "/experiment",
        "actualEnvironment": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "pid": "101",
        "ppid": "1",
        "startSequence": "1",
        "endSequence": "2",
        "exitCode": 0,
        "signal": null,
        "stdoutDescriptor": {
          "path": "raw/stdout.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "stderrDescriptor": {
          "path": "raw/stderr.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "rawSpawnReceipt": {
          "path": "raw/spawn.json",
          "sha256": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        },
        "invocationAuthority": {
          "actionDefinitionRoot": "1111111111111111111111111111111111111111111111111111111111111111",
          "callbackClosureRoot": "1000000000000000000000000000000000000000000000000000000000000000",
          "environmentRoot": "3333333333333333333333333333333333333333333333333333333333333333"
        },
        "freshnessBefore": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        },
        "freshnessAfter": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        }
      }
    },
    {
      "controlId": "C16",
      "role": "BEFORE",
      "root": "cb752b51043c4ef09057e6fd2bba888ed6be9bb10c030fffba2cd8ae3818a66d",
      "instance": {
        "schema": "CommandCaptureV8",
        "role": "candidate",
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "executablePreStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "executablePostStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "actualArgv0": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
        "actualArgv": [
          "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "candidate.mjs",
          "ROW-N2-V8"
        ],
        "actualCwd": "/experiment",
        "actualEnvironment": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "pid": "101",
        "ppid": "1",
        "startSequence": "1",
        "endSequence": "2",
        "exitCode": 0,
        "signal": null,
        "stdoutDescriptor": {
          "path": "raw/stdout.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "stderrDescriptor": {
          "path": "raw/stderr.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "rawSpawnReceipt": {
          "path": "raw/spawn.json",
          "sha256": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        },
        "invocationAuthority": {
          "actionDefinitionRoot": "1111111111111111111111111111111111111111111111111111111111111111",
          "callbackClosureRoot": "2222222222222222222222222222222222222222222222222222222222222222",
          "environmentRoot": "3333333333333333333333333333333333333333333333333333333333333333"
        },
        "freshnessBefore": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        },
        "freshnessAfter": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        }
      }
    },
    {
      "controlId": "C16",
      "role": "AFTER",
      "root": "a6781542d6a5a4290cf05535910078515ef58096b183df7af48cc68c215686db",
      "instance": {
        "schema": "CommandCaptureV8",
        "role": "candidate",
        "commandEnvelopeRoot": "e1adedc669561aaf20d20f7a8f929d377d37bf20240b979825157074e219d71b",
        "executablePreStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "executablePostStat": {
          "device": "1",
          "inode": "2",
          "mode": "0755",
          "size": "123456",
          "mtimeNs": "1000"
        },
        "actualArgv0": "/opt/homebrew/Cellar/node/26.0.0/bin/node",
        "actualArgv": [
          "/opt/homebrew/Cellar/node/26.0.0/bin/node",
          "candidate.mjs",
          "ROW-N2-V8"
        ],
        "actualCwd": "/experiment",
        "actualEnvironment": [
          [
            "NODE_DISABLE_COMPILE_CACHE",
            "1"
          ],
          [
            "NODE_OPTIONS",
            ""
          ]
        ],
        "pid": "101",
        "ppid": "1",
        "startSequence": "1",
        "endSequence": "2",
        "exitCode": 0,
        "signal": null,
        "stdoutDescriptor": {
          "path": "raw/stdout.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "stderrDescriptor": {
          "path": "raw/stderr.bin",
          "bytes": "0",
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "rawSpawnReceipt": {
          "path": "raw/spawn.json",
          "sha256": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        },
        "invocationAuthority": {
          "actionDefinitionRoot": "1111111111111111111111111111111111111111111111111111111111111111",
          "callbackClosureRoot": "2222222222222222222222222222222222222222222222222222222222222222",
          "environmentRoot": "3333333333333333333333333333333333333333333333333333333333333333"
        },
        "freshnessBefore": {
          "fileDescriptors": [
            0,
            1,
            2
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        },
        "freshnessAfter": {
          "fileDescriptors": [
            0,
            1,
            2,
            99
          ],
          "processes": [
            "self"
          ],
          "network": [],
          "filesystem": [
            "/experiment"
          ]
        }
      }
    },
    {
      "controlId": "C17",
      "role": "BEFORE",
      "root": "7d1a281c72bcb6379abe765adf741f6fc1d89fc7bcd785476682ed763a86e9af",
      "instance": {
        "schema": "ObservationMembershipV8",
        "role": "candidate",
        "descriptors": {
          "capture": {
            "path": "raw/capture.json",
            "sha256": "b465902cec366cc7ccd00d93f1db7238bcc36c9cd308306911e75c2291bcfca9"
          },
          "product": true,
          "effects": {
            "path": "raw/effects.bin",
            "sha256": "5555555555555555555555555555555555555555555555555555555555555555"
          },
          "stdout": {
            "path": "raw/stdout.bin",
            "bytes": "0",
            "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          },
          "stderr": {
            "path": "raw/stderr.bin",
            "bytes": "0",
            "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          }
        }
      }
    },
    {
      "controlId": "C17",
      "role": "AFTER",
      "root": "959c8fe8bdb92f06f7e442e8e9cf789de2faed4ec3e60c8fa1b48e4c2e1bb8c4",
      "instance": {
        "schema": "ObservationMembershipV8",
        "role": "candidate",
        "descriptors": {
          "capture": {
            "path": "raw/capture.json",
            "sha256": "b465902cec366cc7ccd00d93f1db7238bcc36c9cd308306911e75c2291bcfca9"
          },
          "effects": {
            "path": "raw/effects.bin",
            "sha256": "5555555555555555555555555555555555555555555555555555555555555555"
          },
          "stdout": {
            "path": "raw/stdout.bin",
            "bytes": "0",
            "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          },
          "stderr": {
            "path": "raw/stderr.bin",
            "bytes": "0",
            "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          }
        }
      }
    },
    {
      "controlId": "C18",
      "role": "BEFORE",
      "root": "625eb9b15e42238466c452b03dc445edc693c7fd16c9fa2a67bda2781f97c0d2",
      "instance": {
        "schema": "ObservationSealAuthorityV8",
        "seal": {
          "schema": "ObservationSealV8",
          "role": "candidate",
          "experimentPlanRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
          "inputPinRoot": "ad9c5c61b2f4cf6bdc318c704c0f1ef7ba4581589236e843f7d64ff4030c4452",
          "selectionRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
          "observationMembershipRoot": "cf96f7332469d012cc130ea2ed356ae7d5acb871197ac076741d7dd77602d4cf",
          "chronologyOrdinal": 3,
          "returnedParserTopologyRoot": "6666666666666666666666666666666666666666666666666666666666666666"
        },
        "observationSealRoot": "0000000000000000000000000000000000000000000000000000000000000000"
      }
    },
    {
      "controlId": "C18",
      "role": "AFTER",
      "root": "232fd63a8bb3f164569a2d52c5f35fafbe3898405ec4eacc445a61fa3d2c4b77",
      "instance": {
        "schema": "ObservationSealAuthorityV8",
        "seal": {
          "schema": "ObservationSealV8",
          "role": "candidate",
          "experimentPlanRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
          "inputPinRoot": "ad9c5c61b2f4cf6bdc318c704c0f1ef7ba4581589236e843f7d64ff4030c4452",
          "selectionRoot": "4d7d546048ef33e6629d3749c5403de4abf27ac27326600af5dc5d3282c272d9",
          "observationMembershipRoot": "cf96f7332469d012cc130ea2ed356ae7d5acb871197ac076741d7dd77602d4cf",
          "chronologyOrdinal": 3,
          "returnedParserTopologyRoot": "6666666666666666666666666666666666666666666666666666666666666666"
        },
        "observationSealRoot": "1000000000000000000000000000000000000000000000000000000000000000"
      }
    },
    {
      "controlId": "C19",
      "role": "BEFORE",
      "root": "1845ac1bc01a7afda898cbde9aa0b4343684bd4029bc482e24cf4734ff1034c6",
      "instance": {
        "schema": "OwnerAdmissionReceiptV8",
        "message": {
          "schema": "OwnerAdmissionMessageV8",
          "rootKind": "OBSERVATION_SEAL",
          "root": "0000000000000000000000000000000000000000000000000000000000000000",
          "role": "candidate",
          "experimentPlanRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
          "issuedOrdinal": 4,
          "keyId": "N2-V8-OWNER-KEY-01",
          "policyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f",
          "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
        },
        "messageRoot": "aa765ccc30b09a7b7851bb30e63a87e6e9cb8899ccc7d3353433a8083d843918",
        "signatureBytesHex": "PENDING_ED25519"
      }
    },
    {
      "controlId": "C19",
      "role": "AFTER",
      "root": "40a2ec82ba7cbc679056d83580db4112de4b8fbb6162676e2e1c4cb1d9ec6f92",
      "instance": {
        "schema": "OwnerAdmissionReceiptV8",
        "message": {
          "schema": "OwnerAdmissionMessageV8",
          "rootKind": "OBSERVATION_SEAL",
          "root": "1000000000000000000000000000000000000000000000000000000000000000",
          "role": "candidate",
          "experimentPlanRoot": "f23dae546aa605fb61b9060f1e700a80423f8bc20c0b0cbb4739e722c2a38168",
          "issuedOrdinal": 4,
          "keyId": "N2-V8-OWNER-KEY-01",
          "policyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f",
          "authorityLedgerRoot": "261f9ee39149cf4f0330138a827c19caf01f18e0f5d2cd09359533cdda8125ff"
        },
        "messageRoot": "aa765ccc30b09a7b7851bb30e63a87e6e9cb8899ccc7d3353433a8083d843918",
        "signatureBytesHex": "PENDING_ED25519"
      }
    },
    {
      "controlId": "C20",
      "role": "BEFORE",
      "root": "9b88bb2d4cc8d7558ef5a233c8b012ff914a205f117b6bdc9b3603c4a5228a30",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C20",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C20",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "7b2261223a317d"
        }
      }
    },
    {
      "controlId": "C20",
      "role": "AFTER",
      "root": "04c72d0ecf97487da75ed3302983b7c31e0a0ba91601638c7a47ff91901f09cd",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C20",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C20",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "7b2261223a312c2261223a327d"
        }
      }
    },
    {
      "controlId": "C21",
      "role": "BEFORE",
      "root": "0056edf0079b26b6f374fdfcbfdf0d6d9d03c5fd78abfbc3fe13ad5f2399380e",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C21",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C21",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "7b2278223a7b2261223a317d7d"
        }
      }
    },
    {
      "controlId": "C21",
      "role": "AFTER",
      "root": "a74f1a7211b2c4a02107b438a9fd4db8319a645aab7d8a5f7969d35c30ffa625",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C21",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C21",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "7b2278223a7b2261223a312c2261223a327d7d"
        }
      }
    },
    {
      "controlId": "C22",
      "role": "BEFORE",
      "root": "a05b7d39459d74ff7a4f4b5c2789b1743e90dd46b118481207d98ec350803ea0",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C22",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C22",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "222f22"
        }
      }
    },
    {
      "controlId": "C22",
      "role": "AFTER",
      "root": "fcca134c429ef613a09a52dd58a9655ced8175b1625cf00bb1f5345dad1c89f4",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C22",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C22",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "225c2f22"
        }
      }
    },
    {
      "controlId": "C23",
      "role": "BEFORE",
      "root": "0631b9ef82a6d49b0534096d49421f3e91a7d7195dfc1f37ace8c44e695d7669",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C23",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C23",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "225c753030666622"
        }
      }
    },
    {
      "controlId": "C23",
      "role": "AFTER",
      "root": "3c44b67f73c25d4b1e6ad053324e6bc6521a9c768b260531a380717a4028b8fd",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C23",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C23",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "225c753030464622"
        }
      }
    },
    {
      "controlId": "C24",
      "role": "BEFORE",
      "root": "c02d0e562c14a33ba58618c2492650d5b2fe89d692e444c89c2b3e4086b1bb59",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C24",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C24",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "225c6e22"
        }
      }
    },
    {
      "controlId": "C24",
      "role": "AFTER",
      "root": "736ad218139462e039391f26ab67e1eb2f31bcdb088351e2693ef5b577b83858",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C24",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C24",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "225c753030306122"
        }
      }
    },
    {
      "controlId": "C25",
      "role": "BEFORE",
      "root": "69b073f521396770d714374e8253f6fa97d2a39e549282608d2c4841a435e38a",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C25",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C25",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "7b2261223a312c2262223a327d"
        }
      }
    },
    {
      "controlId": "C25",
      "role": "AFTER",
      "root": "ae897d66173e2a2ca937ea904fe7dfa2817f10cceae7e76921426c88b81500c2",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C25",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C25",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "7b2262223a322c2261223a317d"
        }
      }
    },
    {
      "controlId": "C26",
      "role": "BEFORE",
      "root": "c7113c6852fe08509085655effb61e0b2fab81abed17d5b997868fa970b2f108",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C26",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C26",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "30"
        }
      }
    },
    {
      "controlId": "C26",
      "role": "AFTER",
      "root": "e341830824cedd6ded978dc582302598b56b6c4d79f6f2f846da5f23e132a964",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C26",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C26",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "3030"
        }
      }
    },
    {
      "controlId": "C27",
      "role": "BEFORE",
      "root": "9a4d540a6030111b0665f52ab0d6262e324bfd982cb59c01ebcc9d031188c027",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C27",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C27",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "efbfbd"
        }
      }
    },
    {
      "controlId": "C27",
      "role": "AFTER",
      "root": "234c25bcca8674631554c0bf8e5b4478f8569cd45493c9d280ab8383bac7568d",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C27",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C27",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "eda080"
        }
      }
    },
    {
      "controlId": "C28",
      "role": "BEFORE",
      "root": "6232bf858131e4907efce603bbf3198e67c212becd1c27e9fd2567158b07e80a",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C28",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C28",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "7b2261223a317d"
        }
      }
    },
    {
      "controlId": "C28",
      "role": "AFTER",
      "root": "43bdb57007b8712266d2e4ae16226e66e4bfb9a324c038734377540f485ebcd3",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C28",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C28",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "207b2261223a317d"
        }
      }
    },
    {
      "controlId": "C29",
      "role": "BEFORE",
      "root": "e6adbb2a684230d470736cd27258bfad5e4187b58ecd9cc881ddf3b138cad938",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C29",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C29",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "7b2224223a22706f696e74222c226174223a307d"
        }
      }
    },
    {
      "controlId": "C29",
      "role": "AFTER",
      "root": "bd2588ce2f342ba776f47743b790589cc443b078a72345bf7a4ba54b66a82934",
      "instance": {
        "schema": "RawProductionInputV8",
        "rowId": "ROW-C29",
        "runId": "RUN-N2-V8",
        "armId": "ARM-IETM",
        "fixtureId": "FX-C29",
        "productId": "PRODUCT-N2-V8",
        "blob": {
          "encoding": "UTF8",
          "bytesHex": "7b2224223a22756e6b6e6f776e222c226174223a307d"
        }
      }
    },
    {
      "controlId": "C30",
      "role": "BEFORE",
      "root": "935ecece4f1dc1d6f0911e6801dbfb9c503a5008f92820558247d0f8593d8903",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C30",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b226d6f64756c65536574223a5b225030222c225031222c225032222c225033222c225034222c225035222c225036222c225037225d7d"
        },
        "authorizedSourcePinRoot": "4aeb4d586412af58a170d5f96b4a44982490f4ac544b92d2e203cbd9fa986cab"
      }
    },
    {
      "controlId": "C30",
      "role": "AFTER",
      "root": "769714215eaf5dd95f1f6a1c43190bdbb6a331e9754bb1d4f8d2865d39d57f19",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C30",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b226d6f64756c65536574223a5b225030222c225031222c225032222c225033222c225034222c225035222c225036222c225037222c225038225d7d"
        },
        "authorizedSourcePinRoot": "4aeb4d586412af58a170d5f96b4a44982490f4ac544b92d2e203cbd9fa986cab"
      }
    },
    {
      "controlId": "C31",
      "role": "BEFORE",
      "root": "3c81e202469028a2638d5fc3d23a3206e8ed04e77fded4404402717b127c9af8",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C31",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22736f7572636548617368223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d"
        },
        "authorizedSourcePinRoot": "626e36873db13728fec491e7518af991677736b758cf893166059ac0cfe717da"
      }
    },
    {
      "controlId": "C31",
      "role": "AFTER",
      "root": "fbf4b961d6ebed5a3a6cc5762bf1e4037b09e755dcff2d77b6ad492d3491f4b2",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C31",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22736f7572636548617368223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d"
        },
        "authorizedSourcePinRoot": "626e36873db13728fec491e7518af991677736b758cf893166059ac0cfe717da"
      }
    },
    {
      "controlId": "C32",
      "role": "BEFORE",
      "root": "b3185da1f4033114594d9d61ecee92aae2b099eec34462ccf371481d430e68bd",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C32",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "00"
        },
        "authorizedSourcePinRoot": "edb12cb44e408a98b7115a93872f988d1e9e6c436481ee20cd093cf542d7191e"
      }
    },
    {
      "controlId": "C32",
      "role": "AFTER",
      "root": "cf2e6848c682d4864f5eb036d21422761cb26e286f050c2419b892625c948a7c",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C32",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "01"
        },
        "authorizedSourcePinRoot": "edb12cb44e408a98b7115a93872f988d1e9e6c436481ee20cd093cf542d7191e"
      }
    },
    {
      "controlId": "C33",
      "role": "BEFORE",
      "root": "662e79958955bb15d28c6e0fccb6b0396478d5cb762735efed4f1dc4e2737c69",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C33",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b226564676573223a7b22453236223a747275657d7d"
        },
        "authorizedSourcePinRoot": "83de3a4feb0c920068837be49840b061a881d1e3130bf1c77adaa897a9cbb7a1"
      }
    },
    {
      "controlId": "C33",
      "role": "AFTER",
      "root": "2b9a42b85c571c17584d52a3272314dc772f7e13dd666aaa3ada6c3933a2978d",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C33",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b226564676573223a7b7d7d"
        },
        "authorizedSourcePinRoot": "83de3a4feb0c920068837be49840b061a881d1e3130bf1c77adaa897a9cbb7a1"
      }
    },
    {
      "controlId": "C34",
      "role": "BEFORE",
      "root": "b77938ab02e3d89236050306d605f9b9a8ebdd523ea74dc403bfd3882f59022b",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C34",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b226564676573223a7b22453236223a7b22646972656374696f6e223a2250302d3e5035227d7d7d"
        },
        "authorizedSourcePinRoot": "38218e4449e1fb50a3e1b52ccae4748415b48d7b590bf96f5d26746d15820322"
      }
    },
    {
      "controlId": "C34",
      "role": "AFTER",
      "root": "9b29a3f945951b56c02b14ed9b6bcfae56bc06bc17db362c13501be54b8e9f92",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C34",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b226564676573223a7b22453236223a7b22646972656374696f6e223a2250352d3e5030227d7d7d"
        },
        "authorizedSourcePinRoot": "38218e4449e1fb50a3e1b52ccae4748415b48d7b590bf96f5d26746d15820322"
      }
    },
    {
      "controlId": "C35",
      "role": "BEFORE",
      "root": "0179ef14466c4d960a323a6a43cb91d77f52a15cf8ffd9b274c5bb634ef9dceb",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C35",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22696d706f727473223a5b7b226b696e64223a22737461746963227d5d7d"
        },
        "authorizedSourcePinRoot": "5d2df637523efa5a5a180adf8ee97401d1e2f71234194ceab11b8ec7d37f7411"
      }
    },
    {
      "controlId": "C35",
      "role": "AFTER",
      "root": "a664e9fad40c8cbed3cb6eaf1d102217f69aa5cb66c0d560bbf77471ffd15448",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C35",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22696d706f727473223a5b7b226b696e64223a2264796e616d6963227d5d7d"
        },
        "authorizedSourcePinRoot": "5d2df637523efa5a5a180adf8ee97401d1e2f71234194ceab11b8ec7d37f7411"
      }
    },
    {
      "controlId": "C36",
      "role": "BEFORE",
      "root": "b49d1c121caaa51b101b1977c68ca09ad7f9218aa76e64cafde03b19b89efe31",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C36",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b2263616c6c73223a5b22662829225d7d"
        },
        "authorizedSourcePinRoot": "32971cb0b1fda3787f3291f7b76b9ba5d24db410ab2982f335a8bf4ccdb29eec"
      }
    },
    {
      "controlId": "C36",
      "role": "AFTER",
      "root": "255f6cc8f639d18a1c8918dbc9cf6130ee1906bacbed4a14e03562dd6fab7d1f",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C36",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b2263616c6c73223a5b226576616c2866282929225d7d"
        },
        "authorizedSourcePinRoot": "32971cb0b1fda3787f3291f7b76b9ba5d24db410ab2982f335a8bf4ccdb29eec"
      }
    },
    {
      "controlId": "C37",
      "role": "BEFORE",
      "root": "4e52ebb691311b76e528693bab71840c6981848c0a4f5c81cae5a7ec1c6752f5",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C37",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b226d656d626572416363657373223a5b226f2e78225d7d"
        },
        "authorizedSourcePinRoot": "748f327fb11214628b4795e20fa893b7acdc0f8997d1e98b741d35d150b7ab36"
      }
    },
    {
      "controlId": "C37",
      "role": "AFTER",
      "root": "ea46342940b318b0f293c85f6d81071c365e79ff0669fa87255c48fd067c89ab",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C37",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b226d656d626572416363657373223a5b225265666c6563742e676574286f2c7829225d7d"
        },
        "authorizedSourcePinRoot": "748f327fb11214628b4795e20fa893b7acdc0f8997d1e98b741d35d150b7ab36"
      }
    },
    {
      "controlId": "C38",
      "role": "BEFORE",
      "root": "06a2cb265aeb4d6cf14a341d33458b8808aac38471177a87376a8bb82af13e2d",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C38",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22646570656e64656e63794772617068223a7b22646570656e64656e63792d30223a226465636c61726564227d7d"
        },
        "authorizedSourcePinRoot": "287a00410c8c395f7e9cf5431317bf2f727e973d466747cbbbf43a7872ca5d68"
      }
    },
    {
      "controlId": "C38",
      "role": "AFTER",
      "root": "c53db28e85c239ac79c883df981e6ab5ee53e4be617c7fc9059975321d2ac952",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C38",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22646570656e64656e63794772617068223a7b22646570656e64656e63792d30223a226f6d6974746564227d7d"
        },
        "authorizedSourcePinRoot": "287a00410c8c395f7e9cf5431317bf2f727e973d466747cbbbf43a7872ca5d68"
      }
    },
    {
      "controlId": "C39",
      "role": "BEFORE",
      "root": "6ce664e57eb94cce236985925cf173a3675b478a83139a6121c41716cc6a78ff",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C39",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b2272756e74696d65223a7b22737562737472617465223a22646972656374227d7d"
        },
        "authorizedSourcePinRoot": "937bdd12f1d1614ca4fe4d0b32b8474d2e27b8c059bfbbf895aff05fc272a480"
      }
    },
    {
      "controlId": "C39",
      "role": "AFTER",
      "root": "c4d7a124504896b843f6babc2735639504a8e67f870de0142fb2186087ca3383",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C39",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b2272756e74696d65223a7b22737562737472617465223a226576656e74546170652b70726f6a656374696f6e227d7d"
        },
        "authorizedSourcePinRoot": "937bdd12f1d1614ca4fe4d0b32b8474d2e27b8c059bfbbf895aff05fc272a480"
      }
    },
    {
      "controlId": "C40",
      "role": "BEFORE",
      "root": "38d959f008bba3260a9a3856357f58def774dc2925dfa4f383b482e23bd17c4b",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C40",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b226d6f64756c6573223a7b225035223a7b22636861726765644c6f63223a38357d7d7d"
        },
        "authorizedSourcePinRoot": "27d1089d29841e1e656539735aaf88abafc0b8bf3e752587474904ecef4608b5"
      }
    },
    {
      "controlId": "C40",
      "role": "AFTER",
      "root": "b08861ef7f6784a6371a7dcbdf6c1292b0a9bab4fc2d1198ca8346388a440bb8",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C40",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b226d6f64756c6573223a7b225035223a7b22636861726765644c6f63223a38367d7d7d"
        },
        "authorizedSourcePinRoot": "27d1089d29841e1e656539735aaf88abafc0b8bf3e752587474904ecef4608b5"
      }
    },
    {
      "controlId": "C41",
      "role": "BEFORE",
      "root": "630752a4f3165b37037135b8bb8bb303ff81cdc7b8bbf1943d609d60db672b78",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C41",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22746f74616c436861726765644c6f63223a3835307d"
        },
        "authorizedSourcePinRoot": "933c905187e36f85a150aa09b72247f484d50e8cc2d68f8d6af21350f2b66083"
      }
    },
    {
      "controlId": "C41",
      "role": "AFTER",
      "root": "e4ac43160c28bd111dfad794866926ad96b6b4b6b1f36cfcd8346ca344dadaf4",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C41",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22746f74616c436861726765644c6f63223a3835317d"
        },
        "authorizedSourcePinRoot": "933c905187e36f85a150aa09b72247f484d50e8cc2d68f8d6af21350f2b66083"
      }
    },
    {
      "controlId": "C42",
      "role": "BEFORE",
      "root": "92c59023251f0de634cdb4a5a355fff2dff123792f76106bd42cb49867471c83",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C42",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22617374546f6f6c223a7b22736861323536223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d"
        },
        "authorizedSourcePinRoot": "91d6f24b654bde62db6a8932468dea665d3d6d67bd23d77e28208644bf818045"
      }
    },
    {
      "controlId": "C42",
      "role": "AFTER",
      "root": "ffbc359dd9bc74ea497dcc31f8cbe177cae560bc23909f2ca5ac5d04da320e1b",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C42",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22617374546f6f6c223a7b22736861323536223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d"
        },
        "authorizedSourcePinRoot": "91d6f24b654bde62db6a8932468dea665d3d6d67bd23d77e28208644bf818045"
      }
    },
    {
      "controlId": "C43",
      "role": "BEFORE",
      "root": "6726939409225d0e2c6906c09f1ac3d17451272938fbda877df93e154108295c",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C43",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22636c61696d223a7b22736f757263654a6f696e223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d"
        },
        "authorizedSourcePinRoot": "cafd492efee9e86e5537bdd752a73ff2377f510be3999b2e97ea173c01f1d85a"
      }
    },
    {
      "controlId": "C43",
      "role": "AFTER",
      "root": "5db7746a83e0b7d905c3c6f2a8cced8eeb502ce0c61759799be292f8c35880f1",
      "instance": {
        "schema": "SourceVerifierInputV8",
        "controlId": "C43",
        "payload": {
          "encoding": "UTF8",
          "bytesHex": "7b22636c61696d223a7b22736f757263654a6f696e223a2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030227d7d"
        },
        "authorizedSourcePinRoot": "cafd492efee9e86e5537bdd752a73ff2377f510be3999b2e97ea173c01f1d85a"
      }
    }
  ],
  "sourceModules": [
    {
      "controlId": "C01",
      "path": "proposed/P0-c01.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433031223b0a6578706f727420636f6e737420756e69717565436f64653d224445434c41524154494f4e5f484153485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226465636c61726174696f6e536861323536225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224445434c41524154494f4e5f484153485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226465636c61726174696f6e536861323536225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
      "sha256": "d35aad11397414bf59bd4bf433fdee384837274753bf62f06e000c0ed1218fad"
    },
    {
      "controlId": "C02",
      "path": "proposed/P0-c02.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433032223b0a6578706f727420636f6e737420756e69717565436f64653d224c45444745525f524f4f545f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226c6564676572526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224c45444745525f524f4f545f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226c6564676572526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
      "sha256": "81753a3039533a96bc17d4a72b7e919588b757770404f19fc2cffdaa28ceaed7"
    },
    {
      "controlId": "C03",
      "path": "proposed/P0-c03.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433033223b0a6578706f727420636f6e737420756e69717565436f64653d2256455253494f4e5f504152454e545f494e56414c4944223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2276657273696f6e73225d5b315d5b22706172656e7456657273696f6e225d2c31293f2256455253494f4e5f504152454e545f494e56414c4944223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2276657273696f6e73225d5b315d5b22706172656e7456657273696f6e225d3d313b72657475726e206f75747d3b0a",
      "sha256": "38f3540a7f1888f0bda1fe9b079fc95cd6a003bf979f9b2f2618dcd47cb70848"
    },
    {
      "controlId": "C04",
      "path": "proposed/P0-c04.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433034223b0a6578706f727420636f6e737420756e69717565436f64653d224546464543545f4b45595f494e56414c4944223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226566666563744964656e746974696573225d5b305d5b226f7264696e616c225d2c31293f224546464543545f4b45595f494e56414c4944223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226566666563744964656e746974696573225d5b305d5b226f7264696e616c225d3d313b72657475726e206f75747d3b0a",
      "sha256": "f2a2f0f08fdb4ffd2e77b1bdbf97d378084496ccc401e7db7fce6e98e6f7a39d"
    },
    {
      "controlId": "C05",
      "path": "proposed/P0-c05.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433035223b0a6578706f727420636f6e737420756e69717565436f64653d224558504552494d454e545f53454c454354494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22726f774f7264696e616c225d2c31293f224558504552494d454e545f53454c454354494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22726f774f7264696e616c225d3d313b72657475726e206f75747d3b0a",
      "sha256": "8426939ebcd3b1e1d8f14894173a188238ae05e7533ab6759b897631d64d6b91"
    },
    {
      "controlId": "C06",
      "path": "proposed/P2-c06.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433036223b0a6578706f727420636f6e737420756e69717565436f64653d22454449545f5245504c41595f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226564697473225d5b305d5b2273746172745574663136225d2c32293f22454449545f5245504c41595f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226564697473225d5b305d5b2273746172745574663136225d3d323b72657475726e206f75747d3b0a",
      "sha256": "52e0c9ef3396d2592d0d4b194f5e59df4bb798ff2ee0e474d1c04fb470f5a9d6"
    },
    {
      "controlId": "C07",
      "path": "proposed/P3-c07.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433037223b0a6578706f727420636f6e737420756e69717565436f64653d225441524745545f44455054485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226d61784465707468225d2c35293f225441524745545f44455054485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226d61784465707468225d3d353b72657475726e206f75747d3b0a",
      "sha256": "d82c51a880ae0638a2bca3f166c7026804c1781b2164fe8c6fd9dd7aede191c3"
    },
    {
      "controlId": "C08",
      "path": "proposed/P3-c08.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433038223b0a6578706f727420636f6e737420756e69717565436f64653d225441524745545f50524f445543545f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226f6666736574225d2c32293f225441524745545f50524f445543545f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226f6666736574225d3d323b72657475726e206f75747d3b0a",
      "sha256": "6220af0be5671a70c15641801c2d299334690c27d064b7d92196d848253211f2"
    },
    {
      "controlId": "C09",
      "path": "proposed/P4-c09.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433039223b0a6578706f727420636f6e737420756e69717565436f64653d224546464543545f4f4343555252454e43455f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226576656e7473225d5b305d5b226f6363757272656e6365225d2c31293f224546464543545f4f4343555252454e43455f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226576656e7473225d5b305d5b226f6363757272656e6365225d3d313b72657475726e206f75747d3b0a",
      "sha256": "835dd51741428bd193c1bb70bc9f0c8d9c38ca2b84b05aa045121895a4a9db5b"
    },
    {
      "controlId": "C10",
      "path": "proposed/P5-c10.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433130223b0a6578706f727420636f6e737420756e69717565436f64653d2252554e5f524f4c455f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22726f6c65225d2c22636f6e74726f6c22293f2252554e5f524f4c455f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22726f6c65225d3d22636f6e74726f6c223b72657475726e206f75747d3b0a",
      "sha256": "dc49158fc549fcf2ae031c84d359098c5a173e65e2cad1353ae520964242dce7"
    },
    {
      "controlId": "C11",
      "path": "proposed/P5-c11.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433131223b0a6578706f727420636f6e737420756e69717565436f64653d22494e5055545f415554484f524954595f50494e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22696e7075744d656d62657273225d5b305d5b226279746573225d2c32293f22494e5055545f415554484f524954595f50494e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22696e7075744d656d62657273225d5b305d5b226279746573225d3d323b72657475726e206f75747d3b0a",
      "sha256": "0e1ae076f12b8b9c14a6ac66ba50cf4db2e4feddaaeb7efc3f4d57da2975c9e5"
    },
    {
      "controlId": "C12",
      "path": "proposed/P5-c12.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433132223b0a6578706f727420636f6e737420756e69717565436f64653d22434f4d4d414e445f454e56454c4f50455f434150545552455f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2261637475616c4172677630225d2c222f6f70742f6e6f64652d6d7574616e7422293f22434f4d4d414e445f454e56454c4f50455f434150545552455f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2261637475616c4172677630225d3d222f6f70742f6e6f64652d6d7574616e74223b72657475726e206f75747d3b0a",
      "sha256": "e4586376aa3735a6bb9fad86537cd66b943d3a61c10879dfb98dbd93f900e345"
    },
    {
      "controlId": "C13",
      "path": "proposed/P5-c13.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433133223b0a6578706f727420636f6e737420756e69717565436f64653d2252554e5f4348524f4e4f4c4f47595f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227365616c225d5b226368726f6e6f6c6f67794f7264696e616c225d2c33293f2252554e5f4348524f4e4f4c4f47595f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227365616c225d5b226368726f6e6f6c6f67794f7264696e616c225d3d333b72657475726e206f75747d3b0a",
      "sha256": "27ef59c7c67be6e633244d983aad62e8085c825af9113ac05550179aca30fe10"
    },
    {
      "controlId": "C14",
      "path": "proposed/P5-c14.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433134223b0a6578706f727420636f6e737420756e69717565436f64653d224341504142494c4954595f49534f4c4154494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226361706162696c69747953757266616365496473225d2c5b226e6574776f726b3a616e79225d293f224341504142494c4954595f49534f4c4154494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226361706162696c69747953757266616365496473225d3d5b226e6574776f726b3a616e79225d3b72657475726e206f75747d3b0a",
      "sha256": "da0a6f086afab42a3df91e6eccc3afee8246c5b10cbb34f1f5d8a8a17ed71876"
    },
    {
      "controlId": "C15",
      "path": "proposed/P5-c15.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433135223b0a6578706f727420636f6e737420756e69717565436f64653d22494e564f434154494f4e5f415554484f524954595f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22696e766f636174696f6e417574686f72697479225d5b2263616c6c6261636b436c6f73757265526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f22494e564f434154494f4e5f415554484f524954595f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22696e766f636174696f6e417574686f72697479225d5b2263616c6c6261636b436c6f73757265526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
      "sha256": "175e6d45ba3d53c2d739c5f1869889f8979f16305d7140c287df1d6c6d4c5da3"
    },
    {
      "controlId": "C16",
      "path": "proposed/P5-c16.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433136223b0a6578706f727420636f6e737420756e69717565436f64653d2246524553484e4553535f49534f4c4154494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2266726573686e6573734166746572225d5b2266696c6544657363726970746f7273225d2c5b302c312c322c39395d293f2246524553484e4553535f49534f4c4154494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2266726573686e6573734166746572225d5b2266696c6544657363726970746f7273225d3d5b302c312c322c39395d3b72657475726e206f75747d3b0a",
      "sha256": "73e8a94d4460049d68758f852fdb1df6c4a8d9d00f03751e0327ce00630af6f2"
    },
    {
      "controlId": "C17",
      "path": "proposed/P5-c17.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433137223b0a6578706f727420636f6e737420756e69717565436f64653d224f42534552564154494f4e5f4d454d424552534849505f524f4f545f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2264657363726970746f7273225d5b2270726f64756374225d2c756e646566696e6564293f224f42534552564154494f4e5f4d454d424552534849505f524f4f545f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b64656c657465206f75745b2264657363726970746f7273225d5b2270726f64756374225d3b72657475726e206f75747d3b0a",
      "sha256": "fc9e5df65b1696b047a18232828b9a506492ec99be410dc303439bb682973e45"
    },
    {
      "controlId": "C18",
      "path": "proposed/P5-c18.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433138223b0a6578706f727420636f6e737420756e69717565436f64653d224f42534552564154494f4e5f5345414c5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226f62736572766174696f6e5365616c526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224f42534552564154494f4e5f5345414c5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226f62736572766174696f6e5365616c526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
      "sha256": "a799e7c44eb01c4d3a0f38ba2ea6f7f7c534aa2a2f7166a023543f0ad0be2998"
    },
    {
      "controlId": "C19",
      "path": "proposed/P5-c19.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433139223b0a6578706f727420636f6e737420756e69717565436f64653d224f42534552564154494f4e5f41444d495353494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226d657373616765225d5b22726f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224f42534552564154494f4e5f41444d495353494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226d657373616765225d5b22726f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
      "sha256": "7c393e90996b525952726027e729a9161df7e584becd00f44d2d5e1c7bf83f46"
    },
    {
      "controlId": "C20",
      "path": "proposed/P1-c20.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433230223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4455504c49434154455f4b4559223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323631323233613331326332323631323233613332376422293f2243414e4f4e4943414c5f4455504c49434154455f4b4559223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323236313232336133313263323236313232336133323764223b72657475726e206f75747d3b0a",
      "sha256": "ac281fc3f610c5f7e4ce4448a82b34c8e33de7ee2d06b6809e36d955bb5030e4"
    },
    {
      "controlId": "C21",
      "path": "proposed/P1-c21.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433231223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4e45535445445f4455504c49434154455f4b4559223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323738323233613762323236313232336133313263323236313232336133323764376422293f2243414e4f4e4943414c5f4e45535445445f4455504c49434154455f4b4559223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323237383232336137623232363132323361333132633232363132323361333237643764223b72657475726e206f75747d3b0a",
      "sha256": "e1508289ccbe3c06790536c15389fe40421526ef2db63dc941f07f114865d5b9"
    },
    {
      "controlId": "C22",
      "path": "proposed/P1-c22.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433232223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f455343415045445f534c415348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22323235633266323222293f2243414e4f4e4943414c5f455343415045445f534c415348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223232356332663232223b72657475726e206f75747d3b0a",
      "sha256": "0c92f33f01edb24017f3277ecdc3ff9464b3586a6b22e1fa21d19ce0a2580df0"
    },
    {
      "controlId": "C23",
      "path": "proposed/P1-c23.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433233223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4845585f43415345223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223232356337353330333034363436323222293f2243414e4f4e4943414c5f4845585f43415345223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232323563373533303330343634363232223b72657475726e206f75747d3b0a",
      "sha256": "509da4ec02d13e23b5b1497bdc0dae56527f0402ac8a5981af014e6011c0b332"
    },
    {
      "controlId": "C24",
      "path": "proposed/P1-c24.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433234223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f434f4e54524f4c5f464f524d223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223232356337353330333033303631323222293f2243414e4f4e4943414c5f434f4e54524f4c5f464f524d223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232323563373533303330333036313232223b72657475726e206f75747d3b0a",
      "sha256": "2478317d6e3a289589061580380eb04bf69a7c22b713d8f7f905b49cdcaea1bb"
    },
    {
      "controlId": "C25",
      "path": "proposed/P1-c25.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433235223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4b45595f4f52444552223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323632323233613332326332323631323233613331376422293f2243414e4f4e4943414c5f4b45595f4f52444552223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323236323232336133323263323236313232336133313764223b72657475726e206f75747d3b0a",
      "sha256": "9310eb1403b2c5e71bc645d226222a18e1f0beb9140dbd50f8371f9f0257bb41"
    },
    {
      "controlId": "C26",
      "path": "proposed/P1-c26.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433236223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f494e54454745525f464f524d223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223330333022293f2243414e4f4e4943414c5f494e54454745525f464f524d223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2233303330223b72657475726e206f75747d3b0a",
      "sha256": "efa5215cb8702a161e4ae0d6e719f539d16cae7837750580597945d1982cab4b"
    },
    {
      "controlId": "C27",
      "path": "proposed/P1-c27.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433237223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f555446385f5343414c4152223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c2265646130383022293f2243414e4f4e4943414c5f555446385f5343414c4152223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d22656461303830223b72657475726e206f75747d3b0a",
      "sha256": "62b0014ed5234d4e052dd8edcecadb1c4370c94d98e87379caf9e97afc3596eb"
    },
    {
      "controlId": "C28",
      "path": "proposed/P1-c28.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433238223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f57484954455350414345223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223230376232323631323233613331376422293f2243414e4f4e4943414c5f57484954455350414345223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232303762323236313232336133313764223b72657475726e206f75747d3b0a",
      "sha256": "e5c80af00693bd8c2faf9092bb2fea7a05e43c45c2ee50446304e01f8da681b1"
    },
    {
      "controlId": "C29",
      "path": "proposed/P1-c29.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433239223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f554e4b4e4f574e5f544147223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323234323233613232373536653662366536663737366532323263323236313734323233613330376422293f2243414e4f4e4943414c5f554e4b4e4f574e5f544147223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323232343232336132323735366536623665366637373665323232633232363137343232336133303764223b72657475726e206f75747d3b0a",
      "sha256": "4a562d6206d88cd2beafa43f9aceee7e9bd936630e3f4dc46c29e889223c9a41"
    },
    {
      "controlId": "C30",
      "path": "proposed/P7-c30.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433330223b0a6578706f727420636f6e737420756e69717565436f64653d22534f555243455f4d4f44554c455f534554223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232366436663634373536633635353336353734323233613562323235303330323232633232353033313232326332323530333232323263323235303333323232633232353033343232326332323530333532323263323235303336323232633232353033373232326332323530333832323564376422293f22534f555243455f4d4f44554c455f534554223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323664366636343735366336353533363537343232336135623232353033303232326332323530333132323263323235303332323232633232353033333232326332323530333432323263323235303335323232633232353033363232326332323530333732323263323235303338323235643764223b72657475726e206f75747d3b0a",
      "sha256": "48f4a79aa8169dd383cf023044b0bd5514347004b4d42cd606263cb7d7e34607"
    },
    {
      "controlId": "C31",
      "path": "proposed/P7-c31.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433331223b0a6578706f727420636f6e737420756e69717565436f64653d22534f555243455f484153485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232373336663735373236333635343836313733363832323361323233313330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303232376422293f22534f555243455f484153485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323733366637353732363336353438363137333638323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764223b72657475726e206f75747d3b0a",
      "sha256": "035075b191e9a7ca5c4b697754bd4d3b7a3fcc090b863c762960d57031f6a377"
    },
    {
      "controlId": "C32",
      "path": "proposed/P7-c32.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433332223b0a6578706f727420636f6e737420756e69717565436f64653d2250524f53455f484153485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22303122293f2250524f53455f484153485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223031223b72657475726e206f75747d3b0a",
      "sha256": "2f7cdbcdf0db490bc75916281278124629a866b9acc18ec712a05f7882bf8f6f"
    },
    {
      "controlId": "C33",
      "path": "proposed/P7-c33.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433333223b0a6578706f727420636f6e737420756e69717565436f64653d22454447455f4d495353494e47223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232363536343637363537333232336137623764376422293f22454447455f4d495353494e47223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323635363436373635373332323361376237643764223b72657475726e206f75747d3b0a",
      "sha256": "82822ca953ce06ffcfac3acd49c074c87bd687b7a6bf310d532537707c144b64"
    },
    {
      "controlId": "C34",
      "path": "proposed/P7-c34.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433334223b0a6578706f727420636f6e737420756e69717565436f64653d22454447455f52455645525345223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323635363436373635373332323361376232323435333233363232336137623232363436393732363536333734363936663665323233613232353033353264336535303330323237643764376422293f22454447455f52455645525345223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236353634363736353733323233613762323234353332333632323361376232323634363937323635363337343639366636653232336132323530333532643365353033303232376437643764223b72657475726e206f75747d3b0a",
      "sha256": "2649622e1601cd4a5ea9343599898a20ccaa7e853202a21503e86a6e1a3c0c78"
    },
    {
      "controlId": "C35",
      "path": "proposed/P7-c35.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433335223b0a6578706f727420636f6e737420756e69717565436f64653d2244594e414d49435f494d504f5254223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236393664373036663732373437333232336135623762323236623639366536343232336132323634373936653631366436393633323237643564376422293f2244594e414d49435f494d504f5254223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363936643730366637323734373332323361356237623232366236393665363432323361323236343739366536313664363936333232376435643764223b72657475726e206f75747d3b0a",
      "sha256": "6ff39653b24d3dd6c7eb2c82aff7447a1da62f59e72851dba0f7453cbf3e19f4"
    },
    {
      "controlId": "C36",
      "path": "proposed/P7-c36.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433336223b0a6578706f727420636f6e737420756e69717565436f64653d2244594e414d49435f434f4445223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236333631366336633733323233613562323236353736363136633238363632383239323932323564376422293f2244594e414d49435f434f4445223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363336313663366337333232336135623232363537363631366332383636323832393239323235643764223b72657475726e206f75747d3b0a",
      "sha256": "283af2018acd1dfbb14760cdf5212b8767796b2fb08b8d87e22005c5b72d70b6"
    },
    {
      "controlId": "C37",
      "path": "proposed/P7-c37.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433337223b0a6578706f727420636f6e737420756e69717565436f64653d225245464c454354494f4e5f45444745223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323664363536643632363537323431363336333635373337333232336135623232353236353636366336353633373432653637363537343238366632633738323932323564376422293f225245464c454354494f4e5f45444745223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236643635366436323635373234313633363336353733373332323361356232323532363536363663363536333734326536373635373432383666326337383239323235643764223b72657475726e206f75747d3b0a",
      "sha256": "f1872f9663d4d9afbb0fe3c1c838fc4f88a5d54888150f4f8edfe462732218ef"
    },
    {
      "controlId": "C38",
      "path": "proposed/P7-c38.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433338223b0a6578706f727420636f6e737420756e69717565436f64653d22444550454e44454e43595f48494444454e223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323634363537303635366536343635366536333739343737323631373036383232336137623232363436353730363536653634363536653633373932643330323233613232366636643639373437343635363432323764376422293f22444550454e44454e43595f48494444454e223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236343635373036353665363436353665363337393437373236313730363832323361376232323634363537303635366536343635366536333739326433303232336132323666366436393734373436353634323237643764223b72657475726e206f75747d3b0a",
      "sha256": "b0fb39be1e485ac3d89873a97752a57e12e132e09e849e2574a3d4a631fc8330"
    },
    {
      "controlId": "C39",
      "path": "proposed/P7-c39.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433339223b0a6578706f727420636f6e737420756e69717565436f64653d22464f5242494444454e5f535542535452415445223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232373237353665373436393664363532323361376232323733373536323733373437323631373436353232336132323635373636353665373435343631373036353262373037323666366136353633373436393666366532323764376422293f22464f5242494444454e5f535542535452415445223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323732373536653734363936643635323233613762323237333735363237333734373236313734363532323361323236353736363536653734353436313730363532623730373236663661363536333734363936663665323237643764223b72657475726e206f75747d3b0a",
      "sha256": "ea10691634b124d66c5ff4a1c912310a969f1c5757745eab8a96f46b5176edd1"
    },
    {
      "controlId": "C40",
      "path": "proposed/P7-c40.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433430223b0a6578706f727420636f6e737420756e69717565436f64653d224d4f44554c455f4c4f435f4558434545444544223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232366436663634373536633635373332323361376232323530333532323361376232323633363836313732363736353634346336663633323233613338333637643764376422293f224d4f44554c455f4c4f435f4558434545444544223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323664366636343735366336353733323233613762323235303335323233613762323236333638363137323637363536343463366636333232336133383336376437643764223b72657475726e206f75747d3b0a",
      "sha256": "80b9d0f97fbbfef1fa2c7a42c0db2a04092284de7c8f0520b74dc99b15203312"
    },
    {
      "controlId": "C41",
      "path": "proposed/P7-c41.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433431223b0a6578706f727420636f6e737420756e69717565436f64653d22544f54414c5f4c4f435f4558434545444544223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323237343666373436313663343336383631373236373635363434633666363332323361333833353331376422293f22544f54414c5f4c4f435f4558434545444544223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232373436663734363136633433363836313732363736353634346336663633323233613338333533313764223b72657475726e206f75747d3b0a",
      "sha256": "4dd3d2f36f1dcc92ed8a74126239375418a56baa375697baa74f40c861a2ff3c"
    },
    {
      "controlId": "C42",
      "path": "proposed/P7-c42.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433432223b0a6578706f727420636f6e737420756e69717565436f64653d224153545f544f4f4c5f50494e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236313733373435343666366636633232336137623232373336383631333233353336323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764376422293f224153545f544f4f4c5f50494e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363137333734353436663666366332323361376232323733363836313332333533363232336132323331333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330323237643764223b72657475726e206f75747d3b0a",
      "sha256": "c52118df8e30a5b22df5867a83a91c9f4316ccd471ac0f174d85898e37a5c238"
    },
    {
      "controlId": "C43",
      "path": "proposed/P7-c43.mjs",
      "bytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433433223b0a6578706f727420636f6e737420756e69717565436f64653d22434c41494d5f534f555243455f4452494654223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323633366336313639366432323361376232323733366637353732363336353461366636393665323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764376422293f22434c41494d5f534f555243455f4452494654223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236333663363136393664323233613762323237333666373537323633363534613666363936653232336132323331333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330323237643764223b72657475726e206f75747d3b0a",
      "sha256": "2099ac2a18bc90428bbbd45f2e54633aa83d56321af5d628b466759c52fed56f"
    }
  ],
  "leafRegistry": [
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P5",
      "ownerModulePath": "proposed/P5-c12.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433132223b0a6578706f727420636f6e737420756e69717565436f64653d22434f4d4d414e445f454e56454c4f50455f434150545552455f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2261637475616c4172677630225d2c222f6f70742f6e6f64652d6d7574616e7422293f22434f4d4d414e445f454e56454c4f50455f434150545552455f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2261637475616c4172677630225d3d222f6f70742f6e6f64652d6d7574616e74223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "e4586376aa3735a6bb9fad86537cd66b943d3a61c10879dfb98dbd93f900e345",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C12",
      "predicateId": "predicate_C12",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2261637475616c4172677630225d2c222f6f70742f6e6f64652d6d7574616e7422293f22434f4d4d414e445f454e56454c4f50455f434150545552455f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "6627940afc39e0045dc9b6b6343d8d82e99611ce5deedb5fa43f5b7a32c10e10",
      "injectorId": "inject_C12",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2261637475616c4172677630225d3d222f6f70742f6e6f64652d6d7574616e74223b72657475726e206f75747d",
      "injectorBodySha256": "f01513e6da10e655ba109c5c04eb4a5d48e3b44bd85afc9e1c0f8b7db19f6213",
      "leafId": "validateCommandEnvelopeCapture",
      "leafFunctionIdentityRoot": "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c42.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433432223b0a6578706f727420636f6e737420756e69717565436f64653d224153545f544f4f4c5f50494e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236313733373435343666366636633232336137623232373336383631333233353336323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764376422293f224153545f544f4f4c5f50494e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363137333734353436663666366332323361376232323733363836313332333533363232336132323331333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330323237643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "c52118df8e30a5b22df5867a83a91c9f4316ccd471ac0f174d85898e37a5c238",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C42",
      "predicateId": "predicate_C42",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236313733373435343666366636633232336137623232373336383631333233353336323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764376422293f224153545f544f4f4c5f50494e5f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "d51d3e97256120f48bbbd2c2851c0cfc82df1847a5730aa261ec2a5f7c27af65",
      "injectorId": "inject_C42",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363137333734353436663666366332323361376232323733363836313332333533363232336132323331333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330323237643764223b72657475726e206f75747d",
      "injectorBodySha256": "329cbea9d09630f85d82e4cb574a358b0869f2b024d618c554cd364a11a8c1d8",
      "leafId": "leafAstToolPin",
      "leafFunctionIdentityRoot": "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c33.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433333223b0a6578706f727420636f6e737420756e69717565436f64653d22454447455f4d495353494e47223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232363536343637363537333232336137623764376422293f22454447455f4d495353494e47223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323635363436373635373332323361376237643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "82822ca953ce06ffcfac3acd49c074c87bd687b7a6bf310d532537707c144b64",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C33",
      "predicateId": "predicate_C33",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232363536343637363537333232336137623764376422293f22454447455f4d495353494e47223a6e756c6c7d",
      "predicateBodySha256": "2ae47868a060d24d3cec88c3124728556bb75fb4376ce01a6289e7f758223760",
      "injectorId": "inject_C33",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323635363436373635373332323361376237643764223b72657475726e206f75747d",
      "injectorBodySha256": "e4a00692c2bbaeb55d41b0fa76b08f85be8b0007546f1af2459e32dc8450fa00",
      "leafId": "leafEdgeGraph",
      "leafFunctionIdentityRoot": "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P1",
      "ownerModulePath": "proposed/P1-c21.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433231223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4e45535445445f4455504c49434154455f4b4559223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323738323233613762323236313232336133313263323236313232336133323764376422293f2243414e4f4e4943414c5f4e45535445445f4455504c49434154455f4b4559223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323237383232336137623232363132323361333132633232363132323361333237643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "e1508289ccbe3c06790536c15389fe40421526ef2db63dc941f07f114865d5b9",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C21",
      "predicateId": "predicate_C21",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323738323233613762323236313232336133313263323236313232336133323764376422293f2243414e4f4e4943414c5f4e45535445445f4455504c49434154455f4b4559223a6e756c6c7d",
      "predicateBodySha256": "f5bd596059770350a7ec40669367ccfe75e6b55722ad73f9a825c535243c93b9",
      "injectorId": "inject_C21",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323237383232336137623232363132323361333132633232363132323361333237643764223b72657475726e206f75747d",
      "injectorBodySha256": "3932858923e69044af0a5d367730fb52fbdaea994241ef165a339accea0b022f",
      "leafId": "leafNestedDuplicateKey",
      "leafFunctionIdentityRoot": "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P2",
      "ownerModulePath": "proposed/P2-c06.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433036223b0a6578706f727420636f6e737420756e69717565436f64653d22454449545f5245504c41595f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226564697473225d5b305d5b2273746172745574663136225d2c32293f22454449545f5245504c41595f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226564697473225d5b305d5b2273746172745574663136225d3d323b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "52e0c9ef3396d2592d0d4b194f5e59df4bb798ff2ee0e474d1c04fb470f5a9d6",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C06",
      "predicateId": "predicate_C06",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226564697473225d5b305d5b2273746172745574663136225d2c32293f22454449545f5245504c41595f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "896233ed81e964975bf9615ecaf2c400eaca41113d0860ddcb5e522b69f5e183",
      "injectorId": "inject_C06",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226564697473225d5b305d5b2273746172745574663136225d3d323b72657475726e206f75747d",
      "injectorBodySha256": "acb46cc5ddad079c8a2ccc942f91ed76053a78e1860cf83f13e8ed7145c03e5f",
      "leafId": "validateEditReplay",
      "leafFunctionIdentityRoot": "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P4",
      "ownerModulePath": "proposed/P4-c09.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433039223b0a6578706f727420636f6e737420756e69717565436f64653d224546464543545f4f4343555252454e43455f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226576656e7473225d5b305d5b226f6363757272656e6365225d2c31293f224546464543545f4f4343555252454e43455f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226576656e7473225d5b305d5b226f6363757272656e6365225d3d313b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "835dd51741428bd193c1bb70bc9f0c8d9c38ca2b84b05aa045121895a4a9db5b",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C09",
      "predicateId": "predicate_C09",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226576656e7473225d5b305d5b226f6363757272656e6365225d2c31293f224546464543545f4f4343555252454e43455f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "b452d66a2e61d9b5553648d048043b4a7ea17907a40989cc6eaf7f2ce55687a3",
      "injectorId": "inject_C09",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226576656e7473225d5b305d5b226f6363757272656e6365225d3d313b72657475726e206f75747d",
      "injectorBodySha256": "b778501093c3c50fe83782964eb811e7e7948b626a170d071fa91b693c2e1aee",
      "leafId": "validateEffectOccurrence",
      "leafFunctionIdentityRoot": "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P1",
      "ownerModulePath": "proposed/P1-c27.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433237223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f555446385f5343414c4152223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c2265646130383022293f2243414e4f4e4943414c5f555446385f5343414c4152223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d22656461303830223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "62b0014ed5234d4e052dd8edcecadb1c4370c94d98e87379caf9e97afc3596eb",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C27",
      "predicateId": "predicate_C27",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c2265646130383022293f2243414e4f4e4943414c5f555446385f5343414c4152223a6e756c6c7d",
      "predicateBodySha256": "d53b662eed03adba82b92007575dd4ea151e4903637a2aeb733f8952616f5a20",
      "injectorId": "inject_C27",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d22656461303830223b72657475726e206f75747d",
      "injectorBodySha256": "7da42aa8c4a79677c4d93c021d91cd83b2fbd72730f6ea8b9614eaeee25420cb",
      "leafId": "leafUtf8Scalar",
      "leafFunctionIdentityRoot": "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P1",
      "ownerModulePath": "proposed/P1-c25.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433235223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4b45595f4f52444552223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323632323233613332326332323631323233613331376422293f2243414e4f4e4943414c5f4b45595f4f52444552223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323236323232336133323263323236313232336133313764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "9310eb1403b2c5e71bc645d226222a18e1f0beb9140dbd50f8371f9f0257bb41",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C25",
      "predicateId": "predicate_C25",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323632323233613332326332323631323233613331376422293f2243414e4f4e4943414c5f4b45595f4f52444552223a6e756c6c7d",
      "predicateBodySha256": "485312420ab989adb6253cfebb21fcf8e94318e700a23872162269a3ba072550",
      "injectorId": "inject_C25",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323236323232336133323263323236313232336133313764223b72657475726e206f75747d",
      "injectorBodySha256": "f4912c515b7e77a431540cd0a5054b2f07ee94a00ba3c33a053c58cf6e91705a",
      "leafId": "leafKeyOrder",
      "leafFunctionIdentityRoot": "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c37.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433337223b0a6578706f727420636f6e737420756e69717565436f64653d225245464c454354494f4e5f45444745223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323664363536643632363537323431363336333635373337333232336135623232353236353636366336353633373432653637363537343238366632633738323932323564376422293f225245464c454354494f4e5f45444745223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236643635366436323635373234313633363336353733373332323361356232323532363536363663363536333734326536373635373432383666326337383239323235643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "f1872f9663d4d9afbb0fe3c1c838fc4f88a5d54888150f4f8edfe462732218ef",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C37",
      "predicateId": "predicate_C37",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323664363536643632363537323431363336333635373337333232336135623232353236353636366336353633373432653637363537343238366632633738323932323564376422293f225245464c454354494f4e5f45444745223a6e756c6c7d",
      "predicateBodySha256": "6a6f91dcc7cb550e74d707cfcb520ba98afff3a96d887d26b8dab55db7d8a726",
      "injectorId": "inject_C37",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236643635366436323635373234313633363336353733373332323361356232323532363536363663363536333734326536373635373432383666326337383239323235643764223b72657475726e206f75747d",
      "injectorBodySha256": "83bfcabe6710ffbd042ec265d20728c8c240ffbade5d3c38269977d70f90780b",
      "leafId": "leafReflection",
      "leafFunctionIdentityRoot": "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P0",
      "ownerModulePath": "proposed/P0-c05.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433035223b0a6578706f727420636f6e737420756e69717565436f64653d224558504552494d454e545f53454c454354494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22726f774f7264696e616c225d2c31293f224558504552494d454e545f53454c454354494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22726f774f7264696e616c225d3d313b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "8426939ebcd3b1e1d8f14894173a188238ae05e7533ab6759b897631d64d6b91",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C05",
      "predicateId": "predicate_C05",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22726f774f7264696e616c225d2c31293f224558504552494d454e545f53454c454354494f4e5f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "8b47bbf09134a2c32262d76df7f78f5095921a135ac17f37a4930b014cd15074",
      "injectorId": "inject_C05",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22726f774f7264696e616c225d3d313b72657475726e206f75747d",
      "injectorBodySha256": "f16ab9daa29b5534713be0212fb60f4cb1d5e8bec5573282466638e260867f75",
      "leafId": "validateExperimentSelection",
      "leafFunctionIdentityRoot": "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P3",
      "ownerModulePath": "proposed/P3-c08.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433038223b0a6578706f727420636f6e737420756e69717565436f64653d225441524745545f50524f445543545f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226f6666736574225d2c32293f225441524745545f50524f445543545f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226f6666736574225d3d323b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "6220af0be5671a70c15641801c2d299334690c27d064b7d92196d848253211f2",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C08",
      "predicateId": "predicate_C08",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226f6666736574225d2c32293f225441524745545f50524f445543545f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "7d930da488cd66097cc7c131aa31c9079c3d76ff9b3e0b791e59f682e06c2fb7",
      "injectorId": "inject_C08",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226f6666736574225d3d323b72657475726e206f75747d",
      "injectorBodySha256": "46f598575280022100ba85c93f134e76e6067fc3dc9d841c26d618d411feefc7",
      "leafId": "validateTargetProduct",
      "leafFunctionIdentityRoot": "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P1",
      "ownerModulePath": "proposed/P1-c20.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433230223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4455504c49434154455f4b4559223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323631323233613331326332323631323233613332376422293f2243414e4f4e4943414c5f4455504c49434154455f4b4559223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323236313232336133313263323236313232336133323764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "ac281fc3f610c5f7e4ce4448a82b34c8e33de7ee2d06b6809e36d955bb5030e4",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C20",
      "predicateId": "predicate_C20",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323631323233613331326332323631323233613332376422293f2243414e4f4e4943414c5f4455504c49434154455f4b4559223a6e756c6c7d",
      "predicateBodySha256": "c48bac901625bde565d15f7c8311e5e7c18b122d796f12cdec29d226d64301cf",
      "injectorId": "inject_C20",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323236313232336133313263323236313232336133323764223b72657475726e206f75747d",
      "injectorBodySha256": "d1a0d8fa84bd86571d0b9552a7ae7bea46a9f778648e7465920729d6ee54a870",
      "leafId": "leafDuplicateKey",
      "leafFunctionIdentityRoot": "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c38.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433338223b0a6578706f727420636f6e737420756e69717565436f64653d22444550454e44454e43595f48494444454e223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323634363537303635366536343635366536333739343737323631373036383232336137623232363436353730363536653634363536653633373932643330323233613232366636643639373437343635363432323764376422293f22444550454e44454e43595f48494444454e223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236343635373036353665363436353665363337393437373236313730363832323361376232323634363537303635366536343635366536333739326433303232336132323666366436393734373436353634323237643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "b0fb39be1e485ac3d89873a97752a57e12e132e09e849e2574a3d4a631fc8330",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C38",
      "predicateId": "predicate_C38",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323634363537303635366536343635366536333739343737323631373036383232336137623232363436353730363536653634363536653633373932643330323233613232366636643639373437343635363432323764376422293f22444550454e44454e43595f48494444454e223a6e756c6c7d",
      "predicateBodySha256": "e91068fec2bbb4db6dd87201378fdb12230c70d540ed5db8996d7673b2d3e88e",
      "injectorId": "inject_C38",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236343635373036353665363436353665363337393437373236313730363832323361376232323634363537303635366536343635366536333739326433303232336132323666366436393734373436353634323237643764223b72657475726e206f75747d",
      "injectorBodySha256": "15849e5a4e71a84907e65f9807a9af825a32f585c9b0703a519c406cc22269aa",
      "leafId": "leafDependencyGraph",
      "leafFunctionIdentityRoot": "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c39.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433339223b0a6578706f727420636f6e737420756e69717565436f64653d22464f5242494444454e5f535542535452415445223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232373237353665373436393664363532323361376232323733373536323733373437323631373436353232336132323635373636353665373435343631373036353262373037323666366136353633373436393666366532323764376422293f22464f5242494444454e5f535542535452415445223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323732373536653734363936643635323233613762323237333735363237333734373236313734363532323361323236353736363536653734353436313730363532623730373236663661363536333734363936663665323237643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "ea10691634b124d66c5ff4a1c912310a969f1c5757745eab8a96f46b5176edd1",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C39",
      "predicateId": "predicate_C39",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232373237353665373436393664363532323361376232323733373536323733373437323631373436353232336132323635373636353665373435343631373036353262373037323666366136353633373436393666366532323764376422293f22464f5242494444454e5f535542535452415445223a6e756c6c7d",
      "predicateBodySha256": "75dcac07ca5586c3e38827be97bd0fa096d52aa310ee138a59520de6fac732f4",
      "injectorId": "inject_C39",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323732373536653734363936643635323233613762323237333735363237333734373236313734363532323361323236353736363536653734353436313730363532623730373236663661363536333734363936663665323237643764223b72657475726e206f75747d",
      "injectorBodySha256": "96e088e5447f1526d34045b58cd75909184a30a82a39d83488cfdba67a58dd92",
      "leafId": "leafForbiddenSubstrate",
      "leafFunctionIdentityRoot": "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c31.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433331223b0a6578706f727420636f6e737420756e69717565436f64653d22534f555243455f484153485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232373336663735373236333635343836313733363832323361323233313330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303232376422293f22534f555243455f484153485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323733366637353732363336353438363137333638323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "035075b191e9a7ca5c4b697754bd4d3b7a3fcc090b863c762960d57031f6a377",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C31",
      "predicateId": "predicate_C31",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232373336663735373236333635343836313733363832323361323233313330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303232376422293f22534f555243455f484153485f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "9483ea3ab09248a061957218404fe66715ec844be31167341e37fb9765a697ee",
      "injectorId": "inject_C31",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323733366637353732363336353438363137333638323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764223b72657475726e206f75747d",
      "injectorBodySha256": "11377dc5e6ee82f6951ad1e141bd21e3ac5b594e912c67af34b8c547853d14c0",
      "leafId": "leafSourceHash",
      "leafFunctionIdentityRoot": "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P1",
      "ownerModulePath": "proposed/P1-c29.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433239223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f554e4b4e4f574e5f544147223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323234323233613232373536653662366536663737366532323263323236313734323233613330376422293f2243414e4f4e4943414c5f554e4b4e4f574e5f544147223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323232343232336132323735366536623665366637373665323232633232363137343232336133303764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "4a562d6206d88cd2beafa43f9aceee7e9bd936630e3f4dc46c29e889223c9a41",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C29",
      "predicateId": "predicate_C29",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323234323233613232373536653662366536663737366532323263323236313734323233613330376422293f2243414e4f4e4943414c5f554e4b4e4f574e5f544147223a6e756c6c7d",
      "predicateBodySha256": "132f7735af3ebf9814a3cd47fe4ca636235ca16bb58fc06beeed4dd88c65add5",
      "injectorId": "inject_C29",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323232343232336132323735366536623665366637373665323232633232363137343232336133303764223b72657475726e206f75747d",
      "injectorBodySha256": "fce375d1e6cde2c21241f55a64644440052d8114b384a5a62f083e7f39dcefcd",
      "leafId": "leafTaggedConstructor",
      "leafFunctionIdentityRoot": "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c32.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433332223b0a6578706f727420636f6e737420756e69717565436f64653d2250524f53455f484153485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22303122293f2250524f53455f484153485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223031223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "2f7cdbcdf0db490bc75916281278124629a866b9acc18ec712a05f7882bf8f6f",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C32",
      "predicateId": "predicate_C32",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22303122293f2250524f53455f484153485f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "2c81cc80fa56590d3fdfff431ac422d4f57e8314002e3ff26250239363e8f252",
      "injectorId": "inject_C32",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223031223b72657475726e206f75747d",
      "injectorBodySha256": "308319041aa7734806b31dfb2c0634087b8df6644d1ae6869d9870406e634dc3",
      "leafId": "leafProseHash",
      "leafFunctionIdentityRoot": "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P1",
      "ownerModulePath": "proposed/P1-c24.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433234223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f434f4e54524f4c5f464f524d223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223232356337353330333033303631323222293f2243414e4f4e4943414c5f434f4e54524f4c5f464f524d223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232323563373533303330333036313232223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "2478317d6e3a289589061580380eb04bf69a7c22b713d8f7f905b49cdcaea1bb",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C24",
      "predicateId": "predicate_C24",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223232356337353330333033303631323222293f2243414e4f4e4943414c5f434f4e54524f4c5f464f524d223a6e756c6c7d",
      "predicateBodySha256": "f5d7e2637fc4c8d41c21956e6c1deaad6182c765d4657418b5dc8c80223f70cf",
      "injectorId": "inject_C24",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232323563373533303330333036313232223b72657475726e206f75747d",
      "injectorBodySha256": "c3c75ad45d954f98c1d3d120f674cc4989cf900abc2ebd30dc40cc4199b4b46e",
      "leafId": "leafShortControl",
      "leafFunctionIdentityRoot": "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c34.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433334223b0a6578706f727420636f6e737420756e69717565436f64653d22454447455f52455645525345223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323635363436373635373332323361376232323435333233363232336137623232363436393732363536333734363936663665323233613232353033353264336535303330323237643764376422293f22454447455f52455645525345223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236353634363736353733323233613762323234353332333632323361376232323634363937323635363337343639366636653232336132323530333532643365353033303232376437643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "2649622e1601cd4a5ea9343599898a20ccaa7e853202a21503e86a6e1a3c0c78",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C34",
      "predicateId": "predicate_C34",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323635363436373635373332323361376232323435333233363232336137623232363436393732363536333734363936663665323233613232353033353264336535303330323237643764376422293f22454447455f52455645525345223a6e756c6c7d",
      "predicateBodySha256": "9ba373679df09bcad6d2c6236a4a0bc7e5783686e22a56b1f6a6b1c14d3dc665",
      "injectorId": "inject_C34",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236353634363736353733323233613762323234353332333632323361376232323634363937323635363337343639366636653232336132323530333532643365353033303232376437643764223b72657475726e206f75747d",
      "injectorBodySha256": "87320e8b0b3aee1844d6a1f4166e851554b820f568daa41398f3fb1959149bfb",
      "leafId": "leafReverseEdge",
      "leafFunctionIdentityRoot": "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P1",
      "ownerModulePath": "proposed/P1-c22.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433232223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f455343415045445f534c415348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22323235633266323222293f2243414e4f4e4943414c5f455343415045445f534c415348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223232356332663232223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "0c92f33f01edb24017f3277ecdc3ff9464b3586a6b22e1fa21d19ce0a2580df0",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C22",
      "predicateId": "predicate_C22",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22323235633266323222293f2243414e4f4e4943414c5f455343415045445f534c415348223a6e756c6c7d",
      "predicateBodySha256": "7819f93f9a90756bc89bc4e812f3166303a36e6e0310956c299e330050d7188d",
      "injectorId": "inject_C22",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223232356332663232223b72657475726e206f75747d",
      "injectorBodySha256": "894a586ae56c259010c0c2c3d0aa2eb67da7bb96ade2d8eca98530a22f7dd453",
      "leafId": "leafEscapedSlash",
      "leafFunctionIdentityRoot": "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P1",
      "ownerModulePath": "proposed/P1-c23.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433233223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4845585f43415345223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223232356337353330333034363436323222293f2243414e4f4e4943414c5f4845585f43415345223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232323563373533303330343634363232223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "509da4ec02d13e23b5b1497bdc0dae56527f0402ac8a5981af014e6011c0b332",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C23",
      "predicateId": "predicate_C23",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223232356337353330333034363436323222293f2243414e4f4e4943414c5f4845585f43415345223a6e756c6c7d",
      "predicateBodySha256": "b9d431b479430e51eccb62e5c50602149bf4640d509b42ea16728b07ae6a3e59",
      "injectorId": "inject_C23",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232323563373533303330343634363232223b72657475726e206f75747d",
      "injectorBodySha256": "4f66ec103adbd65f20fa90a340f579177eebe86a4918de7109ef63baddb76437",
      "leafId": "leafLowerHex",
      "leafFunctionIdentityRoot": "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P1",
      "ownerModulePath": "proposed/P1-c28.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433238223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f57484954455350414345223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223230376232323631323233613331376422293f2243414e4f4e4943414c5f57484954455350414345223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232303762323236313232336133313764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "e5c80af00693bd8c2faf9092bb2fea7a05e43c45c2ee50446304e01f8da681b1",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C28",
      "predicateId": "predicate_C28",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223230376232323631323233613331376422293f2243414e4f4e4943414c5f57484954455350414345223a6e756c6c7d",
      "predicateBodySha256": "dcbb282e4ddcfec5a02d17842958862aa8b8c91d10bbc5b4beaa2b6014f05932",
      "injectorId": "inject_C28",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232303762323236313232336133313764223b72657475726e206f75747d",
      "injectorBodySha256": "fbbbe5f68f0c1ee12f2fadc4e79f145297a3f4c95fd7eaecef94a714c82eb390",
      "leafId": "leafEnvelopeWhitespace",
      "leafFunctionIdentityRoot": "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c36.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433336223b0a6578706f727420636f6e737420756e69717565436f64653d2244594e414d49435f434f4445223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236333631366336633733323233613562323236353736363136633238363632383239323932323564376422293f2244594e414d49435f434f4445223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363336313663366337333232336135623232363537363631366332383636323832393239323235643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "283af2018acd1dfbb14760cdf5212b8767796b2fb08b8d87e22005c5b72d70b6",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C36",
      "predicateId": "predicate_C36",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236333631366336633733323233613562323236353736363136633238363632383239323932323564376422293f2244594e414d49435f434f4445223a6e756c6c7d",
      "predicateBodySha256": "09949866a34c2776b4163649954665a167d1ef3455ab0e3acf9c3a20e43d3ec9",
      "injectorId": "inject_C36",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363336313663366337333232336135623232363537363631366332383636323832393239323235643764223b72657475726e206f75747d",
      "injectorBodySha256": "3582c1176af0582e1d4232faa23d20cdcce73119b0a32545285c8f06d9b9760a",
      "leafId": "leafDynamicCode",
      "leafFunctionIdentityRoot": "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P0",
      "ownerModulePath": "proposed/P0-c01.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433031223b0a6578706f727420636f6e737420756e69717565436f64653d224445434c41524154494f4e5f484153485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226465636c61726174696f6e536861323536225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224445434c41524154494f4e5f484153485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226465636c61726174696f6e536861323536225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "d35aad11397414bf59bd4bf433fdee384837274753bf62f06e000c0ed1218fad",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C01",
      "predicateId": "predicate_C01",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226465636c61726174696f6e536861323536225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224445434c41524154494f4e5f484153485f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "8af4f802a92e67af6dbb957bca12388d7a334cb77569fc38ab1536deda1e1af9",
      "injectorId": "inject_C01",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226465636c61726174696f6e536861323536225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d",
      "injectorBodySha256": "63aa84b11099717651a0d7384454cf6236da3ca5e74ccb4eb897cae62cf0cf13",
      "leafId": "validateDeclarationHash",
      "leafFunctionIdentityRoot": "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P0",
      "ownerModulePath": "proposed/P0-c03.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433033223b0a6578706f727420636f6e737420756e69717565436f64653d2256455253494f4e5f504152454e545f494e56414c4944223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2276657273696f6e73225d5b315d5b22706172656e7456657273696f6e225d2c31293f2256455253494f4e5f504152454e545f494e56414c4944223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2276657273696f6e73225d5b315d5b22706172656e7456657273696f6e225d3d313b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "38f3540a7f1888f0bda1fe9b079fc95cd6a003bf979f9b2f2618dcd47cb70848",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C03",
      "predicateId": "predicate_C03",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2276657273696f6e73225d5b315d5b22706172656e7456657273696f6e225d2c31293f2256455253494f4e5f504152454e545f494e56414c4944223a6e756c6c7d",
      "predicateBodySha256": "f6ad38782e29074600ecf9687c9a91f3f8eb53fbae80f7b8790339bb632e91c1",
      "injectorId": "inject_C03",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2276657273696f6e73225d5b315d5b22706172656e7456657273696f6e225d3d313b72657475726e206f75747d",
      "injectorBodySha256": "3312459b7441af025a421ad0a0d708f304b5ccd5b4449d0a2f6255ac654c098c",
      "leafId": "validateVersionParent",
      "leafFunctionIdentityRoot": "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c41.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433431223b0a6578706f727420636f6e737420756e69717565436f64653d22544f54414c5f4c4f435f4558434545444544223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323237343666373436313663343336383631373236373635363434633666363332323361333833353331376422293f22544f54414c5f4c4f435f4558434545444544223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232373436663734363136633433363836313732363736353634346336663633323233613338333533313764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "4dd3d2f36f1dcc92ed8a74126239375418a56baa375697baa74f40c861a2ff3c",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C41",
      "predicateId": "predicate_C41",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323237343666373436313663343336383631373236373635363434633666363332323361333833353331376422293f22544f54414c5f4c4f435f4558434545444544223a6e756c6c7d",
      "predicateBodySha256": "a38bb051cb39b37757f02f843f2ac68c5f19ffc645c4e7ca29e4bf28d5c4d117",
      "injectorId": "inject_C41",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232373436663734363136633433363836313732363736353634346336663633323233613338333533313764223b72657475726e206f75747d",
      "injectorBodySha256": "17cb2669a77194ec029d8e967e3fdc275750a83c92b6d592d1038beda7bcbc92",
      "leafId": "leafTotalBudget",
      "leafFunctionIdentityRoot": "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P5",
      "ownerModulePath": "proposed/P5-c16.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433136223b0a6578706f727420636f6e737420756e69717565436f64653d2246524553484e4553535f49534f4c4154494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2266726573686e6573734166746572225d5b2266696c6544657363726970746f7273225d2c5b302c312c322c39395d293f2246524553484e4553535f49534f4c4154494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2266726573686e6573734166746572225d5b2266696c6544657363726970746f7273225d3d5b302c312c322c39395d3b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "73e8a94d4460049d68758f852fdb1df6c4a8d9d00f03751e0327ce00630af6f2",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C16",
      "predicateId": "predicate_C16",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2266726573686e6573734166746572225d5b2266696c6544657363726970746f7273225d2c5b302c312c322c39395d293f2246524553484e4553535f49534f4c4154494f4e5f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "82073948722b70dd5c3f85260206bc9cfc08bdc9c321b1cb3d5a33d14fb36188",
      "injectorId": "inject_C16",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2266726573686e6573734166746572225d5b2266696c6544657363726970746f7273225d3d5b302c312c322c39395d3b72657475726e206f75747d",
      "injectorBodySha256": "147391420d20f5456ec339791b255b4fdeaa024eda15bcc37965b2afc4bd2ce6",
      "leafId": "validateFreshnessIsolation",
      "leafFunctionIdentityRoot": "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c40.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433430223b0a6578706f727420636f6e737420756e69717565436f64653d224d4f44554c455f4c4f435f4558434545444544223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232366436663634373536633635373332323361376232323530333532323361376232323633363836313732363736353634346336663633323233613338333637643764376422293f224d4f44554c455f4c4f435f4558434545444544223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323664366636343735366336353733323233613762323235303335323233613762323236333638363137323637363536343463366636333232336133383336376437643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "80b9d0f97fbbfef1fa2c7a42c0db2a04092284de7c8f0520b74dc99b15203312",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C40",
      "predicateId": "predicate_C40",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232366436663634373536633635373332323361376232323530333532323361376232323633363836313732363736353634346336663633323233613338333637643764376422293f224d4f44554c455f4c4f435f4558434545444544223a6e756c6c7d",
      "predicateBodySha256": "f1e270e74262aba0e6d26c524822f395df7979aa820f897744717040ddf2344e",
      "injectorId": "inject_C40",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323664366636343735366336353733323233613762323235303335323233613762323236333638363137323637363536343463366636333232336133383336376437643764223b72657475726e206f75747d",
      "injectorBodySha256": "8055b16515d4d4167e58980a47f1ecbf302d543eee8ed0aeeaf53aa0443f32c2",
      "leafId": "leafModuleBudget",
      "leafFunctionIdentityRoot": "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P0",
      "ownerModulePath": "proposed/P0-c02.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433032223b0a6578706f727420636f6e737420756e69717565436f64653d224c45444745525f524f4f545f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226c6564676572526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224c45444745525f524f4f545f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226c6564676572526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "81753a3039533a96bc17d4a72b7e919588b757770404f19fc2cffdaa28ceaed7",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C02",
      "predicateId": "predicate_C02",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226c6564676572526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224c45444745525f524f4f545f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "d7d3a55c15484aceba884df5e3a1d8fec3c21417afc0ea64716db8811a903594",
      "injectorId": "inject_C02",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226c6564676572526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d",
      "injectorBodySha256": "9c409190ccce309d2fb81fc8e7d9aceeb53962c4e58aab1cf26e7fa4bb03a90e",
      "leafId": "validateLedgerRoot",
      "leafFunctionIdentityRoot": "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P5",
      "ownerModulePath": "proposed/P5-c14.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433134223b0a6578706f727420636f6e737420756e69717565436f64653d224341504142494c4954595f49534f4c4154494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226361706162696c69747953757266616365496473225d2c5b226e6574776f726b3a616e79225d293f224341504142494c4954595f49534f4c4154494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226361706162696c69747953757266616365496473225d3d5b226e6574776f726b3a616e79225d3b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "da0a6f086afab42a3df91e6eccc3afee8246c5b10cbb34f1f5d8a8a17ed71876",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C14",
      "predicateId": "predicate_C14",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226361706162696c69747953757266616365496473225d2c5b226e6574776f726b3a616e79225d293f224341504142494c4954595f49534f4c4154494f4e5f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "b151a7dfc754a40e2a230041d2137cdcfea6c845c93263f95d99e4b6dac4549b",
      "injectorId": "inject_C14",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226361706162696c69747953757266616365496473225d3d5b226e6574776f726b3a616e79225d3b72657475726e206f75747d",
      "injectorBodySha256": "1d1fcae47bc0a6d1402b6e257f5ca4bcdfdc97292cf27e7b04c301f84db8790f",
      "leafId": "validateCapabilityIsolation",
      "leafFunctionIdentityRoot": "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P5",
      "ownerModulePath": "proposed/P5-c10.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433130223b0a6578706f727420636f6e737420756e69717565436f64653d2252554e5f524f4c455f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22726f6c65225d2c22636f6e74726f6c22293f2252554e5f524f4c455f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22726f6c65225d3d22636f6e74726f6c223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "dc49158fc549fcf2ae031c84d359098c5a173e65e2cad1353ae520964242dce7",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C10",
      "predicateId": "predicate_C10",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22726f6c65225d2c22636f6e74726f6c22293f2252554e5f524f4c455f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "9e086e79ba4d866869dd58a460683f90adae8ea7be6704d40faafaf39e1f8963",
      "injectorId": "inject_C10",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22726f6c65225d3d22636f6e74726f6c223b72657475726e206f75747d",
      "injectorBodySha256": "39e6ae9157cc29e45a7b9cd29280387c3deb31c6435bf7cb5fcbdeb195125553",
      "leafId": "validatePlanRole",
      "leafFunctionIdentityRoot": "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P5",
      "ownerModulePath": "proposed/P5-c11.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433131223b0a6578706f727420636f6e737420756e69717565436f64653d22494e5055545f415554484f524954595f50494e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22696e7075744d656d62657273225d5b305d5b226279746573225d2c32293f22494e5055545f415554484f524954595f50494e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22696e7075744d656d62657273225d5b305d5b226279746573225d3d323b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "0e1ae076f12b8b9c14a6ac66ba50cf4db2e4feddaaeb7efc3f4d57da2975c9e5",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C11",
      "predicateId": "predicate_C11",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22696e7075744d656d62657273225d5b305d5b226279746573225d2c32293f22494e5055545f415554484f524954595f50494e5f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "4fb3932366220c25c06efab508dfa1eccf6e5a5cd27bc2a2ec90591049341752",
      "injectorId": "inject_C11",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22696e7075744d656d62657273225d5b305d5b226279746573225d3d323b72657475726e206f75747d",
      "injectorBodySha256": "3028847f8c4b1da09ca47773280f79e90088ea04e75be68dbae7cf45d5b8618d",
      "leafId": "validateInputAuthorityPin",
      "leafFunctionIdentityRoot": "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P1",
      "ownerModulePath": "proposed/P1-c26.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433236223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f494e54454745525f464f524d223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223330333022293f2243414e4f4e4943414c5f494e54454745525f464f524d223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2233303330223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "efa5215cb8702a161e4ae0d6e719f539d16cae7837750580597945d1982cab4b",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C26",
      "predicateId": "predicate_C26",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223330333022293f2243414e4f4e4943414c5f494e54454745525f464f524d223a6e756c6c7d",
      "predicateBodySha256": "94cc40804712c0fb2e12e91e9fa75cb501ef9044fa671c1c71b073137b112906",
      "injectorId": "inject_C26",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2233303330223b72657475726e206f75747d",
      "injectorBodySha256": "55e43a9d0b488afea927477bb3a9fdb84de516c479bed7a252b41c261ad40682",
      "leafId": "leafIntegerForm",
      "leafFunctionIdentityRoot": "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P5",
      "ownerModulePath": "proposed/P5-c18.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433138223b0a6578706f727420636f6e737420756e69717565436f64653d224f42534552564154494f4e5f5345414c5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226f62736572766174696f6e5365616c526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224f42534552564154494f4e5f5345414c5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226f62736572766174696f6e5365616c526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "a799e7c44eb01c4d3a0f38ba2ea6f7f7c534aa2a2f7166a023543f0ad0be2998",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C18",
      "predicateId": "predicate_C18",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226f62736572766174696f6e5365616c526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224f42534552564154494f4e5f5345414c5f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "ad46036a15b4aaec5de3c570f38ea930646a07cef2ce7f992314e9ab72f821c8",
      "injectorId": "inject_C18",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226f62736572766174696f6e5365616c526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d",
      "injectorBodySha256": "bf3fdfafc609ce3f1de1b9cb77169ddb426d8cc157ccfade5d7628daf2eb0d44",
      "leafId": "validateObservationSeal",
      "leafFunctionIdentityRoot": "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P5",
      "ownerModulePath": "proposed/P5-c19.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433139223b0a6578706f727420636f6e737420756e69717565436f64653d224f42534552564154494f4e5f41444d495353494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226d657373616765225d5b22726f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224f42534552564154494f4e5f41444d495353494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226d657373616765225d5b22726f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "7c393e90996b525952726027e729a9161df7e584becd00f44d2d5e1c7bf83f46",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C19",
      "predicateId": "predicate_C19",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226d657373616765225d5b22726f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224f42534552564154494f4e5f41444d495353494f4e5f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "24c3890a94e9224f754835a4ba3592f5177da8b0380cecb7af05d33796ef07c8",
      "injectorId": "inject_C19",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226d657373616765225d5b22726f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d",
      "injectorBodySha256": "4810a884564e0c0f5430b80d4e7c24d53d8cd259f8724951bad3038f35947c98",
      "leafId": "validateObservationAdmission",
      "leafFunctionIdentityRoot": "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P5",
      "ownerModulePath": "proposed/P5-c13.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433133223b0a6578706f727420636f6e737420756e69717565436f64653d2252554e5f4348524f4e4f4c4f47595f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227365616c225d5b226368726f6e6f6c6f67794f7264696e616c225d2c33293f2252554e5f4348524f4e4f4c4f47595f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227365616c225d5b226368726f6e6f6c6f67794f7264696e616c225d3d333b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "27ef59c7c67be6e633244d983aad62e8085c825af9113ac05550179aca30fe10",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C13",
      "predicateId": "predicate_C13",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227365616c225d5b226368726f6e6f6c6f67794f7264696e616c225d2c33293f2252554e5f4348524f4e4f4c4f47595f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "1f490eb77efe9d0cb59bf3fb416d10b007b941b0505248e4cc9bef2633cabb08",
      "injectorId": "inject_C13",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227365616c225d5b226368726f6e6f6c6f67794f7264696e616c225d3d333b72657475726e206f75747d",
      "injectorBodySha256": "d95533a3e81d4f176c69d67ccf05ce9ca9dbebe0b3ad11c7b2fbf86318d86e33",
      "leafId": "validateRunChronology",
      "leafFunctionIdentityRoot": "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c35.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433335223b0a6578706f727420636f6e737420756e69717565436f64653d2244594e414d49435f494d504f5254223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236393664373036663732373437333232336135623762323236623639366536343232336132323634373936653631366436393633323237643564376422293f2244594e414d49435f494d504f5254223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363936643730366637323734373332323361356237623232366236393665363432323361323236343739366536313664363936333232376435643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "6ff39653b24d3dd6c7eb2c82aff7447a1da62f59e72851dba0f7453cbf3e19f4",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C35",
      "predicateId": "predicate_C35",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236393664373036663732373437333232336135623762323236623639366536343232336132323634373936653631366436393633323237643564376422293f2244594e414d49435f494d504f5254223a6e756c6c7d",
      "predicateBodySha256": "829b0a79cc688a7d38432b457524221b7361e547a9750df7be342258cf480310",
      "injectorId": "inject_C35",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363936643730366637323734373332323361356237623232366236393665363432323361323236343739366536313664363936333232376435643764223b72657475726e206f75747d",
      "injectorBodySha256": "99e1a1abe67144e5bd4e13ada911cb86638810aee688c11f10d5005c2dacaeda",
      "leafId": "leafDynamicImport",
      "leafFunctionIdentityRoot": "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P5",
      "ownerModulePath": "proposed/P5-c17.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433137223b0a6578706f727420636f6e737420756e69717565436f64653d224f42534552564154494f4e5f4d454d424552534849505f524f4f545f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2264657363726970746f7273225d5b2270726f64756374225d2c756e646566696e6564293f224f42534552564154494f4e5f4d454d424552534849505f524f4f545f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b64656c657465206f75745b2264657363726970746f7273225d5b2270726f64756374225d3b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "fc9e5df65b1696b047a18232828b9a506492ec99be410dc303439bb682973e45",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C17",
      "predicateId": "predicate_C17",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2264657363726970746f7273225d5b2270726f64756374225d2c756e646566696e6564293f224f42534552564154494f4e5f4d454d424552534849505f524f4f545f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "b0fb3edaa0235b64dedc892a0c68a28e0386af2fa95a656378b3bce97568953f",
      "injectorId": "inject_C17",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b64656c657465206f75745b2264657363726970746f7273225d5b2270726f64756374225d3b72657475726e206f75747d",
      "injectorBodySha256": "4a875b2bac6d47138ab01afcba571edbd11f8a3ea69f3cee1fb4e5679745ad86",
      "leafId": "validateObservationMembershipRoot",
      "leafFunctionIdentityRoot": "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c30.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433330223b0a6578706f727420636f6e737420756e69717565436f64653d22534f555243455f4d4f44554c455f534554223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232366436663634373536633635353336353734323233613562323235303330323232633232353033313232326332323530333232323263323235303333323232633232353033343232326332323530333532323263323235303336323232633232353033373232326332323530333832323564376422293f22534f555243455f4d4f44554c455f534554223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323664366636343735366336353533363537343232336135623232353033303232326332323530333132323263323235303332323232633232353033333232326332323530333432323263323235303335323232633232353033363232326332323530333732323263323235303338323235643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "48f4a79aa8169dd383cf023044b0bd5514347004b4d42cd606263cb7d7e34607",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C30",
      "predicateId": "predicate_C30",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232366436663634373536633635353336353734323233613562323235303330323232633232353033313232326332323530333232323263323235303333323232633232353033343232326332323530333532323263323235303336323232633232353033373232326332323530333832323564376422293f22534f555243455f4d4f44554c455f534554223a6e756c6c7d",
      "predicateBodySha256": "4aa640ebca7c5492a19f8dfa6e2714a435c9fe59798d85185de1e97df05a1133",
      "injectorId": "inject_C30",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323664366636343735366336353533363537343232336135623232353033303232326332323530333132323263323235303332323232633232353033333232326332323530333432323263323235303335323232633232353033363232326332323530333732323263323235303338323235643764223b72657475726e206f75747d",
      "injectorBodySha256": "8213b734ab78e079dd1d79a398707a03ee90a3109f59b48bd2c9f72143105607",
      "leafId": "leafModuleSet",
      "leafFunctionIdentityRoot": "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P0",
      "ownerModulePath": "proposed/P0-c04.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433034223b0a6578706f727420636f6e737420756e69717565436f64653d224546464543545f4b45595f494e56414c4944223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226566666563744964656e746974696573225d5b305d5b226f7264696e616c225d2c31293f224546464543545f4b45595f494e56414c4944223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226566666563744964656e746974696573225d5b305d5b226f7264696e616c225d3d313b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "f2a2f0f08fdb4ffd2e77b1bdbf97d378084496ccc401e7db7fce6e98e6f7a39d",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C04",
      "predicateId": "predicate_C04",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226566666563744964656e746974696573225d5b305d5b226f7264696e616c225d2c31293f224546464543545f4b45595f494e56414c4944223a6e756c6c7d",
      "predicateBodySha256": "bc5fa6969e666601bc509c7e7ae537bce6c750e047d31fd2d8f03bb3c4c84842",
      "injectorId": "inject_C04",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226566666563744964656e746974696573225d5b305d5b226f7264696e616c225d3d313b72657475726e206f75747d",
      "injectorBodySha256": "e2192304f7a93c223a097ce560acac2727e42ed1322d05f86caf54de24437c64",
      "leafId": "validateEffectKey",
      "leafFunctionIdentityRoot": "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P3",
      "ownerModulePath": "proposed/P3-c07.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433037223b0a6578706f727420636f6e737420756e69717565436f64653d225441524745545f44455054485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226d61784465707468225d2c35293f225441524745545f44455054485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226d61784465707468225d3d353b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "d82c51a880ae0638a2bca3f166c7026804c1781b2164fe8c6fd9dd7aede191c3",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C07",
      "predicateId": "predicate_C07",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226d61784465707468225d2c35293f225441524745545f44455054485f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "dee11e8e542fc800a3d936d3410f49ea57a8c080345422680a118ccd59d2041e",
      "injectorId": "inject_C07",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226d61784465707468225d3d353b72657475726e206f75747d",
      "injectorBodySha256": "87349545ed82dfa455cbb3972f1c89d35ca9d991602d57689b0a094148523290",
      "leafId": "validateTargetDepth",
      "leafFunctionIdentityRoot": "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P7",
      "ownerModulePath": "proposed/P7-c43.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433433223b0a6578706f727420636f6e737420756e69717565436f64653d22434c41494d5f534f555243455f4452494654223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323633366336313639366432323361376232323733366637353732363336353461366636393665323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764376422293f22434c41494d5f534f555243455f4452494654223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236333663363136393664323233613762323237333666373537323633363534613666363936653232336132323331333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330323237643764223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "2099ac2a18bc90428bbbd45f2e54633aa83d56321af5d628b466759c52fed56f",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C43",
      "predicateId": "predicate_C43",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323633366336313639366432323361376232323733366637353732363336353461366636393665323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764376422293f22434c41494d5f534f555243455f4452494654223a6e756c6c7d",
      "predicateBodySha256": "48bb49f26a19ced0f9ac6cc12a585661455b3a48885dc5eafee56b9036437299",
      "injectorId": "inject_C43",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236333663363136393664323233613762323237333666373537323633363534613666363936653232336132323331333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330323237643764223b72657475726e206f75747d",
      "injectorBodySha256": "8d74e3541d5e1bbe699b614f5ea6ba1c57d0fca2b64b9ad2e1e0beabd054b099",
      "leafId": "leafClaimSourceJoin",
      "leafFunctionIdentityRoot": "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    },
    {
      "schema": "LeafFunctionIdentityV8",
      "ownerModule": "P5",
      "ownerModulePath": "proposed/P5-c15.mjs",
      "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433135223b0a6578706f727420636f6e737420756e69717565436f64653d22494e564f434154494f4e5f415554484f524954595f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22696e766f636174696f6e417574686f72697479225d5b2263616c6c6261636b436c6f73757265526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f22494e564f434154494f4e5f415554484f524954595f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22696e766f636174696f6e417574686f72697479225d5b2263616c6c6261636b436c6f73757265526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
      "moduleSourceSha256": "175e6d45ba3d53c2d739c5f1869889f8979f16305d7140c287df1d6c6d4c5da3",
      "astNodePath": "/ExportNamedDeclaration[predicate]/C15",
      "predicateId": "predicate_C15",
      "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22696e766f636174696f6e417574686f72697479225d5b2263616c6c6261636b436c6f73757265526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f22494e564f434154494f4e5f415554484f524954595f4d49534d41544348223a6e756c6c7d",
      "predicateBodySha256": "08204e11fd9666d379dde23eaa6aceb9cd5ab46ed23cca9f10c20a56d70bd13d",
      "injectorId": "inject_C15",
      "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22696e766f636174696f6e417574686f72697479225d5b2263616c6c6261636b436c6f73757265526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d",
      "injectorBodySha256": "8bd7068e6b384d2f70a09b28e4c55f503eadbbe6f56e1b355d7b54f0a7799ee5",
      "leafId": "validateInvocationAuthority",
      "leafFunctionIdentityRoot": "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    }
  ],
  "controls": [
    {
      "schema": "ControlRowV8",
      "controlId": "C01",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C01",
      "domainId": "DM-C01",
      "sourceSchemaId": "SCHEMA-C01-V1",
      "productionKind": "DeclarationV8",
      "destinationPath": "/declarationSha256",
      "productionBeforeRoot": "6f7e5790f2c1ba420f4fdf6578c97873e44cbe5199458c023fc44927c4589df8",
      "productionAfterRoot": "35faa34c38ed2167f6d2351064b080416b26a55163a4d18bba7cb6fdce301889",
      "projectionJoinRoot": "39e5c8d9ea20d41588b2edb4861c718251409123cf237b462cd74bef38216b38",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C01",
        "fixtureId": "FX-C01",
        "domainId": "DM-C01",
        "schemaId": "SCHEMA-C01-V1",
        "productionBeforeRoot": "6f7e5790f2c1ba420f4fdf6578c97873e44cbe5199458c023fc44927c4589df8",
        "productionAfterRoot": "35faa34c38ed2167f6d2351064b080416b26a55163a4d18bba7cb6fdce301889",
        "projectionJoinRoot": "39e5c8d9ea20d41588b2edb4861c718251409123cf237b462cd74bef38216b38",
        "injectorModuleRoot": "d35aad11397414bf59bd4bf433fdee384837274753bf62f06e000c0ed1218fad",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "5bfb980b871bf631b0582a94bffecd228bfb8d058b15390a8df1089d0220e4a9",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P0",
        "ownerModulePath": "proposed/P0-c01.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433031223b0a6578706f727420636f6e737420756e69717565436f64653d224445434c41524154494f4e5f484153485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226465636c61726174696f6e536861323536225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224445434c41524154494f4e5f484153485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226465636c61726174696f6e536861323536225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "d35aad11397414bf59bd4bf433fdee384837274753bf62f06e000c0ed1218fad",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C01",
        "predicateId": "predicate_C01",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226465636c61726174696f6e536861323536225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224445434c41524154494f4e5f484153485f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "8af4f802a92e67af6dbb957bca12388d7a334cb77569fc38ab1536deda1e1af9",
        "injectorId": "inject_C01",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226465636c61726174696f6e536861323536225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d",
        "injectorBodySha256": "63aa84b11099717651a0d7384454cf6236da3ca5e74ccb4eb897cae62cf0cf13",
        "leafId": "validateDeclarationHash",
        "leafFunctionIdentityRoot": "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
      },
      "uniqueCode": "DECLARATION_HASH_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "6f7e5790f2c1ba420f4fdf6578c97873e44cbe5199458c023fc44927c4589df8",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "35faa34c38ed2167f6d2351064b080416b26a55163a4d18bba7cb6fdce301889",
          "disabledLeaf": null,
          "expected": "DECLARATION_HASH_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "35faa34c38ed2167f6d2351064b080416b26a55163a4d18bba7cb6fdce301889",
          "disabledLeafFunctionIdentityRoot": "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "35faa34c38ed2167f6d2351064b080416b26a55163a4d18bba7cb6fdce301889",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "6f7e5790f2c1ba420f4fdf6578c97873e44cbe5199458c023fc44927c4589df8",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 0,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C02",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C02",
      "domainId": "DM-C02",
      "sourceSchemaId": "SCHEMA-C02-V1",
      "productionKind": "LedgerV8",
      "destinationPath": "/ledgerRoot",
      "productionBeforeRoot": "b893a3f3c0c8313324e98cb7f3b06e89cdf53e128c45e3d1b38fd5cb60e2d80a",
      "productionAfterRoot": "d7f2df5ce25ac4e1f94e848170f79f0893b71cf43bc3010508fbb5cc414e2904",
      "projectionJoinRoot": "e0be8843ce618afead8ffc07394442d741bc26e9b18ebc6c3324e4ece2d9a605",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C02",
        "fixtureId": "FX-C02",
        "domainId": "DM-C02",
        "schemaId": "SCHEMA-C02-V1",
        "productionBeforeRoot": "b893a3f3c0c8313324e98cb7f3b06e89cdf53e128c45e3d1b38fd5cb60e2d80a",
        "productionAfterRoot": "d7f2df5ce25ac4e1f94e848170f79f0893b71cf43bc3010508fbb5cc414e2904",
        "projectionJoinRoot": "e0be8843ce618afead8ffc07394442d741bc26e9b18ebc6c3324e4ece2d9a605",
        "injectorModuleRoot": "81753a3039533a96bc17d4a72b7e919588b757770404f19fc2cffdaa28ceaed7",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "a82f5ab75153ef3ded9f41eaf543d61e8f00d2b6ccbb749728ca659f5cc37a9d",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P0",
        "ownerModulePath": "proposed/P0-c02.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433032223b0a6578706f727420636f6e737420756e69717565436f64653d224c45444745525f524f4f545f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226c6564676572526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224c45444745525f524f4f545f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226c6564676572526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "81753a3039533a96bc17d4a72b7e919588b757770404f19fc2cffdaa28ceaed7",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C02",
        "predicateId": "predicate_C02",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226c6564676572526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224c45444745525f524f4f545f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "d7d3a55c15484aceba884df5e3a1d8fec3c21417afc0ea64716db8811a903594",
        "injectorId": "inject_C02",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226c6564676572526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d",
        "injectorBodySha256": "9c409190ccce309d2fb81fc8e7d9aceeb53962c4e58aab1cf26e7fa4bb03a90e",
        "leafId": "validateLedgerRoot",
        "leafFunctionIdentityRoot": "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
      },
      "uniqueCode": "LEDGER_ROOT_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "b893a3f3c0c8313324e98cb7f3b06e89cdf53e128c45e3d1b38fd5cb60e2d80a",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "d7f2df5ce25ac4e1f94e848170f79f0893b71cf43bc3010508fbb5cc414e2904",
          "disabledLeaf": null,
          "expected": "LEDGER_ROOT_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "d7f2df5ce25ac4e1f94e848170f79f0893b71cf43bc3010508fbb5cc414e2904",
          "disabledLeafFunctionIdentityRoot": "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "d7f2df5ce25ac4e1f94e848170f79f0893b71cf43bc3010508fbb5cc414e2904",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "b893a3f3c0c8313324e98cb7f3b06e89cdf53e128c45e3d1b38fd5cb60e2d80a",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 42,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C03",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C03",
      "domainId": "DM-C03",
      "sourceSchemaId": "SCHEMA-C03-V1",
      "productionKind": "LedgerV8",
      "destinationPath": "/versions/1/parentVersion",
      "productionBeforeRoot": "51dc6d9792053beffba9a8987754100c375469977226caf78afcadd0d3c3b959",
      "productionAfterRoot": "55525cdb22568799ae99752e5282ce45ba3e50cc1201ea0e72371134043bdc31",
      "projectionJoinRoot": "e7f19787c5d0030a7461eebde1ad22e163a49e200bd4859eefef3fb1eb3b6cbf",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C03",
        "fixtureId": "FX-C03",
        "domainId": "DM-C03",
        "schemaId": "SCHEMA-C03-V1",
        "productionBeforeRoot": "51dc6d9792053beffba9a8987754100c375469977226caf78afcadd0d3c3b959",
        "productionAfterRoot": "55525cdb22568799ae99752e5282ce45ba3e50cc1201ea0e72371134043bdc31",
        "projectionJoinRoot": "e7f19787c5d0030a7461eebde1ad22e163a49e200bd4859eefef3fb1eb3b6cbf",
        "injectorModuleRoot": "38f3540a7f1888f0bda1fe9b079fc95cd6a003bf979f9b2f2618dcd47cb70848",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "5ca1f491a730046e92e4adc05b950d5a4b1a8aa1bd05919add32a898593c2d2d",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P0",
        "ownerModulePath": "proposed/P0-c03.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433033223b0a6578706f727420636f6e737420756e69717565436f64653d2256455253494f4e5f504152454e545f494e56414c4944223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2276657273696f6e73225d5b315d5b22706172656e7456657273696f6e225d2c31293f2256455253494f4e5f504152454e545f494e56414c4944223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2276657273696f6e73225d5b315d5b22706172656e7456657273696f6e225d3d313b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "38f3540a7f1888f0bda1fe9b079fc95cd6a003bf979f9b2f2618dcd47cb70848",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C03",
        "predicateId": "predicate_C03",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2276657273696f6e73225d5b315d5b22706172656e7456657273696f6e225d2c31293f2256455253494f4e5f504152454e545f494e56414c4944223a6e756c6c7d",
        "predicateBodySha256": "f6ad38782e29074600ecf9687c9a91f3f8eb53fbae80f7b8790339bb632e91c1",
        "injectorId": "inject_C03",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2276657273696f6e73225d5b315d5b22706172656e7456657273696f6e225d3d313b72657475726e206f75747d",
        "injectorBodySha256": "3312459b7441af025a421ad0a0d708f304b5ccd5b4449d0a2f6255ac654c098c",
        "leafId": "validateVersionParent",
        "leafFunctionIdentityRoot": "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
      },
      "uniqueCode": "VERSION_PARENT_INVALID",
      "outcomes": {
        "baseline": {
          "instanceRoot": "51dc6d9792053beffba9a8987754100c375469977226caf78afcadd0d3c3b959",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "55525cdb22568799ae99752e5282ce45ba3e50cc1201ea0e72371134043bdc31",
          "disabledLeaf": null,
          "expected": "VERSION_PARENT_INVALID"
        },
        "ownerSuppression": {
          "instanceRoot": "55525cdb22568799ae99752e5282ce45ba3e50cc1201ea0e72371134043bdc31",
          "disabledLeafFunctionIdentityRoot": "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "55525cdb22568799ae99752e5282ce45ba3e50cc1201ea0e72371134043bdc31",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "51dc6d9792053beffba9a8987754100c375469977226caf78afcadd0d3c3b959",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 84,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C04",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C04",
      "domainId": "DM-C04",
      "sourceSchemaId": "SCHEMA-C04-V1",
      "productionKind": "EffectTableV8",
      "destinationPath": "/effectIdentities/0/ordinal",
      "productionBeforeRoot": "5604247c44a150b216362c2967ceceda4e425b405b6a660f086f7ab297775b07",
      "productionAfterRoot": "58fd093369e662b9219df538173e82c50f32e78c07ab6ad6699fe9e484868aa0",
      "projectionJoinRoot": "35a10d67851b4cc7d76d582ca208004cd0f627cdae65f8496a7d6a8138fe9cf7",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C04",
        "fixtureId": "FX-C04",
        "domainId": "DM-C04",
        "schemaId": "SCHEMA-C04-V1",
        "productionBeforeRoot": "5604247c44a150b216362c2967ceceda4e425b405b6a660f086f7ab297775b07",
        "productionAfterRoot": "58fd093369e662b9219df538173e82c50f32e78c07ab6ad6699fe9e484868aa0",
        "projectionJoinRoot": "35a10d67851b4cc7d76d582ca208004cd0f627cdae65f8496a7d6a8138fe9cf7",
        "injectorModuleRoot": "f2a2f0f08fdb4ffd2e77b1bdbf97d378084496ccc401e7db7fce6e98e6f7a39d",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "d17b44ef7316309ba3a1b29d8ff85c880d1bae40b2e65901cc6690b8e6b7a8ee",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P0",
        "ownerModulePath": "proposed/P0-c04.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433034223b0a6578706f727420636f6e737420756e69717565436f64653d224546464543545f4b45595f494e56414c4944223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226566666563744964656e746974696573225d5b305d5b226f7264696e616c225d2c31293f224546464543545f4b45595f494e56414c4944223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226566666563744964656e746974696573225d5b305d5b226f7264696e616c225d3d313b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "f2a2f0f08fdb4ffd2e77b1bdbf97d378084496ccc401e7db7fce6e98e6f7a39d",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C04",
        "predicateId": "predicate_C04",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226566666563744964656e746974696573225d5b305d5b226f7264696e616c225d2c31293f224546464543545f4b45595f494e56414c4944223a6e756c6c7d",
        "predicateBodySha256": "bc5fa6969e666601bc509c7e7ae537bce6c750e047d31fd2d8f03bb3c4c84842",
        "injectorId": "inject_C04",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226566666563744964656e746974696573225d5b305d5b226f7264696e616c225d3d313b72657475726e206f75747d",
        "injectorBodySha256": "e2192304f7a93c223a097ce560acac2727e42ed1322d05f86caf54de24437c64",
        "leafId": "validateEffectKey",
        "leafFunctionIdentityRoot": "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
      },
      "uniqueCode": "EFFECT_KEY_INVALID",
      "outcomes": {
        "baseline": {
          "instanceRoot": "5604247c44a150b216362c2967ceceda4e425b405b6a660f086f7ab297775b07",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "58fd093369e662b9219df538173e82c50f32e78c07ab6ad6699fe9e484868aa0",
          "disabledLeaf": null,
          "expected": "EFFECT_KEY_INVALID"
        },
        "ownerSuppression": {
          "instanceRoot": "58fd093369e662b9219df538173e82c50f32e78c07ab6ad6699fe9e484868aa0",
          "disabledLeafFunctionIdentityRoot": "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "58fd093369e662b9219df538173e82c50f32e78c07ab6ad6699fe9e484868aa0",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "5604247c44a150b216362c2967ceceda4e425b405b6a660f086f7ab297775b07",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 126,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C05",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C05",
      "domainId": "DM-C05",
      "sourceSchemaId": "SCHEMA-C05-V1",
      "productionKind": "ExperimentSelectionReceiptV8",
      "destinationPath": "/rowOrdinal",
      "productionBeforeRoot": "2898df3ea641684753830e952ed187efe23c74c74234dc6ff3d1fa9b95f0c4e0",
      "productionAfterRoot": "a4d39bf40e8494c0b5e84a4efcbf0616a3c2ac265ba40fab4ef595d915cb0279",
      "projectionJoinRoot": "a7e14835bd199126e5309f9c42239711f237e8196519de4f6b53eab3ac357d59",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C05",
        "fixtureId": "FX-C05",
        "domainId": "DM-C05",
        "schemaId": "SCHEMA-C05-V1",
        "productionBeforeRoot": "2898df3ea641684753830e952ed187efe23c74c74234dc6ff3d1fa9b95f0c4e0",
        "productionAfterRoot": "a4d39bf40e8494c0b5e84a4efcbf0616a3c2ac265ba40fab4ef595d915cb0279",
        "projectionJoinRoot": "a7e14835bd199126e5309f9c42239711f237e8196519de4f6b53eab3ac357d59",
        "injectorModuleRoot": "8426939ebcd3b1e1d8f14894173a188238ae05e7533ab6759b897631d64d6b91",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "a48254df684f366675df1f27f1e685b76dc5acb83bbd2628d76fc8b8881c306b",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P0",
        "ownerModulePath": "proposed/P0-c05.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433035223b0a6578706f727420636f6e737420756e69717565436f64653d224558504552494d454e545f53454c454354494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22726f774f7264696e616c225d2c31293f224558504552494d454e545f53454c454354494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22726f774f7264696e616c225d3d313b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "8426939ebcd3b1e1d8f14894173a188238ae05e7533ab6759b897631d64d6b91",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C05",
        "predicateId": "predicate_C05",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22726f774f7264696e616c225d2c31293f224558504552494d454e545f53454c454354494f4e5f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "8b47bbf09134a2c32262d76df7f78f5095921a135ac17f37a4930b014cd15074",
        "injectorId": "inject_C05",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22726f774f7264696e616c225d3d313b72657475726e206f75747d",
        "injectorBodySha256": "f16ab9daa29b5534713be0212fb60f4cb1d5e8bec5573282466638e260867f75",
        "leafId": "validateExperimentSelection",
        "leafFunctionIdentityRoot": "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
      },
      "uniqueCode": "EXPERIMENT_SELECTION_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "2898df3ea641684753830e952ed187efe23c74c74234dc6ff3d1fa9b95f0c4e0",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "a4d39bf40e8494c0b5e84a4efcbf0616a3c2ac265ba40fab4ef595d915cb0279",
          "disabledLeaf": null,
          "expected": "EXPERIMENT_SELECTION_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "a4d39bf40e8494c0b5e84a4efcbf0616a3c2ac265ba40fab4ef595d915cb0279",
          "disabledLeafFunctionIdentityRoot": "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "a4d39bf40e8494c0b5e84a4efcbf0616a3c2ac265ba40fab4ef595d915cb0279",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "2898df3ea641684753830e952ed187efe23c74c74234dc6ff3d1fa9b95f0c4e0",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 168,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C06",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C06",
      "domainId": "DM-C06",
      "sourceSchemaId": "SCHEMA-C06-V1",
      "productionKind": "EditLedgerV8",
      "destinationPath": "/edits/0/startUtf16",
      "productionBeforeRoot": "2328009d2a602f05322d17e08faf1773549f7d68f6f70d1900377836ff37426a",
      "productionAfterRoot": "982fc09006cdd9efb616b713cf931cff82353c6aef504e586dd1d58ad28adf26",
      "projectionJoinRoot": "b8364d6bcdc8932798edeb89c5ce1017353658d928c2e08fae0ee0c2f18ecf5a",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C06",
        "fixtureId": "FX-C06",
        "domainId": "DM-C06",
        "schemaId": "SCHEMA-C06-V1",
        "productionBeforeRoot": "2328009d2a602f05322d17e08faf1773549f7d68f6f70d1900377836ff37426a",
        "productionAfterRoot": "982fc09006cdd9efb616b713cf931cff82353c6aef504e586dd1d58ad28adf26",
        "projectionJoinRoot": "b8364d6bcdc8932798edeb89c5ce1017353658d928c2e08fae0ee0c2f18ecf5a",
        "injectorModuleRoot": "52e0c9ef3396d2592d0d4b194f5e59df4bb798ff2ee0e474d1c04fb470f5a9d6",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "d8729e27b8e1c35311ad5991f09a56461e9fbaee4e7ebc9d33c10769ec0a800c",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P2",
        "ownerModulePath": "proposed/P2-c06.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433036223b0a6578706f727420636f6e737420756e69717565436f64653d22454449545f5245504c41595f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226564697473225d5b305d5b2273746172745574663136225d2c32293f22454449545f5245504c41595f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226564697473225d5b305d5b2273746172745574663136225d3d323b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "52e0c9ef3396d2592d0d4b194f5e59df4bb798ff2ee0e474d1c04fb470f5a9d6",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C06",
        "predicateId": "predicate_C06",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226564697473225d5b305d5b2273746172745574663136225d2c32293f22454449545f5245504c41595f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "896233ed81e964975bf9615ecaf2c400eaca41113d0860ddcb5e522b69f5e183",
        "injectorId": "inject_C06",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226564697473225d5b305d5b2273746172745574663136225d3d323b72657475726e206f75747d",
        "injectorBodySha256": "acb46cc5ddad079c8a2ccc942f91ed76053a78e1860cf83f13e8ed7145c03e5f",
        "leafId": "validateEditReplay",
        "leafFunctionIdentityRoot": "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
      },
      "uniqueCode": "EDIT_REPLAY_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "2328009d2a602f05322d17e08faf1773549f7d68f6f70d1900377836ff37426a",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "982fc09006cdd9efb616b713cf931cff82353c6aef504e586dd1d58ad28adf26",
          "disabledLeaf": null,
          "expected": "EDIT_REPLAY_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "982fc09006cdd9efb616b713cf931cff82353c6aef504e586dd1d58ad28adf26",
          "disabledLeafFunctionIdentityRoot": "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "982fc09006cdd9efb616b713cf931cff82353c6aef504e586dd1d58ad28adf26",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "2328009d2a602f05322d17e08faf1773549f7d68f6f70d1900377836ff37426a",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 210,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C07",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C07",
      "domainId": "DM-C07",
      "sourceSchemaId": "SCHEMA-C07-V1",
      "productionKind": "CompleteProductV8",
      "destinationPath": "/maxDepth",
      "productionBeforeRoot": "8b4104f0d909018c2e301690e97c9247d1f418e83efae7fd7bca02033701a1a4",
      "productionAfterRoot": "f9e7307053e6f7e1bf3975659cfe60ec8e90207ca12aa732ecb6384247366165",
      "projectionJoinRoot": "e5413318e926fec3cedb9998c64099031f5ed19b996494790744e27b209a1876",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C07",
        "fixtureId": "FX-C07",
        "domainId": "DM-C07",
        "schemaId": "SCHEMA-C07-V1",
        "productionBeforeRoot": "8b4104f0d909018c2e301690e97c9247d1f418e83efae7fd7bca02033701a1a4",
        "productionAfterRoot": "f9e7307053e6f7e1bf3975659cfe60ec8e90207ca12aa732ecb6384247366165",
        "projectionJoinRoot": "e5413318e926fec3cedb9998c64099031f5ed19b996494790744e27b209a1876",
        "injectorModuleRoot": "d82c51a880ae0638a2bca3f166c7026804c1781b2164fe8c6fd9dd7aede191c3",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "a743761efc4fe73d93a55948244f2098ee6b6634743155211dfe230fc97e6d7f",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P3",
        "ownerModulePath": "proposed/P3-c07.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433037223b0a6578706f727420636f6e737420756e69717565436f64653d225441524745545f44455054485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226d61784465707468225d2c35293f225441524745545f44455054485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226d61784465707468225d3d353b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "d82c51a880ae0638a2bca3f166c7026804c1781b2164fe8c6fd9dd7aede191c3",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C07",
        "predicateId": "predicate_C07",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226d61784465707468225d2c35293f225441524745545f44455054485f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "dee11e8e542fc800a3d936d3410f49ea57a8c080345422680a118ccd59d2041e",
        "injectorId": "inject_C07",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226d61784465707468225d3d353b72657475726e206f75747d",
        "injectorBodySha256": "87349545ed82dfa455cbb3972f1c89d35ca9d991602d57689b0a094148523290",
        "leafId": "validateTargetDepth",
        "leafFunctionIdentityRoot": "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
      },
      "uniqueCode": "TARGET_DEPTH_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "8b4104f0d909018c2e301690e97c9247d1f418e83efae7fd7bca02033701a1a4",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "f9e7307053e6f7e1bf3975659cfe60ec8e90207ca12aa732ecb6384247366165",
          "disabledLeaf": null,
          "expected": "TARGET_DEPTH_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "f9e7307053e6f7e1bf3975659cfe60ec8e90207ca12aa732ecb6384247366165",
          "disabledLeafFunctionIdentityRoot": "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "f9e7307053e6f7e1bf3975659cfe60ec8e90207ca12aa732ecb6384247366165",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "8b4104f0d909018c2e301690e97c9247d1f418e83efae7fd7bca02033701a1a4",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 252,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C08",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C08",
      "domainId": "DM-C08",
      "sourceSchemaId": "SCHEMA-C08-V1",
      "productionKind": "CompleteProductV8",
      "destinationPath": "/offset",
      "productionBeforeRoot": "3ea4bdec4aba59d048cc336d3c9cf4526d9043fe2e5ad400c71f36fe21a07271",
      "productionAfterRoot": "cd6f0ac3cccf6cd7aa2b963257035107b79b5e0594f16da7b53d35cef5981d5b",
      "projectionJoinRoot": "9f46748cd9791bdb08d3826f3b27400885e52432ec2f428475f6101876ab45da",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C08",
        "fixtureId": "FX-C08",
        "domainId": "DM-C08",
        "schemaId": "SCHEMA-C08-V1",
        "productionBeforeRoot": "3ea4bdec4aba59d048cc336d3c9cf4526d9043fe2e5ad400c71f36fe21a07271",
        "productionAfterRoot": "cd6f0ac3cccf6cd7aa2b963257035107b79b5e0594f16da7b53d35cef5981d5b",
        "projectionJoinRoot": "9f46748cd9791bdb08d3826f3b27400885e52432ec2f428475f6101876ab45da",
        "injectorModuleRoot": "6220af0be5671a70c15641801c2d299334690c27d064b7d92196d848253211f2",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "5ee829429a8b139235dc9bbfd9a6a270d582230cf422fae90c8c245fbad12e16",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P3",
        "ownerModulePath": "proposed/P3-c08.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433038223b0a6578706f727420636f6e737420756e69717565436f64653d225441524745545f50524f445543545f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226f6666736574225d2c32293f225441524745545f50524f445543545f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226f6666736574225d3d323b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "6220af0be5671a70c15641801c2d299334690c27d064b7d92196d848253211f2",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C08",
        "predicateId": "predicate_C08",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226f6666736574225d2c32293f225441524745545f50524f445543545f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "7d930da488cd66097cc7c131aa31c9079c3d76ff9b3e0b791e59f682e06c2fb7",
        "injectorId": "inject_C08",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226f6666736574225d3d323b72657475726e206f75747d",
        "injectorBodySha256": "46f598575280022100ba85c93f134e76e6067fc3dc9d841c26d618d411feefc7",
        "leafId": "validateTargetProduct",
        "leafFunctionIdentityRoot": "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
      },
      "uniqueCode": "TARGET_PRODUCT_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "3ea4bdec4aba59d048cc336d3c9cf4526d9043fe2e5ad400c71f36fe21a07271",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "cd6f0ac3cccf6cd7aa2b963257035107b79b5e0594f16da7b53d35cef5981d5b",
          "disabledLeaf": null,
          "expected": "TARGET_PRODUCT_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "cd6f0ac3cccf6cd7aa2b963257035107b79b5e0594f16da7b53d35cef5981d5b",
          "disabledLeafFunctionIdentityRoot": "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "cd6f0ac3cccf6cd7aa2b963257035107b79b5e0594f16da7b53d35cef5981d5b",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "3ea4bdec4aba59d048cc336d3c9cf4526d9043fe2e5ad400c71f36fe21a07271",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 294,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C09",
      "profile": "VALUE_REBASE",
      "fixtureId": "FX-C09",
      "domainId": "DM-C09",
      "sourceSchemaId": "SCHEMA-C09-V1",
      "productionKind": "ObservedEventV8",
      "destinationPath": "/events/0/occurrence",
      "productionBeforeRoot": "f5717ec430cfa3b9b2ca39d27362b6e03a22c155c7003042f386dca45cae2f03",
      "productionAfterRoot": "5b0ad511d1baff8aa9f1068620930c66bb3518aeff16c92dcb92bf4b6b077978",
      "projectionJoinRoot": "cc7648214a836470e6f9ad2d4e246686359ba63396e70da04a5debc559fb4901",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C09",
        "fixtureId": "FX-C09",
        "domainId": "DM-C09",
        "schemaId": "SCHEMA-C09-V1",
        "productionBeforeRoot": "f5717ec430cfa3b9b2ca39d27362b6e03a22c155c7003042f386dca45cae2f03",
        "productionAfterRoot": "5b0ad511d1baff8aa9f1068620930c66bb3518aeff16c92dcb92bf4b6b077978",
        "projectionJoinRoot": "cc7648214a836470e6f9ad2d4e246686359ba63396e70da04a5debc559fb4901",
        "injectorModuleRoot": "835dd51741428bd193c1bb70bc9f0c8d9c38ca2b84b05aa045121895a4a9db5b",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "a519766799c504419f5665e3e68f91f28f8bc531dc70cf4599889d08e8f46340",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P4",
        "ownerModulePath": "proposed/P4-c09.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433039223b0a6578706f727420636f6e737420756e69717565436f64653d224546464543545f4f4343555252454e43455f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226576656e7473225d5b305d5b226f6363757272656e6365225d2c31293f224546464543545f4f4343555252454e43455f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226576656e7473225d5b305d5b226f6363757272656e6365225d3d313b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "835dd51741428bd193c1bb70bc9f0c8d9c38ca2b84b05aa045121895a4a9db5b",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C09",
        "predicateId": "predicate_C09",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226576656e7473225d5b305d5b226f6363757272656e6365225d2c31293f224546464543545f4f4343555252454e43455f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "b452d66a2e61d9b5553648d048043b4a7ea17907a40989cc6eaf7f2ce55687a3",
        "injectorId": "inject_C09",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226576656e7473225d5b305d5b226f6363757272656e6365225d3d313b72657475726e206f75747d",
        "injectorBodySha256": "b778501093c3c50fe83782964eb811e7e7948b626a170d071fa91b693c2e1aee",
        "leafId": "validateEffectOccurrence",
        "leafFunctionIdentityRoot": "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
      },
      "uniqueCode": "EFFECT_OCCURRENCE_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "f5717ec430cfa3b9b2ca39d27362b6e03a22c155c7003042f386dca45cae2f03",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "5b0ad511d1baff8aa9f1068620930c66bb3518aeff16c92dcb92bf4b6b077978",
          "disabledLeaf": null,
          "expected": "EFFECT_OCCURRENCE_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "5b0ad511d1baff8aa9f1068620930c66bb3518aeff16c92dcb92bf4b6b077978",
          "disabledLeafFunctionIdentityRoot": "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "5b0ad511d1baff8aa9f1068620930c66bb3518aeff16c92dcb92bf4b6b077978",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "f5717ec430cfa3b9b2ca39d27362b6e03a22c155c7003042f386dca45cae2f03",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 336,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C10",
      "profile": "PREPIN_REBASE",
      "fixtureId": "FX-C10",
      "domainId": "DM-C10",
      "sourceSchemaId": "SCHEMA-C10-V1",
      "productionKind": "InputAuthorityPinV8",
      "destinationPath": "/role",
      "productionBeforeRoot": "acb56ddd4722ec8ff3f82d22f8f9d610d7746b0d57d6113da9e7e38cb2323a63",
      "productionAfterRoot": "b6b76fdb205e3e6989bc117d6398e605d2a26cc52ed61242ce10aefeb329e0b8",
      "projectionJoinRoot": "2df275d0f37c122aa1a153ab34249a30b8373af98cf366178d0e097a10371a37",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C10",
        "fixtureId": "FX-C10",
        "domainId": "DM-C10",
        "schemaId": "SCHEMA-C10-V1",
        "productionBeforeRoot": "acb56ddd4722ec8ff3f82d22f8f9d610d7746b0d57d6113da9e7e38cb2323a63",
        "productionAfterRoot": "b6b76fdb205e3e6989bc117d6398e605d2a26cc52ed61242ce10aefeb329e0b8",
        "projectionJoinRoot": "2df275d0f37c122aa1a153ab34249a30b8373af98cf366178d0e097a10371a37",
        "injectorModuleRoot": "dc49158fc549fcf2ae031c84d359098c5a173e65e2cad1353ae520964242dce7",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "77025fba452d011dc43461cb85000dbb8134b76bdc77bedd4ba56be0016a4108",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P5",
        "ownerModulePath": "proposed/P5-c10.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433130223b0a6578706f727420636f6e737420756e69717565436f64653d2252554e5f524f4c455f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22726f6c65225d2c22636f6e74726f6c22293f2252554e5f524f4c455f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22726f6c65225d3d22636f6e74726f6c223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "dc49158fc549fcf2ae031c84d359098c5a173e65e2cad1353ae520964242dce7",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C10",
        "predicateId": "predicate_C10",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22726f6c65225d2c22636f6e74726f6c22293f2252554e5f524f4c455f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "9e086e79ba4d866869dd58a460683f90adae8ea7be6704d40faafaf39e1f8963",
        "injectorId": "inject_C10",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22726f6c65225d3d22636f6e74726f6c223b72657475726e206f75747d",
        "injectorBodySha256": "39e6ae9157cc29e45a7b9cd29280387c3deb31c6435bf7cb5fcbdeb195125553",
        "leafId": "validatePlanRole",
        "leafFunctionIdentityRoot": "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
      },
      "uniqueCode": "RUN_ROLE_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "acb56ddd4722ec8ff3f82d22f8f9d610d7746b0d57d6113da9e7e38cb2323a63",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "b6b76fdb205e3e6989bc117d6398e605d2a26cc52ed61242ce10aefeb329e0b8",
          "disabledLeaf": null,
          "expected": "RUN_ROLE_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "b6b76fdb205e3e6989bc117d6398e605d2a26cc52ed61242ce10aefeb329e0b8",
          "disabledLeafFunctionIdentityRoot": "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "b6b76fdb205e3e6989bc117d6398e605d2a26cc52ed61242ce10aefeb329e0b8",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "acb56ddd4722ec8ff3f82d22f8f9d610d7746b0d57d6113da9e7e38cb2323a63",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 378,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C11",
      "profile": "PREPIN_REBASE",
      "fixtureId": "FX-C11",
      "domainId": "DM-C11",
      "sourceSchemaId": "SCHEMA-C11-V1",
      "productionKind": "InputAuthorityPinV8",
      "destinationPath": "/inputMembers/0/bytes",
      "productionBeforeRoot": "21b7bc763d057b49c634b9edc4551a04ed1f631bf0f4d5a290a82d0296e012ad",
      "productionAfterRoot": "69f8e56ee9e37badbb86f74bc5174af347c64c700a5759a53643d0f006410e3b",
      "projectionJoinRoot": "0a4f07f8dc915ea4447ce785f51d6dd8925a010c4daf314d6c494bde05da0550",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C11",
        "fixtureId": "FX-C11",
        "domainId": "DM-C11",
        "schemaId": "SCHEMA-C11-V1",
        "productionBeforeRoot": "21b7bc763d057b49c634b9edc4551a04ed1f631bf0f4d5a290a82d0296e012ad",
        "productionAfterRoot": "69f8e56ee9e37badbb86f74bc5174af347c64c700a5759a53643d0f006410e3b",
        "projectionJoinRoot": "0a4f07f8dc915ea4447ce785f51d6dd8925a010c4daf314d6c494bde05da0550",
        "injectorModuleRoot": "0e1ae076f12b8b9c14a6ac66ba50cf4db2e4feddaaeb7efc3f4d57da2975c9e5",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "1f6aeb0ee3247ce75e8dd657afc0a112a9e268628cc36c128c033b9d44498177",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P5",
        "ownerModulePath": "proposed/P5-c11.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433131223b0a6578706f727420636f6e737420756e69717565436f64653d22494e5055545f415554484f524954595f50494e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22696e7075744d656d62657273225d5b305d5b226279746573225d2c32293f22494e5055545f415554484f524954595f50494e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22696e7075744d656d62657273225d5b305d5b226279746573225d3d323b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "0e1ae076f12b8b9c14a6ac66ba50cf4db2e4feddaaeb7efc3f4d57da2975c9e5",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C11",
        "predicateId": "predicate_C11",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22696e7075744d656d62657273225d5b305d5b226279746573225d2c32293f22494e5055545f415554484f524954595f50494e5f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "4fb3932366220c25c06efab508dfa1eccf6e5a5cd27bc2a2ec90591049341752",
        "injectorId": "inject_C11",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22696e7075744d656d62657273225d5b305d5b226279746573225d3d323b72657475726e206f75747d",
        "injectorBodySha256": "3028847f8c4b1da09ca47773280f79e90088ea04e75be68dbae7cf45d5b8618d",
        "leafId": "validateInputAuthorityPin",
        "leafFunctionIdentityRoot": "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
      },
      "uniqueCode": "INPUT_AUTHORITY_PIN_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "21b7bc763d057b49c634b9edc4551a04ed1f631bf0f4d5a290a82d0296e012ad",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "69f8e56ee9e37badbb86f74bc5174af347c64c700a5759a53643d0f006410e3b",
          "disabledLeaf": null,
          "expected": "INPUT_AUTHORITY_PIN_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "69f8e56ee9e37badbb86f74bc5174af347c64c700a5759a53643d0f006410e3b",
          "disabledLeafFunctionIdentityRoot": "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "69f8e56ee9e37badbb86f74bc5174af347c64c700a5759a53643d0f006410e3b",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "21b7bc763d057b49c634b9edc4551a04ed1f631bf0f4d5a290a82d0296e012ad",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 420,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C12",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C12",
      "domainId": "DM-C12",
      "sourceSchemaId": "SCHEMA-C12-V1",
      "productionKind": "CommandCaptureV8",
      "destinationPath": "/actualArgv0",
      "productionBeforeRoot": "8224c8bbd9ced92e3350b1d7bd8fc66773e9453c8491676cc18e9a307192e41b",
      "productionAfterRoot": "1ff2e6390a81ce64fc5b591286b204cd50726970494102edb1b41b75d5b95676",
      "projectionJoinRoot": "4f1aa8fe0e42e7eeffb28ffdb1082409d9972eac461e34d5aca5df6265d1c020",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C12",
        "fixtureId": "FX-C12",
        "domainId": "DM-C12",
        "schemaId": "SCHEMA-C12-V1",
        "productionBeforeRoot": "8224c8bbd9ced92e3350b1d7bd8fc66773e9453c8491676cc18e9a307192e41b",
        "productionAfterRoot": "1ff2e6390a81ce64fc5b591286b204cd50726970494102edb1b41b75d5b95676",
        "projectionJoinRoot": "4f1aa8fe0e42e7eeffb28ffdb1082409d9972eac461e34d5aca5df6265d1c020",
        "injectorModuleRoot": "e4586376aa3735a6bb9fad86537cd66b943d3a61c10879dfb98dbd93f900e345",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "6ecc4ad4d7627e358c9c48bf0a19a4d7af4b6d64bbae22da4fb7317e3b5fa709",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P5",
        "ownerModulePath": "proposed/P5-c12.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433132223b0a6578706f727420636f6e737420756e69717565436f64653d22434f4d4d414e445f454e56454c4f50455f434150545552455f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2261637475616c4172677630225d2c222f6f70742f6e6f64652d6d7574616e7422293f22434f4d4d414e445f454e56454c4f50455f434150545552455f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2261637475616c4172677630225d3d222f6f70742f6e6f64652d6d7574616e74223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "e4586376aa3735a6bb9fad86537cd66b943d3a61c10879dfb98dbd93f900e345",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C12",
        "predicateId": "predicate_C12",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2261637475616c4172677630225d2c222f6f70742f6e6f64652d6d7574616e7422293f22434f4d4d414e445f454e56454c4f50455f434150545552455f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "6627940afc39e0045dc9b6b6343d8d82e99611ce5deedb5fa43f5b7a32c10e10",
        "injectorId": "inject_C12",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2261637475616c4172677630225d3d222f6f70742f6e6f64652d6d7574616e74223b72657475726e206f75747d",
        "injectorBodySha256": "f01513e6da10e655ba109c5c04eb4a5d48e3b44bd85afc9e1c0f8b7db19f6213",
        "leafId": "validateCommandEnvelopeCapture",
        "leafFunctionIdentityRoot": "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
      },
      "uniqueCode": "COMMAND_ENVELOPE_CAPTURE_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "8224c8bbd9ced92e3350b1d7bd8fc66773e9453c8491676cc18e9a307192e41b",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "1ff2e6390a81ce64fc5b591286b204cd50726970494102edb1b41b75d5b95676",
          "disabledLeaf": null,
          "expected": "COMMAND_ENVELOPE_CAPTURE_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "1ff2e6390a81ce64fc5b591286b204cd50726970494102edb1b41b75d5b95676",
          "disabledLeafFunctionIdentityRoot": "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "1ff2e6390a81ce64fc5b591286b204cd50726970494102edb1b41b75d5b95676",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "8224c8bbd9ced92e3350b1d7bd8fc66773e9453c8491676cc18e9a307192e41b",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 462,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C13",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C13",
      "domainId": "DM-C13",
      "sourceSchemaId": "SCHEMA-C13-V1",
      "productionKind": "ObservationSealAuthorityV8",
      "destinationPath": "/seal/chronologyOrdinal",
      "productionBeforeRoot": "d40f9f673c844b0d3ab304acabf8751dfce9ea727363ce3af2806def14330d2e",
      "productionAfterRoot": "c747618b70a74be567467452a260b44dad485c07732ad2a295c2b05bbbbdf42d",
      "projectionJoinRoot": "3ba12d609ace4fcf76a018a5ace4d65a551a4eeb0e3f52c8e1e01327370e2f42",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C13",
        "fixtureId": "FX-C13",
        "domainId": "DM-C13",
        "schemaId": "SCHEMA-C13-V1",
        "productionBeforeRoot": "d40f9f673c844b0d3ab304acabf8751dfce9ea727363ce3af2806def14330d2e",
        "productionAfterRoot": "c747618b70a74be567467452a260b44dad485c07732ad2a295c2b05bbbbdf42d",
        "projectionJoinRoot": "3ba12d609ace4fcf76a018a5ace4d65a551a4eeb0e3f52c8e1e01327370e2f42",
        "injectorModuleRoot": "27ef59c7c67be6e633244d983aad62e8085c825af9113ac05550179aca30fe10",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "97e458961fc923e661a4be458c217e75f6d4cf557131ee0e27b03f5ba6ed40f5",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P5",
        "ownerModulePath": "proposed/P5-c13.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433133223b0a6578706f727420636f6e737420756e69717565436f64653d2252554e5f4348524f4e4f4c4f47595f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227365616c225d5b226368726f6e6f6c6f67794f7264696e616c225d2c33293f2252554e5f4348524f4e4f4c4f47595f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227365616c225d5b226368726f6e6f6c6f67794f7264696e616c225d3d333b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "27ef59c7c67be6e633244d983aad62e8085c825af9113ac05550179aca30fe10",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C13",
        "predicateId": "predicate_C13",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227365616c225d5b226368726f6e6f6c6f67794f7264696e616c225d2c33293f2252554e5f4348524f4e4f4c4f47595f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "1f490eb77efe9d0cb59bf3fb416d10b007b941b0505248e4cc9bef2633cabb08",
        "injectorId": "inject_C13",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227365616c225d5b226368726f6e6f6c6f67794f7264696e616c225d3d333b72657475726e206f75747d",
        "injectorBodySha256": "d95533a3e81d4f176c69d67ccf05ce9ca9dbebe0b3ad11c7b2fbf86318d86e33",
        "leafId": "validateRunChronology",
        "leafFunctionIdentityRoot": "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
      },
      "uniqueCode": "RUN_CHRONOLOGY_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "d40f9f673c844b0d3ab304acabf8751dfce9ea727363ce3af2806def14330d2e",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "c747618b70a74be567467452a260b44dad485c07732ad2a295c2b05bbbbdf42d",
          "disabledLeaf": null,
          "expected": "RUN_CHRONOLOGY_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "c747618b70a74be567467452a260b44dad485c07732ad2a295c2b05bbbbdf42d",
          "disabledLeafFunctionIdentityRoot": "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "c747618b70a74be567467452a260b44dad485c07732ad2a295c2b05bbbbdf42d",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "d40f9f673c844b0d3ab304acabf8751dfce9ea727363ce3af2806def14330d2e",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 504,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C14",
      "profile": "PREPIN_REBASE",
      "fixtureId": "FX-C14",
      "domainId": "DM-C14",
      "sourceSchemaId": "SCHEMA-C14-V1",
      "productionKind": "InputAuthorityPinV8",
      "destinationPath": "/capabilitySurfaceIds",
      "productionBeforeRoot": "acb56ddd4722ec8ff3f82d22f8f9d610d7746b0d57d6113da9e7e38cb2323a63",
      "productionAfterRoot": "2fe972f561b33a73d23df9a38d62db033ed32ed26a629a2ee29f8a7038418681",
      "projectionJoinRoot": "ec20313fcd0f5efb156c4b62f4440ca9362f35c0508d97fddf7ce07e0ecfbf81",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C14",
        "fixtureId": "FX-C14",
        "domainId": "DM-C14",
        "schemaId": "SCHEMA-C14-V1",
        "productionBeforeRoot": "acb56ddd4722ec8ff3f82d22f8f9d610d7746b0d57d6113da9e7e38cb2323a63",
        "productionAfterRoot": "2fe972f561b33a73d23df9a38d62db033ed32ed26a629a2ee29f8a7038418681",
        "projectionJoinRoot": "ec20313fcd0f5efb156c4b62f4440ca9362f35c0508d97fddf7ce07e0ecfbf81",
        "injectorModuleRoot": "da0a6f086afab42a3df91e6eccc3afee8246c5b10cbb34f1f5d8a8a17ed71876",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "2e519ef748bbc680e9666895bb1cce1b4ce292895550d1f21a1e84d0d00ce8e5",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P5",
        "ownerModulePath": "proposed/P5-c14.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433134223b0a6578706f727420636f6e737420756e69717565436f64653d224341504142494c4954595f49534f4c4154494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226361706162696c69747953757266616365496473225d2c5b226e6574776f726b3a616e79225d293f224341504142494c4954595f49534f4c4154494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226361706162696c69747953757266616365496473225d3d5b226e6574776f726b3a616e79225d3b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "da0a6f086afab42a3df91e6eccc3afee8246c5b10cbb34f1f5d8a8a17ed71876",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C14",
        "predicateId": "predicate_C14",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226361706162696c69747953757266616365496473225d2c5b226e6574776f726b3a616e79225d293f224341504142494c4954595f49534f4c4154494f4e5f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "b151a7dfc754a40e2a230041d2137cdcfea6c845c93263f95d99e4b6dac4549b",
        "injectorId": "inject_C14",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226361706162696c69747953757266616365496473225d3d5b226e6574776f726b3a616e79225d3b72657475726e206f75747d",
        "injectorBodySha256": "1d1fcae47bc0a6d1402b6e257f5ca4bcdfdc97292cf27e7b04c301f84db8790f",
        "leafId": "validateCapabilityIsolation",
        "leafFunctionIdentityRoot": "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
      },
      "uniqueCode": "CAPABILITY_ISOLATION_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "acb56ddd4722ec8ff3f82d22f8f9d610d7746b0d57d6113da9e7e38cb2323a63",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "2fe972f561b33a73d23df9a38d62db033ed32ed26a629a2ee29f8a7038418681",
          "disabledLeaf": null,
          "expected": "CAPABILITY_ISOLATION_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "2fe972f561b33a73d23df9a38d62db033ed32ed26a629a2ee29f8a7038418681",
          "disabledLeafFunctionIdentityRoot": "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "2fe972f561b33a73d23df9a38d62db033ed32ed26a629a2ee29f8a7038418681",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "acb56ddd4722ec8ff3f82d22f8f9d610d7746b0d57d6113da9e7e38cb2323a63",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 546,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C15",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C15",
      "domainId": "DM-C15",
      "sourceSchemaId": "SCHEMA-C15-V1",
      "productionKind": "CommandCaptureV8",
      "destinationPath": "/invocationAuthority/callbackClosureRoot",
      "productionBeforeRoot": "cb5f1613339d693dc6341af4f3fc0f1fb59e209abed9992024551d5e568c4f07",
      "productionAfterRoot": "67a073f8943a4cbd532abce77a8332232b3e955f1f6e3380b8a6fe8463078c3d",
      "projectionJoinRoot": "93c9bc7dbde71165b37897e4557616dfa8d2c0a2b7667d71673d0b8593649b36",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C15",
        "fixtureId": "FX-C15",
        "domainId": "DM-C15",
        "schemaId": "SCHEMA-C15-V1",
        "productionBeforeRoot": "cb5f1613339d693dc6341af4f3fc0f1fb59e209abed9992024551d5e568c4f07",
        "productionAfterRoot": "67a073f8943a4cbd532abce77a8332232b3e955f1f6e3380b8a6fe8463078c3d",
        "projectionJoinRoot": "93c9bc7dbde71165b37897e4557616dfa8d2c0a2b7667d71673d0b8593649b36",
        "injectorModuleRoot": "175e6d45ba3d53c2d739c5f1869889f8979f16305d7140c287df1d6c6d4c5da3",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "ef6960eca493eb20245cfc4b8a320b58e81d9ec8cdbaed375626571e9b316d87",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P5",
        "ownerModulePath": "proposed/P5-c15.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433135223b0a6578706f727420636f6e737420756e69717565436f64653d22494e564f434154494f4e5f415554484f524954595f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22696e766f636174696f6e417574686f72697479225d5b2263616c6c6261636b436c6f73757265526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f22494e564f434154494f4e5f415554484f524954595f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22696e766f636174696f6e417574686f72697479225d5b2263616c6c6261636b436c6f73757265526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "175e6d45ba3d53c2d739c5f1869889f8979f16305d7140c287df1d6c6d4c5da3",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C15",
        "predicateId": "predicate_C15",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22696e766f636174696f6e417574686f72697479225d5b2263616c6c6261636b436c6f73757265526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f22494e564f434154494f4e5f415554484f524954595f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "08204e11fd9666d379dde23eaa6aceb9cd5ab46ed23cca9f10c20a56d70bd13d",
        "injectorId": "inject_C15",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22696e766f636174696f6e417574686f72697479225d5b2263616c6c6261636b436c6f73757265526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d",
        "injectorBodySha256": "8bd7068e6b384d2f70a09b28e4c55f503eadbbe6f56e1b355d7b54f0a7799ee5",
        "leafId": "validateInvocationAuthority",
        "leafFunctionIdentityRoot": "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
      },
      "uniqueCode": "INVOCATION_AUTHORITY_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "cb5f1613339d693dc6341af4f3fc0f1fb59e209abed9992024551d5e568c4f07",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "67a073f8943a4cbd532abce77a8332232b3e955f1f6e3380b8a6fe8463078c3d",
          "disabledLeaf": null,
          "expected": "INVOCATION_AUTHORITY_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "67a073f8943a4cbd532abce77a8332232b3e955f1f6e3380b8a6fe8463078c3d",
          "disabledLeafFunctionIdentityRoot": "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "67a073f8943a4cbd532abce77a8332232b3e955f1f6e3380b8a6fe8463078c3d",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "cb5f1613339d693dc6341af4f3fc0f1fb59e209abed9992024551d5e568c4f07",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 588,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C16",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C16",
      "domainId": "DM-C16",
      "sourceSchemaId": "SCHEMA-C16-V1",
      "productionKind": "CommandCaptureV8",
      "destinationPath": "/freshnessAfter/fileDescriptors",
      "productionBeforeRoot": "cb752b51043c4ef09057e6fd2bba888ed6be9bb10c030fffba2cd8ae3818a66d",
      "productionAfterRoot": "a6781542d6a5a4290cf05535910078515ef58096b183df7af48cc68c215686db",
      "projectionJoinRoot": "b0a4eeae3e75ee95fb079ef65663dad39dd99e472e34729e592ad7954d6530fc",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C16",
        "fixtureId": "FX-C16",
        "domainId": "DM-C16",
        "schemaId": "SCHEMA-C16-V1",
        "productionBeforeRoot": "cb752b51043c4ef09057e6fd2bba888ed6be9bb10c030fffba2cd8ae3818a66d",
        "productionAfterRoot": "a6781542d6a5a4290cf05535910078515ef58096b183df7af48cc68c215686db",
        "projectionJoinRoot": "b0a4eeae3e75ee95fb079ef65663dad39dd99e472e34729e592ad7954d6530fc",
        "injectorModuleRoot": "73e8a94d4460049d68758f852fdb1df6c4a8d9d00f03751e0327ce00630af6f2",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "69846444fd974946fbc2cd415feedd30eec229945a1aa46ea20bd8ce4652b925",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P5",
        "ownerModulePath": "proposed/P5-c16.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433136223b0a6578706f727420636f6e737420756e69717565436f64653d2246524553484e4553535f49534f4c4154494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2266726573686e6573734166746572225d5b2266696c6544657363726970746f7273225d2c5b302c312c322c39395d293f2246524553484e4553535f49534f4c4154494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2266726573686e6573734166746572225d5b2266696c6544657363726970746f7273225d3d5b302c312c322c39395d3b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "73e8a94d4460049d68758f852fdb1df6c4a8d9d00f03751e0327ce00630af6f2",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C16",
        "predicateId": "predicate_C16",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2266726573686e6573734166746572225d5b2266696c6544657363726970746f7273225d2c5b302c312c322c39395d293f2246524553484e4553535f49534f4c4154494f4e5f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "82073948722b70dd5c3f85260206bc9cfc08bdc9c321b1cb3d5a33d14fb36188",
        "injectorId": "inject_C16",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b2266726573686e6573734166746572225d5b2266696c6544657363726970746f7273225d3d5b302c312c322c39395d3b72657475726e206f75747d",
        "injectorBodySha256": "147391420d20f5456ec339791b255b4fdeaa024eda15bcc37965b2afc4bd2ce6",
        "leafId": "validateFreshnessIsolation",
        "leafFunctionIdentityRoot": "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
      },
      "uniqueCode": "FRESHNESS_ISOLATION_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "cb752b51043c4ef09057e6fd2bba888ed6be9bb10c030fffba2cd8ae3818a66d",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "a6781542d6a5a4290cf05535910078515ef58096b183df7af48cc68c215686db",
          "disabledLeaf": null,
          "expected": "FRESHNESS_ISOLATION_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "a6781542d6a5a4290cf05535910078515ef58096b183df7af48cc68c215686db",
          "disabledLeafFunctionIdentityRoot": "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "a6781542d6a5a4290cf05535910078515ef58096b183df7af48cc68c215686db",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "cb752b51043c4ef09057e6fd2bba888ed6be9bb10c030fffba2cd8ae3818a66d",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 630,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C17",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C17",
      "domainId": "DM-C17",
      "sourceSchemaId": "SCHEMA-C17-V1",
      "productionKind": "ObservationMembershipV8",
      "destinationPath": "/descriptors/product",
      "productionBeforeRoot": "7d1a281c72bcb6379abe765adf741f6fc1d89fc7bcd785476682ed763a86e9af",
      "productionAfterRoot": "959c8fe8bdb92f06f7e442e8e9cf789de2faed4ec3e60c8fa1b48e4c2e1bb8c4",
      "projectionJoinRoot": "821dbffec47796294c9ed4783cbed1c31e516fc2d58a4c6be0a1562f218c75d6",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C17",
        "fixtureId": "FX-C17",
        "domainId": "DM-C17",
        "schemaId": "SCHEMA-C17-V1",
        "productionBeforeRoot": "7d1a281c72bcb6379abe765adf741f6fc1d89fc7bcd785476682ed763a86e9af",
        "productionAfterRoot": "959c8fe8bdb92f06f7e442e8e9cf789de2faed4ec3e60c8fa1b48e4c2e1bb8c4",
        "projectionJoinRoot": "821dbffec47796294c9ed4783cbed1c31e516fc2d58a4c6be0a1562f218c75d6",
        "injectorModuleRoot": "fc9e5df65b1696b047a18232828b9a506492ec99be410dc303439bb682973e45",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "5b8f14c9c154ebcc2c003c974a76ff6057816f4068315ba56853d1cc80710b93",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P5",
        "ownerModulePath": "proposed/P5-c17.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433137223b0a6578706f727420636f6e737420756e69717565436f64653d224f42534552564154494f4e5f4d454d424552534849505f524f4f545f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2264657363726970746f7273225d5b2270726f64756374225d2c756e646566696e6564293f224f42534552564154494f4e5f4d454d424552534849505f524f4f545f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b64656c657465206f75745b2264657363726970746f7273225d5b2270726f64756374225d3b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "fc9e5df65b1696b047a18232828b9a506492ec99be410dc303439bb682973e45",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C17",
        "predicateId": "predicate_C17",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b2264657363726970746f7273225d5b2270726f64756374225d2c756e646566696e6564293f224f42534552564154494f4e5f4d454d424552534849505f524f4f545f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "b0fb3edaa0235b64dedc892a0c68a28e0386af2fa95a656378b3bce97568953f",
        "injectorId": "inject_C17",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b64656c657465206f75745b2264657363726970746f7273225d5b2270726f64756374225d3b72657475726e206f75747d",
        "injectorBodySha256": "4a875b2bac6d47138ab01afcba571edbd11f8a3ea69f3cee1fb4e5679745ad86",
        "leafId": "validateObservationMembershipRoot",
        "leafFunctionIdentityRoot": "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
      },
      "uniqueCode": "OBSERVATION_MEMBERSHIP_ROOT_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "7d1a281c72bcb6379abe765adf741f6fc1d89fc7bcd785476682ed763a86e9af",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "959c8fe8bdb92f06f7e442e8e9cf789de2faed4ec3e60c8fa1b48e4c2e1bb8c4",
          "disabledLeaf": null,
          "expected": "OBSERVATION_MEMBERSHIP_ROOT_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "959c8fe8bdb92f06f7e442e8e9cf789de2faed4ec3e60c8fa1b48e4c2e1bb8c4",
          "disabledLeafFunctionIdentityRoot": "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "959c8fe8bdb92f06f7e442e8e9cf789de2faed4ec3e60c8fa1b48e4c2e1bb8c4",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "7d1a281c72bcb6379abe765adf741f6fc1d89fc7bcd785476682ed763a86e9af",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 672,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C18",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C18",
      "domainId": "DM-C18",
      "sourceSchemaId": "SCHEMA-C18-V1",
      "productionKind": "ObservationSealAuthorityV8",
      "destinationPath": "/observationSealRoot",
      "productionBeforeRoot": "625eb9b15e42238466c452b03dc445edc693c7fd16c9fa2a67bda2781f97c0d2",
      "productionAfterRoot": "232fd63a8bb3f164569a2d52c5f35fafbe3898405ec4eacc445a61fa3d2c4b77",
      "projectionJoinRoot": "5bfb313484708f207299437e536af40b1b8e8813e3bac1df57b25f3a083eff24",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C18",
        "fixtureId": "FX-C18",
        "domainId": "DM-C18",
        "schemaId": "SCHEMA-C18-V1",
        "productionBeforeRoot": "625eb9b15e42238466c452b03dc445edc693c7fd16c9fa2a67bda2781f97c0d2",
        "productionAfterRoot": "232fd63a8bb3f164569a2d52c5f35fafbe3898405ec4eacc445a61fa3d2c4b77",
        "projectionJoinRoot": "5bfb313484708f207299437e536af40b1b8e8813e3bac1df57b25f3a083eff24",
        "injectorModuleRoot": "a799e7c44eb01c4d3a0f38ba2ea6f7f7c534aa2a2f7166a023543f0ad0be2998",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "d8ffe169b8ff2d6cea84cd573359c762577af22954bdde7a2053beba4b328241",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P5",
        "ownerModulePath": "proposed/P5-c18.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433138223b0a6578706f727420636f6e737420756e69717565436f64653d224f42534552564154494f4e5f5345414c5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226f62736572766174696f6e5365616c526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224f42534552564154494f4e5f5345414c5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226f62736572766174696f6e5365616c526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "a799e7c44eb01c4d3a0f38ba2ea6f7f7c534aa2a2f7166a023543f0ad0be2998",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C18",
        "predicateId": "predicate_C18",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226f62736572766174696f6e5365616c526f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224f42534552564154494f4e5f5345414c5f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "ad46036a15b4aaec5de3c570f38ea930646a07cef2ce7f992314e9ab72f821c8",
        "injectorId": "inject_C18",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226f62736572766174696f6e5365616c526f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d",
        "injectorBodySha256": "bf3fdfafc609ce3f1de1b9cb77169ddb426d8cc157ccfade5d7628daf2eb0d44",
        "leafId": "validateObservationSeal",
        "leafFunctionIdentityRoot": "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
      },
      "uniqueCode": "OBSERVATION_SEAL_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "625eb9b15e42238466c452b03dc445edc693c7fd16c9fa2a67bda2781f97c0d2",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "232fd63a8bb3f164569a2d52c5f35fafbe3898405ec4eacc445a61fa3d2c4b77",
          "disabledLeaf": null,
          "expected": "OBSERVATION_SEAL_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "232fd63a8bb3f164569a2d52c5f35fafbe3898405ec4eacc445a61fa3d2c4b77",
          "disabledLeafFunctionIdentityRoot": "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "232fd63a8bb3f164569a2d52c5f35fafbe3898405ec4eacc445a61fa3d2c4b77",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "625eb9b15e42238466c452b03dc445edc693c7fd16c9fa2a67bda2781f97c0d2",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 714,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C19",
      "profile": "OBSERVATION_REBASE",
      "fixtureId": "FX-C19",
      "domainId": "DM-C19",
      "sourceSchemaId": "SCHEMA-C19-V1",
      "productionKind": "OwnerAdmissionReceiptV8",
      "destinationPath": "/message/root",
      "productionBeforeRoot": "1845ac1bc01a7afda898cbde9aa0b4343684bd4029bc482e24cf4734ff1034c6",
      "productionAfterRoot": "40a2ec82ba7cbc679056d83580db4112de4b8fbb6162676e2e1c4cb1d9ec6f92",
      "projectionJoinRoot": "9599e1d19b6f0008c28ccfb3b79f52efc64943e155a03d5a706c280afbe4bc63",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C19",
        "fixtureId": "FX-C19",
        "domainId": "DM-C19",
        "schemaId": "SCHEMA-C19-V1",
        "productionBeforeRoot": "1845ac1bc01a7afda898cbde9aa0b4343684bd4029bc482e24cf4734ff1034c6",
        "productionAfterRoot": "40a2ec82ba7cbc679056d83580db4112de4b8fbb6162676e2e1c4cb1d9ec6f92",
        "projectionJoinRoot": "9599e1d19b6f0008c28ccfb3b79f52efc64943e155a03d5a706c280afbe4bc63",
        "injectorModuleRoot": "7c393e90996b525952726027e729a9161df7e584becd00f44d2d5e1c7bf83f46",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "9650800451ec918b82f558f873f421d1faa3c8ff2e6e6678ddf8c52e8bff8124",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P5",
        "ownerModulePath": "proposed/P5-c19.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433139223b0a6578706f727420636f6e737420756e69717565436f64653d224f42534552564154494f4e5f41444d495353494f4e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226d657373616765225d5b22726f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224f42534552564154494f4e5f41444d495353494f4e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226d657373616765225d5b22726f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "7c393e90996b525952726027e729a9161df7e584becd00f44d2d5e1c7bf83f46",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C19",
        "predicateId": "predicate_C19",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b226d657373616765225d5b22726f6f74225d2c223130303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303022293f224f42534552564154494f4e5f41444d495353494f4e5f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "24c3890a94e9224f754835a4ba3592f5177da8b0380cecb7af05d33796ef07c8",
        "injectorId": "inject_C19",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b226d657373616765225d5b22726f6f74225d3d2231303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030223b72657475726e206f75747d",
        "injectorBodySha256": "4810a884564e0c0f5430b80d4e7c24d53d8cd259f8724951bad3038f35947c98",
        "leafId": "validateObservationAdmission",
        "leafFunctionIdentityRoot": "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
      },
      "uniqueCode": "OBSERVATION_ADMISSION_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "1845ac1bc01a7afda898cbde9aa0b4343684bd4029bc482e24cf4734ff1034c6",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "40a2ec82ba7cbc679056d83580db4112de4b8fbb6162676e2e1c4cb1d9ec6f92",
          "disabledLeaf": null,
          "expected": "OBSERVATION_ADMISSION_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "40a2ec82ba7cbc679056d83580db4112de4b8fbb6162676e2e1c4cb1d9ec6f92",
          "disabledLeafFunctionIdentityRoot": "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "40a2ec82ba7cbc679056d83580db4112de4b8fbb6162676e2e1c4cb1d9ec6f92",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "1845ac1bc01a7afda898cbde9aa0b4343684bd4029bc482e24cf4734ff1034c6",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 756,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C20",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C20",
      "domainId": "DM-C20",
      "sourceSchemaId": "SCHEMA-C20-V1",
      "productionKind": "RawProductionInputV8",
      "destinationPath": "/blob/bytesHex",
      "productionBeforeRoot": "9b88bb2d4cc8d7558ef5a233c8b012ff914a205f117b6bdc9b3603c4a5228a30",
      "productionAfterRoot": "04c72d0ecf97487da75ed3302983b7c31e0a0ba91601638c7a47ff91901f09cd",
      "projectionJoinRoot": "e44561b81b0fcf8f8b5f40001c9d5c97b946086965db029b22992b1837d2c187",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C20",
        "fixtureId": "FX-C20",
        "domainId": "DM-C20",
        "schemaId": "SCHEMA-C20-V1",
        "productionBeforeRoot": "9b88bb2d4cc8d7558ef5a233c8b012ff914a205f117b6bdc9b3603c4a5228a30",
        "productionAfterRoot": "04c72d0ecf97487da75ed3302983b7c31e0a0ba91601638c7a47ff91901f09cd",
        "projectionJoinRoot": "e44561b81b0fcf8f8b5f40001c9d5c97b946086965db029b22992b1837d2c187",
        "injectorModuleRoot": "ac281fc3f610c5f7e4ce4448a82b34c8e33de7ee2d06b6809e36d955bb5030e4",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "1116c9c3c9bb59719d6c8c8addfa3f056f86ba49430195c132063e531c6e3a58",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P1",
        "ownerModulePath": "proposed/P1-c20.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433230223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4455504c49434154455f4b4559223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323631323233613331326332323631323233613332376422293f2243414e4f4e4943414c5f4455504c49434154455f4b4559223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323236313232336133313263323236313232336133323764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "ac281fc3f610c5f7e4ce4448a82b34c8e33de7ee2d06b6809e36d955bb5030e4",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C20",
        "predicateId": "predicate_C20",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323631323233613331326332323631323233613332376422293f2243414e4f4e4943414c5f4455504c49434154455f4b4559223a6e756c6c7d",
        "predicateBodySha256": "c48bac901625bde565d15f7c8311e5e7c18b122d796f12cdec29d226d64301cf",
        "injectorId": "inject_C20",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323236313232336133313263323236313232336133323764223b72657475726e206f75747d",
        "injectorBodySha256": "d1a0d8fa84bd86571d0b9552a7ae7bea46a9f778648e7465920729d6ee54a870",
        "leafId": "leafDuplicateKey",
        "leafFunctionIdentityRoot": "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
      },
      "uniqueCode": "CANONICAL_DUPLICATE_KEY",
      "outcomes": {
        "baseline": {
          "instanceRoot": "9b88bb2d4cc8d7558ef5a233c8b012ff914a205f117b6bdc9b3603c4a5228a30",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "04c72d0ecf97487da75ed3302983b7c31e0a0ba91601638c7a47ff91901f09cd",
          "disabledLeaf": null,
          "expected": "CANONICAL_DUPLICATE_KEY"
        },
        "ownerSuppression": {
          "instanceRoot": "04c72d0ecf97487da75ed3302983b7c31e0a0ba91601638c7a47ff91901f09cd",
          "disabledLeafFunctionIdentityRoot": "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "04c72d0ecf97487da75ed3302983b7c31e0a0ba91601638c7a47ff91901f09cd",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "9b88bb2d4cc8d7558ef5a233c8b012ff914a205f117b6bdc9b3603c4a5228a30",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 798,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C21",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C21",
      "domainId": "DM-C21",
      "sourceSchemaId": "SCHEMA-C21-V1",
      "productionKind": "RawProductionInputV8",
      "destinationPath": "/blob/bytesHex",
      "productionBeforeRoot": "0056edf0079b26b6f374fdfcbfdf0d6d9d03c5fd78abfbc3fe13ad5f2399380e",
      "productionAfterRoot": "a74f1a7211b2c4a02107b438a9fd4db8319a645aab7d8a5f7969d35c30ffa625",
      "projectionJoinRoot": "40c5af91770017c6ab9fefe3be933bf712ae26ba78964e32f60381f757623a3d",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C21",
        "fixtureId": "FX-C21",
        "domainId": "DM-C21",
        "schemaId": "SCHEMA-C21-V1",
        "productionBeforeRoot": "0056edf0079b26b6f374fdfcbfdf0d6d9d03c5fd78abfbc3fe13ad5f2399380e",
        "productionAfterRoot": "a74f1a7211b2c4a02107b438a9fd4db8319a645aab7d8a5f7969d35c30ffa625",
        "projectionJoinRoot": "40c5af91770017c6ab9fefe3be933bf712ae26ba78964e32f60381f757623a3d",
        "injectorModuleRoot": "e1508289ccbe3c06790536c15389fe40421526ef2db63dc941f07f114865d5b9",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "8bbe908e9d30bc9972117b8a6db0a9d946cb4ce8c1ddfd4273be5aca49c367a2",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P1",
        "ownerModulePath": "proposed/P1-c21.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433231223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4e45535445445f4455504c49434154455f4b4559223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323738323233613762323236313232336133313263323236313232336133323764376422293f2243414e4f4e4943414c5f4e45535445445f4455504c49434154455f4b4559223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323237383232336137623232363132323361333132633232363132323361333237643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "e1508289ccbe3c06790536c15389fe40421526ef2db63dc941f07f114865d5b9",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C21",
        "predicateId": "predicate_C21",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323738323233613762323236313232336133313263323236313232336133323764376422293f2243414e4f4e4943414c5f4e45535445445f4455504c49434154455f4b4559223a6e756c6c7d",
        "predicateBodySha256": "f5bd596059770350a7ec40669367ccfe75e6b55722ad73f9a825c535243c93b9",
        "injectorId": "inject_C21",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323237383232336137623232363132323361333132633232363132323361333237643764223b72657475726e206f75747d",
        "injectorBodySha256": "3932858923e69044af0a5d367730fb52fbdaea994241ef165a339accea0b022f",
        "leafId": "leafNestedDuplicateKey",
        "leafFunctionIdentityRoot": "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
      },
      "uniqueCode": "CANONICAL_NESTED_DUPLICATE_KEY",
      "outcomes": {
        "baseline": {
          "instanceRoot": "0056edf0079b26b6f374fdfcbfdf0d6d9d03c5fd78abfbc3fe13ad5f2399380e",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "a74f1a7211b2c4a02107b438a9fd4db8319a645aab7d8a5f7969d35c30ffa625",
          "disabledLeaf": null,
          "expected": "CANONICAL_NESTED_DUPLICATE_KEY"
        },
        "ownerSuppression": {
          "instanceRoot": "a74f1a7211b2c4a02107b438a9fd4db8319a645aab7d8a5f7969d35c30ffa625",
          "disabledLeafFunctionIdentityRoot": "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "a74f1a7211b2c4a02107b438a9fd4db8319a645aab7d8a5f7969d35c30ffa625",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "0056edf0079b26b6f374fdfcbfdf0d6d9d03c5fd78abfbc3fe13ad5f2399380e",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 840,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C22",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C22",
      "domainId": "DM-C22",
      "sourceSchemaId": "SCHEMA-C22-V1",
      "productionKind": "RawProductionInputV8",
      "destinationPath": "/blob/bytesHex",
      "productionBeforeRoot": "a05b7d39459d74ff7a4f4b5c2789b1743e90dd46b118481207d98ec350803ea0",
      "productionAfterRoot": "fcca134c429ef613a09a52dd58a9655ced8175b1625cf00bb1f5345dad1c89f4",
      "projectionJoinRoot": "7df896181122f33fdd467bc6bcecb68c7db61f09d508357ba80bb03dfb0464ae",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C22",
        "fixtureId": "FX-C22",
        "domainId": "DM-C22",
        "schemaId": "SCHEMA-C22-V1",
        "productionBeforeRoot": "a05b7d39459d74ff7a4f4b5c2789b1743e90dd46b118481207d98ec350803ea0",
        "productionAfterRoot": "fcca134c429ef613a09a52dd58a9655ced8175b1625cf00bb1f5345dad1c89f4",
        "projectionJoinRoot": "7df896181122f33fdd467bc6bcecb68c7db61f09d508357ba80bb03dfb0464ae",
        "injectorModuleRoot": "0c92f33f01edb24017f3277ecdc3ff9464b3586a6b22e1fa21d19ce0a2580df0",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "838c4fbdc90566acaeb8426f7c0ed5b158eb0166c411747dda511e139a26f07e",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P1",
        "ownerModulePath": "proposed/P1-c22.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433232223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f455343415045445f534c415348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22323235633266323222293f2243414e4f4e4943414c5f455343415045445f534c415348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223232356332663232223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "0c92f33f01edb24017f3277ecdc3ff9464b3586a6b22e1fa21d19ce0a2580df0",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C22",
        "predicateId": "predicate_C22",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22323235633266323222293f2243414e4f4e4943414c5f455343415045445f534c415348223a6e756c6c7d",
        "predicateBodySha256": "7819f93f9a90756bc89bc4e812f3166303a36e6e0310956c299e330050d7188d",
        "injectorId": "inject_C22",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223232356332663232223b72657475726e206f75747d",
        "injectorBodySha256": "894a586ae56c259010c0c2c3d0aa2eb67da7bb96ade2d8eca98530a22f7dd453",
        "leafId": "leafEscapedSlash",
        "leafFunctionIdentityRoot": "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
      },
      "uniqueCode": "CANONICAL_ESCAPED_SLASH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "a05b7d39459d74ff7a4f4b5c2789b1743e90dd46b118481207d98ec350803ea0",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "fcca134c429ef613a09a52dd58a9655ced8175b1625cf00bb1f5345dad1c89f4",
          "disabledLeaf": null,
          "expected": "CANONICAL_ESCAPED_SLASH"
        },
        "ownerSuppression": {
          "instanceRoot": "fcca134c429ef613a09a52dd58a9655ced8175b1625cf00bb1f5345dad1c89f4",
          "disabledLeafFunctionIdentityRoot": "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "fcca134c429ef613a09a52dd58a9655ced8175b1625cf00bb1f5345dad1c89f4",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "a05b7d39459d74ff7a4f4b5c2789b1743e90dd46b118481207d98ec350803ea0",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 882,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C23",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C23",
      "domainId": "DM-C23",
      "sourceSchemaId": "SCHEMA-C23-V1",
      "productionKind": "RawProductionInputV8",
      "destinationPath": "/blob/bytesHex",
      "productionBeforeRoot": "0631b9ef82a6d49b0534096d49421f3e91a7d7195dfc1f37ace8c44e695d7669",
      "productionAfterRoot": "3c44b67f73c25d4b1e6ad053324e6bc6521a9c768b260531a380717a4028b8fd",
      "projectionJoinRoot": "99ecb46bb4f91a0661cc59f095f39f616b7b064f8f83ec508c6769be292d14ab",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C23",
        "fixtureId": "FX-C23",
        "domainId": "DM-C23",
        "schemaId": "SCHEMA-C23-V1",
        "productionBeforeRoot": "0631b9ef82a6d49b0534096d49421f3e91a7d7195dfc1f37ace8c44e695d7669",
        "productionAfterRoot": "3c44b67f73c25d4b1e6ad053324e6bc6521a9c768b260531a380717a4028b8fd",
        "projectionJoinRoot": "99ecb46bb4f91a0661cc59f095f39f616b7b064f8f83ec508c6769be292d14ab",
        "injectorModuleRoot": "509da4ec02d13e23b5b1497bdc0dae56527f0402ac8a5981af014e6011c0b332",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "0cd23757c6b0e06053131aad9112110bcb13d9b9d44a8fd0ad56636d881cac2f",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P1",
        "ownerModulePath": "proposed/P1-c23.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433233223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4845585f43415345223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223232356337353330333034363436323222293f2243414e4f4e4943414c5f4845585f43415345223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232323563373533303330343634363232223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "509da4ec02d13e23b5b1497bdc0dae56527f0402ac8a5981af014e6011c0b332",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C23",
        "predicateId": "predicate_C23",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223232356337353330333034363436323222293f2243414e4f4e4943414c5f4845585f43415345223a6e756c6c7d",
        "predicateBodySha256": "b9d431b479430e51eccb62e5c50602149bf4640d509b42ea16728b07ae6a3e59",
        "injectorId": "inject_C23",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232323563373533303330343634363232223b72657475726e206f75747d",
        "injectorBodySha256": "4f66ec103adbd65f20fa90a340f579177eebe86a4918de7109ef63baddb76437",
        "leafId": "leafLowerHex",
        "leafFunctionIdentityRoot": "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
      },
      "uniqueCode": "CANONICAL_HEX_CASE",
      "outcomes": {
        "baseline": {
          "instanceRoot": "0631b9ef82a6d49b0534096d49421f3e91a7d7195dfc1f37ace8c44e695d7669",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "3c44b67f73c25d4b1e6ad053324e6bc6521a9c768b260531a380717a4028b8fd",
          "disabledLeaf": null,
          "expected": "CANONICAL_HEX_CASE"
        },
        "ownerSuppression": {
          "instanceRoot": "3c44b67f73c25d4b1e6ad053324e6bc6521a9c768b260531a380717a4028b8fd",
          "disabledLeafFunctionIdentityRoot": "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "3c44b67f73c25d4b1e6ad053324e6bc6521a9c768b260531a380717a4028b8fd",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "0631b9ef82a6d49b0534096d49421f3e91a7d7195dfc1f37ace8c44e695d7669",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 924,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C24",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C24",
      "domainId": "DM-C24",
      "sourceSchemaId": "SCHEMA-C24-V1",
      "productionKind": "RawProductionInputV8",
      "destinationPath": "/blob/bytesHex",
      "productionBeforeRoot": "c02d0e562c14a33ba58618c2492650d5b2fe89d692e444c89c2b3e4086b1bb59",
      "productionAfterRoot": "736ad218139462e039391f26ab67e1eb2f31bcdb088351e2693ef5b577b83858",
      "projectionJoinRoot": "64cd4675f6854458c7a8139d91bb825e6a2a4abba2f13a93be81ef333cba0319",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C24",
        "fixtureId": "FX-C24",
        "domainId": "DM-C24",
        "schemaId": "SCHEMA-C24-V1",
        "productionBeforeRoot": "c02d0e562c14a33ba58618c2492650d5b2fe89d692e444c89c2b3e4086b1bb59",
        "productionAfterRoot": "736ad218139462e039391f26ab67e1eb2f31bcdb088351e2693ef5b577b83858",
        "projectionJoinRoot": "64cd4675f6854458c7a8139d91bb825e6a2a4abba2f13a93be81ef333cba0319",
        "injectorModuleRoot": "2478317d6e3a289589061580380eb04bf69a7c22b713d8f7f905b49cdcaea1bb",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "f452e6b05f22a8dce5c7dbafe00e568a9f3fb8a67f02466b59308c32b929cfc1",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P1",
        "ownerModulePath": "proposed/P1-c24.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433234223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f434f4e54524f4c5f464f524d223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223232356337353330333033303631323222293f2243414e4f4e4943414c5f434f4e54524f4c5f464f524d223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232323563373533303330333036313232223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "2478317d6e3a289589061580380eb04bf69a7c22b713d8f7f905b49cdcaea1bb",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C24",
        "predicateId": "predicate_C24",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223232356337353330333033303631323222293f2243414e4f4e4943414c5f434f4e54524f4c5f464f524d223a6e756c6c7d",
        "predicateBodySha256": "f5d7e2637fc4c8d41c21956e6c1deaad6182c765d4657418b5dc8c80223f70cf",
        "injectorId": "inject_C24",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232323563373533303330333036313232223b72657475726e206f75747d",
        "injectorBodySha256": "c3c75ad45d954f98c1d3d120f674cc4989cf900abc2ebd30dc40cc4199b4b46e",
        "leafId": "leafShortControl",
        "leafFunctionIdentityRoot": "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
      },
      "uniqueCode": "CANONICAL_CONTROL_FORM",
      "outcomes": {
        "baseline": {
          "instanceRoot": "c02d0e562c14a33ba58618c2492650d5b2fe89d692e444c89c2b3e4086b1bb59",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "736ad218139462e039391f26ab67e1eb2f31bcdb088351e2693ef5b577b83858",
          "disabledLeaf": null,
          "expected": "CANONICAL_CONTROL_FORM"
        },
        "ownerSuppression": {
          "instanceRoot": "736ad218139462e039391f26ab67e1eb2f31bcdb088351e2693ef5b577b83858",
          "disabledLeafFunctionIdentityRoot": "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "736ad218139462e039391f26ab67e1eb2f31bcdb088351e2693ef5b577b83858",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "c02d0e562c14a33ba58618c2492650d5b2fe89d692e444c89c2b3e4086b1bb59",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 966,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C25",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C25",
      "domainId": "DM-C25",
      "sourceSchemaId": "SCHEMA-C25-V1",
      "productionKind": "RawProductionInputV8",
      "destinationPath": "/blob/bytesHex",
      "productionBeforeRoot": "69b073f521396770d714374e8253f6fa97d2a39e549282608d2c4841a435e38a",
      "productionAfterRoot": "ae897d66173e2a2ca937ea904fe7dfa2817f10cceae7e76921426c88b81500c2",
      "projectionJoinRoot": "6b4db2a623b3017bbd54cfc4347ba450a85725d640919ea3bfbaeb8dd3b5d49e",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C25",
        "fixtureId": "FX-C25",
        "domainId": "DM-C25",
        "schemaId": "SCHEMA-C25-V1",
        "productionBeforeRoot": "69b073f521396770d714374e8253f6fa97d2a39e549282608d2c4841a435e38a",
        "productionAfterRoot": "ae897d66173e2a2ca937ea904fe7dfa2817f10cceae7e76921426c88b81500c2",
        "projectionJoinRoot": "6b4db2a623b3017bbd54cfc4347ba450a85725d640919ea3bfbaeb8dd3b5d49e",
        "injectorModuleRoot": "9310eb1403b2c5e71bc645d226222a18e1f0beb9140dbd50f8371f9f0257bb41",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "bb6db2a7c6f4090910c67a61d53a3052fed9bce9c25f5dab87ef04b1ca4c91dc",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P1",
        "ownerModulePath": "proposed/P1-c25.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433235223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f4b45595f4f52444552223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323632323233613332326332323631323233613331376422293f2243414e4f4e4943414c5f4b45595f4f52444552223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323236323232336133323263323236313232336133313764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "9310eb1403b2c5e71bc645d226222a18e1f0beb9140dbd50f8371f9f0257bb41",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C25",
        "predicateId": "predicate_C25",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323632323233613332326332323631323233613331376422293f2243414e4f4e4943414c5f4b45595f4f52444552223a6e756c6c7d",
        "predicateBodySha256": "485312420ab989adb6253cfebb21fcf8e94318e700a23872162269a3ba072550",
        "injectorId": "inject_C25",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323236323232336133323263323236313232336133313764223b72657475726e206f75747d",
        "injectorBodySha256": "f4912c515b7e77a431540cd0a5054b2f07ee94a00ba3c33a053c58cf6e91705a",
        "leafId": "leafKeyOrder",
        "leafFunctionIdentityRoot": "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
      },
      "uniqueCode": "CANONICAL_KEY_ORDER",
      "outcomes": {
        "baseline": {
          "instanceRoot": "69b073f521396770d714374e8253f6fa97d2a39e549282608d2c4841a435e38a",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "ae897d66173e2a2ca937ea904fe7dfa2817f10cceae7e76921426c88b81500c2",
          "disabledLeaf": null,
          "expected": "CANONICAL_KEY_ORDER"
        },
        "ownerSuppression": {
          "instanceRoot": "ae897d66173e2a2ca937ea904fe7dfa2817f10cceae7e76921426c88b81500c2",
          "disabledLeafFunctionIdentityRoot": "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "ae897d66173e2a2ca937ea904fe7dfa2817f10cceae7e76921426c88b81500c2",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "69b073f521396770d714374e8253f6fa97d2a39e549282608d2c4841a435e38a",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1008,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C26",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C26",
      "domainId": "DM-C26",
      "sourceSchemaId": "SCHEMA-C26-V1",
      "productionKind": "RawProductionInputV8",
      "destinationPath": "/blob/bytesHex",
      "productionBeforeRoot": "c7113c6852fe08509085655effb61e0b2fab81abed17d5b997868fa970b2f108",
      "productionAfterRoot": "e341830824cedd6ded978dc582302598b56b6c4d79f6f2f846da5f23e132a964",
      "projectionJoinRoot": "151a0a3e2ab45bdd36008692758189d6540ac40732c0d739fcccd20d8078fc88",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C26",
        "fixtureId": "FX-C26",
        "domainId": "DM-C26",
        "schemaId": "SCHEMA-C26-V1",
        "productionBeforeRoot": "c7113c6852fe08509085655effb61e0b2fab81abed17d5b997868fa970b2f108",
        "productionAfterRoot": "e341830824cedd6ded978dc582302598b56b6c4d79f6f2f846da5f23e132a964",
        "projectionJoinRoot": "151a0a3e2ab45bdd36008692758189d6540ac40732c0d739fcccd20d8078fc88",
        "injectorModuleRoot": "efa5215cb8702a161e4ae0d6e719f539d16cae7837750580597945d1982cab4b",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "d261da45dd64ff6dc5d5d0602a8e7f38e97961e431ff1f1a75a1cb12339e3ce8",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P1",
        "ownerModulePath": "proposed/P1-c26.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433236223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f494e54454745525f464f524d223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223330333022293f2243414e4f4e4943414c5f494e54454745525f464f524d223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2233303330223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "efa5215cb8702a161e4ae0d6e719f539d16cae7837750580597945d1982cab4b",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C26",
        "predicateId": "predicate_C26",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223330333022293f2243414e4f4e4943414c5f494e54454745525f464f524d223a6e756c6c7d",
        "predicateBodySha256": "94cc40804712c0fb2e12e91e9fa75cb501ef9044fa671c1c71b073137b112906",
        "injectorId": "inject_C26",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2233303330223b72657475726e206f75747d",
        "injectorBodySha256": "55e43a9d0b488afea927477bb3a9fdb84de516c479bed7a252b41c261ad40682",
        "leafId": "leafIntegerForm",
        "leafFunctionIdentityRoot": "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
      },
      "uniqueCode": "CANONICAL_INTEGER_FORM",
      "outcomes": {
        "baseline": {
          "instanceRoot": "c7113c6852fe08509085655effb61e0b2fab81abed17d5b997868fa970b2f108",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "e341830824cedd6ded978dc582302598b56b6c4d79f6f2f846da5f23e132a964",
          "disabledLeaf": null,
          "expected": "CANONICAL_INTEGER_FORM"
        },
        "ownerSuppression": {
          "instanceRoot": "e341830824cedd6ded978dc582302598b56b6c4d79f6f2f846da5f23e132a964",
          "disabledLeafFunctionIdentityRoot": "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "e341830824cedd6ded978dc582302598b56b6c4d79f6f2f846da5f23e132a964",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "c7113c6852fe08509085655effb61e0b2fab81abed17d5b997868fa970b2f108",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1050,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C27",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C27",
      "domainId": "DM-C27",
      "sourceSchemaId": "SCHEMA-C27-V1",
      "productionKind": "RawProductionInputV8",
      "destinationPath": "/blob/bytesHex",
      "productionBeforeRoot": "9a4d540a6030111b0665f52ab0d6262e324bfd982cb59c01ebcc9d031188c027",
      "productionAfterRoot": "234c25bcca8674631554c0bf8e5b4478f8569cd45493c9d280ab8383bac7568d",
      "projectionJoinRoot": "515c68ca1e7e4901dc8b2195e3584f76f1cc9769ccc99293a73840151dc98b92",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C27",
        "fixtureId": "FX-C27",
        "domainId": "DM-C27",
        "schemaId": "SCHEMA-C27-V1",
        "productionBeforeRoot": "9a4d540a6030111b0665f52ab0d6262e324bfd982cb59c01ebcc9d031188c027",
        "productionAfterRoot": "234c25bcca8674631554c0bf8e5b4478f8569cd45493c9d280ab8383bac7568d",
        "projectionJoinRoot": "515c68ca1e7e4901dc8b2195e3584f76f1cc9769ccc99293a73840151dc98b92",
        "injectorModuleRoot": "62b0014ed5234d4e052dd8edcecadb1c4370c94d98e87379caf9e97afc3596eb",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "c0e48b93ca70c2ff32b0ed93d4d0df4bf9b450ae20c34eb4b60220662fd42266",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P1",
        "ownerModulePath": "proposed/P1-c27.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433237223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f555446385f5343414c4152223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c2265646130383022293f2243414e4f4e4943414c5f555446385f5343414c4152223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d22656461303830223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "62b0014ed5234d4e052dd8edcecadb1c4370c94d98e87379caf9e97afc3596eb",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C27",
        "predicateId": "predicate_C27",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c2265646130383022293f2243414e4f4e4943414c5f555446385f5343414c4152223a6e756c6c7d",
        "predicateBodySha256": "d53b662eed03adba82b92007575dd4ea151e4903637a2aeb733f8952616f5a20",
        "injectorId": "inject_C27",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d22656461303830223b72657475726e206f75747d",
        "injectorBodySha256": "7da42aa8c4a79677c4d93c021d91cd83b2fbd72730f6ea8b9614eaeee25420cb",
        "leafId": "leafUtf8Scalar",
        "leafFunctionIdentityRoot": "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
      },
      "uniqueCode": "CANONICAL_UTF8_SCALAR",
      "outcomes": {
        "baseline": {
          "instanceRoot": "9a4d540a6030111b0665f52ab0d6262e324bfd982cb59c01ebcc9d031188c027",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "234c25bcca8674631554c0bf8e5b4478f8569cd45493c9d280ab8383bac7568d",
          "disabledLeaf": null,
          "expected": "CANONICAL_UTF8_SCALAR"
        },
        "ownerSuppression": {
          "instanceRoot": "234c25bcca8674631554c0bf8e5b4478f8569cd45493c9d280ab8383bac7568d",
          "disabledLeafFunctionIdentityRoot": "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "234c25bcca8674631554c0bf8e5b4478f8569cd45493c9d280ab8383bac7568d",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "9a4d540a6030111b0665f52ab0d6262e324bfd982cb59c01ebcc9d031188c027",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1092,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C28",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C28",
      "domainId": "DM-C28",
      "sourceSchemaId": "SCHEMA-C28-V1",
      "productionKind": "RawProductionInputV8",
      "destinationPath": "/blob/bytesHex",
      "productionBeforeRoot": "6232bf858131e4907efce603bbf3198e67c212becd1c27e9fd2567158b07e80a",
      "productionAfterRoot": "43bdb57007b8712266d2e4ae16226e66e4bfb9a324c038734377540f485ebcd3",
      "projectionJoinRoot": "9ade6a184911880575389bd4fa6b45bab991c41eec1c0659ac12f960f9fff061",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C28",
        "fixtureId": "FX-C28",
        "domainId": "DM-C28",
        "schemaId": "SCHEMA-C28-V1",
        "productionBeforeRoot": "6232bf858131e4907efce603bbf3198e67c212becd1c27e9fd2567158b07e80a",
        "productionAfterRoot": "43bdb57007b8712266d2e4ae16226e66e4bfb9a324c038734377540f485ebcd3",
        "projectionJoinRoot": "9ade6a184911880575389bd4fa6b45bab991c41eec1c0659ac12f960f9fff061",
        "injectorModuleRoot": "e5c80af00693bd8c2faf9092bb2fea7a05e43c45c2ee50446304e01f8da681b1",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "bf5c786060f3a0d0e1dd257db63bf8517e81b52852d86bc7efef0f6b1233915d",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P1",
        "ownerModulePath": "proposed/P1-c28.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433238223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f57484954455350414345223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223230376232323631323233613331376422293f2243414e4f4e4943414c5f57484954455350414345223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232303762323236313232336133313764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "e5c80af00693bd8c2faf9092bb2fea7a05e43c45c2ee50446304e01f8da681b1",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C28",
        "predicateId": "predicate_C28",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c223230376232323631323233613331376422293f2243414e4f4e4943414c5f57484954455350414345223a6e756c6c7d",
        "predicateBodySha256": "dcbb282e4ddcfec5a02d17842958862aa8b8c91d10bbc5b4beaa2b6014f05932",
        "injectorId": "inject_C28",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d2232303762323236313232336133313764223b72657475726e206f75747d",
        "injectorBodySha256": "fbbbe5f68f0c1ee12f2fadc4e79f145297a3f4c95fd7eaecef94a714c82eb390",
        "leafId": "leafEnvelopeWhitespace",
        "leafFunctionIdentityRoot": "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
      },
      "uniqueCode": "CANONICAL_WHITESPACE",
      "outcomes": {
        "baseline": {
          "instanceRoot": "6232bf858131e4907efce603bbf3198e67c212becd1c27e9fd2567158b07e80a",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "43bdb57007b8712266d2e4ae16226e66e4bfb9a324c038734377540f485ebcd3",
          "disabledLeaf": null,
          "expected": "CANONICAL_WHITESPACE"
        },
        "ownerSuppression": {
          "instanceRoot": "43bdb57007b8712266d2e4ae16226e66e4bfb9a324c038734377540f485ebcd3",
          "disabledLeafFunctionIdentityRoot": "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "43bdb57007b8712266d2e4ae16226e66e4bfb9a324c038734377540f485ebcd3",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "6232bf858131e4907efce603bbf3198e67c212becd1c27e9fd2567158b07e80a",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1134,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C29",
      "profile": "RAW_REBASE",
      "fixtureId": "FX-C29",
      "domainId": "DM-C29",
      "sourceSchemaId": "SCHEMA-C29-V1",
      "productionKind": "RawProductionInputV8",
      "destinationPath": "/blob/bytesHex",
      "productionBeforeRoot": "e6adbb2a684230d470736cd27258bfad5e4187b58ecd9cc881ddf3b138cad938",
      "productionAfterRoot": "bd2588ce2f342ba776f47743b790589cc443b078a72345bf7a4ba54b66a82934",
      "projectionJoinRoot": "d7865f7fa98c285e4be5274956acc578b51c3bf9076edb80c7f5c3586ee47c47",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C29",
        "fixtureId": "FX-C29",
        "domainId": "DM-C29",
        "schemaId": "SCHEMA-C29-V1",
        "productionBeforeRoot": "e6adbb2a684230d470736cd27258bfad5e4187b58ecd9cc881ddf3b138cad938",
        "productionAfterRoot": "bd2588ce2f342ba776f47743b790589cc443b078a72345bf7a4ba54b66a82934",
        "projectionJoinRoot": "d7865f7fa98c285e4be5274956acc578b51c3bf9076edb80c7f5c3586ee47c47",
        "injectorModuleRoot": "4a562d6206d88cd2beafa43f9aceee7e9bd936630e3f4dc46c29e889223c9a41",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "39cd4ee426aad0ecebee91e3fc6f04093f7ab35604f2fc9f95c5016d60b2c131",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P1",
        "ownerModulePath": "proposed/P1-c29.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433239223b0a6578706f727420636f6e737420756e69717565436f64653d2243414e4f4e4943414c5f554e4b4e4f574e5f544147223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323234323233613232373536653662366536663737366532323263323236313734323233613330376422293f2243414e4f4e4943414c5f554e4b4e4f574e5f544147223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323232343232336132323735366536623665366637373665323232633232363137343232336133303764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "4a562d6206d88cd2beafa43f9aceee7e9bd936630e3f4dc46c29e889223c9a41",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C29",
        "predicateId": "predicate_C29",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b22626c6f62225d5b226279746573486578225d2c22376232323234323233613232373536653662366536663737366532323263323236313734323233613330376422293f2243414e4f4e4943414c5f554e4b4e4f574e5f544147223a6e756c6c7d",
        "predicateBodySha256": "132f7735af3ebf9814a3cd47fe4ca636235ca16bb58fc06beeed4dd88c65add5",
        "injectorId": "inject_C29",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b22626c6f62225d5b226279746573486578225d3d223762323232343232336132323735366536623665366637373665323232633232363137343232336133303764223b72657475726e206f75747d",
        "injectorBodySha256": "fce375d1e6cde2c21241f55a64644440052d8114b384a5a62f083e7f39dcefcd",
        "leafId": "leafTaggedConstructor",
        "leafFunctionIdentityRoot": "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
      },
      "uniqueCode": "CANONICAL_UNKNOWN_TAG",
      "outcomes": {
        "baseline": {
          "instanceRoot": "e6adbb2a684230d470736cd27258bfad5e4187b58ecd9cc881ddf3b138cad938",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "bd2588ce2f342ba776f47743b790589cc443b078a72345bf7a4ba54b66a82934",
          "disabledLeaf": null,
          "expected": "CANONICAL_UNKNOWN_TAG"
        },
        "ownerSuppression": {
          "instanceRoot": "bd2588ce2f342ba776f47743b790589cc443b078a72345bf7a4ba54b66a82934",
          "disabledLeafFunctionIdentityRoot": "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "bd2588ce2f342ba776f47743b790589cc443b078a72345bf7a4ba54b66a82934",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "e6adbb2a684230d470736cd27258bfad5e4187b58ecd9cc881ddf3b138cad938",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1176,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C30",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C30",
      "domainId": "DM-C30",
      "sourceSchemaId": "SCHEMA-C30-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "935ecece4f1dc1d6f0911e6801dbfb9c503a5008f92820558247d0f8593d8903",
      "productionAfterRoot": "769714215eaf5dd95f1f6a1c43190bdbb6a331e9754bb1d4f8d2865d39d57f19",
      "projectionJoinRoot": "8ae303d9f1aff155ee71ccbf4a53756aea13ea0c7e21c8ddbe3f0bf4f4b15faa",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C30",
        "fixtureId": "FX-C30",
        "domainId": "DM-C30",
        "schemaId": "SCHEMA-C30-V1",
        "productionBeforeRoot": "935ecece4f1dc1d6f0911e6801dbfb9c503a5008f92820558247d0f8593d8903",
        "productionAfterRoot": "769714215eaf5dd95f1f6a1c43190bdbb6a331e9754bb1d4f8d2865d39d57f19",
        "projectionJoinRoot": "8ae303d9f1aff155ee71ccbf4a53756aea13ea0c7e21c8ddbe3f0bf4f4b15faa",
        "injectorModuleRoot": "48f4a79aa8169dd383cf023044b0bd5514347004b4d42cd606263cb7d7e34607",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "87dc201239e05157eb6e5065131eff4127e6c0b12949939de80e4a9883ce5b69",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c30.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433330223b0a6578706f727420636f6e737420756e69717565436f64653d22534f555243455f4d4f44554c455f534554223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232366436663634373536633635353336353734323233613562323235303330323232633232353033313232326332323530333232323263323235303333323232633232353033343232326332323530333532323263323235303336323232633232353033373232326332323530333832323564376422293f22534f555243455f4d4f44554c455f534554223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323664366636343735366336353533363537343232336135623232353033303232326332323530333132323263323235303332323232633232353033333232326332323530333432323263323235303335323232633232353033363232326332323530333732323263323235303338323235643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "48f4a79aa8169dd383cf023044b0bd5514347004b4d42cd606263cb7d7e34607",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C30",
        "predicateId": "predicate_C30",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232366436663634373536633635353336353734323233613562323235303330323232633232353033313232326332323530333232323263323235303333323232633232353033343232326332323530333532323263323235303336323232633232353033373232326332323530333832323564376422293f22534f555243455f4d4f44554c455f534554223a6e756c6c7d",
        "predicateBodySha256": "4aa640ebca7c5492a19f8dfa6e2714a435c9fe59798d85185de1e97df05a1133",
        "injectorId": "inject_C30",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323664366636343735366336353533363537343232336135623232353033303232326332323530333132323263323235303332323232633232353033333232326332323530333432323263323235303335323232633232353033363232326332323530333732323263323235303338323235643764223b72657475726e206f75747d",
        "injectorBodySha256": "8213b734ab78e079dd1d79a398707a03ee90a3109f59b48bd2c9f72143105607",
        "leafId": "leafModuleSet",
        "leafFunctionIdentityRoot": "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
      },
      "uniqueCode": "SOURCE_MODULE_SET",
      "outcomes": {
        "baseline": {
          "instanceRoot": "935ecece4f1dc1d6f0911e6801dbfb9c503a5008f92820558247d0f8593d8903",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "769714215eaf5dd95f1f6a1c43190bdbb6a331e9754bb1d4f8d2865d39d57f19",
          "disabledLeaf": null,
          "expected": "SOURCE_MODULE_SET"
        },
        "ownerSuppression": {
          "instanceRoot": "769714215eaf5dd95f1f6a1c43190bdbb6a331e9754bb1d4f8d2865d39d57f19",
          "disabledLeafFunctionIdentityRoot": "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "769714215eaf5dd95f1f6a1c43190bdbb6a331e9754bb1d4f8d2865d39d57f19",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "935ecece4f1dc1d6f0911e6801dbfb9c503a5008f92820558247d0f8593d8903",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1218,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C31",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C31",
      "domainId": "DM-C31",
      "sourceSchemaId": "SCHEMA-C31-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "3c81e202469028a2638d5fc3d23a3206e8ed04e77fded4404402717b127c9af8",
      "productionAfterRoot": "fbf4b961d6ebed5a3a6cc5762bf1e4037b09e755dcff2d77b6ad492d3491f4b2",
      "projectionJoinRoot": "6bee38031898fd930ebfaf236c5aca8ef73d6bd025a01f6636b042d770cb3bd5",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C31",
        "fixtureId": "FX-C31",
        "domainId": "DM-C31",
        "schemaId": "SCHEMA-C31-V1",
        "productionBeforeRoot": "3c81e202469028a2638d5fc3d23a3206e8ed04e77fded4404402717b127c9af8",
        "productionAfterRoot": "fbf4b961d6ebed5a3a6cc5762bf1e4037b09e755dcff2d77b6ad492d3491f4b2",
        "projectionJoinRoot": "6bee38031898fd930ebfaf236c5aca8ef73d6bd025a01f6636b042d770cb3bd5",
        "injectorModuleRoot": "035075b191e9a7ca5c4b697754bd4d3b7a3fcc090b863c762960d57031f6a377",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "2027a5007eb1508753b57956feefc7c35249a6db7e45979e1dba6af1e880da77",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c31.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433331223b0a6578706f727420636f6e737420756e69717565436f64653d22534f555243455f484153485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232373336663735373236333635343836313733363832323361323233313330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303232376422293f22534f555243455f484153485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323733366637353732363336353438363137333638323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "035075b191e9a7ca5c4b697754bd4d3b7a3fcc090b863c762960d57031f6a377",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C31",
        "predicateId": "predicate_C31",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232373336663735373236333635343836313733363832323361323233313330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303232376422293f22534f555243455f484153485f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "9483ea3ab09248a061957218404fe66715ec844be31167341e37fb9765a697ee",
        "injectorId": "inject_C31",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323733366637353732363336353438363137333638323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764223b72657475726e206f75747d",
        "injectorBodySha256": "11377dc5e6ee82f6951ad1e141bd21e3ac5b594e912c67af34b8c547853d14c0",
        "leafId": "leafSourceHash",
        "leafFunctionIdentityRoot": "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
      },
      "uniqueCode": "SOURCE_HASH_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "3c81e202469028a2638d5fc3d23a3206e8ed04e77fded4404402717b127c9af8",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "fbf4b961d6ebed5a3a6cc5762bf1e4037b09e755dcff2d77b6ad492d3491f4b2",
          "disabledLeaf": null,
          "expected": "SOURCE_HASH_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "fbf4b961d6ebed5a3a6cc5762bf1e4037b09e755dcff2d77b6ad492d3491f4b2",
          "disabledLeafFunctionIdentityRoot": "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "fbf4b961d6ebed5a3a6cc5762bf1e4037b09e755dcff2d77b6ad492d3491f4b2",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "3c81e202469028a2638d5fc3d23a3206e8ed04e77fded4404402717b127c9af8",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1260,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C32",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C32",
      "domainId": "DM-C32",
      "sourceSchemaId": "SCHEMA-C32-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "b3185da1f4033114594d9d61ecee92aae2b099eec34462ccf371481d430e68bd",
      "productionAfterRoot": "cf2e6848c682d4864f5eb036d21422761cb26e286f050c2419b892625c948a7c",
      "projectionJoinRoot": "d8f3d68b49af3db28e3b90562d5d48b5354bf98014841b1290a0b8690f099666",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C32",
        "fixtureId": "FX-C32",
        "domainId": "DM-C32",
        "schemaId": "SCHEMA-C32-V1",
        "productionBeforeRoot": "b3185da1f4033114594d9d61ecee92aae2b099eec34462ccf371481d430e68bd",
        "productionAfterRoot": "cf2e6848c682d4864f5eb036d21422761cb26e286f050c2419b892625c948a7c",
        "projectionJoinRoot": "d8f3d68b49af3db28e3b90562d5d48b5354bf98014841b1290a0b8690f099666",
        "injectorModuleRoot": "2f7cdbcdf0db490bc75916281278124629a866b9acc18ec712a05f7882bf8f6f",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "c211484f475a9ef642dad804b2560e108221482680a7a6761157cdd4b497e588",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c32.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433332223b0a6578706f727420636f6e737420756e69717565436f64653d2250524f53455f484153485f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22303122293f2250524f53455f484153485f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223031223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "2f7cdbcdf0db490bc75916281278124629a866b9acc18ec712a05f7882bf8f6f",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C32",
        "predicateId": "predicate_C32",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22303122293f2250524f53455f484153485f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "2c81cc80fa56590d3fdfff431ac422d4f57e8314002e3ff26250239363e8f252",
        "injectorId": "inject_C32",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223031223b72657475726e206f75747d",
        "injectorBodySha256": "308319041aa7734806b31dfb2c0634087b8df6644d1ae6869d9870406e634dc3",
        "leafId": "leafProseHash",
        "leafFunctionIdentityRoot": "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
      },
      "uniqueCode": "PROSE_HASH_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "b3185da1f4033114594d9d61ecee92aae2b099eec34462ccf371481d430e68bd",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "cf2e6848c682d4864f5eb036d21422761cb26e286f050c2419b892625c948a7c",
          "disabledLeaf": null,
          "expected": "PROSE_HASH_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "cf2e6848c682d4864f5eb036d21422761cb26e286f050c2419b892625c948a7c",
          "disabledLeafFunctionIdentityRoot": "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "cf2e6848c682d4864f5eb036d21422761cb26e286f050c2419b892625c948a7c",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "b3185da1f4033114594d9d61ecee92aae2b099eec34462ccf371481d430e68bd",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1302,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C33",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C33",
      "domainId": "DM-C33",
      "sourceSchemaId": "SCHEMA-C33-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "662e79958955bb15d28c6e0fccb6b0396478d5cb762735efed4f1dc4e2737c69",
      "productionAfterRoot": "2b9a42b85c571c17584d52a3272314dc772f7e13dd666aaa3ada6c3933a2978d",
      "projectionJoinRoot": "3b826ea13befb890e5db9cdfdf2ab895f434373467754eec70413a7d280e6a3f",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C33",
        "fixtureId": "FX-C33",
        "domainId": "DM-C33",
        "schemaId": "SCHEMA-C33-V1",
        "productionBeforeRoot": "662e79958955bb15d28c6e0fccb6b0396478d5cb762735efed4f1dc4e2737c69",
        "productionAfterRoot": "2b9a42b85c571c17584d52a3272314dc772f7e13dd666aaa3ada6c3933a2978d",
        "projectionJoinRoot": "3b826ea13befb890e5db9cdfdf2ab895f434373467754eec70413a7d280e6a3f",
        "injectorModuleRoot": "82822ca953ce06ffcfac3acd49c074c87bd687b7a6bf310d532537707c144b64",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "a4eede1de2bf553413409a79b7118e7e06817895cd4d8f49ab5de1174e7b526c",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c33.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433333223b0a6578706f727420636f6e737420756e69717565436f64653d22454447455f4d495353494e47223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232363536343637363537333232336137623764376422293f22454447455f4d495353494e47223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323635363436373635373332323361376237643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "82822ca953ce06ffcfac3acd49c074c87bd687b7a6bf310d532537707c144b64",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C33",
        "predicateId": "predicate_C33",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232363536343637363537333232336137623764376422293f22454447455f4d495353494e47223a6e756c6c7d",
        "predicateBodySha256": "2ae47868a060d24d3cec88c3124728556bb75fb4376ce01a6289e7f758223760",
        "injectorId": "inject_C33",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323635363436373635373332323361376237643764223b72657475726e206f75747d",
        "injectorBodySha256": "e4a00692c2bbaeb55d41b0fa76b08f85be8b0007546f1af2459e32dc8450fa00",
        "leafId": "leafEdgeGraph",
        "leafFunctionIdentityRoot": "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
      },
      "uniqueCode": "EDGE_MISSING",
      "outcomes": {
        "baseline": {
          "instanceRoot": "662e79958955bb15d28c6e0fccb6b0396478d5cb762735efed4f1dc4e2737c69",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "2b9a42b85c571c17584d52a3272314dc772f7e13dd666aaa3ada6c3933a2978d",
          "disabledLeaf": null,
          "expected": "EDGE_MISSING"
        },
        "ownerSuppression": {
          "instanceRoot": "2b9a42b85c571c17584d52a3272314dc772f7e13dd666aaa3ada6c3933a2978d",
          "disabledLeafFunctionIdentityRoot": "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "2b9a42b85c571c17584d52a3272314dc772f7e13dd666aaa3ada6c3933a2978d",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "662e79958955bb15d28c6e0fccb6b0396478d5cb762735efed4f1dc4e2737c69",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1344,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C34",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C34",
      "domainId": "DM-C34",
      "sourceSchemaId": "SCHEMA-C34-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "b77938ab02e3d89236050306d605f9b9a8ebdd523ea74dc403bfd3882f59022b",
      "productionAfterRoot": "9b29a3f945951b56c02b14ed9b6bcfae56bc06bc17db362c13501be54b8e9f92",
      "projectionJoinRoot": "988f37de4b19b1c2c684d0555e59f3bf5819cc8462d13d733caf5ad976c1ed49",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C34",
        "fixtureId": "FX-C34",
        "domainId": "DM-C34",
        "schemaId": "SCHEMA-C34-V1",
        "productionBeforeRoot": "b77938ab02e3d89236050306d605f9b9a8ebdd523ea74dc403bfd3882f59022b",
        "productionAfterRoot": "9b29a3f945951b56c02b14ed9b6bcfae56bc06bc17db362c13501be54b8e9f92",
        "projectionJoinRoot": "988f37de4b19b1c2c684d0555e59f3bf5819cc8462d13d733caf5ad976c1ed49",
        "injectorModuleRoot": "2649622e1601cd4a5ea9343599898a20ccaa7e853202a21503e86a6e1a3c0c78",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "727dbac80b7d74d66a575271863fb24eb917e29acc38b9495b39a1985249789a",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c34.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433334223b0a6578706f727420636f6e737420756e69717565436f64653d22454447455f52455645525345223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323635363436373635373332323361376232323435333233363232336137623232363436393732363536333734363936663665323233613232353033353264336535303330323237643764376422293f22454447455f52455645525345223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236353634363736353733323233613762323234353332333632323361376232323634363937323635363337343639366636653232336132323530333532643365353033303232376437643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "2649622e1601cd4a5ea9343599898a20ccaa7e853202a21503e86a6e1a3c0c78",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C34",
        "predicateId": "predicate_C34",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323635363436373635373332323361376232323435333233363232336137623232363436393732363536333734363936663665323233613232353033353264336535303330323237643764376422293f22454447455f52455645525345223a6e756c6c7d",
        "predicateBodySha256": "9ba373679df09bcad6d2c6236a4a0bc7e5783686e22a56b1f6a6b1c14d3dc665",
        "injectorId": "inject_C34",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236353634363736353733323233613762323234353332333632323361376232323634363937323635363337343639366636653232336132323530333532643365353033303232376437643764223b72657475726e206f75747d",
        "injectorBodySha256": "87320e8b0b3aee1844d6a1f4166e851554b820f568daa41398f3fb1959149bfb",
        "leafId": "leafReverseEdge",
        "leafFunctionIdentityRoot": "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
      },
      "uniqueCode": "EDGE_REVERSE",
      "outcomes": {
        "baseline": {
          "instanceRoot": "b77938ab02e3d89236050306d605f9b9a8ebdd523ea74dc403bfd3882f59022b",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "9b29a3f945951b56c02b14ed9b6bcfae56bc06bc17db362c13501be54b8e9f92",
          "disabledLeaf": null,
          "expected": "EDGE_REVERSE"
        },
        "ownerSuppression": {
          "instanceRoot": "9b29a3f945951b56c02b14ed9b6bcfae56bc06bc17db362c13501be54b8e9f92",
          "disabledLeafFunctionIdentityRoot": "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "9b29a3f945951b56c02b14ed9b6bcfae56bc06bc17db362c13501be54b8e9f92",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "b77938ab02e3d89236050306d605f9b9a8ebdd523ea74dc403bfd3882f59022b",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1386,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C35",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C35",
      "domainId": "DM-C35",
      "sourceSchemaId": "SCHEMA-C35-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "0179ef14466c4d960a323a6a43cb91d77f52a15cf8ffd9b274c5bb634ef9dceb",
      "productionAfterRoot": "a664e9fad40c8cbed3cb6eaf1d102217f69aa5cb66c0d560bbf77471ffd15448",
      "projectionJoinRoot": "7a21838415d4ce547bab5ef3a16a217bf18ba610b4b2721f5ecfc2adac1a7408",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C35",
        "fixtureId": "FX-C35",
        "domainId": "DM-C35",
        "schemaId": "SCHEMA-C35-V1",
        "productionBeforeRoot": "0179ef14466c4d960a323a6a43cb91d77f52a15cf8ffd9b274c5bb634ef9dceb",
        "productionAfterRoot": "a664e9fad40c8cbed3cb6eaf1d102217f69aa5cb66c0d560bbf77471ffd15448",
        "projectionJoinRoot": "7a21838415d4ce547bab5ef3a16a217bf18ba610b4b2721f5ecfc2adac1a7408",
        "injectorModuleRoot": "6ff39653b24d3dd6c7eb2c82aff7447a1da62f59e72851dba0f7453cbf3e19f4",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "cfc04e0135e5531f7b596732900ec26effe749cded83bec83d6dc016cbfe803c",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c35.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433335223b0a6578706f727420636f6e737420756e69717565436f64653d2244594e414d49435f494d504f5254223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236393664373036663732373437333232336135623762323236623639366536343232336132323634373936653631366436393633323237643564376422293f2244594e414d49435f494d504f5254223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363936643730366637323734373332323361356237623232366236393665363432323361323236343739366536313664363936333232376435643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "6ff39653b24d3dd6c7eb2c82aff7447a1da62f59e72851dba0f7453cbf3e19f4",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C35",
        "predicateId": "predicate_C35",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236393664373036663732373437333232336135623762323236623639366536343232336132323634373936653631366436393633323237643564376422293f2244594e414d49435f494d504f5254223a6e756c6c7d",
        "predicateBodySha256": "829b0a79cc688a7d38432b457524221b7361e547a9750df7be342258cf480310",
        "injectorId": "inject_C35",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363936643730366637323734373332323361356237623232366236393665363432323361323236343739366536313664363936333232376435643764223b72657475726e206f75747d",
        "injectorBodySha256": "99e1a1abe67144e5bd4e13ada911cb86638810aee688c11f10d5005c2dacaeda",
        "leafId": "leafDynamicImport",
        "leafFunctionIdentityRoot": "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
      },
      "uniqueCode": "DYNAMIC_IMPORT",
      "outcomes": {
        "baseline": {
          "instanceRoot": "0179ef14466c4d960a323a6a43cb91d77f52a15cf8ffd9b274c5bb634ef9dceb",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "a664e9fad40c8cbed3cb6eaf1d102217f69aa5cb66c0d560bbf77471ffd15448",
          "disabledLeaf": null,
          "expected": "DYNAMIC_IMPORT"
        },
        "ownerSuppression": {
          "instanceRoot": "a664e9fad40c8cbed3cb6eaf1d102217f69aa5cb66c0d560bbf77471ffd15448",
          "disabledLeafFunctionIdentityRoot": "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "a664e9fad40c8cbed3cb6eaf1d102217f69aa5cb66c0d560bbf77471ffd15448",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "0179ef14466c4d960a323a6a43cb91d77f52a15cf8ffd9b274c5bb634ef9dceb",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1428,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C36",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C36",
      "domainId": "DM-C36",
      "sourceSchemaId": "SCHEMA-C36-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "b49d1c121caaa51b101b1977c68ca09ad7f9218aa76e64cafde03b19b89efe31",
      "productionAfterRoot": "255f6cc8f639d18a1c8918dbc9cf6130ee1906bacbed4a14e03562dd6fab7d1f",
      "projectionJoinRoot": "c75e1e19bc34124207ca3a39843c8ca0c5d85e4091033757ea735ecf2ee25302",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C36",
        "fixtureId": "FX-C36",
        "domainId": "DM-C36",
        "schemaId": "SCHEMA-C36-V1",
        "productionBeforeRoot": "b49d1c121caaa51b101b1977c68ca09ad7f9218aa76e64cafde03b19b89efe31",
        "productionAfterRoot": "255f6cc8f639d18a1c8918dbc9cf6130ee1906bacbed4a14e03562dd6fab7d1f",
        "projectionJoinRoot": "c75e1e19bc34124207ca3a39843c8ca0c5d85e4091033757ea735ecf2ee25302",
        "injectorModuleRoot": "283af2018acd1dfbb14760cdf5212b8767796b2fb08b8d87e22005c5b72d70b6",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "d79462218cff15c9cc174e220c0ca132cf0214e08110f0693aa5c1f29e77f75d",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c36.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433336223b0a6578706f727420636f6e737420756e69717565436f64653d2244594e414d49435f434f4445223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236333631366336633733323233613562323236353736363136633238363632383239323932323564376422293f2244594e414d49435f434f4445223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363336313663366337333232336135623232363537363631366332383636323832393239323235643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "283af2018acd1dfbb14760cdf5212b8767796b2fb08b8d87e22005c5b72d70b6",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C36",
        "predicateId": "predicate_C36",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236333631366336633733323233613562323236353736363136633238363632383239323932323564376422293f2244594e414d49435f434f4445223a6e756c6c7d",
        "predicateBodySha256": "09949866a34c2776b4163649954665a167d1ef3455ab0e3acf9c3a20e43d3ec9",
        "injectorId": "inject_C36",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363336313663366337333232336135623232363537363631366332383636323832393239323235643764223b72657475726e206f75747d",
        "injectorBodySha256": "3582c1176af0582e1d4232faa23d20cdcce73119b0a32545285c8f06d9b9760a",
        "leafId": "leafDynamicCode",
        "leafFunctionIdentityRoot": "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
      },
      "uniqueCode": "DYNAMIC_CODE",
      "outcomes": {
        "baseline": {
          "instanceRoot": "b49d1c121caaa51b101b1977c68ca09ad7f9218aa76e64cafde03b19b89efe31",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "255f6cc8f639d18a1c8918dbc9cf6130ee1906bacbed4a14e03562dd6fab7d1f",
          "disabledLeaf": null,
          "expected": "DYNAMIC_CODE"
        },
        "ownerSuppression": {
          "instanceRoot": "255f6cc8f639d18a1c8918dbc9cf6130ee1906bacbed4a14e03562dd6fab7d1f",
          "disabledLeafFunctionIdentityRoot": "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "255f6cc8f639d18a1c8918dbc9cf6130ee1906bacbed4a14e03562dd6fab7d1f",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "b49d1c121caaa51b101b1977c68ca09ad7f9218aa76e64cafde03b19b89efe31",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1470,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C37",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C37",
      "domainId": "DM-C37",
      "sourceSchemaId": "SCHEMA-C37-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "4e52ebb691311b76e528693bab71840c6981848c0a4f5c81cae5a7ec1c6752f5",
      "productionAfterRoot": "ea46342940b318b0f293c85f6d81071c365e79ff0669fa87255c48fd067c89ab",
      "projectionJoinRoot": "97c9b391fa1fedb481cc61f17e5db13ad2dfafa01fbd81600f1a0998152e188f",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C37",
        "fixtureId": "FX-C37",
        "domainId": "DM-C37",
        "schemaId": "SCHEMA-C37-V1",
        "productionBeforeRoot": "4e52ebb691311b76e528693bab71840c6981848c0a4f5c81cae5a7ec1c6752f5",
        "productionAfterRoot": "ea46342940b318b0f293c85f6d81071c365e79ff0669fa87255c48fd067c89ab",
        "projectionJoinRoot": "97c9b391fa1fedb481cc61f17e5db13ad2dfafa01fbd81600f1a0998152e188f",
        "injectorModuleRoot": "f1872f9663d4d9afbb0fe3c1c838fc4f88a5d54888150f4f8edfe462732218ef",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "70a50e45944ca3a27a5195de0659e5bc2f56b68fe46da9bab5c52fce1001dd1a",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c37.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433337223b0a6578706f727420636f6e737420756e69717565436f64653d225245464c454354494f4e5f45444745223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323664363536643632363537323431363336333635373337333232336135623232353236353636366336353633373432653637363537343238366632633738323932323564376422293f225245464c454354494f4e5f45444745223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236643635366436323635373234313633363336353733373332323361356232323532363536363663363536333734326536373635373432383666326337383239323235643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "f1872f9663d4d9afbb0fe3c1c838fc4f88a5d54888150f4f8edfe462732218ef",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C37",
        "predicateId": "predicate_C37",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323664363536643632363537323431363336333635373337333232336135623232353236353636366336353633373432653637363537343238366632633738323932323564376422293f225245464c454354494f4e5f45444745223a6e756c6c7d",
        "predicateBodySha256": "6a6f91dcc7cb550e74d707cfcb520ba98afff3a96d887d26b8dab55db7d8a726",
        "injectorId": "inject_C37",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236643635366436323635373234313633363336353733373332323361356232323532363536363663363536333734326536373635373432383666326337383239323235643764223b72657475726e206f75747d",
        "injectorBodySha256": "83bfcabe6710ffbd042ec265d20728c8c240ffbade5d3c38269977d70f90780b",
        "leafId": "leafReflection",
        "leafFunctionIdentityRoot": "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
      },
      "uniqueCode": "REFLECTION_EDGE",
      "outcomes": {
        "baseline": {
          "instanceRoot": "4e52ebb691311b76e528693bab71840c6981848c0a4f5c81cae5a7ec1c6752f5",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "ea46342940b318b0f293c85f6d81071c365e79ff0669fa87255c48fd067c89ab",
          "disabledLeaf": null,
          "expected": "REFLECTION_EDGE"
        },
        "ownerSuppression": {
          "instanceRoot": "ea46342940b318b0f293c85f6d81071c365e79ff0669fa87255c48fd067c89ab",
          "disabledLeafFunctionIdentityRoot": "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "ea46342940b318b0f293c85f6d81071c365e79ff0669fa87255c48fd067c89ab",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "4e52ebb691311b76e528693bab71840c6981848c0a4f5c81cae5a7ec1c6752f5",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1512,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C38",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C38",
      "domainId": "DM-C38",
      "sourceSchemaId": "SCHEMA-C38-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "06a2cb265aeb4d6cf14a341d33458b8808aac38471177a87376a8bb82af13e2d",
      "productionAfterRoot": "c53db28e85c239ac79c883df981e6ab5ee53e4be617c7fc9059975321d2ac952",
      "projectionJoinRoot": "2957dce4f51e7732a36a2bbb0333ad31b79c513f31a110a190c133d1584b2691",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C38",
        "fixtureId": "FX-C38",
        "domainId": "DM-C38",
        "schemaId": "SCHEMA-C38-V1",
        "productionBeforeRoot": "06a2cb265aeb4d6cf14a341d33458b8808aac38471177a87376a8bb82af13e2d",
        "productionAfterRoot": "c53db28e85c239ac79c883df981e6ab5ee53e4be617c7fc9059975321d2ac952",
        "projectionJoinRoot": "2957dce4f51e7732a36a2bbb0333ad31b79c513f31a110a190c133d1584b2691",
        "injectorModuleRoot": "b0fb39be1e485ac3d89873a97752a57e12e132e09e849e2574a3d4a631fc8330",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "c06295901d688f2b0ecc588266dea10a6a85f4e7a1cff3ce8e7aa301aa5a581a",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c38.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433338223b0a6578706f727420636f6e737420756e69717565436f64653d22444550454e44454e43595f48494444454e223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323634363537303635366536343635366536333739343737323631373036383232336137623232363436353730363536653634363536653633373932643330323233613232366636643639373437343635363432323764376422293f22444550454e44454e43595f48494444454e223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236343635373036353665363436353665363337393437373236313730363832323361376232323634363537303635366536343635366536333739326433303232336132323666366436393734373436353634323237643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "b0fb39be1e485ac3d89873a97752a57e12e132e09e849e2574a3d4a631fc8330",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C38",
        "predicateId": "predicate_C38",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323634363537303635366536343635366536333739343737323631373036383232336137623232363436353730363536653634363536653633373932643330323233613232366636643639373437343635363432323764376422293f22444550454e44454e43595f48494444454e223a6e756c6c7d",
        "predicateBodySha256": "e91068fec2bbb4db6dd87201378fdb12230c70d540ed5db8996d7673b2d3e88e",
        "injectorId": "inject_C38",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236343635373036353665363436353665363337393437373236313730363832323361376232323634363537303635366536343635366536333739326433303232336132323666366436393734373436353634323237643764223b72657475726e206f75747d",
        "injectorBodySha256": "15849e5a4e71a84907e65f9807a9af825a32f585c9b0703a519c406cc22269aa",
        "leafId": "leafDependencyGraph",
        "leafFunctionIdentityRoot": "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
      },
      "uniqueCode": "DEPENDENCY_HIDDEN",
      "outcomes": {
        "baseline": {
          "instanceRoot": "06a2cb265aeb4d6cf14a341d33458b8808aac38471177a87376a8bb82af13e2d",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "c53db28e85c239ac79c883df981e6ab5ee53e4be617c7fc9059975321d2ac952",
          "disabledLeaf": null,
          "expected": "DEPENDENCY_HIDDEN"
        },
        "ownerSuppression": {
          "instanceRoot": "c53db28e85c239ac79c883df981e6ab5ee53e4be617c7fc9059975321d2ac952",
          "disabledLeafFunctionIdentityRoot": "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "c53db28e85c239ac79c883df981e6ab5ee53e4be617c7fc9059975321d2ac952",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "06a2cb265aeb4d6cf14a341d33458b8808aac38471177a87376a8bb82af13e2d",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1554,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C39",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C39",
      "domainId": "DM-C39",
      "sourceSchemaId": "SCHEMA-C39-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "6ce664e57eb94cce236985925cf173a3675b478a83139a6121c41716cc6a78ff",
      "productionAfterRoot": "c4d7a124504896b843f6babc2735639504a8e67f870de0142fb2186087ca3383",
      "projectionJoinRoot": "7de7650a60e376c3aeee80543272382d9baf10e6383ba25db11ea9bab61b8f31",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C39",
        "fixtureId": "FX-C39",
        "domainId": "DM-C39",
        "schemaId": "SCHEMA-C39-V1",
        "productionBeforeRoot": "6ce664e57eb94cce236985925cf173a3675b478a83139a6121c41716cc6a78ff",
        "productionAfterRoot": "c4d7a124504896b843f6babc2735639504a8e67f870de0142fb2186087ca3383",
        "projectionJoinRoot": "7de7650a60e376c3aeee80543272382d9baf10e6383ba25db11ea9bab61b8f31",
        "injectorModuleRoot": "ea10691634b124d66c5ff4a1c912310a969f1c5757745eab8a96f46b5176edd1",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "d15de785d8e09b47422452f3fb7434a28e224b7bfedbaa5635ed7ed86fa56f68",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c39.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433339223b0a6578706f727420636f6e737420756e69717565436f64653d22464f5242494444454e5f535542535452415445223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232373237353665373436393664363532323361376232323733373536323733373437323631373436353232336132323635373636353665373435343631373036353262373037323666366136353633373436393666366532323764376422293f22464f5242494444454e5f535542535452415445223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323732373536653734363936643635323233613762323237333735363237333734373236313734363532323361323236353736363536653734353436313730363532623730373236663661363536333734363936663665323237643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "ea10691634b124d66c5ff4a1c912310a969f1c5757745eab8a96f46b5176edd1",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C39",
        "predicateId": "predicate_C39",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232373237353665373436393664363532323361376232323733373536323733373437323631373436353232336132323635373636353665373435343631373036353262373037323666366136353633373436393666366532323764376422293f22464f5242494444454e5f535542535452415445223a6e756c6c7d",
        "predicateBodySha256": "75dcac07ca5586c3e38827be97bd0fa096d52aa310ee138a59520de6fac732f4",
        "injectorId": "inject_C39",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323732373536653734363936643635323233613762323237333735363237333734373236313734363532323361323236353736363536653734353436313730363532623730373236663661363536333734363936663665323237643764223b72657475726e206f75747d",
        "injectorBodySha256": "96e088e5447f1526d34045b58cd75909184a30a82a39d83488cfdba67a58dd92",
        "leafId": "leafForbiddenSubstrate",
        "leafFunctionIdentityRoot": "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
      },
      "uniqueCode": "FORBIDDEN_SUBSTRATE",
      "outcomes": {
        "baseline": {
          "instanceRoot": "6ce664e57eb94cce236985925cf173a3675b478a83139a6121c41716cc6a78ff",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "c4d7a124504896b843f6babc2735639504a8e67f870de0142fb2186087ca3383",
          "disabledLeaf": null,
          "expected": "FORBIDDEN_SUBSTRATE"
        },
        "ownerSuppression": {
          "instanceRoot": "c4d7a124504896b843f6babc2735639504a8e67f870de0142fb2186087ca3383",
          "disabledLeafFunctionIdentityRoot": "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "c4d7a124504896b843f6babc2735639504a8e67f870de0142fb2186087ca3383",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "6ce664e57eb94cce236985925cf173a3675b478a83139a6121c41716cc6a78ff",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1596,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C40",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C40",
      "domainId": "DM-C40",
      "sourceSchemaId": "SCHEMA-C40-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "38d959f008bba3260a9a3856357f58def774dc2925dfa4f383b482e23bd17c4b",
      "productionAfterRoot": "b08861ef7f6784a6371a7dcbdf6c1292b0a9bab4fc2d1198ca8346388a440bb8",
      "projectionJoinRoot": "f37e466e0dd44defeda3331817cb009e268d092a8d00f8c58cf5dfa0147ee664",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C40",
        "fixtureId": "FX-C40",
        "domainId": "DM-C40",
        "schemaId": "SCHEMA-C40-V1",
        "productionBeforeRoot": "38d959f008bba3260a9a3856357f58def774dc2925dfa4f383b482e23bd17c4b",
        "productionAfterRoot": "b08861ef7f6784a6371a7dcbdf6c1292b0a9bab4fc2d1198ca8346388a440bb8",
        "projectionJoinRoot": "f37e466e0dd44defeda3331817cb009e268d092a8d00f8c58cf5dfa0147ee664",
        "injectorModuleRoot": "80b9d0f97fbbfef1fa2c7a42c0db2a04092284de7c8f0520b74dc99b15203312",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "633132a9d99753cf500f61c8702b3cae9c29d8a96ed56f4eb51e9ee5e649fc54",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c40.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433430223b0a6578706f727420636f6e737420756e69717565436f64653d224d4f44554c455f4c4f435f4558434545444544223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232366436663634373536633635373332323361376232323530333532323361376232323633363836313732363736353634346336663633323233613338333637643764376422293f224d4f44554c455f4c4f435f4558434545444544223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323664366636343735366336353733323233613762323235303335323233613762323236333638363137323637363536343463366636333232336133383336376437643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "80b9d0f97fbbfef1fa2c7a42c0db2a04092284de7c8f0520b74dc99b15203312",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C40",
        "predicateId": "predicate_C40",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c2237623232366436663634373536633635373332323361376232323530333532323361376232323633363836313732363736353634346336663633323233613338333637643764376422293f224d4f44554c455f4c4f435f4558434545444544223a6e756c6c7d",
        "predicateBodySha256": "f1e270e74262aba0e6d26c524822f395df7979aa820f897744717040ddf2344e",
        "injectorId": "inject_C40",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d22376232323664366636343735366336353733323233613762323235303335323233613762323236333638363137323637363536343463366636333232336133383336376437643764223b72657475726e206f75747d",
        "injectorBodySha256": "8055b16515d4d4167e58980a47f1ecbf302d543eee8ed0aeeaf53aa0443f32c2",
        "leafId": "leafModuleBudget",
        "leafFunctionIdentityRoot": "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
      },
      "uniqueCode": "MODULE_LOC_EXCEEDED",
      "outcomes": {
        "baseline": {
          "instanceRoot": "38d959f008bba3260a9a3856357f58def774dc2925dfa4f383b482e23bd17c4b",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "b08861ef7f6784a6371a7dcbdf6c1292b0a9bab4fc2d1198ca8346388a440bb8",
          "disabledLeaf": null,
          "expected": "MODULE_LOC_EXCEEDED"
        },
        "ownerSuppression": {
          "instanceRoot": "b08861ef7f6784a6371a7dcbdf6c1292b0a9bab4fc2d1198ca8346388a440bb8",
          "disabledLeafFunctionIdentityRoot": "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "b08861ef7f6784a6371a7dcbdf6c1292b0a9bab4fc2d1198ca8346388a440bb8",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "38d959f008bba3260a9a3856357f58def774dc2925dfa4f383b482e23bd17c4b",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1638,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C41",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C41",
      "domainId": "DM-C41",
      "sourceSchemaId": "SCHEMA-C41-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "630752a4f3165b37037135b8bb8bb303ff81cdc7b8bbf1943d609d60db672b78",
      "productionAfterRoot": "e4ac43160c28bd111dfad794866926ad96b6b4b6b1f36cfcd8346ca344dadaf4",
      "projectionJoinRoot": "74f45ba1cc81a8aeb830ecded043e439de8078eebd52f99eeb2955a78f794ee7",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C41",
        "fixtureId": "FX-C41",
        "domainId": "DM-C41",
        "schemaId": "SCHEMA-C41-V1",
        "productionBeforeRoot": "630752a4f3165b37037135b8bb8bb303ff81cdc7b8bbf1943d609d60db672b78",
        "productionAfterRoot": "e4ac43160c28bd111dfad794866926ad96b6b4b6b1f36cfcd8346ca344dadaf4",
        "projectionJoinRoot": "74f45ba1cc81a8aeb830ecded043e439de8078eebd52f99eeb2955a78f794ee7",
        "injectorModuleRoot": "4dd3d2f36f1dcc92ed8a74126239375418a56baa375697baa74f40c861a2ff3c",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "2d7349adfa7048660e9ec807c3c83cedfc6cbf395cd4213ab480787ff5f8b14c",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c41.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433431223b0a6578706f727420636f6e737420756e69717565436f64653d22544f54414c5f4c4f435f4558434545444544223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323237343666373436313663343336383631373236373635363434633666363332323361333833353331376422293f22544f54414c5f4c4f435f4558434545444544223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232373436663734363136633433363836313732363736353634346336663633323233613338333533313764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "4dd3d2f36f1dcc92ed8a74126239375418a56baa375697baa74f40c861a2ff3c",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C41",
        "predicateId": "predicate_C41",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323237343666373436313663343336383631373236373635363434633666363332323361333833353331376422293f22544f54414c5f4c4f435f4558434545444544223a6e756c6c7d",
        "predicateBodySha256": "a38bb051cb39b37757f02f843f2ac68c5f19ffc645c4e7ca29e4bf28d5c4d117",
        "injectorId": "inject_C41",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232373436663734363136633433363836313732363736353634346336663633323233613338333533313764223b72657475726e206f75747d",
        "injectorBodySha256": "17cb2669a77194ec029d8e967e3fdc275750a83c92b6d592d1038beda7bcbc92",
        "leafId": "leafTotalBudget",
        "leafFunctionIdentityRoot": "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
      },
      "uniqueCode": "TOTAL_LOC_EXCEEDED",
      "outcomes": {
        "baseline": {
          "instanceRoot": "630752a4f3165b37037135b8bb8bb303ff81cdc7b8bbf1943d609d60db672b78",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "e4ac43160c28bd111dfad794866926ad96b6b4b6b1f36cfcd8346ca344dadaf4",
          "disabledLeaf": null,
          "expected": "TOTAL_LOC_EXCEEDED"
        },
        "ownerSuppression": {
          "instanceRoot": "e4ac43160c28bd111dfad794866926ad96b6b4b6b1f36cfcd8346ca344dadaf4",
          "disabledLeafFunctionIdentityRoot": "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "e4ac43160c28bd111dfad794866926ad96b6b4b6b1f36cfcd8346ca344dadaf4",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "630752a4f3165b37037135b8bb8bb303ff81cdc7b8bbf1943d609d60db672b78",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1680,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C42",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C42",
      "domainId": "DM-C42",
      "sourceSchemaId": "SCHEMA-C42-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "92c59023251f0de634cdb4a5a355fff2dff123792f76106bd42cb49867471c83",
      "productionAfterRoot": "ffbc359dd9bc74ea497dcc31f8cbe177cae560bc23909f2ca5ac5d04da320e1b",
      "projectionJoinRoot": "3323001c4680f4e0c600d2a0acff28f26c6b54592136151019afbb31919d49df",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C42",
        "fixtureId": "FX-C42",
        "domainId": "DM-C42",
        "schemaId": "SCHEMA-C42-V1",
        "productionBeforeRoot": "92c59023251f0de634cdb4a5a355fff2dff123792f76106bd42cb49867471c83",
        "productionAfterRoot": "ffbc359dd9bc74ea497dcc31f8cbe177cae560bc23909f2ca5ac5d04da320e1b",
        "projectionJoinRoot": "3323001c4680f4e0c600d2a0acff28f26c6b54592136151019afbb31919d49df",
        "injectorModuleRoot": "c52118df8e30a5b22df5867a83a91c9f4316ccd471ac0f174d85898e37a5c238",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "ba948b4fd085c45a370053eb4771ecc029c1e8cf4d6b5a421dc89f09af932200",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c42.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433432223b0a6578706f727420636f6e737420756e69717565436f64653d224153545f544f4f4c5f50494e5f4d49534d41544348223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236313733373435343666366636633232336137623232373336383631333233353336323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764376422293f224153545f544f4f4c5f50494e5f4d49534d41544348223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363137333734353436663666366332323361376232323733363836313332333533363232336132323331333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330323237643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "c52118df8e30a5b22df5867a83a91c9f4316ccd471ac0f174d85898e37a5c238",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C42",
        "predicateId": "predicate_C42",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c223762323236313733373435343666366636633232336137623232373336383631333233353336323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764376422293f224153545f544f4f4c5f50494e5f4d49534d41544348223a6e756c6c7d",
        "predicateBodySha256": "d51d3e97256120f48bbbd2c2851c0cfc82df1847a5730aa261ec2a5f7c27af65",
        "injectorId": "inject_C42",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d2237623232363137333734353436663666366332323361376232323733363836313332333533363232336132323331333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330323237643764223b72657475726e206f75747d",
        "injectorBodySha256": "329cbea9d09630f85d82e4cb574a358b0869f2b024d618c554cd364a11a8c1d8",
        "leafId": "leafAstToolPin",
        "leafFunctionIdentityRoot": "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
      },
      "uniqueCode": "AST_TOOL_PIN_MISMATCH",
      "outcomes": {
        "baseline": {
          "instanceRoot": "92c59023251f0de634cdb4a5a355fff2dff123792f76106bd42cb49867471c83",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "ffbc359dd9bc74ea497dcc31f8cbe177cae560bc23909f2ca5ac5d04da320e1b",
          "disabledLeaf": null,
          "expected": "AST_TOOL_PIN_MISMATCH"
        },
        "ownerSuppression": {
          "instanceRoot": "ffbc359dd9bc74ea497dcc31f8cbe177cae560bc23909f2ca5ac5d04da320e1b",
          "disabledLeafFunctionIdentityRoot": "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "ffbc359dd9bc74ea497dcc31f8cbe177cae560bc23909f2ca5ac5d04da320e1b",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "92c59023251f0de634cdb4a5a355fff2dff123792f76106bd42cb49867471c83",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1722,
        "count": 42
      }
    },
    {
      "schema": "ControlRowV8",
      "controlId": "C43",
      "profile": "SOURCE_REBASE",
      "fixtureId": "FX-C43",
      "domainId": "DM-C43",
      "sourceSchemaId": "SCHEMA-C43-V1",
      "productionKind": "SourceVerifierInputV8",
      "destinationPath": "/payload/bytesHex",
      "productionBeforeRoot": "6726939409225d0e2c6906c09f1ac3d17451272938fbda877df93e154108295c",
      "productionAfterRoot": "5db7746a83e0b7d905c3c6f2a8cced8eeb502ce0c61759799be292f8c35880f1",
      "projectionJoinRoot": "fe60de2e95559b11df1532e11906c80c980fb62fcbc42abde8ba9b364dd5754a",
      "auditMutantEnvelope": {
        "schema": "AuditMutantEnvelopeV8",
        "controlId": "C43",
        "fixtureId": "FX-C43",
        "domainId": "DM-C43",
        "schemaId": "SCHEMA-C43-V1",
        "productionBeforeRoot": "6726939409225d0e2c6906c09f1ac3d17451272938fbda877df93e154108295c",
        "productionAfterRoot": "5db7746a83e0b7d905c3c6f2a8cced8eeb502ce0c61759799be292f8c35880f1",
        "projectionJoinRoot": "fe60de2e95559b11df1532e11906c80c980fb62fcbc42abde8ba9b364dd5754a",
        "injectorModuleRoot": "2099ac2a18bc90428bbbd45f2e54633aa83d56321af5d628b466759c52fed56f",
        "auditPolicyRoot": "876d7c789f2156de2ddddd19cc752cb1c2463e794f01dc8b0e85678f66a3c74f"
      },
      "auditMutantEnvelopeRoot": "4e37d28baad826b243a81584556c53bf9a713fa2b2b386596bbb537ab64fb468",
      "leafFunctionIdentity": {
        "schema": "LeafFunctionIdentityV8",
        "ownerModule": "P7",
        "ownerModulePath": "proposed/P7-c43.mjs",
        "moduleSourceBytesHex": "6578706f727420636f6e737420636f6e74726f6c49643d22433433223b0a6578706f727420636f6e737420756e69717565436f64653d22434c41494d5f534f555243455f4452494654223b0a6578706f72742066756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323633366336313639366432323361376232323733366637353732363336353461366636393665323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764376422293f22434c41494d5f534f555243455f4452494654223a6e756c6c7d3b0a6578706f72742066756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236333663363136393664323233613762323237333666373537323633363534613666363936653232336132323331333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330323237643764223b72657475726e206f75747d3b0a",
        "moduleSourceSha256": "2099ac2a18bc90428bbbd45f2e54633aa83d56321af5d628b466759c52fed56f",
        "astNodePath": "/ExportNamedDeclaration[predicate]/C43",
        "predicateId": "predicate_C43",
        "predicateBodyBytesHex": "66756e6374696f6e2070726564696361746528696e707574297b72657475726e204f626a6563742e697328696e7075745b227061796c6f6164225d5b226279746573486578225d2c22376232323633366336313639366432323361376232323733366637353732363336353461366636393665323233613232333133303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333032323764376422293f22434c41494d5f534f555243455f4452494654223a6e756c6c7d",
        "predicateBodySha256": "48bb49f26a19ced0f9ac6cc12a585661455b3a48885dc5eafee56b9036437299",
        "injectorId": "inject_C43",
        "injectorBodyBytesHex": "66756e6374696f6e20696e6a65637428696e707574297b636f6e7374206f75743d73747275637475726564436c6f6e6528696e707574293b6f75745b227061796c6f6164225d5b226279746573486578225d3d223762323236333663363136393664323233613762323237333666373537323633363534613666363936653232336132323331333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330323237643764223b72657475726e206f75747d",
        "injectorBodySha256": "8d74e3541d5e1bbe699b614f5ea6ba1c57d0fca2b64b9ad2e1e0beabd054b099",
        "leafId": "leafClaimSourceJoin",
        "leafFunctionIdentityRoot": "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
      },
      "uniqueCode": "CLAIM_SOURCE_DRIFT",
      "outcomes": {
        "baseline": {
          "instanceRoot": "6726939409225d0e2c6906c09f1ac3d17451272938fbda877df93e154108295c",
          "disabledLeaf": null,
          "expected": "GREEN"
        },
        "ownerReject": {
          "instanceRoot": "5db7746a83e0b7d905c3c6f2a8cced8eeb502ce0c61759799be292f8c35880f1",
          "disabledLeaf": null,
          "expected": "CLAIM_SOURCE_DRIFT"
        },
        "ownerSuppression": {
          "instanceRoot": "5db7746a83e0b7d905c3c6f2a8cced8eeb502ce0c61759799be292f8c35880f1",
          "disabledLeafFunctionIdentityRoot": "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "controlOfControl": {
          "instanceRoot": "5db7746a83e0b7d905c3c6f2a8cced8eeb502ce0c61759799be292f8c35880f1",
          "byteIdenticalToOwnerReject": true,
          "disabledLeafFunctionIdentityRoot": "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c",
          "expected": "GREEN_DEFECT_EXPOSED"
        },
        "exactNoOp": {
          "instanceRoot": "6726939409225d0e2c6906c09f1ac3d17451272938fbda877df93e154108295c",
          "expected": "GREEN"
        }
      },
      "nonownerRetentionRange": {
        "start": 1764,
        "count": 42
      }
    }
  ],
  "nonownerRetentions": [
    [
      "C01",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C01",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C01",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C01",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C01",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C01",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C01",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C01",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C01",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C01",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C01",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C01",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C01",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C01",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C01",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C01",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C01",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C01",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C01",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C01",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C01",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C01",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C01",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C01",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C01",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C01",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C01",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C01",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C01",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C01",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C01",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C01",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C01",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C01",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C01",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C01",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C01",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C01",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C01",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C01",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C01",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C01",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C02",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C02",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C02",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C02",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C02",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C02",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C02",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C02",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C02",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C02",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C02",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C02",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C02",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C02",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C02",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C02",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C02",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C02",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C02",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C02",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C02",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C02",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C02",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C02",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C02",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C02",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C02",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C02",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C02",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C02",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C02",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C02",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C02",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C02",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C02",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C02",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C02",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C02",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C02",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C02",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C02",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C02",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C03",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C03",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C03",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C03",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C03",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C03",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C03",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C03",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C03",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C03",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C03",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C03",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C03",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C03",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C03",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C03",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C03",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C03",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C03",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C03",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C03",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C03",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C03",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C03",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C03",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C03",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C03",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C03",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C03",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C03",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C03",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C03",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C03",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C03",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C03",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C03",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C03",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C03",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C03",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C03",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C03",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C03",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C04",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C04",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C04",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C04",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C04",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C04",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C04",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C04",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C04",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C04",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C04",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C04",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C04",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C04",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C04",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C04",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C04",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C04",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C04",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C04",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C04",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C04",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C04",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C04",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C04",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C04",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C04",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C04",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C04",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C04",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C04",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C04",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C04",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C04",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C04",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C04",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C04",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C04",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C04",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C04",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C04",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C04",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C05",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C05",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C05",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C05",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C05",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C05",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C05",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C05",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C05",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C05",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C05",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C05",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C05",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C05",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C05",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C05",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C05",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C05",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C05",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C05",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C05",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C05",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C05",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C05",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C05",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C05",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C05",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C05",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C05",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C05",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C05",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C05",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C05",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C05",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C05",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C05",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C05",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C05",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C05",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C05",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C05",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C05",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C06",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C06",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C06",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C06",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C06",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C06",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C06",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C06",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C06",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C06",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C06",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C06",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C06",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C06",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C06",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C06",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C06",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C06",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C06",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C06",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C06",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C06",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C06",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C06",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C06",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C06",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C06",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C06",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C06",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C06",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C06",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C06",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C06",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C06",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C06",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C06",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C06",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C06",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C06",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C06",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C06",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C06",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C07",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C07",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C07",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C07",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C07",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C07",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C07",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C07",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C07",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C07",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C07",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C07",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C07",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C07",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C07",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C07",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C07",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C07",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C07",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C07",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C07",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C07",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C07",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C07",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C07",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C07",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C07",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C07",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C07",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C07",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C07",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C07",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C07",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C07",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C07",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C07",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C07",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C07",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C07",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C07",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C07",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C07",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C08",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C08",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C08",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C08",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C08",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C08",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C08",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C08",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C08",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C08",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C08",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C08",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C08",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C08",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C08",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C08",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C08",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C08",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C08",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C08",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C08",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C08",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C08",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C08",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C08",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C08",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C08",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C08",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C08",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C08",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C08",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C08",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C08",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C08",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C08",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C08",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C08",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C08",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C08",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C08",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C08",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C08",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C09",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C09",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C09",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C09",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C09",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C09",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C09",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C09",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C09",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C09",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C09",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C09",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C09",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C09",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C09",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C09",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C09",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C09",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C09",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C09",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C09",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C09",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C09",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C09",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C09",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C09",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C09",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C09",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C09",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C09",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C09",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C09",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C09",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C09",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C09",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C09",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C09",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C09",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C09",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C09",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C09",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C09",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C10",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C10",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C10",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C10",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C10",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C10",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C10",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C10",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C10",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C10",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C10",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C10",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C10",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C10",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C10",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C10",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C10",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C10",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C10",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C10",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C10",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C10",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C10",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C10",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C10",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C10",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C10",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C10",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C10",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C10",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C10",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C10",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C10",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C10",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C10",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C10",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C10",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C10",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C10",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C10",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C10",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C10",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C11",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C11",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C11",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C11",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C11",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C11",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C11",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C11",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C11",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C11",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C11",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C11",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C11",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C11",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C11",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C11",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C11",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C11",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C11",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C11",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C11",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C11",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C11",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C11",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C11",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C11",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C11",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C11",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C11",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C11",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C11",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C11",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C11",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C11",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C11",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C11",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C11",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C11",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C11",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C11",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C11",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C11",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C12",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C12",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C12",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C12",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C12",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C12",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C12",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C12",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C12",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C12",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C12",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C12",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C12",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C12",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C12",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C12",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C12",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C12",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C12",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C12",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C12",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C12",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C12",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C12",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C12",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C12",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C12",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C12",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C12",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C12",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C12",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C12",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C12",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C12",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C12",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C12",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C12",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C12",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C12",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C12",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C12",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C12",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C13",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C13",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C13",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C13",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C13",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C13",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C13",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C13",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C13",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C13",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C13",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C13",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C13",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C13",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C13",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C13",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C13",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C13",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C13",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C13",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C13",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C13",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C13",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C13",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C13",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C13",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C13",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C13",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C13",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C13",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C13",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C13",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C13",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C13",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C13",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C13",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C13",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C13",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C13",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C13",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C13",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C13",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C14",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C14",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C14",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C14",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C14",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C14",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C14",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C14",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C14",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C14",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C14",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C14",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C14",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C14",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C14",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C14",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C14",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C14",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C14",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C14",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C14",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C14",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C14",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C14",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C14",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C14",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C14",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C14",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C14",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C14",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C14",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C14",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C14",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C14",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C14",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C14",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C14",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C14",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C14",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C14",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C14",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C14",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C15",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C15",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C15",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C15",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C15",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C15",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C15",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C15",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C15",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C15",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C15",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C15",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C15",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C15",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C15",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C15",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C15",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C15",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C15",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C15",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C15",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C15",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C15",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C15",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C15",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C15",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C15",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C15",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C15",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C15",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C15",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C15",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C15",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C15",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C15",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C15",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C15",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C15",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C15",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C15",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C15",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C15",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C16",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C16",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C16",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C16",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C16",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C16",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C16",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C16",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C16",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C16",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C16",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C16",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C16",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C16",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C16",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C16",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C16",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C16",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C16",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C16",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C16",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C16",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C16",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C16",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C16",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C16",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C16",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C16",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C16",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C16",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C16",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C16",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C16",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C16",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C16",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C16",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C16",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C16",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C16",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C16",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C16",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C16",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C17",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C17",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C17",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C17",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C17",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C17",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C17",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C17",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C17",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C17",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C17",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C17",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C17",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C17",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C17",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C17",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C17",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C17",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C17",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C17",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C17",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C17",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C17",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C17",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C17",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C17",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C17",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C17",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C17",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C17",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C17",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C17",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C17",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C17",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C17",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C17",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C17",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C17",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C17",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C17",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C17",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C17",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C18",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C18",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C18",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C18",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C18",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C18",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C18",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C18",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C18",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C18",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C18",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C18",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C18",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C18",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C18",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C18",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C18",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C18",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C18",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C18",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C18",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C18",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C18",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C18",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C18",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C18",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C18",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C18",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C18",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C18",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C18",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C18",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C18",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C18",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C18",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C18",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C18",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C18",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C18",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C18",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C18",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C18",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C19",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C19",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C19",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C19",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C19",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C19",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C19",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C19",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C19",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C19",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C19",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C19",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C19",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C19",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C19",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C19",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C19",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C19",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C19",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C19",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C19",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C19",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C19",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C19",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C19",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C19",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C19",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C19",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C19",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C19",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C19",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C19",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C19",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C19",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C19",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C19",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C19",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C19",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C19",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C19",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C19",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C19",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C20",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C20",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C20",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C20",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C20",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C20",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C20",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C20",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C20",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C20",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C20",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C20",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C20",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C20",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C20",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C20",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C20",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C20",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C20",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C20",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C20",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C20",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C20",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C20",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C20",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C20",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C20",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C20",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C20",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C20",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C20",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C20",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C20",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C20",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C20",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C20",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C20",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C20",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C20",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C20",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C20",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C20",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C21",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C21",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C21",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C21",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C21",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C21",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C21",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C21",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C21",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C21",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C21",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C21",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C21",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C21",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C21",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C21",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C21",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C21",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C21",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C21",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C21",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C21",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C21",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C21",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C21",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C21",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C21",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C21",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C21",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C21",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C21",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C21",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C21",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C21",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C21",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C21",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C21",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C21",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C21",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C21",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C21",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C21",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C22",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C22",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C22",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C22",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C22",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C22",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C22",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C22",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C22",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C22",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C22",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C22",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C22",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C22",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C22",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C22",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C22",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C22",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C22",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C22",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C22",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C22",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C22",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C22",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C22",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C22",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C22",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C22",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C22",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C22",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C22",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C22",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C22",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C22",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C22",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C22",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C22",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C22",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C22",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C22",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C22",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C22",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C23",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C23",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C23",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C23",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C23",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C23",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C23",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C23",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C23",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C23",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C23",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C23",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C23",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C23",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C23",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C23",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C23",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C23",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C23",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C23",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C23",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C23",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C23",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C23",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C23",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C23",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C23",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C23",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C23",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C23",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C23",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C23",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C23",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C23",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C23",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C23",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C23",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C23",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C23",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C23",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C23",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C23",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C24",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C24",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C24",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C24",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C24",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C24",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C24",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C24",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C24",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C24",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C24",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C24",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C24",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C24",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C24",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C24",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C24",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C24",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C24",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C24",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C24",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C24",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C24",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C24",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C24",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C24",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C24",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C24",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C24",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C24",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C24",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C24",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C24",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C24",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C24",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C24",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C24",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C24",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C24",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C24",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C24",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C24",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C25",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C25",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C25",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C25",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C25",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C25",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C25",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C25",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C25",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C25",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C25",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C25",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C25",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C25",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C25",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C25",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C25",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C25",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C25",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C25",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C25",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C25",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C25",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C25",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C25",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C25",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C25",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C25",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C25",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C25",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C25",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C25",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C25",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C25",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C25",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C25",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C25",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C25",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C25",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C25",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C25",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C25",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C26",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C26",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C26",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C26",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C26",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C26",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C26",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C26",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C26",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C26",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C26",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C26",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C26",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C26",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C26",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C26",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C26",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C26",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C26",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C26",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C26",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C26",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C26",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C26",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C26",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C26",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C26",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C26",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C26",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C26",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C26",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C26",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C26",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C26",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C26",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C26",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C26",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C26",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C26",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C26",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C26",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C26",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C27",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C27",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C27",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C27",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C27",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C27",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C27",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C27",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C27",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C27",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C27",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C27",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C27",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C27",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C27",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C27",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C27",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C27",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C27",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C27",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C27",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C27",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C27",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C27",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C27",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C27",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C27",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C27",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C27",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C27",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C27",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C27",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C27",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C27",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C27",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C27",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C27",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C27",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C27",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C27",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C27",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C27",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C28",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C28",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C28",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C28",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C28",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C28",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C28",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C28",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C28",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C28",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C28",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C28",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C28",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C28",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C28",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C28",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C28",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C28",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C28",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C28",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C28",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C28",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C28",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C28",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C28",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C28",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C28",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C28",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C28",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C28",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C28",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C28",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C28",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C28",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C28",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C28",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C28",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C28",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C28",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C28",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C28",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C28",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C29",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C29",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C29",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C29",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C29",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C29",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C29",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C29",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C29",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C29",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C29",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C29",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C29",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C29",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C29",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C29",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C29",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C29",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C29",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C29",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C29",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C29",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C29",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C29",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C29",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C29",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C29",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C29",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C29",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C29",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C29",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C29",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C29",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C29",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C29",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C29",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C29",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C29",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C29",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C29",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C29",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C29",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C30",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C30",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C30",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C30",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C30",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C30",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C30",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C30",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C30",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C30",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C30",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C30",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C30",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C30",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C30",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C30",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C30",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C30",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C30",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C30",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C30",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C30",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C30",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C30",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C30",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C30",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C30",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C30",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C30",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C30",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C30",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C30",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C30",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C30",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C30",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C30",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C30",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C30",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C30",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C30",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C30",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C30",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C31",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C31",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C31",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C31",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C31",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C31",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C31",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C31",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C31",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C31",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C31",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C31",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C31",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C31",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C31",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C31",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C31",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C31",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C31",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C31",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C31",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C31",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C31",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C31",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C31",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C31",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C31",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C31",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C31",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C31",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C31",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C31",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C31",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C31",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C31",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C31",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C31",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C31",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C31",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C31",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C31",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C31",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C32",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C32",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C32",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C32",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C32",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C32",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C32",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C32",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C32",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C32",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C32",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C32",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C32",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C32",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C32",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C32",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C32",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C32",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C32",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C32",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C32",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C32",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C32",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C32",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C32",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C32",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C32",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C32",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C32",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C32",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C32",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C32",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C32",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C32",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C32",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C32",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C32",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C32",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C32",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C32",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C32",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C32",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C33",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C33",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C33",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C33",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C33",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C33",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C33",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C33",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C33",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C33",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C33",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C33",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C33",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C33",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C33",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C33",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C33",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C33",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C33",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C33",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C33",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C33",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C33",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C33",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C33",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C33",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C33",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C33",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C33",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C33",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C33",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C33",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C33",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C33",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C33",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C33",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C33",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C33",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C33",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C33",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C33",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C33",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C34",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C34",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C34",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C34",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C34",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C34",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C34",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C34",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C34",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C34",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C34",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C34",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C34",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C34",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C34",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C34",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C34",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C34",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C34",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C34",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C34",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C34",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C34",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C34",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C34",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C34",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C34",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C34",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C34",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C34",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C34",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C34",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C34",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C34",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C34",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C34",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C34",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C34",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C34",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C34",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C34",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C34",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C35",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C35",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C35",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C35",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C35",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C35",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C35",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C35",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C35",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C35",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C35",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C35",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C35",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C35",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C35",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C35",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C35",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C35",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C35",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C35",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C35",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C35",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C35",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C35",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C35",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C35",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C35",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C35",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C35",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C35",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C35",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C35",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C35",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C35",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C35",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C35",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C35",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C35",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C35",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C35",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C35",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C35",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C36",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C36",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C36",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C36",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C36",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C36",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C36",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C36",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C36",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C36",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C36",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C36",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C36",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C36",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C36",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C36",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C36",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C36",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C36",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C36",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C36",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C36",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C36",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C36",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C36",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C36",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C36",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C36",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C36",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C36",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C36",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C36",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C36",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C36",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C36",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C36",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C36",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C36",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C36",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C36",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C36",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C36",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C37",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C37",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C37",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C37",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C37",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C37",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C37",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C37",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C37",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C37",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C37",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C37",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C37",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C37",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C37",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C37",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C37",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C37",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C37",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C37",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C37",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C37",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C37",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C37",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C37",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C37",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C37",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C37",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C37",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C37",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C37",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C37",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C37",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C37",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C37",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C37",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C37",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C37",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C37",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C37",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C37",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C37",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C38",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C38",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C38",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C38",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C38",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C38",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C38",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C38",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C38",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C38",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C38",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C38",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C38",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C38",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C38",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C38",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C38",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C38",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C38",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C38",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C38",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C38",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C38",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C38",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C38",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C38",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C38",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C38",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C38",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C38",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C38",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C38",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C38",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C38",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C38",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C38",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C38",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C38",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C38",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C38",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C38",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C38",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C39",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C39",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C39",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C39",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C39",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C39",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C39",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C39",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C39",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C39",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C39",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C39",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C39",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C39",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C39",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C39",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C39",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C39",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C39",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C39",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C39",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C39",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C39",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C39",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C39",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C39",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C39",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C39",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C39",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C39",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C39",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C39",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C39",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C39",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C39",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C39",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C39",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C39",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C39",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C39",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C39",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C39",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C40",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C40",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C40",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C40",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C40",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C40",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C40",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C40",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C40",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C40",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C40",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C40",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C40",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C40",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C40",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C40",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C40",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C40",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C40",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C40",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C40",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C40",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C40",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C40",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C40",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C40",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C40",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C40",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C40",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C40",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C40",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C40",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C40",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C40",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C40",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C40",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C40",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C40",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C40",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C40",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C40",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C40",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C41",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C41",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C41",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C41",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C41",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C41",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C41",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C41",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C41",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C41",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C41",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C41",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C41",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C41",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C41",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C41",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C41",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C41",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C41",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C41",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C41",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C41",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C41",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C41",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C41",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C41",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C41",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C41",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C41",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C41",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C41",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C41",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C41",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C41",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C41",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C41",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C41",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C41",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C41",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C41",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C41",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C41",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C42",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C42",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C42",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C42",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C42",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C42",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C42",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C42",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C42",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C42",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C42",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C42",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C42",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C42",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C42",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C42",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C42",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C42",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C42",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C42",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C42",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C42",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C42",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C42",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C42",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C42",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C42",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C42",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C42",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C42",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C42",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C42",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C42",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C42",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C42",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C42",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C42",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C42",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C42",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C42",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C42",
      "ff556e5a1c1b5a070dc73e699c7ad01d55e38e36d9ae524f6d78f96a2b2cc47c"
    ],
    [
      "C42",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ],
    [
      "C43",
      "088a3ec585fe08e34048984eb043bf3a6eb5e60f7e254d7775dcbfa50d814f11"
    ],
    [
      "C43",
      "108ecc06c1b776bea7da58461efade3ad53fe4890c45fefb67dd4176c61d0646"
    ],
    [
      "C43",
      "19372bb9be4e06a6210e598101256af04e7b36aaf80f168c72c726f20e7a6ad1"
    ],
    [
      "C43",
      "1f59a3c6517cb2eacbc5a1276778cb8b9d6905581bb420fcb0018677704f9d06"
    ],
    [
      "C43",
      "253f134390020a74952e2a50b094f9697a5f46f60ca1ffe006564a8c14109040"
    ],
    [
      "C43",
      "257faf530114e262cb1967e43681cb5315c89f6b7ab35147d6ba99207cca6da9"
    ],
    [
      "C43",
      "2a455159a0771e750378d0429823fc029667b6c914f3fd616227bf57aa5871de"
    ],
    [
      "C43",
      "35e344035cca4421dbf112c63ec3061cf7fd7aacbb5daf0b27da520b9130e293"
    ],
    [
      "C43",
      "3d709a21903319c73ba60b30c40b6c150347aea7e22f2c7cdd1fcda61eeedcbf"
    ],
    [
      "C43",
      "4217abeb2ec50071c8f95a068685b7092fb89bdedc9abc9881e3f42d81c8cf44"
    ],
    [
      "C43",
      "4d3d14f1d4478f05027c868bf26d7cadd2fc43978d5d2503c18af5f2152b8cd8"
    ],
    [
      "C43",
      "54473d5553362156dff5c5cbcccaa331573c1d096646dc1e496313e496dea021"
    ],
    [
      "C43",
      "59f68394cb80d176f8b0ad109e0442ca2328d96596ff712d04faf36e551965a9"
    ],
    [
      "C43",
      "5e9f5c7c4449a8d057d65793a056ea1b005c2feddceed7800883faa67b19ed03"
    ],
    [
      "C43",
      "64290fd7f205743901f8d72ec5ffb36c2852cb97d2dd54b6f30820bde91c60f4"
    ],
    [
      "C43",
      "6f04ff03c682ab14d6d39d943035df9e05eb0bfddc5d40589456f424b0c933a9"
    ],
    [
      "C43",
      "70b6aa07ae89895a282028d5356ca39f02b198c3c971ceb9547891c5ef9557b4"
    ],
    [
      "C43",
      "725b24ac8598758ce82c54df60e4381a75887999746902139c318f9ea84288ce"
    ],
    [
      "C43",
      "786963e765634159567f22a3b0f5d09aaed56fbe213a40d0cc2737db254c8c5e"
    ],
    [
      "C43",
      "820056f0a135a251e935be9d89ff756f7e0033414185e52f40d06aedd5d1fd2d"
    ],
    [
      "C43",
      "84ad01255384cd71ade81de08ebaf051980e5fcabe3d8d891655d095b92e34cc"
    ],
    [
      "C43",
      "879f029e9a8b0c3bfc0021a3db09c1a8ff89b41cf04e725bfb7fd72e3e0772a9"
    ],
    [
      "C43",
      "89add4bbfda7be99fd3ac5d1391692fadf5c8541692487cd3ec307a71ed8ca01"
    ],
    [
      "C43",
      "8f93809c83dc4a35150292dc92d9a4c5778fd58d7b050eb26963dafdea9a4f1d"
    ],
    [
      "C43",
      "908e235e9d5f24c61b9418a7d0432157415c33369418dcf25f37af459385b38a"
    ],
    [
      "C43",
      "926319ba0e9a78a7d5fbc73657d3de37fc7e3d7c1ac9e64fd9ee7b9795d01ab8"
    ],
    [
      "C43",
      "938a5363f71c4c0c402530f2c99f30a14feda5799601b505cc0fa09ff7260de9"
    ],
    [
      "C43",
      "99821e6c757902c76d1a4a9e1b1bc6e1b4d83334d0d83a107fb661bd1b98482e"
    ],
    [
      "C43",
      "9d7d8cc2c82c31a9db142f2e3d9d2851235e6889fc20244316f22af8339a1ad9"
    ],
    [
      "C43",
      "9fe14308efcf1bd3997a41dde647f3993cd156f090f2c4cc0e3264c97af9facd"
    ],
    [
      "C43",
      "a38d7a201acdf74917b2fb9cfe6dbaadc236889a5c1efe1f174073650e8c531d"
    ],
    [
      "C43",
      "a5634c1f538851db46d7d90037e767058282f7988eeda9eff2cc8fead1cabae5"
    ],
    [
      "C43",
      "a8092ad52c1073536649926f4f4a0885c5e597e223fc7905af1ff6c91a5664aa"
    ],
    [
      "C43",
      "b0dc9a05669d06ae641b1bad13b21c56e1e2966ac3edf002609671f9bf5d4173"
    ],
    [
      "C43",
      "bb2727fd32753ffdc1df647a0c7a231d7ac2129dc1f0d95b67c45091ef79ed0e"
    ],
    [
      "C43",
      "bd60c2be8b0d81eb1ce197985a6fcfa31ed374f24571c488bc338fe1414fab06"
    ],
    [
      "C43",
      "bf376a3eb2a473906e4cc909dd0ed60c44bbd57253f17d39e247a926c10672bf"
    ],
    [
      "C43",
      "c6fe989238e3bd40335759bfea61caaeb1c9dba08445f4e03b01107668bc812e"
    ],
    [
      "C43",
      "d1536154d2b5f6c8b3e8a30f3d914bd66f4a711079288b8c9d1cd2e1e3e17974"
    ],
    [
      "C43",
      "eff6df14dd09e133c8c79ac346fee032b078efb17c7c24727038b82d6b0e8e9c"
    ],
    [
      "C43",
      "fecd4355f4f646ee565cbc427d0e9c5a33179faea9e8a8289240937a339e4cd7"
    ],
    [
      "C43",
      "ff6018ce71a0deae0c94d00dcc970136cc24e645ed869d1edd9fc35f1d77cd7d"
    ]
  ],
  "counts": {
    "schemas": 43,
    "fixtures": 43,
    "domains": 43,
    "controls": 43,
    "concreteAuthorityObjects": 28,
    "productionInstances": 86,
    "sourceModules": 43,
    "leafIdentities": 43,
    "projectionJoins": 43,
    "nonownerRetentions": 1806,
    "edges": 26,
    "futureReceipts": 1980
  },
  "controlArithmetic": {
    "rows": 43,
    "baseline": 43,
    "ownerReject": 43,
    "ownerSuppressionAndControlOfControl": 43,
    "nonownerRetention": 1806,
    "exactNoOp": 43,
    "unknown": 1,
    "duplicate": 1,
    "totalReceipts": 1980
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
  "productionLaw": {
    "fixtureProjection": "each ControlRowV8 binds authenticated fixture before/after SHA to a concrete field consumed by the same rooted predicate",
    "sameMutantControlOfControl": "ownerReject.instanceRoot == controlOfControl.instanceRoot; only the exact owning leaf identity is disabled",
    "nonowner": "all ordered control x nonowner full LeafFunctionIdentity roots; 43*42=1806",
    "trust": "issuer public key and ledger root arrive through the validator argument; submitted trust or authority booleans are rejected",
    "signature": "Ed25519 over domain-separated unsigned message roots; signature bytes are outside message roots"
  },
  "experimentLaw": {
    "portfolio": [
      "PL_3X_MEDIAN",
      "PL_2X_GEOMETRIC",
      "PL_BE_NET_BENEFIT"
    ],
    "nIetmEligibility": "PL_BE_NET_BENEFIT_ONLY",
    "strictMultipliers": "DESCRIPTIVE_ROWS_ONLY",
    "sourceExecutionAuthorized": false
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
    "scientific": 0,
    "equivalence": 0,
    "performance": 0,
    "novelty": 0,
    "css": 0,
    "product": 0,
    "law": 0,
    "formation": 0,
    "release": 0
  },
  "authorized": {
    "paperOnly": true,
    "parserSource": false,
    "productSource": false,
    "cssGrammar": false,
    "nodeExecution": false,
    "astExecution": false,
    "prototype": false,
    "benchmark": false,
    "package": false,
    "release": false,
    "reviews": false,
    "next": "TWO_FRESH_NON_AUTHOR_REVIEWS"
  }
}
```

## Boundary

N2-v8 authorizes paper review only. N2e, parser source, Node/AST execution,
prototype, benchmark, CSS grammar, product mutation, package/release/rebind, and
law selection remain withheld. Two fresh non-author reviews are required.
