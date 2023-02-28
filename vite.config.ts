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
            entry: path.resolve(__dirname, "src/index.ts"),
            name: "ParseThat",
            fileName: "@mkbabb/parse-that",
        },
        rollupOptions: {
            external: ["chalk", "fs", "path", "util"],
        },
    },

    plugins: [
        dts(),
        vitePluginIfDef.default({
            define: {
                DEBUG: mode === "development",
                MEMOIZE: false,
            },
            options: {
                verbose: false,
            },
        }),
    ],
}));
