import { Parser, string, lazy, all, any, match, ParserState, eof } from "../src/that";

type EBNFProductionRule = {
    name: string;
    expression: EBNFExpression;
};

type EBNFExpression =
    | EBNFLiteral
    | EBNFNonterminal
    | EBNFGroup
    | EBNFOptional
    | EBNFSub
    | EBNFMany
    | EBNFMany1
    | EBNFSkip
    | EBNFNext
    | EBNFConcatenation
    | EBNFAlternation
    | EBNFEpsilon;

interface EBNFLiteral {
    type: "literal";
    value: string;
}

interface EBNFNonterminal {
    type: "nonterminal";
    value: string;
}

interface EBNFEpsilon {
    type: "epsilon";
    value: undefined;
}

interface EBNFGroup {
    type: "group";
    value: EBNFExpression;
}

interface EBNFOptional {
    type: "optional";
    value: EBNFExpression;
}

interface EBNFSub {
    type: "subtraction";
    value: [EBNFExpression, EBNFExpression];
}

interface EBNFMany {
    type: "many";
    value: EBNFExpression;
}

interface EBNFMany1 {
    type: "many1";
    value: EBNFExpression;
}

interface EBNFSkip {
    type: "skip";
    value: [EBNFExpression, EBNFExpression];
}

interface EBNFNext {
    type: "next";
    value: [EBNFExpression, EBNFExpression];
}

interface EBNFConcatenation {
    type: "concatenation";
    value: EBNFExpression[];
}

interface EBNFAlternation {
    type: "alternation";
    value: EBNFExpression[];
}

const comma = string(",").trim();
const equalSign = string("=").trim();

const semicolon = string(";").trim();
const dot = string(".").trim();
const questionMark = string("?").trim();
const pipe = string("|").trim();

const plus = string("+").trim();
const minus = string("-").trim();
const mul = string("*").trim();
const div = string("/").trim();

const leftShift = string(">>").trim();
const rightShift = string("<<").trim();

const integer = match(/\d+/).trim().map(Number);

const terminator = any(semicolon, dot);

