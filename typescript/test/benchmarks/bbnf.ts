import { BBNFToParser } from "../../src/bbnf/generate";
import fs from "fs";

const grammar = fs.readFileSync("../grammar/json.bbnf", "utf8");

const [nonterminals, ast] = BBNFToParser(grammar);

// Add value-building transforms so output matches JSON.parse
nonterminals.null = nonterminals.null.map(() => null);
nonterminals.bool = nonterminals.bool.map((v: string) => v === "true");
nonterminals.number = nonterminals.number.map(Number);
nonterminals.string = nonterminals.string.map((s: string) => JSON.parse(s));
nonterminals.pair = nonterminals.pair.map(([k, v]: [string, any]) => [k, v]);
nonterminals.object = nonterminals.object.map((pairs: [string, any][]) =>
    Object.fromEntries(pairs),
);

// Only trim the top-level entry point — the grammar's ?w annotations
// on comma, colon, array, and object already handle internal whitespace.
nonterminals.value = nonterminals.value.trim();

export const JSONParser = nonterminals.value;
