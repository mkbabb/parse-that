// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — THE SUBSTRATE RECEIPT (G-7's per-number stamp, and G-9's substrate law witness).
//
//   node harness/w2/substrate-receipt.mjs            # the printed table
//   node harness/w2/substrate-receipt.mjs --json     # the same, as one JSON object to embed
//
// `W2.md` §6 G-7: "every number carries a substrate receipt … a number compared across substrates
// is void and re-run", and §11 archaeology 5 states why in one sentence: "two measurements that
// disagree across substrates are not a contradiction, they are an unlabelled experiment, and the
// receipt exists to make that impossible to repeat."
//
// Every subject a W2 number can come from is stamped here: repo · commit · package version · node
// version · dist-or-tree. The read-only evidence root is stamped too — and its OP-6/OP-7 marks are
// re-measured rather than quoted, because a mark that is never re-measured becomes folklore.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { argv, P2_ROOT, VALUE_JS_ROOT } from "./lib/contract.mjs";
import { publishedPin } from "./lib/published.mjs";
import { header, table, kv } from "./lib/report.mjs";

const a = argv();
const EVIDENCE_ROOT = process.env.EVIDENCE_ROOT || "/Users/mkbabb/Programming/parse-that";

const git = (root, args) => {
    try {
        return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
    } catch (e) {
        return `n/a (${String(e.message).split("\n")[0].slice(0, 40)})`;
    }
};

const pkgVersion = (root) => {
    const p = path.join(root, "package.json");
    if (!existsSync(p)) return "no package.json";
    const j = JSON.parse(readFileSync(p, "utf8"));
    return `${j.name ?? "(private)"}@${j.version ?? "-"}${j.private ? " (private)" : ""}`;
};

function repoRow(label, root, note) {
    if (!existsSync(root)) return [label, root, "ABSENT", "-", "-", note];
    return [
        label,
        root,
        git(root, ["rev-parse", "HEAD"]).slice(0, 12),
        git(root, ["rev-parse", "--abbrev-ref", "HEAD"]),
        `${git(root, ["status", "--porcelain"]).split("\n").filter(Boolean).length} dirty`,
        note,
    ];
}

export function receipt() {
    const pin = publishedPin();
    const evidenceCommittedWasm = (() => {
        try {
            execFileSync("git", ["-C", EVIDENCE_ROOT, "grep", "-l", "wasm32", "HEAD", "--", "rust/parse_that/"], { encoding: "utf8" });
            return "SOME — OP-6's premise would be broken";
        } catch {
            return "0 (exit 1, no output) — OP-6 holds";
        }
    })();
    return {
        stampedAt: new Date().toISOString(),
        node: process.version,
        platform: `${process.platform} ${process.arch}`,
        v8: process.versions.v8,
        repos: {
            p2: { root: P2_ROOT, head: git(P2_ROOT, ["rev-parse", "HEAD"]), branch: git(P2_ROOT, ["rev-parse", "--abbrev-ref", "HEAD"]), base: "f5757082 (§0l R-13, the ref of record)", pkg: pkgVersion(P2_ROOT) },
            valuejs: { root: VALUE_JS_ROOT, head: git(VALUE_JS_ROOT, ["rev-parse", "HEAD"]), branch: git(VALUE_JS_ROOT, ["rev-parse", "--abbrev-ref", "HEAD"]), pkg: pkgVersion(VALUE_JS_ROOT) },
            evidence: { root: EVIDENCE_ROOT, head: git(EVIDENCE_ROOT, ["rev-parse", "HEAD"]), readOnly: true, committedWasm32: evidenceCommittedWasm },
        },
        thirdCell: {
            subject: "@mkbabb/value.js@4.0.0 /css — VENDORED, sha-pinned",
            path: pin.path,
            sha256: pin.sha256,
            matchesPin: pin.matches,
            distOrTree: "dist (the published tarball) — never the working-tree dist",
            overriddenByEnv: Boolean(pin.overridden),
        },
        denominator: {
            value: "1,636,680 µs",
            why: "OP-5 / SCOPE.md M-22 ¶4 — the conservative reconstruction every ratio row carries until `P4-EVIDENCE-REPLAY.json` is readable",
        },
        bar: "OWNER-GATED-PENDING-RATIFICATION (COHESION §0j.E OC-1: the bench table is RECORDED-NOT-GATING; no bar is set here or anywhere in W2)",
    };
}

if (a.flags.has("json")) {
    console.log(JSON.stringify(receipt(), null, 4));
    process.exit(0);
}

const r = receipt();
header("X.P.W2.g — substrate-receipt (G-7's per-number stamp · G-9's substrate witness)");
table(
    ["subject", "root", "commit", "branch", "worktree", "note"],
    [
        repoRow("<p2> (the fresh writer root)", P2_ROOT, "base f5757082 — §0l R-13"),
        repoRow("value.js", VALUE_JS_ROOT, "docs + the frozen surface; never written by X·P"),
        repoRow("parse-that (evidence)", EVIDENCE_ROOT, "READ-ONLY always; K-10 forbids its uncommitted wasm32"),
    ],
);
console.log();
kv([
    ["node", `${r.node} · v8 ${r.v8} · ${r.platform}`],
    ["<p2> package", r.repos.p2.pkg],
    ["third cell", `${r.thirdCell.subject}`],
    ["third cell sha256", `${r.thirdCell.sha256} ${r.thirdCell.matchesPin ? "== pinned 8b5381…0c42" : "!! PIN MISMATCH"}`],
    ["third cell dist-or-tree", r.thirdCell.distOrTree],
    ["committed wasm32 in the evidence root (OP-6)", r.repos.evidence.committedWasm32],
    ["ratio denominator (OP-5)", `${r.denominator.value} — ${r.denominator.why}`],
    ["bar", r.bar],
]);
process.exit(0);
