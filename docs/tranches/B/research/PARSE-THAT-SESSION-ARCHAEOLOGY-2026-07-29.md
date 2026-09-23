# Parse-that session archaeology: direct-source law, lifecycle, and exact disposition

## Receipt and conclusion

- **Audit date:** 2026-07-29
- **Parse-that history base:** `ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42`
- **TypeScript release under audit:** `@mkbabb/parse-that@1.0.0`
- **TypeScript source tree at that base:** `70fe037988caf82bac7ce6ea5b98614984c57ea5`
- **TypeScript test tree at that base:** `053b0079802fb0e98323f4389cfab4eb9e0d90de`
- **Status:** `ARCHAEOLOGY COMPLETE / READ-ONLY / NO RELEASE`
- **Edits:** this document only; no parse-that source edit and no commit

The binding result is small:

1. The accepted TypeScript route is a scannerless, source-direct combinator
   grammar. A terminal may maximal-munch its own source span; a separately
   materialized token/event stream may not become parser input.
2. Value owns the CSS grammar and CSS semantics. Parse-that owns only reusable
   parser runtime and combinators. BBNF may consume the admitted generic
   contract after W3; it does not own a second CSS grammar.
3. The July 29 parser packet contains useful CSS Syntax research, but its
   mandatory lossless token-event substrate is a blocked Rust/BBNF proposal,
   not accepted TypeScript 1.0 architecture. Keep the semantic requirements;
   prune and replace the parser-input token-event plane.
4. TypeScript 1.0 is a clean public-surface cut, not a total runtime. Seven
   family-neutral obligations still reproduce RED. The smallest next work is
   direct repair of those closure-runtime laws, followed by a Value-owned
   source-direct CSS vertical. It is not another framework-selection or gate
   program.
5. Session prose is evidence of a proposal or owner instruction, never evidence
   that code exists or works. Source, executable receipts, commit diffs, and
   pinned owner instructions control every disposition below.

No encrypted plaintext was inferred. Contact tasks were not inspected or
contacted. This audit does not expand into Value frontend work.

## Evidence authority

Conflicting claims were resolved in this order:

1. a unique, direct owner instruction in its root-session context;
2. current committed source plus a reproducible executable probe;
3. a commit diff and its surviving tree;
4. a ratified handoff or addendum, limited by its own status;
5. agent prose, summaries, memories, and repeated fork context as search leads
   only.

This ordering matters because forked Codex sessions copy owner prompts into
many descendant JSONLs, Claude compaction summaries restate earlier claims, and
several documents mark formation complete while explicitly marking execution
blocked. Counting those copies as repeated owner decisions would be false.

The unique current owner instruction in root Codex session
`019fae36-1241-7d33-9c14-58d86be7fae3`, at
`2026-07-29T17:01:45.016Z`, is decisive:

> The prototype should be a parse-that idiomatic one, not a scanner/tokenizer
> based one.

The same instruction asks the prototype to dogfood leaf, span, and V8
optimizations. Later root and subagent records quote or inherit it; those copies
remain one owner instruction.

## Repeated owner law after de-duplication

Across the raw Value V·π prompts, the 11 root Claude histories, and the sampled
Codex roots, the repeated owner laws are:

- implement directly; spend little time on meta-process and delete contrived
  gates;
- KISS, with one real path and no legacy compatibility route;
- use parse-that as a generalized combinator framework, not a custom,
  feature-shaped scanner;
- use regex or another source-direct terminal where it is the honest terminal;
- measure V8 behavior and compare equal products;
- identify implemented, half-baked, reverted, killed, and wrongly-complete work;
- preserve useful progress across session walls without treating summaries as
  ground truth;
- keep parse-that generic, Value responsible for CSS, and BBNF as a later
  consumer/producer boundary rather than a competing CSS owner.

The July 22 raw prompt is unusually clear about the recurring failure: a
generalized combinator framework had acquired a custom, overfit scanner even
though a source-direct regex/parser route was the intended correction. The July
27 Claude prompt then asks for 100+ session archaeology, explicit pruning,
direct code, and no legacy because earlier sessions repeatedly stopped at
handoffs or called partial work complete.

Earlier July 19 owner exploration mentioned Span/SoA/tape possibilities. It also
bounded parse-that to minor reusable fixes and kept the major generated-parser
work in BBNF. Exploration is not a later architecture acceptance. The July 22
direct-source reset, ADDENDA-07/08, and the unique July 29 instruction supersede
the tape-as-parser-input reading.

## Commit archaeology: the latest 180 commits

The primary sample is exactly the latest 180 commits on `master`, in date order,
ending at `ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42`. Its inclusive lower boundary
has parent `c4a015623f562a1a13e85946b35dcdd72d7f654c`. The manifest SHA-256 is
`f29f612bb13ac216e51451c322a01ac87ca65c7b3669abb08c26941553e26b08`.

Subject counts expose a code-heavy Rust campaign but also repeated status
rewrites: 51 `feat`, 33 `refactor`, 25 `perf`, 14 `fix`, 13 `docs`, 11 `test`,
9 `chore`, 8 `bench`, with the remainder in smaller categories. Aggregate
numstat for this 180-commit window is:

| Area | Files touched | Added | Deleted |
|---|---:|---:|---:|
| Documentation | 21 | 2,586 | 1,220 |
| TypeScript source | 23 | 947 | 1,814 |
| TypeScript tests | 16 | 1,168 | 2,383 |
| TypeScript proof scripts | 9 | 1,098 | 0 |
| Rust source | 107 | 17,025 | 2,671 |
| Rust tests and benches | 65 | 5,235 | 1,242 |

An all-refs supplement, used only to locate July 29 worktrees and prototypes,
has SHA-256
`491263d673f040ee8a8b51b95c657849203a9cffd6069fe61983674f19d91e65`.
It includes experimental branch commits and three stash commits, so it is not a
substitute for the primary `master` history.

### CSS parser lifecycle

| Commit | What actually happened | Present disposition |
|---|---|---|
| `f0876e0801f9727092ff33b1ec9d8ceb53ee6a7f` | Shipped CSS L1.5 in Rust and TypeScript. The TypeScript implementation used direct `ParserState` mutation and byte/character scanning, wrapped as a parser. Its 31 tests and cross-parser declaration counts did not make it a pure combinator grammar. | Historical implementation evidence only. |
| `f01b32371f67b6873c552e7a6babff5dca34d268` | Expanded TypeScript to “L1.75,” split eight modules, and added media/supports/specificity. | “L1.75” was a project label, not CSS totality. |
| `e2bbf242d4de0d7e779f55a2c09d1bbb26dd0da3`, `5ae9f5acafeb340a009fd9c96e14ecd19dd43ba8` | Repaired `!important`, recovery allocation, and test coverage. | Useful behavior receipts; no surviving TypeScript CSS surface. |
| `d02733e409cd799149b9f3871154602a535aa11f` | Exposed `parseSingleValue` and `parseFunctionArgs` so Value could adopt them. | Half-consumed proposal: Value did not adopt them. |
| `c86a149b8177227bb6b2532061b48d7006d9e014` | Deleted the 1,202-line TypeScript CSS grammar after proving zero non-test consumers. Removed eight source files and six CSS-surface tests, reduced bundle size 75.32 to 50.96 kB, and retained two imperative scanner helpers. | CSS deletion was correct. The two harvested helpers require a fresh consumer audit. |

The important correction is architectural: the deleted TypeScript CSS parser
was not a token-tape/CST pipeline. It was a hand-written, source-direct scanner
that mutated `ParserState`, with regex-like leaves around it. It therefore
demonstrates both halves of the present law:

- direct source access is legitimate;
- hiding a monolithic feature scanner inside one `Parser` is not idiomatic
  combinator composition.

The source comment that remains over `skipWhitespace` and
`skipBlockComments` says Value drives those hot paths. Signed Value currently
has neither `@mkbabb/parse-that` in `package.json` nor a parse-that import in
`src`, `test`, or `package.json`. The comment is stale ownership prose, not a
consumer. The helpers remain exported from `.` and `./utils`; their survival is
therefore reopened, not grandfathered.

### `SpanParser`, `*Span`, and `Span`

Three similarly named things had different lifecycles:

- `Span` is a small source-relative value type with `spanToString` and
  `mergeSpans`. It survives TypeScript 1.0.
- the 15 closure-based `*Span` builders were a parallel public combinator
  hierarchy. They were half-published, reconciled, deprecated, and removed.
- `SpanParser` was a recursive tagged-union interpreter. It was measured slower
  on V8, briefly retained internally, and then killed.

| Commit | Lifecycle fact |
|---|---|
| `db19633d74e88c21f32462c6e88a0a1fb0946525` | Added `altSpan` and `takeUntilAnySpan` to an already-growing span family. |
| `6fb9de25900d56a269fa6bb309cbc2f19aa98a8c` | Reconciled a half-published dist: source had 15 functions while the shipped 0.8.2 dist had eight; bumped to 0.9.0. |
| `3b559a9b34565443d5675f6ee19d1c7d68c155f5` | Added public subpaths and a tagged-union `SpanParser`; its own benchmark reported about 10% slower than closure `altSpan`. |
| `afea5c29da96344faff642aad22f439ac89618ad` | Kept the subpaths, removed the 13 tagged-union symbols from public surface, and recorded 10–14% slower results. |
| `7901314b4e2dd89191eecdfaf3811d6e59d8ea0c` | Deleted internal `SpanParser` and its benchmark. It temporarily kept `*Span` for backward compatibility. |
| `2c806fb7e3a4d26d7bc8f1b6fdf4568453f026a1` | Deprecated all 15 `*Span` builders for 1.0 removal. |
| `043c4d1f1aa033fcb41f0dba742a69a0006c7e41` | Deleted `span.ts` and all 15 builders in the 1.0 breaking cut; retained `Span` and its two helpers. |
| `7eab78c89961001a689952c091fdbbf64af735da` | Released 1.0.0 and recorded token streams, incremental parsing, Squirrel LR, and `SpanParser` resurrection as non-goals. |

Resurrecting any of the following is not new work: a recursive tagged node
switch, `regexSpan`/`stringSpan`/`manySpan` siblings, or a parallel
span-producing parser family. Source-relative numeric positions can be carried
inside the one ordinary parser runtime and materialized only when a consumer
needs them.

### V8 and performance lifecycle

The performance history contains honest falsification as well as synthetic
seams:

- `SpanParser` was killed after a measured 10–14% loss. That is durable negative
  evidence against recursive per-node tag dispatch in TypeScript/V8, not against
  every possible iterative control machine.
- `7901314` added fused `all()` and a second-character `dispatch` table.
  `2c806fb` removed zero-consumer `thenMap`/`fuse` seams and retracted the
  second-character table because its gate used a synthetic corpus. The
  first-character table and fused `all()` remain.
- Current `dispatch()` constructs an `Int8Array(128)` and returns mismatch for a
  non-ASCII first UTF-16 unit. Its public description is broader than its actual
  ASCII domain.
- Current `all()` has an exact tuple type but removes every successful
  `undefined` value at runtime. This is an API correctness defect, not a mere
  optimization choice.
- `proof:perf` protects a JSON ceiling and selected late CSS-like function names.
  It is a regression tripwire, not proof of representative CSS totality.

On Node `v26.0.0`, V8 `14.6.202.33-node.19`, `npm test` passed all 124 legacy
tests. One `proof:all` run failed its 15% JSON threshold at 2,012 ns against a
1,742 ns baseline, a 15.5% regression. Three immediate isolated reruns passed at
approximately 11.3%, 8.4%, and 10.3%. This is a flaky environmental ceiling,
not evidence of a semantic regression and not evidence of stable performance.
Promotion needs fresh processes, distributions, and equal products; one lucky
rerun cannot close it.

## Current TypeScript 1.0: shipped surface versus open runtime

At the signed base, TypeScript 1.0 exports:

- ordinary `Parser` and closure combinators;
- `Span`, `spanToString`, and `mergeSpans`;
- diagnostics, packrat, utilities, and subpath boundaries;
- fused `all()` and ASCII first-character `dispatch()`.

It exports no CSS parser, no token/CST surface, no `SpanParser`, and no `*Span`
builders. `Parser.state` still retains the most recent parse result on the
parser definition. Recovered diagnostics still use a module-global array.
`lazy()` still recurses on the JavaScript stack. Packrat epochs are opened at
`.parseState()`, while the exposed raw `.parser(state)` route can bypass the
source epoch and reuse a stale memo cell.

The family-neutral runtime probe at commit
`99e9862` reproduced seven RED obligations with:

```sh
npx vitest run test/runtime-kernel.probe.test.ts --reporter=verbose
```

The seven failures are:

1. exact sequence must preserve a successful `undefined` slot;
2. regex failure at EOF must join an accurate failure diagnostic;
3. public dispatch must either support its declared Unicode domain or declare
   and enforce an ASCII-only contract with a generic fallback;
4. raw memo invocation must not reuse a cell from another source;
5. recovered diagnostics must be run-local;
6. branch rollback must restore cursor, semantic value, and committed recovery
   effects while retaining monotone failure evidence;
7. recursive parsing must fault with a typed limit before the host stack fails.

The original checkpoint probe expected final frontier offset 1 and `"!"` for
`a?x`. That part of the probe was wrong. The rejected first arm reaches offset 2
and fails on `"z"`; the later successful arm and enclosing failure do not erase
that farther evidence. Correct final frontier is offset 2 with expected `"z"`.
The baseline still fails the semantic part: it returns `"a"` instead of the
seed and leaks one recovered diagnostic. This correction prevents a false cure
that rolls back the error frontier along with semantic effects.

Consequently, “124 tests green,” “proof:all green,” and “1.0 clean cut” are
compatible statements, but “runtime complete” is not. Existing tests describe
the legacy contract; the born-RED probe exposes missing laws.

## July 29 executable prototype receipts

The prototypes are source-direct and private. None edits production source,
adds a public export, implements CSS, or authorizes release.

| Family | Receipt | Result | Exact disposition |
|---|---|---|---|
| R, journaled run closures | `417532` on its prototype branch; incorporated as `bd9ba0` in the research worktree | 9/9 tests and strict TypeScript passed. Equivalent warmed success was 4.01–4.52× slower and mismatch 4.34–4.66× slower. | **KILL** this R encoding. Retain its transaction-law fixtures, not its runtime. |
| E, recognition/projection | `35fd252` / bank receipt `011819e` | 9/9 tests passed. Full projection was about 6.9× slower; recognition-only was 62.6–69% faster. Arbitrary `.chain(value => parser)` cannot be deferred without recreating a semantic runtime. | **KILL** E as the general runtime. Keep only the narrow recognition-only observation for a proven consumer. Its journal was output only and never parser input. |
| V and K, explicit control | `a0f122f` | 10/10 laws passed. Both routes crossed their allocation/performance kill thresholds. | **KILL** both prototype encodings. Do not rename either into a new VM/trampoline proposal. |
| S, staged closures | banked, not implemented | No executable receipt. | **KEEP BANKED**, not accepted and not a reason to delay direct repairs. |
| D, tagged derivatives | banked, not implemented | No executable receipt. | **KEEP BANKED** only for a later unordered falsification if a real consumer needs it. |

These results answer the first architectural question without selecting a new
framework: the incumbent closure model remains the baseline because all three
general replacement encodings tested so far lose badly. The result does not
excuse its seven correctness defects. Repair the smallest closure law directly
before reopening a compiler, VM, projector, or derivative machine.

## Rust is a separate lifecycle

