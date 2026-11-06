import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
test("H10 the package declares executable test/build/packed gates and a real identity", async () => {
    const manifest = JSON.parse(await readFile("package.json", "utf8"));
    assert.equal(manifest.name, "@parse-that/invocation-kernel-v3-prototype");
    assert.equal(manifest.version, "0.0.0");
    for (const script of ["build", "typecheck", "test", "test:hostile", "test:packed"]) {
        assert.equal(typeof manifest.scripts[script], "string", script);
        assert(manifest.scripts[script].length > 0, script);
    }
    assert.deepEqual(manifest.exports["."], {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
    });
});
