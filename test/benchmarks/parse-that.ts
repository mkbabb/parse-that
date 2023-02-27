import { Parser, regex, any, string, whitespace, all } from "../../src";

const comma = string(",");
const colon = string(":");

const jsonNull = string("null");
const jsonBool = string("true").or(string("false"));

const jsonNumber = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);

const jsonString = regex(/"((?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4})))+"/);
const jsonArray = Parser.lazy(() =>
    jsonValue.sepBy(comma.trim()).trim().wrap(string("["), string("]"))
);
const jsonObject = Parser.lazy(() =>
    jsonString
        .skip(colon)
        .then(jsonValue.trim())
        .sepBy(comma.trim())
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
