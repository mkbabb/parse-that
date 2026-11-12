//! sk-v27 LW3.PERF-1a: our own stage-1 structural indexer.
//!
//! The three falsifiers of the order come first: a `{` inside a CSS
//! comment is not structural; atom starts (pseudo-structural positions)
//! are in the index; invalid UTF-8 is refused in the same pass. Then every
//! tier the host can run is held to the scalar oracle
//! (`scalar::stage1`) on the corpus, on exhaustive UTF-8 sweeps across
//! block boundaries, on padding garbage, at a guard page, and under
//! proptest fuzz; the arch-neutral resolver is held to it through the
//! bytewise `stage1::portable` hook on every host and under Miri.

use parse_that_simd::{
    CommentClass, PADDING, PaddedInput, PaddedSlice, Stage1Error, Stage1Index, Stage1Spec,
    StructuralAlphabet, Tier, compiled_tiers, scalar, scan_structural, stage1, stage1_with,
};
use proptest::prelude::*;

const WS: &[u8] = b" \t\n\r";

const JSON: Stage1Spec =
    Stage1Spec::new(StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\""), WS, &[]);

/// CSS with its block comment; no digraphs in the alphabet.
const CSS: Stage1Spec = Stage1Spec::new(
    StructuralAlphabet::from_parts(b"{}();:,", &[], b"\"'"),
    b" \t\n\r\x0c",
    &[CommentClass::new(b"/*", b"*/")],
);

/// CSS whose alphabet also names `/*` and `*/` as digraphs (the shape
/// `scan_structural`'s CSS callers use).
const CSS_DIGRAPHS: Stage1Spec = Stage1Spec::new(
    StructuralAlphabet::from_parts(b"{}();:,", &[(b'/', b'*'), (b'*', b'/')], b"\"'"),
    b" \t\n\r\x0c",
    &[CommentClass::new(b"/*", b"*/")],
);

/// Newline-significant, with a line comment that keeps its newline.
const LINES: Stage1Spec = Stage1Spec::new(
    StructuralAlphabet::from_parts(b"=[]{},\n", &[], b"\"'"),
    b" \t",
    &[CommentClass::line(b"#", b"\n")],
);

/// Everything at once: three quote classes, two digraphs, four comment
/// classes (one-byte and two-byte openers and closers, one kept).
const DENSE: Stage1Spec = Stage1Spec::new(
    StructuralAlphabet::from_parts(b"{}();:,=", &[(b'-', b'>'), (b'=', b'>')], b"\"'`"),
    b" \t\n\r",
    &[
        CommentClass::new(b"/*", b"*/"),
        CommentClass::line(b"//", b"\n"),
        CommentClass::new(b"<", b">"),
        CommentClass::new(b"%", b"%%"),
    ],
);

/// Wide-LUT (9..=16 singletons) and multi-compare (> 16) shapes.
const WIDE: Stage1Spec = Stage1Spec::new(
    StructuralAlphabet::from_parts(b"{}();:,=|<>[]?", &[(b'-', b'>')], b"\""),
    WS,
    &[CommentClass::new(b"/*", b"*/")],
);
const MULTI: Stage1Spec = Stage1Spec::new(
    StructuralAlphabet::from_parts(b"{}();:,=|<>[]?!@$^&~", &[], b"\"'"),
    WS,
    &[CommentClass::line(b"#", b"\n")],
);
const NO_QUOTES: Stage1Spec =
    Stage1Spec::new(StructuralAlphabet::from_parts(b"abc", &[], &[]), WS, &[]);

const SPECS: [(&str, &Stage1Spec); 8] = [
    ("json", &JSON),
    ("css", &CSS),
    ("css-digraphs", &CSS_DIGRAPHS),
    ("lines", &LINES),
    ("dense", &DENSE),
    ("wide", &WIDE),
    ("multi", &MULTI),
    ("no-quotes", &NO_QUOTES),
];

fn cases() -> u32 {
    std::env::var("PARSE_THAT_FUZZ_CASES")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(if cfg!(miri) { 2 } else { 128 })
}

fn runnable() -> Vec<Tier> {
    compiled_tiers().into_iter().filter(|t| t.is_supported()).collect()
}

fn run(bytes: &[u8], spec: &Stage1Spec) -> Result<Stage1Index, Stage1Error> {
    stage1(PaddedInput::from_slice(bytes).as_padded(), spec)
}

