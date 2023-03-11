// use wasm_bindgen::prelude::*;
// pub mod parse_that;
// use js_sys::*;
// use parse_that::*;

// #[wasm_bindgen]
// pub struct Parserge {
//     parser: Parser<'static, JsValue>,
// }

// #[wasm_bindgen]
// impl Parserge {
//     pub fn parse(&self, src: &str) -> JsValue {
//         let result = self.parser.parse(src);
//         result.unwrap()
//     }

//     pub fn regex(r: &str) -> Parserge {
//         let parser = regex(r).map(|x| JsValue::from_str(x));
//         Parserge { parser }
//     }
// }

// #[wasm_bindgen]
// extern "C" {
//     pub fn alert(s: &str);
// }

// #[wasm_bindgen]
// pub fn js_regex(name: &str) {
//     let p = regex(name);

//     // let a = Parserge::new

//     alert(&format!("Hello, {}!", name));
// }
