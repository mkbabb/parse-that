# P3 — exact complete-product schema and sole visitor

Status: `PAPER_V3 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 160 charged LOC`. Paper budget: `100 nonblank lines`.

## Cardinality and payload vocabulary

`T`, `T?`, `T[0..*]`, and `T[1..*]` mean exactly one, JSON `null` or one T,
ordered array, and nonempty ordered array. `Id` is nonempty canonical
UTF-8; `Hash` is 64 lowercase hex; `U53` is a safe nonnegative integer;
`I53` is a safe integer; `Utf16` is `U53[0..*]`; `Coordinate` is one exact P1
coordinate tag. Unknown constructors, fields, payloads, or cardinalities are
RED.

`PointC=Point`, `IntervalC=Interval`, `AtC=Point|Eof|LineColumnAnchor`, and
`DepthC=DepthDelta`; the narrower aliases below cannot accept another
coordinate constructor.

Null/boolean/string/safe-integer use their JSON primitives; P1 tags encode
special semantic/coordinate values. Every remaining algebraic constructor is
a canonical object with mandatory `kind` exactly equal to its constructor name
and exactly the payload fields shown below.

```text
Semantic = Null | Boolean(value:boolean) | String(value:string)
         | Integer(value:I53) | NumberTag(value:-0|NaN|+Infinity|-Infinity)
         | Undefined | ByteString(bytes) | GraphRef(id:U53)
PrototypeTag = NullProto | ObjectProto | ArrayProto | Named(hash:Hash)
Descriptor = Data(enumerable:boolean,configurable:boolean,writable:boolean,
                  value:Semantic)
           | Accessor(enumerable:boolean,configurable:boolean,
                      getHash:Hash?,setHash:Hash?)
Property = StringKey(key:string,descriptor:Descriptor)
         | SymbolKey(globalKey:string?,description:string?,identity:Hash,
                     descriptor:Descriptor)
GraphNode = ObjectNode(id:U53,prototype:PrototypeTag,extensible:boolean,
                       sealed:boolean,frozen:boolean,properties:Property[0..*])
          | ArrayNode(id:U53,prototype:PrototypeTag,length:U53,
                      holes:U53[0..*],properties:Property[0..*],frozen:boolean)
```

Graph node IDs are unique and contiguous; property and symbol order is exact;
holes are sorted unique and below array length. Accessors are never invoked.

```text
Read = Consumed(span:IntervalC)
     | Lookahead(span:IntervalC,examinedEof:boolean)
     | Negative(span:IntervalC,outcome:Terminal)
     | FailedArm(armId:Id,span:IntervalC,frontier:PointC,expected:Id[1..*])
     | RecoverySync(span:IntervalC,outcome:Terminal)
     | DiagnosticFrontier(at:AtC,expected:Id[1..*])
     | EofRead(at:PointC|Eof)
Terminal = Success
         | Mismatch(frontier:PointC,expected:Id[1..*])
         | TypedFault(kind:Nesting,at:AtC,limit:U53,
                      liveDepth:U53,maxDepth:U53)
Span = {kind:Id,start:PointC,end:PointC,sourceVersion:U53}
Slot = {index:U53,value:Semantic}
Recovery = {kind:Id,span:Span,line:U53,column:U53,found:string?,provenance:Hash}
Diagnostic = {kind:Id,at:AtC,message:string,expected:Id[0..*],
              secondary:Span[0..*],provenance:Hash}
Selection = {choiceId:Id,armId:Id,at:PointC,outcome:Terminal}
```

`TypedMemoEntry` has exactly 28 fields and these cardinalities:

```text
parserId:Id, ruleId:Id, identityEpochId:Id, candidateArtifactHash:Hash,
harnessHash:Hash, runId:Id, rowId:Id, sourceVersion:U53, sourceHash:Hash,
start:PointC, finalOffset:PointC, consumed:IntervalC,
examined:IntervalC, dependencies:Read[1..*], examinedUtf16:Utf16,
examinedHash:Hash, valueGraph:GraphNode[0..*], slots:Slot[0..*],
spans:Span[0..*], terminal:Terminal, frontier:PointC,
expected:Id[0..*], suggestions:Id[0..*], secondarySpans:Span[0..*],
rollback:PointC, recovery:Recovery[0..*], diagnostics:Diagnostic[0..*],
selection:Selection[0..*]
```

`CompleteProduct` has exactly nine fields: `memoEntry:TypedMemoEntry`,
`provenance:Hash[1..*]`, `sourceSlices:ByteString[1..*]`, `entryDepth:U53`,
`maxDepthDelta:DepthC`, `nestingLimit:U53`, `fault:TypedFault?`,
`observedEffects:ByteString[0..*]`, and `frozenGraph:boolean`.

P1-decoded `CandidateReceiptBytes` bind the candidate artifact, harness,
source, run, row, immutable graph, and exact product. P3 alone generates and
applies the exhaustive visitor to E03, then compares every relocated field,
including `entryDepth`, `maxDepthDelta`, `nestingLimit`, and fault, against
E05's fresh target product. P2 sees none of them. P3 also compares its product
effect bytes to E05; P4 independently adjudicates event identity with no P3
edge. Graph equality covers prototypes, symbols, holes, descriptors, cycles,
alias bijection, typed bytes, `Object.is` numbers, order, and frozen state.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E03` | `P2 -> P3` | `relocationMap(from: VersionOrdinal, to: VersionOrdinal) -> RelocationMapResult` | P2 atoms only; DepthDelta unchanged absent epoch change |
| `E05` | `P5 -> P3` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | raw-authenticated target product/effects/provenance bytes |
| `E09` | `P1 -> P3` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | typed candidate memo/product bytes only |
| `E15` | `P3 -> P7` | `coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>` | exact constructors, payloads, cardinalities, and sole visitor |

No other edge exists. Lossy equality, unknown field, implicit optionality,
second visitor, P2 product access, or unjoined target state is RED.
