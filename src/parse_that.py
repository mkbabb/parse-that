import operator
from collections import defaultdict
from functools import reduce
from typing import *

from monad import Maybe

T = TypeVar("T")
S = TypeVar("S")
Number = TypeVar("Number", int, float)


class ParserState:
    def __init__(self, val: str, col_number: int = 0, line_number: int = 0):
        self.val = val
        self.col_number = col_number
        self.line_number = line_number

    def get_value(self, pos: Optional[int] = None) -> Maybe[str]:
        pos = self.col_number if pos is None else pos
        if pos < len(self.val):
            return Maybe(self.val[pos])
        else:
            return Maybe(None)

    def shift(self, amount: int) -> "ParserState":
        amount = amount + 1 if amount < 0 else amount
        col_number = self.col_number + amount

        if col_number < 0 or col_number > len(self.val) - 1:
            return self
        else:
            # TODO: Fix the line number always being 0.
            return ParserState(self.val, col_number, 0)

    def next(self) -> Tuple[Maybe[str], "ParserState"]:
        ch = self.get_value()

        if bool(ch):
            col_number = self.col_number + 1

            line_number = 1 if ch.val == "\n" else 0

            p_val = ParserState(self.val, col_number, line_number)
            return ch, p_val
        else:
            return ch, self

    def __repr__(self) -> str:
        return f"val: {self.val}\
                \ncurrent character: {self.get_value()}\
                \ncolumn number: {self.col_number}\
                \nline_number: {self.line_number}"


ParserTuple = Tuple[Maybe[T], ParserState]
ParserFunction = Callable[[ParserState], ParserTuple]


class Parser:
    def __init__(self, parser: Union["Parser", ParserFunction]):
        self.parser = parser

    def __call__(self, p_val: ParserState) -> ParserTuple:
        return self.parser(p_val)

    def __and__(self, other: "Parser") -> "Parser":
        return and_then(self.parser, other)

    def __or__(self, other: "Parser") -> "Parser":
        return or_else(self.parser, other)

    def map(self, func: Callable[[T], S]) -> "Parser":
        return parser_map(func, self.parser)


def and_then(parser1: Parser, parser2: Parser) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple[List[str]]:
        matches: List[str] = []
        match1, rest = parser1(p_val)

        if bool(match1):
            match1.map(matches.append)
            match2, rest = parser2(rest)

            if bool(match2):
                match2.map(matches.append)

            return Maybe(matches), rest

        else:
            return match1, p_val

    return Parser(inner)


def or_else(parser1: Parser, parser2: Parser) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple:
        match, rest = parser1(p_val)

        if not bool(match):
            match, rest = parser2(p_val)

        return match, rest

    return Parser(inner)


def parser_map(func: Callable[[T], S], parser: Parser) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple:
        match, rest = parser(p_val)

        if bool(match):
            return match.map(func), rest
        else:
            return match, p_val

    return Parser(inner)


def look_ahead(parser: Parser, amount: int) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple:
        p_val_shifted = p_val.shift(amount)
        match, rest = parser(p_val_shifted)

        if bool(match):
            return match, rest
        else:
            return match, p_val

    return Parser(inner)


def clamp(x: Number, lower: Number, upper: Number) -> Number:
    return lower if x < lower else upper if x > upper else x


def get_failure(p_val: ParserState, amount: int = 0) -> str:
    p_val_shifted = p_val.shift(amount)

    col_number = p_val_shifted.col_number
    ch = p_val.get_value()

    front = clamp(col_number - 10, 0, len(p_val_shifted.val))
    back = clamp(col_number + 10, 0, len(p_val_shifted.val))

    slc = p_val_shifted.val[front:back]
    dots = "..."
    space = " " * (len(slc) + len(dots) - (back - col_number) - 1)

    s = dots + slc + dots + "\n"
    s += space + "^" + "\n"
    s += space + "|" + "\n"
    s += f"Error at {ch.val}, column {p_val_shifted.col_number}, line number, {p_val_shifted.line_number}"
    return s


def satisfy(pred: Callable[[str], bool]) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple:
        pred_val = p_val.get_value().map(pred).or_else(False)

        if pred_val.val:
            return p_val.next()
        else:
            return Maybe(get_failure(p_val), True), p_val

    return Parser(inner)


