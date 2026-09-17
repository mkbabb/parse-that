// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — G-10: SOURCE-DIRECT IDIOM + NO-CST, STRUCTURALLY PROVEN.
//
//   node harness/w2/idiom-nocst.mjs --candidate <id>
//   node harness/w2/idiom-nocst.mjs --self-test    # the graph walk against graphs built to fail it
//
// THE GATE'S OWN SENTENCE: "walks the **built** graph and the emitted `.d.ts` — a grep cannot prove
// 'no `opt` under `all`'; the graph can." So three legs, and the first is a graph walk:
//
//   1. THE GRAPH (the band's structural walk): no `.opt()` child of any `all()`; `lazy ≤ 1` with an
//      explicit depth bound; `memoize = 0`. Walked over the candidate's own built parser objects
//      through parse-that's `context = { name, parser, args }` shape (`typescript/src/parse/state.ts:225`).
//   2. THE COMMENT-STRIPPED TEXTUAL ZEROS: `!` non-null, `as any`, `as unknown as`, `.parse(`
//      truthiness entry, hand-rolled cursors. Comments are stripped first, because a rule quoted in
//      a comment is not a use — and a probe that cannot tell them apart teaches seats to hide code
//      in comments.
//   3. NO-CST (the NC-TEST, `ALGEBRA.md` §2.5) + `V` assignable to the frozen `/css` types under an
//      EXCESS-PROPERTY `tsc --noEmit` fixture. Both halves are required: "the easy way to have no
//      CST is to have no types".

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { argv, P2_ROOT } from "./lib/contract.mjs";
import { loadCandidate } from "./lib/candidate.mjs";
import { header, table, kv, verdict, absent } from "./lib/report.mjs";

const a = argv();

/* ── leg 1: the graph walk ────────────────────────────────────────────────────────────────── */

/** parse-that's own shape: a node is anything carrying `context.name`; children ride `parser`/`args`. */
export function walkGraph(roots) {
    const seen = new Set();
    const nodes = [];
    const stack = roots.map((r) => ({ node: r, parent: null, depth: 0 }));
    while (stack.length) {
        const { node, parent, depth } = stack.pop();
        if (!node || typeof node !== "object" || seen.has(node)) continue;
        seen.add(node);
        const ctx = node.context;
        const name = ctx?.name ?? null;
        if (name) nodes.push({ name, parent, depth });
        const kids = [];
        if (ctx?.parser) kids.push(ctx.parser);
        for (const arg of ctx?.args ?? []) {
            if (Array.isArray(arg)) kids.push(...arg);
            else kids.push(arg);
        }
        for (const k of kids) stack.push({ node: k, parent: name, depth: depth + 1 });
    }
    return nodes;
}

export function graphFindings(nodes) {
    const optUnderAll = nodes.filter((n) => n.name === "opt" && n.parent === "all");
    const lazy = nodes.filter((n) => n.name === "lazy");
    const memoize = nodes.filter((n) => /memo/i.test(n.name ?? ""));
    return { optUnderAll, lazy: lazy.length, memoize: memoize.length, nodes: nodes.length };
}

/* ── leg 2: the comment-stripped textual zeros ────────────────────────────────────────────── */

export function stripComments(src) {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .split("\n")
        .map((l) => l.replace(/(^|[^:])\/\/.*$/, "$1"))
        .join("\n");
}

