/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Parser,
    all,
    any,
    eof,
    regex,
    regexSpan,
    string,
    dispatch,
    mergeErrorState,
    createParserContext,
} from "../parse/index.js";
import type { ParserState } from "../parse/index.js";
import type { Expression, Nonterminals, AST, ProductionRule } from "./types.js";
import { BBNFGrammar } from "./grammar.js";
import { removeAllLeftRecursion } from "./optimize.js";
import { analyzeGrammar } from "./analysis.js";
import type { AnalysisCache } from "./analysis.js";
import { computeFirstSets, buildDispatchTable } from "./first-sets.js";
import type { FirstNullable } from "./first-sets.js";

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function BBNFToAST(input: string) {
    const parser = new BBNFGrammar().grammar().eof();
    const parsed = parser.parse(input);

    if (!parsed) {
        return [parser] as const;
    }

    const ast = (parsed as ProductionRule[]).reduce(
        (acc, productionRule) => {
            return acc.set(productionRule.name.value, productionRule);
        },
        new Map<string, ProductionRule>(),
    ) as AST;

    return [parser, ast] as const;
}

export function ASTToParser(
    ast: AST,
    analysis?: AnalysisCache,
    firstNullable?: FirstNullable,
) {
    // Compute analysis if not provided
    const cache = analysis ?? analyzeGrammar(ast);
    const { cyclicRules, topoOrder } = cache;
    const fnData = firstNullable ?? computeFirstSets(ast, cache);

    const nonterminals: Nonterminals = {};

    /**
     * Resolve a nonterminal to its terminal expression, following alias chains.
     * Returns the resolved expression, or null if it references a cyclic or
     * externally-overridden rule.
     */
    function resolveToTerminal(expr: Expression): Expression | null {
        if (!expr?.type) return null;
        if (expr.type === "literal" || expr.type === "regex") return expr;
        if (expr.type === "group") return resolveToTerminal(expr.value as Expression);
        if (expr.type === "nonterminal") {
            const rule = ast.get(expr.value as string);
            if (rule && !cyclicRules.has(expr.value as string)) {
                return resolveToTerminal(rule.expression);
            }
        }
        return null;
    }

    /**
     * Detect `literal >> regex/char* << literal` and compile to a single regex.
     * Handles both AST shapes:
     *   Shape A: next(literal_L, skip(many(charPattern), literal_R))
     *   Shape B: skip(next(literal_L, many(charPattern)), literal_R)
     */
    function tryWrapRegexCoalesce(expr: Expression): Parser<any> | null {
        let leftStr: string | null = null;
        let rightStr: string | null = null;
        let innerExpr: Expression | null = null;
        let quantifier: string | null = null;

        // Shape A: next(literal_L, skip(many(charPattern), literal_R))
        if (expr.type === "next") {
            const [left, right] = expr.value as [Expression, Expression];
            const resolvedLeft = resolveToTerminal(left);
            if (resolvedLeft?.type === "literal" && right.type === "skip") {
                const [middle, end] = right.value as [Expression, Expression];
                const resolvedEnd = resolveToTerminal(end);
                if (resolvedEnd?.type === "literal") {
                    leftStr = resolvedLeft.value as string;
                    rightStr = resolvedEnd.value as string;
                    if (middle.type === "many") {
                        innerExpr = middle.value as Expression;
                        quantifier = "*";
                    } else if (middle.type === "many1") {
                        innerExpr = middle.value as Expression;
                        quantifier = "+";
                    }
                }
            }
        }

        // Shape B: skip(next(literal_L, many(charPattern)), literal_R)
        if (expr.type === "skip" && !leftStr) {
            const [left, right] = expr.value as [Expression, Expression];
            const resolvedRight = resolveToTerminal(right);
            if (resolvedRight?.type === "literal" && left.type === "next") {
                const [start, middle] = left.value as [Expression, Expression];
                const resolvedStart = resolveToTerminal(start);
                if (resolvedStart?.type === "literal") {
                    leftStr = resolvedStart.value as string;
                    rightStr = resolvedRight.value as string;
                    if (middle.type === "many") {
                        innerExpr = middle.value as Expression;
                        quantifier = "*";
                    } else if (middle.type === "many1") {
                        innerExpr = middle.value as Expression;
                        quantifier = "+";
                    }
                }
            }
        }

        if (!leftStr || !rightStr || !innerExpr || !quantifier) return null;

        // Inner must resolve to a regex
        const resolved = resolveToTerminal(innerExpr);
        if (!resolved || resolved.type !== "regex") return null;

        const re = resolved.value as RegExp;
        const escapedLeft = escapeRegex(leftStr);
        const escapedRight = escapeRegex(rightStr);
        const combinedSource = `${escapedLeft}(${re.source})${quantifier}${escapedRight}`;
        try {
            return regex(new RegExp(combinedSource));
        } catch {
            return null;
        }
    }

    /**
     * Detect `(item << sep?)* ` and compile to `item.sepBy(sep)`.
     */
    function trySepByDetect(name: string, expr: Expression): Parser<any> | null {
        if (expr.type !== "many" && expr.type !== "many1") return null;

        const inner = expr.value as Expression;
        let unwrapped = inner;
        if (unwrapped.type === "group") unwrapped = unwrapped.value as Expression;

        if (unwrapped.type !== "skip") return null;
        const [item, sepOpt] = unwrapped.value as [Expression, Expression];

        if (sepOpt.type !== "optional") return null;
        const sep = sepOpt.value as Expression;

        const itemParser = generateParser(name, item);
        const sepParser = generateParser(name, sep);

        if (expr.type === "many") {
            return itemParser.sepBy(sepParser);
        } else {
            return itemParser.sepBy(sepParser, 1);
        }
    }

    /**
     * Phase 3.1: Detect `left >> middle << right` and compile to middle.wrap(left, right).
     * wrap() already inlines 2 function frames (index.ts), so this saves overhead.
     */
    function tryWrapDetect(name: string, expr: Expression): Parser<any> | null {
        // Shape: skip(next(L, M), R) → M.wrap(L, R)
        if (expr.type === "skip") {
            const [left, right] = expr.value as [Expression, Expression];
            if (left.type === "next") {
                const [l, m] = left.value as [Expression, Expression];
                return generateParser(name, m).wrap(
                    generateParser(name, l),
                    generateParser(name, right),
                );
            }
        }
        return null;
    }

    /**
     * Phase 3.2: When all alternatives are string literals, compile to
     * dispatch() with char-based routing for O(1) lookup.
     */
    function tryAllLiteralsAlternation(name: string, alts: Expression[]): Parser<any> | null {
        if (alts.length < 2) return null;
        if (!alts.every((a) => {
            const resolved = resolveToTerminal(a);
            return resolved?.type === "literal";
        })) return null;

        const table: Record<string, Parser<any>> = {};
        const fallbackAlts: Parser<any>[] = [];

        for (const alt of alts) {
            const resolved = resolveToTerminal(alt)!;
            const lit = resolved.value as string;
            if (lit.length === 0) {
                // Empty literal can't be dispatched
                return null;
            }
            const firstChar = lit[0];
            if (table[firstChar]) {
                // Collision on first character — fall back to any()
                // Could group them, but for now just bail
                return null;
            }
            table[firstChar] = string(lit);
        }

        return dispatch(table);
    }

    function generateParser(name: string, expr: Expression, discarded: boolean = false): Parser<any> {
        // Try pattern recognition first
        const wrapResult = tryWrapRegexCoalesce(expr);
        if (wrapResult) return wrapResult;

        const wrapDetectResult = tryWrapDetect(name, expr);
        if (wrapDetectResult) return wrapDetectResult;

        const sepByResult = trySepByDetect(name, expr);
        if (sepByResult) return sepByResult;

        switch (expr.type) {
            case "literal":
                return string(expr.value as string);
            case "nonterminal": {
                const refName = expr.value as string;
                // Always use lazy — users may override nonterminals after
                // generation (e.g. nonterminals.S = regex(/\s*/)).
                const l = Parser.lazy(() => nonterminals[refName]);
                l.context.name = refName as any;
                return l;
            }

            case "epsilon":
                return eof().opt();

            case "group":
                return generateParser(name, expr.value as Expression, discarded);

            case "regex":
                // Phase 3.2: Use regexSpan when the result is discarded (right side
                // of skip, left side of next) to avoid substring allocation.
                return discarded
                    ? regexSpan(expr.value as RegExp)
                    : regex(expr.value as RegExp);

            case "optionalWhitespace":
                return generateParser(name, expr.value as any, discarded).trim();

            case "optional":
                return generateParser(name, expr.value as Expression).opt();
            case "many":
                return generateParser(name, expr.value as Expression).many();
            case "many1":
                return generateParser(name, expr.value as Expression).many(1);
            case "skip":
                return generateParser(
                    name,
                    (expr.value as [Expression, Expression])[0],
                ).skip(
                    generateParser(
                        name,
                        (expr.value as [Expression, Expression])[1],
                        true, // right side of skip is discarded
                    ),
                );
            case "next":
                return generateParser(
                    name,
                    (expr.value as [Expression, Expression])[0],
                    true, // left side of next is discarded
                ).next(
                    generateParser(
                        name,
                        (expr.value as [Expression, Expression])[1],
                    ),
                );
            case "minus":
                return generateParser(
                    name,
                    (expr.value as [Expression, Expression])[0],
                ).not(
                    generateParser(
                        name,
                        (expr.value as [Expression, Expression])[1],
                    ),
                );
            case "concatenation": {
                const parsers = (expr.value as Expression[]).map((x) =>
                    generateParser(name, x),
                );
                if (parsers.at(-1)?.context?.name === "eof") {
                    parsers.pop();
                }
                // Specialize: 2-element concatenation avoids the loop in all()
                // Must preserve all()'s undefined-skipping semantics.
                if (parsers.length === 2) {
                    const [p1, p2] = parsers;
                    const all2 = (state: ParserState<any>) => {
                        const savedOffset = state.offset;
                        p1.parser(state);
                        if (state.isError) {
                            state.offset = savedOffset;
                            return state;
                        }
                        const v1 = state.value;
                        p2.parser(state);
                        if (state.isError) {
                            state.offset = savedOffset;
                            state.isError = true;
                            return state;
                        }
                        const v2 = state.value;
                        if (v1 !== undefined) {
                            return v2 !== undefined
                                ? state.ok([v1, v2])
                                : state.ok([v1]);
                        }
                        return v2 !== undefined
                            ? state.ok([v2])
                            : state.ok([]);
                    };
                    return new Parser(
                        all2,
                        createParserContext("all", undefined, p1, p2),
                    );
                }
                return all(...parsers);
            }
            case "alternation": {
                const alts = expr.value as Expression[];

                // Phase 3.2: all-literals → dispatch table
                const litDispatch = tryAllLiteralsAlternation(name, alts);
                if (litDispatch) return litDispatch;

                const parsers = alts.map((x) => generateParser(name, x));

                // Try to build a dispatch table for O(1) alternation.
                // Only use dispatch when all alternatives are non-nullable
                // (epsilon/optional alternatives can't be dispatched on first char).
                if (parsers.length >= 2) {
                    const dispatch = buildDispatchTable(
                        alts,
                        fnData.firstSets,
                        fnData.nullable,
                    );

                    if (dispatch?.isPerfect) {
                        const tbl = dispatch.table;
                        const dispatchParser = (state: ParserState<any>) => {
                            const ch = state.src.charCodeAt(state.offset);
                            const idx = ch < 128 ? tbl[ch] : -1;
                            if (idx >= 0) {
                                return parsers[idx].parser(state);
                            }
                            mergeErrorState(state as ParserState<unknown>);
                            return state.err(undefined);
                        };
                        return new Parser(
                            dispatchParser,
                            createParserContext("dispatch", undefined, ...parsers),
                        );
                    }
                }

                return any(...parsers);
            }
        }
    }

    // Build rules in topological order (leaves first, from Tarjan's SCC).
    for (const name of topoOrder) {
        const rule = ast.get(name);
        if (!rule) continue;
        nonterminals[name] = generateParser(name, rule.expression);
    }

    // Build any rules not in topoOrder
    for (const [name, rule] of ast) {
        if (!nonterminals[name]) {
            nonterminals[name] = generateParser(name, rule.expression);
        }
    }

    // Collapse alias chains: if a rule is just a nonterminal reference
    // (e.g. charger = chargerge; charge = charger; char = charge),
    // replace with the resolved parser to eliminate indirection.
    for (const [name, rule] of ast) {
        if (cyclicRules.has(name)) continue;
        let expr = rule.expression;
        // Unwrap groups
        while (expr.type === "group") expr = expr.value as Expression;
        if (expr.type === "nonterminal") {
            const target = expr.value as string;
            if (nonterminals[target]) {
                nonterminals[name] = nonterminals[target];
            }
        }
    }

    return nonterminals;
}

