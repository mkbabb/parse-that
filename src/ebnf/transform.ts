import { Expression, AST, Nonterminals } from "./grammar";

import { generateParserFromEBNF } from "./generate";
import { parserDebug } from "../parse/debug";

const nonterminalsToTrim = [
    "literal",
    "identifier",
    "symbol",
    "pipe",
    "comma",
    "star",
    "plus",
    "question",
    "minus",
    "div",
    "left_shift",
    "right_shift",
    "optional_whitespace",
    "big_comment",
    "comment",
    "factor",
    "binary_factor",
    "concatenation",
    "alternation",
    "rhs",
    "rule",
    "grammar",
];

const debugging = (x: Nonterminals) => {
    const logger = (...s: string[]) => {
        console.log(...s);
    };

    Object.entries(x).forEach(([key, value]) => {
        x[key] = parserDebug(value, key, true, logger);
    });
};

export const EBNFParser = (grammar: string) => {
    const [nonterminals, ast] = generateParserFromEBNF(grammar);

    for (const name of nonterminalsToTrim) {
        nonterminals[name] = nonterminals[name].trim();
    }

    nonterminals.symbol = nonterminals.symbol;

    nonterminals.identifier = nonterminals.identifier.map((v) => {
        return v.flat().join("");
    });

    nonterminals.literal = nonterminals.literal.map((v) => {
        return v.flat().join("");
    });

    nonterminals.regex = nonterminals.regex.map((v) => {
        const s = v.flat().join("");
        return s;
    });

    nonterminals.rhs = nonterminals.rhs.map((v) => {
        const a = v instanceof Array ? v.flat(Infinity) : v;
        const s = a.join(" ");
        return s;
    });

    nonterminals.rule = nonterminals.rule.map((v) => {
        const s = v.flat().join(" ");
        return s;
    });

    // debugging(nonterminals);

    return nonterminals.grammar.map((rules) => {
        let lastIx = 0;

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];

            if (rule.length > 80) {
                rules[i] = rule + "\n";
                if (i > 0 && lastIx !== i - 1) {
                    rules[i - 1] = rules[i - 1] + "\n";
                }
                lastIx = i;
            } else if (i - lastIx > 2) {
                rules[i] = rule + "\n";
                lastIx = i;
            }
        }
        return rules.join("\n");
    });
};
