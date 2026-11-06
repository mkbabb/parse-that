use std::env;
use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{self, Command};
use std::sync::atomic::{AtomicUsize, Ordering};

static NEXT_TEMP_ID: AtomicUsize = AtomicUsize::new(0);

struct TempProject {
    root: PathBuf,
}

impl TempProject {
    fn new(fixture: &str) -> Self {
        let id = NEXT_TEMP_ID.fetch_add(1, Ordering::Relaxed);
        let root = env::temp_dir().join(format!(
            "parse-that-uw0-ui-{}-{fixture}-{id}",
            process::id()
        ));
        fs::create_dir_all(root.join("src")).expect("create temporary UI project");
        Self { root }
    }
}

impl Drop for TempProject {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

fn toml_path(path: &Path) -> String {
    path.to_string_lossy()
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
}

fn assert_fixture_does_not_compile(name: &str, source: &str) {
    let project = TempProject::new(name);
    let package_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let manifest = format!(
        r#"[package]
name = "uw0_ui_{name}"
version = "0.0.0"
edition = "2024"
publish = false

[workspace]

[dependencies]
parse_that = {{ path = "{}" }}
"#,
        toml_path(package_dir),
    );

    fs::write(project.root.join("Cargo.toml"), manifest).expect("write temporary Cargo.toml");
    fs::write(project.root.join("src/main.rs"), source).expect("write temporary fixture source");

    let cargo = option_env!("CARGO")
        .map(OsStr::new)
        .unwrap_or_else(|| OsStr::new("cargo"));
    let output = Command::new(cargo)
        .arg("check")
        .arg("--quiet")
        .arg("--offline")
        .arg("--manifest-path")
        .arg(project.root.join("Cargo.toml"))
        .env("CARGO_TARGET_DIR", project.root.join("target"))
        .env("CARGO_INCREMENTAL", "0")
        .env("CARGO_TERM_COLOR", "never")
        .output()
        .expect("run Cargo compile assay");

    assert!(
        !output.status.success(),
        "UI fixture {name:?} unexpectedly compiled; the raw safe API remains usable\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr),
    );
}

#[test]
fn raw_span_construction_and_fields_are_not_public() {
    assert_fixture_does_not_compile("span_raw", include_str!("ui/span_raw.rs"));
}

#[test]
fn default_and_mutable_parser_state_invariants_are_not_public() {
    assert_fixture_does_not_compile("parser_state_raw", include_str!("ui/parser_state_raw.rs"));
}

#[test]
fn parser_context_type_is_not_caller_selected() {
    assert_fixture_does_not_compile("context_raw", include_str!("ui/context_raw.rs"));
}

#[test]
fn raw_padded_view_construction_is_not_public() {
    assert_fixture_does_not_compile("padded_view_raw", include_str!("ui/padded_view_raw.rs"));
}
