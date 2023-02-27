import { Parser, string, lazy, all, any, regex, ParserState, eof } from "..";

export type EBNFExpression =
    | EBNFLiteral
    | EBNFNonterminal
    | EBNFGroup
    | EBNFRegex
    | EBNFOptional
    | EBNFSub
    | EBNFMany
    | EBNFMany1
    | EBNFSkip
    | EBNFNext
    | EBNFConcatenation
    | EBNFAlternation
    | EBNFEpsilon;

export interface EBNFLiteral {
    type: "literal";
    value: string;
}

export interface EBNFNonterminal {
    type: "nonterminal";
    value: string;
}

export interface EBNFEpsilon {
    type: "epsilon";
    value: undefined;
}

export interface EBNFGroup {
    type: "group";
    value: EBNFExpression;
}

export interface EBNFRegex {
    type: "regex";
    value: RegExp;
}

export interface EBNFOptional {
    type: "optional";
    value: EBNFExpression;
}

export interface EBNFSub {
    type: "subtraction";
    value: [EBNFExpression, EBNFExpression];
}

export interface EBNFMany {
    type: "many";
    value: EBNFExpression;
}

export interface EBNFMany1 {
    type: "many1";
    value: EBNFExpression;
}

export interface EBNFSkip {
    type: "skip";
    value: [EBNFExpression, EBNFExpression];
}

export interface EBNFNext {
    type: "next";
    value: [EBNFExpression, EBNFExpression];
}

export interface EBNFConcatenation {
    type: "concatenation";
    value: EBNFExpression[];
}

export interface EBNFAlternation {
    type: "alternation";
    value: EBNFExpression[];
}

export type EBNFProductionRule = {
    name: string;
    expression: EBNFExpression;
};

export type EBNFAST = Map<string, EBNFExpression>;
export type EBNFNonterminals = { [key: string]: Parser<any> };

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

const terminator = any(semicolon, dot);

export class EBNFGrammar {
    identifier() {
        return regex(/[_a-zA-Z][_a-zA-Z0-9]*/).trim();
    }

    literal() {
        return any(
            regex(/[^"\s]+/).wrap(string('"'), string('"')),
            regex(/[^'\s]+/).wrap(string("'"), string("'"))
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

    @lazy
    regex() {
        return regex(/[^\/]*/)
            .wrap(string("/"), string("/"))
            .map((value) => {
                return {
                    type: "regex",
                    value: new RegExp(value),
                } as EBNFRegex;
            });
    }

    optional() {
        return this.term()
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
            this.regex(),
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
