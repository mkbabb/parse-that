/* eslint-disable @typescript-eslint/no-explicit-any */
import { createParserContext, ParserState } from "./state.js";
import { getLazyParser } from "./lazy.js";
import { Parser } from "./parser.js";
import { bold, dim, italic, red, green, yellow, cyan, gray, bgRed, bgGreen } from "./ansi.js";
import { isDiagnosticsEnabled, getLastExpected, getLastSuggestions, getLastSecondarySpans } from "./utils.js";
import type { Suggestion, SecondarySpan, Diagnostic } from "./utils.js";

const MAX_LINES = 4;
const MAX_LINE_WIDTH = 74; // 80 - 6 for line number prefix

let debugDepth = 0;

export function summarizeLine(line: string, columnNum: number = 0): string {
    const trimmed = line.trimEnd();
    const len = trimmed.length;
    const half = Math.floor(MAX_LINE_WIDTH / 2);

    if (len <= MAX_LINE_WIDTH) return trimmed;

    const mid = Math.min(columnNum, len);
    let start = Math.min(Math.max(mid - half, 0), len);
    let end = Math.min(mid + half, len);

    if (start === 0) {
        return trimmed.slice(0, end) + "...";
    } else if (end >= len) {
        return "..." + trimmed.slice(start);
    }
    return "..." + trimmed.slice(start, end) + "...";
}

export function formatExpected(expected: readonly string[]): string {
    switch (expected.length) {
        case 0:
            return "";
        case 1:
            return `expected ${expected[0]}`;
        case 2:
            return `expected ${expected[0]} or ${expected[1]}`;
        default: {
            const last = expected[expected.length - 1];
            const rest = expected.slice(0, -1).join(", ");
            return `expected ${rest}, or ${last}`;
        }
    }
}

function lineNumberWidth(maxLine: number): number {
    return String(maxLine).length;
}

export function addCursor(
    state: ParserState<unknown>,
    cursor: string = "^",
    error: boolean = false,
): string {
    const lines = state.src.split("\n");
    const { line: lineNum, column: columnNum } = state.getLineAndColumn
        ? state.getLineAndColumn()
        : { line: state.getLineNumber() + 1, column: state.getColumnNumber() };

    const lineIdx = lineNum - 1; // 0-based index
    const startIdx = Math.max(lineIdx - MAX_LINES, 0);
    const endIdx = Math.min(lineIdx + MAX_LINES + 1, lines.length);

    const lnWidth = lineNumberWidth(endIdx);

    const result: string[] = [];

    for (let i = startIdx; i < endIdx; i++) {
        const ln = i + 1; // 1-based display
        const isActive = i === lineIdx;
        const lineContent = summarizeLine(lines[i], isActive ? columnNum : 0);
        const pipe = gray("|");

        if (isActive) {
            const lnStr = bold(String(ln).padStart(lnWidth));
            const lineDisplay = error
                ? bold(red(lineContent))
                : bold(green(lineContent));
            result.push(` ${lnStr} ${pipe} ${lineDisplay}`);

            if (cursor) {
                const pad = " ".repeat(lnWidth + 4 + columnNum);
                const cursorStr = error ? red(cursor) : green(cursor);
                result.push(`${pad}${cursorStr}`);
            }
        } else {
            const lnStr = gray(String(ln).padStart(lnWidth));
            result.push(` ${lnStr} ${pipe} ${lineContent}`);
        }
    }

    return result.join("\n");
}

function formatSecondarySpans(
    src: string,
    spans: readonly SecondarySpan[],
): string {
    const lines = src.split("\n");
    const result: string[] = [];

    for (const span of spans) {
        // Find line containing this offset
        let offsetAcc = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineEnd = offsetAcc + lines[i].length + 1; // +1 for newline
            if (span.offset < lineEnd) {
                const col = span.offset - offsetAcc;
                const lnWidth = Math.max(String(i + 1).length, 3);
                const pipe = gray("|");
                result.push(` ${" ".repeat(lnWidth)} ${pipe}`);
                result.push(
                    ` ${gray(String(i + 1).padStart(lnWidth))} ${pipe} ${lines[i]}`,
                );
                const markerPad = " ".repeat(lnWidth + 4 + col);
                result.push(`${markerPad}${cyan("-")} ${cyan(span.label)}`);
                break;
            }
            offsetAcc = lineEnd;
        }
    }

    return result.join("\n");
}

function formatSuggestions(suggestions: readonly Suggestion[]): string {
    const result: string[] = [];

    for (const s of suggestions) {
        const prefix =
            s.kind === "unclosed-delimiter"
                ? bold(yellow("help"))
                : bold(cyan("note"));
        result.push(`   = ${prefix}: ${s.message}`);
    }

    return result.join("\n");
}

export function statePrint(
    state: ParserState<unknown>,
    name: string = "",
    parserString: string = "",
): string {
    const finished = state.offset >= state.src.length;
    const isError = state.isError;

    // Badge
    let badge: string;
    if (isError) {
        badge = bgRed(bold(" Err x "));
    } else if (finished) {
        badge = bgGreen(bold(" Done \u221a "));
    } else {
        badge = bgGreen(bold(" Ok \u221a "));
    }

    // Header parts
    const namePart = name ? `    ${yellow(italic(name))}` : "";
    const offsetPart = `    ${green(String(state.offset))}`;
    const parserPart = parserString ? `    ${green(parserString)}` : "";

    const header = `${badge}${namePart}${offsetPart}${parserPart}`;

    // Body — source context with cursor
    const cursor = isError ? "^^^" : finished ? "" : "^";
    const body = addCursor(state, cursor, isError);

    let output = `${header}\n${body}`;

    // Diagnostic extras (only when diagnostics enabled)
    if (isError && isDiagnosticsEnabled()) {
        const expected = getLastExpected();
        if (expected.length > 0) {
            output += `\n   ${cyan(formatExpected(expected))}`;
        }

        const secondarySpans = getLastSecondarySpans();
        if (secondarySpans.length > 0) {
            output += `\n${formatSecondarySpans(state.src, secondarySpans)}`;
        }

        const suggestions = getLastSuggestions();
        if (suggestions.length > 0) {
            output += `\n${formatSuggestions(suggestions)}`;
        }
    }

    return output;
}

