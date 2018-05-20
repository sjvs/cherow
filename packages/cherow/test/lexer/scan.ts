import * as t from 'assert';
import { scan } from '../../src/lexer/scan';
import { createParserObject } from '../../src/parser/parser';
import { Context } from '../../src/utilities';
import { parseSource, parse } from '../../src/cherow';
import { Token, tokenDesc } from '../../src/token';
import * as assert from 'clean-assert';

// TODO! Not working in current state

describe.skip("Lexer - Numeric literals", () => {

    describe("Editor mode", () => {

        it(`should move on if invalid numeric separators at the end`, () => {
            const errArray: any = [];
            const res = parse('123__', { next: true}, (err: string, line: number, column: number) => {
                errArray.push(`Line ${line}, column ${column}: ${err}`);
            });
            assert.match(errArray[0], 'Line 1, column 4: Only one underscore is allowed as numeric separator');
            assert.match(errArray[1], 'Line 1, column 5: Numeric separators are not allowed at the end of numeric literals');
        });
    });

    describe("Pass", () => {
        const tokens: Array < [Context, any, any, Token] > = [
            [Context.Empty, '0', 0, Token.NumericLiteral],
            [Context.Empty, '1', 1, Token.NumericLiteral],
            [Context.Empty, '123', 123, Token.NumericLiteral],
            [Context.Empty, '1.34', 1.34, Token.NumericLiteral],
            [Context.Empty, '1.', 1, Token.NumericLiteral],
            [Context.Empty, '12345678912345678912345678123456789258721349812657123641237846', 1.2345678912345679e+61, Token.NumericLiteral],
            [Context.Empty, '0.E1', 0, Token.NumericLiteral],
            [Context.Empty, '134e44', 1.34e+46, Token.NumericLiteral],
            [Context.Empty, '7.E1', 70, Token.NumericLiteral],
            [Context.Empty, '0.8', 0.8, Token.NumericLiteral],
            [Context.Empty, '7.E1', 70, Token.NumericLiteral],
            [Context.Empty, '7.E1', 70, Token.NumericLiteral],
            [Context.Empty, '7.E1', 70, Token.NumericLiteral],
            [Context.Empty, '7.E1', 70, Token.NumericLiteral],
            [Context.Empty, '7.E1', 70, Token.NumericLiteral],
            [Context.Empty, '7.E1', 70, Token.NumericLiteral],
            [Context.Empty, '1.34', 1.34, Token.NumericLiteral],
            [Context.Empty, '.44', 0.44, Token.NumericLiteral],

            // Binary

            [Context.Empty, '0b10', 2, Token.NumericLiteral],
            [Context.Empty, '0B011', 3, Token.NumericLiteral],
            [Context.Empty, '0B010', 2, Token.NumericLiteral],
            [Context.Empty, '0b0101011', 43, Token.NumericLiteral],
            [Context.Empty, '0b010101101011', 1387, Token.NumericLiteral],
            [Context.Empty, '0b01010110101111010111101011', 22738411, Token.NumericLiteral],
            // [Context.Empty, '0b01010110101101101011110101111010111010111101011', 47671431493099],

            // Hex
            [Context.Empty, '0x10', 16, Token.NumericLiteral],
            [Context.Empty, '0x100', 256, Token.NumericLiteral],
            [Context.Empty, '0x1000', 4096, Token.NumericLiteral],
            [Context.Empty, '0x10000000', 268435456, Token.NumericLiteral],
            // [Context.Empty, '0x100000000000', 17592186044416],

            // Implicit octals

            [Context.Empty, '001234', 668, Token.NumericLiteral],
            [Context.Empty, '0564', 372, Token.NumericLiteral],
            [Context.Empty, '0789', 789, Token.NumericLiteral],
            [Context.Empty, '00009', 9, Token.NumericLiteral],
            [Context.Empty, '00008', 8, Token.NumericLiteral],
            [Context.Empty, '00008.1', 8.1, Token.NumericLiteral],
            [Context.Empty, '00009.1', 9.1, Token.NumericLiteral],
            [Context.Empty, '00009.1E2-1', 910, Token.NumericLiteral],

            // Octal
            [Context.Empty, '0o7', 7, Token.NumericLiteral],
            [Context.Empty, '0o011', 9, Token.NumericLiteral],
            [Context.Empty, '0O077', 63, Token.NumericLiteral],

            // Numeric separators
            [Context.OptionsNext, '1_2_3', 123, Token.NumericLiteral],
            [Context.OptionsNext, '1.3_4', 1.34, Token.NumericLiteral],
            [Context.OptionsNext, '.3_4', 0.34, Token.NumericLiteral],
            [Context.OptionsNext, '.3_4_', 0.34, Token.NumericLiteral],
            [Context.OptionsNext, '1._34', 1.34, Token.NumericLiteral],

            // BigInt
            [Context.OptionsNext, '123n', 123, Token.BigIntLiteral],
            [Context.OptionsNext, '12_3n', 123, Token.BigIntLiteral],
        ]

        for (const [ctx, raw, parsed, token] of tokens) {
            it(`scans '${raw}'`, () => {
                const parser = createParserObject(raw, undefined);
                const found = scan(parser, ctx);

                assert.match({
                    token: tokenDesc(found),
                    value: parser.tokenValue,
                }, {
                    token: tokenDesc(token),
                    value: parsed
                });
            });
        }
    });
});
