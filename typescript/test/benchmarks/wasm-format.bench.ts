/**
 * Gorgeous WASM Format Benchmark: CSS + JSON formatting throughput via WASM
 *
 * Benchmarks the pre-built gorgeous formatters exposed through the bbnf-wasm package:
 * 1. format_css — CSS formatting (parse + to_doc + render)
 * 2. format_json — JSON formatting (parse + to_doc + render)
 *
 * Requires:
 *   cd bbnf-lang/wasm && wasm-pack build --target nodejs --out-dir pkg-node --release
 */
import { describe, bench, type BenchOptions } from "vitest";
import fs from "fs";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Paths ───────────────────────────────────────────────────────────────

const BBNF_LANG_ROOT = resolve(__dirname, "../../../../bbnf-lang");
const WASM_JS = resolve(BBNF_LANG_ROOT, "wasm/pkg-node/bbnf_wasm.js");

// ── Top-level init (runs before any bench registration) ─────────────────

const wasm = await import(WASM_JS);

// Validate format_css
const cssValid = wasm.format_css("body { color: red; }", 80, 2, false);
if (cssValid == null) throw new Error("WASM format_css validation failed");

// Validate format_json
const jsonValid = wasm.format_json('{"a": [1, true, null]}', 80, 2, false);
if (jsonValid == null) throw new Error("WASM format_json validation failed");

// ── Config ──────────────────────────────────────────────────────────────

const options: BenchOptions = {
    warmupIterations: 50,
    time: 2000,
};

const MAX_WIDTH = 80;
const INDENT = 2;
const USE_TABS = false;

// ── CSS Datasets ────────────────────────────────────────────────────────

const cssDataDir = resolve(__dirname, "../../../data/css");

const cssDatasets = [
    { name: "normalize.css (6 KB)", file: "normalize.css" },
    { name: "bootstrap.css (274 KB)", file: "bootstrap.css" },
    { name: "tailwind-output.css (3.6 MB)", file: "tailwind-output.css" },
];

for (const dataset of cssDatasets) {
    const filePath = resolve(cssDataDir, dataset.file);
    if (!existsSync(filePath)) continue;

    const input = fs.readFileSync(filePath, "utf-8");
    const sizeMB = Buffer.byteLength(input, "utf-8") / (1024 * 1024);

    describe(`format_css — ${dataset.name}`, () => {
        bench(
            "WASM format_css",
            () => {
                wasm.format_css(input, MAX_WIDTH, INDENT, USE_TABS);
            },
            options,
        );
    });
}

// ── JSON Datasets ───────────────────────────────────────────────────────

const jsonDataDir = resolve(__dirname, "../../../data/json");

const jsonDatasets = [
    { name: "data.json (35 KB)", file: "data.json" },
    { name: "apache-builds.json (124 KB)", file: "apache-builds.json" },
    { name: "twitter.json (617 KB)", file: "twitter.json" },
    { name: "citm_catalog.json (1.7 MB)", file: "citm_catalog.json" },
    { name: "canada.json (2.1 MB)", file: "canada.json" },
];

for (const dataset of jsonDatasets) {
    const filePath = resolve(jsonDataDir, dataset.file);
    if (!existsSync(filePath)) continue;

    const input = fs.readFileSync(filePath, "utf-8");
    const sizeMB = Buffer.byteLength(input, "utf-8") / (1024 * 1024);

    describe(`format_json — ${dataset.name}`, () => {
        bench(
            "WASM format_json",
            () => {
                wasm.format_json(input, MAX_WIDTH, INDENT, USE_TABS);
            },
            options,
        );
    });
}
