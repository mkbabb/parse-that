#!/usr/bin/env bash
# Regenerate the self-hosted regex parser from bootstrap/regex.bbnf.
#
# parse_that/src/regex/generated.rs is the product of bbnf-lang's retired
# enum emission (`#[derive(Parser)]` expanded with `cargo expand`). That
# emission is gone: bbnf-lang emits struct-direct parsers only, each bound
# to a hand-written runtime substrate in its production manifest
# (`crates/ir/src/registry/strategy.rs`). This file therefore has no
# regeneration path today. Porting it (a struct-direct runtime for the
# regex grammar and `host.rs` on it) is held for a ruling (sk-v27
# LW3.RX-1d, the `generated_utf8` born-RED).
echo "bootstrap-regex: no regeneration path for parse_that/src/regex/generated.rs (held, sk-v27 LW3.RX-1d)" >&2
exit 1
