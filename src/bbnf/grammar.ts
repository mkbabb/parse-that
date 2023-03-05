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

    comment?: {
        left: string[];
        right: string[];
    };

    line?: number;
    column?: number;
    offset?: number;
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
        above: string[];
        below: string[];
    };
};

export type AST = Map<string, ProductionRule>;
export type Nonterminals = { [key: string]: Parser<any> };

const operatorToType = {
    "|": "alternation",
    ",": "concatenation",
    "-": "minus",
    "<<": "skip",
    ">>": "next",
    "*": "many",
    "+": "many1",
    "?": "optional",
    "?w": "optionalWhitespace",
};

const reduceBinaryExpression = ([left, rightExpression]) => {
    if (rightExpression.length === 0) {
        return left;
    }
    return rightExpression.reduce((acc, [op, right]) => {
        return {
            type: operatorToType[op],
            value: [acc, right],
        };
    }, left);
};

const mapFactor = ([term, op]) => {
    if (op === undefined) {
        return term;
    }
    const type = operatorToType[op];
    return {
        type,
        value: term,
    } as Expression;
};

function mapStatePosition(parser: Parser<any>) {
    return parser.mapState((state) => {
        if (state.value && state.value.line === undefined) {
            state.value.column = state.getColumnNumber();
            state.value.line = state.getLineNumber();
            state.value.offset = state.offset;
        }
        return state;
    });
}

type Options = {
    debug: boolean;
    comments: boolean;
};

const defaultOptions = {
    debug: false,
    comments: true,
} as Options;

export class BBNFGrammar {
    options: Options;

    constructor(options?: Partial<Options>) {
        this.options = {
            ...defaultOptions,
            ...(options ?? {}),
        };
    }

    identifier() {
        return regex(/[_a-zA-Z][_a-zA-Z0-9]*/);
    }

    literal() {
        return this.trimBigComment(
            mapStatePosition(
                any(
                    regex(/[^"]+/).wrap(string('"'), string('"')),
                    regex(/[^']+/).wrap(string("'"), string("'"))
                ).map((value) => {
                    return {
                        type: "literal",
                        value,
                    } as Literal;
                })
            )
        );
    }

    epsilon() {
        return any(string("epsilon"), string("ε")).map(() => {
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
    bigComment() {
        return regex(/\/\*[^\*]*\*\//).trim();
    }

    @lazy
    comment() {
        return regex(/\/\/.*/)
            .or(this.bigComment())
            .trim();
    }

    trimBigComment(e: Parser<any>) {
        return e
            .trim(this.bigComment().many(), false)
            .map(([left, expression, right]) => {
                expression.comment = {
                    left,
                    right,
                };
                return expression as unknown as Expression;
            }) as Parser<Expression>;
    }

    @lazy
    group() {
        return this.rhs()
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
            .then(regex(/[gimuy]*/).opt())
            .map(([r, flags]) => {
                return {
                    type: "regex",
                    value: new RegExp(r, flags),
                } as Regex;
            });
    }

    @lazy
    optionalGroup() {
        return this.rhs()
            .trim()
            .wrap(string("["), string("]"))
            .map((value) => {
                return {
                    type: "optional",
                    value: {
                        type: "group",
                        value,
                    },
                } as Optional;
            });
    }

    @lazy
    manyGroup() {
        return this.rhs()
            .trim()
            .wrap(string("{"), string("}"))
            .map((value) => {
                return {
                    type: "many",
                    value: {
                        type: "group",
                        value,
                    },
                } as Many;
            });
    }

    @lazy
    lhs() {
        return this.identifier();
    }

    @lazy
    term() {
        return mapStatePosition(
            any(
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

    @lazy
    factor() {
        return this.trimBigComment(
            all(
                this.term(),
                any(
                    string("?w").trim(),
                    string("?").trim(),
                    string("*").trim(),
                    string("+").trim()
                ).opt()
            ).map(mapFactor)
        ) as Parser<Expression>;
    }

    @lazy
    binaryFactor() {
        return all(
            this.factor(),
            all(
                any(string("<<").trim(), string(">>").trim(), string("-").trim()),
                this.factor()
            ).many()
        ).map(reduceBinaryExpression);
    }

    @lazy
    concatenation() {
        return this.binaryFactor()
            .sepBy(string(",").trim())
            .map((value) => {
                if (value.length === 1) {
                    return value[0];
                }

                return {
                    type: "concatenation",
                    value,
                } as Concatenation;
            });
    }

    @lazy
    alternation() {
        return this.concatenation()
            .sepBy(string("|").trim())
            .map((value) => {
                if (value.length === 1) {
                    return value[0];
                }

                return {
                    type: "alternation",
                    value,
                } as Alteration;
            });
    }

    @lazy
    rhs() {
        return this.alternation();
    }

    @lazy
    productionRule() {
        return all(
            this.lhs(),
            string("=").trim(),
            this.rhs(),
            any(string(";"), string(".")).trim()
        ).map(([name, , expression]) => {
            return { name, expression } as ProductionRule;
        });
    }

    @lazy
    grammar() {
        return this.productionRule()
            .trim(this.comment().many(), false)
            .map(([above, rule, below]: any) => {
                rule.comment = {
                    above,
                    below,
                };
                return rule;
            })
            .many(1)
            .trim();
    }
}
