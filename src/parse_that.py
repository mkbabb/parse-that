from typing import *
from collections import defaultdict
from functools import reduce
import operator

T = TypeVar("T")
S = TypeVar("S")


class Monad(Generic[T]):
    def __init__(self, val: T):
        self.val = val

    def flat_map(self, func: Callable[[T], Optional[S]]):
        pass

    def map(self, func: Callable[[T], Optional[S]]) -> "Monad[T]":
        return self.unit(
            self.flat_map(lambda val: func(val))
        )

    def unit(self, val) -> "Monad[T]":
        pass


class Maybe(Monad[T]):
    def __init__(self,
                 val: T,
                 is_none: bool = False):
        self.is_none = is_none or (val is None)
        super().__init__(val)

    def __bool__(self) -> bool:
        return not self.is_none

    def flat_map(self, func: Callable[[T], Optional[S]]) -> Optional[S]:
        val: Optional[S] = None

        if (self.val is not None):
            try:
                val = func(self.val)
            except Exception as e:
                print(e)
                pass

        return val

    def map(self, func: Callable[[T], Optional[S]]) -> "Maybe[T]":
        return super().map(func)

    def unit(self, val: T) -> "Maybe[T]":
        return Maybe(val)

    def __repr__(self) -> str:
        return self.val if not self.is_none else "None"


class ParserValue:
    def __init__(self,
                 val: str,
                 is_junk: bool = False):
        self.val = val
        self.is_junk = is_junk

    def __str__(self) -> str:
        return str(self.val)


class ParserState:
    def __init__(self,
                 val: str,
                 col_number: int = 0,
                 line_number: int = 0):
        self.val = val
        self.col_number = col_number
        self.line_number = line_number

    def get_char(self,
                 pos: Optional[int] = None) -> Maybe[ParserValue]:
        pos = self.col_number if pos is None else pos
        if (pos < len(self.val)):
            return Maybe(
                ParserValue(self.val[pos])
            )
        else:
            return Maybe(None)

    def shift(self,
              amount: int) -> "ParserState":
        amount = amount + 1 if amount < 0 else amount
        col_number = self.col_number + amount
        if (col_number < 0 or col_number > len(self.val) - 1):
            return self
        else:
            # TODO: Fix the line number always being 0.
            return ParserState(self.val, col_number, 0)

    def __next__(self) -> Tuple[Maybe[ParserValue], "ParserState"]:
        ch = self.get_char()

        if (bool(ch)):
            col_number = self.col_number + 1

            line_number = 1 if ch.val == "\n" else 0

            p_val = ParserState(self.val,
                                col_number,
                                line_number)
            return ch, p_val
        else:
            return ch, self

    def __repr__(self) -> str:
        return f"val: {self.val}\
                \ncurrent character: {self.get_char()}\
                \ncolumn number: {self.col_number}\
                \nline_number: {self.line_number}"


ParserTuple = Tuple[Maybe[ParserValue], ParserState]
ParserFunction = Callable[[ParserState], ParserTuple]


class Parser:
    def __init__(self, parser: ParserFunction):
        self.parser = parser

    def __call__(self, p_val: ParserState) -> ParserTuple:
        return self.parser(p_val)

    def __and__(self, other: "Parser") -> "Parser":
        return and_then(self.parser, other)

    def __or__(self, other: "Parser") -> "Parser":
        return or_else(self.parser, other)

    def map(self, func: Callable[[T], S]):
        return parser_map(func, self.parser)


def append_if_not_junk(out_list: List[T]) -> bool:
    def inner(x: ParserValue) -> bool:
        if (not x.is_junk):
            out_list.append(x.val)
            return True
        else:
            return False
    return inner


def and_then(parser1: Parser,
             parser2: Parser) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple:
        match1, rest = parser1(p_val)
        matches: List[str] = []
        appender = append_if_not_junk(matches)

        if (bool(match1)):
            match2, rest = parser2(rest)
            if (bool(match2)):
                match1.flat_map(appender)
                match2.flat_map(appender)
                return Maybe(ParserValue(matches)), rest
            else:
                return match2, p_val
        else:
            return match1, p_val

    return Parser(inner)


