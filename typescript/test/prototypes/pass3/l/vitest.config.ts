import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["test/prototypes/pass3/l/leaves.test.ts"],
        pool: "forks",
    },
});
