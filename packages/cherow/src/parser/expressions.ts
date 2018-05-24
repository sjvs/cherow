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
    nextToken
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
    const expr = parseAssignmentExpression(parser, context);
    while (parser.token === Token.Comma) {}
    return expr;
}

export function parseAssignmentExpression(parser: Parser, context: Context): any {
    let isParenthesized = parser.token === Token.LeftParen;
    const expr = parseConditionalExpression(parser, context);
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
    const expr = parsePrimaryExpression(parser, context | Context.In);
    
    while (true) {
        switch (parser.token) {
            case Token.LeftBracket: break;
            case Token.LeftParen: break;
            case Token.Period: break;
            case Token.TemplateSpan: break;
            case Token.TemplateTail: break;
            default: return expr;
        }
    }
}

export function parsePrimaryExpression(parser: Parser, context: Context): any {
    switch (parser.token) {
        case Token.FunctionKeyword: 
            return parseFunctionExpression(parser, context & ~Context.Async);
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
 * Parses function expression
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-FunctionExpression)
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function parseFunctionExpression(parser: Parser, context: Context): ESTree.FunctionExpression {
    expect(parser, context, Token.FunctionKeyword);
    const isGenerator = consume(parser, context, Token.Multiply) ? ModifierState.Generator : ModifierState.None;
    let id: ESTree.Identifier | null = null;
    if (parser.token & Token.IsKeyword) {
        id = parseBindingIdentifier(parser, context);
    }
    context = swapContext(context, isGenerator);
    const { params, body } = parseFormalListAndBody(parser, context);
    expect(parser, context, Token.RightBrace);
    return {
        type: 'FunctionExpression',
        body,
        params,
        async: false,
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