import { Location, report, Errors, Token, tokenDesc, Parser, Flags, ESTree, Context, tolerant } from 'cherow';
import { parseBindingIdentifier } from './pattern';
import { parseStatementListItem, parseVariableStatement, parseDirective, parseConstOrEnumDeclaration } from './statements';
import { parseExpressionOrDeclareStatement, parseTypeAlias, parseEnumDeclaration } from './typescript';
import { parseEntityName } from './annotations';
import {
  parseIdentifierName,
  parseLiteral,
  parseIdentifier,
  parseAssignmentExpression,
  parseDecorators
} from './expressions';
import {
  parseClassDeclaration,
  parseFunctionDeclaration,
  parseAsyncFunctionOrAsyncGeneratorDeclaration
} from './declarations';
import {
  expect,
  finishNode,
  nextToken,
  consume,
  getLocation,
  consumeSemicolon,
  lookahead,
  nextTokenIsFuncKeywordOnSameLine,
  nextTokenIsLeftParenOrPeriod,
  setPendingError,
  hasBit,
  TypeScriptContext,
  nextTokenIsLeftParen,
  nextTokenIsAssignToken
} from '../utilities';

// 15.2 Modules

/**
* Parse module item list
*
* @see [Link](https://tc39.github.io/ecma262/#prod-ModuleItemList)
*
* @param parser  Parser object
* @param context Context masks
*/
export function parseModuleItemList(parser: Parser, context: Context): (ReturnType < typeof parseDirective | typeof parseModuleItem >)[] {

  // Prime the scanner
  nextToken(parser, context);

  const statements: (ReturnType < typeof parseDirective | typeof parseModuleItem >)[] = [];

  while (parser.token !== Token.EndOfSource) {
      statements.push(parser.token === Token.StringLiteral ?
          parseDirective(parser, context) :
          parseModuleItem(parser, context | Context.AllowIn));
  }

  return statements;
}

/**
* Parse module item
*
* @see [Link](https://tc39.github.io/ecma262/#prod-ModuleItem)
*
* @param parser  Parser object
* @param context Context masks
*/
export function parseModuleItem(parser: Parser, context: Context): any {
  switch (parser.token) {

      // @decorator
      case Token.At:
          return parseDecorators(parser, context);

          // ExportDeclaration
      case Token.ExportKeyword:
          return parseExportDeclaration(parser, context);

          // ImportDeclaration
      case Token.ImportKeyword:
          // 'Dynamic Import' or meta property disallowed here
          if (!(context & Context.OptionsNext && lookahead(parser, context, nextTokenIsLeftParenOrPeriod))) {
              return parseImportDeclaration(parser, context);
          }

      default:
          return parseStatementListItem(parser, context);
  }
}

