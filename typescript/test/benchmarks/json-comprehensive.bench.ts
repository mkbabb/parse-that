import { describe, bench, BenchOptions } from "vitest";
import fs from "fs";
import path from "path";

// parse-that parsers (raw AST — no value building)
import { JSONParser as BBNFRawParser } from "./bbnf";
import { JSONParser as HandRawParser } from "./parse-that";

// Value-building competitor parsers
import { json as ParsimmonJSONParser } from "./parsimmon";
import { parse as PeggyParse } from "./peggy";
import { parse as ChevrotainParse } from "./chevrotain";
import { parse as NearleyParse } from "./nearley";
import { parse as OhmParse } from "./ohm";

// Suppress console.log during benchmarks (parse-that logs parse errors)
const origLog = console.log;
function suppressLogs() { console.log = () => {}; }
function restoreLogs() { console.log = origLog; }

// ---------------------------------------------------------------------------
// Benchmark options
// ---------------------------------------------------------------------------
const options: BenchOptions = {
    warmupIterations: 50,
    time: 2000,
};

// ---------------------------------------------------------------------------
// Datasets
// ---------------------------------------------------------------------------
const dataDir = path.resolve(__dirname, "../../../data/json");

const datasets = [
    { name: "data.json (35 KB)", file: "data.json", maxCombKB: Infinity },
    { name: "apache-builds.json (124 KB)", file: "apache-builds.json", maxCombKB: Infinity },
    { name: "twitter.json (617 KB)", file: "twitter.json", maxCombKB: Infinity },
    { name: "citm_catalog.json (1.7 MB)", file: "citm_catalog.json", maxCombKB: 500 },
    { name: "canada.json (2.1 MB)", file: "canada.json", maxCombKB: 500 },
    { name: "data-xl.json (37 MB)", file: "data-xl.json", maxCombKB: 200 },
];

// ---------------------------------------------------------------------------
// Parser definitions
// ---------------------------------------------------------------------------
interface ParserDef {
    name: string;
    fn: (input: string) => any;
    buildsValues: boolean;
    isCombinator?: boolean;
}

const parserDefs: ParserDef[] = [
    { name: "JSON.parse (native)", fn: (s) => JSON.parse(s), buildsValues: true },
    { name: "Chevrotain", fn: (s) => ChevrotainParse(s), buildsValues: true },
    { name: "Peggy", fn: (s) => PeggyParse(s), buildsValues: true },
    { name: "Nearley + moo", fn: (s) => NearleyParse(s), buildsValues: true },
    { name: "Ohm", fn: (s) => OhmParse(s), buildsValues: true },
    { name: "parse-that (BBNF)", fn: (s) => BBNFRawParser.parse(s), buildsValues: false, isCombinator: true },
    { name: "parse-that (hand)", fn: (s) => HandRawParser.parse(s), buildsValues: false, isCombinator: true },
    { name: "Parsimmon", fn: (s) => ParsimmonJSONParser.tryParse(s), buildsValues: true, isCombinator: true },
];

// ---------------------------------------------------------------------------
// Benchmark matrix
// ---------------------------------------------------------------------------
for (const dataset of datasets) {
    const filePath = path.join(dataDir, dataset.file);
    if (!fs.existsSync(filePath)) continue;

    const input = fs.readFileSync(filePath, "utf-8");
    const kbSize = Math.round(Buffer.byteLength(input, "utf-8") / 1024);

    describe(`JSON — ${dataset.name}`, () => {
        for (const parser of parserDefs) {
            // Skip combinator parsers on very large datasets
            if (parser.isCombinator && kbSize > dataset.maxCombKB) continue;

            const fn = parser.fn;
            const suffix = parser.buildsValues ? "" : " (raw AST)";
            bench(
                `${parser.name}${suffix}`,
                () => {
                    suppressLogs();
                    try { fn(input); } finally { restoreLogs(); }
                },
                options,
            );
        }
    });
}
