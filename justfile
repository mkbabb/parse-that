# parse-that — parser combinator library (TypeScript + Rust)

# TypeScript targets
ts-build:
    cd typescript && npm run build

ts-test:
    cd typescript && npm test

ts-check:
    cd typescript && npx tsc --noEmit

ts-all: ts-check ts-test ts-build

# Rust targets
rs-clippy:
    cd rust && cargo clippy --workspace -- -D warnings

rs-test:
    cd rust && cargo test --workspace

rs-build:
    cd rust && cargo build --workspace

rs-all: rs-clippy rs-test rs-build

# Run everything
all: ts-all rs-all