/**
* Parse export declaration
*
* @see [Link](https://tc39.github.io/ecma262/#prod-ExportDeclaration)
*
* @param parser  Parser object
* @param context Context masks
*/
export function parseExportDeclaration(parser: Parser, context: Context): ESTree.ExportAllDeclaration | ESTree.ExportNamedDeclaration | ESTree.ExportDefaultDeclaration {

  const pos = getLocation(parser);
  const specifiers: ESTree.ExportSpecifier[] = [];

  let source = null;
  let declaration: ESTree.Statement | null = null;

  expect(parser, context | Context.DisallowEscapedKeyword, Token.ExportKeyword);

  switch (parser.token) {

      // export * FromClause ;
      case Token.Multiply:
          return parseExportAllDeclaration(parser, context, pos);

      case Token.DefaultKeyword:
          return parseExportDefault(parser, context, pos);

      case Token.LeftBrace:
          {
              // export ExportClause FromClause ;
              // export ExportClause ;
              expect(parser, context, Token.LeftBrace);

              let hasReservedWord = false;

              while (parser.token !== Token.RightBrace) {
                  if (parser.token & Token.Reserved) {
                      hasReservedWord = true;
                      setPendingError(parser);
                  }
                  specifiers.push(parseNamedExportDeclaration(parser, context));
                  if (parser.token !== Token.RightBrace) expect(parser, context, Token.Comma);
              }

              expect(parser, context | Context.DisallowEscapedKeyword, Token.RightBrace);

              if (parser.token === Token.FromKeyword) {
                  source = parseModuleSpecifier(parser, context);
                  //  The left hand side can't be a keyword where there is no
                  // 'from' keyword since it references a local binding.
              } else if (hasReservedWord) {
                  tolerant(parser, context, Errors.UnexpectedReserved);
              }

              consumeSemicolon(parser, context);

              break;
          }

      case Token.ImportKeyword:
          declaration = parseImportEqualsDeclaration(parser, context, true);
          break;

      case Token.NameSpaceKeyword:
          declaration = parseModuleOrNamespaceDeclaration(parser, context);
          break;

      case Token.DeclareKeyword:
          declaration = parseExportNamedDeclaration(parser, context | TypeScriptContext.Declared);
          break;

      case Token.InterfaceKeyword:
          declaration = parseExportNamedDeclaration(parser, context);
          break;

      case Token.ModuleKeyword:
          declaration = parseModuleDeclaration(parser, context);
          break;

      case Token.EnumKeyword:
          nextToken(parser, context);
          declaration = parseEnumDeclaration(parser, context);
          break;

      case Token.TypeKeyword:
          nextToken(parser, context);
          declaration = parseTypeAlias(parser, context);
          break;

          // `export = x;`
      case Token.Assign:
          return parseExportAssignment(parser, context);

          // `export as namespace A;`
      case Token.AsKeyword:
          return parseNamespaceExportDeclaration(parser, context);

          // export ClassDeclaration
      case Token.ClassKeyword:
          declaration = parseClassDeclaration(parser, context);
          break;

          // export LexicalDeclaration
      case Token.ConstKeyword:
          declaration = parseConstOrEnumDeclaration(parser, context | Context.BlockScope);
          break;

      case Token.LetKeyword:
          declaration = parseVariableStatement(parser, context | Context.BlockScope);
          break;

          // export VariableDeclaration
      case Token.VarKeyword:
          declaration = parseVariableStatement(parser, context);
          break;

          // export HoistableDeclaration
      case Token.FunctionKeyword:
          declaration = parseFunctionDeclaration(parser, context);
          break;

          // export HoistableDeclaration
      case Token.AsyncKeyword:
          if (lookahead(parser, context, nextTokenIsFuncKeywordOnSameLine)) {
              declaration = parseAsyncFunctionOrAsyncGeneratorDeclaration(parser, context);
              break;
          }
          // Falls through
      default:
          report(parser, Errors.UnexpectedToken, tokenDesc(parser.token));
  }

  return finishNode(context, parser, pos, {
          type: 'ExportNamedDeclaration',
          source,
          specifiers,
          declaration,
      } as any);
}

/**
* Parse export all declaration
*
* @param parser  Parser object
* @param context Context masks
*/
function parseExportAllDeclaration(parser: Parser, context: Context, pos: Location): ESTree.ExportAllDeclaration {
  expect(parser, context, Token.Multiply);
  const source = parseModuleSpecifier(parser, context);
  consumeSemicolon(parser, context);
  return finishNode(context, parser, pos, {
      type: 'ExportAllDeclaration',
      source,
  });
}

/**
* Parse named export declaration
*
* @param parser  Parser object
* @param context Context masks
*/
function parseNamedExportDeclaration(parser: Parser, context: Context): ESTree.ExportSpecifier {
  const pos = getLocation(parser);
  // ExportSpecifier :
  // IdentifierName
  // IdentifierName as IdentifierName
  const local = parseIdentifierName(parser, context | Context.DisallowEscapedKeyword, parser.token);
  const exported = consume(parser, context, Token.AsKeyword) ?
      parseIdentifierName(parser, context, parser.token) :
      local;
  return finishNode(context, parser, pos, {
      type: 'ExportSpecifier',
      local,
      exported,
  });
}

