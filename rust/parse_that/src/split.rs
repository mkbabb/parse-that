/// Balanced splitting utilities for format-time text processing.
///
/// Used by BBNF-generated `to_doc()` code to split opaque Span text on a
/// delimiter at nesting depth 0, respecting `()[]` nesting and `""''` quoting.
/// Quick check: does `text` contain `delim` at all?
///
/// Use before [`split_balanced`] to avoid a Vec allocation when the delimiter
/// is absent (the common case for single-item spans).
#[inline]
pub fn contains_delimiter(text: &str, delim: u8) -> bool {
    memchr::memchr(delim, text.as_bytes()).is_some()
}

/// Split `text` on `delim` at nesting depth 0.
///
/// Respects `()` and `[]` nesting, and ignores delimiters inside `""` and `''`
/// quoted strings. Returns borrowed slices from the input.
///
/// # Examples
///
/// ```
/// use parse_that::split_balanced;
///
/// // Basic splitting
/// assert_eq!(split_balanced("a, b, c", b','), vec!["a", " b", " c"]);
///
/// // Nested parens — comma inside :is() is not a split point
/// assert_eq!(
///     split_balanced(":is(.a, .b), .c", b','),
///     vec![":is(.a, .b)", " .c"],
/// );
///
/// // Quoted strings — comma inside quotes is not a split point
/// assert_eq!(
///     split_balanced(r#"[attr="x,y"], .z"#, b','),
///     vec![r#"[attr="x,y"]"#, " .z"],
/// );
///
/// // No delimiter — returns the whole string
/// assert_eq!(split_balanced("no commas here", b','), vec!["no commas here"]);
/// ```
pub fn split_balanced(text: &str, delim: u8) -> Vec<&str> {
    // Fast path: if the delimiter doesn't appear at all, skip the full scan.
    if memchr::memchr(delim, text.as_bytes()).is_none() {
        return vec![text];
    }

    let mut result = Vec::new();
    let mut depth = 0u32;
    let mut start = 0;
    let mut in_string: Option<u8> = None;

    for (i, b) in text.bytes().enumerate() {
        match b {
            b'"' | b'\'' if in_string.is_none() => in_string = Some(b),
            q if in_string == Some(q) => in_string = None,
            _ if in_string.is_some() => {}
            b'(' | b'[' => depth += 1,
            b')' | b']' => depth = depth.saturating_sub(1),
            c if c == delim && depth == 0 => {
                result.push(&text[start..i]);
                start = i + 1;
            }
            _ => {}
        }
    }
    result.push(&text[start..]);
    result
}
