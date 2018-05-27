import { FunctionDeclaration } from './../estree';
import { Parser } from '../types';
import { Token, tokenDesc } from '../token';
import * as ESTree from '../estree';
import { parseAssignmentExpression, parseFormalListAndBody } from './expressions';
import { Context, BindingType, BindingOrigin, ModifierState, expect,consume, swapContext } from '../common';
import { parseDelimitedBindingList, parseBindingIdentifier } from './pattern';
import { recordErrors, Errors } from '../errors';

export function parseFunctionDeclaration(
        parser: Parser,
        context: Context,
        state: ModifierState = ModifierState.None
    ): ESTree.FunctionDeclaration {
        expect(parser, context, Token.FunctionKeyword);
        const isGenerator = consume(parser, context, Token.Multiply) ? ModifierState.Generator : ModifierState.None;
        let id: ESTree.Identifier | null = null;
        if (parser.token !== Token.LeftParen) {
            id = parseBindingIdentifier(parser, context);
        } else if (!(context & Context.RequireIdentifier)) recordErrors(parser, Errors.UnNamedFunctionDecl);
        context = swapContext(context, state | isGenerator);
        const { params, body } = parseFormalListAndBody(parser, context);
        return {
            type: 'FunctionDeclaration',
            body,
            params,
            async: !!(state & ModifierState.Async),
            generator: !!(isGenerator & ModifierState.Generator),
            expression: false,
            id
        };
    }

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