import type { AST, Expression } from "./types.js";
import type { AnalysisCache } from "./analysis.js";

/**
 * 128-bit ASCII character set (bitset over code points 0..127).
 */
export class CharSet {
    private bits: Uint32Array;

    constructor() {
        this.bits = new Uint32Array(4); // 128 bits
    }

    add(code: number): void {
        if (code >= 0 && code < 128) {
            this.bits[code >> 5] |= 1 << (code & 31);
        }
    }

    has(code: number): boolean {
        if (code < 0 || code >= 128) return false;
        return (this.bits[code >> 5] & (1 << (code & 31))) !== 0;
    }

    addRange(from: number, to: number): void {
        for (let i = from; i <= to && i < 128; i++) {
            this.add(i);
        }
    }

    union(other: CharSet): void {
        this.bits[0] |= other.bits[0];
        this.bits[1] |= other.bits[1];
        this.bits[2] |= other.bits[2];
        this.bits[3] |= other.bits[3];
    }

    isDisjoint(other: CharSet): boolean {
        return (
            (this.bits[0] & other.bits[0]) === 0 &&
            (this.bits[1] & other.bits[1]) === 0 &&
            (this.bits[2] & other.bits[2]) === 0 &&
            (this.bits[3] & other.bits[3]) === 0
        );
    }

    isEmpty(): boolean {
        return (
            this.bits[0] === 0 &&
            this.bits[1] === 0 &&
            this.bits[2] === 0 &&
            this.bits[3] === 0
        );
    }

    clone(): CharSet {
        const c = new CharSet();
        c.bits.set(this.bits);
        return c;
    }
}

/**
 * Extract possible first characters from a regex source. Returns null if
 * the pattern is too complex to analyze conservatively.
 *
 * Handles: [abc], [a-z], [^...], literal chars, alternation (a|b),
 * optional quantifiers (?, *).
 */
export function regexFirstChars(re: RegExp): CharSet | null {
    const src = re.source;
    if (!src) return null;

    const result = new CharSet();
    // Split top-level alternation branches (unescaped | outside brackets)
    const branches = splitTopLevelAlternation(src);

    for (const branch of branches) {
        const branchChars = extractBranchFirstChars(branch);
        if (!branchChars) return null;
        result.union(branchChars);
    }

    return result.isEmpty() ? null : result;
}

function splitTopLevelAlternation(src: string): string[] {
    const branches: string[] = [];
    let depth = 0; // parens
    let inBracket = false;
    let start = 0;

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (ch === "\\" && i + 1 < src.length) {
            i++; // skip escaped char
            continue;
        }
        if (inBracket) {
            if (ch === "]") inBracket = false;
            continue;
        }
        if (ch === "[") {
            inBracket = true;
        } else if (ch === "(") {
            depth++;
        } else if (ch === ")") {
            depth--;
        } else if (ch === "|" && depth === 0) {
            branches.push(src.slice(start, i));
            start = i + 1;
        }
    }
    branches.push(src.slice(start));
    return branches;
}

/**
 * Extract first chars from a single alternation branch.
 * If the first atom is optional (?, *), continue to next atom.
 */
function extractBranchFirstChars(branch: string): CharSet | null {
    const result = new CharSet();
    let i = 0;

    while (i < branch.length) {
        const atomResult = extractAtomFirstChars(branch, i);
        if (!atomResult) return null;

        const { chars, end } = atomResult;
        result.union(chars);

        // Check if this atom has an optional quantifier (?, *, {0,...})
        if (end < branch.length) {
            const qch = branch[end];
            if (qch === "?" || qch === "*") {
                // Atom is optional — its chars are possible, continue to next atom
                i = end + 1;
                // Skip lazy modifier
                if (i < branch.length && branch[i] === "?") i++;
                continue;
            }
        }

        // Atom is mandatory — we're done
        break;
    }

    return result;
}

/**
 * Parse one atom at position i, return its possible chars and the end position.
 */
function extractAtomFirstChars(
    src: string,
    i: number,
): { chars: CharSet; end: number } | null {
    if (i >= src.length) return null;
    const ch = src[i];

    // Anchors — skip them (zero-width)
    if (ch === "^" || ch === "$") {
        return extractAtomFirstChars(src, i + 1);
    }

    // Character class [...]
    if (ch === "[") {
        const end = findClosingBracket(src, i);
        if (end < 0) return null;
        const chars = parseCharClass(src.slice(i + 1, end));
        if (!chars) return null;
        return { chars, end: end + 1 };
    }

    // Group (...)
    if (ch === "(") {
        const end = findClosingParen(src, i);
        if (end < 0) return null;
        let inner = src.slice(i + 1, end);
        // Strip non-capturing group prefix
        if (inner.startsWith("?:")) inner = inner.slice(2);
        else if (inner.startsWith("?=") || inner.startsWith("?!")) {
            // Lookahead — zero-width, skip
            return { chars: new CharSet(), end: end + 1 };
        }
        const chars = regexFirstCharsFromSource(inner);
        if (!chars) return null;
        return { chars, end: end + 1 };
    }

    // Escape sequences
    if (ch === "\\") {
        if (i + 1 >= src.length) return null;
        const next = src[i + 1];
        const chars = new CharSet();

        if (next === "d") {
            chars.addRange(48, 57); // 0-9
        } else if (next === "w") {
            chars.addRange(48, 57);
            chars.addRange(65, 90);
            chars.addRange(97, 122);
            chars.add(95); // _
        } else if (next === "s") {
            chars.add(9);
            chars.add(10);
            chars.add(13);
            chars.add(32);
        } else if (next === "D" || next === "W" || next === "S") {
            return null; // negated classes are complex
        } else {
            // Escaped literal
            chars.add(next.charCodeAt(0));
        }
        return { chars, end: i + 2 };
    }

    // Dot — matches anything
    if (ch === ".") return null;

    // Literal character
    const chars = new CharSet();
    chars.add(ch.charCodeAt(0));
    return { chars, end: i + 1 };
}

