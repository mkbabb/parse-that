# VALUEJS-PT-E — 2026-07-05 (the value.js 1.1.0+ ask letter)

**From**: the value.js Tranche S orchestrator (item W1-9) · **To**: @mkbabb/parse-that.
**Provenance**: value.js `docs/tranches/S/audit/SYNTHESIS.md §7.2` + `audit/lanes/parse-that-audit.md §4`.

**Written to STAND ALONE** — assume zero shared session memory; every fact you need is inline.
Nothing here gates any parse-that wave. This is a **1.1.0+ ask letter** (no defect asks) paired with
the value.js-side decision on the dead `ParseDiagnostic.expected` field. Dispatched as value.js
publishes **3.0.0** (S.W1; `dist-tags.latest=3.0.0`, tag `v3.0.0`).

**Placement note**: parse-that carries no established inbox convention (tranche A is your only tranche
and is CLOSED+PUBLISHED at `@mkbabb/parse-that@0.11.0`); this file follows the constellation pattern
(an incoming `VALUEJS-*` letter in the recipient's latest tranche dir, mirroring keyframes.js
`docs/tranches/S/VALUEJS-R-COORDINATION-2026-07-03.md`). Re-home it if you open a coordination inbox.

---

## Standing context (the good news first)

value.js's parse-that consumption is verified clean end-to-end (`parse-that-audit §1`): packrat arming
is a realized pure win at **82 ns/parse**; the 4 `.chain()` sites are provably falsy-seed-immune; the
`^1.0.0` re-pin shipped as value.js **2.0.1** (`a7eabcc`) with `color2Into` currency green. **No defect
asks.** Everything below is 1.1.0+ surface.

## The asks (SYNTHESIS §7.2, transcribed)

| # | Ask | Priority |
|---|---|---|
| **PT-E1** | **Scoped per-parse diagnostics** — cures the structurally-dead `ParseDiagnostic.expected`. value.js authors parse-error messages that today cannot reach any consumer; downstream this unlocks real error messages for kf's `ResolvedKeyframes.diagnostics`. value.js pairs this with its own decision on the dead `expected` field (below). | **HIGH** |
| **PT-E2** | **Combinator-inference tightening** — the `Parser<any>` inference leak the audit named (`parse-that-audit §4.2`); tighter generic flow-through so consumer barrels stop widening. | MED |
| **PT-E3** | **Pratt stays dormant — on the record**: the calc() 2-tier fold transposition "does not clear a KISS/DRY bar" (`parse-that-audit §4.3`). value.js will **NOT** pull it forward; the value.js S.H3 consume-edge book fires only when parse-that presents the sketch. This row is a **record, not an ask**. | record |

## The value.js-side half of PT-E1 (the dead `expected` decision)

At S.W1-4 value.js fixed its own message-plumbing: `fail(message)` now reaches `mergeErrorState` (three
authored messages were previously discarded). So value.js post-W1-4 **routes its own authored parse
messages correctly**. The remaining gap is entirely parse-that-side: `ParseDiagnostic.expected` has no
producer path from a scoped parse, so value.js's messages still cannot surface to a consumer. **Decision**:
value.js KEEPS authoring the messages (they are correct and ready) and does **not** delete the `expected`
field — it holds as the forward seam PT-E1 lights up. When PT-E1 lands, value.js's messages flow through
with no value.js-side change required.

## Non-motion (recorded)

No parse-that source is touched on value.js's account (SYNTHESIS §4). The value.js parse-layer P0s
(`round()` optional-strategy crash, `extract*` depth-walk, `fail()` message merge) were all value.js-side
fixes landed in the 3.0.0 cut — named here only so the diagnostics ask (PT-E1) is read against a consumer
that already routes its own authored messages correctly.
