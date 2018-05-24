import { AssignmentProperty } from './../estree';
import { Parser } from '../types';
import { Token, tokenDesc } from '../token';
import * as ESTree from '../estree';
import { parseBinding, parseBindingIdentifier } from './pattern';
import { parseStatementListItem } from './statements';
import {
    Context,
    Flags,
    BindingOrigin,
    BindingType,
    ModifierState,
    setContext,
    swapContext,
    consume,
    expect,
    nextToken,
    nextTokenIsLeftParen,
    lookahead,
    nextTokenIsArrow
} from '../common';


/**
 * Expression :
 *   AssignmentExpression
 *   Expression , AssignmentExpression
 *
 * ExpressionNoIn :
 *   AssignmentExpressionNoIn
 *   ExpressionNoIn , AssignmentExpressionNoIn
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-Expression)
 *
 * @param parser Parser object
 * @param context Context masks
 */
export function parseExpression(parser: Parser, context: Context): ESTree.Expression {
    const left = parseAssignmentExpression(parser, context);
    if (parser.token !== Token.Comma) return left;
    const expressions: ESTree.Expression[] = [left];
    while (consume(parser, context, Token.Comma)) {
        expressions.push(parseAssignmentExpression(parser, context));
    }
    return {
        type: 'SequenceExpression',
        expressions,
    };
}

export function parseAssignmentExpression(parser: Parser, context: Context): any {
    // AssignmentExpression ::
    //   ConditionalExpression
    //   ArrowFunction
    //   YieldExpression
    //   LeftHandSideExpression AssignmentOperator AssignmentExpression
    const { token } = parser;
    const isAsync = parser.token === Token.AsyncKeyword && /*(parser.flags & Flags.NewLine) !== Flags.NewLine && */
        lookahead(parser, context, nextTokenIsLeftParen);
    let isParenthesized = parser.token === Token.LeftParen;
    let expr: any = parseConditionalExpression(parser, context);
    console.log(isAsync)
    if (isAsync && (parser.token & Token.Identifier) === Token.Identifier && lookahead(parser, context, nextTokenIsArrow)) {
        consume(parser, context, Token.AsyncKeyword)
        expr = parseIdentifier(parser, context);
    }

    if (parser.token === Token.Arrow) {
        return parseArrowFunction(parser, context, isAsync ? ModifierState.Async : ModifierState.None, expr);
    }
    if ((parser.flags & Flags.IsAssignable) === Flags.IsAssignable &&
        (parser.token & Token.IsAssignOp) === Token.IsAssignOp) {
        // TODO
    }
    return expr;
}

/**
 * Parse conditional expression
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-ConditionalExpression)
 *
 * @param parser Parser object
 * @param context Context masks
 */

function parseConditionalExpression(parser: Parser, context: Context): ESTree.Expression | ESTree.ConditionalExpression {
     // ConditionalExpression ::
     // LogicalOrExpression
     // LogicalOrExpression '?' AssignmentExpression ':' AssignmentExpression
    const test = parseBinaryExpression(parser, context, 0);
    if (!consume(parser, context, Token.QuestionMark)) return test;
    const consequent = parseAssignmentExpression(parser, context | Context.In);
    expect(parser, context, Token.Colon);
    const alternate = parseAssignmentExpression(parser, context);
    return {
        type: 'ConditionalExpression',
        test,
        consequent,
        alternate,
    };
}

/**
 * Parse binary expression.
 *
 * @see [Link](https://tc39.github.io/ecma262/#sec-exp-operator)
 * @see [Link](https://tc39.github.io/ecma262/#sec-binary-logical-operators)
 * @see [Link](https://tc39.github.io/ecma262/#sec-additive-operators)
 * @see [Link](https://tc39.github.io/ecma262/#sec-bitwise-shift-operators)
 * @see [Link](https://tc39.github.io/ecma262/#sec-equality-operators)
 * @see [Link](https://tc39.github.io/ecma262/#sec-binary-logical-operators)
 * @see [Link](https://tc39.github.io/ecma262/#sec-relational-operators)
 * @see [Link](https://tc39.github.io/ecma262/#sec-multiplicative-operators)
 *
 * @param parser Parser object
 * @param context Context masks
 * @param minPrec Minimum precedence value
 * @param pos Line / Column info
 * @param Left Left hand side of the binary expression
 */
