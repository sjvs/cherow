import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context, Flags } from '../common';
import { Errors, recordErrors } from '../errors';
import { isValidIdentifierPart } from '../unicode';
import { parseClassRanges } from './icefapper';
import {
    RegExpFlags,
    setRegExpState,
    setValidationState,
    RegexState,
    isValidUnicodeidcontinue,
    isAZax,
    parseIntervalQuantifier,
    isHex,
    consumeOpt,
    readNext,
    toHex,
    isAsciiLetter,
    isDecimalDigit,
    isFlagStart
} from './common';

/**
 * Scans regular expression pattern
 *
 * @export
 * @param parser Parser object
 * @param context Context masks
 */
function scanRegularExpression(parser: Parser, context: Context): Token {

    const { flags, pattern, state } = verifyRegExpPattern(parser, context);

    parser.tokenRegExp = {
        pattern,
        flags
    };

    if (context & Context.OptionsRaw) parser.tokenRaw = parser.source.slice(parser.startIndex, parser.index);

    try {
        parser.tokenValue = new RegExp(pattern, flags);
    } catch (e) {
        parser.tokenValue = null;
    }

    return Token.RegularExpression;
}

/**
 * Validates regular expression pattern
 *
 * @export
 * @param {Parser} parser
 * @param {Context} context
 * @returns {RegexState}
 */
export function verifyRegExpPattern(parser: Parser, context: Context): {
    flags: string;pattern: string;state: RegexState;
} {
    const bodyStart = parser.index;
    const bodyState = scanRegexBody(parser, context, 0, RegexState.Valid);

    const bodyEnd = parser.index - 1;

    let mask = Flags.Empty;

    const { index: flagStart } = parser;

    loop:
        while (parser.index < parser.length) {
            const code = parser.source.charCodeAt(parser.index);
            switch (code) {
                case Chars.LowerG:
                    if (mask & RegExpFlags.Global) recordErrors(parser, context, Errors.DuplicateRegExpFlag, 'g');
                    mask |= RegExpFlags.Global;
                    break;

                case Chars.LowerI:
                    if (mask & RegExpFlags.IgnoreCase) recordErrors(parser, context, Errors.DuplicateRegExpFlag, 'i');
                    mask |= RegExpFlags.IgnoreCase;
                    break;

                case Chars.LowerM:
                    if (mask & RegExpFlags.Multiline) recordErrors(parser, context, Errors.DuplicateRegExpFlag, 'm');
                    mask |= RegExpFlags.Multiline;
                    break;

                case Chars.LowerU:
                    if (mask & RegExpFlags.Unicode) recordErrors(parser, context, Errors.DuplicateRegExpFlag, 'u');
                    mask |= RegExpFlags.Unicode;
                    break;

                case Chars.LowerY:
                    if (mask & RegExpFlags.Sticky) recordErrors(parser, context, Errors.DuplicateRegExpFlag, 'y');
                    mask |= RegExpFlags.Sticky;
                    break;

                case Chars.LowerS:
                    if (mask & RegExpFlags.DotAll) recordErrors(parser, context, Errors.DuplicateRegExpFlag, 's');
                    mask |= RegExpFlags.DotAll;
                    break;
                    // falls through
                default:
                    if (!isFlagStart(code)) break loop;
                    recordErrors(parser, context, Errors.Unexpected);
            }

            parser.index++;
            parser.column++;
        }

    const state = setRegExpState(parser, mask & RegExpFlags.Unicode ? RegexState.StrictMode : RegexState.SloppyMode, bodyState);

    const flags = parser.source.slice(flagStart, parser.index);
    const pattern = parser.source.slice(bodyStart, bodyEnd);

    return { flags, pattern, state };
}

/**
 * Scans the regular expression body
 *
 * @export
 * @param parser Parser object
 * @param context Context masks
 * @param level
 * @param state Validation state
 */