/**
* Parse export default
*
* @see [Link](https://tc39.github.io/ecma262/#prod-HoistableDeclaration)
* @see [Link](https://tc39.github.io/ecma262/#prod-ClassDeclaration)
* @see [Link](https://tc39.github.io/ecma262/#prod-HoistableDeclaration)
*
* @param parser  Parser object
* @param context Context masks
* @param pos Location
*/
function parseExportDefault(parser: Parser, context: Context, pos: Location): ESTree.ExportDefaultDeclaration {

  expect(parser, context | Context.DisallowEscapedKeyword, Token.DefaultKeyword);

  let declaration: ESTree.FunctionDeclaration | ESTree.ClassDeclaration | ESTree.Expression;

  switch (parser.token) {

      // export default HoistableDeclaration[Default]
      case Token.FunctionKeyword:
          declaration = parseFunctionDeclaration(parser, context | Context.RequireIdentifier);
          break;

          // export default ClassDeclaration[Default]
          // export default  @decl ClassDeclaration[Default]
      case Token.At:
      case Token.ClassKeyword:
          declaration = parseClassDeclaration(parser, context & ~Context.AllowIn | Context.RequireIdentifier);
          break;

          // export default HoistableDeclaration[Default]
      case Token.AsyncKeyword:
          declaration = parseAsyncFunctionOrAssignmentExpression(parser, context | Context.RequireIdentifier);
          break;

      default:
          {
              // export default [lookahead ∉ {function, class}] AssignmentExpression[In] ;
              declaration = parseAssignmentExpression(parser, context | Context.AllowIn);
              consumeSemicolon(parser, context);
          }
  }

  return finishNode(context, parser, pos, {
      type: 'ExportDefaultDeclaration',
      declaration,
  });
}

/**
* Parse import declaration
*
* @see [Link](https://tc39.github.io/ecma262/#prod-ImportDeclaration)
*
* @param parser  Parser object
* @param context Context masks
*/

export function parseImportDeclaration(parser: Parser, context: Context): ESTree.ImportDeclaration {

  const pos = getLocation(parser);

  expect(parser, context, Token.ImportKeyword);

  let source: ESTree.Literal;
  let specifiers: ESTree.Specifiers[] = [];

  // 'import' ModuleSpecifier ';'
  if (parser.token === Token.StringLiteral) {
      source = parseLiteral(parser, context);
  } else {
    if (parser.token & Token.IsIdentifier && lookahead(parser, context, nextTokenIsAssignToken)) {
     return parseImportEqualsDeclaration(parser, context);
    }
    specifiers = parseImportClause(parser, context | Context.DisallowEscapedKeyword);
    source = parseModuleSpecifier(parser, context);
  }

  consumeSemicolon(parser, context);

  return finishNode(context, parser, pos, {
      type: 'ImportDeclaration',
      specifiers,
      source,
  });
}

/**
* Parse import clause
*
* @see [Link](https://tc39.github.io/ecma262/#prod-ImportClause)
*
* @param parser  Parser object
* @param context Context masks
*/

function parseImportClause(parser: Parser, context: Context): ESTree.Specifiers[] {

  const specifiers: ESTree.Specifiers[] = [];

  switch (parser.token) {

      // 'import' ModuleSpecifier ';'
      case Token.Identifier:
          {

              specifiers.push(parseImportDefaultSpecifier(parser, context));

              if (consume(parser, context, Token.Comma)) {
                  switch (parser.token) {
                      // import a, * as foo
                      case Token.Multiply:
                          parseImportNamespaceSpecifier(parser, context, specifiers);
                          break;
                          // import a, {bar}
                      case Token.LeftBrace:
                          parseNamedImports(parser, context, specifiers);
                          break;
                      default:
                          tolerant(parser, context, Errors.UnexpectedToken, tokenDesc(parser.token));
                  }
              }

              break;
          }

          // import {bar}
      case Token.LeftBrace:
          parseNamedImports(parser, context, specifiers);
          break;

          // import * as foo
      case Token.Multiply:
          parseImportNamespaceSpecifier(parser, context, specifiers);
          break;

      default:
          report(parser, Errors.UnexpectedToken, tokenDesc(parser.token));
  }
  return specifiers;
}

/**
* Parse named imports
*
* @see [Link](https://tc39.github.io/ecma262/#prod-NamedImports)
*
* @param parser  Parser object
* @param context Context masks
*/

