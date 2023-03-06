import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import commonjs from "@rollup/plugin-commonjs";

export default defineConfig(({ mode }) => ({
    base: "./",

    build: {
        minify: false,
        sourcemap: true,
        lib: {
            entry: {
                parse: "./src/parse/index.ts",
                bbnf: "./src/bbnf/index.ts",
            },
            formats: ["es", "cjs"],
        },
        rollupOptions: {
            external: ["chalk", "prettier"],
        },
    },

    test: {
        include: ["test/*.test.ts"],

        coverage: {
            provider: "c8",
            reporter: ["text", "json", "html"],
        },
        cache: false,
        watch: true,
        forceRerunTriggers: ["**/*.bbnf/**"],
    },

    plugins: [dts()],
}));
