use std::usize;

pub fn text_justify(sep_length: usize, doc_lengths: &Vec<usize>, max_width: usize) -> Vec<usize> {
    #[derive(Clone, Debug)]
    struct Score {
        badness: usize,
        j: usize,
    }

    let n = doc_lengths.len();
    let mut memo = vec![
        Score {
            badness: usize::MAX,
            j: n
        };
        n + 1
    ];
    memo[n] = Score { badness: 0, j: 0 };

    for i in (0..=n).rev() {
        let mut line_length = 0;

        for j in i..n {
            line_length += doc_lengths[j];
            if j > i {
                line_length += sep_length;
            }
            line_length = line_length.min(max_width);

            let badness = (max_width - line_length).pow(3);
            let next_score = memo[j + 1].clone();

            if badness + next_score.badness < memo[i].badness {
                memo[i] = Score {
                    badness: badness + next_score.badness,
                    j: j + 1,
                };
            }
            if line_length >= max_width {
                break;
            }
        }
    }

    (0..n)
        .scan(0, |i, _| {
            let j = memo[*i].j;
            *i = j;
            Some(j)
        })
        .collect::<Vec<_>>()
}
