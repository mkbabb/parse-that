export class Ok<T> {
    constructor(public value: T) {}

    isOk() {
        return true;
    }

    isErr() {
        return false;
    }
}

export class Err<E = undefined> {
    constructor(public value: E) {}

    isOk() {
        return false;
    }

    isErr() {
        return true;
    }
}

export type Result<T, E = undefined> = Ok<T> | Err<E>;
