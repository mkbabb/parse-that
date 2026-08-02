# Novelty N2c terminal source-review-RED owner intake and N2d source-architecture ruling

Date: 2026-08-02

Status: **N2C TERMINAL SOURCE_REVIEW_RED — ZERO CREDIT — N2D SAME-TASK SOURCE-ARCHITECTURE AUTHORIZED, NOT SENT**

## Scope and coordinate

This tranche-development ruling freezes the two-file N2c source packet,
records the first owning reason and independent secondary failures, and defines
the only legal N2d continuation. It does not import, check, or execute N2c;
create or dispatch N2d; modify parser or Value source; select a law; or grant
product, package, API, Browser, consumer, candidate, release, or rebind credit.

- repository: `/Users/mkbabb/Programming/parse-that-css-totality`;
- branch: `codex/css-totality-combinators-20260729`;
- predecessor HEAD: `a865ed9f68261b49c285dd16ebaa94ec2d1a7706`;
- N1-A4 research authority: `81b2a0aacebc126ac1a093407cb2e24ed5d78ee8`;
- N2b/N2c predecessor ruling:
  `dce5d318fc9cc875f6f5597be60d042dfa15c11e`;
- sole Luna xhigh task: `019fb12c-2624-7732-909a-e1e87ce7ef24`;
- frozen N2c output root:
  `/Users/mkbabb/Documents/Codex/2026-08-02/parser-novelty-n2c-ietm-f0-source/outputs`;
- proposed N2d transaction root:
  `/Users/mkbabb/Documents/Codex/2026-08-02/parser-novelty-n2d-ietm-f0-source`;
- proposed N2d writer subtree:
  `/Users/mkbabb/Documents/Codex/2026-08-02/parser-novelty-n2d-ietm-f0-source/outputs`.

The N2d path was absent at owner census. This turn neither creates it nor
sends a task. N-CBLC and N-DNF-BIR remain independent born-RED research
contracts and receive no N2c/N2d authority or credit.

## Reproduced frozen N2c census

The exact `outputs/` root contains two regular files, both mode `0644` with one
link. It contains no child directory, symlink, or special node. Total regular
file bytes are 32,841.

| File | Bytes | SHA-256 |
|---|---:|---|
| `preflight-n2c.mjs` | 25,045 | `a76dfb5cf64614160f228fb2ef7b25abccc164a9c6b3a591aed13e51dde1ace0` |
| `SOURCE-READY.md` | 7,796 | `26448c3ede859678dbba9a5f27024ce6123b7495fcc4de5dd049e1788ebb6d5e` |

No raw, result, fixture, manifest, checksum, log, or execution output is
present. `SOURCE-READY.md` declares source-only/unexecuted/unaudited,
`commandsRun: 0` for Node/source/scientific execution, and all credits zero.
The topology and source read are consistent with that declaration, but the
negative execution claim is not scientific proof and grants no credit.

No Node, `--check`, import, or source-defined function was invoked by this
owner review. Both files and the root are now terminal read-only archaeology.
They must not be repaired, executed, checked, imported, completed, copied into
N2d, manifested after the fact, or resealed.

## First owning reason

Disposition begins with:

```text
N2C_VERSION_OBJECT_LINEAGE_UNPROVED
```

`versionLineage()` at lines 205–227 accepts a version when it is a member of
the caller-supplied `input.versionObjects` array. It validates source hashes
with caller-supplied `deps.hashBytes`, reconstructs edits with caller-supplied
`deps.applyEdit`, and treats the same caller array as its ancestry domain.
`validateVersionSet()` at lines 334–353 merely repeats that coherent caller
domain.

The source never authenticates an owner-issued ledger root or opaque handle;
never binds the caller objects to an externally pinned ledger; and never
requires the version, parent, edit, byte, or dependency objects to be deeply
immutable. A caller can therefore supply a mutable forged lineage, matching
hash/edit functions, and internally coherent dependencies. Object membership
is not trust.

This first reason terminalizes N2c. The remaining failures are independently
material and prevent a narrow one-line or export-only correction.

## Independent secondary failures

### 1. Production/audit boundary is bypass-capable