class EBNFGrammar {
    identifier() {
        return match(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
    }

    literal() {
        return any(
            match(/[^"\s]+/).wrap(string('"'), string('"')),
            match(/[^'\s]+/).wrap(string("'"), string("'"))
        ).map((value) => {
            return {
                type: "literal",
                value,
            } as EBNFLiteral;
        });
    }

    nonterminal() {
        return this.identifier().map((value) => {
            return {
                type: "nonterminal",
                value,
            } as EBNFNonterminal;
        });
    }

    @lazy
    group() {
        return this.expression()
            .trim()
            .wrap(string("("), string(")"))
            .map((value) => {
                return {
                    type: "group",
                    value,
                } as EBNFGroup;
            });
    }

    optional() {
        return this.term()
            .trim()
            .skip(questionMark)
            .map((value) => {
                return {
                    type: "optional",
                    value,
                } as EBNFOptional;
            });
    }

    @lazy
    optionalGroup() {
        return this.expression()
            .trim()
            .wrap(string("["), string("]"))
            .map((value) => {
                return {
                    type: "optional",
                    value,
                } as EBNFOptional;
            });
    }

    subtraction() {
        return all(this.term().skip(minus), this.term()).map(([left, right]) => {
            return {
                type: "subtraction",
                value: [left, right],
            } as EBNFSub;
        });
    }

    @lazy
    manyGroup() {
        return this.expression()
            .trim()
            .wrap(string("{"), string("}"))
            .map((value) => {
                return {
                    type: "many",
                    value,
                } as EBNFMany;
            });
    }

    many() {
        return this.term()
            .trim()
            .skip(mul)
            .map((value) => {
                return {
                    type: "many",
                    value,
                } as EBNFMany;
            });
    }

    many1() {
        return this.term()
            .trim()
            .skip(plus)
            .map((value) => {
                return {
                    type: "many1",
                    value,
                } as EBNFMany1;
            });
    }

    @lazy
    next() {
        return all(this.factor().skip(leftShift), any(this.skip(), this.factor())).map(
            ([left, right]) => {
                return {
                    type: "next",
                    value: [left, right],
                } as EBNFNext;
            }
        );
    }

    @lazy
    skip() {
        return all(any(this.next(), this.factor()).skip(rightShift), this.factor()).map(
            ([left, right]) => {
                return {
                    type: "skip",
                    value: [left, right],
                } as EBNFSkip;
            }
        );
    }

    concatenation() {
        return any(this.skip(), this.next(), this.factor())
            .sepBy(comma, 1)
            .map((value) => {
                return {
                    type: "concatenation",
                    value,
                } as EBNFConcatenation;
            });
    }

    alternation() {
        return any(this.concatenation(), this.skip(), this.next(), this.factor())
            .sepBy(pipe, 1)
            .map((value) => {
                return {
                    type: "alternation",
                    value,
                } as EBNFAlternation;
            });
    }

    term() {
        return any(
            this.literal(),
            this.nonterminal(),
            this.group(),
            this.optionalGroup(),
            this.manyGroup()
        ) as Parser<EBNFExpression>;
    }

    factor() {
        return any(
            this.optional(),
            this.many(),
            this.many1(),
            this.subtraction(),
            this.term()
        ) as Parser<EBNFExpression>;
    }

    expression() {
        return any(
            this.alternation(),
            this.concatenation(),
            this.skip(),
            this.next(),
            this.factor()
        ) as Parser<EBNFExpression>;
    }

    productionRule() {
        return all(
            this.identifier().skip(equalSign),
            this.expression().skip(terminator)
        ).map(([name, expression]) => {
            return { name, expression } as EBNFProductionRule;
        });
    }

    grammar() {
        return this.productionRule().many();
    }
}

type EBNFAST = Map<string, EBNFExpression>;
type EBNFNonterminals = { [key: string]: Parser<any> };

function generateParserFromAST(ast: EBNFAST) {
    function generateParser(name: string, expr: EBNFExpression): Parser<any> {
        switch (expr.type) {
            case "literal":
                return string(expr.value);
            case "nonterminal":
                return Parser.lazy(() => nonterminals[expr.value]);

            case "epsilon":
                return eof();

            case "group":
                return generateParser(name, expr.value);
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
            case "subtraction":
                return generateParser(name, expr.value[0]).not(
                    generateParser(name, expr.value[1])
                );
            case "concatenation":
                const parsers = expr.value.map((x) => generateParser(name, x));
                if (parsers.at(-1).name === "eof") {
                    parsers.pop();
                }
                return all(...parsers);
            case "alternation":
                return any(...expr.value.map((x) => generateParser(name, x)));
        }
    }

    const nonterminals: EBNFNonterminals = {};

    for (const [name, expression] of ast.entries()) {
        nonterminals[name] = generateParser(name, expression);
    }
    return nonterminals;
}

function topologicalSort(ast: EBNFAST) {
    const visited = new Set<string>();
    const order: EBNFProductionRule[] = [];

    function visit(node: string, stack: Set<string>) {
        if (stack.has(node)) {
            throw new Error("Dependency cycle detected");
        }
        if (visited.has(node)) {
            return;
        }

        stack.add(node);
        const expr = ast.get(node)!;
        if (!expr) {
            return;
        }

        if (expr.type === "nonterminal") {
            visit(expr.value, stack);
        } else if (expr.type === "concatenation" || expr.type === "alternation") {
            for (const child of expr.value) {
                if (child.type === "nonterminal") {
                    visit(child.value, stack);
                }
            }
        }

        visited.add(node);
        stack.delete(node);
        order.unshift({ name: node, expression: expr });
    }

    for (const [name] of ast) {
        visit(name, new Set<string>());
    }

    const newAST = new Map<string, EBNFExpression>();
    for (const rule of order) {
        newAST.set(rule.name, rule.expression);
    }

    return newAST;
}

const findCommonPrefix = (
    e1: EBNFExpression,
    e2: EBNFExpression
): [EBNFExpression | null, EBNFExpression, EBNFExpression] => {
    if (!e1?.type || !e2?.type || e1.type !== e2.type) {
        return undefined;
    }

    switch (e1.type) {
        case "literal":
        case "nonterminal": {
            if (e1.value !== e2.value) {
                return undefined;
            } else {
                return [e1, { type: "epsilon" }, { type: "epsilon" }] as [
                    EBNFExpression,
                    EBNFExpression,
                    EBNFExpression
                ];
            }
        }

        case "group":
        case "optional":
        case "many":
        case "many1": {
            const common = findCommonPrefix(e1.value, e2.value as EBNFExpression);
            if (!common) {
                return undefined;
            } else {
                return [
                    {
                        type: e1.type,
                        value: common[0],
                    },
                    {
                        type: e1.type,
                        value: common[1],
                    },
                    {
                        type: e1.type,
                        value: common[2],
                    },
                ] as [EBNFExpression, EBNFExpression, EBNFExpression];
            }
        }

        case "concatenation": {
            const commons = e1.value.map((_, i) =>
                findCommonPrefix(e1.value[i], e2.value[i])
            );
            if (commons.some((x) => x === undefined)) {
                return undefined;
            }

            const prefixes = commons.map((x) => x[0]);
            const e1s = commons.map((x) => x[1]);
            const e2s = commons.map((x) => x[2]);

            const startIx = prefixes.lastIndexOf(null);
            if (startIx === prefixes.length - 1) {
                return undefined;
            }

            const prefix = prefixes.slice(startIx + 1);
            return [
                {
                    type: "concatenation",
                    value: prefix,
                },
                {
                    type: "concatenation",
                    value: e1s,
                },
                {
                    type: "concatenation",
                    value: e2s,
                },
            ];
        }

        case "alternation":
            for (const e of e1.value) {
                const common = findCommonPrefix(e, e2);
                if (common) {
                    return common;
                }
            }
            for (const e of e2.value as EBNFExpression[]) {
                const common = findCommonPrefix(e1, e);
                if (common) {
                    return common;
                }
            }
            return undefined;
    }
    return undefined;
};

const comparePrefix = (prefix: EBNFExpression, expr: EBNFExpression): boolean => {
    if (prefix.type !== expr.type) {
        return false;
    }
    switch (prefix.type) {
        case "literal":
        case "nonterminal":
            return prefix.value === expr.value.slice(0, prefix.value.length);
        case "group":
        case "optional":
        case "many":
        case "many1":
            return comparePrefix(prefix.value, expr.value);
        case "subtraction":
        case "skip":
        case "next":
            return (
                comparePrefix(prefix.value[0], expr.value[0]) &&
                comparePrefix(prefix.value[1], expr.value[1])
            );
        case "concatenation":
            return prefix.value.every((e, i) => comparePrefix(e, expr.value[i]));
        case "alternation":
            return prefix.value.some((e) => hasCommonPrefix(e, expr));
        case "epsilon":
            return true;
    }
};

function removeDirectLeftRecursion(
    name: string,
    expr: EBNFAlternation,
    tailName: string
) {
    const head = [];
    const tail = [];

    const APrime = {
        type: "nonterminal",
        value: tailName,
    } as EBNFNonterminal;

    for (let i = 0; i < expr.value.length; i++) {
        const e = expr.value[i];

        if (e.type === "concatenation" && e.value[0].value === name) {
            tail.push({
                type: "concatenation",
                value: [...e.value.slice(1), APrime],
            });
        } else {
            head.push({
                type: "concatenation",
                value: [e, APrime],
            });
        }
    }

    // No direct left recursion
    if (tail.length === 0) {
        return [undefined, undefined];
    }

    tail.push({
        type: "epsilon",
    } as EBNFEpsilon);

    return [
        {
            type: "alternation",
            value: head,
        } as EBNFAlternation,
        {
            type: "alternation",
            value: tail,
        } as EBNFAlternation,
    ] as const;
}

function rewriteTreeLeftRecursion(name: string, expr: EBNFAlternation) {
    const prefixMap = new Map<EBNFExpression, EBNFExpression[]>();
    let commonPrefix: EBNFExpression | null = null;

    for (let i = 0; i < expr.value.length - 1; i++) {
        const e1 = expr.value[i];
        const e2 = expr.value[i + 1];

        const common = findCommonPrefix(e1, e2);
        if (common) {
            const [prefix, te1, te2] = common;

            if (commonPrefix !== null && comparePrefix(prefix, commonPrefix)) {
                prefixMap.get(commonPrefix)!.push(te2);
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
            value: expressions,
        } as EBNFAlternation;
        const newExpr = {
            type: "concatenation",
            value: [
                {
                    type: "group",
                    value: alternation,
                },
                {
                    type: "group",
                    value: prefix,
                },
            ],
        } as EBNFConcatenation;

        expr.value.push(newExpr);
    }
}

function removeLeftRecursion(ast: EBNFAST) {
    const newAST = topologicalSort(ast);
    const newNodes = new Map() as EBNFAST;
    let uniqueIndex = 0;

    for (const [name, expression] of newAST) {
        if (expression.type === "alternation") {
            const tailName = `${name}_${uniqueIndex++}`;

            const [head, tail] = removeDirectLeftRecursion(name, expression, tailName);
            if (head) {
                newNodes.set(tailName, tail);
                newNodes.set(name, head);
            }
        }
    }

    if (newNodes.size === 0) {
        return ast;
    }
    for (const [name, expression] of newNodes) {
        newAST.set(name, expression);
    }
    for (const [name, expression] of newAST) {
        if (expression.type === "alternation") {
            rewriteTreeLeftRecursion(name, expression);
        }
    }

    return newAST;
}

export function generateParserFromEBNF(input: string) {
    let ast = new EBNFGrammar()
        .grammar()
        .parse(input)
        .reduce((acc, { name, expression }) => {
            acc.set(name, expression);
            return acc;
        }, new Map<string, EBNFExpression>()) as EBNFAST;

    ast = removeLeftRecursion(ast);

    const nonterminals = generateParserFromAST(ast);
    return [nonterminals, ast] as const;
}
