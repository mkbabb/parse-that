//! `cargo xtask corpus fetch|verify|pack|dir` — corpus custody for parse-that.
//!
//! The corpus that tests, benches and examples read is not tracked. Its
//! transport is the versioned GitHub release asset named in
//! `corpus/MANIFEST.sha256`, fetched over public HTTPS with no token; its
//! custody is that in-tree manifest. Every reader resolves the corpus through
//! `parse_that_corpus::path`, and this tool writes and checks the same
//! directory (`parse_that_corpus::dir()`).
//!
//! Manifest format (`shasum -a 256` lines; `#` starts a comment):
//! - exactly one asset line, whose name has no `/`: `<sha256>  corpus-vN.tar.gz`;
//!   the release tag is the name without `.tar.gz`;
//! - one line per corpus file, relative to the corpus directory:
//!   `<sha256>  json/twitter.json`.

use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode};

use sha2::{Digest, Sha256};

/// The GitHub repository whose releases carry the asset.
const REPO: &str = "mkbabb/parse-that";

type Result<T> = std::result::Result<T, String>;

const USAGE: &str = "usage: cargo xtask corpus <fetch [--asset <file>] | verify | pack --out <file> | dir>";

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let args: Vec<&str> = args.iter().map(String::as_str).collect();
    let root = repo_root();
    let r = match args.as_slice() {
        ["corpus", "fetch"] => fetch(&root, None),
        ["corpus", "fetch", "--asset", p] => fetch(&root, Some(Path::new(p))),
        ["corpus", "verify"] => verify(&root),
        ["corpus", "pack", "--out", p] => pack(&root, Path::new(p)),
        ["corpus", "dir"] => {
            println!("{}", parse_that_corpus::dir().display());
            Ok(())
        }
        _ => Err(USAGE.to_string()),
    };
    match r {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("error: {e}");
            ExitCode::FAILURE
        }
    }
}

/// rust/xtask -> the repository root.
fn repo_root() -> PathBuf {
    let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
    manifest.parent().and_then(Path::parent).unwrap_or(manifest).to_path_buf()
}

/// The parsed in-tree manifest.
struct Manifest {
    /// `(sha256, name)` of the release asset.
    asset: (String, String),
    /// `(sha256, path relative to the corpus directory)`, in manifest order.
    files: Vec<(String, String)>,
}

impl Manifest {
    fn path(root: &Path) -> PathBuf {
        root.join("corpus/MANIFEST.sha256")
    }

    fn load(root: &Path) -> Result<Self> {
        let p = Self::path(root);
        let text = fs::read_to_string(&p).map_err(|e| format!("read {}: {e}", p.display()))?;
        Self::parse(&text)
    }

    fn parse(text: &str) -> Result<Self> {
        let mut asset = None;
        let mut files = Vec::new();
        for (n, line) in text.lines().enumerate() {
            let n = n + 1;
            let line = line.trim_end();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            let (hash, name) = line
                .split_once("  ")
                .ok_or_else(|| format!("manifest line {n}: expected `<sha256>  <path>`"))?;
            if hash.len() != 64 || !hash.bytes().all(|b| b.is_ascii_hexdigit()) {
                return Err(format!("manifest line {n}: `{hash}` is not a sha256"));
            }
            if name.starts_with('/') || name.split('/').any(|c| c == ".." || c.is_empty()) {
                return Err(format!("manifest line {n}: `{name}` must be a plain relative path"));
            }
            if name.contains('/') {
                files.push((hash.to_string(), name.to_string()));
            } else if asset.is_some() {
                return Err(format!("manifest line {n}: a second asset line `{name}`"));
            } else {
                asset = Some((hash.to_string(), name.to_string()));
            }
        }
        let asset = asset.ok_or("manifest names no release asset")?;
        if !asset.1.ends_with(".tar.gz") {
            return Err(format!("asset `{}` is not a .tar.gz", asset.1));
        }
        if files.is_empty() {
            return Err("manifest names no corpus file".into());
        }
        Ok(Self { asset, files })
    }

    fn tag(&self) -> &str {
        self.asset.1.trim_end_matches(".tar.gz")
    }

    fn url(&self) -> String {
        format!("https://github.com/{REPO}/releases/download/{}/{}", self.tag(), self.asset.1)
    }
}

fn sha256_file(p: &Path) -> std::io::Result<String> {
    let mut f = fs::File::open(p)?;
    let mut h = Sha256::new();
    let mut buf = vec![0u8; 1 << 20];
    loop {
        let n = f.read(&mut buf)?;
        if n == 0 {
            break;
        }
        h.update(&buf[..n]);
    }
    Ok(format!("{:x}", h.finalize()))
}

/// Checks every manifest file in `dir`. Returns the failures.
fn check(m: &Manifest, dir: &Path) -> Vec<String> {
    let mut bad = Vec::new();
    for (want, rel) in &m.files {
        match sha256_file(&dir.join(rel)) {
            Ok(got) if &got == want => {}
            Ok(got) => bad.push(format!("{rel}: sha256 {got} != manifest {want}")),
            Err(e) => bad.push(format!("{rel}: absent ({e})")),
        }
    }
    bad
}

