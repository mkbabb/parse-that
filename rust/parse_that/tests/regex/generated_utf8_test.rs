//! sk-v27 LW2.RX-3: the self-hosted regex parser on a non-ASCII class member.
//!
//! `parse_generated` panics on a class that holds a non-ASCII scalar (LW1.RX
//! census, `regex-census/probe-run4.log`: `Span::as_str: invalid bounds
//! 40..41` on a value.js leaf holding `\u0080-\u{ffff}`). The generated
//! parser reads the grammar's `/[^\]\\]/` class atom one byte at a time,
//! so the atom's span ends inside the scalar. ECMAScript reads that leaf one
//! scalar at a time.
//!
//! The generated file is the bbnf-lang Rust emitter's product
//! (`scripts/bootstrap-regex.sh`), so the cure is the emitter's lowering of
//! a negated class plus a regeneration, not an edit in this crate.

use parse_that::regex::parse_generated;

/// Both minimal witnesses: a raw non-ASCII class member, and the census leaf
/// that first showed the panic.
const WITNESSES: &[&str] = &[
    "[é]",
    "#(?:[-_a-zA-Z\\u0080-\u{ffff}]|\\\\(?:[\\da-fA-F]{1,6}[ \\t\\n\\r\\f]?|[^\\n\\r\\f\\da-fA-F]))",
];

#[test]
#[ignore = "born-RED LW2.RX-3: the generated parser reads a negated-class leaf one byte at a time and slices inside a scalar (Span::as_str panic); cure in the bbnf-lang Rust emitter's negated-class lowering plus a regeneration of src/regex/generated.rs"]
fn generated_parser_reads_a_non_ascii_class_member() {
    for &pattern in WITNESSES {
        let read = std::panic::catch_unwind(|| parse_generated(pattern).is_ok());
        assert!(
            matches!(read, Ok(true)),
            "parse_generated({pattern:?}) must read the pattern without panicking"
        );
    }
}
