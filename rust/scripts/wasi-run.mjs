// Cargo runner for wasm32-wasip1 test binaries under Node's WASI.
import { readFile } from "node:fs/promises";
import { WASI } from "node:wasi";
import process from "node:process";
const [wasmPath, ...args] = process.argv.slice(2);
const preopens = { "/": "/" };
const wasi = new WASI({ version: "preview1", args: [wasmPath, ...args], env: process.env, preopens, returnOnExit: true });
const mod = await WebAssembly.compile(await readFile(wasmPath));
const inst = await WebAssembly.instantiate(mod, wasi.getImportObject());
process.exitCode = wasi.start(inst);
