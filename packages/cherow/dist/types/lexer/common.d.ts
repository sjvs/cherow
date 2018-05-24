import { Parser } from '../types';
import { Chars } from '../chars';
export declare function consumeOpt(parser: Parser, code: number): boolean;
/**
* Consumes line feed
*
* @param parser Parser object
* @param state  Scanner state
*/
export declare function consumeLineFeed(parser: Parser, lastIsCR: boolean): void;
/**
* Advance to new line
*
* @param parser Parser object
*/
export declare function advanceNewline(parser: Parser, ch: number): void;
export declare function skipToNewline(parser: Parser): boolean;
export declare function readNext(parser: Parser, ch: any): number;
export declare function nextUnicodeChar(parser: Parser): number;
export declare function isHex(code: number): boolean;
export declare function toHex(code: number): number;
export declare const fromCodePoint: (code: Chars) => string;