`validateN2C` is exported at line 465. `AUDIT_TOKENS` exports the private
predicate objects at line 76. Production reads `input.audit.suppressToken` at
lines 467–474 and suppresses the matching rejection. The production signature
therefore contains a case/audit control plane and the caller receives the
tokens needed to drive it.

Disposition:

```text
N2C_PRODUCTION_VALIDATOR_BYPASS
N2C_CASE_DISCRIMINATOR
```

### 2. Raw authentication is caller-authored

`validatePins()` trusts caller-provided `input.trust.rawHashes`; decoded rows
come from caller-provided `deps.decodeRaw`, and products from
`deps.decodeProduct`. The source proves only consistency between caller bytes,
caller hashes, and caller interpretation. It does not prove that the decoded
object is the canonical meaning of the authenticated bytes.

Empty `rawBytes` and `rawHashes` arrays pass the cardinality loop. There is no
internally fixed set of row IDs, ordinals, expected count, run/product join, or
terminal row. `validateRawOrder([])` accepts. Missing, extra, reordered, or
summary-substituted evidence cannot be distinguished from a caller-selected
empty experiment.

Disposition:

```text
N2C_UNAUTHENTICATED_RAW_INPUT
N2C_TRANSITION_CLOSURE_INCOMPLETE
```

### 3. Relocation is incomplete and not joined to the candidate

`validateRelocation()` collects and relocates only fields whose property names
occur in `COORDINATE_KEYS` inside `entry.product`. Top-level memo coordinates,
spans/slots/frontier arrays, and unnamed coordinate-bearing fields are not
proved exhaustively by a machine-owned schema. Top-level `entry.start`,
`entry.offset`, `entry.examinedEnd`, and depth are checked for shape but not
relocated against the target.

The resulting `entry.relocatedProduct` is never required to equal the
transition's decoded candidate product. A locally coherent relocated object
and a different candidate can pass their separate checks.

Disposition:

```text
N2C_RELOCATION_PRODUCT_INCOMPLETE
N2C_COMPLETE_PRODUCT_INCOMPLETE
```

### 4. M2 binding is self-hashed and product-disconnected

The accepted commit string is pinned, but accepted/rebuilt artifact bytes and
semantic-envelope bytes are arbitrary caller inputs authenticated only against
hashes supplied in the same `input.m2` object. No externally pinned artifact
size/hash/toolchain/source manifest exists. The decoded transition control
products are not linked to either accepted or rebuilt artifact identity.

Disposition:

```text
N2C_REBUILT_M2_UNBOUND
N2C_COMPLETE_PRODUCT_INCOMPLETE
```

### 5. Effects have no nonzero or provenance obligation

Effects need only be arrays equal across transition, control, and candidate.
Three empty arrays pass. There is no internally fixed action/effect ID,
expected ordinal/count, exactly-once event, source version, phase, or callback
provenance. Equality of absent evidence is not effect safety.

Disposition:

```text
N2C_EFFECT_TRACE_INCOMPLETE
```

### 6. Hostiles are path-presence labels, not injectors

`HOSTILE_LEAVES` is exported and lists paths/family labels. The validator only
checks that each path resolves to a non-`undefined` value. It contains no
concrete production-consumed byte mutation, owner row, non-owner retention,
or byte-identical control. Some `reject()` calls pass a predicate group such
as `PREDICATES.raw`, which is not one of the exported leaf tokens recognized
by the suppression membership test; those rejection sites cannot own a valid
one-predicate suppression assay.

Disposition:

```text
N2C_LEAF_CONTROL_NOT_PRODUCTION_CONSUMED
N2C_PRODUCTION_VALIDATOR_BYPASS
```

### 7. Typed equality is not graph/descriptor complete

`typedEqual()` tracks only a left-to-right alias mapping. Two distinct left
objects may map to one shared right object without rejection. It reads
properties directly, so getters can execute; it does not compare property
descriptors, accessor/data shape, writability, enumerability, configurability,
or getter/setter identity. Prototype and key equality are insufficient for a
complete typed graph.

Disposition:

```text
N2C_LOSSY_PRODUCT_COMPARATOR
N2C_COMPLETE_PRODUCT_INCOMPLETE
```

### 8. Prose and machine source are not joined

