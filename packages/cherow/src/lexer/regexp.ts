import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context, Flags } from '../common';
import { consumeOpt, isDecimalDigit, isSurrogateLead, isSurrogateTail, getSurrogate, toHex, isHex } from './common';
import { Errors, recordErrors } from '../errors';
import { isValidIdentifierPart } from '../unicode';

/* Regular expression validator*/

// Note: This is still WIP.
//
// - Some of the ideas for this is from SpiderMonkey, V8 and Webkit.
//

/**
 * Verify regular expression pattern
 *
 * @param parser Parser object
 * @param next Code point
 * @param depth Level
 * @param type RegExp state
 */
export function readTerm(
    parser: Parser,
    context: Context,
    next: number,
    depth: number,
    type: Type,
    isAtom: boolean = false
): Type {
// Disjunction ::
//   Alternative
//   Alternative | Disjunction
// Alternative ::
//   [empty]
//   Term Alternative
// Term ::
//   Assertion
//   Atom
//   Atom Quantifier
    while (parser.index !== parser.length) {

        switch (next) {

            // `^`, `.`, `$`
            case Chars.Caret:
            case Chars.Period:
            case Chars.Dollar:
                parser.index++;
                isAtom = true;
                break;

                // `\`
            case Chars.Slash:
                // Err: "Unterminated group"
                if (depth !== 0) return Type.Invalid;
                parser.index++;
                return type;

                // `|`
            case Chars.VerticalBar:
                parser.index++;
                isAtom = false;
                break;

                // Atom ::
                //   \ AtomEscape
            case Chars.Backslash:
                parser.index++;
                isAtom = true;
                // Pattern may not end with a trailing backslash
                if (parser.index >= parser.length) return Type.Invalid; // \\ at end of pattern
                next = parser.source.charCodeAt(parser.index);
                switch (next) {
                    case Chars.LowerB:
                    case Chars.UpperB:
                        parser.index++;
                        isAtom = false;
                        break;
                    default:
                        let subType: Type;


                        switch (next) {

                            // '0'
                            case Chars.Zero:
                                parser.index++;
                                if (parser.index >= parser.length || isDecimalDigit(parser.source.charCodeAt(parser.index))) {
                                    subType = Type.Invalid;
                                } else subType = Type.Valid;
                                break;

                                // '1' - '9'
                            case Chars.One:
                            case Chars.Two:
                            case Chars.Three:
                            case Chars.Four:
                            case Chars.Five:
                            case Chars.Six:
                            case Chars.Seven:
                            case Chars.Eight:
                            case Chars.Nine:
                                subType = parseBackReferenceIndex(parser, next);
                                break;
                            case Chars.LowerU:
                                parser.index++;
                                subType = validateUnicodeEscape(parser);
                                break;
                            case Chars.UpperX:
                            case Chars.LowerX:
                                parser.index++;

                                if (parser.index === parser.length || !isHex(parser.source.charCodeAt(parser.index++))) {
                                    return Type.Invalid;
                                } else if (parser.index === parser.length || !isHex(parser.source.charCodeAt(parser.index++))) {
                                    subType = Type.Invalid;
                                } else subType = Type.Valid;
                                break;
                                // char escapes
                            case Chars.LowerC:
                                parser.index++;
                                if (parser.index >= parser.length) return Type.Invalid;
                                if (isAZaz(parser.source.charCodeAt(parser.index))) {
                                    parser.index++;
                                    subType = Type.Valid;
                                } else subType = Type.Invalid;
                                break;
                                // ControlEscape :: one of
                                //   f n r t v
                            case Chars.LowerF:
                            case Chars.LowerN:
                            case Chars.LowerR:
                            case Chars.LowerT:
                            case Chars.LowerV:

                                // AtomEscape ::
                                //   CharacterClassEscape
                                //
                                // CharacterClassEscape :: one of
                                //   d D s S w W
                            case Chars.LowerD:
                            case Chars.UpperD:
                            case Chars.LowerS:
                            case Chars.UpperS:
                            case Chars.LowerW:
                            case Chars.UpperW:
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
                                parser.index++;
                                subType = Type.Valid;
                                break;

                            case Chars.CarriageReturn:
                            case Chars.LineFeed:
                            case Chars.ParagraphSeparator:
                            case Chars.LineSeparator:
                                parser.index++;
                                subType = Type.Invalid;
                                break;
                            default:
                                parser.index++;
                                // TODO!
                        }
                        // TODO;
                }

                break;

                // `(`
            case Chars.LeftParen:
                parser.index++;
                if (parser.index >= parser.length) return Type.Invalid;

                next = parser.source.charCodeAt(parser.index);

                if (next === Chars.QuestionMark) {
                    parser.index++;
                    parser.column++;
                    switch (parser.source.charCodeAt(parser.index)) {
                        case Chars.Colon:
                        case Chars.EqualSign:
                        case Chars.Exclamation:
                            {
                                parser.index++;parser.column++;
                                if (parser.index >= parser.length) return Type.Invalid;
                                next = parser.source.charCodeAt(parser.index);
                                break;
                            }
                        default:
                            type = Type.Invalid;
                    }
                } else {
                    // capturing group
                    ++parser.capturingParens;
                }

                let subType = readTerm(parser, context, next, depth + 1, Type.Valid, isAtom);

                  // TODO!
                break;

                // `)`
            case Chars.RightParen:
                parser.index++;
                if (depth > 0) return type; // invalid group
                type = Type.Invalid;
                isAtom = true;
                break;

                // `[`
            case Chars.LeftBracket:
                let subType = parseCharacterClass(parser);
                 // TODO!
                 isAtom = true;
                break;

                // `]`
            case Chars.RightBracket:
                parser.index++;
                isAtom = true;
                break;

                // `?`, `*`, `+`
            case Chars.Asterisk:
            case Chars.Plus:
            case Chars.QuestionMark:
                parser.index++;
                if (isAtom) {
                  isAtom = false;
                    if (parser.index < parser.length) {
                        if (parser.source.charCodeAt(parser.index) === Chars.QuestionMark) {
                            parser.index++;
                        }
                    }
                } else {
                    type = Type.Invalid; // Nothing to repeat
                }
                break;

                // `{`
            case Chars.LeftBrace:
                parser.index++;

                if (isAtom) {
                    if (!parseIntervalQuantifier(parser)) type = Type.Invalid;
                    if (parser.index < parser.length) {
                        if (parser.source.charCodeAt(parser.index) === Chars.QuestionMark) {
                            parser.index++;
                        }
                    }
                    isAtom = false;
                } else {
                    type = Type.Invalid;
                }
                break;

                // `}`
            case Chars.RightBrace:
                parser.index++;
                type = Type.Invalid;
                isAtom = false;
                break;

                // `LineTerminator`
            case Chars.CarriageReturn:
            case Chars.LineFeed:
            case Chars.ParagraphSeparator:
            case Chars.LineSeparator:
                return Type.Invalid;

            default:
                parser.index++;
                isAtom = true;
        }

        next = parser.source.charCodeAt(parser.index);
    }

    return Type.Invalid;
}
