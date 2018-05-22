
import { Parser } from '../types';
import { Token } from '../token';
import { Flags } from '../common';

export function createParserObject(source: string, errCallback?: any): Parser {
    return {
        source: source,
        length: source.length,
        flags: Flags.Empty,
        token: Token.EndOfSource,
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
