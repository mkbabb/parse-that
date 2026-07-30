import { asciiClass } from "./leaves.js";

export const DIGIT = asciiClass([48, 57]);
export const NAME_START = asciiClass([65, 90], [97, 122], 95);
export const NAME_REST = asciiClass(
    [48, 57],
    [65, 90],
    [97, 122],
    45,
    95,
);

export function cssNumberEnd(source: string, start: number): number {
    const length = source.length;
    let end = start;
    let code = end < length ? source.charCodeAt(end) : -1;
    if (code === 43 || code === 45) {
        end++;
        code = end < length ? source.charCodeAt(end) : -1;
    }

    const integer = end;
    while (code >= 48 && code <= 57) {
        end++;
        code = end < length ? source.charCodeAt(end) : -1;
    }
    let digits = end - integer;
    if (
        code === 46
        && end + 1 < length
        && source.charCodeAt(end + 1) >= 48
        && source.charCodeAt(end + 1) <= 57
    ) {
        end += 2;
        digits++;
        while (end < length) {
            code = source.charCodeAt(end);
            if (code < 48 || code > 57) break;
            end++;
        }
        code = end < length ? source.charCodeAt(end) : -1;
    }
    if (digits === 0) return -1;

    if (code === 69 || code === 101) {
        let exponent = end + 1;
        code = exponent < length ? source.charCodeAt(exponent) : -1;
        if (code === 43 || code === 45) {
            exponent++;
            code = exponent < length ? source.charCodeAt(exponent) : -1;
        }
        const firstExponentDigit = exponent;
        while (code >= 48 && code <= 57) {
            exponent++;
            code = exponent < length ? source.charCodeAt(exponent) : -1;
        }
        if (exponent > firstExponentDigit) end = exponent;
    }
    return end;
}

export function jsonNumberEnd(source: string, start: number): number {
    const length = source.length;
    let end = start;
    if (end < length && source.charCodeAt(end) === 45) end++;
    if (end < length && source.charCodeAt(end) === 48) {
        end++;
    } else {
        const first = end;
        while (
            end < length
            && source.charCodeAt(end) >= 48
            && source.charCodeAt(end) <= 57
        ) end++;
        if (end === first || source.charCodeAt(first) === 48) return -1;
    }
    if (
        end + 1 < length
        && source.charCodeAt(end) === 46
        && source.charCodeAt(end + 1) >= 48
        && source.charCodeAt(end + 1) <= 57
    ) {
        end += 2;
        while (
            end < length
            && source.charCodeAt(end) >= 48
            && source.charCodeAt(end) <= 57
        ) end++;
    }
    const exponent = end < length ? source.charCodeAt(end) : -1;
    if (exponent === 69 || exponent === 101) {
        let at = end + 1;
        const sign = at < length ? source.charCodeAt(at) : -1;
        if (sign === 43 || sign === 45) at++;
        const first = at;
        while (
            at < length
            && source.charCodeAt(at) >= 48
            && source.charCodeAt(at) <= 57
        ) at++;
        if (at > first) end = at;
    }
    return end;
}

function escapeEnd(source: string, slash: number): number {
    let end = slash + 1;
    if (end === source.length) return end;
    const first = source.charCodeAt(end);
    if (first === 10 || first === 12 || first === 13) return -1;
    const hex =
        (first >= 48 && first <= 57)
        || (first >= 65 && first <= 70)
        || (first >= 97 && first <= 102);
    if (!hex) return end + 1;
    let count = 0;
    while (end < source.length && count < 6) {
        const code = source.charCodeAt(end);
        if (
            !(
                (code >= 48 && code <= 57)
                || (code >= 65 && code <= 70)
                || (code >= 97 && code <= 102)
            )
        ) break;
        end++;
        count++;
    }
    const whitespace = source.charCodeAt(end);
    if (whitespace === 13 && source.charCodeAt(end + 1) === 10) return end + 2;
    if (
        whitespace === 9
        || whitespace === 10
        || whitespace === 12
        || whitespace === 13
        || whitespace === 32
    ) return end + 1;
    return end;
}

export function cssNameEnd(source: string, start: number): number {
    let end = start;
    while (end < source.length) {
        const code = source.charCodeAt(end);
        if (
            code >= 128
            || code === 45
            || code === 95
            || (code >= 48 && code <= 57)
            || (code >= 65 && code <= 90)
            || (code >= 97 && code <= 122)
        ) {
            end++;
            continue;
        }
        if (code !== 92) break;
        const escaped = escapeEnd(source, end);
        if (escaped < 0) break;
        end = escaped;
    }
    return end === start ? -1 : end;
}

export function jsonStringEnd(source: string, start: number): number {
    if (source.charCodeAt(start) !== 34) return -1;
    let end = start + 1;
    while (end < source.length) {
        const code = source.charCodeAt(end++);
        if (code === 34) return end;
        if (code < 32) return -1;
        if (code !== 92) continue;
        const escaped = source.charCodeAt(end++);
        if (
            escaped === 34
            || escaped === 47
            || escaped === 92
            || escaped === 98
            || escaped === 102
            || escaped === 110
            || escaped === 114
            || escaped === 116
        ) continue;
        if (escaped !== 117) return -1;
        for (let count = 0; count < 4; count++) {
            const hex = source.charCodeAt(end++);
            if (
                !(
                    (hex >= 48 && hex <= 57)
                    || (hex >= 65 && hex <= 70)
                    || (hex >= 97 && hex <= 102)
                )
            ) return -1;
        }
    }
    return -1;
}
