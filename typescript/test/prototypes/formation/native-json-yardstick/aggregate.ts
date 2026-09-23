import { readFileSync, writeFileSync } from "node:fs";

type Point = Readonly<{
    scale: number;
    plane: string;
    ratio: number;
}>;

type Run = Readonly<{
    subject: string;
    node: string;
    v8: string;
    baseline: string;
    points: readonly Point[];
}>;

const paths = process.argv.slice(2);
if (paths.length < 3) {
    throw new Error("usage: aggregate.ts RUN.json RUN.json RUN.json [...]");
}

const runs = paths.map(path =>
    JSON.parse(readFileSync(path, "utf8")) as Run
);
const [first] = runs;
for (const run of runs) {
    if (
        run.subject !== first.subject
        || run.node !== first.node
        || run.v8 !== first.v8
        || run.baseline !== first.baseline
        || run.points.length !== first.points.length
    ) {
        throw new Error("yardstick run metadata mismatch");
    }
}

function median(values: readonly number[]): number {
    const sorted = [...values].sort((left, right) => left - right);
    return sorted[sorted.length >> 1];
}

let randomState = 0x9e3779b9;
function randomIndex(length: number): number {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return (randomState >>> 0) % length;
}

function bootstrapMedian(values: readonly number[]) {
    const samples = new Array<number>(20_000);
    const draw = new Array<number>(values.length);
    for (let sample = 0; sample < samples.length; sample++) {
        for (let index = 0; index < draw.length; index++) {
            draw[index] = values[randomIndex(values.length)];
        }
        samples[sample] = median(draw);
    }
    samples.sort((left, right) => left - right);
    return {
        low: samples[Math.floor(samples.length * 0.025)],
        high: samples[Math.floor(samples.length * 0.975)],
    };
}

const points = first.points.map((point, pointIndex) => {
    const ratios = runs.map(run => {
        const current = run.points[pointIndex];
        if (current.scale !== point.scale || current.plane !== point.plane) {
            throw new Error(`yardstick point mismatch at ${pointIndex}`);
        }
        return current.ratio;
    });
    const confidence = bootstrapMedian(ratios);
    return {
        scale: point.scale,
        plane: point.plane,
        processes: ratios.length,
        ratios,
        min: Math.min(...ratios),
        median: median(ratios),
        max: Math.max(...ratios),
        medianBootstrap95: confidence,
        requiredFasterThanYardstickAtOptimistic95: 10 / confidence.high,
    };
});

const output = {
    subject: first.subject,
    meaning: "Native semantic-work yardstick only; not a parser candidate, lower-bound proof, or admission control",
    node: first.node,
    v8: first.v8,
    baseline: first.baseline,
    processes: runs.length,
    bootstrapSamples: 20_000,
    points,
};
const serialized = `${JSON.stringify(output)}\n`;
const outputPath = process.env.NATIVE_JSON_YARDSTICK_AGGREGATE;
if (outputPath) writeFileSync(outputPath, serialized);
console.log(serialized);
