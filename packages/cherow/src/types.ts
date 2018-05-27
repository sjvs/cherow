
import { Token } from './token';
import { Flags, LabelState } from './common';
export interface Parser {
    source: string;
    length: number;
    flags: Flags;
    startIndex: number;
    index: number;
    line: number;
    column: number;
    token: Token;
    lastToken: Token;
    nextToken: Token;
    tokenValue: any;
    tokenRaw: string;
    tokens: Token[];
    onError?: any;
    functionBoundaryStack: any;
    labelSet: any;
    labelSetStack: Array<{[key: string]: boolean}>;
    iterationStack: Array<boolean | LabelState>;
    switchStatement: LabelState;
    iterationStatement: LabelState;
    labelDepth: number;
    tokenRegExp: void | {
        pattern: string;
        flags: string;
    };
}
