//! No wasm32 kernel reads past the end of its input.
//!
//! wasm has no `mprotect`, but a load past the end of linear memory
//! traps. So each input is placed so its last byte is the last byte of
//! linear memory: the test grows memory by one page that the allocator
//! does not know about (it only ever grows memory itself, past this
//! page), and copies the input to the page's end. A one-byte overread,
//! such as a digraph's shifted second-byte compare at the last stripe,
//! then traps instead of reading a neighbour's bytes. This is
//! `tests/guard_page.rs` for wasm32.
#![cfg(target_arch = "wasm32")]

use core::arch::wasm32::{memory_grow, memory_size};
use parse_that_simd::{StructuralAlphabet, compiled_tiers, scalar, scan_with};

const CSS: StructuralAlphabet =
    StructuralAlphabet::from_parts(b"{}();:,", &[(b'/', b'*'), (b'*', b'/')], b"\"'");
const JSON: StructuralAlphabet = StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\"");
const PAGE: usize = 65536;

/// The last page of linear memory, owned by this test alone.
struct LastPage {
    base: *mut u8,
}

impl LastPage {
    fn new() -> Self {
        let before = memory_size::<0>();
        assert_ne!(memory_grow::<0>(1), usize::MAX, "memory.grow failed");
        assert_eq!(memory_size::<0>(), before + 1);
        LastPage { base: (before * PAGE) as *mut u8 }
    }

    /// A slice of `bytes` ending at the last byte of linear memory.
    fn place(&mut self, bytes: &[u8]) -> &[u8] {
        assert!(bytes.len() <= PAGE);
        // The page is the last of linear memory (the allocator grows
        // memory only past it), so nothing else aliases it.
        assert_eq!(memory_size::<0>() * PAGE, self.base as usize + PAGE, "memory grew under the test");
        // SAFETY: the destination lies inside the page `new` grew, which
        // no allocation owns.
        unsafe {
            let dst = self.base.add(PAGE - bytes.len());
            std::ptr::copy_nonoverlapping(bytes.as_ptr(), dst, bytes.len());
            std::slice::from_raw_parts(dst, bytes.len())
        }
    }
}

#[test]
fn no_tier_reads_past_the_end_of_linear_memory() {
    let mut lens = Vec::new();
    for w in [16usize, 32, 64] {
        for k in 1..=4 {
            lens.extend([w * k - 1, w * k, w * k + 1]);
        }
    }
    lens.sort();
    lens.dedup();
    // Every input is built before the page is grown, so no allocation
    // made while scanning can grow memory past the page mid-test; the
    // results are compared after.
    let inputs: Vec<Vec<u8>> = lens
        .iter()
        .map(|&len| {
            let mut v: Vec<u8> = b"a{b}/*c*/;d:'e',f\"g\"(h)".iter().copied().cycle().take(len).collect();
            // Ends in a digraph first byte, so the shifted compare
            // wants the byte past the end.
            *v.last_mut().unwrap() = b'/';
            v
        })
        .collect();
    let tiers: Vec<_> = compiled_tiers().into_iter().filter(|t| t.is_supported()).collect();
    let mut want = Vec::new();
    for alphabet in [&CSS, &JSON] {
        for v in &inputs {
            want.push(scalar::scan(v, alphabet).positions);
        }
    }
    let mut got = Vec::with_capacity(tiers.len() * want.len());
    for _ in &tiers {
        got.push(Vec::with_capacity(want.len()));
    }
    // Give the allocator free space below the page first (wasm memory
    // never shrinks), so the scans' own allocations do not grow memory.
    drop(Vec::<u8>::with_capacity(8 << 20));
    let mut page = LastPage::new();
    for (t, &tier) in tiers.iter().enumerate() {
        for alphabet in [&CSS, &JSON] {
            for v in &inputs {
                let input = page.place(v);
                got[t].push(scan_with(tier, input, alphabet).unwrap().positions);
            }
        }
    }
    for (t, tier) in tiers.iter().enumerate() {
        for (i, w) in want.iter().enumerate() {
            assert_eq!(&got[t][i], w, "tier {} case {i}", tier.name());
        }
    }
}