function parseNamedImports(parser: Parser, context: Context, specifiers: ESTree.Specifiers[]): any {

  expect(parser, context, Token.LeftBrace);

  while (parser.token !== Token.RightBrace) {
      specifiers.push(parseImportSpecifier(parser, context));
      if (parser.token !== Token.RightBrace) {
          expect(parser, context, Token.Comma);
      }
  }

  expect(parser, context, Token.RightBrace);
}

/**
* Parse import specifier
*
* @see [Link](https://tc39.github.io/ecma262/#prod-ImportSpecifier)
*
* @param parser  Parser object
* @param context Context masks
*/

function parseImportSpecifier(parser: Parser, context: Context): ESTree.ImportSpecifier {

  const pos = getLocation(parser);
  const {
      token
  } = parser;
  const imported = parseIdentifierName(parser, context | Context.DisallowEscapedKeyword, token);

  let local: ESTree.Identifier;

  if (parser.token === Token.AsKeyword) {
      expect(parser, context, Token.AsKeyword);
      local = parseBindingIdentifier(parser, context);
  } else {
      // An import name that is a keyword is a syntax error if it is not followed
      // by the keyword 'as'.
      if (hasBit(token, Token.Reserved)) tolerant(parser, context, Errors.UnexpectedReserved);
      if (hasBit(token, Token.IsEvalOrArguments)) tolerant(parser, context, Errors.StrictEvalArguments);
      local = imported;
  }

  return finishNode(context, parser, pos, {
      type: 'ImportSpecifier',
      local,
      imported,
  });
}

/**
* Parse binding identifier
*
* @see [Link](https://tc39.github.io/ecma262/#prod-NameSpaceImport)
*
* @param parser  Parser object
* @param context Context masks
*/

function parseImportNamespaceSpecifier(parser: Parser, context: Context, specifiers: ESTree.Specifiers[]): any {
  const pos = getLocation(parser);
  expect(parser, context, Token.Multiply);
  expect(parser, context, Token.AsKeyword, Errors.AsAfterImportStart);
  const local = parseBindingIdentifier(parser, context);
  specifiers.push(finishNode(context, parser, pos, {
      type: 'ImportNamespaceSpecifier',
      local,
  }));
}

/**
* Parse binding identifier
*
* @see [Link](https://tc39.github.io/ecma262/#prod-BindingIdentifier)
*
* @param parser  Parser object
* @param context Context masks
*/
function parseModuleSpecifier(parser: Parser, context: Context): ESTree.Literal {
  // ModuleSpecifier :
  //   StringLiteral
  expect(parser, context, Token.FromKeyword);
  if (parser.token !== Token.StringLiteral) report(parser, Errors.UnexpectedToken, tokenDesc(parser.token));
  return parseLiteral(parser, context);
}

/**
* Parse import default specifier
*
* @see [Link](https://tc39.github.io/ecma262/#prod-BindingIdentifier)
*
* @param parser  Parser object
* @param context Context masks
*/
function parseImportDefaultSpecifier(parser: Parser, context: Context): ESTree.ImportDefaultSpecifier {
  return finishNode(context, parser, getLocation(parser), {
      type: 'ImportDefaultSpecifier',
      local: parseIdentifier(parser, context),
  });
}

/**
* Parses either async function or assignment expression
*
* @see [Link](https://tc39.github.io/ecma262/#prod-AssignmentExpression)
* @see [Link](https://tc39.github.io/ecma262/#prod-AsyncFunctionDeclaration)
* @see [Link](https://tc39.github.io/ecma262/#prod-AsyncGeneratorDeclaration)
*
* @param parser  Parser object
* @param context Context masks
*/
function parseAsyncFunctionOrAssignmentExpression(parser: Parser, context: Context): ESTree.FunctionDeclaration | ESTree.AssignmentExpression {
  return lookahead(parser, context, nextTokenIsFuncKeywordOnSameLine) ?
      parseAsyncFunctionOrAsyncGeneratorDeclaration(parser, context | Context.RequireIdentifier) :
      parseAssignmentExpression(parser, context | Context.AllowIn) as any;
}

