# parse`[that]`

Parser combinators for TypeScript and Rust.

Write your language in [`BBNF`](https://github.com/mkbabb/bbnf-language-support) (better
backus-naur form) <img src="assets/bbnf-small.png" width=16>.

Handles left recursion and left factoring. Performance focused whilst maintaining
readability and ease of use.

## Usage

TypeScript:

```ts
import { string, regex } from "@mkbabb/parse-that";

const heyy = regex(/hey+t/);
heyy.parse("heyyyyyyyyyt"); // => "heyyyyyyyyyt"
```

Rust:

```rust
use parse_that::string;

let heyy = string("heyyyyyyyyyt");
heyy.parse("heyyyyyyyyyt"); // => "heyyyyyyyyyt"
```

Or with a grammar:

```ts
import { string, match, generateParserFromBBNF } from "@mkbabb/parse-that";

const grammar = `
    expr = term, { ("+" | "-"), term };
    term = factor, { ("*" | "/"), factor };
    factor = number | "(", expr, ")";
    number = /[0-9]+/;
    whatzupwitu = "whatzupwitu";
`;

const [nonterminals, ast] = generateParserFromBBNF(grammar);
const expr = nonterminals.expr;
expr.parse("1 + whatzupwitu * 3"); // => [1, "+", ["whatzupwitu", "*", 3]]
```

nice.

## Table of Contents