def or_else(parser1: Parser,
            parser2: Parser) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple:
        match, rest = parser1(p_val)

        if (not bool(match)):
            match, rest = parser2(p_val)

        return match, rest

    return Parser(inner)


def parser_map(func: Callable[[T], S], parser: Parser) -> Parser:
    def wrapper(x): return ParserValue(func(x.val))

    def inner(p_val: ParserState) -> ParserTuple:
        match, rest = parser(p_val)

        if (bool(match)):
            return match.map(wrapper), rest
        else:
            return match, p_val

    return Parser(inner)


def look_ahead(parser: Parser,
               amount: int) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple:
        p_val_shifted = p_val.shift(amount)
        match, rest = parser(p_val_shifted)

        if (bool(match)):
            return match, rest
        else:
            return match, p_val

    return Parser(inner)


Number = TypeVar("Number", int, float)


def clamp(x: Number,
          lower: Number,
          upper: Number) -> Number:
    return lower\
        if x < lower\
        else upper\
        if x > upper\
        else x


def get_failure(p_val: ParserState,
                amount: int = 0) -> str:
    p_val_shifted = p_val.shift(amount)

    col_number = p_val_shifted.col_number
    ch = p_val.get_char()

    front = clamp(col_number - 10, 0, len(p_val_shifted.val))
    back = clamp(col_number + 10, 0, len(p_val_shifted.val))

    slc = p_val_shifted.val[front: back]
    dots = "..."
    space = " " * (
        len(slc) + len(dots) - (back - col_number) - 1
    )

    s = dots + slc + dots + "\n"
    s += space + "^" + "\n"
    s += space + "|" + "\n"
    s += f"Error at {ch.val}, column {p_val_shifted.col_number}, line number, {p_val_shifted.line_number}"
    return s


def satisfy(pred: Callable[[Maybe[str]], bool]) -> Parser:
    def pred_wrapper(x): return pred(x.val)

    def inner(p_val: ParserState) -> ParserTuple:
        ch = p_val.get_char()

        if (ch.flat_map(pred_wrapper)):
            return next(p_val)
        else:
            return Maybe(get_failure(p_val), True), p_val

    return Parser(inner)


def literal(s: str,
            ignore_case: bool = False) -> Parser:
    def icase_equals(x: str, y: str) -> bool:
        return x.lower() == y.lower()\
            if ignore_case\
            else x == y

    inner_ch = satisfy(lambda ch: icase_equals(ch, s))

    def inner_str(p_val: ParserState) -> ParserTuple:
        rest = p_val
        matches: List[str] = []
        appender = append_if_not_junk(matches)

        for n, ch in enumerate(s):
            match, rest = next(rest)

            if (bool(match) and
                    icase_equals(ch, match.val)):
                match.flat_map(appender)
            else:
                return Maybe(get_failure(rest), True), p_val

        return Maybe(ParserValue(matches)), rest

    return inner_ch if len(s) == 1 else Parser(inner_str).map("".join)


def sequence(parsers: List[Parser],
             backtrack: bool = True) -> Parser:

    def inner(p_val: ParserState) -> ParserTuple:
        rest = p_val
        matches: List[ParserValue] = []
        appender = append_if_not_junk(matches)

        for parser in parsers:
            match, rest = parser(rest)
            if (bool(match)):
                match.flat_map(appender)
            else:
                return (Maybe(get_failure(rest), True),
                        (p_val if backtrack else rest))

        return Maybe(ParserValue(matches)), rest

    return Parser(inner)


