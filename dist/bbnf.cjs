"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const parse = require("./parse.cjs");
require("chalk");
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp2(target, key, result);
  return result;
};
const operatorToType = {
  "|": "alternation",
  ",": "concatenation",
  "-": "minus",
  "<<": "skip",
  ">>": "next",
  "*": "many",
  "+": "many1",
  "?": "optional",
  "?w": "optionalWhitespace"
};
const reduceBinaryExpression = ([left, rightExpression]) => {
  if (rightExpression.length === 0) {
    return left;
  }
  return rightExpression.reduce((acc, [op, right]) => {
    return {
      type: operatorToType[op],
      value: [acc, right]
    };
  }, left);
};
const mapFactor = ([term, op]) => {
  if (op === void 0) {
    return term;
  }
  const type = operatorToType[op];
  return {
    type,
    value: term
  };
};
function mapStatePosition(parser) {
  return parser.mapState((newState, oldState) => {
    if (newState.value && newState.value.range === void 0) {
      newState.value.range = {
        start: oldState.offset,
        end: newState.offset
      };
    }
    return newState;
  });
}
const defaultOptions = {
  debug: false,
  comments: true
};
class BBNFGrammar {
  constructor(options) {
    __publicField(this, "options");
    this.options = {
      ...defaultOptions,
      ...options ?? {}
    };
  }
  identifier() {
    return parse.regex(/[_a-zA-Z][_a-zA-Z0-9-]*/);
  }
  literal() {
    return this.trimBigComment(
      mapStatePosition(
        parse.any(
          parse.regex(/(\\.|[^"\\])*/).wrap(parse.string('"'), parse.string('"')),
          parse.regex(/(\\.|[^'\\])*/).wrap(parse.string("'"), parse.string("'")),
          parse.regex(/(\\.|[^`\\])*/).wrap(parse.string("`"), parse.string("`"))
        ).map((value) => {
          value = value.replace(/\\(.)/g, "$1");
          return {
            type: "literal",
            value
          };
        })
      )
    );
  }
  epsilon() {
    return parse.any(parse.string("epsilon"), parse.string("ε")).map(() => {
      return {
        type: "epsilon",
        value: void 0
      };
    });
  }
  nonterminal() {
    return this.identifier().map((value) => {
      return {
        type: "nonterminal",
        value
      };
    });
  }
  bigComment() {
    return parse.regex(/\/\*[^\*]*\*\//).trim();
  }
  comment() {
    return parse.regex(/\/\/.*/).or(this.bigComment()).trim();
  }
  trimBigComment(e) {
    return e.trim(this.bigComment().many(), false).map(([left, expression, right]) => {
      expression.comment = {
        left,
        right
      };
      return expression;
    });
  }
  group() {
    return this.rhs().trim().wrap(parse.string("("), parse.string(")")).map((value) => {
      return {
        type: "group",
        value
      };
    });
  }
  regex() {
    return parse.regex(/(\\.|[^\/])+/).wrap(parse.string("/"), parse.string("/")).then(parse.regex(/[gimuy]*/).opt()).map(([r, flags]) => {
      return {
        type: "regex",
        value: new RegExp(r, flags)
      };
    });
  }
  optionalGroup() {
    return this.rhs().trim().wrap(parse.string("["), parse.string("]")).map((value) => {
      return {
        type: "optional",
        value: {
          type: "group",
          value
        }
      };
    });
  }
  manyGroup() {
    return this.rhs().trim().wrap(parse.string("{"), parse.string("}")).map((value) => {
      return {
        type: "many",
        value: {
          type: "group",
          value
        }
      };
    });
  }
  lhs() {
    return this.identifier();
  }
  term() {
    return mapStatePosition(
      parse.any(
        this.epsilon(),
        this.group(),
        this.optionalGroup(),
        this.manyGroup(),
        this.nonterminal(),
        this.literal(),
        this.regex()
      )
    );
  }
  factor() {
    return this.trimBigComment(
      parse.all(
        this.term(),
        parse.any(
          parse.string("?w").trim(),
          parse.string("?").trim(),
          parse.string("*").trim(),
          parse.string("+").trim()
        ).opt()
      ).map(mapFactor)
    );
  }
  binaryFactor() {
    return parse.all(
      this.factor(),
      parse.all(
        parse.any(parse.string("<<").trim(), parse.string(">>").trim(), parse.string("-").trim()),
        this.factor()
      ).many()
    ).map(reduceBinaryExpression);
  }
  concatenation() {
    return mapStatePosition(this.binaryFactor().sepBy(parse.string(",").trim())).map(
      (value) => {
        if (value.length === 1) {
          return value[0];
        }
        return {
          type: "concatenation",
          value
        };
      }
    );
  }
  alternation() {
    return mapStatePosition(this.concatenation().sepBy(parse.string("|").trim())).map(
      (value) => {
        if (value.length === 1) {
          return value[0];
        }
        return {
          type: "alternation",
          value
        };
      }
    );
  }
  rhs() {
    return this.alternation();
  }
  productionRule() {
    return parse.all(
      this.lhs(),
      parse.string("=").trim(),
      this.rhs(),
      parse.any(parse.string(";"), parse.string(".")).trim()
    ).map(([name, , expression]) => {
      return { name, expression };
    });
  }
  grammar() {
    return mapStatePosition(this.productionRule()).trim(this.comment().many(), false).map(([above, rule, below]) => {
      rule.comment = {
        above,
        below
      };
      return rule;
    }).many(1).trim();
  }
}
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "bigComment", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "comment", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "group", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "regex", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "optionalGroup", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "manyGroup", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "lhs", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "term", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "factor", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "binaryFactor", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "concatenation", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "alternation", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "rhs", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "productionRule", 1);
__decorateClass([
  parse.lazy
], BBNFGrammar.prototype, "grammar", 1);
function topologicalSort(ast) {
  const visited = /* @__PURE__ */ new Set();
  const order = [];
  function visit(node, stack) {
    if (stack.has(node) || visited.has(node)) {
      return;
    }
    stack.add(node);
    const productionRule = ast.get(node);
    if (!productionRule) {
      return;
    }
    const expr = productionRule.expression;
    if (expr.type === "nonterminal") {
      visit(expr.value, stack);
    } else if (expr.value instanceof Array) {
      for (const child of expr.value) {
        if (child.type === "nonterminal") {
          visit(child.value, stack);
        }
      }
    }
    visited.add(node);
    stack.delete(node);
    order.unshift(ast.get(node));
  }
  for (const [name] of ast) {
    visit(name, /* @__PURE__ */ new Set());
  }
  const newAST = /* @__PURE__ */ new Map();
  for (const rule of order) {
    newAST.set(rule.name, rule);
  }
  return newAST;
}
const findCommonPrefix = (e1, e2) => {
  if (!(e1 == null ? void 0 : e1.type) || !(e2 == null ? void 0 : e2.type) || e1.type !== e2.type) {
    return void 0;
  }
  switch (e1.type) {
    case "literal":
    case "nonterminal": {
      if (e1.value !== e2.value) {
        return void 0;
      } else {
        return [e1, { type: "epsilon" }, { type: "epsilon" }];
      }
    }
    case "group":
    case "optional":
    case "optionalWhitespace":
    case "many":
    case "many1": {
      const common = findCommonPrefix(e1.value, e2.value);
      if (!common) {
        return void 0;
      } else {
        return [
          {
            type: e1.type,
            value: common[0]
          },
          {
            type: e1.type,
            value: common[1]
          },
          {
            type: e1.type,
            value: common[2]
          }
        ];
      }
    }
    case "concatenation": {
      const commons = e1.value.map(
        (_, i) => findCommonPrefix(e1.value[i], e2.value[i])
      );
      if (commons.some((x) => x === void 0)) {
        return void 0;
      }
      const prefixes = commons.map((x) => x[0]);
      const e1s = commons.map((x) => x[1]);
      const e2s = commons.map((x) => x[2]);
      const startIx = prefixes.lastIndexOf(null);
      if (startIx === prefixes.length - 1) {
        return void 0;
      }
      const prefix = prefixes.slice(startIx + 1);
      return [
        {
          type: "concatenation",
          value: prefix
        },
        {
          type: "concatenation",
          value: e1s
        },
        {
          type: "concatenation",
          value: e2s
        }
      ];
    }
    case "alternation":
      for (const e of e1.value) {
        const common = findCommonPrefix(e, e2);
        if (common) {
          return common;
        }
      }
      for (const e of e2.value) {
        const common = findCommonPrefix(e1, e);
        if (common) {
          return common;
        }
      }
      return void 0;
  }
  return void 0;
};
const comparePrefix = (prefix, expr) => {
  if (prefix.type !== expr.type) {
    return false;
  }
  switch (prefix.type) {
    case "literal":
    case "nonterminal":
      return prefix.value === expr.value;
    case "group":
    case "optional":
    case "many":
    case "many1":
      return comparePrefix(prefix.value, expr.value);
    case "minus":
    case "skip":
    case "next":
      return comparePrefix(prefix.value[0], expr.value[0]) && comparePrefix(prefix.value[1], expr.value[1]);
    case "concatenation":
      return prefix.value.every((e, i) => comparePrefix(e, expr.value[i]));
    case "alternation":
      return prefix.value.some((e, i) => comparePrefix(e, expr.value[i]));
    case "epsilon":
      return true;
  }
};
function rewriteTreeLeftRecursion(name, expr) {
  const prefixMap = /* @__PURE__ */ new Map();
  let commonPrefix = null;
  for (let i = 0; i < expr.value.length - 1; i++) {
    const e1 = expr.value[i];
    const e2 = expr.value[i + 1];
    const common = findCommonPrefix(e1, e2);
    if (common) {
      const [prefix, te1, te2] = common;
      if (commonPrefix !== null && comparePrefix(prefix, commonPrefix)) {
        prefixMap.get(commonPrefix).push(te2);
      } else {
        prefixMap.set(prefix, [te1, te2]);
        commonPrefix = prefix;
      }
      if (i === expr.value.length - 2) {
        expr.value.shift();
      }
      expr.value.shift();
      i -= 1;
    }
  }
  for (const [prefix, expressions] of prefixMap) {
    const alternation = {
      type: "alternation",
      value: expressions
    };
    const newExpr = {
      type: "concatenation",
      value: [
        {
          type: "group",
          value: alternation
        },
        {
          type: "group",
          value: prefix
        }
      ]
    };
    expr.value.push(newExpr);
  }
}
const removeDirectLeftRecursionProduction = (name, expr, tailName) => {
  const head = [];
  const tail = [];
  const APrime = {
    type: "nonterminal",
    value: tailName
  };
  for (let i = 0; i < expr.value.length; i++) {
    const e = expr.value[i];
    if (e.type === "concatenation" && e.value[0].value === name) {
      tail.push({
        type: "concatenation",
        value: [...e.value.slice(1), APrime]
      });
    } else {
      head.push({
        type: "concatenation",
        value: [e, APrime]
      });
    }
  }
  if (tail.length === 0) {
    return [void 0, void 0];
  }
  tail.push({
    type: "epsilon"
  });
  return [
    {
      type: "alternation",
      value: head
    },
    {
      type: "alternation",
      value: tail
    }
  ];
};
function removeDirectLeftRecursion(ast) {
  const newNodes = /* @__PURE__ */ new Map();
  let uniqueIndex = 0;
  for (const [name, productionRule] of ast) {
    const { expression } = productionRule;
    if (expression.type === "alternation") {
      const tailName = `${name}_${uniqueIndex++}`;
      const [head, tail] = removeDirectLeftRecursionProduction(
        name,
        expression,
        tailName
      );
      if (head) {
        newNodes.set(tailName, {
          name: tailName,
          expression: tail
        });
        newNodes.set(name, {
          name,
          expression: head,
          comment: productionRule.comment
        });
      }
    }
  }
  if (newNodes.size === 0) {
    return ast;
  }
  for (const [name, productionRule] of newNodes) {
    ast.set(name, productionRule);
  }
  for (const [name, productionRule] of ast) {
    const { expression } = productionRule;
    if (expression.type === "alternation") {
      rewriteTreeLeftRecursion(name, expression);
    }
  }
}
function removeIndirectLeftRecursion(ast) {
  for (const [name, expression] of ast) {
  }
}
function removeAllLeftRecursion(ast) {
  const newAST = topologicalSort(ast);
  removeDirectLeftRecursion(newAST);
  return newAST;
}
function BBNFToAST(input) {
  const parser = new BBNFGrammar().grammar().eof();
  const parsed = parser.parse(input);
  if (!parsed) {
    return [parser];
  }
  const ast = parsed.reduce((acc, productionRule, ix) => {
    return acc.set(productionRule.name, productionRule);
  }, /* @__PURE__ */ new Map());
  return [parser, ast];
}
function ASTToParser(ast) {
  function generateParser(name, expr) {
    var _a, _b;
    switch (expr.type) {
      case "literal":
        return parse.string(expr.value);
      case "nonterminal":
        const l = parse.Parser.lazy(() => {
          return nonterminals[expr.value];
        });
        l.context.name = expr.value;
        return l;
      case "epsilon":
        return parse.eof().opt();
      case "group":
        return generateParser(name, expr.value);
      case "regex":
        return parse.regex(expr.value);
      case "optionalWhitespace":
        return generateParser(name, expr.value).trim();
      case "optional":
        return generateParser(name, expr.value).opt();
      case "many":
        return generateParser(name, expr.value).many();
      case "many1":
        return generateParser(name, expr.value).many(1);
      case "skip":
        return generateParser(name, expr.value[0]).skip(
          generateParser(name, expr.value[1])
        );
      case "next":
        return generateParser(name, expr.value[0]).next(
          generateParser(name, expr.value[1])
        );
      case "minus":
        return generateParser(name, expr.value[0]).not(
          generateParser(name, expr.value[1])
        );
      case "concatenation": {
        const parsers = expr.value.map((x) => generateParser(name, x));
        if (((_b = (_a = parsers.at(-1)) == null ? void 0 : _a.context) == null ? void 0 : _b.name) === "eof") {
          parsers.pop();
        }
        return parse.all(...parsers);
      }
      case "alternation": {
        return parse.any(...expr.value.map((x) => generateParser(name, x)));
      }
    }
  }
  const nonterminals = {};
  for (const [name, productionRule] of ast.entries()) {
    nonterminals[name] = generateParser(name, productionRule.expression);
  }
  return nonterminals;
}
function traverseAST(ast, callback) {
  const stack = [...ast.values()].map((x) => x.expression).reverse();
  let parentNode;
  while (stack.length > 0) {
    const node = stack.pop();
    if (!(node == null ? void 0 : node.type))
      continue;
    callback(node, parentNode);
    parentNode = node;
    if (node.value instanceof Array) {
      for (let i = node.value.length - 1; i >= 0; i--) {
        stack.push(node.value[i]);
      }
    } else {
      stack.push(node.value);
    }
  }
}
function dedupGroups(ast) {
  traverseAST(ast, (node, parentNode) => {
    const parentType = parentNode == null ? void 0 : parentNode.type;
    if (node.type === "group" && (parentType === "group" || parentType === "nonterminal")) {
      const innerValue = node.value;
      node.value = innerValue.value;
      node.type = innerValue.type;
    }
  });
}
function BBNFToParser(input, optimizeGraph = false) {
  let [parser, ast] = BBNFToAST(input);
  dedupGroups(ast);
  if (optimizeGraph) {
    ast = removeAllLeftRecursion(ast);
  }
  const nonterminals = ASTToParser(ast);
  return [nonterminals, ast];
}
exports.ASTToParser = ASTToParser;
exports.BBNFGrammar = BBNFGrammar;
exports.BBNFToAST = BBNFToAST;
exports.BBNFToParser = BBNFToParser;
exports.comparePrefix = comparePrefix;
exports.dedupGroups = dedupGroups;
exports.findCommonPrefix = findCommonPrefix;
exports.removeAllLeftRecursion = removeAllLeftRecursion;
exports.removeDirectLeftRecursion = removeDirectLeftRecursion;
exports.removeIndirectLeftRecursion = removeIndirectLeftRecursion;
exports.rewriteTreeLeftRecursion = rewriteTreeLeftRecursion;
exports.topologicalSort = topologicalSort;
exports.traverseAST = traverseAST;
//# sourceMappingURL=bbnf.cjs.map
