# P6 — audit controls derived from the sole machine registry

Status: `PAPER_V6_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 70 charged LOC`.

PAPER-READY's canonical machine registry is the only control table. P6 does
not duplicate targets, fixtures, locators, bytes, operations, leaf identities,
codes, or arithmetic in prose. Its ordered P6 control IDs are `C01–C29`; the
machine registry derives owner-module counts `P0=5, P1=10, P2=1, P3=2, P4=1,
P5=10, P6=0` and future receipt total `930`.

Every row binds an authenticated fixture/domain, cardinality-one locator,
exact before/after hex bytes, operation, changed mask, collateral profile,
injector, full `LeafFunctionIdentity`, unique code, and audit receipt law.
Fixture bytes live in the manifest row and are authenticated by the packet
manifest; production materialization must owner-admit the identical bytes.

Production baselines use owner pins/admissions only. Audit mutations use an
independently owner-admitted immutable `AuditMutantEnvelope` derived from the
source-owned control row. For sealed pre/post domains the audit profile
recomputes exactly the allowed descriptors, membership roots, input/plan/seal
roots, and audit admission while preserving an authenticated unchanged mask.
It never reissues a production owner receipt. The owning leaf alone fails.

`LeafFunctionIdentity={ownerModule,moduleSourceHashFormula,astNodePath,
bodyHashFormula,leafId}`. Formulas hash the future owner module and exact AST
node bytes; actual hashes remain source-withheld and cannot be faked by paper
constants. The audit-only wrapper disables the same identity; all nonowners
retain identical identities/bodies. Production has no suppression argument.

Machine controls include exact missing-locator, duplicate-locator, and no-op
rows inside the 29-row registry. Baselines never hardcode unproved offset,
depth, FD, fixture, or hash values: each before value is read from the admitted
row fixture and exact-matched before mutation.

P6 participates in `E07/E08/E18/E19/E20/E21/E22/E23`. Shadow predicates,
reviewer/caller reissue, synthetic detached RAW bytes, count-only validation,
fallback, CSS grammar, or Fourier edge is RED.
