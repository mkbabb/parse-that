#!/usr/bin/env python3
"""Generate rust/regex/src/case_tables.rs from the Unicode Character Database.

The tables are ECMAScript's case canonicalization (ECMA-262 §22.2.2.7.3
Canonicalize) at one pinned Unicode version, never hand-edited and never
taken from another crate's tables:

- u/v mode (`/iu`): Canonicalize(ch) is the simple case folding of
  CaseFolding.txt (status C and S). Two scalars match under `/iu` when their
  foldings are equal; FOLD_U lists every scalar whose class has more than one
  member, with its class.
- non-u mode (`/i`): Canonicalize(ch) is toUppercase(ch) (UnicodeData simple
  uppercase, overridden by SpecialCasing's unconditional full mapping) when
  that is one UTF-16 code unit, and ch itself when the result is longer, or
  when ch >= 128 and the result is < 128. Only BMP code units take part; an
  astral scalar is two surrogate halves that canonicalize to themselves.
  FOLD_NONU lists the classes with more than one member.
- IU_WORD_EXTRA: the scalars outside [A-Za-z0-9_] whose u-mode folding is in
  it (the `/iu` `\\w` and `\\b` word set's extra members).
- SPACE_ZS: the `Zs` scalars (ECMAScript WhiteSpace includes every `Zs`).

The version is the Unicode version of node 24's ICU (RULINGS OR-6): node
v24.22.3 ships ICU 78.3 = Unicode 17.0. The input files must match the
pinned sha256s; the output header records them.

Usage: gen_tables.py <ucd-dir> <out.rs>
       (inputs: https://www.unicode.org/Public/17.0.0/ucd/{CaseFolding,UnicodeData,SpecialCasing}.txt)
"""
import hashlib
import os
import sys

VERSION = "17.0.0"
PIN = "node v24.22.3, ICU 78.3 (U_UNICODE_VERSION 17.0)"
INPUTS = {
    "CaseFolding.txt": "ff8d8fefbf123574205085d6714c36149eb946d717a0c585c27f0f4ef58c4183",
    "UnicodeData.txt": "2e1efc1dcb59c575eedf5ccae60f95229f706ee6d031835247d843c11d96470c",
    "SpecialCasing.txt": "efc25faf19de21b92c1194c111c932e03d2a5eaf18194e33f1156e96de4c9588",
}


def data_lines(text):
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            yield [f.strip() for f in line.split(";")]


def unicode_data(text):
    """Code point -> (category, simple uppercase), ranges expanded."""
    out = {}
    first = None
    for f in data_lines(text):
        cp = int(f[0], 16)
        name, cat = f[1], f[2]
        upper = int(f[12], 16) if f[12] else None
        if name.endswith(", First>"):
            first = cp
            continue
        if name.endswith(", Last>"):
            for c in range(first, cp + 1):
                out[c] = (cat, None)
            first = None
            continue
        out[cp] = (cat, upper)
    return out


