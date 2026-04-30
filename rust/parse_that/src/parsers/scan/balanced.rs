// Balanced delimiter scanner with SIMD structural-byte classification.

/// Configuration for balanced structural scanning.
///
/// The union of `{open, close, quotes[..], terminators[..]}` forms the target
/// set for SIMD byte classification.  Must total ≤ 8 unique bytes.
pub struct BalancedScanConfig {
    /// Byte that increases nesting depth (e.g., `(` or `{`).
    pub open: u8,
    /// Byte that decreases nesting depth (e.g., `)` or `}`).
    pub close: u8,
    /// Quote bytes that toggle string-skipping mode (e.g., `"`, `'`).
    pub quotes: &'static [u8],
    /// Escape byte inside quotes (e.g., `\`).
    pub escape: u8,
    /// Bytes that terminate scanning at depth 0 (e.g., `;`, `{`, `}`).
    pub terminators: &'static [u8],
}

/// Scan forward to find a depth-0 terminator, respecting nesting and quotes.
/// Returns offset of the terminator (relative to start of `bytes`).
///
/// Uses SIMD (nibble LUT + `swizzle_dyn`) to skip data bytes between structural
/// characters, and `memchr2` for SIMD-accelerated string skipping.
#[inline(always)]
pub fn scan_balanced(bytes: &[u8], config: &BalancedScanConfig) -> usize {
    use crate::scanners::{build_nibble_luts, find_first_of_nibble_lut};

    // Pre-build nibble LUTs for all structural bytes (done once per call).
    let mut structural = [0u8; 8];
    let mut n = 0;
    structural[n] = config.open;
    n += 1;
    structural[n] = config.close;
    n += 1;
    for &q in config.quotes {
        structural[n] = q;
        n += 1;
    }
    for &t in config.terminators {
        structural[n] = t;
        n += 1;
    }
    debug_assert!(
        n <= 8,
        "scan_balanced: too many structural bytes for nibble LUT"
    );
    let (lo_lut, hi_lut) = build_nibble_luts(&structural[..n]);

    let len = bytes.len();
    let mut i = 0;
    let mut depth: u32 = 0;

    while i < len {
        // SIMD: skip data bytes, find next structural byte
        match find_first_of_nibble_lut(&bytes[i..], &lo_lut, &hi_lut) {
            None => return len,
            Some((pos, b)) => {
                i += pos;
                if b == config.open {
                    depth += 1;
                    i += 1;
                } else if b == config.close {
                    if depth > 0 {
                        depth -= 1;
                    }
                    i += 1;
                } else if config.quotes.contains(&b) {
                    // Skip quoted string — memchr2 for SIMD-accelerated scanning
                    i += 1;
                    loop {
                        match bytes.get(i..) {
                            Some(rem) if !rem.is_empty() => {
                                match memchr::memchr2(b, config.escape, rem) {
                                    None => {
                                        i = len;
                                        break;
                                    }
                                    Some(p) => {
                                        i += p;
                                        if unsafe { *bytes.get_unchecked(i) } == b {
                                            i += 1;
                                            break;
                                        }
                                        // Escape: skip next byte
                                        i += 2;
                                        if i >= len {
                                            i = len;
                                            break;
                                        }
                                    }
                                }
                            }
                            _ => {
                                i = len;
                                break;
                            }
                        }
                    }
                } else {
                    // Terminator byte
                    if depth == 0 {
                        return i;
                    }
                    i += 1;
                }
            }
        }
    }

    len
}