function parseBinaryExpression(
    parser: Parser,
    context: Context,
    minPrec: number,
    left: any = parseUnaryExpression(parser, context),
): ESTree.Expression {

    // Shift-reduce parser for the binary operator part of the JS expression
    // syntax.
    const bit = context & Context.In ^ Context.In;
    while ((parser.token & Token.IsBinaryOp) === Token.IsBinaryOp) {
        const t: Token = parser.token;
        const prec = t & Token.Precedence;
        const delta = ((t === Token.Exponentiate) as any) << Token.PrecStart;
        if (bit && t === Token.InKeyword) break;
        // When the next token is no longer a binary operator, it's potentially the
        // start of an expression, so we break the loop
        if (prec + delta <= minPrec) break;
        nextToken(parser, context);

        left = {
            type: t & Token.IsLogical ? 'LogicalExpression' : 'BinaryExpression',
            left,
            right: parseBinaryExpression(parser, context & ~Context.In, prec),
            operator: tokenDesc(t),
        };
    }

    return left;
}

function parseUnaryExpression(parser: Parser, context: Context): any {
    // UnaryExpression ::
    //   PostfixExpression
    //   'delete' UnaryExpression
    //   'void' UnaryExpression
    //   'typeof' UnaryExpression
    //   '++' UnaryExpression
    //   '--' UnaryExpression
    //   '+' UnaryExpression
    //   '-' UnaryExpression
    //   '~' UnaryExpression
    //   '!' UnaryExpression
    //   [+Await] AwaitExpression[?Yield]
    const { token } = parser;

    if ((token & Token.IsUnaryOp) === Token.IsUnaryOp) {
        nextToken(parser, context);
        const argument: ESTree.Expression = parseUnaryExpression(parser, context);
        return {
            type: 'UnaryExpression',
            operator: tokenDesc(token),
            argument,
            prefix: true,
        };
    }

    return parseUpdateExpression(parser, context);
}

/**
 * Parses update expression
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-UpdateExpression)
 *
 * @param parser Parser object
 * @param context Context masks
 */
function parseUpdateExpression(parser: Parser, context: Context): any {
     // UpdateExpression ::
     //   LeftHandSideExpression ('++' | '--')?
    const { token } = parser;

    if ((parser.token & Token.IsUpdateOp) === Token.IsUpdateOp) {
        nextToken(parser, context);
        const expr = parseLeftHandSideExpression(parser, context);
        return {
            type: 'UpdateExpression',
            argument: expr,
            operator: tokenDesc(token as Token),
            prefix: true,
        };
    }

    const expression = parseLeftHandSideExpression(parser, context);

    if ((parser.token & Token.IsUpdateOp) === Token.IsUpdateOp && !(parser.flags & Flags.NewLine)) {
        const operator = parser.token;
        nextToken(parser, context);
        return {
            type: 'UpdateExpression',
            argument: expression,
            operator: tokenDesc(operator as Token),
            prefix: false,
        };
    }

    return expression;
}

/**
 * Parse left hand side expression
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-LeftHandSideExpression)
 *
 * @param Parser Parer instance
 * @param Context Contextmasks
 * @param pos Location info
 */

export function parseLeftHandSideExpression(parser: Parser, context: Context): any {
     // LeftHandSideExpression ::
     //   (NewExpression | MemberExpression) ...
    let expr: any = parsePrimaryExpression(parser, context | Context.In);
    while (true) {
        switch (parser.token) {
            case Token.LeftBracket: break;
            case Token.LeftParen: {
                const args = parseArgumentList(parser, context);
                if (parser.token === Token.Arrow) return args;
                expr = {
                    type: 'CallExpression',
                    callee: expr,
                    arguments: args,
                };
                break;
            }
            case Token.Period: break;
            case Token.TemplateSpan: break;
            case Token.TemplateTail: break;
            default: return expr;
        }
    }
}

