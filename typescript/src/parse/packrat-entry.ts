// Subpath entry: "@mkbabb/parse-that/packrat" (A.W3).
//
// The opt-in packrat / left-recursion memoization tier. Thin re-export of
// packrat.ts (NOT modified here — owned by A.W2 on its own branch).
export { memoize, mergeMemos, resetPackrat } from "./packrat.js";

// X.P.W4.e2 / E-w4e-2 cure (a) (COHESION §0aa). The epoch boundary `parser.ts:42/46` already
// calls — `packratEnter()` reads the latch and returns `null` while unarmed, `packratExit(saved)`
// restores the parent — is now ON this subpath, so the latch is readable through the package's own
// export map rather than only from its TypeScript sources through a loader. Nothing in packrat.ts
// changes: these are re-export lines and the tier's behaviour is untouched.
export { packratEnter, packratExit } from "./packrat.js";
