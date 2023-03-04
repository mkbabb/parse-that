import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => ({
    base: "./",

    build: {
        minify: true,
        sourcemap: true,
        lib: {
            entry: {
                parse: "./src/parse/index.ts",
                ebnf: "./src/ebnf/index.ts",
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
        forceRerunTriggers: ["**/*.ebnf/**"],
    },

    plugins: [dts()],
}));