fn report(bad: &[String]) {
    for b in bad {
        eprintln!("  {b}");
    }
}

fn run(cmd: &mut Command) -> Result<()> {
    let st = cmd.status().map_err(|e| format!("spawn {cmd:?}: {e}"))?;
    if st.success() { Ok(()) } else { Err(format!("{cmd:?} failed ({st})")) }
}

/// `cargo xtask corpus verify`.
fn verify(root: &Path) -> Result<()> {
    let m = Manifest::load(root)?;
    let dir = parse_that_corpus::dir();
    let bad = check(&m, &dir);
    if !bad.is_empty() {
        report(&bad);
        return Err(format!(
            "corpus verify: {} of {} files fail against {} in {}; run `cargo xtask corpus fetch`",
            bad.len(),
            m.files.len(),
            Manifest::path(root).display(),
            dir.display()
        ));
    }
    println!("corpus verify: {}/{} files match ({})", m.files.len(), m.files.len(), m.tag());
    Ok(())
}

/// `cargo xtask corpus fetch [--asset <file>]`. With `--asset`, the asset is
/// read from a local file instead of the release URL. The asset's sha256 is
/// checked before anything is unpacked, and every file is checked after.
fn fetch(root: &Path, local: Option<&Path>) -> Result<()> {
    let m = Manifest::load(root)?;
    let dir = parse_that_corpus::dir();
    if local.is_none() && check(&m, &dir).is_empty() {
        println!("corpus fetch: {} already verified in {}", m.tag(), dir.display());
        return Ok(());
    }
    fs::create_dir_all(&dir).map_err(|e| format!("create {}: {e}", dir.display()))?;
    let download = dir.join(format!(".{}.part", m.asset.1));
    let asset = match local {
        Some(p) => p.to_path_buf(),
        None => {
            let url = m.url();
            println!("corpus fetch: {url}");
            run(Command::new("curl").args(["-fsSL", "--retry", "3", "-o"]).arg(&download).arg(&url))?;
            download.clone()
        }
    };
    let got = sha256_file(&asset).map_err(|e| format!("read {}: {e}", asset.display()))?;
    if got != m.asset.0 {
        let _ = fs::remove_file(&download);
        return Err(format!(
            "corpus fetch: asset {} sha256 {got} != manifest {}; refused, nothing unpacked",
            asset.display(),
            m.asset.0
        ));
    }
    let unpacked = run(Command::new("tar").arg("-xzf").arg(&asset).arg("-C").arg(&dir));
    let _ = fs::remove_file(&download);
    unpacked?;
    let bad = check(&m, &dir);
    if !bad.is_empty() {
        report(&bad);
        return Err(format!("corpus fetch: {} files fail after unpacking {}", bad.len(), m.asset.1));
    }
    println!("corpus fetch: {} files verified in {}", m.files.len(), dir.display());
    Ok(())
}

/// `cargo xtask corpus pack --out <file>`: the maintainer's verb for cutting a
/// new asset (bsdtar, as on macOS). Every manifest file must already verify;
/// the archive holds exactly those files, in manifest order, with a neutral
/// owner and no gzip timestamp. The printed sha256 goes on the manifest's
/// asset line.
fn pack(root: &Path, out: &Path) -> Result<()> {
    let m = Manifest::load(root)?;
    let dir = parse_that_corpus::dir();
    let bad = check(&m, &dir);
    if !bad.is_empty() {
        report(&bad);
        return Err("corpus pack: the corpus does not verify".into());
    }
    run(Command::new("tar")
        .env("COPYFILE_DISABLE", "1")
        .args(["--format", "ustar", "--uid", "0", "--gid", "0", "--uname", "", "--gname", ""])
        .args(["--options", "gzip:!timestamp"])
        .arg("-czf")
        .arg(out)
        .arg("-C")
        .arg(&dir)
        .args(m.files.iter().map(|(_, rel)| rel.as_str())))?;
    let h = sha256_file(out).map_err(|e| format!("read {}: {e}", out.display()))?;
    println!("{h}  {}", out.file_name().map(|n| n.to_string_lossy()).unwrap_or_default());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::Manifest;

    #[test]
    fn manifest_needs_one_asset_and_plain_paths() {
        let h = "0".repeat(64);
        assert!(Manifest::parse(&format!("{h}  corpus-v1.tar.gz\n{h}  json/a.json\n")).is_ok());
        assert!(Manifest::parse(&format!("{h}  json/a.json\n")).is_err());
        assert!(Manifest::parse(&format!("{h}  corpus-v1.tar.gz\n{h}  ../a.json\n")).is_err());
        assert!(Manifest::parse(&format!("{h}  a.tar.gz\n{h}  b.tar.gz\n{h}  j/a\n")).is_err());
    }
}
