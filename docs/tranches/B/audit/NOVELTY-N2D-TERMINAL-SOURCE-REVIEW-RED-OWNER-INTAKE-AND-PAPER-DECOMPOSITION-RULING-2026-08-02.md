# Novelty N2d terminal source-review-RED owner intake and paper-decomposition ruling

Date: 2026-08-02

Status: **N2D TERMINAL SOURCE_REVIEW_RED — ZERO CREDIT — PAPER DECOMPOSITION REQUIRED, NOT DISPATCHED — N2E SOURCE/EXECUTION WITHHELD**

## Scope and coordinate

This tranche-development ruling freezes the inert N2d source-architecture
packet, records the first owning falsifier and independent secondary defects,
and replaces another source attempt with a bounded paper design-contract
decomposition. It does not import, check, analyze, or execute N2d; dispatch a
task or paper review; create N2e; modify parser or Value source; select a
performance law; or grant scientific, equivalence, timing, novelty, product,
CSS, package, API, consumer, candidate, release, or rebind credit.

- repository: `/Users/mkbabb/Programming/parse-that-css-totality`;
- branch: `codex/css-totality-combinators-20260729`;
- predecessor HEAD: `e37431bc761149c3f742271e41c623b636102aa9`;
- N1-A4 research authority: `81b2a0aacebc126ac1a093407cb2e24ed5d78ee8`;
- N2c/N2d predecessor ruling SHA-256:
  `0eb63a52bda09cb304bc508759fc166cbd9ccba05af7da3252fbd246f0678f05`;
- sole prior N2 author task: `019fb12c-2624-7732-909a-e1e87ce7ef24`;
- frozen N2d output root:
  `/Users/mkbabb/Documents/Codex/2026-08-02/parser-novelty-n2d-ietm-f0-source/outputs`.

The prior Luna task receives no continuation authority from this ruling. N2e
has no root, file list, task, source, execution, or dispatch authority.
N-DNF-BIR and N-CBLC remain independent born-RED paper contracts and receive
no N2d credit.

## Reproduced frozen N2d census

The exact `outputs/` root contains two regular files, both mode `0644` with one
link. It contains no child directory, symlink, or special node. Total regular
file bytes are 56,524.

| File | Bytes | SHA-256 |
|---|---:|---|
| `preflight-n2d.mjs` | 45,399 | `1cfa4f3b434ef2f7ab4a1026114fe4df364ccdbd63fdfd300d197ad55e15d18d` |
| `SOURCE-ARCHITECTURE.md` | 11,125 | `e696f120b39e9d8f070857e9307460b670a7d65dba72cf356582cc530c6b855e` |

No raw, result, fixture, manifest, checksum, log, receipt, or execution output
is present. `SOURCE-ARCHITECTURE.md` declares the packet unexecuted,
unaudited, authority `NONE`, and all credits zero. The bytes and topology are
consistent with that declaration, but do not prove readiness.

This owner used only read-only `find`, `stat`, `shasum`, `wc`, `rg`, `sed`, and
line-numbered reads. No Node, `--check`, import, source function, static
analyzer, validator, parser, prototype, test, build, benchmark, or package
command ran. Both files and the root are now terminal read-only archaeology.
They must not be repaired, checked, imported, executed, completed, copied,
manifested after the fact, or resealed.

## First owning falsifier

Disposition begins with both aspects of one structural failure:

```text
N2D_OWNER_VERSION_LEDGER_ROOT_UNBOUND
N2D_RELOCATION_VACUOUS
```

`PIN_KEYS` at source lines 37–40 names only `rootHandle` and `rootHash` for the
ledger boundary. `decodePins()` at lines 446–455 defines `rootHash` as the
SHA-256 of the public handle bytes themselves. It never receives or hashes
canonical ledger bytes, a ledger node table, an owner signature, or an opaque
owner-issued handle-to-ledger binding.

`decodeVersions()` at lines 474–498 then accepts a separately supplied version
array. Each source is self-hashed, and the root joins the pin only by copying
the same public handle bytes. An internally coherent evidence author can
therefore replace both the version domain and copied root handle without an
external ledger-byte authority.

The defect is also experimentally vacuous in source shape:

- `VERSION_COUNT` is exactly `1` at line 19;
- the only root edit must be `null` at line 488;
- every run fixes `sourceVersionOrdinal` to `0` at line 730;
- every transition fixes `sourceVersionOrdinal` to `0` and
  `parentVersionOrdinal` to `null` at line 743;
- `validateTransition()` therefore passes the same version as both `base` and
  `target` to `editsFromAncestor()` at lines 753–757;
- the resulting edit list is always empty.

