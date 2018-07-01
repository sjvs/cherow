import { State } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { nextChar, consume } from './common';
import { isValidIdentifierStart } from '../unicode';
import { Errors, report } from '../errors';

/**
 *  Scans numeric and decimal literal literal
 *
 * @see [https://tc39.github.io/ecma262/#prod-DecimalLiteral)
 * @see [https://tc39.github.io/ecma262/#prod-NumericLiteral)
 *
 * @param parser Parser object
 * @param context Context masks
 */
export function scanNumeric(state: State, isFloat: boolean): Token {
  const { index, column } = state;
  if (isFloat) {
      state.tokenValue = 0;
  } else {
      // Most number values fit into 4 bytes, but for long numbers
      // we would need a workaround...
      const maximumDigits = 10;
      let digit = maximumDigits - 1;
      state.tokenValue = state.nextChar - Chars.Zero;
      while (digit >= 0 && nextChar(state) <= Chars.Nine && state.nextChar >= Chars.Zero) {
          state.tokenValue = state.tokenValue * 10 + state.nextChar - Chars.Zero;
          --digit;
      }

      if (digit >= 0 && state.nextChar !== Chars.Period && (state.index >= state.length || !isValidIdentifierStart(state.nextChar))) {
          return Token.NumericLiteral;
      } else {
          // If we reach down here, the number either exceeds the 4 bytes limit, or
          // not a plain number.
          state.index = index;
          state.column = column;
          while (nextChar(state) <= Chars.Nine && state.nextChar >= Chars.Zero) {}
      }
  }

  if (isFloat || state.nextChar === Chars.Period) {
      if (!isFloat) nextChar(state);
      while (nextChar(state) <= Chars.Nine && state.nextChar >= Chars.Zero) {}
  }

  if (consume(state, Chars.UpperE) || consume(state, Chars.LowerE)) {
      if (consume(state, Chars.Plus) || consume(state, Chars.Hyphen)) {}
      state.nextChar = state.source.charCodeAt(state.index);
      if (!(state.nextChar >= Chars.Zero && state.nextChar <= Chars.Nine)) report(state, Errors.Unexpected);
      while (nextChar(state) <= Chars.Nine && state.nextChar >= Chars.Zero) {}
  }
  if (isValidIdentifierStart(state.nextChar)) report(state, Errors.Unexpected);
  state.tokenValue = parseFloat(state.source.slice(index, state.index));
  return Token.NumericLiteral;
}
