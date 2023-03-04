var b = Object.defineProperty;
var F = (n, t, r) => t in n ? b(n, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : n[t] = r;
var P = (n, t, r) => (F(n, typeof t != "symbol" ? t + "" : t, r), r);
import { regex as f, any as y, string as s, all as g, lazy as p, eof as _, Parser as A } from "./parse.js";
import "chalk";
var B = Object.defineProperty, C = Object.getOwnPropertyDescriptor, m = (n, t, r, e) => {
  for (var o = e > 1 ? void 0 : e ? C(t, r) : t, a = n.length - 1, i; a >= 0; a--)
    (i = n[a]) && (o = (e ? i(t, r, o) : i(o)) || o);
  return e && o && B(t, r, o), o;
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
}, G = ([n, t]) => t.length === 0 ? n : t.reduce((r, [e, o]) => ({
  type: R[e],
  value: [r, o]
}), n), S = ([n, t]) => t === void 0 ? n : {
  type: R[t],
  value: n
}, T = {
  debug: !1,
  comments: !0
};
class c {
  constructor(t) {
    P(this, "options");
    this.options = {
      ...T,
      ...t ?? {}
    };
  }
  identifier() {
    return f(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
  }
  literal() {
    return this.trimBigComment(
      y(
        f(/[^"]+/).wrap(s('"'), s('"')),
        f(/[^']+/).wrap(s("'"), s("'"))
      ).map((t) => ({
        type: "literal",
        value: t
      }))
    );
  }
  epsilon() {
    return y(s("epsilon"), s("ε")).trim().map((t) => ({
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
    return t.trim(this.bigComment().many(), !1).map(([r, e, o]) => (e.comment = {
      left: r,
      right: o
    }, e));
  }
  group() {
    return this.rhs().trim().wrap(s("("), s(")")).map((t) => ({
      type: "group",
      value: t
    }));
  }
  regex() {
    return f(/[^\/]*/).wrap(s("/"), s("/")).then(f(/[gimuy]*/).opt()).map(([t, r]) => ({
      type: "regex",
      value: new RegExp(t, r)
    }));
  }
  optionalGroup() {
    return this.rhs().trim().wrap(s("["), s("]")).map((t) => ({
      type: "optional",
      value: t
    }));
  }
  manyGroup() {
    return this.rhs().trim().wrap(s("{"), s("}")).map((t) => ({
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
          s("?w").trim(),
          s("?").trim(),
          s("*").trim(),
          s("+").trim()
        ).opt()
      ).map(S)
    );
  }
  binaryFactor() {
    return g(
      this.factor(),
      g(
        y(s("<<").trim(), s(">>").trim(), s("-").trim()),
        this.factor()
      ).many()
    ).map(G);
  }
  concatenation() {
    return this.binaryFactor().sepBy(s(",").trim()).map((t) => t.length === 1 ? t[0] : {
      type: "concatenation",
      value: t
    });
  }
  alternation() {
    return this.concatenation().sepBy(s("|").trim()).map((t) => t.length === 1 ? t[0] : {
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
      s("=").trim(),
      this.rhs(),
      y(s(";"), s(".")).trim()
    ).map(([t, , r]) => ({ name: t, expression: r }));
  }
  grammar() {
    return this.productionRule().trim(this.comment().many(), !1).map(([t, r, e]) => (r.comment = {
      above: t,
      below: e
    }, r)).many(1);
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
function O(n) {
  const t = /* @__PURE__ */ new Set(), r = [];
  function e(a, i) {
    if (i.has(a) || t.has(a))
      return;
    i.add(a);
    const l = n.get(a);
    if (!l)
      return;
    const u = l.expression;
    if (u.type === "nonterminal")
      e(u.value, i);
    else if (u.value instanceof Array)
      for (const v of u.value)
        v.type === "nonterminal" && e(v.value, i);
    t.add(a), i.delete(a), r.unshift(n.get(a));
  }
  for (const [a] of n)
    e(a, /* @__PURE__ */ new Set());
  const o = /* @__PURE__ */ new Map();
  for (const a of r)
    o.set(a.name, a);
  return o;
}
const d = (n, t) => {
  if (!(!(n != null && n.type) || !(t != null && t.type) || n.type !== t.type))
    switch (n.type) {
      case "literal":
      case "nonterminal":
        return n.value !== t.value ? void 0 : [n, { type: "epsilon" }, { type: "epsilon" }];
      case "group":
      case "optional":
      case "optionalWhitespace":
      case "many":
      case "many1": {
        const r = d(n.value, t.value);
        return r ? [
          {
            type: n.type,
            value: r[0]
          },
          {
            type: n.type,
            value: r[1]
          },
          {
            type: n.type,
            value: r[2]
          }
        ] : void 0;
      }
      case "concatenation": {
        const r = n.value.map(
          (u, v) => d(n.value[v], t.value[v])
        );
        if (r.some((u) => u === void 0))
          return;
        const e = r.map((u) => u[0]), o = r.map((u) => u[1]), a = r.map((u) => u[2]), i = e.lastIndexOf(null);
        return i === e.length - 1 ? void 0 : [
          {
            type: "concatenation",
            value: e.slice(i + 1)
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
        for (const r of n.value) {
          const e = d(r, t);
          if (e)
            return e;
        }
        for (const r of t.value) {
          const e = d(n, r);
          if (e)
            return e;
        }
        return;
    }
}, h = (n, t) => {
  if (n.type !== t.type)
    return !1;
  switch (n.type) {
    case "literal":
    case "nonterminal":
      return n.value === t.value;
    case "group":
    case "optional":
    case "many":
    case "many1":
      return h(n.value, t.value);
    case "minus":
    case "skip":
    case "next":
      return h(n.value[0], t.value[0]) && h(n.value[1], t.value[1]);
    case "concatenation":
      return n.value.every((r, e) => h(r, t.value[e]));
    case "alternation":
      return n.value.some((r, e) => h(r, t.value[e]));
    case "epsilon":
      return !0;
  }
};
function z(n, t) {
  const r = /* @__PURE__ */ new Map();
  let e = null;
  for (let o = 0; o < t.value.length - 1; o++) {
    const a = t.value[o], i = t.value[o + 1], l = d(a, i);
    if (l) {
      const [u, v, w] = l;
      e !== null && h(u, e) ? r.get(e).push(w) : (r.set(u, [v, w]), e = u), o === t.value.length - 2 && t.value.shift(), t.value.shift(), o -= 1;
    }
  }
  for (const [o, a] of r) {
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
const E = (n, t, r) => {
  const e = [], o = [], a = {
    type: "nonterminal",
    value: r
  };
  for (let i = 0; i < t.value.length; i++) {
    const l = t.value[i];
    l.type === "concatenation" && l.value[0].value === n ? o.push({
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
function L(n) {
  const t = /* @__PURE__ */ new Map();
  let r = 0;
  for (const [e, o] of n) {
    const { expression: a } = o;
    if (a.type === "alternation") {
      const i = `${e}_${r++}`, [l, u] = E(
        e,
        a,
        i
      );
      l && (t.set(i, {
        name: i,
        expression: u
      }), t.set(e, {
        name: e,
        expression: l,
        comment: o.comment
      }));
    }
  }
  if (t.size === 0)
    return n;
  for (const [e, o] of t)
    n.set(e, o);
  for (const [e, o] of n) {
    const { expression: a } = o;
    a.type === "alternation" && z(e, a);
  }
}
function Z(n) {
  const t = (r, e) => {
    e.type === "concatenation" && e.value[0].type === "nonterminal" && e.value[0].value === r && (e.value.slice(1, e.value.length), e.value.shift());
  };
  for (const [r, e] of n)
    t(r, e);
}
function M(n) {
  const t = O(n);
  return L(t), t;
}
function N(n) {
  const t = new c().grammar(), r = t.parse(n);
  if (!r)
    return [t];
  const e = r.reduce((o, a, i) => o.set(a.name, a), /* @__PURE__ */ new Map());
  return [t, e];
}
function D(n) {
  function t(e, o) {
    var a, i;
    switch (o.type) {
      case "literal":
        return s(o.value);
      case "nonterminal":
        const l = A.lazy(() => r[o.value]);
        return l.context.name = o.value, l;
      case "epsilon":
        return _().opt();
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
        return ((i = (a = u.at(-1)) == null ? void 0 : a.context) == null ? void 0 : i.name) === "eof" && u.pop(), g(...u);
      }
      case "alternation":
        return y(...o.value.map((u) => t(e, u)));
    }
  }
  const r = {};
  for (const [e, o] of n.entries())
    r[e] = t(e, o.expression);
  return r;
}
function $(n, t = !1) {
  let [r, e] = N(n);
  return t && (e = M(e)), [D(e), e];
}
export {
  c as EBNFGrammar,
  h as comparePrefix,
  d as findCommonPrefix,
  N as generateASTFromEBNF,
  D as generateParserFromAST,
  $ as generateParserFromEBNF,
  M as removeAllLeftRecursion,
  L as removeDirectLeftRecursion,
  Z as removeIndirectLeftRecursion,
  z as rewriteTreeLeftRecursion,
  O as topologicalSort
};
//# sourceMappingURL=ebnf.js.map
