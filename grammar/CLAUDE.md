# grammar/

Shared BBNF grammar files. Contract between TypeScript and Rust implementations.

## Structure

```
BBNF.md                    Language specification
about.md                   Directory overview
bbnf.bbnf                  BBNF grammar for BBNF itself (self-hosting)
bbnf.out                   Compiled BBNF output
json.bbnf                  JSON format
json-commented.bbnf        JSON with comment demos
csv.bbnf                   Simplified RFC 4180 CSV
math.bbnf                  Arithmetic with operator precedence
math-ambiguous.bbnf        Left-recursive arithmetic (ambiguous)
regex.bbnf                 JavaScript/Perl regex syntax
ebnf.bbnf                  EBNF notation
emoji.bbnf                 Emoji-based toy language
g4.bbnf                    English sentence structure
sS.bbnf                    Minimal recursive grammar (context-free classic)
css-color.bbnf             CSS colors (rgb, hsl, oklab, oklch, color-mix, hex)
css-selectors.bbnf         CSS Level 3+ selectors
css-values.bbnf            CSS property values
css-value-unit.bbnf        CSS unit primitives (imported by css-color.bbnf)
css-keyframes.bbnf         CSS @keyframes
tests/
  json/
    valid.jsonl            33 valid JSON test cases
    invalid.jsonl          7 invalid JSON test cases
  debug/
    expected-output.txt    Shared diagnostic output vectors (8 scenarios, ANSI-stripped)
```

## BBNF Syntax (Quick Reference)

```
rule = expression ;          Production rule
"str" | 'str' | `str`       String literals
/pattern/                    Regex
epsilon | ε                  Empty match
A | B                        Alternation (ordered choice)
A , B                        Concatenation
A >> B                       Next (discard A, keep B)
A << B                       Skip (keep A, discard B)
A - B                        Set difference
A* | { A }                   Zero or more
A+ | A ?w                    One or more | optional whitespace
A? | [ A ]                   Optional
( A )                        Grouping
// comment                   Line comment
/* comment */                Block comment
@import "file.bbnf" ;       Glob import
@import { a, b } from "f" ; Selective import
=> |s: &str| -> T { ... }   Mapping function (Rust only)
```

## Notes

- First rule is the start symbol by convention
- Nonterminals resolve lazily — rule order doesn't matter
- Mutual recursion fully supported
- `@import` is non-transitive
- Full spec: [BBNF.md](./BBNF.md)
