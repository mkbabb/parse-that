import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["test/*.test.ts"],
        coverage: {
            provider: "c8",
            reporter: ["text", "json", "html"],
        },
    },
});