def many_of(parser: Parser) -> Parser:
    def inner(p_val: ParserState) -> ParserTuple:
        rest_prev = p_val
        matches: List[ParserValue] = []
        appender = append_if_not_junk(matches)

        while (True):
            match, rest = parser(rest_prev)

            if (not bool(match)):
                if (len(matches) == 0):
                    return Maybe(None), rest_prev
                else:
                    return Maybe(ParserValue(matches)), rest_prev
            else:
                rest_prev = rest
                match.flat_map(appender)

    return optional(Parser(inner))


def n_or_more(parser: Parser,
              n: int = 0):
    return (sequence([parser] * n) & many_of(parser))\
        .map(lambda x: x[0] + x[1])


def one_or_many(parser):
    return n_or_more(parser, 1)


def optional(parser: Parser):
    def inner(p_val: ParserState) -> ParserTuple:
        match, rest = parser(p_val)
        if (bool(match)):
            return match, rest
        else:
            return Maybe(ParserValue("", True)), p_val
    return Parser(inner)


def junk(parser):
    def set_junk(x):
        x.is_junk = True
        return x

    def inner(p_val: ParserState) -> ParserTuple:
        match, rest = parser(p_val)
        match = match.map(set_junk)
        return match, rest
    return Parser(inner)


def p_number():
    digit = many_of(satisfy(str.isdigit)).map("".join)
    dot = literal(".")
    e = literal("e")
    minus = literal("-")
    plus = literal("+")

    integer = digit.map(int)
    floating = \
        sequence([digit, dot, optional(digit)])\
        .map(lambda x: float("".join(x)))

    number = floating | integer

    exp = e & (minus | plus) & digit

    return (number & optional(exp)).map(lambda x: x[0])


space = many_of(literal(" ") | literal("\n") | literal("\t"))


def binary_operator(func: Callable[[float, float], float], token):
    def op(x):
        print(x)
        return func(x[0], x[2])
    return sequence([p_number(), literal(token), p_number(), junk(space)])\
        .map(op)


a = literal("a")
b = literal("b")

parser = binary_operator(lambda x, y: x + y, "+")
p_val = ParserState("123+456       ")
matched, rest = parser(p_val)
matched.flat_map(print)
print(rest)


def match_char(ch: str):
    def inner(s: str):

        if (s is None or s == ""):
            return (None, "")
        else:
            first = s[0]
            if (first == ch):
                return (ch, s[1:])
            else:
                return (None, f"Expected {ch}, but got {first}")
    return inner


def match_any(ch: Optional[str] = None):
    def inner(s: str):
        if (s is None or s == ""):
            return (None, "")
        else:
            return (s[0], s[1:])
    return inner


def and_then(p1, p2):
    def inner(s):
        match1, rest = p1(s)

        if (match1 is not None):
            match2, rest = p2(rest)

            if (match2 is not None):
                match1 = (match1, match2)

        return match1, rest
    return inner


def or_else(p1, p2):
    def inner(s):
        match, rest = p1(s)
        if (match is None):
            match, rest = p2(s)
            return match, rest
        else:
            return match, rest
    return inner


def choice(parsers: List[any]):
    return reduce(or_else, parsers)


def any_of(chs: List[str]):
    parsers = map(match_char, chs)
    return choice(parsers)


def parse_lower(s: str):
    return any_of(map(chr, range(ord("a"), ord("z") + 1)))(s)


def parse_upper(s: str):
    return any_of(map(chr, range(ord("A"), ord("Z") + 1)))(s)


def parse_alpha(s: str):
    return choice([parse_lower, parse_upper])(s)


def parse_digit(s: str):
    return any_of(map(str, range(10)))(s)


def parse_alnum(s: str):
    return choice([parse_alpha, parse_digit])(s)


def parse_whitespace(s: str):
    return any_of([" ", "\t", "\n"])(s)


def sequence(parsers: List[any]):
    def inner(s: str):
        match, rest = "", s
        results = []

        for parser in parsers:
            match, rest = parser(rest)
            if (match is not None):
                results.append(match)
            else:
                return None, s

        return results, rest

    return inner