/**
* Parses namespace export declaration
*
* @param parser  Parser object
* @param context Context masks
*/
function parseNamespaceExportDeclaration(parser: Parser, context: Context): any {
  const pos = getLocation(parser);
  expect(parser, context, Token.AsKeyword);
  expect(parser, context, Token.NameSpaceKeyword);
  const id = parseIdentifier(parser, context) as any;
  consumeSemicolon(parser, context);
  return finishNode(context, parser, pos, {
          type: 'TSNamespaceExportDeclaration',
          id
      } as any);
}

/**
* Parses export assignment
*
* @param parser  Parser object
* @param context Context masks
*/
function parseExportAssignment(parser: Parser, context: Context): any {
  const pos = getLocation(parser);
  expect(parser, context, Token.Assign);
  const expression = parseAssignmentExpression(parser, context);
  consumeSemicolon(parser, context);
  return finishNode(context, parser, pos, {
          type: 'TsExportAssignment ',
          expression
      } as any);
}

/**
 * Parses export assignment
 *
 * @param parser  Parser object
 * @param context Context masks
 */

export function parseModuleOrNamespaceDeclaration(parser: Parser, context: Context): any {
  const pos = getLocation(parser);
  expect(parser, context, Token.NameSpaceKeyword);
  const id = parseIdentifier(parser, context);
  let body: any;
  if (consume(parser, context, Token.Period)) {
      body = parseModuleOrNamespaceDeclaration(parser, context);
  } else {
      body = parseModuleBlock(parser, context);
  }
  consumeSemicolon(parser, context);
  return finishNode(context, parser, pos, {
          type: 'TSModuleDeclaration ',
          id,
          body
      } as any);
}

/**
 * Parses module block
 *
 * @param parser Parser object
 * @param context Context mask
 */
export function parseModuleBlock(parser: Parser, context: Context): any {
  const pos = getLocation(parser);
  expect(parser, context, Token.LeftBrace);
  const body: (ReturnType < typeof parseDirective | typeof parseModuleItem >)[] = [];

  while (parser.token !== Token.RightBrace) {
      body.push(parser.token === Token.StringLiteral ?
          parseDirective(parser, context) :
          parseModuleItem(parser, context | Context.AllowIn));
  }
  expect(parser, context, Token.RightBrace);
  return finishNode(context, parser, pos, {
          type: 'TSModuleBlock',
          body
      } as any);
}

/**
 * Parses export name declaration
 *
 * @param parser Parser object
 * @param context Context mask
 */
export function parseExportNamedDeclaration(parser: Parser, context: Context): any {

  const isDeclare = consume(parser, context, Token.DeclareKeyword);
  const pos = getLocation(parser);
  const specifiers: ESTree.ExportSpecifier[] = [];

  let source = null;
  let declaration: ESTree.Statement | null = null;

  switch (parser.token) {

      case Token.ModuleKeyword:

          declaration = parseModuleDeclaration(parser, context);
          break;

      case Token.Identifier:
      case Token.TypeKeyword:
      case Token.InterfaceKeyword:

          declaration = parseExpressionOrDeclareStatement(parser, context);
          break;

          // export * FromClause ;
      case Token.Multiply:
          return parseExportAllDeclaration(parser, context, pos);

      case Token.DefaultKeyword:
          return parseExportDefault(parser, context, pos);

      case Token.LeftBrace:
          {
              // export ExportClause FromClause ;
              // export ExportClause ;
              expect(parser, context, Token.LeftBrace);

              let hasReservedWord = false;

              while (parser.token !== Token.RightBrace) {
                  if (parser.token & Token.Reserved) {
                      hasReservedWord = true;
                      setPendingError(parser);
                  }
                  specifiers.push(parseNamedExportDeclaration(parser, context));
                  if (parser.token !== Token.RightBrace) expect(parser, context, Token.Comma);
              }

              expect(parser, context | Context.DisallowEscapedKeyword, Token.RightBrace);

              if (parser.token === Token.FromKeyword) {
                  source = parseModuleSpecifier(parser, context);
                  //  The left hand side can't be a keyword where there is no
                  // 'from' keyword since it references a local binding.
              } else if (hasReservedWord) {
                  tolerant(parser, context, Errors.UnexpectedReserved);
              }

              consumeSemicolon(parser, context);

              break;
          }

      case Token.NameSpaceKeyword:
          declaration = parseModuleOrNamespaceDeclaration(parser, context);
          break;
      case Token.DeclareKeyword:
          declaration = parseExportNamedDeclaration(parser, context);
          break;
      case Token.ImportKeyword:
          // `export = x;`
      case Token.Assign:
          return parseExportAssignment(parser, context);

          // `export as namespace A;`
      case Token.AsKeyword:
          return parseNamespaceExportDeclaration(parser, context);

          // export ClassDeclaration
      case Token.ClassKeyword:
          declaration = parseClassDeclaration(parser, context);
          break;

          // export LexicalDeclaration
      case Token.LetKeyword:
      case Token.ConstKeyword:
          declaration = parseVariableStatement(parser, context | Context.BlockScope);
          break;

          // export VariableDeclaration
      case Token.VarKeyword:
          declaration = parseVariableStatement(parser, context);
          break;

          // export HoistableDeclaration
      case Token.FunctionKeyword:
          declaration = parseFunctionDeclaration(parser, context);
          break;

          // export HoistableDeclaration
      case Token.AsyncKeyword:
          if (lookahead(parser, context, nextTokenIsFuncKeywordOnSameLine)) {
              declaration = parseAsyncFunctionOrAsyncGeneratorDeclaration(parser, context);
              break;
          }
          // Falls through
      default:
          report(parser, Errors.UnexpectedToken, tokenDesc(parser.token));
  }

  return finishNode(context, parser, pos, {
          type: 'ExportNamedDeclaration',
          source,
          specifiers,
          declaration,
          declare: true
      } as any);
}