export function scanRegexBody(parser: Parser, context: Context, level: number, state: RegexState): RegexState {

    let maybeQuantifier = false;

    while (parser.index !== parser.length) {

        switch (parser.source.charCodeAt(parser.index++)) {

            // '/'
            case Chars.Slash:
                if (level !== 0) return RegexState.Invalid;
                return state;

            case Chars.Period:
            case Chars.Dollar:
            case Chars.Caret:
                maybeQuantifier = true;
                break;
            case Chars.VerticalBar:
                maybeQuantifier = false;
                break;

            case Chars.Backslash:
                {
                    maybeQuantifier = true;
                    if (parser.index > parser.length) {
                        state = RegexState.Invalid;
                    } else {

                        if (consumeOpt(parser, Chars.LowerB) || consumeOpt(parser, Chars.UpperB)) {
                            maybeQuantifier = false;
                        } else {

                            const ch = parser.source.charCodeAt(parser.index++);

                            let subState: RegexState = RegexState.Invalid;

                            switch (ch) {
                                case Chars.LowerU:
                                    subState = validateUnicodeEscape(parser);
                                    break;
                                case Chars.LowerX:
                                case Chars.UpperX:
                                    if (parser.index >= parser.length || !isHex(parser.source.charCodeAt(parser.index++))) break;
                                    if (parser.index >= parser.length || !isHex(parser.source.charCodeAt(parser.index++))) break;
                                    subState = RegexState.Valid;
                                    break;
                                case Chars.LowerC:
                                    if (parser.index >= parser.length) subState = RegexState.Invalid;
                                    else if (isAsciiLetter(ch)) {
                                        subState = RegexState.Valid;
                                    }
                                    break;
                                case Chars.LowerF:
                                case Chars.LowerN:
                                case Chars.LowerR:
                                case Chars.LowerT:
                                case Chars.LowerV:

                                case Chars.UpperD:
                                case Chars.LowerD:
                                case Chars.UpperS:
                                case Chars.LowerS:
                                case Chars.UpperW:
                                case Chars.LowerW:

                                case Chars.VerticalBar:
                                case Chars.Caret:
                                case Chars.Dollar:
                                case Chars.Asterisk:
                                case Chars.Plus:
                                case Chars.QuestionMark:
                                case Chars.LeftParen:
                                case Chars.RightParen:
                                case Chars.LeftBracket:
                                case Chars.RightBracket:
                                case Chars.LeftBrace:
                                case Chars.RightBrace:
                                case Chars.Slash:
                                    subState = RegexState.Valid;
                                    break;
                                case Chars.Zero:
                                    if (parser.index >= parser.length) subState = RegexState.Invalid;
                                    if (!isDecimalDigit(parser.source.charCodeAt(parser.index))) subState = RegexState.Valid;
                                    break;
                                case Chars.One:
                                case Chars.Two:
                                case Chars.Three:
                                case Chars.Four:
                                case Chars.Five:
                                case Chars.Six:
                                case Chars.Seven:
                                case Chars.Eight:
                                case Chars.Nine:
                                    subState = parseBackReferenceIndex(parser, ch);
                                    break;
                                case Chars.LineFeed:
                                case Chars.CarriageReturn:
                                case Chars.ParagraphSeparator:
                                case Chars.LineSeparator:
                                    subState = RegexState.Invalid;
                                    break;
                                default:

                                    if (isAZax(ch)) return RegexState.Invalid;
                                    subState = RegexState.NoStrict;
                            }

                            state = setValidationState(state, subState);
                        }
                    }
                    break;
                }

            case Chars.LeftBrace:
                {
                    if (maybeQuantifier) {
                        if (!parseIntervalQuantifier(parser)) state = RegexState.Invalid;
                        consumeOpt(parser, Chars.QuestionMark);
                        maybeQuantifier = false;
                    } else state = RegexState.Invalid;
                    break;
                }

            case Chars.RightBrace:
                state = RegexState.Invalid;
                break;

            case Chars.LeftParen:
                {
                    if (parser.index > parser.length) {
                        state = RegexState.Invalid;
                        break;
                    }

                    let ch = parser.source.charCodeAt(parser.index);
                    if (ch === Chars.QuestionMark) {
                        parser.index++;
                        ch = parser.source.charCodeAt(parser.index);
                        if (ch === Chars.EqualSign || ch === Chars.Exclamation || ch === Chars.Colon) {
                            parser.index++;
                            ch = parser.source.charCodeAt(parser.index);
                            state = RegexState.NoStrict;
                        } else state = RegexState.Invalid;
                    } else parser.capturingParens++;

                    const subState = scanRegexBody(parser, context, level + 1, RegexState.Valid);
                    ch = parser.source.charCodeAt(parser.index);
                    maybeQuantifier = true;

                    state = setValidationState(state, subState);
                    break;
                }

            case Chars.RightParen:
                {
                    if (level > 0) return state;
                    state = RegexState.Invalid;
                    maybeQuantifier = false;
                    break;
                }

            case Chars.Asterisk:
            case Chars.Plus:
            case Chars.QuestionMark:
                if (maybeQuantifier) {
                    maybeQuantifier = false;
                    if (parser.index < parser.length) {
                        consumeOpt(parser, Chars.QuestionMark);
                    }
                } else {
                    state = RegexState.Invalid;
                }
                break;

            case Chars.LeftBracket:
                state = setValidationState(state, validateCharacterClass(parser, context));
                maybeQuantifier = true;
                break;

            case Chars.RightBracket:
                state = RegexState.Invalid;
                // maybeQuantifier = true;
                break;

            case Chars.LineFeed:
            case Chars.CarriageReturn:
            case Chars.ParagraphSeparator:
            case Chars.LineSeparator:
                return RegexState.Invalid;

            default:
                maybeQuantifier = true;
        }
    }

    return RegexState.Invalid;
}

