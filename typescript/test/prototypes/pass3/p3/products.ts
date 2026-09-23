import {
    choice,
    ClosureParser,
    lazy,
    literal,
    regex,
    type Closure,
    type Spanned,
} from "./closure.js";
import {
    JSON_NUMBER_EXPRESSION,
    JSON_STRING_EXPRESSION,
    NAME_EXPRESSION,
    NUMBER_EXPRESSION,
    QUOTED_EXPRESSION,
    STATEMENT_SYNC_EXPRESSION,
    TRIVIA_EXPRESSION,
    URL_BODY_EXPRESSION,
    type FixtureAtom,
    type FixtureProduct,
    type FixtureStatement,
    type JsonProduct,
    type JsonValue,
} from "../products/products.js";

function trivia(): Closure<undefined> {
    return regex(TRIVIA_EXPRESSION)
        .many()
        .map(() => undefined);
}

function jsonGrammar(): Closure<JsonProduct> {
    const space = trivia();
    const comma = space.next(literal(",")).skip(space);
    const colon = space.next(literal(":")).skip(space);
    const string = regex(JSON_STRING_EXPRESSION)
        .map(value => JSON.parse(value as string) as string);
    const number = regex(JSON_NUMBER_EXPRESSION)
        .map(value => Number(value));
    const boolean = choice(literal("true"), literal("false"))
        .map(value => value === "true");
    const nil = literal("null").map(() => null);
    let value!: Closure<JsonValue>;
    const array: Closure<JsonValue[]> = lazy(() =>
        literal("[")
            .next(space)
            .next(value.sepBy(comma))
            .skip(space)
            .skip(literal("]"))
    );
    const object: Closure<{ [key: string]: JsonValue }> = lazy(() =>
        literal("{")
            .next(space)
            .next(string.skip(colon).then(value).sepBy(comma))
            .skip(space)
            .skip(literal("}"))
            .map(entries => Object.fromEntries(entries))
    );
    value = choice(object, array, string, number, boolean, nil);
    return space.next(value.spanned()).skip(space).eof();
}

function fixtureGrammar(): Closure<FixtureProduct> {
    const space = trivia();
    const name = regex(NAME_EXPRESSION).map(value => value as string);
    const magnitude = regex(NUMBER_EXPRESSION).map(value => Number(value));
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
    const string = regex(QUOTED_EXPRESSION)
        .map(raw => ({ kind: "string", raw: raw as string }) as const)
        .spanned();
    const url = literal("url(")
        .next(space)
        .next(regex(URL_BODY_EXPRESSION))
        .skip(space)
        .skip(literal(")"))
        .map(raw => ({ kind: "url", raw: raw as string }) as const)
        .spanned();
    const bareName = name
        .map(raw => ({ kind: "name", raw }) as const)
        .spanned();
    let atom!: Closure<Spanned<FixtureAtom>>;
    const call: Closure<Spanned<FixtureAtom>> = lazy(() =>
        name
            .then(
                literal("(")
                    .next(space)
                    .next(atom.skip(space).many())
                    .skip(literal(")")),
            )
            .map(([callee, body]) => ({
                kind: "call",
                name: callee,
                body,
            }) as const)
            .spanned()
    );
    atom = choice(
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
        .skip(space)
        .skip(literal(":"))
        .skip(space)
        .then(atom.skip(space).many(1))
        .skip(literal(";"))
        .map(([statementName, body]) => ({
            kind: "statement",
            name: statementName,
            body,
        }) as FixtureStatement);
    const opaque = Object.freeze({ kind: "opaque" } as const);
    const sync = regex(STATEMENT_SYNC_EXPRESSION);
    return space
        .next(
            statement
                .recover(sync, opaque)
                .spanned()
                .skip(space)
                .many(),
        )
        .eof();
}

export function buildJsonClosure(nestingLimit?: number): ClosureParser<JsonProduct> {
    return new ClosureParser(jsonGrammar(), nestingLimit);
}

export function buildFixtureClosure(
    nestingLimit?: number,
): ClosureParser<FixtureProduct> {
    return new ClosureParser(fixtureGrammar(), nestingLimit);
}

export function jsonSource(count: number): string {
    return ` \r\n${JSON.stringify({
        name: "𝒜",
        values: Array.from({ length: count }, (_, index) => ({
            index,
            active: (index & 1) === 0,
            payload: index % 7 === 0 ? null : `x\\${index}`,
        })),
    })}\t`;
}

export function fixtureSource(count: number): string {
    const shapes = [
        (index: number) => `p${index}: ${index}.5px;`,
        (index: number) => `q${index}: calc(100% - ${index}px nested(1));`,
        (index: number) => `r${index}: url(asset/${index}.svg);`,
        (index: number) => `s${index}: "a\\\\41";`,
        (index: number) => `bad${index}: @@@;`,
    ] as const;
    return Array.from(
        { length: count },
        (_, index) => shapes[index % shapes.length](index),
    ).join("\r\n");
}
