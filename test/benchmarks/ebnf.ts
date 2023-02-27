import { generateParserFromEBNF } from "../../src";
import fs from "fs";

const grammar = fs.readFileSync("./grammar/json.ebnf", "utf8");

const [nonterminals, ast] = generateParserFromEBNF(grammar);

nonterminals.string = nonterminals.string.trim();
nonterminals.pair = nonterminals.pair.trim();
nonterminals.value = nonterminals.value.trim();

export const JSONParser = nonterminals.value;
