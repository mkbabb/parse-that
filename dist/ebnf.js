var R = Object.defineProperty;
var b = (r, t, o) => t in r ? R(r, t, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[t] = o;
var P = (r, t, o) => (b(r, typeof t != "symbol" ? t + "" : t, o), o);
import { lazy as p, regex as f, any as y, string as i, all as g, eof as B, Parser as _ } from "./parse.js";
var A = Object.defineProperty, C = Object.getOwnPropertyDescriptor, m = (r, t, o, e) => {
  for (var n = e > 1 ? void 0 : e ? C(t, o) : t, a = r.length - 1, s; a >= 0; a--)
    (s = r[a]) && (n = (e ? s(t, o, n) : s(n)) || n);
  return e && n && A(t, o, n), n;
};
const F = {
  "|": "alternation",
  ",": "concatenation",
  "-": "minus",
  "<<": "skip",
  ">>": "next",
  "*": "many",
  "+": "many1",
  "?": "optional",
  "?w": "optionalWhitespace"
}, E = ([r, t]) => t.length === 0 ? r : t.reduce((o, [e, n]) => ({
  type: F[e],
  value: [o, n]
}), r), G = ([r, t]) => t === void 0 ? r : {
  type: F[t],
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
    return t.trim(this.bigComment().many(), !1).map(([o, e, n]) => (e.comment = {
      left: o,
      right: n
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
    ).map(([t, , o]) => ({ name: t, expression: o }));
  }
  grammar() {
    return this.productionRule().trim(this.comment().many(), !1).map(([t, o, e]) => (o.comment = {
      above: t,
      below: e
    }, o)).many(1);
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
  const t = /* @__PURE__ */ new Set(), o = [];
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
    t.add(a), s.delete(a), o.unshift(r.get(a));
  }
  for (const [a] of r)
    e(a, /* @__PURE__ */ new Set());
  const n = /* @__PURE__ */ new Map();
  for (const a of o)
    n.set(a.name, a);
  return n;
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
        const o = d(r.value, t.value);
        return o ? [
          {
            type: r.type,
            value: o[0]
          },
          {
            type: r.type,
            value: o[1]
          },
          {
            type: r.type,
            value: o[2]
          }
        ] : void 0;
      }
      case "concatenation": {
        const o = r.value.map(
          (u, v) => d(r.value[v], t.value[v])
        );
        if (o.some((u) => u === void 0))
          return;
        const e = o.map((u) => u[0]), n = o.map((u) => u[1]), a = o.map((u) => u[2]), s = e.lastIndexOf(null);
        return s === e.length - 1 ? void 0 : [
          {
            type: "concatenation",
            value: e.slice(s + 1)
          },
          {
            type: "concatenation",
            value: n
          },
          {
            type: "concatenation",
            value: a
          }
        ];
      }
      case "alternation":
        for (const o of r.value) {
          const e = d(o, t);
          if (e)
            return e;
        }
        for (const o of t.value) {
          const e = d(r, o);
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
      return r.value.every((o, e) => h(o, t.value[e]));
    case "alternation":
      return r.value.some((o, e) => h(o, t.value[e]));
    case "epsilon":
      return !0;
  }
};
function N(r, t) {
  const o = /* @__PURE__ */ new Map();
  let e = null;
  for (let n = 0; n < t.value.length - 1; n++) {
    const a = t.value[n], s = t.value[n + 1], l = d(a, s);
    if (l) {
      const [u, v, w] = l;
      e !== null && h(u, e) ? o.get(e).push(w) : (o.set(u, [v, w]), e = u), n === t.value.length - 2 && t.value.shift(), t.value.shift(), n -= 1;
    }
  }
  for (const [n, a] of o) {
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
          value: n
        }
      ]
    };
    t.value.push(l);
  }
}
const O = (r, t, o) => {
  const e = [], n = [], a = {
    type: "nonterminal",
    value: o
  };
  for (let s = 0; s < t.value.length; s++) {
    const l = t.value[s];
    l.type === "concatenation" && l.value[0].value === r ? n.push({
      type: "concatenation",
      value: [...l.value.slice(1), a]
    }) : e.push({
      type: "concatenation",
      value: [l, a]
    });
  }
  return n.length === 0 ? [void 0, void 0] : (n.push({
    type: "epsilon"
  }), [
    {
      type: "alternation",
      value: e
    },
    {
      type: "alternation",
      value: n
    }
  ]);
};
function z(r) {
  const t = /* @__PURE__ */ new Map();
  let o = 0;
  for (const [e, n] of r) {
    const { expression: a } = n;
    if (a.type === "alternation") {
      const s = `${e}_${o++}`, [l, u] = O(
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
        comment: n.comment
      }));
    }
  }
  if (t.size === 0)
    return r;
  for (const [e, n] of t)
    r.set(e, n);
  for (const [e, n] of r) {
    const { expression: a } = n;
    a.type === "alternation" && N(e, a);
  }
}
function M(r) {
  const t = T(r);
  return z(t), t;
}
function D(r) {
  const o = new c().grammar().parse(r);
  if (!o)
    throw new Error("Failed to parse EBNF grammar");
  return o.reduce((e, n, a) => e.set(n.name, n), /* @__PURE__ */ new Map());
}
function L(r) {
  function t(e, n) {
    var a, s;
    switch (n.type) {
      case "literal":
        return i(n.value);
      case "nonterminal":
        const l = _.lazy(() => o[n.value]);
        return l.context.name = n.value, l;
      case "epsilon":
        return B().opt();
      case "group":
        return t(e, n.value);
      case "regex":
        return f(n.value);
      case "optionalWhitespace":
        return t(e, n.value).trim();
      case "optional":
        return t(e, n.value).opt();
      case "many":
        return t(e, n.value).many();
      case "many1":
        return t(e, n.value).many(1);
      case "skip":
        return t(e, n.value[0]).skip(
          t(e, n.value[1])
        );
      case "next":
        return t(e, n.value[0]).next(
          t(e, n.value[1])
        );
      case "minus":
        return t(e, n.value[0]).not(
          t(e, n.value[1])
        );
      case "concatenation": {
        const u = n.value.map((v) => t(e, v));
        return ((s = (a = u.at(-1)) == null ? void 0 : a.context) == null ? void 0 : s.name) === "eof" && u.pop(), g(...u);
      }
      case "alternation":
        return y(...n.value.map((u) => t(e, u)));
    }
  }
  const o = {};
  for (const [e, n] of r.entries())
    o[e] = t(e, n.expression);
  return o;
}
function j(r, t = !1) {
  let o = D(r);
  return t && (o = M(o)), [L(o), o];
}
export {
  D as generateASTFromEBNF,
  L as generateParserFromAST,
  j as generateParserFromEBNF
};
//# sourceMappingURL=ebnf.js.map
