var ED = Object.defineProperty;
var cD = (n, u, D) => u in n ? ED(n, u, { enumerable: !0, configurable: !0, writable: !0, value: D }) : n[u] = D;
var Ru = (n, u, D) => (cD(n, typeof u != "symbol" ? u + "" : u, D), D);
const Lu = (n = 0) => (u) => `\x1B[${u + n}m`, Gu = (n = 0) => (u) => `\x1B[${38 + n};5;${u}m`, Wu = (n = 0) => (u, D, e) => `\x1B[${38 + n};2;${u};${D};${e}m`, j = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
Object.keys(j.modifier);
const fD = Object.keys(j.color), pD = Object.keys(j.bgColor);
[...fD, ...pD];
function hD() {
  const n = /* @__PURE__ */ new Map();
  for (const [u, D] of Object.entries(j)) {
    for (const [e, r] of Object.entries(D))
      j[e] = {
        open: `\x1B[${r[0]}m`,
        close: `\x1B[${r[1]}m`
      }, D[e] = j[e], n.set(r[0], r[1]);
    Object.defineProperty(j, u, {
      value: D,
      enumerable: !1
    });
  }
  return Object.defineProperty(j, "codes", {
    value: n,
    enumerable: !1
  }), j.color.close = "\x1B[39m", j.bgColor.close = "\x1B[49m", j.color.ansi = Lu(), j.color.ansi256 = Gu(), j.color.ansi16m = Wu(), j.bgColor.ansi = Lu(10), j.bgColor.ansi256 = Gu(10), j.bgColor.ansi16m = Wu(10), Object.defineProperties(j, {
    rgbToAnsi256: {
      value(u, D, e) {
        return u === D && D === e ? u < 8 ? 16 : u > 248 ? 231 : Math.round((u - 8) / 247 * 24) + 232 : 16 + 36 * Math.round(u / 255 * 5) + 6 * Math.round(D / 255 * 5) + Math.round(e / 255 * 5);
      },
      enumerable: !1
    },
    hexToRgb: {
      value(u) {
        const D = /[a-f\d]{6}|[a-f\d]{3}/i.exec(u.toString(16));
        if (!D)
          return [0, 0, 0];
        let [e] = D;
        e.length === 3 && (e = [...e].map((s) => s + s).join(""));
        const r = Number.parseInt(e, 16);
        return [
          /* eslint-disable no-bitwise */
          r >> 16 & 255,
          r >> 8 & 255,
          r & 255
          /* eslint-enable no-bitwise */
        ];
      },
      enumerable: !1
    },
    hexToAnsi256: {
      value: (u) => j.rgbToAnsi256(...j.hexToRgb(u)),
      enumerable: !1
    },
    ansi256ToAnsi: {
      value(u) {
        if (u < 8)
          return 30 + u;
        if (u < 16)
          return 90 + (u - 8);
        let D, e, r;
        if (u >= 232)
          D = ((u - 232) * 10 + 8) / 255, e = D, r = D;
        else {
          u -= 16;
          const m = u % 36;
          D = Math.floor(u / 36) / 5, e = Math.floor(m / 6) / 5, r = m % 6 / 5;
        }
        const s = Math.max(D, e, r) * 2;
        if (s === 0)
          return 30;
        let E = 30 + (Math.round(r) << 2 | Math.round(e) << 1 | Math.round(D));
        return s === 2 && (E += 60), E;
      },
      enumerable: !1
    },
    rgbToAnsi: {
      value: (u, D, e) => j.ansi256ToAnsi(j.rgbToAnsi256(u, D, e)),
      enumerable: !1
    },
    hexToAnsi: {
      value: (u) => j.ansi256ToAnsi(j.hexToAnsi256(u)),
      enumerable: !1
    }
  }), j;
}
const tu = hD(), Au = (() => {
  if (navigator.userAgentData) {
    const n = navigator.userAgentData.brands.find(({ brand: u }) => u === "Chromium");
    if (n && n.version > 93)
      return 3;
  }
  return /\b(Chrome|Chromium)\//.test(navigator.userAgent) ? 1 : 0;
})(), qu = Au !== 0 && {
  level: Au,
  hasBasic: !0,
  has256: Au >= 2,
  has16m: Au >= 3
}, gD = {
  stdout: qu,
  stderr: qu
};
function BD(n, u, D) {
  let e = n.indexOf(u);
  if (e === -1)
    return n;
  const r = u.length;
  let s = 0, E = "";
  do
    E += n.slice(s, e) + u + D, s = e + r, e = n.indexOf(u, s);
  while (e !== -1);
  return E += n.slice(s), E;
}
function dD(n, u, D, e) {
  let r = 0, s = "";
  do {
    const E = n[e - 1] === "\r";
    s += n.slice(r, E ? e - 1 : e) + u + (E ? `\r
` : `
`) + D, r = e + 1, e = n.indexOf(`
`, r);
  } while (e !== -1);
  return s += n.slice(r), s;
}
const { stdout: zu, stderr: Ku } = gD, Ou = Symbol("GENERATOR"), Eu = Symbol("STYLER"), Bu = Symbol("IS_EMPTY"), Uu = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
], cu = /* @__PURE__ */ Object.create(null), bD = (n, u = {}) => {
  if (u.level && !(Number.isInteger(u.level) && u.level >= 0 && u.level <= 3))
    throw new Error("The `level` option should be an integer from 0 to 3");
  const D = zu ? zu.level : 0;
  n.level = u.level === void 0 ? D : u.level;
}, AD = (n) => {
  const u = (...D) => D.join(" ");
  return bD(u, n), Object.setPrototypeOf(u, du.prototype), u;
};
function du(n) {
  return AD(n);
}
Object.setPrototypeOf(du.prototype, Function.prototype);
for (const [n, u] of Object.entries(tu))
  cu[n] = {
    get() {
      const D = mu(this, _u(u.open, u.close, this[Eu]), this[Bu]);
      return Object.defineProperty(this, n, { value: D }), D;
    }
  };
