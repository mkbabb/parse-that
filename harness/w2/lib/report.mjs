// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — PRINTED TABLES, AND THE TWO SENTENCES NO PROBE MAY PRINT.
//
//   1. No pass/fail verdict on anything bench-adjacent. `COHESION.md` §0j.E OC-1 rules the bench
//      table RECORDED-NOT-GATING and ratifies NO bar; `W2.md` §6 G-7 requires the literal string
//      `BAR: OWNER-GATED-PENDING-RATIFICATION` and calls an invented bar a defect. `bar()` below is
//      the only way a W2 probe prints anything about a bar, and it prints exactly that.
//   2. No speed sentence outside a printed table (the folklore scar, §11 archaeology 3). Timing
//      figures appear only as rows of `table()`.

export const BAR_LINE = "BAR: OWNER-GATED-PENDING-RATIFICATION";

export function bar() {
    console.log(BAR_LINE);
}

export function header(title, sub = []) {
    console.log(`=== ${title} ===`);
    for (const s of sub) console.log(s);
}

export function table(cols, rows) {
    const widths = cols.map((c, i) =>
        Math.max(c.length, ...rows.map((r) => String(r[i] ?? "").length)),
    );
    const line = (cells) => cells.map((c, i) => String(c ?? "").padEnd(widths[i])).join("  ").trimEnd();
    console.log(line(cols));
    console.log(widths.map((w) => "-".repeat(w)).join("  "));
    for (const r of rows) console.log(line(r));
}

export function kv(pairs) {
    const w = Math.max(...pairs.map(([k]) => k.length));
    for (const [k, v] of pairs) console.log(`${k.padEnd(w)}  ${v}`);
}

/**
 * The verdict line every gate-invoked probe ends with. `reason` is mandatory on RED: a gate that
 * cannot say why it is red cannot be acted on (L-19: a gate must be able to fail for its intended
 * reason, and must say which reason it hit).
 */
export function verdict(green, reason) {
    console.log(green ? `GREEN — ${reason}` : `RED — ${reason}`);
    return green ? 0 : 1;
}

/** ABSENT is not RED-by-crash: the subject does not exist yet, and the probe says so and exits 1. */
export function absent(what, why) {
    console.log(`ABSENT — ${what}: ${why}`);
    return 1;
}
