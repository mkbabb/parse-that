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
    def __init__(self, val: Optional[T], is_none: bool = False):
        self.val = val
        self.is_none = is_none or (val is None)

    def or_else(self, default: S) -> Union["Maybe[S]", "Maybe[T]"]:
        if self.is_none:
            return Maybe(default)
        else:
            return Maybe(self.val)

    def __or__(self, func: Callable[[T], S]) -> "Maybe[S]":
        return self.map(func)

    def __bool__(self) -> bool:
        return not self.is_none

    def flat_map(self, func: Callable[[T], S]) -> Optional[S]:
        if self.val is not None:
            try:
                return func(self.val)
            except Exception as e:
                return None
        else:
            return self.val

    def map(self, func: Callable[[T], S]) -> "Maybe[S]":
        return Maybe(self.flat_map(func))

    def __repr__(self) -> str:
        return str(self.val) if not self.is_none else "None"


class MonadicList(Generic[T]):
    def __init__(self, val: List[T]):
        self.val = val

    def flat_map(self, func: Callable[[T], List[S]]) -> List[S]:
        out: List[S] = []

        for curr_val in self.val:
            out.extend(func(curr_val))

        return out

    def map(self, func: Callable[[T], S]) -> "MonadicList[S]":
        wrapper = lambda curr_val: [func(curr_val)]
        return MonadicList(self.flat_map(wrapper))

    def reduce(self, func: Callable[[S, T], S], init: Optional[T] = None,) -> S:
        start_pos = 0

        if init is None:
            start_pos = 1
            init = self.val[0]

        acc: S = cast(S, init)

        for n, curr_val in enumerate(self.val[start_pos:]):
            acc = func(acc, curr_val)

        return acc


BITS = 2
WIDTH = 1 << BITS
MASK = WIDTH - 1


import math


def is_power_of(n: int, b: int) -> bool:
    if n <= 1:
        return False
    else:
        while n % b == 0:
            n //= b
        return n == 1


class Node(Generic[T]):
    def __init__(self, children: Optional[List[T]] = None):
        if children is not None:
            self.children = children + [None] * (WIDTH - len(children))
        else:
            self.children = [None] * WIDTH

    def copy(self):
        return Node(list(self.children))


class MyList:
    def __init__(self):
        self.root = Node()
        self.size = 0

    def depth(self):
        return 0 if self.size == 0 else int(math.log(self.size, WIDTH))

    def at(self, key: int):
        node = self.root

        for i in range(self.depth(), 0, -1):
            level = (key >> (i * BITS)) & MASK
            node = node.children[level]

        return node.children[key & MASK], node.children

    def append(self, val: T):
        """ Three cases when appending, in order initial possibility:
         1. Root overflow: there's no more space in the entire tree: thus we must
         create an entirely root, whereof's left branch is the current root.

         2. There's no room in the left branch, and the right branch is None: thus we must
         create a right branch and fill its first element with "value".

         3. There's space in the current branch: we simply insert "value" here,
         path copying on the way down.
        """
        root = Node(list(self.root.children))

        # Root overflow case.
        if is_power_of(self.size, WIDTH):
            root = Node([root])

        node = root
        key = self.size

        for i in range(self.depth(), 0, -1):
            level = (key >> (i * BITS)) & MASK

            # Generate a branch until we get to the leaves.
            if node.children[level] is None:
                node.children[level] = Node()
                node = node.children[level]
            else:
                node.children[level] = node.children[level].copy()
                node = node.children[level]

        ix = key & MASK
        node.children[ix] = val

        out = MyList()
        out.root = root
        out.size = self.size + 1

        return out

    def pop(self):
        root = Node(list(self.root.children))
        node = root
        prev_node = node

        key = self.size

        for i in range(self.depth(), 0, -1):
            level = (key >> (i * BITS)) & MASK

            prev_node = node
            node.children[level] = node.children[level].copy()
            node = node.children[level]

        ix = (key & MASK) - 1
        if ix < 0:
            prev_node.children = None
        else:
            node.children[ix] = None

        out = MyList()
        out.root = root
        out.size = self.size - 1

        return out


if __name__ == "__main__":
    l0 = MyList()
    l1 = l0.append(0)
    l2 = l1.append(1)
    l3 = l2.append(2)
    l4 = l3.append(3)
    l5 = l4.append(4)
    l5 = l5.append(5)
    l5 = l5.append(6)
    l5 = l5.append(7)
    l5 = l5.append(8)
    l5 = l5.append(9)
    l5 = l5.append(10)
    l5 = l5.append(11)
    l5 = l5.append(12)
    l5 = l5.append(13)
    l5 = l5.append(14)
    l5 = l5.append(15)
    l5 = l5.append(16)
    l5 = l5.append(17)
    l5 = l5.append(18)

    for i in range(l5.size):
        print(l5.at(i))

    l6 = l5.pop()
    l7 = l6.pop()

    for i in range(l6.size):
        t1, child1 = l6.at(i)
        t2, child2 = l7.at(i)

        print(t1, id(child1) == id(child2))

    print("o")


# def tmp(x, y, z):
#     print(x, y)``
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
