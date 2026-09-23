export function triviaEnd(source: string, start: number): number {
    let end = start;
    while (end < source.length) {
        const code = source.charCodeAt(end);
        if (code !== 9 && code !== 10 && code !== 13 && code !== 32) break;
        end++;
    }
    return end;
}

export function quotedEnd(source: string, start: number): number {
    const quote = source.charCodeAt(start);
    if (quote !== 34 && quote !== 39) return -1;
    let end = start + 1;
    while (end < source.length) {
        const code = source.charCodeAt(end++);
        if (code === quote) return end;
        if (code === 0 || code === 10 || code === 12 || code === 13) return -1;
        if (code !== 92) continue;
        if (end === source.length) return end;
        const escaped = source.charCodeAt(end++);
        if (escaped === 13 && source.charCodeAt(end) === 10) end++;
    }
    return -1;
}

export function urlBodyEnd(source: string, start: number): number {
    let end = start;
    while (end < source.length) {
        const code = source.charCodeAt(end);
        if (
            code === 0
            || code === 9
            || code === 10
            || code === 12
            || code === 13
            || code === 32
            || code === 34
            || code === 39
            || code === 40
            || code === 41
        ) break;
        if (code === 92 && end + 1 < source.length) end++;
        end++;
    }
    return end === start ? -1 : end;
}

export function statementSyncEnd(source: string, start: number): number {
    const semicolon = source.indexOf(";", start);
    return semicolon < 0 ? -1 : semicolon + 1;
}
