import { Parser } from '../types';
import { Token, descKeyword } from '../token';
import { Context } from '../common';
import { isValidIdentifierPart } from '../unicode';

export function scanIdentifier(parser: Parser, context: Context): Token {
  const { index: start } = parser;
  let code = parser.source.charCodeAt(parser.index);
  while (parser.index < parser.length && isValidIdentifierPart(code)) {
      code = parser.source.charCodeAt(parser.index);
      parser.index++;  parser.column++;
  }
  const ret = parser.source.slice(start, parser.index);

  const len = ret.length;
  parser.tokenValue = ret;
  
  // Keywords are between 2 and 11 characters long and start with a lowercase letter
  // https://tc39.github.io/ecma262/#sec-keywords
  if (len >= 2 && len <= 11) {
      const token = descKeyword(ret);
      if (token > 0) {
          return token;
      }
  }
  
  return Token.Identifier;
}
