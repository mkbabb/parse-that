use std::collections::VecDeque;

#[derive(Debug, Clone)]
pub enum Opcode {
    Regex(regex::Regex),
    Char(String),
    Jmp(usize),
    Split(usize, usize),
    Match,
    Save(usize, SavePos),
}

#[derive(Debug, Clone)]
pub enum SavePos {
    Start(usize),
    End(usize),
}

#[derive(Debug, Clone)]
pub struct Instruction {
    id: usize,
    opcode: Opcode,
    gen: usize,
}

type Thread = (usize, Option<String>);

#[derive(Debug, Clone)]
pub struct FSMParser {
    instructions: Vec<Instruction>,
    gen: usize,
}

impl FSMParser {
    pub fn new() -> Self {
        FSMParser {
            instructions: vec![],
            gen: 0,
        }
    }

    pub fn shift_inst(&self, inst: Vec<Instruction>, offset: usize) -> Vec<Instruction> {
        inst.iter()
            .map(|i| {
                let mut new_inst = i.clone();
                new_inst.id += offset;

                match new_inst.opcode {
                    Opcode::Jmp(ref mut x) | Opcode::Save(ref mut x, _) => {
                        *x += offset;
                    }
                    Opcode::Split(ref mut x, ref mut y) => {
                        *x += offset;
                        *y += offset;
                    }
                    _ => {}
                }

                new_inst
            })
            .collect()
    }

    pub fn char(c: &str) -> FSMParser {
        let inst = Instruction {
            id: 0,
            opcode: Opcode::Char(c.to_string()),
            gen: 0,
        };

        FSMParser {
            instructions: vec![inst],
            gen: 0,
        }
    }

    pub fn regex(r: &str) -> FSMParser {
        let inst = Instruction {
            id: 0,
            opcode: Opcode::Regex(regex::Regex::new(r).unwrap()),
            gen: 0,
        };

        FSMParser {
            instructions: vec![inst],
            gen: 0,
        }
    }

    pub fn then(&self, other: FSMParser) -> FSMParser {
        let inst = [
            self.instructions.clone(),
            self.shift_inst(other.instructions, self.instructions.len()),
        ]
        .concat();

        FSMParser {
            instructions: inst,
            gen: 0,
        }
    }

    pub fn or(&self, other: FSMParser) -> FSMParser {
        let split = Instruction {
            id: 0,
            opcode: Opcode::Split(1, self.instructions.len() + 2),
            gen: 0,
        };
        let jmp = Instruction {
            id: self.instructions.len() + 1,
            opcode: Opcode::Jmp(self.instructions.len() + other.instructions.len() + 2),
            gen: 0,
        };

        let instructions = [
            vec![split],
            self.shift_inst(self.instructions.clone(), 1),
            vec![jmp],
            self.shift_inst(other.instructions, self.instructions.len() + 2),
        ]
        .concat();

        FSMParser {
            instructions,
            gen: 0,
        }
    }

    pub fn wrap(&self, left: FSMParser, right: FSMParser) -> FSMParser {
        return self.then(right).then(left);
    }

    pub fn sep_by(self, delim: FSMParser) -> FSMParser {
        return self.then(delim.then(self.clone()).many(0));
    }

    pub fn trim_whitespace(&self) -> FSMParser {
        let ws = FSMParser::regex(r"\s*");
        return self.wrap(ws.clone(), ws);
    }

    pub fn many(&self, lower: usize) -> FSMParser {
        let split = Instruction {
            id: 0,
            opcode: Opcode::Split(1, self.instructions.len() + 2),
            gen: 0,
        };
        let jmp = Instruction {
            id: self.instructions.len() + 1,
            opcode: Opcode::Jmp(0),
            gen: 0,
        };

        let mut tmp: Vec<Instruction> = vec![split];
        for _ in 0..lower + 1 {
            tmp.append(&mut self.shift_inst(self.instructions.clone(), tmp.len()));
        }
        tmp.push(jmp);
        let instructions = tmp;

        FSMParser {
            instructions,
            gen: 0,
        }
    }

    pub fn done(&self) -> FSMParser {
        let mut inst = self.instructions.clone();
        inst.push(Instruction {
            id: inst.len(),
            opcode: Opcode::Match,
            gen: 0,
        });

        FSMParser {
            instructions: inst,
            gen: 0,
        }
    }

    pub fn add_thread(
        &mut self,
        thread_list: &mut VecDeque<Thread>,
        thread: Thread,
        saved: Option<String>,
    ) {
        let (pc, _) = thread;
        let inst = &mut self.instructions[pc];

        if inst.gen == self.gen {
            return;
        }

        inst.gen = self.gen;

        match inst.opcode {
            Opcode::Char(_) => {
                thread_list.push_back(thread);
            }
            Opcode::Jmp(x) => {
                self.add_thread(thread_list, (x, thread.1), saved);
            }
            Opcode::Split(x, y) => {
                self.add_thread(thread_list, (y, thread.1.clone()), saved.clone());
                self.add_thread(thread_list, (x, thread.1), saved);
            }
            Opcode::Save(x, ref pos) => {
                self.add_thread(thread_list, (x, saved), thread.1);
            }
            _ => {
                thread_list.push_back(thread);
            }
        }
    }

    pub fn run(&mut self, src: &str) -> bool {
        let mut clist = VecDeque::new();
        let mut nlist = VecDeque::new();

        self.instructions.iter_mut().for_each(|i| i.gen = 0);

        let mut i = 0;
        self.gen += 1;
        let mut matched = false;

        self.add_thread(&mut clist, (0, None), None);

        while !clist.is_empty() {
            self.gen += 1;

            while let Some((pc, saved)) = clist.pop_back() {
                let inst = &self.instructions[pc];

                match inst.opcode {
                    Opcode::Regex(ref re) => {
                        if i >= src.len() {
                            continue;
                        }

                        let slc = &src[i..];

                        if let Some(m) = re.find(slc) {
                            if m.start() == 0 {
                                i += m.end();
                                self.add_thread(
                                    &mut nlist,
                                    (pc + 1, saved),
                                    None,
                                );
                            }
                        }
                    }
                    Opcode::Match => {
                        matched = true;
                    }
                    _ => {
                        unreachable!()
                    }
                }
            }
            std::mem::swap(&mut clist, &mut nlist);
        }

        matched && i == src.len()
    }
}

fn fsm_all(parsers: Vec<FSMParser>) -> FSMParser {
    parsers
        .into_iter()
        .fold(FSMParser::new(), |acc, parser| acc.then(parser))
}

fn fsm_any(parsers: Vec<FSMParser>) -> FSMParser {
    parsers
        .into_iter()
        .fold(FSMParser::new(), |acc, parser| acc.or(parser))
}
