import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
await rm(new URL("../dist", import.meta.url), { recursive: true, force: true });
await rm(new URL("../.test-dist", import.meta.url), { recursive: true, force: true });
void root;
