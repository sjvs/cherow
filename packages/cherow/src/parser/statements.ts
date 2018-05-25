import { Parser } from '../types';
import { Token, tokenDesc } from '../token';
import * as ESTree from '../estree';
import { parseExpression } from './expressions';
import { parseVariableDeclarationList } from './declarations';
import {
    Context,
    nextToken,
    expect,
    consumeSemicolon,
    BindingType,
    BindingOrigin,
    lookahead,
    isLexical
} from '../common';

/**
 * Parse statement list
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-StatementList)
 *
 * @param Parser instance
 * @param Context masks
 */

export function parseStatementList(parser: Parser, context: Context): any {
    nextToken(parser, context);
    let body = [];
    while (parser.token !== Token.EndOfSource) {
        body.push(parseStatementListItem(parser, context));
    }
    return body;
}

/**
 * Parses statement list items
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-StatementListItem)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseStatementListItem(parser: Parser, context: Context): ESTree.Statement {
    switch (parser.token) {
        case Token.ConstKeyword:
            return parseVariableStatement(parser, context, BindingType.Const);
        case Token.LetKeyword:
            return parseLetOrExpressionStatement(parser, context);
        default:
        return parseStatement(parser, context);
    }
}

/**
 * Parses statements
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-Statement)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseStatement(parser: Parser, context: Context): ESTree.Statement {
    switch (parser.token) {
        case Token.VarKeyword:
            return parseVariableStatement(parser, context, BindingType.Var);
        default:
        return parseExpressionOrLabelledStatement(parser, context);
    }
  
}

/**
 * Parses either expression or labelled statement
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-ExpressionStatement)
 * @see [Link](https://tc39.github.io/ecma262/#prod-LabelledStatement)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseExpressionOrLabelledStatement(parser: Parser, context: Context): any {

    const expr: ESTree.Expression = parseExpression(parser, context);

    consumeSemicolon(parser, context);
    return {
    type: 'ExpressionStatement',
    expression: expr
  };
}

/**
 * Parses either an lexical declaration (let) or an expression statement
 *
 * @see [Link](https://tc39.github.io/ecma262/#sec-let-and-const-declarations)
 * @see [Link](https://tc39.github.io/ecma262/#prod-ExpressionStatement)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
function parseLetOrExpressionStatement(
    parser: Parser,
    context: Context,
  ): any {
      return lookahead(parser, context, isLexical)
        ? parseVariableStatement(parser, context, BindingType.Let)
        : parseExpressionOrLabelledStatement(parser, context);
  }

/**
 * Parses variable statement
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-VariableStatement)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseVariableStatement(
    parser: Parser, 
    context: Context,
    type: BindingType
): any {
    const { token } = parser;
    nextToken(parser, context);
    const declarations = parseVariableDeclarationList(parser, context, type, BindingOrigin.Statement);
    consumeSemicolon(parser, context);
    return {
        type: 'VariableDeclaration',
        kind: tokenDesc(token) as 'var' | 'let' | 'const',
        declarations
      };
}

/**
 * Parses either For, ForIn or ForOf statement
 *
 * @see [Link](https://tc39.github.io/ecma262/#sec-for-statement)
 * @see [Link](https://tc39.github.io/ecma262/#sec-for-in-and-for-of-statements)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseForStatement(parser: Parser, context: Context): any {
    expect(parser, context, Token.ForKeyword);
}
