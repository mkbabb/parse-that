//! Every `pub` item of the audited library crates has a caller.
//!
//! The crates audited here are general libraries that other workspaces
//! build on (sk-v27 LW2.TOPO-1, ruling A-2). A `pub` item that nothing in
//! this workspace calls, and that no doctest calls, is surface nobody
//! exercises: it can rot without a compile error, and it is published as a
//! promise nobody has kept. So every `pub` item of an audited crate needs at
//! least one caller in this workspace:
//!
//! - production code of any workspace member (`src/`, outside
//!   `#[cfg(test)]`), or
//! - a doctest in any workspace member's `src/` (a fenced Rust block in a
//!   doc comment that rustdoc compiles: not `ignore`, not `text`).
//!
//! A `use` re-export is not a caller (it only renames the item), and the
//! declaration itself is not a caller. A `#[proc_macro_derive(Name)]`
//! function is called by `#[derive(Name)]`, so it is looked up by `Name`.
//!
//! Identifiers are matched by name, not by resolved path. Two items that
//! share a name share their callers, which can only over-credit; the
//! falsifier below is an uncalled item with a fresh name.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::str::FromStr;

use syn::visit::Visit;

/// The audited crates, by package name.
const AUDITED: &[&str] = &["parse-that-egraph", "parse-that-egraph-derive"];

#[derive(Debug)]
struct Item {
    name: String,
    kind: &'static str,
    /// A `#[proc_macro_derive]` function, named by its derive.
    derive: bool,
    file: PathBuf,
    line: usize,
}

fn is_cfg_test(attrs: &[syn::Attribute]) -> bool {
    attrs.iter().any(|a| {
        a.path().is_ident("cfg")
            && a.meta
                .require_list()
                .map(|l| l.tokens.to_string().split(|c: char| !c.is_alphanumeric() && c != '_').any(|t| t == "test"))
                .unwrap_or(false)
    })
}

fn derive_name(attrs: &[syn::Attribute]) -> Option<String> {
    attrs.iter().find_map(|a| {
        if !a.path().is_ident("proc_macro_derive") {
            return None;
        }
        let list = a.meta.require_list().ok()?;
        let first = list.tokens.clone().into_iter().next()?;
        Some(first.to_string())
    })
}

/// Collects the `pub` items of one file.
struct PubItems<'a> {
    file: &'a Path,
    out: &'a mut Vec<Item>,
    in_test: bool,
}

impl PubItems<'_> {
    fn push(&mut self, vis: &syn::Visibility, attrs: &[syn::Attribute], ident: &syn::Ident, kind: &'static str) {
        if self.in_test || is_cfg_test(attrs) || !matches!(vis, syn::Visibility::Public(_)) {
            return;
        }
        let derive = derive_name(attrs);
        self.out.push(Item {
            name: derive.clone().unwrap_or_else(|| ident.to_string()),
            kind,
            derive: derive.is_some(),
            file: self.file.to_path_buf(),
            line: ident.span().start().line,
        });
    }
}

impl<'ast> Visit<'ast> for PubItems<'_> {
    fn visit_item_fn(&mut self, n: &'ast syn::ItemFn) {
        self.push(&n.vis, &n.attrs, &n.sig.ident, "fn");
    }
    fn visit_item_struct(&mut self, n: &'ast syn::ItemStruct) {
        self.push(&n.vis, &n.attrs, &n.ident, "struct");
    }
    fn visit_item_enum(&mut self, n: &'ast syn::ItemEnum) {
        self.push(&n.vis, &n.attrs, &n.ident, "enum");
    }
    fn visit_item_union(&mut self, n: &'ast syn::ItemUnion) {
        self.push(&n.vis, &n.attrs, &n.ident, "union");
    }
    fn visit_item_trait(&mut self, n: &'ast syn::ItemTrait) {
        self.push(&n.vis, &n.attrs, &n.ident, "trait");
    }
    fn visit_item_type(&mut self, n: &'ast syn::ItemType) {
        self.push(&n.vis, &n.attrs, &n.ident, "type");
    }
    fn visit_item_const(&mut self, n: &'ast syn::ItemConst) {
        self.push(&n.vis, &n.attrs, &n.ident, "const");
    }
    fn visit_item_static(&mut self, n: &'ast syn::ItemStatic) {
        self.push(&n.vis, &n.attrs, &n.ident, "static");
    }
    fn visit_item_mod(&mut self, n: &'ast syn::ItemMod) {
        let was = self.in_test;
        self.in_test |= is_cfg_test(&n.attrs);
        syn::visit::visit_item_mod(self, n);
        self.in_test = was;
    }
}

/// Counts identifier occurrences in production code and in doctests.
struct Callers<'a> {
    counts: &'a mut HashMap<String, u32>,
    in_test: bool,
    /// The file's doc comments, in source order (one `///` or `//!` line
    /// is one attribute, so fences are read over the whole sequence).
    doc: String,
}

impl Callers<'_> {
    fn count_tokens(&mut self, tokens: proc_macro2::TokenStream) {
        for tt in tokens {
            match tt {
                proc_macro2::TokenTree::Ident(i) => *self.counts.entry(i.to_string()).or_default() += 1,
                proc_macro2::TokenTree::Group(g) => self.count_tokens(g.stream()),
                _ => {}
            }
        }
    }

    /// Doctests: fenced blocks in `///` and `//!` comments that rustdoc
    /// compiles.
    fn count_doctests(&mut self) {
        let doc = std::mem::take(&mut self.doc);
        // `None` outside a fence; `Some(None)` inside a fence rustdoc does
        // not compile; `Some(Some(code))` inside one it compiles.
        let mut fence: Option<Option<String>> = None;
        for line in doc.lines() {
            let t = line.trim_start();
            if let Some(info) = t.strip_prefix("```") {
                match fence.take() {
                    Some(Some(code)) => {
                        if let Ok(ts) = proc_macro2::TokenStream::from_str(&code) {
                            self.count_tokens(ts);
                        }
                    }
                    Some(None) => {}
                    None => fence = Some(compiled_by_rustdoc(info).then(String::new)),
                }
            } else if let Some(Some(code)) = fence.as_mut() {
                // rustdoc hides `# ` lines but still compiles them.
                code.push_str(t.strip_prefix("# ").unwrap_or(t));
                code.push('\n');
            }
        }
    }
}

