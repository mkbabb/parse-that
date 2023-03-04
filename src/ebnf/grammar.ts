import { Parser, string, lazy, all, any, regex } from "../parse";

export type Expression =
    | Literal
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
    | OptionalWhitespace;

interface BaseExpression<T, V = string> {
    type: T;
    value: V;
    comment?: string[];
}

export type Nonterminal = BaseExpression<"nonterminal">;

export type Literal = BaseExpression<"literal">;
export type Regex = BaseExpression<"regex", RegExp>;
export type Epsilon = BaseExpression<"epsilon">;

export type Group = BaseExpression<"group", Expression>;
export type ManyGroup = BaseExpression<"many", Expression>;
export type OptionalGroup = BaseExpression<"optional", Expression>;

export type Optional = BaseExpression<"optional", Expression>;
export type OptionalWhitespace = BaseExpression<"optionalWhitespace", undefined>;

export type Minus = BaseExpression<"minus", [Expression, Expression]>;

export type Many = BaseExpression<"many", Expression>;
export type Many1 = BaseExpression<"many1", Expression>;
export type Skip = BaseExpression<"skip", [Expression, Expression]>;
export type Next = BaseExpression<"next", [Expression, Expression]>;

export type Concatenation = BaseExpression<"concatenation", Expression[]>;
export type Alteration = BaseExpression<"alternation", Expression[]>;

export type ProductionRule = {
    expression: Expression;
    name: string;
    comment: {
        above?: string[];
        below?: string[];
    };
};

export type AST = Map<string, ProductionRule>;
export type Nonterminals = { [key: string]: Parser<any> };

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
        return any(string("epsilon"), string("ε"))
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
            .skip(string("?").trim())
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
            .skip(string("?w").trim())
            .map((value) => {
                return {
                    type: "optionalWhitespace",
                    value,
                } as OptionalWhitespace;
            });
    }

    minus() {
        return all(this.term().skip(string("-").trim()), this.term()).map(
            ([left, right]) => {
                return {
                    type: "minus",
                    value: [left, right],
                } as Minus;
            }
        );
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
            .skip(string("*").trim())
            .map((value) => {
                return {
                    type: "many",
                    value,
                } as Many;
            });
    }

    many1() {
        return this.term()
            .skip(string("+").trim())
            .map((value) => {
                return {
                    type: "many1",
                    value,
                } as Many1;
            });
    }

    @lazy
    next() {
        return all(
            this.factor().skip(string(">>").trim()),
            any(this.skip(), this.factor())
        ).map(([left, right]) => {
            return {
                type: "next",
                value: [left, right],
            } as Next;
        });
    }

    @lazy
    skip() {
        return all(
            any(this.next(), this.factor()).skip(string("<<").trim()),
            this.factor()
        ).map(([left, right]) => {
            return {
                type: "skip",
                value: [left, right],
            } as Skip;
        });
    }

    concatenation() {
        return any(this.skip(), this.next(), this.factor())
            .sepBy(string(",").trim(), 1)
            .map((value) => {
                return {
                    type: "concatenation",
                    value,
                } as Concatenation;
            });
    }

    alternation() {
        return any(this.concatenation(), this.skip(), this.next(), this.factor())
            .sepBy(string("|").trim(), 1)
            .map((value) => {
                return {
                    type: "alternation",
                    value,
                } as Alteration;
            });
    }

    bigComment() {
        return regex(/\/\*[^]*?\*\//).trim();
    }

    comment() {
        return regex(/\/\/.*/)
            .trim()
            .or(this.bigComment());
    }

    term() {
        return any(
            this.epsilon(),
            this.literal(),
            this.nonterminal(),
            this.regex(),
            this.group(),
            this.optionalGroup(),
            this.manyGroup()
        )
            .then(this.bigComment().opt())
            .map(([left, comment]) => {
                left.comment = comment;
                return left as unknown as Expression;
            }) as Parser<Expression>;
    }

    factor() {
        return any(
            this.optionalWhitespace(),
            this.optional(),
            this.many(),
            this.many1(),
            this.minus(),
            this.term()
        ) as Parser<Expression>;
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
            this.identifier().skip(string("=").trim()),
            this.expression().skip(any(string(";").trim(), string(".").trim()))
        ).map(([name, expression]) => {
            return { name, expression } as ProductionRule;
        });
    }

    grammar() {
        return all(this.comment().many(), this.productionRule(), this.comment().many())
            .map(([above, rule, below]) => {
                rule.comment = {
                    above,
                    below,
                };
                return rule;
            })
            .many(1);
    }
}
