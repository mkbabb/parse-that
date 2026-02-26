# BBNF Specification

BBNF (Babb Backus-Naur Form) is a grammar notation for defining parsers. It extends
classical EBNF with operators for whitespace handling, value projection (skip/next),
set difference, and optional mapping functions. BBNF grammars are the shared contract
between the TypeScript and Rust implementations of the `parse-that` parser combinator
library.

A BBNF file consists of one or more **production rules**, interleaved with comments.
Each rule defines a named nonterminal in terms of an expression built from terminals,
nonterminal references, and operators.

## Production Rules

A production rule binds a name (the left-hand side) to an expression (the right-hand
side), terminated by `;` or `.`:

```
name = expression ;
```

The left-hand side is an **identifier**: one or more characters matching
`[_a-zA-Z][_a-zA-Z0-9-]*`. Hyphens are allowed in identifiers (e.g. `color-value`).

The first rule in a grammar is treated as the start symbol by convention.

### Mapping Functions (Rust only)

In the Rust implementation, a production rule may include an inline mapping function
between the expression and the terminator. The mapping function is a Rust closure
introduced by `=>`:

```
number = /[0-9]+/ => |s: &str| -> i64 { s.parse().unwrap() } ;
```

The closure is parsed as a `syn::ExprClosure` and must include an explicit return type.
This feature is not available in the TypeScript implementation.

## Terminal Expressions

### String Literals

String literals match an exact sequence of characters. They are delimited by double
quotes, single quotes, or backticks:

```
"hello"
'world'
`template`
```

Escape sequences within string literals use the backslash character. Any character
preceded by `\` is treated literally:

| Sequence | Meaning |
|----------|---------|
| `\"` | Literal `"` |
| `\\` | Literal `\` |
| `\n` | Literal `n` (not a newline -- no C-style escapes) |

In the TypeScript implementation, the backslash-prefixed character is unescaped during
parsing (i.e. `\\` in the grammar source becomes a single `\` in the matched string).

### Regular Expressions

Regular expressions match a pattern against the input. They are delimited by forward
slashes:

```
/[0-9]+/
/[_a-zA-Z][_a-zA-Z0-9]*/
```

Escape sequences within regex delimiters follow the same backslash rule:
`\/` produces a literal `/`, `\\` produces a literal `\`. The content between the
delimiters is passed directly to the host language's regex engine (JavaScript `RegExp`
or Rust `regex::Regex`).

The TypeScript implementation additionally supports regex flags after the closing
delimiter (e.g. `/pattern/i`), matching the JavaScript `RegExp` flag set `[gimuy]`.

### Epsilon

The keyword `epsilon` (or the Unicode symbol `ε`) matches the empty string without
consuming any input:

```
empty = epsilon ;
maybe = "x" | ε ;
```

## Nonterminal References

A bare identifier in an expression refers to another production rule by name:

```
value = object | array | string | number | bool | null ;
```

Nonterminal references are resolved lazily, so rules may appear in any order and
mutually recursive grammars are supported.

## Operators

Operators are listed below from **lowest** to **highest** precedence. Higher-precedence
operators bind more tightly.

### 1. Alternation `|` (lowest precedence)

Ordered choice. Tries each alternative left to right and returns the first successful
match:

```
bool = "true" | "false" ;
```

When all alternatives are string literals, the code generators may emit an optimized
dispatch table instead of sequential trial-and-error.

### 2. Concatenation `,`

Sequence. Matches each operand in order and collects the results into a tuple (Rust)
or array (TypeScript):

```
pair = key , ":" , value ;
```

The comma is **optional** when the operands are unambiguous, but including it is
recommended for clarity. Both implementations parse `binary_factor` items separated
by optional commas at this precedence level.

### 3. Skip `<<` and Next `>>`

Value-projection operators. Both match two sub-expressions in sequence but discard
one side of the result:

- `A << B` -- match `A` then `B`, **keep the value of `A`**, discard `B`.
- `A >> B` -- match `A` then `B`, **keep the value of `B`**, discard `A`.

These are the workhorses for discarding delimiters and whitespace:

```
array = "[" >> elements << "]" ;
field = "," >> value ;
```

Skip and next are **left-associative** binary operators at equal precedence, so they
can be chained:

```
// parses "(", then inner, then ")" -- keeps inner
wrapped = "(" >> inner << ")" ;
```

### 4. Minus `-`

Set difference. Matches `A` only if `B` does **not** match at the same position:

```
non_digit = /\w/ - /\d/ ;
```

In the generated parser this compiles to `A.not(B)`: attempt `A`, but fail if `B`
would also succeed. Same precedence level as skip and next.

### 5. Quantifiers `*`, `+`, `?` (postfix, high precedence)

Repetition and optionality, applied as a **postfix** suffix to a term:

| Operator | Name | Meaning |
|----------|------|---------|
| `*` | Many | Zero or more repetitions |
| `+` | Many1 | One or more repetitions |
| `?` | Optional | Zero or one occurrence |

```
digits = /[0-9]/ + ;
items  = item * ;
sign   = ("+" | "-") ? ;
```

### 6. Optional Whitespace `?w` (postfix, high precedence)

A special postfix operator that wraps the preceding term so that optional whitespace
is consumed (and discarded) **before and after** it:

```
comma = "," ?w ;
rule  = lhs , "=" ?w , rhs ;
```

`expr ?w` is equivalent to `ws* >> expr << ws*` where `ws` matches `\s`. This is
distinct from `?` (which means "zero or one") -- the trailing `w` makes it a
whitespace-trimming operator.

The `?w` operator has the same precedence as the other postfix quantifiers.

### 7. Grouping Constructs (highest precedence)

Parentheses and brackets override precedence and introduce special semantics:

| Syntax | Name | Meaning |
|--------|------|---------|
| `( expr )` | Group | Parenthesized sub-expression (no semantic change) |
| `[ expr ]` | Optional group | Equivalent to `( expr ) ?` |
| `{ expr }` | Repetition group | Equivalent to `( expr ) *` |

```
// These two are equivalent:
array_a = "[" , [ items ] , "]" ;
array_b = "[" , ( items ) ? , "]" ;