No nonidentity insert, delete, or replace can reach relocation; no child
version can prove edit replay; and no old-to-new coordinate can be target-
joined. The load-bearing N-IETM mechanism is absent even if every shaped row
were accepted. This first falsifier terminalizes N2d.

## Independent secondary defects

### 1. Machine declaration is a shadow registry

`MACHINE_DECLARATION` is a string, while executable run, row, transition,
effect, version, product, coordinate, predicate, and injector authorities live
in separate mutable constants. `MACHINE_DECLARATION_SHA256` is declared but
never checked or consumed. The decoder does not derive the executable tables
from authenticated declaration bytes, and the prose cannot prove that the
parallel constants agree.

Disposition:

```text
N2D_MACHINE_DECLARATION_SHADOW_REGISTRY
N2D_SOURCE_PROSE_JOIN_UNPROVED
```

### 2. Decoder accepts noncanonical spellings

`decodeCanonical()` accepts escaped slash, although `encodeCanonical()` emits
literal slash. `decodeHex4()` accepts uppercase hexadecimal digits, and the
decoder accepts alternate escaped control spellings that the encoder reduces
to short escapes. No decode-to-canonical-encode byte equality is required.
Multiple byte strings can therefore carry the same decoded object while the
packet claims a single canonical byte authority.

Disposition:

```text
N2D_CANONICAL_ROUNDTRIP_UNPROVED
```

### 3. Coordinate manifest is self-described and mechanically false

Product fields such as raw frontier, rollback, recovery, selection, slots,
spans, and other numeric domains are not typed by a schema that distinguishes
coordinates from ordinary integers. The evidence chooses coordinate tags and
the evidence also supplies the coordinate manifest.

At lines 600–601, `manifestRef` is the manifest array while `observed` contains
fresh row objects, so `row !== manifestRef` removes nothing. The manifest is
therefore counted among the observations it is supposed to describe.
Comparison also uses locale-dependent `localeCompare()` at lines 602–603,
rather than a fixed byte-order comparator.

Disposition:

```text
N2D_COORDINATE_SCHEMA_VACUOUS
N2D_COORDINATE_MANIFEST_SELF_AUTHORED
```

### 4. Relocation does not cover or join the full memo product

`cloneRelocated()` maps only explicit `kind: "coordinate"` nodes inside the
decoded product. `decodeMemo()` leaves `examinedStart`, expected/frontier,
rollback, recovery, selection, slots, spans, and examined source domains as
untyped raw values; top-level start/offset/examinedEnd/depth are wrapped but
never relocated or compared to target memo state. `reuse.targetProduct` is
accepted by shape but never decoded or used. A product-only comparison cannot
prove complete memo-state relocation.

Disposition:

```text
N2D_RELOCATION_PRODUCT_INCOMPLETE
N2D_COMPLETE_PRODUCT_TARGET_JOIN_ABSENT
```

### 5. Effect provenance is evidence-authored

Action ID, callback ID, phase, count, payload, row, run, and version are all
supplied by the evidence. The product then echoes the same evidence-owned
values. No externally owned action/grammar identity or independently observed
callback invocation binds those strings to an executed semantic action.

Disposition:

```text
N2D_EFFECT_PROVENANCE_SELF_AUTHORED
```

### 6. Leaf controls are not production-consumed

Failure ownership is inferred from message substrings into broad predicate
groups. Injectors contain paths/operations, but the packet provides no
executed baseline, concrete owner rejection, all-non-owner retention,
byte-identical unaffected retention, erased mutation, unknown/duplicate
injection, or production-only rejection proof. Only an owner-suppression path
is encoded. Some injectors do not reach a valid baseline shape. Production
also returns `suppressionUses`, exposing audit-plane state in the common core.

Disposition:

```text
N2D_LEAF_CONTROL_NOT_PRODUCTION_CONSUMED
N2D_CONTROL_OF_CONTROL_INCOMPLETE
```

### 7. M2 source manifest is unauthenticated

Artifact and source-manifest entries validate caller-supplied path, byte-count,
and SHA strings. Source manifest bytes are absent, so their hashes cannot be
recomputed. Commit, build command, Node, V8, and toolchain values are supplied
inside the same pin bytes rather than by an external owner. Artifact bytes can
join a self-authored manifest without proving accepted/rebuilt M2 identity.

Disposition:

```text
N2D_M2_SOURCE_MANIFEST_UNAUTHENTICATED
N2D_EXTERNAL_PIN_OWNER_ABSENT
```

### 8. Architecture prose is not mechanically consumed

`SOURCE-ARCHITECTURE.md` describes one declaration, a closed production
boundary, owner-issued versions, complete coordinate relocation, concrete
hostiles, and exact source/prose binding. No external verifier checks its
symbol, call-graph, hash, count, interface, or claim rows against source. The
source does not consume the declaration hash. Prose and source can diverge
without rejection.

