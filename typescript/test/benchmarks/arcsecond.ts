import {
    char,
    str,
    regex,
    choice,
    sequenceOf,
    sepBy,
    between,
    recursiveParser,
    many,
    possibly,
    optionalWhitespace,
} from "arcsecond";

const ws = optionalWhitespace;
const token = (p: any) => sequenceOf([p, ws]).map(([v]: any) => v);

const lbrace = token(char("{"));
const rbrace = token(char("}"));
const lbracket = token(char("["));
const rbracket = token(char("]"));
const comma = token(char(","));
const colon = token(char(":"));

const nullLiteral = token(str("null")).map(() => null);
const trueLiteral = token(str("true")).map(() => true);
const falseLiteral = token(str("false")).map(() => false);

const numberLiteral = token(
    regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)
).map((v: string) => Number(v));

const stringLiteral = token(
    regex(/^"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/)
).map((v: string) => v.slice(1, -1));

const jsonValue: any = recursiveParser(() =>
    choice([
        jsonObject,
        jsonArray,
        stringLiteral,
        numberLiteral,
        trueLiteral,
        falseLiteral,
        nullLiteral,
    ])
);

const jsonArray = between(lbracket)(rbracket)(sepBy(comma)(jsonValue));

const jsonPair = sequenceOf([stringLiteral, colon, jsonValue]).map(
    ([key, , value]: any) => [key, value]
);

const jsonObject = between(lbrace)(rbrace)(sepBy(comma)(jsonPair)).map(
    (pairs: any[]) => {
        const obj: Record<string, any> = {};
        for (const [key, value] of pairs) {
            obj[key] = value;
        }
        return obj;
    }
);

const jsonParser = sequenceOf([ws, jsonValue]).map(([, v]: any) => v);

export function parse(input: string) {
    const result = jsonParser.run(input);
    if (result.isError) {
        throw new Error(`Arcsecond parse error: ${result.error}`);
    }
    return result.result;
}
