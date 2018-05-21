import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context, Flags } from '../utilities';
import { peekUnicodeEscape, scanHexNumber } from './identifier';
import { fromCodePoint, advance, toHex, nextUnicodeChar, readNext } from './common';
import { Errors, recordErrors } from './errors';

const enum Recovery {
    Empty = -1,
    StrictOctal = -2,
    EightOrNine = -3,
    InvalidHex = -4,
    OutOfRange = -5,
}

/**
 * Throws a string error for either string or template literal
 *
 * @param parser Parser object
 * @param context Context masks
 */
export function throwStringError(parser: Parser, context: Context, code: Recovery): Token {
    let message: Errors = Errors.Unexpected;
    if (Recovery.Empty) return;
    if (Recovery.StrictOctal) message = Errors.StrictOctalEscape;
    if (Recovery.EightOrNine) message = Errors.InvalidEightAndNine;
    recordErrors(parser, Errors.UnterminatedString);
    return Token.Illegal;
}

/**
 * Scan a string literal
 *
 * @see [Link](https://tc39.github.io/ecma262/#sec-literals-string-literals)
 *
 * @param parser Parser object
 * @param context Context masks
 * @param quote codepoint
 */
export function scanString(parser: Parser, context: Context, quote: number): Token {
    parser.index++; parser.column++; // consume quote
    let { index, column } = parser;
    let ret = '';
    let ch = parser.source.charCodeAt(parser.index);
    loop:
        while (parser.index < parser.source.length) {
            ch = parser.source.charCodeAt(parser.index);
            switch (ch) {

                case Chars.LineSeparator:
                case Chars.ParagraphSeparator:
                case Chars.CarriageReturn:
                case Chars.LineFeed:
                    break loop;
                case Chars.Backslash:
                    ret += parser.source.slice(index, parser.index);
                    ch = readNext(parser, ch);
                    if (ch > Chars.MaxAsciiCharacter) {
                        ret += fromCodePoint(ch);
                    } else {
                        const code = table[ch](parser, context, ch);
                        if (code >= 0) ret += fromCodePoint(code);
                        else throwStringError(parser, context, code as Recovery);
                        index = parser.index + 1;
                        column = parser.column + 1;
                    }
                    break;
                case quote:
                    ret += parser.source.slice(index, parser.index);
                    parser.index++; parser.column++; // consume the quote
                    if (context & Context.OptionsRaw) parser.source.slice(index, parser.index);
                    parser.tokenValue = ret;
                    return Token.StringLiteral;
                default:
                    parser.index++; parser.column++;
            }
        }

    // Unterminated string literal
    parser.flags |= Flags.Unterminated;
    recordErrors(parser, Errors.UnterminatedString);
    return Token.Illegal;
}

const table = new Array<(parser: Parser, context: Context, first: number) => number>(128).fill(nextUnicodeChar);

table[Chars.LowerB] = () => Chars.Backspace;
table[Chars.LowerF] = () => Chars.FormFeed;
table[Chars.LowerR] = () => Chars.CarriageReturn;
table[Chars.LowerN] = () => Chars.LineFeed;
table[Chars.LowerT] = () => Chars.Tab;
table[Chars.LowerV] = () => Chars.VerticalTab;

table[Chars.CarriageReturn] = (parser: Parser) => {
    parser.column = -1;
    parser.line++;

    const {index} = parser;

    if (index < parser.source.length) {
        const ch = parser.source.charCodeAt(index);

        if (ch === Chars.LineFeed) {
            parser.lastChar = ch;
            parser.index = index + 1;
        }
    }

    return Recovery.Empty;
};

table[Chars.LineFeed] =
table[Chars.LineSeparator] =
table[Chars.ParagraphSeparator] = (parser: Parser) => {
    parser.column = -1;
    parser.line++;
    return Recovery.Empty;
};

// Null character, octals
table[Chars.Zero] =
table[Chars.One] =
table[Chars.Two] =
table[Chars.Three] = (parser, context, first) =>   {
    // 1 to 3 octal digits
    let code = first - Chars.Zero;
    let index = parser.index + 1;
    let column = parser.column + 1;

    let next = parser.source.charCodeAt(index);

    if (next < Chars.Zero || next > Chars.Seven) {

        // Strict mode code allows only \0, then a non-digit.
        if (code !== 0 || next === Chars.Eight || next === Chars.Nine) {
            if (context & Context.Strict) return Recovery.StrictOctal;
            parser.flags |= Flags.HasOctal;
        }
    } else if (context & Context.Strict) {
        return Recovery.StrictOctal;
    } else {
        parser.flags |= Flags.HasOctal;
        parser.lastChar = next;
        code = code * 8 + (next - Chars.Zero);
        index++;
        column++;
        next = parser.source.charCodeAt(index);
        if (next >= Chars.Zero && next <= Chars.Seven) {
            parser.lastChar = next;
            code = code * 8 + (next - Chars.Zero);
            index++;
            column++;
        }

        parser.index = index - 1;
        parser.column = column - 1;
    }

    return code;
}
table[Chars.Four] =
table[Chars.Five] =
table[Chars.Six] =
table[Chars.Seven] = (parser, context, first) => {
    if (context & Context.Strict) return Recovery.StrictOctal;
    let code = first - Chars.Zero;
    const index = parser.index + 1;
    const column = parser.column + 1;

    if (index < parser.source.length) {
        const next = parser.source.charCodeAt(index);

        if (next >= Chars.Zero && next <= Chars.Seven) {
            code = (code << 3) | (next - Chars.Zero);
            parser.lastChar = next;
            parser.index = index;
            parser.column = column;
        }
    }

    return code;
};

// `8`, `9` (invalid escapes)
table[Chars.Eight] = table[Chars.Nine] = () => Recovery.EightOrNine;

// ASCII escapes
table[Chars.LowerX] = (parser, _, first) => {
    const ch1 = parser.lastChar = readNext(parser, first);
    const hi = toHex(ch1);
    if (hi < 0) return Recovery.InvalidHex;
    const ch2 = parser.lastChar = readNext(parser, ch1);
    const lo = toHex(ch2);
    if (lo < 0) return Recovery.InvalidHex;

    return hi << 4 | lo;
};

// UCS-2/Unicode escapes
table[Chars.LowerU] = (parser, _, prev) =>  {
    let ch = parser.lastChar = readNext(parser, prev);
    if (ch === Chars.LeftBrace) {
        ch = parser.lastChar = readNext(parser, ch);
        let code = toHex(ch);
        if (code < 0) return Recovery.InvalidHex;

        ch = parser.lastChar = readNext(parser, ch);
        while (ch !== Chars.RightBrace) {
            const digit = toHex(ch);
            if (digit < 0) return Recovery.InvalidHex;
            code = code * 16 + digit;
            // Code point out of bounds
            if (code > Chars.NonBMPMax) return Recovery.OutOfRange;
            ch = parser.lastChar = readNext(parser, ch);
        }

        return code;
    } else {
        // \uNNNN
        let codePoint = toHex(ch);
        if (codePoint < 0) return Recovery.InvalidHex;

        for (let i = 0; i < 3; i++) {
            ch = parser.lastChar = readNext(parser, ch);
            const digit = toHex(ch);
            if (digit < 0) return Recovery.InvalidHex;
            codePoint = codePoint * 16 + digit;
        }

        return codePoint;
    }
};