export function traverseAST(
    ast: AST,
    callback: (
        node: Expression,
        parentNode?: Expression,
    ) => Expression | undefined,
) {
    const recurse = (node: Expression, parentNode?: Expression) => {
        if (!node?.type) return;

        node = callback(node, parentNode) ?? node;
        parentNode = node;

        if (node?.value instanceof Array) {
            for (let i = node.value.length - 1; i >= 0; i--) {
                recurse(node.value[i] as Expression, parentNode);
            }
        } else if (node?.value && typeof node.value === "object") {
            recurse(node.value as Expression, parentNode);
        }
    };

    for (const [, productionRule] of ast.entries()) {
        recurse(productionRule.expression);
    }
}

export function dedupGroups(ast: AST) {
    traverseAST(ast, (node, parentNode) => {
        const parentType = parentNode?.type;

        if (
            parentType === "group" &&
            parentNode &&
            (node.type === "group" || node.type === "nonterminal")
        ) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (parentNode as any).value = node.value;
            parentNode.range = node.range;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (parentNode as any).type = node.type;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (parentNode as any).comment = {
                left: [
                    ...((parentNode as any).comment?.left ?? []),
                    ...((node as any).comment?.left ?? []),
                ],
                right: [
                    ...((parentNode as any).comment?.right ?? []),
                    ...((node as any).comment?.right ?? []),
                ],
            };
            return node.value as Expression;
        }
        return undefined;
    });
}

export function BBNFToParser(
    input: string,
    optimizeGraph: boolean = false,
) {
    const [, ast] = BBNFToAST(input);

    if (!ast) {
        throw new Error("Failed to parse BBNF grammar");
    }

    dedupGroups(ast);

    const finalAst = optimizeGraph ? removeAllLeftRecursion(ast) : ast;

    // Analyze the grammar for optimal generation order + FIRST sets
    const analysis = analyzeGrammar(finalAst);
    const firstNullable = computeFirstSets(finalAst, analysis);
    const nonterminals = ASTToParser(finalAst, analysis, firstNullable);
    return [nonterminals, finalAst] as const;
}
