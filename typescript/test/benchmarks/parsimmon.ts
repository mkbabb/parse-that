// Value-building JSON parser using Parsimmon
// Based on: https://github.com/jneen/parsimmon/blob/master/examples/json.js
import P from "parsimmon";

var whitespace = P.regexp(/\s*/m);

function token(p: any) {
    return p.skip(whitespace);
}

var lbrace = token(P.string("{"));
var rbrace = token(P.string("}"));
var lbracket = token(P.string("["));
var rbracket = token(P.string("]"));
var comma = token(P.string(","));
var colon = token(P.string(":"));

var nullLiteral = token(P.string("null")).result(null);
var trueLiteral = token(P.string("true")).result(true);
var falseLiteral = token(P.string("false")).result(false);

var stringLiteral = token(
    P.regexp(/"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/)
).map((s: string) => s.slice(1, -1));

var numberLiteral = token(
    P.regexp(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)
).map(Number);

export var json: any = P.lazy(function () {
    return whitespace.then(
        P.alt(
            jsonObject,
            jsonArray,
            stringLiteral,
            numberLiteral,
            trueLiteral,
            falseLiteral,
            nullLiteral
        )
    );
});

var jsonArray = lbracket.then(P.sepBy(json, comma)).skip(rbracket);

var pair = P.seq(stringLiteral.skip(colon), json);
var jsonObject = lbrace
    .then(P.sepBy(pair, comma))
    .skip(rbrace)
    .map((pairs: [string, any][]) => {
        const obj: Record<string, any> = {};
        for (const [key, value] of pairs) {
            obj[key] = value;
        }
        return obj;
    });
