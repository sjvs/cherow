import { Parser } from '../types';
import { Context } from '../common';
export declare const enum RegExpState {
    NoError = 0,
    AlwaysBad = 1,
    AlwaysGood = 2,
    GoodSansUFlag = 3,
    GoodWithUFlag = 4,
    CharClassBad = 5,
    CharClassBadRange = 6,
    CharClassBadN = 7,
    GoodEscape = 8,
    BadEscape = 9,
}
export declare function scanRegExp(parser: Parser, context: Context): void;
export declare function scanRegExpBody(parser: Parser, context: Context, next: number, groupLevel: number, state: RegExpState): any;
