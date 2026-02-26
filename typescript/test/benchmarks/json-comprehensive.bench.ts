import { describe, bench, BenchOptions } from "vitest";
import fs from "fs";
import path from "path";

// parse-that parsers (value-building, same output as JSON.parse)
import { JSONParser as BBNFParser } from "./bbnf";
import { JSONParser as HandParser } from "./parse-that";

// Competitor parsers (all value-building)
import { json as ParsimmonJSONParser } from "./parsimmon";
import { parse as PeggyParse } from "./peggy";
import { parse as ChevrotainParse } from "./chevrotain";
import { parse as NearleyParse } from "./nearley";

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
];

// ---------------------------------------------------------------------------
// Parser definitions — ALL build JS values (apples-to-apples)
// ---------------------------------------------------------------------------
interface ParserDef {
    name: string;
    fn: (input: string) => any;
    isCombinator?: boolean;
}

const parserDefs: ParserDef[] = [
    { name: "JSON.parse (native)", fn: (s) => JSON.parse(s) },
    { name: "Chevrotain", fn: (s) => ChevrotainParse(s) },
    { name: "Peggy", fn: (s) => PeggyParse(s) },
    { name: "Nearley + moo", fn: (s) => NearleyParse(s) },
    { name: "parse-that (BBNF)", fn: (s) => BBNFParser.parse(s), isCombinator: true },
    { name: "parse-that (hand)", fn: (s) => HandParser.parse(s), isCombinator: true },
    { name: "Parsimmon", fn: (s) => ParsimmonJSONParser.tryParse(s), isCombinator: true },
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
            bench(
                parser.name,
                () => {
                    suppressLogs();
                    try { fn(input); } finally { restoreLogs(); }
                },
                options,
            );
        }
    });
}
