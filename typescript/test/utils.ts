/**
 * Inserts random whitespace between JSON tokens without corrupting string values.
 * Walks the input character-by-character, skipping over string literals, and
 * injects whitespace only at token boundaries (after : , [ ] { }).
 */
export const insertRandomWhitespace = (str: string, spaces: number = 12) => {
    const whitespaceChars = [" ", "\t", "\n"];
    const tokenBoundary = new Set([",", ":", "[", "]", "{", "}"]);
    const parts: string[] = [];
    let i = 0;

    while (i < str.length) {
        // Skip over string literals verbatim
        if (str[i] === '"') {
            const start = i;
            i++; // opening quote
            while (i < str.length) {
                if (str[i] === "\\") {
                    i += 2; // skip escape sequence
                } else if (str[i] === '"') {
                    i++; // closing quote
                    break;
                } else {
                    i++;
                }
            }
            parts.push(str.slice(start, i));
            continue;
        }

        // At a token boundary, emit the char then inject random whitespace
        if (tokenBoundary.has(str[i])) {
            parts.push(str[i]);
            i++;
            if (Math.random() > 0.3) {
                const ws = whitespaceChars[
                    Math.floor(Math.random() * whitespaceChars.length)
                ].repeat(1 + Math.floor(Math.random() * spaces));
                parts.push(ws);
            }
            continue;
        }

        // Normal character (digits, letters, whitespace outside strings)
        parts.push(str[i]);
        i++;
    }

    return parts.join("");
};

export const evaluateMathOperator = (operator: string, a: number, b: number): number => {
    switch (operator) {
        case "+":
            return a + b;
        case "-":
            return a - b;
        case "*":
            return a * b;
        case "/":
            return a / b;
        default:
            throw new Error(`Unknown operator: ${operator}`);
    }
};

export const reduceMathExpression = ([num, rest]: [number, [string, number][]]) => {
    return rest.reduce((acc, [operator, val]) => {
        return evaluateMathOperator(operator, acc, val);
    }, num);
};

export const generateMathExpression = (
    numberCount: number = 100,
    operators = ["+", "-", "*", "/"] as const
) => {
    const nums = Array.from({ length: numberCount }, () => Math.random() * 100).map(String);

    return Array.from({ length: numberCount }, () => {
        return nums[Math.floor(Math.random() * nums.length)];
    }).reduce((acc, expr) => {
        const operator = operators[Math.floor(Math.random() * operators.length)];
        return `${acc} ${operator} ${expr}`;
    });
};
