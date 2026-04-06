//! Bootstrap crate: generates a self-hosted regex parser from regex.bbnf.
//!
//! This crate is a permanent workspace member used solely for code generation.
//! It is never published — it exists only to produce `generated.rs`.
//!
//! Regenerate: `scripts/bootstrap-regex.sh`

use bbnf_derive::Parser;

#[derive(Parser)]
#[parser(path = "regex.bbnf")]
pub struct RegexParser;
