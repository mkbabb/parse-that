export function makeJson({
    Parser,
    dispatch,
    regex,
    string,
}) {
    const comma = string(",").trim();
    const colon = string(":").trim();
    const jsonNull = string("null").map(() => null);
    const jsonBool = string("true").or(string("false")).map(value =>
        value === "true"
    );
    const jsonNumber = regex(
        /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
    ).map(Number);
    const jsonString = regex(
        /"(?:[^"\\]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/,
    ).map(value =>
        value.indexOf("\\") < 0 ? value.slice(1, -1) : JSON.parse(value)
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
            .map(Object.fromEntries)
    );
    const jsonValue = dispatch({
        "{": jsonObject,
        "[": jsonArray,
        '"': jsonString,
        "-": jsonNumber,
        "0-9": jsonNumber,
        t: jsonBool,
        f: jsonBool,
        n: jsonNull,
    });
    return jsonValue.trim();
}
