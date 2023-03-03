import { string as r, any as i, regex as a, all as m, lazy as p } from "./parse.js";
import "chalk";
var y = Object.defineProperty, f = Object.getOwnPropertyDescriptor, o = (c, t, e, u) => {
  for (var n = u > 1 ? void 0 : u ? f(t, e) : t, h = c.length - 1, l; h >= 0; h--)
    (l = c[h]) && (n = (u ? l(t, e, n) : l(n)) || n);
  return u && n && y(t, e, n), n;
};
const x = r(",").trim(), g = r("=").trim(), v = r(";").trim(), k = r(".").trim(), w = r("?").trim(), _ = r("?w").trim(), b = r("??").trim(), G = r("|").trim(), d = r("+").trim(), C = r("-").trim(), O = r("*").trim();
r("/").trim();
const P = r(">>").trim(), R = r("<<").trim(), W = i(v, k);
class s {
  identifier() {
    return a(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
  }
  literal() {
    return i(
      a(/[^"]+/).wrap(r('"'), r('"')),
      a(/[^']+/).wrap(r("'"), r("'"))
    ).map((t) => ({
      type: "literal",
      value: t
    }));
  }
  epsilon() {
    return i(r("epsilon"), r("ε"), r("ϵ")).trim().map((t) => ({
      type: "epsilon",
      value: void 0
    }));
  }
  nonterminal() {
    return this.identifier().map((t) => ({
      type: "nonterminal",
      value: t
    }));
  }
  group() {
    return this.expression().trim().wrap(r("("), r(")")).map((t) => ({
      type: "group",
      value: t
    }));
  }
  eof() {
    return r("$").trim().map((t) => ({
      type: "eof",
      value: t
    }));
  }
  regex() {
    return a(/[^\/]*/).wrap(r("/"), r("/")).map((t) => ({
      type: "regex",
      value: new RegExp(t)
    }));
  }
  optional() {
    return this.term().skip(w).map((t) => ({
      type: "optional",
      value: t
    }));
  }
  optionalGroup() {
    return this.expression().trim().wrap(r("["), r("]")).map((t) => ({
      type: "optional",
      value: t
    }));
  }
  optionalWhitespace() {
    return this.term().skip(_).map((t) => ({
      type: "optionalWhitespace",
      value: t
    }));
  }
  coalesce() {
    return m(this.term().skip(b), this.factor()).map(([t, e]) => ({
      type: "coalesce",
      value: [t, e]
    }));
  }
  subtraction() {
    return m(this.term().skip(C), this.term()).map(([t, e]) => ({
      type: "minus",
      value: [t, e]
    }));
  }
  manyGroup() {
    return this.expression().trim().wrap(r("{"), r("}")).map((t) => ({
      type: "many",
      value: t
    }));
  }
  many() {
    return this.term().skip(O).map((t) => ({
      type: "many",
      value: t
    }));
  }
  many1() {
    return this.term().skip(d).map((t) => ({
      type: "many1",
      value: t
    }));
  }
  next() {
    return m(this.factor().skip(P), i(this.skip(), this.factor())).map(
      ([t, e]) => ({
        type: "next",
        value: [t, e]
      })
    );
  }
  skip() {
    return m(i(this.next(), this.factor()).skip(R), this.factor()).map(
      ([t, e]) => ({
        type: "skip",
        value: [t, e]
      })
    );
  }
  concatenation() {
    return i(this.skip(), this.next(), this.factor()).sepBy(x, 1).map((t) => ({
      type: "concatenation",
      value: t
    }));
  }
  alternation() {
    return i(this.concatenation(), this.skip(), this.next(), this.factor()).sepBy(G, 1).map((t) => ({
      type: "alternation",
      value: t
    }));
  }
  bigComment() {
    return a(/\/\*[^]*?\*\//).trim().map((t) => ({
      type: "comment",
      expression: {
        type: "literal",
        value: t
      }
    }));
  }
  term() {
    return i(
      this.epsilon(),
      this.literal(),
      this.nonterminal(),
      this.regex(),
      this.group(),
      this.optionalGroup(),
      this.manyGroup(),
      this.eof()
    ).trim(this.bigComment().opt());
  }
  factor() {
    return i(
      this.coalesce(),
      this.optionalWhitespace(),
      this.optional(),
      this.many(),
      this.many1(),
      this.subtraction(),
      this.term()
    );
  }
  comment() {
    return a(/\/\/.*/).trim().map((t) => ({
      type: "comment",
      expression: {
        type: "literal",
        value: t
      }
    })).or(this.bigComment());
  }
  expression() {
    return i(
      this.alternation(),
      this.concatenation(),
      this.skip(),
      this.next(),
      this.factor()
    );
  }
  productionRule() {
    return m(
      this.identifier().skip(g),
      this.expression().skip(W)
    ).map(([t, e]) => ({ name: t, expression: e, type: "productionRule" }));
  }
  grammar() {
    return m(this.comment().many(), this.productionRule(), this.comment().many()).many(1).map((t) => t.flat(2));
  }
}
o([
  p
], s.prototype, "group", 1);
o([
  p
], s.prototype, "regex", 1);
o([
  p
], s.prototype, "optionalGroup", 1);
o([
  p
], s.prototype, "coalesce", 1);
o([
  p
], s.prototype, "manyGroup", 1);
o([
  p
], s.prototype, "next", 1);
o([
  p
], s.prototype, "skip", 1);
export {
  s as EBNFGrammar
};
