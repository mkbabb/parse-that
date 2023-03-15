use std::marker::PhantomData;

#[derive(Debug, Clone, Copy)]
pub struct ParserState<'a> {
    pub src: &'a str,
    pub offset: usize,

    pub count: usize,
}

impl<'a> ParserState<'a> {
    pub fn new(src: &'a str) -> ParserState<'a> {
        ParserState {
            src,
            offset: 0,
            count: 0,
        }
    }

    pub fn from(&self, offset: usize, count: usize) -> ParserState<'a> {
        ParserState {
            src: self.src,
            offset: self.offset + offset,
            count: self.count + count,
        }
    }

    pub fn with_count(&self, count: usize) -> ParserState<'a> {
        ParserState {
            src: self.src,
            offset: self.offset,
            count: self.count + count,
        }
    }

    pub fn with_offset(&self, offset: usize) -> ParserState<'a> {
        ParserState {
            src: self.src,
            offset: self.offset + offset,
            count: self.count,
        }
    }
}

type ParserResult<'a, Output> = Result<(ParserState<'a>, Option<Output>), ()>;

type ParserFunction<'a, Output> = Box<dyn Fn(&ParserState<'a>) -> ParserResult<'a, Output>>;

pub struct ParserNFA<'a, Output> {
    pub states: Vec<NFAState<'a, Output>>,
}

pub enum NFAState<'a, Output> {
    Call(ParserFunction<'a, Output>),
    Jmp(usize),
    JmpIfOk(usize),
    JmpIfErr(usize),
    Return,
}

impl<'a, Output> ParserNFA<'a, Output> {
    pub fn new() -> Self {
        ParserNFA { states: vec![] }
    }

    pub fn then(self, next: Self) -> Self {
        let mut states = self.states;
        states.push(NFAState::JmpIfOk(states.len() + 1)); // Jump to the next parser if the current parser succeeds
        states.extend(next.states);

        ParserNFA { states }
    }

    pub fn or(self, other: Self) -> Self {
        let mut states = self.states;
        states.push(NFAState::JmpIfErr(states.len() + 1)); // Jump to the other parser if the current parser fails
        states.extend(other.states);

        ParserNFA { states }
    }

    pub fn many(self, lower: Option<usize>, upper: Option<usize>) -> Self {
        let mut states = vec![
            NFAState::Call(Box::new(move |state: &ParserState<'a>| {
                if state.count < upper.unwrap_or(std::usize::MAX) {
                    Ok((state.with_count(1), None))
                } else {
                    Err(())
                }
            })),
            NFAState::JmpIfErr(4), // If we've exceeded the upper limit, jump to the return state
        ];
        states.extend(self.states);
        states.push(NFAState::JmpIfOk(1)); // If the parser succeeds, go back and try again
        states.push(NFAState::Call(Box::new(move |state: &ParserState<'a>| {
            if state.count >= lower.unwrap_or(0) {
                Ok((state.with_count(0), None))
            } else {
                Err(())
            }
        })));

        ParserNFA { states }
    }

    pub fn opt(self) -> Self {
        let mut states = self.states;
        states.push(NFAState::JmpIfErr(states.len() + 1)); // If the current parser fails, jump to the return state with a None value

        ParserNFA { states }
    }

    pub fn done(self) -> Self {
        let mut states = self.states;
        states.push(NFAState::Return);

        ParserNFA { states }
    }
}

pub fn regex<'a>(regex: &'a str) -> ParserNFA<&str> {
    let mut states = vec![];
    let re = regex::Regex::new(regex).unwrap();

    states.push(NFAState::Call(Box::new(move |state: &ParserState<'a>| {
        let slc = &state.src[state.offset..];

        if let Some(mat) = re.find(slc) {
            if mat.start() == 0 {
                return Ok((state.from(mat.end(), 1), None));
            }
        }
        Err(())
    })));

    ParserNFA { states }
}

pub fn run_machine<'a, Output>(
    nfa: &ParserNFA<'a, Output>,
    state: ParserState<'a>,
) -> ParserResult<'a, Output> {
    let mut current_state = state;

    let mut is_error = false;
    let mut pc = 0;

    while pc < nfa.states.len() {
        match &nfa.states[pc] {
            NFAState::Call(parser_fn) => match parser_fn(&current_state) {
                Ok((next_state, value)) => {
                    current_state = next_state;
                    is_error = false;
                    pc += 1;
                }
                Err(_) => {
                    is_error = false;

                    let mut backtrack_pc = pc;
                    while backtrack_pc > 0 {
                        backtrack_pc -= 1;
                        match &nfa.states[backtrack_pc] {
                            NFAState::Call(_) => {
                                pc = backtrack_pc;
                                break;
                            }
                            NFAState::JmpIfOk(target) => {
                                if *target == pc {
                                    pc = backtrack_pc;
                                    break;
                                }
                            }
                            NFAState::JmpIfErr(target) => {
                                if *target == pc {
                                    pc = backtrack_pc;
                                    break;
                                }
                            }
                            _ => {}
                        }
                    }
                }
            },
            NFAState::Jmp(target) => {
                pc = *target;
            }
            NFAState::JmpIfOk(target) => {
                if !is_error{
                    pc = *target;
                } else {
                    pc += 1;
                }
            }
            NFAState::JmpIfErr(target) => {
                if is_error {
                    pc = *target;
                } else {
                    pc += 1;
                }
            }
            NFAState::Return => {
                break;
            }
        }
    }

    Ok((current_state, None))
}
