import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const modules = ["types", "model", "seal", "parser", "outcome", "journal", "control", "lr", "run", "debug", "index"];
const ownership: Record<string, readonly string[]> = {
    types: [], model: ["types"], seal: ["model"], parser: ["model", "seal", "types"],
    outcome: ["model", "types"], journal: ["debug", "model", "outcome", "types"],
    control: ["debug", "model", "outcome", "types"], lr: ["debug", "journal", "model", "outcome", "types"],
    run: ["control", "debug", "journal", "lr", "model", "outcome", "parser", "types"],
    debug: ["types"], index: ["debug", "parser", "run", "types"],
};

test("V4-R14 source/test topology is source-isomorphic, resolved, acyclic, and index is an import-only sink", async () => {
    const sourceFiles = (await readdir("src")).filter(file => file.endsWith(".ts")).map(file => file.replace(/\.ts$/, "")).sort();
    assert.deepEqual(sourceFiles, [...modules].sort());
    const testFiles = (await readdir("test")).filter(file => file.endsWith(".test.ts")).map(file => file.replace(/\.test\.ts$/, "")).sort();
    assert.deepEqual(testFiles, [...modules].sort());
    const edges = new Map<string, string[]>();
    for (const module of modules) {
        const text = await readFile(`src/${module}.ts`, "utf8");
        assert.equal(text.includes('from "./index.js"'), false);
        if (module === "index") assert.equal(/\b(?:function|class|const|let|var)\b/.test(text), false, "index contains only exports");
        const imports = [...text.matchAll(/from "\.\/(\w+)\.js"/g)].map(match => match[1]!).filter(target => modules.includes(target));
        const unresolved = [...text.matchAll(/from "\.\/([^".]+)\.js"/g)].map(match => match[1]!).filter(target => !modules.includes(target));
        assert.deepEqual(unresolved, [], `${module} has an unresolved source edge`);
        const unique = [...new Set(imports)].sort();
        assert.deepEqual(unique, [...(ownership[module] ?? [])].sort(), `${module} crossed its ownership boundary`);
        edges.set(module, unique);
    }
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (module: string): void => {
        assert.equal(visiting.has(module), false, `feature SCC through ${module}`);
        if (done.has(module)) return;
        visiting.add(module);
        for (const target of edges.get(module) ?? []) visit(target);
        visiting.delete(module);
        done.add(module);
    };
    for (const module of modules) visit(module);
    assert.deepEqual((await readdir("test/oracle")).filter(file => file.endsWith(".ts")).sort(), ["adapter.ts", "corpus.ts", "model.ts", "receipt.test.ts"]);
    assert.equal((await readFile("test/oracle/model.ts", "utf8")).includes("src/"), false);
    for (const file of await readdir("test/public")) {
        if (file.endsWith(".ts")) assert.equal((await readFile(`test/public/${file}`, "utf8")).includes("../src"), false);
    }
});
