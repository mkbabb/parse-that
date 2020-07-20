from typing import *
import contextlib

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


# TODO: Properly implement mutation.
# TODO: Generalize and modularize the digging logic.
class MyList:
    def __init__(self, vals: List[T]):
        self.root: Node[T] = Node()
        self.size = 0
        self.mutation = False

        self.mutate()
        for val in vals:
            self.append(val)
        self.mutate()

    @staticmethod
    def __create(root: Node[T], size: int) -> "MyList":
        out = MyList([])
        out.root = root
        out.size = size
        return out

    def depth(self):
        return 0 if self.size == 0 else math.floor(math.log(self.size, WIDTH))

    def mutate(self):
        self.mutation = not self.mutation

    def reduce_node(
        self,
        key: int,
        reducer: Callable[[S, int, int], Node[T]],
        init: S,
        depth: Optional[int] = None,
    ) -> S:
        depth = self.depth() if depth is None else depth

        for level in range(depth, 0, -1):
            ix = (key >> (level * BITS)) & MASK
            init = reducer(init, level, ix)

        return init

    def at(self, key: int):
        leaf_ix = key & MASK

        def reducer(node: Node[T], level: int, ix: int):
            return node.children[ix]

        leaf = self.reduce_node(key, reducer, self.root)
        val = leaf.children[leaf_ix]
        return val

    def append(self, val: T):
        """Three cases when appending, in order initial possibility:
         1. Root overflow: there's no more space in the entire tree: thus we must
         create an entirely new root, whereof's left branch is the current root.

         2. There's no room in the left branch, and the right branch is None: thus we must
         create a right branch and fill its first element with "value".

         3. There's space in the current branch: we simply insert "value" here,
         path copying on the way down.
        """
        root = Node(list(self.root.children)) if not self.mutation else self.root
        size = self.size + 1
        key = self.size
        leaf_ix = key & MASK

        # Root overflow case.
        if is_power_of(self.size, WIDTH):
            root = Node([root])

        def reducer(node: Node[T], level: int, ix: int):
            if node.children[ix] is None:
                node.children[ix] = Node()
            else:
                node.children[ix] = (
                    node.children[ix].copy() if not self.mutation else node.children[ix]
                )
            return node.children[ix]

        leaf = self.reduce_node(key, reducer, root)
        leaf.children[leaf_ix] = val

        if not self.mutation:
            return self.__create(root, size)
        else:
            self.root = root
            self.size = size
            return self

    def pop(self):
        """There's 3[.5] cases when popping, in order of initial possibility:
        1. The right-most leaf node has at least one elements in it: we simply set the right-most
        element therein to None.

        2. The right-most leaf node is all "None"s after popping: we set this entire node to None.

        3. The current size is a power of WIDTH, so therefor an entire branch needs trimming:
        we set the parent node, or previous leaf, equal to the left-most, or zeroth, child leaf.
        
        3a. If the size == WIDTH, we must set the root element equal to the left-most child, or prev_leaf.
        .a case as reference semantics, not logic, force this special case.
        """
        root = Node(list(self.root.children)) if not self.mutation else self.root
        size = self.size - 1
        key = self.size - 1
        leaf_ix = key & MASK

        def reducer(nodes: Tuple[Node[T], Node[T]], level: int, ix: int):
            prev_node, node = nodes

            node.children[ix] = (
                node.children[ix].copy() if not self.mutation else node.children[ix]
            )

            if level == 1 and leaf_ix == 0:
                node.children[ix] = None
                return node, None
            else:
                return node, node.children[ix]

        prev_leaf, leaf = self.reduce_node(key, reducer, (root, root))

        if leaf is not None:
            leaf.children[leaf_ix] = None

        if is_power_of(self.size, WIDTH):
            prev_leaf = prev_leaf.children[0]

        if self.size == WIDTH:
            root = prev_leaf

        if not self.mutation:
            return self.__create(root, size)
        else:
            self.root = root
            self.size = size
            return self

    def copy(self):
        out = self.append(None)
        return out.pop()

    def concat(self, lists: List["MyList"]) -> "MyList":
        base = self.copy() if not self.mutation else self
        mutation = self.mutation

        base.mutation = True
        for sub_list in lists:
            for j in range(sub_list.size):
                base.append(sub_list.at(j))
        base.mutation = mutation

        return base

    def splice(self, start: int, vals: List[T]) -> "MyList":
        base = self.copy() if not self.mutation else self
        mutation = self.mutation
        end = self.size - start
        end_vals: List[T] = []

        base.mutation = True

        for _ in range(end, start, -1):
            val = base.at(base.size - 1)
            end_vals.append(val)
            base.pop()

        for val in vals + list(reversed(end_vals)):
            base.append(val)

        base.mutation = mutation

        return base

    def slice(self, start: Optional[int] = None, end: Optional[int] = None) -> "MyList":
        if start is None:
            out = self.append(None)
            out.mutate()
            out.pop()
            out.mutate()
            return out
        else:
            out_list = []
            if end is None:
                end = self.size + 1
            elif end < 0:
                end += self.size

            for i in range(start, end):
                out_list.append(self.at(i))

            return MyList(out_list)


if __name__ == "__main__":
    l = [0, 1, 2, 3, 4, 5]
    print(l[1:-1])
    l0 = MyList(l)
    l1 = l0.slice()
    # l0 = MyList(list(range(5)))
    # l1 = MyList(list(range(18, 18 * 2)))

    # l3 = l0.splice(1, [99])

    # for i in range(l3.size):
    #     print(l3.at(i))

    # l1 = l0.pop()
    # l2 = l0.pop()

    # for i in range(l1.size):
    #     t1, child1 = l1.at(i)
    #     t2, child2 = l2.at(i)

    #     print(t1, id(child1) == id(child2))

    # print("o")


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
