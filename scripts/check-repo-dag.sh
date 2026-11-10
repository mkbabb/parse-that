#!/bin/sh
# check-repo-dag.sh — the three-repository crate graph is a DAG (ruling X-5).
#
# The programme's repositories are pprint, parse-that and bbnf-lang. Their
# crates may depend on one another only along
#
#     parse-that -> pprint      bbnf-lang -> parse-that      bbnf-lang -> pprint
#
# so pprint is the leaf, parse-that sits on it, and bbnf-lang sits on both.
# Any other cross-repository edge is a reverse edge: it makes the repositories
# a cycle, so no one of them can be built, tested or published first.
#
# The graph is read from cargo's own resolution, never from manifest text:
# `cargo metadata --locked --all-features` over every Cargo workspace this
# repository commits (each tracked Cargo.lock, minus the archived record
# trees, which are records and are never built). Each resolved package is
# mapped to the repository it comes from:
#   - a path package inside this repository belongs to this repository;
#   - a git package belongs to the github.com/mkbabb/<repo> its source names;
#   - a registry package belongs to the repository its `repository` field names.
# Packages from any other repository are outside the programme and carry no
# edge. Every resolved dependency between two programme repositories must be
# one of the three edges above.
#
# Run it from any directory inside the repository. It needs network access
# for git and registry sources, and no credentials.
set -eu

root=$(cd "$(git rev-parse --show-toplevel)" && pwd -P)
cd "$root"
# This repository's name in the programme (the one line that differs between
# the three copies of this script).
self=parse-that

# Every committed Cargo workspace, outside the record trees.
workspaces=$(git ls-files -- '*Cargo.lock' 'Cargo.lock' \
    | grep -vE '^(restart|docs)/' \
    | sed -e 's#/\{0,1\}Cargo\.lock$##' -e 's#^$#.#' \
    | sort -u)

status=0
for ws in $workspaces; do
    if ! meta=$(cd "$root/$ws" && cargo metadata --locked --all-features --format-version 1); then
        echo "workspace $ws:"
        echo "  UNRESOLVED: cargo metadata --locked failed (the graph cannot be read)"
        status=1
        continue
    fi
    report=$(printf '%s' "$meta" | jq -r --arg root "$root/" --arg self "$self" '
        def repo_of_url:
            [ capture("github\\.com[/:]mkbabb/(?<r>[A-Za-z0-9_-]+)").r | ascii_downcase ]
            | first // null;
        def programme: . == "bbnf-lang" or . == "parse-that" or . == "pprint";
        def repo_of:
            if .source == null then
                (if (.manifest_path | startswith($root)) then $self else "outside:" + .manifest_path end)
            elif (.source | startswith("git+")) then (.source | repo_of_url)
            else ((.repository // "") | repo_of_url)
            end;
        (.packages | map({key: .id, value: (repo_of // "external")}) | from_entries) as $repo
        | (.packages | map({key: .id, value: .name}) | from_entries) as $name
        | [ .resolve.nodes[] as $n
            | $n.deps[]
            | {from: $repo[$n.id], to: $repo[.pkg], pkg: $n.id, dep: .pkg} ]
        | map(select(.from != .to))
        | (map(select((.from | programme) and (.to | programme)))
           | map(.allowed = ([.from, .to] as $e
                 | $e == ["parse-that", "pprint"]
                   or $e == ["bbnf-lang", "parse-that"]
                   or $e == ["bbnf-lang", "pprint"]))) as $edges
        | (map(select((.from | startswith("outside:")) or (.to | startswith("outside:"))))) as $escapes
        | ($edges | map(select(.allowed)) | map("  edge \(.from) -> \(.to)") | unique[]),
          ($edges | map(select(.allowed | not))
           | map("  REVERSE \(.from) -> \(.to): \($name[.pkg]) depends on \($name[.dep])")
           | unique[]),
          ($escapes | map("  ESCAPE \($name[.pkg]) -> \($name[.dep]) (a path package outside the repository)")
           | unique[])')
    echo "workspace $ws:"
    if [ -n "$report" ]; then echo "$report"; else echo "  no cross-repository edge"; fi
    if printf '%s\n' "$report" | grep -qE 'REVERSE|ESCAPE'; then status=1; fi
done

if [ "$status" -ne 0 ]; then
    echo "repo DAG: RED (a reverse or escaping edge; allowed: parse-that -> pprint, bbnf-lang -> parse-that, bbnf-lang -> pprint)"
    exit 1
fi
echo "repo DAG: GREEN (every cross-repository edge is parse-that -> pprint, bbnf-lang -> parse-that or bbnf-lang -> pprint)"
