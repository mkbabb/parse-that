/**
 * BBNF Parser Benchmark: WASM Bytecode VM vs TS BBNF Combinator vs Hand-written TS vs JSON.parse
 *
 * Compares five JSON parser implementations:
 * 1. JSON.parse (native V8 — the ceiling)
 * 2. parse-that hand-written combinator (TS)
 * 3. BBNF → TS combinator (grammar-compiled to parse-that Parser closures)
 * 4. BBNF → WASM bytecode VM (full tree serialization)
 * 5. BBNF → WASM bytecode VM (check-only: success+offset, no tree)
 *
 * Requires:
 *   cd bbnf-lang/wasm && RUSTFLAGS="-C link-arg=-zstack-size=8388608" \
 *     wasm-pack build --target nodejs --out-dir pkg-node --release
 */
import { describe, bench, type BenchOptions } from "vitest";
import fs from "fs";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { JSONParser as HandParser } from "./parse-that";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Paths ───────────────────────────────────────────────────────────────

const BBNF_LANG_ROOT = resolve(__dirname, "../../../../bbnf-lang");
const WASM_JS = resolve(BBNF_LANG_ROOT, "wasm/pkg-node/bbnf_wasm.js");

// ── Grammar ─────────────────────────────────────────────────────────────

const JSON_GRAMMAR = `null = "null" ;
bool = "true" | "false" ;
number = /-?(0|[1-9]\\d*)(\\.\\d+)?([eE][+-]?\\d+)?/ ;
comma = "," ?w ;
colon = ":" ?w ;
string = /"(?:[^"\\\\]|\\\\(?:["\\\\\\/bfnrt]|u[0-9a-fA-F]{4}))*"/ ;
array = "[" >> (( value << comma ? ) *)?w << "]" ;
pair = string, colon >> value ;
object = "{" >> (( pair << comma ? ) *)?w << "}" ;
value = object | array | string | number | bool | null ;
`;

// ── Top-level init (runs before any bench registration) ─────────────────

// WASM
const wasm = await import(WASM_JS);
const wasmHandle = wasm.compile_grammar(JSON_GRAMMAR);

// Validate WASM
const wasmValid = wasm.parse_with_grammar(wasmHandle, '{"a": [1, true, null]}');
if (!wasmValid.success) throw new Error("WASM parse validation failed");
const wasmInvalid = wasm.parse_with_grammar(wasmHandle, "<<<invalid>>>");
if (wasmInvalid.success) throw new Error("WASM accepted invalid input");
const wasmCheck = wasm.parse_check(wasmHandle, '{"a": 1}');
if (!wasmCheck.success) throw new Error("WASM check validation failed");

// TS BBNF combinator
const bbnfMod = await import(
    resolve(BBNF_LANG_ROOT, "typescript/src/generate.ts")
);
const [nonterminals] = bbnfMod.BBNFToParser(JSON_GRAMMAR);
const bbnfTsParser = (nonterminals as any).value;

// Validate TS BBNF
const tsValid = bbnfTsParser.parse('{"a": [1, true, null]}');
if (tsValid == null) throw new Error("BBNF TS parse validation failed");
const tsInvalid = bbnfTsParser.parse("<<<invalid>>>");
if (tsInvalid != null) throw new Error("BBNF TS accepted invalid input");

// ── Config ──────────────────────────────────────────────────────────────

const options: BenchOptions = {
    warmupIterations: 50,
    time: 2000,
};

const dataDir = resolve(__dirname, "../../../data/json");

const datasets = [
    { name: "data.json (35 KB)", file: "data.json" },
    { name: "apache-builds.json (124 KB)", file: "apache-builds.json" },
    { name: "twitter.json (617 KB)", file: "twitter.json" },
    { name: "citm_catalog.json (1.7 MB)", file: "citm_catalog.json" },
    { name: "canada.json (2.1 MB)", file: "canada.json" },
];

// ── Benchmark ───────────────────────────────────────────────────────────

for (const dataset of datasets) {
    const filePath = resolve(dataDir, dataset.file);
    if (!existsSync(filePath)) continue;

    const input = fs.readFileSync(filePath, "utf-8");

    describe(`JSON — ${dataset.name}`, () => {
        bench("JSON.parse (native)", () => {
            JSON.parse(input);
        }, options);

        bench("parse-that (hand-written TS)", () => {
            HandParser.parse(input);
        }, options);

        bench("BBNF → TS combinator", () => {
            bbnfTsParser.parse(input);
        }, options);

        bench("BBNF → WASM VM (full tree)", () => {
            wasm.parse_with_grammar(wasmHandle, input);
        }, options);

        bench("BBNF → WASM VM (check-only)", () => {
            wasm.parse_check(wasmHandle, input);
        }, options);
    });
}
