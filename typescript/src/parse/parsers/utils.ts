/**
 * Shared parser building blocks mirroring Rust parsers/utils.rs.
 */
import { regex, string, Parser } from "../index.js";

/** Parse escaped characters: backslash followed by common escape chars or \\uXXXX. */
export function escapedString() {
    return string("\\").then(
        regex(/[bfnrt"'\\/]/)
            .or(string("u").skip(regex(/[0-9a-fA-F]{4}/)))
    ).map(([, esc]) => esc);
}

/** Parse a quoted string with escape handling. */
export function quotedString(quote: string = '"') {
    const inner = regex(new RegExp(`[^${quote}\\\\]+`)).or(escapedString());
    return inner.many().wrap(string(quote), string(quote)).map((parts) => parts.join(""));
}

/** Parse a number (integer or decimal with optional exponent). */
export function numberParser() {
    return regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/).map(Number);
}
