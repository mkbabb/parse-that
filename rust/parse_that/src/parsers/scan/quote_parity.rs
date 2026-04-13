//! Quote-parity filtering for structural byte indices.
//!
//! After a structural pre-scan, some positions fall inside quoted
//! strings. This filter walks the position array and removes
//! non-quote positions that are inside strings.

/// Filter structural positions to remove those inside quoted strings.
///
/// Walks `positions` (byte offsets into `input`), tracking an
/// `in_string` flag toggled by unescaped `"` bytes. Positions
/// inside strings (except the quotes themselves) are removed
/// via in-place compaction.
pub fn filter_quote_parity(input: &[u8], positions: &mut Vec<u32>) {
    let mut in_string = false;
    let mut write = 0;
    for read in 0..positions.len() {
        let pos = positions[read] as usize;
        let byte = input.get(pos).copied().unwrap_or(0);
        if byte == b'"' {
            // Check if this quote is escaped (preceded by odd # of backslashes)
            let mut bs_count = 0u32;
            let mut check = pos;
            while check > 0 && input[check - 1] == b'\\' {
                bs_count += 1;
                check -= 1;
            }
            if bs_count % 2 == 0 {
                // Unescaped quote: toggle in_string, keep position
                in_string = !in_string;
            }
            positions[write] = positions[read];
            write += 1;
        } else if !in_string {
            // Outside string: keep structural position
            positions[write] = positions[read];
            write += 1;
        }
        // Inside string + not a quote: discard
    }
    positions.truncate(write);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_strings() {
        let input = b"[1,2,3]";
        let mut positions = vec![0, 2, 4, 6]; // [ , , ]
        filter_quote_parity(input, &mut positions);
        assert_eq!(positions, vec![0, 2, 4, 6]);
    }

    #[test]
    fn simple_string() {
        let input = b"{\"key\":1}";
        // positions: { " k e y " : 1 }
        //            0 1 2 3 4 5 6 7 8
        let mut positions = vec![0, 1, 2, 3, 4, 5, 6, 7, 8];
        filter_quote_parity(input, &mut positions);
        // Should keep: { " " : 1 } (drop k,e,y inside string)
        assert_eq!(positions, vec![0, 1, 5, 6, 7, 8]);
    }

    #[test]
    fn escaped_quote() {
        let input = br#"{"k\"y":1}"#;
        let mut positions: Vec<u32> = (0..input.len() as u32).collect();
        filter_quote_parity(input, &mut positions);
        // The escaped quote at position 4 should NOT toggle in_string
        assert!(positions.contains(&0)); // {
        assert!(positions.contains(&(input.len() as u32 - 1))); // }
    }
}
