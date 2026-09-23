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

    const rgbCh = () => CLAMP(0, 255, ALT(pctOf(255, 100), NUM(), none()));
    const pctCh = () => CLAMP(0, 1, ALT(pctOf(1, 100), SCALE(1, 100, NUM()), none()));
    const pctOnly = () => CLAMP(0, 1, ALT(pctOf(1, 100), none()));
    const okL = () => CLAMP(0, 1, ALT(pctOf(1, 100), NUM(), none()));
    const okC = () => CLAMP(0, INF, ALT(pctOf(0.4, 100), NUM(), none()));
    const alpha = () => CLAMP(0, 1, ALT(pctOf(1, 100), NUM(), none()));
    const alphaSlash = () => OPT(SEQ(WS(), TOK("/"), WS(), alpha()), 1);
    const sep = () => SEQ(WS(), TOK(","), WS());

    const hue = () =>
        ALT(
            SCALE(1, 1, SEQ(NUM(), UNIT_KW("deg"))),
            SCALE(0.9, 1, SEQ(NUM(), UNIT_KW("grad"))),
            SCALE(180, PI, SEQ(NUM(), UNIT_KW("rad"))),
            SCALE(360, 1, SEQ(NUM(), UNIT_KW("turn"))),
            NUM(),
            none(),
        );

    // DM-2, declared: `WS` between modern channels is the band's token-stream reading, which §10.1
    // adopts ("the slice adopts the band's reading (`WS`)"); `WS1` is the strict reading and one
    // notation away. The dissent is preserved, never settled here.
    const modernRgb = () => SEQ(rgbCh(), WS(), rgbCh(), WS(), rgbCh(), alphaSlash());
    const legacyRgb = () => SEQ(rgbCh(), sep(), rgbCh(), sep(), rgbCh(), OPT(SEQ(sep(), alpha()), 1));
    const modernHsl = () => SEQ(hue(), WS(), pctCh(), WS(), pctCh(), alphaSlash());
    const legacyHsl = () => SEQ(hue(), sep(), pctOnly(), sep(), pctOnly(), OPT(SEQ(sep(), alpha()), 1));

    const balancedTail = () =>
        REP(ALT(SEQ(TOK("("), REF("balanced-tail"), TOK(")")), DROP("keyword", SCAN("any-but-paren", 1, INF))), 0, INF, null);

    const headRgb = () => CTOR("rgb", SEQ(TOK("("), CUT(), WS(), ALT(modernRgb(), legacyRgb()), WS(), TOK(")")));
    const headHsl = () => CTOR("hsl", SEQ(TOK("("), CUT(), WS(), ALT(modernHsl(), legacyHsl()), WS(), TOK(")")));
    const headOklch = () =>
        CTOR("oklch", SEQ(TOK("("), CUT(), WS(), okL(), WS(), okC(), WS(), hue(), alphaSlash(), WS(), TOK(")")));
    const headVar = () => CTOR("context", SEQ(TOK("("), CUT(), REF("balanced-tail"), TOK(")")));

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

    const declaration = () =>
        CTOR(
            "declaration",
            SEQ(WS(), TEXT("ident", 1, INF), WS(), TOK(":"), CUT(), WS(), REF("value-slice"), important(), WS()),
        );

    const qualifiedRule = () =>
        CTOR(
            "style-rule",
            SEQ(
                TEXT("any-but-brace-or-semi", 1, INF),
                TOK("{"),
                CUT(),
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
    };

    const entries = {
        "P:color": "color",
        "P:timing-function": "timing",
        "P:stylesheet": "stylesheet",
    };

    for (const d of Object.values(R_disp)) {
        for (const target of Object.values(d.rows)) {
            if (!dispatchTerms[target]) throw new Error(`HALT: R_disp names '${target}', which the grammar does not define`);
        }
    }

    return { entries, terms, dispatchTerms };
}

/**
 * The REF targets the slice uses — §8 D-3's two back-edges and no others. The grammar map is finite
 * and closed (OP-22); a lowering resolves a back-edge by name against `terms`, never by search.
 */
export const REF_TARGETS = ["balanced-tail", "value-slice"];
