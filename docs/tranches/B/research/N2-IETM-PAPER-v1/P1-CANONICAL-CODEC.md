# P1 — canonical byte codec

Status: `PAPER_ONLY / ZERO_CREDIT / SOURCE_WITHHELD`

Future source budget: `1 module / 170 nonblank noncomment LOC maximum`.
Paper budget: `100 nonblank lines maximum`.

## Byte language

P1 owns one strict UTF-8 JSON subset and one encoder/decoder pair. Accepted
bytes contain no BOM or whitespace. Object keys are unique and strictly
increasing by unsigned UTF-8 byte sequence. Integers use canonical base-10
safe-integer spelling: `0` or optional `-` plus a nonzero digit and remaining
digits; `-0`, leading zero, fraction, exponent, overflow, `NaN`, and infinity
are rejected. Non-JSON values use declaration-owned tagged records.

Strings accept valid shortest UTF-8 scalar sequences. Printable scalars are
literal except quote and backslash. The only escapes are `\"`, `\\`, `\b`,
`\f`, `\n`, `\r`, `\t`, and lowercase `\u00xx` for remaining U+0000–001F.
Escaped slash, uppercase hex, Unicode escapes for printable scalars, long-form
escapes for characters with short escapes, unpaired surrogates, overlong UTF-8,
non-scalars, duplicate keys, and unordered keys are rejected.

For every accepted `CanonicalBytes B`, P1 must prove byte identity:
`encodeCanonical(decodeCanonical(B)) === B`. Equality is byte-for-byte, not a
digest or decoded-value comparison. The decoder cannot accept a spelling the
encoder would normalize. External byte arrays are copied before validation;
decoded graphs are deeply immutable.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E01` | `P1 -> P0` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | canonical byte identity already proved |
| `E07` | `P1 -> P6` | `rewriteCanonical(bytes: CanonicalBytes, injector: InjectorId) -> CanonicalBytes` | output must round-trip canonically |
| `E10` | `P1 -> P7` | `canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>` | accepted grammar and byte-identity law |

P1 has no other interface input or output. P6 requests an injector rewrite;
P1 performs canonical re-encoding but does not choose the mutation or expected
failure. P0 receives no live decoder callback.

## Required paper counterexamples

The paper review must disposition literal slash versus escaped slash; short
control escape versus `\u00xx`; lowercase versus uppercase hex; literal scalar
versus unnecessary Unicode escape; duplicate and reordered keys; `0`, `-0`,
leading zero and adjacent maximum-safe integers; isolated high/low surrogates;
astral pairs; overlong UTF-8; trailing bytes; and alternate tagged-number
spellings. Every alternate spelling is own-reason RED.

No permissive parse followed by normalization, locale ordering, caller
decoder, caller encoder, JSON library fallback, or second codec path is
allowed. No source or execution is authorized.
