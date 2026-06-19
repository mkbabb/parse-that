import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    base: "./",

    build: {
        minify: false,
        sourcemap: true,
        lib: {
            // Multi-entry build (A.W3 subpath split). `parse` is the full root
            // barrel; `core`/`diagnostics`/`packrat`/`utils` are the per-tier
            // entry points behind the `exports` subpaths in package.json.
            entry: {
                parse: "./src/parse/index.ts",
                core: "./src/parse/core.ts",
                diagnostics: "./src/parse/diagnostics.ts",
                packrat: "./src/parse/packrat-entry.ts",
                utils: "./src/parse/utils-entry.ts",
            },
            formats: ["es", "cjs"],
        },
    },

    plugins: [dts({ include: ["src/"] })],
});
