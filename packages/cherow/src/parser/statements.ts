import { VariableDeclarator } from './../estree';
import { Parser } from '../types';
import { Token, tokenDesc } from '../token';
import * as ESTree from '../estree';
import { parseSequenceExpression, parseExpression, parseAssignmentExpression } from './expressions';
import { Errors, recordErrors, } from '../errors';
import { parseVariableDeclarationList } from './declarations';
import { parseDelimitedBindingList, parseBindingIdentifierOrPattern } from './pattern';
import {
    Context,
    Flags,
    nextToken,
    expect,
    consume,
    consumeSemicolon,
    BindingType,
    BindingOrigin,
    lookahead,
    isLexical,
    reinterpret
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
        case Token.TryKeyword:
            return parseTryStatement(parser, context);
        case Token.Semicolon:
            return parseEmptyStatement(parser, context);
         case Token.ReturnKeyword:
            return parseReturnStatement(parser, context);
         case Token.LeftBrace:
            return parseBlockStatement(parser, context);
         case Token.DebuggerKeyword:
            return parseDebuggerStatement(parser, context);
            case Token.ForKeyword:
            return parseForStatement(parser, context);
         default:
        return parseExpressionOrLabelledStatement(parser, context);
    }
 }

/**
 * Parses the debugger statement production
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-DebuggerStatement)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseDebuggerStatement(parser: Parser, context: Context): ESTree.DebuggerStatement {
    expect(parser, context, Token.DebuggerKeyword);
    consumeSemicolon(parser, context);
    return {
      type: 'DebuggerStatement'
    };
  }

 /**
 * Parses block statement
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-BlockStatement)
 * @see [Link](https://tc39.github.io/ecma262/#prod-Block)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseBlockStatement(parser: Parser, context: Context): ESTree.BlockStatement {
    const body: ESTree.Statement[] = [];
    expect(parser, context, Token.LeftBrace);
    while (parser.token !== Token.RightBrace) {
      body.push(parseStatementListItem(parser, context));
    }
    expect(parser, context, Token.RightBrace);
  
    return {
      type: 'BlockStatement',
      body
    };
  }
  
/**
 * Parses return statement
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-ReturnStatement)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseReturnStatement(parser: Parser, context: Context): ESTree.ReturnStatement {
    expect(parser, context, Token.ReturnKeyword);
    const argument = (parser.token & Token.ASI) !== Token.ASI && !(parser.flags & Flags.NewLine)
        ? parseExpression(parser, context | Context.In)
        : null;
    consumeSemicolon(parser, context);
    return {
      type: 'ReturnStatement',
      argument
    };
  }
  
/**
 * Parses empty statement
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-EmptyStatement)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseEmptyStatement(parser: Parser, context: Context): ESTree.EmptyStatement {
    nextToken(parser, context);
    return {
      type: 'EmptyStatement'
    };
}

/**
 * Parses try statement
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-TryStatement)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseTryStatement(parser: Parser, context: Context): ESTree.TryStatement {
    expect(parser, context, Token.TryKeyword);
    const block = parseBlockStatement(parser, context);
    const handler = parser.token === Token.CatchKeyword ? parseCatchBlock(parser, context) : null;
    const finalizer = consume(parser, context, Token.FinallyKeyword) ? parseBlockStatement(parser, context) : null;
    if (!handler && !finalizer) recordErrors(parser, Errors.NoCatchOrFinally);
    return {
      type: 'TryStatement',
      block,
      handler,
      finalizer
    };
  }
  
  /**
   * Parses catch block
   *
   * @see [Link](https://tc39.github.io/ecma262/#prod-Catch)
   *
   * @param parser  Parser object
   * @param context Context masks
   */
  export function parseCatchBlock(parser: Parser, context: Context): any {
    expect(parser, context, Token.CatchKeyword);
    let param: ESTree.PatternTop | null = null;
    if (consume(parser, context, Token.LeftParen)) {
        if (parser.token === Token.RightParen) {
            recordErrors(parser, Errors.NoCatchClause);
        } else {
            param = parseBindingIdentifierOrPattern(parser, context);
            if (parser.token === Token.Assign) recordErrors(parser, Errors.NoCatchClause);
        }
        expect(parser, context, Token.RightParen);
    }
    const body = parseBlockStatement(parser, context);
  
    return {
      type: 'CatchClause',
      param,
      body
    };
  }

  /**
 * Parses throw statement
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-ThrowStatement)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseThrowStatement(parser: Parser, context: Context): ESTree.ThrowStatement {
    expect(parser, context, Token.ThrowKeyword);
    const argument: ESTree.Expression = parseExpression(parser, context | Context.In);
    consumeSemicolon(parser, context);
    return {
      type: 'ThrowStatement',
      argument
    };
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
    const awaitToken = consume(parser, context, Token.AwaitKeyword);
    expect(parser, context, Token.LeftParen);
    let init: any = null;
    let declarations: ESTree.VariableDeclarator[] | null = null;
    let type: any = 'ForStatement';
    let test: ESTree.Expression | null = null;
    let update: ESTree.Expression | null = null;
    let right;
    if (parser.token !== Token.Semicolon) {
        let token = parser.token;
        switch (parser.token) {
            case Token.VarKeyword:
                nextToken(parser, context);
                declarations = parseVariableDeclarationList(parser, context & ~Context.In, BindingType.Var, BindingOrigin.ForStatement);
                break;
            case Token.ConstKeyword:
                nextToken(parser, context);
                declarations = parseVariableDeclarationList(parser, context & ~Context.In, BindingType.Let, BindingOrigin.ForStatement);
                break;
            case Token.LetKeyword:
                nextToken(parser, context);
                declarations = parseVariableDeclarationList(parser, context & ~Context.In, BindingType.Const, BindingOrigin.ForStatement);
                break;
            default:
                init = parseAssignmentExpression(parser, context & ~Context.In);
        }

        if (declarations) {
            init = {
                type: 'VariableDeclaration',
                kind: tokenDesc(token) as 'var' | 'let' | 'const',
                declarations
            };
        }
    }

    if (awaitToken ? expect(parser, context, Token.OfKeyword) : consume(parser, context, Token.OfKeyword)) {
        type = 'ForOfStatement';
        if (init) reinterpret(parser, init); else init = declarations;
        right = parseExpression(parser, context | Context.In);
    } else if (consume(parser, context, Token.InKeyword)) {
        type = 'ForInStatement';
        if (init) reinterpret(parser, init); else init = declarations;
        right = parseAssignmentExpression(parser, context | Context.In);
    } else {
        const hasComma = parser.token === Token.Comma;
        if (parser.token === Token.Comma) init = parseSequenceExpression(parser, context, init );
        expect(parser, context, Token.Semicolon);
        if (parser.token !== Token.Semicolon) {
            test = parseExpression(parser, context);
        }
        expect(parser, context, Token.Semicolon);
        if (parser.token !== Token.RightParen) update = parseExpression(parser, context | Context.In);
    }

    expect(parser, context, Token.RightParen);

    const body = parseStatement(parser, context);

    return type === 'ForOfStatement' ?
        {
            type,
            body,
            left: init,
            right,
            await: awaitToken
        } :
        right ?
        {
            type: type as 'ForInStatement',
            body,
            left: init,
            right
        } :
        {
            type: type as 'ForStatement',
            body,
            init,
            test,
            update
        };
}