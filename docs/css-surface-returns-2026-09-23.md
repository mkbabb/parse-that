SERVED MODEL: claude-opus-5-5

# The CSS surface returns to parse-that master — `proof:no-css-surface` retired (2026-09-23)

**Authority.** value.js `docs/tranches/X/COHESION.md` §0bl (2026-09-23, OA-38), which minted X.P.W5 (`docs/tranches/X/parse-that/waves/W5.md`): parse-that's CSS surface lands on parse-that master, value.js parses CSS through that seam, and the value.js hand grammar is retired (no dual path). Unit X.P.W5.a executes the merge.

**What this commit does.**
- Merges `w2/harness` (tip `31999135`, from the `parse-that-css-totality-p2` worktree) onto `master` (`ef10d5b`) with history kept: a merge commit whose second parent is `31999135` (master was an ancestor; 169 commits come in).
- Deletes `typescript/scripts/proof-no-css-surface.mjs` and removes `proof:no-css-surface` from `typescript/package.json` and from the `proof:all` chain.

**Why the proof is retired, not edited.** The proof encoded tranche A's premise (A.W1, inv-A-1: "the CSS grammar moved to value.js (D2/D3) … the CSS surface is GONE — permanently"). §0bl reverses that direction: CSS parsing lives in parse-that again and value.js consumes it. A gate asserting the absence of a surface this repo now ships has no true reading, so it is removed with the premise, in the same commit that brings the surface in. The tranche A records (`docs/tranches/A/`) stay as written; this note sits beside them.
