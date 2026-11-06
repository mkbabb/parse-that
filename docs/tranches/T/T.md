# Tranche T — truthful TypeScript execution and package

## Goal

Replace the mutable, process-coupled TypeScript runtime with one immutable parser
definition graph executed by one invocation-owned context. Publish one truthful
result/type/package surface, break both source SCCs, and prove it from a clean
tarball consumer.

## Completion criteria

Tranche T is complete only when:

1. `Parser` stores definition only; it has no public raw executor or last-result
   observer.
2. Source, diagnostics, recovery, commitment, and memo tables belong to one call.
3. `parse` returns a discriminated result and `parseOrThrow` is the sole throwing
   value shortcut.
4. Every combinator's declaration equals its runtime value and obeys checkpoint,
   progress, and failure laws.
5. The runtime, type-only, declaration, and built-artifact graphs have no SCC
   crossing a feature-module boundary.
6. A clean build, pack, isolated install, type probe, ESM probe, browser probe, and
   byte-budget probe pass without source imports or skipped artifacts.
7. Two fresh hostile audits are consecutively clean.

## Architecture under test

```text
model
  ↓
run ─────────────┐
  ↓              │
parser           │
  ↓              │
combinators  primitives
  ↓          ↙   ↓
memo       diagnostics/debug
  ↓          ↘   ↓
domain parsers   public entrypoints
```

Entrypoints are sinks. Domain parsers import feature modules directly; feature
modules never import an entrypoint. Specialized helpers are free functions when a
`Parser` method would introduce an upward dependency.

## Clean-break surface

- Remove `Parser.state`, public `.parser`, `parseState`, global diagnostic toggles,
  diagnostic getters/resetters, `resetPackrat`, and dual ESM/CJS publication.
- Add `ParseResult<T>`, `ParseFailure`, `ParseOptions`, `parseOrThrow`, explicit
  sequence projection helpers, closed ASCII dispatch keys, and branded coordinate
  values at public crossings.
- Retain no alias, deprecated path, compatibility overload, or source-level
  fallback.

## Wave DAG

```text
T.W0 artifact truth
  ↓
T.W1 invocation kernel
  ├──→ T.W2 result and combinator algebra
  ├──→ T.W3 diagnostics, recovery, and commitment
  └──→ T.W4 memo and left recursion
              ↓
        T.W5 module/package transposition
              ↓
        T.W6 coordinate and consumer truth
              ↓
        T.W7 GESTALT-P1 and clean audits
```

W2–W4 may prototype in parallel after W1, but their implementations land in that
order so each gate starts from one result/checkpoint contract.

## Proof artifacts

- `prototypes/invocation-kernel.ts` — current minimal carrier falsifier.
- deterministic source/runtime/declaration/artifact graph JSON and DOT.
- compile-fail type corpus and runtime mirror corpus.
- packed-consumer craters for Node ESM, browser/Vite, and declaration resolution.
- allocation, cold-start, throughput, and bundle-size before/after ledger.

## Routed remainder

Rust scanner policy, regex ownership/bootstrap, TS↔Rust semantic isomorphism, and
Value CSS adoption belong to Tranche U. T may create their crossing contracts but
cannot declare them green.
