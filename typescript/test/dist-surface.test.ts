import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// PT-WAVE-3a — publish-discipline gate: the built dist must export what the
// source exports. The shipped 0.8.2 dist exported only 8 of the 15 span fns
// (a silent source<->dist version-drift defect: `import { altSpan }` from the
// pinned dist hit a runtime `undefined`, and the version number lied about it).
// This gate bites that drift: it parses the named exports of the source barrel
// and asserts each is present in the built dist declaration file.

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_INDEX = resolve(__dirname, "../src/parse/index.ts");
const DIST_INDEX = resolve(__dirname, "../dist/index.d.ts");

/** Extract the value-level named exports from a barrel `index.ts`. */
function namedExports(src: string): Set<string> {
    const names = new Set<string>();
    // export { a, b, type C, D as E } from "...";
    const re = /export\s*\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
        for (const raw of m[1].split(",")) {
            const part = raw.trim();
            if (!part) continue;
            // Drop `type X` re-exports — type-only, not runtime surface.
            if (part.startsWith("type ")) continue;
            // `X as Y` → the exported name is Y.
            const asMatch = part.match(/\bas\s+(\w+)/);
            names.add(asMatch ? asMatch[1] : part);
        }
    }
    return names;
}

// The gate validates whatever dist is present (publish-discipline on the shipped
// artifact). On a fresh checkout where dist is not yet built (CI builds AFTER the
// test run), it is skipped — a stale-but-present dist still reds.
const hasDist = existsSync(DIST_INDEX);

describe("dist surface == source surface (PT-WAVE-3a publish-discipline)", () => {
    it.skipIf(!hasDist)("the built dist exports every value-level source export", () => {
        const srcNames = namedExports(readFileSync(SRC_INDEX, "utf8"));
        const dist = readFileSync(DIST_INDEX, "utf8");
        const distNames = namedExports(dist);

        const missing = [...srcNames].filter((n) => !distNames.has(n));
        expect(missing, `dist is missing source exports: ${missing.join(", ")}`).toEqual([]);
    });

    // S.H2 (fold row 48, DQ-2) — the 1.0.0 breaking cut EXCISED the 15 `*Span`
    // builders (deprecated in 0.13.0, zero consumers). This keep-gate was the
    // inverse: it asserted their PRESENCE (the 8-of-15 drift target). It is now
    // FLIPPED to assert their ABSENCE from the built dist AND the source barrel —
    // the terminal runtime-tier owner is `proof:no-span-surface`; this is the
    // source/dist complement inside the vitest suite.
    it.skipIf(!hasDist)("the 15 *Span fns are ABSENT from the dist (S.H2 1.0.0 cut)", () => {
        const dist = readFileSync(DIST_INDEX, "utf8");
        const spanFns = [
            "stringSpan", "regexSpan", "manySpan", "sepBySpan", "wrapSpan",
            "optSpan", "skipSpan", "nextSpan", "altSpan", "takeUntilAnySpan",
            "negateSpan", "peekSpan", "notSpan", "minusSpan", "lookAheadSpan",
        ];
        const present = spanFns.filter((fn) => new RegExp(`\\b${fn}\\b`).test(dist));
        expect(present, `dist still exports excised *Span fns: ${present.join(", ")}`).toEqual([]);
    });

    it("the source barrel names zero *Span symbols (S.H2 1.0.0 cut)", () => {
        const src = readFileSync(SRC_INDEX, "utf8");
        const spanFns = [
            "stringSpan", "regexSpan", "manySpan", "sepBySpan", "wrapSpan",
            "optSpan", "skipSpan", "nextSpan", "altSpan", "takeUntilAnySpan",
            "negateSpan", "peekSpan", "notSpan", "minusSpan", "lookAheadSpan",
        ];
        const present = spanFns.filter((fn) => new RegExp(`\\b${fn}\\b`).test(src));
        expect(present, `source barrel still names *Span: ${present.join(", ")}`).toEqual([]);
    });

    // A.W1 (inv-A-1) — the CSS surface left for value.js (D2/D3). The source
    // barrel must no longer name any CSS symbol. (The runtime-surface gate is
    // proof:no-css-surface; this is the source-side complement.)
    it("the source barrel names zero CSS symbols", () => {
        const src = readFileSync(SRC_INDEX, "utf8");
        const parsersBarrel = readFileSync(
            resolve(__dirname, "../src/parse/parsers/index.ts"),
            "utf8",
        );
        const CSS_SYMBOLS = [
            "cssParser", "parseSingleValue", "parseFunctionArgs", "CssNode",
            "CssColor", "CssSelector", "KeyframeBlock", "MediaQuery", "specificity",
        ];
        const leaked = CSS_SYMBOLS.filter(
            (s) => new RegExp(`\\b${s}\\b`).test(src) || new RegExp(`\\b${s}\\b`).test(parsersBarrel),
        );
        expect(leaked, `CSS symbols still named in source: ${leaked.join(", ")}`).toEqual([]);
    });
});