Disposition:

```text
N2D_SOURCE_PROSE_JOIN_UNPROVED
N2D_HARDCODED_GATE_STATUS
```

## Credit disposition

| Plane | N2d disposition |
|---|---|
| two-file topology and byte identity | `GREEN, CENSUS ONLY` |
| owner hostile source review | `TERMINAL RED` |
| owner version-ledger authority | `RED` |
| nonidentity relocation/edit replay | `RED / UNREACHABLE` |
| canonical decoder | `RED` |
| coordinate/product/effect/M2 authority | `RED` |
| production leaf controls and source/prose join | `RED` |
| source execution, syntax, correctness, equivalence, timing | `NOT RUN / 0` |
| PL-BE, PL-2X, PL-3X, historical 10x | `0` |
| novelty, scientific receipt, parser runtime, CSS, Value, Keyframes, BBNF | `0` |
| product, package, API, Browser, candidate, release, rebind | `0` |

N2 scientific receipts remain `0/4`. N2d is a terminal source packet, not a
scientific result.

## Paper design-contract decomposition

Disposition: `PAPER_DECOMPOSITION_REQUIRED_NOT_DISPATCHED`.

Another monolithic source preflight is prohibited. The next legal formation
work is paper only: eight separately hashable interface contracts, one hash
manifest, and one paper receipt. No `.js`, `.mjs`, `.cjs`, `.ts`, `.wasm`, raw,
fixture, result, generated source, executable schema, or prototype file is
authorized. No N2e name or source root is reserved by this ruling.

The prospective paper packet must use the currently absent directory
`docs/tranches/B/research/N2-IETM-PAPER-DECOMPOSITION-2026-08-02/` and contain
exactly:

1. `P0-DECLARATION-LEDGER.md`;
2. `P1-CANONICAL-CODEC.md`;
3. `P2-RELOCATION-ALGEBRA.md`;
4. `P3-COORDINATE-PRODUCT-SCHEMA.md`;
5. `P4-EFFECT-PROVENANCE.md`;
6. `P5-M2-PIN-AUTHORITY.md`;
7. `P6-PRODUCTION-LEAVES.md`;
8. `P7-SOURCE-PROSE-VERIFIER.md`;
9. `PAPER-MANIFEST.sha256`;
10. `PAPER-READY.md`.

Each interface file is independently hashed by the manifest. `PAPER-READY.md`
may list identities and status only; it cannot add an interface, mechanism,
exception, or favorable claim absent from P0–P7.

### Interface and implementation budgets

The paper files define future boundaries; they do not authorize the future
modules. Blank and comment-only lines do not count toward a future source LOC
budget. Generated bytes, embedded tables, copied schemas, and inline fixtures
count in full. A budget overflow is paper RED and must be reconciled before
source, not hidden behind helpers or a build step.

| ID | Load-bearing paper contract | Future module budget | Future nonblank/noncomment LOC ceiling |
|---|---|---:|---:|
| `P0` | authenticated declaration bytes plus owner-issued immutable ledger bytes/root; IDs/counts derived once; at least two versions and one nonidentity insert/delete/replace | 1 | 120 |
| `P1` | one strict decoder/encoder pair; decode→encode byte identity; UTF-8/UTF-16, escapes, duplicate keys, integer and byte-order law | 1 | 170 |
| `P2` | pure relocation algebra over ancestor→descendant edit chains; interval invalidation and total coordinate mapping; base and target must differ | 1 | 110 |
| `P3` | closed typed memo/product schema; every coordinate domain declared once; schema-derived traversal and exact relocated-state/target join | 1 | 160 |
| `P4` | externally bound action/callback/grammar identity and exactly-once effect provenance; no evidence-authored echo | 1 | 70 |
| `P5` | owner-side accepted/rebuilt M2 pin record over real manifest/artifact bytes, commands, runtime, products, and semantic envelope | 1 | 60 |
| `P6` | production predicate leaves, concrete byte injectors, owner suppression and all non-owner/control-of-control retentions; no message routing | 1 | 100 |
| `P7` | external verifier for declaration/source/interface/prose hashes, symbols, call graph, counts, budgets, and forbidden edges | 1 | 60 |
| **total** | no shared catch-all or extra runtime module | **8** | **850** |

Each paper interface is limited to 100 nonblank lines; the eight-interface
packet is limited to 650 nonblank lines excluding the manifest and receipt.
The manifest and receipt are each limited to 40 nonblank lines. Cross-
interface assumptions must appear as typed input/output rows in both owning
contracts; prose references cannot smuggle shared state.

### Required paper obligations

