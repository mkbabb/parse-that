use parse_that::parse::parsers::csv::csv_parser;

#[cfg(test)]
mod tests {
    use std::fs;

    use super::*;

    #[test]
    fn test_csv() {
        let csv = r#"
            "a","b","c"
            "d","e","f"
            "g","h","i"
        "#;

        let rows = csv_parser().parse(csv).unwrap();

        assert_eq!(rows.len(), 3);
        assert_eq!(rows[0].len(), 3);
        assert_eq!(rows[1].len(), 3);
        assert_eq!(rows[2].len(), 3);

        assert_eq!(rows[0][0], "a");
        assert_eq!(rows[0][1], "b");
        assert_eq!(rows[0][2], "c");

        assert_eq!(rows[1][0], "d");
        assert_eq!(rows[1][1], "e");
        assert_eq!(rows[1][2], "f");

        assert_eq!(rows[2][0], "g");
        assert_eq!(rows[2][1], "h");
        assert_eq!(rows[2][2], "i");
    }

    #[test]
    fn test_csv_file() {
        let csv_file_path = "../data/csv/active_charter_schools_report.csv";
        let csv_string = fs::read_to_string(csv_file_path).unwrap();

        let rows = csv_parser().parse(&csv_string).unwrap();

        assert_eq!(rows.len(), 62928);
    }
}
