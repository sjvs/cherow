import { Parser } from '../types';
import * as ESTree from '../estree';
import { Context, BindingType, BindingOrigin } from '../common';
/**
 * Parse binding identifier
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-BindingIdentifier)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export declare function parseBindingIdentifier(parser: Parser, context: Context, kind?: 'let' | 'const' | 'var'): ESTree.Identifier;
/**
 * Parses either a binding identifier or binding pattern
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export declare function parseBindingIdentifierOrPattern(parser: Parser, context: Context, type?: BindingType, origin?: BindingOrigin): any;
/** Parse assignment pattern
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-AssignmentPattern)
 * @see [Link](https://tc39.github.io/ecma262/#prod-ArrayAssignmentPattern)
 *
 * @param parser Parser object
 * @param context Context masks
 * @param left LHS of assignment pattern
 * @param pos Location
 */
export declare function parseAssignmentPattern(parser: Parser, context: Context, left: ESTree.PatternTop): ESTree.AssignmentPattern;
/**
 * Parse binding initializer
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-AssignmentPattern)
 * @see [Link](https://tc39.github.io/ecma262/#prod-ArrayAssignmentPattern)
 *
 * @param parser Parser object
 * @param context Context masks
 */
export declare function parseBindingInitializer(parser: Parser, context: Context, type: BindingType): any;
/**
 * Parses bindings
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-FormalParameterList)
 * @see [Link](https://tc39.github.io/ecma262/#prod-Catch)
 * @see [Link](https://tc39.github.io/ecma262/#prod-VariableDeclaration)
 * @see [Link](https://tc39.github.io/ecma262/#sec-for-statement)
 * @see [Link](https://tc39.github.io/ecma262/#sec-for-in-and-for-of-statements)
 *
 * @param parser Parser object
 * @param context Context masks
 * @param type Binding type
 * @param origin Binding origin
 */
export declare function parseBinding(parser: Parser, context: Context, type: BindingType, origin: BindingOrigin, args?: any): any;
