var I = Object.defineProperty;
var j = (o, e, t) => e in o ? I(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var R = (o, e, t) => (j(o, typeof e != "symbol" ? e + "" : e, t), t);
import B from "chalk";
class M {
  constructor(e, t = void 0, r = 0, n = !1) {
    this.src = e, this.value = t, this.offset = r, this.isError = n;
  }
  ok(e, t = 0) {
    return new M(this.src, e, this.offset + t);
  }
  err(e, t = 0) {
    const r = this.ok(e, t);
    return r.isError = !0, r;
  }
  from(e, t = 0) {
    return new M(this.src, e, this.offset + t, this.isError);
  }
  getColumnNumber() {
    const e = this.offset, t = this.src.lastIndexOf(`
`, e), r = t === -1 ? e : e - (t + 1);
    return Math.max(0, r);
  }
  getLineNumber() {
    const t = this.src.slice(0, this.offset).split(`
`).length - 1;
    return Math.max(0, t);
  }
  addCursor(e = "^", t = !1) {
    return "";
  }
}
const l = (o, ...e) => ({}), A = /\s*/y, L = (o) => {
  var t;
  if (o.offset >= o.src.length)
    return o;
  A.lastIndex = o.offset;
  const e = ((t = o.src.match(A)) == null ? void 0 : t[0]) ?? "";
  return o.ok(o.value, e.length);
}, w = /* @__PURE__ */ new Map();
let z = 0, O = 0;
const y = /* @__PURE__ */ new Map(), b = /* @__PURE__ */ new Map();
class p {
  constructor(e, t = {}) {
    R(this, "id", O++);
    this.parser = e, this.context = t;
  }
  parse(e) {
    return y.clear(), w.clear(), b.clear(), this.parser(new M(e)).value;
  }
  getCijKey(e) {
    return `${this.id}${e.offset}`;
  }
  atLeftRecursionLimit(e) {
    return (b.get(this.getCijKey(e)) ?? 0) > e.src.length - e.offset;
  }
  memoize() {
    const e = (t) => {
      const r = this.getCijKey(t), n = b.get(r) ?? 0;
      let i = y.get(this.id);
      if (i && i.offset >= t.offset)
        return i;
      if (this.atLeftRecursionLimit(t))
        return t.err(void 0);
      b.set(r, n + 1);
      const s = this.parser(t);
      return i = y.get(this.id), i && i.offset > s.offset ? s.offset = i.offset : i || y.set(this.id, s), s;
    };
    return new p(
      e,
      l("memoize", this)
    );
  }
  mergeMemos() {
    const e = (t) => {
      let r = y.get(this.id);
      if (r)
        return r;
      if (this.atLeftRecursionLimit(t))
        return t.err(void 0);
      const n = this.parser(t);
      return r = y.get(this.id), r || y.set(this.id, n), n;
    };
    return new p(
      e,
      l("mergeMemo", this)
    );
  }
  then(e) {
    const t = (r) => {
      const n = this.parser(r);
      if (!n.isError) {
        const i = e.parser(n);
        if (!i.isError)
          return i.ok([n.value, i.value]);
      }
      return r.err(void 0);
    };
    return new p(
      t,
      l("then", e)
    );
  }
  or(e) {
    const t = (r) => {
      const n = this.parser(r);
      return n.isError ? e.parser(r) : n;
    };
    return new p(
      t,
      l("or", e)
    );
  }
  chain(e, t = !1) {
    const r = (n) => {
      const i = this.parser(n);
      return i.isError ? i : i.value || t ? e(i.value).parser(i) : n;
    };
    return new p(r, l("chain", e));
  }
  map(e, t = !1) {
    const r = (n) => {
      const i = this.parser(n);
      return !i.isError || t ? i.ok(e(i.value)) : i;
    };
    return new p(r, l("map", this));
  }
  skip(e) {
    const t = (r) => {
      const n = this.parser(r);
      if (!n.isError) {
        const i = e.parser(n);
        if (!i.isError)
          return i.ok(n.value);
      }
      return r.err(void 0);
    };
    return new p(
      t,
      l("skip", e)
    );
  }
  next(e) {
    const t = this.then(e).map(([, r]) => r);
    return t.context = l("next", e), t;
  }
  opt() {
    const e = (t) => {
      const r = this.parser(t);
      return r.isError ? t.ok(void 0) : r;
    };
    return new p(e, l("opt", this));
  }
  not(e) {
    const t = (n) => this.parser(n).isError ? n.ok(n.value) : n.err(void 0), r = (n) => {
      const i = this.parser(n);
      return i.isError || e.parser(n).isError ? i : n.err(void 0);
    };
    return new p(e ? r : t, l("not", e));
  }
  wrap(e, t) {
    const r = e.next(this).skip(t);
    return r.context = l("wrap", e, t), r;
  }
  trim(e = N) {
    var r;
    if (((r = e.context) == null ? void 0 : r.name) === "whitespace") {
      const n = (i) => {
        const s = L(i), a = this.parser(s);
        return a.isError ? i.err(void 0) : L(a);
      };
      return new p(
        n,
        l("trim", e)
      );
    }
    const t = this.wrap(e, e.opt());
    return t.context = l("trim", e), t;
  }
  many(e = 0, t = 1 / 0) {
    const r = (n) => {
      const i = [];
      let s = n;
      for (let a = 0; a < t; a += 1) {
        const u = this.parser(s);
        if (u.isError)
          break;
        i.push(u.value), s = u;
      }
      return i.length >= e ? s.ok(i) : n.err([]);
    };
    return new p(
      r,
      l("many", e, t)
    );
  }
  sepBy(e, t = 0, r = 1 / 0) {
    const n = (i) => {
      const s = [];
      let a = i;
      for (let u = 0; u < r; u += 1) {
        const m = this.parser(a);
        if (m.isError)
          break;
        a = m, s.push(a.value);
        const E = e.parser(a);
        if (E.isError)
          break;
        a = E;
      }
      return s.length > t ? a.ok(s) : i.err([]);
    };
    return new p(
      n,
      l("sepBy", e)
    );
  }
  debug(e = "", t = console.log) {
    return this;
  }
  eof() {
    const e = this.skip(C());
    return e.context = l("eof", this), e;
  }
  static lazy(e) {
    const t = z++, r = (n) => {
      if (w.has(t))
        return w.get(t).parser(n);
      const i = e();
      return i.id = t, w.set(t, i), i.parser(n);
    };
    return new p(r, l("lazy", e));
  }
  toString(e = 0) {
    return name;
  }
}
function C() {
  const o = (e) => e.offset >= e.src.length ? e.ok(void 0) : e.err();
  return new p(o, l());
}
function d(o, e, t) {
  let r = t.value;
  const n = z++;
  t.value = function() {
    const i = (s) => {
      if (w.has(n))
        return w.get(n).parser(s);
      const a = r.apply(this, arguments);
      return a.id = n, w.set(n, a), a.parser(s);
    };
    return new p(i, l("lazy", r));
  };
}
function f(...o) {
  const e = (t) => {
    for (const r of o) {
      const n = r.parser(t);
      if (!n.isError)
        return n;
    }
    return t.err(void 0);
  };
  return new p(
    o.length === 1 ? o[0].parser : e,
    l("any", ...o)
  );
}
function g(...o) {
  const e = (t) => {
    const r = [];
    for (const n of o) {
      const i = n.parser(t);
      if (i.isError)
        return i;
      i.value !== void 0 && r.push(i.value), t = i;
    }
    return t.ok(r);
  };
  return new p(
    o.length === 1 ? o[0].parser : e,
    l("all", ...o)
  );
}
function se(o) {
  const e = (t) => {
    const r = o.parser(t);
    return r.isError ? t.err(void 0) : t.ok(r.value);
  };
  return new p(
    e,
    l("lookAhead", o)
  );
}
function ae(o) {
  const e = (t) => {
    let r = o.parser(t);
    for (; r.offset > 0 && r.isError; )
      r.offset -= 1, r = o.parser(r);
    return r.isError ? t.err(void 0) : t.ok(r.value);
  };
  return new p(
    e,
    l("lookBehind", o)
  );
}
function c(o) {
  const e = (t) => {
    if (t.offset >= t.src.length)
      return t.err(void 0);
    const r = t.src.slice(t.offset, t.offset + o.length);
    return r === o ? t.ok(r, r.length) : t.err(void 0);
  };
  return new p(
    e,
    l("string", o)
  );
}
function h(o) {
  const e = new RegExp(o, o.flags + "y"), t = (r) => {
    var i;
    if (r.offset >= r.src.length)
      return r.err(void 0);
    e.lastIndex = r.offset;
    const n = (i = r.src.match(e)) == null ? void 0 : i[0];
    return n ? r.ok(n, n.length) : n === "" ? r.ok(void 0) : r.err(void 0);
  };
  return new p(t, l("regex", o));
}
const N = h(/\s*/);
N.context.name = "whitespace";
var T = Object.defineProperty, D = Object.getOwnPropertyDescriptor, k = (o, e, t, r) => {
  for (var n = r > 1 ? void 0 : r ? D(e, t) : e, i = o.length - 1, s; i >= 0; i--)
    (s = o[i]) && (n = (r ? s(e, t, n) : s(n)) || n);
  return r && n && T(e, t, n), n;
};
const G = c(",").trim(), W = c("=").trim(), F = c(";").trim(), $ = c(".").trim(), K = c("?").trim(), Z = c("?w").trim(), q = c("??").trim(), H = c("|").trim(), P = c("+").trim(), U = c("-").trim(), Y = c("*").trim();
c("/").trim();
const J = c(">>").trim(), Q = c("<<").trim(), V = f(F, $);
class v {
  identifier() {
    return h(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
  }
  literal() {
    return f(
      h(/[^"]+/).wrap(c('"'), c('"')),
      h(/[^']+/).wrap(c("'"), c("'"))
    ).map((e) => ({
      type: "literal",
      value: e
    }));
  }
  epsilon() {
    return f(c("epsilon"), c("ε"), c("ϵ")).trim().map((e) => ({
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
    return this.expression().trim().wrap(c("("), c(")")).map((e) => ({
      type: "group",
      value: e
    }));
  }
  eof() {
    return c("$").trim().map((e) => ({
      type: "eof",
      value: e
    }));
  }
  regex() {
    return h(/[^\/]*/).wrap(c("/"), c("/")).map((e) => ({
      type: "regex",
      value: new RegExp(e)
    }));
  }
  optional() {
    return this.term().skip(K).map((e) => ({
      type: "optional",
      value: e
    }));
  }
  optionalGroup() {
    return this.expression().trim().wrap(c("["), c("]")).map((e) => ({
      type: "optional",
      value: e
    }));
  }
  optionalWhitespace() {
    return this.term().skip(Z).map((e) => ({
      type: "optionalWhitespace",
      value: e
    }));
  }
  coalesce() {
    return g(this.term().skip(q), this.factor()).map(([e, t]) => ({
      type: "coalesce",
      value: [e, t]
    }));
  }
  subtraction() {
    return g(this.term().skip(U), this.term()).map(([e, t]) => ({
      type: "minus",
      value: [e, t]
    }));
  }
  manyGroup() {
    return this.expression().trim().wrap(c("{"), c("}")).map((e) => ({
      type: "many",
      value: e
    }));
  }
  many() {
    return this.term().skip(Y).map((e) => ({
      type: "many",
      value: e
    }));
  }
  many1() {
    return this.term().skip(P).map((e) => ({
      type: "many1",
      value: e
    }));
  }
  next() {
    return g(this.factor().skip(J), f(this.skip(), this.factor())).map(
      ([e, t]) => ({
        type: "next",
        value: [e, t]
      })
    );
  }
  skip() {
    return g(f(this.next(), this.factor()).skip(Q), this.factor()).map(
      ([e, t]) => ({
        type: "skip",
        value: [e, t]
      })
    );
  }
  concatenation() {
    return f(this.skip(), this.next(), this.factor()).sepBy(G, 1).map((e) => ({
      type: "concatenation",
      value: e
    }));
  }
  alternation() {
    return f(this.concatenation(), this.skip(), this.next(), this.factor()).sepBy(H, 1).map((e) => ({
      type: "alternation",
      value: e
    }));
  }
  bigComment() {
    return h(/\/\*[^]*?\*\//).trim().map((e) => ({
      type: "comment",
      expression: {
        type: "literal",
        value: e
      }
    }));
  }
  term() {
    return f(
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
    return f(
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
    return h(/\/\/.*/).trim().map((e) => ({
      type: "comment",
      expression: {
        type: "literal",
        value: e
      }
    })).or(this.bigComment());
  }
  expression() {
    return f(
      this.alternation(),
      this.concatenation(),
      this.skip(),
      this.next(),
      this.factor()
    );
  }
  productionRule() {
    return g(
      this.identifier().skip(W),
      this.expression().skip(V)
    ).map(([e, t]) => ({ name: e, expression: t, type: "productionRule" }));
  }
  grammar() {
    return g(this.comment().many(), this.productionRule(), this.comment().many()).many(1).map((e) => e.flat(2));
  }
}
k([
  d
], v.prototype, "group", 1);
k([
  d
], v.prototype, "regex", 1);
k([
  d
], v.prototype, "optionalGroup", 1);
k([
  d
], v.prototype, "coalesce", 1);
k([
  d
], v.prototype, "manyGroup", 1);
k([
  d
], v.prototype, "next", 1);
k([
  d
], v.prototype, "skip", 1);
function X(o) {
  const e = /* @__PURE__ */ new Set(), t = [];
  function r(i, s) {
    if (s.has(i) || e.has(i))
      return;
    s.add(i);
    const a = o.get(i);
    if (a) {
      if (a.type === "nonterminal")
        r(a.value, s);
      else if (a.type === "concatenation" || a.type === "alternation")
        for (const u of a.value)
          u.type === "nonterminal" && r(u.value, s);
      e.add(i), s.delete(i), t.unshift({ name: i, expression: a });
    }
  }
  for (const [i] of o)
    r(i, /* @__PURE__ */ new Set());
  const n = /* @__PURE__ */ new Map();
  for (const i of t)
    n.set(i.name, i.expression);
  return n;
}
const x = (o, e) => {
  if (!(!(o != null && o.type) || !(e != null && e.type) || o.type !== e.type))
    switch (o.type) {
      case "literal":
      case "nonterminal":
        return o.value !== e.value ? void 0 : [o, { type: "epsilon" }, { type: "epsilon" }];
      case "group":
      case "optional":
      case "many":
      case "many1": {
        const t = x(o.value, e.value);
        return t ? [
          {
            type: o.type,
            value: t[0]
          },
          {
            type: o.type,
            value: t[1]
          },
          {
            type: o.type,
            value: t[2]
          }
        ] : void 0;
      }
      case "concatenation": {
        const t = o.value.map(
          (u, m) => x(o.value[m], e.value[m])
        );
        if (t.some((u) => u === void 0))
          return;
        const r = t.map((u) => u[0]), n = t.map((u) => u[1]), i = t.map((u) => u[2]), s = r.lastIndexOf(null);
        return s === r.length - 1 ? void 0 : [
          {
            type: "concatenation",
            value: r.slice(s + 1)
          },
          {
            type: "concatenation",
            value: n
          },
          {
            type: "concatenation",
            value: i
          }
        ];
      }
      case "alternation":
        for (const t of o.value) {
          const r = x(t, e);
          if (r)
            return r;
        }
        for (const t of e.value) {
          const r = x(o, t);
          if (r)
            return r;
        }
        return;
    }
}, S = (o, e) => {
  if (o.type !== e.type)
    return !1;
  switch (o.type) {
    case "literal":
    case "nonterminal":
      return o.value === e.value;
    case "group":
    case "optional":
    case "many":
    case "many1":
      return S(o.value, e.value);
    case "minus":
    case "skip":
    case "next":
      return S(o.value[0], e.value[0]) && S(o.value[1], e.value[1]);
    case "concatenation":
      return o.value.every((t, r) => S(t, e.value[r]));
    case "alternation":
      return o.value.some((t, r) => S(t, e.value[r]));
    case "epsilon":
      return !0;
  }
};
function _(o, e) {
  const t = /* @__PURE__ */ new Map();
  let r = null;
  for (let n = 0; n < e.value.length - 1; n++) {
    const i = e.value[n], s = e.value[n + 1], a = x(i, s);
    if (a) {
      const [u, m, E] = a;
      r !== null && S(u, r) ? t.get(r).push(E) : (t.set(u, [m, E]), r = u), n === e.value.length - 2 && e.value.shift(), e.value.shift(), n -= 1;
    }
  }
  for (const [n, i] of t) {
    const a = {
      type: "concatenation",
      value: [
        {
          type: "group",
          value: {
            type: "alternation",
            value: i
          }
        },
        {
          type: "group",
          value: n
        }
      ]
    };
    e.value.push(a);
  }
}
const ee = (o, e, t) => {
  const r = [], n = [], i = {
    type: "nonterminal",
    value: t
  };
  for (let s = 0; s < e.value.length; s++) {
    const a = e.value[s];
    a.type === "concatenation" && a.value[0].value === o ? n.push({
      type: "concatenation",
      value: [...a.value.slice(1), i]
    }) : r.push({
      type: "concatenation",
      value: [a, i]
    });
  }
  return n.length === 0 ? [void 0, void 0] : (n.push({
    type: "epsilon"
  }), [
    {
      type: "alternation",
      value: r
    },
    {
      type: "alternation",
      value: n
    }
  ]);
};
function te(o) {
  const e = /* @__PURE__ */ new Map();
  let t = 0;
  for (const [r, n] of o)
    if (n.type === "alternation") {
      const i = `${r}_${t++}`, [s, a] = ee(
        r,
        n,
        i
      );
      s && (e.set(i, a), e.set(r, s));
    }
  if (e.size === 0)
    return o;
  for (const [r, n] of e)
    o.set(r, n);
  for (const [r, n] of o)
    n.type === "alternation" && _(r, n);
}
function re(o) {
  const e = X(o);
  return te(e), e;
}
function ne(o) {
  function e(r, n) {
    var i, s;
    switch (n.type) {
      case "literal":
        return c(n.value);
      case "nonterminal":
        const a = p.lazy(() => t[n.value]);
        return a.context.name = B.blue(n.value), a;
      case "comment":
      case "epsilon":
        return C().opt();
      case "eof":
        return C();
      case "group":
        return e(r, n.value);
      case "regex":
        return h(n.value);
      case "optionalWhitespace":
        return e(r, n.value).trim();
      case "coalesce":
        return f(...n.value.map((u) => e(r, u)));
      case "optional":
        return e(r, n.value).opt();
      case "many":
        return e(r, n.value).many();
      case "many1":
        return e(r, n.value).many(1);
      case "skip":
        return e(r, n.value[0]).skip(
          e(r, n.value[1])
        );
      case "next":
        return e(r, n.value[0]).next(
          e(r, n.value[1])
        );
      case "minus":
        return e(r, n.value[0]).not(
          e(r, n.value[1])
        );
      case "concatenation": {
        const u = n.value.map((m) => e(r, m));
        return ((s = (i = u.at(-1)) == null ? void 0 : i.context) == null ? void 0 : s.name) === "eof" && u.pop(), g(...u);
      }
      case "alternation":
        return f(...n.value.map((u) => e(r, u)));
    }
  }
  const t = {};
  for (const [r, n] of o.entries())
    t[r] = e(r, n);
  return t;
}
function ue(o, e = !1) {
  const t = /* @__PURE__ */ new Map();
  let r = new v().grammar().trim().parse(o).reduce((i, { name: s, expression: a, type: u }, m) => (u === "comment" && t.set(m, a.value), i.set(s, a), i), /* @__PURE__ */ new Map());
  return e && (r = re(r)), [ne(r), r];
}
const ce = (o, e) => {
  Object.entries(o).forEach(([t, r]) => {
    o[t] = r.debug(t, e);
  });
};
export {
  p as Parser,
  M as ParserState,
  ce as addNonterminalsDebugging,
  g as all,
  f as any,
  C as eof,
  ue as generateParserFromEBNF,
  d as lazy,
  se as lookAhead,
  ae as lookBehind,
  h as regex,
  c as string,
  N as whitespace
};
