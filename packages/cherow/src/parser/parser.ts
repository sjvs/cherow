import { Token } from '../token';
import { Context, Flags } from '../common';
import { Parser } from '../types';
import * as ESTree from '../estree';
import { parseStatementList } from './statements';

export function createParserObject(source: string, errCallback?: any): Parser {
    return {
        source: source,
        length: source.length,
        flags: Flags.IsAssignable,
        token: Token.EndOfSource,
        nextToken: Token.EndOfSource,
        lastToken: Token.EndOfSource,
        startIndex: 0,
        index: 0,
        line: 1,
        column: 0,
        tokens: [],
        tokenValue: undefined,
        tokenRaw: '',
        tokenRegExp: undefined,
        onError: errCallback,
    };
}

/**
 * Creating the parser
 *
 * @param source The source coode to parser
 * @param options The parser options
 * @param context Context masks
 */
export function parseSource(source: string, options: any, /*@internal*/ context: Context, errCallback?: any): ESTree.Program {
    if (!!options) {
        // The flag to enable module syntax support
        if (options.module) context |= Context.Module;
        // The flag to enable stage 3 support (ESNext)
        if (options.next) context |= Context.OptionsNext;
        // The flag to enable tokenizing
        if (options.tokenize) context |= Context.OptionsTokenize;
        // The flag to enable React JSX parsing
        if (options.jsx) context |= Context.OptionsJSX;
        // The flag to attach raw property to each literal node
        if (options.raw) context |= Context.OptionsRaw;
    }

    const parser = createParserObject(source, errCallback);
    const body: any = parseStatementList(parser, context);
    return {
        type: 'Program',
        sourceType: context & Context.Module ? 'module' : 'script',
        body: body as any,
    };
}

/**
 * Parse either script code or module code
 *
 * @see [Link](https://tc39.github.io/ecma262/#sec-scripts)
 * @see [Link](https://tc39.github.io/ecma262/#sec-modules)
 *
 * @param source source code to parse
 * @param options parser options
 */
export function parse(source: string, options?: any, errCallback?: any): ESTree.Program {
    return options && options.module
      ? parseModule(source, options, errCallback)
      : parseScript(source, options, errCallback);
  }
  
  /**
   * Parse script code
   *
   * @see [Link](https://tc39.github.io/ecma262/#sec-scripts)
   *
   * @param source source code to parse
   * @param options parser options
   */
  export function parseScript(source: string, options?: any, errCallback?: any): ESTree.Program {
    return parseSource(source, options, Context.Empty, errCallback);
  }
  
  /**
   * Parse module code
   *
   * @see [Link](https://tc39.github.io/ecma262/#sec-modules)
   *
   * @param source source code to parse
   * @param options parser options
   */
  export function parseModule(source: string, options?: any, errCallback?: any): ESTree.Program {
    return parseSource(source, options, Context.Strict | Context.Module, errCallback);
  }