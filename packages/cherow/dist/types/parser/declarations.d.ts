import { Parser } from '../types';
import * as ESTree from '../estree';
import { Context, BindingType, BindingOrigin } from '../common';
export declare function parseFunctionDeclaration(parser: Parser, context: Context): any;
/**
 * VariableDeclaration :
 *   BindingIdentifier Initializeropt
 *   BindingPattern Initializer
 *
 * VariableDeclarationNoIn :
 *   BindingIdentifier InitializerNoInopt
 *   BindingPattern InitializerNoIn
 *
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-VariableDeclaration)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export declare function parseVariableDeclaration(id: any, init: any): ESTree.VariableDeclarator;
export declare function parseVariableDeclarationList(parser: Parser, context: Context, type: BindingType, origin: BindingOrigin): any;
