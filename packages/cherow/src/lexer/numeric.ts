import { Parser } from '../types';
import { Chars } from '../chars';
import { Token, tokenDesc } from '../token';
import { Context } from '../common';

// Note: Diffeent corde paths for decimal and floating numbers to speed things up.

/**
 *  Scans numeric literal
 * 
 * @param parser Parser object
 * @param context Context masks
 */
export function scanNumeric(parser: Parser, context: Context): Token {
    const { index } = parser;
    const ch = skipDigits(parser);
    if (ch === Chars.LowerE || ch === Chars.UpperE) {
        parser.index++; parser.column++;
        scanSignedInteger(parser);
    }
    parser.tokenValue = parseInt(parser.source.slice(index - 1, parser.index), 10);
    return Token.Decimal;
}

/**
 * Scans floating number
 * 
 * @param parser Parser object
 * @param context Context masks
 */
export function parseFloatingNumber(parser: Parser, context: Context): Token {
    const { index } = parser;
    const ch = skipDigits(parser);
    // scan exponent
    if (ch === Chars.LowerE || ch === Chars.UpperE) {
        parser.index++; parser.column++;
        scanSignedInteger(parser);
    }

    parser.tokenValue = parseFloat(parser.source.slice(index, parser.index));
    return Token.Decimal;
}

/**
 * Skips digits
 * 
 * @param parser Parser object
 */
function skipDigits(parser: Parser): number {
    let ch = parser.source.charCodeAt(parser.index);
    while (ch >= Chars.Zero && ch <= Chars.Nine) {
        ch = parser.source.charCodeAt(parser.index);
        parser.column++; parser.index++;
    }
    return ch;
}

/**
 * Scans signed integer
 * 
 * @param parser Parser object
 */
function scanSignedInteger(parser: Parser): void {
    let ch = parser.source.charCodeAt(parser.index);
    if (ch === Chars.Plus || ch === Chars.Hyphen) {
        parser.index++;
        parser.column++;
        ch = parser.source.charCodeAt(parser.index);
    }
    skipDigits(parser);
}