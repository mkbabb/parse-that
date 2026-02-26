import peggy from "peggy";

const grammar = `
{
  // Helper function available in actions
}

json = ws value:value ws { return value; }

value
  = object
  / array
  / string
  / number
  / "true" { return true; }
  / "false" { return false; }
  / "null" { return null; }

object
  = "{" ws "}" { return {}; }
  / "{" ws head:pair tail:("," ws p:pair { return p; })* ws "}" {
      const obj = {};
      obj[head[0]] = head[1];
      for (const [k, v] of tail) {
        obj[k] = v;
      }
      return obj;
    }

pair
  = key:string ws ":" ws value:value { return [key, value]; }

array
  = "[" ws "]" { return []; }
  / "[" ws head:value tail:("," ws v:value { return v; })* ws "]" {
      return [head, ...tail];
    }

string
  = '"' chars:char* '"' { return chars.join(""); }

char
  = [^"\\\\]
  / "\\\\" seq:(
      '"' / "\\\\" / "/" / "b" { return "\\b"; }
      / "f" { return "\\f"; }
      / "n" { return "\\n"; }
      / "r" { return "\\r"; }
      / "t" { return "\\t"; }
      / "u" digits:$([0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    ) { return seq; }

number
  = minus? int frac? exp? { return parseFloat(text()); }

int
  = "0"
  / [1-9] [0-9]*

frac
  = "." [0-9]+

exp
  = [eE] [+-]? [0-9]+

minus
  = "-"

ws = [ \\t\\n\\r]*
`;

// Compile once at module load
const parser = peggy.generate(grammar);

export function parse(input: string) {
    return parser.parse(input);
}
