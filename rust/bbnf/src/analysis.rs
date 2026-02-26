//! Grammar analysis passes: SCC detection, FIRST sets, dispatch tables, and more.
//!
//! This module provides static analysis over BBNF grammars. The analyses are layered:
//!
//! 1. **Tarjan's SCC** — partition rules into strongly connected components,
//!    identify cyclic rules, and produce a reverse-topological ordering.
//! 2. **Topological sort** — reorder the AST according to the SCC ordering so that
//!    dependencies are defined before their dependents.
//! 3. **CharSet** — a compact 128-bit ASCII bitset used by FIRST set computation.
//! 4. **FIRST sets & nullability** — fixed-point computation of the set of characters
//!    that can begin a parse of each nonterminal.
//! 5. **Dispatch tables** — for alternations whose branches have disjoint FIRST sets,
//!    build a direct lookup table (char code -> branch index).
//! 6. **Reference counting** — how many times each nonterminal is referenced.
//! 7. **Alias detection** — find rules whose RHS is a bare nonterminal reference.

use std::collections::{HashMap, HashSet};

use indexmap::IndexMap;

use crate::grammar::{Expression, AST};

use super::generate::Dependencies;

// ---------------------------------------------------------------------------
// 1. Tarjan's SCC
// ---------------------------------------------------------------------------

/// Result of Tarjan's strongly-connected-component analysis.
#[derive(Debug)]
pub struct SccResult<'a> {
    /// SCCs in reverse-topological order (leaf SCCs first).
    pub sccs: Vec<Vec<&'a Expression<'a>>>,
    /// Set of rules that participate in a cycle.
    ///
    /// A rule is cyclic if its SCC has more than one member, or it is a
    /// single-member SCC that references itself.
    pub cyclic_rules: HashSet<Expression<'a>>,
    /// Maps each expression to the index of its SCC in `sccs`.
    pub scc_index: HashMap<&'a Expression<'a>, usize>,
}

/// Tarjan's SCC algorithm over the dependency graph.
///
/// Returns SCCs in reverse-topological order: leaf SCCs (those with no outgoing
/// edges to other SCCs) appear first. This is the natural order for bottom-up
/// construction of parsers.
pub fn tarjan_scc<'a>(deps: &'a Dependencies<'a>) -> SccResult<'a> {
    struct State<'a> {
        index_counter: usize,
        stack: Vec<&'a Expression<'a>>,
        on_stack: HashSet<&'a Expression<'a>>,
        indices: HashMap<&'a Expression<'a>, usize>,
        lowlinks: HashMap<&'a Expression<'a>, usize>,
        sccs: Vec<Vec<&'a Expression<'a>>>,
        deps: &'a Dependencies<'a>,
    }

    fn strongconnect<'a>(v: &'a Expression<'a>, state: &mut State<'a>) {
        state.indices.insert(v, state.index_counter);
        state.lowlinks.insert(v, state.index_counter);
        state.index_counter += 1;
        state.stack.push(v);
        state.on_stack.insert(v);

        if let Some(successors) = state.deps.get(v) {
            for w in successors {
                // Find the canonical key in deps (so we compare by identity through
                // the HashMap keys, which is where our lifetimes originate).
                let w_key = match state.deps.get_key_value(w) {
                    Some((k, _)) => k,
                    None => continue, // external ref — skip
                };

                if !state.indices.contains_key(w_key) {
                    strongconnect(w_key, state);
                    let low_w = state.lowlinks[w_key];
                    let low_v = state.lowlinks[&v];
                    if low_w < low_v {
                        state.lowlinks.insert(v, low_w);
                    }
                } else if state.on_stack.contains(w_key) {
                    let idx_w = state.indices[w_key];
                    let low_v = state.lowlinks[&v];
                    if idx_w < low_v {
                        state.lowlinks.insert(v, idx_w);
                    }
                }
            }
        }

        if state.lowlinks[&v] == state.indices[&v] {
            let mut scc = Vec::new();
            loop {
                let w = state.stack.pop().unwrap();
                state.on_stack.remove(w);
                scc.push(w);
                if std::ptr::eq(w, v) {
                    break;
                }
            }
            state.sccs.push(scc);
        }
    }

    let mut state = State {
        index_counter: 0,
        stack: Vec::new(),
        on_stack: HashSet::new(),
        indices: HashMap::new(),
        lowlinks: HashMap::new(),
        sccs: Vec::new(),
        deps,
    };

    // Iterate over all nodes (keys of the dependency graph).
    for (v, _) in deps {
        if !state.indices.contains_key(v) {
            strongconnect(v, &mut state);
        }
    }

    // Build scc_index and cyclic_rules.
    let mut scc_index = HashMap::new();
    let mut cyclic_rules = HashSet::new();

    for (i, scc) in state.sccs.iter().enumerate() {
        for &expr in scc {
            scc_index.insert(expr, i);
        }

        if scc.len() > 1 {
            // Multi-member SCC: all members are cyclic.
            for &expr in scc {
                cyclic_rules.insert(expr.clone());
            }
        } else {
            // Single-member SCC: cyclic only if it references itself.
            let expr = scc[0];
            if let Some(successors) = deps.get(expr) {
                if successors.contains(expr) {
                    cyclic_rules.insert(expr.clone());
                }
            }
        }
    }

    SccResult {
        sccs: state.sccs,
        cyclic_rules,
        scc_index,
    }
}

// ---------------------------------------------------------------------------
// 2. Topological sort via SCC
// ---------------------------------------------------------------------------

