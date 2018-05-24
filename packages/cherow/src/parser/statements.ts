import { Context, nextToken } from '../common';
import { Parser } from '../types';
import { Token, tokenDesc } from '../token';
import * as ESTree from '../estree';
import { parseExpression } from './expressions';

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
    return parseStatement(parser, context)
}

export function parseStatement(parser: Parser, context: Context): ESTree.Statement {
    switch (parser.token) {
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
    return {
    type: 'ExpressionStatement',
    expression: expr
  }
}