`SOURCE-READY.md` claims owner-issued immutable versions, strict decoders,
production-consumed hostiles, complete transition closure, M2 binding, and a
single internal validator. No machine declaration binds those claims to exact
source symbols, predicate IDs, row IDs, counts, artifact pins, or call graph.
The prose can remain unchanged while the source violates it.

Disposition:

```text
N2C_HARDCODED_GATE_STATUS
N2C_PRODUCTION_VALIDATOR_BYPASS
```

## Credit disposition

| Plane | N2c disposition |
|---|---|
| two-file topology and byte identity | `GREEN, CENSUS ONLY` |
| source review | `TERMINAL RED` |
| version authority | `RED` |
| production/audit isolation | `RED` |
| raw/transition closure | `RED` |
| relocation/complete product | `RED` |
| accepted/rebuilt M2 linkage | `RED` |
| effects and hostile controls | `RED` |
| comparator and source/prose join | `RED` |
| source execution, correctness, equivalence, timing | `NOT RUN / 0` |
| PL-BE, PL-2X, PL-3X, historical 10x | `0` |
| parser runtime, CSS, Value, Keyframes, BBNF, product, API, package, release | `0` |

N2 scientific receipts remain `0/4`. An inert source packet that fails owner
review is not an N2 scientific receipt.

## N2d authorization

Disposition: `SOURCE_ARCHITECTURE_AUTHORIZED_NOT_SENT`.

One bounded N2d source-architecture transaction is authorized on the same
Luna task `019fb12c-2624-7732-909a-e1e87ce7ef24`. No new task, owner lineage,
prototype executor, sibling writer, N-CBLC implementation, or N-DNF-BIR
implementation is authorized.

The transaction may create only the previously absent root
`/Users/mkbabb/Documents/Codex/2026-08-02/parser-novelty-n2d-ietm-f0-source`
and its `outputs/` directory. `outputs/` must contain exactly two regular files
and no other node:

1. `preflight-n2d.mjs`;
2. `SOURCE-ARCHITECTURE.md`.

Luna may author inert bytes only. Luna must not invoke Node, import or check
the source, run static analysis, execute a validator/parser/prototype, create
fixtures/raw/results/tmp, time anything, or declare source/scientific GREEN.
The prose file must state unexecuted, unaudited, zero-credit, and owner-review
required. Any third file, directory below `outputs/`, symlink, special node,
outside-root write, command execution, import, or check is the first RED and
freezes N2d.

## Tighter N2d source-architecture law

### 1. Closed production boundary

The production validator is internal and non-exported. Its complete semantic
input is only:

```text
authenticated canonical evidence bytes
immutable externally trusted pin record
one narrowly audited SHA-256 primitive, only if unavoidable
```

It accepts no caller decoder, caller raw/product hash list, caller edit or
relocation function, caller equality, caller UTF-16 counter, caller expected
IDs, or caller object graph. The source owns one strict canonical decoder,
duplicate-key rejection, UTF-16 edit replay, coordinate relocation, complete
product decoding, and typed comparison.

The production signature has no audit, suppression, case, mutant, expected
reason, status, or policy override. It is never returned or exported.

### 2. Separate private audit wrapper

One separate unexported audit wrapper may suppress exactly one private
predicate token for controls-of-control. Tokens, predicate tables, injector
tables, and suppression state are module-private and absent from production
input/output. The wrapper calls the same production implementation and may not
change evidence bytes except through the internally declared injector.

Unknown, repeated, group-level, non-owner, unused, and multi-use suppression
are own-reason RED. The production path cannot observe whether it is under
audit except at the single private rejection choke point.

### 3. Owner-issued version ledger

The immutable trusted pin record names an owner-issued version-ledger root
handle, canonical ledger-root bytes/hash, grammar/action/environment epoch,
and expected version count. The internal decoder constructs and deeply freezes
the version, parent, edit, source-byte, dependency, and effect objects; the
evidence cannot supply live version objects or ancestry functions.

The source must reject missing/foreign root handles, cycles, duplicate labels,
cross-branch parents, mutable nodes, source/edit replay drift, and any ledger
node outside the pinned root. Left-recursion seeds/heads/in-progress growth are
never serializable or reusable.

### 4. Full relocation and exact target join

One internally fixed machine schema enumerates every coordinate-bearing field
in the memo entry and complete product, including top-level start/offset/
examined range/depth, spans, slots, frontier, rollback, recovery, diagnostics,
line-column, provenance, and nested fields. An unnamed numeric field cannot be
silently treated as non-coordinate.