fn atoms(ix: &Stage1Index) -> Vec<u32> {
    ix.atom_positions().collect()
}

fn structurals(ix: &Stage1Index) -> Vec<u32> {
    ix.structural_positions().collect()
}

/// Every runnable tier and the portable resolver equal the oracle on
/// `bytes`, placed in a buffer whose padding is `pad`.
fn assert_tiers_match(bytes: &[u8], spec: &Stage1Spec, pad: u8, ctx: &str) {
    let want = scalar::stage1(bytes, spec);
    let mut buf = bytes.to_vec();
    buf.resize(bytes.len() + PADDING, pad);
    let input = PaddedSlice::new(&buf, bytes.len()).unwrap();
    for tier in runnable() {
        let got = stage1_with(tier, input, spec).unwrap();
        assert_eq!(got, want, "{ctx}: tier {} differs from the oracle", tier.name());
    }
    assert_eq!(
        parse_that_simd::stage1::portable(input, spec),
        want,
        "{ctx}: the portable resolver differs from the oracle"
    );
}

// ─────────────────────── the order's three falsifiers ───────────────────────

/// RED reason 1: a CSS `{` inside a comment is not structural.
#[test]
fn css_brace_inside_a_comment_is_not_structural() {
    let input = b"a{b:c}/*x{y}*/d{}";
    let ix = run(input, &CSS).unwrap();
    assert_eq!(structurals(&ix), [1, 3, 5, 15, 16], "the `{{` and `}}` at 9 and 11 are comment");
    let ix = run(input, &CSS_DIGRAPHS).unwrap();
    // `/*` at 6 is a digraph of the alphabet and opens the comment; the
    // `*/` at 12 is inside it.
    assert_eq!(structurals(&ix), [1, 3, 5, 6, 15, 16]);
    // A comment opener inside a string is content, and a quote inside a
    // comment is content.
    let ix = run(b"\"/*\"{/*\"*/}", &CSS).unwrap();
    assert_eq!(structurals(&ix), [4, 10]);
    // Across a block boundary: the comment opens at 62 and closes at 130.
    let mut long = vec![b' '; 62];
    long.extend_from_slice(b"/*");
    long.extend(std::iter::repeat_n(b'{', 66));
    long.extend_from_slice(b"*/}");
    let ix = run(&long, &CSS).unwrap();
    assert_eq!(structurals(&ix), [132]);
}

/// RED reason 2: atom starts (the pseudo-structural positions) are in the
/// index, merged in order with the structural bytes.
#[test]
fn atom_starts_are_in_the_index() {
    let input = br#"{"a": 1, "b": [true, null]}"#;
    let ix = run(input, &JSON).unwrap();
    assert_eq!(ix.index.positions, [0, 1, 4, 6, 7, 9, 12, 14, 15, 19, 21, 25, 26]);
    assert_eq!(ix.index.kinds, b"{\":1,\":[t,n]}");
    assert_eq!(atoms(&ix), [1, 6, 9, 15, 21]);
    assert_eq!(structurals(&ix), [0, 4, 7, 12, 14, 19, 25, 26]);
    // CSS: names after a comment and the comment's opener itself.
    let ix = run(b"a{b:c}/*x{y}*/d{}", &CSS).unwrap();
    assert_eq!(atoms(&ix), [0, 2, 4, 14]);
    // A line comment keeps its newline outside: the newline is structural.
    let ix = run(b"a=1#{x}\nb=2", &LINES).unwrap();
    assert_eq!(ix.index.positions, [0, 1, 2, 7, 8, 9, 10]);
    assert_eq!(ix.index.kinds, b"a=1\nb=2");
    assert_eq!(atoms(&ix), [0, 2, 8, 10]);
    // The second byte of a structural digraph starts no atom.
    let ix = run(b"f->g", &DENSE).unwrap();
    assert_eq!(structurals(&ix), [1]);
    assert_eq!(atoms(&ix), [0, 3]);
}

