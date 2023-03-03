import { string as s, any as p, regex as f, all as v, lazy as y, eof as b, Parser as E } from "./parse.js";
import "chalk";
var S = Object.defineProperty, k = Object.getOwnPropertyDescriptor, h = (n, e, a, t) => {
  for (var r = t > 1 ? void 0 : t ? k(e, a) : e, o = n.length - 1, i; o >= 0; o--)
    (i = n[o]) && (r = (t ? i(e, a, r) : i(r)) || r);
  return t && r && S(e, a, r), r;
};
const P = s(",").trim(), T = s("=").trim(), j = s(";").trim(), F = s(".").trim(), N = s("?").trim(), A = s("?w").trim(), R = s("??").trim(), _ = s("|").trim(), B = s("+").trim(), L = s("-").trim(), M = s("*").trim();
s("/").trim();
const O = s(">>").trim(), G = s("<<").trim(), I = p(j, F);
class m {
  identifier() {
    return f(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
  }
  literal() {
    return p(
      f(/[^"]+/).wrap(s('"'), s('"')),
      f(/[^']+/).wrap(s("'"), s("'"))
    ).map((e) => ({
      type: "literal",
      value: e
    }));
  }
  epsilon() {
    return p(s("epsilon"), s("ε"), s("ϵ")).trim().map((e) => ({
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
    return f(/[^\/]*/).wrap(s("/"), s("/")).map((e) => ({
      type: "regex",
      value: new RegExp(e)
    }));
  }
  optional() {
    return this.term().skip(N).map((e) => ({
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
    return this.term().skip(A).map((e) => ({
      type: "optionalWhitespace",
      value: e
    }));
  }
  coalesce() {
    return v(this.term().skip(R), this.factor()).map(([e, a]) => ({
      type: "coalesce",
      value: [e, a]
    }));
  }
  subtraction() {
    return v(this.term().skip(L), this.term()).map(([e, a]) => ({
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
    return this.term().skip(M).map((e) => ({
      type: "many",
      value: e
    }));
  }
  many1() {
    return this.term().skip(B).map((e) => ({
      type: "many1",
      value: e
    }));
  }
  next() {
    return v(this.factor().skip(O), p(this.skip(), this.factor())).map(
      ([e, a]) => ({
        type: "next",
        value: [e, a]
      })
    );
  }
  skip() {
    return v(p(this.next(), this.factor()).skip(G), this.factor()).map(
      ([e, a]) => ({
        type: "skip",
        value: [e, a]
      })
    );
  }
  concatenation() {
    return p(this.skip(), this.next(), this.factor()).sepBy(P, 1).map((e) => ({
      type: "concatenation",
      value: e
    }));
  }
  alternation() {
    return p(this.concatenation(), this.skip(), this.next(), this.factor()).sepBy(_, 1).map((e) => ({
      type: "alternation",
      value: e
    }));
  }
  bigComment() {
    return f(/\/\*[^]*?\*\//).trim().map((e) => ({
      type: "comment",
      expression: {
        type: "literal",
        value: e
      }
    }));
  }
  term() {
    return p(
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
    return p(
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
    return f(/\/\/.*/).trim().map((e) => ({
      type: "comment",
      expression: {
        type: "literal",
        value: e
      }
    })).or(this.bigComment());
  }
  expression() {
    return p(
      this.alternation(),
      this.concatenation(),
      this.skip(),
      this.next(),
      this.factor()
    );
  }
  productionRule() {
    return v(
      this.identifier().skip(T),
      this.expression().skip(I)
    ).map(([e, a]) => ({ name: e, expression: a, type: "productionRule" }));
  }
  grammar() {
    return v(this.comment().many(), this.productionRule(), this.comment().many()).many(1).map((e) => e.flat(2));
  }
}
h([
  y
], m.prototype, "group", 1);
h([
  y
], m.prototype, "regex", 1);
h([
  y
], m.prototype, "optionalGroup", 1);
h([
  y
], m.prototype, "coalesce", 1);
h([
  y
], m.prototype, "manyGroup", 1);
h([
  y
], m.prototype, "next", 1);
h([
  y
], m.prototype, "skip", 1);
function x(n) {
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
          (l, g) => w(n.value[g], e.value[g])
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
function z(n, e) {
  const a = /* @__PURE__ */ new Map();
  let t = null;
  for (let r = 0; r < e.value.length - 1; r++) {
    const o = e.value[r], i = e.value[r + 1], u = w(o, i);
    if (u) {
      const [l, g, $] = u;
      t !== null && d(l, t) ? a.get(t).push($) : (a.set(l, [g, $]), t = l), r === e.value.length - 2 && e.value.shift(), e.value.shift(), r -= 1;
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
const C = (n, e, a) => {
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
function D(n) {
  const e = /* @__PURE__ */ new Map();
  let a = 0;
  for (const [t, r] of n)
    if (r.type === "alternation") {
      const o = `${t}_${a++}`, [i, u] = C(
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
    r.type === "alternation" && z(t, r);
}
function X(n) {
  const e = (a, t) => {
    t.type === "concatenation" && t.value[0].type === "nonterminal" && t.value[0].value === a && (t.value.slice(1, t.value.length), t.value.shift());
  };
  for (const [a, t] of n)
    e(a, t);
}
function W(n) {
  const e = x(n);
  return D(e), e;
}
function q(n) {
  const a = new m().grammar().trim().parse(n);
  if (!a)
    throw new Error("Failed to parse EBNF grammar");
  return a.reduce((t, { name: r, expression: o, type: i }, u) => (t.set(r, o), t), /* @__PURE__ */ new Map());
}
function Z(n) {
  function e(t, r) {
    var o, i;
    switch (r.type) {
      case "literal":
        return s(r.value);
      case "nonterminal":
        const u = E.lazy(() => a[r.value]);
        return u.context.name = r.value, u;
      case "comment":
      case "epsilon":
        return b().opt();
      case "eof":
        return b();
      case "group":
        return e(t, r.value);
      case "regex":
        return f(r.value);
      case "optionalWhitespace":
        return e(t, r.value).trim();
      case "coalesce":
        return p(...r.value.map((l) => e(t, l)));
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
        const l = r.value.map((g) => e(t, g));
        return ((i = (o = l.at(-1)) == null ? void 0 : o.context) == null ? void 0 : i.name) === "eof" && l.pop(), v(...l);
      }
      case "alternation":
        return p(...r.value.map((l) => e(t, l)));
    }
  }
  const a = {};
  for (const [t, r] of n.entries())
    a[t] = e(t, r);
  return a;
}
function H(n, e = !1) {
  let a = q(n);
  return e && (a = W(a)), [Z(a), a];
}
const Y = (n, e) => {
  Object.entries(n).forEach(([a, t]) => {
    n[a] = t.debug(a, !1, e);
  });
};
function J(n, e) {
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
const K = [
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
], ee = (n) => {
  const [e, a] = H(n);
  for (const t of K)
    e[t] = e[t].trim();
  return e.symbol = e.symbol, e.identifier = e.identifier.map((t) => t.flat().join("")), e.terminal = e.terminal.map((t) => t.flat().join("")), e.regex = e.regex.map((t) => t.flat().join("")), e.rhs = e.rhs.map((t) => {
    const o = (t instanceof Array ? t.flat(1 / 0) : t).join(" ");
    return J(o, "|");
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
};
function Q(n) {
  return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function c(n) {
  switch (n.type) {
    case "literal":
      return Q(n.value);
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
function te(n) {
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
  m as EBNFGrammar,
  ee as EBNFParser,
  Y as addNonterminalsDebugging,
  d as comparePrefix,
  w as findCommonPrefix,
  q as generateASTFromEBNF,
  Z as generateParserFromAST,
  H as generateParserFromEBNF,
  W as removeAllLeftRecursion,
  D as removeDirectLeftRecursion,
  X as removeIndirectLeftRecursion,
  z as rewriteTreeLeftRecursion,
  x as topologicalSort,
  te as transformEBNFASTToTextMateLanguage
};
