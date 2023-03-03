var Yu = Object.defineProperty;
var Zu = (i, D, e) => D in i ? Yu(i, D, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[D] = e;
var vu = (i, D, e) => (Zu(i, typeof D != "symbol" ? D + "" : D, e), e);
import G from "chalk";
class Bu {
  constructor(D, e = void 0, n = 0, F = !1) {
    this.src = D, this.value = e, this.offset = n, this.isError = F;
  }
  ok(D, e = 0) {
    return new Bu(this.src, D, this.offset + e);
  }
  err(D, e = 0) {
    const n = this.ok(D, e);
    return n.isError = !0, n;
  }
  from(D, e = 0) {
    return new Bu(this.src, D, this.offset + e, this.isError);
  }
  getColumnNumber() {
    const D = this.offset, e = this.src.lastIndexOf(`
`, D), n = e === -1 ? D : D - (e + 1);
    return Math.max(0, n);
  }
  getLineNumber() {
    const e = this.src.slice(0, this.offset).split(`
`).length - 1;
    return Math.max(0, e);
  }
  addCursor(D = "^", e = !1) {
    return Qu.call(this, D, e);
  }
}
function _(i, D, ...e) {
  return {
    name: i,
    parser: D,
    args: e
  };
}
var W = {}, Xu = {
  get exports() {
    return W;
  },
  set exports(i) {
    W = i;
  }
};
(function(i, D) {
  (function(e) {
    i.exports = e();
  })(function() {
    var e = Object.getOwnPropertyNames, n = (r, c) => function() {
      return c || (0, r[e(r)[0]])((c = { exports: {} }).exports, c), c.exports;
    }, F = n({
      "dist/_doc.js.umd.js"(r, c) {
        var v = Object.create, q = Object.defineProperty, w = Object.getOwnPropertyDescriptor, J = Object.getOwnPropertyNames, nu = Object.getPrototypeOf, ru = Object.prototype.hasOwnProperty, Q = (a, h) => function() {
          return a && (h = (0, a[J(a)[0]])(a = 0)), h;
        }, K = (a, h) => function() {
          return h || (0, a[J(a)[0]])((h = {
            exports: {}
          }).exports, h), h.exports;
        }, su = (a, h) => {
          for (var d in h)
            q(a, d, {
              get: h[d],
              enumerable: !0
            });
        }, V = (a, h, d, A) => {
          if (h && typeof h == "object" || typeof h == "function")
            for (let m of J(h))
              !ru.call(a, m) && m !== d && q(a, m, {
                get: () => h[m],
                enumerable: !(A = w(h, m)) || A.enumerable
              });
          return a;
        }, P = (a, h, d) => (d = a != null ? v(nu(a)) : {}, V(h || !a || !a.__esModule ? q(d, "default", {
          value: a,
          enumerable: !0
        }) : d, a)), cu = (a) => V(q({}, "__esModule", {
          value: !0
        }), a), U = Q({
          "<define:process>"() {
          }
        }), gu = K({
          "src/document/doc-builders.js"(a, h) {
            U();
            function d(p) {
              return {
                type: "concat",
                parts: p
              };
            }
            function A(p) {
              return {
                type: "indent",
                contents: p
              };
            }
            function m(p, u) {
              return {
                type: "align",
                contents: u,
                n: p
              };
            }
            function T(p) {
              let u = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
              return {
                type: "group",
                id: u.id,
                contents: p,
                break: Boolean(u.shouldBreak),
                expandedStates: u.expandedStates
              };
            }
            function B(p) {
              return m(Number.NEGATIVE_INFINITY, p);
            }
            function I(p) {
              return m({
                type: "root"
              }, p);
            }
            function $(p) {
              return m(-1, p);
            }
            function b(p, u) {
              return T(p[0], Object.assign(Object.assign({}, u), {}, {
                expandedStates: p
              }));
            }
            function H(p) {
              return {
                type: "fill",
                parts: p
              };
            }
            function C(p, u) {
              let t = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
              return {
                type: "if-break",
                breakContents: p,
                flatContents: u,
                groupId: t.groupId
              };
            }
            function O(p, u) {
              return {
                type: "indent-if-break",
                contents: p,
                groupId: u.groupId,
                negate: u.negate
              };
            }
            function M(p) {
              return {
                type: "line-suffix",
                contents: p
              };
            }
            var x = {
              type: "line-suffix-boundary"
            }, Z = {
              type: "break-parent"
            }, eu = {
              type: "trim"
            }, tu = {
              type: "line",
              hard: !0
            }, Y = {
              type: "line",
              hard: !0,
              literal: !0
            }, ou = {
              type: "line"
            }, y = {
              type: "line",
              soft: !0
            }, S = d([tu, Z]), j = d([Y, Z]), z = {
              type: "cursor",
              placeholder: Symbol("cursor")
            };
            function L(p, u) {
              const t = [];
              for (let s = 0; s < u.length; s++)
                s !== 0 && t.push(p), t.push(u[s]);
              return d(t);
            }
            function g(p, u, t) {
              let s = p;
              if (u > 0) {
                for (let f = 0; f < Math.floor(u / t); ++f)
                  s = A(s);
                s = m(u % t, s), s = m(Number.NEGATIVE_INFINITY, s);
              }
              return s;
            }
            function k(p, u) {
              return {
                type: "label",
                label: p,
                contents: u
              };
            }
            h.exports = {
              concat: d,
              join: L,
              line: ou,
              softline: y,
              hardline: S,
              literalline: j,
              group: T,
              conditionalGroup: b,
              fill: H,
              lineSuffix: M,
              lineSuffixBoundary: x,
              cursor: z,
              breakParent: Z,
              ifBreak: C,
              trim: eu,
              indent: A,
              indentIfBreak: O,
              align: m,
              addAlignmentToDoc: g,
              markAsRoot: I,
              dedentToRoot: B,
              dedent: $,
              hardlineWithoutBreakParent: tu,
              literallineWithoutBreakParent: Y,
              label: k
            };
          }
        }), Tu = K({
          "src/common/end-of-line.js"(a, h) {
            U();
            function d(B) {
              const I = B.indexOf("\r");
              return I >= 0 ? B.charAt(I + 1) === `
` ? "crlf" : "cr" : "lf";
            }
            function A(B) {
              switch (B) {
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
            function m(B, I) {
              let $;
              switch (I) {
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
                  throw new Error(`Unexpected "eol" ${JSON.stringify(I)}.`);
              }
              const b = B.match($);
              return b ? b.length : 0;
            }
            function T(B) {
              return B.replace(/\r\n?/g, `
`);
            }
            h.exports = {
              guessEndOfLine: d,
              convertEndOfLineToChars: A,
              countEndOfLineChars: m,
              normalizeEndOfLine: T
            };
          }
        }), yu = K({
          "src/utils/get-last.js"(a, h) {
            U();
            var d = (A) => A[A.length - 1];
            h.exports = d;
          }
        });
        function $u() {
          let {
            onlyFirst: a = !1
          } = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
          const h = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"].join("|");
          return new RegExp(h, a ? void 0 : "g");
        }
        var Lu = Q({
          "node_modules/strip-ansi/node_modules/ansi-regex/index.js"() {
            U();
          }
        });
        function Mu(a) {
          if (typeof a != "string")
            throw new TypeError(`Expected a \`string\`, got \`${typeof a}\``);
          return a.replace($u(), "");
        }
        var Ru = Q({
          "node_modules/strip-ansi/index.js"() {
            U(), Lu();
          }
        });
        function Wu(a) {
          return Number.isInteger(a) ? a >= 4352 && (a <= 4447 || a === 9001 || a === 9002 || 11904 <= a && a <= 12871 && a !== 12351 || 12880 <= a && a <= 19903 || 19968 <= a && a <= 42182 || 43360 <= a && a <= 43388 || 44032 <= a && a <= 55203 || 63744 <= a && a <= 64255 || 65040 <= a && a <= 65049 || 65072 <= a && a <= 65131 || 65281 <= a && a <= 65376 || 65504 <= a && a <= 65510 || 110592 <= a && a <= 110593 || 127488 <= a && a <= 127569 || 131072 <= a && a <= 262141) : !1;
        }
        var qu = Q({
          "node_modules/is-fullwidth-code-point/index.js"() {
            U();
          }
        }), zu = K({
          "node_modules/emoji-regex/index.js"(a, h) {
            U(), h.exports = function() {
              return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
            };
          }
        }), mu = {};
        su(mu, {
          default: () => Gu
        });
        function Gu(a) {
          if (typeof a != "string" || a.length === 0 || (a = Mu(a), a.length === 0))
            return 0;
          a = a.replace((0, ku.default)(), "  ");
          let h = 0;
          for (let d = 0; d < a.length; d++) {
            const A = a.codePointAt(d);
            A <= 31 || A >= 127 && A <= 159 || A >= 768 && A <= 879 || (A > 65535 && d++, h += Wu(A) ? 2 : 1);
          }
          return h;
        }
        var ku, Ju = Q({
          "node_modules/string-width/index.js"() {
            U(), Ru(), qu(), ku = P(zu());
          }
        }), Hu = K({
          "src/utils/get-string-width.js"(a, h) {
            U();
            var d = (Ju(), cu(mu)).default, A = /[^\x20-\x7F]/;
            function m(T) {
              return T ? A.test(T) ? d(T) : T.length : 0;
            }
            h.exports = m;
          }
        }), hu = K({
          "src/document/doc-utils.js"(a, h) {
            U();
            var d = yu(), {
              literalline: A,
              join: m
            } = gu(), T = (u) => Array.isArray(u) || u && u.type === "concat", B = (u) => {
              if (Array.isArray(u))
                return u;
              if (u.type !== "concat" && u.type !== "fill")
                throw new Error("Expect doc type to be `concat` or `fill`.");
              return u.parts;
            }, I = {};
            function $(u, t, s, f) {
              const E = [u];
              for (; E.length > 0; ) {
                const o = E.pop();
                if (o === I) {
                  s(E.pop());
                  continue;
                }
                if (s && E.push(o, I), !t || t(o) !== !1)
                  if (T(o) || o.type === "fill") {
                    const l = B(o);
                    for (let R = l.length, uu = R - 1; uu >= 0; --uu)
                      E.push(l[uu]);
                  } else if (o.type === "if-break")
                    o.flatContents && E.push(o.flatContents), o.breakContents && E.push(o.breakContents);
                  else if (o.type === "group" && o.expandedStates)
                    if (f)
                      for (let l = o.expandedStates.length, R = l - 1; R >= 0; --R)
                        E.push(o.expandedStates[R]);
                    else
                      E.push(o.contents);
                  else
                    o.contents && E.push(o.contents);
              }
            }
            function b(u, t) {
              const s = /* @__PURE__ */ new Map();
              return f(u);
              function f(o) {
                if (s.has(o))
                  return s.get(o);
                const l = E(o);
                return s.set(o, l), l;
              }
              function E(o) {
                if (Array.isArray(o))
                  return t(o.map(f));
                if (o.type === "concat" || o.type === "fill") {
                  const l = o.parts.map(f);
                  return t(Object.assign(Object.assign({}, o), {}, {
                    parts: l
                  }));
                }
                if (o.type === "if-break") {
                  const l = o.breakContents && f(o.breakContents), R = o.flatContents && f(o.flatContents);
                  return t(Object.assign(Object.assign({}, o), {}, {
                    breakContents: l,
                    flatContents: R
                  }));
                }
                if (o.type === "group" && o.expandedStates) {
                  const l = o.expandedStates.map(f), R = l[0];
                  return t(Object.assign(Object.assign({}, o), {}, {
                    contents: R,
                    expandedStates: l
                  }));
                }
                if (o.contents) {
                  const l = f(o.contents);
                  return t(Object.assign(Object.assign({}, o), {}, {
                    contents: l
                  }));
                }
                return t(o);
              }
            }
            function H(u, t, s) {
              let f = s, E = !1;
              function o(l) {
                const R = t(l);
                if (R !== void 0 && (E = !0, f = R), E)
                  return !1;
              }
              return $(u, o), f;
            }
            function C(u) {
              if (u.type === "group" && u.break || u.type === "line" && u.hard || u.type === "break-parent")
                return !0;
            }
            function O(u) {
              return H(u, C, !1);
            }
            function M(u) {
              if (u.length > 0) {
                const t = d(u);
                !t.expandedStates && !t.break && (t.break = "propagated");
              }
              return null;
            }
            function x(u) {
              const t = /* @__PURE__ */ new Set(), s = [];
              function f(o) {
                if (o.type === "break-parent" && M(s), o.type === "group") {
                  if (s.push(o), t.has(o))
                    return !1;
                  t.add(o);
                }
              }
              function E(o) {
                o.type === "group" && s.pop().break && M(s);
              }
              $(u, f, E, !0);
            }
            function Z(u) {
              return u.type === "line" && !u.hard ? u.soft ? "" : " " : u.type === "if-break" ? u.flatContents || "" : u;
            }
            function eu(u) {
              return b(u, Z);
            }
            var tu = (u, t) => u && u.type === "line" && u.hard && t && t.type === "break-parent";
            function Y(u) {
              if (!u)
                return u;
              if (T(u) || u.type === "fill") {
                const t = B(u);
                for (; t.length > 1 && tu(...t.slice(-2)); )
                  t.length -= 2;
                if (t.length > 0) {
                  const s = Y(d(t));
                  t[t.length - 1] = s;
                }
                return Array.isArray(u) ? t : Object.assign(Object.assign({}, u), {}, {
                  parts: t
                });
              }
              switch (u.type) {
                case "align":
                case "indent":
                case "indent-if-break":
                case "group":
                case "line-suffix":
                case "label": {
                  const t = Y(u.contents);
                  return Object.assign(Object.assign({}, u), {}, {
                    contents: t
                  });
                }
                case "if-break": {
                  const t = Y(u.breakContents), s = Y(u.flatContents);
                  return Object.assign(Object.assign({}, u), {}, {
                    breakContents: t,
                    flatContents: s
                  });
                }
              }
              return u;
            }
            function ou(u) {
              return Y(S(u));
            }
            function y(u) {
              switch (u.type) {
                case "fill":
                  if (u.parts.every((s) => s === ""))
                    return "";
                  break;
                case "group":
                  if (!u.contents && !u.id && !u.break && !u.expandedStates)
                    return "";
                  if (u.contents.type === "group" && u.contents.id === u.id && u.contents.break === u.break && u.contents.expandedStates === u.expandedStates)
                    return u.contents;
                  break;
                case "align":
                case "indent":
                case "indent-if-break":
                case "line-suffix":
                  if (!u.contents)
                    return "";
                  break;
                case "if-break":
                  if (!u.flatContents && !u.breakContents)
                    return "";
                  break;
              }
              if (!T(u))
                return u;
              const t = [];
              for (const s of B(u)) {
                if (!s)
                  continue;
                const [f, ...E] = T(s) ? B(s) : [s];
                typeof f == "string" && typeof d(t) == "string" ? t[t.length - 1] += f : t.push(f), t.push(...E);
              }
              return t.length === 0 ? "" : t.length === 1 ? t[0] : Array.isArray(u) ? t : Object.assign(Object.assign({}, u), {}, {
                parts: t
              });
            }
            function S(u) {
              return b(u, (t) => y(t));
            }
            function j(u) {
              const t = [], s = u.filter(Boolean);
              for (; s.length > 0; ) {
                const f = s.shift();
                if (f) {
                  if (T(f)) {
                    s.unshift(...B(f));
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
            function z(u) {
              return b(u, (t) => Array.isArray(t) ? j(t) : t.parts ? Object.assign(Object.assign({}, t), {}, {
                parts: j(t.parts)
              }) : t);
            }
            function L(u) {
              return b(u, (t) => typeof t == "string" && t.includes(`
`) ? g(t) : t);
            }
            function g(u) {
              let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : A;
              return m(t, u.split(`
`)).parts;
            }
            function k(u) {
              if (u.type === "line")
                return !0;
            }
            function p(u) {
              return H(u, k, !1);
            }
            h.exports = {
              isConcat: T,
              getDocParts: B,
              willBreak: O,
              traverseDoc: $,
              findInDoc: H,
              mapDoc: b,
              propagateBreaks: x,
              removeLines: eu,
              stripTrailingHardline: ou,
              normalizeParts: j,
              normalizeDoc: z,
              cleanDoc: S,
              replaceTextEndOfLine: g,
              replaceEndOfLine: L,
              canBreak: p
            };
          }
        }), Ku = K({
          "src/document/doc-printer.js"(a, h) {
            U();
            var {
              convertEndOfLineToChars: d
            } = Tu(), A = yu(), m = Hu(), {
              fill: T,
              cursor: B,
              indent: I
            } = gu(), {
              isConcat: $,
              getDocParts: b
            } = hu(), H, C = 1, O = 2;
            function M() {
              return {
                value: "",
                length: 0,
                queue: []
              };
            }
            function x(y, S) {
              return eu(y, {
                type: "indent"
              }, S);
            }
            function Z(y, S, j) {
              return S === Number.NEGATIVE_INFINITY ? y.root || M() : S < 0 ? eu(y, {
                type: "dedent"
              }, j) : S ? S.type === "root" ? Object.assign(Object.assign({}, y), {}, {
                root: y
              }) : eu(y, {
                type: typeof S == "string" ? "stringAlign" : "numberAlign",
                n: S
              }, j) : y;
            }
            function eu(y, S, j) {
              const z = S.type === "dedent" ? y.queue.slice(0, -1) : [...y.queue, S];
              let L = "", g = 0, k = 0, p = 0;
              for (const l of z)
                switch (l.type) {
                  case "indent":
                    s(), j.useTabs ? u(1) : t(j.tabWidth);
                    break;
                  case "stringAlign":
                    s(), L += l.n, g += l.n.length;
                    break;
                  case "numberAlign":
                    k += 1, p += l.n;
                    break;
                  default:
                    throw new Error(`Unexpected type '${l.type}'`);
                }
              return E(), Object.assign(Object.assign({}, y), {}, {
                value: L,
                length: g,
                queue: z
              });
              function u(l) {
                L += "	".repeat(l), g += j.tabWidth * l;
              }
              function t(l) {
                L += " ".repeat(l), g += l;
              }
              function s() {
                j.useTabs ? f() : E();
              }
              function f() {
                k > 0 && u(k), o();
              }
              function E() {
                p > 0 && t(p), o();
              }
              function o() {
                k = 0, p = 0;
              }
            }
            function tu(y) {
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
            function Y(y, S, j, z, L) {
              let g = S.length;
              const k = [y], p = [];
              for (; j >= 0; ) {
                if (k.length === 0) {
                  if (g === 0)
                    return !0;
                  k.push(S[--g]);
                  continue;
                }
                const {
                  mode: u,
                  doc: t
                } = k.pop();
                if (typeof t == "string")
                  p.push(t), j -= m(t);
                else if ($(t) || t.type === "fill") {
                  const s = b(t);
                  for (let f = s.length - 1; f >= 0; f--)
                    k.push({
                      mode: u,
                      doc: s[f]
                    });
                } else
                  switch (t.type) {
                    case "indent":
                    case "align":
                    case "indent-if-break":
                    case "label":
                      k.push({
                        mode: u,
                        doc: t.contents
                      });
                      break;
                    case "trim":
                      j += tu(p);
                      break;
                    case "group": {
                      if (L && t.break)
                        return !1;
                      const s = t.break ? C : u, f = t.expandedStates && s === C ? A(t.expandedStates) : t.contents;
                      k.push({
                        mode: s,
                        doc: f
                      });
                      break;
                    }
                    case "if-break": {
                      const f = (t.groupId ? H[t.groupId] || O : u) === C ? t.breakContents : t.flatContents;
                      f && k.push({
                        mode: u,
                        doc: f
                      });
                      break;
                    }
                    case "line":
                      if (u === C || t.hard)
                        return !0;
                      t.soft || (p.push(" "), j--);
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
            function ou(y, S) {
              H = {};
              const j = S.printWidth, z = d(S.endOfLine);
              let L = 0;
              const g = [{
                ind: M(),
                mode: C,
                doc: y
              }], k = [];
              let p = !1;
              const u = [];
              for (; g.length > 0; ) {
                const {
                  ind: s,
                  mode: f,
                  doc: E
                } = g.pop();
                if (typeof E == "string") {
                  const o = z !== `
` ? E.replace(/\n/g, z) : E;
                  k.push(o), L += m(o);
                } else if ($(E)) {
                  const o = b(E);
                  for (let l = o.length - 1; l >= 0; l--)
                    g.push({
                      ind: s,
                      mode: f,
                      doc: o[l]
                    });
                } else
                  switch (E.type) {
                    case "cursor":
                      k.push(B.placeholder);
                      break;
                    case "indent":
                      g.push({
                        ind: x(s, S),
                        mode: f,
                        doc: E.contents
                      });
                      break;
                    case "align":
                      g.push({
                        ind: Z(s, E.n, S),
                        mode: f,
                        doc: E.contents
                      });
                      break;
                    case "trim":
                      L -= tu(k);
                      break;
                    case "group":
                      switch (f) {
                        case O:
                          if (!p) {
                            g.push({
                              ind: s,
                              mode: E.break ? C : O,
                              doc: E.contents
                            });
                            break;
                          }
                        case C: {
                          p = !1;
                          const o = {
                            ind: s,
                            mode: O,
                            doc: E.contents
                          }, l = j - L, R = u.length > 0;
                          if (!E.break && Y(o, g, l, R))
                            g.push(o);
                          else if (E.expandedStates) {
                            const uu = A(E.expandedStates);
                            if (E.break) {
                              g.push({
                                ind: s,
                                mode: C,
                                doc: uu
                              });
                              break;
                            } else
                              for (let Du = 1; Du < E.expandedStates.length + 1; Du++)
                                if (Du >= E.expandedStates.length) {
                                  g.push({
                                    ind: s,
                                    mode: C,
                                    doc: uu
                                  });
                                  break;
                                } else {
                                  const Eu = E.expandedStates[Du], au = {
                                    ind: s,
                                    mode: O,
                                    doc: Eu
                                  };
                                  if (Y(au, g, l, R)) {
                                    g.push(au);
                                    break;
                                  }
                                }
                          } else
                            g.push({
                              ind: s,
                              mode: C,
                              doc: E.contents
                            });
                          break;
                        }
                      }
                      E.id && (H[E.id] = A(g).mode);
                      break;
                    case "fill": {
                      const o = j - L, {
                        parts: l
                      } = E;
                      if (l.length === 0)
                        break;
                      const [R, uu] = l, Du = {
                        ind: s,
                        mode: O,
                        doc: R
                      }, Eu = {
                        ind: s,
                        mode: C,
                        doc: R
                      }, au = Y(Du, [], o, u.length > 0, !0);
                      if (l.length === 1) {
                        au ? g.push(Du) : g.push(Eu);
                        break;
                      }
                      const xu = {
                        ind: s,
                        mode: O,
                        doc: uu
                      }, du = {
                        ind: s,
                        mode: C,
                        doc: uu
                      };
                      if (l.length === 2) {
                        au ? g.push(xu, Du) : g.push(du, Eu);
                        break;
                      }
                      l.splice(0, 2);
                      const Au = {
                        ind: s,
                        mode: f,
                        doc: T(l)
                      }, Uu = l[0];
                      Y({
                        ind: s,
                        mode: O,
                        doc: [R, uu, Uu]
                      }, [], o, u.length > 0, !0) ? g.push(Au, xu, Du) : au ? g.push(Au, du, Du) : g.push(Au, du, Eu);
                      break;
                    }
                    case "if-break":
                    case "indent-if-break": {
                      const o = E.groupId ? H[E.groupId] : f;
                      if (o === C) {
                        const l = E.type === "if-break" ? E.breakContents : E.negate ? E.contents : I(E.contents);
                        l && g.push({
                          ind: s,
                          mode: f,
                          doc: l
                        });
                      }
                      if (o === O) {
                        const l = E.type === "if-break" ? E.flatContents : E.negate ? I(E.contents) : E.contents;
                        l && g.push({
                          ind: s,
                          mode: f,
                          doc: l
                        });
                      }
                      break;
                    }
                    case "line-suffix":
                      u.push({
                        ind: s,
                        mode: f,
                        doc: E.contents
                      });
                      break;
                    case "line-suffix-boundary":
                      u.length > 0 && g.push({
                        ind: s,
                        mode: f,
                        doc: {
                          type: "line",
                          hard: !0
                        }
                      });
                      break;
                    case "line":
                      switch (f) {
                        case O:
                          if (E.hard)
                            p = !0;
                          else {
                            E.soft || (k.push(" "), L += 1);
                            break;
                          }
                        case C:
                          if (u.length > 0) {
                            g.push({
                              ind: s,
                              mode: f,
                              doc: E
                            }, ...u.reverse()), u.length = 0;
                            break;
                          }
                          E.literal ? s.root ? (k.push(z, s.root.value), L = s.root.length) : (k.push(z), L = 0) : (L -= tu(k), k.push(z + s.value), L = s.length);
                          break;
                      }
                      break;
                    case "label":
                      g.push({
                        ind: s,
                        mode: f,
                        doc: E.contents
                      });
                      break;
                  }
                g.length === 0 && u.length > 0 && (g.push(...u.reverse()), u.length = 0);
              }
              const t = k.indexOf(B.placeholder);
              if (t !== -1) {
                const s = k.indexOf(B.placeholder, t + 1), f = k.slice(0, t).join(""), E = k.slice(t + 1, s).join(""), o = k.slice(s + 1).join("");
                return {
                  formatted: f + E + o,
                  cursorNodeStart: f.length,
                  cursorNodeText: E
                };
              }
              return {
                formatted: k.join("")
              };
            }
            h.exports = {
              printDocToString: ou
            };
          }
        }), Vu = K({
          "src/document/doc-debug.js"(a, h) {
            U();
            var {
              isConcat: d,
              getDocParts: A
            } = hu();
            function m(B) {
              if (!B)
                return "";
              if (d(B)) {
                const I = [];
                for (const $ of A(B))
                  if (d($))
                    I.push(...m($).parts);
                  else {
                    const b = m($);
                    b !== "" && I.push(b);
                  }
                return {
                  type: "concat",
                  parts: I
                };
              }
              return B.type === "if-break" ? Object.assign(Object.assign({}, B), {}, {
                breakContents: m(B.breakContents),
                flatContents: m(B.flatContents)
              }) : B.type === "group" ? Object.assign(Object.assign({}, B), {}, {
                contents: m(B.contents),
                expandedStates: B.expandedStates && B.expandedStates.map(m)
              }) : B.type === "fill" ? {
                type: "fill",
                parts: B.parts.map(m)
              } : B.contents ? Object.assign(Object.assign({}, B), {}, {
                contents: m(B.contents)
              }) : B;
            }
            function T(B) {
              const I = /* @__PURE__ */ Object.create(null), $ = /* @__PURE__ */ new Set();
              return b(m(B));
              function b(C, O, M) {
                if (typeof C == "string")
                  return JSON.stringify(C);
                if (d(C)) {
                  const x = A(C).map(b).filter(Boolean);
                  return x.length === 1 ? x[0] : `[${x.join(", ")}]`;
                }
                if (C.type === "line") {
                  const x = Array.isArray(M) && M[O + 1] && M[O + 1].type === "break-parent";
                  return C.literal ? x ? "literalline" : "literallineWithoutBreakParent" : C.hard ? x ? "hardline" : "hardlineWithoutBreakParent" : C.soft ? "softline" : "line";
                }
                if (C.type === "break-parent")
                  return Array.isArray(M) && M[O - 1] && M[O - 1].type === "line" && M[O - 1].hard ? void 0 : "breakParent";
                if (C.type === "trim")
                  return "trim";
                if (C.type === "indent")
                  return "indent(" + b(C.contents) + ")";
                if (C.type === "align")
                  return C.n === Number.NEGATIVE_INFINITY ? "dedentToRoot(" + b(C.contents) + ")" : C.n < 0 ? "dedent(" + b(C.contents) + ")" : C.n.type === "root" ? "markAsRoot(" + b(C.contents) + ")" : "align(" + JSON.stringify(C.n) + ", " + b(C.contents) + ")";
                if (C.type === "if-break")
                  return "ifBreak(" + b(C.breakContents) + (C.flatContents ? ", " + b(C.flatContents) : "") + (C.groupId ? (C.flatContents ? "" : ', ""') + `, { groupId: ${H(C.groupId)} }` : "") + ")";
                if (C.type === "indent-if-break") {
                  const x = [];
                  C.negate && x.push("negate: true"), C.groupId && x.push(`groupId: ${H(C.groupId)}`);
                  const Z = x.length > 0 ? `, { ${x.join(", ")} }` : "";
                  return `indentIfBreak(${b(C.contents)}${Z})`;
                }
                if (C.type === "group") {
                  const x = [];
                  C.break && C.break !== "propagated" && x.push("shouldBreak: true"), C.id && x.push(`id: ${H(C.id)}`);
                  const Z = x.length > 0 ? `, { ${x.join(", ")} }` : "";
                  return C.expandedStates ? `conditionalGroup([${C.expandedStates.map((eu) => b(eu)).join(",")}]${Z})` : `group(${b(C.contents)}${Z})`;
                }
                if (C.type === "fill")
                  return `fill([${C.parts.map((x) => b(x)).join(", ")}])`;
                if (C.type === "line-suffix")
                  return "lineSuffix(" + b(C.contents) + ")";
                if (C.type === "line-suffix-boundary")
                  return "lineSuffixBoundary";
                if (C.type === "label")
                  return `label(${JSON.stringify(C.label)}, ${b(C.contents)})`;
                throw new Error("Unknown doc type " + C.type);
              }
              function H(C) {
                if (typeof C != "symbol")
                  return JSON.stringify(String(C));
                if (C in I)
                  return I[C];
                const O = String(C).slice(7, -1) || "symbol";
                for (let M = 0; ; M++) {
                  const x = O + (M > 0 ? ` #${M}` : "");
                  if (!$.has(x))
                    return $.add(x), I[C] = `Symbol.for(${JSON.stringify(x)})`;
                }
              }
            }
            h.exports = {
              printDocToDebug: T
            };
          }
        });
        U(), c.exports = {
          builders: gu(),
          printer: Ku(),
          utils: hu(),
          debug: Vu()
        };
      }
    });
    return F();
  });
})(Xu);
const Su = 4, _u = {
  printWidth: 30,
  tabWidth: 4,
  useTabs: !1
};
function Ou(i) {
  return W.printer.printDocToString(i, _u).formatted;
}
function Qu(i = "^", D = !1) {
  const e = (D ? G.red : G.green).bold, n = this.src.split(`
`), F = Math.min(n.length - 1, this.getLineNumber()), r = Math.max(F - Su, 0), c = Math.min(F + Su + 1, n.length), v = n.slice(r, c);
  if (i) {
    const w = " ".repeat(this.getColumnNumber()) + e(i);
    v.splice(F - r + 1, 0, w);
  }
  return v.map((w, J) => {
    const nu = r + J + 1;
    let ru = e.reset.black(String(nu));
    return w = nu === F + 1 ? e(w) : w, `	${ru}| ${w}`;
  }).join(`
`);
}
const X = (i, D = {}) => W.builders.group(i, { ..._u, ...D }), Cu = (i) => G.gray(i), iu = /* @__PURE__ */ new Map();
function Pu(i) {
  if (iu.has(i.id))
    return iu.get(i.id);
  const D = (F, r) => {
    if (iu.has(F.id))
      return iu.get(F.id);
    const { name: c, args: v, parser: q } = F.context, w = q != null ? D(q, r) : G.red.bold("unknown");
    let J = (() => {
      switch (c) {
        case "string":
          return G.yellow(`"${v[0]}"`);
        case "regex":
        case "regexConcat":
        case "regexWrap":
          return G.redBright(`${v[0]}`);
        case "wrap":
        case "trim": {
          const [V, P] = v;
          return X([
            D(V, r),
            W.builders.indent([W.builders.softline, w]),
            W.builders.softline,
            D(P, r)
          ]);
        }
        case "trimWhitespace":
          return X([w, Cu("?w")]);
        case "not":
          return X(["!", w]);
        case "opt":
          return X([w, Cu("?")]);
        case "next":
          const [nu] = v;
          return X([w, Cu(" >> "), D(nu, r)]);
        case "skip":
          const [ru] = v;
          return X([w, Cu(" << "), D(ru, r)]);
        case "map":
          return w;
        case "all":
        case "then": {
          const V = Cu(", ");
          return X([
            "[",
            W.builders.indent([
              W.builders.softline,
              W.builders.join(
                [V, W.builders.softline],
                v.map((P) => D(P, r))
              )
            ]),
            W.builders.softline,
            "]"
          ]);
        }
        case "any":
        case "or": {
          const V = Cu("| ");
          return X([
            [
              W.builders.join(
                [W.builders.softline, W.builders.ifBreak(V, " " + V)],
                v.map((P) => D(P, r))
              )
            ]
          ]);
        }
        case "many":
          const [Q, K] = v;
          let su = K === 1 / 0 ? `${Q},` : `${Q},${K}`;
          return su = G.bold.gray(` {${su}}`), X([w, su]);
        case "sepBy":
          return X([
            w,
            W.builders.indent([" sepBy ", D(v[0], r)])
          ]);
        case "lazy": {
          const [V] = v, P = bu(V);
          if (r)
            return G.bold.blue(c);
          {
            const cu = D(P, P.id);
            return iu.set(P.id, cu), cu;
          }
        }
        case "debug":
          return w;
      }
    })();
    return J ?? (J = G.red.bold(c)), r && iu.set(F.id, J), J;
  }, e = D(i), n = Ou(e);
  return iu.set(i.id, n), n;
}
function uD(i, D = "", e = !1, n = console.log) {
  const F = (r) => {
    const c = i.parser(r), v = c.isError ? G.bgRed : G.bgGreen, q = c.isError ? G.red : G.green, w = c.offset >= c.src.length, J = c.isError ? "ｘ" : w ? "🎉" : "✓", ru = " " + (c.isError ? "Err" : w ? "Done" : "Ok") + " " + J + " ", Q = e ? i.toString() : i.context.name, K = X([
      v.bold(ru),
      q(`	${D}	${c.offset}`),
      W.builders.softline,
      "	" + G.yellow(Q)
    ]), su = (() => c.offset >= c.src.length ? G.bold.greenBright(c.addCursor("", c.isError)) : c.addCursor("^", c.isError))(), V = X([K, W.builders.hardline, W.builders.indent([su])]);
    return n(Ou(V)), c;
  };
  return new N(F, _("debug", i, n));
}
let DD = 0;
const Fu = /* @__PURE__ */ new Map(), pu = /* @__PURE__ */ new Map();
function bu(i) {
  return i.parser ? i.parser : i.parser = i();
}
class N {
  constructor(D, e = {}) {
    vu(this, "id", DD++);
    this.parser = D, this.context = e;
  }
  parse(D) {
    return Fu.clear(), pu.clear(), this.parser(new Bu(D)).value;
  }
  getCijKey(D) {
    return `${this.id}${D.offset}`;
  }
  atLeftRecursionLimit(D) {
    return (pu.get(this.getCijKey(D)) ?? 0) > D.src.length - D.offset;
  }
  memoize() {
    const D = (e) => {
      const n = this.getCijKey(e), F = pu.get(n) ?? 0;
      let r = Fu.get(this.id);
      if (r && r.offset >= e.offset)
        return r;
      if (this.atLeftRecursionLimit(e))
        return e.err(void 0);
      pu.set(n, F + 1);
      const c = this.parser(e);
      return r = Fu.get(this.id), r && r.offset > c.offset ? c.offset = r.offset : r || Fu.set(this.id, c), c;
    };
    return new N(
      D,
      _("memoize", this)
    );
  }
  mergeMemos() {
    const D = (e) => {
      let n = Fu.get(this.id);
      if (n)
        return n;
      if (this.atLeftRecursionLimit(e))
        return e.err(void 0);
      const F = this.parser(e);
      return n = Fu.get(this.id), n || Fu.set(this.id, F), F;
    };
    return new N(
      D,
      _("mergeMemo", this)
    );
  }
  then(D) {
    if (fu(this, D))
      return lu([this, D], "", (n) => [n == null ? void 0 : n[0], n == null ? void 0 : n[1]]);
    const e = (n) => {
      const F = this.parser(n);
      if (!F.isError) {
        const r = D.parser(F);
        if (!r.isError)
          return r.ok([F.value, r.value]);
      }
      return n.err(void 0);
    };
    return new N(
      e,
      _("then", this, this, D)
    );
  }
  or(D) {
    if (fu(this, D))
      return lu([this, D], "|");
    const e = (n) => {
      const F = this.parser(n);
      return F.isError ? D.parser(n) : F;
    };
    return new N(
      e,
      _("or", this, this, D)
    );
  }
  chain(D, e = !1) {
    const n = (F) => {
      const r = this.parser(F);
      return r.isError ? r : r.value || e ? D(r.value).parser(r) : F;
    };
    return new N(n, _("chain", this, D));
  }
  map(D, e = !1) {
    const n = (F) => {
      const r = this.parser(F);
      return !r.isError || e ? r.ok(D(r.value)) : r;
    };
    return new N(n, _("map", this));
  }
  skip(D) {
    const e = (n) => {
      const F = this.parser(n);
      if (!F.isError) {
        const r = D.parser(F);
        if (!r.isError)
          return r.ok(F.value);
      }
      return n.err(void 0);
    };
    return new N(
      e,
      _("skip", this, D)
    );
  }
  next(D) {
    const e = this.then(D).map(([, n]) => n);
    return e.context = _("next", this, D), e;
  }
  opt() {
    const D = (e) => {
      const n = this.parser(e);
      return n.isError ? e.ok(void 0) : n;
    };
    return new N(D, _("opt", this));
  }
  not(D) {
    const e = (F) => this.parser(F).isError ? F.ok(F.value) : F.err(void 0), n = (F) => {
      const r = this.parser(F);
      return r.isError || D.parser(F).isError ? r : F.err(void 0);
    };
    return new N(
      D ? n : e,
      _("not", this, D)
    );
  }
  wrap(D, e) {
    if (fu(D, this, e))
      return tD(D, this, e);
    const n = D.next(this).skip(e);
    return n.context = _("wrap", this, D, e), n;
  }
  trim(D = Nu) {
    var e;
    if (((e = D.context) == null ? void 0 : e.name) === "whitespace") {
      if (fu(this, D))
        return lu(
          [D, this, D],
          "",
          (F) => F == null ? void 0 : F[2]
        );
      const n = (F) => {
        const r = ju(F), c = this.parser(r);
        return c.isError ? F.err(void 0) : ju(c);
      };
      return new N(
        n,
        _("trimWhitespace", this)
      );
    }
    return this.wrap(D, D);
  }
  many(D = 0, e = 1 / 0) {
    const n = (F) => {
      const r = [];
      let c = F;
      for (let v = 0; v < e; v += 1) {
        const q = this.parser(c);
        if (q.isError)
          break;
        r.push(q.value), c = q;
      }
      return r.length >= D ? c.ok(r) : F.err([]);
    };
    return new N(
      n,
      _("many", this, D, e)
    );
  }
  sepBy(D, e = 0, n = 1 / 0) {
    const F = (r) => {
      const c = [];
      let v = r;
      for (let q = 0; q < n; q += 1) {
        const w = this.parser(v);
        if (w.isError)
          break;
        v = w, c.push(v.value);
        const J = D.parser(v);
        if (J.isError)
          break;
        v = J;
      }
      return c.length > e ? v.ok(c) : r.err([]);
    };
    return new N(
      F,
      _("sepBy", this, D)
    );
  }
  debug(D = "", e = !1, n = console.log) {
    return uD(this, D, e, n);
  }
  eof() {
    const D = this.skip(nD());
    return D.context = _("eof", this), D;
  }
  static lazy(D) {
    const e = (n) => bu(D).parser(n);
    return new N(e, _("lazy", void 0, D));
  }
  toString() {
    return Pu(this);
  }
}
function fu(...i) {
  return i.every(
    (D) => {
      var e, n, F, r;
      return (((e = D.context) == null ? void 0 : e.name) === "string" || ((n = D.context) == null ? void 0 : n.name) === "regex" || ((F = D.context) == null ? void 0 : F.name) === "whitespace") && ((r = D.context) == null ? void 0 : r.args);
    }
  );
}
function eD(i) {
  var D, e, n, F, r;
  if (((D = i.context) == null ? void 0 : D.name) === "string")
    return (e = i.context) == null ? void 0 : e.args[0].replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  if (((n = i.context) == null ? void 0 : n.name) === "regex" || ((F = i.context) == null ? void 0 : F.name) === "whitespace")
    return (r = i.context) == null ? void 0 : r.args[0].source;
}
function lu(i, D = "", e) {
  const n = i.map((c) => `(${eD(c)})`).join(D), F = new RegExp(n), r = Iu(F, e);
  return D !== "|" && (r.context = _("regexConcat", this, F)), r;
}
function tD(i, D, e) {
  const n = lu([i, D, e], "", (F) => F == null ? void 0 : F[2]);
  return n.context.name = "regexWrap", n;
}
function nD() {
  const i = (D) => D.offset >= D.src.length ? D.ok(void 0) : D.err();
  return new N(i, _("eof"));
}
function aD(i, D, e) {
  const n = e.value.bind(i);
  e.value = function() {
    const F = (r) => bu(n).parser(r);
    return new N(F, _("lazy", void 0, n));
  };
}
function CD(...i) {
  if (fu(...i))
    return lu(i, "|");
  const D = (e) => {
    for (const n of i) {
      const F = n.parser(e);
      if (!F.isError)
        return F;
    }
    return e.err(void 0);
  };
  return new N(
    i.length === 1 ? i[0].parser : D,
    _("any", void 0, ...i)
  );
}
function oD(...i) {
  const D = (e) => {
    const n = [];
    for (const F of i) {
      const r = F.parser(e);
      if (r.isError)
        return r;
      r.value !== void 0 && n.push(r.value), e = r;
    }
    return e.ok(n);
  };
  return new N(
    i.length === 1 ? i[0].parser : D,
    _("all", void 0, ...i)
  );
}
function ED(i) {
  const D = (e) => {
    if (e.offset >= e.src.length)
      return e.err(void 0);
    const n = e.src.slice(e.offset, e.offset + i.length);
    return n === i ? e.ok(n, n.length) : e.err(void 0);
  };
  return new N(
    D,
    _("string", void 0, i)
  );
}
function Iu(i, D = (e) => e == null ? void 0 : e[0]) {
  const e = i.flags.replace(/y/g, ""), n = new RegExp(i, e + "y"), F = (r) => {
    if (r.offset >= r.src.length)
      return r.err(void 0);
    n.lastIndex = r.offset;
    const c = D(r.src.match(n));
    return c ? r.ok(c, n.lastIndex - r.offset) : c === "" ? r.ok(void 0) : r.err(void 0);
  };
  return new N(
    F,
    _("regex", void 0, i)
  );
}
const wu = /\s*/y, ju = (i) => {
  var e;
  if (i.offset >= i.src.length)
    return i;
  wu.lastIndex = i.offset;
  const D = ((e = i.src.match(wu)) == null ? void 0 : e[0]) ?? "";
  return i.ok(i.value, D.length);
}, Nu = Iu(/\s*/);
Nu.context.name = "whitespace";
export {
  N as Parser,
  oD as all,
  CD as any,
  nD as eof,
  bu as getLazyParser,
  aD as lazy,
  Iu as regex,
  ED as string,
  Nu as whitespace
};
