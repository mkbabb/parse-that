import { describe, it, expect } from "vitest";
import { string } from "../src/parse/index.js";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// S.H2 / C-16 — the chain() regression suite (fold row 50).
//
// The pre-cut chain() short-circuited on a FALSY seed value:
//
//     if (state.isError) return state;
//     else if (state.value || chainError) return fn(state.value).parser(state);
//     return state;                       // ← a 0 / '' / false seed is DROPPED here
//
// so a successful parse whose value happened to be falsy never reached its
// continuation. C-16 Option A is truly additive: fix ONLY the falsy-seed bug —
//
//     if (state.isError) return state;
//     return fn(state.value).parser(state);
//
// — and retire the now-moot, dead-on-error, zero-caller `chainError` param in the
// same 1.0.0 breaking cut. r6's `!state.isError || chainError` was rejected: it
// would silently resurrect a continue-ON-ERROR path nothing uses.

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("chain() — the falsy-seed fix (C-16 Option A, fold row 50)", () => {
    // (1) FALSY-SEED THREAD — red-then-green. A 0 / '' / false seed must reach the
    // continuation. On the pre-cut chain() the continuation is skipped (fn never
    // called), so `seen` stays empty and the result is the falsy seed itself.
    for (const seed of [0, "", false] as const) {
        it(`threads a falsy seed (${JSON.stringify(seed)}) into the continuation`, () => {
            const seen: unknown[] = [];
            const p = string("x")
                .map(() => seed)
                .chain((v) => {
                    seen.push(v);
                    return string("y").map(() => "reached");
                });

            const result = p.parse("xy");

            // The continuation ran exactly once, receiving the falsy seed…
            expect(seen).toEqual([seed]);
            // …and its parse threaded through as the overall result.
            expect(result).toBe("reached");
        });
    }

    it("a truthy seed threads too (control — green before and after)", () => {
        const seen: unknown[] = [];
        const p = string("x")
            .map(() => "T")
            .chain((v) => {
                seen.push(v);
                return string("y").map(() => "reached");
            });
        expect(p.parse("xy")).toBe("reached");
        expect(seen).toEqual(["T"]);
    });

    // (2) GENUINE-ERROR SHORT-CIRCUIT — the fix must NOT touch the error path.
    // When the upstream parser errors, the continuation must never run and the
    // error must propagate. (Green before and after — guards Option A's additivity.)
    it("short-circuits on a genuine error (continuation never runs)", () => {
        const seen: unknown[] = [];
        const p = string("x").chain((v) => {
            seen.push(v);
            return string("y");
        });

        const state = p.parseState("zzz"); // "x" fails at offset 0
        expect(state.isError).toBe(true);
        expect(seen).toEqual([]); // fn never called on the error path
    });
});

// (3) THE 0-HIT `chainError=true` CALLER SCAN (C-16 evidence for retirement).
//
// A real call-site scan over value.js + parse-that src: every `.chain(...)` call
// must pass EXACTLY ONE top-level argument. A second argument is the retired
// `chainError` flag — proving no caller relied on it, so the param is safe to cut.
// (This is a call-arity scan, not a token grep: a positional `.chain(fn, true)`
// is caught even though it never spells "chainError".)

/** Collect .ts source files under a tree (skipping node_modules / dist). */
function collectSources(dir: string, acc: string[] = []): string[] {
    if (!existsSync(dir)) return acc;
    for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name === "dist") continue;
        const p = resolve(dir, name);
        if (statSync(p).isDirectory()) collectSources(p, acc);
        else if (/\.tsx?$/.test(name)) acc.push(p);
    }
    return acc;
}

/** Skip a string/template literal starting at `i` (src[i] is the quote). Returns
 * the index of the closing quote. Templates are treated as opaque to the next
 * unescaped backtick (interpolation commas live at deeper `{}` depth anyway). */
function skipString(src: string, i: number, quote: string): number {
    for (let j = i + 1; j < src.length; j++) {
        if (src[j] === "\\") {
            j++;
            continue;
        }
        if (src[j] === quote) return j;
    }
    return src.length;
}