/**
 * Parse back reference index
 *
 * @see [Link](https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape)
 *
 * @param parser Parser object
 * @param code Code point
 */
export function parseBackReferenceIndex(parser: Parser, code: number): RegexState {
    let value = code - Chars.Zero;
    while (parser.index < parser.length) {
        code = parser.source.charCodeAt(parser.index);
        if (code >= Chars.Zero && code <= Chars.Nine) {
            value = value * 10 + (code - Chars.Zero);
            parser.index++;
        } else {
            break;
        }
    }

    parser.largestBackReference = value;
    return RegexState.Valid;
}

/**
 * Validates character class
 *
 * @see [Link](https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClassEscape)
 *
 * @param parser Parser object
 * @param context Context masks
 */
function validateCharacterClass(parser: Parser, context: Context): RegexState {
    consumeOpt(parser, Chars.Caret);
    const next = parser.source.charCodeAt(parser.index);
    return parseClassRanges(parser, context, next);
}

/**
 * Validates character class escape
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-CharacterClassEscape)
 *
 * @param parser Parser object
 */
export function validateCharacterClassEscape(parser: Parser): RegexState | Chars {

    if (parser.index >= parser.length) return -1;

    const next = parser.source.charCodeAt(parser.index);

    parser.index++;

    switch (next) {

        // CharacterClassEscape :: one of
        //   d D s S w W
        case Chars.UpperD:
        case Chars.LowerD:
        case Chars.UpperS:
        case Chars.LowerS:
        case Chars.UpperW:
        case Chars.LowerW:
            return RegexState.InvalidRange;

            // 'b'
        case Chars.LowerB:
            return Chars.Backspace;

            // 'B'
        case Chars.UpperB:
            return RegexState.InvalidClassEscape;

            // ControlEscape :: one of
            //   f n r t v
        case Chars.LowerF:
            return Chars.FormFeed;
        case Chars.LowerN:
            return Chars.LineFeed;
        case Chars.LowerR:
            return Chars.CarriageReturn;
        case Chars.LowerT:
            return Chars.Tab;
        case Chars.LowerV:
            return Chars.VerticalTab;

            // 'c'
        case Chars.LowerC:
            {
                if (parser.index >= parser.length) return RegexState.InvalidClassEscape;
                const letter = parser.source.charCodeAt(parser.index) & ~(Chars.UpperA ^ Chars.LowerA);
                // Control letters mapped to ASCII control characters in the range 0x00-0x1F.
                if (letter >= Chars.UpperA && letter <= Chars.UpperZ) {
                    parser.index++;
                    parser.column++;
                    return next & 0x1F;
                }
                return RegexState.InvalidClassEscape;
            }

        case Chars.Caret:
        case Chars.Dollar:
        case Chars.Backslash:
        case Chars.Period:
        case Chars.Asterisk:
        case Chars.Plus:
        case Chars.QuestionMark:
        case Chars.LeftParen:
        case Chars.RightParen:
        case Chars.LeftBracket:
        case Chars.RightBracket:
        case Chars.LeftBrace:
        case Chars.RightBrace:
        case Chars.VerticalBar:
        case Chars.Slash:
            return next;

            // '-'
        case Chars.Hyphen:
            return Chars.Hyphen | RegexState.InvalidSloppyClass;

            // '0'
        case Chars.Zero:
            {
                // With /u, \0 is interpreted as NUL if not followed by another digit.
                if (parser.index < parser.length) {
                    const next = parser.source.charCodeAt(parser.index);
                    if (!(next >= Chars.Zero && next <= Chars.Nine)) return 0;
                }
                // falls through
            }
            // '1' - '9';
        case Chars.One:
        case Chars.Two:
        case Chars.Three:
        case Chars.Four:
        case Chars.Five:
        case Chars.Six:
        case Chars.Seven:
        case Chars.Eight:
        case Chars.Nine:
            // Invalid class escape
            return RegexState.InvalidClassEscape;

            // UCS-2/Unicode escapes
        case Chars.LowerU:
            {
                if (consumeOpt(parser, Chars.LeftBrace)) {
                    // \u{N}
                    let ch = parser.source.charCodeAt(parser.index);
                    let code = toHex(ch);
                    if (code < 0) return RegexState.InvalidClassEscape;
                    parser.index++;
                    ch = parser.source.charCodeAt(parser.index);
                    while (ch !== Chars.RightBrace) {
                        const digit = toHex(ch);
                        if (digit < 0) return RegexState.InvalidClassEscape;
                        code = code * 16 + digit;
                        // Code point out of bounds
                        if (code > Chars.NonBMPMax) return RegexState.InvalidClassEscape;
                        parser.index++;
                        ch = parser.source.charCodeAt(parser.index);
                    }
                    parser.index++;
                    consumeOpt(parser, Chars.RightBrace)
                    return code | RegexState.InvalidSloppyClass;

                } else {
                    // \uNNNN
                    let codePoint = toHex(parser.source.charCodeAt(parser.index));
                    if (codePoint < 0) return RegexState.InvalidClassEscape;
                    for (let i = 0; i < 3; i++) {
                        parser.index++;
                        parser.column++;
                        const digit = toHex(parser.source.charCodeAt(parser.index));
                        if (digit < 0) return RegexState.InvalidClassEscape;
                        codePoint = codePoint * 16 + digit;
                    }
                    parser.index++;
                    parser.column++;
                    return codePoint;
                }
            }
            // ASCII escapes
        case Chars.LowerX:

            if (parser.index >= parser.length - 1) return RegexState.InvalidClassEscape;
            const ch1 = parser.source.charCodeAt(parser.index);
            const hi = toHex(ch1);
            if (hi < 0) return RegexState.InvalidClassEscape;
            parser.index++;
            const ch2 = parser.source.charCodeAt(parser.index);
            const lo = toHex(ch2);
            if (lo < 0) return RegexState.InvalidClassEscape;
            parser.index++;
            return (hi << 4) | lo;

        default:
            return RegexState.InvalidClassEscape;
    }
}