- [parse`[that]`](#parsethat)
  - [Usage](#usage)
  - [Table of Contents](#table-of-contents)
  - [Performance](#performance)
    - [TypeScript](#typescript)
      - [Results](#results)
        - [hz: ops/sec - higher is better](#hz-opssec---higher-is-better)
    - [Rust](#rust)
      - [Results](#results-1)
  - [Debugging](#debugging)
        - [Thanks to chalk and colored for the colors!](#thanks-to-chalk-and-colored-for-the-colors)
  - [BBNF and the Great Parser Generator](#bbnf-and-the-great-parser-generator)
    - [Key differences with EBNF](#key-differences-with-ebnf)
  - [Left recursion \& more](#left-recursion--more)
      - [Using BBNF](#using-bbnf)
      - [Combinator support](#combinator-support)
      - [Caveats](#caveats)
  - [`pretty`](#pretty)
  - [API \& examples](#api--examples)
  - [Sources, acknowledgements, \& c.](#sources-acknowledgements--c)

## Performance

### TypeScript

Here's a benchmark comparing the following libraries, all parsing the same `JSON`
grammar:

-   [Chevrotain](https://github.com/chevrotain/chevrotain)
-   [Parsimmon](https://github.com/jneen/parsimmon)
-   this library, with standard combinators: [here](test/json.test.ts)
-   this library, using a generated parser from BBNF: [here](test/bbnf.test.ts)

The file used is a 3.8 MB `JSON` file, containing ~10K lines of `JSON`. Whitespace is
randomly inserted to make the file a bit more difficult to parse (makes the file about
5x the size). Benchmark is run 100 times.

#### Results

| name       | hz     | min    | max    | mean   | p75    | p99    | p995   | p999   | rme    | samples |
| ---------- | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------- |
| Standard   | 8.1013 | 119.20 | 127.90 | 123.44 | 127.08 | 127.90 | 127.90 | 127.90 | ±2.64% | 10      |
| BBNF       | 5.1979 | 183.18 | 216.12 | 192.38 | 195.59 | 216.12 | 216.12 | 216.12 | ±3.97% | 10      |
| Chevrotain | 6.8699 | 129.91 | 167.46 | 145.56 | 158.21 | 167.46 | 167.46 | 167.46 | ±5.70% | 10      |
| Parsimmon  | 4.0256 | 246.69 | 250.34 | 248.41 | 249.09 | 250.34 | 250.34 | 250.34 | ±1.54% | 10      |

##### hz: ops/sec - higher is better

    Standard - test/benchmarks/json.bench.ts > JSON Parser
        1.18x faster than Chevrotain
        1.56x faster than BBNF
        2.01x faster than Parsimmon

Probably not the most scientific comparison, but it's generally about 10-30% faster than
what I've tested it against.

Have a look inside [benchmarks](./test/benchmarks) if you're curious.

### Rust

The approach taken in the Rust implementation is almost identical to that of the
TypeScript one - there's much to improve here. The benchmark is run on a 2.3 MB `JSON`
file (`canada.json`), containing ~10K lines of `JSON`. Benchmark is run 100 times.

#### Results

TODO: but it averages around 80 MB/s on my machine.

## Debugging

Debugging is made 🌈pretty🌈 by using the `debug` combinator - but you must run in
`development` mode (`vite build --mode development`) to see the output.

![image](./assets/debug.png)

As output, you'll see a few things:

-   A header containing:
    -   parsing status (`Ok` or `Err`)
    -   current offset into the input string
    -   debug node's name
    -   stringified current parser - a bit like the BBNF format
-   A body containing:
    -   A maximum of 10 lines of the input string, with the current offset into the
        parse string denoted by `^`
    -   Line numbers for each line currently displayed

The `blue` color indicates that that variable is an BBNF nonterminal - `yellow` is the
stringified parser.

##### Thanks to [chalk](https://github.com/chalk/chalk) and [colored](https://github.com/mackwic/colored) for the colors!

## BBNF and the Great Parser Generator

Better Backus-Naur Form is a simple and readable way to describe a language. A
[better](https://dwheeler.com/essays/dont-use-iso-14977-bbnf.html) EBNF.

See the BBNF for BBNF (meta right) at [bbnf.bbnf](./grammar/bbnf.bbnf).

With your grammar in hand, call the `generateParserFromBBNF` function within
[bbnf.ts](./src/bbnf.ts) and you'll be returned two objects:

```ts
[nonterminals, ast]: [BBNFNonterminals, BBNFAST] = generateParserFromBBNF(grammar);
```

a JavaScript object containing all of the parsed nonterminals in your language, and the
AST for your language. Each nonterminal is a `Parser` object - use it as you would any
other parser.

Fully featured, and self-parsing, so the BBNF parser-generator is written in BBNF.
Checkout the self-parsing example (+ formatting), at
[bbnf.test.ts](./test/bbnf.test.ts).

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

And yes emojis are supported. Epsilon even has a special value for it - `ε` (or just use
the word epsilon).

## Left recursion & more

This library fully supports left recursion (either direct or indirect) - highly
ambiguous grammars.

So grammars like (trivial direct left recursion):

```bbnf
expr = expr , "+" , expr
     | integer
     | string ;
```

and like (highly ambiguous):

```bbnf
ms = "s";
mSL = ( mSL , mSL , ms ) ? ;

mz = "z" ;
mZ = mZ | mY | mz ;

mY = mZ, mSL ;
```

are supported.

Our scheme is multifaceted and optimized depending upon a few factors:

#### Using BBNF

Since BBNF allows for one to easily grab ahold of the AST, we can optimize its structure
rather easily. Left recursion is "removed" (it's actually just factored out) using a
four-pass algorithm:

-   1. Sort the nonterminals topologically
-   2. Remove indirect left recursion
-   3. Remove left recursion
-   4. Factorize

For the above example each pass would look something like this:

Input grammar:

```bbnf
expr = expr , "+" , expr
     | integer
     | string ;
```

Sorted & removed left recursion:

```bbnf
expr = integer, expr_0
     | string, expr_0 ;
expr_0 = "+" , expr , expr_0
        | ε ;
```

Factorized:

```bbnf
expr = (integer | string) , expr_0 ;
expr_0 = "+" , expr , expr_0
        | ε
```

If any remaining left recursion is found, it's handled via the combinators.

#### Combinator support

Left recursion can be handled via two combinators: `memoize` and `mergeMemos`.
`mergeMemos` must be applied directly one's left-recursive call, and `memoize` must be
applied to the entire parser.

Here's an example:

```ts
...
const expression = Parser.lazy(() =>
    all(expression, operators.then(expression).opt()).mergeMemos().or(number)
)
    .memoize();
...
```

How this is done under the hood is by using a memoization table and a few clever tricks
to detect if the current parser is in a left-recursive call. See the
[left recursion](./docs/left-recursion.md) document for more information, and the
[memoization tests](./test/memoize.test.ts) for examples.

#### Caveats

Though left recursion is supported, it's absolutely not optimal. If it can be factored
out via the BBNF parser generator generally the performance will quite fine, but if it
cannot you may run into some performance issues. This stems, among other things,
primarily from JavaScript's lack of tail call optimization. Again, see the
[left recursion](./docs/left-recursion.md) document for more information.

## `pretty`

A pretty-printing submodule, inspired by Prettier, is included in the Rust
implementation. I wanted to have something similar in Rust for my own projects, but I
couldn't find anything that was simple enough to use. So I wrote my own. Check out the
`pretty` docs for more information.

## API & examples

See [api.md](./docs/api.md) for all of the API information.

See the [test](./test/) directory for fully explained and working examples.

## Sources, acknowledgements, & c.

-   [EBNF](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form)
-   [Left recursion information](https://en.wikipedia.org/wiki/Left_recursion)
-   [Notes On Parsing Ebnf](https://www.cs.umd.edu/class/spring2003/cmsc330/Notes/bbnf/bbnf.html)
-   [Notes On The Formal Theory Of Parsing](http://www.cs.may.ie/~jpower/Courses/parsing/parsing.pdf#search='indirect%20left%20recursion')
-   [Removing Left Recursion From Context Free Grammars](http://research.microsoft.com/pubs/68869/naacl2k-proc-rev.pdf)
-   [A new top-down parsing algorithm to accommodate ambiguity and left recursion in polynomial time](https://dl.acm.org/doi/10.1145/1149982.1149988)
-   [Modular and efficient top-down parsing for ambiguous left-recursive grammars](https://www.researchgate.net/profile/Richard-Frost-5/publication/30053225_Modular_and_efficient_top-down_parsing_for_ambiguous_left-recursive_grammars/links/00463518a68a2a7a6b000000/Modular-and-efficient-top-down-parsing-for-ambiguous-left-recursive-grammars.pdf?origin=publication_detail)

Other great parsing libraries 🎉:

-   [Parsimmon](https://github.com/jneen/parsimmon)
-   [bread-n-butter](https://github.com/wavebeem/bread-n-butter)
-   [parsy](https://github.com/python-parsy/parsy)
-   [Chevrotain](https://github.com/chevrotain/chevrotain)
-   [nom](https://github.com/rust-bakery/nom)
-   [pest] (https://github.com/pest-parser/pest)