/// RED reason 3: an input that is not UTF-8 is refused, at std's
/// `valid_up_to`, by the same pass.
#[test]
fn invalid_utf8_is_refused() {
    for bad in [
        &b"{\"a\": \"\xff\"}"[..],
        b"\xc0\x80",
        b"abc\xed\xa0\x80",
        b"\xf4\x90\x80\x80",
        b"tail lead \xe2\x82",
        b"\x80",
    ] {
        let want = std::str::from_utf8(bad).unwrap_err().valid_up_to();
        assert_eq!(
            run(bad, &JSON),
            Err(Stage1Error::InvalidUtf8 { valid_up_to: want }),
            "{bad:?}"
        );
    }
    let ok = "{\"caf\u{e9}\": \"\u{1F600}\"}";
    assert!(run(ok.as_bytes(), &JSON).is_ok());
}

// ───────────────────────────── the oracle ─────────────────────────────

/// With no comment classes, the oracle's structural slots are exactly
/// `scan_structural`'s index.
#[test]
fn oracle_structurals_equal_scan_structural_without_comments() {
    let input = br#"{"k\"ey": [1, "a,b", {"c": "\\"}], "x": 'y'}"#;
    for alphabet in [
        StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\""),
        StructuralAlphabet::from_parts(b"{}[]:,", &[(b'[', b'1')], b"\"'"),
    ] {
        let spec = Stage1Spec::new(alphabet, WS, &[]);
        let ix = scalar::stage1(input, &spec).unwrap();
        let old = scan_structural(input, &alphabet);
        assert_eq!(structurals(&ix), old.positions);
    }
}