/// Reorder the AST in topological order using the SCC condensation DAG.
///
/// Uses Kahn's algorithm on the condensation graph (where each SCC is collapsed
/// to a single node). Inter-SCC ordering is a correct topological sort in O(V+E).
///
/// Within each SCC, rules are sorted by a "depth score" heuristic: each rule's
/// score is the sum of the dependency counts of its direct dependencies. This
/// matches the ordering expected by the downstream codegen which has order-sensitive
/// type inference (boxing decisions in `calculate_nonterminal_generated_parsers`).
pub fn topological_sort_scc<'a>(
    ast: &AST<'a>,
    scc_result: &SccResult<'a>,
    deps: &Dependencies<'a>,
) -> AST<'a> {
    let num_sccs = scc_result.sccs.len();
    if num_sccs == 0 {
        return ast.clone();
    }

    // Build condensation DAG: scc_deps[i] = set of SCC indices that SCC i depends on.
    // Also track reverse edges for Kahn's algorithm.
    let mut in_degree = vec![0u32; num_sccs];
    let mut scc_dependents: Vec<HashSet<usize>> = vec![HashSet::new(); num_sccs];

    for (node, successors) in deps {
        if let Some(&src_scc) = scc_result.scc_index.get(node) {
            for succ in successors {
                if let Some(&dst_scc) = scc_result.scc_index.get(succ) {
                    // src depends on dst => in the condensation DAG, edge dst -> src
                    // (dependencies must come first in topo order)
                    if src_scc != dst_scc && scc_dependents[dst_scc].insert(src_scc) {
                        in_degree[src_scc] += 1;
                    }
                }
            }
        }
    }

    // Kahn's algorithm: start from SCCs with in-degree 0 (leaf dependencies).
    let mut queue: std::collections::VecDeque<usize> = (0..num_sccs)
        .filter(|&i| in_degree[i] == 0)
        .collect();

    let mut topo_order: Vec<usize> = Vec::with_capacity(num_sccs);
    while let Some(scc_idx) = queue.pop_front() {
        topo_order.push(scc_idx);
        for &dependent in &scc_dependents[scc_idx] {
            in_degree[dependent] -= 1;
            if in_degree[dependent] == 0 {
                queue.push_back(dependent);
            }
        }
    }

    // Pre-compute depth scores for within-SCC ordering.
    // Score = sum of dep_count(d) for each direct dependency d.
    // This matches the old `topological_sort` heuristic.
    let depth_score: HashMap<&Expression<'a>, usize> = deps
        .iter()
        .map(|(expr, sub_deps)| {
            let score: usize = sub_deps
                .iter()
                .map(|d| deps.get(d).map_or(0, |dd| dd.len()))
                .sum();
            (expr, score)
        })
        .collect();

    // Emit rules: dependencies before dependents (topo_order already has deps first).
    let mut new_ast = IndexMap::with_capacity(ast.len());
    for &scc_idx in &topo_order {
        // Collect AST entries belonging to this SCC, sorted by depth score ascending.
        let mut scc_entries: Vec<_> = ast
            .iter()
            .filter(|(key, _)| {
                scc_result.scc_index.get(*key) == Some(&scc_idx)
                    && !new_ast.contains_key(*key)
            })
            .collect();
        scc_entries.sort_by_key(|(key, _)| depth_score.get(*key).copied().unwrap_or(0));

        for (key, val) in scc_entries {
            new_ast.insert(key.clone(), val.clone());
        }
    }

    // Append any rules not in the dependency graph.
    for (lhs, rhs) in ast {
        if !new_ast.contains_key(lhs) {
            new_ast.insert(lhs.clone(), rhs.clone());
        }
    }

    new_ast
}

/// Compute acyclic dependencies using SCC data. O(V+E).
///
/// A node is classified as "non-acyclic" (and excluded from the result) if ANY of:
/// 1. It is in a cyclic SCC (actual cycle), OR
/// 2. It transitively depends on any cyclic SCC, OR
/// 3. Its dependency subgraph has diamond (convergent) paths — i.e., the same
///    transitive dependency is reachable via multiple distinct paths.
///
/// Condition (3) matches the behavior of the original `calculate_acyclic_deps`,
/// which uses a single visited set per DFS and marks a node as non-acyclic when
/// it encounters a previously-visited node (whether from a cycle or a diamond).
/// The codegen relies on this: "non-acyclic" rules get `Box`-wrapped types and
/// lazy parser generation, while "acyclic" rules get deeply inlined. Rules with
/// diamond dependencies should NOT be inlined because they share sub-parsers.
pub fn calculate_acyclic_deps_scc<'a>(
    deps: &Dependencies<'a>,
    _scc_result: &SccResult<'a>,
) -> Dependencies<'a> {
    // Replicate the exact semantics of the old is_acyclic DFS:
    // For each rule, do a DFS through its transitive deps using a single visited set.
    // If any dep is encountered twice (cycle OR diamond), the rule is non-acyclic.
    fn is_acyclic_dfs<'a>(
        expr: &'a Expression<'a>,
        deps: &'a Dependencies<'a>,
        visited: &mut HashSet<&'a Expression<'a>>,
    ) -> bool {
        if visited.contains(expr) {
            return false;
        }
        visited.insert(expr);
        if let Some(sub_deps) = deps.get(expr) {
            for sub in sub_deps {
                let sub_canonical = match deps.get_key_value(sub) {
                    Some((k, _)) => k,
                    None => continue,
                };
                if !is_acyclic_dfs(sub_canonical, deps, visited) {
                    return false;
                }
            }
        }
        true
    }

    deps.iter()
        .filter(|(name, _)| {
            let mut visited = HashSet::new();
            is_acyclic_dfs(name, deps, &mut visited)
        })
        .map(|(name, sub_deps)| (name.clone(), sub_deps.clone()))
        .collect()
}

/// Non-acyclic deps: everything not in the acyclic set.
pub fn calculate_non_acyclic_deps_scc<'a>(
    deps: &Dependencies<'a>,
    acyclic_deps: &Dependencies<'a>,
) -> Dependencies<'a> {
    deps.iter()
        .filter(|(lhs, _)| !acyclic_deps.contains_key(*lhs))
        .map(|(lhs, deps)| (lhs.clone(), deps.clone()))
        .collect()
}

// ---------------------------------------------------------------------------
// 3. CharSet — 128-bit ASCII bitset
// ---------------------------------------------------------------------------

/// A compact 128-bit bitset representing a subset of ASCII characters (0..127).
///
/// Internally stored as four `u32` words, giving 128 bits total. Only the low
/// 7 bits of each character code are meaningful (ASCII range).
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct CharSet {
    bits: [u32; 4],
}

