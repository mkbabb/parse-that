// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.a — THE SHAPE TEST'S CELLS.
//
// `coverage.md`'s legend: TOTAL = covered by name AND SHAPE · PARTIAL =
// present but narrower, WITH WHAT IS MISSING NAMED · ABSENT = no peer. The
// name limb is a lookup. This file is the shape limb: one cell per frozen
// variant, each cell naming exactly what it covers, so a PARTIAL verdict
// arrives with its missing list already written.
//
// Two provenances, kept apart and printed apart (L-16 — evidence modes never
// impersonate one another):
//
//   DERIVED  — the cell exists because `src/css/types.ts` declares the variant.
//              Add a 14th colour space to the frozen union and a 14th cell
//              appears here with no byte of this harness moving.
//   DECLARED — the cell exists because a dated record names it and no frozen
//              union enumerates it (e.g. `parseCssColor`'s hex / named /
//              relative-color / `color-mix()` forms, which `coverage.md`
//              Surface 1 §1a lists in its own Missing column). Every declared
//              cell carries its citation.
//
// A cell that a candidate cannot satisfy is a NAMED MISS, never a silent one.

/** ParseResult<T> shape, read from `types.ts`: ok:true carries `value`. */
const isParseOk = (r) =>
    r !== null &&
    typeof r === "object" &&
    r.ok === true &&
    "value" in r &&
    Array.isArray(r.diagnostics);

/** ParseResult<T> shape, ok:false carries a non-empty `diagnostics` list. */
const isParseFail = (r) =>
    r !== null &&
    typeof r === "object" &&
    r.ok === false &&
    Array.isArray(r.diagnostics) &&
    r.diagnostics.length > 0;

const ok = (r) => (isParseOk(r) ? { pass: true } : { pass: false, why: describe(r) });

const describe = (r) => {
    if (r === undefined) return "returned undefined (no ParseResult)";
    if (isParseFail(r)) return `ok:false — ${r.diagnostics[0]?.code ?? "no code"}`;
    if (r === null || typeof r !== "object") return `returned ${typeof r}`;
    if (!("ok" in r)) return "returned a non-ParseResult object";
    return "returned a malformed ParseResult";
};

const okWith = (r, field, want) => {
    if (!isParseOk(r)) return { pass: false, why: describe(r) };
    const got = field(r.value);
    return got === want
        ? { pass: true }
        : { pass: false, why: `parsed, but ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}` };
};

// ── the nine public parsers ─────────────────────────────────────────────────
//
// The set the R1 totality probe targets, named by the parser-band: "targets
// ALL nine public parsers, so the colour wave discharges only its slice and
// the probe stays wired until the whole surface is total." The runner reports
// each of the nine as its own slice for exactly that reason.

export const NINE_PUBLIC_PARSERS = [
    "parseCssColor",
    "parseCssScalar",
    "parseCssValue",
    "parseCssValues",
    "parseKeyframeSelector",
    "parseStylesheet",
    "parseTimingFunction",
    "parseAnimationTimeline",
    "parseAnimationRange",
];

/** Representative source for each frozen colour space. */
const COLOR_SPACE_INPUT = {
    rgb: "rgb(255 0 0)",
    hsl: "hsl(120 50% 50%)",
    hwb: "hwb(120 10% 20%)",
    lab: "lab(50% 40 59.5)",
    lch: "lch(50% 70 40)",
    oklab: "oklab(0.5 0.1 0.1)",
    oklch: "oklch(0.7 0.15 200)",
    xyz: "color(xyz 0.4 0.2 0.1)",
    "srgb-linear": "color(srgb-linear 0.2 0.3 0.4)",
    "display-p3": "color(display-p3 0.2 0.3 0.4)",
    "a98-rgb": "color(a98-rgb 0.2 0.3 0.4)",
    "prophoto-rgb": "color(prophoto-rgb 0.2 0.3 0.4)",
    rec2020: "color(rec2020 0.2 0.3 0.4)",
};

const TIMING_INPUT = {
    keyword: "ease-in-out",
    "cubic-bezier": "cubic-bezier(0.25, 0.1, 0.25, 1)",
    steps: "steps(4, jump-end)",
    "linear-function": "linear(0, 0.25 25%, 1)",
};

const KEYFRAME_SELECTOR_INPUT = { percent: "50%", named: "entry 25%" };