#[test]
fn oracle_edge_cases() {
    // An escaped quote outside a string opens nothing.
    let ix = scalar::stage1(br#"\"a,b"#, &JSON).unwrap();
    assert_eq!(structurals(&ix), [3]);
    // `/*/` is not a closed comment: the closer must start after the opener.
    let ix = scalar::stage1(b"/*/{*/{", &CSS).unwrap();
    assert_eq!(structurals(&ix), [6]);
    // An unterminated comment or string runs to the end.
    assert_eq!(structurals(&scalar::stage1(b"{/*{", &CSS).unwrap()), [0]);
    assert_eq!(structurals(&scalar::stage1(b"{\"{", &JSON).unwrap()), [0]);
    // A two-byte closer split by the end of input does not close.
    assert_eq!(structurals(&scalar::stage1(b"%a%{", &DENSE).unwrap()), Vec::<u32>::new());
    // Empty input.
    assert!(scalar::stage1(b"", &JSON).unwrap().is_empty());
    assert!(run(b"", &DENSE).unwrap().is_empty());
}

// ───────────────────────── tiers against the oracle ─────────────────────────

#[test]
fn every_tier_on_hand_witnesses() {
    let witnesses: [&[u8]; 8] = [
        b"",
        b"a{b:c}/*x{y}*/d{}",
        br#"{"a": 1, "b": [true, null]}"#,
        b"a=1#{x}\nb=2\n# t\n[s]\nk = \"v#\" # c",
        b"f->g => h // c\n<x{> %y%{%%z 'q' `r` \"s\\\"\"",
        "caf\u{e9} \u{1F600} {\u{2603}}".as_bytes(),
        b"\\\\\\\"\"{\\\"}",
        b"/*/{*/{%a%{",
    ];
    for w in witnesses {
        for (name, spec) in SPECS {
            for pad in [0x00, 0xFF, b'*'] {
                assert_tiers_match(w, spec, pad, &format!("{name} {w:?}"));
            }
        }
    }
}

/// Every length from 0 to 3 blocks + 1 of a dense pattern, so each
/// construct meets each block boundary.
#[test]
fn every_tier_every_length_and_boundary() {
    let pattern: &[u8] = b"{\"a\\\"b\": [1, /*x{*/ 'y' # z\n f->g //w\n <h> %i%% `j`]}\t";
    let max = if cfg!(miri) { 70 } else { 3 * 64 + 1 };
    let stream: Vec<u8> = pattern.iter().copied().cycle().take(max + 64).collect();
    for len in 0..=max {
        for shift in [0usize, 1, 13, 31, 63] {
            if cfg!(miri) && shift != 0 {
                continue;
            }
            let bytes = &stream[shift..shift + len];
            for (name, spec) in SPECS {
                assert_tiers_match(bytes, spec, 0xA5, &format!("{name} len {len} shift {shift}"));
            }
        }
    }
}

#[test]
fn every_tier_on_the_corpus() {
    if cfg!(miri) {
        return;
    }
    let json = ["json/twitter.json", "json/citm_catalog.json", "json/canada.json"];
    let css = ["css/bootstrap.css", "css/tailwind-output.css"];
    for rel in json {
        let bytes = parse_that_corpus::read(rel);
        assert_tiers_match(&bytes, &JSON, 0xFF, rel);
        assert_tiers_match(&bytes, &DENSE, 0x00, rel);
        let ix = scalar::stage1(&bytes, &JSON).unwrap();
        assert!(atoms(&ix).len() > 1000, "{rel}: atom starts are indexed");
    }
    for rel in css {
        let bytes = parse_that_corpus::read(rel);
        assert_tiers_match(&bytes, &CSS, 0xFF, rel);
        assert_tiers_match(&bytes, &CSS_DIGRAPHS, b'/', rel);
        assert_tiers_match(&bytes, &WIDE, 0x00, rel);
    }
}

/// UTF-8: every one- and two-byte sequence and every three- and four-byte
/// sequence over the boundary bytes of each range, at offsets that put
/// it across a block boundary, behind ASCII and behind multi-byte text.
#[test]
fn every_tier_utf8_sweep() {
    let edges: [u8; 14] = [0x00, 0x41, 0x7F, 0x80, 0x8F, 0x90, 0x9F, 0xA0, 0xBF, 0xC0, 0xC2, 0xE0, 0xF0, 0xFF];
    let mut seqs: Vec<Vec<u8>> = Vec::new();
    if cfg!(miri) {
        for s in [&b"\xc3\xa9"[..], b"\xc3", b"\xe2\x82\xac", b"\xe2\x82", b"\xed\xa0\x80", b"\xf0\x9f\x98\x80", b"\xf4\x90\x80\x80", b"\x80", b"\xff"] {
            seqs.push(s.to_vec());
        }
    } else {
        for a in 0u8..=255 {
            seqs.push(vec![a]);
            for b in 0u8..=255 {
                seqs.push(vec![a, b]);
            }
            if a >= 0xC0 {
                for &b in &edges {
                    for &c in &edges {
                        seqs.push(vec![a, b, c]);
                        if a >= 0xF0 {
                            for &d in &edges {
                                seqs.push(vec![a, b, c, d]);
                            }
                        }
                    }
                }
            }
        }
    }
    let offsets: &[usize] = if cfg!(miri) { &[0, 62] } else { &[0, 15, 62, 63] };
    let prefixes: [&[u8]; 2] = [b"", "\u{e9}\u{2603}".as_bytes()];
    for s in &seqs {
        for &off in offsets {
            for prefix in prefixes {
                let mut bytes = vec![b'a'; off];
                let start = off.saturating_sub(prefix.len());
                bytes[start..start + prefix.len().min(off)].copy_from_slice(&prefix[..prefix.len().min(off)]);
                bytes.extend_from_slice(s);
                bytes.extend_from_slice(b"\"x\"");
                let want = std::str::from_utf8(&bytes).err().map(|e| e.valid_up_to());
                let got = scalar::stage1(&bytes, &JSON).err();
                assert_eq!(
                    got,
                    want.map(|v| Stage1Error::InvalidUtf8 { valid_up_to: v }),
                    "oracle {bytes:x?}"
                );
                let mut buf = bytes.clone();
                buf.resize(bytes.len() + PADDING, 0xF0);
                let input = PaddedSlice::new(&buf, bytes.len()).unwrap();
                let oracle = scalar::stage1(&bytes, &JSON);
                for tier in runnable() {
                    let got = stage1_with(tier, input, &JSON).unwrap();
                    assert_eq!(got, oracle, "tier {} {bytes:x?}", tier.name());
                }
            }
        }
    }
}

/// An input whose padding ends at a `PROT_NONE` page is read by no tier
/// past its padding, whatever the padding holds.
#[cfg(all(unix, not(miri)))]
#[test]
fn no_tier_reads_past_the_padding() {
    struct Guarded {
        base: *mut u8,
        page: usize,
    }
    impl Drop for Guarded {
        fn drop(&mut self) {
            // SAFETY: the mapping made below.
            unsafe { libc::munmap(self.base.cast(), 2 * self.page) };
        }
    }
    // SAFETY: an anonymous two-page mapping, the second page inaccessible.
    let g = unsafe {
        let page = libc::sysconf(libc::_SC_PAGESIZE) as usize;
        let base = libc::mmap(
            std::ptr::null_mut(),
            2 * page,
            libc::PROT_READ | libc::PROT_WRITE,
            libc::MAP_PRIVATE | libc::MAP_ANON,
            -1,
            0,
        );
        assert_ne!(base, libc::MAP_FAILED);
        assert_eq!(libc::mprotect((base as *mut u8).add(page).cast(), page, libc::PROT_NONE), 0);
        Guarded { base: base.cast(), page }
    };
    let pattern: &[u8] = b"{\"a\": [1, /*x*/ 'y'], b->c # d\n %e%% }";
    for len in 0..=4 * 64 + 1 {
        for pad in [0x00u8, b'/', b'*', b'"', 0xF0] {
            let total = len + PADDING;
            // SAFETY: `total <= page`; the buffer lies in the RW page and its
            // padding ends exactly at the guard page.
            let buf = unsafe {
                let dst = g.base.add(g.page - total);
                for k in 0..len {
                    *dst.add(k) = pattern[k % pattern.len()];
                }
                std::ptr::write_bytes(dst.add(len), pad, PADDING);
                std::slice::from_raw_parts(dst, total)
            };
            let input = PaddedSlice::new(buf, len).unwrap();
            for (name, spec) in SPECS {
                let want = scalar::stage1(input.bytes(), spec);
                for tier in runnable() {
                    assert_eq!(
                        stage1_with(tier, input, spec).unwrap(),
                        want,
                        "{name} tier {} len {len} pad {pad:#x}",
                        tier.name()
                    );
                }
            }
        }
    }
}

#[test]
fn unsupported_tier_reports_none() {
    let input = PaddedInput::from_slice(b"{}");
    for tier in Tier::PREFERENCE {
        if !tier.is_supported() {
            assert!(stage1_with(tier, input.as_padded(), &JSON).is_none());
        }
    }
}

#[test]
fn padded_input_contract() {
    let p = PaddedInput::from_slice(b"abc");
    assert_eq!(p.as_bytes(), b"abc");
    assert_eq!(p.as_bytes().as_ptr() as usize % 64, 0, "owned input is 64-aligned");
    assert!(p.as_padded().padded_len() >= 3 + PADDING);
    let buf = [0u8; 70];
    assert!(PaddedSlice::new(&buf, 6).is_some());
    assert!(PaddedSlice::new(&buf, 7).is_none());
    assert!(PaddedSlice::new(&buf, usize::MAX).is_none());
}

// ─────────────────────────────── fuzz ───────────────────────────────

fn byte_soup() -> impl Strategy<Value = Vec<u8>> {
    proptest::collection::vec(
        prop_oneof![
            4 => prop::sample::select(b"{}[]();:,=\"'`\\/*#%<>-\n \t".to_vec()),
            2 => b'a'..=b'z',
            1 => prop::sample::select(vec![0xC3u8, 0xA9, 0xE2, 0x98, 0x83, 0xF0, 0x9F, 0x98, 0x80]),
            1 => any::<u8>(),
        ],
        0..700,
    )
}

/// Valid UTF-8 text built from code points, so the structural paths are
/// fuzzed past the UTF-8 gate too.
fn text_soup() -> impl Strategy<Value = Vec<u8>> {
    proptest::collection::vec(
        prop_oneof![
            6 => prop::sample::select("{}[]();:,=\"'`\\/*#%<>-\n \tab01".chars().collect::<Vec<_>>()),
            1 => any::<char>(),
        ],
        0..700,
    )
    .prop_map(|cs| cs.into_iter().collect::<String>().into_bytes())
}

proptest! {
    #![proptest_config(ProptestConfig {
        cases: cases(),
        failure_persistence: None,
        ..ProptestConfig::default()
    })]

    #[test]
    fn fuzz_bytes_every_tier_every_spec(bytes in byte_soup(), pad in any::<u8>()) {
        for (name, spec) in SPECS {
            assert_tiers_match(&bytes, spec, pad, name);
        }
    }

    #[test]
    fn fuzz_text_every_tier_every_spec(bytes in text_soup(), pad in any::<u8>()) {
        for (name, spec) in SPECS {
            assert_tiers_match(&bytes, spec, pad, name);
        }
    }

    #[test]
    fn fuzz_raw_bytes_json(bytes in proptest::collection::vec(any::<u8>(), 0..2048)) {
        assert_tiers_match(&bytes, &JSON, 0, "json raw");
    }
}