/** Blank out comments and string/template contents (replaced with spaces so
 * offsets are preserved) so a token scan measures LIVE CODE only — a comment that
 * documents `chainError`'s retirement is not a live reference. */
function stripCommentsAndStrings(src: string): string {
    const out = src.split("");
    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (c === '"' || c === "'" || c === "`") {
            const end = skipString(src, i, c);
            for (let k = i + 1; k < end && k < src.length; k++) out[k] = " ";
            i = end;
        } else if (c === "/" && src[i + 1] === "/") {
            let k = i;
            while (k < src.length && src[k] !== "\n") out[k++] = " ";
            i = k - 1;
        } else if (c === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            const stop = end === -1 ? src.length : end + 2;
            for (let k = i; k < stop; k++) out[k] = " ";
            i = stop - 1;
        }
    }
    return out.join("");
}

/** For a `.chain(` whose open-paren is at `openIdx`, count top-level (depth-1)
 * argument-separating commas by balanced scanning with string/comment awareness. */
function chainArgCount(src: string, openIdx: number): number {
    let depth = 0;
    let topLevelCommas = 0;
    for (let i = openIdx; i < src.length; i++) {
        const c = src[i];
        if (c === '"' || c === "'" || c === "`") {
            i = skipString(src, i, c);
            continue;
        }
        if (c === "/" && src[i + 1] === "/") {
            const nl = src.indexOf("\n", i);
            i = nl === -1 ? src.length : nl;
            continue;
        }
        if (c === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            i = end === -1 ? src.length : end + 1;
            continue;
        }
        if (c === "(" || c === "[" || c === "{") depth++;
        else if (c === ")" || c === "]" || c === "}") {
            depth--;
            if (depth === 0) break; // the matching close of `.chain(`
        } else if (c === "," && depth === 1) topLevelCommas++;
    }
    return topLevelCommas + 1;
}

interface ChainSite {
    file: string;
    argCount: number;
}

function scanChainCallers(trees: string[]): { sites: ChainSite[]; scanned: string[] } {
    const sites: ChainSite[] = [];
    const scanned: string[] = [];
    for (const tree of trees) {
        if (!existsSync(tree)) continue;
        scanned.push(tree);
        for (const file of collectSources(tree)) {
            const src = readFileSync(file, "utf8");
            const re = /\.chain\s*\(/g;
            let m: RegExpExecArray | null;
            while ((m = re.exec(src)) !== null) {
                const openParen = m.index + m[0].length - 1;
                sites.push({ file, argCount: chainArgCount(src, openParen) });
            }
        }
    }
    return { sites, scanned };
}

describe("chain() — the 0-hit chainError=true caller scan (C-16 retirement evidence)", () => {
    const parseThatSrc = resolve(__dirname, "../src");
    // Sibling value.js checkout (present in the constellation workspace; absent in
    // a standalone parse-that CI checkout — scanned best-effort).
    const valueJsSrc = resolve(__dirname, "../../../value.js/src");
    const { sites, scanned } = scanChainCallers([parseThatSrc, valueJsSrc]);

    it("parse-that src is always scanned (guards the scan is live)", () => {
        expect(scanned).toContain(parseThatSrc);
    });

    it("no .chain(...) caller passes a second (chainError) argument", () => {
        const multiArg = sites.filter((s) => s.argCount > 1);
        expect(
            multiArg,
            `chain() callers passing a 2nd (chainError) arg: ${multiArg
                .map((s) => s.file)
                .join(", ")}`,
        ).toEqual([]);
    });

    it("the identifier 'chainError' appears as live code in zero sources", () => {
        // Live-code scan (comments/strings stripped): after the 1.0.0 retirement
        // the `chainError` identifier must exist NOWHERE as code — not as a param,
        // arg, or variable. A comment documenting the removal is not a hit.
        const trees = [parseThatSrc, valueJsSrc].filter((t) => existsSync(t));
        const hits: string[] = [];
        for (const tree of trees) {
            for (const file of collectSources(tree)) {
                const code = stripCommentsAndStrings(readFileSync(file, "utf8"));
                if (/\bchainError\b/.test(code)) hits.push(file);
            }
        }
        expect(hits, `'chainError' live-code reference in: ${hits.join(", ")}`).toEqual([]);
    });
});
