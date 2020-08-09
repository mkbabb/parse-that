from typing import *

T = TypeVar("T")
S = TypeVar("S")
Number = TypeVar("Number", int, float)


def clamp(x: Number, lower: Number, upper: Number) -> Number:
    return lower if x < lower else upper if x > upper else x


def list_concat(
    in_list: List[List[Any]], pred: Optional[Callable[[List[Any]], bool]] = None
) -> List[Any]:
    if pred is None:
        pred = lambda x: True

    out_list: List[Any] = []
    for i in in_list:
        if pred(i):
            out_list += i

    return out_list


def concat_non_empty(in_list: List[List[Any]]) -> list:
    return list_concat(in_list, lambda x: len(x) > 0)


def is_power_of(n: int, b: int) -> bool:
    if n <= 1:
        return False
    else:
        while n % b == 0:
            n //= b
        return n == 1
