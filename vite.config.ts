import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";
import autoprefixer from "autoprefixer";

const defaultOptions = {
    base: "./",
    css: {
        postcss: {
            plugins: [autoprefixer],
        },
    },
};

export default defineConfig({
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
    plugins: [dts()],
});