def main():
    ucd, out_path = sys.argv[1], sys.argv[2]
    texts = {}
    hashes = {}
    for name, want in INPUTS.items():
        raw = open(os.path.join(ucd, name), "rb").read()
        got = hashlib.sha256(raw).hexdigest()
        if got != want:
            raise SystemExit(f"{name}: sha256 {got}, pinned {want}")
        hashes[name] = got
        texts[name] = raw.decode("utf-8")
    if f"CaseFolding-{VERSION}.txt" not in texts["CaseFolding.txt"].splitlines()[0]:
        raise SystemExit("CaseFolding.txt is not version " + VERSION)

    # u/v mode: simple case folding (C + S).
    fold = {}
    for f in data_lines(texts["CaseFolding.txt"]):
        if f[1] in ("C", "S"):
            fold[int(f[0], 16)] = int(f[2], 16)

    def canon_u(c):
        return fold.get(c, c)

    # non-u mode: toUppercase, one code unit, no ASCII from non-ASCII.
    ud = unicode_data(texts["UnicodeData.txt"])
    full_upper = {}
    for f in data_lines(texts["SpecialCasing.txt"]):
        # code; lower; title; upper; (condition)
        if len(f) >= 5 and f[4]:
            continue  # conditional mappings do not apply to toUppercase
        full_upper[int(f[0], 16)] = [int(x, 16) for x in f[3].split()]

    def utf16_len(cps):
        return sum(2 if c > 0xFFFF else 1 for c in cps)

    def canon_nonu(c):
        if c > 0xFFFF or 0xD800 <= c <= 0xDFFF:
            return c
        if c in full_upper:
            up = full_upper[c]
        else:
            u = ud.get(c, (None, None))[1]
            up = [u] if u is not None else [c]
        if utf16_len(up) != 1:
            return c
        cu = up[0]
        if c >= 128 and cu < 128:
            return c
        return cu

    def classes(canon, universe):
        groups = {}
        for c in universe:
            groups.setdefault(canon(c), []).append(c)
        cls = sorted(sorted(g) for g in groups.values() if len(g) > 1)
        return cls

    universe_u = set(fold) | set(fold.values())
    cls_u = classes(canon_u, sorted(universe_u))
    universe_n = [c for c in range(0x10000) if not 0xD800 <= c <= 0xDFFF]
    cls_n = classes(canon_nonu, universe_n)

    basic = set(range(0x30, 0x3A)) | set(range(0x41, 0x5B)) | {0x5F} | set(range(0x61, 0x7B))
    iu_extra = sorted(c for c in universe_u if c not in basic and canon_u(c) in basic)

    zs = sorted(c for c, (cat, _) in ud.items() if cat == "Zs")
    zs_ranges = []
    for c in zs:
        if zs_ranges and zs_ranges[-1][1] + 1 == c:
            zs_ranges[-1][1] = c
        else:
            zs_ranges.append([c, c])

    def emit_classes(name, cls, doc):
        members = sorted((c, i) for i, g in enumerate(cls) for c in g)
        s = [f"/// {doc}", f"pub static {name}_CLASSES: &[&[u32]] = &["]
        for g in cls:
            s.append("    &[" + ", ".join(f"0x{c:04X}" for c in g) + "],")
        s.append("];")
        s.append(f"/// Every member of a `{name}_CLASSES` class, sorted, with its class index.")
        s.append(f"pub static {name}_MEMBERS: &[(u32, u16)] = &[")
        for c, i in members:
            s.append(f"    (0x{c:04X}, {i}),")
        s.append("];")
        return s

    out = [
        "// @generated by rust/regex/tools/ucd/gen_tables.py. Do not edit by hand:",
        "// change the generator or its pinned inputs, then regenerate.",
        f"// Unicode {VERSION}; pin: {PIN} (OR-6).",
    ]
    for name, h in hashes.items():
        out.append(f"// input {name} sha256 {h}")
    out += [
        "",
        "//! ECMAScript case canonicalization tables (ECMA-262 Canonicalize).",
        "",
        f'/// The Unicode version these tables are generated from.\npub const UNICODE_VERSION: &str = "{VERSION}";',
        "",
    ]
    out += emit_classes(
        "FOLD_U",
        cls_u,
        "u/v mode: classes of scalars with equal simple case folding (CaseFolding.txt C+S).",
    )
    out.append("")
    out += emit_classes(
        "FOLD_NONU",
        cls_n,
        "non-u mode: classes of BMP code units with equal toUppercase canonicalization.",
    )
    out.append("")
    out.append("/// Scalars outside `[A-Za-z0-9_]` whose u-mode folding is in it (`/iu` word set).")
    out.append("pub static IU_WORD_EXTRA: &[u32] = &[" + ", ".join(f"0x{c:04X}" for c in iu_extra) + "];")
    out.append("")
    out.append("/// The `Zs` (space separator) scalars, as inclusive ranges.")
    out.append("pub static SPACE_ZS: &[(u32, u32)] = &[" + ", ".join(f"(0x{a:04X}, 0x{b:04X})" for a, b in zs_ranges) + "];")
    open(out_path, "w", encoding="utf-8").write("\n".join(out) + "\n")
    print(f"case tables: Unicode {VERSION}; u classes {len(cls_u)}, non-u classes {len(cls_n)}, iu word extra {[hex(c) for c in iu_extra]}, Zs ranges {len(zs_ranges)} -> {out_path}")


if __name__ == "__main__":
    main()
