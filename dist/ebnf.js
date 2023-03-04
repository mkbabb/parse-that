import { regex as f, any as m, string as s, all as y, lazy as g, eof as E, Parser as P } from "./parse.js";
var R = Object.defineProperty, T = Object.getOwnPropertyDescriptor, d = (n, e, a, t) => {
  for (var r = t > 1 ? void 0 : t ? T(e, a) : e, o = n.length - 1, i; o >= 0; o--)
    (i = n[o]) && (r = (t ? i(e, a, r) : i(r)) || r);
  return t && r && R(e, a, r), r;
};
class v {
  identifier() {
    return f(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
  }
  literal() {
    return m(
      f(/[^"]+/).wrap(s('"'), s('"')),
      f(/[^']+/).wrap(s("'"), s("'"))
    ).map((e) => ({
      type: "literal",
      value: e
    }));
  }
  epsilon() {
    return m(s("epsilon"), s("ε")).trim().map((e) => ({
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
  regex() {
    return f(/[^\/]*/).wrap(s("/"), s("/")).map((e) => ({
      type: "regex",
      value: new RegExp(e)
    }));
  }
  optional() {
    return this.term().skip(s("?").trim()).map((e) => ({
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
    return this.term().skip(s("?w").trim()).map((e) => ({
      type: "optionalWhitespace",
      value: e
    }));
  }
  minus() {
    return y(this.term().skip(s("-").trim()), this.term()).map(
      ([e, a]) => ({
        type: "minus",
        value: [e, a]
      })
    );
  }
  manyGroup() {
    return this.expression().trim().wrap(s("{"), s("}")).map((e) => ({
      type: "many",
      value: e
    }));
  }
  many() {
    return this.term().skip(s("*").trim()).map((e) => ({
      type: "many",
      value: e
    }));
  }
  many1() {
    return this.term().skip(s("+").trim()).map((e) => ({
      type: "many1",
      value: e
    }));
  }
  next() {
    return y(
      this.factor().skip(s(">>").trim()),
      m(this.skip(), this.factor())
    ).map(([e, a]) => ({
      type: "next",
      value: [e, a]
    }));
  }
  skip() {
    return y(
      m(this.next(), this.factor()).skip(s("<<").trim()),
      this.factor()
    ).map(([e, a]) => ({
      type: "skip",
      value: [e, a]
    }));
  }
  concatenation() {
    return m(this.skip(), this.next(), this.factor()).sepBy(s(",").trim(), 1).map((e) => ({
      type: "concatenation",
      value: e
    }));
  }
  alternation() {
    return m(this.concatenation(), this.skip(), this.next(), this.factor()).sepBy(s("|").trim(), 1).map((e) => ({
      type: "alternation",
      value: e
    }));
  }
  bigComment() {
    return f(/\/\*[^]*?\*\//).trim();
  }
  comment() {
    return f(/\/\/.*/).trim().or(this.bigComment());
  }
  term() {
    return m(
      this.epsilon(),
      this.literal(),
      this.nonterminal(),
      this.regex(),
      this.group(),
      this.optionalGroup(),
      this.manyGroup()
    ).then(this.bigComment().opt()).map(([e, a]) => (e.comment = a, e));
  }
  factor() {
    return m(
      this.optionalWhitespace(),
      this.optional(),
      this.many(),
      this.many1(),
      this.minus(),
      this.term()
    );
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
      this.identifier().skip(s("=").trim()),
      this.expression().skip(m(s(";").trim(), s(".").trim()))
    ).map(([e, a]) => ({ name: e, expression: a }));
  }
  grammar() {
    return y(this.comment().many(), this.productionRule(), this.comment().many()).map(([e, a, t]) => (a.comment = {
      above: e,
      below: t
    }, a)).many(1);
  }
}
d([
  g
], v.prototype, "group", 1);
d([
  g
], v.prototype, "regex", 1);
d([
  g
], v.prototype, "optionalGroup", 1);
d([
  g
], v.prototype, "manyGroup", 1);
d([
  g
], v.prototype, "next", 1);
d([
  g
], v.prototype, "skip", 1);
function k(n) {
  const e = /* @__PURE__ */ new Set(), a = [];
  function t(o, i) {
    if (i.has(o) || e.has(o))
      return;
    i.add(o);
    const l = n.get(o);
    if (!l)
      return;
    const u = l.expression;
    if (u.type === "nonterminal")
      t(u.value, i);
    else if (u.value instanceof Array)
      for (const p of u.value)
        p.type === "nonterminal" && t(p.value, i);
    e.add(o), i.delete(o), a.unshift(n.get(o));
  }
  for (const [o] of n)
    t(o, /* @__PURE__ */ new Set());
  const r = /* @__PURE__ */ new Map();
  for (const o of a)
    r.set(o.name, o);
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
          (u, p) => w(n.value[p], e.value[p])
        );
        if (a.some((u) => u === void 0))
          return;
        const t = a.map((u) => u[0]), r = a.map((u) => u[1]), o = a.map((u) => u[2]), i = t.lastIndexOf(null);
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
}, h = (n, e) => {
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
      return h(n.value, e.value);
    case "minus":
    case "skip":
    case "next":
      return h(n.value[0], e.value[0]) && h(n.value[1], e.value[1]);
    case "concatenation":
      return n.value.every((a, t) => h(a, e.value[t]));
    case "alternation":
      return n.value.some((a, t) => h(a, e.value[t]));
    case "epsilon":
      return !0;
  }
};
function b(n, e) {
  const a = /* @__PURE__ */ new Map();
  let t = null;
  for (let r = 0; r < e.value.length - 1; r++) {
    const o = e.value[r], i = e.value[r + 1], l = w(o, i);
    if (l) {
      const [u, p, $] = l;
      t !== null && h(u, t) ? a.get(t).push($) : (a.set(u, [p, $]), t = u), r === e.value.length - 2 && e.value.shift(), e.value.shift(), r -= 1;
    }
  }
  for (const [r, o] of a) {
    const l = {
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
    e.value.push(l);
  }
}
const A = (n, e, a) => {
  const t = [], r = [], o = {
    type: "nonterminal",
    value: a
  };
  for (let i = 0; i < e.value.length; i++) {
    const l = e.value[i];
    l.type === "concatenation" && l.value[0].value === n ? r.push({
      type: "concatenation",
      value: [...l.value.slice(1), o]
    }) : t.push({
      type: "concatenation",
      value: [l, o]
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
function F(n) {
  const e = /* @__PURE__ */ new Map();
  let a = 0;
  for (const [t, r] of n) {
    const { expression: o } = r;
    if (o.type === "alternation") {
      const i = `${t}_${a++}`, [l, u] = A(
        t,
        o,
        i
      );
      l && (e.set(i, {
        name: i,
        expression: u
      }), e.set(t, {
        name: t,
        expression: l,
        comment: r.comment
      }));
    }
  }
  if (e.size === 0)
    return n;
  for (const [t, r] of e)
    n.set(t, r);
  for (const [t, r] of n) {
    const { expression: o } = r;
    o.type === "alternation" && b(t, o);
  }
}
function M(n) {
  const e = (a, t) => {
    t.type === "concatenation" && t.value[0].type === "nonterminal" && t.value[0].value === a && (t.value.slice(1, t.value.length), t.value.shift());
  };
  for (const [a, t] of n)
    e(a, t);
}
function S(n) {
  const e = k(n);
  return F(e), e;
}
function j(n) {
  const a = new v().grammar().trim().parse(n);
  if (!a)
    throw new Error("Failed to parse EBNF grammar");
  return a.reduce((t, r, o) => (t.set(r.name, r), t), /* @__PURE__ */ new Map());
}
function N(n) {
  function e(t, r) {
    var o, i;
    switch (r.type) {
      case "literal":
        return s(r.value);
      case "nonterminal":
        const l = P.lazy(() => a[r.value]);
        return l.context.name = r.value, l;
      case "epsilon":
        return E().opt();
      case "group":
        return e(t, r.value);
      case "regex":
        return f(r.value);
      case "optionalWhitespace":
        return e(t, r.value).trim();
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
        const u = r.value.map((p) => e(t, p));
        return ((i = (o = u.at(-1)) == null ? void 0 : o.context) == null ? void 0 : i.name) === "eof" && u.pop(), y(...u);
      }
      case "alternation":
        return m(...r.value.map((u) => e(t, u)));
    }
  }
  const a = {};
  for (const [t, r] of n.entries())
    a[t] = e(t, r.expression);
  return a;
}
function _(n, e = !1) {
  let a = j(n);
  return e && (a = S(a)), [N(a), a];
}
function B(n, e) {
  const a = n.split(e);
  if (a.length === 1)
    return n;
  n = a.map((r, o) => o === a.length - 1 ? e + r : o === 0 ? r : r.split(",").length > 1 ? `
	${e} ` + r : e + r).join("");
  const t = 66;
  if (n.length > t) {
    let r = t;
    for (let o = 0; o < n.length; o += r) {
      const i = o === 0 ? t : o + r, l = n.indexOf(e, i);
      if (l === -1)
        break;
      n = n.slice(0, l) + `
	${e}` + n.slice(l + 1);
    }
  }
  return n;
}
const L = [
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
], O = (n) => {
  const [e, a] = _(n);
  for (const t of L)
    e[t] = e[t].trim();
  return e.symbol = e.symbol, e.identifier = e.identifier.map((t) => t.flat().join("")), e.terminal = e.terminal.map((t) => t.flat().join("")), e.regex = e.regex.map((t) => t.flat().join("")), e.rhs = e.rhs.map((t) => {
    const o = (t instanceof Array ? t.flat(1 / 0) : t).join(" ");
    return B(o, "|");
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
function G(n) {
  return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function c(n) {
  switch (n.type) {
    case "literal":
      return G(n.value);
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
function x(n) {
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
  v as EBNFGrammar,
  O as EBNFParser,
  h as comparePrefix,
  w as findCommonPrefix,
  j as generateASTFromEBNF,
  N as generateParserFromAST,
  _ as generateParserFromEBNF,
  S as removeAllLeftRecursion,
  F as removeDirectLeftRecursion,
  M as removeIndirectLeftRecursion,
  b as rewriteTreeLeftRecursion,
  k as topologicalSort,
  x as transformEBNFASTToTextMateLanguage
};
//# sourceMappingURL=ebnf.js.map
