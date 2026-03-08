// CSS specificity calculator per the W3C cascade specification.

import type { CssSelector, Specificity } from "./types.js";

function addSpecificity(a: Specificity, b: Specificity): Specificity {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Return the highest-specificity tuple from a list. */
function maxSpecificity(specs: Specificity[]): Specificity {
    let max: Specificity = [0, 0, 0];
    for (const s of specs) {
        if (s[0] > max[0] || (s[0] === max[0] && (s[1] > max[1] || (s[1] === max[1] && s[2] > max[2])))) {
            max = s;
        }
    }
    return max;
}

export function specificity(selector: CssSelector): Specificity {
    switch (selector.type) {
        case "id": return [1, 0, 0];
        case "class":
        case "pseudoClass":
        case "attribute": return [0, 1, 0];
        case "type":
        case "pseudoElement": return [0, 0, 1];
        case "universal": return [0, 0, 0];
        case "compound":
            return selector.parts.reduce<Specificity>((acc, s) => addSpecificity(acc, specificity(s)), [0, 0, 0]);
        case "complex":
            return addSpecificity(specificity(selector.left), specificity(selector.right));
        case "pseudoFunction": {
            const name = selector.name;
            // :where() contributes zero specificity
            if (name === "where") return [0, 0, 0];
            // :is(), :not(), :has() use their most-specific argument
            if (name === "is" || name === "not" || name === "has") {
                return maxSpecificity(selector.args.map(specificity));
            }
            // :nth-*() counts as a pseudo-class
            if (name === "nth-child" || name === "nth-last-child" || name === "nth-of-type" || name === "nth-last-of-type") {
                return [0, 1, 0];
            }
            return [0, 1, 0];
        }
    }
}
