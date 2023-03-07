import { Parser, regex, ParserFunction, string, any } from "../src/parse";
import { test, expect, describe, it, bench } from "vitest";
import { parserPrint } from "../src/parse/debug";
import { ParserState } from "../src/parse/state";
import fs from "fs";

interface BaseInst<T extends string> {
    id: number;
    opcode: T;
    name?: string;
}

interface Char extends BaseInst<"char"> {
    parser: ParserFunction<string>;
}

interface Jmp extends BaseInst<"jmp"> {
    x: number;
}

interface Split extends BaseInst<"split"> {
    x: number;
    y: number;
}

interface Match extends BaseInst<"match"> {}

interface Save extends BaseInst<"save" | "map"> {
    x: number;
    pos: "start" | "end";
    fn?: (state: any) => any;
}

type Inst = Char | Jmp | Split | Match | Save;

const FSMRegex = (r: RegExp) => {
    const fsm = new FSMParser();
    fsm.instructions.push({
        id: fsm.instructions.length,
        opcode: "char",
        parser: regex(r).parser,
    });
    return fsm;
};

class FSMParser {
    constructor(public instructions: Inst[] = []) {}

    shiftInst(inst: Inst[], offset: number = 0) {
        return inst.map((i) => {
            const inst = {
                ...i,
                id: i.id + offset,
            };

            if (inst?.x) {
                inst.x += offset;
            }
            if (inst?.y) {
                inst.y += offset;
            }

            return inst;
        }) as Inst[];
    }

    then(other: FSMParser) {
        const inst = [
            ...this.instructions,
            ...this.shiftInst(other.instructions, this.instructions.length),
        ];

        return new FSMParser(inst);
    }

    or(other: FSMParser) {
        const split = {
            name: "or",
            id: 0,
            opcode: "split",
            x: 1,
            y: this.instructions.length + 2,
        } as Split;
        const jmp = {
            id: this.instructions.length + 1,
            opcode: "jmp",
            x: this.instructions.length + other.instructions.length + 2,
        } as Jmp;

        const instructions = [
            split,
            ...this.shiftInst(this.instructions, 1),
            jmp,
            ...this.shiftInst(other.instructions, this.instructions.length + 2),
        ];

        return new FSMParser(instructions);
    }

    many(lower: number = 0, upper: number = Infinity) {
        const split = {
            name: "many",
            id: 0,
            opcode: "split",
            x: 1,
            y: this.instructions.length + 2,
        } as Split;
        const jmp = {
            id: this.instructions.length + 1,
            opcode: "jmp",
            x: 0,
        } as Jmp;

        const tmp: Inst[] = [split];
        for (let i = 0; i < lower + 1; i++) {
            tmp.push(...this.shiftInst(this.instructions, tmp.length));
        }
        tmp.push(jmp);
        const instructions = tmp;

        return new FSMParser(instructions);
    }

    opt() {
        const split = {
            name: "opt",
            id: 0,
            opcode: "split",
            x: 1,
            y: this.instructions.length + 1,
        } as Split;

        const instructions = [split, ...this.shiftInst(this.instructions, 1)];
        return new FSMParser(instructions);
    }

    done() {
        const instructions = [...this.instructions];
        instructions.push({
            id: this.instructions.length,
            opcode: "match",
        });
        return new FSMParser(instructions);
    }

    wrap(left: FSMParser, right: FSMParser) {
        return left.then(this).then(right);
    }

    sepBy(sep: FSMParser) {
        return FSMAll(this, sep.opt()).many();
    }

    trimWhitespace() {
        return FSMAll(
            FSMRegex(/\s*/).opt(),
            this,
            FSMRegex(/\s*/).opt()
        );
    }

    save(fn: (x: any) => any = (x) => x, label: "save" | "map" = "save") {
        const save1 = {
            id: 0,
            opcode: label,
            x: this.instructions.length,
            pos: "start",
            fn,
        } as Save;

        const save2 = {
            id: this.instructions.length + 1,
            opcode: label,
            x: this.instructions.length + 2,
            pos: "end",
            fn,
        } as Save;

        const instructions = [save1, ...this.shiftInst(this.instructions, 1), save2];
        return new FSMParser(instructions);
    }