def find_first_match(parsers):
    def inner(s: str):
        for parser in parsers:
            match, rest = parser(s)
            if (match):
                return match, rest
        return None, s
    return inner


def kleene(parser_primary,
           parser_secondary=None):
    parsers = [parser_primary]

    if (parser_secondary is not None):
        parsers.insert(0, parser_secondary)

    first_matcher = find_first_match(parsers)

    def inner(s: str):
        matches = []
        rest_prev = s

        while (True):
            match, rest = first_matcher(rest_prev)
            if (match is None):
                if (len(matches) == 0):
                    return None, rest_prev
                else:
                    return matches, rest_prev
            else:
                rest_prev = rest
                matches.append(match)

    return inner


def optional(parser):
    def inner(s: str):
        match, rest = parser(s)
        if (match):
            return match, rest
        else:
            return "", s
    return inner


def n_or_more(parser_primary,
              n=0,
              parser_secondary=None):
    seq = sequence([parser_primary] * n)
    k = kleene(parser_primary,
               parser_secondary)

    def inner(s):
        match, rest = seq(s)
        if (match is not None):
            k_match, rest = k(rest)
            if (k_match is not None):
                match += k_match
        return match, rest
    return inner


def one_or_many(parser_primary, parser_secondary=None):
    return n_or_more(parser_primary, 1, parser_secondary)


def parse_string(pstring: str):
    def joiner(x): return "".join(x)

    seq = sequence(map(match_char,
                       pstring))

    def inner(s):
        return map_to(
            joiner,
            seq)(s)
    return inner


SPACES = [r"\n", " ", r"\t"]


def parse_string_ignore_whitespace(pstring: str):
    def matcher(ch):
        if (ch in SPACES):
            return match_any(ch)
        else:
            return match_char(ch)
    seq = sequence(map(matcher,
                       pstring))
    return seq


def ignore_case(parser):
    def inner(s: str):
        match, rest = parser(s.upper())
        if (match is not None):
            return match, rest
        else:
            match, rest = parser(s.lower())
            return match, rest
    return inner


def dont_match(parser):
    def inner(s):
        match, rest = parser(s)
        if (match is None):
            return match_any("")(s)
        else:
            return None, s
    return inner


def ignore_right(parser, right):
    def inner(s):
        match, rest = parser(s)
        right_match, rest = right(rest)
        if (right_match is not None):
            return match, rest
        else:
            return None, s
    return inner


def ignore_left(left, parser):
    def inner(s):
        left_match, rest = left(s)
        if (left_match is not None):
            return parser(rest)
        else:
            return None, s
    return inner


def between(sep1, interior, sep2):
    return ignore_left(sep1,
                       ignore_right(interior,
                                    sep2)
                       )


pp = satisfy(sta("a")) & satisfy(sta("b"))
print(pp("ab"))


# parse_a = match_char("a")
# parse_b = match_char("b")
# parse_q = match_char("q")

# abc = or_else(and_then(parse_a, parse_b), parse_q)

# print(abc("qzc"))

# parse_1 = match_char("1")


# s1 = "ab2"
# p1 = or_else(sequence([parse_a, parse_b, parse_1]), parse_a)(s1)

# s2 = "aab"
# p2 = one_or_many(parse_a)(s2)
# print(p2)


# quote = match_char("\"")

# match_str = and_then(quote,
#                      and_then(
#                          one_or_many(
#                              choice([parse_alnum, parse_whitespace])
#                          ),
#                          quote))


# strr = '''"1234567 hii"'''
# print(match_str(strr))

# lparen = match_char("(")
# rparen = match_char(")")


# def string(s):
#     dquote = match_char("\"")
#     squote = match_char("\'")

#     ws = or_else(parse_alnum, parse_whitespace)
#     group1 = ws
#     group2 = and_then(and_then(squote, kleene(ws)), squote)

#     group = kleene(
#         or_else(group1, group2)
#     )

#     return and_then(and_then(dquote, group), dquote)(s)

