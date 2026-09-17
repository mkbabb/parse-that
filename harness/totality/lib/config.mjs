// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.a — absolute-path roots for the totality instrument.
//
// Q-1 (X-P-W1.md §Open): the fresh root has no `node_modules` and no root
// `package.json`. Every foreign tree this instrument reads is therefore
// addressed by ABSOLUTE PATH and read read-only; nothing is installed, nothing
// is written outside `harness/totality/**`. Each root is overridable by env so
// the instrument is portable off this box without editing its bytes.

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const env = (name, fallback) => {
    const raw = process.env[name];
    return raw && raw.length > 0 ? raw : fallback;
};

/** This instrument's own directory — the only tree it may write. */
export const TOTALITY_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
);

/** The fresh root (`<p2>`), i.e. the repository this harness lives in. */
export const P2_ROOT = path.resolve(TOTALITY_DIR, "..", "..");

/**
 * value.js — the FROZEN SURFACE'S SOURCE OF TRUTH.
 * `src/css/index.ts` is the file the manifest is derived from at run time;
 * `src/css/types.ts` is where the frozen union variants are read from.
 */
export const VALUE_JS_ROOT = env("VALUE_JS_ROOT", "/Users/mkbabb/Programming/value.js");
export const CSS_INDEX = path.join(VALUE_JS_ROOT, "src/css/index.ts");
export const CSS_TYPES = path.join(VALUE_JS_ROOT, "src/css/types.ts");

/**
 * keyframes — the kf CONSUME SEAM (`coverage.md` Surface 2, Finding F-3).
 * Read only to derive the 37-symbol column. NEVER merged into the 52.
 * `keyframes-v-exec` is the tree `coverage.md` measured (27 import sites).
 */
export const KF_ROOT = env("KF_ROOT", "/Users/mkbabb/Programming/keyframes-v-exec");
export const KF_SRC = path.join(KF_ROOT, "src");

/** The prototype workspace (OP-3) — home of the vendored sha-pinned tarball. */
export const PROTO_WORKSPACE = env(
    "PROTO_WORKSPACE",
    path.join(VALUE_JS_ROOT, "docs/tranches/V/megatranche/prototypes/css-parser"),
);

/**
 * The published `@mkbabb/value.js@4.0.0` `/css` subpath, vendored and
 * sha-pinned under `cand-o/vendor/`. This is the shipped surface — the
 * instrument's POSITIVE CONTROL. Read-only; never the working-tree dist
 * (parser-band G6: the repo's own `dist/subpaths/css.js` differs from what
 * 4.0.0 ships, and that dist-drift is a separately ledgered finding).
 */
export const PUBLISHED_400_DIR = path.join(
    PROTO_WORKSPACE,
    "cand-o/vendor/value-js-4.0.0/dist/subpaths",
);

/**
 * The parser-proof job tree — home of the C14 assay, the subject of the
 * gate-time census (`coverage.md` Surface 1). The instrument's NEGATIVE
 * CONTROL. Ephemeral by nature; unit .c's rescue is its durable copy.
 */
export const PARSER_PROOF_DIR = env(
    "PARSER_PROOF_DIR",
    "/Users/mkbabb/.claude/jobs/9e7dadd0/tmp/parser-proof",
);

/** Absolute path of the manifest the plain invocation writes and `--check` compares. */
export const MANIFEST_PATH = path.join(TOTALITY_DIR, "manifest.json");

/** A root is optional when absent: the runner reports the absence, never guesses. */
export const present = (p) => existsSync(p);
