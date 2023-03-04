var uD = Object.defineProperty;
var DD = (s, u, e) => u in s ? uD(s, u, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[u] = e;
var mu = (s, u, e) => (DD(s, typeof u != "symbol" ? u + "" : u, e), e);
import J from "chalk";
class gu {
  constructor(u, e = void 0, r = 0, i = !1, n = 0) {
    this.src = u, this.value = e, this.offset = r, this.isError = i, this.furthest = n;
  }
  ok(u, e = 0) {
    return e += this.offset, new gu(this.src, u, e, !1);
  }
  err(u, e = 0) {
    const r = this.ok(u, e);
    return r.isError = !0, r;
  }
  from(u, e = 0) {
    return e += this.offset, new gu(this.src, u, e, this.isError);
  }
  getColumnNumber() {
    const u = this.offset, e = this.src.lastIndexOf(`
`, u), r = e === -1 ? u : u - (e + 1);
    return Math.max(0, r);
  }
  getLineNumber() {
    const u = this.src.lastIndexOf(`
`, this.offset);
    return u >= 0 ? this.src.slice(0, u).split(`
`).length : 0;
  }
}
function w(s, u, ...e) {
  return {
    name: s,
    parser: u,
    args: e
  };
}
var q = {}, eD = {
  get exports() {
    return q;
  },
  set exports(s) {
    q = s;
  }
};
(function(s, u) {
  (function(e) {
    s.exports = e();
  })(function() {
    var e = Object.getOwnPropertyNames, r = (n, B) => function() {
      return B || (0, n[e(n)[0]])((B = { exports: {} }).exports, B), B.exports;
    }, i = r({
      "dist/_doc.js.umd.js"(n, B) {
        var m = Object.create, I = Object.defineProperty, z = Object.getOwnPropertyDescriptor, M = Object.getOwnPropertyNames, ru = Object.getPrototypeOf, Fu = Object.prototype.hasOwnProperty, uu = (C, g) => function() {
          return C && (g = (0, C[M(C)[0]])(C = 0)), g;
        }, Y = (C, g) => function() {
          return g || (0, C[M(C)[0]])((g = {
            exports: {}
          }).exports, g), g.exports;
        }, Eu = (C, g) => {
          for (var d in g)
            I(C, d, {
              get: g[d],
              enumerable: !0
            });
        }, Q = (C, g, d, A) => {
          if (g && typeof g == "object" || typeof g == "function")
            for (let k of M(g))
              !Fu.call(C, k) && k !== d && I(C, k, {
                get: () => g[k],
                enumerable: !(A = z(g, k)) || A.enumerable
              });
          return C;
        }, P = (C, g, d) => (d = C != null ? m(ru(C)) : {}, Q(g || !C || !C.__esModule ? I(d, "default", {
          value: C,
          enumerable: !0
        }) : d, C)), Bu = (C) => Q(I({}, "__esModule", {
          value: !0
        }), C), V = uu({
          "<define:process>"() {
          }
        }), du = Y({
          "src/document/doc-builders.js"(C, g) {
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
            function $(c) {
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
              return $(c[0], Object.assign(Object.assign({}, D), {}, {
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
            function L(c, D) {
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
              join: L,
              line: fu,
              softline: y,
              hardline: S,
              literalline: j,
              group: $,
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
        }), Wu = Y({
          "src/common/end-of-line.js"(C, g) {
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
            function $(p) {
              return p.replace(/\r\n?/g, `
`);
            }
            g.exports = {
              guessEndOfLine: d,
              convertEndOfLineToChars: A,
              countEndOfLineChars: k,
              normalizeEndOfLine: $
            };
          }
        }), xu = Y({
          "src/utils/get-last.js"(C, g) {
            V();
            var d = (A) => A[A.length - 1];
            g.exports = d;
          }
        });
        function qu() {
          let {
            onlyFirst: C = !1
          } = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
          const g = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"].join("|");
          return new RegExp(g, C ? void 0 : "g");
        }
        var zu = uu({
          "node_modules/strip-ansi/node_modules/ansi-regex/index.js"() {
            V();
          }
        });
        function Gu(C) {
          if (typeof C != "string")
            throw new TypeError(`Expected a \`string\`, got \`${typeof C}\``);
          return C.replace(qu(), "");
        }
        var Ju = uu({
          "node_modules/strip-ansi/index.js"() {
            V(), zu();
          }
        });
        function Hu(C) {
          return Number.isInteger(C) ? C >= 4352 && (C <= 4447 || C === 9001 || C === 9002 || 11904 <= C && C <= 12871 && C !== 12351 || 12880 <= C && C <= 19903 || 19968 <= C && C <= 42182 || 43360 <= C && C <= 43388 || 44032 <= C && C <= 55203 || 63744 <= C && C <= 64255 || 65040 <= C && C <= 65049 || 65072 <= C && C <= 65131 || 65281 <= C && C <= 65376 || 65504 <= C && C <= 65510 || 110592 <= C && C <= 110593 || 127488 <= C && C <= 127569 || 131072 <= C && C <= 262141) : !1;
        }
        var Ku = uu({
          "node_modules/is-fullwidth-code-point/index.js"() {
            V();
          }
        }), Vu = Y({
          "node_modules/emoji-regex/index.js"(C, g) {
            V(), g.exports = function() {
              return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
            };
          }
        }), vu = {};
        Eu(vu, {
          default: () => Uu
        });
        function Uu(C) {
          if (typeof C != "string" || C.length === 0 || (C = Gu(C), C.length === 0))
            return 0;
          C = C.replace((0, Su.default)(), "  ");
          let g = 0;
          for (let d = 0; d < C.length; d++) {
            const A = C.codePointAt(d);
            A <= 31 || A >= 127 && A <= 159 || A >= 768 && A <= 879 || (A > 65535 && d++, g += Hu(A) ? 2 : 1);
          }
          return g;
        }
        var Su, Yu = uu({
          "node_modules/string-width/index.js"() {
            V(), Ju(), Ku(), Su = P(Vu());
          }
        }), Zu = Y({
          "src/utils/get-string-width.js"(C, g) {
            V();
            var d = (Yu(), Bu(vu)).default, A = /[^\x20-\x7F]/;
            function k($) {
              return $ ? A.test($) ? d($) : $.length : 0;
            }
            g.exports = k;
          }
        }), Au = Y({
          "src/document/doc-utils.js"(C, g) {
            V();
            var d = xu(), {
              literalline: A,
              join: k
            } = du(), $ = (D) => Array.isArray(D) || D && D.type === "concat", p = (D) => {
              if (Array.isArray(D))
                return D;
              if (D.type !== "concat" && D.type !== "fill")
                throw new Error("Expect doc type to be `concat` or `fill`.");
              return D.parts;
            }, N = {};
            function T(D, t, F, f) {
              const E = [D];
              for (; E.length > 0; ) {
                const a = E.pop();
                if (a === N) {
                  F(E.pop());
                  continue;
                }
                if (F && E.push(a, N), !t || t(a) !== !1)
                  if ($(a) || a.type === "fill") {
                    const l = p(a);
                    for (let W = l.length, Du = W - 1; Du >= 0; --Du)
                      E.push(l[Du]);
                  } else if (a.type === "if-break")
                    a.flatContents && E.push(a.flatContents), a.breakContents && E.push(a.breakContents);
                  else if (a.type === "group" && a.expandedStates)
                    if (f)
                      for (let l = a.expandedStates.length, W = l - 1; W >= 0; --W)
                        E.push(a.expandedStates[W]);
                    else
                      E.push(a.contents);
                  else
                    a.contents && E.push(a.contents);
              }
            }
            function b(D, t) {
              const F = /* @__PURE__ */ new Map();
              return f(D);
              function f(a) {
                if (F.has(a))
                  return F.get(a);
                const l = E(a);
                return F.set(a, l), l;
              }
              function E(a) {
                if (Array.isArray(a))
                  return t(a.map(f));
                if (a.type === "concat" || a.type === "fill") {
                  const l = a.parts.map(f);
                  return t(Object.assign(Object.assign({}, a), {}, {
                    parts: l
                  }));
                }
                if (a.type === "if-break") {
                  const l = a.breakContents && f(a.breakContents), W = a.flatContents && f(a.flatContents);
                  return t(Object.assign(Object.assign({}, a), {}, {
                    breakContents: l,
                    flatContents: W
                  }));
                }
                if (a.type === "group" && a.expandedStates) {
                  const l = a.expandedStates.map(f), W = l[0];
                  return t(Object.assign(Object.assign({}, a), {}, {
                    contents: W,
                    expandedStates: l
                  }));
                }
                if (a.contents) {
                  const l = f(a.contents);
                  return t(Object.assign(Object.assign({}, a), {}, {
                    contents: l
                  }));
                }
                return t(a);
              }
            }
            function H(D, t, F) {
              let f = F, E = !1;
              function a(l) {
                const W = t(l);
                if (W !== void 0 && (E = !0, f = W), E)
                  return !1;
              }
              return T(D, a), f;
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
              function f(a) {
                if (a.type === "break-parent" && R(F), a.type === "group") {
                  if (F.push(a), t.has(a))
                    return !1;
                  t.add(a);
                }
              }
              function E(a) {
                a.type === "group" && F.pop().break && R(F);
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
              if ($(D) || D.type === "fill") {
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
              if (!$(D))
                return D;
              const t = [];
              for (const F of p(D)) {
                if (!F)
                  continue;
                const [f, ...E] = $(F) ? p(F) : [F];
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
                  if ($(f)) {
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
            function L(D) {
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
              isConcat: $,
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
              replaceEndOfLine: L,
              canBreak: c
            };
          }
        }), Xu = Y({
          "src/document/doc-printer.js"(C, g) {
            V();
            var {
              convertEndOfLineToChars: d
            } = Wu(), A = xu(), k = Zu(), {
              fill: $,
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
              let L = "", h = 0, x = 0, c = 0;
              for (const l of G)
                switch (l.type) {
                  case "indent":
                    F(), j.useTabs ? D(1) : t(j.tabWidth);
                    break;
                  case "stringAlign":
                    F(), L += l.n, h += l.n.length;
                    break;
                  case "numberAlign":
                    x += 1, c += l.n;
                    break;
                  default:
                    throw new Error(`Unexpected type '${l.type}'`);
                }
              return E(), Object.assign(Object.assign({}, y), {}, {
                value: L,
                length: h,
                queue: G
              });
              function D(l) {
                L += "	".repeat(l), h += j.tabWidth * l;
              }
              function t(l) {
                L += " ".repeat(l), h += l;
              }
              function F() {
                j.useTabs ? f() : E();
              }
              function f() {
                x > 0 && D(x), a();
              }
              function E() {
                c > 0 && t(c), a();
              }
              function a() {
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
            function U(y, S, j, G, L) {
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
                      if (L && t.break)
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
              let L = 0;
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
                  const a = G !== `
` ? E.replace(/\n/g, G) : E;
                  x.push(a), L += k(a);
                } else if (T(E)) {
                  const a = b(E);
                  for (let l = a.length - 1; l >= 0; l--)
                    h.push({
                      ind: F,
                      mode: f,
                      doc: a[l]
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
                      L -= nu(x);
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
                          const a = {
                            ind: F,
                            mode: _,
                            doc: E.contents
                          }, l = j - L, W = D.length > 0;
                          if (!E.break && U(a, h, l, W))
                            h.push(a);
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
                                  const lu = E.expandedStates[eu], Cu = {
                                    ind: F,
                                    mode: _,
                                    doc: lu
                                  };
                                  if (U(Cu, h, l, W)) {
                                    h.push(Cu);
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
                      const a = j - L, {
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
                      }, Cu = U(eu, [], a, D.length > 0, !0);
                      if (l.length === 1) {
                        Cu ? h.push(eu) : h.push(lu);
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
                        Cu ? h.push(wu, eu) : h.push(bu, lu);
                        break;
                      }
                      l.splice(0, 2);
                      const yu = {
                        ind: F,
                        mode: f,
                        doc: $(l)
                      }, Pu = l[0];
                      U({
                        ind: F,
                        mode: _,
                        doc: [W, Du, Pu]
                      }, [], a, D.length > 0, !0) ? h.push(yu, wu, eu) : Cu ? h.push(yu, bu, eu) : h.push(yu, bu, lu);
                      break;
                    }
                    case "if-break":
                    case "indent-if-break": {
                      const a = E.groupId ? H[E.groupId] : f;
                      if (a === o) {
                        const l = E.type === "if-break" ? E.breakContents : E.negate ? E.contents : N(E.contents);
                        l && h.push({
                          ind: F,
                          mode: f,
                          doc: l
                        });
                      }
                      if (a === _) {
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
                            E.soft || (x.push(" "), L += 1);
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
                          E.literal ? F.root ? (x.push(G, F.root.value), L = F.root.length) : (x.push(G), L = 0) : (L -= nu(x), x.push(G + F.value), L = F.length);
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
                const F = x.indexOf(p.placeholder, t + 1), f = x.slice(0, t).join(""), E = x.slice(t + 1, F).join(""), a = x.slice(F + 1).join("");
                return {
                  formatted: f + E + a,
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
        }), Qu = Y({
          "src/document/doc-debug.js"(C, g) {
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
            function $(p) {
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
              printDocToDebug: $
            };
          }
        });
        V(), B.exports = {
          builders: du(),
          printer: Xu(),
          utils: Au(),
          debug: Qu()
        };
      }
    });
    return i();
  });
})(eD);
const ju = 4, $u = {
  printWidth: 30,
  tabWidth: 4,
  useTabs: !1
};
function Tu(s) {
  return q.printer.printDocToString(s, $u).formatted;
}
function _u(s, u = "^", e = !1) {
  const r = (e ? J.red : J.green).bold, i = s.src.split(`
`), n = Math.min(i.length - 1, s.getLineNumber()), B = Math.max(n - ju, 0), m = Math.min(n + ju + 1, i.length), I = i.slice(B, m);
  if (u) {
    const M = " ".repeat(s.getColumnNumber()) + r(u);
    I.splice(n - B + 1, 0, M);
  }
  return I.map((M, ru) => {
    const Fu = B + ru + 1;
    let uu = r.reset.black(String(Fu));
    return M = Fu === n + 1 ? r(M) : M, `      ${uu}| ${M}`;
  }).join(`
`);
}
const X = (s, u = {}) => q.builders.group(s, { ...$u, ...u }), ou = (s) => J.gray(s), su = /* @__PURE__ */ new Map();
function Lu(s) {
  if (su.has(s.id))
    return su.get(s.id);
  const u = (i, n) => {
    if (su.has(i.id))
      return su.get(i.id);
    const { name: B, args: m, parser: I } = i.context, z = I != null ? u(I, n) : J.red.bold("unknown");
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
            u(Q, n),
            q.builders.indent([q.builders.softline, z]),
            q.builders.softline,
            u(P, n)
          ]);
        }
        case "trimWhitespace":
          return X([z, ou("?w")]);
        case "not":
          return X(["!", z]);
        case "opt":
          return X([z, ou("?")]);
        case "next":
          const [ru] = m;
          return X([z, ou(" >> "), u(ru, n)]);
        case "skip":
          const [Fu] = m;
          return X([z, ou(" << "), u(Fu, n)]);
        case "map":
          return z;
        case "all":
        case "then": {
          const Q = ou(", ");
          return X([
            "[",
            q.builders.indent([
              q.builders.softline,
              q.builders.join(
                [Q, q.builders.softline],
                m.map((P) => u(P, n))
              )
            ]),
            q.builders.softline,
            "]"
          ]);
        }
        case "any":
        case "or": {
          const Q = ou("| ");
          return X([
            [
              q.builders.join(
                [q.builders.softline, q.builders.ifBreak(Q, " " + Q)],
                m.map((P) => u(P, n))
              )
            ]
          ]);
        }
        case "many":
          const [uu, Y] = m;
          let Eu = Y === 1 / 0 ? `${uu},` : `${uu},${Y}`;
          return Eu = J.bold.gray(` {${Eu}}`), X([z, Eu]);
        case "sepBy":
          return X([
            z,
            q.builders.indent([" sepBy ", u(m[0], n)])
          ]);
        case "lazy": {
          const [Q] = m, P = ku(Q);
          if (n)
            return J.bold.blue(B);
          {
            const Bu = u(P, P.id);
            return su.set(P.id, Bu), Bu;
          }
        }
        case "debug":
          return z;
      }
    })();
    return M ?? (M = J.red.bold(B)), n && su.set(i.id, M), M;
  }, e = u(s), r = Tu(e);
  return su.set(s.id, r), r;
}
function tD(s, u = "", e = "") {
  const r = s.isError ? J.bgRed : J.bgGreen, i = s.isError ? J.red : J.green, n = s.offset >= s.src.length, B = s.isError ? "ｘ" : n ? "🎉" : "✓", I = " " + (s.isError ? "Err" : n ? "Done" : "Ok") + " " + B + " ", z = X([
    r.bold(I),
    i(`	${u}	${s.offset}`),
    q.builders.softline,
    "	" + J.yellow(e)
  ]), M = (() => s.offset >= s.src.length ? J.bold.greenBright(_u(s, "", s.isError)) : _u(s, "^", s.isError))(), ru = X([z, q.builders.hardline, q.builders.indent([M])]);
  return Tu(ru);
}
function nD(s, u = "", e = !1, r = console.log) {
  const i = (n) => {
    const B = s.parser(n), m = e ? Lu(s) : s.context.name, I = tD(B, u, m);
    return r(I), B;
  };
  return new O(i, w("debug", s, r));
}
let rD = 0;
const iu = /* @__PURE__ */ new Map(), hu = /* @__PURE__ */ new Map();
let au;
function K(s) {
  return (!au || au && s.offset > au.offset) && (au = s), au;
}
function ku(s) {
  return s.parser ? s.parser : s.parser = s();
}
class O {
  constructor(u, e = {}) {
    mu(this, "id", rD++);
    mu(this, "state");
    this.parser = u, this.context = e;
  }
  reset() {
    au = void 0, iu.clear(), hu.clear();
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
      const r = this.getCijKey(e), i = hu.get(r) ?? 0;
      let n = iu.get(this.id);
      if (n && n.offset >= e.offset)
        return n;
      if (this.atLeftRecursionLimit(e))
        return e.err(void 0);
      hu.set(r, i + 1);
      const B = this.parser(e);
      return n = iu.get(this.id), n && n.offset > B.offset ? B.offset = n.offset : n || iu.set(this.id, B), B;
    };
    return new O(
      u,
      w("memoize", this)
    );
  }
  mergeMemos() {
    const u = (e) => {
      let r = iu.get(this.id);
      if (r)
        return r;
      if (this.atLeftRecursionLimit(e))
        return e.err(void 0);
      const i = this.parser(e);
      return r = iu.get(this.id), r || iu.set(this.id, i), i;
    };
    return new O(
      u,
      w("mergeMemo", this)
    );
  }
  then(u) {
    if (cu(this, u))
      return pu([this, u], "", (r) => [r == null ? void 0 : r[0], r == null ? void 0 : r[1]]);
    const e = (r) => {
      const i = this.parser(r);
      if (!i.isError) {
        const n = u.parser(i);
        if (!n.isError)
          return n.ok([i.value, n.value]);
      }
      return K(r), r.err(void 0);
    };
    return new O(
      e,
      w("then", this, this, u)
    );
  }
  or(u) {
    if (cu(this, u))
      return pu([this, u], "|");
    const e = (r) => {
      const i = this.parser(r);
      return i.isError ? u.parser(r) : i;
    };
    return new O(
      e,
      w("or", this, this, u)
    );
  }
  chain(u, e = !1) {
    const r = (i) => {
      const n = this.parser(i);
      return n.isError ? n : n.value || e ? u(n.value).parser(n) : i;
    };
    return new O(r, w("chain", this, u));
  }
  map(u, e = !1) {
    const r = (i) => {
      const n = this.parser(i);
      return !n.isError || e ? n.ok(u(n.value)) : n;
    };
    return new O(r, w("map", this));
  }
  mapState(u) {
    const e = (r) => {
      const i = this.parser(r);
      return u(i);
    };
    return new O(
      e,
      w("mapState", this)
    );
  }
  skip(u) {
    const e = (r) => {
      const i = this.parser(r);
      let n;
      return !i.isError && (n = u.parser(i), !n.isError) ? n.ok(i.value) : (K(r), r.err(void 0));
    };
    return new O(
      e,
      w("skip", this, u)
    );
  }
  next(u) {
    const e = this.then(u).map(([, r]) => r);
    return e.context = w("next", this, u), e;
  }
  opt() {
    const u = (e) => {
      const r = this.parser(e);
      return r.isError ? (K(e), e.ok(void 0)) : r;
    };
    return new O(u, w("opt", this));
  }
  not(u) {
    const e = (i) => this.parser(i).isError ? (K(i), i.ok(i.value)) : i.err(void 0), r = (i) => {
      const n = this.parser(i);
      return n.isError ? (K(i), n) : u.parser(i).isError ? n : (K(i), i.err(void 0));
    };
    return new O(
      u ? r : e,
      w("not", this, u)
    );
  }
  wrap(u, e, r = !0) {
    if (!r)
      return Ou(u, this, e);
    if (cu(u, this, e))
      return iD(u, this, e);
    const i = u.next(this).skip(e);
    return i.context = w("wrap", this, u, e), i;
  }
  trim(u = Ru, e = !0) {
    var r;
    if (!e)
      return Ou(u, this, u);
    if (((r = u.context) == null ? void 0 : r.name) === "whitespace") {
      if (cu(this, u))
        return pu(
          [u, this, u],
          "",
          (n) => n == null ? void 0 : n[2]
        );
      const i = (n) => {
        const B = Nu(n), m = this.parser(B);
        return m.isError ? (K(n), n.err(void 0)) : Nu(m);
      };
      return new O(
        i,
        w("trimWhitespace", this)
      );
    }
    return this.wrap(u, u);
  }
  many(u = 0, e = 1 / 0) {
    const r = (i) => {
      const n = [];
      let B = i;
      for (let m = 0; m < e; m += 1) {
        const I = this.parser(B);
        if (I.isError)
          break;
        n.push(I.value), B = I;
      }
      return n.length >= u ? B.ok(n) : (K(i), i.err([]));
    };
    return new O(
      r,
      w("many", this, u, e)
    );
  }
  sepBy(u, e = 0, r = 1 / 0) {
    const i = (n) => {
      const B = [];
      let m = n;
      for (let I = 0; I < r; I += 1) {
        const z = this.parser(m);
        if (z.isError)
          break;
        m = z, B.push(m.value);
        const M = u.parser(m);
        if (M.isError)
          break;
        m = M;
      }
      return B.length > e ? m.ok(B) : (K(n), n.err([]));
    };
    return new O(
      i,
      w("sepBy", this, u)
    );
  }
  eof() {
    const u = this.skip(FD());
    return u.context = w("eof", this), u;
  }
  debug(u = "", e = !1, r = console.log) {
    return nD(this, u, e, r);
  }
  toString() {
    return Lu(this);
  }
  static lazy(u) {
    const e = (r) => ku(u).parser(r);
    return new O(e, w("lazy", void 0, u));
  }
}
function cu(...s) {
  return s.every(
    (u) => {
      var e, r, i, n;
      return (((e = u.context) == null ? void 0 : e.name) === "string" || ((r = u.context) == null ? void 0 : r.name) === "regex" || ((i = u.context) == null ? void 0 : i.name) === "whitespace") && ((n = u.context) == null ? void 0 : n.args);
    }
  );
}
function sD(s) {
  var u, e, r, i, n;
  if (((u = s.context) == null ? void 0 : u.name) === "string")
    return (e = s.context) == null ? void 0 : e.args[0].replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  if (((r = s.context) == null ? void 0 : r.name) === "regex" || ((i = s.context) == null ? void 0 : i.name) === "whitespace")
    return (n = s.context) == null ? void 0 : n.args[0].source;
}
function pu(s, u = "", e) {
  const r = s.map((B) => `(${sD(B)})`).join(u), i = new RegExp(r), n = Mu(i, e);
  return u !== "|" && (n.context = w("regexConcat", this, i)), n;
}
function iD(s, u, e) {
  const r = pu([s, u, e], "", (i) => i == null ? void 0 : i[2]);
  return r.context.name = "regexWrap", r;
}
function FD() {
  const s = (u) => u.offset >= u.src.length ? u.ok(void 0) : u.err();
  return new O(s, w("eof", void 0));
}
function fD(s, u, e) {
  const r = e.value.bind(s);
  e.value = function() {
    const i = (n) => ku(r).parser(n);
    return new O(i, w("lazy", void 0, r));
  };
}
function lD(...s) {
  if (cu(...s))
    return pu(s, "|");
  const u = (e) => {
    for (const r of s) {
      const i = r.parser(e);
      if (!i.isError)
        return i;
    }
    return K(e), e.err(void 0);
  };
  return new O(
    s.length === 1 ? s[0].parser : u,
    w("any", void 0, ...s)
  );
}
function Ou(...s) {
  const u = (e) => {
    const r = [];
    for (const i of s) {
      const n = i.parser(e);
      if (n.isError)
        return n;
      n.value !== void 0 && r.push(n.value), e = n;
    }
    return K(e), e.ok(r);
  };
  return new O(
    s.length === 1 ? s[0].parser : u,
    w("all", void 0, ...s)
  );
}
function cD(s) {
  const u = (e) => {
    if (e.offset >= e.src.length)
      return e.err(void 0);
    const r = e.src.slice(e.offset, e.offset + s.length);
    return r === s ? e.ok(r, r.length) : (K(e), e.err(void 0));
  };
  return new O(
    u,
    w("string", void 0, s)
  );
}
function Mu(s, u = (e) => e == null ? void 0 : e[0]) {
  const e = s.flags.replace(/y/g, ""), r = new RegExp(s, e + "y"), i = (n) => {
    if (n.offset >= n.src.length)
      return n.err(void 0);
    r.lastIndex = n.offset;
    const B = u(n.src.match(r));
    return B ? n.ok(B, r.lastIndex - n.offset) : B === "" ? n.ok(void 0) : (K(n), n.err(void 0));
  };
  return new O(
    i,
    w("regex", void 0, s)
  );
}
const Iu = /\s*/y, Nu = (s) => {
  var e;
  if (s.offset >= s.src.length)
    return s;
  Iu.lastIndex = s.offset;
  const u = ((e = s.src.match(Iu)) == null ? void 0 : e[0]) ?? "";
  return s.ok(s.value, u.length);
}, Ru = Mu(/\s*/);
Ru.context.name = "whitespace";
export {
  O as Parser,
  Ou as all,
  lD as any,
  FD as eof,
  ku as getLazyParser,
  fD as lazy,
  K as mergeErrorState,
  Mu as regex,
  cD as string,
  Ru as whitespace
};
//# sourceMappingURL=parse.js.map
