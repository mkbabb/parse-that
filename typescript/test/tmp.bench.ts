import { Parser, regex, ParserFunction, string, any } from "../src/parse";
import { test, expect, describe, it, bench } from "vitest";
import { parserPrint } from "../src/parse/debug";
import { ParserState } from "../src/parse/state";
import fs from "fs";

interface BaseInst<T extends string> {
    id: number;
    opcode: T;
    name?: string;
    gen?: number;
}

interface Char extends BaseInst<"char"> {
    parser: RegExp;
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
    const flags = r.flags.replace("y", "");
    const sticky = new RegExp(r.source, flags + "y");
    const fsm = new FSMParser();

    fsm.instructions.push({
        id: fsm.instructions.length,
        opcode: "char",
        parser: sticky,
    });

    return fsm;
};

type Thread = {
    pc: number;
    saved?: any;
};

class FSMParser {
    gen: number = 0;

    constructor(public instructions: Inst[] = []) {}

    shiftInst(inst: Inst[], offset: number = 0) {
        return inst.map((i) => {
            const inst = {
                ...i,
                id: i.id + offset,
            };

            if (inst?.x != null) {
                inst.x += offset;
            }
            if (inst?.y != null) {
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

    wrap(left: FSMParser, right?: FSMParser) {
        right ??= left;
        return left.then(this).then(right);
    }

    sepBy(sep: FSMParser) {
        return FSMAll(this, sep.opt()).many();
    }

    trimWhitespace() {
        return FSMAll(FSMRegex(/\s*/), this, FSMRegex(/\s*/));
    }

    save(fn: (x: any) => any = (x) => x, label: "save" | "map" = "save") {
        const save1 = {
            id: 0,
            opcode: label,
            pos: "start",
            fn,
        } as Save;

        const save2 = {
            id: this.instructions.length + 1,
            opcode: label,
            pos: "end",
            fn,
        } as Save;

        const instructions = [save1, ...this.shiftInst(this.instructions, 1), save2];
        return new FSMParser(instructions);
    }

    map(fn: (x: any) => any) {
        return this.save(fn, "map");
    }

    addThread(threadList: Thread[], thread: Thread, saved: any) {
        const { pc } = thread;
        const inst = this.instructions[pc];

        if (inst.gen === this.gen) {
            return;
        }

        inst.gen = this.gen;

        switch (inst.opcode) {
            default: {
                threadList.push(thread);
                break;
            }
            case "jmp": {
                this.addThread(threadList, { ...thread, pc: inst.x }, saved);
                break;
            }
            case "split": {
                this.addThread(threadList, { ...thread, pc: inst.y }, saved);
                this.addThread(threadList, { ...thread, pc: inst.x }, saved);
                break;
            }
            case "save": {
                // if (inst.pos === "start") {
                //     saved = thread.saved;
                //     this.addThread(threadList, { ...thread, pc: pc + 1, saved}, saved);
                // } else {

                this.addThread(threadList, { ...thread, pc: pc + 1 }, saved);
                break;
            }
        }
    }

    run(src: string) {
        let clist = [] as Thread[];
        let nlist = [] as Thread[];

        this.instructions.forEach((i) => (i.gen = 0));

        let i = 0;
        this.gen += 1;
        let matched = false;

        this.addThread(clist, { pc: 0 }, undefined);
        while (i <= src.length && clist.length > 0) {
            this.gen += 1;

            while (clist.length > 0) {
                const { pc, saved } = clist.pop();
                const inst = this.instructions[pc];

                switch (inst.opcode) {
                    case "char": {
                        if (i >= src.length) {
                            break;
                        }

                        const p = inst.parser;
                        p.lastIndex = i;
                        const match = src.match(p)?.[0];

                        if (match == null) {
                            break;
                        }

                        i += match.length;
                        this.addThread(nlist, { pc: pc + 1, saved: match }, saved);
                        break;
                    }

                    case "match": {
                        matched = true;
                        break;
                    }
                }
            }
            [clist, nlist] = [nlist, clist];
        }

        return matched && i === src.length;
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

    const line = FSMAll(token.save(), delim.opt()).many().trimWhitespace();
    const csv = line.many();
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

// const src = `"58","""This is a sentence with quotes"" and a\nnewline","31","45","This cell has no special characters","13","29","""This cell has quotes, but no\nnewlines""","""This cell has\na newline, but no quotes""","""This cell has both\na newline and ""quotes"" in it""",vi

// `;

const src = fs.readFileSync("data/active_charter_schools_report.csv", "utf8");

describe("FSM", () => {
    // it("should print vibes", () => {
    //     // A = "a"
    //     // B = "b" | "v"
    //     // P = ( A , B ) *

    //     const src = "taaaaat";

    //     const a = FSMRegex(/a/);
    //     const b = FSMRegex(/b/).or(FSMRegex(/v/));
    //     const fsm = a.many().wrap(FSMRegex(/t/));
    //     const t = fsm.done().run(src);
    //     console.log(t);

    //     // const fsm = a.then(b.opt()).wrap(FSMRegex(/\$/).many(), FSMRegex(/\$/).many());

    //     // const t = csvFSM().run(src);
    //     // console.log(t);
    //     // console.log("hey");
    // });

    bench(
        "FSM",
        () => {
            csvFSM().run(src);
        },
        {
            iterations: 10,
        }
    );

    bench(
        "Combinator",
        () => {
            const t = csvCombinator().parse(src);
        },
        {
            iterations: 10,
        }
    );
});
