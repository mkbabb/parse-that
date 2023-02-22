class h {
  constructor(t, r = 0, e = 0, n = 0) {
    this.val = t, this.offset = r, this.col_number = e, this.line_number = n;
  }
  value(t) {
    return this.val[t ?? this.offset];
  }
  next() {
    const t = this.value();
    if (t !== void 0) {
      const r = this.offset + 1, e = t === `
` ? this.line_number + 1 : this.line_number, n = t === `
` ? 0 : this.col_number + 1, s = new h(this.val, r, n, e);
      return [t, s];
    } else
      return [t, this];
  }
}
class i {
  constructor(t) {
    this.parser = t;
  }
  parse(t) {
    return this.apply(new h(t));
  }
  apply(t) {
    return this.parser(t);
  }
  then(t) {
    const r = (e) => {
      const [n, s] = this.apply(e);
      if (n) {
        const [c, u] = t.apply(s);
        if (c)
          return [[n, c], u];
      }
      return [[n], e];
    };
    return new i(r);
  }
  or(t) {
    const r = (e) => {
      const [n, s] = this.apply(e);
      return n ? [n, s] : t.apply(e);
    };
    return new i(r);
  }
  chain(t) {
    const r = (e) => {
      const [n, s] = this.apply(e);
      return n ? t(n).apply(s) : [n, s];
    };
    return new i(r);
  }
  map(t) {
    return this.chain((r) => new i((e) => [t(r), e]));
  }
  opt() {
    return this.or(new i((t) => [void 0, t]));
  }
}
function l(o) {
  function t(r) {
    const [, e] = r.next(), [n] = o.apply(e);
    return [n, r];
  }
  return new i(t);
}
function p(o, t = 0, r = 1 / 0) {
  function e(n) {
    const s = [];
    let [c, u] = o.apply(n);
    for (; c && s.length < r; )
      s.push(c), [c, u] = o.apply(u);
    return s.length >= t ? [s, u] : [void 0, u];
  }
  return new i(e);
}
function a(...o) {
  function t(r) {
    const e = [];
    let n = r;
    for (const s of o) {
      const [c, u] = s.apply(n);
      if (c)
        e.push(c), n = u;
      else
        return [void 0, n];
    }
    return [e, n];
  }
  return new i(t);
}
function f(o) {
  function t(r) {
    const [e, n] = r.next();
    return o.test(e) ? [e, n] : [void 0, n];
  }
  return new i(t);
}
export {
  i as Parser,
  h as ParserState,
  l as lookAhead,
  p as many,
  f as match,
  a as sequence
};