const ZEROS = [
    ["non-null `!`", /[A-Za-z_$\])][ \t]*![.\[(]/g],
    ["`as any`", /\bas\s+any\b/g],
    ["`as unknown as`", /\bas\s+unknown\s+as\b/g],
    ["`.parse(` truthiness entry", /\.parse\s*\(/g],
    ["hand-rolled cursor (`charCodeAt` in a loop)", /(while|for)\s*\([^)]*charCodeAt/g],
];

export function textualZeros(files) {
    const rows = [];
    for (const [label, re] of ZEROS) {
        let n = 0;
        for (const f of files) n += (stripComments(readFileSync(f, "utf8")).match(re) ?? []).length;
        rows.push([label, n]);
    }
    return rows;
}

/* ── leg 3: the excess-property fixture ───────────────────────────────────────────────────── */

function excessPropertyFixture(dtsPath, valueType = "CssColor") {
    const dir = mkdtempSync(path.join(tmpdir(), "w2-nocst-"));
    const file = path.join(dir, "fixture.ts");
    writeFileSync(
        file,
        [
            `import type { ${valueType} } from ${JSON.stringify(dtsPath.replace(/\.d\.ts$/, ""))};`,
            "// The fixture asserts BOTH halves: V is assignable to the frozen type, and an EXTRA",
            "// property is rejected. A `V` shaped as `any` passes the first and fails the second.",
            `declare const v: ${valueType};`,
            `const ok: ${valueType} = v;`,
            `// @ts-expect-error — an excess property must be rejected by the frozen type`,
            `const bad: ${valueType} = { ...v, __cstChild: 1 };`,
            "export { ok, bad };",
        ].join("\n"),
    );
    try {
        execFileSync("npx", ["tsc", "--noEmit", "--strict", "--skipLibCheck", file], { cwd: P2_ROOT, encoding: "utf8", stdio: "pipe" });
        return { ok: true, output: "" };
    } catch (e) {
        return { ok: false, output: String(e.stdout ?? e.message).split("\n").slice(0, 6).join("\n") };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

/* ── the self-test: graphs built to fail the walk ─────────────────────────────────────────── */

async function selfTest() {
    header("X.P.W2.g — idiom-nocst --self-test (graphs and sources built to fail the legs)");
    const { PARSE_THAT_DIST } = await import("../bench/lib/engines.mjs");
    const pt = await import(`${PARSE_THAT_DIST}/parse.js`);

    const clean = pt.all(pt.string("a"), pt.string("b"));
    const dirty = pt.all(pt.string("a"), pt.string("b").opt());
    const lazyOne = pt.Parser.lazy(() => pt.string("x"));

    const rows = [
        ["clean graph: all(string, string)", JSON.stringify(graphFindings(walkGraph([clean])))],
        ["dirty graph: all(string, string.opt())", JSON.stringify(graphFindings(walkGraph([dirty])))],
        ["one lazy", JSON.stringify(graphFindings(walkGraph([lazyOne])))],
    ];
    table(["graph", "findings"], rows);

    const src = "const a = x!.y; const b = z as any; parser.parse(s); // as any in a comment\n";
    const zeros = textualZeros([writeTmp(src)]);
    table(["textual zero", "count in the fixture source"], zeros);

    const fires =
        graphFindings(walkGraph([dirty])).optUnderAll.length === 1 &&
        graphFindings(walkGraph([clean])).optUnderAll.length === 0 &&
        graphFindings(walkGraph([lazyOne])).lazy === 1 &&
        zeros.find((r) => r[0] === "`as any`")[1] === 1 &&
        stripComments("// as any\ncode").includes("as any") === false;
    return verdict(
        fires,
        fires
            ? "the graph walk finds `opt` under `all` and is silent on a clean graph; the textual zeros count uses and not comments"
            : "a leg did not fire on a subject built to fail it — the probe is decorative",
    );
}

function writeTmp(content) {
    const dir = mkdtempSync(path.join(tmpdir(), "w2-zeros-"));
    const f = path.join(dir, "s.ts");
    writeFileSync(f, content);
    return f;
}

/* ── the run against a candidate ──────────────────────────────────────────────────────────── */

async function candidate(id) {
    const c = await loadCandidate(id, a.at ?? null);
    header(`X.P.W2.g — idiom-nocst --candidate ${id} (G-10)`);
    if (!c.present) {
        await selfTest();
        console.log();
        return absent(`candidate ${id}`, c.reason);
    }
    const red = [];
    const L = c.lowerings.js;

    if (typeof L.parserGraph === "function") {
        const f = graphFindings(walkGraph(L.parserGraph()));
        kv([
            ["graph nodes walked", String(f.nodes)],
            ["`opt` under `all`", String(f.optUnderAll.length)],
            ["`lazy` nodes", String(f.lazy)],
            ["memoize nodes", String(f.memoize)],
        ]);
        if (f.optUnderAll.length) red.push(`${f.optUnderAll.length} \`opt\` under \`all\` (the band's structural rule)`);
        if (f.lazy > 1) red.push(`lazy = ${f.lazy} (the band's rule is ≤ 1, with an explicit depth bound)`);
        if (f.memoize) red.push(`${f.memoize} memoize node(s) — PT-03's class`);
    } else {
        console.log("graph leg: UNREAD — the adapter exposes no `parserGraph()`. A grep cannot prove `no opt under all`; the seat declares the roots or the leg stays unread.");
        red.push("the JS lowering exposes no parser graph — G-10's first leg cannot be read");
    }

    const files = [...(c.meta.sources?.algebra ?? []), ...(c.meta.sources?.js ?? [])]
        .map((p) => (path.isAbsolute(p) ? p : path.join(P2_ROOT, p)))
        .filter(existsSync);
    const zeros = textualZeros(files);
    console.log();
    table(["textual zero (comments stripped)", `count over ${files.length} declared source files`], zeros);
    for (const [label, n] of zeros) if (n > 0) red.push(`${label}: ${n}`);

    const dts = c.meta.artifacts?.dts;
    if (dts) {
        const abs = path.isAbsolute(dts) ? dts : path.join(P2_ROOT, dts);
        const fx = excessPropertyFixture(abs);
        console.log();
        kv([["excess-property fixture (`tsc --noEmit --strict`)", fx.ok ? "PASSES — V is assignable AND an excess property is rejected" : `FAILS\n${fx.output}`]]);
        if (!fx.ok) red.push("the excess-property fixture fails — V is not assignable to the frozen type, or the type admits an extra field (no-CST's second half)");
    } else {
        red.push("meta.artifacts.dts not declared — the emitted .d.ts half of G-10 cannot be read");
    }

    return verdict(red.length === 0, red.length === 0 ? "graph clean, textual zeros all zero, V assignable under an excess-property check" : red.join(" | "));
}

const code = a.flags.has("self-test") ? await selfTest() : a.candidate ? await candidate(a.candidate) : (console.log("usage: idiom-nocst.mjs --candidate <id> | --self-test"), 2);
process.exit(code);
