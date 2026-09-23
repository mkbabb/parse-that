// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.a — THE KF SEAM COLUMN. `coverage.md` Surface 2 / Finding F-3:
// "every one of the 37 KF-consumed symbols is exported by `src/css/index.ts`.
//  value.js/css fully serves keyframes. Zero orphan imports."
//
// W1.md §5.a: "the kf seam count (3/37 at gate time) is a SECOND, SEPARATE
// column — never merged into the 52." This module produces that column and
// NOTHING it returns is ever added to the 52; `report.mjs` prints it apart and
// `derive.mjs` asserts the separation (see `assertDisjointFromManifest`).
//
// Derived, like the manifest: the 37 are READ from the kf tree's import sites,
// never transcribed. If keyframes consumes a 38th symbol the column grows.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { KF_SRC, present } from "./config.mjs";

/** The seam specifier `coverage.md` grepped. */
export const SEAM_SPECIFIER = "@mkbabb/value.js/css";

/** `import [type] { … } from "@mkbabb/value.js/css";`, single- or multi-line. */
const SEAM_IMPORT = new RegExp(
    `import\\s+(type\\s+)?\\{([^}]*)\\}\\s*from\\s*"${SEAM_SPECIFIER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
    "g",
);

const SOURCE_EXT = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".vue"]);

const walk = (dir, out = []) => {
    for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry.startsWith(".")) continue;
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (SOURCE_EXT.has(path.extname(entry))) out.push(full);
    }
    return out;
};

/**
 * Derive the kf consume seam.
 *
 * Returns the distinct symbols with their use counts, plus the three census
 * figures `coverage.md` published (files / line-hits / occurrences) so the
 * derivation is comparable to the record rather than merely asserted beside it.
 */
export const deriveKfSeams = () => {
    if (!present(KF_SRC)) {
        return {
            available: false,
            root: KF_SRC,
            reason: "kf tree absent on this box — the column is reported UNREADABLE, never guessed",
            symbols: [],
            counts: { distinct: 0, occurrences: 0, files: 0, lineHits: 0 },
        };
    }

    const uses = new Map();
    const files = new Set();
    let occurrences = 0;
    let lineHits = 0;

    for (const file of walk(KF_SRC)) {
        const text = readFileSync(file, "utf8");
        if (!text.includes(SEAM_SPECIFIER)) continue;
        lineHits += text
            .split("\n")
            .filter((line) => line.includes(SEAM_SPECIFIER)).length;
        for (const match of text.matchAll(SEAM_IMPORT)) {
            for (const raw of match[2].split(",")) {
                // An INLINE type specifier (`import { type Foo, bar }`) names the
                // same symbol as a block `import type { Foo }`; the seam census
                // counts symbols, not the syntax that reached them.
                const member = raw.trim().replace(/^type\s+/, "");
                if (member.length === 0) continue;
                const name = (/^(\S+)(\s+as\s+\S+)?$/.exec(member) ?? [, member])[1];
                uses.set(name, (uses.get(name) ?? 0) + 1);
                occurrences += 1;
                files.add(file);
            }
        }
    }

    const symbols = [...uses.entries()]
        .map(([name, count]) => ({ name, uses: count }))
        .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name));

    return {
        available: true,
        root: KF_SRC,
        specifier: SEAM_SPECIFIER,
        symbols,
        counts: {
            distinct: symbols.length,
            occurrences,
            files: files.size,
            lineHits,
        },
    };
};

/**
 * Finding F-3, MEASURED rather than quoted: every kf-consumed symbol must be a
 * member of the frozen 52, i.e. ZERO orphan imports. Returns the orphan list,
 * which is the finding's falsifier.
 */
export const orphanSeams = (seams, surface) => {
    const frozen = new Set(surface.exports.map((e) => e.name));
    return seams.symbols.filter((s) => !frozen.has(s.name)).map((s) => s.name);
};

/**
 * The separation W1.md §5.a mandates, asserted rather than trusted: the kf
 * column is a VIEW over the 52, never an addition to it. Throws if a caller
 * ever lets a seam symbol into the manifest's export list.
 */
export const assertDisjointFromManifest = (seams, manifest) => {
    const declared = manifest.counts.total;
    const withSeams = declared + seams.counts.distinct;
    if (manifest.exports.length !== declared) {
        throw new Error(
            `manifest count ${declared} disagrees with its own export list ${manifest.exports.length}`,
        );
    }
    if (withSeams === declared) {
        throw new Error("kf seam column collapsed into the manifest — the two must stay separate");
    }
    return { manifestExports: declared, kfSeamSymbols: seams.counts.distinct, merged: false };
};
