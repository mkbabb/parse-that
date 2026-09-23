import {
    choice,
    compile,
    lazy,
    literal,
    sequence,
    sourceLeaf,
    type Compiled,
    type Grammar,
    type Span,
    type Spanned,
} from "../s/kernel.js";
import {
    cssNameEnd,
    cssNumberEnd,
    jsonNumberEnd,
    jsonStringEnd,
} from "../l/fixtures.js";
import {
    quotedEnd,
    statementSyncEnd,
    triviaEnd,
    urlBodyEnd,
} from "./fixtures.js";

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

export type JsonProduct = Spanned<JsonValue>;

export const TRIVIA_EXPRESSION = /[ \t\r\n]+/;
export const JSON_STRING_EXPRESSION =
    /"(?:[^"\\\u0000-\u001F]|\\(?:["\\/bfnrt]|u[0-9A-Fa-f]{4}))*"/;
export const JSON_NUMBER_EXPRESSION =
    /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
export const NAME_EXPRESSION =
    /(?:[-_A-Za-z0-9\u0080-\uFFFF]|\\(?:[0-9A-Fa-f]{1,6}(?:\r\n|[ \t\n\f\r])?|[^\n\f\r]|$))+/;
export const NUMBER_EXPRESSION =
    /[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?/;
export const QUOTED_EXPRESSION =
    /"(?:[^"\\\u0000\n\f\r]|\\(?:\r\n|[^\r]))*"|'(?:[^'\\\u0000\n\f\r]|\\(?:\r\n|[^\r]))*'/;
export const URL_BODY_EXPRESSION = /[^\u0000\t\n\f\r "'()]+/;
export const STATEMENT_SYNC_EXPRESSION = /[^;]*;/;

const trivia = choice(
    sourceLeaf(
        `/${TRIVIA_EXPRESSION.source}/${TRIVIA_EXPRESSION.flags}`,
        triviaEnd,
        () => undefined,
        [9, 10, 13, 32],
    ),
    literal("").map(() => undefined),
);
const comma = trivia.next(literal(",")).skip(trivia);
const colon = trivia.next(literal(":")).skip(trivia);
const jsonString = sourceLeaf(
    `/${JSON_STRING_EXPRESSION.source}/${JSON_STRING_EXPRESSION.flags}`,
    jsonStringEnd,
    (source, start, end) => JSON.parse(source.substring(start, end)) as string,
    [34],
);
const jsonNumber = sourceLeaf(
    `/${JSON_NUMBER_EXPRESSION.source}/${JSON_NUMBER_EXPRESSION.flags}`,
    jsonNumberEnd,
    (source, start, end) => Number(source.substring(start, end)),
    [45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
);
const jsonBoolean = choice(literal("true"), literal("false"))
    .map(value => value === "true");
const jsonNull = literal("null").map(() => null);
let jsonValue!: Grammar<JsonValue>;
const jsonArray: Grammar<JsonValue[]> = lazy(() =>
    literal("[")
        .next(trivia)
        .next(jsonValue.sepBy(comma))
        .skip(trivia)
        .skip(literal("]"))
);
const jsonObject: Grammar<{ [key: string]: JsonValue }> = lazy(() =>
    literal("{")
        .next(trivia)
        .next(
            jsonString
                .skip(colon)
                .then(jsonValue)
                .sepBy(comma),
        )
        .skip(trivia)
        .skip(literal("}"))
        .map(entries => Object.fromEntries(entries)),
);
jsonValue = choice(
    jsonObject,
    jsonArray,
    jsonString,
    jsonNumber,
    jsonBoolean,
    jsonNull,
);

export const jsonProductGrammar = trivia
    .next(jsonValue.spanned())
    .skip(trivia)
    .eof();

export type FixtureAtom =
    | Readonly<{ kind: "name"; raw: string }>
    | Readonly<{ kind: "number"; value: number }>
    | Readonly<{ kind: "percentage"; value: number }>
    | Readonly<{ kind: "dimension"; value: number; unit: string }>
    | Readonly<{ kind: "string"; raw: string }>
    | Readonly<{ kind: "url"; raw: string }>
    | Readonly<{
        kind: "call";
        name: string;
        body: readonly Spanned<FixtureAtom>[];
    }>;
export type FixtureStatement =
    | Readonly<{
        kind: "statement";
        name: Spanned<string>;
        body: readonly Spanned<FixtureAtom>[];
    }>
    | Readonly<{ kind: "opaque" }>;
export type FixtureProduct = readonly Spanned<FixtureStatement>[];

const name = sourceLeaf(
    `/${NAME_EXPRESSION.source}/${NAME_EXPRESSION.flags}`,
    cssNameEnd,
);
const magnitude = sourceLeaf(
    `/${NUMBER_EXPRESSION.source}/${NUMBER_EXPRESSION.flags}`,
    cssNumberEnd,
    (source, start, end) => Number(source.substring(start, end)),
    [43, 45, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
);
const quoted = sourceLeaf(
    `/${QUOTED_EXPRESSION.source}/${QUOTED_EXPRESSION.flags}`,
    quotedEnd,
);
const urlBody = sourceLeaf(
    `/${URL_BODY_EXPRESSION.source}/${URL_BODY_EXPRESSION.flags}`,
    urlBodyEnd,
);
const unit = name.spanned();
const number = magnitude
    .map(value => ({ kind: "number", value }) as const)
    .spanned();
const percentage = magnitude
    .skip(literal("%"))
    .map(value => ({ kind: "percentage", value }) as const)
    .spanned();
const dimension = magnitude
    .then(unit)
    .map(([value, suffix]) => ({
        kind: "dimension",
        value,
        unit: suffix.value,
    }) as const)
    .spanned();
const string = quoted
    .map(raw => ({ kind: "string", raw }) as const)
    .spanned();
const url = literal("url(")
    .next(trivia)
    .next(urlBody)
    .skip(trivia)
    .skip(literal(")"))
    .map(raw => ({ kind: "url", raw }) as const)
    .spanned();
const bareName = name
    .map(raw => ({ kind: "name", raw }) as const)
    .spanned();
let fixtureAtom!: Grammar<Spanned<FixtureAtom>>;
const call: Grammar<Spanned<FixtureAtom>> = lazy(() =>
    name
        .then(
            literal("(")
                .next(trivia)
                .next(fixtureAtom.skip(trivia).many())
                .skip(literal(")")),
        )
        .map(([callee, body]) => ({
            kind: "call",
            name: callee,
            body,
        }) as const)
        .spanned()
);
fixtureAtom = choice(
    call,
    url,
    percentage,
    dimension,
    number,
    string,
    bareName,
);

const statement = name
    .spanned()
    .skip(trivia)
    .skip(literal(":"))
    .skip(trivia)
    .then(fixtureAtom.skip(trivia).many(1))
    .skip(literal(";"))
    .map(([statementName, body]) => ({
        kind: "statement",
        name: statementName,
        body,
    }) as const);
const opaque: Readonly<{ kind: "opaque" }> = Object.freeze({
    kind: "opaque",
});
const sync = sourceLeaf(
    `/${STATEMENT_SYNC_EXPRESSION.source}/${STATEMENT_SYNC_EXPRESSION.flags}`,
    statementSyncEnd,
);

export const fixtureProductGrammar: Grammar<FixtureProduct> = trivia
    .next(
        statement
            .recover(sync, opaque)
            .spanned()
            .skip(trivia)
            .many(),
    )
    .eof();

export function compileJsonProduct(
    nestingLimit?: number,
): Compiled<JsonProduct> {
    return compile(jsonProductGrammar, nestingLimit);
}

export function compileFixtureProduct(
    nestingLimit?: number,
): Compiled<FixtureProduct> {
    return compile(fixtureProductGrammar, nestingLimit);
}

export function span(start: number, end: number): Span {
    return { start, end };
}
