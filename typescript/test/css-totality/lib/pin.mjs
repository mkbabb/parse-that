// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.a — THE PIN. The 52-export universe, read from `src/css/index.ts` AT A PINNED value.js
// COMMIT, never from a working tree and never hand-transcribed.
//
// `W3.md` §3 item 1: "Enumerate the universe mechanically: the 52 frozen `/css` exports (19 runtime
// + 33 types) read from `src/css/index.ts` at a pinned value.js commit … never hand-transcribed."
// §11 guardrail 2: "G-1's manifest is **generated from `index.ts`**, so the universe cannot be
// quietly narrowed to what the candidate happens to cover."
//
// THIS FILE CONTAINS ZERO EXPORT NAMES, and it reads through `git show <sha>:<path>` rather than
// through the filesystem, so a dirty working tree, a rebase, or a sibling track's commit cannot
// move the universe under a running gate. The pin is an argument, never a default.
//
// TWO SOURCES, AND WHY BOTH.
//   NAMES  come from the pinned `src/css/index.ts` — the barrel is the contract's own enumeration.
//   SHAPES come from the vendored, sha-pinned published 4.0.0 declaration
//          (`cand-o/vendor/value-js-4.0.0/dist/subpaths/css.d.ts`), because the pinned
//          `src/css/types.ts` imports four sibling modules (`../color/model`,
//          `../foundation/result`, `../easing`, `../value`) and therefore does not compile alone —
//          materializing it would either drag in half the library or be a transcription.
//          `W3.md` §3's own prohibition names the oracle: "the oracle is the published tarball and
//          the CSS specification text, in that order."
// The two are not trusted to agree: `agreement()` below PROVES it, by name and by member/literal
// set, and any disagreement is a rowed finding rather than a silent pick.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readTypeDeclarations } from "../../../../harness/totality/lib/surface.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** `<p2>` — the fresh writer root (`W3.md` §4). */
export const P2_ROOT = path.resolve(HERE, "..", "..", "..", "..");

/** value.js — read-only here; this wave writes zero bytes under its `src/**` (`W3.md` §4). */
export const VALUE_JS_ROOT =
    process.env.VALUE_JS_ROOT && process.env.VALUE_JS_ROOT.length > 0
        ? process.env.VALUE_JS_ROOT
        : "/Users/mkbabb/Programming/value.js";

/** The frozen barrel and the frozen type source, addressed inside the pinned commit. */
export const FROZEN_INDEX = "src/css/index.ts";
export const FROZEN_TYPES = "src/css/types.ts";

/**
 * The vendored, sha-pinned published 4.0.0 `/css` declaration — the SHAPE oracle.
 * Read-only (`W3.md` §4: `cand-o/**` is "read, no write").
 */
export const PUBLISHED_400_DIR = path.join(
    VALUE_JS_ROOT,
    "docs/tranches/V/megatranche/prototypes/css-parser/cand-o/vendor/value-js-4.0.0/dist/subpaths",
);
export const PUBLISHED_400_DTS = path.join(PUBLISHED_400_DIR, "css.d.ts");
export const PUBLISHED_400_JS = path.join(PUBLISHED_400_DIR, "css.js");

export const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/** Read one path out of a pinned commit. Never the working tree. */
export const showAtPin = (commit, filePath) =>
    execFileSync("git", ["-C", VALUE_JS_ROOT, "show", `${commit}:${filePath}`], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    });

/** The commit the caller pinned, resolved to its full 40-hex id (an abbreviation is accepted). */
export const resolvePin = (commit) =>
    execFileSync("git", ["-C", VALUE_JS_ROOT, "rev-parse", `${commit}^{commit}`], {
        encoding: "utf8",
    }).trim();

// ── the universe ────────────────────────────────────────────────────────────

/**
 * Every `export [type] { … } from "<module>";` block of the barrel, in source order.
 * `X as Y` is tolerated and the EXPORTED name (Y) is the one that counts — a rename in the barrel
 * is a contract change and must move this set.
 */
const EXPORT_BLOCK = /export\s+(type\s+)?\{([^}]*)\}\s*from\s*"([^"]+)"\s*;/g;

const members = (body) =>
    body
        .split(",")
        .map((raw) => raw.trim())
        .filter((raw) => raw.length > 0)
        .map((raw) => {
            const as = /^(\S+)\s+as\s+(\S+)$/.exec(raw);
            return { name: as ? as[2] : raw, localName: as ? as[1] : raw };
        });

