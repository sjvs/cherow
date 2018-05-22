import * as t from 'assert';
import { scan } from '../../src/lexer/scan';
import { createParserObject } from '../../src/parser/parser';
import { Context } from '../../src/common';
import { Token, tokenDesc } from '../../src/token';

describe('Lexer - Numbers', () => {

    function pass(name: string, opts: any) {
        it(name, () => {
            const parser = createParserObject(opts.source, undefined);
            const token = scan(parser, Context.Empty);
            t.deepEqual({
                line: parser.line,
                value: parser.tokenValue,
                token,
                column: parser.column,
            }, {
                value: opts.value,
                token: Token.Decimal,
                line: opts.line,
                column: opts.column
            }, );
        });
    }

    pass('should scan simple number', {
        source: `1`,
        value: 1,
        line: 1,
        column: 1,
    });

    pass('should scan simple floating number', {
        source: `.0`,
        value: 0,
        line: 1,
        column: 3,
    });

    pass('should scan simple floating number', {
        source: `.1`,
        value: 1,
        line: 1,
        column: 3,
    });

    pass('should scan simple floating number', {
        source: `.1e33`,
        value: 1e+33,
        line: 1,
        column: 6,
    });
});