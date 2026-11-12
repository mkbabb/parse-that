#!/usr/bin/env bash
# Regenerate the self-hosted regex parser from bootstrap/regex.bbnf.
#
# Usage: BBNF_LANG=<bbnf-lang checkout> scripts/bootstrap-regex.sh [--check]
#
# parse_that/src/regex/generated.rs is the product of bbnf-lang's Rust
# emitter. The derive and `cargo expand` path that produced it is retired;
# bbnf-lang's `cargo xtask regen-external` runs the same pipeline and
# renderer as its own grammars and writes the product for this crate
# (`--crate-internal`: `crate::` paths, a `pub(crate)` parse context).
# With --check nothing is written and a difference is an error.

set -euo pipefail
here=$(cd "$(dirname "$0")/.." && pwd)
: "${BBNF_LANG:?set BBNF_LANG to a bbnf-lang checkout}"

cd "$BBNF_LANG"
cargo xtask regen-external \
  --grammar "$here/bootstrap/regex.bbnf" \
  --marker RegexParser \
  --include-rel ../bootstrap/regex.bbnf \
  --out "$here/parse_that/src/regex/generated.rs" \
  --crate-internal "$@"
