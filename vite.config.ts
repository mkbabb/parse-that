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
                parse: "./src/parse/index.ts",
                ebnf: "./src/ebnf/index.ts",
            },
            // fileName: (m, entryName) => {
            //     const ext = m === "es" ? "js" : "cjs";
            //     return `${entryName}.${ext}`;
            // },
            formats: ["es", "cjs"],
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
        dts({ insertTypesEntry: true }),
        vitePluginIfDef.default({
            define: {
                DEBUG: true,
            },
            options: {
                verbose: false,
            },
        }),
    ],
}));
