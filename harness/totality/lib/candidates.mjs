// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.a — THE CANDIDATES the runner classifies the frozen 52 against.
//
// Three, and the three are chosen so the instrument's own claims are testable:
//
//   published-4.0.0  POSITIVE CONTROL. The shipped `/css` surface, vendored and
//                    sha-pinned. An instrument that can only ever print ABSENT
//                    has not been shown to be able to print TOTAL; this
//                    candidate is how that is shown.
//   c14-assay        NEGATIVE CONTROL. The subject of the gate-time census.
//                    `coverage.md` Surface 1 published 0 TOTAL / 3 PARTIAL /
//                    16 ABSENT runtime and 33/33 types ABSENT — a published
//                    reading this runner must REPRODUCE, not restate.
//   p2-native        THE LANE'S OWN DISTANCE. The fresh root ships no CSS
//                    surface today; the runner says so by measuring, and the
//                    row moves on its own when a grammar lands.
//
// Every path is absolute (Q-1). Every tree is read-only: nothing here is
// installed, built, or written.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { P2_ROOT, PARSER_PROOF_DIR, PUBLISHED_400_DIR, present } from "./config.mjs";

const readIfPresent = (file) => (present(file) ? readFileSync(file, "utf8") : null);

/** Concatenate a tree's TypeScript sources so a declaration scan can read it. */
const readTree = (dir, ext = new Set([".ts", ".d.ts"])) => {
    if (!present(dir)) return null;
    const parts = [];
    const walk = (d) => {
        for (const entry of readdirSync(d)) {
            if (entry === "node_modules" || entry.startsWith(".")) continue;
            const full = path.join(d, entry);
            if (statSync(full).isDirectory()) walk(full);
            else if (ext.has(path.extname(entry))) parts.push(readFileSync(full, "utf8"));
        }
    };
    walk(dir);
    return parts.join("\n");
};

export const candidates = () => [
    {
        id: "published-4.0.0",
        role: "POSITIVE CONTROL",
        what: "@mkbabb/value.js@4.0.0 /css — the vendored, sha-pinned published tarball",
        notWhat:
            "NOT the working-tree dist. Parser-band G6: the repo's own dist/subpaths/css.js " +
            "differs from what 4.0.0 ships, and that dist-drift is a separately ledgered finding.",
        runtimeModule: path.join(PUBLISHED_400_DIR, "css.js"),
        declarations: () => readIfPresent(path.join(PUBLISHED_400_DIR, "css.d.ts")),
        peers: {},
    },
    {
        id: "c14-assay",
        role: "NEGATIVE CONTROL",
        what: "the C14 W0-only mirror prototype — its whole public API is three functions",
        notWhat:
            "NOT a CSS coverage claim by its own charter (c14-css/README.md:16-18); the census " +
            "is assay-vs-frozen-contract coverage, never a defect report against value.js 4.0.0.",
        runtimeModule: path.join(PARSER_PROOF_DIR, "c14-bundle.mjs"),
        declarations: () => readTree(path.join(PARSER_PROOF_DIR, "c14-css/src")),
        // The assay names its peers differently. This map is the CANDIDATE'S
        // description, cited to coverage.md Surface 1 §1a — never a member of
        // the manifest, which stays derived.
        peers: {
            parseCssColor: "parseColor",
            parseTimingFunction: "parseEasing",
            parseStylesheet: "parseStylesheet",
        },
    },
    {
        id: "p2-native",
        role: "THE LANE'S OWN DISTANCE",
        what: "the fresh root's own CSS surface",
        notWhat: "no grammar is written by X.P.W1; the distance IS the wave's subject, not its failure.",
        runtimeModule: null,
        absentReason: `no CSS surface exists under ${P2_ROOT} — X.P.W1 ports instruments, not grammar`,
        declarations: () => null,
        peers: {},
    },
];

/** Load a candidate's runtime namespace, or report why it could not be loaded. */
export const loadCandidate = async (candidate) => {
    if (candidate.runtimeModule === null) {
        return { namespace: null, loaded: false, reason: candidate.absentReason };
    }
    if (!present(candidate.runtimeModule)) {
        return {
            namespace: null,
            loaded: false,
            reason: `runtime module absent at ${candidate.runtimeModule}`,
        };
    }
    const namespace = await import(candidate.runtimeModule);
    return { namespace, loaded: true, reason: null };
};
