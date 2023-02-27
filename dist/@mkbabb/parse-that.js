import h from "chalk";
class k {
  constructor(t, e = void 0, n = 0, r = 0, s = !1) {
    this.src = t, this.value = e, this.offset = n, this.lineNumber = r, this.isError = s;
  }
  ok(t) {
    return new k(this.src, t, this.offset, this.lineNumber);
  }
  err(t) {
    const e = this.ok(t);
    return e.isError = !0, e;
  }
  next(t = 1) {
    const e = this.src.slice(this.offset, this.offset + t);
    if (e === void 0)
      return this;
    t += this.offset;
    const n = e.split(`
`).length - 1 + this.lineNumber;
    return new k(this.src, e, t, n);
  }
  getColumnNumber() {
    const t = this.offset, e = this.src.lastIndexOf(`
`, t), n = e === -1 ? t : t - (e + 1);
    return Math.max(0, n);
  }
  addCursor(t = "^") {
    const r = this.src.split(`
`), s = Math.min(r.length - 1, this.lineNumber), a = Math.max(s - 5, 0), i = Math.min(s + 5 + 1, r.length), u = r.slice(a, i).map((w) => w.length <= 80 ? w : w.slice(0, 80 - 3) + "..."), p = " ".repeat(this.getColumnNumber()) + t;
    u.splice(s - a + 1, 0, p);
    const E = (i + "").length;
    return u.map((w, b) => `${(a + b + 1 + "").padStart(E)} | ${w}`).join(`
`);
  }
}
class l {
  constructor(t, e) {
    this.parser = t, this.context = e;
  }
  parse(t) {
    return this.parser(new k(t)).value;
  }
  then(t) {
    const e = (n) => {
      const r = this.parser(n);
      if (!r.isError) {
        const s = t.parser(r);
        if (!s.isError)
          return s.ok([r.value, s.value]);
      }
      return n.err(void 0);
    };
    return new l(e, {
      name: "then",
      args: [t]
    });
  }
  or(t) {
    const e = (n) => {
      const r = this.parser(n);
      return r.isError ? t.parser(n) : r;
    };
    return new l(e, {
      name: "or",
      args: [t]
    });
  }
  chain(t, e = !1) {
    const n = (r) => {
      const s = this.parser(r);
      return s.isError ? s : s.value || e ? t(s.value).parser(s) : r;
    };
    return new l(n, {
      name: "chain",
      args: [t]
    });
  }
  map(t, e = !1) {
    const n = (r) => {
      const s = this.parser(r);
      return !s.isError || e ? s.ok(t(s.value)) : s;
    };
    return new l(n, {
      name: "map",
      args: [this]
    });
  }
  skip(t) {
    const e = this.then(t).map(([n]) => n);
    return e.context.name = "skip", e;
  }
  next(t) {
    const e = this.then(t).map(([, n]) => n);
    return e.context.name = "next", e;
  }
  opt() {
    const t = (e) => {
      const n = this.parser(e);
      return n.isError ? e.ok(void 0) : n;
    };
    return new l(t, {
      name: "opt",
      args: [this]
    });
  }
  not(t) {
    const e = (r) => this.parser(r).isError ? r.ok(r.value) : r.err(void 0), n = (r) => {
      const s = this.parser(r);
      return s.isError || t.parser(r).isError ? s : r.err(void 0);
    };
    return new l(t ? n : e, {
      name: "not",
      args: [t]
    });
  }
  wrap(t, e) {
    const n = t.next(this).skip(e);
    return n.context.name = "wrap", n.context.args = [t, e], n;
  }
  trim(t = N) {
    const e = this.wrap(t, t.opt());
    return e.context.name = "trim", e;
  }
  many(t = 0, e = 1 / 0) {
    const n = (r) => {
      const s = [];
      let a = r;
      for (let i = 0; i < e; i += 1) {
        const u = this.parser(a);
        if (u.isError)
          break;
        s.push(u.value), a = u;
      }
      return s.length >= t ? a.ok(s) : r.err([]);
    };
    return new l(n, {
      name: "many",
      args: [t, e]
    });
  }
  sepBy(t, e = 0, n = 1 / 0) {
    const r = this.then(
      t.then(this).map(([s, a]) => a).many(e, n)
    ).map(([s, a]) => [s, ...a]);
    return r.context.name = "sepBy", r.context.args = [t, e, n], r;
  }
  debug(t = "", e = console.log) {
    t = h.italic(t);
    const n = (r) => {
      const s = this.parser(r), a = s.isError ? h.bgRed : h.bgGreen, i = s.isError ? h.red : h.green;
      e(
        a.bold(s.isError ? " Err " : " Ok "),
        i(s.isError ? "ｘ" : "✓", `	${t}	`),
        `${this.toString()}`
      );
      const u = r.addCursor("^");
      return e(h.yellow(u) + `
`), s;
    };
    return new l(n, {
      name: "debug",
      args: [t]
    });
  }
  static lazy(t) {
    const e = (n) => t().parser(n);
    return new l(e, {
      name: "lazy",
      args: [t]
    });
  }
  toString(t = 0) {
    var r;
    const e = ((r = this.context) == null ? void 0 : r.name) ?? "unknown", n = (() => {
      switch (e) {
        case "string":
          return `"${this.context.args[0]}"`;
        case "regex":
          return `${this.context.args[0]}`;
        case "wrap":
        case "trim":
          return `wrap(${this.context.args[0]}, ${this.context.args[1]})`;
        case "not":
          return `!${this.context.args[0]}`;
        case "opt":
          return `${this.context.args[0]}?`;
        case "next":
          return ` (next ${this.context.args[0]}) `;
        case "skip":
          return ` (skip ${this.context.args[0]}) `;
        case "then":
          return `( then ${this.context.args[0]}) `;
        case "map":
          return `${this.context.args[0].toString()}`;
        case "any":
        case "all":
          const a = e === "any" ? " | " : " , ";
          return `(${this.context.args.map((i) => i.toString(t + 1)).join(a)})`;
        case "many":
          return `${this.context.args[0]} ... ${this.context.args[1]}`;
        case "sepBy":
          return `sepBy ${this.context.args[0]}`;
        case "lazy":
          return `() => ${this.context.args[0]}`;
      }
    })();
    return n !== void 0 ? n : h.bold(e);
  }
}
function $() {
  const o = (t) => t.offset >= t.src.length ? t.ok(void 0) : t.err();
  return new l(o, {
    name: "eof"
  });
}
function g(o, t, e) {
  let n = e.value;
  e.value = function() {
    const r = (s) => n.apply(this, arguments).parser(s);
    return new l(r, {
      name: "lazy",
      args: [n]
    });
  };
}
function m(...o) {
  const t = (e) => {
    for (const n of o) {
      const r = n.parser(e);
      if (!r.isError)
        return r;
    }
    return e.err(void 0);
  };
  return new l(o.length === 1 ? o[0].parser : t, {
    name: "any",
    args: o
  });
}
function x(...o) {
  const t = (e) => {
    const n = [];
    for (const r of o) {
      const s = r.parser(e);
      if (s.isError)
        return s;
      s.value !== void 0 && n.push(s.value), e = s;
    }
    return e.ok(n);
  };
  return new l(o.length === 1 ? o[0].parser : t, {
    name: "all",
    args: o
  });
}
function c(o) {
  const t = (e) => {
    if (e.offset >= e.src.length)
      return e.err(void 0);
    const n = e.next(o.length);
    return n.value === o ? n : e.err(void 0);
  };
  return new l(t, {
    name: "string",
    args: [o]
  });
}
function f(o) {
  const t = new RegExp(o, o.flags + "y"), e = (n) => {
    var s;
    if (n.offset >= n.src.length)
      return n.err(void 0);
    t.lastIndex = n.offset;
    const r = (s = n.src.match(t)) == null ? void 0 : s[0];
    return r ? n.next(r.length) : r === "" ? n.ok(void 0) : n.err(void 0);
  };
  return new l(e, {
    name: "regex",
    args: [o]
  });
}
const N = f(/\s*/);
N.context.name = "whitespace";
var L = Object.defineProperty, I = Object.getOwnPropertyDescriptor, d = (o, t, e, n) => {
  for (var r = n > 1 ? void 0 : n ? I(t, e) : t, s = o.length - 1, a; s >= 0; s--)
    (a = o[s]) && (r = (n ? a(t, e, r) : a(r)) || r);
  return n && r && L(t, e, r), r;
};
const M = c(",").trim(), A = c("=").trim(), z = c(";").trim(), G = c(".").trim(), B = c("?").trim(), _ = c("|").trim(), C = c("+").trim(), O = c("-").trim(), R = c("*").trim();
c("/").trim();
const T = c(">>").trim(), X = c("<<").trim();
f(/\d+/).trim().map(Number);
const j = m(z, G);
class v {
  identifier() {
    return f(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
  }
  literal() {
    return m(
      f(/[^"\s]+/).wrap(c('"'), c('"')),
      f(/[^'\s]+/).wrap(c("'"), c("'"))
    ).map((t) => ({
      type: "literal",
      value: t
    }));
  }
  nonterminal() {
    return this.identifier().map((t) => ({
      type: "nonterminal",
      value: t
    }));
  }
  group() {
    return this.expression().trim().wrap(c("("), c(")")).map((t) => ({
      type: "group",
      value: t
    }));
  }
  regex() {
    return f(/[^\/]*/).trim().wrap(c("/"), c("/")).map((t) => ({
      type: "regex",
      value: new RegExp(t)
    }));
  }
  optional() {
    return this.term().trim().skip(B).map((t) => ({
      type: "optional",
      value: t
    }));
  }
  optionalGroup() {
    return this.expression().trim().wrap(c("["), c("]")).map((t) => ({
      type: "optional",
      value: t
    }));
  }
  subtraction() {
    return x(this.term().skip(O), this.term()).map(([t, e]) => ({
      type: "subtraction",
      value: [t, e]
    }));
  }
  manyGroup() {
    return this.expression().trim().wrap(c("{"), c("}")).map((t) => ({
      type: "many",
      value: t
    }));
  }
  many() {
    return this.term().trim().skip(R).map((t) => ({
      type: "many",
      value: t
    }));
  }
  many1() {
    return this.term().trim().skip(C).map((t) => ({
      type: "many1",
      value: t
    }));
  }
  next() {
    return x(this.factor().skip(T), m(this.skip(), this.factor())).map(
      ([t, e]) => ({
        type: "next",
        value: [t, e]
      })
    );
  }
  skip() {
    return x(m(this.next(), this.factor()).skip(X), this.factor()).map(
      ([t, e]) => ({
        type: "skip",
        value: [t, e]
      })
    );
  }
  concatenation() {
    return m(this.skip(), this.next(), this.factor()).sepBy(M, 1).map((t) => ({
      type: "concatenation",
      value: t
    }));
  }
  alternation() {
    return m(this.concatenation(), this.skip(), this.next(), this.factor()).sepBy(_, 1).map((t) => ({
      type: "alternation",
      value: t
    }));
  }
  term() {
    return m(
      this.literal(),
      this.nonterminal(),
      this.regex(),
      this.group(),
      this.optionalGroup(),
      this.manyGroup()
    );
  }
  factor() {
    return m(
      this.optional(),
      this.many(),
      this.many1(),
      this.subtraction(),
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
    return x(
      this.identifier().skip(A),
      this.expression().skip(j)
    ).map(([t, e]) => ({ name: t, expression: e }));
  }
  grammar() {
    return this.productionRule().many();
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
function D(o) {
  const t = /* @__PURE__ */ new Set(), e = [];
  function n(s, a) {
    if (a.has(s))
      throw new Error("Dependency cycle detected");
    if (t.has(s))
      return;
    a.add(s);
    const i = o.get(s);
    if (i) {
      if (i.type === "nonterminal")
        n(i.value, a);
      else if (i.type === "concatenation" || i.type === "alternation")
        for (const u of i.value)
          u.type === "nonterminal" && n(u.value, a);
      t.add(s), a.delete(s), e.unshift({ name: s, expression: i });
    }
  }
  for (const [s] of o)
    n(s, /* @__PURE__ */ new Set());
  const r = /* @__PURE__ */ new Map();
  for (const s of e)
    r.set(s.name, s.expression);
  return r;
}
const S = (o, t) => {
  if (!(!(o != null && o.type) || !(t != null && t.type) || o.type !== t.type))
    switch (o.type) {
      case "literal":
      case "nonterminal":
        return o.value !== t.value ? void 0 : [o, { type: "epsilon" }, { type: "epsilon" }];
      case "group":
      case "optional":
      case "many":
      case "many1": {
        const e = S(o.value, t.value);
        return e ? [
          {
            type: o.type,
            value: e[0]
          },
          {
            type: o.type,
            value: e[1]
          },
          {
            type: o.type,
            value: e[2]
          }
        ] : void 0;
      }
      case "concatenation": {
        const e = o.value.map(
          (u, p) => S(o.value[p], t.value[p])
        );
        if (e.some((u) => u === void 0))
          return;
        const n = e.map((u) => u[0]), r = e.map((u) => u[1]), s = e.map((u) => u[2]), a = n.lastIndexOf(null);
        return a === n.length - 1 ? void 0 : [
          {
            type: "concatenation",
            value: n.slice(a + 1)
          },
          {
            type: "concatenation",
            value: r
          },
          {
            type: "concatenation",
            value: s
          }
        ];
      }
      case "alternation":
        for (const e of o.value) {
          const n = S(e, t);
          if (n)
            return n;
        }
        for (const e of t.value) {
          const n = S(o, e);
          if (n)
            return n;
        }
        return;
    }
}, y = (o, t) => {
  if (o.type !== t.type)
    return !1;
  switch (o.type) {
    case "literal":
    case "nonterminal":
      return o.value === t.value;
    case "group":
    case "optional":
    case "many":
    case "many1":
      return y(o.value, t.value);
    case "subtraction":
    case "skip":
    case "next":
      return y(o.value[0], t.value[0]) && y(o.value[1], t.value[1]);
    case "concatenation":
      return o.value.every((e, n) => y(e, t.value[n]));
    case "alternation":
      return o.value.some((e, n) => y(e, t.value[n]));
    case "epsilon":
      return !0;
  }
};
function F(o, t, e) {
  const n = [], r = [], s = {
    type: "nonterminal",
    value: e
  };
  for (let a = 0; a < t.value.length; a++) {
    const i = t.value[a];
    i.type === "concatenation" && i.value[0].value === o ? r.push({
      type: "concatenation",
      value: [...i.value.slice(1), s]
    }) : n.push({
      type: "concatenation",
      value: [i, s]
    });
  }
  return r.length === 0 ? [void 0, void 0] : (r.push({
    type: "epsilon"
  }), [
    {
      type: "alternation",
      value: n
    },
    {
      type: "alternation",
      value: r
    }
  ]);
}
function q(o, t) {
  const e = /* @__PURE__ */ new Map();
  let n = null;
  for (let r = 0; r < t.value.length - 1; r++) {
    const s = t.value[r], a = t.value[r + 1], i = S(s, a);
    if (i) {
      const [u, p, E] = i;
      n !== null && y(u, n) ? e.get(n).push(E) : (e.set(u, [p, E]), n = u), r === t.value.length - 2 && t.value.shift(), t.value.shift(), r -= 1;
    }
  }
  for (const [r, s] of e) {
    const i = {
      type: "concatenation",
      value: [
        {
          type: "group",
          value: {
            type: "alternation",
            value: s
          }
        },
        {
          type: "group",
          value: r
        }
      ]
    };
    t.value.push(i);
  }
}
function H(o) {
  const t = D(o), e = /* @__PURE__ */ new Map();
  let n = 0;
  for (const [r, s] of t)
    if (s.type === "alternation") {
      const a = `${r}_${n++}`, [i, u] = F(r, s, a);
      i && (e.set(a, u), e.set(r, i));
    }
  if (e.size === 0)
    return o;
  for (const [r, s] of e)
    t.set(r, s);
  for (const [r, s] of t)
    s.type === "alternation" && q(r, s);
  return t;
}
function P(o) {
  function t(n, r) {
    var s, a;
    switch (r.type) {
      case "literal":
        return c(r.value);
      case "nonterminal":
        const i = l.lazy(() => e[r.value]);
        return i.context.name = h.blue(r.value), i;
      case "epsilon":
        return $().opt();
      case "group":
        return t(n, r.value);
      case "regex":
        return f(r.value);
      case "optional":
        return t(n, r.value).opt();
      case "many":
        return t(n, r.value).many();
      case "many1":
        return t(n, r.value).many(1);
      case "skip":
        return t(n, r.value[0]).skip(
          t(n, r.value[1])
        );
      case "next":
        return t(n, r.value[0]).next(
          t(n, r.value[1])
        );
      case "subtraction":
        return t(n, r.value[0]).not(
          t(n, r.value[1])
        );
      case "concatenation":
        const u = r.value.map((p) => t(n, p));
        return ((a = (s = u.at(-1)) == null ? void 0 : s.context) == null ? void 0 : a.name) === "eof" && u.pop(), x(...u);
      case "alternation":
        return m(...r.value.map((p) => t(n, p)));
    }
  }
  const e = {};
  for (const [n, r] of o.entries())
    e[n] = t(n, r);
  return e;
}
function Q(o) {
  let t = new v().grammar().parse(o).reduce((n, { name: r, expression: s }) => (n.set(r, s), n), /* @__PURE__ */ new Map());
  return t = H(t), [P(t), t];
}
const U = (o, t) => {
  Object.entries(o).forEach(([e, n]) => {
    o[e] = n.debug(e, t);
  });
};
export {
  l as Parser,
  k as ParserState,
  U as addNonterminalsDebugging,
  x as all,
  m as any,
  $ as eof,
  Q as generateParserFromEBNF,
  g as lazy,
  f as regex,
  c as string,
  N as whitespace
};
