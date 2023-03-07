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

interface Token<T, V = string> {
    type: T;
    value: V;

    range?: {
        start: number;
        end: number;
    };
}

export type Comment = Token<"comment">;

interface ExpressionToken<T, V = string> extends Token<T, V> {
    comment?: {
        left: string[];
        right: string[];
    };
}

export type Nonterminal = ExpressionToken<"nonterminal">;

export type Literal = ExpressionToken<"literal">;
export type Regex = ExpressionToken<"regex", RegExp>;
export type Epsilon = ExpressionToken<"epsilon">;

export type Group = ExpressionToken<"group", Expression>;
export type ManyGroup = ExpressionToken<"many", Expression>;
export type OptionalGroup = ExpressionToken<"optional", Expression>;

export type Optional = ExpressionToken<"optional", Expression>;
export type OptionalWhitespace = ExpressionToken<"optionalWhitespace", undefined>;

export type Minus = ExpressionToken<"minus", [Expression, Expression]>;

export type Many = ExpressionToken<"many", Expression>;
export type Many1 = ExpressionToken<"many1", Expression>;
export type Skip = ExpressionToken<"skip", [Expression, Expression]>;
export type Next = ExpressionToken<"next", [Expression, Expression]>;

export type Concatenation = ExpressionToken<"concatenation", Expression[]>;
export type Alteration = ExpressionToken<"alternation", Expression[]>;

export type ProductionRule = {
    name: Nonterminal;
    expression: Expression;
    comment: {
        above: Comment[];
        below: Comment[];
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
    return parser.mapState((newState, oldState) => {
        if (newState.value && newState.value.range === undefined) {
            newState.value.range = {
                start: oldState.offset,
                end: newState.offset,
            };
        }
        return newState;
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
        return regex(/[_a-zA-Z][_a-zA-Z0-9-]*/);
    }

    literal() {
        return any(
            regex(/(\\.|[^"\\])*/).wrap(string('"'), string('"')),
            regex(/(\\.|[^'\\])*/).wrap(string("'"), string("'")),
            regex(/(\\.|[^`\\])*/).wrap(string("`"), string("`"))
        ).map((value) => {
            value = value.replace(/\\(.)/g, "$1");
            return {
                type: "literal",
                value,
            } as Literal;
        });
    }

    epsilon() {
        return any(string("epsilon"), string("ε")).map(() => {
            return {
                type: "epsilon",
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
    blockComment() {
        return mapStatePosition(
            regex(/\/\*[^\*]*\*\//).map((v) => {
                return {
                    type: "comment",
                    value: v,
                } as Comment;
            })
        );
    }

    @lazy
    lineComment() {
        return mapStatePosition(
            regex(/\/\/.*/).map((v) => {
                return {
                    type: "comment",
                    value: v,
                } as Comment;
            })
        );
    }

    @lazy
    comment() {
        return any(this.blockComment(), this.lineComment());
    }

    trimBigComment(e: Parser<any>) {
        return e
            .trim(this.blockComment().trim().many(), false)
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
        return regex(/(\\.|[^\/])+/)
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
        return mapStatePosition(this.nonterminal());
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
            mapStatePosition(
                all(
                    this.term(),
                    any(string("?w"), string("?"), string("*"), string("+"))
                        .trim()
                        .opt()
                ).map(mapFactor)
            )
        ) as Parser<Expression>;
    }

    @lazy
    binaryFactor() {
        return mapStatePosition(
            all(
                this.factor(),
                all(
                    any(string("<<"), string(">>"), string("-")).trim(),
                    this.factor()
                ).many()
            ).map(reduceBinaryExpression)
        );
    }

    @lazy
    concatenation() {
        return mapStatePosition(this.binaryFactor().sepBy(string(",").trim())).map(
            (value) => {
                if (value.length === 1) {
                    return value[0];
                }

                return {
                    type: "concatenation",
                    value,
                } as Concatenation;
            }
        );
    }

    @lazy
    alternation() {
        return mapStatePosition(this.concatenation().sepBy(string("|").trim())).map(
            (value) => {
                if (value.length === 1) {
                    return value[0];
                }

                return {
                    type: "alternation",
                    value,
                } as Alteration;
            }
        );
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
            .trim(this.lineComment().trim().many(), false)
            .map(([above, rule, below]: any) => {
                rule.comment = {
                    above,
                    below,
                };
                return rule;
            })
            .many(1)
            .trim() as Parser<ProductionRule[]>;
    }
}
