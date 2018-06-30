import { State } from '../types';
import { Token, KeywordDescTable } from '../token';

// TODO! Optimize and refactor this!

export function getTokenValue(state: State, t: Token) {
  if (t & Token.Punctuator) return KeywordDescTable[t & Token.Type];
  return state.source.slice(state.startIndex, state.index);
}

export function convertTokenType(t: Token): string {
  if (t & Token.Identifier) return 'Identifier';
  if (t & Token.Punctuator) return 'Punctuator';
  if (t & Token.NumericLiteral) return 'Numeric';
  if ((t & Token.StringLiteral) === Token.StringLiteral) return 'String';
  if (t & Token.RegularExpression) return 'Regular Expression';
  if (t & Token.Template) return 'Template';
  if (t & (Token.Reserved | Token.FutureReserved)) return 'Keyword';
  return 'Boolean'; // true / false
}
