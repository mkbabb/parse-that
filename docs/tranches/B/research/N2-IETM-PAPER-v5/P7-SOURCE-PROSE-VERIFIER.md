# P7 — structural controls and honest executable-budget RED

Status: `PAPER_V5_RED / P7_EXECUTABLE_AST_BUDGET_UNBOUND / ZERO_CREDIT`.
Future ceiling: `1 module / 110 charged LOC`.

P7 owns raw source/prose/interface pins, source parser, AST representation,
adapter, verifier, harness, observer, audit wrapper, dependency graph, metric
counter, and structural receipts. All executable and transitive bytes for
those roles count inside P7; `external`, tool, dependency, generated,
test-only, harness, and owner-side labels exclude nothing.

Structural mutations other than source-hash use an audit-only rebased source
pin so the named structural leaf owns rejection. Production receives no
rebase/suppression argument. The same `LeafFunctionIdentity` law as P6 applies.
Compact values expand to `disabled=OWNER`, `bypass=EXPOSED`,
`retain=OTHER13_IDENTICAL`, and `coc=ERASE_BASELINE`.

## Exact 14-row P7 registry

| ID/profile | Target | Before → after | Operation | Owner leaf / unique code | disabled / bypass / retain / coc |
|---|---|---|---|---|---|
| `C30 SOURCE` | `moduleSet` | `[P0..P7]` → `[P0..P7,P8]` | `INSERT_MODULE` | `leafModuleSet` / `SOURCE_MODULE_SET` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C31 SOURCE` | `authorizedSourceBytes[0]` | `AUTH(authorizedSourceBytes[0])` → `XOR_BIT(AUTH(authorizedSourceBytes[0]),0)` | `FLIP_BIT_0` | `leafSourceHash` / `SOURCE_HASH_MISMATCH` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C32 SOURCE` | `PAPER-READY prose byte[0]` | `AUTH(PAPER-READY prose byte[0])` → `XOR_BIT(AUTH(PAPER-READY prose byte[0]),0)` | `FLIP_BIT_0` | `leafProseHash` / `PROSE_HASH_MISMATCH` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C33 SOURCE` | `edge E26` | `present` → `absent` | `DELETE_EDGE` | `leafEdgeGraph` / `EDGE_MISSING` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C34 SOURCE` | `edge E26 direction` | `P0->P5` → `P5->P0` | `REVERSE_EDGE` | `leafReverseEdge` / `EDGE_REVERSE` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C35 SOURCE` | `import kind` | `static` → `dynamic` | `REPLACE_IMPORT_KIND` | `leafDynamicImport` / `DYNAMIC_IMPORT` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C36 SOURCE` | `direct call` | `f()` → `eval("f()")` | `WRAP_EVAL` | `leafDynamicCode` / `DYNAMIC_CODE` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C37 SOURCE` | `owned access` | `o.x` → `Reflect.get(o,"x")` | `REPLACE_EXPRESSION` | `leafReflection` / `REFLECTION_EDGE` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C38 SOURCE` | `dependency graph edge` | `declared` → `omitted` | `DELETE_DEPENDENCY` | `leafDependencyGraph` / `DEPENDENCY_HIDDEN` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C39 SOURCE` | `scalar state` | `direct` → `eventTape+projection` | `REPLACE_SUBSTRATE` | `leafForbiddenSubstrate` / `FORBIDDEN_SUBSTRATE` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C40 SOURCE` | `P5 charged LOC` | `85` → `86` | `INSERT_LOGIC_LINE` | `leafModuleBudget` / `MODULE_LOC_EXCEEDED` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C41 SOURCE` | `total charged LOC` | `850` → `851` | `INSERT_LOGIC_LINE` | `leafTotalBudget` / `TOTAL_LOC_EXCEEDED` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C42 SOURCE` | `astTool.sha256` | `AUTH(astTool.sha256)` → `XOR_BIT(AUTH(astTool.sha256),0)` | `FLIP_BIT_0` | `leafAstToolPin` / `AST_TOOL_PIN_MISMATCH` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |
| `C43 SOURCE` | `claim.sourceJoin` | `AUTH(claim.sourceJoin)` → `XOR_BIT(AUTH(claim.sourceJoin),0)` | `FLIP_BIT_0` | `leafClaimSourceJoin` / `CLAIM_SOURCE_DRIFT` | OWNER / EXPOSED / OTHER13_IDENTICAL / ERASE_BASELINE |

Each machine row in PAPER-READY repeats these exact fields and mappings. For
C31 the original pin remains so source hash owns rejection. C30 and C32–C43
receive a canonical rebased source pin before production so source hash cannot
preempt the structural owner. Rebase exists only in the audit wrapper.

## Receipt arithmetic

For `N=14` the exact future P7 denominator remains:

```text
baseline 14 + owner rejection 14 + owner bypass 14 +
nonowner 14*13=182 + erasure 14 + unknown 1 + duplicate 1 = 240
```

Together with P6's `930`, v5 defines `1,170` future receipts. V4's `420/240`
arithmetic remains immutable evidence for its old `19/14` registries; v5 does
not reuse the incomplete 19-row set.

## Honest budget RED

The future ceilings remain exactly:

```text
P0 120 + P1 155 + P2 90 + P3 150 + P4 70 + P5 85 + P6 70 + P7 110 = 850
```

V5 has no selected P7 source parser, AST tool, adapter, verifier, harness,
observer, or transitive source graph and therefore no actual charged LOC.
`p7ActualChargedLoc` remains `null`, not zero or a placeholder. Excluding that
work would repeat v4 Review B. The packet is paper RED until a later ruling
binds all bytes and proves the 110/850 ceilings; v5 authorizes no source or
review automatically.

Closed bans include hidden evaluator, reparse, runtime discovery, dynamic
code, reflection, hidden dependency, scanner/token/index/tape/CST/forest,
event-region projection, opcode/PC/VM, generated fallback, dual/scalar path,
CSS grammar in parse-that, and direct parser→Fourier authority.

## Cross-interface edges

| Edge | Direction | Signature |
|---|---|---|
| `E12` | `P0 -> P7` | `declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>` |
| `E13` | `P1 -> P7` | `canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>` |
| `E14` | `P2 -> P7` | `relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>` |
| `E15` | `P3 -> P7` | `coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>` |
| `E16` | `P4 -> P7` | `effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>` |
| `E17` | `P5 -> P7` | `runAuthorityClaim() -> InterfaceClaim<PrePinAndPostRunSeal>` |
| `E18` | `P6 -> P7` | `controlRegistryClaim() -> InterfaceClaim<MachineControlRegistry>` |

No other edge exists. No executable budget, source, favorable result, or
credit is implied by this paper.
