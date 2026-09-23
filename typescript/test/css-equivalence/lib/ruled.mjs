// SERVED MODEL: claude-opus-5-5
//
// X.P.W5.b — THE RULED DIVERGENCES, HONOURED BY THE INSTRUMENT THAT COUNTS THEM.
//
// `W5.md` §Units `.b`: every mirror-defect of the RC-P harness is "cured at the parser (either
// side) or rowed as an intended divergence with its spec citation; harness exit 0". At W5's open
// the harness read 152 mirror-defects (record F-open-1), and every one of them had ALREADY been
// ruled candidate-correct by the fresh adjudicator — but the differential only reads the sixteen
// parser-band ADJUDICATIONS, so a cell ruled in `ADJUDICATION-W4.md` or by COHESION §0ab still
// counted as a defect. This module is the ruling, in the form the differential can check:
//
//   1. RULED_CELLS — the 41 cells `ADJUDICATION-W4.md` §2 ruled ONE AT A TIME (COHESION §0v:
//      "per-cell adjudication at X.P.W4's fresh adjudicator"). Each row carries its Appendix A
//      number, its ruling id AS RULED (§10.1 of `DIVERGENCE-LEDGER.md`, not the emitter's tag),
//      the section that rules it, the candidate verdict the ruling found correct, and the consumer
//      direction. The input is the corpus string, byte for byte.
//   2. F_W4F_1 — the one ruled CLASS (COHESION §0ab: "the new divergence against 4.0.0 is
//      `declared-divergence`, rulingId F-w4f-1, candidate correct"): a declaration NAME that is
//      not one <ident-token> (css-syntax-3 §5.4.4 / §4.3.11). A class is honoured only when its
//      MECHANISM is shown to be the whole divergence — the REPAIR TEST below — never on a match.
//
// NOTHING HERE EXCUSES A CELL. A ruling is honoured only when the candidate's verdict is the one
// the ruling found correct; a candidate that moves off it reads ADJUDICATION_UNHONOURED, a RED
// trigger. A cell whose F-w4f-1 repair does not leave an agreeing, candidate-ACCEPTED sheet keeps
// its original RED verdict. Fail-closed in every branch.

import { isDeepStrictEqual } from "node:util";

import { nonIdentDeclarationName } from "../../css-totality/lib/adjudications.mjs";

/** The ruling document, cited by every row (value.js `docs/tranches/X/parse-that/`). */
export const RULING_DOC = "ADJUDICATION-W4.md";

const cell = (appendixA, entries, rulingId, candidate, section, direction, input) =>
    Object.freeze({ appendixA, entries: Object.freeze(entries), rulingId, candidate, ruledAt: `${RULING_DOC} ${section}`, direction, input });

/**
 * The 41 per-cell rulings (Appendix A `#1`–`#44` less `#37` `#40` `#41`: `#40`/`#41` were
 * F-w4f-2's candidate defects, CURED at X.P.W4.h and now `identical`; `#37`'s sheet now also
 * carries a non-ident name, so F-w4f-1's repair test governs it — the PB-05 clamp it was ruled
 * on is then checked by the parser-band adjudication on the repaired sheet). `#43` and `#44` are
 * the two `@property … @container` variants; Appendix A abridges both to one prefix, so the two
 * rows share the pair label. Inputs measured at parse-that master `4eac70c1` from the pinned
 * 27,021-row union, never retyped.
 */
