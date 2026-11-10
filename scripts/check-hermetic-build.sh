#!/bin/sh
# check-hermetic-build.sh — the workspace builds from a clean clone alone (CB-1a).
#
# Three conditions, each read from cargo's own resolution of the graph:
#   1. every path package lives inside this repository (no `../sibling` edge,
#      whether written in a manifest or in a `[patch]` table);
#   2. every git package is pinned to an immutable ref: a `rev`, or an
#      upstream release `tag` (biome's, for the formatter oracle). A branch
#      edge, or an edge with no ref at all, follows whatever the branch
#      points at on the next `cargo update`;
#   3. `cargo check --workspace --all-targets --locked` succeeds.
#
# The Cargo workspace is `rust/`. Run it from any directory inside the
# repository. CI runs it on a fresh checkout with no sibling repositories and
# no credentials, which is the case it exists for. (The same script as
# bbnf-lang's, sk-v27 LW2.TOPO-1; only the workspace directory differs.)
set -eu

root=$(cd "$(git rev-parse --show-toplevel)" && pwd -P)
cd "$root/rust"

meta=$(cargo metadata --locked --format-version 1)

escapes=$(printf '%s' "$meta" | jq -r --arg root "$root/" '
    .packages[]
    | select(.source == null)
    | select(.manifest_path | startswith($root) | not)
    | "  \(.name) \(.version) at \(.manifest_path)"')
unpinned=$(printf '%s' "$meta" | jq -r '
    .packages[]
    | select(.source != null and (.source | startswith("git+")))
    | select(.source | test("[?&](rev|tag)=") | not)
    | "  \(.name) \(.version) from \(.source)"')

status=0
if [ -n "$escapes" ]; then
    echo "path packages outside $root:"
    echo "$escapes"
    status=1
fi
if [ -n "$unpinned" ]; then
    echo "git packages not pinned to a rev or a release tag:"
    echo "$unpinned"
    status=1
fi
[ "$status" -eq 0 ] || exit "$status"

echo "graph: every path package is inside the repository; every git package is pinned to a rev or a release tag"
cargo check --workspace --all-targets --locked
echo "hermetic: clean-clone build GREEN"
