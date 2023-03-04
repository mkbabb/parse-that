var z = Object.defineProperty;
var C = (s, t, e) => t in s ? z(s, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[t] = e;
var m = (s, t, e) => (C(s, typeof t != "symbol" ? t + "" : t, e), e);
class w {
  constructor(t, e = void 0, r = 0, n = !1) {
    this.src = t, this.value = e, this.offset = r, this.isError = n;
  }
  ok(t, e = 0) {
    return new w(this.src, t, this.offset + e);
  }
  err(t, e = 0) {
    const r = this.ok(t, e);
    return r.isError = !0, r;
  }
  from(t, e = 0) {
    return new w(this.src, t, this.offset + e, this.isError);
  }
  getColumnNumber() {
    const t = this.offset, e = this.src.lastIndexOf(`
`, t), r = e === -1 ? t : t - (e + 1);
    return Math.max(0, r);
  }
  getLineNumber() {
    const e = this.src.slice(0, this.offset).split(`
`).length - 1;
    return Math.max(0, e);
  }
}
function o(s, t, ...e) {
  return {
    name: s,
    parser: t,
    args: e
  };
}
let I = 0;
const h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map();
function y(s) {
  return s.parser ? s.parser : s.parser = s();
}
class u {
  constructor(t, e = {}) {
    m(this, "id", I++);
    this.parser = t, this.context = e;
  }
  parse(t) {
    return h.clear(), g.clear(), this.parser(new w(t)).value;
  }
  getCijKey(t) {
    return `${this.id}${t.offset}`;
  }
  atLeftRecursionLimit(t) {
    return (g.get(this.getCijKey(t)) ?? 0) > t.src.length - t.offset;
  }
  memoize() {
    const t = (e) => {
      const r = this.getCijKey(e), n = g.get(r) ?? 0;
      let i = h.get(this.id);
      if (i && i.offset >= e.offset)
        return i;
      if (this.atLeftRecursionLimit(e))
        return e.err(void 0);
      g.set(r, n + 1);
      const c = this.parser(e);
      return i = h.get(this.id), i && i.offset > c.offset ? c.offset = i.offset : i || h.set(this.id, c), c;
    };
    return new u(
      t,
      o("memoize", this)
    );
  }
  mergeMemos() {
    const t = (e) => {
      let r = h.get(this.id);
      if (r)
        return r;
      if (this.atLeftRecursionLimit(e))
        return e.err(void 0);
      const n = this.parser(e);
      return r = h.get(this.id), r || h.set(this.id, n), n;
    };
    return new u(
      t,
      o("mergeMemo", this)
    );
  }
  then(t) {
    if (l(this, t))
      return p([this, t], "", (r) => [r == null ? void 0 : r[0], r == null ? void 0 : r[1]]);
    const e = (r) => {
      const n = this.parser(r);
      if (!n.isError) {
        const i = t.parser(n);
        if (!i.isError)
          return i.ok([n.value, i.value]);
      }
      return r.err(void 0);
    };
    return new u(
      e,
      o("then", this, this, t)
    );
  }
  or(t) {
    if (l(this, t))
      return p([this, t], "|");
    const e = (r) => {
      const n = this.parser(r);
      return n.isError ? t.parser(r) : n;
    };
    return new u(
      e,
      o("or", this, this, t)
    );
  }
  chain(t, e = !1) {
    const r = (n) => {
      const i = this.parser(n);
      return i.isError ? i : i.value || e ? t(i.value).parser(i) : n;
    };
    return new u(r, o("chain", this, t));
  }
  map(t, e = !1) {
    const r = (n) => {
      const i = this.parser(n);
      return !i.isError || e ? i.ok(t(i.value)) : i;
    };
    return new u(r, o("map", this));
  }
  mapState(t) {
    const e = (r) => {
      const n = this.parser(r);
      return t(n);
    };
    return new u(
      e,
      o("mapState", this)
    );
  }
  skip(t) {
    const e = (r) => {
      const n = this.parser(r);
      if (!n.isError) {
        const i = t.parser(n);
        if (!i.isError)
          return i.ok(n.value);
      }
      return r.err(void 0);
    };
    return new u(
      e,
      o("skip", this, t)
    );
  }
  next(t) {
    const e = this.then(t).map(([, r]) => r);
    return e.context = o("next", this, t), e;
  }
  opt() {
    const t = (e) => {
      const r = this.parser(e);
      return r.isError ? e.ok(void 0) : r;
    };
    return new u(t, o("opt", this));
  }
  not(t) {
    const e = (n) => this.parser(n).isError ? n.ok(n.value) : n.err(void 0), r = (n) => {
      const i = this.parser(n);
      return i.isError || t.parser(n).isError ? i : n.err(void 0);
    };
    return new u(
      t ? r : e,
      o("not", this, t)
    );
  }
  wrap(t, e) {
    if (l(t, this, e))
      return M(t, this, e);
    const r = t.next(this).skip(e);
    return r.context = o("wrap", this, t, e), r;
  }
  trim(t = k) {
    var e;
    if (((e = t.context) == null ? void 0 : e.name) === "whitespace") {
      if (l(this, t))
        return p(
          [t, this, t],
          "",
          (n) => n == null ? void 0 : n[2]
        );
      const r = (n) => {
        const i = d(n), c = this.parser(i);
        return c.isError ? n.err(void 0) : d(c);
      };
      return new u(
        r,
        o("trimWhitespace", this)
      );
    }
    return this.wrap(t, t);
  }
  many(t = 0, e = 1 / 0) {
    const r = (n) => {
      const i = [];
      let c = n;
      for (let f = 0; f < e; f += 1) {
        const a = this.parser(c);
        if (a.isError)
          break;
        i.push(a.value), c = a;
      }
      return i.length >= t ? c.ok(i) : n.err([]);
    };
    return new u(
      r,
      o("many", this, t, e)
    );
  }
  sepBy(t, e = 0, r = 1 / 0) {
    const n = (i) => {
      const c = [];
      let f = i;
      for (let a = 0; a < r; a += 1) {
        const x = this.parser(f);
        if (x.isError)
          break;
        f = x, c.push(f.value);
        const v = t.parser(f);
        if (v.isError)
          break;
        f = v;
      }
      return c.length > e ? f.ok(c) : i.err([]);
    };
    return new u(
      n,
      o("sepBy", this, t)
    );
  }
  eof() {
    const t = this.skip(R());
    return t.context = o("eof", this), t;
  }
  toString() {
    var t;
    return (t = this.context) == null ? void 0 : t.name;
  }
  static lazy(t) {
    const e = (r) => y(t).parser(r);
    return new u(e, o("lazy", void 0, t));
  }
}
function l(...s) {
  return s.every(
    (t) => {
      var e, r, n, i;
      return (((e = t.context) == null ? void 0 : e.name) === "string" || ((r = t.context) == null ? void 0 : r.name) === "regex" || ((n = t.context) == null ? void 0 : n.name) === "whitespace") && ((i = t.context) == null ? void 0 : i.args);
    }
  );
}
function L(s) {
  var t, e, r, n, i;
  if (((t = s.context) == null ? void 0 : t.name) === "string")
    return (e = s.context) == null ? void 0 : e.args[0].replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  if (((r = s.context) == null ? void 0 : r.name) === "regex" || ((n = s.context) == null ? void 0 : n.name) === "whitespace")
    return (i = s.context) == null ? void 0 : i.args[0].source;
}
function p(s, t = "", e) {
  const r = s.map((c) => `(${L(c)})`).join(t), n = new RegExp(r), i = E(n, e);
  return t !== "|" && (i.context = o("regexConcat", this, n)), i;
}
function M(s, t, e) {
  const r = p([s, t, e], "", (n) => n == null ? void 0 : n[2]);
  return r.context.name = "regexWrap", r;
}
function R() {
  const s = (t) => t.offset >= t.src.length ? t.ok(void 0) : t.err();
  return new u(s, o("eof"));
}
function j(s, t, e) {
  const r = e.value.bind(s);
  e.value = function() {
    const n = (i) => y(r).parser(i);
    return new u(n, o("lazy", void 0, r));
  };
}
function N(...s) {
  if (l(...s))
    return p(s, "|");
  const t = (e) => {
    for (const r of s) {
      const n = r.parser(e);
      if (!n.isError)
        return n;
    }
    return e.err(void 0);
  };
  return new u(
    s.length === 1 ? s[0].parser : t,
    o("any", void 0, ...s)
  );
}
function $(...s) {
  const t = (e) => {
    const r = [];
    for (const n of s) {
      const i = n.parser(e);
      if (i.isError)
        return i;
      i.value !== void 0 && r.push(i.value), e = i;
    }
    return e.ok(r);
  };
  return new u(
    s.length === 1 ? s[0].parser : t,
    o("all", void 0, ...s)
  );
}
function K(s) {
  const t = (e) => {
    if (e.offset >= e.src.length)
      return e.err(void 0);
    const r = e.src.slice(e.offset, e.offset + s.length);
    return r === s ? e.ok(r, r.length) : e.err(void 0);
  };
  return new u(
    t,
    o("string", void 0, s)
  );
}
function E(s, t = (e) => e == null ? void 0 : e[0]) {
  const e = s.flags.replace(/y/g, ""), r = new RegExp(s, e + "y"), n = (i) => {
    if (i.offset >= i.src.length)
      return i.err(void 0);
    r.lastIndex = i.offset;
    const c = t(i.src.match(r));
    return c ? i.ok(c, r.lastIndex - i.offset) : c === "" ? i.ok(void 0) : i.err(void 0);
  };
  return new u(
    n,
    o("regex", void 0, s)
  );
}
const S = /\s*/y, d = (s) => {
  var e;
  if (s.offset >= s.src.length)
    return s;
  S.lastIndex = s.offset;
  const t = ((e = s.src.match(S)) == null ? void 0 : e[0]) ?? "";
  return s.ok(s.value, t.length);
}, k = E(/\s*/);
k.context.name = "whitespace";
export {
  u as Parser,
  $ as all,
  N as any,
  R as eof,
  y as getLazyParser,
  j as lazy,
  E as regex,
  K as string,
  k as whitespace
};
//# sourceMappingURL=parse.js.map
