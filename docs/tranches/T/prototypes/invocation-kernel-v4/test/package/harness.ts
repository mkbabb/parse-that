import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

const packageRoot = process.cwd();
const repositoryRoot = resolve(packageRoot, "../../../../..");
const tsc = join(repositoryRoot, "typescript/node_modules/.bin/tsc");
const vite = join(repositoryRoot, "typescript/node_modules/.bin/vite");
const scratch = await mkdtemp(join(tmpdir(), "parse-that-v4-package-"));

async function filesBelow(root: string): Promise<string[]> {
    const found: string[] = [];
    const pending = [root];
    while (pending.length > 0) {
        const directory = pending.pop()!;
        for (const entry of await readdir(directory, { withFileTypes: true })) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) pending.push(path);
            else found.push(relative(root, path).replaceAll("\\", "/"));
        }
    }
    return found.sort();
}

async function ledger(root: string, files: readonly string[]): Promise<{ readonly sha256: string; readonly entries: readonly { readonly file: string; readonly sha256: string; readonly bytes: number }[] }> {
    const entries = [];
    for (const file of files) {
        const bytes = await readFile(join(root, file));
        entries.push({ file, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length });
    }
    return { sha256: createHash("sha256").update(JSON.stringify(entries)).digest("hex"), entries };
}

