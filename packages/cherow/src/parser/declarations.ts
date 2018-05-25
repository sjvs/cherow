import { Parser } from '../types';
import { Token, tokenDesc } from '../token';
import * as ESTree from '../estree';
import { parseAssignmentExpression } from './expressions';
import { Context, BindingType, BindingOrigin } from '../common';
import { parseDelimitedBindingList } from './pattern';

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
export function parseVariableDeclaration(
    id: any, 
    init: any
): ESTree.VariableDeclarator {
    return {
        type: 'VariableDeclarator',
        init,
        id,
    };
}

export function parseVariableDeclarationList(
    parser: Parser, 
    context: Context,
    type: BindingType,
    origin: BindingOrigin
): any {
    const list: ESTree.VariableDeclarator[] = [];
    parseDelimitedBindingList(parser, context, type, origin, list);
    return list;
}