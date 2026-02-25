/* eslint-disable @typescript-eslint/no-explicit-any */
import { createParserContext, ParserState } from "./state.js";
import { getLazyParser, Parser } from "./index.js";

const MAX_LINES = 4;
const MAX_LINE_LENGTH = 80;

export const summarizeLine = (
    line: string,
    maxLength: number = MAX_LINE_LENGTH,
) => {
    const newLine = line.indexOf("\n");
    const length = Math.min(
        line.length,
        newLine === -1 ? line.length : newLine,
    );

    if (length <= MAX_LINE_LENGTH) {
        return line;
    } else {
        return line.slice(0, maxLength) + "...";
    }
};

export function addCursor(
    state: ParserState<unknown>,
    cursor: string = "^",
    error: boolean = false,
): string {
    const lines = state.src.split("\n");
    const lineIdx = Math.min(lines.length - 1, state.getLineNumber());
    const startIdx = Math.max(lineIdx - MAX_LINES, 0);
    const endIdx = Math.min(lineIdx + MAX_LINES + 1, lines.length);

    const lineSummaries = lines.slice(startIdx, endIdx);

    if (cursor) {
        const cursorLine = " ".repeat(state.getColumnNumber()) + cursor;
        lineSummaries.splice(lineIdx - startIdx + 1, 0, cursorLine);
    }

    const resultLines = lineSummaries.map((line, idx) => {
        const lineNum = startIdx + idx + 1;
        const paddedLine = `      ${lineNum}| ${line}`;
        return paddedLine;
    });

    return resultLines.join("\n");
}

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

export function statePrint(
    state: ParserState<unknown>,
    name: string = "",
    _parserString: string = "",
): string {
    const parserString = String(state.value);
    const finished = state.offset >= state.src.length;

    const stateSymbol = !state.isError ? (finished ? "done" : "ok") : "err";
    const stateString = `[${stateSymbol}]`;

    const header = `${stateString} ${name} offset=${state.offset} value=${parserString}`;

    const body =
        state.offset >= state.src.length
            ? addCursor(state, "", state.isError)
            : addCursor(state, "^", state.isError);

    return `${header}\n${body}`;
}

export function parserDebug<T>(
    parser: Parser<T>,
    name: string = "",
    recursivePrint: boolean = false,
    logger: (...s: unknown[]) => void = console.log,
) {
    const debug = (state: ParserState<T>) => {
        const newState = parser.parser(state);

        const parserString = recursivePrint
            ? parserPrint(parser as Parser<unknown>)
            : (parser.context.name ?? "");
        const s = statePrint(
            newState as ParserState<unknown>,
            name,
            parserString,
        );

        logger(s);

        return newState;
    };
    return new Parser(debug, createParserContext("debug", parser, logger));
}
