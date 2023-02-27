# Parse That [Thang](https://oldinterneticons.tumblr.com/post/679136268174688256/go-mouse-fuck-that-thang)

Parser combinators for TypeScript. Write your language in EEBNF (extended extended
backus-naur form) and parse it with ease. Handles left recursion, right recursion, and
left factoring.

Does what basically every other parser combinator library does, with a few extra
features and optimizations. Focused on performance as much as possible, though
combinators are always going to be slower than a custom flattened parser.

## Usage

Simple example:

```ts
import { string, match } from "@mkbabb/parse-that";

const heyy = match(/hey+t/);
heyy.parse("heyyyyyyyyyt"); // => "heyyyyyyyyyt"
```

Or with a grammar:

```ts
import { string, match, generateParserFromEBNF } from "@mkbabb/parse-that";

const grammar = `
    expr = term, { ("+" | "-"), term };
    term = factor, { ("*" | "/"), factor };
    factor = number | "(", expr, ")";
    number = /[0-9]+/;
    whatzupwitu = "whatzupwitu";
`;

const [nonterminals, ast] = generateParserFromEBNF(grammar);
const expr = nonterminals.expr;
expr.parse("1 + whatzupwitu * 3"); // => [1, "+", [2, "*", 3]]
```

nice.

## Table of Contents

