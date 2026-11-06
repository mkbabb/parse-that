# T transaction-boundary assay

- Assayed: `2026-07-22`
- Mode: read-only source/package/evidence audit
- Status: **uplift candidate only**
- Product, publication, consumer, wave, lock, or tranche credit: **zero**

No published, accepted, or handback-authorized parse-that artifact provides an
idiomatic `atomic`/`attempt` combinator or full transactional restoration for
sequential composition. These bytes are formation evidence only. They do not
authorize product work while parse-that execution is phase-paused, and private
prototype bytes are not consumable artifacts.

## Published authority

`@mkbabb/parse-that@1.0.0` is tag `v1.0.0`, commit
`7eab78c89961001a689952c091fdbbf64af735da`. The current TypeScript source is
byte-identical to that tag.

| Artifact | SHA-256 |
|---|---|
| `typescript/package.json` | `f53ca9b85c43e65c1f3f8a21414f990211d8d0e6a7f07df805557cdb6b50f4ff` |
| `typescript/src/parse/state.ts` | `eab225388ea463a8ccc33345acaa6df5cae9467321d02f5f4192f6171c838575` |
| `typescript/src/parse/parser.ts` | `16978b12a0674a218e4af041606232d0d81fc57f3f6d7bdb29149173b4fe3c50` |
| `typescript/src/parse/leaf.ts` | `fce839c2c22858c1133d6576c3a053cdde0a88e4c0d2a838a5011dec08ba8a07` |
| `typescript/dist/packrat-entry-CS1td-8B.js` | `1f8674c3d325579363356e1fd091a3735ae9a7ac9da0cb61a4ca0ebfb6d474a8` |
| `typescript/dist/parse.js` | `2ad25cf0093f5caf66b359aae563eb0a6d4e77a38fd569b430b70cdd2e4ed56b` |
| `typescript/dist/parse.cjs` | `c6ac1f04c1654d922e35e192412f64080b46138b8f4b8fb76a4769897f31259c` |
| root declarations | `23d9c642af4cb6195652d1d60dae1dc569680d708ab56b6bc9e01c35b0852e33` |
| test/script ledger | `582fa7c61d0e298716b6e66ba438e6fa9dd1544bd99ce80b54043e32038e1f0f` |

The manifest exports `.`, `./core`, `./diagnostics`, `./packrat`, and
`./utils`; neither declarations nor runtime export `atomic` or `attempt`.

`ParserState.save()` records only `{ offset, value }`. `restore()` restores
those fields and clears `isError`; it does not snapshot furthest failure,
expected items, suggestions, secondary spans, recovery state, or other global
diagnostic state. No production combinator calls either method.

`Parser.then` and fused `all` arities 2, 3, and variadic save and restore only
the offset on downstream failure. They leave the predecessor/downstream
`state.value` mutation live. `or` and `any` likewise reset only offset before
the next arm, so a failed arm's value can reach its successor. The same
offset-only checkpoint pattern appears in `skip`, `next`, `opt`, `wrap`,
flagged parsing, repetition, and lookahead. The built ESM has the same behavior.

No existing test names or proves `atomic`, `attempt`, `save`, `restore`, or
predecessor-value rollback.

## Private prototype boundary

Invocation-kernel v4 uses explicit outcomes and typed transaction journals,
which addresses mutable predecessor-value leakage architecturally. It exposes
no accepted `attempt`, is version `0.0.0`, and has no production, publication,
or consumer authority.

| Artifact | SHA-256 |
|---|---|
| prototype package | `7f523159fb66d9969fc62e938880f60de08846af4cb0127f5b79f462a0bf39e4` |
| prototype source ledger | `6bc0e3fdc6296e3c0872208229104299ecc44e38a92a777df80f0a37005ca1dc` |
| `prototypes/invocation-kernel-v4/EVIDENCE.md` | `d1c7ebed20a959652ca64f0f7e29853fe8d90af0e12fae0d917b4d401ac284c9` |

`docs/tranches/U/U.md` remains `FORMED; born RED` at SHA-256
`3ff4193ee3a5ea7b5696bd3eb91940ddc767e76eb56a7b1179b149ea098c147c`.
No U artifact qualifies as consumable or accepted.

## Born-RED uplift requirements

1. `then` and every `all` arity restore the exact entry value and offset after
   downstream failure while retaining only explicitly merged local failure
   evidence.
2. Every `or`/`any` arm starts from the same entry value/cursor; terminal
   failure restores them as well.
3. A sentinel predecessor value and a failing parser that overwrites
   `state.value` make current `1.0.0` fail before any repair.
4. Nested, diagnostic, exception, memo, lookahead, repetition, and recovery
   witnesses prevent “full transaction” from being reduced to cursor/value.
5. One internal checkpoint/outcome invariant governs the combinator algebra.
   A public wrapper alone is insufficient because it leaves the built-ins
   internally inconsistent.

No implementation is authorized by this assay. It is a T/U design input for a
future owner-authorized parse-that execution epoch.
