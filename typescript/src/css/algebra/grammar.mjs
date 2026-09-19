// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · THE GRAMMAR, AUTHORED ONCE AGAINST THE SIGNATURE.
//
// This is the whole point of the candidate: `buildGrammar(A)` is written against the twenty-two
// typed operations and NOTHING else. `A` is any instantiation of the signature — the reifier, the
// JS lowering (parse-that's own Parser surface), the Wasm emitter. There is no `if (target)` here,
// there is no target-only operation, and there is no host function: if a lowering needs something
// this file cannot say, the candidate has failed its own premise (K-2), and that is the measurement
// the seat reports rather than the hole it patches.
//
// The slice is `ALGEBRA.md` §10, term for term, with the deviations DECLARED at the bottom of this
// file and in `VERDICT.md` — never silent.
//
// EVERY production is a FUNCTION returning a FRESH node. Sharing one node object between two use
// sites would make the reified term a DAG, and `.g`'s CL-1 walk reads a revisited object as a
// cycle. Freshness is therefore load-bearing, not style.

import { VALUE_REF_TARGETS, buildValueGrammar } from "./grammar/value.mjs";
import { R_disp } from "./tables.mjs";

const INF = Infinity;
const PI = Math.PI; //                                     3.141592653589793, §10.1 hue/rad