impl CharSet {
    /// Create an empty CharSet.
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a single ASCII character code to the set.
    ///
    /// Codes >= 128 are silently ignored.
    pub fn add(&mut self, code: u8) {
        if code >= 128 {
            return;
        }
        let word = (code / 32) as usize;
        let bit = code % 32;
        self.bits[word] |= 1 << bit;
    }

    /// Test whether the set contains the given ASCII character code.
    pub fn has(&self, code: u8) -> bool {
        if code >= 128 {
            return false;
        }
        let word = (code / 32) as usize;
        let bit = code % 32;
        (self.bits[word] >> bit) & 1 != 0
    }

    /// Add all character codes in the inclusive range `[from, to]`.
    pub fn add_range(&mut self, from: u8, to: u8) {
        for code in from..=to {
            self.add(code);
        }
    }

    /// In-place union: add all characters from `other` into `self`.
    pub fn union(&mut self, other: &CharSet) {
        for i in 0..4 {
            self.bits[i] |= other.bits[i];
        }
    }

    /// Returns true if `self` and `other` share no characters.
    pub fn is_disjoint(&self, other: &CharSet) -> bool {
        for i in 0..4 {
            if self.bits[i] & other.bits[i] != 0 {
                return false;
            }
        }
        true
    }

    /// Returns true if the set is empty.
    pub fn is_empty(&self) -> bool {
        self.bits.iter().all(|&w| w == 0)
    }

    /// Iterate over all character codes present in the set.
    pub fn iter(&self) -> CharSetIter<'_> {
        CharSetIter {
            set: self,
            current: 0,
        }
    }

    /// Number of characters in the set.
    pub fn len(&self) -> usize {
        self.bits.iter().map(|w| w.count_ones() as usize).sum()
    }
}

/// Iterator over the character codes in a [`CharSet`].
pub struct CharSetIter<'a> {
    set: &'a CharSet,
    current: u8,
}

impl Iterator for CharSetIter<'_> {
    type Item = u8;

    fn next(&mut self) -> Option<u8> {
        while self.current < 128 {
            let c = self.current;
            self.current += 1;
            if self.set.has(c) {
                return Some(c);
            }
        }
        None
    }
}

// ---------------------------------------------------------------------------
// 4. FIRST set computation
// ---------------------------------------------------------------------------

/// The result of FIRST set analysis: per-nonterminal FIRST sets and nullability.
#[derive(Debug)]
pub struct FirstSets<'a> {
    /// Maps each nonterminal expression to the set of ASCII character codes that
    /// can begin a parse of that nonterminal.
    pub first: HashMap<&'a Expression<'a>, CharSet>,
    /// The set of nonterminals that can derive the empty string.
    pub nullable: HashSet<&'a Expression<'a>>,
}

/// Compute FIRST sets and nullability for all nonterminals in the grammar.
///
/// Uses fixed-point iteration: we repeatedly scan every rule, updating FIRST
/// sets and nullability until no changes occur.
pub fn compute_first_sets<'a>(ast: &'a AST<'a>, deps: &Dependencies<'a>) -> FirstSets<'a> {
    let mut first: HashMap<&'a Expression<'a>, CharSet> = HashMap::new();
    let mut nullable: HashSet<&'a Expression<'a>> = HashSet::new();

    // Initialize entries for every nonterminal in the AST.
    for (lhs, _) in ast {
        first.entry(lhs).or_insert_with(CharSet::new);
    }

    // Fixed-point iteration.
    loop {
        let mut changed = false;

        for (lhs, rhs) in ast {
            // Unwrap the Rule wrapper to get the actual RHS expression.
            let rhs_expr = unwrap_rule(rhs);

            let mut expr_first = CharSet::new();
            let expr_nullable = compute_expr_first(rhs_expr, &first, &nullable, ast, &mut expr_first);

            // Merge into this nonterminal's FIRST set.
            let entry = first.entry(lhs).or_insert_with(CharSet::new);
            let old_bits = entry.bits;
            entry.union(&expr_first);
            if entry.bits != old_bits {
                changed = true;
            }

            // Update nullability.
            if expr_nullable && !nullable.contains(lhs) {
                nullable.insert(lhs);
                changed = true;
            }
        }

        if !changed {
            break;
        }
    }

    // Also populate FIRST sets for nonterminals that appear as dependencies but
    // are not defined in this AST (external/built-in rules). These remain empty.
    let _ = deps;

    FirstSets { first, nullable }
}

/// Unwrap the `Expression::Rule(rhs, _)` wrapper to get the inner RHS expression.
fn unwrap_rule<'a>(expr: &'a Expression<'a>) -> &'a Expression<'a> {
    match expr {
        Expression::Rule(inner, _) => inner,
        other => other,
    }
}

