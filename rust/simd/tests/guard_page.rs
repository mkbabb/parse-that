//! No kernel reads past the end of its input.
//!
//! Each input is placed so its last byte is the last byte of a mapped
//! page and the next page is `PROT_NONE`: a one-byte overread faults
//! (SIGSEGV/SIGBUS) instead of silently reading a neighbour's memory.
//! Lengths are the stripe (64) and chunk (16, 32) multiples where a
//! kernel's main loop ends exactly at the input's end, plus their
//! neighbours. Digraph-bearing alphabets are the case at risk: the
//! shifted second-byte compare loads `ptr + 1 .. ptr + W + 1`.
#![cfg(all(unix, not(miri)))] // Miri has no mprotect; it checks bounds itself.

use parse_that_simd::{StructuralAlphabet, compiled_tiers, scalar, scan_with};

const CSS: StructuralAlphabet =
    StructuralAlphabet::from_parts(b"{}();:,", &[(b'/', b'*'), (b'*', b'/')], b"\"'");
const JSON: StructuralAlphabet = StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\"");

struct Guarded {
    base: *mut u8,
    page: usize,
}

impl Guarded {
    fn new() -> Self {
        // SAFETY: plain anonymous mapping of two pages; the second is
        // made inaccessible. Unmapped in Drop.
        unsafe {
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
            let rc = libc::mprotect((base as *mut u8).add(page).cast(), page, libc::PROT_NONE);
            assert_eq!(rc, 0);
            Guarded {
                base: base.cast(),
                page,
            }
        }
    }

    /// A slice of `bytes`, ending exactly at the guard page.
    fn place(&mut self, bytes: &[u8]) -> &[u8] {
        assert!(bytes.len() <= self.page);
        // SAFETY: the destination range lies inside the first (RW) page.
        unsafe {
            let dst = self.base.add(self.page - bytes.len());
            std::ptr::copy_nonoverlapping(bytes.as_ptr(), dst, bytes.len());
            std::slice::from_raw_parts(dst, bytes.len())
        }
    }
}

impl Drop for Guarded {
    fn drop(&mut self) {
        // SAFETY: the mapping made in `new`.
        unsafe {
            libc::munmap(self.base.cast(), 2 * self.page);
        }
    }
}

#[test]
fn no_tier_reads_past_the_end_of_its_input() {
    let mut g = Guarded::new();
    let mut lens = Vec::new();
    for w in [16usize, 32, 64] {
        for k in 1..=4 {
            for d in [w * k - 1, w * k, w * k + 1] {
                lens.push(d);
            }
        }
    }
    lens.sort();
    lens.dedup();
    for tier in compiled_tiers().into_iter().filter(|t| t.is_supported()) {
        for alphabet in [&CSS, &JSON] {
            for &len in &lens {
                // Ends in a digraph first byte so the shifted compare
                // wants the byte past the end.
                let mut v: Vec<u8> = b"a{b}/*c*/;d:'e',f\"g\"(h)"
                    .iter()
                    .copied()
                    .cycle()
                    .take(len)
                    .collect();
                if let Some(last) = v.last_mut() {
                    *last = b'/';
                }
                let input = g.place(&v);
                let got = scan_with(tier, input, alphabet).unwrap();
                let want = scalar::scan(&v, alphabet);
                assert_eq!(
                    got.positions,
                    want.positions,
                    "tier {} len {len}",
                    tier.name()
                );
            }
        }
    }
}