/// rustdoc compiles a fence whose info string is empty or names only Rust
/// attributes (`rust`, `no_run`, `should_panic`, `editionN`). `ignore`,
/// `compile_fail` (which must not compile, so calls nothing) and any other
/// language are not callers.
fn compiled_by_rustdoc(info: &str) -> bool {
    info.split(',')
        .map(str::trim)
        .filter(|t| !t.is_empty())
        .all(|t| matches!(t, "rust" | "no_run" | "should_panic") || t.starts_with("edition"))
}

impl<'ast> Visit<'ast> for Callers<'_> {
    fn visit_attribute(&mut self, a: &'ast syn::Attribute) {
        if let syn::Meta::NameValue(nv) = &a.meta
            && nv.path.is_ident("doc")
            && let syn::Expr::Lit(syn::ExprLit { lit: syn::Lit::Str(s), .. }) = &nv.value
        {
            self.doc.push_str(&s.value());
            self.doc.push('\n');
        }
    }
    fn visit_ident(&mut self, i: &'ast proc_macro2::Ident) {
        if !self.in_test {
            *self.counts.entry(i.to_string()).or_default() += 1;
        }
    }
    fn visit_item_use(&mut self, n: &'ast syn::ItemUse) {
        // A re-export renames an item; it does not call it.
        for a in &n.attrs {
            self.visit_attribute(a);
        }
    }
    fn visit_macro(&mut self, m: &'ast syn::Macro) {
        syn::visit::visit_macro(self, m);
        if !self.in_test {
            self.count_tokens(m.tokens.clone());
        }
    }
    fn visit_item_mod(&mut self, n: &'ast syn::ItemMod) {
        let was = self.in_test;
        self.in_test |= is_cfg_test(&n.attrs);
        syn::visit::visit_item_mod(self, n);
        self.in_test = was;
    }
    fn visit_item_fn(&mut self, n: &'ast syn::ItemFn) {
        let was = self.in_test;
        self.in_test |= is_cfg_test(&n.attrs);
        syn::visit::visit_item_fn(self, n);
        self.in_test = was;
    }
}

fn rs_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for e in entries.flatten() {
        let p = e.path();
        if p.is_dir() {
            rs_files(&p, out);
        } else if p.extension().is_some_and(|x| x == "rs") {
            out.push(p);
        }
    }
}

fn parse(path: &Path) -> syn::File {
    let src = std::fs::read_to_string(path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
    syn::parse_file(&src).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()))
}

/// Items of `audited` (source dirs) with no caller in `members` (source dirs).
fn uncalled(audited: &[PathBuf], members: &[PathBuf]) -> Vec<Item> {
    let mut items = Vec::new();
    for dir in audited {
        let mut files = Vec::new();
        rs_files(dir, &mut files);
        for f in files {
            PubItems { file: &f, out: &mut items, in_test: false }.visit_file(&parse(&f));
        }
    }
    let mut counts = HashMap::new();
    for dir in members {
        let mut files = Vec::new();
        rs_files(dir, &mut files);
        for f in files {
            let mut callers = Callers { counts: &mut counts, in_test: false, doc: String::new() };
            callers.visit_file(&parse(&f));
            callers.count_doctests();
        }
    }
    // Each declaration writes its name once, except a derive, whose name
    // is written only inside `#[proc_macro_derive(..)]` (attribute tokens
    // are not counted). An item is called when its name occurs more often
    // than it is declared.
    let mut decls: HashMap<String, u32> = HashMap::new();
    for i in items.iter().filter(|i| !i.derive) {
        *decls.entry(i.name.clone()).or_default() += 1;
    }
    items
        .into_iter()
        .filter(|i| counts.get(&i.name).copied().unwrap_or(0) <= decls.get(&i.name).copied().unwrap_or(0))
        .collect()
}

fn workspace() -> (Vec<PathBuf>, Vec<PathBuf>) {
    let meta = cargo_metadata::MetadataCommand::new()
        .manifest_path(Path::new(env!("CARGO_MANIFEST_DIR")).join("../Cargo.toml"))
        .no_deps()
        .exec()
        .expect("cargo metadata --no-deps");
    let mut audited = Vec::new();
    let mut members = Vec::new();
    for p in meta.workspace_packages() {
        let src: PathBuf = p.manifest_path.parent().expect("manifest dir").join("src").into();
        if !src.is_dir() {
            continue;
        }
        if AUDITED.contains(&p.name.as_str()) {
            audited.push(src.clone());
        }
        members.push(src);
    }
    assert_eq!(audited.len(), AUDITED.len(), "every audited crate is a workspace member: {audited:?}");
    (audited, members)
}

#[test]
fn every_pub_item_of_the_audited_crates_has_a_caller() {
    let (audited, members) = workspace();
    let missing = uncalled(&audited, &members);
    assert!(
        missing.is_empty(),
        "pub items with no caller in this workspace (production code or a compiled doctest):\n{}",
        missing
            .iter()
            .map(|i| format!("  {} {} at {}:{}", i.kind, i.name, i.file.display(), i.line))
            .collect::<Vec<_>>()
            .join("\n")
    );
}