// ── Diagnostic formatting (for error recovery) ─────────────

/**
 * Format a single collected Diagnostic into compiler-style output,
 * using the same visual style as statePrint but from a snapshot.
 */
export function formatDiagnostic(d: Diagnostic, src: string): string {
    const badge = bgRed(bold(" Err x "));
    const offsetStr = green(String(d.furthestOffset));
    const locStr = dim(`${d.line}:${d.column}`);
    const header = `${badge}    ${locStr}    ${offsetStr}`;

    // Build a ParserState-like object for addCursor
    const errorState = new ParserState(src, undefined, d.furthestOffset, true);
    const body = addCursor(errorState, "^^^", true);

    let output = `${header}\n${body}`;

    if (d.expected.length > 0) {
        output += `\n   ${cyan(formatExpected(d.expected))}`;
    }

    if (d.secondarySpans.length > 0) {
        output += `\n${formatSecondarySpans(src, d.secondarySpans)}`;
    }

    if (d.suggestions.length > 0) {
        output += `\n${formatSuggestions(d.suggestions)}`;
    }

    if (d.found) {
        output += `\n   ${dim("found")} ${red(`\`${d.found}\``)}`;
    }

    return output;
}

/**
 * Format all collected diagnostics with blank-line separators
 * and a summary line.
 */
export function formatAllDiagnostics(diagnostics: readonly Diagnostic[], src: string): string {
    if (diagnostics.length === 0) return "";

    const parts = diagnostics.map((d) => formatDiagnostic(d, src));
    const summary = bold(red(`${diagnostics.length} error${diagnostics.length === 1 ? "" : "s"} found`));
    return parts.join("\n\n") + `\n\n${summary}`;
}

// ── Parser tree printing (unchanged from original) ──────────

const PARSER_STRINGS = new Map<number, string>();

export function parserPrint(parser: Parser<unknown>): string {
    if (PARSER_STRINGS.has(parser.id)) {
        return PARSER_STRINGS.get(parser.id)!;
    }

    const print = (
        innerParser: Parser<any>,
        id?: number,
    ): string => {
        if (PARSER_STRINGS.has(innerParser.id)) {
            return PARSER_STRINGS.get(innerParser.id)!;
        }

        const { name, args, parser: innerInnerParser } = innerParser.context;
        const parserString =
            innerInnerParser != null
                ? print(innerInnerParser as Parser<unknown>, id)
                : "unknown";

        const s = ((): string | undefined => {
            switch (name) {
                case "string":
                    return `"${args![0]}"`;
                case "regex":
                case "regexConcat":
                case "regexWrap":
                    return `${args![0]}`;
                case "wrap":
                case "trim": {
                    const [left, right] = args!;
                    return `${print(left, id)} ${parserString} ${print(right, id)}`;
                }
                case "trimWhitespace":
                    return `${parserString}?w`;
                case "not":
                    return `!${parserString}`;
                case "opt":
                    return `${parserString}?`;
                case "next": {
                    const [next] = args!;
                    return `${parserString} >> ${print(next, id)}`;
                }
                case "skip": {
                    const [skip] = args!;
                    return `${parserString} << ${print(skip, id)}`;
                }
                case "map":
                    return parserString;
                case "all":
                case "then": {
                    const items = args!.map((x: Parser<unknown>) =>
                        print(x, id),
                    );
                    return `[${items.join(", ")}]`;
                }
                case "any":
                case "or": {
                    const items = args!.map((x: Parser<unknown>) =>
                        print(x, id),
                    );
                    return items.join(" | ");
                }
                case "many": {
                    const [min, max] = args!;
                    const bounds =
                        max === Infinity ? `${min},` : `${min},${max}`;
                    return `${parserString} {${bounds}}`;
                }
                case "sepBy":
                    return `${parserString} sepBy ${print(args![0], id)}`;
                case "lazy": {
                    const [lazy] = args!;
                    const p = getLazyParser(lazy);

                    if (!id) {
                        const s = print(p as Parser<unknown>, p.id);
                        PARSER_STRINGS.set(p.id, s);
                        return s;
                    } else {
                        return name;
                    }
                }
                case "debug":
                    return parserString;
                default:
                    return undefined;
            }
        })();

        const result = s ?? name ?? "unknown";
        if (id) {
            PARSER_STRINGS.set(innerParser.id, result);
        }
        return result;
    };

    const s = print(parser);
    PARSER_STRINGS.set(parser.id, s);

    return s;
}

export function parserDebug<T>(
    parser: Parser<T>,
    name: string = "",
    recursivePrint: boolean = false,
    logger: (...s: unknown[]) => void = console.error,
) {
    const debug = (state: ParserState<T>) => {
        debugDepth++;
        const indentStr = "  ".repeat(debugDepth - 1);

        const newState = parser.parser(state);

        const parserString = recursivePrint
            ? parserPrint(parser as Parser<unknown>)
            : (parser.context.name ?? "");
        const s = statePrint(
            newState as ParserState<unknown>,
            name,
            parserString,
        );

        // Indent each line
        const indented = s
            .split("\n")
            .map((line) => indentStr + line)
            .join("\n");
        logger(indented);

        debugDepth--;
        return newState;
    };
    return new Parser(debug, createParserContext("debug", parser, logger));
}
