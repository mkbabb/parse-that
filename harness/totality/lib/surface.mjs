// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.a — THE DERIVATION. The frozen 52-export surface, read from
// `src/css/index.ts` AT RUN TIME. Nothing in this file names an export.
//
// W1.md §5.a: "The manifest is derived from the source file by script, not
// typed by hand, so it cannot drift from the surface it claims to measure."
// The corollary is enforced here: this module contains ZERO export names. If
// value.js adds, removes or renames one, the derived set moves with it and
// `derive.mjs --check` exits non-zero against a stale manifest.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { CSS_INDEX, CSS_TYPES } from "./config.mjs";

/**
 * Every `export [type] { … } from "<module>";` block of a barrel file, in
 * source order. Handles single-line and multi-line blocks alike, so a
 * reformat of the barrel cannot change the derived set.
 */
const EXPORT_BLOCK = /export\s+(type\s+)?\{([^}]*)\}\s*from\s*"([^"]+)"\s*;/g;

/** A member of an export block; tolerates `X as Y` (the EXPORTED name is Y). */
const parseMembers = (body, blockStart, text) =>
    body
        .split(",")
        .map((raw) => raw.trim())
        .filter((raw) => raw.length > 0)
        .map((raw) => {
            const asMatch = /^(\S+)\s+as\s+(\S+)$/.exec(raw);
            const local = asMatch ? asMatch[1] : raw;
            const exported = asMatch ? asMatch[2] : raw;
            const at = text.indexOf(raw, blockStart);
            return {
                name: exported,
                localName: local,
                line: at < 0 ? -1 : text.slice(0, at).split("\n").length,
            };
        });

