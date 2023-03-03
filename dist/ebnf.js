import { string as s, any as m, regex as v, all as y, lazy as h, eof as $, Parser as E } from "./parse.js";
import P from "chalk";
var F = Object.defineProperty, T = Object.getOwnPropertyDescriptor, g = (n, e, a, t) => {
  for (var r = t > 1 ? void 0 : t ? T(e, a) : e, o = n.length - 1, i; o >= 0; o--)
    (i = n[o]) && (r = (t ? i(e, a, r) : i(r)) || r);
  return t && r && F(e, a, r), r;
};
const j = s(",").trim(), N = s("=").trim(), R = s(";").trim(), _ = s(".").trim(), A = s("?").trim(), B = s("?w").trim(), G = s("??").trim(), L = s("|").trim(), M = s("+").trim(), O = s("-").trim(), I = s("*").trim();
s("/").trim();
const z = s(">>").trim(), C = s("<<").trim(), D = m(R, _);
class f {
  identifier() {
    return v(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
  }
  literal() {
    return m(
      v(/[^"]+/).wrap(s('"'), s('"')),
      v(/[^']+/).wrap(s("'"), s("'"))
    ).map((e) => ({
      type: "literal",
      value: e
    }));
  }
  epsilon() {
    return m(s("epsilon"), s("ε"), s("ϵ")).trim().map((e) => ({
      type: "epsilon",
      value: void 0
    }));
  }
  nonterminal() {
    return this.identifier().map((e) => ({
      type: "nonterminal",
      value: e
    }));
  }
  group() {
    return this.expression().trim().wrap(s("("), s(")")).map((e) => ({
      type: "group",
      value: e
    }));
  }
  eof() {
    return s("$").trim().map((e) => ({
      type: "eof",
      value: e
    }));
  }
  regex() {
    return v(/[^\/]*/).wrap(s("/"), s("/")).map((e) => ({
      type: "regex",
      value: new RegExp(e)
    }));
  }
  optional() {
    return this.term().skip(A).map((e) => ({
      type: "optional",
      value: e
    }));
  }
  optionalGroup() {
    return this.expression().trim().wrap(s("["), s("]")).map((e) => ({
      type: "optional",
      value: e
    }));
  }
  optionalWhitespace() {
    return this.term().skip(B).map((e) => ({
      type: "optionalWhitespace",
      value: e
    }));
  }
  coalesce() {
    return y(this.term().skip(G), this.factor()).map(([e, a]) => ({
      type: "coalesce",
      value: [e, a]
    }));
  }
  subtraction() {
    return y(this.term().skip(O), this.term()).map(([e, a]) => ({
      type: "minus",
      value: [e, a]
    }));
  }
  manyGroup() {
    return this.expression().trim().wrap(s("{"), s("}")).map((e) => ({
      type: "many",
      value: e
    }));
  }
  many() {
    return this.term().skip(I).map((e) => ({
      type: "many",
      value: e
    }));
  }
  many1() {
    return this.term().skip(M).map((e) => ({
      type: "many1",
      value: e
    }));
  }
  next() {
    return y(this.factor().skip(z), m(this.skip(), this.factor())).map(
      ([e, a]) => ({
        type: "next",
        value: [e, a]
      })
    );
  }
  skip() {
    return y(m(this.next(), this.factor()).skip(C), this.factor()).map(
      ([e, a]) => ({
        type: "skip",
        value: [e, a]
      })
    );
  }
  concatenation() {
    return m(this.skip(), this.next(), this.factor()).sepBy(j, 1).map((e) => ({
      type: "concatenation",
      value: e
    }));
  }
  alternation() {
    return m(this.concatenation(), this.skip(), this.next(), this.factor()).sepBy(L, 1).map((e) => ({
      type: "alternation",
      value: e
    }));
  }
  bigComment() {
    return v(/\/\*[^]*?\*\//).trim().map((e) => ({
      type: "comment",
      expression: {
        type: "literal",
        value: e
      }
    }));
  }
  term() {
    return m(
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
    return m(
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
    return v(/\/\/.*/).trim().map((e) => ({
      type: "comment",
      expression: {
        type: "literal",
        value: e
      }
    })).or(this.bigComment());
  }
  expression() {
    return m(
      this.alternation(),
      this.concatenation(),
      this.skip(),
      this.next(),
      this.factor()
    );
  }
  productionRule() {
    return y(
      this.identifier().skip(N),
      this.expression().skip(D)
    ).map(([e, a]) => ({ name: e, expression: a, type: "productionRule" }));
  }
  grammar() {
    return y(this.comment().many(), this.productionRule(), this.comment().many()).many(1).map((e) => e.flat(2));
  }
}
g([
  h
], f.prototype, "group", 1);
g([
  h
], f.prototype, "regex", 1);
g([
  h
], f.prototype, "optionalGroup", 1);
g([
  h
], f.prototype, "coalesce", 1);
g([
  h
], f.prototype, "manyGroup", 1);
g([
  h
], f.prototype, "next", 1);
g([
  h
], f.prototype, "skip", 1);
function W(n) {
  const e = /* @__PURE__ */ new Set(), a = [];
  function t(o, i) {
    if (i.has(o) || e.has(o))
      return;
    i.add(o);
    const u = n.get(o);
    if (u) {
      if (u.type === "nonterminal")
        t(u.value, i);
      else if (u.type === "concatenation" || u.type === "alternation")
        for (const l of u.value)
          l.type === "nonterminal" && t(l.value, i);
      e.add(o), i.delete(o), a.unshift({ name: o, expression: u });
    }
  }
  for (const [o] of n)
    t(o, /* @__PURE__ */ new Set());
  const r = /* @__PURE__ */ new Map();
  for (const o of a)
    r.set(o.name, o.expression);
  return r;
}
const w = (n, e) => {
  if (!(!(n != null && n.type) || !(e != null && e.type) || n.type !== e.type))
    switch (n.type) {
      case "literal":
      case "nonterminal":
        return n.value !== e.value ? void 0 : [n, { type: "epsilon" }, { type: "epsilon" }];
      case "group":
      case "optional":
      case "many":
      case "many1": {
        const a = w(n.value, e.value);
        return a ? [
          {
            type: n.type,
            value: a[0]
          },
          {
            type: n.type,
            value: a[1]
          },
          {
            type: n.type,
            value: a[2]
          }
        ] : void 0;
      }
      case "concatenation": {
        const a = n.value.map(
          (l, p) => w(n.value[p], e.value[p])
        );
        if (a.some((l) => l === void 0))
          return;
        const t = a.map((l) => l[0]), r = a.map((l) => l[1]), o = a.map((l) => l[2]), i = t.lastIndexOf(null);
        return i === t.length - 1 ? void 0 : [
          {
            type: "concatenation",
            value: t.slice(i + 1)
          },
          {
            type: "concatenation",
            value: r
          },
          {
            type: "concatenation",
            value: o
          }
        ];
      }
      case "alternation":
        for (const a of n.value) {
          const t = w(a, e);
          if (t)
            return t;
        }
        for (const a of e.value) {
          const t = w(n, a);
          if (t)
            return t;
        }
        return;
    }
}, d = (n, e) => {
  if (n.type !== e.type)
    return !1;
  switch (n.type) {
    case "literal":
    case "nonterminal":
      return n.value === e.value;
    case "group":
    case "optional":
    case "many":
    case "many1":
      return d(n.value, e.value);
    case "minus":
    case "skip":
    case "next":
      return d(n.value[0], e.value[0]) && d(n.value[1], e.value[1]);
    case "concatenation":
      return n.value.every((a, t) => d(a, e.value[t]));
    case "alternation":
      return n.value.some((a, t) => d(a, e.value[t]));
    case "epsilon":
      return !0;
  }
};
function q(n, e) {
  const a = /* @__PURE__ */ new Map();
  let t = null;
  for (let r = 0; r < e.value.length - 1; r++) {
    const o = e.value[r], i = e.value[r + 1], u = w(o, i);
    if (u) {
      const [l, p, b] = u;
      t !== null && d(l, t) ? a.get(t).push(b) : (a.set(l, [p, b]), t = l), r === e.value.length - 2 && e.value.shift(), e.value.shift(), r -= 1;
    }
  }
  for (const [r, o] of a) {
    const u = {
      type: "concatenation",
      value: [
        {
          type: "group",
          value: {
            type: "alternation",
            value: o
          }
        },
        {
          type: "group",
          value: r
        }
      ]
    };
    e.value.push(u);
  }
}
const x = (n, e, a) => {
  const t = [], r = [], o = {
    type: "nonterminal",
    value: a
  };
  for (let i = 0; i < e.value.length; i++) {
    const u = e.value[i];
    u.type === "concatenation" && u.value[0].value === n ? r.push({
      type: "concatenation",
      value: [...u.value.slice(1), o]
    }) : t.push({
      type: "concatenation",
      value: [u, o]
    });
  }
  return r.length === 0 ? [void 0, void 0] : (r.push({
    type: "epsilon"
  }), [
    {
      type: "alternation",
      value: t
    },
    {
      type: "alternation",
      value: r
    }
  ]);
};
function Z(n) {
  const e = /* @__PURE__ */ new Map();
  let a = 0;
  for (const [t, r] of n)
    if (r.type === "alternation") {
      const o = `${t}_${a++}`, [i, u] = x(
        t,
        r,
        o
      );
      i && (e.set(o, u), e.set(t, i));
    }
  if (e.size === 0)
    return n;
  for (const [t, r] of e)
    n.set(t, r);
  for (const [t, r] of n)
    r.type === "alternation" && q(t, r);
}
function te(n) {
  const e = (a, t) => {
    t.type === "concatenation" && t.value[0].type === "nonterminal" && t.value[0].value === a && (t.value.slice(1, t.value.length), t.value.shift());
  };
  for (const [a, t] of n)
    e(a, t);
}
function H(n) {
  const e = W(n);
  return Z(e), e;
}
function J(n) {
  function e(t, r) {
    var o, i;
    switch (r.type) {
      case "literal":
        return s(r.value);
      case "nonterminal":
        const u = E.lazy(() => a[r.value]);
        return u.context.name = P.bold.blue(r.value), u;
      case "comment":
      case "epsilon":
        return $().opt();
      case "eof":
        return $();
      case "group":
        return e(t, r.value);
      case "regex":
        return v(r.value);
      case "optionalWhitespace":
        return e(t, r.value).trim();
      case "coalesce":
        return m(...r.value.map((l) => e(t, l)));
      case "optional":
        return e(t, r.value).opt();
      case "many":
        return e(t, r.value).many();
      case "many1":
        return e(t, r.value).many(1);
      case "skip":
        return e(t, r.value[0]).skip(
          e(t, r.value[1])
        );
      case "next":
        return e(t, r.value[0]).next(
          e(t, r.value[1])
        );
      case "minus":
        return e(t, r.value[0]).not(
          e(t, r.value[1])
        );
      case "concatenation": {
        const l = r.value.map((p) => e(t, p));
        return ((i = (o = l.at(-1)) == null ? void 0 : o.context) == null ? void 0 : i.name) === "eof" && l.pop(), y(...l);
      }
      case "alternation":
        return m(...r.value.map((l) => e(t, l)));
    }
  }
  const a = {};
  for (const [t, r] of n.entries())
    a[t] = e(t, r);
  return a;
}
function K(n, e = !1) {
  const a = /* @__PURE__ */ new Map(), r = new f().grammar().trim().parse(n);
  if (!r)
    throw new Error("Failed to parse EBNF grammar");
  let o = r.reduce((u, { name: l, expression: p, type: b }, k) => (b === "comment" && a.set(k, p.value), u.set(l, p), u), /* @__PURE__ */ new Map());
  return e && (o = H(o)), [J(o), o];
}
const ne = (n, e) => {
  Object.entries(n).forEach(([a, t]) => {
    n[a] = t.debug(a, e);
  });
}, S = {};
function Q(n, e) {
  const a = n.split(e);
  if (a.length === 1)
    return n;
  n = a.map((r, o) => o === a.length - 1 ? e + r : o === 0 ? r : r.split(",").length > 1 ? `
	${e} ` + r : e + r).join("");
  const t = 66;
  if (n.length > t) {
    let r = t;
    for (let o = 0; o < n.length; o += r) {
      const i = o === 0 ? t : o + r, u = n.indexOf(e, i);
      if (u === -1)
        break;
      n = n.slice(0, u) + `
	${e}` + n.slice(u + 1);
    }
  }
  return n;
}
const U = [
  "symbol",
  "identifier",
  "terminal",
  "pipe",
  "comma",
  "plus",
  "minus",
  "star",
  "div",
  "question",
  "eof",
  "optional_whitespace",
  "regex",
  "rhs",
  "rule",
  "grammar"
], V = (n) => {
  const [e, a] = K(n);
  for (const t of U)
    e[t] = e[t].trim();
  return e.symbol = e.symbol, e.identifier = e.identifier.map((t) => t.flat().join("")), e.terminal = e.terminal.map((t) => t.flat().join("")), e.regex = e.regex.map((t) => t.flat().join("")), e.rhs = e.rhs.map((t) => {
    const o = (t instanceof Array ? t.flat(1 / 0) : t).join(" ");
    return Q(o, "|");
  }), e.rule = e.rule.map((t) => t.flat().join(" ")), e.grammar.map((t) => {
    let r = 0;
    for (let o = 0; o < t.length; o++) {
      const i = t[o];
      i.length > 80 ? (t[o] = i + `
`, o > 0 && r !== o - 1 && (t[o - 1] = t[o - 1] + `
`), r = o) : o - r > 2 && (t[o] = i + `
`, r = o);
    }
    return t.join(`
`);
  });
}, re = (n, e, a) => {
  const t = S.readFileSync(e, "utf8"), o = V(t).parse(n);
  return a !== void 0 && S.writeFileSync(a, o), o;
};
function X(n) {
  return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function c(n) {
  switch (n.type) {
    case "literal":
      return X(n.value);
    case "nonterminal":
      return `($${n.value})`;
    case "epsilon":
      return "";
    case "group":
      return `(${c(n.value)})`;
    case "regex":
      return n.value.source;
    case "optional":
      return `(${c(n.value)})?`;
    case "minus":
      return `${c(
        n.value[0]
      )}(?!${c(n.value[1])})`;
    case "many":
      return `(${c(n.value)})*`;
    case "many1":
      return `(${c(n.value)})+`;
    case "skip":
      return `${c(
        n.value[0]
      )}(?:${c(n.value[1])})?`;
    case "next":
      return `${c(
        n.value[0]
      )}(?=${c(n.value[1])})`;
    case "concatenation":
      return n.value.map(c).join("");
    case "alternation":
      return n.value.map((e) => `(${c(e)})`).join("|");
  }
}
function ae(n) {
  const e = [];
  for (const [a, t] of n)
    e.push({
      name: a,
      match: c(t)
    });
  return {
    name: "EEBNF",
    scopeName: "source.eebnf",
    fileTypes: ["eebnf"],
    patterns: e
  };
}
export {
  f as EBNFGrammar,
  V as EBNFParser,
  ne as addNonterminalsDebugging,
  d as comparePrefix,
  w as findCommonPrefix,
  re as formatEBNFGrammar,
  K as generateParserFromEBNF,
  H as removeAllLeftRecursion,
  Z as removeDirectLeftRecursion,
  te as removeIndirectLeftRecursion,
  q as rewriteTreeLeftRecursion,
  W as topologicalSort,
  ae as transformEBNFASTToTextMateLanguage
};
