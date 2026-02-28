// Zero-dep ANSI color utilities. Respects NO_COLOR env var and TTY detection.

const enabled =
    typeof process !== "undefined" &&
    process.stderr?.isTTY === true &&
    !process.env.NO_COLOR;

export const bold = (s: string) => (enabled ? `\x1b[1m${s}\x1b[22m` : s);
export const dim = (s: string) => (enabled ? `\x1b[2m${s}\x1b[22m` : s);
export const italic = (s: string) => (enabled ? `\x1b[3m${s}\x1b[23m` : s);
export const red = (s: string) => (enabled ? `\x1b[31m${s}\x1b[39m` : s);
export const green = (s: string) => (enabled ? `\x1b[32m${s}\x1b[39m` : s);
export const yellow = (s: string) => (enabled ? `\x1b[33m${s}\x1b[39m` : s);
export const cyan = (s: string) => (enabled ? `\x1b[36m${s}\x1b[39m` : s);
export const gray = (s: string) => (enabled ? `\x1b[90m${s}\x1b[39m` : s);
export const bgRed = (s: string) => (enabled ? `\x1b[41m${s}\x1b[49m` : s);
export const bgGreen = (s: string) => (enabled ? `\x1b[42m${s}\x1b[49m` : s);
