import { Parser, string, lazy, all, any, regex, ParserState, eof } from "..";

export type Expression =
    | Literal
    | Comment
    | Nonterminal
    | Group
    | Regex
    | Optional
    | Minus
    | Many
    | Many1
    | Skip
    | Next
    | Concatenation
    | Alteration
    | Epsilon
    | OptionalWhitespace
    | Coalesce
    | EOF;

export interface Literal {
    type: "literal";
    value: string;
}

export interface Comment {
    type: "comment";
    value: string;
}

export interface Nonterminal {
    type: "nonterminal";
    value: string;
}

export interface Epsilon {
    type: "epsilon";
    value: undefined;
}

export interface EOF {
    type: "eof";
    value: undefined;
}

export interface OptionalWhitespace {
    type: "optionalWhitespace";
    value: undefined;
}

export interface Coalesce {
    type: "coalesce";
    value: Expression[];
}

export interface Group {
    type: "group";
    value: Expression;
}

export interface Regex {
    type: "regex";
    value: RegExp;
}

export interface Optional {
    type: "optional";
    value: Expression;
}

export interface Minus {
    type: "minus";
    value: [Expression, Expression];
}

export interface Many {
    type: "many";
    value: Expression;
}

export interface Many1 {
    type: "many1";
    value: Expression;
}

export interface Skip {
    type: "skip";
    value: [Expression, Expression];
}

export interface Next {
    type: "next";
    value: [Expression, Expression];
}

export interface Concatenation {
    type: "concatenation";
    value: Expression[];
}

export interface Alteration {
    type: "alternation";
    value: Expression[];
}

export type EBNFProductionRule = {
    type: "productionRule" | "comment";
    expression: Expression;
    name?: string;
};

export type EBNFAST = Map<string, Expression>;
export type EBNFNonterminals = { [key: string]: Parser<any> };

const comma = string(",").trim();
const equalSign = string("=").trim();

const semicolon = string(";").trim();
const dot = string(".").trim();
const questionMark = string("?").trim();
const optionalWhitespace = string("?w").trim();
const coalsece = string("??").trim();
const pipe = string("|").trim();

const plus = string("+").trim();
const minus = string("-").trim();
const mul = string("*").trim();
const div = string("/").trim();

const leftShift = string(">>").trim();
const rightShift = string("<<").trim();

const terminator = any(semicolon, dot);

export class EBNFGrammar {
    identifier() {
        return regex(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
    }

    literal() {
        return any(
            regex(/[^"]+/).wrap(string('"'), string('"')),
            regex(/[^']+/).wrap(string("'"), string("'"))
        ).map((value) => {
            return {
                type: "literal",
                value,
            } as Literal;
        });
    }

    epsilon() {
        return any(string("epsilon"), string("ε"), string("ϵ"))
            .trim()
            .map((value) => {
                return {
                    type: "epsilon",
                    value: undefined,
                } as Epsilon;
            });
    }

    nonterminal() {
        return this.identifier().map((value) => {
            return {
                type: "nonterminal",
                value,
            } as Nonterminal;
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
                } as Group;
            });
    }

    eof() {
        return string("$")
            .trim()
            .map((value) => {
                return {
                    type: "eof",
                    value,
                } as EOF;
            });
    }

    @lazy
    regex() {
        return regex(/[^\/]*/)
            .wrap(string("/"), string("/"))
            .map((value) => {
                return {
                    type: "regex",
                    value: new RegExp(value),
                } as Regex;
            });
    }

    optional() {
        return this.term()
            .skip(questionMark)
            .map((value) => {
                return {
                    type: "optional",
                    value,
                } as Optional;
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
                } as Optional;
            });
    }

    optionalWhitespace() {
        return this.term()
            .skip(optionalWhitespace)
            .map((value) => {
                return {
                    type: "optionalWhitespace",
                    value,
                } as OptionalWhitespace;
            });
    }

    @lazy
    coalesce() {
        return all(this.term().skip(coalsece), this.factor()).map(([left, right]) => {
            return {
                type: "coalesce",
                value: [left, right],
            } as Coalesce;
        });
    }

    subtraction() {
        return all(this.term().skip(minus), this.term()).map(([left, right]) => {
            return {
                type: "minus",
                value: [left, right],
            } as Minus;
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
                } as Many;
            });
    }

    many() {
        return this.term()
            .skip(mul)
            .map((value) => {
                return {
                    type: "many",
                    value,
                } as Many;
            });
    }

    many1() {
        return this.term()
            .skip(plus)
            .map((value) => {
                return {
                    type: "many1",
                    value,
                } as Many1;
            });
    }

    @lazy
    next() {
        return all(this.factor().skip(leftShift), any(this.skip(), this.factor())).map(
            ([left, right]) => {
                return {
                    type: "next",
                    value: [left, right],
                } as Next;
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
                } as Skip;
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
                } as Concatenation;
            });
    }

    alternation() {
        return any(this.concatenation(), this.skip(), this.next(), this.factor())
            .sepBy(pipe, 1)
            .map((value) => {
                return {
                    type: "alternation",
                    value,
                } as Alteration;
            });
    }

    bigComment() {
        return regex(/\/\*[^]*?\*\//)
            .trim()
            .map((value) => {
                return {
                    type: "comment",
                    expression: {
                        type: "literal",
                        value,
                    } as Literal,
                } as EBNFProductionRule;
            });
    }

    term() {
        return any(
            this.epsilon(),
            this.literal(),
            this.nonterminal(),
            this.regex(),
            this.group(),
            this.optionalGroup(),
            this.manyGroup(),
            this.eof()
        ).trim(this.bigComment().opt()) as Parser<Expression>;
    }

    factor() {
        return any(
            this.coalesce(),
            this.optionalWhitespace(),
            this.optional(),
            this.many(),
            this.many1(),
            this.subtraction(),
            this.term()
        ) as Parser<Expression>;
    }

    comment() {
        return regex(/\/\/.*/)
            .trim()
            .map((value) => {
                return {
                    type: "comment",
                    expression: {
                        type: "literal",
                        value,
                    } as Literal,
                } as EBNFProductionRule;
            })
            .or(this.bigComment());
    }

    expression() {
        return any(
            this.alternation(),
            this.concatenation(),
            this.skip(),
            this.next(),
            this.factor()
        ) as Parser<Expression>;
    }

    productionRule() {
        return all(
            this.identifier().skip(equalSign),
            this.expression().skip(terminator)
        ).map(([name, expression]) => {
            return { name, expression, type: "productionRule" } as EBNFProductionRule;
        });
    }

    grammar() {
        return all(this.comment().many(), this.productionRule(), this.comment().many())
            .many(1)
            .map((v) => {
                return v.flat(2);
            });
    }
}
