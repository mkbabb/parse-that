const REGEX_GRAMMAR: &str = include_str!("../regex.bbnf");
const BOOTSTRAP_SCRIPT: &str = include_str!("../../scripts/bootstrap-regex.sh");

#[test]
fn regex_seed_control_names_its_entry_rule() {
    assert!(REGEX_GRAMMAR.contains("regex = alternation ;"));
}

#[test]
fn empty_target_bootstrap_requires_an_explicit_output_root() {
    let declares_output_root = BOOTSTRAP_SCRIPT.contains("--out-dir")
        || BOOTSTRAP_SCRIPT.contains("OUTPUT_ROOT")
        || BOOTSTRAP_SCRIPT.contains("OUT_DIR");
    assert!(
        declares_output_root,
        "bootstrap must require an explicit empty output root"
    );
}

#[test]
fn empty_target_bootstrap_cannot_write_into_the_source_tree() {
    assert!(
        !BOOTSTRAP_SCRIPT.contains("> parse_that/src/regex/generated.rs"),
        "bootstrap output must be rooted in the caller-provided empty directory"
    );
}

#[test]
fn empty_target_bootstrap_does_not_use_the_retired_expand_rewrite() {
    assert!(!BOOTSTRAP_SCRIPT.contains("cargo expand"));
    assert!(!BOOTSTRAP_SCRIPT.contains("python3"));
}
