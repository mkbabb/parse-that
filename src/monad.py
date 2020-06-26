from typing import *

import typing_extensions

T = TypeVar("T")
S = TypeVar("S")


class Monad(Generic[T]):
    def __init__(self, val: T):
        self.val = val

    def flat_map(self, func: Callable[[T], Optional[S]]) -> Optional[S]:
        pass

    def map(self, func: Callable[[T], Optional[S]]) -> "Monad[Optional[S]]":
        pass

    def __or__(self, func: Callable[[T], Optional[S]]) -> "Monad[Optional[S]]":
        pass

    def unit(self, val: S) -> "Monad[Optional[S]]":
        pass

    def __repr__(self) -> str:
        return str(self.val)


class Maybe(Generic[T]):
    def __init__(self: "Maybe[T]", val: Optional[T], is_none: bool = False):
        self.val = val
        self.is_none = is_none or (val is None)

    def or_else(self, default: Optional[S]) -> "Maybe[Union[Optional[T], S]]":
        if self.is_none:
            return self.unit(default)
        else:
            return self.unit(self.val)

    def __or__(self, func: Callable[[T], Optional[S]]) -> "Maybe[Optional[S]]":
        return self.map(func)

    def __bool__(self) -> bool:
        return not self.is_none

    def flat_map(self, func: Callable[[T], Optional[S]]) -> Optional[S]:
        if self.val is not None:
            try:
                return func(self.val)
            except Exception as e:
                return None
        else:
            return self.val

    def map(self, func: Callable[[T], Optional[S]]) -> "Maybe[Optional[S]]":
        return self.unit(self.flat_map(func))

    def unit(self, val: S, is_none: bool = False) -> "Maybe[S]":
        return Maybe(val, is_none)

    def __repr__(self) -> str:
        return str(self.val) if not self.is_none else "None"


# if __name__ == "__main__":

# def tmp(x, y, z):
#     print(x, y)
#     return x, y

# data = {"vulns": {"hi": 0}, "row": "row"}
# row = Maybe(data.get("row"))
# vulns = Maybe(data.get("vulns"))
# tt = Maybe("ok")
# t = 1 + 2 + 3 * 1

# a = row.map(lambda row: (vulns.map(lambda vulns: vulns)))
# b = Promise(None)

# def tmp2(x):
#     raise ValueError()

# b.then(lambda x: tmp2(x)).catch(lambda: print("umm"))

# m = Maybe(99)
# m | (lambda x: x + 99)
