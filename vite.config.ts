import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";
import autoprefixer from "autoprefixer";
import vitePluginIfDef from "vite-plugin-ifdef";

const defaultOptions = {
    base: "./",
    css: {
        postcss: {
            plugins: [autoprefixer],
        },
    },
};

export default defineConfig(({ mode }) => ({
    ...defaultOptions,

    build: {
        minify: true,

        lib: {
            entry: {
                parse: "./src/math.ts",
                ebnf: "./src/ebnf/generate.ts.ts",
            },
            name: "ParseThat",
            fileName: "@mkbabb/parse-that",
        },
        rollupOptions: {
            external: ["chalk", "fs", "path", "util"],
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

    plugins: [
        dts(),
        vitePluginIfDef.default({
            define: {
                DEBUG: true,
                MEMOIZE: false,
            },
            options: {
                verbose: false,
            },
        }),
    ],
}));
