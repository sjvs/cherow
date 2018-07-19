import { ParserState } from '../types';
export declare const enum RegExpFlags {
    Empty = 0,
    Global = 1,
    IgnoreCase = 2,
    Multiline = 4,
    Unicode = 8,
    Sticky = 16,
    DotAll = 32
}
export declare const enum ClassRangesState {
    Empty = 0,
    IsTrailSurrogate = 1,
    IsSurrogateLead = 4,
    SeenUnicoderange = 256,
    InCharacterRange = 1024
}
export declare const enum RegexpState {
    InvalidClassEscape = 1,
    ValidClassEscape = 64,
    UnicodeMode = 1024,
    SloppyMode = 4096,
    OnlySloppy = 16384,
    Valid = 65536,
    Invalid = 262144,
    InvalidCharClassInSloppy = 16777216,
    Quantifier = 33554432,
    MissingDigits = 67108864,
    EndOfRegex = 134217728,
    InvalidCharClass = 1114112,
    InvalidCharClassRange = 1114113
}
export declare function validateQuantifierPrefix(parser: ParserState): boolean | number;
export declare function isFlagStart(code: number): boolean;
/**
 * Returns true if valid unicode continue
 *
 */
export declare function isValidUnicodeidcontinue(code: number): boolean;
/**
 * Adjust correct regexp validator state
 *
 * @param parser Parser object
 * @param code Code point
 */
export declare function setValidationState(prevState: RegexpState, currState: RegexpState): RegexpState;
/**
 * Adjust correct regexp validator state
 *
 * @param parser Parser object
 * @param flagState State returned by the regular expression flag
 * @param bodyState State returned after parsing the regex body
 */
export declare function setRegExpState(parser: ParserState, flagState: RegexpState, bodyState: RegexpState): RegexpState;
/**
 * Parse back reference index
 *
 * @see [Link](https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape)
 *
 * @param parser Parser object
 * @param code Code point
 */
export declare function parseBackReferenceIndex(parser: ParserState, code: number): RegexpState;
