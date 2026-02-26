import { Parser, regex, string, dispatch } from "../../src/parse";

const comma = string(",").trim();
const colon = string(":").trim();

const jsonNull = string("null").map(() => null);
const jsonBool = string("true").or(string("false")).map((v) => v === "true");

const jsonNumber = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/).map(Number);
const jsonString = regex(/"(?:[^"\\]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/).map(
    (s) => (s.indexOf("\\") === -1 ? s.slice(1, -1) : JSON.parse(s)),
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

// O(1) first-character dispatch instead of sequential any()
const jsonValue: Parser<any> = dispatch({
    "{": jsonObject,
    "[": jsonArray,
    '"': jsonString,
    "-": jsonNumber,
    "0-9": jsonNumber,
    "t": jsonBool,
    "f": jsonBool,
    "n": jsonNull,
});

export const JSONParser = jsonValue.trim();