cu.visible = {
  get() {
    const n = mu(this, this[Eu], !0);
    return Object.defineProperty(this, "visible", { value: n }), n;
  }
};
const ju = (n, u, D, ...e) => n === "rgb" ? u === "ansi16m" ? tu[D].ansi16m(...e) : u === "ansi256" ? tu[D].ansi256(tu.rgbToAnsi256(...e)) : tu[D].ansi(tu.rgbToAnsi(...e)) : n === "hex" ? ju("rgb", u, D, ...tu.hexToRgb(...e)) : tu[D][n](...e), yD = ["rgb", "hex", "ansi256"];
for (const n of yD) {
  cu[n] = {
    get() {
      const { level: D } = this;
      return function(...e) {
        const r = _u(ju(n, Uu[D], "color", ...e), tu.color.close, this[Eu]);
        return mu(this, r, this[Bu]);
      };
    }
  };
  const u = "bg" + n[0].toUpperCase() + n.slice(1);
  cu[u] = {
    get() {
      const { level: D } = this;
      return function(...e) {
        const r = _u(ju(n, Uu[D], "bgColor", ...e), tu.bgColor.close, this[Eu]);
        return mu(this, r, this[Bu]);
      };
    }
  };
}
const mD = Object.defineProperties(() => {
}, {
  ...cu,
  level: {
    enumerable: !0,
    get() {
      return this[Ou].level;
    },
    set(n) {
      this[Ou].level = n;
    }
  }
}), _u = (n, u, D) => {
  let e, r;
  return D === void 0 ? (e = n, r = u) : (e = D.openAll + n, r = u + D.closeAll), {
    open: n,
    close: u,
    openAll: e,
    closeAll: r,
    parent: D
  };
}, mu = (n, u, D) => {
  const e = (...r) => xD(e, r.length === 1 ? "" + r[0] : r.join(" "));
  return Object.setPrototypeOf(e, mD), e[Ou] = n, e[Eu] = u, e[Bu] = D, e;
}, xD = (n, u) => {
  if (n.level <= 0 || !u)
    return n[Bu] ? "" : u;
  let D = n[Eu];
  if (D === void 0)
    return u;
  const { openAll: e, closeAll: r } = D;
  if (u.includes("\x1B"))
    for (; D !== void 0; )
      u = BD(u, D.close, D.open), D = D.parent;
  const s = u.indexOf(`
`);
  return s !== -1 && (u = dD(u, r, e, s)), e + u + r;
};
Object.defineProperties(du.prototype, cu);
const K = du();
du({ level: Ku ? Ku.level : 0 });
class xu {
  constructor(u, D = void 0, e = 0, r = !1) {
    this.src = u, this.value = D, this.offset = e, this.isError = r;
  }
  ok(u, D = 0) {
    return new xu(this.src, u, this.offset + D);
  }
  err(u, D = 0) {
    const e = this.ok(u, D);
    return e.isError = !0, e;
  }
  from(u, D = 0) {
    return new xu(this.src, u, this.offset + D, this.isError);
  }
  getColumnNumber() {
    const u = this.offset, D = this.src.lastIndexOf(`
`, u), e = D === -1 ? u : u - (D + 1);
    return Math.max(0, e);
  }
  getLineNumber() {
    const D = this.src.slice(0, this.offset).split(`
`).length - 1;
    return Math.max(0, D);
  }
  addCursor(u = "^", D = !1) {
    return vD.call(this, u, D);
  }
}
function _(n, u, ...D) {
  return {
    name: n,
    parser: u,
    args: D
  };
}
var W = {}, kD = {
  get exports() {
    return W;
  },
  set exports(n) {
    W = n;
  }
};
(function(n, u) {
  (function(D) {
    n.exports = D();
  })(function() {
    var D = Object.getOwnPropertyNames, e = (s, E) => function() {
      return E || (0, s[D(s)[0]])((E = { exports: {} }).exports, E), E.exports;
    }, r = e({
      "dist/_doc.js.umd.js"(s, E) {
        var m = Object.create, q = Object.defineProperty, w = Object.getOwnPropertyDescriptor, U = Object.getOwnPropertyNames, su = Object.getPrototypeOf, iu = Object.prototype.hasOwnProperty, Q = (F, B) => function() {
          return F && (B = (0, F[U(F)[0]])(F = 0)), B;
        }, J = (F, B) => function() {
          return B || (0, F[U(F)[0]])((B = {
            exports: {}
          }).exports, B), B.exports;
        }, ou = (F, B) => {
          for (var d in B)
            q(F, d, {
              get: B[d],
              enumerable: !0
            });
        }, P = (F, B, d, b) => {
          if (B && typeof B == "object" || typeof B == "function")
            for (let x of U(B))
              !iu.call(F, x) && x !== d && q(F, x, {
                get: () => B[x],
                enumerable: !(b = w(B, x)) || b.enumerable
              });
          return F;
        }, uu = (F, B, d) => (d = F != null ? m(su(F)) : {}, P(B || !F || !F.__esModule ? q(d, "default", {
          value: F,
          enumerable: !0
        }) : d, F)), bu = (F) => P(q({}, "__esModule", {
          value: !0
        }), F), V = Q({
          "<define:process>"() {
          }
        }), ku = J({
          "src/document/doc-builders.js"(F, B) {
            V();
            function d(p) {
              return {
                type: "concat",
                parts: p
              };
            }
            function b(p) {
              return {
                type: "indent",
                contents: p
              };
            }
            function x(p, t) {
              return {
                type: "align",
                contents: t,
                n: p
              };
            }
            function M(p) {
              let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
              return {
                type: "group",
                id: t.id,
                contents: p,
                break: Boolean(t.shouldBreak),
                expandedStates: t.expandedStates
              };
            }
            function h(p) {
              return x(Number.NEGATIVE_INFINITY, p);
            }
            function T(p) {
              return x({
                type: "root"
              }, p);
            }
            function $(p) {
              return x(-1, p);
            }
            function A(p, t) {
              return M(p[0], Object.assign(Object.assign({}, t), {}, {
                expandedStates: p
              }));
            }
            function Y(p) {
              return {
                type: "fill",
                parts: p
              };
            }
            function a(p, t) {
              let i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
              return {
                type: "if-break",
                breakContents: p,
                flatContents: t,
                groupId: i.groupId
              };
            }
            function I(p, t) {
              return {
                type: "indent-if-break",
                contents: p,
                groupId: t.groupId,
                negate: t.negate
              };
            }
            function L(p) {
              return {
                type: "line-suffix",
                contents: p
              };
            }
            var v = {
              type: "line-suffix-boundary"
            }, Z = {
              type: "break-parent"
            }, nu = {
              type: "trim"
            }, ru = {
              type: "line",
              hard: !0
            }, H = {
              type: "line",
              hard: !0,
              literal: !0
            }, fu = {
              type: "line"
            }, y = {
              type: "line",
              soft: !0
            }, S = d([ru, Z]), O = d([H, Z]), z = {
              type: "cursor",
              placeholder: Symbol("cursor")
            };
            function R(p, t) {
              const i = [];
              for (let o = 0; o < t.length; o++)
                o !== 0 && i.push(p), i.push(t[o]);
              return d(i);
            }
            function g(p, t, i) {
              let o = p;
              if (t > 0) {
                for (let c = 0; c < Math.floor(t / i); ++c)
                  o = b(o);
                o = x(t % i, o), o = x(Number.NEGATIVE_INFINITY, o);
              }
              return o;
            }
            function k(p, t) {
              return {
                type: "label",
                label: p,
                contents: t
              };
            }
            B.exports = {
              concat: d,
              join: R,
              line: fu,
              softline: y,
              hardline: S,
              literalline: O,
              group: M,
              conditionalGroup: A,
              fill: Y,
              lineSuffix: L,
              lineSuffixBoundary: v,
              cursor: z,
              breakParent: Z,
              ifBreak: a,
              trim: nu,
              indent: b,
              indentIfBreak: I,
              align: x,
              addAlignmentToDoc: g,
              markAsRoot: T,
              dedentToRoot: h,
              dedent: $,
              hardlineWithoutBreakParent: ru,
              literallineWithoutBreakParent: H,
              label: k
            };
          }
        }), Qu = J({
          "src/common/end-of-line.js"(F, B) {
            V();
            function d(h) {
              const T = h.indexOf("\r");
              return T >= 0 ? h.charAt(T + 1) === `
` ? "crlf" : "cr" : "lf";
            }
            function b(h) {
              switch (h) {
                case "cr":
                  return "\r";
                case "crlf":
                  return `\r
`;
                default:
                  return `
`;
              }
            }
            function x(h, T) {
              let $;
              switch (T) {
                case `
`:
                  $ = /\n/g;
                  break;
                case "\r":
                  $ = /\r/g;
                  break;
                case `\r
`:
                  $ = /\r\n/g;
                  break;
                default:
                  throw new Error(`Unexpected "eol" ${JSON.stringify(T)}.`);
              }
              const A = h.match($);
              return A ? A.length : 0;
            }
            function M(h) {
              return h.replace(/\r\n?/g, `
`);
            }
            B.exports = {
              guessEndOfLine: d,
              convertEndOfLineToChars: b,
              countEndOfLineChars: x,
              normalizeEndOfLine: M
            };
          }
        }), Tu = J({
          "src/utils/get-last.js"(F, B) {
            V();
            var d = (b) => b[b.length - 1];
            B.exports = d;
          }
        });
        function uD() {
          let {
            onlyFirst: F = !1
          } = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
          const B = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"].join("|");
          return new RegExp(B, F ? void 0 : "g");
        }
        var DD = Q({
          "node_modules/strip-ansi/node_modules/ansi-regex/index.js"() {
            V();
          }
        });
        function eD(F) {
          if (typeof F != "string")
            throw new TypeError(`Expected a \`string\`, got \`${typeof F}\``);
          return F.replace(uD(), "");
        }
        var tD = Q({
          "node_modules/strip-ansi/index.js"() {
            V(), DD();
          }
        });
        function nD(F) {
          return Number.isInteger(F) ? F >= 4352 && (F <= 4447 || F === 9001 || F === 9002 || 11904 <= F && F <= 12871 && F !== 12351 || 12880 <= F && F <= 19903 || 19968 <= F && F <= 42182 || 43360 <= F && F <= 43388 || 44032 <= F && F <= 55203 || 63744 <= F && F <= 64255 || 65040 <= F && F <= 65049 || 65072 <= F && F <= 65131 || 65281 <= F && F <= 65376 || 65504 <= F && F <= 65510 || 110592 <= F && F <= 110593 || 127488 <= F && F <= 127569 || 131072 <= F && F <= 262141) : !1;
        }
        var rD = Q({
          "node_modules/is-fullwidth-code-point/index.js"() {
            V();
          }
        }), sD = J({
          "node_modules/emoji-regex/index.js"(F, B) {
            V(), B.exports = function() {
              return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
            };
          }
        }), Nu = {};
        ou(Nu, {
          default: () => iD
        });
        function iD(F) {
          if (typeof F != "string" || F.length === 0 || (F = eD(F), F.length === 0))
            return 0;
          F = F.replace((0, Mu.default)(), "  ");
          let B = 0;
          for (let d = 0; d < F.length; d++) {
            const b = F.codePointAt(d);
            b <= 31 || b >= 127 && b <= 159 || b >= 768 && b <= 879 || (b > 65535 && d++, B += nD(b) ? 2 : 1);
          }
          return B;
        }
        var Mu, oD = Q({
          "node_modules/string-width/index.js"() {
            V(), tD(), rD(), Mu = uu(sD());
          }
        }), FD = J({
          "src/utils/get-string-width.js"(F, B) {
            V();
            var d = (oD(), bu(Nu)).default, b = /[^\x20-\x7F]/;
            function x(M) {
              return M ? b.test(M) ? d(M) : M.length : 0;
            }
            B.exports = x;
          }
        }), vu = J({
          "src/document/doc-utils.js"(F, B) {
            V();
            var d = Tu(), {
              literalline: b,
              join: x
            } = ku(), M = (t) => Array.isArray(t) || t && t.type === "concat", h = (t) => {
              if (Array.isArray(t))
                return t;
              if (t.type !== "concat" && t.type !== "fill")
                throw new Error("Expect doc type to be `concat` or `fill`.");
              return t.parts;
            }, T = {};
            function $(t, i, o, c) {
              const l = [t];
              for (; l.length > 0; ) {
                const C = l.pop();
                if (C === T) {
                  o(l.pop());
                  continue;
                }
                if (o && l.push(C, T), !i || i(C) !== !1)
                  if (M(C) || C.type === "fill") {
                    const f = h(C);
                    for (let G = f.length, Du = G - 1; Du >= 0; --Du)
                      l.push(f[Du]);
                  } else if (C.type === "if-break")
                    C.flatContents && l.push(C.flatContents), C.breakContents && l.push(C.breakContents);
                  else if (C.type === "group" && C.expandedStates)
                    if (c)
                      for (let f = C.expandedStates.length, G = f - 1; G >= 0; --G)
                        l.push(C.expandedStates[G]);
                    else
                      l.push(C.contents);
                  else
                    C.contents && l.push(C.contents);
              }
            }
            function A(t, i) {
              const o = /* @__PURE__ */ new Map();
              return c(t);
              function c(C) {
                if (o.has(C))
                  return o.get(C);
                const f = l(C);
                return o.set(C, f), f;
              }
              function l(C) {
                if (Array.isArray(C))
                  return i(C.map(c));
                if (C.type === "concat" || C.type === "fill") {
                  const f = C.parts.map(c);
                  return i(Object.assign(Object.assign({}, C), {}, {
                    parts: f
                  }));
                }
                if (C.type === "if-break") {
                  const f = C.breakContents && c(C.breakContents), G = C.flatContents && c(C.flatContents);
                  return i(Object.assign(Object.assign({}, C), {}, {
                    breakContents: f,
                    flatContents: G
                  }));
                }
                if (C.type === "group" && C.expandedStates) {
                  const f = C.expandedStates.map(c), G = f[0];
                  return i(Object.assign(Object.assign({}, C), {}, {
                    contents: G,
                    expandedStates: f
                  }));
                }
                if (C.contents) {
                  const f = c(C.contents);
                  return i(Object.assign(Object.assign({}, C), {}, {
                    contents: f
                  }));
                }
                return i(C);
              }
            }
            function Y(t, i, o) {
              let c = o, l = !1;
              function C(f) {
                const G = i(f);
                if (G !== void 0 && (l = !0, c = G), l)
                  return !1;
              }
              return $(t, C), c;
            }
            function a(t) {
              if (t.type === "group" && t.break || t.type === "line" && t.hard || t.type === "break-parent")
                return !0;
            }
            function I(t) {
              return Y(t, a, !1);
            }
            function L(t) {
              if (t.length > 0) {
                const i = d(t);
                !i.expandedStates && !i.break && (i.break = "propagated");
              }
              return null;
            }
            function v(t) {
              const i = /* @__PURE__ */ new Set(), o = [];
              function c(C) {
                if (C.type === "break-parent" && L(o), C.type === "group") {
                  if (o.push(C), i.has(C))
                    return !1;
                  i.add(C);
                }
              }
              function l(C) {
                C.type === "group" && o.pop().break && L(o);
              }
              $(t, c, l, !0);
            }
            function Z(t) {
              return t.type === "line" && !t.hard ? t.soft ? "" : " " : t.type === "if-break" ? t.flatContents || "" : t;
            }
            function nu(t) {
              return A(t, Z);
            }
            var ru = (t, i) => t && t.type === "line" && t.hard && i && i.type === "break-parent";
            function H(t) {
              if (!t)
                return t;
              if (M(t) || t.type === "fill") {
                const i = h(t);
                for (; i.length > 1 && ru(...i.slice(-2)); )
                  i.length -= 2;
                if (i.length > 0) {
                  const o = H(d(i));
                  i[i.length - 1] = o;
                }
                return Array.isArray(t) ? i : Object.assign(Object.assign({}, t), {}, {
                  parts: i
                });
              }
              switch (t.type) {
                case "align":
                case "indent":
                case "indent-if-break":
                case "group":
                case "line-suffix":
                case "label": {
                  const i = H(t.contents);
                  return Object.assign(Object.assign({}, t), {}, {
                    contents: i
                  });
                }
                case "if-break": {
                  const i = H(t.breakContents), o = H(t.flatContents);
                  return Object.assign(Object.assign({}, t), {}, {
                    breakContents: i,
                    flatContents: o
                  });
                }
              }
              return t;
            }
            function fu(t) {
              return H(S(t));
            }
            function y(t) {
              switch (t.type) {
                case "fill":
                  if (t.parts.every((o) => o === ""))
                    return "";
                  break;
                case "group":
                  if (!t.contents && !t.id && !t.break && !t.expandedStates)
                    return "";
                  if (t.contents.type === "group" && t.contents.id === t.id && t.contents.break === t.break && t.contents.expandedStates === t.expandedStates)
                    return t.contents;
                  break;
                case "align":
                case "indent":
                case "indent-if-break":
                case "line-suffix":
                  if (!t.contents)
                    return "";
                  break;
                case "if-break":
                  if (!t.flatContents && !t.breakContents)
                    return "";
                  break;
              }
              if (!M(t))
                return t;
              const i = [];
              for (const o of h(t)) {
                if (!o)
                  continue;
                const [c, ...l] = M(o) ? h(o) : [o];
                typeof c == "string" && typeof d(i) == "string" ? i[i.length - 1] += c : i.push(c), i.push(...l);
              }
              return i.length === 0 ? "" : i.length === 1 ? i[0] : Array.isArray(t) ? i : Object.assign(Object.assign({}, t), {}, {
                parts: i
              });
            }
            function S(t) {
              return A(t, (i) => y(i));
            }
            function O(t) {
              const i = [], o = t.filter(Boolean);
              for (; o.length > 0; ) {
                const c = o.shift();
                if (c) {
                  if (M(c)) {
                    o.unshift(...h(c));
                    continue;
                  }
                  if (i.length > 0 && typeof d(i) == "string" && typeof c == "string") {
                    i[i.length - 1] += c;
                    continue;
                  }
                  i.push(c);
                }
              }
              return i;
            }
            function z(t) {
              return A(t, (i) => Array.isArray(i) ? O(i) : i.parts ? Object.assign(Object.assign({}, i), {}, {
                parts: O(i.parts)
              }) : i);
            }
            function R(t) {
              return A(t, (i) => typeof i == "string" && i.includes(`
`) ? g(i) : i);
            }
            function g(t) {
              let i = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : b;
              return x(i, t.split(`
`)).parts;
            }
            function k(t) {
              if (t.type === "line")
                return !0;
            }
            function p(t) {
              return Y(t, k, !1);
            }
            B.exports = {
              isConcat: M,
              getDocParts: h,
              willBreak: I,
              traverseDoc: $,
              findInDoc: Y,
              mapDoc: A,
              propagateBreaks: v,
              removeLines: nu,
              stripTrailingHardline: fu,
              normalizeParts: O,
              normalizeDoc: z,
              cleanDoc: S,
              replaceTextEndOfLine: g,
              replaceEndOfLine: R,
              canBreak: p
            };
          }
        }), aD = J({
          "src/document/doc-printer.js"(F, B) {
            V();
            var {
              convertEndOfLineToChars: d
            } = Qu(), b = Tu(), x = FD(), {
              fill: M,
              cursor: h,
              indent: T
            } = ku(), {
              isConcat: $,
              getDocParts: A
            } = vu(), Y, a = 1, I = 2;
            function L() {
              return {
                value: "",
                length: 0,
                queue: []
              };
            }
            function v(y, S) {
              return nu(y, {
                type: "indent"
              }, S);
            }
            function Z(y, S, O) {
              return S === Number.NEGATIVE_INFINITY ? y.root || L() : S < 0 ? nu(y, {
                type: "dedent"
              }, O) : S ? S.type === "root" ? Object.assign(Object.assign({}, y), {}, {
                root: y
              }) : nu(y, {
                type: typeof S == "string" ? "stringAlign" : "numberAlign",
                n: S
              }, O) : y;
            }
            function nu(y, S, O) {
              const z = S.type === "dedent" ? y.queue.slice(0, -1) : [...y.queue, S];
              let R = "", g = 0, k = 0, p = 0;
              for (const f of z)
                switch (f.type) {
                  case "indent":
                    o(), O.useTabs ? t(1) : i(O.tabWidth);
                    break;
                  case "stringAlign":
                    o(), R += f.n, g += f.n.length;
                    break;
                  case "numberAlign":
                    k += 1, p += f.n;
                    break;
                  default:
                    throw new Error(`Unexpected type '${f.type}'`);
                }
              return l(), Object.assign(Object.assign({}, y), {}, {
                value: R,
                length: g,
                queue: z
              });
              function t(f) {
                R += "	".repeat(f), g += O.tabWidth * f;
              }
              function i(f) {
                R += " ".repeat(f), g += f;
              }
              function o() {
                O.useTabs ? c() : l();
              }
              function c() {
                k > 0 && t(k), C();
              }
              function l() {
                p > 0 && i(p), C();
              }
              function C() {
                k = 0, p = 0;
              }
            }
            function ru(y) {
              if (y.length === 0)
                return 0;
              let S = 0;
              for (; y.length > 0 && typeof b(y) == "string" && /^[\t ]*$/.test(b(y)); )
                S += y.pop().length;
              if (y.length > 0 && typeof b(y) == "string") {
                const O = b(y).replace(/[\t ]*$/, "");
                S += b(y).length - O.length, y[y.length - 1] = O;
              }
              return S;
            }
            function H(y, S, O, z, R) {
              let g = S.length;
              const k = [y], p = [];
              for (; O >= 0; ) {
                if (k.length === 0) {
                  if (g === 0)
                    return !0;
                  k.push(S[--g]);
                  continue;
                }
                const {
                  mode: t,
                  doc: i
                } = k.pop();
                if (typeof i == "string")
                  p.push(i), O -= x(i);
                else if ($(i) || i.type === "fill") {
                  const o = A(i);
                  for (let c = o.length - 1; c >= 0; c--)
                    k.push({
                      mode: t,
                      doc: o[c]
                    });
                } else
                  switch (i.type) {
                    case "indent":
                    case "align":
                    case "indent-if-break":
                    case "label":
                      k.push({
                        mode: t,
                        doc: i.contents
                      });
                      break;
                    case "trim":
                      O += ru(p);
                      break;
                    case "group": {
                      if (R && i.break)
                        return !1;
                      const o = i.break ? a : t, c = i.expandedStates && o === a ? b(i.expandedStates) : i.contents;
                      k.push({
                        mode: o,
                        doc: c
                      });
                      break;
                    }
                    case "if-break": {
                      const c = (i.groupId ? Y[i.groupId] || I : t) === a ? i.breakContents : i.flatContents;
                      c && k.push({
                        mode: t,
                        doc: c
                      });
                      break;
                    }
                    case "line":
                      if (t === a || i.hard)
                        return !0;
                      i.soft || (p.push(" "), O--);
                      break;
                    case "line-suffix":
                      z = !0;
                      break;
                    case "line-suffix-boundary":
                      if (z)
                        return !1;
                      break;
                  }
              }
              return !1;
            }
            function fu(y, S) {
              Y = {};
              const O = S.printWidth, z = d(S.endOfLine);
              let R = 0;
              const g = [{
                ind: L(),
                mode: a,
                doc: y
              }], k = [];
              let p = !1;
              const t = [];
              for (; g.length > 0; ) {
                const {
                  ind: o,
                  mode: c,
                  doc: l
                } = g.pop();
                if (typeof l == "string") {
                  const C = z !== `
` ? l.replace(/\n/g, z) : l;
                  k.push(C), R += x(C);
                } else if ($(l)) {
                  const C = A(l);
                  for (let f = C.length - 1; f >= 0; f--)
                    g.push({
                      ind: o,
                      mode: c,
                      doc: C[f]
                    });
                } else
                  switch (l.type) {
                    case "cursor":
                      k.push(h.placeholder);
                      break;
                    case "indent":
                      g.push({
                        ind: v(o, S),
                        mode: c,
                        doc: l.contents
                      });
                      break;
                    case "align":
                      g.push({
                        ind: Z(o, l.n, S),
                        mode: c,
                        doc: l.contents
                      });
                      break;
                    case "trim":
                      R -= ru(k);
                      break;
                    case "group":
                      switch (c) {
                        case I:
                          if (!p) {
                            g.push({
                              ind: o,
                              mode: l.break ? a : I,
                              doc: l.contents
                            });
                            break;
                          }
                        case a: {
                          p = !1;
                          const C = {
                            ind: o,
                            mode: I,
                            doc: l.contents
                          }, f = O - R, G = t.length > 0;
                          if (!l.break && H(C, g, f, G))
                            g.push(C);
                          else if (l.expandedStates) {
                            const Du = b(l.expandedStates);
                            if (l.break) {
                              g.push({
                                ind: o,
                                mode: a,
                                doc: Du
                              });
                              break;
                            } else
                              for (let eu = 1; eu < l.expandedStates.length + 1; eu++)
                                if (eu >= l.expandedStates.length) {
                                  g.push({
                                    ind: o,
                                    mode: a,
                                    doc: Du
                                  });
                                  break;
                                } else {
                                  const pu = l.expandedStates[eu], Cu = {
                                    ind: o,
                                    mode: I,
                                    doc: pu
                                  };
                                  if (H(Cu, g, f, G)) {
                                    g.push(Cu);
                                    break;
                                  }
                                }
                          } else
                            g.push({
                              ind: o,
                              mode: a,
                              doc: l.contents
                            });
                          break;
                        }
                      }
                      l.id && (Y[l.id] = b(g).mode);
                      break;
                    case "fill": {
                      const C = O - R, {
                        parts: f
                      } = l;
                      if (f.length === 0)
                        break;
                      const [G, Du] = f, eu = {
                        ind: o,
                        mode: I,
                        doc: G
                      }, pu = {
                        ind: o,
                        mode: a,
                        doc: G
                      }, Cu = H(eu, [], C, t.length > 0, !0);
                      if (f.length === 1) {
                        Cu ? g.push(eu) : g.push(pu);
                        break;
                      }
                      const $u = {
                        ind: o,
                        mode: I,
                        doc: Du
                      }, Su = {
                        ind: o,
                        mode: a,
                        doc: Du
                      };
                      if (f.length === 2) {
                        Cu ? g.push($u, eu) : g.push(Su, pu);
                        break;
                      }
                      f.splice(0, 2);
                      const wu = {
                        ind: o,
                        mode: c,
                        doc: M(f)
                      }, lD = f[0];
                      H({
                        ind: o,
                        mode: I,
                        doc: [G, Du, lD]
                      }, [], C, t.length > 0, !0) ? g.push(wu, $u, eu) : Cu ? g.push(wu, Su, eu) : g.push(wu, Su, pu);
                      break;
                    }
                    case "if-break":
                    case "indent-if-break": {
                      const C = l.groupId ? Y[l.groupId] : c;
                      if (C === a) {
                        const f = l.type === "if-break" ? l.breakContents : l.negate ? l.contents : T(l.contents);
                        f && g.push({
                          ind: o,
                          mode: c,
                          doc: f
                        });
                      }
                      if (C === I) {
                        const f = l.type === "if-break" ? l.flatContents : l.negate ? T(l.contents) : l.contents;
                        f && g.push({
                          ind: o,
                          mode: c,
                          doc: f
                        });
                      }
                      break;
                    }
                    case "line-suffix":
                      t.push({
                        ind: o,
                        mode: c,
                        doc: l.contents
                      });
                      break;
                    case "line-suffix-boundary":
                      t.length > 0 && g.push({
                        ind: o,
                        mode: c,
                        doc: {
                          type: "line",
                          hard: !0
                        }
                      });
                      break;
                    case "line":
                      switch (c) {
                        case I:
                          if (l.hard)
                            p = !0;
                          else {
                            l.soft || (k.push(" "), R += 1);
                            break;
                          }
                        case a:
                          if (t.length > 0) {
                            g.push({
                              ind: o,
                              mode: c,
                              doc: l
                            }, ...t.reverse()), t.length = 0;
                            break;
                          }
                          l.literal ? o.root ? (k.push(z, o.root.value), R = o.root.length) : (k.push(z), R = 0) : (R -= ru(k), k.push(z + o.value), R = o.length);
                          break;
                      }
                      break;
                    case "label":
                      g.push({
                        ind: o,
                        mode: c,
                        doc: l.contents
                      });
                      break;
                  }
                g.length === 0 && t.length > 0 && (g.push(...t.reverse()), t.length = 0);
              }
              const i = k.indexOf(h.placeholder);
              if (i !== -1) {
                const o = k.indexOf(h.placeholder, i + 1), c = k.slice(0, i).join(""), l = k.slice(i + 1, o).join(""), C = k.slice(o + 1).join("");
                return {
                  formatted: c + l + C,
                  cursorNodeStart: c.length,
                  cursorNodeText: l
                };
              }
              return {
                formatted: k.join("")
              };
            }
            B.exports = {
              printDocToString: fu
            };
          }
        }), CD = J({
          "src/document/doc-debug.js"(F, B) {
            V();
            var {
              isConcat: d,
              getDocParts: b
            } = vu();
            function x(h) {
              if (!h)
                return "";
              if (d(h)) {
                const T = [];
                for (const $ of b(h))
                  if (d($))
                    T.push(...x($).parts);
                  else {
                    const A = x($);
                    A !== "" && T.push(A);
                  }
                return {
                  type: "concat",
                  parts: T
                };
              }
              return h.type === "if-break" ? Object.assign(Object.assign({}, h), {}, {
                breakContents: x(h.breakContents),
                flatContents: x(h.flatContents)
              }) : h.type === "group" ? Object.assign(Object.assign({}, h), {}, {
                contents: x(h.contents),
                expandedStates: h.expandedStates && h.expandedStates.map(x)
              }) : h.type === "fill" ? {
                type: "fill",
                parts: h.parts.map(x)
              } : h.contents ? Object.assign(Object.assign({}, h), {}, {
                contents: x(h.contents)
              }) : h;
            }
            function M(h) {
              const T = /* @__PURE__ */ Object.create(null), $ = /* @__PURE__ */ new Set();
              return A(x(h));
              function A(a, I, L) {
                if (typeof a == "string")
                  return JSON.stringify(a);
                if (d(a)) {
                  const v = b(a).map(A).filter(Boolean);
                  return v.length === 1 ? v[0] : `[${v.join(", ")}]`;
                }
                if (a.type === "line") {
                  const v = Array.isArray(L) && L[I + 1] && L[I + 1].type === "break-parent";
                  return a.literal ? v ? "literalline" : "literallineWithoutBreakParent" : a.hard ? v ? "hardline" : "hardlineWithoutBreakParent" : a.soft ? "softline" : "line";
                }
                if (a.type === "break-parent")
                  return Array.isArray(L) && L[I - 1] && L[I - 1].type === "line" && L[I - 1].hard ? void 0 : "breakParent";
                if (a.type === "trim")
                  return "trim";
                if (a.type === "indent")
                  return "indent(" + A(a.contents) + ")";
                if (a.type === "align")
                  return a.n === Number.NEGATIVE_INFINITY ? "dedentToRoot(" + A(a.contents) + ")" : a.n < 0 ? "dedent(" + A(a.contents) + ")" : a.n.type === "root" ? "markAsRoot(" + A(a.contents) + ")" : "align(" + JSON.stringify(a.n) + ", " + A(a.contents) + ")";
                if (a.type === "if-break")
                  return "ifBreak(" + A(a.breakContents) + (a.flatContents ? ", " + A(a.flatContents) : "") + (a.groupId ? (a.flatContents ? "" : ', ""') + `, { groupId: ${Y(a.groupId)} }` : "") + ")";
                if (a.type === "indent-if-break") {
                  const v = [];
                  a.negate && v.push("negate: true"), a.groupId && v.push(`groupId: ${Y(a.groupId)}`);
                  const Z = v.length > 0 ? `, { ${v.join(", ")} }` : "";
                  return `indentIfBreak(${A(a.contents)}${Z})`;
                }
                if (a.type === "group") {
                  const v = [];
                  a.break && a.break !== "propagated" && v.push("shouldBreak: true"), a.id && v.push(`id: ${Y(a.id)}`);
                  const Z = v.length > 0 ? `, { ${v.join(", ")} }` : "";
                  return a.expandedStates ? `conditionalGroup([${a.expandedStates.map((nu) => A(nu)).join(",")}]${Z})` : `group(${A(a.contents)}${Z})`;
                }
                if (a.type === "fill")
                  return `fill([${a.parts.map((v) => A(v)).join(", ")}])`;
                if (a.type === "line-suffix")
                  return "lineSuffix(" + A(a.contents) + ")";
                if (a.type === "line-suffix-boundary")
                  return "lineSuffixBoundary";
                if (a.type === "label")
                  return `label(${JSON.stringify(a.label)}, ${A(a.contents)})`;
                throw new Error("Unknown doc type " + a.type);
              }
              function Y(a) {
                if (typeof a != "symbol")
                  return JSON.stringify(String(a));
                if (a in T)
                  return T[a];
                const I = String(a).slice(7, -1) || "symbol";
                for (let L = 0; ; L++) {
                  const v = I + (L > 0 ? ` #${L}` : "");
                  if (!$.has(v))
                    return $.add(v), T[a] = `Symbol.for(${JSON.stringify(v)})`;
                }
              }
            }
            B.exports = {
              printDocToDebug: M
            };
          }
        });
        V(), E.exports = {
          builders: ku(),
          printer: aD(),
          utils: vu(),
          debug: CD()
        };
      }
    });
    return r();
  });
})(kD);
const Yu = 4, Vu = {
  printWidth: 30,
  tabWidth: 4,
  useTabs: !1
};
function Hu(n) {
  return W.printer.printDocToString(n, Vu).formatted;
}
function vD(n = "^", u = !1) {
  const D = (u ? K.red : K.green).bold, e = this.src.split(`
`), r = Math.min(e.length - 1, this.getLineNumber()), s = Math.max(r - Yu, 0), E = Math.min(r + Yu + 1, e.length), m = e.slice(s, E);
  if (n) {
    const w = " ".repeat(this.getColumnNumber()) + D(n);
    m.splice(r - s + 1, 0, w);
  }
  return m.map((w, U) => {
    const su = s + U + 1;
    let iu = D.reset.black(String(su));
    return w = su === r + 1 ? D(w) : w, `	${iu}| ${w}`;
  }).join(`
`);
}
const X = (n, u = {}) => W.builders.group(n, { ...Vu, ...u }), lu = (n) => K.gray(n), Fu = /* @__PURE__ */ new Map();
function SD(n) {
  if (Fu.has(n.id))
    return Fu.get(n.id);
  const u = (r, s) => {
    if (Fu.has(r.id))
      return Fu.get(r.id);
    const { name: E, args: m, parser: q } = r.context, w = q != null ? u(q, s) : K.red.bold("unknown");
    let U = (() => {
      switch (E) {
        case "string":
          return K.yellow(`"${m[0]}"`);
        case "regex":
        case "regexConcat":
        case "regexWrap":
          return K.redBright(`${m[0]}`);
        case "wrap":
        case "trim": {
          const [P, uu] = m;
          return X([
            u(P, s),
            W.builders.indent([W.builders.softline, w]),
            W.builders.softline,
            u(uu, s)
          ]);
        }
        case "trimWhitespace":
          return X([w, lu("?w")]);
        case "not":
          return X(["!", w]);
        case "opt":
          return X([w, lu("?")]);
        case "next":
          const [su] = m;
          return X([w, lu(" >> "), u(su, s)]);
        case "skip":
          const [iu] = m;
          return X([w, lu(" << "), u(iu, s)]);
        case "map":
          return w;
        case "all":
        case "then": {
          const P = lu(", ");
          return X([
            "[",
            W.builders.indent([
              W.builders.softline,
              W.builders.join(
                [P, W.builders.softline],
                m.map((uu) => u(uu, s))
              )
            ]),
            W.builders.softline,
            "]"
          ]);
        }
        case "any":
        case "or": {
          const P = lu("| ");
          return X([
            [
              W.builders.join(
                [W.builders.softline, W.builders.ifBreak(P, " " + P)],
                m.map((uu) => u(uu, s))
              )
            ]
          ]);
        }
        case "many":
          const [Q, J] = m;
          let ou = J === 1 / 0 ? `${Q},` : `${Q},${J}`;
          return ou = K.bold.gray(` {${ou}}`), X([w, ou]);
        case "sepBy":
          return X([
            w,
            W.builders.indent([" sepBy ", u(m[0], s)])
          ]);
        case "lazy": {
          const [P] = m, uu = Iu(P);
          if (s)
            return K.bold.blue(E);
          {
            const bu = u(uu, uu.id);
            return Fu.set(uu.id, bu), bu;
          }
        }
        case "debug":
          return w;
      }
    })();
    return U ?? (U = K.red.bold(E)), s && Fu.set(r.id, U), U;
  }, D = u(n), e = Hu(D);
  return Fu.set(n.id, e), e;
}
function wD(n, u = "", D = !1, e = console.log) {
  const r = (s) => {
    const E = n.parser(s), m = E.isError ? K.bgRed : K.bgGreen, q = E.isError ? K.red : K.green, w = E.offset >= E.src.length, U = E.isError ? "ｘ" : w ? "🎉" : "✓", iu = " " + (E.isError ? "Err" : w ? "Done" : "Ok") + " " + U + " ", Q = D ? n.toString() : n.context.name, J = X([
      m.bold(iu),
      q(`	${u}	${E.offset}`),
      W.builders.softline,
      "	" + K.yellow(Q)
    ]), ou = (() => E.offset >= E.src.length ? K.bold.greenBright(E.addCursor("", E.isError)) : E.addCursor("^", E.isError))(), P = X([J, W.builders.hardline, W.builders.indent([ou])]);
    return e(Hu(P)), E;
  };
  return new N(r, _("debug", n, e));
}
let OD = 0;
const au = /* @__PURE__ */ new Map(), yu = /* @__PURE__ */ new Map();
function Iu(n) {
  return n.parser ? n.parser : n.parser = n();
}
class N {
  constructor(u, D = {}) {
    Ru(this, "id", OD++);
    this.parser = u, this.context = D;
  }
  parse(u) {
    return au.clear(), yu.clear(), this.parser(new xu(u)).value;
  }
  getCijKey(u) {
    return `${this.id}${u.offset}`;
  }
  atLeftRecursionLimit(u) {
    return (yu.get(this.getCijKey(u)) ?? 0) > u.src.length - u.offset;
  }
  memoize() {
    const u = (D) => {
      const e = this.getCijKey(D), r = yu.get(e) ?? 0;
      let s = au.get(this.id);
      if (s && s.offset >= D.offset)
        return s;
      if (this.atLeftRecursionLimit(D))
        return D.err(void 0);
      yu.set(e, r + 1);
      const E = this.parser(D);
      return s = au.get(this.id), s && s.offset > E.offset ? E.offset = s.offset : s || au.set(this.id, E), E;
    };
    return new N(
      u,
      _("memoize", this)
    );
  }
  mergeMemos() {
    const u = (D) => {
      let e = au.get(this.id);
      if (e)
        return e;
      if (this.atLeftRecursionLimit(D))
        return D.err(void 0);
      const r = this.parser(D);
      return e = au.get(this.id), e || au.set(this.id, r), r;
    };
    return new N(
      u,
      _("mergeMemo", this)
    );
  }
  then(u) {
    if (hu(this, u))
      return gu([this, u], "", (e) => [e == null ? void 0 : e[0], e == null ? void 0 : e[1]]);
    const D = (e) => {
      const r = this.parser(e);
      if (!r.isError) {
        const s = u.parser(r);
        if (!s.isError)
          return s.ok([r.value, s.value]);
      }
      return e.err(void 0);
    };
    return new N(
      D,
      _("then", this, this, u)
    );
  }
  or(u) {
    if (hu(this, u))
      return gu([this, u], "|");
    const D = (e) => {
      const r = this.parser(e);
      return r.isError ? u.parser(e) : r;
    };
    return new N(
      D,
      _("or", this, this, u)
    );
  }
  chain(u, D = !1) {
    const e = (r) => {
      const s = this.parser(r);
      return s.isError ? s : s.value || D ? u(s.value).parser(s) : r;
    };
    return new N(e, _("chain", this, u));
  }
  map(u, D = !1) {
    const e = (r) => {
      const s = this.parser(r);
      return !s.isError || D ? s.ok(u(s.value)) : s;
    };
    return new N(e, _("map", this));
  }
  skip(u) {
    const D = (e) => {
      const r = this.parser(e);
      if (!r.isError) {
        const s = u.parser(r);
        if (!s.isError)
          return s.ok(r.value);
      }
      return e.err(void 0);
    };
    return new N(
      D,
      _("skip", this, u)
    );
  }
  next(u) {
    const D = this.then(u).map(([, e]) => e);
    return D.context = _("next", this, u), D;
  }
  opt() {
    const u = (D) => {
      const e = this.parser(D);
      return e.isError ? D.ok(void 0) : e;
    };
    return new N(u, _("opt", this));
  }
  not(u) {
    const D = (r) => this.parser(r).isError ? r.ok(r.value) : r.err(void 0), e = (r) => {
      const s = this.parser(r);
      return s.isError || u.parser(r).isError ? s : r.err(void 0);
    };
    return new N(
      u ? e : D,
      _("not", this, u)
    );
  }
  wrap(u, D) {
    if (hu(u, this, D))
      return _D(u, this, D);
    const e = u.next(this).skip(D);
    return e.context = _("wrap", this, u, D), e;
  }
  trim(u = Xu) {
    var D;
    if (((D = u.context) == null ? void 0 : D.name) === "whitespace") {
      if (hu(this, u))
        return gu(
          [u, this, u],
          "",
          (r) => r == null ? void 0 : r[2]
        );
      const e = (r) => {
        const s = Pu(r), E = this.parser(s);
        return E.isError ? r.err(void 0) : Pu(E);
      };
      return new N(
        e,
        _("trimWhitespace", this)
      );
    }
    return this.wrap(u, u);
  }
  many(u = 0, D = 1 / 0) {
    const e = (r) => {
      const s = [];
      let E = r;
      for (let m = 0; m < D; m += 1) {
        const q = this.parser(E);
        if (q.isError)
          break;
        s.push(q.value), E = q;
      }
      return s.length >= u ? E.ok(s) : r.err([]);
    };
    return new N(
      e,
      _("many", this, u, D)
    );
  }
  sepBy(u, D = 0, e = 1 / 0) {
    const r = (s) => {
      const E = [];
      let m = s;
      for (let q = 0; q < e; q += 1) {
        const w = this.parser(m);
        if (w.isError)
          break;
        m = w, E.push(m.value);
        const U = u.parser(m);
        if (U.isError)
          break;
        m = U;
      }
      return E.length > D ? m.ok(E) : s.err([]);
    };
    return new N(
      r,
      _("sepBy", this, u)
    );
  }
  debug(u = "", D = !1, e = console.log) {
    return wD(this, u, D, e);
  }
  eof() {
    const u = this.skip(ID());
    return u.context = _("eof", this), u;
  }
  static lazy(u) {
    const D = (e) => Iu(u).parser(e);
    return new N(D, _("lazy", void 0, u));
  }
  toString() {
    return SD(this);
  }
}
function hu(...n) {
  return n.every(
    (u) => {
      var D, e, r, s;
      return (((D = u.context) == null ? void 0 : D.name) === "string" || ((e = u.context) == null ? void 0 : e.name) === "regex" || ((r = u.context) == null ? void 0 : r.name) === "whitespace") && ((s = u.context) == null ? void 0 : s.args);
    }
  );
}
function jD(n) {
  var u, D, e, r, s;
  if (((u = n.context) == null ? void 0 : u.name) === "string")
    return (D = n.context) == null ? void 0 : D.args[0].replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  if (((e = n.context) == null ? void 0 : e.name) === "regex" || ((r = n.context) == null ? void 0 : r.name) === "whitespace")
    return (s = n.context) == null ? void 0 : s.args[0].source;
}
function gu(n, u = "", D) {
  const e = n.map((E) => `(${jD(E)})`).join(u), r = new RegExp(e), s = Zu(r, D);
  return u !== "|" && (s.context = _("regexConcat", this, r)), s;
}
function _D(n, u, D) {
  const e = gu([n, u, D], "", (r) => r == null ? void 0 : r[2]);
  return e.context.name = "regexWrap", e;
}
function ID() {
  const n = (u) => u.offset >= u.src.length ? u.ok(void 0) : u.err();
  return new N(n, _("eof"));
}
function $D(n, u, D) {
  const e = D.value.bind(n);
  D.value = function() {
    const r = (s) => Iu(e).parser(s);
    return new N(r, _("lazy", void 0, e));
  };
}
function RD(...n) {
  if (hu(...n))
    return gu(n, "|");
  const u = (D) => {
    for (const e of n) {
      const r = e.parser(D);
      if (!r.isError)
        return r;
    }
    return D.err(void 0);
  };
  return new N(
    n.length === 1 ? n[0].parser : u,
    _("any", void 0, ...n)
  );
}
function LD(...n) {
  const u = (D) => {
    const e = [];
    for (const r of n) {
      const s = r.parser(D);
      if (s.isError)
        return s;
      s.value !== void 0 && e.push(s.value), D = s;
    }
    return D.ok(e);
  };
  return new N(
    n.length === 1 ? n[0].parser : u,
    _("all", void 0, ...n)
  );
}
function GD(n) {
  const u = (D) => {
    if (D.offset >= D.src.length)
      return D.err(void 0);
    const e = D.src.slice(D.offset, D.offset + n.length);
    return e === n ? D.ok(e, e.length) : D.err(void 0);
  };
  return new N(
    u,
    _("string", void 0, n)
  );
}
function Zu(n, u = (D) => D == null ? void 0 : D[0]) {
  const D = n.flags.replace(/y/g, ""), e = new RegExp(n, D + "y"), r = (s) => {
    if (s.offset >= s.src.length)
      return s.err(void 0);
    e.lastIndex = s.offset;
    const E = u(s.src.match(e));
    return E ? s.ok(E, e.lastIndex - s.offset) : E === "" ? s.ok(void 0) : s.err(void 0);
  };
  return new N(
    r,
    _("regex", void 0, n)
  );
}
const Ju = /\s*/y, Pu = (n) => {
  var D;
  if (n.offset >= n.src.length)
    return n;
  Ju.lastIndex = n.offset;
  const u = ((D = n.src.match(Ju)) == null ? void 0 : D[0]) ?? "";
  return n.ok(n.value, u.length);
}, Xu = Zu(/\s*/);
Xu.context.name = "whitespace";
export {
  N as Parser,
  LD as all,
  RD as any,
  ID as eof,
  Iu as getLazyParser,
  $D as lazy,
  Zu as regex,
  GD as string,
  Xu as whitespace
};