/**
 * Parse argument list
 *
 * @see [https://tc39.github.io/ecma262/#prod-ArgumentList)
 *
 * @param Parser Parser object
 * @param Context Context masks
 */
function parseArgumentList(parser: Parser, context: Context): (ESTree.Expression | ESTree.SpreadElement)[] {
    // ArgumentList :
    //   AssignmentOrSpreadExpression
    //   ArgumentList , AssignmentOrSpreadExpression
    //
    // AssignmentOrSpreadExpression :
    //   ... AssignmentExpression
    //   AssignmentExpression
    expect(parser, context, Token.LeftParen);
    const expressions: (ESTree.Expression | ESTree.SpreadElement)[] = [];
    while (parser.token !== Token.RightParen) {
        if (parser.token === Token.Ellipsis) {
            expressions.push(parseSpreadElement(parser, context));
        } else {
            expressions.push(parseAssignmentExpression(parser, context | Context.In));
        }

        if (parser.token !== Token.RightParen) expect(parser, context, Token.Comma);
    }

    expect(parser, context, Token.RightParen);
    return expressions;
}

export function parsePrimaryExpression(parser: Parser, context: Context): any {
    switch (parser.token) {
        case Token.FunctionKeyword: 
            return parseFunctionExpression(parser, context & ~Context.Async);
            case Token.LeftParen:
            return parseParenthesizedExpression(parser, context, ModifierState.None);
        case Token.LeftBracket:
            return parseArrayLiteral(parser, context);
        case Token.AsyncKeyword:
        case Token.Identifier:
            return parseIdentifier(parser, context);
        default:    nextToken(parser, context);
    }
}

export function parseIdentifier(parser: Parser, context: Context): ESTree.Identifier {
    const { tokenValue } = parser;
    nextToken(parser, context);
    return {
        type: 'Identifier',
        name: tokenValue
    };
}

/**
 * Parse arrow function
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-ArrowFunction)
 *
 * @param parser Parser object
 * @param context Context masks
 */
function parseArrowFunction(
    parser: Parser, 
    context: Context, 
    state: ModifierState, 
    params: any[]): ESTree.ArrowFunctionExpression  {
    expect(parser, context, Token.Arrow);
    context = swapContext(context, state);
    let body: any;
    const expression = parser.token !== Token.LeftBrace;
    if (!expression) {
        body = parseFunctionBody(parser, context);
    } else {
        body = parseAssignmentExpression(parser, context);
    }

    return {
        type: 'ArrowFunctionExpression',
        body,
        params,
        id: null,
        async: !!(state & ModifierState.Async),
        generator: false,
        expression,
    };
}

/**
 * Parses cover parenthesized expression and arrow parameter list
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-parseCoverParenthesizedExpressionAndArrowParameterList)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
function parseParenthesizedExpression(parser: Parser, context: Context, state: ModifierState, id?: any): any {
    expect(parser, context, Token.LeftParen);
    if (consume(parser, context, Token.RightParen)) {
        if (parser.token === Token.Arrow) {
          //  return parseArrowFunction(parser, context, state, []);
          return [];
        } else if (state & ModifierState.Async) {
            return {
                type: 'CallExpression',
                callee: id,
                arguments: [],
            };
        }
    }
    const expr = parseExpression(parser, context);
    expect(parser, context, Token.RightParen);
    if (parser.token === Token.Arrow) {
        return expr.type === 'SequenceExpression' ? expr.expressions : [expr];
        // return parseArrowFunction(parser, context, state, params);
    }
    return expr;
}

/**
 * Parse array literal
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-ArrayLiteral)
 *
 * @param parser Parser object
 * @param context Context masks
 */

