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
                return all(...expr.value.map((x) => generateParser(name, x)));
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
    const sortedNodes = new Map() as EBNFAST;

    function visit(name: string, expr: EBNFExpression) {
        if (sortedNodes.has(name) || !expr) {
            return;
        }

        const { value, type } = expr;

        switch (type) {
            case "alternation":
            case "concatenation":
                value.forEach((childNode) => {
                    if (childNode.type === "nonterminal") {
                        visit(childNode.value, ast.get(childNode.value)!);
                    }
                });
                break;
            case "subtraction":
            case "next":
            case "skip":
                value.forEach((childNode) => {
                    if (childNode.type === "nonterminal") {
                        visit(childNode.value, ast.get(childNode.value)!);
                    }
                });
                break;
            case "group":
            case "optional":
            case "many":
            case "many1":
                if (value.type === "nonterminal") {
                    visit(value.value, ast.get(value.value)!);
                }
                break;
        }
        sortedNodes.set(name, expr);
    }

    for (const [name, expr] of ast) {
        visit(name, expr);
    }
    return sortedNodes;
}

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

    for (const [name, expression] of newNodes) {
        newAST.set(name, expression);
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
