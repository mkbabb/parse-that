import { BBNFToParser } from "../../src/bbnf/generate";
import fs from "fs";
import path from "path";

const grammar = fs.readFileSync(path.resolve(__dirname, "../../../grammar/json.bbnf"), "utf8");

const [nonterminals, ast] = BBNFToParser(grammar);

// Only trim the top-level entry point — the grammar's ?w annotations
// on comma, colon, array, and object already handle internal whitespace.
nonterminals.value = nonterminals.value.trim();

export const JSONParser = nonterminals.value;