The committed `master` Rust crate is `parse_that` 0.4.0. It exports scanners,
parser modules, the full Rust CSS parser, and a large `SpanParser` enum whose
variants include domain-specific scanners. This committed Rust surface is not
evidence that the TypeScript 1.0 consumer contract should regain those
features.

The private `codex/sk-v26-parse-that` line replaces that legacy Rust runtime
with a smaller transactional recognition kernel:

```text
9f6772a  replace the legacy Rust runtime with a transactional recognition kernel
d8b85da  fix recognition-only rollback and input-byte exhaustion
282ccb6  seal counting and typed input limits as ABI 2 / 0.4.1
88a71c2  add born-RED atomic-difference laws
ed1ffa2  admit atomic difference and advance to 0.5.0
e31fbfe  move to Rust 1.97.1 stable and resolver v3
```

That branch is strong implementation evidence for transactional recognition in
generated Rust. It is private, not the current TypeScript package, and does not
admit the July 29 CSS token-event architecture. Rust 0.4 legacy and the 0.5
kernel therefore need an explicit release/consumer reconciliation; neither may
silently define TypeScript CSS ownership.

## V·π packet: what is authoritative

### ADDENDA-07 and ADDENDA-08

`ADDENDA-07.md` is 372 lines, SHA-256
`78a5bdb753fec5efb61311db570930bc2af80757531054b9ee3c415e98ee26d5`.
`ADDENDA-08.md` is 322 lines, SHA-256
`d74eb0ecb5eaacbb3023f7a9d8021e0ffb225a443caad6e37f58c70178bcceea`.
Together they ratify:

- direct published parse-that 1.0 combinators over source;
- regex as a terminal rather than a separately materialized lexer;
- no token tape, token-object algebra, generic CST, manual feature scanner, or
  mirror parser as the accepted route;
- historical W0–W4 and prior scanner/token/CST acceptance labels are not current
  acceptance;
- parser evidence was rich while accepted parser code was poor;
- direct implementation has priority over process.

They also record a revealing imbalance in the then-current Value parser area:
608 syntax lines and 543 projection lines around a 367-line isolated direct
sketch, while `parseStylesheet` and benchmarks remained stubs. The documents
contain a large `3 × 5 × 3` law matrix, but they themselves direct a compact cell
artifact rather than repeated prose. The matrix is a test-source pool, not a
requirement to construct a gate for every terminal.

ADDENDA-08 marks formation complete and audit unexecuted. It is a handoff, not
proof of a working parser.

### Raw prompt packet and findings

The raw prompt index is 56 lines, SHA-256
`e28db08232fd1e447a7667a37ed89d0700e6ba7f862c86a83cd82dc815818cf3`.
It freezes three rollouts and 181 prompt events by receipt time:

| Rollout | Prompt events | Unique in index | Raw archive lines | Raw archive SHA-256 |
|---|---:|---:|---:|---|
| Value tranche V formation | 83 | 83 | 1,400 | `c044568945cfd5c311010bb2fee4d5192bd9e913fb167de502f4b76bbbdf4658` |
| Value V·π refinement | 28 | 28 | 3,568 | `96d94a82ab6d123678b366ebe96891a28c777bbb2bd24072d9e6fff71b1b4e19` |
| BBNF greenfield coordination | 70 | 69 | 1,180 | `73612abe625958ccfef8262d71504f11590fdb3bddb62199089181fd100b18f1` |

`FINDINGS.md` is 208 lines, SHA-256
`3752e8a316328991006c8a508b855a4663febcc2e40d391213b96e6533f451ed`.
Its most important methodological statement is correct: agent messages are an
assay, acceptance labels are provisional, and source/execution/pinned
specification wins. The present archaeology applies that rule to the packet
itself.

The current V·π tree illustrates evidence-to-code imbalance: 2,338 files,
1,373,521 lines, and 357,600,047 bytes were present under the audited tree;
1,996 files were in the mirror area, 157 in the denominator, 115 in formation,
and 14 in cells. The one accepted numeric cell source was 17 lines / 560 bytes,
SHA-256
`8c3ac689f2e24635216ac0499f23166996ac0136e0b6876e82a8da4f75eb95aa`,
with a 52-line test. These counts do not imply every file is
active or wrong. They show why prose volume cannot stand in for a parser
vertical.

## July 29 token-event packet: the exact conflict

The three parser documents are:

| Document | Lines | SHA-256 | Self-declared status |
|---|---:|---|---|
| `PARSER-IN-FLIGHT-AUDIT-2026-07-29.md` | 407 | `cdd1a51a23e60c986d79f3626016bb4ecfc59198ab1fbdb2a21425edb0e2d20e` | `AUDITED_WITH_BLOCKERS` |
| `PARSER-RESUME-HANDOFF-2026-07-29.md` | 329 | `b241e16040f2a3e6089f4a91f986f5fba1d3cb847ef0c8485c1b63b87e6a6c57` | blockers remain; W3 not accepted |
| `PARSER-WAVE-ADDENDUM-2026-07-29.md` | 940 | `f272cf3ce30b7477f67bbf79c00d6cf67d39d3a60cbbef0e7c57a7a80600c145` | `FORMATION_COMPLETE_EXECUTION_BLOCKED` |

