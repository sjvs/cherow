import { Parser } from '../types';
import { Context, Flags } from '../common';
import { Chars } from '../chars';

export function consumeOpt(parser: Parser, code: number): boolean {
  if (parser.source.charCodeAt(parser.index) !== code) return false;
  parser.index++;
  parser.column++;
  return true;
}

/**
* Consumes line feed
*
* @param parser Parser object
* @param state  Scanner state
*/
export function consumeLineFeed(parser: Parser, lastIsCR: boolean): void {
  parser.flags |= Flags.NewLine;
  parser.index++;
  if (!lastIsCR) {
      parser.column = 0;
      parser.line++;
  }
}

/**
* Advance to new line
*
* @param parser Parser object
*/
export function advanceNewline(parser: Parser, ch: number) {
  parser.column = 0;
  parser.line++;
  if (parser.index < parser.length && ch === Chars.CarriageReturn &&
      parser.source.charCodeAt(parser.index) === Chars.LineFeed) {
      parser.index++;
  }
}

export function skipToNewline(parser: Parser): boolean {
  while (parser.index < parser.length) {
      const ch = parser.source.charCodeAt(parser.index);
      switch (ch) {
          case Chars.CarriageReturn:
          case Chars.LineFeed:
          case Chars.LineSeparator:
          case Chars.ParagraphSeparator:
              parser.index++;
              advanceNewline(parser, ch);
              return true;
          default:
              parser.index++;
              parser.column++;
      }
  }

  return false;
}
