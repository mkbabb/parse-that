import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    string,
    regex,
    any,
    ParserState,
    enableDiagnostics,
    disableDiagnostics,
} from "../src/parse/index.js";

beforeEach(() => enableDiagnostics());
afterEach(() => disableDiagnostics());

// ═════════════════════════════════════════════════════════════════════════
// PT-WAVE-1 — error/diagnostic state is per-parse (threaded onto ParserState),
// not a module global. The reentrancy hazard: a `.map` callback that itself
// runs a nested top-level `.parse()` must NOT corrupt the outer parse's
// furthest-offset / expected-set tracking.
//
// proof:reentrant-furthest — reds on the old module-global state (the inner
// reset() wipes the outer furthest), greens once state-threaded.
// ═════════════════════════════════════════════════════════════════════════

describe("Reentrant / interleaved parsing (per-parse error state)", () => {
    it("preserves the outer parse's furthest-offset across a nested .parse()", () => {
        // An inner grammar that fails partway, advancing its own furthest
        // offset deep into a distinct input.
        const inner = any(string("aaaa"), string("bbbb"));

        // The outer grammar's first branch advances far (matching "xxxx")
        // then runs a nested inner.parse() in its .map callback before the
        // outer second branch fails. The nested parse must not clobber the
        // outer's furthest tracking.
        const outerHead = string("xxxx").map((v) => {
            // Reentrant nested top-level parse mid-rule.
            inner.parse("zzz");
            return v;
        });
        const outer = outerHead.then(string("YYYY"));

        // "xxxxQ" — outerHead matches "xxxx" (offset 4), the nested parse runs,
        // then `then(string("YYYY"))` fails at offset 4.
        const state = new ParserState("xxxxQ");
        outer.parser(state);

        expect(state.isError).toBe(true);
        // The furthest offset the OUTER parse reached is 4 (after "xxxx",
        // expecting "YYYY"). Under module-global state the nested inner.parse()
        // ran reset() and re-tracked at offset 0, corrupting this to a value
        // derived from "zzz" rather than the outer parse.
        expect(state.furthest).toBe(4);
        expect(state.expected).toContain('"YYYY"');
        // The outer expected-set must not leak the inner grammar's labels.
        expect(state.expected).not.toContain('"aaaa"');
        expect(state.expected).not.toContain('"bbbb"');
    });

    it("two interleaved parses keep independent error state", () => {
        const a = regex(/a+/).skip(string("!"));
        const b = regex(/b+/).skip(string("@"));

        // Run two distinct parses and capture each one's own state — the
        // error fields belong to the state object, not a shared global, so
        // reading one does not depend on which parsed most recently.
        const sa = new ParserState("aaaX");
        a.parser(sa);
        const sb = new ParserState("bbbbbbY");
        b.parser(sb);

        expect(sa.isError).toBe(true);
        expect(sb.isError).toBe(true);
        // Each state reached its own furthest offset.
        expect(sa.furthest).toBe(3); // after "aaa", expecting "!"
        expect(sb.furthest).toBe(6); // after "bbbbbb", expecting "@"
        expect(sa.expected).toContain('"!"');
        expect(sb.expected).toContain('"@"');
        // No cross-contamination.
        expect(sa.expected).not.toContain('"@"');
        expect(sb.expected).not.toContain('"!"');
    });
});