try {
    const publicRoot = join(packageRoot, ".test-dist/test/public");
    const publicFiles = (await filesBelow(publicRoot)).filter(file => file.endsWith(".js"));
    const publicCopy = join(scratch, "public-suite");
    await mkdir(publicCopy, { recursive: true });
    for (const file of publicFiles) {
        await mkdir(join(publicCopy, file, ".."), { recursive: true });
        await cp(join(publicRoot, file), join(publicCopy, file));
    }
    const publicLedger = await ledger(publicCopy, publicFiles);
    execFileSync(process.execPath, ["--test", ...publicFiles.map(file => join(publicRoot, file))], { cwd: packageRoot, stdio: "inherit" });

    execFileSync("npm", ["run", "clean", "--silent"], { cwd: packageRoot, stdio: "inherit" });
    await assert.rejects(stat(join(packageRoot, "dist")));
    execFileSync("npm", ["run", "build", "--silent"], { cwd: packageRoot, stdio: "inherit" });
    const manifest = JSON.parse(await readFile(join(packageRoot, "ARTIFACTS.json"), "utf8"));
    assert.deepEqual(await filesBelow(join(packageRoot, "dist")), manifest.files.map((file: string) => file.replace(/^dist\//, "")).sort());
    const firstBuild = await ledger(packageRoot, manifest.files);
    execFileSync("npm", ["run", "build", "--silent"], { cwd: packageRoot, stdio: "inherit" });
    const secondBuild = await ledger(packageRoot, manifest.files);
    assert.deepEqual(secondBuild, firstBuild);

    const pack = (destination: string): { readonly tarball: string; readonly npm: unknown } => {
        const result = JSON.parse(execFileSync("npm", ["pack", "--json", "--pack-destination", destination], { cwd: packageRoot, encoding: "utf8" }));
        const filename = result[0]?.filename;
        assert.equal(typeof filename, "string");
        return { tarball: join(destination, filename), npm: result[0] };
    };
    const firstPackDir = join(scratch, "pack-a");
    const secondPackDir = join(scratch, "pack-b");
    await mkdir(firstPackDir); await mkdir(secondPackDir);
    const packedA = pack(firstPackDir);
    const packedB = pack(secondPackDir);
    const tarA = await readFile(packedA.tarball);
    const tarB = await readFile(packedB.tarball);
    const tarSha256 = createHash("sha256").update(tarA).digest("hex");
    assert.equal(createHash("sha256").update(tarB).digest("hex"), tarSha256);
    assert.equal(Buffer.compare(tarA, tarB), 0);
    const archive = execFileSync("tar", ["-tf", packedA.tarball], { encoding: "utf8" }).trim().split("\n").sort();
    const expectedArchive = ["package/package.json", "package/README.md", "package/EVIDENCE.md", "package/LICENSE", "package/ARTIFACTS.json", ...manifest.files.map((file: string) => `package/${file}`)].sort();
    assert.deepEqual(archive, expectedArchive);
    assert(archive.every(file => !file.includes("/src/") && !file.includes("/test/") && (!file.endsWith(".ts") || file.endsWith(".d.ts"))));

    const consumer = join(scratch, "consumer");
    await mkdir(consumer);
    await writeFile(join(consumer, "package.json"), JSON.stringify({ private: true, type: "module" }));
    execFileSync("npm", ["install", "--silent", packedA.tarball], { cwd: consumer, stdio: "inherit" });
    const installedPublic = join(consumer, "test/public");
    await mkdir(installedPublic, { recursive: true });
    for (const file of publicFiles) {
        await mkdir(join(installedPublic, file, ".."), { recursive: true });
        await cp(join(publicCopy, file), join(installedPublic, file));
    }
    assert.deepEqual(await ledger(installedPublic, publicFiles), publicLedger);
    execFileSync(process.execPath, ["--test", ...publicFiles.map(file => join(installedPublic, file))], { cwd: consumer, stdio: "inherit" });

    await writeFile(join(consumer, "identity.mjs"), [
        'import * as first from "@parse-that/invocation-kernel-v4-prototype";',
        'const second = await import("@parse-that/invocation-kernel-v4-prototype");',
        'if (first.createGrammar !== second.createGrammar) throw new Error("ESM identity split");',
        'const g = first.createGrammar(); const r = first.parseFull(g.seal(g.literal("packed")), "packed");',
        'if (r.kind !== "success" || r.value !== "packed") throw new Error("packed execution failed");',
    ].join("\n"));
    execFileSync(process.execPath, [join(consumer, "identity.mjs")], { cwd: consumer, stdio: "inherit" });
    const deep = spawnSync(process.execPath, ["--input-type=module", "--eval", 'await import("@parse-that/invocation-kernel-v4-prototype/dist/model.js")'], { cwd: consumer, encoding: "utf8" });
    assert.notEqual(deep.status, 0, "undeclared deep subpath must be rejected");

    await writeFile(join(consumer, "worker.mjs"), [
        'import { parentPort } from "node:worker_threads";',
        'import { createGrammar, parseFull } from "@parse-that/invocation-kernel-v4-prototype";',
        'const g=createGrammar(); parentPort.postMessage(parseFull(g.seal(g.literal("w")), "w").kind);',
    ].join("\n"));
    await writeFile(join(consumer, "worker-runner.mjs"), [
        'import { Worker } from "node:worker_threads";',
        'const value=await new Promise((resolve,reject)=>{const w=new Worker(new URL("./worker.mjs",import.meta.url));w.once("message",resolve);w.once("error",reject)});',
        'if(value!=="success") throw new Error("worker failed");',
    ].join("\n"));
    execFileSync(process.execPath, [join(consumer, "worker-runner.mjs")], { cwd: consumer, stdio: "inherit" });

    await writeFile(join(consumer, "types.ts"), [
        'import { createGrammar, parseFull, type Parser } from "@parse-that/invocation-kernel-v4-prototype";',
        'const g=createGrammar(); const p: Parser<"x">=g.seal(g.literal("x")); const r=parseFull(p,"x");',
        'if(r.kind==="success"){const x:"x"=r.value;void x}',
    ].join("\n"));
    await writeFile(join(consumer, "leak.ts"), [
        'import { createGrammar } from "@parse-that/invocation-kernel-v4-prototype";',
        'createGrammar()._sealedGraph();',
    ].join("\n"));
    const tsconfig = (include: string) => ({ compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true, skipLibCheck: false, noEmit: true }, include: [include] });
    await writeFile(join(consumer, "tsconfig.json"), JSON.stringify(tsconfig("types.ts")));
    execFileSync(tsc, ["-p", join(consumer, "tsconfig.json")], { cwd: consumer, stdio: "inherit" });
    await writeFile(join(consumer, "tsconfig-leak.json"), JSON.stringify(tsconfig("leak.ts")));
    const leak = spawnSync(tsc, ["-p", join(consumer, "tsconfig-leak.json")], { cwd: consumer, encoding: "utf8" });
    assert.notEqual(leak.status, 0, "strict packed declarations must reject _sealedGraph");
    assert.match(`${leak.stdout}${leak.stderr}`, /_sealedGraph/);

    const viteRoot = join(consumer, "vite");
    await mkdir(viteRoot);
    await writeFile(join(viteRoot, "index.html"), '<script type="module" src="/src.js"></script>');
    await writeFile(join(viteRoot, "src.js"), 'import {createGrammar,parseFull} from "@parse-that/invocation-kernel-v4-prototype";const g=createGrammar();globalThis.result=parseFull(g.seal(g.literal("v")),"v");');
    execFileSync(vite, ["build", "--outDir", "out", "--emptyOutDir"], { cwd: viteRoot, stdio: "inherit" });
    const viteFiles = await filesBelow(join(viteRoot, "out"));
    assert(viteFiles.some(file => file.endsWith(".js")));

    process.stdout.write(`${JSON.stringify({
        schema: "parse-that.invocation-kernel-v4.package-receipt.v1",
        buildSha256: firstBuild.sha256,
        publicSuiteSha256: publicLedger.sha256,
        publicSuiteFiles: publicFiles,
        tarballSha256: tarSha256,
        tarballBytes: tarA.length,
        archiveFiles: archive.length,
        distributionBytes: firstBuild.entries.reduce((sum, entry) => sum + entry.bytes, 0),
        viteFiles,
        strictDeclarations: true,
        deepSubpathRejected: true,
        esmIdentity: true,
        worker: true,
        packsByteIdentical: true
    }, null, 2)}\n`);
} finally {
    await rm(scratch, { recursive: true, force: true });
}
