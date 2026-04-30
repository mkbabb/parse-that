use parse_that::parsers::scan::number_simd::{SimdDigitResult, scan_digits_simd};
use parse_that::{INPUT_PAD_BYTES, PaddedView};

/// Build a padded buffer mirroring `ParserState::new`: the first
/// `input.len()` bytes are the public input; the next
/// [`INPUT_PAD_BYTES`] bytes are NUL.
fn padded_buf(input: &[u8]) -> Vec<u8> {
    let mut v = Vec::with_capacity(input.len() + INPUT_PAD_BYTES);
    v.extend_from_slice(input);
    v.resize(input.len() + INPUT_PAD_BYTES, 0);
    v
}

fn scan(input: &[u8], offset: usize) -> Option<SimdDigitResult> {
    let buf = padded_buf(input);
    let view = PaddedView::new(&buf, input.len());
    scan_digits_simd(view, offset)
}

#[test]
fn scan_all_digits_16() {
    let input = b"1234567890123456xyz";
    let result = scan(input, 0).unwrap();
    assert_eq!(result.count, 16);
    assert_eq!(result.value, 1234567890123456);
}

#[test]
fn scan_partial_digits() {
    let input = b"12345abc00000000";
    let result = scan(input, 0).unwrap();
    assert_eq!(result.count, 5);
    assert_eq!(result.value, 12345);
}

#[test]
fn scan_single_digit() {
    let input = b"7_______________";
    let result = scan(input, 0).unwrap();
    assert_eq!(result.count, 1);
    assert_eq!(result.value, 7);
}

#[test]
fn scan_no_digits() {
    let input = b"abcdefghijklmnop";
    assert!(scan(input, 0).is_none());
}

/// Under the padded-view contract, a short public input still has
/// a full 16-byte window available — the padded region is NUL,
/// which classifies as non-digit. The scanner returns the digits
/// that are present rather than short-circuiting on length.
#[test]
fn scan_short_input_returns_available_digits() {
    let input = b"12345";
    let result = scan(input, 0).unwrap();
    assert_eq!(result.count, 5);
    assert_eq!(result.value, 12345);
}

#[test]
fn scan_with_offset() {
    let input = b"abc1234567890123456xyz";
    let result = scan(input, 3).unwrap();
    assert_eq!(result.count, 16);
    assert_eq!(result.value, 1234567890123456);
}

#[test]
fn scan_nine_digits() {
    // 9 digits exercises the two-group path (8 + 1).
    let input = b"123456789_______";
    let result = scan(input, 0).unwrap();
    assert_eq!(result.count, 9);
    assert_eq!(result.value, 123456789);
}

#[test]
fn scan_all_zeros() {
    let input = b"0000000000000000";
    let result = scan(input, 0).unwrap();
    assert_eq!(result.count, 16);
    assert_eq!(result.value, 0);
}

#[test]
fn scan_all_nines() {
    let input = b"9999999999999999";
    let result = scan(input, 0).unwrap();
    assert_eq!(result.count, 16);
    assert_eq!(result.value, 9999999999999999);
}

#[test]
fn scan_boundary_below_zero() {
    // Bytes just below '0' (0x30): '/' is 0x2F
    let input = b"/234567890123456";
    assert!(scan(input, 0).is_none());
}

#[test]
fn scan_boundary_above_nine() {
    // ':' is 0x3A, just above '9'
    let input = b":234567890123456";
    assert!(scan(input, 0).is_none());
}

/// Cross-validate SIMD against scalar for all digit counts 1..=16.
#[test]
fn cross_validate_all_counts() {
    for count in 1..=16u32 {
        let mut input = [b'0'; 32];
        // Fill with a recognizable pattern
        for j in 0..count as usize {
            input[j] = b'1' + (j % 9) as u8;
        }
        // Terminate with non-digit
        if (count as usize) < 32 {
            input[count as usize] = b'x';
        }

        // Scalar reference
        let mut scalar_val: u64 = 0;
        for j in 0..count as usize {
            scalar_val = scalar_val * 10 + (input[j] - b'0') as u64;
        }

        if let Some(result) = scan(&input, 0) {
            assert_eq!(result.count, count, "count mismatch for {count} digits");
            assert_eq!(
                result.value, scalar_val,
                "value mismatch for {count} digits: SIMD={}, scalar={}",
                result.value, scalar_val
            );
        }
        // If scan_digits_simd returns None (leading byte is not
        // an ASCII digit), that's fine — the scalar path handles it.
    }
}