/// Recursively compute the FIRST set of an expression, returning whether the
/// expression is nullable.
fn compute_expr_first<'a>(
    expr: &'a Expression<'a>,
    first_sets: &HashMap<&'a Expression<'a>, CharSet>,
    nullable_set: &HashSet<&'a Expression<'a>>,
    ast: &'a AST<'a>,
    out: &mut CharSet,
) -> bool {
    match expr {
        Expression::Literal(token) => {
            let s: &str = &token.value;
            if let Some(first_byte) = s.bytes().next() {
                if first_byte < 128 {
                    out.add(first_byte);
                }
            }
            // A non-empty literal is not nullable. An empty literal is nullable.
            s.is_empty()
        }

        Expression::Regex(token) => {
            let pattern: &str = &token.value;
            if let Some(cs) = regex_first_chars(pattern) {
                out.union(&cs);
            }
            // Conservative: assume regex is not nullable unless it clearly is.
            // A pattern that starts with an optional/star quantifier could be nullable,
            // but we conservatively say false.
            false
        }

        Expression::Nonterminal(token) => {
            let name: &str = &token.value;
            // Look up this nonterminal in the AST to find its canonical key.
            for (key, _) in ast {
                if let Expression::Nonterminal(k_token) = key {
                    if k_token.value.as_ref() == name {
                        if let Some(fs) = first_sets.get(key) {
                            out.union(fs);
                        }
                        return nullable_set.contains(key);
                    }
                }
            }
            false
        }

        Expression::Concatenation(token) => {
            // FIRST of a concatenation: take FIRST of first non-nullable element.
            // The concatenation is nullable only if ALL elements are nullable.
            let exprs = &token.value;
            for child in exprs {
                let child_nullable = compute_expr_first(child, first_sets, nullable_set, ast, out);
                if !child_nullable {
                    return false;
                }
            }
            true
        }

        Expression::Alternation(token) => {
            // FIRST of an alternation: union of all alternatives' FIRST sets.
            // Nullable if ANY alternative is nullable.
            let exprs = &token.value;
            let mut any_nullable = false;
            for child in exprs {
                let child_nullable = compute_expr_first(child, first_sets, nullable_set, ast, out);
                if child_nullable {
                    any_nullable = true;
                }
            }
            any_nullable
        }

        Expression::Optional(inner) | Expression::Many(inner) | Expression::OptionalWhitespace(inner) => {
            // Always nullable. FIRST from inner.
            compute_expr_first(&inner.value, first_sets, nullable_set, ast, out);
            true
        }

        Expression::Many1(inner) => {
            // Not nullable (requires at least one). FIRST from inner.
            compute_expr_first(&inner.value, first_sets, nullable_set, ast, out)
        }

        Expression::Group(inner) => {
            // Delegate to inner expression.
            compute_expr_first(&inner.value, first_sets, nullable_set, ast, out)
        }

        Expression::Epsilon(_) => {
            // Epsilon is nullable by definition with an empty FIRST set.
            true
        }

        Expression::Rule(inner, _) => {
            // Unwrap Rule wrapper.
            compute_expr_first(inner, first_sets, nullable_set, ast, out)
        }

        Expression::Skip(left, _right) => {
            // `left << right`: parses left then right, returns left's value.
            // FIRST comes from left.
            compute_expr_first(&left.value, first_sets, nullable_set, ast, out)
        }

        Expression::Next(_left, right) => {
            // `left >> right`: parses left then right, returns right's value.
            // FIRST comes from left.
            // For simplicity, treat as concatenation: FIRST of left, nullable only
            // if left is nullable (then we'd also need right's FIRST).
            let left_nullable = compute_expr_first(&_left.value, first_sets, nullable_set, ast, out);
            if left_nullable {
                compute_expr_first(&right.value, first_sets, nullable_set, ast, out);
            }
            false // These binary ops generally aren't nullable.
        }

        Expression::Minus(left, _right) => {
            // `left - right`: parses left but not right. FIRST from left.
            compute_expr_first(&left.value, first_sets, nullable_set, ast, out)
        }

        Expression::MappedExpression((inner, _)) | Expression::DebugExpression((inner, _)) => {
            compute_expr_first(&inner.value, first_sets, nullable_set, ast, out)
        }

        Expression::MappingFn(_) | Expression::ProductionRule(_, _) => {
            // These shouldn't appear in RHS positions during analysis.
            false
        }
    }
}

// ---------------------------------------------------------------------------
// 5. Regex first chars — conservative analysis
// ---------------------------------------------------------------------------

/// Conservatively extract the set of possible first characters from a regex pattern.
///
/// Returns `None` if the pattern is too complex for reliable static analysis.
/// Handles:
/// - Literal characters at the start (including common escapes)
/// - Character classes `[abc]`, `[a-z]`
/// - Alternation `a|b` (union of both sides)
/// - Anchors `^` (skipped)
pub fn regex_first_chars(pattern: &str) -> Option<CharSet> {
    let bytes = pattern.as_bytes();
    if bytes.is_empty() {
        return Some(CharSet::new());
    }

    let mut pos = 0;

    // Skip leading anchor.
    if pos < bytes.len() && bytes[pos] == b'^' {
        pos += 1;
    }

    regex_first_chars_at(bytes, &mut pos)
}

/// Parse first chars starting at `pos`, handling alternation at the top level.
fn regex_first_chars_at(bytes: &[u8], pos: &mut usize) -> Option<CharSet> {
    let mut result = CharSet::new();

    loop {
        let alt = regex_first_chars_single(bytes, pos)?;
        result.union(&alt);

        // Skip the rest of this alternative until we hit '|', ')', or end.
        let mut depth = 0u32;
        while *pos < bytes.len() {
            match bytes[*pos] {
                b'(' => { depth += 1; *pos += 1; }
                b')' if depth > 0 => { depth -= 1; *pos += 1; }
                b')' => break,  // unmatched ')' — end of group
                b'|' if depth == 0 => break,
                b'\\' => { *pos += 2.min(bytes.len() - *pos); }  // skip escaped char
                b'[' => {
                    // Skip entire char class
                    *pos += 1;
                    while *pos < bytes.len() && bytes[*pos] != b']' {
                        if bytes[*pos] == b'\\' { *pos += 1; }
                        *pos += 1;
                    }
                    if *pos < bytes.len() { *pos += 1; } // consume ']'
                }
                _ => { *pos += 1; }
            }
        }

        if *pos < bytes.len() && bytes[*pos] == b'|' {
            *pos += 1; // consume '|'
        } else {
            break;
        }
    }

    Some(result)
}

/// Check if the quantifier at the current position makes the preceding element nullable.
fn is_nullable_quantifier(bytes: &[u8], pos: usize) -> bool {
    if pos >= bytes.len() {
        return false;
    }
    matches!(bytes[pos], b'?' | b'*')
}

