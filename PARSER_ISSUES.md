# parse-that: Known Parser Issues

Tracked during Phase 1A modernization (Feb 2026). These are all **pre-existing** issues
discovered when enabling `strict: true` and fixing test infrastructure — none are
regressions from the TS modernization.

---

## 1. BBNF Math Grammar — 100-term expressions return `undefined`

**File:** `test/bbnf.test.ts` → "should parse a simple math grammar"
**Grammar:** `grammar/math.bbnf`
**Status:** `it.todo()`

The BBNF-generated math parser (`expr/term/factor`) returns `undefined` when parsing
expressions with 100 terms (e.g. `1.23 + 4.56 * 7.89 - ...`). The hand-written
math parser in `test/math.test.ts` handles the same expressions correctly.

**Root cause:** Likely the BBNF generator's concatenation/alternation structure doesn't
match the `.map(reduceMathExpression)` expectation. The generated parser tree may
produce a different nesting shape than the test's `.map()` callback expects.

**Fix:** Debug with `parserDebug()` on a short expression to compare generated vs
expected AST shape. May need to adjust the grammar or the `.map()` callback.

---

## 2. BBNF CSS Value Unit Grammar — non-iterable result

**File:** `test/bbnf.test.ts` → "should parse a CSS value unit grammar"
**Grammar:** `grammar/css-value-unit.bbnf`
**Status:** `it.todo()`

When parsing unit-less numbers (e.g. `"28"`), the grammar returns a plain number
instead of a `[value, unit]` tuple. The test's destructuring `.map(([value, unit]) => ...)`
then throws "number is not iterable".

**Root cause:** The grammar's `valueUnit` rule likely has an alternation where a bare
number matches without a unit, producing a scalar instead of a tuple.

**Fix:** Ensure `valueUnit` always produces a consistent `[value, unit?]` shape, or
update the `.map()` to handle both cases.

---

## 3. BBNF JSON Grammar — Rust embedding + char joining

**File:** `test/bbnf.test.ts` → "should parse JSON data"
**Grammar:** `grammar/json.bbnf`
**Status:** `it.todo()`

Two issues:
1. **Rust embedding (fixed):** Line 15 had `=> |x| -> &'a str { x.as_str() }` —
   experimental Rust code embedding syntax. Commented out, replaced with
   `string = stringge ;`.
2. **Char array:** The grammar's `char*` rule produces an array of individual characters
   `["h","e","l","l","o"]` instead of a joined string `"hello"`. The test's
   `JSONParser()` function expects strings, not char arrays.
3. **NUMBER token (fixed):** `number = NUMBER ;` referenced an undefined Rust-specific
   built-in token. Replaced with a regex: `/-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/`.

**Fix:** Add `.map(chars => chars.join(""))` to the `string` nonterminal after BBNF
generation, or restructure the grammar to use a regex for string content matching
(like `json-commented.bbnf` does with `/[^"'\\]+/`).

---

## 4. Memoized Left-Recursive Grammar — stack overflow with `trim()`

**File:** `test/memoize.test.ts` → "should math from BBNF"
**Grammar:** `grammar/math-ambiguous.bbnf`
**Status:** `it.todo()`

```typescript
nonterminals.expression = nonterminals.expression.memoize().trim();
```

Calling `.trim()` on a memoized left-recursive parser causes infinite recursion.
The `trim()` combinator wraps the parser in whitespace consumption, but this creates
a new parser layer outside the memoization boundary, defeating the left-recursion
detection.

**Root cause:** `trim()` creates a new `Parser` that calls whitespace → inner parser →
whitespace. The inner parser is memoized, but the outer `trim()` wrapper is not,
so the left-recursion guard in `memoize()` never triggers.

**Fix:** Either:
- Apply `trim()` *before* `memoize()`: `nonterminals.expression.trim().memoize()`
- Or make `memoize()` propagate through `trim()` wrappers

---

## 5. Rust CSV Parser — truncated output on large files

**File:** `rust/parse_that/tests/csv_test.rs` → "test_csv_file"
**Status:** Pre-existing failure

The Rust CSV parser returns 119 rows instead of 62928 from
`active_charter_schools_report.csv`. The parser stops early, likely due to
a whitespace/line-ending handling issue in the `sep_by(regex_span(r"\s+"), ..)`
separator.

**Root cause:** The CSV line separator `regex_span(r"\s+")` greedily consumes
all whitespace including within quoted fields, or fails to handle CRLF properly.

**Fix:** Investigate line separator handling in `csv_parser()`.

---

## 6. Test Data File Paths (fixed)

**Files:** `test/csv.test.ts`, `test/json.test.ts`, `test/bbnf.test.ts`
**Status:** Fixed

Tests referenced `../data/data.csv` and `../data/data-l.json` but the files live in
subdirectories: `../data/csv/data.csv` and `../data/json/data-l.json`. Fixed paths.

---

## Priority

Issues 1-4 are parser/grammar logic issues that should be addressed in Phase 1A
cleanup or deferred to Phase 2 (when grammars are being updated for value.js migration).
Issue 3 (JSON grammar) is the easiest to fix — just needs a `.map(join)` call.
Issue 4 (trim+memoize ordering) is a design consideration for the parser combinator
library itself.
