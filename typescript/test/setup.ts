// Ensure CWD is always typescript/ regardless of where vitest is invoked from.
process.chdir(new URL("..", import.meta.url).pathname);