// These two are equivalent:
list_a = item , { "," , item } ;
list_b = item , ( "," , item ) * ;
```

## Precedence Summary

From lowest to highest:

| Level | Operator(s) | Associativity | Description |
|-------|-------------|---------------|-------------|
| 1 | `\|` | left | Alternation (ordered choice) |
| 2 | `,` | left | Concatenation (sequence) |
| 3 | `<<` `>>` `-` | left | Skip, next, minus |
| 4 | `*` `+` `?` `?w` | postfix | Quantifiers, optional whitespace |
| 5 | `(` `)` `[` `]` `{` `}` | -- | Grouping constructs |

## Comments

BBNF supports two comment styles, matching C/JavaScript conventions:

```
// Line comment: extends to the end of the line

/* Block comment:
   may span multiple lines */
```

Comments may appear before or after production rules and before or after individual
factors within an expression. Both implementations preserve comments in the AST for
round-tripping and documentation generation.

## Debug Expressions (Rust only)

When the `debug` flag is set in the Rust code generator's `ParserAttributes`, each
generated nonterminal parser is wrapped in a `.debug(name)` call. This is a codegen-
level feature controlled by an attribute on the derive macro, not a syntactic construct
in the grammar source itself. The resulting `DebugExpression` AST node pairs the
inner expression with the nonterminal's name for runtime tracing.

## Full Grammar

BBNF is self-describing. The following grammar, written in BBNF, defines the BBNF
notation itself:

```bbnf
identifier = /[_a-zA-Z][_a-zA-Z0-9-]*/ ;

literal = "\"" , /(\\.|[^"\\])*/  , "\""
        | "'"  , /(\\.|[^'\\])*/  , "'"
        | "`"  , /(\\.|[^`\\])*/  , "`" ;

big_comment = ( "/*" , /[^\*]*/ , "*/" ) ?w ;
comment = ( "//" , /.*/ ) ?w ;

regex = "/" , /(\\.|[^\/])+/ , "/" ;

lhs = identifier ;

term = "ε"
     | identifier
     | literal
     | regex
     | "(" , rhs ?w , ")"
     | "[" , rhs ?w , "]"
     | "{" , rhs ?w , "}" ;

factor = big_comment ? , (
      term ?w , "?w"
    | term ?w , "?"
    | term ?w , "*"
    | term ?w , "+"
    | term
) , big_comment ? ;

binary_operators = "<<" | ">>" | "-" ;

binary_factor = factor , ( binary_operators ?w , factor ) * ;

concatenation = ( binary_factor ?w , "," ? ) + ;
alternation = ( concatenation ?w , "|" ? ) + ;

rhs = alternation ;

rule = lhs , "=" ?w , rhs ?w , ( ";" | "." ) ;

grammar = ( comment ? , rule ?w , comment ? ) * ;
```

## Examples

### JSON

```bbnf
null = "null" ;
bool = "true" | "false" ;

number = /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/ ;

comma = "," ?w ;
colon = ":" ?w ;

string = /"(?:[^"\\]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*"/ ;
array = "[" >> (( value << comma ? ) *)?w << "]" ;

pair = string, colon >> value ;
object = "{" >> (( pair << comma ? ) *)?w << "}" ;

value = object | array | string | number | bool | null ;
```

### CSV

```bbnf
// CSV grammar (simplified RFC 4180)

DQUOTE = "\"" ;
escaped = DQUOTE >> /[^"]*/ << DQUOTE ;
textdata = /[^,"\r\n]+/ ;

field = escaped | textdata ;

record = field, ( "," >> field ) * ;

csv = record, ( /\r?\n/ >> record ) * ;
```

### Arithmetic Expressions

```bbnf
expr = term, { ("+" | "-"), term } ;
term = factor, { ("*" | "/"), factor } ;

wrapped = "(", expr, ")" ;

factor = number | wrapped ;

number = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/ ;
```

## Implementation Notes

- **TypeScript**: Grammars are parsed at runtime by `BBNFGrammar` (in `grammar.ts`)
  and compiled to parser combinator trees by `ASTToParser` (in `generate.ts`). Mapping
  functions are not supported; post-parse transforms are applied programmatically.

- **Rust**: Grammars are parsed at compile time via a proc-macro derive
  (`#[derive(BBNF)]`). The derive macro reads `.bbnf` files, builds an AST, and emits
  Rust source code that constructs the equivalent parser combinator tree. Inline
  mapping functions (`=> |x| ...`) are supported and compiled directly into the
  generated code. The codegen also supports optional left-recursion removal, dispatch
  table optimization, and debug wrapping via derive attributes.
