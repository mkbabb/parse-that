use std::collections::HashMap;

pub fn text_justify(sep_length: usize, doc_lengths: &Vec<usize>, max_width: usize) -> Vec<usize> {
    struct Score {
        badness: usize,
        j: usize,
    }

    let n = doc_lengths.len();
    let mut dp = HashMap::new();

    dp.insert(n, Score { badness: 0, j: 0 });

    for i in (0..n).rev() {
        let mut best = Score {
            badness: usize::MAX,
            j: n,
        };
        let mut line_length = 0;

        for j in (i + 1)..=n {
            line_length += doc_lengths[j - 1] + sep_length;
            if line_length > max_width {
                break;
            }

            let badness = (max_width - line_length + sep_length).pow(3) + dp[&j].badness;
            if badness < best.badness {
                best = Score { badness, j };
            }
        }

        dp.insert(i, best);
    }

    let mut breaks = Vec::new();
    let mut i = 0;
    while i < n {
        let j = dp[&i].j;
        breaks.push(j);
        i = j;
    }
    breaks.pop();

    breaks
}
