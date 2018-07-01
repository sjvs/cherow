import { State } from '../types';
import { Token } from '../token';
import { Context, Flags } from '../common';
import { Chars } from '../chars';
import { nextChar, consume, toHex } from './common';
import { isValidIdentifierStart } from '../unicode';
import { Errors, report } from '../errors';

// lookup table
export const parseLeadingZeroTable: Array < Function > = [];

// binary integer. see [https://tc39.github.io/ecma262/#prod-BinaryIntegerLiteral)
parseLeadingZeroTable[Chars.LowerB] = parseLeadingZeroTable[Chars.UpperB] = (state: State, context: Context) => scanOctalOrBinaryDigits(state, context, 2);
// octal integer. see [https://tc39.github.io/ecma262/#prod-OctalIntegerLiteral)
parseLeadingZeroTable[Chars.LowerO] = parseLeadingZeroTable[Chars.UpperO] = (state: State, context: Context) => scanOctalOrBinaryDigits(state, context, 8);
// hex integer. see [https://tc39.github.io/ecma262/#prod-HexIntegerLiteral)
parseLeadingZeroTable[Chars.LowerX] = parseLeadingZeroTable[Chars.UpperX] = scanHexDigits;

// scan implicit oct
parseLeadingZeroTable.fill(scanImplicitOctalDigits, Chars.Zero, Chars.Seven + 1);
// non octal. see [https://tc39.github.io/ecma262/#prod-annexB-NonOctalDigit]
parseLeadingZeroTable[Chars.Eight] = parseLeadingZeroTable[Chars.Nine] = (state: State, context: Context) => context & Context.Strict ? report(state, Errors.Unexpected) : scanNumeric(state, context, true);

/**
 *  Scans numeric and decimal literal literal
 *
 * @see [https://tc39.github.io/ecma262/#prod-DecimalLiteral)
 * @see [https://tc39.github.io/ecma262/#prod-NumericLiteral)
 *
 * @param state state object
 * @param context Context masks
 */
export function scanNumeric(state: State, context: Context, isFloat: boolean = false): Token {

    if (isFloat) {
        state.tokenValue = 0;
    } else {
        // Most number values fit into 4 bytes, but for long numbers
        // we would need a workaround...
        const maximumDigits = 10;
        let digit = maximumDigits - 1;
        state.tokenValue = state.nextChar - Chars.Zero;
        while (digit >= 0 && nextChar(state) <= Chars.Nine && state.nextChar >= Chars.Zero) {
            state.tokenValue = state.tokenValue * 10 + state.nextChar - Chars.Zero;
            --digit;
        }

        if (digit >= 0 && state.nextChar !== Chars.Period && (state.index >= state.length || !isValidIdentifierStart(state.nextChar))) {
            return Token.NumericLiteral;
        }
    }

    if (isFloat || state.nextChar === Chars.Period) {
        if (!isFloat) nextChar(state);
        while (nextChar(state) <= Chars.Nine && state.nextChar >= Chars.Zero) {}
    }
    let isBigInt = false;
    if (state.nextChar === Chars.LowerN) {
        if (isFloat) report(state, Errors.Unexpected);
        isBigInt = true;
        nextChar(state);
    }

    if (state.nextChar === Chars.UpperE || state.nextChar === Chars.LowerE) {
        nextChar(state);
        if (state.nextChar === Chars.Plus || state.nextChar === Chars.Hyphen) {
            nextChar(state);
        }

        // first digit is mandatory
        if (!(state.nextChar >= Chars.Zero && state.nextChar <= Chars.Nine)) {
            report(state, Errors.Unexpected);
        }

        while (nextChar(state) <= Chars.Nine && state.nextChar >= Chars.Zero) {}
    }
    if (state.index < state.length && isValidIdentifierStart(state.nextChar)) report(state, Errors.Unexpected);
    if (context & Context.OptionsRaw) state.tokenRaw = state.source.slice(state.startIndex, state.index);
    state.tokenValue = parseFloat(state.source.slice(state.startIndex, state.index));
    return isBigInt ? Token.BigInt : Token.NumericLiteral;
}

/**
 * Scans implicit octals
 *
 * @see [https://tc39.github.io/ecma262/#sec-additional-syntax-numeric-literals)
 *
 * @param state state object
 * @param context Context masks
 */
export function scanImplicitOctalDigits(state: State, context: Context): Token {
    let { index, column } = state;
    const start = index;
    if (context & Context.Strict) report(state, Errors.Unexpected);
    let next = state.source.charCodeAt(state.index);
    state.tokenValue = 0;
    state.flags |= Flags.HasOctal;

    // Implicit octal, unless there is a non-octal digit.
    // (Annex B.1.1 on Numeric Literals)
    while (index < state.length && (next = state.source.charCodeAt(index), (next >= Chars.Zero && next <= Chars.Nine))) {
        if (next === Chars.Eight || next === Chars.Nine) return scanNumeric(state, context, false);
        state.tokenValue = state.tokenValue * 8 + (next - Chars.Zero);
        index++;
        column++;
    }

    state.index = index;
    state.column = column;
    if (isValidIdentifierStart(next)) report(state, Errors.Unexpected);
    if (context & Context.OptionsRaw) state.tokenRaw = state.source.slice(start, state.index);
    return Token.NumericLiteral;
}

/**
 * Scans octal or binary digits
 *
 * @see [https://tc39.github.io/ecma262/#prod-BinaryDigits)
 * @see [https://tc39.github.io/ecma262/#prod-OctalDigit)
 *
 * @param state state object
 * @param base base number
 */

export function scanOctalOrBinaryDigits(state: State, context: Context, base: number): Token {
    const index = state.index;
    state.index += 1;
    state.column += 1;
    let code = nextChar(state);
    if (!(code >= Chars.Zero && code <= Chars.Nine)) report(state, Errors.Unexpected);
    let digits = 0;
    state.tokenValue = 0;
    while (state.index < state.length) {
        code = state.source.charCodeAt(state.index);
        const converted = code - Chars.Zero;
        if (!(code >= Chars.Zero && code <= Chars.Nine) || converted >= base) break;
        state.tokenValue = state.tokenValue * base + converted;
        state.index++;
        state.column++;
        digits++;
    }

    if (digits === 0) {
        report(state, Errors.Unexpected);
    }
    const isBigInt = consume(state, Chars.LowerN);
    if (isValidIdentifierStart(state.source.charCodeAt(state.index))) {
        report(state, Errors.Unexpected);
    }
    if (context & Context.OptionsRaw) state.tokenRaw = state.source.slice(index, state.index);
    return isBigInt ? Token.BigInt : Token.NumericLiteral;
}

/**
 * Scans hex digits
 *
 * @see [https://tc39.github.io/ecma262/#prod-HexDigits)
 *
 * @param state state object
 * @param context Context masks
 */
export function scanHexDigits(state: State, context: Context): Token {
    const index = state.index;
    state.index += 1;
    state.column += 1;
    state.tokenValue = toHex(nextChar(state));
    if (state.tokenValue < 0) report(state, Errors.Unexpected);

    while (state.index < state.length) {
        const digit = toHex(nextChar(state));
        if (digit < 0) break;
        state.tokenValue = state.tokenValue * 16 + digit;
    }
    const isBigInt = consume(state, Chars.LowerN);
    if (context & Context.OptionsRaw) state.tokenRaw = state.source.slice(index, state.index);
    return isBigInt ? Token.BigInt : Token.NumericLiteral;
}
