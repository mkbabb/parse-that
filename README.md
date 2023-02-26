# Parse That Thang

Parser combinators for TypeScript. Write your language in EEBNF (extended extended backus-naur form) and parse it with ease. Handles left recursion, right recursion, and left factoring.

Does what basically every other parser combinator library does, with a few extra features and optimizations - performance focused.

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
expr.parse("1 + 2 * 3"); // => [1, "+", [2, "*", 3]]
```

nice.

## EEBNF and the Great Parser Generator

Extended Extended Backus-Naur Form is a simple and readable way to describe a language. See the EEBNF for EEBNF (meta right) at [eebnf.ebnf](./grammar/eebnf.ebnf).

With your grammar in hand, call the `generateParserFromEBNF` function within [ebnf.ts](./src/ebnf.ts) and you'll be returned two objects:

```ts
[nonterminals, ast]: [EBNFNonterminals, EBNFAST] = generateParserFromEBNF(grammar);
```

a JavaScript object containing all of the parsed nonterminals in your language, and the AST for your language. Each nonterminal is a `Parser` object - use it as you would any other parser.

Fully featured, and self-parsing, so the EEBNF parser-generator is written in EEBNF. Checkout the self-parsing example (+ formatting), at [eebnf.test.ts](./test/ebnf.test.ts).

### Key differences with EBNF

It's a mesh between your run-of-the-mill EBNF and W3C's EBNF. So stuff like `?` and `*` are allowed - but it also supports `[ ]` and `{ }` for optional and repeated elements.

Set-like subtraction is supported, so you can do things like `a - b` to mean "a, but not b".

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

The EEBNF parser generator supports left recursion, right recursion, and left factoring. It also supports left recursion with left factoring, and right recursion with left factoring. So things like

```ebnf
expr = expr , "+" , expr
     | integer
     | string
```

Will parse correctly, and will be optimized to rewrite the modified tree structure. This is done in three passes:

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

There are a lot of little optimizations that are done to make the parser as efficient as possible.

For example, if you have a rule like `A = A`, it will be rewritten to `A = ε`, or if you have a rule like `A = A, B, ε`, it will be rewritten to `A = B`.

On the combinator side, calls to `any` with a single parser will be rewritten to just that parser, and calls to `all` with a single parser will be rewritten to just that parser, etc.

### Formatting, syntax highlighting, & more

With the EEBNF parser generator you basically get formatting for free. Call the `formatEBNF` function within [ebnf.ts](./src/ebnf.ts) and you'll be returned a string containing the formatted EEBNF.

```ts
const formattedGrammar: string = formatEBNF(grammar);
```

## API & examples

See [api.md](./docs/api.md) for all of the API information.

See the [examples](./examples/) directory for fully explained and working examples. Most of them are derived from the [test](./test/) directory, but with more explanation.

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
