import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context, Flags } from '../common';
import { Errors, recordErrors } from '../errors';
import { isValidIdentifierPart } from '../unicode';
import { isHex, consumeOpt, readNext, toHex } from './common';

const enum RegExpFlags {
  Empty = 0,
  Global = 0x01,
  IgnoreCase = 0x02,
  Multiline = 0x04,
  Unicode = 0x08,
  Sticky = 0x10,
  DotAll = 0x20,
}

/**
 * Returns true if valid unicode continue
 *
 * @param {number} code
 */
function isValidUnicodeidcontinue(code: number): boolean {
    return isValidIdentifierPart(code) ||
        code === Chars.Dollar ||
        code === Chars.Underscore ||
        code >= Chars.Zero && code <= Chars.Nine;
}

function isFlagStart(code: number) {
  return isValidIdentifierPart(code) ||
      code === Chars.Backslash ||
      code === Chars.Dollar ||
      code === Chars.Underscore ||
      code === Chars.Zwnj ||
      code === Chars.Zwj;
}

/**
 * Scan the "body" of a regular expression
 *
 * @param parser Parser object
 * @param context Context masks
 * @param depth
 * @param type Regexp state type
*/

function scanRegexBody(parser: Parser, context: Context, depth: number, type: number): Type {

    let maybeQuantifier = false;

    while (parser.index !== parser.length) {

        switch (parser.source.charCodeAt(parser.index++)) {

            // `^`, `.`, `$`
            case Chars.Caret:
            case Chars.Period:
            case Chars.Dollar:
                maybeQuantifier = true;
                break;

                // `|`
            case Chars.VerticalBar:
                maybeQuantifier = false;
                break;

                // '/'
            case Chars.Slash:
                if (depth) return recordRegExpErrors(parser, context, Errors.UnterminatedGroup);
                return type;

                // Atom ::
                //   \ AtomEscape
            case Chars.Backslash:
                {
                    if (parser.index >= parser.length) return recordRegExpErrors(parser, context, Errors.Unexpected);

                    maybeQuantifier = true;

                    let subType = Type.Valid;

                    const next = parser.source.charCodeAt(parser.index);

                    switch (next) {

                        // 'b', 'B'
                        case Chars.LowerB:
                        case Chars.UpperB:
                            parser.index++;
                            maybeQuantifier = false;
                            break;

                            // 'u'
                        case Chars.LowerU:
                            parser.index++;
                            subType = validateUnicodeEscape(parser, context);
                            break;

                            // 'x', 'X'
                        case Chars.UpperX:
                        case Chars.LowerX:
                            {
                                parser.index++;
                                if (parser.index >= parser.length) {
                                    subType = recordRegExpErrors(parser, context, Errors.Unexpected);
                                } else if (!isHex(parser.source.charCodeAt(parser.index))) {
                                    subType = recordRegExpErrors(parser, context, Errors.Unexpected);
                                } else {
                                    parser.index++;
                                    if (parser.index >= parser.length) {
                                        subType = recordRegExpErrors(parser, context, Errors.Unexpected);
                                    }

                                    if (!isHex(parser.source.charCodeAt(parser.index))) {
                                        subType = recordRegExpErrors(parser, context, Errors.Unexpected);
                                        break;
                                    }
                                    parser.index++;
                                }
                                break;
                            }

                            // 'c'
                        case Chars.LowerC:
                            {
                                parser.index++;
                                if (parser.index >= parser.length) return recordRegExpErrors(parser, context, Errors.Unexpected);
                                if (!isAZaz(next)) subType = recordRegExpErrors(parser, context, Errors.Unexpected);
                                break;
                            }
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
                        case Chars.UpperD:
                        case Chars.LowerD:
                        case Chars.UpperS:
                        case Chars.LowerS:
                        case Chars.UpperW:
                        case Chars.LowerW:
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
                            break;

                            // '0'
                        case Chars.Zero:
                            parser.index++;
                            if (isDecimalDigit(parser.source.charCodeAt(parser.index))) return recordRegExpErrors(parser, context, Errors.Unexpected);
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
                        case Chars.CarriageReturn:
                        case Chars.LineFeed:
                        case Chars.ParagraphSeparator:
                        case Chars.LineSeparator:
                            parser.index++;
                            subType = recordRegExpErrors(parser, context, Errors.Unexpected);
                            break;
                        default:
                            if (isValidUnicodeidcontinue(next)) return recordRegExpErrors(parser, context, Errors.Unexpected);
                            parser.index++;
                            subType = Type.MaybeUnicode;
                    }

                    type = getRegExpState(parser, context, type, subType);
                    break;
                }

                // '('
            case Chars.LeftParen:
                {
                    if (parser.index >= parser.length) return recordRegExpErrors(parser, context, Errors.Unexpected);

                    if (consumeOpt(parser, Chars.QuestionMark)) {

                        if (parser.index >= parser.length) return recordRegExpErrors(parser, context, Errors.Unexpected);

                        switch (parser.source.charCodeAt(parser.index)) {

                            // ':', '=', '?'
                            case Chars.Colon:
                            case Chars.EqualSign:
                            case Chars.Exclamation:
                                parser.index++;
                                // non capturing group
                                if (parser.index >= parser.length) return recordRegExpErrors(parser, context, Errors.Unexpected);

                                break;
                            default:
                                type = recordRegExpErrors(parser, context, Errors.Unexpected);
                        }
                    } else {
                        ++parser.capturingParens;
                    }

                    const subType = scanRegexBody(parser, context, depth + 1, Type.Valid);
                    maybeQuantifier = true;
                    type = getRegExpState(parser, context, type, subType);
                    break;
                }

                // `)`
            case Chars.RightParen:
                if (depth > 0) return type;
                type = recordRegExpErrors(parser, context, Errors.InvalidGroup);
                maybeQuantifier = true;
                break;

                // '['
            case Chars.LeftBracket:
                const subType = parseCharacterClass(parser, context);
                type = getRegExpState(parser, context, type, subType);
                maybeQuantifier = true;
                break;

                // ']'
            case Chars.RightBracket:
                type = Type.MaybeUnicode; // recordRegExpErrors(parser, context,  Errors.LoneQuantifierBrackets, Type.MaybeUnicode);
                maybeQuantifier = true;
                break;

                // '*', '+', '?'
            case Chars.Asterisk:
            case Chars.Plus:
            case Chars.QuestionMark:
                if (maybeQuantifier) {
                    maybeQuantifier = false;
                    if (parser.index < parser.length) {
                        consumeOpt(parser, Chars.QuestionMark);
                    }
                } else {
                    type = recordRegExpErrors(parser, context, Errors.NothingToRepeat);
                }
                break;

                // '{'
            case Chars.LeftBrace:

                if (maybeQuantifier) {
                    if (!parseIntervalQuantifier(parser)) {
                        type = recordRegExpErrors(parser, context, Errors.NothingToRepeat);
                    }
                    if (parser.index < parser.length) {
                        consumeOpt(parser, Chars.QuestionMark);
                    }
                    maybeQuantifier = false;
                } else {
                    type = recordRegExpErrors(parser, context, Errors.NothingToRepeat);
                }
                break;

                // '}'
            case Chars.RightBrace:
                type = recordRegExpErrors(parser, context, Errors.NothingToRepeat);
                maybeQuantifier = false;
                break;

                // `LineTerminator`
            case Chars.CarriageReturn:
            case Chars.LineFeed:
            case Chars.ParagraphSeparator:
            case Chars.LineSeparator:
                return recordRegExpErrors(parser, context, Errors.Unexpected);
            default:
                maybeQuantifier = true;
        }
    }

    // Invalid regular expression
    return recordRegExpErrors(parser, context, Errors.Unexpected);
}

