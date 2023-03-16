use std::collections::HashMap;

pub fn text_justify(sep_length: usize, doc_lengths: &Vec<usize>, max_width: usize) -> Vec<usize> {
    #[derive(Clone, Debug)]
    struct Score {
        badness: usize,
        j: usize,
    }

    fn justify_recursive<'a>(
        i: usize,
        n: usize,
        sep_length: usize,
        max_width: usize,
        doc_lengths: &'a Vec<usize>,
        memo: &mut HashMap<usize, Score>,
    ) -> Score {
        if let Some(score) = memo.get(&i) {
            return score.clone();
        }
        if i == n {
            return Score { badness: 0, j: 0 };
        }
        let mut best = Score {
            badness: usize::MAX,
            j: n,
        };

        let mut line_length = 0;

        for j in (i + 1)..n {
            if j < n - 1 {
                line_length += sep_length;
            }

            line_length += doc_lengths[j];
            line_length = line_length.min(max_width);

            let badness = (max_width - line_length).pow(3);
            let next_score = justify_recursive(j, n, sep_length, max_width, doc_lengths, memo);

            if badness + next_score.badness < best.badness {
                best = Score { badness, j: j + 1 };
            }
        }

        memo.insert(i, best.clone());
        best
    }

    let n = doc_lengths.len();
    let mut memo = HashMap::new();

    let mut breaks = Vec::new();
    let mut i = 0;
    while i < n {
        let j = justify_recursive(i, n, sep_length, max_width, doc_lengths, &mut memo).j;
        breaks.push(j);
        i = j;
    }
    breaks.pop();

    breaks
}
