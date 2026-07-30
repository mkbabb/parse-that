# P3 direct-closure surface cut

Date: 2026-07-29

Status: **CORRECTNESS GREEN; PERFORMANCE RED; CANDIDATE KILL; P3 IN PROGRESS; NO RELEASE**

Control: accepted M2 `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

## Transaction

This private prototype expresses the P2 survivor laws as ordinary direct
closures:

- one mutable run state and scalar offset/value/diagnostic-length/error
  rollback;
- literal and native sticky-RegExp leaves over the source string;
- `choice`, pair/sequence, map, repetition, separated repetition, EOF,
  cached lazy recursion, exact UTF-16 spans and immutable successful recovery;
- parse-owned live/max nesting with a sticky typed `Nesting` fault;
- consumer-owned immutable result projection.

There is no graph, compile phase, terminal table, generated code, VM,
tokenizer, token array, token-event tape, scanner facade, decoded-token
object, source copy, trivia prepass, packrat dependency, `/utils` runtime
dependency, compiler-owned result or public export. The candidate runtime is
510 lines versus 1,543 lines across the accepted-M2
`parser`/`leaf`/`state`/`utils`/`lazy` implementation files, a 66.9% source
cut over the broader incumbent surface. This is a structural comparison, not
performance credit.

The candidate grammars are idiomatic scannerless combinator grammars. The
JSON product covers objects, arrays, strings, numbers, booleans, null,
trivia, EOF, exact root span and typed nesting. The domain-neutral
stylesheet-shaped product covers names and escapes, numbers, dimensions,
percentages, strings, URL, nested calls, exact spans, CRLF/astral/lone
surrogate/NUL behavior and successful opaque recovery. It is not a CSS
grammar or Value consumer.

## Correctness

The focused six-test suite passes:

- the frozen 33-valid JSON corpus matches `JSON.parse`;
- the frozen seven-invalid corpus rejects with authored frontiers;
- successful opaque recovery returns exact spans and frozen diagnostics;
- nesting faults occur at the configured limit before host exhaustion and
  restore live depth;
- all six same-FIRST recovery permutations keep M2's
  `10/6/1/1/10/5` frontier sequence with diagnostics disabled and enabled;
- invalid repetition bounds reject and nullable repetition terminates.

The profile separately asserts exact equality against M2 for 36 successful
state/value/result products at 4/8/16/33/96/753 and two diagnostics-on
failure views. Equality includes values, offsets, root and nested spans,
successful recovery diagnostics, frontiers, labels and faults.

## Performance

Runtime is Node `v26.0.0`, V8 `14.6.202.33-node.19`. Every point uses eleven
alternating AB/BA batches; ratios are M2 control median divided by candidate
median. Exact bootstrap is forbidden because every point estimate is below
10×.

| Product | Scale | Plane | Ratio |
|---|---:|---|---:|
| JSON | 4 | state / value / result | 1.4623× / 1.3701× / 1.0999× |
| fixture | 4 | state / value / result | 1.5238× / 1.4165× / 1.4175× |
| JSON | 8 | state / value / result | 1.1865× / 1.2201× / 1.2878× |
| fixture | 8 | state / value / result | 1.2644× / 1.3605× / 1.2753× |
| JSON | 16 | state / value / result | 1.2307× / 1.1076× / 1.2612× |
| fixture | 16 | state / value / result | 1.3093× / 1.3662× / 1.3530× |
| JSON | 33 | state / value / result | 1.2030× / 1.2214× / 1.3387× |
| fixture | 33 | state / value / result | 1.3974× / 1.3205× / 1.3258× |
| JSON | 96 | state / value / result | 1.0656× / 1.4576× / 1.0974× |
| fixture | 96 | state / value / result | 1.4924× / 1.1533× / 1.4561× |
| JSON | 753 | state / value / result | 1.2721× / 1.2765× / 1.0762× |
| fixture | 753 | state / value / result | 1.1995× / 1.1249× / 1.1381× |

Construction is 1.9534× faster for JSON and 1.7118× for the fixture.
Diagnostics-on mismatch is 1.7557× for JSON and 1.3459× for the fixture.
The stable retained grammar sample is 40.5% smaller (7,366 versus 12,388
bytes), but the retained 96-statement parse-state sample is 12.4% larger
(70,824 versus 63,016 bytes).

The CPU profile is dominated by direct closure execution, native RegExp,
product projections and recovery diagnostic construction; it exposes no
order-of-magnitude removable seam. The mixed diagnostic/success/allocation
V8 log records 168 scavenges/mark-compacts, 88 bailouts and 108
dependent-code invalidations. Candidate wrong-call-target/map and field-type
transitions occur when product shapes and diagnostics modes change, so the
trace is falsification evidence rather than a clean hot-only seal.

A stable mutable-array state variant was assayed and rejected: it pushed JSON
to 0.793–0.904× on representative result/state planes, increased retained
parse-state heap and did not lift the fixture. Replacing diagnostic
line/column materialization with a source loop improved some small points but
collapsed the 753-statement fixture to 0.774–0.889× through repeated
prefix scans. Neither rejected micro-variant is retained as source.

## Ruling

The direct-closure surface proves that the surviving laws can be expressed
without the retired machinery and with materially less grammar/runtime
surface. It does not prove the required speedup: all complete products remain
between 1.0656× and 1.5238×, far below 10×, and retained parse products are
larger.

The candidate is therefore **KILL** for formation. Its behavioral laws and
scannerless fixtures remain useful; its private runtime does not advance,
ship or coexist with production. No bootstrap, P3 completion, isolated proof,
formation, candidate pack, consumer, execution, API, Value CSS, BBNF or
release credit follows.