/**
* Parses export assignment
*
* @param parser  Parser object
* @param context Context masks
*/

export function parseModuleDeclaration(parser: Parser, context: Context): any {
  const pos = getLocation(parser);
  expect(parser, context, Token.ModuleKeyword);
  const id = parseIdentifier(parser, context);
  let body: any;
  if (consume(parser, context, Token.Period)) {
      body = parseModuleOrNamespaceDeclaration(parser, context);
  } else {
      body = parseModuleBlock(parser, context);
  }
  consumeSemicolon(parser, context);
  return finishNode(context, parser, pos, {
          type: 'TSModuleDeclaration ',
          id,
          body
      } as any);
}

/**
 * Parses external module reference
 *
 * @param parser  Parser object
 * @param context Context masks
 */

function parseExternalModuleReference(parser: Parser, context: Context): any {
  const pos = getLocation(parser);
  expect(parser, context, Token.RequireKeyword);
  expect(parser, context, Token.LeftParen);
  if (parser.token !== Token.StringLiteral) report(parser, Errors.Unexpected);
  const expression = parseLiteral(parser, context);
  expect(parser, context, Token.RightParen);
  return finishNode(context, parser, pos, {
    type: 'TSExternalModuleReference',
    expression
  } as any);
}

export function parseEntityName1(parser: Parser, context: Context): any {
  const pos = getLocation(parser);
  let entity = parseIdentifier(parser, context);

  while (consume(parser, context, Token.Period)) {
    entity = finishNode(context, parser, pos, {
      type: 'TSQualifiedName',
      left: entity,
      right: parseIdentifier(parser, context)
    } as any);
  }

  return entity;
}

/**
 * Parses module reference
 *
 * @param parser  Parser object
 * @param context Context masks
 */
function parseModuleReference(parser: Parser, context: Context): any {
  return parser.token === Token.RequireKeyword && lookahead(parser, context, nextTokenIsLeftParen)
    ? parseExternalModuleReference(parser, context)
    : parseEntityName1(parser, context);
}

/**
 * Parses external module reference
 *
 * @param parser  Parser object
 * @param context Context masks
 */
function parseImportEqualsDeclaration(parser: Parser, context: Context, isExport: boolean = false): any {
  const pos = getLocation(parser);
  consume(parser, context, Token.ImportKeyword);
  const id = parseIdentifier(parser, context);
  expect(parser, context, Token.Assign);
  const moduleReference: any = parseModuleReference(parser, context);
  consumeSemicolon(parser, context);
  return finishNode(context, parser, pos, {
    type: 'TSImportEqualsDeclaration',
    id,
    isExport,
    moduleReference
  } as any);
}
