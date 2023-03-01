var W = Object.defineProperty;
var F = (s, e, t) => e in s ? W(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t;
var R = (s, e, t) => (F(s, typeof e != "symbol" ? e + "" : e, t), t);
import f from "chalk";
const B = 5, N = 80, G = (s, e = N) => s.length <= N ? s : s.slice(0, N) + "...";
class C {
  constructor(e, t = void 0, r = 0, n = !1) {
    this.src = e, this.value = t, this.offset = r, this.isError = n;
  }
  ok(e, t = 0) {
    return new C(this.src, e, this.offset + t);
  }
  err(e, t = 0) {
    const r = this.ok(e, t);
    return r.isError = !0, r;
  }
  from(e, t = 0) {
    return new C(this.src, e, this.offset + t, this.isError);
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
    const r = (t ? f.red : f.green).bold, n = this.src.split(`
`), o = Math.min(n.length - 1, this.getLineNumber()), i = Math.max(o - B, 0), a = Math.min(o + B + 1, n.length), c = n.slice(i, a).map(G);
    if (e) {
      const b = " ".repeat(this.getColumnNumber()) + r(e);
      c.splice(o - i + 1, 0, b);
    }
    const m = (a + "").length;
    return c.map((b, $) => {
      const A = i + $ + 1, I = `${(A + "").padStart(m)} | ${b}`;
      return A === o + 1 ? r(I) : I;
    }).join(`
`);
  }
}
const l = (s, ...e) => ({
  name: s,
  args: e
}), j = /\s*/y, O = (s) => {
  var t;
  if (s.offset >= s.src.length)
    return s;
  j.lastIndex = s.offset;
  const e = ((t = s.src.match(j)) == null ? void 0 : t[0]) ?? "";
  return s.ok(s.value, e.length);
}, x = /* @__PURE__ */ new Map();
let T = 0, K = 0;
const d = /* @__PURE__ */ new Map(), M = /* @__PURE__ */ new Map();
class p {
  constructor(e, t = {}) {
    R(this, "id", K++);
    this.parser = e, this.context = t;
  }
  parse(e) {
    return d.clear(), x.clear(), M.clear(), this.parser(new C(e)).value;
  }
  getCijKey(e) {
    return `${this.id}${e.offset}`;
  }
  atLeftRecursionLimit(e) {
    return (M.get(this.getCijKey(e)) ?? 0) > e.src.length - e.offset;
  }
  memoize() {
    const e = (t) => {
      const r = this.getCijKey(t), n = M.get(r) ?? 0;
      let o = d.get(this.id);
      if (o && o.offset >= t.offset)
        return o;
      if (this.atLeftRecursionLimit(t))
        return t.err(void 0);
      M.set(r, n + 1);
      const i = this.parser(t);
      return o = d.get(this.id), o && o.offset > i.offset ? i.offset = o.offset : o || d.set(this.id, i), i;
    };
    return new p(
      e,
      l("memoize", this)
    );
  }
  mergeMemos() {
    const e = (t) => {
      let r = d.get(this.id);
      if (r)
        return r;
      if (this.atLeftRecursionLimit(t))
        return t.err(void 0);
      const n = this.parser(t);
      return r = d.get(this.id), r || d.set(this.id, n), n;
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
        const o = e.parser(n);
        if (!o.isError)
          return o.ok([n.value, o.value]);
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
      const o = this.parser(n);
      return o.isError ? o : o.value || t ? e(o.value).parser(o) : n;
    };
    return new p(r, l("chain", e));
  }
  map(e, t = !1) {
    const r = (n) => {
      const o = this.parser(n);
      return !o.isError || t ? o.ok(e(o.value)) : o;
    };
    return new p(r, l("map", this));
  }
  skip(e) {
    const t = (r) => {
      const n = this.parser(r);
      if (!n.isError) {
        const o = e.parser(n);
        if (!o.isError)
          return o.ok(n.value);
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
      const o = this.parser(n);
      return o.isError || e.parser(n).isError ? o : n.err(void 0);
    };
    return new p(e ? r : t, l("not", e));
  }
  wrap(e, t) {
    const r = e.next(this).skip(t);
    return r.context = l("wrap", e, t), r;
  }
  trim(e = D) {
    var r;
    if (((r = e.context) == null ? void 0 : r.name) === "whitespace") {
      const n = (o) => {
        const i = O(o), a = this.parser(i);
        return a.isError ? o.err(void 0) : O(a);
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
      const o = [];
      let i = n;
      for (let a = 0; a < t; a += 1) {
        const c = this.parser(i);
        if (c.isError)
          break;
        o.push(c.value), i = c;
      }
      return o.length >= e ? i.ok(o) : n.err([]);
    };
    return new p(
      r,
      l("many", e, t)
    );
  }
  sepBy(e, t = 0, r = 1 / 0) {
    const n = (o) => {
      const i = [];
      let a = o;
      for (let c = 0; c < r; c += 1) {
        const m = this.parser(a);
        if (m.isError)
          break;
        a = m, i.push(a.value);
        const g = e.parser(a);
        if (g.isError)
          break;
        a = g;
      }
      return i.length > t ? a.ok(i) : o.err([]);
    };
    return new p(
      n,
      l("sepBy", e)
    );
  }
  debug(e = "", t = console.log) {
    e = f.italic(e);
    const r = (n) => {
      const o = this.parser(n), i = o.isError ? f.bgRed : f.bgGreen, a = o.isError ? f.red : f.green, c = o.offset >= o.src.length, m = o.isError ? "ｘ" : c ? "🎉" : "✓", b = " " + (o.isError ? "Err" : c ? "Done" : "Ok") + " " + m + " ";
      let $ = i.bold(b) + a(`	${e}	${o.offset}	`);
      return $ += f.yellow(
        G(this.toString(), N - $.length)
      ), t($), o.offset >= o.src.length ? t(
        f.bold.greenBright(
          o.addCursor("", o.isError) + `
`
        )
      ) : t(n.addCursor("^", o.isError) + `
`), o;
    };
    return new p(r, l("debug", e, t));
  }
  eof() {
    const e = this.skip(z());
    return e.context = l("eof", this), e;
  }
  static lazy(e) {
    const t = T++, r = (n) => {
      if (x.has(t))
        return x.get(t).parser(n);
      const o = e();
      return o.id = t, x.set(t, o), o.parser(n);
    };
    return new p(r, l("lazy", e));
  }
  toString(e = 0) {
    var n;
    const t = ((n = this.context) == null ? void 0 : n.name) ?? "unknown", r = (() => {
      switch (t) {
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
          const i = t === "any" ? " | " : " , ";
          return `(${this.context.args.map((a) => a.toString(e + 1)).join(i)})`;
        case "many":
          return `${this.context.args[0]} ... ${this.context.args[1]}`;
        case "sepBy":
          return `sepBy ${this.context.args[0]}`;
        case "lazy":
          return `() => ${this.context.args[0]}`;
        case "debug":
          return `debug ${this.context.args[0]}`;
        case "memoize":
          return `memoize ${this.context.args[0]}`;
        case "mergeMemo":
          return `mergeMemo ${this.context.args[0]}`;
        case "eof":
          return `${this.context.args[0]} eof`;
      }
    })();
    return r !== void 0 ? r : f.bold(t);
  }
}
function z() {
  const s = (e) => e.offset >= e.src.length ? e.ok(void 0) : e.err();
  return new p(s, l("eof"));
}
function S(s, e, t) {
  let r = t.value;
  const n = T++;
  t.value = function() {
    const o = (i) => {
      if (x.has(n))
        return x.get(n).parser(i);
      const a = r.apply(this, arguments);
      return a.id = n, x.set(n, a), a.parser(i);
    };
    return new p(o, l("lazy", r));
  };
}
function h(...s) {
  const e = (t) => {
    for (const r of s) {
      const n = r.parser(t);
      if (!n.isError)
        return n;
    }
    return t.err(void 0);
  };
  return new p(
    s.length === 1 ? s[0].parser : e,
    l("any", ...s)
  );
}
function w(...s) {
  const e = (t) => {
    const r = [];
    for (const n of s) {
      const o = n.parser(t);
      if (o.isError)
        return o;
      o.value !== void 0 && r.push(o.value), t = o;
    }
    return t.ok(r);
  };
  return new p(
    s.length === 1 ? s[0].parser : e,
    l("all", ...s)
  );
}
function fe(s) {
  const e = (t) => {
    const r = s.parser(t);
    return r.isError ? t.err(void 0) : t.ok(r.value);
  };
  return new p(
    e,
    l("lookAhead", s)
  );
}
function ve(s) {
  const e = (t) => {
    let r = s.parser(t);
    for (; r.offset > 0 && r.isError; )
      r.offset -= 1, r = s.parser(r);
    return r.isError ? t.err(void 0) : t.ok(r.value);
  };
  return new p(
    e,
    l("lookBehind", s)
  );
}
function u(s) {
  const e = (t) => {
    if (t.offset >= t.src.length)
      return t.err(void 0);
    const r = t.src.slice(t.offset, t.offset + s.length);
    return r === s ? t.ok(r, r.length) : t.err(void 0);
  };
  return new p(
    e,
    l("string", s)
  );
}
function v(s) {
  const e = new RegExp(s, s.flags + "y"), t = (r) => {
    var o;
    if (r.offset >= r.src.length)
      return r.err(void 0);
    e.lastIndex = r.offset;
    const n = (o = r.src.match(e)) == null ? void 0 : o[0];
    return n ? r.ok(n, n.length) : n === "" ? r.ok(void 0) : r.err(void 0);
  };
  return new p(t, l("regex", s));
}
const D = v(/\s*/);
D.context.name = "whitespace";
var Z = Object.defineProperty, q = Object.getOwnPropertyDescriptor, k = (s, e, t, r) => {
  for (var n = r > 1 ? void 0 : r ? q(e, t) : e, o = s.length - 1, i; o >= 0; o--)
    (i = s[o]) && (n = (r ? i(e, t, n) : i(n)) || n);
  return r && n && Z(e, t, n), n;
};
const H = u(",").trim(), U = u("=").trim(), X = u(";").trim(), Y = u(".").trim(), _ = u("?").trim(), P = u("?w").trim(), J = u("??").trim(), Q = u("|").trim(), V = u("+").trim(), ee = u("-").trim(), te = u("*").trim();
u("/").trim();
const re = u(">>").trim(), ne = u("<<").trim(), oe = h(X, Y);
class y {
  identifier() {
    return v(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
  }
  literal() {
    return h(
      v(/[^"]+/).wrap(u('"'), u('"')),
      v(/[^']+/).wrap(u("'"), u("'"))
    ).map((e) => ({
      type: "literal",
      value: e
    }));
  }
  epsilon() {
    return h(u("epsilon"), u("ε"), u("ϵ")).trim().map((e) => ({
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
    return this.expression().trim().wrap(u("("), u(")")).map((e) => ({
      type: "group",
      value: e
    }));
  }
  eof() {
    return u("$").trim().map((e) => ({
      type: "eof",
      value: e
    }));
  }
  regex() {
    return v(/[^\/]*/).wrap(u("/"), u("/")).map((e) => ({
      type: "regex",
      value: new RegExp(e)
    }));
  }
  optional() {
    return this.term().skip(_).map((e) => ({
      type: "optional",
      value: e
    }));
  }
  optionalGroup() {
    return this.expression().trim().wrap(u("["), u("]")).map((e) => ({
      type: "optional",
      value: e
    }));
  }
  optionalWhitespace() {
    return this.term().skip(P).map((e) => ({
      type: "optionalWhitespace",
      value: e
    }));
  }
  coalesce() {
    return w(this.term().skip(J), this.factor()).map(([e, t]) => ({
      type: "coalesce",
      value: [e, t]
    }));
  }
  subtraction() {
    return w(this.term().skip(ee), this.term()).map(([e, t]) => ({
      type: "minus",
      value: [e, t]
    }));
  }
  manyGroup() {
    return this.expression().trim().wrap(u("{"), u("}")).map((e) => ({
      type: "many",
      value: e
    }));
  }
  many() {
    return this.term().skip(te).map((e) => ({
      type: "many",
      value: e
    }));
  }
  many1() {
    return this.term().skip(V).map((e) => ({
      type: "many1",
      value: e
    }));
  }
  next() {
    return w(this.factor().skip(re), h(this.skip(), this.factor())).map(
      ([e, t]) => ({
        type: "next",
        value: [e, t]
      })
    );
  }
  skip() {
    return w(h(this.next(), this.factor()).skip(ne), this.factor()).map(
      ([e, t]) => ({
        type: "skip",
        value: [e, t]
      })
    );
  }
  concatenation() {
    return h(this.skip(), this.next(), this.factor()).sepBy(H, 1).map((e) => ({
      type: "concatenation",
      value: e
    }));
  }
  alternation() {
    return h(this.concatenation(), this.skip(), this.next(), this.factor()).sepBy(Q, 1).map((e) => ({
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
    return h(
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
    return h(
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
    return h(
      this.alternation(),
      this.concatenation(),
      this.skip(),
      this.next(),
      this.factor()
    );
  }
  productionRule() {
    return w(
      this.identifier().skip(U),
      this.expression().skip(oe)
    ).map(([e, t]) => ({ name: e, expression: t, type: "productionRule" }));
  }
  grammar() {
    return w(this.comment().many(), this.productionRule(), this.comment().many()).many(1).map((e) => e.flat(2));
  }
}
k([
  S
], y.prototype, "group", 1);
k([
  S
], y.prototype, "regex", 1);
k([
  S
], y.prototype, "optionalGroup", 1);
k([
  S
], y.prototype, "coalesce", 1);
k([
  S
], y.prototype, "manyGroup", 1);
k([
  S
], y.prototype, "next", 1);
k([
  S
], y.prototype, "skip", 1);
function se(s) {
  const e = /* @__PURE__ */ new Set(), t = [];
  function r(o, i) {
    if (i.has(o) || e.has(o))
      return;
    i.add(o);
    const a = s.get(o);
    if (a) {
      if (a.type === "nonterminal")
        r(a.value, i);
      else if (a.type === "concatenation" || a.type === "alternation")
        for (const c of a.value)
          c.type === "nonterminal" && r(c.value, i);
      e.add(o), i.delete(o), t.unshift({ name: o, expression: a });
    }
  }
  for (const [o] of s)
    r(o, /* @__PURE__ */ new Set());
  const n = /* @__PURE__ */ new Map();
  for (const o of t)
    n.set(o.name, o.expression);
  return n;
}
const L = (s, e) => {
  if (!(!(s != null && s.type) || !(e != null && e.type) || s.type !== e.type))
    switch (s.type) {
      case "literal":
      case "nonterminal":
        return s.value !== e.value ? void 0 : [s, { type: "epsilon" }, { type: "epsilon" }];
      case "group":
      case "optional":
      case "many":
      case "many1": {
        const t = L(s.value, e.value);
        return t ? [
          {
            type: s.type,
            value: t[0]
          },
          {
            type: s.type,
            value: t[1]
          },
          {
            type: s.type,
            value: t[2]
          }
        ] : void 0;
      }
      case "concatenation": {
        const t = s.value.map(
          (c, m) => L(s.value[m], e.value[m])
        );
        if (t.some((c) => c === void 0))
          return;
        const r = t.map((c) => c[0]), n = t.map((c) => c[1]), o = t.map((c) => c[2]), i = r.lastIndexOf(null);
        return i === r.length - 1 ? void 0 : [
          {
            type: "concatenation",
            value: r.slice(i + 1)
          },
          {
            type: "concatenation",
            value: n
          },
          {
            type: "concatenation",
            value: o
          }
        ];
      }
      case "alternation":
        for (const t of s.value) {
          const r = L(t, e);
          if (r)
            return r;
        }
        for (const t of e.value) {
          const r = L(s, t);
          if (r)
            return r;
        }
        return;
    }
}, E = (s, e) => {
  if (s.type !== e.type)
    return !1;
  switch (s.type) {
    case "literal":
    case "nonterminal":
      return s.value === e.value;
    case "group":
    case "optional":
    case "many":
    case "many1":
      return E(s.value, e.value);
    case "minus":
    case "skip":
    case "next":
      return E(s.value[0], e.value[0]) && E(s.value[1], e.value[1]);
    case "concatenation":
      return s.value.every((t, r) => E(t, e.value[r]));
    case "alternation":
      return s.value.some((t, r) => E(t, e.value[r]));
    case "epsilon":
      return !0;
  }
};
function ie(s, e) {
  const t = /* @__PURE__ */ new Map();
  let r = null;
  for (let n = 0; n < e.value.length - 1; n++) {
    const o = e.value[n], i = e.value[n + 1], a = L(o, i);
    if (a) {
      const [c, m, g] = a;
      r !== null && E(c, r) ? t.get(r).push(g) : (t.set(c, [m, g]), r = c), n === e.value.length - 2 && e.value.shift(), e.value.shift(), n -= 1;
    }
  }
  for (const [n, o] of t) {
    const a = {
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
          value: n
        }
      ]
    };
    e.value.push(a);
  }
}
const ae = (s, e, t) => {
  const r = [], n = [], o = {
    type: "nonterminal",
    value: t
  };
  for (let i = 0; i < e.value.length; i++) {
    const a = e.value[i];
    a.type === "concatenation" && a.value[0].value === s ? n.push({
      type: "concatenation",
      value: [...a.value.slice(1), o]
    }) : r.push({
      type: "concatenation",
      value: [a, o]
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
function ce(s) {
  const e = /* @__PURE__ */ new Map();
  let t = 0;
  for (const [r, n] of s)
    if (n.type === "alternation") {
      const o = `${r}_${t++}`, [i, a] = ae(
        r,
        n,
        o
      );
      i && (e.set(o, a), e.set(r, i));
    }
  if (e.size === 0)
    return s;
  for (const [r, n] of e)
    s.set(r, n);
  for (const [r, n] of s)
    n.type === "alternation" && ie(r, n);
}
function ue(s) {
  const e = se(s);
  return ce(e), e;
}
function le(s) {
  function e(r, n) {
    var o, i;
    switch (n.type) {
      case "literal":
        return u(n.value);
      case "nonterminal":
        const a = p.lazy(() => t[n.value]);
        return a.context.name = f.blue(n.value), a;
      case "comment":
      case "epsilon":
        return z().opt();
      case "eof":
        return z();
      case "group":
        return e(r, n.value);
      case "regex":
        return v(n.value);
      case "optionalWhitespace":
        return e(r, n.value).trim();
      case "coalesce":
        return h(...n.value.map((c) => e(r, c)));
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
        const c = n.value.map((m) => e(r, m));
        return ((i = (o = c.at(-1)) == null ? void 0 : o.context) == null ? void 0 : i.name) === "eof" && c.pop(), w(...c);
      }
      case "alternation":
        return h(...n.value.map((c) => e(r, c)));
    }
  }
  const t = {};
  for (const [r, n] of s.entries())
    t[r] = e(r, n);
  return t;
}
function ye(s, e = !1) {
  const t = /* @__PURE__ */ new Map();
  let r = new y().grammar().trim().parse(s).reduce((o, { name: i, expression: a, type: c }, m) => (c === "comment" && t.set(m, a.value), o.set(i, a), o), /* @__PURE__ */ new Map());
  return e && (r = ue(r)), [le(r), r];
}
const ge = (s, e) => {
  Object.entries(s).forEach(([t, r]) => {
    s[t] = r.debug(t, e);
  });
};
export {
  p as Parser,
  C as ParserState,
  ge as addNonterminalsDebugging,
  w as all,
  h as any,
  z as eof,
  ye as generateParserFromEBNF,
  S as lazy,
  fe as lookAhead,
  ve as lookBehind,
  v as regex,
  u as string,
  D as whitespace
};
