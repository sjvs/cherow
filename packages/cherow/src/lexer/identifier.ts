import { Parser } from '../types';
import { Token } from '../token';
import { Context } from '../common';
import { Chars } from '../chars';
import { isValidIdentifierPart } from '../unicode';

export function scanIdentifier(parser: Parser, context: Context): Token {
  const { index: start } = parser;
  let code = parser.source.charCodeAt(parser.index);
  while (parser.index < parser.length && isValidIdentifierPart(code)) {
      code = parser.source.charCodeAt(parser.index);
      parser.index++;  parser.column++;
  }
  parser.tokenValue = parser.source.slice(start, parser.index);
  return Token.Identifier;
}
