import { ParserState } from '../types';
import { Chars } from '../chars';
import { Context } from '../common';
import { RegexpState } from './common';
/**
 * Validate the regular expression body
 *
 * @export
 * @param State Parser object
 * @param context Context masks
 * @param depth Depth
 * @param state Validation state
 */
export declare function validateRegexBody(parser: ParserState, context: Context, depth: number, state: RegexpState): RegexpState;
/**
 * Validates class and character class escape
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-CharacterClassEscape)
 * @see [Link](https://tc39.github.io/ecma262/#prod-ClassEscape)
 * @see [Link](https://tc39.github.io/ecma262/#prod-CharacterEscape)
 * @see [Link](https://tc39.github.io/ecma262/#prod-strict-IdentityEscape)
 * @see [Link](https://tc39.github.io/ecma262/#prod-strict-CharacterEscape)
 * @see [Link](https://tc39.github.io/ecma262/##prod-ControlEscape)
 * @see [Link](https://tc39.github.io/ecma262/#prod-strict-CharacterEscape)
 *
 * @param parser Parser object
 */
export declare function validateClassAndClassCharacterEscape(parser: ParserState): RegexpState | Chars;