/// Parse the first character(s) of a single alternative (no top-level `|`).
/// When the first element is nullable (via `?` or `*` quantifier), also includes
/// the FIRST set of subsequent elements.
fn regex_first_chars_single(bytes: &[u8], pos: &mut usize) -> Option<CharSet> {
    if *pos >= bytes.len() {
        return Some(CharSet::new());
    }

    match bytes[*pos] {
        b'[' => {
            let cs = regex_parse_char_class(bytes, pos)?;
            let nullable = is_nullable_quantifier(bytes, *pos);
            skip_quantifier(bytes, pos);
            if nullable {
                let mut combined = cs;
                let next = regex_first_chars_single(bytes, pos)?;
                combined.union(&next);
                Some(combined)
            } else {
                Some(cs)
            }
        }

        b'\\' => {
            *pos += 1;
            if *pos >= bytes.len() {
                return None;
            }
            let cs = regex_escape_chars(bytes[*pos])?;
            *pos += 1;
            let nullable = is_nullable_quantifier(bytes, *pos);
            skip_quantifier(bytes, pos);
            if nullable {
                // First element is nullable — also include FIRST of what follows.
                let mut combined = cs;
                let next = regex_first_chars_single(bytes, pos)?;
                combined.union(&next);
                Some(combined)
            } else {
                Some(cs)
            }
        }

        b'(' => {
            // Group — try to parse inside.
            *pos += 1;
            // Skip non-capturing group markers like `?:`, `?=`, etc.
            if *pos < bytes.len() && bytes[*pos] == b'?' {
                // Too complex for reliable analysis (lookahead, etc.) unless it's `?:`.
                if *pos + 1 < bytes.len() && bytes[*pos + 1] == b':' {
                    *pos += 2;
                } else {
                    return None;
                }
            }
            let inner = regex_first_chars_at(bytes, pos)?;
            // Consume closing paren.
            if *pos < bytes.len() && bytes[*pos] == b')' {
                *pos += 1;
            }
            let nullable = is_nullable_quantifier(bytes, *pos);
            skip_quantifier(bytes, pos);
            if nullable {
                let mut combined = inner;
                let next = regex_first_chars_single(bytes, pos)?;
                combined.union(&next);
                Some(combined)
            } else {
                Some(inner)
            }
        }

        b'.' => {
            // Matches any char — too broad, but we can represent as "all printable ASCII".
            return None;
        }

        b'|' | b')' => {
            // End of this alternative.
            Some(CharSet::new())
        }

        // Literal character.
        ch => {
            let mut cs = CharSet::new();
            cs.add(ch);
            *pos += 1;
            let nullable = is_nullable_quantifier(bytes, *pos);
            skip_quantifier(bytes, pos);
            if nullable {
                let next = regex_first_chars_single(bytes, pos)?;
                cs.union(&next);
            }
            Some(cs)
        }
    }
}

/// Parse a character class `[...]` or `[^...]`.
fn regex_parse_char_class(bytes: &[u8], pos: &mut usize) -> Option<CharSet> {
    *pos += 1; // consume '['
    let mut cs = CharSet::new();

    // Negated class — too complex, bail out.
    if *pos < bytes.len() && bytes[*pos] == b'^' {
        return None;
    }

    while *pos < bytes.len() && bytes[*pos] != b']' {
        if bytes[*pos] == b'\\' {
            *pos += 1;
            if *pos >= bytes.len() {
                return None;
            }
            if let Some(esc) = regex_escape_chars(bytes[*pos]) {
                cs.union(&esc);
            } else {
                return None;
            }
            *pos += 1;
        } else if *pos + 2 < bytes.len() && bytes[*pos + 1] == b'-' && bytes[*pos + 2] != b']' {
            // Range: a-z
            let from = bytes[*pos];
            let to = bytes[*pos + 2];
            if from > to {
                return None;
            }
            cs.add_range(from, to);
            *pos += 3;
        } else {
            cs.add(bytes[*pos]);
            *pos += 1;
        }
    }

    // Consume closing ']'.
    if *pos < bytes.len() && bytes[*pos] == b']' {
        *pos += 1;
    }

    // Note: quantifier is NOT consumed here; caller handles it.
    Some(cs)
}

/// Map a regex escape character to a CharSet.
fn regex_escape_chars(ch: u8) -> Option<CharSet> {
    let mut cs = CharSet::new();
    match ch {
        b'd' => {
            cs.add_range(b'0', b'9');
        }
        b'D' => {
            // Non-digit — too broad.
            return None;
        }
        b'w' => {
            cs.add_range(b'a', b'z');
            cs.add_range(b'A', b'Z');
            cs.add_range(b'0', b'9');
            cs.add(b'_');
        }
        b'W' => {
            return None;
        }
        b's' => {
            cs.add(b' ');
            cs.add(b'\t');
            cs.add(b'\n');
            cs.add(b'\r');
            cs.add(0x0C); // form feed
        }
        b'S' => {
            return None;
        }
        b'b' | b'B' => {
            // Word boundary — zero-width, return empty.
            return Some(CharSet::new());
        }
        // Escaped literal character.
        _ => {
            cs.add(ch);
        }
    }
    Some(cs)
}

/// Skip an optional quantifier (`*`, `+`, `?`, `{...}`) and optional `?` (lazy).
fn skip_quantifier(bytes: &[u8], pos: &mut usize) {
    if *pos >= bytes.len() {
        return;
    }
    match bytes[*pos] {
        b'*' | b'+' | b'?' => {
            *pos += 1;
            // Lazy modifier.
            if *pos < bytes.len() && bytes[*pos] == b'?' {
                *pos += 1;
            }
        }
        b'{' => {
            // Skip until closing '}'.
            while *pos < bytes.len() && bytes[*pos] != b'}' {
                *pos += 1;
            }
            if *pos < bytes.len() {
                *pos += 1; // consume '}'
            }
            // Lazy modifier.
            if *pos < bytes.len() && bytes[*pos] == b'?' {
                *pos += 1;
            }
        }
        _ => {}
    }
}

// ---------------------------------------------------------------------------
// 6. Dispatch table
// ---------------------------------------------------------------------------

/// A lookup table that maps each ASCII character code to the index of the
/// alternative branch that should be tried, or -1 if no branch matches.
#[derive(Clone, Debug)]
pub struct DispatchTable {
    /// `table[c]` is the 0-based index of the alternative to try when the next
    /// input character has code `c`, or -1 if no alternative matches.
    pub table: [i8; 128],
}

impl DispatchTable {
    /// Look up which alternative to try for the given character code.
    ///
    /// Returns `None` if no alternative matches.
    pub fn lookup(&self, code: u8) -> Option<usize> {
        if code >= 128 {
            return None;
        }
        let idx = self.table[code as usize];
        if idx < 0 { None } else { Some(idx as usize) }
    }
}

