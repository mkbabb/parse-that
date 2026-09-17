// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — the statistics the bench is allowed to publish, and nothing else.
//
// The reported figure is the MEDIAN of the scored rounds (W1.md §5.d.2: 40 rounds, first 10
// discarded, cells interleaved per round). Median, not peak: the ported bench reported a PEAK
// ratio, and a peak is the single luckiest round on a shared box — it is the statistic most
// easily moved by load that has nothing to do with the parser. The spread is printed beside
// every median so a reader can see how much of the figure is noise.

export const median = (a) => {
    const s = [...a].sort((x, y) => x - y);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
export const min = (a) => Math.min(...a);
export const max = (a) => Math.max(...a);
export const spreadPct = (a) => ((max(a) - min(a)) / median(a)) * 100;

export const stat = (a) => ({
    median: median(a),
    min: min(a),
    max: max(a),
    spread_pct: spreadPct(a),
    n: a.length,
});

export const f = (n, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "n/a");
