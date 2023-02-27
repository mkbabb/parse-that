import { defineConfig } from "vitest/config";
import vitePluginIfDef from "vite-plugin-ifdef";

export default defineConfig(({ mode }) => ({
    test: {
        include: ["test/*.test.ts"],

        coverage: {
            provider: "c8",
            reporter: ["text", "json", "html"],
        },
        onConsoleLog: (message) => {
            console.log(message);
        },
        watch: true,
        forceRerunTriggers: ["**/*.ebnf/**"],
    },

    plugins: [
        vitePluginIfDef.default({
            define: {
                DEBUG: mode === "development",
            },
            options: {
                verbose: true,
            },
        }),
    ],
}));
