import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context, Flags } from '../common';
import { Errors, recordErrors } from '../errors';
import { isValidIdentifierPart } from '../unicode';
import {
    RegExpFlags,
    setRegExpState,
    setValidationState,
    RegexState,
    isValidUnicodeidcontinue,
    isIdentRestChr,
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
 * Validates regular expression pattern
 *
 * @export
 * @param {Parser} parser
 * @param {Context} context
 * @returns {RegexState}
 */
export function verifyRegExpPattern(parser: Parser, context: Context): RegexState {

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

            parser.index++; parser.column++;
        }

    const state = setRegExpState(parser, mask & RegExpFlags.Unicode ? RegexState.StrictMode : RegexState.SloppyMode, bodyState);

    // This is foolish! Will nevertheless return either "valid" or "invalid" if in editor mode.
    if (state === RegexState.Valid) {

        const flags = parser.source.slice(flagStart, parser.index);
        const pattern = parser.source.slice(bodyStart, bodyEnd);

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
    }

    // Note! This should return the token, **NOT** the regexp state
    return state; // return Token.RegularExpression;
}

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
                                    subState = validateUnicodeEscape(parser, context);
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

                                    if (isIdentRestChr(ch)) return RegexState.Invalid;
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
                state = setValidationState(state, parseCharacterClass(parser, context));
                maybeQuantifier = true;
                break;

            case Chars.RightBracket:
                state = RegexState.Invalid;
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
