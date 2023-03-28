#[cfg(test)]
mod tests {
    use pretty::{concat, Doc, Pretty, Printer};

    use std::collections::HashMap;

    #[derive(Pretty)]
    #[pretty(verbose)]
    pub enum HeyEnum<'a> {
        There(&'a str),
        #[pretty(rename = "my vibes")]
        A,
        B(regex::Regex),
    }

    #[derive(Pretty)]
    #[pretty(verbose)]
    pub struct InnerStrumct<'a> {
        x: &'a str,
        y: HeyEnum<'a>,
        z: (usize, usize),
    }

    #[derive(Pretty)]
    #[pretty(verbose)]
    pub struct Strumct<'a> {
        a: Vec<usize>,
        b: HashMap<String, HeyEnum<'a>>,
        c: InnerStrumct<'a>,

        #[pretty(ignore)]
        no: usize,
    }

    #[test]
    fn test_enum() {
        let printer = Printer::default();

        let s = HeyEnum::There("there");

        let pretty = printer.pretty(s);
        println!("{}", pretty);
    }

    #[test]
    fn test_simple_struct() {
        let printer = Printer::default();

        let s = InnerStrumct {
            x: "hello",
            y: HeyEnum::There("there"),
            z: (1, 2),
        };

        let pretty = printer.pretty(s);
        println!("{}", pretty);
    }

    #[test]
    fn test_complex_struct() {
        let printer = Printer::default();

        let a = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let mut b = HashMap::new();
        b.insert("hello".to_string(), HeyEnum::There("there"));
        b.insert("a".to_string(), HeyEnum::A);
        b.insert(
            "b".to_string(),
            HeyEnum::B(regex::Regex::new(".*").unwrap()),
        );

        let s = Strumct {
            a,
            b,
            c: InnerStrumct {
                x: "hello",
                y: HeyEnum::There("there"),
                z: (1, 2),
            },

            no: 0,
        };

        let pretty = printer.pretty(s);
        println!("{}", pretty);
    }
}
