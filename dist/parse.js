var C = Object.defineProperty;
var I = (s, t, e) => t in s ? C(s, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[t] = e;
var m = (s, t, e) => (I(s, typeof t != "symbol" ? t + "" : t, e), e);
class w {
  constructor(t, e = void 0, r = 0, i = !1) {
    this.src = t, this.value = e, this.offset = r, this.isError = i;
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
let L = 0;
const h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map();
function E(s) {
  return s.parser ? s.parser : s.parser = s();
}
class u {
  constructor(t, e = {}) {
    m(this, "id", L++);
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
      const r = this.getCijKey(e), i = g.get(r) ?? 0;
      let n = h.get(this.id);
      if (n && n.offset >= e.offset)
        return n;
      if (this.atLeftRecursionLimit(e))
        return e.err(void 0);
      g.set(r, i + 1);
      const c = this.parser(e);
      return n = h.get(this.id), n && n.offset > c.offset ? c.offset = n.offset : n || h.set(this.id, c), c;
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
      const i = this.parser(e);
      return r = h.get(this.id), r || h.set(this.id, i), i;
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
      const i = this.parser(r);
      if (!i.isError) {
        const n = t.parser(i);
        if (!n.isError)
          return n.ok([i.value, n.value]);
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
      const i = this.parser(r);
      return i.isError ? t.parser(r) : i;
    };
    return new u(
      e,
      o("or", this, this, t)
    );
  }
  chain(t, e = !1) {
    const r = (i) => {
      const n = this.parser(i);
      return n.isError ? n : n.value || e ? t(n.value).parser(n) : i;
    };
    return new u(r, o("chain", this, t));
  }
  map(t, e = !1) {
    const r = (i) => {
      const n = this.parser(i);
      return !n.isError || e ? n.ok(t(n.value)) : n;
    };
    return new u(r, o("map", this));
  }
  mapState(t) {
    const e = (r) => {
      const i = this.parser(r);
      return t(i);
    };
    return new u(
      e,
      o("mapState", this)
    );
  }
  skip(t) {
    const e = (r) => {
      const i = this.parser(r);
      if (!i.isError) {
        const n = t.parser(i);
        if (!n.isError)
          return n.ok(i.value);
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
    const e = (i) => this.parser(i).isError ? i.ok(i.value) : i.err(void 0), r = (i) => {
      const n = this.parser(i);
      return n.isError || t.parser(i).isError ? n : i.err(void 0);
    };
    return new u(
      t ? r : e,
      o("not", this, t)
    );
  }
  wrap(t, e, r = !0) {
    if (!r)
      return S(t, this, e);
    if (l(t, this, e))
      return R(t, this, e);
    const i = t.next(this).skip(e);
    return i.context = o("wrap", this, t, e), i;
  }
  trim(t = z, e = !0) {
    var r;
    if (!e)
      return S(t, this, t);
    if (((r = t.context) == null ? void 0 : r.name) === "whitespace") {
      if (l(this, t))
        return p(
          [t, this, t],
          "",
          (n) => n == null ? void 0 : n[2]
        );
      const i = (n) => {
        const c = y(n), f = this.parser(c);
        return f.isError ? n.err(void 0) : y(f);
      };
      return new u(
        i,
        o("trimWhitespace", this)
      );
    }
    return this.wrap(t, t);
  }
  many(t = 0, e = 1 / 0) {
    const r = (i) => {
      const n = [];
      let c = i;
      for (let f = 0; f < e; f += 1) {
        const a = this.parser(c);
        if (a.isError)
          break;
        n.push(a.value), c = a;
      }
      return n.length >= t ? c.ok(n) : i.err([]);
    };
    return new u(
      r,
      o("many", this, t, e)
    );
  }
  sepBy(t, e = 0, r = 1 / 0) {
    const i = (n) => {
      const c = [];
      let f = n;
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
      return c.length > e ? f.ok(c) : n.err([]);
    };
    return new u(
      i,
      o("sepBy", this, t)
    );
  }
  eof() {
    const t = this.skip(b());
    return t.context = o("eof", this), t;
  }
  toString() {
    var t;
    return (t = this.context) == null ? void 0 : t.name;
  }
  static lazy(t) {
    const e = (r) => E(t).parser(r);
    return new u(e, o("lazy", void 0, t));
  }
}
function l(...s) {
  return s.every(
    (t) => {
      var e, r, i, n;
      return (((e = t.context) == null ? void 0 : e.name) === "string" || ((r = t.context) == null ? void 0 : r.name) === "regex" || ((i = t.context) == null ? void 0 : i.name) === "whitespace") && ((n = t.context) == null ? void 0 : n.args);
    }
  );
}
function M(s) {
  var t, e, r, i, n;
  if (((t = s.context) == null ? void 0 : t.name) === "string")
    return (e = s.context) == null ? void 0 : e.args[0].replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  if (((r = s.context) == null ? void 0 : r.name) === "regex" || ((i = s.context) == null ? void 0 : i.name) === "whitespace")
    return (n = s.context) == null ? void 0 : n.args[0].source;
}
function p(s, t = "", e) {
  const r = s.map((c) => `(${M(c)})`).join(t), i = new RegExp(r), n = k(i, e);
  return t !== "|" && (n.context = o("regexConcat", this, i)), n;
}
function R(s, t, e) {
  const r = p([s, t, e], "", (i) => i == null ? void 0 : i[2]);
  return r.context.name = "regexWrap", r;
}
function b() {
  const s = (t) => t.offset >= t.src.length ? t.ok(void 0) : t.err();
  return new u(s, o("eof", void 0));
}
function N(s, t, e) {
  const r = e.value.bind(s);
  e.value = function() {
    const i = (n) => E(r).parser(n);
    return new u(i, o("lazy", void 0, r));
  };
}
function $(...s) {
  if (l(...s))
    return p(s, "|");
  const t = (e) => {
    for (const r of s) {
      const i = r.parser(e);
      if (!i.isError)
        return i;
    }
    return e.err(void 0);
  };
  return new u(
    s.length === 1 ? s[0].parser : t,
    o("any", void 0, ...s)
  );
}
function S(...s) {
  const t = (e) => {
    const r = [];
    for (const i of s) {
      const n = i.parser(e);
      if (n.isError)
        return n;
      n.value !== void 0 && r.push(n.value), e = n;
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
function k(s, t = (e) => e == null ? void 0 : e[0]) {
  const e = s.flags.replace(/y/g, ""), r = new RegExp(s, e + "y"), i = (n) => {
    if (n.offset >= n.src.length)
      return n.err(void 0);
    r.lastIndex = n.offset;
    const c = t(n.src.match(r));
    return c ? n.ok(c, r.lastIndex - n.offset) : c === "" ? n.ok(void 0) : n.err(void 0);
  };
  return new u(
    i,
    o("regex", void 0, s)
  );
}
const d = /\s*/y, y = (s) => {
  var e;
  if (s.offset >= s.src.length)
    return s;
  d.lastIndex = s.offset;
  const t = ((e = s.src.match(d)) == null ? void 0 : e[0]) ?? "";
  return s.ok(s.value, t.length);
}, z = k(/\s*/);
z.context.name = "whitespace";
export {
  u as Parser,
  S as all,
  $ as any,
  b as eof,
  E as getLazyParser,
  N as lazy,
  k as regex,
  K as string,
  z as whitespace
};
//# sourceMappingURL=parse.js.map
