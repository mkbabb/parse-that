import { string, regexp } from "parjs";
import { map, between, manySepBy, or, qthen, thenq, then, later } from "parjs/combinators";

const ws = regexp(/\s*/);
const token = (p: any) => p.pipe(thenq(ws));

const lbrace = token(string("{"));
const rbrace = token(string("}"));
const lbracket = token(string("["));
const rbracket = token(string("]"));
const comma = token(string(","));
const colon = token(string(":"));

const nullLiteral = token(string("null")).pipe(map(() => null));
const trueLiteral = token(string("true")).pipe(map(() => true));
const falseLiteral = token(string("false")).pipe(map(() => false));

const numberLiteral = token(
    regexp(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)
).pipe(map((v: string[]) => Number(v[0])));

const stringLiteral = token(
    regexp(/"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/)
).pipe(map((v: string[]) => v[0].slice(1, -1)));

// Use later() for recursive definitions — it returns a parser directly
const jsonValue = later<any>();

const jsonArray = jsonValue.pipe(
    manySepBy(comma),
    between(lbracket, rbracket),
);

const jsonPair = stringLiteral.pipe(
    thenq(colon),
    then(jsonValue),
    map(([key, value]: any) => [key, value] as [string, any]),
);

const jsonObject = jsonPair.pipe(
    manySepBy(comma),
    between(lbrace, rbrace),
    map((pairs: [string, any][]) => {
        const obj: Record<string, any> = {};
        for (const [key, value] of pairs) {
            obj[key] = value;
        }
        return obj;
    }),
);

jsonValue.init(
    jsonObject.pipe(
        or(jsonArray, stringLiteral, numberLiteral, trueLiteral, falseLiteral, nullLiteral),
    )
);

const jsonParser = ws.pipe(qthen(jsonValue));

export function parse(input: string) {
    const result = jsonParser.parse(input);
    if (result.kind !== "OK") {
        throw new Error(`Parjs parse error`);
    }
    return result.value;
}