    map(fn: (x: any) => any) {
        return this.save(fn, "map");
    }

    run(src: string) {
        let ti = 1;

        type State = {
            pc: number;
            sp: ParserState<string>;
            saved?: any[];
        };

        const states: State[] = [{ pc: 0, sp: new ParserState(src), saved: [] }];

        while (ti > 0 && ti < 100) {
            ti -= 1;

            let state = states[ti];
            let dead = false;

            while (!dead) {
                const { pc, sp } = state;
                const inst = this.instructions[pc];
                const { opcode } = inst;

                switch (opcode) {
                    case "char": {
                        const { parser } = inst;
                        const newState = parser(sp);

                        if (newState.isError) {
                            dead = true;
                            break;
                        }
                        state = {
                            pc: pc + 1,
                            sp: newState,
                        };
                        continue;
                    }

                    case "jmp": {
                        const { x } = inst;
                        state = { pc: x, sp };
                        continue;
                    }

                    case "split": {
                        const { x, y } = inst;
                        state = { pc: x, sp };

                        if (
                            !states.some((s) => s.pc === y && s.sp.offset === sp.offset)
                        ) {
                            states[ti] = { pc: y, sp };
                            ti += 1;
                        }
                        continue;
                    }

                    case "save":
                    case "map": {
                        const { x, fn, pos } = inst;
                        if (pos === "end") {
                            state.saved = [fn(state.saved)];
                        } else {
                            state.saved = [];
                        }
                        state = { pc: x, sp };
                        continue;
                    }

                    case "match": {
                        const t = sp.offset >= src.length;
                        console.log(t);
                        return t
                    }
                }
            }
        }
    }
}

function FSMAll(...parsers: FSMParser[]) {
    return parsers.reduce((acc, parser) => acc.then(parser));
}

function FSMAny(...parsers: FSMParser[]) {
    return parsers.reduce((acc, parser) => acc.or(parser));
}

const csvFSM = () => {
    const delim = FSMRegex(/,/).trimWhitespace();
    const doubleQuotes = FSMRegex(/\"/);
    const singleQuotes = FSMRegex(/\'/);

    const token = FSMAny(
        FSMRegex(/[^"]*/).wrap(doubleQuotes, doubleQuotes),
        FSMRegex(/[^']*/).wrap(singleQuotes, singleQuotes),
        FSMRegex(/[^,]*/)
    );

    const line = FSMAll(token.trimWhitespace(), delim.opt()).many();
    const csv = line.trimWhitespace().many();
    return csv.done();
};

const csvCombinator = () => {
    const delim = string(",").trim();
    const doubleQuotes = string('"');
    const singleQuotes = string("'");

    const token = any(
        regex(/[^"]*/).wrap(doubleQuotes, doubleQuotes),
        regex(/[^']*/).wrap(singleQuotes, singleQuotes),
        regex(/[^,]*/)
    );

    const line = token.sepBy(delim).trim();
    const csv = line.many();
    return csv;
};

const src = `"58","""This is a sentence with quotes"" and a\nnewline","31","45","This cell has no special characters","13","29","""This cell has quotes, but no\nnewlines""","""This cell has\na newline, but no quotes""","""This cell has both\na newline and ""quotes"" in it""",vi
`;

describe("FSM", () => {
    it("should print vibes", () => {
        // A = "a"
        // B = "b" | "v"
        // P = ( A , B ) *

        // const src = "$$$aaaaab$$$";

        // const a = FSMRegex(/a/).many();
        // const b = FSMRegex(/b/).or(FSMRegex(/v/));

        // const fsm = a.then(b.opt()).wrap(FSMRegex(/\$/).many(), FSMRegex(/\$/).many());

        const t = csvFSM().run(src);
        console.log(t);
        console.log("hey");
    });

    // bench(
    //     "FSM",
    //     () => {
    //         csvFSM().run(src);
    //     },
    //     {
    //         iterations: 1,
    //     }
    // );

    // bench(
    //     "Combinator",
    //     () => {
    //         csvCombinator().parse(src);
    //     },
    //     {
    //         iterations: 1,
    //     }
    // );
});
