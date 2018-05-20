import * as t from 'assert';
import { scan } from '../../src/lexer/scan';
import { createParserObject } from '../../src/parser/parser';
import { Context, Recovery } from '../../src/utilities';
import { parseSource, parse } from '../../src/cherow';
import { Token, tokenDesc } from '../../src/token';
import * as assert from 'clean-assert';

// TODO: Test for strict mode

describe("Lexer - Numeric literals", () => {

    describe("Editor mode", () => {

        describe(`Early errors`, () => {
            it(`should move on if invalid numeric separators at the end`, () => {
                const errArray: any = [];
                const res = parse('123__', {
                    next: true
                }, (err: string, line: number, column: number) => {
                    errArray.push(`Line ${line}, column ${column}: ${err}`);
                });
                assert.match(errArray[0], 'Line 1, column 4: Only one underscore is allowed as numeric separator');
                assert.match(errArray[1], 'Line 1, column 5: Numeric separators are not allowed at the end of numeric literals');
            });
        });
    });

    // should recover from this (invalid input)
    describe("Fails", () => {

        const tokens: any = [
            // Hex
            [Context.OptionsNext, '0x1:0', Token.NumericLiteral],
            // Binary
            [Context.OptionsNext, '0b01010:11', Token.NumericLiteral],
            //[Context.OptionsNext, '123:', 16, Token.NumericLiteral],
            // Octal
            [Context.OptionsNext, '0O0:77', Token.NumericLiteral],
            // Implicit octal
            [Context.OptionsNext, '001234:11', Token.NumericLiteral],
        ];

        for (const [ctx, input, token] of tokens) {
            it(`scans invalid input - '${input}'`, () => {
                const parser = createParserObject(input, undefined);
                const found = scan(parser, ctx);
                assert.match({
                    token: tokenDesc(found),
                    recovery: parser.recovery,
                }, {
                    token: tokenDesc(token),
                    recovery: Recovery.Invalid,
                });
            });
        }
    });

    describe("Pass", () => {
        const tokens: any = [
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
            [Context.Empty, '0b01010110101101101011110101111010111010111101011', 47671431493099, Token.NumericLiteral],

            // Hex
            [Context.Empty, '0x10', 16, Token.NumericLiteral],
            [Context.Empty, '0x100', 256, Token.NumericLiteral],
            [Context.Empty, '0x1000', 4096, Token.NumericLiteral],
            [Context.Empty, '0x10000000', 268435456, Token.NumericLiteral],
            [Context.Empty, '0x100000000000', 17592186044416, Token.NumericLiteral],
            [Context.Empty, '0x100000000000', 17592186044416, Token.NumericLiteral],
            [Context.Empty, '0x10EF399d', 284113309, Token.NumericLiteral],
            [Context.Empty, '0x10E00FFFEEEAAAF399d', 4.98069295632166e+21, Token.NumericLiteral],

            // Implicit octals

            [Context.Empty, '001234', 668, Token.NumericLiteral],
            [Context.Empty, '0564', 372, Token.NumericLiteral],
            [Context.Empty, '0789', 789, Token.NumericLiteral],
            [Context.Empty, '00009', 9, Token.NumericLiteral],
            [Context.Empty, '00008', 8, Token.NumericLiteral],
            [Context.Empty, '00008.1', 8.1, Token.NumericLiteral],
            [Context.Empty, '00009.1', 9.1, Token.NumericLiteral],
            [Context.Empty, '00009.1E2-1', 910, Token.NumericLiteral],

            // Octals
            [Context.Empty, '0o7', 7, Token.NumericLiteral],
            [Context.Empty, '0o011', 9, Token.NumericLiteral],
            [Context.Empty, '0O077', 63, Token.NumericLiteral],

            // Numeric separators
            [Context.OptionsNext, '1_2_3', 123, Token.NumericLiteral],
            [Context.OptionsNext, '1.3_4', 1.34, Token.NumericLiteral],
            [Context.OptionsNext, '.3_4', 0.34, Token.NumericLiteral],
            [Context.OptionsNext, '.3_4_', 0.34, Token.NumericLiteral],
            [Context.OptionsNext, '1._34', 1.34, Token.NumericLiteral],

            // Numeric separators - binary

            [Context.Empty, '0b10', 2, Token.NumericLiteral],
            [Context.OptionsNext, '0B01_1', 3, Token.NumericLiteral],
            [Context.OptionsNext, '0B_0_1_0', 2, Token.NumericLiteral],
            [Context.OptionsNext, '0b0_1_0_1011', 43, Token.NumericLiteral],
            // should recover from this (early error)
            [Context.OptionsNext, '0B___________________010___', 2, Token.NumericLiteral],
            [Context.OptionsNext, '0b_0_1__________0_1011_____', 43, Token.NumericLiteral],

            // Numeric separators - octals

            [Context.OptionsNext, '0o_7', 7, Token.NumericLiteral],
            [Context.OptionsNext, '0o_01_1', 9, Token.NumericLiteral],
            [Context.OptionsNext, '0O0_77', 63, Token.NumericLiteral],
            // should recover from this (early error)
            [Context.OptionsNext, '0o__7', 7, Token.NumericLiteral],
            [Context.OptionsNext, '0o______011__________', 9, Token.NumericLiteral],
            [Context.OptionsNext, '0O07______7', 63, Token.NumericLiteral],

            // Numeric separators -Implicit octals

            [Context.OptionsNext, '001_2_34', 668, Token.NumericLiteral],
            [Context.Empty, '0_5_64', 372, Token.NumericLiteral],
            [Context.Empty, '07_89', 789, Token.NumericLiteral],
            [Context.Empty, '07_89__________________________', 789, Token.NumericLiteral],
            [Context.Empty, '000_09', 9, Token.NumericLiteral],
            [Context.Empty, '00_00_8', 8, Token.NumericLiteral],
            [Context.Empty, '000_08.1', 8.1, Token.NumericLiteral],
            [Context.OptionsNext, '00009.1', 9.1, Token.NumericLiteral],
            [Context.OptionsNext, '00009.1E2-1', 910, Token.NumericLiteral],

            // Numeric separators - hex

            [Context.OptionsNext, '0x1_0', 16, Token.NumericLiteral],
            [Context.OptionsNext, '0x100', 256, Token.NumericLiteral],
            [Context.OptionsNext, '0x10_0_0', 4096, Token.NumericLiteral],
            [Context.OptionsNext, '0x1000_000__0', 268435456, Token.NumericLiteral],
            // should recover from this (early error)
            [Context.OptionsNext, '0x100____', 256, Token.NumericLiteral],
            [Context.OptionsNext, '0x1__00____0', 4096, Token.NumericLiteral],
            [Context.OptionsNext, '0x10_0_00______000_____________', 268435456, Token.NumericLiteral],

            // should recover from this (invalid input)
            // [Context.OptionsNext, '0x1:0', 16, Token.NumericLiteral],

            // BigInt
            [Context.OptionsNext, '123n', 123, Token.BigIntLiteral],

            // Numeric separators - hex
            [Context.OptionsNext, '0x10n', 16, Token.BigIntLiteral],

            // Numeric separators - octal
            [Context.OptionsNext, '0o7n', 7, Token.BigIntLiteral],
            [Context.OptionsNext, '0O077n', 63, Token.BigIntLiteral],

            // Numeric separators - octal with numeric separators
            [Context.OptionsNext, '0o_7n', 7, Token.BigIntLiteral],
            [Context.OptionsNext, '0o_01_1n', 9, Token.BigIntLiteral],

            // Numeric separators - implicit octal
            [Context.Empty, '001234n', 668, Token.BigIntLiteral],
            [Context.Empty, '0564n', 372, Token.BigIntLiteral],
            // Numeric separators - implicit octal with numeric separators
            [Context.Empty, '07_8_9n', 789, Token.BigIntLiteral],
            [Context.Empty, '00_0_09n', 9, Token.BigIntLiteral],

            // Numeric separators - binary
            [Context.OptionsNext, '0b0101011n', 43, Token.BigIntLiteral],
            [Context.OptionsNext, '0b010101101011n', 1387, Token.BigIntLiteral],
            // Numeric separators - binary with numeric separators
            [Context.OptionsNext, '0b0101_0110101111_010111101011n', 22738411, Token.BigIntLiteral],
            [Context.OptionsNext, '0b010101101_0110110___1011110101111010111010111101011n_', 47671431493099, Token.BigIntLiteral],

            // BigInt - numeric separators
            [Context.OptionsNext, '12_3n', 123, Token.BigIntLiteral],
        ];

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
