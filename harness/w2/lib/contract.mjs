// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — THE CONTRACT READER. `ALGEBRA.md` is the only source of the 22 operators, the 52-row
// map and the fingerprint rule; nothing here re-types either list (a second copy of a registry is
// the v12 shape at one remove).
//
// Two homes, asserted equal (G-1): the docs original and the `<p2>` execution copy.

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HARNESS_W2_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const P2_ROOT = path.resolve(HARNESS_W2_DIR, "..", "..");
export const VALUE_JS_ROOT = process.env.VALUE_JS_ROOT || "/Users/mkbabb/Programming/value.js";

export const CONTRACT_P2 = path.join(P2_ROOT, "experiments/w2/contract/ALGEBRA.md");
export const CONTRACT_DOCS = path.join(VALUE_JS_ROOT, "docs/tranches/X/parse-that/algebra/ALGEBRA.md");
export const EXPERIMENTS_W2 = path.join(P2_ROOT, "experiments/w2");
export const CORPUS_DIR = path.join(EXPERIMENTS_W2, "corpus");

/** W1's manifest — READ, never a second manifest (W2.md §5 `.g`). */
export const W1_MANIFEST = path.join(P2_ROOT, "harness/totality/manifest.json");

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

export function contractHomes() {
    const homes = [
        { label: "<p2>", path: CONTRACT_P2 },
        { label: "docs", path: CONTRACT_DOCS },
    ].map((h) => ({
        ...h,
        present: existsSync(h.path),
        sha256: existsSync(h.path) ? sha256(readFileSync(h.path)) : null,
        bytes: existsSync(h.path) ? readFileSync(h.path).length : 0,
    }));
    return {
        homes,
        equal: homes.every((h) => h.present) && homes[0].sha256 === homes[1].sha256,
    };
}

export function contractText() {
    if (!existsSync(CONTRACT_P2)) {
        throw new Error(`HALT: the ratified contract is ABSENT at ${CONTRACT_P2} (X.P.W2.c's file)`);
    }
    return readFileSync(CONTRACT_P2, "utf8");
}

/* ── the 22 operators, from §4.6's `algebra-registry` fenced block ─────────────────────────── */

/**
 * Arity, derived from the block's own argKinds cell so it cannot drift from it:
 *   "-"    → 0            (no arguments)
 *   "T+"   → "1+"         (variadic, at least one)
 *   "T*"   → "0+"         (variadic, possibly none)
 *   "T?"   → optional tail, counted in the fixed part and marked
 *   else   → the number of comma-separated tokens
 */
function arityOf(argKinds) {
    if (argKinds === "-") return "0";
    const parts = argKinds.split(",");
    const last = parts[parts.length - 1];
    if (parts.length === 1 && last.endsWith("+")) return "1+";
    if (parts.length === 1 && last.endsWith("*")) return "0+";
    if (last.endsWith("+")) return `${parts.length - 1}+`;
    if (last.endsWith("*")) return `${parts.length - 1}+`;
    if (last.endsWith("?")) return `${parts.length - 1}/${parts.length}`;
    return String(parts.length);
}

/** The §4.6 fingerprint rule, byte for byte: sha256(opId ‖ 0x00 ‖ name ‖ 0x00 ‖ arity ‖ 0x00 ‖ argKinds). */
export function fingerprint({ opId, name, arity, argKinds }) {
    const NUL = Buffer.from([0]);
    return sha256(
        Buffer.concat([
            Buffer.from(opId, "utf8"), NUL,
            Buffer.from(name, "utf8"), NUL,
            Buffer.from(String(arity), "utf8"), NUL,
            Buffer.from(Array.isArray(argKinds) ? argKinds.join(",") : argKinds, "utf8"),
        ]),
    );
}

export function contractOperators(text = contractText()) {
    const m = text.match(/```algebra-registry\n([\s\S]*?)```/);
    if (!m) throw new Error("HALT: no ```algebra-registry block in ALGEBRA.md (§4.6)");
    const rows = m[1]
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
            const parts = line.split(/\s+/);
            const [opId, name, argKinds] = [parts[0], parts[1], parts.slice(2).join(" ")];
            const arity = arityOf(argKinds);
            const row = { opId, name, arity, argKinds };
            return { ...row, fingerprint: fingerprint(row) };
        });
    if (rows.length === 0) throw new Error("HALT: the algebra-registry block is empty");
    return rows;
}

/** The count the contract states in prose (§4.1 "Count: 22"), read rather than assumed. */
export function contractStatedCount(text = contractText()) {
    const m = text.match(/\*\*Count:\s*(\d+)\*\*/);
    return m ? Number(m[1]) : null;
}

/* ── the 52-row totality map, by §9's own row grammar ──────────────────────────────────────── */

/**
 * The row grammar is the contract's, quoted at §9:
 *   ^\|\s*(\d+)\s*\|\s*`(\w+)`\s*\|\s*(type|runtime)\s*\|\s*([PVKWX])\s*\|\s*`([^`]+)`\s*\|
 * Prettier pads the cells; the grammar's own `\s*` absorbs the padding.
 */
export function contractMap(text = contractText()) {
    const re = /^\|\s*(\d+)\s*\|\s*`(\w+)`\s*\|\s*(type|runtime)\s*\|\s*([PVKWX])\s*\|\s*`([^`]+)`\s*\|/gm;
    const rows = [];
    for (const m of text.matchAll(re)) {
        rows.push({ n: Number(m[1]), export: m[2], kind: m[3], class: m[4], production: m[5] });
    }
    return rows;
}

/** W1's manifest, read-only — the manifest of record for the 52. */
export function w1Manifest() {
    if (!existsSync(W1_MANIFEST)) throw new Error(`HALT: W1's manifest is ABSENT at ${W1_MANIFEST}`);
    return JSON.parse(readFileSync(W1_MANIFEST, "utf8"));
}

/* ── the corpora ──────────────────────────────────────────────────────────────────────────── */

export function corpus(name) {
    const p = path.join(CORPUS_DIR, name);
    if (!existsSync(p)) throw new Error(`HALT: corpus ABSENT at ${p} — run experiments/w2/corpus/build-corpus.mjs`);
    return JSON.parse(readFileSync(p, "utf8"));
}

/* ── argv ─────────────────────────────────────────────────────────────────────────────────── */

/**
 * `--name=value` AND `--name value` are both accepted, because `W2.md` §6 writes the gates' literal
 * commands in the space-separated form (`--candidate <id>`, `--corpus <path>`, `--fuzz-seed <path>`)
 * and a probe that only understood `=` would fail its own gate's literal invocation.
 */
export function argv(args = process.argv.slice(2)) {
    const out = { _: [], flags: new Set() };
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        const m = a.match(/^--([^=]+)=(.*)$/);
        if (m) {
            out[m[1]] = m[2];
        } else if (a.startsWith("--")) {
            const name = a.slice(2);
            const next = args[i + 1];
            if (next !== undefined && !next.startsWith("--")) {
                out[name] = next;
                out.flags.add(name);
                i++;
            } else {
                out.flags.add(name);
            }
        } else {
            out._.push(a);
        }
    }
    return out;
}
