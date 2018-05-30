import { Parser } from '../types';
import { Context, Flags } from '../common';
import { Chars } from '../chars';
import { Errors, recordErrors } from '../errors';

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
  parser.index++;
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
              advanceNewline(parser, ch);
              return true;
          default:
              parser.index++;
              parser.column++;
      }
  }

  return false;
}

export function readNext(parser: Parser, ch: any): number {
    parser.index++; parser.column++;
    if (ch > 0xffff) parser.index++;
    if (parser.index >= parser.length) recordErrors(parser, Errors.Unexpected);
    return nextUnicodeChar(parser);
}

export function nextUnicodeChar(parser: Parser) {
    let { index } = parser;
    const hi = parser.source.charCodeAt(index++);

    if (hi < 0xd800 || hi > 0xdbff) return hi;
    if (index === parser.source.length) return hi;
    const lo = parser.source.charCodeAt(index);

    if (lo < 0xdc00 || lo > 0xdfff) return hi;
    return (hi & 0x3ff) << 10 | lo & 0x3ff | 0x10000;
}

export function isHex(code: number) {
    return code < 128 && ((code - Chars.Zero) <= 9) || ((code - Chars.LowerA) <= 5 || (code - Chars.UpperA) <= 5);
}

export function toHex(code: number): number {
    if (code < Chars.Zero) return -1;
    if (code <= Chars.Nine) return code - Chars.Zero;
    if (code < Chars.UpperA) return -1;
    if (code <= Chars.UpperF) return code - Chars.UpperA + 10;
    if (code < Chars.LowerA) return -1;
    if (code <= Chars.LowerF) return code - Chars.LowerA + 10;
    return -1;
}

export const fromCodePoint = (code: Chars) => {
    return code <= 0xFFFF ?
        String.fromCharCode(code) :
        String.fromCharCode(
          ((code - Chars.NonBMPMin) >> 10) + Chars.LeadSurrogateMin,
          ((code - Chars.NonBMPMin) & (1024 - 1)) + Chars.TrailSurrogateMin);
};