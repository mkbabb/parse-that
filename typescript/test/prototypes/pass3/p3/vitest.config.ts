import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["test/prototypes/pass3/p3/closure.test.ts"],
        pool: "forks",
    },
});
