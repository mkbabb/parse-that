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
    def __init__(self, children: Optional[list] = None):
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
        self.leaf: Optional[Node[T]] = None

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

    def depth(self) -> int:
        return 0 if self.size == 0 else math.floor(math.log(self.size, WIDTH))

    def mutate(self) -> None:
        self.mutation = not self.mutation

    def reduce_node(
        self,
        key: int,
        reducer: Callable[[S, int, int], S],
        init: S,
        depth: Optional[int] = None,
    ) -> S:
        """Low-level list reduction API.

        Args:
            key (int): leaf child key index. For example, if you wanted to grab the last element
            of an array of n elements, key = n.
            reducer (Callable[[S, int, int], S]): Reduction function that requires:
                a reducer value of type S,
                the current level in the tree **(0-indexed from the bottom up)**,
                a current index into said level. 
            init (S): initial value to reduce upon.
            depth (Optional[int], optional): depth to traverse down to. Defaults to the list's max depth.

        Returns:
            S: the reduced value.
        """
        depth = self.depth() if depth is None else depth

        for level in range(depth, 0, -1):
            ix = (key >> (level * BITS)) & MASK
            init = reducer(init, level, ix)

        return init

    def at(self, key: int) -> T:
        """Returns an element located at index `key`.
        """
        leaf_ix = key & MASK

        def reducer(node: Node[T], level: int, ix: int) -> Node[T]:
            return node.children[ix]

        leaf = self.reduce_node(key, reducer, self.root)
        val = leaf.children[leaf_ix]
        self.leaf = leaf
        return val

    def append(self, val: T) -> "MyList":
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

        def reducer(node: Node[T], level: int, ix: int) -> Node[T]:
            if node.children[ix] is None:
                node.children[ix] = Node()
            else:
                # Path copying.
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

    def pop(self) -> "MyList":
        """There's 3.5 cases when popping, in order of initial possibility:
        1. The right-most leaf node has at least one element in it: we simply set it to None.

        2. The right-most leaf node is all "None"s after popping: we set this entire node to None.

        3. The current size is a power of WIDTH, therefore an entire branch needs trimming:
        we set the parent node, or previous leaf, equal to the left-most, or zeroth, child leaf.
        
        3a. If the size == WIDTH, we must set the root element equal to the left-most child, or prev_leaf.
            Denoted as an "a" case as reference semantics, not logic, force this special case.
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

            # Case 2.
            # If we're at the last level and our index to pop is the zeroth one
            # we delete the entire branch. This is easier to detect inside the
            # reduction.
            if level == 1 and leaf_ix == 0:
                node.children[ix] = None
                return node, None
            else:
                return node, node.children[ix]

        prev_leaf, leaf = self.reduce_node(key, reducer, (root, root))

        # Case 1.
        if leaf is not None:
            leaf.children[leaf_ix] = None

        # Case 3.
        if is_power_of(self.size, WIDTH):
            prev_leaf = prev_leaf.children[0]

        # Case 3a.
        if self.size == WIDTH:
            root = prev_leaf

        if not self.mutation:
            return self.__create(root, size)
        else:
            self.root = root
            self.size = size
            return self

    def copy(self) -> "MyList":
        out = self.append(None)
        return out.pop()

    def concat(self, *args: "MyList") -> "MyList":
        lists = list(args)
        base = self.copy() if not self.mutation else self
        mutation = self.mutation

        base.mutation = True
        for sub_list in lists:
            for j in range(sub_list.size):
                base.append(sub_list.at(j))
        base.mutation = mutation

        return base

    def splice(self, start: int, vals: List[T]) -> "MyList":
        """Split the list into two halves, starting at `start`,
        then insert all values in `vals` into the middle. Finally,
        rejoin the three lists into one and return.
        """
        out_list: List[T] = []

        for i in range(start):
            out_list.append(self.at(i))

        out_list += vals

        for i in range(start, self.size):
            out_list.append(self.at(i))

        return MyList(out_list)

    def slice(self, start: Optional[int] = None, end: Optional[int] = None) -> "MyList":
        """Slice the list into a section starting at `start` and ending at `end`.
        If start is None, return a copy.
        If end is None, end = self.size + 1.
        If end is < 0, end's value wraps around; end += self.size.
        """
        if start is None:
            return self.copy()
        else:
            out_list: List[T] = []
            if end is None:
                end = self.size + 1
            elif end < 0:
                end += self.size

            for i in range(start, end):
                out_list.append(self.at(i))

            return MyList(out_list)

    def for_each(
        self, func: Callable[[T, int], None], start: int = 0, end: Optional[int] = None,
    ) -> None:
        """Optimized iteration over the list: we save the leaf node value to reuse as long
        as we can, or until the current index & MASK == 0. Asymptotically equivalent to the
        naïve self.at loop, but more efficient in practice. 

        Args:
            func (Callable[[T, int], None]): callback that accepts:
            the current value,
            the current index?.
            start (int): starting position, defaults to 0.
            end (Optional[int]): ending position, defaults to self.size. If end < 0, end += self.size.

        """
        self.leaf = None
        end = self.size if end is None else end + self.size if end < 0 else end

        for i in range(start, end):
            leaf_ix = i & MASK

            if leaf_ix == 0 or self.leaf is None:
                curr_val: T = self.at(i)
                func(curr_val, i)
            else:
                curr_val = self.leaf.children[leaf_ix]
                func(curr_val, i)

    def reduce(self, func: Callable[[S, T], S], init: Optional[T] = None) -> S:
        start = 0

        if init is None:
            start = 1
            init = self.at(0)

        acc: S = cast(S, init)

        def _func(curr_val: T, i: int) -> None:
            nonlocal acc
            acc = func(acc, curr_val)

        self.for_each(_func, start)

        return acc


if __name__ == "__main__":
    l = [0, 1, 2, 3, 4, 5]
    print(l[1:-1])
    l0 = MyList(l)
    l1 = l0.splice(1, [99])

    s = l1.reduce(lambda x, y: x + y)
    print(s)
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