They total 1,676 planning/audit lines. No corresponding lossless CSS
token-event implementation exists in the signed TypeScript 1.0 source or the
admitted Rust kernel.

The audit explicitly says the former blanket “no lexical layer/token stream”
rule is superseded. The addendum then requires one generated lossless CSS
token-event substrate, typed consumers, and a token/event plane in its later
phases. That is a direct conflict with:

- ADDENDA-07/08's direct-source combinator reset;
- TypeScript 1.0's recorded token-stream non-goal;
- the unique July 29 owner instruction rejecting a scanner/tokenizer prototype;
- current round-zero acceptance, which rejects a token/event tape as parser
  input;
- P1-E's constraint that its journal is output only, followed by P1-E's general
  runtime kill.

The conflict is not solved by calling tokens “events.” If a separately
materialized sequence is consumed by another parser, it is a lexical/parser
input stage under the binding law.

The packet also claims the no-token-stream rule caused consumers to return to
repeated string splitting. The chronology does not support that causal claim:
hand-written scanners/splitters already existed and were the reason for the
July 22 reset. The later direct-source law cannot have caused the earlier
duplication.

The correct split is:

- **KEEP** CSS Syntax semantic requirements: preprocessing, escape handling,
  exact source spans, recovery behavior, nesting/resource limits, preservation
  of unknown constructs where the consumer requires it, and WPT/reference
  corpus comparison.
- **REOPEN** structured diagnostics and source mapping as generic,
  source-direct runtime capabilities with a real consumer.
- **PRUNE** mandatory token-event materialization as parser input, its P2
  architecture, the P5 token/event plane, and the unsupported causal claim.
- **REPLACE** the 940-line blocked program with a small code-first vertical:
  source-direct terminals and combinators, one component/function path, one
  declaration path, one stylesheet path, equal-product behavior/performance,
  then delete the displaced route in the same cut.

A private event journal remains possible only as committed output or
instrumentation, never parser input, and only if a real consumer plus a
second-grammar reuse proof outweighs its cost. P1-E falsified the general form:
projection was about 6.9× slower and arbitrary value-dependent chaining reopened
the semantic runtime it was meant to remove.

## Root Codex session sample

The frozen selection command was:

```sh
rg -l -F '/Users/mkbabb/Programming/parse-that' \
  /Users/mkbabb/.codex/sessions/2026/07 |
  sort -r |
  head -128
```

It selected 128 latest rollout JSONLs mentioning the exact path: 466,226 lines
and 1,036,799,309 bytes at receipt time. The metadata manifest SHA-256 is
`67f259e68d7635b88154a86abfb6c682bddf88c8ab54d5189cf5bb21f9ca744b`.
Because live rollouts can append, this hash identifies the audit receipt rather
than a timeless source.

Classification from the session metadata:

- 120 subagent rollouts and 8 root/user rollouts;
- current working directories: 94 `bbnf-lang`, 26 `value.js`, 5 `sci-report`,
  2 `keyframes.js`, and 1 `glass-ui`;
- 631 user-message records but only 184 unique exact bodies after fork-copy
  de-duplication;
- 207 records mentioning parse-that but only 8 unique exact bodies.

The eight root IDs are:

```text
019faee0-02b1-73a1-b071-afd54b6cf9f7
019fae36-1241-7d33-9c14-58d86be7fae3
019fae35-3a50-7291-9bc1-97ee8baae4d7
019faa6d-05d6-7eb3-97c9-4fe16bb0fd1a
019fa9a7-5269-76d3-bd9e-89627eb1a639
019fa9a4-c4fd-7e00-82f9-fec20f6e2dd9
019fa9a4-b314-74c1-a0fc-9b662309afbc
019f7685-254a-7a22-9917-1da91f977861
```

Three identity/hash checks across the ordered sample:

| Position | Rollout identity | Classification | SHA-256 |
|---|---|---|---|
| First | `019faf19-d3a8-7601-a69b-61114a25358e` | subagent, forked from `019faee0-...` | `620b583f531f9aca2ce22c67fbb02e3c977cd20a2e9732623169b48336a080d3` |
| Middle | `019fabf9-c016-7d11-81db-ab105c8f55b6` (2026-07-28 23:44:59 receipt) | subagent, forked from `019faa6d-...` | `dcf87cc0d6729c7d76bc0f6d442e0a633e9ed10b9173f4f9ee1220bd3e246824` |
| Last | `019f6ad4-5172-7440-b336-6a272941aa85` | subagent, forked from `019f54f0-...` | `0de2d3869b3fb4f99d52d4aa13ea9697e645b941c1d493b5af024af9ac41c3b9` |

The distribution is why “latest 128 sessions say X” is not a valid authority
claim: most records are BBNF subagents inheriting one context. The one unique
current direct owner instruction controls, not its ten copied appearances.

## Root Claude sessions and parse-that memory

All 11 root JSONLs under
`/Users/mkbabb/.claude/projects/-Users-mkbabb-Programming-value-js` were
included. Combined size is 23,446 lines and 83,663,644 bytes. No record had
`isSidechain == true`; these are root histories, although some start from cloned
prompts. The 11-file SHA manifest has SHA-256
`99cedec2f13f0c1f69be971b10046c3537185ff128854036795bfbd5d19c1907`.

