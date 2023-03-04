import { ParserState } from "./state";
import { Parser } from ".";
import { Doc } from "prettier";
export declare function prettierPrint(doc: Doc): string;
export declare const summarizeLine: (line: string, maxLength?: number) => string;
export declare function addCursor(state: ParserState<any>, cursor?: string, error?: boolean): string;
export declare function parserPrint(parser: Parser<any>): any;
export declare function parserDebug<T>(parser: Parser<T>, name?: string, recursivePrint?: boolean, logger?: (...s: any[]) => void): Parser<T>;