const TIMELINE_INPUT = {
    auto: "auto",
    none: "none",
    name: "--my-timeline",
    scroll: "scroll(root block)",
    view: "view(block auto)",
};

const STYLESHEET_INPUT = {
    style: "a { color: red; }",
    keyframes: "@keyframes spin { from { opacity: 0; } to { opacity: 1; } }",
    property: "@property --x { syntax: '<length>'; inherits: false; initial-value: 0px; }",
    function: "@function --double(--v) { result: --v; }",
    scope: "@scope (.card) to (.content) { a { color: red; } }",
    "starting-style": "@starting-style { a { opacity: 0; } }",
    // Descriptor-only bodies. `source:`/`subject:` take a `selector(#id)`
    // function whose acceptance is a SEPARATE question from whether the
    // at-rule kind is reached; a cell must fail for its own reason (L-19).
    "scroll-timeline": "@scroll-timeline --s { orientation: block; }",
    "view-timeline": "@view-timeline --v { axis: block; }",
    unknown: "@totally-unknown foo { a { color: red; } }",
};

/** The stylesheet is a flat-or-nested item list; a kind may sit at any depth. */
const sheetHasKind = (sheet, kind) => {
    const stack = Array.isArray(sheet) ? [...sheet] : [];
    while (stack.length > 0) {
        const item = stack.pop();
        if (item === null || typeof item !== "object") continue;
        if (item.kind === kind) return true;
        if (Array.isArray(item.children)) stack.push(...item.children);
    }
    return false;
};

/**
 * Cells for the nine parsers, generated FROM the derived variant vocabulary.
 * `variants` is `deriveVariants()`'s return: every list in it was read from
 * `src/css/types.ts` at run time.
 */
