import type {
    Alteration,
    AST,
    Concatenation,
    Epsilon,
    Expression,
    Nonterminal,
    ProductionRule,
} from "./types.js";

export function topologicalSort(ast: AST) {
    const visited = new Set<string>();
    const order: ProductionRule[] = [];

    function visit(node: string, stack: Set<string>) {
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
            visit(expr.value as string, stack);
        } else if (expr.value instanceof Array) {
            for (const child of expr.value) {
                if ((child as Expression).type === "nonterminal") {
                    visit((child as Nonterminal).value, stack);
                }
            }
        }

        visited.add(node);
        stack.delete(node);

        order.unshift(ast.get(node)!);
    }

    for (const [name] of ast) {
        visit(name, new Set<string>());
    }

    const newAST: AST = new Map();
    for (const rule of order) {
        newAST.set(rule.name.value, rule);
    }

    return newAST;
}

export const findCommonPrefix = (
    e1: Expression,
    e2: Expression,
): [Expression | null, Expression, Expression] | undefined => {
    if (!e1?.type || !e2?.type || e1.type !== e2.type) {
        return undefined;
    }

    switch (e1.type) {
        case "literal":
        case "nonterminal": {
            if (e1.value !== e2.value) {
                return undefined;
            } else {
                return [
                    e1,
                    { type: "epsilon" } as Epsilon,
                    { type: "epsilon" } as Epsilon,
                ];
            }
        }
        case "group":
        case "optional":
        case "optionalWhitespace":
        case "many":
        case "many1": {
            const common = findCommonPrefix(
                e1.value as Expression,
                e2.value as Expression,
            );
            if (!common) {
                return undefined;
            } else {
                return [
                    { type: e1.type, value: common[0] } as Expression,
                    { type: e1.type, value: common[1] } as Expression,
                    { type: e1.type, value: common[2] } as Expression,
                ];
            }
        }

        case "concatenation": {
            const e1Vals = e1.value as Expression[];
            const e2Vals = e2.value as Expression[];
            const commons = e1Vals.map((_, i) =>
                findCommonPrefix(e1Vals[i], e2Vals[i]),
            );
            if (commons.some((x) => x === undefined)) {
                return undefined;
            }

            const prefixes = commons.map((x) => x![0]);
            const e1s = commons.map((x) => x![1]);
            const e2s = commons.map((x) => x![2]);

            const startIx = prefixes.lastIndexOf(null);
            if (startIx === prefixes.length - 1) {
                return undefined;
            }
            const prefix = prefixes.slice(startIx + 1) as Expression[];
            return [
                {
                    type: "concatenation",
                    value: prefix,
                } as Concatenation,
                {
                    type: "concatenation",
                    value: e1s,
                } as Concatenation,
                {
                    type: "concatenation",
                    value: e2s,
                } as Concatenation,
            ];
        }

        case "alternation": {
            const e1Alts = e1.value as Expression[];
            const e2Alts = e2.value as Expression[];
            for (const e of e1Alts) {
                const common = findCommonPrefix(e, e2);
                if (common) {
                    return common;
                }
            }
            for (const e of e2Alts) {
                const common = findCommonPrefix(e1, e);
                if (common) {
                    return common;
                }
            }
            return undefined;
        }
    }
    return undefined;
};

export const comparePrefix = (
    prefix: Expression,
    expr: Expression,
): boolean => {
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
            return comparePrefix(
                prefix.value as Expression,
                expr.value as Expression,
            );
        case "minus":
        case "skip":
        case "next":
            return (
                comparePrefix(
                    (prefix.value as [Expression, Expression])[0],
                    (expr.value as [Expression, Expression])[0],
                ) &&
                comparePrefix(
                    (prefix.value as [Expression, Expression])[1],
                    (expr.value as [Expression, Expression])[1],
                )
            );
        case "concatenation":
            return (prefix.value as Expression[]).every((e, i) =>
                comparePrefix(e, (expr.value as Expression[])[i]),
            );
        case "alternation":
            return (prefix.value as Expression[]).some((e, i) =>
                comparePrefix(e, (expr.value as Expression[])[i]),
            );
        case "epsilon":
            return true;
        default:
            return false;
    }
};

export function rewriteTreeLeftRecursion(name: string, expr: Alteration) {
    const prefixMap = new Map<Expression, Expression[]>();
    let commonPrefix: Expression | null = null;
    const exprVals = expr.value as Expression[];

    for (let i = 0; i < exprVals.length - 1; i++) {
        const e1 = exprVals[i];
        const e2 = exprVals[i + 1];

        const common = findCommonPrefix(e1, e2);
        if (common) {
            const [prefix, te1, te2] = common;

            if (
                commonPrefix !== null &&
                prefix !== null &&
                comparePrefix(prefix, commonPrefix)
            ) {
                prefixMap.get(commonPrefix)!.push(te2);
            } else if (prefix !== null) {
                prefixMap.set(prefix, [te1, te2]);
                commonPrefix = prefix;
            }
            if (i === exprVals.length - 2) {
                exprVals.shift();
            }
            exprVals.shift();
            i -= 1;
        }
    }

    for (const [prefix, expressions] of prefixMap) {
        const alternation: Alteration = {
            type: "alternation",
            value: expressions,
        };
        const newExpr: Concatenation = {
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
        };

        exprVals.push(newExpr);
    }
}

const removeDirectLeftRecursionProduction = (
    name: string,
    expr: Alteration,
    tailName: string,
) => {
    const head: Expression[] = [];
    const tail: Expression[] = [];

    const APrime: Nonterminal = {
        type: "nonterminal",
        value: tailName,
    };

    const exprVals = expr.value as Expression[];

    for (let i = 0; i < exprVals.length; i++) {
        const e = exprVals[i];

        if (
            e.type === "concatenation" &&
            (e.value as Expression[])[0].value === name
        ) {
            tail.push({
                type: "concatenation",
                value: [...(e.value as Expression[]).slice(1), APrime],
            } as Concatenation);
        } else {
            head.push({
                type: "concatenation",
                value: [e, APrime],
            } as Concatenation);
        }
    }

    if (tail.length === 0) {
        return [undefined, undefined] as const;
    }

    tail.push({
        type: "epsilon",
    } as Epsilon);

    return [
        {
            type: "alternation",
            value: head,
        } as Alteration,
        {
            type: "alternation",
            value: tail,
        } as Alteration,
    ] as const;
};

export function removeDirectLeftRecursion(ast: AST) {
    const newNodes: AST = new Map();

    let uniqueIndex = 0;
    for (const [name, productionRule] of ast) {
        const { expression } = productionRule;

        if (expression.type === "alternation") {
            const tailName = `${name}_${uniqueIndex++}`;

            const [head, tail] = removeDirectLeftRecursionProduction(
                name,
                expression as Alteration,
                tailName,
            );

            if (head && tail) {
                newNodes.set(tailName, {
                    name: {
                        type: "nonterminal",
                        value: tailName,
                    },
                    expression: tail,
                } as ProductionRule);
                newNodes.set(name, {
                    name: productionRule.name,
                    expression: head,
                    comment: productionRule.comment,
                } as ProductionRule);
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
            rewriteTreeLeftRecursion(name, expression as Alteration);
        }
    }
}

export function removeAllLeftRecursion(ast: AST) {
    const newAST = topologicalSort(ast);
    removeDirectLeftRecursion(newAST);
    return newAST;
}
