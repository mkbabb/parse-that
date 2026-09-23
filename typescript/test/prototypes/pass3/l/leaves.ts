import {
    sourceLeaf,
    type Grammar,
} from "../s/kernel.js";

export type SourceProject<T> = (
    source: string,
    start: number,
    end: number,
) => T;

export function stickySource<T = string>(
    expression: RegExp,
    project?: SourceProject<T>,
    firstCodes: readonly number[] = [],
): Grammar<T> {
    const flags = expression.flags.replace(/y/g, "");
    const sticky = new RegExp(expression, flags + "y");
    return sourceLeaf(
        `/${expression.source}/${expression.flags}`,
        (source, start) => {
            sticky.lastIndex = start;
            return sticky.test(source) ? sticky.lastIndex : -1;
        },
        project,
        firstCodes,
    );
}

export function asciiRun<T = string>(
    label: string,
    first: Uint8Array,
    rest = first,
    project?: SourceProject<T>,
): Grammar<T> {
    if (first.length !== 128 || rest.length !== 128) {
        throw new RangeError("ASCII class tables must contain 128 entries");
    }
    const firstCodes: number[] = [];
    for (let code = 0; code < first.length; code++) {
        if (first[code]) firstCodes.push(code);
    }
    return sourceLeaf(
        label,
        (source, start) => {
            const code = source.charCodeAt(start);
            if (code >= 128 || first[code] === 0) return -1;
            let end = start + 1;
            while (end < source.length) {
                const next = source.charCodeAt(end);
                if (next >= 128 || rest[next] === 0) break;
                end++;
            }
            return end;
        },
        project,
        firstCodes,
    );
}

export function asciiClass(
    ...ranges: readonly (number | readonly [number, number])[]
): Uint8Array {
    const table = new Uint8Array(128);
    for (const range of ranges) {
        const [low, high] = typeof range === "number"
            ? [range, range]
            : range;
        if (low < 0 || high >= 128 || low > high) {
            throw new RangeError("invalid ASCII class range");
        }
        table.fill(1, low, high + 1);
    }
    return table;
}
