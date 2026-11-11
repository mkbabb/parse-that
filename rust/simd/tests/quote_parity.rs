//! Quote-parity correctness against escape-rich inputs. Verifies
//! that `inside-string` bytes are not emitted as structural, even
//! when the structural alphabet contains characters typical inside
//! strings (`{`, `}`, `,`, `:`, `[`, `]`).
//!
//! The parity contract is the same one simdjson encodes via CLMUL:
//! a structural byte at offset `i` is real iff the prefix-XOR of
//! quote positions at offset `i` is `0` (outside string).

use parse_that_simd::{alphabet::StructuralAlphabet, parity, scalar, scan_structural};

const JSON_ALPHABET: StructuralAlphabet = StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\"");

#[test]
fn quote_filters_braces_inside_string() {
    let input = br#"{"key":"value with }, [, ] inside"}"#;
    let idx = scan_structural(input, &JSON_ALPHABET);
    // Only `{`, the `:` between key/value, and the closing `}` are
    // structural; the `}, [, ]` inside the string value are filtered.
    let positions: Vec<u32> = idx.positions.clone();
    let kinds: Vec<u8> = idx.kinds.clone();
    let pairs: Vec<(u32, u8)> = positions.into_iter().zip(kinds).collect();
    let outside_only: Vec<(u32, u8)> = pairs.into_iter().filter(|&(_, k)| k != b'"').collect();
    assert!(
        outside_only.iter().all(|&(p, _)| {
            // Anything inside the value-string is at offset > 8 and < input.len()-2.
            !(8..input.len() as u32 - 2).contains(&p)
                || input[p as usize] == b':'
                || p == 0
                || p as usize == input.len() - 1
        }),
        "non-quote structural bytes inside string slipped through: {:?}",
        outside_only
    );
}

#[test]
fn escaped_quote_does_not_close_string() {
    let input = br#"{"a":"x\",y\"z","b":1}"#;
    //                  ^  ^^  ^^^   ^   ^ ^
    // Offsets:        0 4 7  9..11 13  15 16
    // Inside the value `x\",y\"z`: the `,` at offset 9 must NOT be
    // emitted as structural; it's inside the string due to escape.
    let scalar_idx = scalar::scan(input, &JSON_ALPHABET);
    let simd_idx = scan_structural(input, &JSON_ALPHABET);
    assert_eq!(
        scalar_idx.positions, simd_idx.positions,
        "scalar/simd mismatch"
    );
    // The comma at position 9 (inside string) must NOT appear.
    assert!(
        !simd_idx.positions.contains(&9),
        "escaped-quote section leaked structural comma"
    );
}

#[test]
fn double_backslash_quote_closes_string() {
    let input = br#"{"x":"a\\","y":1}"#;
    // The `\\` is two backslashes; the following `"` is unescaped (parity == 0)
    // so the string ends. Then `,` at offset 10 IS structural.
    let scalar_idx = scalar::scan(input, &JSON_ALPHABET);
    let simd_idx = scan_structural(input, &JSON_ALPHABET);
    assert_eq!(
        scalar_idx.positions, simd_idx.positions,
        "scalar/simd mismatch"
    );
    assert!(
        simd_idx.positions.contains(&10),
        "comma after `\\\\` should be structural"
    );
}

#[test]
fn many_strings_in_array() {
    let input = br#"["a","b","c","d","e","f","g","h"]"#;
    let scalar_idx = scalar::scan(input, &JSON_ALPHABET);
    let simd_idx = scan_structural(input, &JSON_ALPHABET);
    assert_eq!(
        scalar_idx.positions, simd_idx.positions,
        "scalar/simd mismatch"
    );
    // We expect: `[` 0, then `,` between every pair (positions 4, 8, 12, 16, 20, 24, 28),
    // then `]` 32. Plus the `"` quotes which are also structural.
    let outside_quotes: Vec<u32> = simd_idx
        .positions
        .iter()
        .copied()
        .filter(|&p| input[p as usize] != b'"')
        .collect();
    assert_eq!(outside_quotes, vec![0, 4, 8, 12, 16, 20, 24, 28, 32]);
}

#[test]
fn long_string_spanning_multiple_stripes() {
    // Build a single string of 200 bytes with `,` and `}` inside.
    let mut input = b"{\"k\":\"".to_vec();
    input.extend(std::iter::repeat_n(b',', 150));
    input.extend(b"}");
    input.extend(std::iter::repeat_n(b']', 50));
    input.extend(b"\",\"end\":1}");
    let scalar_idx = scalar::scan(&input, &JSON_ALPHABET);
    let simd_idx = scan_structural(&input, &JSON_ALPHABET);
    assert_eq!(
        scalar_idx.positions, simd_idx.positions,
        "long-string scan diverged"
    );
    // None of the `,` `}` `]` bytes inside the long string (offset 6..156)
    // should appear as non-quote structural.
    let inside_string_range = 6u32..156;
    for &p in &simd_idx.positions {
        if inside_string_range.contains(&p) {
            assert_eq!(
                input[p as usize], b'"',
                "non-quote structural at {p} inside string"
            );
        }
    }
}

#[test]
fn shift_xor_matches_clmul() {
    // Independently of the kernel: the prefix-XOR ladder produces
    // the same output as the CLMUL-based one for arbitrary 64-bit
    // masks. This is the contract `parity::prefix_xor_64` relies on
    // when the CLMUL feature is active.
    let test_masks: &[u64] = &[
        0,
        1,
        0xFF,
        0xAAAA_AAAA_AAAA_AAAA,
        0x5555_5555_5555_5555,
        0x0000_0000_FFFF_FFFF,
        0xFFFF_FFFF_0000_0000,
        0xDEAD_BEEF_CAFE_F00D,
        u64::MAX,
    ];
    for &mask in test_masks {
        for &carry in &[false, true] {
            let shifted = parity::shift_xor_prefix(mask);
            let with_carry = if carry { !shifted } else { shifted };
            assert_eq!(
                parity::prefix_xor_64(mask, carry),
                with_carry,
                "prefix-XOR mismatch mask=0x{mask:016x} carry={carry}"
            );
        }
    }
}

#[test]
fn empty_input_quote_path() {
    let idx = scan_structural(&[], &JSON_ALPHABET);
    assert!(idx.is_empty());
}

#[test]
fn input_starting_with_string() {
    let input = br#""abc","def"]"#;
    let scalar_idx = scalar::scan(input, &JSON_ALPHABET);
    let simd_idx = scan_structural(input, &JSON_ALPHABET);
    assert_eq!(scalar_idx.positions, simd_idx.positions);
}

#[test]
fn quote_carry_across_64_byte_stripes() {
    // A string that begins in stripe 0 and ends in stripe 1.
    // Verify the parity carry propagates correctly.
    let mut input = vec![b' '; 30];
    input.push(b'"');
    input.extend(std::iter::repeat_n(b',', 50)); // 50 commas inside string
    input.push(b'"');
    input.push(b',');
    input.push(b'1');
    let scalar_idx = scalar::scan(&input, &JSON_ALPHABET);
    let simd_idx = scan_structural(&input, &JSON_ALPHABET);
    assert_eq!(
        scalar_idx.positions, simd_idx.positions,
        "carry-across-stripes parity diverged"
    );
    // The 50 commas at offsets 31..81 are inside the string — none structural.
    for p in 31u32..81 {
        assert!(
            !simd_idx.positions.contains(&p) || input[p as usize] == b'"',
            "comma at {p} inside string emitted"
        );
    }
}