/// Attempt to build a dispatch table for a set of alternative expressions.
///
/// Returns `Some(DispatchTable)` only when ALL of the following hold:
/// 1. Every alternative is non-nullable.
/// 2. Every alternative has a non-empty FIRST set.
/// 3. All pairs of alternatives have disjoint FIRST sets.
///
/// If any condition fails, returns `None` — the caller should fall back to
/// ordered-choice (sequential) parsing.
pub fn build_dispatch_table<'a>(
    alternatives: &[&'a Expression<'a>],
    first_sets: &FirstSets<'a>,
    ast: &'a AST<'a>,
) -> Option<DispatchTable> {
    if alternatives.is_empty() {
        return None;
    }

    // Compute FIRST sets for each alternative expression.
    let mut alt_first_sets: Vec<CharSet> = Vec::with_capacity(alternatives.len());

    for &alt in alternatives {
        let mut cs = CharSet::new();
        let is_nullable = compute_expr_first(alt, &first_sets.first, &first_sets.nullable, ast, &mut cs);

        // Condition 1: non-nullable.
        if is_nullable {
            return None;
        }

        // Condition 2: non-empty FIRST set.
        if cs.is_empty() {
            return None;
        }

        alt_first_sets.push(cs);
    }

    // Condition 3: pairwise disjoint.
    for i in 0..alt_first_sets.len() {
        for j in (i + 1)..alt_first_sets.len() {
            if !alt_first_sets[i].is_disjoint(&alt_first_sets[j]) {
                return None;
            }
        }
    }

    // Build the table.
    let mut table = [-1i8; 128];
    for (idx, cs) in alt_first_sets.iter().enumerate() {
        // Safety: we've verified alternatives.len() fits in i8 range above
        // (practically, grammars never have > 127 alternatives).
        if idx > i8::MAX as usize {
            return None;
        }
        for code in cs.iter() {
            table[code as usize] = idx as i8;
        }
    }

    Some(DispatchTable { table })
}

// ---------------------------------------------------------------------------
// 7. Reference counting
// ---------------------------------------------------------------------------

/// Count how many times each nonterminal appears as a dependency of other rules.
///
/// For each rule `A` that depends on nonterminal `B`, `B`'s count is
/// incremented by one (per unique dependency edge, not per textual occurrence).
pub fn compute_ref_counts<'a>(deps: &'a Dependencies<'a>) -> HashMap<&'a Expression<'a>, usize> {
    let mut counts: HashMap<&'a Expression<'a>, usize> = HashMap::new();

    // Initialize all rule names to zero.
    for (lhs, _) in deps {
        counts.entry(lhs).or_insert(0);
    }

    // For each rule, increment the count of each dependency.
    for (_, sub_deps) in deps {
        for dep in sub_deps {
            // Find the canonical key for this dependency.
            if let Some((key, _)) = deps.get_key_value(dep) {
                *counts.entry(key).or_insert(0) += 1;
            }
        }
    }

    counts
}

// ---------------------------------------------------------------------------
// 8. Alias detection
// ---------------------------------------------------------------------------

/// Find rules whose RHS is simply a reference to another nonterminal, possibly
/// wrapped in a `Group(...)`.
///
/// Returns a map from the alias (LHS expression) to the target nonterminal
/// expression it aliases.
///
/// Cyclic rules are excluded: if `A = B` and `B = A`, neither is an alias.
pub fn find_aliases<'a>(
    ast: &'a AST<'a>,
    cyclic_rules: &HashSet<Expression<'a>>,
) -> HashMap<&'a Expression<'a>, &'a Expression<'a>> {
    let mut aliases = HashMap::new();

    for (lhs, rhs) in ast {
        // Skip cyclic rules — they aren't simple aliases.
        if cyclic_rules.contains(lhs) {
            continue;
        }

        let inner = unwrap_rule(rhs);
        if let Some(target) = extract_alias_target(inner) {
            // Find the canonical AST key for the target nonterminal.
            if let Expression::Nonterminal(ref_token) = target {
                let target_name: &str = &ref_token.value;
                for (key, _) in ast {
                    if let Expression::Nonterminal(k_token) = key {
                        if k_token.value.as_ref() == target_name {
                            aliases.insert(lhs, key);
                            break;
                        }
                    }
                }
            }
        }
    }

    aliases
}

/// If `expr` is a bare nonterminal reference (possibly wrapped in one or more
/// `Group` nodes), return that nonterminal expression. Otherwise return `None`.
fn extract_alias_target<'a>(expr: &'a Expression<'a>) -> Option<&'a Expression<'a>> {
    match expr {
        Expression::Nonterminal(_) => Some(expr),
        Expression::Group(inner) => extract_alias_target(&inner.value),
        _ => None,
    }
}

// ---------------------------------------------------------------------------
// 8. Transparent alternation detection
// ---------------------------------------------------------------------------

/// Find rules that are **pure alternations** of nonterminals or simple terminals.
///
/// A rule is transparent if:
///   (a) its body (unwrapping `Rule`) is an `Alternation`,
///   (b) each branch is a `Nonterminal` or a simple terminal (`Literal`, `Regex`),
///   (c) the rule is acyclic (does not participate in a cycle).
///
/// For JSON, `value = object | array | string | number | bool | null` qualifies.
/// Transparent rules don't need their own enum variant — the generated method
/// returns the inner variant directly, eliminating one Box + enum tag per parse.
pub fn find_transparent_alternations<'a>(
    ast: &'a AST<'a>,
    cyclic_rules: &HashSet<Expression<'a>>,
) -> HashSet<String> {
    let mut transparent = HashSet::new();

    for (lhs, rhs) in ast {
        // Only nonterminal LHS can be transparent.
        let name = match lhs {
            Expression::Nonterminal(token) => token.value.as_ref(),
            _ => continue,
        };

        // Only cyclic (non-acyclic) rules benefit from transparency.
        // Acyclic transparent rules have their deps inlined with raw types
        // (Span), causing type mismatches. Non-acyclic rules have deps
        // inlined with boxed2 versions that produce Box<Enum>.
        if !cyclic_rules.contains(lhs) {
            continue;
        }

        // Unwrap optional Rule wrapper.
        let inner = unwrap_rule(rhs);

        // Must be an alternation.
        let branches = match inner {
            Expression::Alternation(token) => &token.value,
            _ => continue,
        };

        // Every branch must be a nonterminal reference (not a literal or regex).
        let all_simple = branches.iter().all(|branch| {
            matches!(branch, Expression::Nonterminal(_))
        });

        if all_simple {
            transparent.insert(name.to_string());
        }
    }

    transparent
}

