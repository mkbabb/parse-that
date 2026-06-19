// A.W1 gate — proof:no-css-surface (inv-A-1).
//
// The CSS grammar moved to value.js (D2/D3). This gate enforces that the CSS
// surface is GONE — permanently and completely.
//
// OBSERVABLE-TRUTH NOTE (inv-M-observable-truth): the charter's first draft
// grepped `dist/index.d.ts` for CSS symbol substrings. That is UNSOUND — the
// barrel re-exports the parsers tier via `export * from './parsers/index.js'`,
// so the CSS symbols never appear inlined in `index.d.ts`; they live in
// `dist/parsers/css/*.d.ts` and are bundled into the runtime `dist/parse.js`.
// A substring grep of `index.d.ts` would pass GREEN with the CSS parser still
// shipping. This gate instead observes the REAL surface:
//   (1) the runtime export keys of the bundled `dist/parse.js`, and
//   (2) the absence of any `dist/parsers/css` emission and `src/parse/parsers/css`.
import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const CSS_SYMBOLS = [
    "cssParser", "parseSingleValue", "parseFunctionArgs", "specificity",
    "CssNode", "CssColor", "CssSelector", "CssDeclaration",
    "KeyframeBlock", "KeyframeStop", "MediaQuery", "MediaCondition",
    "MediaFeature", "RangeOp", "SupportsCondition", "Specificity",
];

let failed = false;

// (1) Runtime export surface of the bundled dist — the truth a consumer sees.
const distEntry = resolve(root, "dist/parse.js");
if (!existsSync(distEntry)) {
    console.error("FAIL: dist/parse.js missing — build before running this gate.");
    process.exit(1);
}
const mod = await import(distEntry);
const present = CSS_SYMBOLS.filter((s) => s in mod);
if (present.length > 0) {
    console.error(`FAIL: CSS symbols still in the runtime surface: ${present.join(", ")}`);
    failed = true;
}

// (2) No CSS source / dist emission survives.
for (const dir of ["src/parse/parsers/css", "dist/parsers/css"]) {
    if (existsSync(resolve(root, dir))) {
        console.error(`FAIL: CSS directory still present: ${dir}`);
        failed = true;
    }
}

// (3) The parsers barrel exposes only the json/csv showcase + string utils.
const parsersDist = resolve(root, "dist/parsers");
if (existsSync(parsersDist)) {
    const leftover = readdirSync(parsersDist).filter((f) => /css/i.test(f));
    if (leftover.length > 0) {
        console.error(`FAIL: css artifacts in dist/parsers: ${leftover.join(", ")}`);
        failed = true;
    }
}

if (failed) process.exit(1);
console.log(
    `proof:no-css-surface GREEN — ${Object.keys(mod).length} runtime exports, zero CSS surface.`,
);
