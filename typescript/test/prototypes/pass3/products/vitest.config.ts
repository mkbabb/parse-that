import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["test/prototypes/pass3/products/products.test.ts"],
        pool: "forks",
    },
});
