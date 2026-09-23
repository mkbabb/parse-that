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

import { buildAnimationGrammar } from "./grammar/animation.mjs";
import { STYLESHEET_REF_TARGETS, buildStylesheetGrammar } from "./grammar/stylesheet.mjs";
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
    const modernHsl = () => SEQ(hue(), WS(), pctCh(), WS(), pctCh(), alphaSlash());

    // X.P.W3.l — F-k2, ORDERED CURED (COHESION §0v: "the candidate accepts forbidden legacy comma
    // forms — mixed `<number>`/`<percentage>` or `none`, css-color-4 §8.1"), MEASURED, and the cure
    // WITHDRAWN — the legacy forms below are X.P.W3.h's, byte for byte. Two cures were landed and
    // measured at G-1 before this note was written:
    //
    //   (1) §8.1 as ruled — two homogeneous three-channel arms, no `none`, a well-formed
    //       `, <alpha-value>`. The nine F-k2 cells rejected as ordered, and 575 NEW misses opened on
    //       each colour/value row (593 from 10; `coerceToSyntax` lost its TOTAL, 58 cells): every
    //       one a FALSE_REJECT of a mixed-type or `none` legacy form the ORACLE ACCEPTS —
    //       `rgb(.780, 33%, 151.32)`, `rgb(+0, 159.63, none)` — and that the wave's OWN rulings
    //       expect accepted: PB-01/02 declares `none` a well-formed fourth argument
    //       (`rgb(58%, 14%, .816, none)` is its cell), PB-04/05 clamps `rgb(-11, none, none)`.
    //   (2) the oracle's own reading (commas rewritten to spaces, exactly three channels, the alpha
    //       behind `/` alone) — G-1 fell 46 → 45 against PB-08's 2,220 ruled rejections, SP-1's six
    //       and PB-01/02's ruled acceptances.
    //
    // WHAT THE NINE CELLS ARE, measured at the cell: every one is a four-argument legacy form whose
    // FOURTH argument is a NON-FINITE numeral — `rgb(none, 6e167, 27%, 6e316)`,
    // `rgb(.843, -0, +54, 5e498)`, `rgb(80%, .55, -17, 2e371)` — three of the ten samples carry no
    // `none` and no mixed type at all. The oracle rejects the four-argument form outright; the
    // candidate clamps the alpha to 1 (PB-04/05) and accepts. No SINGLE ruling repairs the cell:
    // ADJ-3's clamp leaves four arguments (the oracle still rejects), PB-01/02's drop requires a
    // FINITE alpha (`legacyAlphaEdits`), so the resolver falls back to the raw verdict. That is
    // GROUND-C's own case — "overflow is not a syntax error; range per production; per-cell
    // adjudication at W4" — and a grammar that rejected it would have to key on finiteness, which
    // §0v refuses (`<finite-number>` as a rejection label REFUSED). `.k`'s `legacyFormMisaccept`
    // characterized the cells by their neighbours' spelling rather than by the byte that fails;
    // the id stands in the remainder and the re-characterization is the unit's finding (F-l1).
    //
    // ── X.P.W3.n — THE §8.1 CURE, RE-LANDED, THIS TIME WITH ITS ADJUDICATION ─────────────────
    //
    // COHESION §0w rules the residue: "**incumbent defect ID-5.** `.n` lands the §8.1 cure
    // (candidate REJECTS) together with the ID-5 class predicate so the exposed cells are
    // adjudicated, not counted — **the two withdrawn cures failed only because the predicate did
    // not exist**." Cure (1) above is therefore restored BYTE FOR BYTE as its own note describes
    // it, and `adjudications.mjs`'s **ID-5** class carries the 575 cells it exposes: a legacy comma
    // form the ORACLE accepts and css-color-4 forbids is now a DECLARED divergence with `expect:
    // "reject"`, not a FALSE_REJECT. The two land in ONE commit, because either alone is a defect.
    //
    // WHAT THE SPECIFICATION SAYS, and the whole of what these two productions encode:
    //   css-color-4 §8.1  `<legacy-rgb-syntax> = rgb( <percentage>#{3} , <alpha-value>? ) |
    //                      rgb( <number>#{3} , <alpha-value>? )` — the three channels are ONE type
    //                      throughout (a `#{3}` over a single production, not a choice per slot),
    //                      and `none` is admitted by the MODERN grammar alone.
    //   css-color-4 §7.1  `<legacy-hsl-syntax> = hsl( <hue>, <percentage>, <percentage>,
    //                      <alpha-value>? )` — the hue is `<number>|<angle>` (never `none` here),
    //                      and saturation/lightness are `<percentage>` (never a bare number — that
    //                      is SP-1's own row — and never `none`).
    //   css-color-4 §4.2  `<alpha-value> = <number> | <percentage> | none` — UNCHANGED. `none` as
    //                      the FOURTH argument stays lawful, which is what PB-01/02's own cell
    //                      `rgb(58%, 14%, .816, none)` requires, and `alpha()` is untouched below.
    //
    // The nine cells F-l1 re-characterized are NOT keyed on finiteness here and nothing about
    // GROUND-C moves: `rgb(.843, -0, +54, 5e498)` — three bare numbers, a non-finite alpha — is
    // still admitted by this grammar and still stands in the remainder under GROUND-C. Every cell
    // this cure turns is turned by the CHANNEL TYPES, which is the only thing §8.1 is about.
    //
    // THE ARMS ARE FLAT, and that is load-bearing: `CTOR("rgb", …)` reads its channels off the
    // SEQ's own tuple, so an `ALT` of two three-channel SEQs UNDER one outer SEQ answers
    // `[[r,g,b], alpha]` — measured here before this note was written: `rgb(1, 2, 3)` came back
    // `channels:[{t:[1,2,3]}, 1, null]` in the JS lowering. The alpha tail is therefore spelled
    // once per arm rather than shared.
    const rgbPct = () => CLAMP(0, 255, pctOf(255, 100));
    const rgbNum = () => CLAMP(0, 255, NUMT());
    const legacyRgb = () =>
        ALT(
            SEQ(rgbPct(), sep(), rgbPct(), sep(), rgbPct(), OPT(SEQ(sep(), alpha()), 1)),
            SEQ(rgbNum(), sep(), rgbNum(), sep(), rgbNum(), OPT(SEQ(sep(), alpha()), 1)),
        );
    /** `<hue>` in the LEGACY form: `<number> | <angle>`, and no `none` (§7.1 admits it only modern). */
    const legacyHue = () =>
        ALT(
            SCALE(1, 1, DIM("deg")),
            SCALE(0.9, 1, DIM("grad")),
            SCALE(180, PI, DIM("rad")),
            SCALE(360, 1, DIM("turn")),
            NUMT(),
        );
    /** `<percentage>` in the LEGACY form: a percentage and nothing else (§7.1). */
    const legacyPct = () => CLAMP(0, 1, pctOf(1, 100));
    const legacyHsl = () => SEQ(legacyHue(), sep(), legacyPct(), sep(), legacyPct(), OPT(SEQ(sep(), alpha()), 1));

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

    /* ── §10.3 `P:stylesheet` — X.P.W3.j: the whole family moved to `grammar/stylesheet.mjs` ── */
    //
    // The slice's four productions (`stylesheet` · `qualified-rule` · `declaration` ·
    // `value-slice`) stood here and read a stylesheet as a list of qualified rules whose every
    // declaration value is a COLOUR (`value-slice := CTOR value-color [REF color-body]`). That was
    // §10.3's own text and it was honest at W2 — the value grammar did not exist yet. X.P.W3.h
    // landed it and published `value-body` as a `REF` target, so the CONTRACT TENSION recorded
    // here ("§10.3 writes `value-slice := CTOR value-color [REF color-body]`, while §8 D-3 states
    // the slice has exactly two `REF` sites … Reported to `.h`") is discharged at the far end: a
    // declaration's value is now `REF("value-body")`, which is what `parseDeclarations` calls, and
    // `value-slice` has no reader left. The family's new home states each move and its reason.

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
    };

    /* ── X.P.W3.h — the value grammar (`grammar/value.mjs`), composed: one more source file, the
          same algebra `A`, the same notations, and three more entries in the ONE grammar map both
          lowerings instantiate. Its terms re-use `hex`/`named`/`transparent` byte for byte. */
    //  The operations are handed over as the locals destructured ONCE above, never as `A` itself:
    //  `lower.mjs` proves the closed operator set by recording every read of `A`, and a second
    //  destructure would read the twenty-two twice (a duplicate is a HALT there, by design).
    const valueGrammar = buildValueGrammar(
        { SCAN, LIT, NUM, TEXT, KW, END, SEQ, ALT, CUT, PURE, REP, DROP, DISPATCH, FAIL, EXPECT, CTOR, REF },
        //  X.P.W4.h — `WS1` joins the value grammar's notations for `ITEM_SEP`'s first arm (F-w4f-2):
        //  the abutting reading of a space group is the one that may not begin with a `!`.
        { WS, WS1, TOK, hex, named, transparent },
    );
    for (const name of Object.keys(valueGrammar.terms)) {
        if (terms[name] !== undefined) throw new Error(`HALT: the value grammar redefines production '${name}'`);
    }
    Object.assign(terms, valueGrammar.terms);
    Object.assign(entries, valueGrammar.entries);

    /* ── X.P.W3.i — the animation family (`grammar/animation.mjs`), composed the same way: one more
          source file, the same algebra `A`, the same notations, four more entries in the ONE grammar
          map both lowerings instantiate, and two more dispatch terms for `scroll()` / `view()`. */
    const animationGrammar = buildAnimationGrammar(
        { SCAN, TEXT, KW, NUM, END, SEQ, ALT, CUT, REP, DROP, DISPATCH, FAIL, EXPECT, CTOR, REF },
        { WS, WS1, TOK, OPT },
    );
    for (const name of Object.keys(animationGrammar.terms)) {
        if (terms[name] !== undefined) throw new Error(`HALT: the animation grammar redefines production '${name}'`);
    }
    for (const name of Object.keys(animationGrammar.dispatchTerms)) {
        if (dispatchTerms[name] !== undefined) throw new Error(`HALT: the animation grammar redefines dispatch term '${name}'`);
    }
    Object.assign(terms, animationGrammar.terms);
    Object.assign(entries, animationGrammar.entries);
    Object.assign(dispatchTerms, animationGrammar.dispatchTerms);

    /* ── X.P.W3.j — the stylesheet family (`grammar/stylesheet.mjs`), composed the same way: the
          same algebra `A`, the same notations, and `P:stylesheet` over the productions that now
          read a declaration's value through `REF("value-body")` — X.P.W3.h's own back-edge.
          X.P.W3.l hands it `KW` and `FAIL` besides (the at-rule heads and the one named refusal). */
    const stylesheetGrammar = buildStylesheetGrammar(
        { SCAN, LIT, TEXT, KW, END, SEQ, ALT, CUT, PURE, REP, DROP, FAIL, CTOR, RECOVER, REF },
        { WS, TOK, UNIT_KW, OPT },
    );
    for (const name of Object.keys(stylesheetGrammar.terms)) {
        if (terms[name] !== undefined) throw new Error(`HALT: the stylesheet grammar redefines production '${name}'`);
    }
    Object.assign(terms, stylesheetGrammar.terms);
    Object.assign(entries, stylesheetGrammar.entries);

    for (const d of Object.values(R_disp)) {
        for (const target of Object.values(d.rows)) {
            if (!dispatchTerms[target]) throw new Error(`HALT: R_disp names '${target}', which the grammar does not define`);
        }
    }

    return { entries, terms, dispatchTerms };
}

/**
 * The REF targets the grammar uses — §8 D-3's `balanced-tail` and the value grammar's two
 * (X.P.W3.h). D-3's second back-edge was `value-slice`, the slice's colour-only declaration value;
 * X.P.W3.j retires it — a declaration's value is `REF("value-body")`, so the site is the SAME site
 * under the name the value grammar publishes it under, and the count of back-edges the grammar
 * uses is unchanged. The grammar map is finite and closed (OP-22); a lowering resolves a back-edge
 * by name against `terms`, never by search. X.P.W3.l adds the stylesheet family's two (a nested
 * rule inside a body, a nested `{ … }` inside an unknown at-rule's raw body), each with a
 * mandatory width of at least two code units so no level of either recursion is zero-width.
 */
export const REF_TARGETS = ["balanced-tail", ...VALUE_REF_TARGETS, ...STYLESHEET_REF_TARGETS];
