// sk-v27 LW1.RX-1: the regex oracle's engine side. One process runs one
// corpus on the host JavaScript engine and prints one JSON document.
//
// The same file runs unchanged under V8 (`node exec.js <corpus>`) and under
// JavaScriptCore (`jsc exec.js -- <corpus>`). The engine's own RegExp is the
// authority (regex design C1-3): nothing here interprets a pattern.
//
// Leaf semantics are parse-that's: a regex leaf is a sticky match at an
// offset, so every case runs with the `y` flag and `lastIndex = at`.
//
// Offsets. Corpus offsets (`at`) are UTF-8 byte offsets, the unit the Rust
// engine uses; JS indexes UTF-16 code units. Inputs must be valid Unicode
// scalar-value strings (no lone surrogates); a case that breaks that rule is
// rejected as INVALID_INPUT rather than run. The result reports the match end
// in both units. A non-`u` pattern can end between the two halves of a
// surrogate pair; that end has no UTF-8 image and is reported as
// `end8: null, split: true` — the encoding divergence regex C1-2/C2-2 name.

// JSC binds the script arguments to a global `arguments`; capture it before
// the function scope below shadows the name. (Under Node this is the CommonJS
// wrapper's arguments and is never read.)
var SCRIPT_ARGS = typeof arguments !== "undefined" ? arguments : [];

(function (scriptArgs) {
  "use strict";

  var isNode =
    typeof process !== "undefined" && process.versions && process.versions.node;

  function readText(path) {
    if (isNode) return require("fs").readFileSync(path, "utf8");
    return read(path); // JSC shell builtin
  }

  function emit(text) {
    if (isNode) process.stdout.write(text + "\n");
    else print(text); // JSC shell builtin
  }

  function args() {
    if (isNode) return process.argv.slice(2);
    return Array.prototype.slice.call(scriptArgs);
  }

  // UTF-8 length of the code point starting at UTF-16 index i, plus how many
  // code units it spans. Returns null on a lone surrogate.
  function scalarAt(s, i) {
    var c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      var d = s.charCodeAt(i + 1);
      if (!(d >= 0xdc00 && d <= 0xdfff)) return null;
      return { units: 2, bytes: 4 };
    }
    if (c >= 0xdc00 && c <= 0xdfff) return null;
    return { units: 1, bytes: c < 0x80 ? 1 : c < 0x800 ? 2 : 3 };
  }

  // Offset maps for a valid scalar-value string. u16ToU8[i] is the UTF-8
  // offset of UTF-16 index i, or -1 when i falls inside a surrogate pair.
  function offsetMaps(s) {
    var u16ToU8 = new Array(s.length + 1);
    var u8ToU16 = {};
    var i = 0;
    var b = 0;
    while (i < s.length) {
      var sc = scalarAt(s, i);
      if (sc === null) return null;
      u16ToU8[i] = b;
      u8ToU16[b] = i;
      if (sc.units === 2) u16ToU8[i + 1] = -1;
      i += sc.units;
      b += sc.bytes;
    }
    u16ToU8[s.length] = b;
    u8ToU16[b] = s.length;
    return { u16ToU8: u16ToU8, u8ToU16: u8ToU16, len8: b };
  }

  function runCase(c) {
    var out = { id: c.id };
    var maps = offsetMaps(c.input);
    if (maps === null) {
      out.status = "INVALID_INPUT";
      return out;
    }
    var at8 = c.at || 0;
    var at16 = maps.u8ToU16[at8];
    if (at16 === undefined) {
      out.status = "INVALID_OFFSET";
      return out;
    }
    var flags = c.flags || "";
    if (flags.indexOf("y") < 0) flags += "y";
    var re;
    try {
      re = new RegExp(c.pattern, flags);
    } catch (e) {
      out.status = "SYNTAX_ERROR";
      out.error = String(e && e.name);
      return out;
    }
    re.lastIndex = at16;
    var m = re.exec(c.input);
    if (m === null) {
      out.status = "NO_MATCH";
      return out;
    }
    var end16 = at16 + m[0].length;
    var end8 = maps.u16ToU8[end16];
    out.status = "MATCH";
    out.end16 = end16;
    out.len16 = m[0].length;
    if (end8 === -1) {
      out.end8 = null;
      out.split = true;
    } else {
      out.end8 = end8;
      out.len8 = end8 - at8;
    }
    return out;
  }

  var a = args();
  if (a.length < 1) throw new Error("usage: exec.js <corpus.json>");
  var corpus = JSON.parse(readText(a[0]));
  var results = [];
  for (var k = 0; k < corpus.cases.length; k++) results.push(runCase(corpus.cases[k]));
  emit(
    JSON.stringify({
      engine: isNode ? "v8" : "jsc",
      engineVersion: isNode ? process.versions.v8 : null,
      corpus: corpus.name,
      results: results,
    })
  );
})(SCRIPT_ARGS);
