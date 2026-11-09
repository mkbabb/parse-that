//! The one corpus resolver for parse-that.
//!
//! The corpus is not tracked. Its transport is the release asset named in
//! the in-tree manifest `corpus/MANIFEST.sha256`, and that manifest is its
//! custody. `cargo xtask corpus fetch` downloads the asset, checks its sha256
//! and unpacks it into [`dir()`]; `cargo xtask corpus verify` checks every
//! file against the manifest.
//!
//! Every reader takes the corpus through [`path`] (or [`read`] /
//! [`read_to_string`]) with a path relative to the corpus directory, such as
//! `"json/twitter.json"`.

use std::path::{Path, PathBuf};

/// The environment variable that relocates the corpus directory.
pub const ENV: &str = "PARSE_THAT_CORPUS_DIR";

/// The corpus directory: `$PARSE_THAT_CORPUS_DIR` when set, else `data/` at
/// the repository root.
pub fn dir() -> PathBuf {
    match std::env::var_os(ENV) {
        Some(d) if !d.is_empty() => PathBuf::from(d),
        _ => {
            let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
            // rust/corpus -> the repository root.
            manifest.parent().and_then(Path::parent).unwrap_or(manifest).join("data")
        }
    }
}

/// The path of one corpus file, `rel` being relative to [`dir()`].
pub fn path(rel: &str) -> PathBuf {
    dir().join(rel)
}

/// Reads one corpus file. Panics with the cure when it is absent.
pub fn read(rel: &str) -> Vec<u8> {
    let p = path(rel);
    std::fs::read(&p).unwrap_or_else(|e| panic!("{}", missing(&p, &e)))
}

/// Reads one corpus file as UTF-8. Panics with the cure when it is absent.
pub fn read_to_string(rel: &str) -> String {
    let p = path(rel);
    std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{}", missing(&p, &e)))
}

fn missing(p: &Path, e: &std::io::Error) -> String {
    format!(
        "corpus file {} unreadable ({e}); run `cargo xtask corpus fetch` (custody: corpus/MANIFEST.sha256)",
        p.display()
    )
}