After excluding tool results, embedded commands, compaction summaries, and
fallback wakeups, the corpus contains 290 direct prompt occurrences and 169
unique exact bodies. Thirteen occurrences, 11 unique bodies, concern the parser
route. The same roots contain 21 compaction summaries, 8,021 assistant records,
and 3,571 tool-use records. Assistant model identity, including Fable/Opus, does
not change the authority rule.

The individual root receipts are:

```text
2ada753c...  7134e26364055985ad577dbbc4378f0a680a7c4425e8cd09997674fb77a277c5
40a5ff45...  867a08de1d5ae464cc40c347d74d87c0e34e2fc6815a51f830c31057ab034caf
46328b94...  b57e7df1b7fea894baab294dc1cfbc8fd0cbbf3483a18bc3ba2b075844bb0208
48b27a04...  d90bbb91f5f592274d01ac1c838f5a08360ecd2f215cc2083950cc0a8657462c
6614e90c...  d86fa40d8220552e15c8a413add0aee3d0d915b88a41553b651300423a559a6e
9e7dadd0...  c3b34d258b59dfdc6ede917fda57891ed9196d0d1383a927cc99c1743e66f712
b8cb5fde...  9b1be4d94d2c038ed77627497af0191f61145f8a9c68be835c824df85a659ace
d126bb6d...  7c13f9534b721c2e0d0b9911ccd3cf2394026b1340b2bf87ad475827974ab78a
daa7c418...  75d5b3f53f03eed51071ac793371c758f2d5dc0ba5dbd80a9cf9447a1b1ea763
f0c73f19...  024504edb5c5744043af924c81f4006a4f3c98b6c6a81ea0ad5ffa96d434faab
f608ffdd...  5d670f17ef8147f40014a592a22c4576b7da4c38d7d5cca1f4140409b91a7bde
```

Session walls are material. The long `daa7c418-...` root spans June 3 through
July 14 and contains 12 compactions. `6614e90c-...` spans July 24–29 and contains
four. These summaries preserve continuity but also propagate stale status.
They must be checked against the source at every resumed wall.

The parse-that Claude memory directory contains eight files. Its SHA manifest
is `92408db12f2339c2e50a4c7d4a920c35abcffd7b95c068c078335adb78bd92c5`;
individual content includes:

- durable owner feedback: no legacy and KISS;
- a useful extraction boundary: generic parse-that primitives, separate BBNF
  work;
- stale history claiming CSS L1.75 complete and hand scanners canonical even
  though TypeScript 1.0 removed the CSS parser;
- a historical compatibility rationale for old `not` behavior that the later
  clean-break/no-legacy instruction supersedes.

Memory is an index into history, not a present-tense acceptance ledger.

## Exact KEEP / REOPEN / PRUNE / REPLACE ledger