export function buildGrammar(A) {
    const { SCAN, LIT, NUM, DIGITS, TEXT, KW, END, SEQ, ALT, CUT, PURE, REP, DROP, DISPATCH, FAIL, EXPECT, CLAMP, SCALE, CTOR, TRY, RECOVER, REF } = A;

    /* ── §10's notations; each expands to the twenty-two ──────────────────────────────────── */
    const WS = () => DROP("ws", SCAN("ws", 0, INF));
    const WS1 = () => DROP("ws", SCAN("ws", 1, INF));
    const TOK = (b) => DROP("punct", LIT(b));
    const UNIT_KW = (b) => DROP("keyword", LIT(b));
    const OPT = (o, v) => ALT(o, PURE(v));
    const D2 = () => DIGITS(16, 2);
    const D1 = () => DIGITS(16, 1);

    /* ── X.P.W3.g — the numeric token's right edge (css-syntax-3 §4.3.3) ──────────────────── */
    //
    // §4.3.3 "Consume a numeric token": after the number is consumed, "If the next 3 input code
    // points would start an ident sequence, then: … Consume an ident sequence. Set the
    // <dimension-token>'s unit to the returned value." The unit is therefore the MAXIMAL ident
    // sequence, and the decision is made at the TOKEN boundary, before any production sees a
    // value: `120deg50` is ONE <dimension-token> with the (invalid) unit `deg50` — never a number
    // `120`, a unit `deg`, and a second value `50`. `255none` is one <dimension-token> with the
    // unit `none` — never a number and a `none` keyword.
    //
    // Two ZERO-WIDTH assertions realise that width, out of OP-01 alone: `SCAN(cls, 0, 0)` succeeds
    // exactly when the run of `cls` at the cursor is EMPTY. It consumes nothing, and because both
    // lowerings' `DROP` appends a `C` row only for a non-empty span, it appends nothing in either
    // target — so the drop's kind is inert by construction and the journals are untouched.
    //
    //   NO_UNIT  — no ident-START code point may follow a bare number, or the number carries a
    //              unit and the run is one <dimension-token> this position does not admit.
    //   UNIT_END — a dimension's unit is MAXIMAL, so no ident CONTINUATION code point may follow
    //              the unit an arm names; `deg50` is not `deg`.
    //
    // §4.3.9's third clause (U+005C REVERSE SOLIDUS beginning a valid escape) has no realization
    // anywhere in this slice — no production consumes an escape — so it is named here and not
    // coded: an input reaching it fails on the backslash itself, in both lowerings, already.
    const NO_UNIT = () => DROP("keyword", SCAN("ident-start", 0, 0));
    const UNIT_END = () => DROP("keyword", SCAN("ident", 0, 0));
    /** §4.3.3's `<number-token>`: a number that ends where it ends — no unit, no juxtaposition. */
    const NUMT = () => SEQ(NUM(), NO_UNIT());
    /** §4.3.3's `<dimension-token>` whose unit is EXACTLY `u`, read to its maximal width. */
    const DIM = (u) => SEQ(NUM(), UNIT_KW(u), UNIT_END());

    /* ── §10.1 `P:color` ──────────────────────────────────────────────────────────────────── */

    const hex = () =>
        SEQ(
            TOK("#"),
            ALT(
                CTOR("hex8", D2(), D2(), D2(), SCALE(1, 255, D2())),
                CTOR("hex6", D2(), D2(), D2()),
                CTOR("hex4", SCALE(17, 1, D1()), SCALE(17, 1, D1()), SCALE(17, 1, D1()), SCALE(1, 255, SCALE(17, 1, D1()))),
                CTOR("hex3", SCALE(17, 1, D1()), SCALE(17, 1, D1()), SCALE(17, 1, D1())),
            ),
        );

    const named = () => CTOR("named-color", KW("ident", "named-color"));
    const transparent = () => CTOR("transparent", KW("ident", "transparent"));
    const context = () => CTOR("context", KW("ident", "context-color"));
    const functional = () => DISPATCH("ident", "color-head");

    const none = () => KW("ident", "none");
    const pctOf = (num, den) => SCALE(num, den, SEQ(NUM(), TOK("%")));

    const rgbCh = () => CLAMP(0, 255, ALT(pctOf(255, 100), NUMT(), none()));
    const pctCh = () => CLAMP(0, 1, ALT(pctOf(1, 100), SCALE(1, 100, NUMT()), none()));
    const pctOnly = () => CLAMP(0, 1, ALT(pctOf(1, 100), none()));
    const okL = () => CLAMP(0, 1, ALT(pctOf(1, 100), NUMT(), none()));
    const okC = () => CLAMP(0, INF, ALT(pctOf(0.4, 100), NUMT(), none()));
    const alpha = () => CLAMP(0, 1, ALT(pctOf(1, 100), NUMT(), none()));
    const alphaSlash = () => OPT(SEQ(WS(), TOK("/"), WS(), alpha()), 1);
    const sep = () => SEQ(WS(), TOK(","), WS());

    const hue = () =>
        ALT(
            SCALE(1, 1, DIM("deg")),
            SCALE(0.9, 1, DIM("grad")),
            SCALE(180, PI, DIM("rad")),
            SCALE(360, 1, DIM("turn")),
            NUMT(),
            none(),
        );

    // DM-2, declared: `WS` between modern channels is the band's token-stream reading, which §10.1
    // adopts ("the slice adopts the band's reading (`WS`)"); `WS1` is the strict reading and one
    // notation away. The dissent is preserved, never settled here.
    const modernRgb = () => SEQ(rgbCh(), WS(), rgbCh(), WS(), rgbCh(), alphaSlash());
    const legacyRgb = () => SEQ(rgbCh(), sep(), rgbCh(), sep(), rgbCh(), OPT(SEQ(sep(), alpha()), 1));
    const modernHsl = () => SEQ(hue(), WS(), pctCh(), WS(), pctCh(), alphaSlash());
    const legacyHsl = () => SEQ(hue(), sep(), pctOnly(), sep(), pctOnly(), OPT(SEQ(sep(), alpha()), 1));

    // E-2 cure (3), ruled at COHESION §0n.3 and landed by `ALGEBRA-ADDENDA-2026-09-18.md`: the tail
    // of an unknown function is **`skipped` opaque text**, not a `keyword`. π_keyword (§4.5) reads
    // "an ASCII-folded literal that is NOT a leaf of `V`: `important`, a unit suffix `deg`" — and
    // `var(--brand)`'s `--brand` is not a literal of that class, so COMP-1c (fidelity of kind) failed
    // on every `var()` row. Re-kinding to `skipped` ("bytes a `RECOVER` consumed — any bytes", now
    // read as its general form: bytes no leaf of `V` claims) is cure (3); widening `π_keyword` —
    // cure (2) — is **REFUSED** by the ruling because it would admit non-identifiers as keywords, and
    // a seventh kind `opaque` — cure (1) — is the fallback the ruling reserves for a cited OP-13
    // break, which this seat measured does not occur.
    const balancedTail = () =>
        REP(ALT(SEQ(TOK("("), REF("balanced-tail"), TOK(")")), DROP("skipped", SCAN("any-but-paren", 1, INF))), 0, INF, null);

    const headRgb = () => CTOR("rgb", SEQ(TOK("("), CUT(), WS(), ALT(modernRgb(), legacyRgb()), WS(), TOK(")")));
    const headHsl = () => CTOR("hsl", SEQ(TOK("("), CUT(), WS(), ALT(modernHsl(), legacyHsl()), WS(), TOK(")")));
    const headOklch = () =>
        CTOR("oklch", SEQ(TOK("("), CUT(), WS(), okL(), WS(), okC(), WS(), hue(), alphaSlash(), WS(), TOK(")")));
    const headVar = () => CTOR("context", SEQ(TOK("("), CUT(), REF("balanced-tail"), TOK(")")));

    /* ── X.P.W3.h — the seven remaining css-color-4 heads, so `P:color` is TOTAL over every ORACLE
          head (COHESION §0s E-h1). Each channel's scale is the incumbent's `channelToken(part, k)`
          (`grammar.ts` parseFunctionalColor: a percent is `v * k / 100`, a bare number is `v`) and
          each clamp is css-color-4's parsed-value clamp where the spec names one — the same
          PB-03/PB-04 posture the slice's `hsl`/`rgb` channels already carry:
            hwb   §8.1  hue · whiteness/blackness as `pct-ch` (0..100% → 0..1, bare number /100, clamped)
            lab   §9.1  L 0..100 (100% = 100, clamped 0..100) · a, b (100% = 125, unclamped)
            lch   §9.2  L as lab · C (100% = 150, clamped >= 0) · hue
            oklab §9.3  L as `ok-l` (100% = 1, clamped 0..1) · a, b (100% = 0.4, unclamped)
            color §10   a predefined space, then three `<number>|<percentage>|none` (100% = 1,
                        unclamped — §10.1 forbids clamping in color()), `srgb` scaled ×255 onto the
                        frozen `rgb` shape, `xyz`/`xyz-d65` one space, `xyz-d50` adapted by its row.
          No legacy comma form exists for any of these (PB-11: `hwb(120, 30%, 40%)` is rejected). */
    const labL = () => CLAMP(0, 100, ALT(pctOf(100, 100), NUMT(), none()));
    const labAB = () => ALT(pctOf(125, 100), NUMT(), none());
    const lchC = () => CLAMP(0, INF, ALT(pctOf(150, 100), NUMT(), none()));
    const okAB = () => ALT(pctOf(0.4, 100), NUMT(), none());
    const cch = () => ALT(pctOf(1, 100), NUMT(), none());

    const headHwb = () =>
        CTOR("hwb", SEQ(TOK("("), CUT(), WS(), hue(), WS(), pctCh(), WS(), pctCh(), alphaSlash(), WS(), TOK(")")));
    const headLab = () =>
        CTOR("lab", SEQ(TOK("("), CUT(), WS(), labL(), WS(), labAB(), WS(), labAB(), alphaSlash(), WS(), TOK(")")));
    const headLch = () =>
        CTOR("lch", SEQ(TOK("("), CUT(), WS(), labL(), WS(), lchC(), WS(), hue(), alphaSlash(), WS(), TOK(")")));
    const headOklab = () =>
        CTOR("oklab", SEQ(TOK("("), CUT(), WS(), okL(), WS(), okAB(), WS(), okAB(), alphaSlash(), WS(), TOK(")")));
    //  `color(<space> c c c [/ a])`: the space ident is maximal, so `WS1` before the first channel
    //  is what makes `color(srgb.5 0 0)` nothing rather than `srgb` and `.5` (the incumbent splits
    //  the body on whitespace and finds three parts, not four).
    const headColor = () => SEQ(TOK("("), CUT(), WS(), DISPATCH("ident", "color-space"), WS(), TOK(")"));
    const space = (row, ch) => () => CTOR(row, SEQ(WS1(), ch(), WS(), ch(), WS(), ch(), alphaSlash()));
    const spaceSrgb = space("rgb", () => SCALE(255, 1, cch()));

    const colorBody = () => EXPECT(ALT(hex(), named(), transparent(), context(), functional()), "<color>");
    const color = () => SEQ(WS(), colorBody(), WS(), END());

    /* ── §10.2 `P:timing-function` ────────────────────────────────────────────────────────── */

    const headCubic = () =>
        CTOR(
            "cubic-bezier",
            SEQ(TOK("("), CUT(), WS(), NUM(), sep(), NUM(), sep(), NUM(), sep(), NUM(), WS(), TOK(")")),
        );
    const headSteps = () =>
        CTOR("steps", SEQ(TOK("("), CUT(), WS(), NUM(), OPT(SEQ(sep(), KW("ident", "jump-position")), 1), WS(), TOK(")")));
    //  §10.2's numbers keep a BARE `NUM`, and the reason is structural, not an omission. `NUMT`
    //  exists to stop a juxtaposed ident run from being read as a SECOND value; here every number's
    //  right edge is already pinned by a MANDATORY terminal that no ident code point can satisfy —
    //  `sep()`'s `,`, the closing `)`, or `WS1` before a `%` stop — so the run cannot be split and
    //  the verdict is identical either way. That identity is MEASURED, not asserted: the fixture's
    //  `pinned-edge` family drives the juxtaposition witnesses of all three timing productions and
    //  reads `ok:false css_syntax` from both lowerings.
    //  It is also the bound: a `SCAN` allocates a 16-byte span node in the Wasm arena even when it
    //  matches nothing, so guarding these three sites raises `P:timing-function`'s derived arena
    //  rate 98 → 114 B/code unit, which lowers X.P.W3.f's Θ.input 65,458 → 63,236 — a declared
    //  capacity whose label lives in `diagnostics.mjs`, outside this unit's writable set. Recorded
    //  as INFO-g1 rather than taken.
    const linearStop = () =>
        CTOR("linear-stop", NUM(), REP(SCALE(1, 100, SEQ(WS1(), NUM(), TOK("%"))), 0, 2, null));
    const headLinear = () =>
        CTOR("linear-function", SEQ(TOK("("), CUT(), WS(), REP(linearStop(), 2, INF, sep()), WS(), TOK(")")));

    // A MEASURED CONTRACT DEFECT, carried as a finding for `.h` rather than patched silently
    // (FF-5). §10.2 writes this `ALT` as [timing-keyword, step-alias, DISPATCH timing-head]. Under
    // ORDERED COMMITTED choice (OP-09) that order makes `linear(…)` unreachable: `KW ident
    // timing-keyword` matches the ident run `linear`, the arm SUCCEEDS, the `ALT` returns, and the
    // enclosing `END` then fails on `(`. Measured with §10.2's literal order:
    //     "linear(0, 0.5 50%, 1)" -> ok:false  trailing_input @6  expected ["end of input"]
    // i.e. one of the four `CssTimingFunction` kinds §10.2 itself puts in the slice cannot parse.
    // The dispatch arm is therefore FIRST here — the minimal reordering that makes all four kinds
    // reachable, and it changes no other input's verdict (`linear` with no `(` falls through to the
    // keyword arm because `head-linear`'s `TOK "("` fails BEFORE its `CUT`).
    const timing = () =>
        SEQ(
            WS(),
            EXPECT(
                ALT(
                    DISPATCH("ident", "timing-head"),
                    CTOR("timing-keyword", KW("ident", "timing-keyword")),
                    CTOR("step-alias", KW("ident", "step-alias")),
                ),
                "<timing-function>",
            ),
            WS(),
            END(),
        );

    /* ── §10.3 `P:stylesheet` — the malformed qualified rule ──────────────────────────────── */

    // DECLARED DEVIATION (recorded, never silent): §10.3 writes `sync-rule`'s terminals as bare
    // `SCAN`/`LIT`. INV-OWN (§2.4) requires every Span to be owned by a `DROP`, and `.g`'s
    // structural walk enforces it statically. `sync` runs UNDER DISCARD — whatever it appends to
    // `C` is truncated to the mark and the whole consumed span becomes ONE `skipped` entry — so the
    // kinds below are unobservable by construction (no `C` entry written here ever reaches a
    // product; COMP-1c is measured on every row and passes). The DROPs are therefore ownership
    // bookkeeping, not a semantic change.
    const syncRule = () =>
        ALT(
            SEQ(DROP("keyword", SCAN("any-but-semi-or-close", 1, INF)), OPT(ALT(TOK(";"), TOK("}")), null)),
            TOK(";"),
            TOK("}"),
        );

    // DECLARED DEVIATION: §10.3's `OPT(SEQ[WS, TOK "!", WS, UNIT "important"]) unit` cannot carry
    // "whether the OPT arm matched" — both arms yield `unit` and are indistinguishable in the
    // product. The expressible realization inside the twenty-two is `PURE true` / `PURE false`; the
    // constructor then reads a value rather than a match, and `Declaration.important` is exact.
    const important = () => ALT(SEQ(WS(), TOK("!"), WS(), UNIT_KW("important"), PURE(true)), PURE(false));

    // E-3, ruled at COHESION §0n.3 and landed by `ALGEBRA-ADDENDA-2026-09-18.md`: §10.3's two
    // `CUT`s are STRUCK. §5.2 scopes a `CUT` to its nearest enclosing `ALT` arm "through
    // `SEQ`/`CTOR`/`EXPECT`/`DROP` but not through `TRY`, `REP`, `RECOVER` or `REF` (those open a
    // new scope; a `CUT` directly under them is a walk error)". This one stands directly under the
    // `REP` of `qualified-rule`, so it commits nothing — `.f` measured both inert over 30,527 rows.
    const declaration = () =>
        CTOR(
            "declaration",
            SEQ(WS(), TEXT("ident", 1, INF), WS(), TOK(":"), WS(), REF("value-slice"), important(), WS()),
        );

    const qualifiedRule = () =>
        CTOR(
            "style-rule",
            SEQ(
                TEXT("any-but-brace-or-semi", 1, INF),
                TOK("{"),
                // E-3, the second struck `CUT`: this one stands directly under `RECOVER`'s body
                // (`stylesheet`'s `RECOVER css_syntax rule sync-rule`), which §5.2 also names as a
                // new scope. Struck by `ALGEBRA-ADDENDA-2026-09-18.md`; measured inert by `.f`.
                REP(declaration(), 0, INF, SEQ(WS(), TOK(";"), WS())),
                OPT(SEQ(WS(), TOK(";")), null),
                WS(),
                TOK("}"),
            ),
        );

    // DECLARED DEVIATION, and a CONTRACT TENSION recorded rather than resolved silently: §10.3
    // writes `value-slice := CTOR value-color [REF color-body]`, while §8 D-3 states the slice has
    // "exactly two `REF` sites (`balanced-tail`, `value-slice`)". Both cannot hold — a `REF
    // color-body` is a third site, and `REF` is the operator that counts `depth` against
    // `Θ.depthBound`. The realization takes the DEBT CLAUSE (§8 D-3 binds every candidate) and
    // inlines `color-body`, leaving exactly the two back-edges D-3 names. Reported to `.h`.
    const valueSlice = () => CTOR("value-color", colorBody());
    const stylesheet = () =>
        CTOR("stylesheet", SEQ(REP(SEQ(WS(), RECOVER("css_syntax", qualifiedRule(), syncRule())), 0, INF, null), WS(), END()));

    /* ── the grammar map ──────────────────────────────────────────────────────────────────── */

    const terms = {
        color: color(),
        "color-body": colorBody(),
        hex: hex(),
        named: named(),
        transparent: transparent(),
        context: context(),
        functional: functional(),
        "modern-rgb": modernRgb(),
        "legacy-rgb": legacyRgb(),
        "rgb-ch": rgbCh(),
        "modern-hsl": modernHsl(),
        "legacy-hsl": legacyHsl(),
        hue: hue(),
        "pct-ch": pctCh(),
        "pct-only": pctOnly(),
        "ok-l": okL(),
        "ok-c": okC(),
        "alpha-slash": alphaSlash(),
        alpha: alpha(),
        sep: sep(),
        "balanced-tail": balancedTail(),
        timing: timing(),
        "linear-stop": linearStop(),
        stylesheet: stylesheet(),
        rule: qualifiedRule(),
        "qualified-rule": qualifiedRule(),
        declaration: declaration(),
        "value-slice": valueSlice(),
        "sync-rule": syncRule(),
    };

    // The dispatch rows' terms. `ALGEBRA.md` §4.4 gives `R_disp` the row shape `{key → term}`, so
    // these live in the REGISTRY and the `DISPATCH` term carries two registry references (§4.6's
    // `DISPATCH cls,disp`, arity 2). They are returned beside the map so the seat's own probe can
    // walk them with `.g`'s own checkers — the harness's structural walk reaches only
    // `grammar().terms`, and that blind spot is MEASURED in `VERDICT.md` rather than left implicit.
    const dispatchTerms = {
        "head-rgb": headRgb(),
        "head-hsl": headHsl(),
        "head-oklch": headOklch(),
        "head-var": headVar(),
        "head-cubic-bezier": headCubic(),
        "head-steps": headSteps(),
        "head-linear": headLinear(),
        // X.P.W3.h — the seven heads and `color()`'s eight space productions
        "head-hwb": headHwb(),
        "head-lab": headLab(),
        "head-lch": headLch(),
        "head-oklab": headOklab(),
        "head-color": headColor(),
        "space-srgb": spaceSrgb(),
        "space-srgb-linear": space("srgb-linear", cch)(),
        "space-display-p3": space("display-p3", cch)(),
        "space-a98-rgb": space("a98-rgb", cch)(),
        "space-prophoto-rgb": space("prophoto-rgb", cch)(),
        "space-rec2020": space("rec2020", cch)(),
        "space-xyz": space("xyz", cch)(),
        "space-xyz-d50": space("xyz-d50", cch)(),
    };

    const entries = {
        "P:color": "color",
        "P:timing-function": "timing",
        "P:stylesheet": "stylesheet",
    };

    /* ── X.P.W3.h — the value grammar (`grammar/value.mjs`), composed: one more source file, the
          same algebra `A`, the same notations, and three more entries in the ONE grammar map both
          lowerings instantiate. Its terms re-use `hex`/`named`/`transparent` byte for byte. */
    //  The operations are handed over as the locals destructured ONCE above, never as `A` itself:
    //  `lower.mjs` proves the closed operator set by recording every read of `A`, and a second
    //  destructure would read the twenty-two twice (a duplicate is a HALT there, by design).
    const valueGrammar = buildValueGrammar(
        { SCAN, LIT, NUM, TEXT, KW, END, SEQ, ALT, CUT, PURE, REP, DROP, DISPATCH, EXPECT, CTOR, REF },
        { WS, TOK, hex, named, transparent },
    );
    for (const name of Object.keys(valueGrammar.terms)) {
        if (terms[name] !== undefined) throw new Error(`HALT: the value grammar redefines production '${name}'`);
    }
    Object.assign(terms, valueGrammar.terms);
    Object.assign(entries, valueGrammar.entries);

    for (const d of Object.values(R_disp)) {
        for (const target of Object.values(d.rows)) {
            if (!dispatchTerms[target]) throw new Error(`HALT: R_disp names '${target}', which the grammar does not define`);
        }
    }

    return { entries, terms, dispatchTerms };
}

/**
 * The REF targets the grammar uses — §8 D-3's two back-edges and the value grammar's one
 * (X.P.W3.h, `value-item`: a call's argument list), and no others. The grammar map is finite and
 * closed (OP-22); a lowering resolves a back-edge by name against `terms`, never by search.
 */
export const REF_TARGETS = ["balanced-tail", "value-slice", ...VALUE_REF_TARGETS];
