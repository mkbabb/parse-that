// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — THE PACKRAT LATCH, OBSERVED RATHER THAN INFERRED (W1.md §3a, §5.d.1, G-4).
//
// THE FACT BEING GUARDED (INBOX O-15 PT-03, re-measured at this seat's clock in the
// installed dist `packrat-entry-*.js`):
//
//     :678   let PACKRAT_ARMED = false;      <- the declaration
//     :682   if (!PACKRAT_ARMED) return null;   (packratEnter)
//     :714   if (!PACKRAT_ARMED) return;        (resetPackrat)
//     :722   PACKRAT_ARMED = true;           <- the ONLY assignment, inside makeMemoized()
//
// One assignment, to `true`, and no assignment back to `false` anywhere in the bundle.
// The latch is therefore ONE-WAY: `resetPackrat()` clears MEMO/HEADS/GROWING and leaves
// the latch armed (O-15: UNARMED 93.9 -> ARMED 138.2 ns/parse = 1.47x, reset leaves 139.3).
// A harness that arms it in an early cell measures every later cell at the armed rate.
//
// WHY A LOADER HOOK, AND WHY NOTHING WEAKER.
// `PACKRAT_ARMED` is a module-local binding of the bundled chunk. It is not exported: the
// chunk's own export list is {P,a,b,c,d,e,f,g,h,i,j,k,l,m,n,r,s,t,w} and `packrat.js`
// re-exports only memoize/mergeMemos/resetPackrat, so no public value of the package
// reveals it. W1.md §3a forbids the fallback ("we did not call memoize, therefore it is
// unarmed") in terms: makeMemoized() is reachable transitively from a grammar. So the
// value itself must be READ.
//
// `module.registerHooks()` (node >=22.15, synchronous, in-thread) loads the installed dist
// bytes through the ordinary resolver and appends ONE exported accessor that closes over
// the live binding. The module instance the accessor reads is THE SAME instance every
// importer in the process gets (the ESM cache is keyed by URL), so the reading is of the
// latch the grammar would arm -- not of a copy, not of a re-evaluation.
//
// NON-INTERFERENCE, ASSERTED NOT ASSUMED:
//   * the file on disk is never written (`node_modules` is read-only to this lane);
//     `originalSha256` below is the digest of the bytes as loaded, and `verifyOnDisk()`
//     re-reads the file afterwards and compares.
//   * the appended text is a single `export function` whose body is `return PACKRAT_ARMED`.
//     It reads; it cannot assign. `armSites` counts the `= true` assignments in the
//     ORIGINAL source so a reader can see that the appended text adds none.
//   * the accessor is proved to be a live read, not a constant, by the positive control in
//     `diagnostics-suite.mjs`: memoize() flips it false -> true and resetPackrat() leaves
//     it true, in a quarantined process that the bench never enters.

import { registerHooks } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The name of the appended accessor. Deliberately ugly: it must never collide. */
export const READER = "__xpw1d_readPackratArmed__";

/** Modules that declare the latch, keyed by module URL. Populated by the load hook. */
const REGISTRY = new Map();

/** `let PACKRAT_ARMED = false;` / `var PACKRAT_ARMED = false;` — the declaration site. */
const DECL = /^[ \t]*(?:let|var)[ \t]+PACKRAT_ARMED[ \t]*=[ \t]*false[ \t]*;[ \t]*$/m;
/** The arming assignment. Counted, never matched loosely. */
const ARM = /PACKRAT_ARMED[ \t]*=[ \t]*true/g;

registerHooks({
    load(url, context, nextLoad) {
        const result = nextLoad(url, context);
        if (result.format !== "module" || result.source == null) return result;
        const source =
            typeof result.source === "string"
                ? result.source
                : Buffer.from(result.source).toString("utf8");
        if (!DECL.test(source)) return result;

        const lines = source.split("\n");
        const declLine = lines.findIndex((l) => DECL.test(l)) + 1;
        const armLines = [];
        lines.forEach((l, i) => {
            if (/PACKRAT_ARMED[ \t]*=[ \t]*true/.test(l)) armLines.push(i + 1);
        });

        REGISTRY.set(url, {
            url,
            path: url.startsWith("file:") ? fileURLToPath(url) : url,
            bytes: Buffer.byteLength(source, "utf8"),
            originalSha256: createHash("sha256").update(source).digest("hex"),
            declLine,
            armSites: (source.match(ARM) || []).length,
            armLines,
        });

        return {
            ...result,
            source:
                source +
                `\nexport function ${READER}() { return PACKRAT_ARMED; }\n`,
        };
    },
});

/** How many latch-bearing modules this process has loaded. */
export function latchModuleCount() {
    return REGISTRY.size;
}

/**
 * Read every loaded latch, live. Returns one row per latch-bearing module.
 * Throws if a registered module lost its accessor — an unobservable latch HALTS (§3a);
 * it is never downgraded to an assumption.
 */
export async function readLatches() {
    const rows = [];
    for (const [url, meta] of REGISTRY) {
        const ns = await import(url);
        const read = ns[READER];
        if (typeof read !== "function") {
            throw new Error(
                `HALT (W1.md §3a): PACKRAT_ARMED is not observable on ${meta.path} — ` +
                    `the accessor is ${typeof read}. A bench cell that cannot prove itself ` +
                    `unarmed halts; it may not fall back to "we did not call memoize".`,
            );
        }
        rows.push({ ...meta, armed: read() });
    }
    return rows;
}

/**
 * Assert every loaded latch reads false, at `phase` ("entry" | "exit").
 * `expectAtLeast` guards the other half of the claim: a cell that loaded NO latch-bearing
 * module has not proved anything about the latch, and saying so is the point of the count.
 */
export async function assertUnarmed(phase, expectAtLeast = 1) {
    const rows = await readLatches();
    if (rows.length < expectAtLeast) {
        throw new Error(
            `HALT (W1.md §3a): ${rows.length} latch-bearing module(s) loaded at ${phase}, ` +
                `expected at least ${expectAtLeast}. An unobserved latch is not an unarmed latch.`,
        );
    }
    const armed = rows.filter((r) => r.armed);
    if (armed.length > 0) {
        throw new Error(
            `G-4 FAILED at ${phase}: PACKRAT_ARMED === true in ` +
                armed.map((r) => r.path).join(", "),
        );
    }
    return rows;
}

/** Re-read each registered module from disk and confirm the bytes never moved. */
export function verifyOnDisk() {
    const out = [];
    for (const meta of REGISTRY.values()) {
        const now = createHash("sha256")
            .update(readFileSync(meta.path, "utf8"))
            .digest("hex");
        out.push({ path: meta.path, unchanged: now === meta.originalSha256, sha256: now });
    }
    return out;
}