| Status | Item | Exact disposition and evidence |
|---|---|---|
| **KEEP** | Direct-source TypeScript closure core as the incumbent baseline | All tested general replacements lost badly. Keep one runtime while repairing its laws; this is not a declaration that 1.0 is complete. |
| **KEEP** | `Span` value plus `spanToString` / `mergeSpans` | Survived the 1.0 cut and does not create a parallel parser hierarchy. Carry numeric source offsets internally; materialize only at a consumer boundary. |
| **KEEP** | First-character dispatch and fused sequencing as measured incumbents | Keep only their proven current behavior. Do not infer Unicode support or exact tuple semantics that source does not provide. |
| **KEEP** | CSS Syntax semantics from the July 29 packet | Preprocessing, escapes, recovery, spans, nesting/resource faults, unknown preservation when required, and WPT/reference comparison remain valuable independent of tokenization architecture. |
| **KEEP** | Ownership boundary | Value owns the one CSS grammar and CSS semantics; parse-that owns reusable runtime/combinators; BBNF consumes after W3 and owns no competing CSS grammar. |
| **KEEP** | Negative receipts and history | Preserve SpanParser's 10–14% V8 loss, the synthetic `subTable` retraction, the CSS zero-consumer deletion, P1 R/E/V/K kills, exact hashes, and corrected checkpoint law. They prevent renamed repeats. |
| **KEEP** | Owner law: KISS, no legacy, code first | Apply at implementation time: one route, delete displaced code in the same cut, no compatibility facade without a live consumer. |
| **REOPEN** | Complete branch transaction | Restore cursor, semantic value, captures/events, recovered diagnostics, and live depth; retain monotone work, furthest failure, and max depth. Implement in the smallest closure-runtime seam. |
| **REOPEN** | Exact sequence/discard law | Preserve successful `undefined`, `false`, `0`, and `""`. If discard is needed, make it explicit at construction rather than overloading a valid JavaScript value. |
| **REOPEN** | Run-local recovery diagnostics | Replace the module-global recovered-diagnostic array with parse/run-owned state so nested and rejected branches cannot leak effects. |
| **REOPEN** | Raw memo source isolation | Either make the raw invocation path enter a source/run epoch or stop exposing it as a callable escape hatch. Public `.parse()` proof alone does not cover `.parser(state)`. |
| **REOPEN** | Regex EOF diagnostics | Failure at end of input must merge an accurate frontier/expected label before return. |
| **REOPEN** | Unicode dispatch contract | Add a generic non-ASCII-safe fallback or narrow the API truthfully. Do not add CSS-specific name dispatch to parse-that without a second grammar. |
| **REOPEN** | Typed recursion/resource boundary | Start with a configured limit that faults before the host stack. Reopen a trampoline/VM only if direct closure repair cannot meet an actual consumer depth. |
| **REOPEN** | V8 proof design | Measure construction, cold, warmed success/failure/recovery, equal retained output, heap/GC, and distributions in fresh processes. Treat the current 15% JSON tripwire as noisy compatibility evidence. |
| **REOPEN** | `skipWhitespace` / `skipBlockComments` exports | Their comment names a Value consumer that does not exist. Prove two generic consumers or remove them in the next breaking cut; do not preserve them because the deleted CSS scanner once used them. |
| **REOPEN** | Rust 0.4 versus private 0.5 ownership | Reconcile the committed scanner/CSS/SpanParser surface with the admitted transactional kernel before publishing. Do not let either silently dictate TypeScript architecture. |
| **PRUNE** | TypeScript CSS parser resurrection | It had zero non-test consumers and was correctly removed. Historical tests/benchmarks are fixtures, not a route back into parse-that ownership. |
| **PRUNE** | Tagged-union `SpanParser` and all renamed recursive tag-switch variants | Measured slower and killed. A renamed interpreter tree is the same mechanism. |
| **PRUNE** | Parallel `*Span` API family | Half-published, reconciled, deprecated, and deliberately removed in 1.0. Use one ordinary combinator family plus capture/projection. |
| **PRUNE** | Mandatory token/event tape as parser input | It conflicts with current owner law, ADDENDA-07/08, TypeScript 1.0 non-goals, and round-zero acceptance. Calling the tape “events” does not change the extra parser-input stage. |
| **PRUNE** | Generic CST/atom/token-object mirror acceptance | Formation and mirrors are not accepted parser code. Retain no second authoritative tree. |
| **PRUNE** | July 29 P2 token-event architecture and P5 token plane | Their packet is execution-blocked and has zero admitted implementation. Preserve semantic tests, not the plane. |
| **PRUNE** | Unsupported causal claim about the no-token rule | Repeated splitters predate the July 22 reset; the later rule did not cause them. |
| **PRUNE** | P1 R/E/V/K general runtimes | Each crossed its explicit kill condition. Keep fixtures and measurements only. |
| **PRUNE** | Per-terminal gate cathedral | The `3 × 5 × 3` matrix is a compact adversarial input pool. Do not multiply it into documents/gates before a parser vertical exists. |
| **PRUNE** | “Complete,” “SOTA,” or “full CSS” from narrow labels and microbenches | L1.75, declaration-count parity, 124 legacy tests, or one green perf rerun do not prove CSS Syntax totality or runtime laws. |
| **REPLACE** | July 29 940-line blocked parser program | Replace with one code-first source-direct vertical: terminal foundation → component/function → declaration → stylesheet; compare equal products; delete the displaced path in the same cut. |
| **REPLACE** | Partial manual rollback | One checkpoint/commit mechanism owns every rollback participant and explicitly joins monotone evidence. No scattered saved offsets plus special recovery rollback. |
| **REPLACE** | Implicit `undefined` deletion | Use exact fixed slots and an explicit discard effect. Runtime and TypeScript type must agree. |
| **REPLACE** | Module-global recovered diagnostics | Use a run-owned diagnostic journal/slice included in the one transaction. |
| **REPLACE** | Stale ownership comments and memory status | Replace prose assertions with exact consumer imports, executable receipts, and current release surface. |
| **REPLACE** | Session-wall “done” summaries | At every resume, restate base SHA, source diff, failing/passing command, surviving consumer, and deletion remainder. A summary without these is navigation only. |

## Recurring mistake mechanisms

1. **Proposal laundering through status language.** “Formation complete,”
   “audited,” “SOTA,” or “L1.75” was read as implementation acceptance even when
   the same packet said execution blocked or the code had been removed.
2. **Fork multiplication.** One owner prompt appeared in many descendant
   rollouts and was misread as many independent decisions. Exact-body
   de-duplication and root/subagent classification fixes this.
3. **Agent prose as truth.** Agent messages and compaction summaries promoted
   hypotheses, stale memory, or intended work into present-tense facts. Recheck
   source, diff, command, and consumer.
4. **Surface before consumer.** CSS readers, `*Span`, `SpanParser`, `thenMap`,
   `fuse`, and second-character dispatch were published or prepared before a
   live consumer proved the seam.
5. **Microbenchmark overreach.** A synthetic late bucket or one workload
   justified a general optimization; later equal/real-consumer review killed
   it. The current perf gate remains noisy.
6. **Architecture by renaming.** Token tapes became event planes; recursive tag
   switches can become “flat plans”; scanner loops can be hidden inside one
   parser. Classify by data flow and execution mechanism, not names.
7. **Rollback as cursor restoration.** Saved offsets were treated as a
   transaction while values and recovered diagnostics leaked, or the failure
   frontier was incorrectly expected to roll back.
8. **Compatibility without a consumer.** Dead APIs survived because they had
   once shipped. The later 1.0 clean cut proved that deprecation plus consumer
   census was the right route.
9. **Evidence duplication instead of a vertical.** Hundreds of audit/mirror
   files grew around stubs. More gates increased the apparent completion ratio
   without increasing accepted parser code.
