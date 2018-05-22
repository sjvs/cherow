
import { Token } from './token';
import { Flags } from './common';

export interface Parser {
    source: string;
    length: number;
    flags: Flags;
    startIndex: number;
    index: number;
    line: number;
    column: number;
    token: Token;
    tokenValue: any;
    tokenRaw: string;
    tokens: any[];
    onError?: any;
    tokenRegExp: void | {
        pattern: string;
        flags: string;
    };
}
