// Nearley JSON parser benchmark using moo tokenizer
// Compiled grammar format written inline (no nearleyc CLI)

import nearley from "nearley";
import moo from "moo";

// ── Moo tokenizer ──────────────────────────────────────────────────────────────

const lexer = moo.compile({
    ws: { match: /[ \t\n\r]+/, lineBreaks: true },
    string: {
        match: /"(?:[^\\"\n]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/,
        value: (s: string) => JSON.parse(s),
    },
    number: {
        match: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
        value: (s: string) => Number(s),
    },
    lbrace: "{",
    rbrace: "}",
    lbracket: "[",
    rbracket: "]",
    comma: ",",
    colon: ":",
    true: { match: "true", value: () => true },
    false: { match: "false", value: () => false },
    null: { match: "null", value: () => null },
});

// ── Helpers ────────────────────────────────────────────────────────────────────

// Token type shorthand — nearley matches moo tokens by { type: "name" }
const T = (name: string) => ({ type: name } as moo.Token);

// ── Compiled grammar ───────────────────────────────────────────────────────────
// This is the equivalent of what `nearleyc` would produce from a .ne file.
//
// Grammar rules:
//   json      → _ value _                              → d[1]
//   value     → object | array | string | number | true | false | null
//   object    → "{" _ "}"                              → {}
//   object    → "{" _ pair (_ "," _ pair)* _ "}"       → merge pairs
//   pair      → string _ ":" _ value                   → [key, val]
//   array     → "[" _ "]"                              → []
//   array     → "[" _ value (_ "," _ value)* _ "]"     → collect values
//   _         → ws?                                    → null

const compiledGrammar = {
    Lexer: lexer,
    ParserRules: [
        // json → _ value _
        {
            name: "json",
            symbols: ["_", "value", "_"],
            postprocess: (d: any[]) => d[1],
        },

        // value → object
        { name: "value", symbols: ["object"], postprocess: (d: any[]) => d[0] },
        // value → array
        { name: "value", symbols: ["array"], postprocess: (d: any[]) => d[0] },
        // value → string token
        {
            name: "value",
            symbols: [T("string")],
            postprocess: (d: any[]) => d[0].value,
        },
        // value → number token
        {
            name: "value",
            symbols: [T("number")],
            postprocess: (d: any[]) => d[0].value,
        },
        // value → true
        {
            name: "value",
            symbols: [T("true")],
            postprocess: () => true,
        },
        // value → false
        {
            name: "value",
            symbols: [T("false")],
            postprocess: () => false,
        },
        // value → null
        {
            name: "value",
            symbols: [T("null")],
            postprocess: () => null,
        },

        // object → "{" _ "}"
        {
            name: "object",
            symbols: [T("lbrace"), "_", T("rbrace")],
            postprocess: () => ({}),
        },
        // object → "{" _ pair pairs _ "}"
        {
            name: "object",
            symbols: [T("lbrace"), "_", "pair", "pairs", "_", T("rbrace")],
            postprocess: (d: any[]) => {
                const obj: Record<string, any> = {};
                obj[d[2][0]] = d[2][1];
                const rest: [string, any][] = d[3];
                for (let i = 0; i < rest.length; i++) {
                    obj[rest[i][0]] = rest[i][1];
                }
                return obj;
            },
        },

        // pairs → (repeating comma-separated pairs, EBNF *-expansion)
        // pairs → <empty>
        {
            name: "pairs",
            symbols: [],
            postprocess: () => [],
        },
        // pairs → pairs _ "," _ pair
        {
            name: "pairs",
            symbols: ["pairs", "_", T("comma"), "_", "pair"],
            postprocess: (d: any[]) => {
                d[0].push(d[4]);
                return d[0];
            },
        },

        // pair → string _ ":" _ value
        {
            name: "pair",
            symbols: [T("string"), "_", T("colon"), "_", "value"],
            postprocess: (d: any[]) => [d[0].value, d[4]],
        },

        // array → "[" _ "]"
        {
            name: "array",
            symbols: [T("lbracket"), "_", T("rbracket")],
            postprocess: () => [],
        },
        // array → "[" _ value elements _ "]"
        {
            name: "array",
            symbols: [
                T("lbracket"),
                "_",
                "value",
                "elements",
                "_",
                T("rbracket"),
            ],
            postprocess: (d: any[]) => {
                const arr: any[] = [d[2]];
                const rest: any[] = d[3];
                for (let i = 0; i < rest.length; i++) {
                    arr.push(rest[i]);
                }
                return arr;
            },
        },

        // elements → (repeating comma-separated values, EBNF *-expansion)
        // elements → <empty>
        {
            name: "elements",
            symbols: [],
            postprocess: () => [],
        },
        // elements → elements _ "," _ value
        {
            name: "elements",
            symbols: ["elements", "_", T("comma"), "_", "value"],
            postprocess: (d: any[]) => {
                d[0].push(d[4]);
                return d[0];
            },
        },

        // _ → <empty> (optional whitespace)
        {
            name: "_",
            symbols: [],
            postprocess: () => null,
        },
        // _ → ws
        {
            name: "_",
            symbols: [T("ws")],
            postprocess: () => null,
        },
    ],
    ParserStart: "json",
};

// ── Compile once at module load ────────────────────────────────────────────────

const grammar = nearley.Grammar.fromCompiled(compiledGrammar);

export function parse(text: string) {
    const parser = new nearley.Parser(grammar);
    parser.feed(text);
    return parser.results[0];
}