- [Parse That Thang](#parse-that-thang)
  - [Usage](#usage)
  - [Table of Contents](#table-of-contents)
  - [Performance](#performance)
    - [Results](#results)
        - [hz: ops/sec - higher is better](#hz-opssec---higher-is-better)
  - [Debugging](#debugging)
        - [Thanks to chalk for the colors!](#thanks-to-chalk-for-the-colors)
  - [EEBNF and the Great Parser Generator](#eebnf-and-the-great-parser-generator)
    - [Key differences with EBNF](#key-differences-with-ebnf)
    - [Left recursion \& more](#left-recursion--more)
    - [Performance](#performance-1)
    - [Formatting, syntax highlighting, \& more](#formatting-syntax-highlighting--more)
  - [API \& examples](#api--examples)
  - [Sources, acknowledgements, \& c.](#sources-acknowledgements--c)

## Performance

As stated earlier, parser combinators using closures like this are always going to be
"slow" - at least in JavaScript. But it's perhaps not as bad as you think. Here's a
benchmark comparing the following libraries, all parsing the same `JSON` grammar:

-   [Chevrotain](https://github.com/chevrotain/chevrotain)
-   [Parsimmon](https://github.com/jneen/parsimmon)
-   this library, with standard combinators: [here](test/json.test.ts)
-   this library, using a generated parser from EEBNF: [here](test/ebnf.test.ts)

The file used is a 3.8 MB `JSON` file, containing ~10K lines of `JSON`. Whitespace is
randomly inserted to make the file a bit more difficult to parse (makes the file about
5x the size). The benchmark is run 100 times, and the average is taken.

### Results

| name       | hz     | min    | max    | mean   | p75    | p99    | p995   | p999   | rme    | samples |
| ---------- | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------- |
| Standard   | 8.1013 | 119.20 | 127.90 | 123.44 | 127.08 | 127.90 | 127.90 | 127.90 | ±2.64% | 10      |
| EEBNF      | 5.1979 | 183.18 | 216.12 | 192.38 | 195.59 | 216.12 | 216.12 | 216.12 | ±3.97% | 10      |
| Chevrotain | 6.8699 | 129.91 | 167.46 | 145.56 | 158.21 | 167.46 | 167.46 | 167.46 | ±5.70% | 10      |
| Parsimmon  | 4.0256 | 246.69 | 250.34 | 248.41 | 249.09 | 250.34 | 250.34 | 250.34 | ±1.54% | 10      |

##### hz: ops/sec - higher is better

    Standard - test/benchmarks/json.bench.ts > JSON Parser
        1.18x faster than Chevrotain
        1.56x faster than EEBNF
        2.01x faster than Parsimmon

Probably not the most scientific comparison, but it's about 10-25% faster, consistently,
than the rest. have a look inside [benchmarks](./test/benchmarks) if you're curious.

## Debugging

Debugging is made 🌈pretty🌈 by using the `debug` combinator - but you must run in
`development` mode (`vite build --mode development`) to see the output.

![image](./assets/debug.png)

As output, you'll see a few things:

-   A header containing:
    -   parsing status (`Ok` or `Err`)
    -   current offset into the input string
    -   debug node's name
    -   stringified current parser - a bit like the EEBNF format
-   A body containing:
    -   A maximum of 10 lines of the input string, with the current offset into the
        parse string denoted by `^`
    -   Line numbers for each line currently displayed

The `blue` color indicates that that variable is an EEBNF nonterminal - `yellow` is the
stringified parser.

##### Thanks to [chalk](https://github.com/chalk/chalk) for the colors!

## EEBNF and the Great Parser Generator

Extended Extended Backus-Naur Form is a simple and readable way to describe a language.
A [better](https://dwheeler.com/essays/dont-use-iso-14977-ebnf.html) EBNF.

See the EEBNF for EEBNF (meta right) at [eebnf.ebnf](./grammar/eebnf.ebnf).

With your grammar in hand, call the `generateParserFromEBNF` function within
[ebnf.ts](./src/ebnf.ts) and you'll be returned two objects:

```ts
[nonterminals, ast]: [EBNFNonterminals, EBNFAST] = generateParserFromEBNF(grammar);
```

a JavaScript object containing all of the parsed nonterminals in your language, and the
AST for your language. Each nonterminal is a `Parser` object - use it as you would any
other parser.

Fully featured, and self-parsing, so the EEBNF parser-generator is written in EEBNF.
Checkout the self-parsing example (+ formatting), at
[eebnf.test.ts](./test/ebnf.test.ts).

### Key differences with EBNF

It's a mesh between your run-of-the-mill EBNF and
[W3C's EBNF](https://www.w3.org/TR/REC-xml/#sec-notation). So stuff like `?` and `*` are
allowed - but it also supports `[ ]` and `{ }` for optional and repeated elements.

Set-like subtraction is supported, so you can do things like `a - b` to mean "a, but not
b".

Here's a list of operators:

-   `A?` | `[ A ]`: optional A
-   `A*` | `{ A }`: repeated A (0 or more)
-   `A+`: repeated A (1 or more)
-   `A | B`: A or B - higher precedence than `A, B`
-   `A, B`: A followed by B
-   `A - B`: A, but not B
-   `A >> B`: A, then B, but only return B
-   `A << B`: A, then B, but only return A
-   `( A )`: grouping - maximum precedence

### Left recursion & more

The EEBNF parser generator supports left recursion, right recursion, and left factoring.
It also supports left recursion with left factoring, and right recursion with left
factoring. So things like

```ebnf
expr = expr , "+" , expr
     | integer
     | string
```

Will parse correctly, and will be optimized to rewrite the modified tree structure. This
is done in three passes:

-   1. Sort the nonterminals topologically
-   2. Remove left recursion
-   3. Factorize

For the above example each pass would look something like this:

Input grammar:

```ebnf
expr = expr , "+" , expr
     | integer
     | string
```

Sorted & removed left recursion:

```ebnf
expr = integer, expr_0
     | string, expr_0
expr_0 = "+" , expr , expr_0
        | ε
```

Factorized:

```ebnf
expr = (integer | string), expr_0
expr_0 = "+" , expr , expr_0
        | ε
```

### Performance

There are a lot of little optimizations that are done to make the parser as efficient as
possible.

For example, if you have a rule like `A = A`, it will be rewritten to `A = ε`, or if you
have a rule like `A = A, B, ε`, it will be rewritten to `A = B`.

On the combinator side, calls to `any` with a single parser will be rewritten to just
that parser, and calls to `all` with a single parser will be rewritten to just that
parser, etc.

### Formatting, syntax highlighting, & more

With the EEBNF parser generator you basically get formatting for free. Call the
`formatEBNF` function within [ebnf.ts](./src/ebnf.ts) and you'll be returned a string
containing the formatted EEBNF.

```ts
const formattedGrammar: string = formatEBNF(grammar);
```

## API & examples

See [api.md](./docs/api.md) for all of the API information.

See the [test](./test/) directory for fully explained and working examples.

## Sources, acknowledgements, & c.

-   [EBNF](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form)
-   [Left recursion information](https://en.wikipedia.org/wiki/Left_recursion)
-   [Notes On Parsing Ebnf](https://www.cs.umd.edu/class/spring2003/cmsc330/Notes/ebnf/ebnf.html)
-   [Notes On The Formal Theory Of Parsing](http://www.cs.may.ie/~jpower/Courses/parsing/parsing.pdf#search='indirect%20left%20recursion')
-   [Removing Left Recursion From Context Free Grammars](http://research.microsoft.com/pubs/68869/naacl2k-proc-rev.pdf)
-   [A new top-down parsing algorithm to accommodate ambiguity and left recursion in polynomial time](https://dl.acm.org/doi/10.1145/1149982.1149988)

Other great parsing libraries 🎉:

-   [Parsimmon](https://github.com/jneen/parsimmon)
-   [bread-n-butter](https://github.com/wavebeem/bread-n-butter)
-   [parsy](https://github.com/python-parsy/parsy)
-   [Chevrotain](https://github.com/chevrotain/chevrotain)
