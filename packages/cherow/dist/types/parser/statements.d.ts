import { Context } from '../common';
import { Parser } from '../types';
import * as ESTree from '../estree';
export declare function parseStatementList(parser: Parser, context: Context): any;
/**
 * Parses statement list items
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-StatementListItem)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export declare function parseStatementListItem(parser: Parser, context: Context): ESTree.Statement;
export declare function parseStatement(parser: Parser, context: Context): ESTree.Statement;
/**
 * Parses either expression or labelled statement
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-ExpressionStatement)
 * @see [Link](https://tc39.github.io/ecma262/#prod-LabelledStatement)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export declare function parseExpressionOrLabelledStatement(parser: Parser, context: Context): any;