/** `"./grammar"` → `grammar`. The slice name is the module, never a label. */
const sliceOf = (specifier) => specifier.replace(/^\.\//, "").replace(/\.[jt]s$/, "");

/**
 * The spec's own 2026-08-03 baseline arithmetic, re-derived in-process rather
 * than shelled out, so `--check` carries an INDEPENDENT second reading of the
 * same number (W1.md §6 G-1's RED baseline: 51 block members + 1 single-line
 * `export { X }` = 52).
 */
const crossCheck = (text) => {
    const lines = text.split("\n");
    const blockMembers = lines.filter((l) => /^ {4}[A-Za-z]+,$/.test(l)).length;
    const singleLine = lines.filter((l) => /^export \{ [A-Za-z]+ \}/.test(l)).length;
    return { blockMembers, singleLineExports: singleLine, sum: blockMembers + singleLine };
};

/** Derive the frozen surface from `src/css/index.ts` at run time. */
export const deriveSurface = () => {
    const text = readFileSync(CSS_INDEX, "utf8");
    const exports = [];
    for (const match of text.matchAll(EXPORT_BLOCK)) {
        const isType = Boolean(match[1]);
        const slice = sliceOf(match[3]);
        for (const member of parseMembers(match[2], match.index, text)) {
            exports.push({
                name: member.name,
                localName: member.localName,
                kind: isType ? "type" : "runtime",
                slice: isType ? "types" : slice,
                sourceModule: match[3],
                sourceLine: member.line,
            });
        }
    }
    exports.sort((a, b) => a.sourceLine - b.sourceLine || a.name.localeCompare(b.name));

    const types = exports.filter((e) => e.kind === "type");
    const runtime = exports.filter((e) => e.kind === "runtime");

    const slices = {};
    for (const e of exports) slices[e.slice] = (slices[e.slice] ?? 0) + 1;

    return {
        source: {
            file: CSS_INDEX,
            bytes: Buffer.byteLength(text),
            lines: text.split("\n").length - (text.endsWith("\n") ? 1 : 0),
            sha256: createHash("sha256").update(text).digest("hex"),
        },
        counts: { total: exports.length, types: types.length, runtime: runtime.length },
        slices,
        crossCheck: crossCheck(text),
        exports,
    };
};

// ── the frozen union variants, derived from `src/css/types.ts` ───────────────
//
// The breadth cells of the shape test are generated FROM these. If value.js
// adds a 14th colour space, a cell appears and any candidate that does not
// parse it drops from TOTAL to PARTIAL without a byte of this harness moving.

/**
 * The body of `export type <Name>[<params>] = … ;` — brace- and paren-balanced.
 * The parameter list is skipped by ANGLE-DEPTH, not by a `[^=]*` class, because
 * a defaulted parameter (`<R extends StylesheetItem = StylesheetItem>`) carries
 * its own `=` and would otherwise swallow the declaration.
 */
const typeBody = (text, name) => {
    const head = new RegExp(`export type ${name}\\b`).exec(text);
    if (!head) return null;
    return typeBodyAt(text, head.index + head[0].length);
};

/** The right-hand side of a `type` alias whose name ends at `from`. */
const typeBodyAt = (text, from) => {
    let i = from;
    let angle = 0;
    while (i < text.length) {
        const c = text[i];
        if (c === "<") angle += 1;
        else if (c === ">") angle -= 1;
        else if (c === "=" && angle === 0) break;
        i += 1;
    }
    i += 1;
    let depth = 0;
    const start = i;
    for (; i < text.length; i += 1) {
        const c = text[i];
        if (c === "{" || c === "(" || c === "[" || c === "<") depth += 1;
        else if (c === "}" || c === ")" || c === "]" || c === ">") depth -= 1;
        else if (c === ";" && depth <= 0) break;
    }
    return text.slice(start, i);
};

/** Quoted string-literal members of a union body, de-duplicated in order. */
const stringLiterals = (body) => [
    ...new Set([...body.matchAll(/"([^"]+)"/g)].map((m) => m[1])),
];

/** `kind: "x"` discriminants of an object union, de-duplicated in order. */
const kindLiterals = (body) => [
    ...new Set([...body.matchAll(/\bkind:\s*"([^"]+)"/g)].map((m) => m[1])),
];

const MEMBER_HEAD = /^\s*(readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:/;

/**
 * Member names declared directly inside a type body's brace blocks. Works
 * through the `Readonly<{ … }>` wrapper the frozen types use throughout, and
 * across a union of object variants (`A | B`) by collecting every block that
 * opens at brace-depth 0 — so `KeyframeSelector`'s two variants both contribute.
 */
const memberNames = (body) => {
    const names = [];
    const closers = { "{": "}", "(": ")", "[": "]", "<": ">" };
    let braceDepth = 0;
    let otherDepth = 0;
    let token = "";
    for (const c of body) {
        if (c === "{") {
            braceDepth += 1;
            if (braceDepth === 1) token = "";
            continue;
        }
        if (c === "}") {
            if (braceDepth === 1) {
                const tail = MEMBER_HEAD.exec(token);
                if (tail) names.push(tail[2]);
                token = "";
            }
            braceDepth -= 1;
            continue;
        }
        if (braceDepth < 1) continue;
        if (closers[c]) otherDepth += 1;
        else if (c === ")" || c === "]" || c === ">") otherDepth -= 1;
        if (braceDepth === 1 && otherDepth === 0 && (c === ";" || c === ",")) {
            const m = MEMBER_HEAD.exec(token);
            if (m) names.push(m[2]);
            token = "";
            continue;
        }
        if (braceDepth === 1) token += c;
    }
    return [...new Set(names)];
};

/**
 * Every exported type declaration of a TypeScript source or `.d.ts`, with its
 * member and literal sets. Used on both sides of the TYPE shape test: the
 * frozen side reads `src/css/types.ts`, the candidate side reads whatever
 * declaration surface the candidate ships. One extractor, so the comparison is
 * like-for-like rather than two dialects of "member".
 */
export const readTypeDeclarations = (text) => {
    const out = {};
    const heads = [
        ...text.matchAll(/export\s+(?:declare\s+)?(type|interface)\s+([A-Za-z_$][\w$]*)/g),
    ];
    for (const head of heads) {
        const [, form, name] = head;
        const body =
            form === "type"
                ? typeBodyAt(text, head.index + head[0].length)
                : interfaceBodyAt(text, head.index + head[0].length);
        if (body === null) continue;
        out[name] = { form, body, members: memberNames(body), literals: stringLiterals(body) };
    }
    return out;
};

/** `interface X<…> { … }` — the brace block after the (optional) heritage clause. */
const interfaceBodyAt = (text, from) => {
    const open = text.indexOf("{", from);
    if (open < 0) return null;
    let depth = 0;
    for (let i = open; i < text.length; i += 1) {
        if (text[i] === "{") depth += 1;
        else if (text[i] === "}") {
            depth -= 1;
            if (depth === 0) return text.slice(open, i + 1);
        }
    }
    return null;
};

/**
 * The frozen variant vocabulary. Every list is READ from `types.ts`; the only
 * hand-written thing here is WHICH type to read and HOW its members discriminate.
 */
export const deriveVariants = () => {
    const text = readFileSync(CSS_TYPES, "utf8");
    const body = (name) => typeBody(text, name) ?? "";
    return {
        source: {
            file: CSS_TYPES,
            bytes: Buffer.byteLength(text),
            sha256: createHash("sha256").update(text).digest("hex"),
        },
        colorSpaces: stringLiterals(body("CssColorSpace")),
        issueCodes: stringLiterals(body("ParseIssue").split(";")[0]),
        timingKinds: kindLiterals(body("CssTimingFunction")),
        keyframeSelectorKinds: kindLiterals(body("KeyframeSelector")),
        timelineKinds: kindLiterals(body("AnimationTimelineValue")),
        timelineScopeKinds: kindLiterals(body("TimelineScopeValue")),
        stylesheetItemKinds: [
            ...new Set([
                ...kindLiterals(body("StylesheetItem")),
                ...kindLiterals(body("StyleRule")),
                ...kindLiterals(body("KeyframesBlock")),
                ...kindLiterals(body("PropertyRule")),
                ...kindLiterals(body("CustomFunctionRule")),
            ]),
        ],
        rangePhases: stringLiterals(body("RangePhase")),
        triggerTypes: stringLiterals(body("TriggerType")),
        scrollerKeywords: stringLiterals(body("ScrollerKeyword")),
        timelineAxes: stringLiterals(body("TimelineAxis")),
        /** Member sets used by the TYPE shape test. */
        members: Object.fromEntries(
            [...text.matchAll(/export type ([A-Za-z_$][\w$]*)/g)]
                .map((m) => m[1])
                .map((name) => [name, memberNames(body(name))]),
        ),
        /** Literal sets used by the TYPE shape test for string unions. */
        literals: Object.fromEntries(
            [...text.matchAll(/export type ([A-Za-z_$][\w$]*)/g)]
                .map((m) => m[1])
                .map((name) => [name, stringLiterals(body(name))]),
        ),
    };
};
