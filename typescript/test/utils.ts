export const insertRandomWhitespace = (str: string, spaces: number = 12) => {
    const whitespaceChars = [" ", "\t", "\n"];

    return str
        .split(" ")
        .map((word) => {
            if (Math.random() > 0.5) {
                return word;
            } else {
                const ws = whitespaceChars[
                    Math.floor(Math.random() * whitespaceChars.length)
                ].repeat(Math.floor(Math.random() * spaces));

                return ws + word + ws;
            }
        })
        .join("");
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