`P0` must make ledger bytes, not a copied handle, the trust root. It must show
at least a root and child version, a nonidentity edit, source replay, immutable
parent relation, grammar/action/environment epoch, and an externally owned root
hash. Evidence may reference a version ordinal but may not author ledger nodes.

`P1` must specify a single accepted byte spelling for every value and require
exact decode→encode equality before semantics. It must include escaped slash,
short versus Unicode control escape, uppercase/lowercase hex, Unicode scalar,
surrogate, duplicate-key, key-order, and integer counterexamples.

`P2` must define insert, delete, replace, composition, intersection,
invalidation, and old→new mapping for points, half-open intervals, EOF, depth,
line/column, and negative/frontier reads. Its smallest proof must use at least
two versions and produce a nonempty edit chain.

`P3` must distinguish coordinate-bearing integers from semantic integers in a
machine-owned algebraic schema. It must derive traversal from that schema,
cover top-level memo state and all nested product domains, preserve graph and
descriptor identity, and join the fully relocated memo state to one exact
target candidate.

`P4` must name the external owner of grammar/action/callback identity and the
observation that proves a callback ran exactly once. Evidence cannot supply
both the expected and observed event.

`P5` must keep accepted/rebuilt M2 pins outside submitted evidence and bind
real source-manifest bytes, artifact bytes, commit, command, Node/V8/toolchain,
semantic envelope, and row/product identities. Self-hashed metadata is RED.

`P6` must define one production predicate per owning code, concrete canonical-
byte mutations, a private audit wrapper, owner suppression, every non-owner
retention, byte-identical unaffected rows, erasure, unknown, duplicate, and
group-token rejection. Production output exposes no audit counter or token.

`P7` must be external to the candidate modules and accept only frozen bytes and
trusted hashes. It verifies exact source/interface/prose membership, symbol
ownership, call graph, declaration use, budgets, and absence of source/VM/
scanner/event-tape/fallback aliases. Candidate code cannot self-approve it.

## Two-review gate

No source follows the paper author directly. After the owner freezes and
hashes the exact paper packet, two fresh non-author read-only reviews are
required:

1. `Paper Review A`: GPT Sol xhigh, interface soundness, genealogy,
   reachability, and contradiction review;
2. `Paper Review B`: GPT Luna xhigh, hostile counterexamples, ownership,
   budget, and cross-interface closure review.

The reviewers receive the same frozen packet and historical falsifiers. They
do not see each other's output before both are terminal. Each returns one
separately hashed paper review with per-interface `ACCEPT`, `AMEND`, or `PRUNE`,
exact missing obligations, and no source or execution. Neither review grants
scientific, novelty, law, product, or release credit.

Any `AMEND`, hash drift, interface overlap, unowned input, unreachable
nonidentity relocation, self-authored expected/observed pair, source-shaped
pseudocode, budget excess, or S/C/V/E/EVENT/TOKEN fallback keeps the program on
paper. Only a later owner agglomeration may decide whether any bounded source
transaction exists. It must name exact accepted interface hashes and receive a
separate explicit authorization. There is no automatic N2e.

## Exact next-boundary law

1. Preserve N2-F0, both N2a roots, N2b, N2c, and N2d unchanged.
2. Preserve N1-A4 and all P1–P6 evidence as immutable chronology.
3. Do not resume the N2 Luna author task or create a source/prototype task.
4. Do not create, name, or populate an N2e source root.
5. Author only the ten-file paper packet above in a fresh absent parser-tranche
   research directory; record zero execution and zero credit.
6. Freeze, census, and independently hash all ten files before review.
7. Dispatch no review from this ruling. When separately authorized, obtain the
   two independent paper reviews in the order-independent sealed protocol.
8. Owner agglomeration follows both reviews; any material dissent returns to
   paper.
9. Source architecture, execution, timing, CSS, package, API, candidate,
   consumer migration, release, and rebind remain closed until another owner
   ruling explicitly opens one bounded transaction.

## Terminal receipt

- N2d topology: `2/2 EXACT`;
- N2d regular bytes: `56,524`;
- N2d source execution/static analyzer: `0`;
- N2d owner hostile source review: `RED`;
- first owning reasons:
  `N2D_OWNER_VERSION_LEDGER_ROOT_UNBOUND` /
  `N2D_RELOCATION_VACUOUS`;
- N2d scientific/equivalence/timing/novelty/product/CSS/law/downstream credit:
  `0`;
- N2d repair, rerun, import, check, source execution, or same-task continuation
  authority: `NONE`;
- N2e source root/task/files/execution/credit: `NONE / 0`;
- next work: `PAPER_DECOMPOSITION_REQUIRED_NOT_DISPATCHED`;
- paper review dispatch by this ruling: `NO`.