/** `"./grammar"` → `grammar`; the slice is the module the name comes from, never a label. */
const sliceOf = (specifier) => specifier.replace(/^\.\//, "").replace(/\.[jt]s$/, "");

/**
 * Derive the frozen universe from the pinned barrel text. The count is NOT asserted here — the
 * caller asserts it against the pin, so that a genuine contract change reads as a contract change
 * rather than as a crash inside a derivation.
 */
export const deriveUniverse = (indexText) => {
    const exports = [];
    for (const match of indexText.matchAll(EXPORT_BLOCK)) {
        const isType = Boolean(match[1]);
        const slice = sliceOf(match[3]);
        for (const member of members(match[2])) {
            const at = indexText.indexOf(member.localName, match.index);
            exports.push({
                name: member.name,
                localName: member.localName,
                kind: isType ? "type" : "runtime",
                slice: isType ? "types" : slice,
                sourceModule: match[3],
                sourceLine: at < 0 ? -1 : indexText.slice(0, at).split("\n").length,
            });
        }
    }
    exports.sort((a, b) => a.sourceLine - b.sourceLine || a.name.localeCompare(b.name));
    return {
        exports,
        runtime: exports.filter((e) => e.kind === "runtime").map((e) => e.name),
        types: exports.filter((e) => e.kind === "type").map((e) => e.name),
    };
};

// ── the declared signatures (the `arity` column) ─────────────────────────────

/** Split a parameter list on top-level commas; a defaulted or generic parameter keeps its commas. */
const splitParams = (text) => {
    const out = [];
    let depth = 0;
    let token = "";
    for (const c of text) {
        if (c === "(" || c === "[" || c === "{" || c === "<") depth += 1;
        else if (c === ")" || c === "]" || c === "}" || c === ">") depth -= 1;
        if (c === "," && depth === 0) {
            out.push(token.trim());
            token = "";
            continue;
        }
        token += c;
    }
    if (token.trim().length > 0) out.push(token.trim());
    return out;
};

/** The balanced `( … )` that opens at or after `from`. */
const parenAt = (text, from) => {
    const open = text.indexOf("(", from);
    if (open < 0) return null;
    let depth = 0;
    for (let i = open; i < text.length; i += 1) {
        if (text[i] === "(") depth += 1;
        else if (text[i] === ")") {
            depth -= 1;
            if (depth === 0) return { open, close: i, body: text.slice(open + 1, i) };
        }
    }
    return null;
};

/**
 * Declared arity per runtime export, read from the published declaration. Both forms the frozen
 * surface actually uses are handled: `export declare function f(a, b): R` and
 * `export declare const f: (a) => R`. A name declared in neither form yields `arity: null`, which
 * the matrix reports rather than guessing at.
 */
export const deriveSignatures = (dtsText) => {
    const out = {};
    for (const head of dtsText.matchAll(
        /export\s+declare\s+function\s+([A-Za-z_$][\w$]*)\s*/g,
    )) {
        const paren = parenAt(dtsText, head.index + head[0].length);
        if (!paren) continue;
        const params = splitParams(paren.body);
        out[head[1]] = { form: "function", arity: params.length, params };
    }
    for (const head of dtsText.matchAll(
        /export\s+declare\s+const\s+([A-Za-z_$][\w$]*)\s*:\s*/g,
    )) {
        const paren = parenAt(dtsText, head.index + head[0].length);
        if (!paren) continue;
        const params = splitParams(paren.body);
        out[head[1]] = { form: "const-arrow", arity: params.length, params };
    }
    return out;
};

/**
 * The balanced `< … >` that opens at `from`, or `null` when the next non-space character is not
 * `<`. Scanned by ANGLE DEPTH, never by a character class: a defaulted type parameter carries its
 * own `=` (`<R extends StylesheetItem = StylesheetItem>`) and a `[^=]*?` class would drop it.
 */
const angleAt = (text, from) => {
    let i = from;
    while (i < text.length && /\s/.test(text[i])) i += 1;
    if (text[i] !== "<") return null;
    let depth = 0;
    for (let j = i; j < text.length; j += 1) {
        if (text[j] === "<") depth += 1;
        else if (text[j] === ">") {
            depth -= 1;
            if (depth === 0) return text.slice(i, j + 1);
        }
    }
    return null;
};

/**
 * Every `export declare type|interface <Name>` of the published declaration, with its type
 * parameter list when it has one. A generic frozen type is instantiated by the assignability
 * generator rather than skipped — `ParseResult<T>` unapplied is not a type.
 */
export const declaredTypeNames = (dtsText) =>
    [...dtsText.matchAll(/export\s+declare\s+(?:type|interface)\s+([A-Za-z_$][\w$]*)/g)].map(
        (m) => ({ name: m[1], params: angleAt(dtsText, m.index + m[0].length) }),
    );

// ── the agreement proof ─────────────────────────────────────────────────────

const setDiff = (a, b) => a.filter((x) => !b.includes(x));

/**
 * PROVE that the SHAPE oracle may stand in for the pinned type source.
 *
 * Three readings, all mechanical:
 *   names     the pinned barrel's 33 type names vs the published declaration's exported type names,
 *             both set-differences;
 *   runtime   the pinned barrel's 19 runtime names vs the published module's own export keys;
 *   shapes    for each of the 33, the member set and the string-literal set extracted from the
 *             PINNED `src/css/types.ts` vs the same extraction over the published declaration.
 *             One extractor (`readTypeDeclarations`, W1's, imported and executed — `W3.md` §4 makes
 *             `harness/totality/**` execute-and-read), so the comparison is like-for-like rather
 *             than two dialects of "member".
 *
 * A non-empty difference anywhere is returned as data. Nothing here decides what to do about it;
 * the matrix rows it, and `--check` fails on it.
 */
export const agreement = ({ universe, typesText, dtsText, publishedKeys }) => {
    const declaredTypes = declaredTypeNames(dtsText).map((t) => t.name);
    const frozenDecls = readTypeDeclarations(typesText);
    const publishedDecls = readTypeDeclarations(dtsText);

    const shapes = universe.types.map((name) => {
        const frozen = frozenDecls[name];
        const published = publishedDecls[name];
        if (!frozen || !published) {
            return {
                name,
                agreed: false,
                why: !frozen
                    ? "not declared in the pinned src/css/types.ts"
                    : "not declared in the published 4.0.0 declaration",
            };
        }
        const missingMembers = frozen.members.filter((m) => !published.members.includes(m));
        const extraMembers = published.members.filter((m) => !frozen.members.includes(m));
        const missingLiterals = frozen.literals.filter((l) => !published.literals.includes(l));
        const extraLiterals = published.literals.filter((l) => !frozen.literals.includes(l));
        const why = [
            ...missingMembers.map((m) => `published lacks member \`${m}\``),
            ...extraMembers.map((m) => `published adds member \`${m}\``),
            ...missingLiterals.map((l) => `published lacks variant "${l}"`),
            ...extraLiterals.map((l) => `published adds variant "${l}"`),
        ];
        return { name, agreed: why.length === 0, why: why.length === 0 ? null : why.join(" · ") };
    });

    return {
        typeNames: {
            barrelMinusPublished: setDiff(universe.types, declaredTypes),
            publishedMinusBarrel: setDiff(declaredTypes, universe.types),
        },
        runtimeNames: {
            barrelMinusPublished: setDiff(universe.runtime, publishedKeys),
            publishedMinusBarrel: setDiff(publishedKeys, universe.runtime),
        },
        shapes,
        disagreements: shapes.filter((s) => !s.agreed),
    };
};

/** The whole pinned reading, in one object, with every source's sha256 beside it. */
export const readPin = async (commit) => {
    const resolved = resolvePin(commit);
    const indexText = showAtPin(resolved, FROZEN_INDEX);
    const typesText = showAtPin(resolved, FROZEN_TYPES);
    const dtsText = readFileSync(PUBLISHED_400_DTS, "utf8");
    const publishedJsText = readFileSync(PUBLISHED_400_JS, "utf8");
    const universe = deriveUniverse(indexText);
    const published = await import(PUBLISHED_400_JS);
    const publishedKeys = Object.keys(published).sort();

    return {
        commit: resolved,
        sources: {
            index: {
                path: `${resolved}:${FROZEN_INDEX}`,
                bytes: Buffer.byteLength(indexText),
                sha256: sha256(indexText),
            },
            types: {
                path: `${resolved}:${FROZEN_TYPES}`,
                bytes: Buffer.byteLength(typesText),
                sha256: sha256(typesText),
            },
            publishedDts: {
                path: PUBLISHED_400_DTS,
                bytes: Buffer.byteLength(dtsText),
                sha256: sha256(dtsText),
            },
            publishedJs: {
                path: PUBLISHED_400_JS,
                bytes: Buffer.byteLength(publishedJsText),
                sha256: sha256(publishedJsText),
            },
        },
        universe,
        counts: {
            runtime: universe.runtime.length,
            types: universe.types.length,
            total: universe.exports.length,
        },
        signatures: deriveSignatures(dtsText),
        agreement: agreement({ universe, typesText, dtsText, publishedKeys }),
        published,
        dtsText,
        typesText,
        indexText,
        publishedJsText,
    };
};
