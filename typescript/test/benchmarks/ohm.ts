import * as ohm from "ohm-js";

const grammar = ohm.grammar(`
  JSON {
    Value = Object | Array | String | Number | True | False | Null

    Object = "{" ListOf<Pair, ","> "}"
    Pair = String ":" Value

    Array = "[" ListOf<Value, ","> "]"

    String = string
    string = "\\"" strChar* "\\""
    strChar = "\\\\" escapeSeq   -- escaped
            | ~"\\"" ~"\\\\" any -- regular

    escapeSeq = "u" hexDigit hexDigit hexDigit hexDigit -- unicode
              | "\\"" -- doubleQuote
              | "\\\\" -- backslash
              | "/" -- slash
              | "b" -- backspace
              | "f" -- formfeed
              | "n" -- newline
              | "r" -- carriageReturn
              | "t" -- tab

    Number = number
    number = "-"? digit+ ("." digit+)? (("e"|"E") ("+"|"-")? digit+)?
    True = "true"
    False = "false"
    Null = "null"

    space += "\\t" | "\\n" | "\\r"
  }
`);

const semantics = grammar.createSemantics().addOperation<any>("toJS", {
    Value(e) {
        return e.toJS();
    },

    Object(_lb, pairs, _rb) {
        const obj: Record<string, any> = {};
        for (const pair of pairs.asIteration().children) {
            const [key, value] = pair.toJS();
            obj[key] = value;
        }
        return obj;
    },

    Pair(key, _colon, value) {
        return [key.toJS(), value.toJS()];
    },

    Array(_lb, values, _rb) {
        return values.asIteration().children.map((v: any) => v.toJS());
    },

    String(s) {
        return s.toJS();
    },

    string(_lq, chars, _rq) {
        return chars.children.map((c: any) => c.toJS()).join("");
    },

    strChar_escaped(_backslash, seq) {
        return seq.toJS();
    },

    strChar_regular(ch) {
        return ch.sourceString;
    },

    escapeSeq_unicode(_u, h1, h2, h3, h4) {
        const hex = h1.sourceString + h2.sourceString + h3.sourceString + h4.sourceString;
        return String.fromCharCode(parseInt(hex, 16));
    },

    escapeSeq_doubleQuote(_) {
        return '"';
    },

    escapeSeq_backslash(_) {
        return "\\";
    },

    escapeSeq_slash(_) {
        return "/";
    },

    escapeSeq_backspace(_) {
        return "\b";
    },

    escapeSeq_formfeed(_) {
        return "\f";
    },

    escapeSeq_newline(_) {
        return "\n";
    },

    escapeSeq_carriageReturn(_) {
        return "\r";
    },

    escapeSeq_tab(_) {
        return "\t";
    },

    Number(n) {
        return n.toJS();
    },

    number(_neg, _int, _dot, _fracDigits, _eOrE, _sign, _expDigits) {
        return parseFloat(this.sourceString);
    },

    True(_) {
        return true;
    },

    False(_) {
        return false;
    },

    Null(_) {
        return null;
    },
});

export function parse(text: string) {
    const match = grammar.match(text);
    if (match.failed()) {
        throw new Error(match.message);
    }
    return semantics(match).toJS();
}