/**
 * Validates unicode escape
 *
 * @param parser Parser object
 */
function validateUnicodeEscape(parser: Parser): RegexState {

    if (consumeOpt(parser, Chars.LeftBrace)) {

        let ch = parser.source.charCodeAt(parser.index);
        let code = toHex(ch);
        if (code < 0) return RegexState.Invalid;
        parser.index++;
        ch = parser.source.charCodeAt(parser.index);
        while (ch !== Chars.RightBrace) {
            const digit = toHex(ch);
            if (digit < 0) return RegexState.Invalid;
            code = code * 16 + digit;
            // Code point out of bounds
            if (code > Chars.NonBMPMax) return RegexState.Invalid;
            parser.index++;
            ch = parser.source.charCodeAt(parser.index);
        }
        parser.index++;
        return RegexState.StrictMode;
    }

    if (toHex(parser.source.charCodeAt(parser.index)) < 0) return RegexState.Invalid;

    if (toHex(parser.source.charCodeAt(parser.index + 1)) < 0) return RegexState.Invalid;

    if (toHex(parser.source.charCodeAt(parser.index + 2)) < 0) return RegexState.Invalid;

    if (toHex(parser.source.charCodeAt(parser.index + 3)) < 0) return RegexState.Invalid;

    parser.index += 4;
    parser.column += 4;
    return RegexState.Valid;
}
