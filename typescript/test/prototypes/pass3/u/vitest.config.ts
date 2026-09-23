import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: [
            "test/prototypes/pass3/u/unordered.test.ts",
            "test/prototypes/pass3/s/kernel.test.ts",
        ],
        pool: "forks",
    },
});
