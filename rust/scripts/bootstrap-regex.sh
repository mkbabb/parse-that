#!/usr/bin/env bash
# Regenerate the self-hosted regex parser from bootstrap/regex.bbnf.
#
# Usage: scripts/bootstrap-regex.sh
#
# Requires: cargo-expand (cargo install cargo-expand)
# The bootstrap crate uses bbnf_derive via .cargo/config.toml patches.

set -euo pipefail
cd "$(dirname "$0")/.."

RAW=$(mktemp)
trap 'rm -f "$RAW"' EXIT

echo "Expanding regex-bootstrap..."
cargo expand -p regex-bootstrap 2>/dev/null > "$RAW"

echo "Processing generated code..."
python3 << PYEOF > parse_that/src/regex/generated.rs
import re, sys

lines = open("$RAW").readlines()
start = next(i for i, l in enumerate(lines) if "use ::parse_that" in l)
body = "".join(lines[start:])

# Rewrite external crate path to internal
body = body.replace("::parse_that::", "crate::")

# Replace unstable core::panicking::panic_fmt with stable panic!
body = re.sub(
    r'\{\s*::core::panicking::panic_fmt\(\s*format_args!\(([^)]+)\),?\s*\);\s*\}',
    r'panic!(\1);',
    body,
)

header = '''#![allow(unused, non_snake_case, non_camel_case_types, clippy::all)]
//! AUTO-GENERATED from bootstrap/regex.bbnf — do not edit manually.
//! Regenerate: scripts/bootstrap-regex.sh

use crate::*;

pub struct RegexParser;

'''

# Skip the 'use crate::*;' line already in body (we put it in header)
body = body.replace("use crate::*;\n", "", 1)

sys.stdout.write(header + body)
PYEOF

LINES=$(wc -l < parse_that/src/regex/generated.rs)
echo "Generated parse_that/src/regex/generated.rs ($LINES lines)"
