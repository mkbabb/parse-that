# parse-that: Known Parser Issues

Tracked during Phase 1A modernization (Feb 2026). These are all **pre-existing** issues
discovered when enabling `strict: true` and fixing test infrastructure — none are
regressions from the TS modernization.

---

## 1. BBNF Math Grammar — 100-term expressions return `undefined`

**File:** `test/bbnf.test.ts` → "should parse a simple math grammar"
**Grammar:** `grammar/math.bbnf`
**Status:** ✅ Fixed

The BBNF-generated math parser now correctly parses 100-term expressions and produces
results matching `eval()`. The `reduceMathExpression` map callback and grammar structure
work together correctly.

---

## 2. BBNF CSS Value Unit Grammar — non-iterable result

**File:** `test/bbnf.test.ts` → "should parse a CSS value unit grammar"
**Grammar:** `grammar/css-value-unit.bbnf`
**Status:** ✅ Fixed

The `unitless` nonterminal override wraps plain numbers into `{value, unit}` objects,
and the `valueUnit` map callback handles both object and tuple shapes.

---

## 3. BBNF JSON Grammar — Rust embedding + char joining

**File:** `test/bbnf.test.ts` → "should parse JSON data"
**Grammar:** `grammar/json.bbnf`
**Status:** ✅ Fixed

The `string` nonterminal map callback joins char arrays into strings. The Rust embedding
syntax was commented out and NUMBER token replaced with regex.

---

## 4. Memoized Left-Recursive Grammar — stack overflow with `trim()`

**File:** `test/memoize.test.ts` → "should math from BBNF"
**Grammar:** `grammar/math-ambiguous.bbnf`
**Status:** `it.todo()` — partially fixed

The stack overflow is fixable by reordering to `.trim().mergeMemos().memoize()`. However,
the underlying left-recursive ambiguous grammar still produces incorrect parse trees due
to seed-growing algorithm limitations. Requires proper GLL/Earley-style ambiguous parse
algorithm to fully fix.

---

## 5. Rust CSV Parser — truncated output on large files

**File:** `rust/parse_that/tests/csv_test.rs` → "test_csv_file"
**Status:** ✅ Fixed

Root cause: `regex_span(r"\s+")` as line separator greedily consumed all whitespace
including spaces within fields. Fixed by using `regex_span(r"[ \t]*(\r?\n)+[ \t]*")`
which only separates on newlines while consuming optional horizontal whitespace.

---

## 6. Test Data File Paths (fixed)

**Files:** `test/csv.test.ts`, `test/json.test.ts`, `test/bbnf.test.ts`
**Status:** ✅ Fixed

Tests referenced `../data/data.csv` and `../data/data-l.json` but the files live in
subdirectories: `../data/csv/data.csv` and `../data/json/data-l.json`. Fixed paths.

---

## 7. TS Memoization — module-level globals

**File:** `typescript/src/parse/index.ts`
**Status:** ✅ Fixed

MEMO, LEFT_RECURSION_COUNTS, and lastState were module-level globals creating reentrancy
hazards. Encapsulated into `ParseRunContext` class, instantiated fresh per `parseState()`
call.

---

## 8. TS `sepBy()` off-by-one

**File:** `typescript/src/parse/index.ts`
**Status:** ✅ Fixed

`sepBy()` used `matches.length > min` instead of `>= min`, requiring one more match than
specified. Fixed to `>= min` to match `many()`'s behavior. Also added non-advancing guard
to `many()` to prevent infinite loops with zero-length-match parsers.

---

## 9. Rust BBNF Derive Macro — recursive grammar stack overflow

**Status:** Known limitation

The `bbnf_derive` proc macro crashes (SIGBUS) on grammars with mutually recursive
nonterminal references (e.g., `css-color.bbnf` where `color → colorMix → color`). The
`check_for_wrapped` function in `bbnf/src/generate.rs` recurses infinitely. Grammar
parsing tests pass; only code generation is affected.
