// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.a — THE ASSEMBLY. One function that reads the pin, folds the corpus, generates and runs
// the assignability compile, and builds the 52 rows.
//
// It exists so that `scripts/css-universe.mjs` (G-1's command) and `universe.test.ts` (the per-row
// runnable assertions) measure the SAME subject through the SAME wiring. Two call sites that each
// assembled their own would be two instruments claiming one number, which is the shape of defect
// the 07-20 gate's "0 of 52" reading was misread through.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { buildUnion } from "./corpus.mjs";
import { P2_ROOT, readPin } from "./pin.mjs";
import { buildMatrix } from "./matrix.mjs";
import { compile, declaredTypeNamesOf, generate } from "./assignability.mjs";

export const CORPUS_JSON = path.join(P2_ROOT, "typescript/test/css-totality/corpus.json");
export const DEFAULT_ADAPTER = path.join(P2_ROOT, "typescript/src/css/harness-adapter.mjs");
export const FALLBACK_DTS = path.join(P2_ROOT, "typescript/src/css/build/ac1.d.ts");

/**
 * @param {{ commit: string, adapterPath?: string, runTsc?: boolean, writeCorpus?: boolean }} options
 */
export const assemble = async ({ commit, adapterPath, runTsc = true, writeCorpus = true }) => {
    const pin = await readPin(commit);

    const adapter = adapterPath ?? DEFAULT_ADAPTER;
    const loaded = existsSync(adapter) ? await import(adapter) : null;
    const entry = loaded?.meta?.artifacts?.jsEntry ?? null;
    const dts = loaded?.meta?.artifacts?.dts ?? null;
    const candidate = {
        id: loaded?.meta?.id ?? "none",
        adapter,
        entry,
        dts,
        namespace: entry && existsSync(entry) ? await import(entry) : null,
    };

    const corpus = buildUnion();
    if (writeCorpus) writeFileSync(CORPUS_JSON, `${JSON.stringify(corpus, null, 0)}\n`);

    const declaredTypes =
        candidate.dts && existsSync(candidate.dts)
            ? declaredTypeNamesOf(readFileSync(candidate.dts, "utf8"))
            : [];

    let generated = null;
    let assignability = null;
    if (runTsc) {
        generated = generate({ types: pin.universe.types, candidateDts: candidate.dts ?? FALLBACK_DTS });
        assignability = compile(generated, pin.universe.types);
    }

    const matrix = buildMatrix({ pin, corpus, candidate, declaredTypes, assignability, breadth: null });

    const agreement = pin.agreement;
    const agreementClean =
        agreement.typeNames.barrelMinusPublished.length === 0 &&
        agreement.typeNames.publishedMinusBarrel.length === 0 &&
        agreement.runtimeNames.barrelMinusPublished.length === 0 &&
        agreement.runtimeNames.publishedMinusBarrel.length === 0 &&
        agreement.disagreements.length === 0;

    return { pin, candidate, corpus, declaredTypes, generated, assignability, matrix, agreementClean };
};
