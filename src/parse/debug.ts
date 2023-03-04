import { createParserContext, ParserState } from "./state";
import { getLazyParser, Parser } from ".";

import { Options, RequiredOptions } from "prettier";
import { Doc } from "prettier";
import { builders as b, printer } from "prettier/doc";
import chalk from "chalk";

const MAX_LINES = 4;
const MAX_LINE_LENGTH = 80;

const defaultGroupOptions = {};

const defaultOptions = {
    printWidth: 30,
    tabWidth: 4,
    useTabs: false,
} as RequiredOptions;

export function prettierPrint(doc: Doc) {
    return printer.printDocToString(doc, defaultOptions).formatted;
}

export const summarizeLine = (line: string, maxLength: number = MAX_LINE_LENGTH) => {
    const newLine = line.indexOf("\n");
    const length = Math.min(line.length, newLine === -1 ? line.length : newLine);

    if (length <= MAX_LINE_LENGTH) {
        return line;
    } else {
        return line.slice(0, maxLength) + "...";
    }
};

export function addCursor(
    state: ParserState<any>,
    cursor: string = "^",
    error: boolean = false
): string {
    const color = (error ? chalk.red : chalk.green).bold;

    const lines = state.src.split("\n");
    const lineIdx = Math.min(lines.length - 1, state.getLineNumber());
    const startIdx = Math.max(lineIdx - MAX_LINES, 0);
    const endIdx = Math.min(lineIdx + MAX_LINES + 1, lines.length);

    const lineSummaries = lines.slice(startIdx, endIdx);

    if (cursor) {
        const cursorLine = " ".repeat(state.getColumnNumber()) + color(cursor);
        lineSummaries.splice(lineIdx - startIdx + 1, 0, cursorLine);
    }

    const resultLines = lineSummaries.map((line, idx) => {
        const lineNum = startIdx + idx + 1;
        let paddedLineNum = color.reset.black(String(lineNum));

        line = lineNum === lineIdx + 1 ? color(line) : line;
        const paddedLine = `      ${paddedLineNum}| ${line}`;

        return paddedLine;
    });

    return resultLines.join("\n");
}

const group = (docs: Doc, groupOptions: Options = {}) => {
    return b.group(docs, { ...defaultOptions, ...groupOptions } as any);
};

const opStyle = (op: string) => chalk.gray(op);
const PARSER_STRINGS = new Map<number, any>();

export function parserPrint(parser: Parser<any>) {
    if (PARSER_STRINGS.has(parser.id)) {
        return PARSER_STRINGS.get(parser.id);
    }

    const print = (innerParser: Parser<any>, id?: number) => {
        if (PARSER_STRINGS.has(innerParser.id)) {
            return PARSER_STRINGS.get(innerParser.id);
        }

        const { name, args, parser: innerInnerParser } = innerParser.context;
        const parserString =
            innerInnerParser != null
                ? print(innerInnerParser, id)
                : chalk.red.bold("unknown");

        let s = (() => {
            switch (name) {
                case "string":
                    return chalk.yellow(`"${args[0]}"`);
                case "regex":
                case "regexConcat":
                case "regexWrap":
                    return chalk.redBright(`${args[0]}`);
                case "wrap":
                case "trim": {
                    const [left, right] = args;
                    return group([
                        print(left, id),
                        b.indent([b.softline, parserString]),
                        b.softline,
                        print(right, id),
                    ]);
                }
                case "trimWhitespace":
                    return group([parserString, opStyle("?w")]);
                case "not":
                    return group(["!", parserString]);
                case "opt":
                    return group([parserString, opStyle("?")]);
                case "next":
                    const [next] = args;
                    return group([parserString, opStyle(" >> "), print(next, id)]);
                case "skip":
                    const [skip] = args;
                    return group([parserString, opStyle(" << "), print(skip, id)]);

                case "map":
                    return parserString;
                case "all":
                case "then": {
                    const delim = opStyle(", ");
                    return group([
                        "[",
                        b.indent([
                            b.softline,
                            b.join(
                                [delim, b.softline],
                                args.map((x) => print(x, id))
                            ),
                        ]),
                        b.softline,
                        "]",
                    ]);
                }
                case "any":
                case "or": {
                    const delim = opStyle("| ");
                    return group([
                        [
                            b.join(
                                [b.softline, b.ifBreak(delim, " " + delim)],
                                args.map((x) => print(x, id))
                            ),
                        ],
                    ]);
                }
                case "many":
                    const [min, max] = args;
                    let bounds = max === Infinity ? `${min},` : `${min},${max}`;
                    bounds = chalk.bold.gray(` {${bounds}}`);
                    return group([parserString, bounds]);
                case "sepBy":
                    return group([
                        parserString,
                        b.indent([" sepBy ", print(args[0], id)]),
                    ]);
                case "lazy": {
                    const [lazy] = args;
                    const p = getLazyParser(lazy);

                    if (!id) {
                        const s = print(p, p.id);
                        PARSER_STRINGS.set(p.id, s);
                        return s;
                    } else {
                        return chalk.bold.blue(name);
                    }
                }
                case "debug":
                    return parserString;
            }
        })();
        s ??= chalk.red.bold(name);
        if (id) {
            PARSER_STRINGS.set(innerParser.id, s);
        }
        return s;
    };

    const doc = print(parser);
    const s = prettierPrint(doc);
    PARSER_STRINGS.set(parser.id, s);

    return s;
}

export function statePrint(
    state: ParserState<any>,
    name: string = "",
    parserString: string = ""
) {
    const stateBgColor = !state.isError ? chalk.bgGreen : chalk.bgRed;
    const stateColor = !state.isError ? chalk.green : chalk.red;

    const finished = state.offset >= state.src.length;

    const stateSymbol = !state.isError ? (finished ? "🎉" : "✓") : "ｘ";
    const stateName = !state.isError ? (finished ? "Done" : "Ok") : "Err";
    const stateString = " " + stateName + " " + stateSymbol + " ";

    const header = group([
        stateBgColor.bold(stateString),
        stateColor(`\t${name}\t${state.offset}`),
        b.softline,
        "\t" + chalk.yellow(parserString),
    ]);

    const body = (() => {
        if (state.offset >= state.src.length) {
            return chalk.bold.greenBright(addCursor(state, "", state.isError));
        }
        return addCursor(state, "^", state.isError);
    })();

    const headerBody = group([header, b.hardline, b.indent([body])]);

    return prettierPrint(headerBody);
}

export function parserDebug<T>(
    parser: Parser<T>,
    name: string = "",
    recursivePrint: boolean = false,
    logger: (...s: any[]) => void = console.log
) {
    const debug = (state: ParserState<T>) => {
        const newState = parser.parser(state);

        const parserString = recursivePrint ? parserPrint(parser) : parser.context.name;
        const s = statePrint(newState, name, parserString);

        logger(s);

        return newState;
    };
    return new Parser(debug, createParserContext("debug", parser, logger));
}
