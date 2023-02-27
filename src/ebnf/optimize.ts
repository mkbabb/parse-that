import {
    EBNFAlternation,
    EBNFAST,
    EBNFConcatenation,
    EBNFEpsilon,
    EBNFExpression,
    EBNFNonterminal,
    EBNFProductionRule,
} from "./grammar";

export function topologicalSort(ast: EBNFAST) {
    const visited = new Set<string>();
    const order: EBNFProductionRule[] = [];

    function visit(node: string, stack: Set<string>) {
        if (stack.has(node) || visited.has(node)) {
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

export const findCommonPrefix = (
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
            // TODO! This is not correct
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

export const comparePrefix = (
    prefix: EBNFExpression,
    expr: EBNFExpression
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
            return comparePrefix(prefix.value, expr.value as EBNFExpression);
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
            return prefix.value.some((e, i) => comparePrefix(e, expr.value[i]));
        case "epsilon":
            return true;
    }
};

export function removeDirectLeftRecursion(
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

export function rewriteTreeLeftRecursion(name: string, expr: EBNFAlternation) {
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

export function removeLeftRecursion(ast: EBNFAST) {
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
