var F = Object.defineProperty;
var b = (r, t, n) => t in r ? F(r, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[t] = n;
var P = (r, t, n) => (b(r, typeof t != "symbol" ? t + "" : t, n), n);
import { regex as f, any as y, string as i, all as g, lazy as p, eof as B, Parser as _ } from "./parse.js";
var A = Object.defineProperty, C = Object.getOwnPropertyDescriptor, m = (r, t, n, e) => {
  for (var o = e > 1 ? void 0 : e ? C(t, n) : t, a = r.length - 1, s; a >= 0; a--)
    (s = r[a]) && (o = (e ? s(t, n, o) : s(o)) || o);
  return e && o && A(t, n, o), o;
};
const R = {
  "|": "alternation",
  ",": "concatenation",
  "-": "minus",
  "<<": "skip",
  ">>": "next",
  "*": "many",
  "+": "many1",
  "?": "optional",
  "?w": "optionalWhitespace"
}, E = ([r, t]) => t.length === 0 ? r : t.reduce((n, [e, o]) => ({
  type: R[e],
  value: [n, o]
}), r), G = ([r, t]) => t === void 0 ? r : {
  type: R[t],
  value: r
}, S = {
  debug: !1,
  comments: !0
};
class c {
  constructor(t) {
    P(this, "options");
    this.options = {
      ...S,
      ...t ?? {}
    };
  }
  identifier() {
    return f(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
  }
  literal() {
    return this.trimBigComment(
      y(
        f(/[^"]+/).wrap(i('"'), i('"')),
        f(/[^']+/).wrap(i("'"), i("'"))
      ).map((t) => ({
        type: "literal",
        value: t
      }))
    );
  }
  epsilon() {
    return y(i("epsilon"), i("ε")).trim().map((t) => ({
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
  bigComment() {
    return f(/\/\*[^\*]*\*\//).trim();
  }
  comment() {
    return f(/\/\/.*/).or(this.bigComment()).trim();
  }
  trimBigComment(t) {
    return t.trim(this.bigComment().many(), !1).map(([n, e, o]) => (e.comment = {
      left: n,
      right: o
    }, e));
  }
  group() {
    return this.rhs().trim().wrap(i("("), i(")")).map((t) => ({
      type: "group",
      value: t
    }));
  }
  regex() {
    return f(/[^\/]*/).wrap(i("/"), i("/")).map((t) => ({
      type: "regex",
      value: new RegExp(t)
    }));
  }
  optionalGroup() {
    return this.rhs().trim().wrap(i("["), i("]")).map((t) => ({
      type: "optional",
      value: t
    }));
  }
  manyGroup() {
    return this.rhs().trim().wrap(i("{"), i("}")).map((t) => ({
      type: "many",
      value: t
    }));
  }
  lhs() {
    return this.identifier();
  }
  term() {
    return y(
      this.epsilon(),
      this.group(),
      this.optionalGroup(),
      this.manyGroup(),
      this.nonterminal(),
      this.literal(),
      this.regex()
    );
  }
  factor() {
    return this.trimBigComment(
      g(
        this.term(),
        y(
          i("?w").trim(),
          i("?").trim(),
          i("*").trim(),
          i("+").trim()
        ).opt()
      ).map(G)
    );
  }
  binaryFactor() {
    return g(
      this.factor(),
      g(
        y(i("<<").trim(), i(">>").trim(), i("-").trim()),
        this.factor()
      ).many()
    ).map(E);
  }
  concatenation() {
    return this.binaryFactor().sepBy(i(",").trim()).map((t) => t.length === 1 ? t[0] : {
      type: "concatenation",
      value: t
    });
  }
  alternation() {
    return this.concatenation().sepBy(i("|").trim()).map((t) => t.length === 1 ? t[0] : {
      type: "alternation",
      value: t
    });
  }
  rhs() {
    return this.alternation();
  }
  productionRule() {
    return g(
      this.lhs(),
      i("=").trim(),
      this.rhs(),
      y(i(";"), i(".")).trim()
    ).map(([t, , n]) => ({ name: t, expression: n }));
  }
  grammar() {
    return this.productionRule().trim(this.comment().many(), !1).map(([t, n, e]) => (n.comment = {
      above: t,
      below: e
    }, n)).many(1);
  }
}
m([
  p
], c.prototype, "bigComment", 1);
m([
  p
], c.prototype, "comment", 1);
m([
  p
], c.prototype, "group", 1);
m([
  p
], c.prototype, "regex", 1);
m([
  p
], c.prototype, "optionalGroup", 1);
m([
  p
], c.prototype, "manyGroup", 1);
m([
  p
], c.prototype, "lhs", 1);
m([
  p
], c.prototype, "term", 1);
m([
  p
], c.prototype, "factor", 1);
m([
  p
], c.prototype, "binaryFactor", 1);
m([
  p
], c.prototype, "concatenation", 1);
m([
  p
], c.prototype, "alternation", 1);
m([
  p
], c.prototype, "rhs", 1);
m([
  p
], c.prototype, "productionRule", 1);
m([
  p
], c.prototype, "grammar", 1);
function T(r) {
  const t = /* @__PURE__ */ new Set(), n = [];
  function e(a, s) {
    if (s.has(a) || t.has(a))
      return;
    s.add(a);
    const l = r.get(a);
    if (!l)
      return;
    const u = l.expression;
    if (u.type === "nonterminal")
      e(u.value, s);
    else if (u.value instanceof Array)
      for (const v of u.value)
        v.type === "nonterminal" && e(v.value, s);
    t.add(a), s.delete(a), n.unshift(r.get(a));
  }
  for (const [a] of r)
    e(a, /* @__PURE__ */ new Set());
  const o = /* @__PURE__ */ new Map();
  for (const a of n)
    o.set(a.name, a);
  return o;
}
const d = (r, t) => {
  if (!(!(r != null && r.type) || !(t != null && t.type) || r.type !== t.type))
    switch (r.type) {
      case "literal":
      case "nonterminal":
        return r.value !== t.value ? void 0 : [r, { type: "epsilon" }, { type: "epsilon" }];
      case "group":
      case "optional":
      case "optionalWhitespace":
      case "many":
      case "many1": {
        const n = d(r.value, t.value);
        return n ? [
          {
            type: r.type,
            value: n[0]
          },
          {
            type: r.type,
            value: n[1]
          },
          {
            type: r.type,
            value: n[2]
          }
        ] : void 0;
      }
      case "concatenation": {
        const n = r.value.map(
          (u, v) => d(r.value[v], t.value[v])
        );
        if (n.some((u) => u === void 0))
          return;
        const e = n.map((u) => u[0]), o = n.map((u) => u[1]), a = n.map((u) => u[2]), s = e.lastIndexOf(null);
        return s === e.length - 1 ? void 0 : [
          {
            type: "concatenation",
            value: e.slice(s + 1)
          },
          {
            type: "concatenation",
            value: o
          },
          {
            type: "concatenation",
            value: a
          }
        ];
      }
      case "alternation":
        for (const n of r.value) {
          const e = d(n, t);
          if (e)
            return e;
        }
        for (const n of t.value) {
          const e = d(r, n);
          if (e)
            return e;
        }
        return;
    }
}, h = (r, t) => {
  if (r.type !== t.type)
    return !1;
  switch (r.type) {
    case "literal":
    case "nonterminal":
      return r.value === t.value;
    case "group":
    case "optional":
    case "many":
    case "many1":
      return h(r.value, t.value);
    case "minus":
    case "skip":
    case "next":
      return h(r.value[0], t.value[0]) && h(r.value[1], t.value[1]);
    case "concatenation":
      return r.value.every((n, e) => h(n, t.value[e]));
    case "alternation":
      return r.value.some((n, e) => h(n, t.value[e]));
    case "epsilon":
      return !0;
  }
};
function N(r, t) {
  const n = /* @__PURE__ */ new Map();
  let e = null;
  for (let o = 0; o < t.value.length - 1; o++) {
    const a = t.value[o], s = t.value[o + 1], l = d(a, s);
    if (l) {
      const [u, v, w] = l;
      e !== null && h(u, e) ? n.get(e).push(w) : (n.set(u, [v, w]), e = u), o === t.value.length - 2 && t.value.shift(), t.value.shift(), o -= 1;
    }
  }
  for (const [o, a] of n) {
    const l = {
      type: "concatenation",
      value: [
        {
          type: "group",
          value: {
            type: "alternation",
            value: a
          }
        },
        {
          type: "group",
          value: o
        }
      ]
    };
    t.value.push(l);
  }
}
const O = (r, t, n) => {
  const e = [], o = [], a = {
    type: "nonterminal",
    value: n
  };
  for (let s = 0; s < t.value.length; s++) {
    const l = t.value[s];
    l.type === "concatenation" && l.value[0].value === r ? o.push({
      type: "concatenation",
      value: [...l.value.slice(1), a]
    }) : e.push({
      type: "concatenation",
      value: [l, a]
    });
  }
  return o.length === 0 ? [void 0, void 0] : (o.push({
    type: "epsilon"
  }), [
    {
      type: "alternation",
      value: e
    },
    {
      type: "alternation",
      value: o
    }
  ]);
};
function z(r) {
  const t = /* @__PURE__ */ new Map();
  let n = 0;
  for (const [e, o] of r) {
    const { expression: a } = o;
    if (a.type === "alternation") {
      const s = `${e}_${n++}`, [l, u] = O(
        e,
        a,
        s
      );
      l && (t.set(s, {
        name: s,
        expression: u
      }), t.set(e, {
        name: e,
        expression: l,
        comment: o.comment
      }));
    }
  }
  if (t.size === 0)
    return r;
  for (const [e, o] of t)
    r.set(e, o);
  for (const [e, o] of r) {
    const { expression: a } = o;
    a.type === "alternation" && N(e, a);
  }
}
function j(r) {
  const t = (n, e) => {
    e.type === "concatenation" && e.value[0].type === "nonterminal" && e.value[0].value === n && (e.value.slice(1, e.value.length), e.value.shift());
  };
  for (const [n, e] of r)
    t(n, e);
}
function L(r) {
  const t = T(r);
  return z(t), t;
}
function M(r) {
  const n = new c().grammar().parse(r);
  if (!n)
    throw new Error("Failed to parse EBNF grammar");
  return n.reduce((e, o, a) => e.set(o.name, o), /* @__PURE__ */ new Map());
}
function D(r) {
  function t(e, o) {
    var a, s;
    switch (o.type) {
      case "literal":
        return i(o.value);
      case "nonterminal":
        const l = _.lazy(() => n[o.value]);
        return l.context.name = o.value, l;
      case "epsilon":
        return B().opt();
      case "group":
        return t(e, o.value);
      case "regex":
        return f(o.value);
      case "optionalWhitespace":
        return t(e, o.value).trim();
      case "optional":
        return t(e, o.value).opt();
      case "many":
        return t(e, o.value).many();
      case "many1":
        return t(e, o.value).many(1);
      case "skip":
        return t(e, o.value[0]).skip(
          t(e, o.value[1])
        );
      case "next":
        return t(e, o.value[0]).next(
          t(e, o.value[1])
        );
      case "minus":
        return t(e, o.value[0]).not(
          t(e, o.value[1])
        );
      case "concatenation": {
        const u = o.value.map((v) => t(e, v));
        return ((s = (a = u.at(-1)) == null ? void 0 : a.context) == null ? void 0 : s.name) === "eof" && u.pop(), g(...u);
      }
      case "alternation":
        return y(...o.value.map((u) => t(e, u)));
    }
  }
  const n = {};
  for (const [e, o] of r.entries())
    n[e] = t(e, o.expression);
  return n;
}
function Z(r, t = !1) {
  let n = M(r);
  return t && (n = L(n)), [D(n), n];
}
export {
  c as EBNFGrammar,
  h as comparePrefix,
  d as findCommonPrefix,
  M as generateASTFromEBNF,
  D as generateParserFromAST,
  Z as generateParserFromEBNF,
  L as removeAllLeftRecursion,
  z as removeDirectLeftRecursion,
  j as removeIndirectLeftRecursion,
  N as rewriteTreeLeftRecursion,
  T as topologicalSort
};
//# sourceMappingURL=ebnf.js.map
