// Tests for the structural bitmap pre-scanner (AM.5).

use parse_that::scan_structural;
use parse_that::parsers::scan::structural::StructuralIter;

// ── JSON structural bytes ──────────────────────────────────────────────────
const JSON_STRUCTURAL: &[u8] = b"{}[]:,\"";

// ── Basic cases ────────────────────────────────────────────────────────────

#[test]
fn empty_input() {
    assert_eq!(scan_structural(b"", JSON_STRUCTURAL), Vec::<u32>::new());
}

#[test]
fn no_structural_bytes() {
    assert_eq!(scan_structural(b"hello world 12345", JSON_STRUCTURAL), Vec::<u32>::new());
}

#[test]
fn all_structural_bytes() {
    let input = b"{}[]:,\"";
    let positions = scan_structural(input, JSON_STRUCTURAL);
    let expected: Vec<u32> = (0..input.len() as u32).collect();
    assert_eq!(positions, expected);
}

#[test]
fn simple_json_object() {
    // {"a":1}
    let input = b"{\"a\":1}";
    let positions = scan_structural(input, JSON_STRUCTURAL);
    // Structural positions: { at 0, " at 1, " at 3, : at 4, } at 6
    assert_eq!(positions, vec![0, 1, 3, 4, 6]);
}

#[test]
fn json_array() {
    // [1,2,3]
    let input = b"[1,2,3]";
    let positions = scan_structural(input, JSON_STRUCTURAL);
    // [ at 0, , at 2, , at 4, ] at 6
    assert_eq!(positions, vec![0, 2, 4, 6]);
}

#[test]
fn nested_json() {
    let input = b"{\"key\":[1,2]}";
    let positions = scan_structural(input, JSON_STRUCTURAL);
    // { at 0, " at 1, " at 4, : at 5, [ at 6, , at 8, ] at 10, } at 11
    // Wait, let me verify manually:
    // index: 0123456789...
    // bytes: { " k e y " : [ 1 , 2 ] }
    //        0 1         5 6 7   9   11 12
    assert_eq!(positions, vec![0, 1, 5, 6, 7, 9, 11, 12]);
}

// ── Quote-unawareness ──────────────────────────────────────────────────────
// The scanner intentionally reports structural bytes inside strings.
// Quote-parity filtering is the dispatch layer's job.

#[test]
fn structural_bytes_inside_strings_are_reported() {
    // {"key": "value:{},[]"}
    let input = br#"{"key": "value:{},[]"}"#;
    let positions = scan_structural(input, JSON_STRUCTURAL);
    // Every { } [ ] : , " in the buffer should appear, including those inside
    // the string "value:{},[]".
    for &pos in &positions {
        let byte = input[pos as usize];
        assert!(
            JSON_STRUCTURAL.contains(&byte),
            "position {} has byte {} which is not structural",
            pos, byte as char,
        );
    }
    // Count: we should find all structural bytes in the buffer.
    let expected_count = input.iter().filter(|b| JSON_STRUCTURAL.contains(b)).count();
    assert_eq!(positions.len(), expected_count);
}

// ── Scalar tail coverage ───────────────────────────────────────────────────
// Inputs shorter than 16 bytes exercise the scalar fallback path.

#[test]
fn input_shorter_than_simd_width() {
    let input = b"{:}";
    let positions = scan_structural(input, JSON_STRUCTURAL);
    assert_eq!(positions, vec![0, 1, 2]);
}

#[test]
fn input_exactly_16_bytes() {
    // Exactly one SIMD chunk, no scalar tail.
    let input = b"{\"a\":1,\"b\":2}   "; // 16 bytes
    assert_eq!(input.len(), 16);
    let positions = scan_structural(input, JSON_STRUCTURAL);
    // Verify all reported positions are structural.
    for &pos in &positions {
        assert!(JSON_STRUCTURAL.contains(&input[pos as usize]));
    }
}