The validator internally recomputes edit relocation from the pinned version
ledger, constructs the relocated complete product, and requires exact
graph/type/descriptor equality with the decoded target transition candidate.
No caller-supplied `relocatedProduct` is authority.

### 5. Internally fixed raw closure

The machine declaration fixes a nonzero ordered set of run/row/transition IDs,
ordinals, source-version joins, product joins, callback/effect obligations,
and exact count. The canonical envelope contains each exactly once. Missing,
extra, duplicate, reordered, cross-run, cross-product, summary, aggregate, and
empty evidence are distinct RED reasons.

Every decoded object is derived by the internal canonical decoder from the
authenticated bytes. Raw bytes and their meaning cannot be supplied through
separate caller channels.

### 6. Exact M2/product/effect authority

The external immutable pins bind exact accepted-M2 and rebuilt-M2 commit,
artifact path identity, byte count, SHA-256, source manifest, build command,
Node/V8/toolchain, semantic-envelope bytes/hash, and expected product row IDs.
Each decoded control product must join one exact artifact/row/source identity.
Self-hashed arbitrary artifacts are RED.

Complete products include values, graph aliases, property descriptors, holes,
`undefined`, exact number semantics, bytes, spans, slots, terminal/furthest/
frontier state, rollback, recovery, diagnostics, fault, depth, provenance,
selection, final offset, effects, and deep immutability. The comparator uses
bijective left-to-right and right-to-left alias maps, compares descriptors
without invoking accessors, and rejects unowned accessors.

Effect rows have internally fixed nonzero IDs, ordinals, callback/action
identity, phase, source version, and expected count. Exactly-once, order, and
provenance are required; equal empty arrays cannot satisfy an effect-bearing
row.

### 7. Concrete internal injectors and retentions

One private injector table owns concrete canonical-byte transformations. Each
injection reaches the same production decoder/predicate as the baseline,
changes exactly one declared invariant, and is associated with no caller-
visible expected code. The private audit wrapper proves the owning predicate,
all non-owner retentions, byte-identical unaffected rows, erased-mutation
control, unknown injection, and duplicate injection.

Path-presence labels and synthetic objects are not hostiles.

### 8. Machine declaration/source join

`preflight-n2d.mjs` contains one immutable machine declaration used directly
by decoding, row closure, predicates, pins, injectors, and result ordering.
There is no duplicate prose-only registry. `SOURCE-ARCHITECTURE.md` binds the
exact source SHA and declaration hash and maps every claim to a source symbol;
it cannot add a mechanism, row, pin, or GREEN state absent from the machine
declaration.

Owner review must reject source/prose count, symbol, hash, call-graph, or
predicate drift before any execution authority.

## N2d review and dispatch boundary

This commit authorizes but does not send the N2d source-architecture
transaction. The root coordinator may send one packet only after this ruling
is committed and its SHA-256 independently reproduced, N2c still matches the
two-file census above, and N2d remains absent. The packet must name the same
Luna task, literal N2d path, exactly-two-file law, and no-execution boundary.

After Luna becomes terminal, the owner freezes and censuses N2d, then performs
a read-only hostile static review of both files. The first source-law RED
terminalizes N2d. No Node/import/check or scientific execution is released by
source existence; another owner ruling is mandatory.

Product source, public API, Value CSS, package, Browser, candidate, release,
rebind, and downstream execution remain closed. N-CBLC and N-DNF-BIR remain
separately banked and undispatched.

## Terminal receipt

- N2c topology: `2/2 EXACT`;
- N2c source execution: `0`;
- N2c owner static review: `RED`;
- first owning reason: `N2C_VERSION_OBJECT_LINEAGE_UNPROVED`;
- N2c authority/novelty/equivalence/timing/product/law/downstream credit: `0`;
- N2c repair, rerun, import, check, or execution authority: `NONE`;
- N2d root at owner census: `ABSENT`;
- N2d disposition: `SOURCE_ARCHITECTURE_AUTHORIZED_NOT_SENT`;
- N2d files, execution, review, scientific receipt, or credit: `0`;
- task dispatch by this ruling: `NO`.
