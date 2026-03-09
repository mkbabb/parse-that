/// Balanced splitting utilities for format-time text processing.
///
/// Used by BBNF-generated `toDoc()` code to split opaque Span text on a
/// delimiter at nesting depth 0, respecting `()[]` nesting and `""''` quoting.

/// Quick check: does `text` contain `delim` at all?
///
/// Use before `splitBalanced` to avoid an array allocation when the delimiter
/// is absent (the common case for single-item spans).
export function containsDelimiter(text: string, delim: string): boolean {
    return text.indexOf(delim) !== -1;
}

/// Split `text` on `delim` at nesting depth 0.
///
/// Respects `()` and `[]` nesting, and ignores delimiters inside `""` and `''`
/// quoted strings. Returns substrings sliced from the input.
export function splitBalanced(text: string, delim: string): string[] {
    // Fast path: if the delimiter doesn't appear at all, skip the full scan.
    if (!containsDelimiter(text, delim)) return [text];

    const result: string[] = [];
    let depth = 0;
    let inString: string | null = null;
    let start = 0;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (ch === '"' || ch === "'") {
            if (inString === ch) {
                inString = null;
            } else if (inString === null) {
                inString = ch;
            }
            continue;
        }

        if (inString !== null) continue;

        if (ch === "(" || ch === "[") {
            depth++;
            continue;
        }
        if (ch === ")" || ch === "]") {
            depth = Math.max(0, depth - 1);
            continue;
        }

        if (ch === delim && depth === 0) {
            result.push(text.slice(start, i));
            start = i + 1;
        }
    }

    result.push(text.slice(start));
    return result;
}