10. **Session-wall drift.** Long roots with repeated compaction carried old
    architecture labels into a later clean-break instruction. Every wall needs
    a source-based rebase, not another narrative synthesis.

## Code-first wave precepts

The next wave should be smaller than this audit:

1. Freeze the exact TypeScript base and keep the Value CSS owner separate.
2. Choose one born-RED runtime law, starting with exact sequence plus complete
   transaction because recovery depends on it.
3. Change the fewest existing closure-runtime files. Add no new public runtime,
   tape, CST, VM, compiler, or compatibility facade.
4. Run the one focused law, the 124 legacy tests, strict TypeScript, build, and
   only then the existing proof suite.
5. Benchmark equal products in fresh processes. A threshold that flips across
   four immediate runs is evidence to improve the assay, not a reason to rerun
   until green.
6. In Value, implement one scannerless source-direct CSS vertical that consumes
   ordinary parse-that combinators. A leaf may maximal-munch its terminal and
   return original UTF-16 positions; it may not emit parser-input tokens.
7. Use the retained July 29 semantic fixtures against that vertical. Add only a
   compact adversarial cell for each discovered defect.
8. Prove a second non-CSS consumer before adding a generic public primitive.
   Otherwise keep it Value-private.
9. Delete the displaced helper/path and stale ownership comment in the same
   breaking cut. No dual old/new route.
10. Record one receipt: base SHA, diff, focused RED→GREEN command, full test
    command, Node/V8, equal-product benchmark, surviving consumer, deletions,
    and routed remainder. Stop writing architecture prose once those facts fit
    in the receipt.

The immediate sequence is therefore:

```text
exact result + transaction
→ run-local recovery
→ EOF/memo/dispatch/depth laws as narrow repairs
→ Value-owned direct-source CSS vertical
→ equal-product semantics and V8 evidence
→ second generic consumer or keep private
→ delete displaced code
```

S and D remain banked research, not parallel implementation waves. Reopen one
only when a measured consumer problem survives the repaired closure runtime.

## Reproduction commands

These commands identify the audit rather than constructing a permanent gate:

```sh
# Primary 180-commit manifest.
git -C /Users/mkbabb/Programming/parse-that log master \
  --date-order -n 180 \
  --pretty=format:'%H%x09%ad%x09%s' \
  --date=iso-strict

# Diff and lifecycle inspection.
git -C /Users/mkbabb/Programming/parse-that show --stat --summary <commit>
git -C /Users/mkbabb/Programming/parse-that show <commit> -- typescript
git -C /Users/mkbabb/Programming/parse-that rev-parse \
  ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42:typescript/src

# Current TypeScript release.
cd /Users/mkbabb/Programming/parse-that/typescript
npm test
npm run proof:all

# Family-neutral baseline probe.
cd /Users/mkbabb/Programming/parse-that-css-totality-runtime-probes/typescript
npx vitest run test/runtime-kernel.probe.test.ts --reporter=verbose

# Signed Value consumer check.
cd /Users/mkbabb/Programming/value.js
jq '{dependencies,devDependencies}' package.json
rg -n --glob '!node_modules/**' --glob '!dist/**' --glob '!docs/**' \
  '@mkbabb/parse-that|skipWhitespace|skipBlockComments' \
  src test package.json

# Latest 128 Codex records that mention the exact parse-that path.
rg -l -F '/Users/mkbabb/Programming/parse-that' \
  /Users/mkbabb/.codex/sessions/2026/07 |
  sort -r |
  head -128

# Root Claude corpus and memory inventory.
find /Users/mkbabb/.claude/projects/-Users-mkbabb-Programming-value-js \
  -maxdepth 1 -name '*.jsonl' -type f -print | sort
find /Users/mkbabb/.claude/projects/-Users-mkbabb-Programming-parse-that/memory \
  -maxdepth 1 -type f -print | sort

# Frozen V·π and July 29 document receipts.
wc -l \
  docs/tranches/V/apotheosis/pi/ADDENDA-07.md \
  docs/tranches/V/apotheosis/pi/ADDENDA-08.md \
  docs/tranches/V/apotheosis/pi/formation/session-audit/FINDINGS.md \
  docs/tranches/V/megatranche/PARSER-IN-FLIGHT-AUDIT-2026-07-29.md \
  docs/tranches/V/megatranche/PARSER-RESUME-HANDOFF-2026-07-29.md \
  docs/tranches/V/megatranche/PARSER-WAVE-ADDENDUM-2026-07-29.md
sha256sum <the-same-files>
```

## Final acceptance boundary

Accepted now:

- one source-direct ordinary combinator route;
- Value as CSS owner;
- generic parse-that runtime repairs proven by focused laws;
- CSS semantic evidence independent of a token/event architecture;
- negative prototype and lifecycle receipts.

Not accepted now:

- any token/event tape as parser input;
- generic CST/atom/token-object mirrors;
- TypeScript CSS or `SpanParser` resurrection;
- P1 R/E/V/K runtimes;
- a “complete” parser claim from documents, legacy tests, or microbenchmarks;
- release, frontend expansion, encrypted inference, or contact work.

The archaeology is complete. The next useful artifact is code plus one compact
receipt, not another architecture packet.
