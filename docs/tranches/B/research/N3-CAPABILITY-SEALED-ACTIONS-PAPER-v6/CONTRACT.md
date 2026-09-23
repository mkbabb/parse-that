# N3 capability-sealed actions — paper v6

Status: **PAPER RED / ZERO CREDIT / TWO FRESH REVIEWS REQUIRED**

N3-v6 freezes rejected v5 at commit `2594fa5e…` and rebuilds its paper
authority. It retains the exact 51 material IDs, three positive IDs, full
source/function identities, 2,550 nonowner denominator, unsigned-message
principle, and external Ed25519 signatures. Nothing in this packet executes.

## One root law

Every typed value excludes its root. Its envelope root is exactly:

`SHA256(UTF8("parse-that:N3:v6:" + type + U+0000 + canonical(value)))`

Canonical values are recursive JSON with unique lexicographically sorted object
keys, order-preserving arrays, UTF-8 strings, safe decimal integers, booleans,
and null, with no whitespace. The same law roots the registry value. There is
no second domain, hidden field bundle, self-root, or signature inside a signed
message. The machine registry contains every schema, value, envelope, edge,
root, and signed receipt needed to reproduce this law.

## Concrete lifecycle

The exact ledger chain is:

`OPEN → HELD → RUNNING → FINISHED → COMMITTED`

Each state is a concrete `LedgerVersionV6`. Every successor names the exact
predecessor root. Four `UnsignedTransitionMessageV6` objects join exact
before/after roots, states, lease, grant, authorities, sequence, and observed
CAS root. The FINISHED→COMMITTED transition's before root is the concrete
FINISHED version—not HELD.

The lease-grant, four transitions, and commit are unsigned messages.
`SignatureReceiptV6` objects hold signatures outside those message roots.
The registry admission is likewise externally signed. All seven signatures use
the exact externally pinned Ed25519 key and are independently replayable.

Concrete typed objects cover rotation, revocation, issuer, action definition,
behavior derivation, lease, five ledger versions, grant, four transitions,
attempt, effect record/trace/status, reuse decision, commit, signatures, and
five integrations. Schema key sets equal object key sets exactly.

## Actual-object controls

Each of the 51 material controls names an actual object and direct typed field.
Its BEFORE bytes are the canonical bytes of that field in the signed baseline.
The injector mutates that real field, reserializes the object, recomputes its
root, follows the authenticated dependency graph, and records every induced
object/root plus the new registry root. Reference-field mutants retain the
broken join while downstream consumers rebind to the mutated object's root.

The shared proposed validator is one exact self-contained source artifact. It
recomputes object and registry roots, checks every dependency, verifies the
signed baseline, validates the five-state ledger, validates effect lease/count/
ordinal/contiguity/duplicate/gap laws, and validates schema-bound behavior,
effect, and reuse receipts. A leaf compares the candidate's actual field with
the owner-signed baseline field. It does not contain or compare against the
advertised AFTER literal. Each row also carries a distinct alternate invalid
mutation; both mutations have recomputed roots and the same owning error.

Owner suppression and control-of-control retain the identical mutant registry
root and disable only the owning full function identity. Each of all 2,550
nonowner receipts binds the control ID, mutant registry root, disabled nonowner
full-function root, and retained owning result. Unknown and duplicate controls
are concrete machine objects, not count-only assertions.

All five integration objects bind an owner function root that resolves in the
51-entry leaf registry. Value remains sole CSS grammar/consumer/UI owner; no
direct Fourier edge exists.

## Exact paper denominator

51 baseline + 3 positive + 51 owner reject + 51 combined owner
suppression/control-of-control + 2,550 nonowner + 51 exact no-op + 1 unknown +
1 duplicate = **2,759** future receipts.

## Boundary

This is paper authority only. Parser/product source, CSS implementation,
prototype, benchmark, Node/AST execution, package, release, rebind, law credit,
and review dispatch are forbidden. All credit is zero. Freeze this exact packet
for two fresh non-author reviews.