export const parserCells = (variants) => {
    const cells = {};

    cells.parseCssColor = [
        ...variants.colorSpaces.map((space) => ({
            id: `space:${space}`,
            provenance: "DERIVED — CssColorSpace, src/css/types.ts",
            input: COLOR_SPACE_INPUT[space] ?? `color(${space} 0.2 0.3 0.4)`,
            check: (r) => okWith(r, (v) => v?.space, space),
        })),
        ...[
            ["form:hex", "#ff0000"],
            ["form:named", "rebeccapurple"],
            ["form:color-function", "color(srgb 1 0 0)"],
            ["form:color-mix", "color-mix(in oklch, red, blue)"],
        ].map(([id, input]) => ({
            id,
            provenance: "DECLARED — coverage.md Surface 1 §1a Missing column",
            input,
            check: ok,
        })),
        {
            // `parseCssColor(source)` takes NO context, and the frozen
            // `ParseIssue` union carries `color_context_required` for exactly
            // this input class. So the contract is satisfied either by parsing
            // it or by REFUSING IT BY NAME — and a bare `css_syntax`, or a
            // throw, still fails the cell. The accepted code is read from the
            // derived union, so removing it from `types.ts` breaks this cell
            // loudly rather than widening it silently.
            id: "form:relative-color",
            provenance:
                "DECLARED — coverage.md Surface 1 §1a Missing column; satisfied by ok:true " +
                "OR by the derived typed refusal `color_context_required`",
            input: "rgb(from red r g b)",
            check: (r) => {
                if (isParseOk(r)) return { pass: true };
                const wanted = "color_context_required";
                if (!variants.issueCodes.includes(wanted)) {
                    return { pass: false, why: `frozen ParseIssue no longer declares ${wanted}` };
                }
                return isParseFail(r) && r.diagnostics[0]?.code === wanted
                    ? { pass: true }
                    : { pass: false, why: describe(r) };
            },
        },
    ];

    cells.parseTimingFunction = variants.timingKinds.map((kind) => ({
        id: `kind:${kind}`,
        provenance: "DERIVED — CssTimingFunction, src/css/types.ts",
        input: TIMING_INPUT[kind] ?? kind,
        check: (r) => okWith(r, (v) => v?.kind, kind),
    }));

    cells.parseKeyframeSelector = [
        ...variants.keyframeSelectorKinds.map((kind) => ({
            id: `kind:${kind}`,
            provenance: "DERIVED — KeyframeSelector, src/css/types.ts",
            input: KEYFRAME_SELECTOR_INPUT[kind] ?? kind,
            check: (r) => okWith(r, (v) => v?.kind, kind),
        })),
        ...[
            ["word:from", "from"],
            ["word:to", "to"],
        ].map(([id, input]) => ({
            id,
            provenance: "DECLARED — coverage.md Surface 1 §1a ('no from/to')",
            input,
            check: ok,
        })),
    ];

    cells.parseAnimationTimeline = variants.timelineKinds.map((kind) => ({
        id: `kind:${kind}`,
        provenance: "DERIVED — AnimationTimelineValue, src/css/types.ts",
        input: TIMELINE_INPUT[kind] ?? kind,
        check: (r) => okWith(r, (v) => v?.kind, kind),
    }));

    cells.parseAnimationRange = variants.rangePhases.map((phase) => ({
        id: `phase:${phase}`,
        provenance: "DERIVED — RangePhase, src/css/types.ts",
        input: phase === "normal" ? "normal" : `${phase} 0%`,
        check: (r) => okWith(r, (v) => v?.start?.phase, phase),
    }));

    cells.parseStylesheet = variants.stylesheetItemKinds.map((kind) => ({
        id: `item:${kind}`,
        provenance: "DERIVED — StylesheetItem, src/css/types.ts",
        input: STYLESHEET_INPUT[kind] ?? `a { color: red; }`,
        check: (r) =>
            isParseOk(r)
                ? sheetHasKind(r.value, kind)
                    ? { pass: true }
                    : { pass: false, why: `parsed, but no item of kind "${kind}"` }
                : { pass: false, why: describe(r) },
    }));

    // No frozen union in `src/css/types.ts` enumerates the scalar/value/list
    // vocabulary (`CssScalar`/`CssCall`/`CssList` are re-exported from
    // `../value`), so these three parsers' cells are DECLARED and say so.
    cells.parseCssScalar = [
        ["number", "42"],
        ["percentage", "50%"],
        ["length", "10px"],
        ["angle", "45deg"],
        ["time", "250ms"],
        ["keyword", "auto"],
    ].map(([id, input]) => ({
        id: `scalar:${id}`,
        provenance: "DECLARED — no frozen union enumerates CssScalar's payload in src/css/types.ts",
        input,
        check: ok,
    }));

    cells.parseCssValue = [
        ["scalar", "10px"],
        ["call", "translateX(10px)"],
        ["nested-call", "calc(10px + 2em)"],
        ["var", "var(--x, 10px)"],
    ].map(([id, input]) => ({
        id: `value:${id}`,
        provenance: "DECLARED — CssValue is re-exported from ../value, not declared in src/css/types.ts",
        input,
        check: ok,
    }));

    cells.parseCssValues = [
        ["space-list", "10px 20px 30px"],
        ["comma-list", "10px, 20px, 30px"],
        ["slash-list", "10px / 20px"],
    ].map(([id, input]) => ({
        id: `list:${id}`,
        provenance: "DECLARED — CssList's separator union lives in ../value, not src/css/types.ts",
        input,
        check: ok,
    }));

    return cells;
};

// ── the ten non-parser runtime exports ──────────────────────────────────────
//
// Shape is asserted BEHAVIOURALLY here too: each probe calls the export and
// checks the frozen result shape whose member names were derived from
// `src/css/types.ts`. A candidate that exports the name but returns another
// shape is PARTIAL with the divergence named — never TOTAL by name alone.

const hasMembers = (value, members) => {
    if (value === null || typeof value !== "object") return members;
    return members.filter((m) => !(m in value));
};

