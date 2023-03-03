import { Parser, regex, any, string, whitespace, all } from "../../src/parse";

const comma = string(",").trim();
const colon = string(":").trim();

const jsonNull = string("null");
const jsonBool = string("true").or(string("false"));

// Using equivalent regex's as Chevrotain :D
const jsonNumber = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/).map((v) =>
    parseFloat(v)
);
const jsonString = regex(/"((?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4})))+"/);
const jsonArray = Parser.lazy(() =>
    jsonValue.sepBy(comma).trim().wrap(string("["), string("]"))
);
const jsonObject = Parser.lazy(() =>
    jsonString
        .skip(colon)
        .then(jsonValue.trim())
        .sepBy(comma)
        .many()
        .trim()
        .wrap(string("{"), string("}"))
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