function regexFirstCharsFromSource(src: string): CharSet | null {
    const branches = splitTopLevelAlternation(src);
    const result = new CharSet();
    for (const branch of branches) {
        const chars = extractBranchFirstChars(branch);
        if (!chars) return null;
        result.union(chars);
    }
    return result;
}

function findClosingBracket(src: string, start: number): number {
    for (let i = start + 1; i < src.length; i++) {
        if (src[i] === "\\" && i + 1 < src.length) {
            i++;
            continue;
        }
        if (src[i] === "]") return i;
    }
    return -1;
}

function findClosingParen(src: string, start: number): number {
    let depth = 0;
    for (let i = start; i < src.length; i++) {
        if (src[i] === "\\" && i + 1 < src.length) {
            i++;
            continue;
        }
        if (src[i] === "(") depth++;
        else if (src[i] === ")") {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function parseCharClass(inner: string): CharSet | null {
    const negated = inner.startsWith("^");
    if (negated) inner = inner.slice(1);

    const chars = new CharSet();
    let i = 0;

    while (i < inner.length) {
        let code: number;
        if (inner[i] === "\\" && i + 1 < inner.length) {
            const next = inner[i + 1];
            if (next === "d") {
                chars.addRange(48, 57);
                i += 2;
                continue;
            } else if (next === "w") {
                chars.addRange(48, 57);
                chars.addRange(65, 90);
                chars.addRange(97, 122);
                chars.add(95);
                i += 2;
                continue;
            } else if (next === "s") {
                chars.add(9);
                chars.add(10);
                chars.add(13);
                chars.add(32);
                i += 2;
                continue;
            }
            // Map common escape sequences to their actual char codes
            const escapeMap: Record<string, number> = {
                n: 10,
                r: 13,
                t: 9,
                f: 12,
                v: 11,
                "0": 0,
            };
            code = escapeMap[next] ?? next.charCodeAt(0);
            i += 2;
        } else {
            code = inner.charCodeAt(i);
            i++;
        }

        // Check for range a-z
        if (i < inner.length - 1 && inner[i] === "-" && inner[i + 1] !== "]") {
            let endCode: number;
            if (inner[i + 1] === "\\" && i + 2 < inner.length) {
                endCode = inner.charCodeAt(i + 2);
                i += 3;
            } else {
                endCode = inner.charCodeAt(i + 1);
                i += 2;
            }
            chars.addRange(code, endCode);
        } else {
            chars.add(code);
        }
    }

    if (negated) {
        // Invert within ASCII printable range (32-126)
        const inverted = new CharSet();
        for (let c = 0; c < 128; c++) {
            if (!chars.has(c)) inverted.add(c);
        }
        return inverted;
    }

    return chars;
}

// --- FIRST set and NULLABLE computation ---

export interface FirstNullable {
    firstSets: Map<string, CharSet>;
    nullable: Map<string, boolean>;
}

/**
 * Compute FIRST sets and nullability for all rules in the grammar.
 * Uses fixed-point iteration for recursive grammars.
 */
export function computeFirstSets(
    ast: AST,
    analysis: AnalysisCache,
): FirstNullable {
    const firstSets = new Map<string, CharSet>();
    const nullable = new Map<string, boolean>();

    // Initialize
    for (const [name] of ast) {
        firstSets.set(name, new CharSet());
        nullable.set(name, false);
    }

    // Fixed-point iteration
    let changed = true;
    let iterations = 0;
    const maxIterations = ast.size * 3;

    while (changed && iterations++ < maxIterations) {
        changed = false;

        for (const [name, rule] of ast) {
            const oldFirst = firstSets.get(name)!.clone();
            const oldNullable = nullable.get(name)!;

            const exprFirst = exprFirstSet(rule.expression, firstSets, nullable, ast);
            const exprNullable = exprIsNullable(rule.expression, nullable, ast);

            firstSets.get(name)!.union(exprFirst);
            if (exprNullable && !oldNullable) {
                nullable.set(name, true);
                changed = true;
            }

            // Check if first set changed
            const newFirst = firstSets.get(name)!;
            for (let w = 0; w < 4; w++) {
                if (
                    (oldFirst as any).bits[w] !== (newFirst as any).bits[w]
                ) {
                    changed = true;
                    break;
                }
            }
        }
    }

    return { firstSets, nullable };
}

function exprFirstSet(
    expr: Expression,
    firstSets: Map<string, CharSet>,
    nullable: Map<string, boolean>,
    ast: AST,
): CharSet {
    if (!expr?.type) return new CharSet();

    switch (expr.type) {
        case "literal": {
            const s = expr.value as string;
            const cs = new CharSet();
            if (s.length > 0) cs.add(s.charCodeAt(0));
            return cs;
        }
        case "regex": {
            const cs = regexFirstChars(expr.value as RegExp);
            return cs ?? new CharSet();
        }
        case "nonterminal": {
            const name = expr.value as string;
            return firstSets.get(name)?.clone() ?? new CharSet();
        }
        case "epsilon":
            return new CharSet();
        case "group":
            return exprFirstSet(
                expr.value as Expression,
                firstSets,
                nullable,
                ast,
            );
        case "optionalWhitespace":
            return exprFirstSet(
                expr.value as unknown as Expression,
                firstSets,
                nullable,
                ast,
            );
        case "optional":
        case "many":
            return exprFirstSet(
                expr.value as Expression,
                firstSets,
                nullable,
                ast,
            );
        case "many1":
            return exprFirstSet(
                expr.value as Expression,
                firstSets,
                nullable,
                ast,
            );
        case "skip":
        case "next": {
            // sequence of two: FIRST(A) ∪ (if nullable(A) then FIRST(B))
            const [a, b] = expr.value as [Expression, Expression];
            const cs = exprFirstSet(a, firstSets, nullable, ast);
            if (exprIsNullable(a, nullable, ast)) {
                cs.union(exprFirstSet(b, firstSets, nullable, ast));
            }
            return cs;
        }
        case "minus": {
            const [a] = expr.value as [Expression, Expression];
            return exprFirstSet(a, firstSets, nullable, ast);
        }
        case "concatenation": {
            const elems = expr.value as Expression[];
            const cs = new CharSet();
            for (const elem of elems) {
                cs.union(exprFirstSet(elem, firstSets, nullable, ast));
                if (!exprIsNullable(elem, nullable, ast)) break;
            }
            return cs;
        }
        case "alternation": {
            const alts = expr.value as Expression[];
            const cs = new CharSet();
            for (const alt of alts) {
                cs.union(exprFirstSet(alt, firstSets, nullable, ast));
            }
            return cs;
        }
    }
    return new CharSet();
}

function exprIsNullable(
    expr: Expression,
    nullable: Map<string, boolean>,
    ast: AST,
): boolean {
    if (!expr?.type) return false;

    switch (expr.type) {
        case "literal":
            return (expr.value as string).length === 0;
        case "regex":
            return false;
        case "nonterminal":
            return nullable.get(expr.value as string) ?? false;
        case "epsilon":
            return true;
        case "group":
        case "optionalWhitespace":
            return exprIsNullable(expr.value as unknown as Expression, nullable, ast);
        case "optional":
        case "many":
            return true;
        case "many1":
            return exprIsNullable(expr.value as Expression, nullable, ast);
        case "skip":
        case "next": {
            const [a, b] = expr.value as [Expression, Expression];
            return (
                exprIsNullable(a, nullable, ast) &&
                exprIsNullable(b, nullable, ast)
            );
        }
        case "minus":
            return false;
        case "concatenation": {
            return (expr.value as Expression[]).every((e) =>
                exprIsNullable(e, nullable, ast),
            );
        }
        case "alternation": {
            return (expr.value as Expression[]).some((e) =>
                exprIsNullable(e, nullable, ast),
            );
        }
    }
    return false;
}

// --- Dispatch table ---

export interface DispatchTable {
    table: Int8Array; // 128 entries: charCode → alternative index, -1 = no match
    isPerfect: boolean; // true if all alternatives are covered disjointly
}

/**
 * Build a dispatch table for an alternation node. Returns null if any
 * alternative is nullable or has an empty/unknown FIRST set.
 */
export function buildDispatchTable(
    alternatives: Expression[],
    firstSets: Map<string, CharSet>,
    nullable: Map<string, boolean>,
): DispatchTable | null {
    const altFirstSets: CharSet[] = [];

    for (const alt of alternatives) {
        // Reject if any alternative is nullable
        if (exprIsNullable(alt, nullable, new Map())) return null;

        const cs = exprFirstSet(alt, firstSets, nullable, new Map());
        if (cs.isEmpty()) return null;
        altFirstSets.push(cs);
    }

    // Check pairwise disjointness
    for (let i = 0; i < altFirstSets.length; i++) {
        for (let j = i + 1; j < altFirstSets.length; j++) {
            if (!altFirstSets[i].isDisjoint(altFirstSets[j])) {
                return null;
            }
        }
    }

    // Build table
    const table = new Int8Array(128).fill(-1);
    for (let i = 0; i < altFirstSets.length; i++) {
        for (let ch = 0; ch < 128; ch++) {
            if (altFirstSets[i].has(ch)) {
                table[ch] = i;
            }
        }
    }

    return { table, isPerfect: true };
}