export const nonParserProbes = (variants) => ({
    // `serializeCssColor(color): Result<string, ColorIssue>` — a RESULT, not a
    // bare string. `Result` is one of the frozen re-exports of `types.ts`.
    serializeCssColor: (ns) => {
        const parsed = ns.parseCssColor?.("oklch(0.7 0.15 200)");
        if (!isParseOk(parsed)) return { pass: false, why: "no parseCssColor to produce input" };
        const out = ns.serializeCssColor(parsed.value);
        if (out === null || typeof out !== "object" || !("ok" in out)) {
            return { pass: false, why: `returned ${typeof out}, expected Result<string, ColorIssue>` };
        }
        return out.ok === true && typeof out.value === "string" && out.value.length > 0
            ? { pass: true }
            : { pass: false, why: `Result not ok:true with a canonical string` };
    },
    coerceToSyntax: (ns) => {
        const r = ns.coerceToSyntax("10px", "<length>");
        return isParseOk(r) || isParseFail(r)
            ? { pass: isParseOk(r), why: isParseOk(r) ? undefined : describe(r) }
            : { pass: false, why: describe(r) };
    },
    // `serializeTimelineOptions(options)` returns the DECLARATION MAP
    // (`animation-timeline` / `animation-range` / `timeline-scope` /
    // `animation-trigger`), not a single string.
    serializeTimelineOptions: (ns) => {
        const out = ns.serializeTimelineOptions({ timeline: { kind: "auto" } });
        if (out === null || typeof out !== "object") {
            return { pass: false, why: `returned ${typeof out}, expected a declaration map` };
        }
        const emitted = Object.entries(out).filter(([, v]) => typeof v === "string");
        return emitted.length > 0
            ? { pass: true }
            : { pass: false, why: "serialized no declaration from a populated CSSTimelineOptions" };
    },
    collectDeclarations: (ns) => {
        const sheet = ns.parseStylesheet?.("a { color: red; width: 10px; }");
        if (!isParseOk(sheet)) return { pass: false, why: "no parseStylesheet to produce input" };
        const rule = sheet.value?.[0];
        const out = ns.collectDeclarations(rule?.declarations ?? []);
        return out instanceof Map && out.size === 2
            ? { pass: true }
            : { pass: false, why: `expected a ReadonlyMap of 2, got ${out?.constructor?.name}` };
    },
    collectAnimationOptions: (ns) => {
        const sheet = ns.parseStylesheet?.("a { animation: spin 2s ease-in-out; }");
        if (!isParseOk(sheet)) return { pass: false, why: "no parseStylesheet to produce input" };
        const out = ns.collectAnimationOptions(sheet.value?.[0]?.declarations ?? []);
        if (!Array.isArray(out)) return { pass: false, why: `returned ${typeof out}, expected a list` };
        const missing = out.length === 0 ? ["<no option collected>"] : [];
        return missing.length === 0
            ? { pass: true }
            : { pass: false, why: `CSSAnimationOptions not collected (${missing.join(", ")})` };
    },
    collectTimelineOptions: (ns) => {
        const sheet = ns.parseStylesheet?.("a { animation-timeline: auto; }");
        if (!isParseOk(sheet)) return { pass: false, why: "no parseStylesheet to produce input" };
        const out = ns.collectTimelineOptions(sheet.value?.[0]?.declarations ?? []);
        if (out === null || typeof out !== "object")
            return { pass: false, why: `returned ${typeof out}, expected CSSTimelineOptions` };
        return Object.keys(out).length > 0
            ? { pass: true }
            : { pass: false, why: "returned an empty CSSTimelineOptions" };
    },
    // The four rule collectors reuse the SAME sources as `parseStylesheet`'s
    // own cells, so a collector can never fail for an input the stylesheet
    // parser was never asked to accept — a cell must fail for its own reason.
    collectStyleRules: (ns) => collector(ns, "collectStyleRules", STYLESHEET_INPUT.style, variants),
    collectKeyframes: (ns) =>
        collector(ns, "collectKeyframes", STYLESHEET_INPUT.keyframes, variants),
    collectPropertyDescriptors: (ns) =>
        collector(ns, "collectPropertyDescriptors", STYLESHEET_INPUT.property, variants),
    collectCustomFunctions: (ns) =>
        collector(ns, "collectCustomFunctions", STYLESHEET_INPUT.function, variants),
});

/**
 * The four `collect*` rule collectors share one contract: `Stylesheet →
 * readonly CollectedRule[]`, and `CollectedRule`'s member names are DERIVED
 * from `src/css/types.ts` rather than spelled here.
 */
const collector = (ns, name, source, variants) => {
    const sheet = ns.parseStylesheet?.(source);
    if (!isParseOk(sheet)) return { pass: false, why: "no parseStylesheet to produce input" };
    const out = ns[name](sheet.value);
    if (!Array.isArray(out)) return { pass: false, why: `returned ${typeof out}, expected a list` };
    if (out.length === 0) return { pass: false, why: "collected nothing from a matching stylesheet" };
    const want = variants.members.CollectedRule ?? [];
    const missing = hasMembers(out[0], want);
    return missing.length === 0
        ? { pass: true }
        : { pass: false, why: `CollectedRule missing ${missing.join(", ")}` };
};
