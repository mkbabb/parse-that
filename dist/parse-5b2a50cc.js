var DD = Object.defineProperty;
var eD = (n, u, e) => u in n ? DD(n, u, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[u] = e;
var mu = (n, u, e) => (eD(n, typeof u != "symbol" ? u + "" : u, e), e);
import J from "chalk";
class gu {
  constructor(u, e = void 0, s = 0, i = !1, r = 0) {
    this.src = u, this.value = e, this.offset = s, this.isError = i, this.furthest = r;
  }
  ok(u, e = 0) {
    return e += this.offset, new gu(this.src, u, e, !1);
  }
  err(u, e = 0) {
    const s = this.ok(u, e);
    return s.isError = !0, s;
  }
  from(u, e = 0) {
    return e += this.offset, new gu(this.src, u, e, this.isError);
  }
  getColumnNumber() {
    const u = this.offset, e = this.src.lastIndexOf(`
`, u), s = e === -1 ? u : u - (e + 1);
    return Math.max(0, s);
  }
  getLineNumber() {
    const u = this.src.lastIndexOf(`
`, this.offset);
    return u >= 0 ? this.src.slice(0, u).split(`
`).length : 0;
  }
}
const lD = [
  "string",
  "regex",
  "then",
  "or",
  "chain",
  "map",
  "many",
  "lazy",
  "memoize",
  "mergeMemo",
  "not",
  "skip",
  "next",
  "trim",
  "trimWhitespace",
  "whitespace",
  "wrap",
  "sepBy",
  "any",
  "all",
  "opt",
  "lookAhead",
  "lookBehind",
  "eof",
  "regexConcat",
  "regexWrap",
  "debug",
  "mapState"
];
function w(n, u, ...e) {
  return {
    name: n,
    parser: u,
    args: e
  };
}
var z = {}, tD = {
  get exports() {
    return z;
  },
  set exports(n) {
    z = n;
  }
};
(function(n, u) {
  (function(e) {
    n.exports = e();
  })(function() {
    var e = Object.getOwnPropertyNames, s = (r, B) => function() {
      return B || (0, r[e(r)[0]])((B = { exports: {} }).exports, B), B.exports;
    }, i = s({
      "dist/_doc.js.umd.js"(r, B) {
        var m = Object.create, I = Object.defineProperty, q = Object.getOwnPropertyDescriptor, M = Object.getOwnPropertyNames, ru = Object.getPrototypeOf, Fu = Object.prototype.hasOwnProperty, uu = (a, g) => function() {
          return a && (g = (0, a[M(a)[0]])(a = 0)), g;
        }, Y = (a, g) => function() {
          return g || (0, a[M(a)[0]])((g = {
            exports: {}
          }).exports, g), g.exports;
        }, Eu = (a, g) => {
          for (var d in g)
            I(a, d, {
              get: g[d],
              enumerable: !0
            });
        }, Q = (a, g, d, A) => {
          if (g && typeof g == "object" || typeof g == "function")
            for (let k of M(g))
              !Fu.call(a, k) && k !== d && I(a, k, {
                get: () => g[k],
                enumerable: !(A = q(g, k)) || A.enumerable
              });
          return a;
        }, P = (a, g, d) => (d = a != null ? m(ru(a)) : {}, Q(g || !a || !a.__esModule ? I(d, "default", {
          value: a,
          enumerable: !0
        }) : d, a)), Bu = (a) => Q(I({}, "__esModule", {
          value: !0
        }), a), V = uu({
          "<define:process>"() {
          }
        }), du = Y({
          "src/document/doc-builders.js"(a, g) {
            V();
            function d(c) {
              return {
                type: "concat",
                parts: c
              };
            }
            function A(c) {
              return {
                type: "indent",
                contents: c
              };
            }
            function k(c, D) {
              return {
                type: "align",
                contents: D,
                n: c
              };
            }
            function L(c) {
              let D = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
              return {
                type: "group",
                id: D.id,
                contents: c,
                break: Boolean(D.shouldBreak),
                expandedStates: D.expandedStates
              };
            }
            function p(c) {
              return k(Number.NEGATIVE_INFINITY, c);
            }
            function N(c) {
              return k({
                type: "root"
              }, c);
            }
            function T(c) {
              return k(-1, c);
            }
            function b(c, D) {
              return L(c[0], Object.assign(Object.assign({}, D), {}, {
                expandedStates: c
              }));
            }
            function H(c) {
              return {
                type: "fill",
                parts: c
              };
            }
            function o(c, D) {
              let t = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
              return {
                type: "if-break",
                breakContents: c,
                flatContents: D,
                groupId: t.groupId
              };
            }
            function _(c, D) {
              return {
                type: "indent-if-break",
                contents: c,
                groupId: D.groupId,
                negate: D.negate
              };
            }
            function R(c) {
              return {
                type: "line-suffix",
                contents: c
              };
            }
            var v = {
              type: "line-suffix-boundary"
            }, Z = {
              type: "break-parent"
            }, tu = {
              type: "trim"
            }, nu = {
              type: "line",
              hard: !0
            }, U = {
              type: "line",
              hard: !0,
              literal: !0
            }, fu = {
              type: "line"
            }, y = {
              type: "line",
              soft: !0
            }, S = d([nu, Z]), j = d([U, Z]), G = {
              type: "cursor",
              placeholder: Symbol("cursor")
            };
            function $(c, D) {
              const t = [];
              for (let F = 0; F < D.length; F++)
                F !== 0 && t.push(c), t.push(D[F]);
              return d(t);
            }
            function h(c, D, t) {
              let F = c;
              if (D > 0) {
                for (let f = 0; f < Math.floor(D / t); ++f)
                  F = A(F);
                F = k(D % t, F), F = k(Number.NEGATIVE_INFINITY, F);
              }
              return F;
            }
            function x(c, D) {
              return {
                type: "label",
                label: c,
                contents: D
              };
            }
            g.exports = {
              concat: d,
              join: $,
              line: fu,
              softline: y,
              hardline: S,
              literalline: j,
              group: L,
              conditionalGroup: b,
              fill: H,
              lineSuffix: R,
              lineSuffixBoundary: v,
              cursor: G,
              breakParent: Z,
              ifBreak: o,
              trim: tu,
              indent: A,
              indentIfBreak: _,
              align: k,
              addAlignmentToDoc: h,
              markAsRoot: N,
              dedentToRoot: p,
              dedent: T,
              hardlineWithoutBreakParent: nu,
              literallineWithoutBreakParent: U,
              label: x
            };
          }
        }), zu = Y({
          "src/common/end-of-line.js"(a, g) {
            V();
            function d(p) {
              const N = p.indexOf("\r");
              return N >= 0 ? p.charAt(N + 1) === `
` ? "crlf" : "cr" : "lf";
            }
            function A(p) {
              switch (p) {
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
            function k(p, N) {
              let T;
              switch (N) {
                case `
`:
                  T = /\n/g;
                  break;
                case "\r":
                  T = /\r/g;
                  break;
                case `\r
`:
                  T = /\r\n/g;
                  break;
                default:
                  throw new Error(`Unexpected "eol" ${JSON.stringify(N)}.`);
              }
              const b = p.match(T);
              return b ? b.length : 0;
            }
            function L(p) {
              return p.replace(/\r\n?/g, `
`);
            }
            g.exports = {
              guessEndOfLine: d,
              convertEndOfLineToChars: A,
              countEndOfLineChars: k,
              normalizeEndOfLine: L
            };
          }
        }), xu = Y({
          "src/utils/get-last.js"(a, g) {
            V();
            var d = (A) => A[A.length - 1];
            g.exports = d;
          }
        });
        function qu() {
          let {
            onlyFirst: a = !1
          } = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
          const g = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"].join("|");
          return new RegExp(g, a ? void 0 : "g");
        }
        var Gu = uu({
          "node_modules/strip-ansi/node_modules/ansi-regex/index.js"() {
            V();
          }
        });
        function Ju(a) {
          if (typeof a != "string")
            throw new TypeError(`Expected a \`string\`, got \`${typeof a}\``);
          return a.replace(qu(), "");
        }
        var Hu = uu({
          "node_modules/strip-ansi/index.js"() {
            V(), Gu();
          }
        });
        function Ku(a) {
          return Number.isInteger(a) ? a >= 4352 && (a <= 4447 || a === 9001 || a === 9002 || 11904 <= a && a <= 12871 && a !== 12351 || 12880 <= a && a <= 19903 || 19968 <= a && a <= 42182 || 43360 <= a && a <= 43388 || 44032 <= a && a <= 55203 || 63744 <= a && a <= 64255 || 65040 <= a && a <= 65049 || 65072 <= a && a <= 65131 || 65281 <= a && a <= 65376 || 65504 <= a && a <= 65510 || 110592 <= a && a <= 110593 || 127488 <= a && a <= 127569 || 131072 <= a && a <= 262141) : !1;
        }
        var Vu = uu({
          "node_modules/is-fullwidth-code-point/index.js"() {
            V();
          }
        }), Uu = Y({
          "node_modules/emoji-regex/index.js"(a, g) {
            V(), g.exports = function() {
              return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
            };
          }
        }), vu = {};
        Eu(vu, {
          default: () => Yu
        });
        function Yu(a) {
          if (typeof a != "string" || a.length === 0 || (a = Ju(a), a.length === 0))
            return 0;
          a = a.replace((0, Su.default)(), "  ");
          let g = 0;
          for (let d = 0; d < a.length; d++) {
            const A = a.codePointAt(d);
            A <= 31 || A >= 127 && A <= 159 || A >= 768 && A <= 879 || (A > 65535 && d++, g += Ku(A) ? 2 : 1);
          }
          return g;
        }
        var Su, Zu = uu({
          "node_modules/string-width/index.js"() {
            V(), Hu(), Vu(), Su = P(Uu());
          }
        }), Xu = Y({
          "src/utils/get-string-width.js"(a, g) {
            V();
            var d = (Zu(), Bu(vu)).default, A = /[^\x20-\x7F]/;
            function k(L) {
              return L ? A.test(L) ? d(L) : L.length : 0;
            }
            g.exports = k;
          }
        }), Au = Y({
          "src/document/doc-utils.js"(a, g) {
            V();
            var d = xu(), {
              literalline: A,
              join: k
            } = du(), L = (D) => Array.isArray(D) || D && D.type === "concat", p = (D) => {
              if (Array.isArray(D))
                return D;
              if (D.type !== "concat" && D.type !== "fill")
                throw new Error("Expect doc type to be `concat` or `fill`.");
              return D.parts;
            }, N = {};
            function T(D, t, F, f) {
              const E = [D];
              for (; E.length > 0; ) {
                const C = E.pop();
                if (C === N) {
                  F(E.pop());
                  continue;
                }
                if (F && E.push(C, N), !t || t(C) !== !1)
                  if (L(C) || C.type === "fill") {
                    const l = p(C);
                    for (let W = l.length, Du = W - 1; Du >= 0; --Du)
                      E.push(l[Du]);
                  } else if (C.type === "if-break")
                    C.flatContents && E.push(C.flatContents), C.breakContents && E.push(C.breakContents);
                  else if (C.type === "group" && C.expandedStates)
                    if (f)
                      for (let l = C.expandedStates.length, W = l - 1; W >= 0; --W)
                        E.push(C.expandedStates[W]);
                    else
                      E.push(C.contents);
                  else
                    C.contents && E.push(C.contents);
              }
            }
            function b(D, t) {
              const F = /* @__PURE__ */ new Map();
              return f(D);
              function f(C) {
                if (F.has(C))
                  return F.get(C);
                const l = E(C);
                return F.set(C, l), l;
              }
              function E(C) {
                if (Array.isArray(C))
                  return t(C.map(f));
                if (C.type === "concat" || C.type === "fill") {
                  const l = C.parts.map(f);
                  return t(Object.assign(Object.assign({}, C), {}, {
                    parts: l
                  }));
                }
                if (C.type === "if-break") {
                  const l = C.breakContents && f(C.breakContents), W = C.flatContents && f(C.flatContents);
                  return t(Object.assign(Object.assign({}, C), {}, {
                    breakContents: l,
                    flatContents: W
                  }));
                }
                if (C.type === "group" && C.expandedStates) {
                  const l = C.expandedStates.map(f), W = l[0];
                  return t(Object.assign(Object.assign({}, C), {}, {
                    contents: W,
                    expandedStates: l
                  }));
                }
                if (C.contents) {
                  const l = f(C.contents);
                  return t(Object.assign(Object.assign({}, C), {}, {
                    contents: l
                  }));
                }
                return t(C);
              }
            }
            function H(D, t, F) {
              let f = F, E = !1;
              function C(l) {
                const W = t(l);
                if (W !== void 0 && (E = !0, f = W), E)
                  return !1;
              }
              return T(D, C), f;
            }
            function o(D) {
              if (D.type === "group" && D.break || D.type === "line" && D.hard || D.type === "break-parent")
                return !0;
            }
            function _(D) {
              return H(D, o, !1);
            }
            function R(D) {
              if (D.length > 0) {
                const t = d(D);
                !t.expandedStates && !t.break && (t.break = "propagated");
              }
              return null;
            }
            function v(D) {
              const t = /* @__PURE__ */ new Set(), F = [];
              function f(C) {
                if (C.type === "break-parent" && R(F), C.type === "group") {
                  if (F.push(C), t.has(C))
                    return !1;
                  t.add(C);
                }
              }
              function E(C) {
                C.type === "group" && F.pop().break && R(F);
              }
              T(D, f, E, !0);
            }
            function Z(D) {
              return D.type === "line" && !D.hard ? D.soft ? "" : " " : D.type === "if-break" ? D.flatContents || "" : D;
            }
            function tu(D) {
              return b(D, Z);
            }
            var nu = (D, t) => D && D.type === "line" && D.hard && t && t.type === "break-parent";
            function U(D) {
              if (!D)
                return D;
              if (L(D) || D.type === "fill") {
                const t = p(D);
                for (; t.length > 1 && nu(...t.slice(-2)); )
                  t.length -= 2;
                if (t.length > 0) {
                  const F = U(d(t));
                  t[t.length - 1] = F;
                }
                return Array.isArray(D) ? t : Object.assign(Object.assign({}, D), {}, {
                  parts: t
                });
              }
              switch (D.type) {
                case "align":
                case "indent":
                case "indent-if-break":
                case "group":
                case "line-suffix":
                case "label": {
                  const t = U(D.contents);
                  return Object.assign(Object.assign({}, D), {}, {
                    contents: t
                  });
                }
                case "if-break": {
                  const t = U(D.breakContents), F = U(D.flatContents);
                  return Object.assign(Object.assign({}, D), {}, {
                    breakContents: t,
                    flatContents: F
                  });
                }
              }
              return D;
            }
            function fu(D) {
              return U(S(D));
            }
            function y(D) {
              switch (D.type) {
                case "fill":
                  if (D.parts.every((F) => F === ""))
                    return "";
                  break;
                case "group":
                  if (!D.contents && !D.id && !D.break && !D.expandedStates)
                    return "";
                  if (D.contents.type === "group" && D.contents.id === D.id && D.contents.break === D.break && D.contents.expandedStates === D.expandedStates)
                    return D.contents;
                  break;
                case "align":
                case "indent":
                case "indent-if-break":
                case "line-suffix":
                  if (!D.contents)
                    return "";
                  break;
                case "if-break":
                  if (!D.flatContents && !D.breakContents)
                    return "";
                  break;
              }
              if (!L(D))
                return D;
              const t = [];
              for (const F of p(D)) {
                if (!F)
                  continue;
                const [f, ...E] = L(F) ? p(F) : [F];
                typeof f == "string" && typeof d(t) == "string" ? t[t.length - 1] += f : t.push(f), t.push(...E);
              }
              return t.length === 0 ? "" : t.length === 1 ? t[0] : Array.isArray(D) ? t : Object.assign(Object.assign({}, D), {}, {
                parts: t
              });
            }
            function S(D) {
              return b(D, (t) => y(t));
            }
            function j(D) {
              const t = [], F = D.filter(Boolean);
              for (; F.length > 0; ) {
                const f = F.shift();
                if (f) {
                  if (L(f)) {
                    F.unshift(...p(f));
                    continue;
                  }
                  if (t.length > 0 && typeof d(t) == "string" && typeof f == "string") {
                    t[t.length - 1] += f;
                    continue;
                  }
                  t.push(f);
                }
              }
              return t;
            }
            function G(D) {
              return b(D, (t) => Array.isArray(t) ? j(t) : t.parts ? Object.assign(Object.assign({}, t), {}, {
                parts: j(t.parts)
              }) : t);
            }
            function $(D) {
              return b(D, (t) => typeof t == "string" && t.includes(`
`) ? h(t) : t);
            }
            function h(D) {
              let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : A;
              return k(t, D.split(`
`)).parts;
            }
            function x(D) {
              if (D.type === "line")
                return !0;
            }
            function c(D) {
              return H(D, x, !1);
            }
            g.exports = {
              isConcat: L,
              getDocParts: p,
              willBreak: _,
              traverseDoc: T,
              findInDoc: H,
              mapDoc: b,
              propagateBreaks: v,
              removeLines: tu,
              stripTrailingHardline: fu,
              normalizeParts: j,
              normalizeDoc: G,
              cleanDoc: S,
              replaceTextEndOfLine: h,
              replaceEndOfLine: $,
              canBreak: c
            };
          }
        }), Qu = Y({
          "src/document/doc-printer.js"(a, g) {
            V();
            var {
              convertEndOfLineToChars: d
            } = zu(), A = xu(), k = Xu(), {
              fill: L,
              cursor: p,
              indent: N
            } = du(), {
              isConcat: T,
              getDocParts: b
            } = Au(), H, o = 1, _ = 2;
            function R() {
              return {
                value: "",
                length: 0,
                queue: []
              };
            }
            function v(y, S) {
              return tu(y, {
                type: "indent"
              }, S);
            }
            function Z(y, S, j) {
              return S === Number.NEGATIVE_INFINITY ? y.root || R() : S < 0 ? tu(y, {
                type: "dedent"
              }, j) : S ? S.type === "root" ? Object.assign(Object.assign({}, y), {}, {
                root: y
              }) : tu(y, {
                type: typeof S == "string" ? "stringAlign" : "numberAlign",
                n: S
              }, j) : y;
            }
            function tu(y, S, j) {
              const G = S.type === "dedent" ? y.queue.slice(0, -1) : [...y.queue, S];
              let $ = "", h = 0, x = 0, c = 0;
              for (const l of G)
                switch (l.type) {
                  case "indent":
                    F(), j.useTabs ? D(1) : t(j.tabWidth);
                    break;
                  case "stringAlign":
                    F(), $ += l.n, h += l.n.length;
                    break;
                  case "numberAlign":
                    x += 1, c += l.n;
                    break;
                  default:
                    throw new Error(`Unexpected type '${l.type}'`);
                }
              return E(), Object.assign(Object.assign({}, y), {}, {
                value: $,
                length: h,
                queue: G
              });
              function D(l) {
                $ += "	".repeat(l), h += j.tabWidth * l;
              }
              function t(l) {
                $ += " ".repeat(l), h += l;
              }
              function F() {
                j.useTabs ? f() : E();
              }
              function f() {
                x > 0 && D(x), C();
              }
              function E() {
                c > 0 && t(c), C();
              }
              function C() {
                x = 0, c = 0;
              }
            }
            function nu(y) {
              if (y.length === 0)
                return 0;
              let S = 0;
              for (; y.length > 0 && typeof A(y) == "string" && /^[\t ]*$/.test(A(y)); )
                S += y.pop().length;
              if (y.length > 0 && typeof A(y) == "string") {
                const j = A(y).replace(/[\t ]*$/, "");
                S += A(y).length - j.length, y[y.length - 1] = j;
              }
              return S;
            }
            function U(y, S, j, G, $) {
              let h = S.length;
              const x = [y], c = [];
              for (; j >= 0; ) {
                if (x.length === 0) {
                  if (h === 0)
                    return !0;
                  x.push(S[--h]);
                  continue;
                }
                const {
                  mode: D,
                  doc: t
                } = x.pop();
                if (typeof t == "string")
                  c.push(t), j -= k(t);
                else if (T(t) || t.type === "fill") {
                  const F = b(t);
                  for (let f = F.length - 1; f >= 0; f--)
                    x.push({
                      mode: D,
                      doc: F[f]
                    });
                } else
                  switch (t.type) {
                    case "indent":
                    case "align":
                    case "indent-if-break":
                    case "label":
                      x.push({
                        mode: D,
                        doc: t.contents
                      });
                      break;
                    case "trim":
                      j += nu(c);
                      break;
                    case "group": {
                      if ($ && t.break)
                        return !1;
                      const F = t.break ? o : D, f = t.expandedStates && F === o ? A(t.expandedStates) : t.contents;
                      x.push({
                        mode: F,
                        doc: f
                      });
                      break;
                    }
                    case "if-break": {
                      const f = (t.groupId ? H[t.groupId] || _ : D) === o ? t.breakContents : t.flatContents;
                      f && x.push({
                        mode: D,
                        doc: f
                      });
                      break;
                    }
                    case "line":
                      if (D === o || t.hard)
                        return !0;
                      t.soft || (c.push(" "), j--);
                      break;
                    case "line-suffix":
                      G = !0;
                      break;
                    case "line-suffix-boundary":
                      if (G)
                        return !1;
                      break;
                  }
              }
              return !1;
            }
            function fu(y, S) {
              H = {};
              const j = S.printWidth, G = d(S.endOfLine);
              let $ = 0;
              const h = [{
                ind: R(),
                mode: o,
                doc: y
              }], x = [];
              let c = !1;
              const D = [];
              for (; h.length > 0; ) {
                const {
                  ind: F,
                  mode: f,
                  doc: E
                } = h.pop();
                if (typeof E == "string") {
                  const C = G !== `
` ? E.replace(/\n/g, G) : E;
                  x.push(C), $ += k(C);
                } else if (T(E)) {
                  const C = b(E);
                  for (let l = C.length - 1; l >= 0; l--)
                    h.push({
                      ind: F,
                      mode: f,
                      doc: C[l]
                    });
                } else
                  switch (E.type) {
                    case "cursor":
                      x.push(p.placeholder);
                      break;
                    case "indent":
                      h.push({
                        ind: v(F, S),
                        mode: f,
                        doc: E.contents
                      });
                      break;
                    case "align":
                      h.push({
                        ind: Z(F, E.n, S),
                        mode: f,
                        doc: E.contents
                      });
                      break;
                    case "trim":
                      $ -= nu(x);
                      break;
                    case "group":
                      switch (f) {
                        case _:
                          if (!c) {
                            h.push({
                              ind: F,
                              mode: E.break ? o : _,
                              doc: E.contents
                            });
                            break;
                          }
                        case o: {
                          c = !1;
                          const C = {
                            ind: F,
                            mode: _,
                            doc: E.contents
                          }, l = j - $, W = D.length > 0;
                          if (!E.break && U(C, h, l, W))
                            h.push(C);
                          else if (E.expandedStates) {
                            const Du = A(E.expandedStates);
                            if (E.break) {
                              h.push({
                                ind: F,
                                mode: o,
                                doc: Du
                              });
                              break;
                            } else
                              for (let eu = 1; eu < E.expandedStates.length + 1; eu++)
                                if (eu >= E.expandedStates.length) {
                                  h.push({
                                    ind: F,
                                    mode: o,
                                    doc: Du
                                  });
                                  break;
                                } else {
                                  const lu = E.expandedStates[eu], au = {
                                    ind: F,
                                    mode: _,
                                    doc: lu
                                  };
                                  if (U(au, h, l, W)) {
                                    h.push(au);
                                    break;
                                  }
                                }
                          } else
                            h.push({
                              ind: F,
                              mode: o,
                              doc: E.contents
                            });
                          break;
                        }
                      }
                      E.id && (H[E.id] = A(h).mode);
                      break;
                    case "fill": {
                      const C = j - $, {
                        parts: l
                      } = E;
                      if (l.length === 0)
                        break;
                      const [W, Du] = l, eu = {
                        ind: F,
                        mode: _,
                        doc: W
                      }, lu = {
                        ind: F,
                        mode: o,
                        doc: W
                      }, au = U(eu, [], C, D.length > 0, !0);
                      if (l.length === 1) {
                        au ? h.push(eu) : h.push(lu);
                        break;
                      }
                      const wu = {
                        ind: F,
                        mode: _,
                        doc: Du
                      }, bu = {
                        ind: F,
                        mode: o,
                        doc: Du
                      };
                      if (l.length === 2) {
                        au ? h.push(wu, eu) : h.push(bu, lu);
                        break;
                      }
                      l.splice(0, 2);
                      const yu = {
                        ind: F,
                        mode: f,
                        doc: L(l)
                      }, uD = l[0];
                      U({
                        ind: F,
                        mode: _,
                        doc: [W, Du, uD]
                      }, [], C, D.length > 0, !0) ? h.push(yu, wu, eu) : au ? h.push(yu, bu, eu) : h.push(yu, bu, lu);
                      break;
                    }
                    case "if-break":
                    case "indent-if-break": {
                      const C = E.groupId ? H[E.groupId] : f;
                      if (C === o) {
                        const l = E.type === "if-break" ? E.breakContents : E.negate ? E.contents : N(E.contents);
                        l && h.push({
                          ind: F,
                          mode: f,
                          doc: l
                        });
                      }
                      if (C === _) {
                        const l = E.type === "if-break" ? E.flatContents : E.negate ? N(E.contents) : E.contents;
                        l && h.push({
                          ind: F,
                          mode: f,
                          doc: l
                        });
                      }
                      break;
                    }
                    case "line-suffix":
                      D.push({
                        ind: F,
                        mode: f,
                        doc: E.contents
                      });
                      break;
                    case "line-suffix-boundary":
                      D.length > 0 && h.push({
                        ind: F,
                        mode: f,
                        doc: {
                          type: "line",
                          hard: !0
                        }
                      });
                      break;
                    case "line":
                      switch (f) {
                        case _:
                          if (E.hard)
                            c = !0;
                          else {
                            E.soft || (x.push(" "), $ += 1);
                            break;
                          }
                        case o:
                          if (D.length > 0) {
                            h.push({
                              ind: F,
                              mode: f,
                              doc: E
                            }, ...D.reverse()), D.length = 0;
                            break;
                          }
                          E.literal ? F.root ? (x.push(G, F.root.value), $ = F.root.length) : (x.push(G), $ = 0) : ($ -= nu(x), x.push(G + F.value), $ = F.length);
                          break;
                      }
                      break;
                    case "label":
                      h.push({
                        ind: F,
                        mode: f,
                        doc: E.contents
                      });
                      break;
                  }
                h.length === 0 && D.length > 0 && (h.push(...D.reverse()), D.length = 0);
              }
              const t = x.indexOf(p.placeholder);
              if (t !== -1) {
                const F = x.indexOf(p.placeholder, t + 1), f = x.slice(0, t).join(""), E = x.slice(t + 1, F).join(""), C = x.slice(F + 1).join("");
                return {
                  formatted: f + E + C,
                  cursorNodeStart: f.length,
                  cursorNodeText: E
                };
              }
              return {
                formatted: x.join("")
              };
            }
            g.exports = {
              printDocToString: fu
            };
          }
        }), Pu = Y({
          "src/document/doc-debug.js"(a, g) {
            V();
            var {
              isConcat: d,
              getDocParts: A
            } = Au();
            function k(p) {
              if (!p)
                return "";
              if (d(p)) {
                const N = [];
                for (const T of A(p))
                  if (d(T))
                    N.push(...k(T).parts);
                  else {
                    const b = k(T);
                    b !== "" && N.push(b);
                  }
                return {
                  type: "concat",
                  parts: N
                };
              }
              return p.type === "if-break" ? Object.assign(Object.assign({}, p), {}, {
                breakContents: k(p.breakContents),
                flatContents: k(p.flatContents)
              }) : p.type === "group" ? Object.assign(Object.assign({}, p), {}, {
                contents: k(p.contents),
                expandedStates: p.expandedStates && p.expandedStates.map(k)
              }) : p.type === "fill" ? {
                type: "fill",
                parts: p.parts.map(k)
              } : p.contents ? Object.assign(Object.assign({}, p), {}, {
                contents: k(p.contents)
              }) : p;
            }
            function L(p) {
              const N = /* @__PURE__ */ Object.create(null), T = /* @__PURE__ */ new Set();
              return b(k(p));
              function b(o, _, R) {
                if (typeof o == "string")
                  return JSON.stringify(o);
                if (d(o)) {
                  const v = A(o).map(b).filter(Boolean);
                  return v.length === 1 ? v[0] : `[${v.join(", ")}]`;
                }
                if (o.type === "line") {
                  const v = Array.isArray(R) && R[_ + 1] && R[_ + 1].type === "break-parent";
                  return o.literal ? v ? "literalline" : "literallineWithoutBreakParent" : o.hard ? v ? "hardline" : "hardlineWithoutBreakParent" : o.soft ? "softline" : "line";
                }
                if (o.type === "break-parent")
                  return Array.isArray(R) && R[_ - 1] && R[_ - 1].type === "line" && R[_ - 1].hard ? void 0 : "breakParent";
                if (o.type === "trim")
                  return "trim";
                if (o.type === "indent")
                  return "indent(" + b(o.contents) + ")";
                if (o.type === "align")
                  return o.n === Number.NEGATIVE_INFINITY ? "dedentToRoot(" + b(o.contents) + ")" : o.n < 0 ? "dedent(" + b(o.contents) + ")" : o.n.type === "root" ? "markAsRoot(" + b(o.contents) + ")" : "align(" + JSON.stringify(o.n) + ", " + b(o.contents) + ")";
                if (o.type === "if-break")
                  return "ifBreak(" + b(o.breakContents) + (o.flatContents ? ", " + b(o.flatContents) : "") + (o.groupId ? (o.flatContents ? "" : ', ""') + `, { groupId: ${H(o.groupId)} }` : "") + ")";
                if (o.type === "indent-if-break") {
                  const v = [];
                  o.negate && v.push("negate: true"), o.groupId && v.push(`groupId: ${H(o.groupId)}`);
                  const Z = v.length > 0 ? `, { ${v.join(", ")} }` : "";
                  return `indentIfBreak(${b(o.contents)}${Z})`;
                }
                if (o.type === "group") {
                  const v = [];
                  o.break && o.break !== "propagated" && v.push("shouldBreak: true"), o.id && v.push(`id: ${H(o.id)}`);
                  const Z = v.length > 0 ? `, { ${v.join(", ")} }` : "";
                  return o.expandedStates ? `conditionalGroup([${o.expandedStates.map((tu) => b(tu)).join(",")}]${Z})` : `group(${b(o.contents)}${Z})`;
                }
                if (o.type === "fill")
                  return `fill([${o.parts.map((v) => b(v)).join(", ")}])`;
                if (o.type === "line-suffix")
                  return "lineSuffix(" + b(o.contents) + ")";
                if (o.type === "line-suffix-boundary")
                  return "lineSuffixBoundary";
                if (o.type === "label")
                  return `label(${JSON.stringify(o.label)}, ${b(o.contents)})`;
                throw new Error("Unknown doc type " + o.type);
              }
              function H(o) {
                if (typeof o != "symbol")
                  return JSON.stringify(String(o));
                if (o in N)
                  return N[o];
                const _ = String(o).slice(7, -1) || "symbol";
                for (let R = 0; ; R++) {
                  const v = _ + (R > 0 ? ` #${R}` : "");
                  if (!T.has(v))
                    return T.add(v), N[o] = `Symbol.for(${JSON.stringify(v)})`;
                }
              }
            }
            g.exports = {
              printDocToDebug: L
            };
          }
        });
        V(), B.exports = {
          builders: du(),
          printer: Qu(),
          utils: Au(),
          debug: Pu()
        };
      }
    });
    return i();
  });
})(tD);
const ju = 4, _u = 80, Tu = {
  printWidth: 30,
  tabWidth: 4,
  useTabs: !1
};
function $u(n) {
  return z.printer.printDocToString(n, Tu).formatted;
}
const cD = (n, u = _u) => {
  const e = n.indexOf(`
`);
  return Math.min(n.length, e === -1 ? n.length : e) <= _u ? n : n.slice(0, u) + "...";
};
function Ou(n, u = "^", e = !1) {
  const s = (e ? J.red : J.green).bold, i = n.src.split(`
`), r = Math.min(i.length - 1, n.getLineNumber()), B = Math.max(r - ju, 0), m = Math.min(r + ju + 1, i.length), I = i.slice(B, m);
  if (u) {
    const M = " ".repeat(n.getColumnNumber()) + s(u);
    I.splice(r - B + 1, 0, M);
  }
  return I.map((M, ru) => {
    const Fu = B + ru + 1;
    let uu = s.reset.black(String(Fu));
    return M = Fu === r + 1 ? s(M) : M, `      ${uu}| ${M}`;
  }).join(`
`);
}
const X = (n, u = {}) => z.builders.group(n, { ...Tu, ...u }), ou = (n) => J.gray(n), su = /* @__PURE__ */ new Map();
function Mu(n) {
  if (su.has(n.id))
    return su.get(n.id);
  const u = (i, r) => {
    if (su.has(i.id))
      return su.get(i.id);
    const { name: B, args: m, parser: I } = i.context, q = I != null ? u(I, r) : J.red.bold("unknown");
    let M = (() => {
      switch (B) {
        case "string":
          return J.yellow(`"${m[0]}"`);
        case "regex":
        case "regexConcat":
        case "regexWrap":
          return J.redBright(`${m[0]}`);
        case "wrap":
        case "trim": {
          const [Q, P] = m;
          return X([
            u(Q, r),
            z.builders.indent([z.builders.softline, q]),
            z.builders.softline,
            u(P, r)
          ]);
        }
        case "trimWhitespace":
          return X([q, ou("?w")]);
        case "not":
          return X(["!", q]);
        case "opt":
          return X([q, ou("?")]);
        case "next":
          const [ru] = m;
          return X([q, ou(" >> "), u(ru, r)]);
        case "skip":
          const [Fu] = m;
          return X([q, ou(" << "), u(Fu, r)]);
        case "map":
          return q;
        case "all":
        case "then": {
          const Q = ou(", ");
          return X([
            "[",
            z.builders.indent([
              z.builders.softline,
              z.builders.join(
                [Q, z.builders.softline],
                m.map((P) => u(P, r))
              )
            ]),
            z.builders.softline,
            "]"
          ]);
        }
        case "any":
        case "or": {
          const Q = ou("| ");
          return X([
            [
              z.builders.join(
                [z.builders.softline, z.builders.ifBreak(Q, " " + Q)],
                m.map((P) => u(P, r))
              )
            ]
          ]);
        }
        case "many":
          const [uu, Y] = m;
          let Eu = Y === 1 / 0 ? `${uu},` : `${uu},${Y}`;
          return Eu = J.bold.gray(` {${Eu}}`), X([q, Eu]);
        case "sepBy":
          return X([
            q,
            z.builders.indent([" sepBy ", u(m[0], r)])
          ]);
        case "lazy": {
          const [Q] = m, P = ku(Q);
          if (r)
            return J.bold.blue(B);
          {
            const Bu = u(P, P.id);
            return su.set(P.id, Bu), Bu;
          }
        }
        case "debug":
          return q;
      }
    })();
    return M ?? (M = J.red.bold(B)), r && su.set(i.id, M), M;
  }, e = u(n), s = $u(e);
  return su.set(n.id, s), s;
}
function nD(n, u = "", e = "") {
  const s = n.isError ? J.bgRed : J.bgGreen, i = n.isError ? J.red : J.green, r = n.offset >= n.src.length, B = n.isError ? "ｘ" : r ? "🎉" : "✓", I = " " + (n.isError ? "Err" : r ? "Done" : "Ok") + " " + B + " ", q = X([
    s.bold(I),
    i(`	${u}	${n.offset}`),
    z.builders.softline,
    "	" + J.yellow(e)
  ]), M = (() => n.offset >= n.src.length ? J.bold.greenBright(Ou(n, "", n.isError)) : Ou(n, "^", n.isError))(), ru = X([q, z.builders.hardline, z.builders.indent([M])]);
  return $u(ru);
}
function rD(n, u = "", e = !1, s = console.log) {
  const i = (r) => {
    const B = n.parser(r), m = e ? Mu(n) : n.context.name, I = nD(B, u, m);
    return s(I), B;
  };
  return new O(i, w("debug", n, s));
}
let sD = 0;
const iu = /* @__PURE__ */ new Map(), hu = /* @__PURE__ */ new Map();
let Cu;
function K(n) {
  return (!Cu || Cu && n.offset > Cu.offset) && (Cu = n), Cu;
}
function ku(n) {
  return n.parser ? n.parser : n.parser = n();
}
class O {
  constructor(u, e = {}) {
    mu(this, "id", sD++);
    mu(this, "state");
    this.parser = u, this.context = e;
  }
  reset() {
    Cu = void 0, iu.clear(), hu.clear();
  }
  parse(u) {
    this.reset();
    const e = this.parser(new gu(u));
    return this.state = K(e), this.state.isError = e.isError, e.value;
  }
  getCijKey(u) {
    return `${this.id}${u.offset}`;
  }
  atLeftRecursionLimit(u) {
    return (hu.get(this.getCijKey(u)) ?? 0) > u.src.length - u.offset;
  }
  memoize() {
    const u = (e) => {
      const s = this.getCijKey(e), i = hu.get(s) ?? 0;
      let r = iu.get(this.id);
      if (r && r.offset >= e.offset)
        return r;
      if (this.atLeftRecursionLimit(e))
        return e.err(void 0);
      hu.set(s, i + 1);
      const B = this.parser(e);
      return r = iu.get(this.id), r && r.offset > B.offset ? B.offset = r.offset : r || iu.set(this.id, B), B;
    };
    return new O(
      u,
      w("memoize", this)
    );
  }
  mergeMemos() {
    const u = (e) => {
      let s = iu.get(this.id);
      if (s)
        return s;
      if (this.atLeftRecursionLimit(e))
        return e.err(void 0);
      const i = this.parser(e);
      return s = iu.get(this.id), s || iu.set(this.id, i), i;
    };
    return new O(
      u,
      w("mergeMemo", this)
    );
  }
  then(u) {
    if (cu(this, u))
      return pu([this, u], "", (s) => [s == null ? void 0 : s[0], s == null ? void 0 : s[1]]);
    const e = (s) => {
      const i = this.parser(s);
      if (!i.isError) {
        const r = u.parser(i);
        if (!r.isError)
          return r.ok([i.value, r.value]);
      }
      return K(s), s.err(void 0);
    };
    return new O(
      e,
      w("then", this, this, u)
    );
  }
  or(u) {
    if (cu(this, u))
      return pu([this, u], "|");
    const e = (s) => {
      const i = this.parser(s);
      return i.isError ? u.parser(s) : i;
    };
    return new O(
      e,
      w("or", this, this, u)
    );
  }
  chain(u, e = !1) {
    const s = (i) => {
      const r = this.parser(i);
      return r.isError ? r : r.value || e ? u(r.value).parser(r) : i;
    };
    return new O(s, w("chain", this, u));
  }
  map(u, e = !1) {
    const s = (i) => {
      const r = this.parser(i);
      return !r.isError || e ? r.ok(u(r.value)) : r;
    };
    return new O(s, w("map", this));
  }
  mapState(u) {
    const e = (s) => {
      const i = this.parser(s);
      return u(i);
    };
    return new O(
      e,
      w("mapState", this)
    );
  }
  skip(u) {
    const e = (s) => {
      const i = this.parser(s);
      let r;
      return !i.isError && (r = u.parser(i), !r.isError) ? r.ok(i.value) : (K(s), s.err(void 0));
    };
    return new O(
      e,
      w("skip", this, u)
    );
  }
  next(u) {
    const e = this.then(u).map(([, s]) => s);
    return e.context = w("next", this, u), e;
  }
  opt() {
    const u = (e) => {
      const s = this.parser(e);
      return s.isError ? (K(e), e.ok(void 0)) : s;
    };
    return new O(u, w("opt", this));
  }
  not(u) {
    const e = (i) => this.parser(i).isError ? (K(i), i.ok(i.value)) : i.err(void 0), s = (i) => {
      const r = this.parser(i);
      return r.isError ? (K(i), r) : u.parser(i).isError ? r : (K(i), i.err(void 0));
    };
    return new O(
      u ? s : e,
      w("not", this, u)
    );
  }
  wrap(u, e, s = !0) {
    if (!s)
      return Iu(u, this, e);
    if (cu(u, this, e))
      return FD(u, this, e);
    const i = u.next(this).skip(e);
    return i.context = w("wrap", this, u, e), i;
  }
  trim(u = Wu, e = !0) {
    var s;
    if (!e)
      return Iu(u, this, u);
    if (((s = u.context) == null ? void 0 : s.name) === "whitespace") {
      if (cu(this, u))
        return pu(
          [u, this, u],
          "",
          (r) => r == null ? void 0 : r[2]
        );
      const i = (r) => {
        const B = Lu(r), m = this.parser(B);
        return m.isError ? (K(r), r.err(void 0)) : Lu(m);
      };
      return new O(
        i,
        w("trimWhitespace", this)
      );
    }
    return this.wrap(u, u);
  }
  many(u = 0, e = 1 / 0) {
    const s = (i) => {
      const r = [];
      let B = i;
      for (let m = 0; m < e; m += 1) {
        const I = this.parser(B);
        if (I.isError)
          break;
        r.push(I.value), B = I;
      }
      return r.length >= u ? B.ok(r) : (K(i), i.err([]));
    };
    return new O(
      s,
      w("many", this, u, e)
    );
  }
  sepBy(u, e = 0, s = 1 / 0) {
    const i = (r) => {
      const B = [];
      let m = r;
      for (let I = 0; I < s; I += 1) {
        const q = this.parser(m);
        if (q.isError)
          break;
        m = q, B.push(m.value);
        const M = u.parser(m);
        if (M.isError)
          break;
        m = M;
      }
      return B.length > e ? m.ok(B) : (K(r), r.err([]));
    };
    return new O(
      i,
      w("sepBy", this, u)
    );
  }
  eof() {
    const u = this.skip(aD());
    return u.context = w("eof", this), u;
  }
  debug(u = "", e = !1, s = console.log) {
    return rD(this, u, e, s);
  }
  toString() {
    return Mu(this);
  }
  static lazy(u) {
    const e = (s) => ku(u).parser(s);
    return new O(e, w("lazy", void 0, u));
  }
}
function cu(...n) {
  return n.every(
    (u) => {
      var e, s, i, r;
      return (((e = u.context) == null ? void 0 : e.name) === "string" || ((s = u.context) == null ? void 0 : s.name) === "regex" || ((i = u.context) == null ? void 0 : i.name) === "whitespace") && ((r = u.context) == null ? void 0 : r.args);
    }
  );
}
function iD(n) {
  var u, e, s, i, r;
  if (((u = n.context) == null ? void 0 : u.name) === "string")
    return (e = n.context) == null ? void 0 : e.args[0].replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  if (((s = n.context) == null ? void 0 : s.name) === "regex" || ((i = n.context) == null ? void 0 : i.name) === "whitespace")
    return (r = n.context) == null ? void 0 : r.args[0].source;
}
function pu(n, u = "", e) {
  const s = n.map((B) => `(${iD(B)})`).join(u), i = new RegExp(s), r = Ru(i, e);
  return u !== "|" && (r.context = w("regexConcat", this, i)), r;
}
function FD(n, u, e) {
  const s = pu([n, u, e], "", (i) => i == null ? void 0 : i[2]);
  return s.context.name = "regexWrap", s;
}
function aD() {
  const n = (u) => u.offset >= u.src.length ? u.ok(void 0) : u.err();
  return new O(n, w("eof", void 0));
}
function pD(n, u, e) {
  const s = e.value.bind(n);
  e.value = function() {
    const i = (r) => ku(s).parser(r);
    return new O(i, w("lazy", void 0, s));
  };
}
function BD(...n) {
  if (cu(...n))
    return pu(n, "|");
  const u = (e) => {
    for (const s of n) {
      const i = s.parser(e);
      if (!i.isError)
        return i;
    }
    return K(e), e.err(void 0);
  };
  return new O(
    n.length === 1 ? n[0].parser : u,
    w("any", void 0, ...n)
  );
}
function Iu(...n) {
  const u = (e) => {
    const s = [];
    for (const i of n) {
      const r = i.parser(e);
      if (r.isError)
        return r;
      r.value !== void 0 && s.push(r.value), e = r;
    }
    return K(e), e.ok(s);
  };
  return new O(
    n.length === 1 ? n[0].parser : u,
    w("all", void 0, ...n)
  );
}
function hD(n) {
  const u = (e) => {
    if (e.offset >= e.src.length)
      return e.err(void 0);
    const s = e.src.slice(e.offset, e.offset + n.length);
    return s === n ? e.ok(s, s.length) : (K(e), e.err(void 0));
  };
  return new O(
    u,
    w("string", void 0, n)
  );
}
function Ru(n, u = (e) => e == null ? void 0 : e[0]) {
  const e = n.flags.replace(/y/g, ""), s = new RegExp(n, e + "y"), i = (r) => {
    if (r.offset >= r.src.length)
      return r.err(void 0);
    s.lastIndex = r.offset;
    const B = u(r.src.match(s));
    return B ? r.ok(B, s.lastIndex - r.offset) : B === "" ? r.ok(void 0) : (K(r), r.err(void 0));
  };
  return new O(
    i,
    w("regex", void 0, n)
  );
}
const Nu = /\s*/y, Lu = (n) => {
  var e;
  if (n.offset >= n.src.length)
    return n;
  Nu.lastIndex = n.offset;
  const u = ((e = n.src.match(Nu)) == null ? void 0 : e[0]) ?? "";
  return n.ok(n.value, u.length);
}, Wu = Ru(/\s*/);
Wu.context.name = "whitespace";
export {
  O as P,
  BD as a,
  Iu as b,
  gu as c,
  w as d,
  aD as e,
  $u as f,
  ku as g,
  cD as h,
  Ou as i,
  Mu as j,
  nD as k,
  pD as l,
  K as m,
  rD as n,
  lD as p,
  Ru as r,
  hD as s,
  Wu as w
};
//# sourceMappingURL=parse-5b2a50cc.js.map