/**
 * Scans class character escape
 *
 * @param parser Parser object
 */
function scanClassCharacterEscape(parser: Parser): Type | Chars {

  const next = parser.source.charCodeAt(parser.index);

  parser.index++;

  switch (next) {

      // 'b'
      case Chars.LowerB:
          return Chars.Backspace;

          // 'B'
      case Chars.UpperB:
          return Type.InvalidClass;

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
          // CharacterClassEscape :: one of
          //   d D s S w W
      case Chars.UpperD:
      case Chars.LowerD:
      case Chars.UpperS:
      case Chars.LowerS:
      case Chars.UpperW:
      case Chars.LowerW:
          return Type.InvalidClassRange;

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
          return Chars.Hyphen | Type.InvalidNoUnicodeClass;

          // '0'
      case Chars.Zero:
          // With /u, \0 is interpreted as NUL if not followed by another digit.
          if (parser.index < parser.length && isDecimalDigit(parser.source.charCodeAt(parser.index))) {
              return Type.InvalidClass;
          }
          return 0;

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
          return Type.InvalidClass;
          // 'c'
      case Chars.LowerC:
          {
              if (parser.index < parser.length) {
                  const next = parser.source.charCodeAt(parser.index);
                  if (isAZaz(next)) return next;
              }
              return Type.InvalidClass;
          }

          // UCS-2/Unicode escapes
      case Chars.LowerU:
          {
              if (consumeOpt(parser, Chars.LeftBrace)) {
                  // \u{N}
                  if (parser.index >= parser.length) return Type.InvalidClass;
                  const type = scanUnicodeEscape(parser);
                  if (type !== Type.InvalidClass || (parser.index < parser.length &&
                          consumeOpt(parser, Chars.RightBrace))) {
                      parser.index++;
                  }
                  return type;
              } else {
                  // \uNNNN
                  const first = toHex(parser.source.charCodeAt(parser.index));
                  if (first < 0) return Type.InvalidClass;
                  const second = toHex(parser.source.charCodeAt(parser.index + 1));
                  if (second < 0) return Type.InvalidClass;
                  const third = toHex(parser.source.charCodeAt(parser.index + 2));
                  if (third < 0) return Type.InvalidClass;
                  const fourth = toHex(parser.source.charCodeAt(parser.index + 3));
                  if (fourth < 0) return Type.InvalidClass;
                  parser.index += 4;
                  return (first << 12) | (second << 8) | (third << 4) | fourth;
              }
          }
          // ASCII escapes
      case Chars.LowerX:

          if (parser.index >= parser.length - 1) return Type.InvalidClass;
          const ch1 = parser.source.charCodeAt(parser.index);
          const hi = toHex(ch1);
          if (hi < 0) return Type.InvalidClass;
          parser.index++;
          const ch2 = parser.source.charCodeAt(parser.index);
          const lo = toHex(ch2);
          if (lo < 0) return Type.InvalidClass;
          parser.index++;
          return (hi << 4) | lo;

      default:
          return Type.InvalidClass;
  }
}

/**
 * Scans regular expression flags
 *
 * @param parser Parser object
 * @param context Context masks
 */
function scanRegexFlags(parser: Parser, context: Context) {

  let mask = Flags.Empty;

  const flagsStart = parser.index;

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
          return recordErrors(parser, context, Errors.Unexpected);
      }

      parser.index++;
  }
  return mask & RegExpFlags.Unicode ? Type.OnlyUnicode : Type.MaybeUnicode;
}
