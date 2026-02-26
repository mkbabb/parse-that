import { Parser, regex, any, string, whitespace, all } from "../../src/parse";

const comma = string(",").trim();
const colon = string(":").trim();

const jsonNull = string("null").map(() => null);
const jsonBool = string("true").or(string("false")).map((v) => v === "true");

const jsonNumber = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/).map(Number);
const jsonString = regex(/"(?:[^"\\]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/).map(
    (s) => JSON.parse(s),
);
const jsonArray = Parser.lazy(() =>
    jsonValue.sepBy(comma).trim().wrap(string("["), string("]"))
);
const jsonObject = Parser.lazy(() =>
    jsonString
        .skip(colon)
        .then(jsonValue.trim())
        .sepBy(comma)
        .trim()
        .wrap(string("{"), string("}"))
        .map((pairs) => Object.fromEntries(pairs))
);

const jsonValue: Parser<any> = any(
    jsonObject,
    jsonArray,
    jsonString,
    jsonNumber,
    jsonBool,
    jsonNull
);

export const JSONParser = jsonValue.trim();
