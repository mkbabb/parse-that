import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = new URL("../", import.meta.url);
const scratch = await mkdtemp(join(tmpdir(), "parse-that-v3-pack-"));
try {
    const packed = JSON.parse(
        execFileSync("npm", ["pack", "--json", "--pack-destination", scratch], {
            cwd: packageRoot,
            encoding: "utf8",
        }),
    );
    const filename = packed[0]?.filename;
    assert.equal(typeof filename, "string");
    const tarball = join(scratch, filename);
    const files = execFileSync("tar", ["-tf", tarball], { encoding: "utf8" })
        .trim()
        .split("\n")
        .sort();
    assert(files.includes("package/dist/index.js"));
    assert(files.includes("package/dist/index.d.ts"));
    assert(files.includes("package/README.md"));
    assert(files.includes("package/LICENSE"));
    assert(files.every(file => !file.endsWith(".ts") || file.endsWith(".d.ts")));
    assert(files.every(file => !file.includes("test") && !file.endsWith(".map")));

    const consumer = join(scratch, "consumer");
    await mkdir(consumer);
    await writeFile(
        join(consumer, "package.json"),
        JSON.stringify({ private: true, type: "module" }),
    );
    execFileSync("npm", ["install", "--silent", tarball], { cwd: consumer });
    await writeFile(
        join(consumer, "index.mjs"),
        [
            'import { createGrammar, parseFull } from "@parse-that/invocation-kernel-v3-prototype";',
            "const g = createGrammar();",
            'const parser = g.seal(g.literal("packed"));',
            'const result = parseFull(parser, "packed");',
            'if (result.kind !== "success" || result.value !== "packed") throw new Error("packed runtime failed");',
        ].join("\n"),
    );
    execFileSync(process.execPath, [join(consumer, "index.mjs")], { stdio: "inherit" });

    await writeFile(
        join(consumer, "types.ts"),
        [
            'import { createGrammar, parseFull, type Parser } from "@parse-that/invocation-kernel-v3-prototype";',
            "const g = createGrammar();",
            "const p: Parser<\"x\"> = g.seal(g.literal(\"x\"));",
            'const r = parseFull(p, "x");',
            'if (r.kind === "success") { const x: "x" = r.value; void x; }',
        ].join("\n"),
    );
    await writeFile(
        join(consumer, "tsconfig.json"),
        JSON.stringify({
            compilerOptions: {
                target: "ES2022",
                module: "NodeNext",
                moduleResolution: "NodeNext",
                strict: true,
                skipLibCheck: true,
                noEmit: true,
            },
            include: ["types.ts"],
        }),
    );
    execFileSync(
        fileURLToPath(new URL("../../../../../typescript/node_modules/.bin/tsc", packageRoot)),
        ["-p", join(consumer, "tsconfig.json")],
        { stdio: "inherit" },
    );
    const manifest = JSON.parse(await readFile(join(consumer, "node_modules/@parse-that/invocation-kernel-v3-prototype/package.json"), "utf8"));
    assert.equal(manifest.exports["."].import, "./dist/index.js");
    process.stdout.write(`${JSON.stringify({ packed: true, files }, null, 2)}\n`);
} finally {
    await rm(scratch, { recursive: true, force: true });
}
