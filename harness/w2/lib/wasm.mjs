// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — A HAND-ASSEMBLED WASM PAIR, so the import audit can be proven to fire.
//
// `W2.md` §6 G-9's falsifier turns on the audit walking ALL import kinds and on a start-function
// side channel counting. A probe that has never seen a module WITH an import cannot claim to
// detect one, so this module emits both: a zero-import module and three importing ones (function,
// memory, global), plus one carrying a start section. They are bytes this file writes, not bytes
// anyone shipped — nothing here is a candidate's artifact, and nothing here is substrate.
//
// Encoding notes: WebAssembly binary 1.0, sections in canonical order. `uleb` is the only
// variable-width encoder needed at these sizes.

const MAGIC = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];

export function uleb(n) {
    const out = [];
    do {
        let b = n & 0x7f;
        n >>>= 7;
        if (n) b |= 0x80;
        out.push(b);
    } while (n);
    return out;
}

const str = (s) => [...uleb(s.length), ...[...s].map((c) => c.charCodeAt(0))];
const section = (id, payload) => [id, ...uleb(payload.length), ...payload];
const vec = (items) => [...uleb(items.length), ...items.flat()];

/** type: () -> i32 */
const TYPE_SECTION = section(1, vec([[0x60, 0x00, 0x01, 0x7f]]));
/** one function of type 0 */
const FUNC_SECTION = section(3, vec([[0x00]]));
/** one memory, min 1 page */
const MEM_SECTION = section(5, vec([[0x00, 0x01]]));
/** body: i32.const 42; end */
const CODE_SECTION = section(10, vec([[...uleb(4), 0x00, 0x41, 0x2a, 0x0b]]));
const EXPORT_RUN_MEM = section(7, vec([[...str("run"), 0x00, 0x00], [...str("memory"), 0x02, 0x00]]));

export function zeroImportModule() {
    return new Uint8Array([...MAGIC, ...TYPE_SECTION, ...FUNC_SECTION, ...MEM_SECTION, ...EXPORT_RUN_MEM, ...CODE_SECTION]);
}

/** kind: "func" | "memory" | "global" — one import of that kind, everything else identical. */
export function importingModule(kind) {
    const desc =
        kind === "func" ? [0x00, 0x00] :
        kind === "memory" ? [0x02, 0x00, 0x01] :
        [0x03, 0x7f, 0x00]; //                                    global i32, immutable
    const IMPORT_SECTION = section(2, vec([[...str("env"), ...str(kind), ...desc]]));
    const body = kind === "memory"
        ? [...MAGIC, ...TYPE_SECTION, ...IMPORT_SECTION, ...FUNC_SECTION, ...CODE_SECTION]
        : [...MAGIC, ...TYPE_SECTION, ...IMPORT_SECTION, ...FUNC_SECTION, ...MEM_SECTION, ...CODE_SECTION];
    return new Uint8Array(body);
}

/** A module whose start section runs a function at instantiation — the side channel G-9 names. */
export function startSectionModule() {
    const TYPE_VOID = section(1, vec([[0x60, 0x00, 0x00]]));
    const FUNC = section(3, vec([[0x00]]));
    const START = section(8, uleb(0));
    const CODE = section(10, vec([[...uleb(2), 0x00, 0x0b]]));
    return new Uint8Array([...MAGIC, ...TYPE_VOID, ...FUNC, ...START, ...CODE]);
}

/**
 * Section ids present in a module's bytes — the only way to see a START section, which
 * `WebAssembly.Module` does not reflect. Custom sections (id 0) are reported by name.
 */
export function sectionIds(bytes) {
    const out = [];
    let i = 8;
    const u = () => {
        let result = 0;
        let shift = 0;
        let b;
        do {
            b = bytes[i++];
            result |= (b & 0x7f) << shift;
            shift += 7;
        } while (b & 0x80);
        return result >>> 0;
    };
    while (i < bytes.length) {
        const id = bytes[i++];
        const size = u();
        out.push(id);
        i += size;
    }
    return out;
}

export const SECTION_NAMES = {
    0: "custom", 1: "type", 2: "import", 3: "function", 4: "table", 5: "memory", 6: "global",
    7: "export", 8: "START", 9: "element", 10: "code", 11: "data", 12: "data-count",
};
