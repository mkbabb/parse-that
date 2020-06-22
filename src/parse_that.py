from typing import *
from collections import defaultdict
from functools import reduce

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


def map_to(f, parser):
    def inner(s: str):
        match, rest = parser(s)
        if (match is not None):
            return (f(match), rest)
        else:
            return match, rest
    return inner


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


class Parser:
    def __init__(self, parser):
        self.parser = parser

    def __call__(self, s):
        return self.parser(s)

    def __and__(self, other):
        return and_then(self.parser, other)

    def __or__(self, other):
        return or_else(self.parser, other)


def satisfy(pred: Callable[[str], bool]):
    def inner(s: str):
        if (len(s) == 0 or not pred(s[0])):
            return (None, s)
        else:
            return (s[0], s[1:])
    return Parser(inner)


def match_ch(ch):
    return lambda s: s == ch


pp = satisfy(match_ch("a")) & satisfy(match_ch("b"))
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