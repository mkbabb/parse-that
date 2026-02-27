# Grammars

Herein you'll find a swath of grammars for the various languages that I've specced out.
Some are trivial, some are more involved. Used to show the flexibility of BBNF's
syntax.

## BBNF

The grammar of BBNF itself is defined in BBNF for convenience. See the
[BBNF grammar](./bbnf.bbnf) for the exact format, and the [language spec](./BBNF.md).

## Grammars

| File | Description |
|---|---|
| bbnf.bbnf | BBNF in BBNF (self-hosting) |
| json.bbnf | JSON |
| json-commented.bbnf | JSON with comment demos |
| csv.bbnf | Simplified RFC 4180 CSV |
| math.bbnf | Arithmetic with operator precedence |
| math-ambiguous.bbnf | Left-recursive arithmetic |
| regex.bbnf | JavaScript/Perl regex syntax |
| ebnf.bbnf | EBNF notation |
| emoji.bbnf | Emoji toy language |
| g4.bbnf | English sentence structure |
| sS.bbnf | Minimal recursive grammar |
| css-color.bbnf | CSS colors (rgb, hsl, oklab, oklch, hex, color-mix) |
| css-selectors.bbnf | CSS Level 3+ selectors |
| css-values.bbnf | CSS property values |
| css-value-unit.bbnf | CSS unit primitives |
| css-keyframes.bbnf | CSS @keyframes |

## Test Vectors

`tests/json/` contains shared JSON test vectors (JSONL format) used by both TypeScript
and Rust test suites: 33 valid cases, 7 invalid cases.