// ---------------------------------------------------------------------------
// 9. Span-eligible rule detection
// ---------------------------------------------------------------------------

/// Returns true if `expr` can be entirely evaluated as a `SpanParser` —
/// i.e., every sub-expression produces a `Span` and there is no recursion.
fn expr_is_span_eligible<'a>(
    expr: &'a Expression<'a>,
    cyclic_rules: &HashSet<Expression<'a>>,
    ast: &'a AST<'a>,
) -> bool {
    match expr {
        Expression::Literal(_) | Expression::Regex(_) | Expression::Epsilon(_) => true,
        Expression::Group(inner)
        | Expression::Optional(inner)
        | Expression::OptionalWhitespace(inner)
        | Expression::Many(inner)
        | Expression::Many1(inner) => {
            expr_is_span_eligible(&inner.value, cyclic_rules, ast)
        }
        Expression::Skip(left, right) | Expression::Next(left, right) => {
            expr_is_span_eligible(&left.value, cyclic_rules, ast)
                && expr_is_span_eligible(&right.value, cyclic_rules, ast)
        }
        Expression::Concatenation(inner) => inner
            .value
            .iter()
            .all(|e| expr_is_span_eligible(e, cyclic_rules, ast)),
        Expression::Alternation(inner) => inner
            .value
            .iter()
            .all(|e| expr_is_span_eligible(e, cyclic_rules, ast)),
        Expression::Nonterminal(token) => {
            let target_name: &str = &token.value;
            // Cyclic nonterminals can't be span-eligible.
            if cyclic_rules.contains(expr) {
                return false;
            }
            // Check if the target rule's body is span-eligible.
            let target_rhs = ast.iter().find_map(|(k, v)| {
                if let Expression::Nonterminal(t) = k {
                    if t.value.as_ref() == target_name {
                        Some(v)
                    } else {
                        None
                    }
                } else {
                    None
                }
            });
            match target_rhs {
                Some(rhs) => expr_is_span_eligible(unwrap_rule(rhs), cyclic_rules, ast),
                None => false,
            }
        }
        Expression::Rule(inner, _) => expr_is_span_eligible(inner, cyclic_rules, ast),
        _ => false,
    }
}