export const RULED_CELLS = Object.freeze([
    cell("#1 #2 #3 #4", ["parseCssColor", "parseCssScalar", "parseCssValue", "parseCssValues"], "GROUND-C", "accept", "§2.1", "WIDENS",
        "rgb(.843, -0, +54, 5e498)"),
    cell("#5", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(174.89818022586405 7e422%, 0e356 1e-315%)"),
    cell("#6", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(.95, +99, 5e325)"),
    cell("#7", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(17.833 .896%, 8e440, -0)"),
    cell("#8", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "cubic-bezier(.319, 1e389, .334, 28.136)"),
    cell("#9", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(-361 4e495%, 166.1066859262064, -223 -17.386972857639194%, -0 9.254%)"),
    cell("#10", ["parseTimingFunction"], "ID-2", "reject", "§2.2", "NARROWS",
        "steps(1e43,, start)"),
    cell("#11", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(+84 8e328%, 3.880178038962185)"),
    cell("#12", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(46.108, +98 33.651%, 9e313, +52 +26%)"),
    cell("#13", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(5e425, -0, 77.123,.272)"),
    cell("#14", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "cubic-bezier(-0, 8e458, .893, +31)"),
    cell("#15", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(7e324 102.8985577110201%, .27, 29 190.33129245508462%, 147 40.640%)"),
    cell("#16", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "cubic-bezier(.135, 9e337,.744, 4e424)"),
    cell("#17", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(5e499, -0 -0%)"),
    cell("#18", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(-0, 8e472, .147 130%, -0)"),
    cell("#19", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(3e399 64.899%, +92, .700 64%)"),
    cell("#20", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "cubic-bezier(.557, 6e345, .590, -0)"),
    cell("#21", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(.855 -0%, -0 9e390%, -26.280247420072556)"),
    cell("#22", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(-7.41244088858366 5e492%, 164.92977514863014)"),
    cell("#23", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(5e312, 41.272, 91)"),
    cell("#24", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(8e478 +73%, +79 28.644%)"),
    cell("#25", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(.235, 7e424)"),
    cell("#26", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(8e317, 78.70270570274442)"),
    cell("#27", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(-102, 4e429 3e283%, -277)"),
    cell("#28", ["parseTimingFunction"], "GROUND-C", "accept", "§2.2", "WIDENS",
        "linear(94.750 79.25%, 9e441, 15.846)"),
    cell("#29", ["parseStylesheet"], "ID-4", "accept", "§2.4", "WIDENS",
        ".c ){ color: #28cA }"),
    cell("#30", ["parseStylesheet"], "PB-12", "reject", "§2.5", "NARROWS",
        "b { col!r: rgb(9. none -76 / 0.) }"),
    cell("#31", ["parseStylesheet"], "GROUND-C", "accept", "§2.3", "WIDENS",
        "a{ color: rgb(-232, 52.305, 67, 1e327) }"),
    cell("#32", ["parseStylesheet"], "PB-09", "reject", "§2.5", "NARROWS",
        "b { background-color: #74173d96 } a { border-colo!r: hsl(50% 1e-366 67.310) }"),
    cell("#33", ["parseStylesheet"], "GROUND-C", "accept", "§2.3", "WIDENS",
        ".c { color: rgb(98.741 .536 .74 / 16%) } .c { color: rgb(7e456, 157.19748854171485, 67.109, 9e480) } a { nonebackground-color: oklch(none -41.30891829263419 -0deg / 3e-396) }"),
    cell("#34", ["parseStylesheet"], "ID-4", "accept", "§2.4", "WIDENS",
        "a, b { color: hsl(85.89643812738359turn 23.763 .396) } b ) color: #0e8 } a, b { border-color: var(--z) }"),
    cell("#35", ["parseStylesheet"], "PB-12", "reject", "§2.5", "NARROWS",
        "b { backgr!und-color: oklch(3e-440 7e-206 4.deg) }"),
    cell("#36", ["parseStylesheet"], "PB-12", "reject", "§2.5", "NARROWS",
        "b { background-color: hsl(141.1656975513324turn 2. 53.62424335908145) !important } a, b { border-!olor: rgb(+16 -0 395) }"),
    cell("#38", ["parseStylesheet"], "ID-4", "accept", "§2.4", "WIDENS",
        "a { border-color: oklch}-0 139 -160deg) !important } a { border-color: #Fdd5dF } b { border-color: hsl(-249rad -0 100% / 15%) !important }"),
    cell("#39", ["parseStylesheet"], "ID-4", "reject", "§2.4", "NARROWS",
        ".c { background-color: rgb(-0 .504 6e-128 / 9e-415) } GARBAGE ) ;(#d { background-color: #eFEbC78B }"),
    cell("#42", ["parseStylesheet"], "ID-4", "accept", "§2.4", "WIDENS",
        "#d ){ background-color: var(--a, rebeccapurple) }"),
    cell("#43 #44", ["parseStylesheet"], "ID-1b", "accept", "§2.5", "CHANGES VALUE",
        "  @property --ratio { syntax: \"<number>\"; inherits: false; initial-value: 1 } h1, h2 {/* c */ img { @container (width > 400px) { nav { margin: 0 auto; animation-name: slide; margin: 0; } } transition: opacity 200ms } & > span { margin: 1em 2em !important;\n  & > span { font-weight: bold; padding: 2px 4px 6px 8px } } @document url(x) { #b {  } }} /* note */"),
    cell("#43 #44", ["parseStylesheet"], "ID-1b", "accept", "§2.5", "CHANGES VALUE",
        "  @property --ratio { syntax: \"<number>\"; inherits: false; initial-value: 1 } h1, h2 {/* c */ img { @container (width > 400px) { nav { margin: 0 auto; animation-name: slide; margin: 0; } } transition: opacity 200ms } & > span { margin: 1em 2em !important;\n  & > span { font-weight: bold; padding: 2px 4pxx 6px 8px } } @document url(x) { #b {  } }} /* note */"),
]);

/* ── F-w4f-1: the class, and its repair test ───────────────────────────────────────────────── */

/**
 * WHERE the incumbent reads a NAME — `nonIdentDeclarationName`'s own replay (`blocks()` bodies,
 * the paren-aware `;` split, the name = the trimmed run before the first `:`), carrying OFFSETS so
 * the repair can rewrite exactly those runs and nothing else. The class is entered only where the
 * SHARED predicate (`nonIdentDeclarationName`, the resolver `remainderId` files under `ID-1b`)
 * fires, and the repair is refused unless this replay finds no mis-spelled name left afterwards.
 */
const IDENT_TOKEN = /^--?[-_a-zA-Z0-9\u0080-￿]*$|^[-_a-zA-Z\u0080-￿][-_a-zA-Z0-9\u0080-￿]*$/;

const skipQuoted = (src, i, quote) => (src[i] === quote && src[i - 1] !== "\\" ? "" : quote);

const bodySpans = (src) => {
    const out = [];
    let cursor = 0;
    while (cursor < src.length) {
        while (cursor < src.length) {
            while (/\s|;/.test(src[cursor] ?? "")) cursor += 1;
            if (!src.startsWith("/*", cursor)) break;
            const close = src.indexOf("*/", cursor + 2);
            if (close < 0) return out;
            cursor = close + 2;
        }
        if (cursor >= src.length) break;
        let quote = "";
        let parens = 0;
        let boundary = -1;
        for (let i = cursor; i < src.length; i += 1) {
            const c = src[i];
            if (quote) { quote = skipQuoted(src, i, quote); continue; }
            if (c === '"' || c === "'") quote = c;
            else if (c === "(") parens += 1;
            else if (c === ")") parens -= 1;
            else if (parens === 0 && (c === "{" || c === ";")) { boundary = i; break; }
        }
        if (boundary < 0) return out;
        if (src[boundary] === ";") { cursor = boundary + 1; continue; }
        let depth = 1;
        quote = "";
        let end = boundary + 1;
        for (; end < src.length && depth > 0; end += 1) {
            const c = src[end];
            if (quote) { quote = skipQuoted(src, end, quote); continue; }
            if (c === '"' || c === "'") quote = c;
            else if (c === "{") depth += 1;
            else if (c === "}") depth -= 1;
        }
        if (depth !== 0) return out;
        out.push({ start: boundary + 1, end: end - 1 });
        cursor = end;
    }
    return out;
};

const trimSpan = (src, start, end) => {
    while (start < end && /\s/.test(src[start])) start += 1;
    while (end > start && /\s/.test(src[end - 1])) end -= 1;
    return { start, end };
};

const partSpans = (src) => {
    const out = [];
    let depth = 0;
    let quote = "";
    let start = 0;
    for (let i = 0; i < src.length; i += 1) {
        const c = src[i];
        if (quote) { quote = skipQuoted(src, i, quote); continue; }
        if (c === '"' || c === "'") { quote = c; continue; }
        if (c === "(") depth += 1;
        else if (c === ")") depth -= 1;
        else if (depth === 0 && c === ";") { out.push(trimSpan(src, start, i)); start = i + 1; }
    }
    out.push(trimSpan(src, start, src.length));
    return out.filter((s) => s.end > s.start);
};

/** Every non-ident NAME run the incumbent reads, with its absolute offsets. */
const malformedNames = (src, base = 0, depth = 0) => {
    if (depth > 8) return [];
    const found = [];
    for (const body of bodySpans(src)) {
        const text = src.slice(body.start, body.end);
        for (const part of partSpans(text)) {
            const colon = text.slice(part.start, part.end).indexOf(":");
            if (colon <= 0) continue;
            const name = trimSpan(text, part.start, part.start + colon);
            const run = text.slice(name.start, name.end);
            if (!IDENT_TOKEN.test(run)) found.push({ start: base + body.start + name.start, end: base + body.start + name.end, run });
        }
        found.push(...malformedNames(text, base + body.start, depth + 1));
    }
    return found;
};

const COMMENT = /\/\*[\s\S]*?\*\//g;
const NON_IDENT_CODE_POINT = /[^-_a-zA-Z0-9\u0080-￿]/g;

/**
 * The repair of ONE name run, and only it. css-syntax-3 §4.3.2 consumes a comment as trivia, so a
 * run that is an <ident-token> once its comments are gone was a NAME all along (`/* note *\/opacity`
 * — the incumbent's F-k3 reading, candidate correct, CHANGES VALUE); the candidate must ACCEPT that
 * sheet with the same tree as the repaired one. Any other run is not a name at all (§5.4.4); the
 * repair writes its ident code points (a leading digit dropped, §4.3.9) so the rest of the sheet can
 * be compared, and the candidate must REJECT the original.
 */
const repairRun = (run) => {
    const uncommented = run.replace(COMMENT, "").trim();
    if (uncommented && IDENT_TOKEN.test(uncommented)) return { name: uncommented, triviaOnly: true };
    const projected = uncommented.replace(NON_IDENT_CODE_POINT, "").replace(/^[0-9]+/, "");
    return { name: projected && IDENT_TOKEN.test(projected) ? projected : "x", triviaOnly: false };
};

/**
 * A run that CROSSES A BRACE is not a name the incumbent mis-spelled: it is the incumbent's
 * brace-blind `;` split reading a NESTED RULE as a name (`h1, h2 { transition`, `from, 50% {
 * opacity`) — `ID-1b`'s nested form, ruled per cell (`#43`/`#44`) and never by this class. The
 * repair leaves such runs exactly as they are; if a nested rule is where the engines differ, the
 * repaired sheet still differs there and the repair test fails.
 */
const nestedRuleRead = (run) => /[{}]/.test(run.run);

/**
 * The repaired sheet, or `null` when the repair is not well defined — no mis-spelled name at all,
 * two runs that overlap, or a sheet that still carries a mis-spelled name afterwards.
 */
export const repairNames = (src) => {
    if (typeof src !== "string") return null;
    const runs = malformedNames(src).filter((run) => !nestedRuleRead(run)).sort((a, b) => a.start - b.start);
    if (runs.length === 0) return null;
    for (let i = 1; i < runs.length; i += 1) if (runs[i].start < runs[i - 1].end) return null;
    let repaired = src;
    let triviaOnly = true;
    for (const run of [...runs].reverse()) {
        const fix = repairRun(run.run);
        triviaOnly &&= fix.triviaOnly;
        repaired = repaired.slice(0, run.start) + fix.name + repaired.slice(run.end);
    }
    if (malformedNames(repaired).some((run) => !nestedRuleRead(run))) return null;
    return { repaired, triviaOnly, runs: runs.map((r) => r.run) };
};

/** The F-w4f-1 row, as the differential's ledger count and the printed reading carry it. */
export const F_W4F_1 = Object.freeze({
    id: "F-w4f-1",
    entry: "parseStylesheet",
    ruledAt: "COHESION §0ab (bullet 3) · DIVERGENCE-LEDGER.md §11",
    specCitation: "css-syntax-3 §5.4.4 — a declaration is consumed only on an <ident-token>; §4.3.11 / §4.3.9 define one; §4.3.2 — a comment is trivia",
    consumerDirection:
        "NARROWS — a sheet whose declaration name is not one ident-token is refused whole (the seam's ruled error posture, DIVERGENCE-LEDGER §10.4); a style body that OPENS with a comment is accepted by both and the NAME changes (the comment is trivia).",
});

const accepted = (result) => !result.threw && result.value?.ok === true;

/**
 * THE RESOLVER. `entry` · `input` · the candidate's result on `input` · `reclassify(source)`, which
 * runs the SAME oracle, the SAME candidate lowering and the SAME parser-band adjudication on another
 * source and returns `{ verdict, red, candidate }`. Returns `null` when no ruling here governs the
 * cell, else `{ rulingId, honoured, why }` — and `honoured: false` never softens a cell.
 */
export const resolveRuling = ({ entry, input, candidate, reclassify }) => {
    const row = RULED_CELLS.find((r) => r.input === input && r.entries.includes(entry));
    if (row) {
        const candOk = accepted(candidate);
        const honoured = candOk === (row.candidate === "accept");
        return {
            rulingId: row.rulingId,
            honoured,
            why: `${row.rulingId} ruled at ${row.ruledAt} (${row.appendixA}, ${row.direction}) ${honoured ? `honoured (${row.candidate})` : `requires ${row.candidate}; candidate ${candOk ? "accepts" : "rejects"}`}`,
        };
    }
    if (entry !== F_W4F_1.entry || !nonIdentDeclarationName(input)) return null;
    const repair = repairNames(input);
    if (repair === null) return null;
    const after = reclassify(repair.repaired);
    const failures = [];
    if (after.red) failures.push(`the repaired sheet still reads ${after.verdict}`);
    if (repair.triviaOnly) {
        // Comments are trivia (§4.3.2): taking them out of the name run must not move the
        // candidate's answer AT ALL — the same tree when it accepts, the same diagnostic code
        // when it refuses (the offsets move with the bytes; the reading must not).
        if (accepted(candidate) !== accepted(after.candidate))
            failures.push("a comment-only name run, yet removing the comment flips the candidate's verdict");
        else if (accepted(candidate) && !isDeepStrictEqual(candidate.value.value, after.candidate.value.value))
            failures.push("a comment-only name run, yet the candidate's tree moves when the comment goes");
        else if (!accepted(candidate) && candidate.value?.diagnostics?.[0]?.code !== after.candidate.value?.diagnostics?.[0]?.code)
            failures.push("a comment-only name run, yet the candidate's refusal changes code when the comment goes");
    } else {
        // A mis-spelled name: the candidate refuses the sheet (§5.4.4, whole-sheet posture §10.4),
        // and ACCEPTS it once the name is one ident-token — so the refusal was the name's, and a
        // sheet both engines refuse for some other reason can never pass here.
        if (accepted(candidate)) failures.push("a non-ident NAME, yet the candidate accepts the sheet");
        if (!accepted(after.candidate)) failures.push("the candidate refuses the repaired sheet");
    }
    return {
        rulingId: F_W4F_1.id,
        honoured: failures.length === 0,
        why:
            failures.length === 0
                ? `F-w4f-1 ruled at ${F_W4F_1.ruledAt} honoured — ${repair.triviaOnly ? "comment trivia, same tree" : "refused"}; repairing ${repair.runs.length} name run(s) leaves ${after.verdict}`
                : `F-w4f-1's repair test FAILS: ${failures.join("; ")}`,
    };
};

/* ══════════════════════════════════════════════════════════════════════════════════════════════
   X.P.W5.g — R-b-2 (F-W5b-1; COHESION §0bx; DIVERGENCE-LEDGER §14): THE SECOND RULED CLASS.

   css-variables-1 §3: "If a property contains one or more var() functions, and those functions are
   syntactically valid, the entire property's grammar must be assumed to be valid at parse time."
   The candidate now honours that (`src/css/entry.mjs` `checkDeclaration` → `containsVar`); 4.0.0
   runs its per-property animation checks over the unsubstituted text and refuses. The class is
   honoured by the same kind of MECHANISM TEST as F-w4f-1, never on a match: the candidate ACCEPTS
   the sheet, and deleting exactly the animation-family declarations that hold a `var()` (each with
   its own leading trivia, through its `;`) leaves a sheet the two engines no longer disagree on —
   so the `var()` declarations were the whole divergence. Fail-closed: a sheet that still reads RED
   after the deletion keeps its original verdict.
   ══════════════════════════════════════════════════════════════════════════════════════════════ */

/** The property names whose parse-time checks `checkDeclaration` runs (the family R-b-2 governs). */
const R_B_2_FAMILY = (name) => /^animation(-|$)/.test(name) || name === "timeline-scope";

/**
 * Every declaration span of `src` — the bytes after a `{` or `;` through the next `;` or `}` at
 * paren depth 0, comments and strings skipped — with its folded NAME and whether it holds a `var(`.
 */
const declarationSpans = (src) => {
    const spans = [];
    let depth = 0;
    let open = -1; //   the index of the `{` / `;` that opened the current span, or -1
    for (let i = 0; i < src.length; i += 1) {
        const ch = src[i];
        if (ch === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            i = end < 0 ? src.length : end + 1;
            continue;
        }
        if (ch === '"' || ch === "'") {
            let j = i + 1;
            while (j < src.length && src[j] !== ch) j += src[j] === "\\" ? 2 : 1;
            i = j;
            continue;
        }
        if (ch === "(") depth += 1;
        else if (ch === ")") depth = Math.max(0, depth - 1);
        else if (depth === 0 && (ch === "{" || ch === ";" || ch === "}")) {
            if (open >= 0 && ch !== "{") {
                const body = src.slice(open + 1, i);
                const bare = body.replace(/\/\*[\s\S]*?(\*\/|$)/g, " ");
                const colon = bare.indexOf(":");
                if (colon > 0) {
                    spans.push({
                        start: open + 1,
                        end: ch === ";" ? i + 1 : i,
                        name: bare.slice(0, colon).trim().toLowerCase(),
                        holdsVar: /(^|[^\w-])var\(/i.test(bare.slice(colon + 1)),
                    });
                }
            }
            open = i; //   a `}` opens too: a declaration may follow a nested block's close
        }
    }
    return spans;
};

/** The sheet with every R-b-2 declaration deleted, or `null` when it holds none. */
export const deleteVarDeclarations = (src) => {
    if (typeof src !== "string") return null;
    const spans = declarationSpans(src).filter((s) => s.holdsVar && R_B_2_FAMILY(s.name));
    if (spans.length === 0) return null;
    let out = src;
    for (const s of [...spans].reverse()) out = out.slice(0, s.start) + out.slice(s.end);
    return { repaired: out, names: spans.map((s) => s.name) };
};

/** The R-b-2 row, as the differential's ledger count and the printed reading carry it. */
export const R_B_2 = Object.freeze({
    id: "R-b-2",
    entry: "parseStylesheet",
    ruledAt: "COHESION §0bx · W5.md ADDENDUM 2026-09-23 · DIVERGENCE-LEDGER.md §14",
    specCitation: "css-variables-1 §3 — a property value holding a syntactically valid var() is assumed valid at parse time and syntax-checked only at computed-value time",
    consumerDirection:
        "WIDENS — an animation-family declaration whose value holds a var() (`animation: fade var(--d) var(--ease)`, `animation-delay: calc(var(--base) + 40ms)`) is accepted and carried as its parsed value; 4.0.0 refused the whole sheet (animation_option_invalid). collectAnimationOptions reads no parse-time option from such a declaration (its value is known only after substitution).",
});

/** R-b-2's resolver, beside F-w4f-1's: `null` when the class does not govern the cell. */
export const resolveVarRuling = ({ entry, input, candidate, reclassify }) => {
    if (entry !== R_B_2.entry) return null;
    const repair = deleteVarDeclarations(input);
    if (repair === null) return null;
    const after = reclassify(repair.repaired);
    const failures = [];
    if (!accepted(candidate)) failures.push("the candidate refuses the sheet that holds the var() declaration(s)");
    if (after.red) failures.push(`deleting the var() declaration(s) still reads ${after.verdict}`);
    return {
        rulingId: R_B_2.id,
        honoured: failures.length === 0,
        why:
            failures.length === 0
                ? `R-b-2 ruled at ${R_B_2.ruledAt} honoured — the candidate accepts; deleting ${repair.names.length} var() declaration(s) (${repair.names.join(", ")}) leaves ${after.verdict}`
                : `R-b-2's mechanism test FAILS: ${failures.join("; ")}`,
    };
};