function parseArrayLiteral(parser: Parser, context: Context): ESTree.ArrayExpression {
    // ArrayLiteral :
    //   [ Elisionopt ]
    //   [ ElementList ]
    //   [ ElementList , Elisionopt ]
    //
    // ElementList :
    //   Elisionopt AssignmentExpression
    //   Elisionopt ... AssignmentExpression
    //   ElementList , Elisionopt AssignmentExpression
    //   ElementList , Elisionopt SpreadElement
    //
    // Elision :
    //   ,
    //   Elision ,
    //
    // SpreadElement :
    //   ... AssignmentExpression
    //
    //
    expect(parser, context, Token.LeftBracket);
    context = setContext(context, Context.In | Context.Asi);
    const elements: (ESTree.Expression | ESTree.SpreadElement | null)[] = [];
    while (parser.token !== Token.RightBracket) {
        if (consume(parser, context, Token.Comma)) {
            elements.push(null);
        } else if (parser.token === Token.Ellipsis) {
            elements.push(parseSpreadElement(parser, context));
            if (parser.token !== Token.RightBracket) {
                expect(parser, context, Token.Comma);
            }
        } else {
           elements.push(parseAssignmentExpression(parser, context | Context.In));
           if (parser.token !== Token.RightBracket) expect(parser, context, Token.Comma);
        }
    }

    expect(parser, context, Token.RightBracket);

    return {
        type: 'ArrayExpression',
        elements,
    };
}

/**
 * Parse spread element
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-SpreadElement)
 *
 * @param parser Parser object
 * @param context Context masks
 */
function parseSpreadElement(parser: Parser, context: Context): ESTree.SpreadElement {
    expect(parser, context, Token.Ellipsis);
    const argument = parseAssignmentExpression(parser, context | Context.In);
    return {
        type: 'SpreadElement',
        argument,
    };
}

/**
 * Parses function expression
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-FunctionExpression)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseFunctionExpression(
    parser: Parser, 
    context: Context, 
    state: ModifierState = ModifierState.None
): ESTree.FunctionExpression {
    expect(parser, context, Token.FunctionKeyword);
    const isGenerator = consume(parser, context, Token.Multiply) ? ModifierState.Generator : ModifierState.None;
    let id: ESTree.Identifier | null = null;
    if (parser.token & Token.IsKeyword) {
        id = parseBindingIdentifier(parser, context);
    }
    context = swapContext(context, state | isGenerator);
    const { params, body } = parseFormalListAndBody(parser, context);
    expect(parser, context, Token.RightBrace);
    return {
        type: 'FunctionExpression',
        body,
        params,
        async: !!(state & ModifierState.Async),
        generator: !!(isGenerator & ModifierState.Generator),
        expression: false,
        id
    };
}

/**
 * Parses formal parameters and function body.
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-FunctionBody)
 * @see [Link](https://tc39.github.io/ecma262/#prod-FormalParameters)
 *
 * @param parser Parser object
 * @param context Context masks
 */
function parseFormalListAndBody(parser: Parser, context: Context) {
    const params = parseFormalParameters(parser, context);
    const body = parseFunctionBody(parser, context);
    return { params, body }
}

/**
 * Parse formal parameters
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-FormalParameters)
 *
 * @param Parser object
 * @param Context masks
 * @param Optional objectstate. Default to none
 */
function parseFormalParameters(parser: Parser, context: Context) {
    context = context | Context.InParameter;
    expect(parser, context, Token.LeftParen);
    const args: any = [];
    parseBinding(parser, context, BindingType.Args, BindingOrigin.FunctionArgs, args);
    expect(parser, context, Token.RightParen);
    return args;
}

function parseFunctionBody(parser: Parser, context: Context): any {
    const body: ESTree.Statement[] = [];
    expect(parser, context, Token.LeftBrace);
    while (parser.token !== Token.RightBrace) {
        body.push(parseStatementListItem(parser, context));
    }
    expect(parser, context, Token.RightBrace);
    return {
        type: 'BlockStatement',
        body,
    };
}
  /**
   * Parse property name
   *
   * @see [Link](https://tc39.github.io/ecma262/#prod-PropertyName)
   *
   * @param parser Parser object
   * @param context Context masks
   */
  export function parsePropertyName(parser: Parser, context: Context): any {
    switch (parser.token) {
        case Token.NumericLiteral:
        case Token.StringLiteral:
            //  return parseLiteral(parser, context);
        case Token.LeftBracket:
            // return parseComputedPropertyName(parser, context);
        default:
            return parseIdentifier(parser, context);
    }
}