# s = '''"this 'is' super    cool"'''
# p = string(s)
# print(p)
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


def list_join(iterable, delim):
    out = []
    for i in iterable:
        out.append(i)
        out.append(delim)
    out.pop()
    return out


def create_table():
    space = one_or_many(any_of(SPACES))

    string = map_to("".join, one_or_many(parse_alpha))

    name = or_else(
        string,
        between(match_char("`"), string, match_char("`"))
    )

    def phrase(s):
        return sequence(list_join(map(parse_string, s.split(" ")),
                                  space))

    def inner(s):
        create_stmt = sequence([
            ignore_right(parse_string("create"),
                         space),

            or_else(parse_string("table"),
                    parse_string("view")),

            ignore_left(space, name),

            optional(ignore_left(space,
                                 phrase("if not exists"),
                                 ))
        ])

        column = ignore_right(
            name,
            optional(match_char(","))
        )

        body = ignore_left(optional(space),

                           between(match_char("("),
                                   kleene(column),
                                   match_char(")")))

        def get_stmt_columns(stmt_columns):
            stmt = stmt_columns[0]
            columns = stmt_columns[1]

            return stmt_columns

        return map_to(get_stmt_columns, sequence([create_stmt, body]))(s)

    return inner


s = create_table()(
    "create table     `mojon` if not exists (`this`,is,cool,mijngrammar,is,NEat)")
print(s)
block = '''+----------------------------------------------------------------------------------------------------------------------------------+
: Services & Activities                                                                                                            :
:                                                                                                                                  :
:    Date       Billing Nbr/              Product/ Service        Description                        Charge     Qty         Rate   :
:    ----       Work Order                ----------------        -----------                        ------     ---         ----   :
:                                                                                                                                  :
: 08 Point to Point Data Chgs                                                                                                      :
:    06/30 Site S-5802                    SCI-WAN-100M            100M BUNDLED INTERNET SVC         6111.00    6111         1.00   :
:                                                                                                                                  :
: ** Total ----                                                                                     6111.00                        :
:                                                                                                                                  :
+----------------------------------------------------------------------------------------------------------------------------------+'''

delims = list(map(lambda x: x + "\n", block.split("\n")))


# header = sequence([parse_string(delims[0]),
#                    parse_string(delims[1]),
#                    optional(match_char(":")),
#                    parse_string(delims[3]),
#                    parse_string(delims[4]),
#                    kleene(match_char(":")),


#                    ]

#                   )


# print(header(block))


class fsm:
    def __init__(self, states: list):
        self.states = states
        self.current_state = 0
        self.prev_token = ""

    def advance(self, token):
        if (self.is_complete()):
            return True

        match, rest = self.states[self.current_state](self.prev_token + token)

        if (match is not None and rest == "" and self.prev_token != ""):
            self.current_state += 1
            self.prev_token = token
        else:
            self.prev_token += token

        return True

    def is_complete(self):
        return self.current_state >= len(self.states)


# a = match_char("a")
# comma = match_char(",")

# csv = "11,that,scool"

# p = kleene(
#     ignore_right(
#         map_to(lambda x: "".join(x),
#                one_or_many(parse_alnum)),
#         comma)
# )
# print(p(csv))
zero = match_char("0")
one = match_char("1")
two = match_char("2")

f = fsm([zero, kleene(zero, sequence([zero, one, two]))])
# f = fsm([sequence([zero, zero, zero])])

states = "0012"
for i in states:
    if (not f.advance(i)):
        break
print(f.is_complete())

# p = and_then(parse_a, and_then(parse_b, dont_match(match_char("q"))))
# print(p(csv))


# exprr = "((a*b|ac)d)"

# # expr = "(a*b)|(ac)"
# tokens = list(exprr)
# p = Parser(tokens).parse()

# print(p.graph)


def normalize_whitespace(s: str) -> str:
    s = re.sub(RE_WHITESPACE, " ", s)
    return s.strip()
