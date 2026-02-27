import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    base: "./",

    build: {
        minify: false,
        sourcemap: true,
        lib: {
            entry: {
                parse: "./src/parse/index.ts",
            },
            formats: ["es", "cjs"],
        },
    },

    plugins: [dts()],
});