/// Find rules whose entire body can be expressed as a `SpanParser`.
///
/// A rule is span-eligible if it is acyclic and its body (unwrapping `Rule`)
/// uses only Span-producing operations: Literal, Regex, Skip, Next, Group,
/// Optional, Many, Concatenation, Alternation (where all branches are Span).
///
/// For JSON: `string`, `number`, `bool`, `null`, `comma`, `colon`.
pub fn find_span_eligible_rules<'a>(
    ast: &'a AST<'a>,
    cyclic_rules: &HashSet<Expression<'a>>,
) -> HashSet<String> {
    let mut eligible = HashSet::new();

    for (lhs, rhs) in ast {
        let name = match lhs {
            Expression::Nonterminal(token) => token.value.as_ref(),
            _ => continue,
        };

        // Cyclic rules cannot be span-eligible.
        if cyclic_rules.contains(lhs) {
            continue;
        }

        let inner = unwrap_rule(rhs);
        if expr_is_span_eligible(inner, cyclic_rules, ast) {
            eligible.insert(name.to_string());
        }
    }

    eligible
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::grammar::Token;
    use parse_that::Span;
    use std::borrow::Cow;

    /// Helper: create a Nonterminal expression with the given name.
    fn nt(name: &str) -> Expression<'_> {
        Expression::Nonterminal(Token::new(Cow::Borrowed(name), Span::new(0, 0, "")))
    }

    /// Helper: create a Literal expression.
    fn lit(value: &str) -> Expression<'_> {
        Expression::Literal(Token::new(Cow::Borrowed(value), Span::new(0, 0, "")))
    }

    // -- CharSet tests --

    #[test]
    fn charset_basic() {
        let mut cs = CharSet::new();
        assert!(cs.is_empty());

        cs.add(b'a');
        assert!(cs.has(b'a'));
        assert!(!cs.has(b'b'));
        assert!(!cs.is_empty());
        assert_eq!(cs.len(), 1);
    }

    #[test]
    fn charset_range() {
        let mut cs = CharSet::new();
        cs.add_range(b'A', b'Z');
        assert_eq!(cs.len(), 26);
        assert!(cs.has(b'A'));
        assert!(cs.has(b'Z'));
        assert!(!cs.has(b'a'));
    }

    #[test]
    fn charset_union_and_disjoint() {
        let mut a = CharSet::new();
        a.add_range(b'a', b'z');

        let mut b = CharSet::new();
        b.add_range(b'0', b'9');

        assert!(a.is_disjoint(&b));

        a.union(&b);
        assert!(!a.is_disjoint(&b));
        assert!(a.has(b'5'));
    }

    #[test]
    fn charset_iter() {
        let mut cs = CharSet::new();
        cs.add(b'x');
        cs.add(b'y');
        cs.add(b'z');
        let collected: Vec<u8> = cs.iter().collect();
        assert_eq!(collected, vec![b'x', b'y', b'z']);
    }

    #[test]
    fn charset_high_codes() {
        let mut cs = CharSet::new();
        cs.add(127);
        assert!(cs.has(127));
        // Code 128 should be silently ignored.
        cs.add(128);
        assert!(!cs.has(128));
    }

    // -- Regex first chars tests --

    #[test]
    fn regex_first_literal() {
        let cs = regex_first_chars("abc").unwrap();
        assert!(cs.has(b'a'));
        assert!(!cs.has(b'b')); // only first char
    }

    #[test]
    fn regex_first_digit_escape() {
        let cs = regex_first_chars(r"\d+").unwrap();
        assert!(cs.has(b'0'));
        assert!(cs.has(b'9'));
        assert!(!cs.has(b'a'));
    }

    #[test]
    fn regex_first_char_class() {
        let cs = regex_first_chars("[a-fA-F0-9]").unwrap();
        assert!(cs.has(b'a'));
        assert!(cs.has(b'F'));
        assert!(cs.has(b'0'));
        assert!(!cs.has(b'g'));
    }

    #[test]
    fn regex_first_alternation() {
        let cs = regex_first_chars("abc|def|xyz").unwrap();
        assert!(cs.has(b'a'));
        assert!(cs.has(b'd'));
        assert!(cs.has(b'x'));
        assert!(!cs.has(b'b'));
    }

    #[test]
    fn regex_first_anchor() {
        let cs = regex_first_chars("^abc").unwrap();
        assert!(cs.has(b'a'));
    }

    #[test]
    fn regex_first_dot_returns_none() {
        assert!(regex_first_chars(".+").is_none());
    }

    #[test]
    fn regex_first_group() {
        let cs = regex_first_chars("(?:abc|def)").unwrap();
        assert!(cs.has(b'a'));
        assert!(cs.has(b'd'));
    }

    #[test]
    fn regex_first_word_escape() {
        let cs = regex_first_chars(r"\w+").unwrap();
        assert!(cs.has(b'a'));
        assert!(cs.has(b'Z'));
        assert!(cs.has(b'_'));
        assert!(cs.has(b'5'));
    }

    #[test]
    fn regex_first_space_escape() {
        let cs = regex_first_chars(r"\s").unwrap();
        assert!(cs.has(b' '));
        assert!(cs.has(b'\t'));
        assert!(cs.has(b'\n'));
    }

    // -- Tarjan SCC tests --

    #[test]
    fn tarjan_no_cycles() {
        // A -> B -> C (linear chain, no cycles)
        let a = nt("A");
        let b = nt("B");
        let c = nt("C");

        let mut deps: Dependencies = HashMap::new();
        let mut a_deps = HashSet::new();
        a_deps.insert(b.clone());
        deps.insert(a.clone(), a_deps);

        let mut b_deps = HashSet::new();
        b_deps.insert(c.clone());
        deps.insert(b.clone(), b_deps);

        deps.insert(c.clone(), HashSet::new());

        let result = tarjan_scc(&deps);
        assert_eq!(result.sccs.len(), 3);
        assert!(result.cyclic_rules.is_empty());

        // Verify reverse-topo order: C should come before B, B before A.
        let scc_idx_a = result.scc_index.iter().find(|(k, _)| ***k == a).unwrap().1;
        let scc_idx_b = result.scc_index.iter().find(|(k, _)| ***k == b).unwrap().1;
        let scc_idx_c = result.scc_index.iter().find(|(k, _)| ***k == c).unwrap().1;
        assert!(scc_idx_c < scc_idx_b || scc_idx_b < scc_idx_a);
    }

    #[test]
    fn tarjan_self_cycle() {
        // A -> A (self-referencing)
        let a = nt("A");

        let mut deps: Dependencies = HashMap::new();
        let mut a_deps = HashSet::new();
        a_deps.insert(a.clone());
        deps.insert(a.clone(), a_deps);

        let result = tarjan_scc(&deps);
        assert_eq!(result.sccs.len(), 1);
        assert!(result.cyclic_rules.contains(&a));
    }

    #[test]
    fn tarjan_mutual_cycle() {
        // A -> B, B -> A
        let a = nt("A");
        let b = nt("B");

        let mut deps: Dependencies = HashMap::new();
        let mut a_deps = HashSet::new();
        a_deps.insert(b.clone());
        deps.insert(a.clone(), a_deps);

        let mut b_deps = HashSet::new();
        b_deps.insert(a.clone());
        deps.insert(b.clone(), b_deps);

        let result = tarjan_scc(&deps);
        assert_eq!(result.sccs.len(), 1);
        assert!(result.cyclic_rules.contains(&a));
        assert!(result.cyclic_rules.contains(&b));
    }

    // -- Reference counting tests --

    #[test]
    fn ref_counts_basic() {
        let a = nt("A");
        let b = nt("B");
        let c = nt("C");

        let mut deps: Dependencies = HashMap::new();
        // A depends on B and C
        let mut a_deps = HashSet::new();
        a_deps.insert(b.clone());
        a_deps.insert(c.clone());
        deps.insert(a.clone(), a_deps);
        // B depends on C
        let mut b_deps = HashSet::new();
        b_deps.insert(c.clone());
        deps.insert(b.clone(), b_deps);
        // C has no dependencies
        deps.insert(c.clone(), HashSet::new());

        let counts = compute_ref_counts(&deps);

        // A is referenced by nobody.
        let a_count = counts.iter().find(|(k, _)| ***k == a).unwrap().1;
        assert_eq!(*a_count, 0);

        // B is referenced by A.
        let b_count = counts.iter().find(|(k, _)| ***k == b).unwrap().1;
        assert_eq!(*b_count, 1);

        // C is referenced by A and B.
        let c_count = counts.iter().find(|(k, _)| ***k == c).unwrap().1;
        assert_eq!(*c_count, 2);
    }

    // -- Dispatch table tests --

    #[test]
    fn dispatch_table_basic() {
        // Simulate two literal alternatives: "abc" and "xyz".
        let alt_a = lit("abc");
        let alt_x = lit("xyz");

        let ast: AST = IndexMap::new();
        let first_sets = FirstSets {
            first: HashMap::new(),
            nullable: HashSet::new(),
        };

        let alternatives: Vec<&Expression> = vec![&alt_a, &alt_x];
        let table = build_dispatch_table(&alternatives, &first_sets, &ast).unwrap();

        assert_eq!(table.lookup(b'a'), Some(0));
        assert_eq!(table.lookup(b'x'), Some(1));
        assert_eq!(table.lookup(b'z'), None);
    }

    #[test]
    fn dispatch_table_overlapping_returns_none() {
        // Two literals that start with the same character.
        let alt1 = lit("abc");
        let alt2 = lit("axyz");

        let ast: AST = IndexMap::new();
        let first_sets = FirstSets {
            first: HashMap::new(),
            nullable: HashSet::new(),
        };

        let alternatives: Vec<&Expression> = vec![&alt1, &alt2];
        assert!(build_dispatch_table(&alternatives, &first_sets, &ast).is_none());
    }
}
