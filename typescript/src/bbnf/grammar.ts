/* eslint-disable @typescript-eslint/no-explicit-any */
import { Parser, string, all, any, regex } from "../parse/index.js";
import type { Expression, Literal, Epsilon, Nonterminal, Comment, Regex, Group, Optional, Many, Concatenation, Alteration, ProductionRule } from "./types.js";

const operatorToType: Record<string, string> = {
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

const reduceBinaryExpression = ([left, rightExpression]: [any, any[]]) => {
    if (rightExpression.length === 0) {
        return left;
    }
    return rightExpression.reduce((acc: Expression, [op, right]: [string, Expression]) => {
        return {
            type: operatorToType[op],
            value: [acc, right],
        } as Expression;
    }, left);
};

const mapFactor = ([term, op]: [any, any]) => {
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

const defaultOptions: Options = {
    debug: false,
    comments: true,
};

export class BBNFGrammar {
    options: Options;

    // Backing fields for lazy-memoized parsers
    private _blockComment?: Parser<any>;
    private _lineComment?: Parser<any>;
    private _comment?: Parser<any>;
    private _group?: Parser<any>;
    private _regex?: Parser<any>;
    private _optionalGroup?: Parser<any>;
    private _manyGroup?: Parser<any>;
    private _lhs?: Parser<any>;
    private _term?: Parser<any>;
    private _factor?: Parser<any>;
    private _binaryFactor?: Parser<any>;
    private _concatenation?: Parser<any>;
    private _alternation?: Parser<any>;
    private _rhs?: Parser<any>;
    private _productionRule?: Parser<any>;
    private _grammar?: Parser<any>;

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
            regex(/(\\.|[^`\\])*/).wrap(string("`"), string("`")),
        ).map((value: any) => {
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

    blockComment(): Parser<any> {
        return (this._blockComment ??= Parser.lazy(() =>
            mapStatePosition(
                regex(/\/\*[^\*]*\*\//).map((v) => {
                    return {
                        type: "comment",
                        value: v,
                    } as Comment;
                }),
            ),
        ));
    }

    lineComment(): Parser<any> {
        return (this._lineComment ??= Parser.lazy(() =>
            mapStatePosition(
                regex(/\/\/.*/).map((v) => {
                    return {
                        type: "comment",
                        value: v,
                    } as Comment;
                }),
            ),
        ));
    }

    comment(): Parser<any> {
        return (this._comment ??= Parser.lazy(() =>
            any(this.blockComment(), this.lineComment()),
        ));
    }

    trimBigComment(e: Parser<any>) {
        return e
            .trim(this.blockComment().trim().many() as any, false)
            .map(([left, expression, right]: any) => {
                expression.comment = {
                    left,
                    right,
                };
                return expression as unknown as Expression;
            }) as Parser<Expression>;
    }

    group(): Parser<any> {
        return (this._group ??= Parser.lazy(() =>
            this.rhs()
                .trim()
                .wrap(string("("), string(")"))
                .map((value: any) => {
                    return {
                        type: "group",
                        value,
                    } as Group;
                }),
        ));
    }

    regexRule(): Parser<any> {
        return (this._regex ??= Parser.lazy(() =>
            regex(/(\\.|[^\/])+/)
                .wrap(string("/"), string("/"))
                .then(regex(/[gimuy]*/).opt())
                .map(([r, flags]: any) => {
                    return {
                        type: "regex",
                        value: new RegExp(r, flags ?? undefined),
                    } as Regex;
                }),
        ));
    }

    optionalGroup(): Parser<any> {
        return (this._optionalGroup ??= Parser.lazy(() =>
            this.rhs()
                .trim()
                .wrap(string("["), string("]"))
                .map((value: any) => {
                    return {
                        type: "optional",
                        value: {
                            type: "group",
                            value,
                        },
                    } as Optional;
                }),
        ));
    }

    manyGroup(): Parser<any> {
        return (this._manyGroup ??= Parser.lazy(() =>
            this.rhs()
                .trim()
                .wrap(string("{"), string("}"))
                .map((value: any) => {
                    return {
                        type: "many",
                        value: {
                            type: "group",
                            value,
                        },
                    } as Many;
                }),
        ));
    }

    lhs(): Parser<any> {
        return (this._lhs ??= Parser.lazy(() =>
            mapStatePosition(this.nonterminal()),
        ));
    }

    term(): Parser<any> {
        return (this._term ??= Parser.lazy(() =>
            mapStatePosition(
                any(
                    this.epsilon(),
                    this.group(),
                    this.optionalGroup(),
                    this.manyGroup(),
                    this.nonterminal(),
                    this.literal(),
                    this.regexRule(),
                ) as any,
            ),
        ));
    }

    factor(): Parser<any> {
        return (this._factor ??= Parser.lazy(() =>
            this.trimBigComment(
                mapStatePosition(
                    all(
                        this.term(),
                        any(
                            string("?w"),
                            string("?"),
                            string("*"),
                            string("+"),
                        )
                            .trim()
                            .opt() as any,
                    ).map(mapFactor),
                ),
            ),
        ));
    }

    binaryFactor(): Parser<any> {
        return (this._binaryFactor ??= Parser.lazy(() =>
            mapStatePosition(
                all(
                    this.factor(),
                    all(
                        any(string("<<"), string(">>"), string("-")).trim(),
                        this.factor(),
                    ).many(),
                ).map(reduceBinaryExpression),
            ),
        ));
    }

    concatenation(): Parser<any> {
        return (this._concatenation ??= Parser.lazy(() =>
            mapStatePosition(
                this.binaryFactor().sepBy(string(",").trim()),
            ).map((value: any) => {
                if (value.length === 1) {
                    return value[0];
                }

                return {
                    type: "concatenation",
                    value,
                } as Concatenation;
            }),
        ));
    }

    alternation(): Parser<any> {
        return (this._alternation ??= Parser.lazy(() =>
            mapStatePosition(
                this.concatenation().sepBy(string("|").trim()),
            ).map((value: any) => {
                if (value.length === 1) {
                    return value[0];
                }

                return {
                    type: "alternation",
                    value,
                } as Alteration;
            }),
        ));
    }

    rhs(): Parser<any> {
        return (this._rhs ??= Parser.lazy(() =>
            this.alternation(),
        ));
    }

    productionRule(): Parser<any> {
        return (this._productionRule ??= Parser.lazy(() =>
            all(
                this.lhs(),
                string("=").trim(),
                this.rhs(),
                any(string(";"), string(".")).trim(),
            ).map(([name, , expression]: any) => {
                return { name, expression } as ProductionRule;
            }),
        ));
    }

    grammar(): Parser<any> {
        return (this._grammar ??= Parser.lazy(() =>
            this.productionRule()
                .trim(this.lineComment().trim().many() as any, false)
                .map(([above, rule, below]: any) => {
                    rule.comment = {
                        above,
                        below,
                    };
                    return rule;
                })
                .many(1)
                .trim(),
        ));
    }
}
