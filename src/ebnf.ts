import { Parser, string, lazy, all, any, match, ParserState } from "../src/that";

type EBNFExpression =
    | EBNFLiteral
    | EBNFNonTerminal
    | EBNFGroup
    | EBNFOptional
    | EBNFSub
    | EBNFMany
    | EBNFMany1
    | EBNFSkip
    | EBNFNext
    | EBNFConcatenation
    | EBNFAlternation;

type EBNFProductionRule = {
    name: string;
    expression: EBNFExpression;
};

interface EBNFLiteral {
    type: "literal";
    value: string;
}

interface EBNFNonTerminal {
    type: "nonterminal";
    value: string;
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
            } as EBNFNonTerminal;
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

export function generateParserFromEBNF(input: string) {
    const ast = new EBNFGrammar()
        .grammar()
        .parse(input)
        .reduce((acc, { name, expression }) => {
            acc[name] = expression;
            return acc;
        }, new Map<string, EBNFProductionRule>());

    const nonterminals: { [key: string]: Parser<any> } = {};
    let uniqueIndex = 0;

    function generateParser(name: string, expr: EBNFExpression): Parser<any> {
        switch (expr.type) {
            case "literal":
                return string(expr.value);
            case "nonterminal":
                return Parser.lazy(() => nonterminals[expr.value]);
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

    function removeLeftRecursion(name: string, expr: EBNFAlternation) {
        const head = [];
        const tail = [];

        const APrime = {
            type: "nonterminal",
            value: name + "_" + ++uniqueIndex,
        } as EBNFNonTerminal;

        for (const e of expr.value) {
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
        tail[tail.length - 1] = {
            type: "optional",
            value: tail[tail.length - 1],
        };

        ast[name] = {
            type: "alternation",
            value: head,
        };
        ast[APrime.value] = {
            type: "alternation",
            value: tail,
        };
    }

    // for (const [name, expression] of Object.entries(ast)) {
    //     if (expression.type === "alternation") {
    //         removeLeftRecursion(name, expression);
    //     }
    // }
    for (const [name, expression] of Object.entries(ast)) {
        nonterminals[name] = generateParser(name, expression);
    }

    return [nonterminals, ast] as const;
}