#[test]
fn input_17_bytes_exercises_tail() {
    // 16 bytes for SIMD + 1 byte scalar tail.
    let input = b"{\"a\":1,\"b\":2}   }"; // 17 bytes
    assert_eq!(input.len(), 17);
    let positions = scan_structural(input, JSON_STRUCTURAL);
    // Last byte is '}' at offset 16 — must be caught by scalar tail.
    assert!(positions.contains(&16));
}

// ── Large input ────────────────────────────────────────────────────────────

#[test]
fn large_input_all_positions_found() {
    // Build a buffer with known structural positions.
    let mut input = vec![b'x'; 1024];
    let mut expected = Vec::new();
    for i in (0..1024).step_by(7) {
        input[i] = b'{';
        expected.push(i as u32);
    }
    let positions = scan_structural(&input, &[b'{']);
    assert_eq!(positions, expected);
}

#[test]
fn large_input_dense_structural() {
    // Every byte is structural — stress test for bit extraction.
    let input = vec![b','; 256];
    let positions = scan_structural(&input, &[b',']);
    let expected: Vec<u32> = (0..256).collect();
    assert_eq!(positions, expected);
}

// ── Custom structural byte sets ────────────────────────────────────────────

#[test]
fn single_structural_byte() {
    let input = b"a,b,c,d";
    let positions = scan_structural(input, &[b',']);
    assert_eq!(positions, vec![1, 3, 5]);
}

#[test]
fn eight_structural_bytes_max() {
    // Maximum supported: 8 unique targets.
    let targets = b"abcdefgh";
    let input = b"xaxbxcxdxexfxgxh";
    let positions = scan_structural(input, targets);
    assert_eq!(positions, vec![1, 3, 5, 7, 9, 11, 13, 15]);
}

#[test]
fn empty_structural_set() {
    // No structural bytes → no matches.
    let positions = scan_structural(b"hello world", &[]);
    assert!(positions.is_empty());
}

// ── StructuralIter ─────────────────────────────────────────────────────────

#[test]
fn iter_matches_vec() {
    let input = b"{\"key\":[1,2,3],\"val\":true}";
    let vec_result = scan_structural(input, JSON_STRUCTURAL);
    let iter_result: Vec<u32> = StructuralIter::new(input, JSON_STRUCTURAL)
        .map(|(offset, _byte)| offset)
        .collect();
    assert_eq!(vec_result, iter_result);
}

#[test]
fn iter_yields_correct_bytes() {
    let input = b"[1,2]";
    let results: Vec<(u32, u8)> = StructuralIter::new(input, JSON_STRUCTURAL).collect();
    assert_eq!(results, vec![(0, b'['), (2, b','), (4, b']')]);
}

#[test]
fn iter_empty_input() {
    let results: Vec<(u32, u8)> = StructuralIter::new(b"", JSON_STRUCTURAL).collect();
    assert!(results.is_empty());
}

#[test]
fn iter_early_exit() {
    // Verify the iterator can short-circuit — take only the first 2 hits.
    let input = b"[1,2,3,4,5]";
    let first_two: Vec<(u32, u8)> = StructuralIter::new(input, JSON_STRUCTURAL)
        .take(2)
        .collect();
    assert_eq!(first_two.len(), 2);
    assert_eq!(first_two[0], (0, b'['));
    assert_eq!(first_two[1], (2, b','));
}

#[test]
fn iter_scalar_tail() {
    // 3 bytes — entirely scalar path.
    let input = b"{:}";
    let results: Vec<(u32, u8)> = StructuralIter::new(input, JSON_STRUCTURAL).collect();
    assert_eq!(results, vec![(0, b'{'), (1, b':'), (2, b'}')]);
}

// ── Cross-SIMD-boundary ────────────────────────────────────────────────────

#[test]
fn structural_byte_at_chunk_boundary() {
    // Place structural bytes at offsets 15 and 16 — the boundary between
    // first SIMD chunk and second/scalar.
    let mut input = vec![b'x'; 32];
    input[15] = b'{';
    input[16] = b'}';
    let positions = scan_structural(&input, JSON_STRUCTURAL);
    assert_eq!(positions, vec![15, 16]);
}