def literal(s: str, ignore_case: bool = False) -> Parser:
    def icase_equals(x: str, y: str) -> bool:
        return x.lower() == y.lower() if ignore_case else x == y

    match_char = satisfy(lambda ch: icase_equals(ch, s))

    def match_str(p_val: ParserState) -> ParserTuple:
        n = 0
        match, rest = p_val.next()
        while bool(match) and icase_equals(s[n], match.val):
            n += 1
            match, rest = p_val.next()

        if n != len(s) - 1:
            return Maybe(get_failure(rest), True), p_val
        else:
            return Maybe(s), rest

    parser = match_char if len(s) == 1 else match_str
    return Parser(parser)


def sequence(parsers: List[Parser], backtrack: bool = True) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple[List[str]]:
        rest = p_val
        matches: List[str] = []

        for parser in parsers:
            match, rest = parser(rest)
            if bool(match):
                match.flat_map(matches.append)
            else:
                return (Maybe(None), p_val if backtrack else rest)

        return Maybe(matches), rest

    return Parser(inner)


def many_of(parser: Parser) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple:
        rest_prev = p_val
        matches: List[str] = []

        while True:
            match, rest = parser(rest_prev)

            if not bool(match):
                if len(matches) == 0:
                    return Maybe(None), p_val
                else:
                    return Maybe(matches), rest_prev
            else:
                rest_prev = rest
                match.flat_map(matches.append)

    return Parser(inner)


def list_concat(
    in_list: List[List[Any]], pred: Optional[Callable[[List[Any]], bool]] = None
) -> List[Any]:
    if pred is None:
        pred = lambda x: True
    return [i for i in in_list if pred(i)]


def concat_non_empty(in_list: List[List[Any]]):
    return list_concat(in_list, lambda x: len(x) > 0)


def n_or_more(parser: Parser, n: int = 0) -> Parser:
    parsers = [parser] * n
    parsers.append(optional(many_of(parser)))
    seq = sequence(parsers).map(lambda in_list: concat_non_empty)

    return seq


def one_or_many(parser: Parser) -> Parser:
    return n_or_more(parser, 1)


def optional(parser: Parser) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple:
        match, rest = parser(p_val)
        if bool(match):
            return match, rest
        else:
            return Maybe(None), p_val

    return Parser(inner)


def ignore_left(ignored_parser: Parser, parser: Parser) -> Parser:
    return sequence([ignored_parser, parser]).map(lambda x: x[1])


def ignore_right(parser: Parser, ignored_parser: Parser) -> Parser:
    return sequence([parser, ignored_parser]).map(lambda x: x[0])


def between(parser_left: Parser, parser: Parser, parser_right: Parser) -> Parser:
    return sequence([parser_left, parser, parser_right]).map(lambda x: x[1])


def p_number():
    digit = many_of(satisfy(str.isdigit)).map("".join)
    dot = literal(".")
    e = literal("e")
    minus = literal("-")
    plus = literal("+")

    integer = digit.map(float)
    floating = sequence([digit, dot, optional(digit)]).map(lambda x: float("".join(x)))

    number = floating | integer

    exp = e & (minus | plus) & digit

    return (number & optional(exp)).map(lambda x: x[0])


space = many_of(literal(" ") | literal("\n") | literal("\t")).map(lambda x: " ")
alpha = one_or_many(satisfy(lambda x: str(x).isalpha()))
quotes = lambda parser: between(literal('"'), parser, literal('"'))

words = one_or_many(alpha)
quoted_words = quotes(words)

a = literal("a")
b = literal("b")

s = "hello"

parser = many_of(words)
p_val = ParserState(s)
matched, rest = parser(p_val)
matched.flat_map(print)
print(rest)


sql = """CREATE TABLE `hosts` (
    `ip_addr` INT(11) NOT NULL,
    `ip_addr_str` VARCHAR(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `last_update` datetime DEFAULT NULL,
    `hostnames` json DEFAULT NULL,
    `domains` json DEFAULT NULL,
    `os` VARCHAR(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `ports` json DEFAULT NULL,
    `vulns` json DEFAULT NULL,
    `institution_name` VARCHAR(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `institution_type` VARCHAR(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `institution_id` VARCHAR(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`ip_addr`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci"""

