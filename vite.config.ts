import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";
import autoprefixer from "autoprefixer";
import vitePluginIfDef from "vite-plugin-ifdef";
import { nodeResolve } from "@rollup/plugin-node-resolve";

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
            formats: ["es"],
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
        nodeResolve(),
        dts({}),
        // vitePluginIfDef.default({
        //     define: {
        //         DEBUG: true,
        //     },
        //     options: {
        //         verbose: false,
        //     },
        // }),
    ],
}));
