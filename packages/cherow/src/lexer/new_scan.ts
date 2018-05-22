import { Parser } from '../types';
import { Token, tokenDesc } from '../token';
import { Context, Flags } from '../common';
import { consumeOpt } from './common';
import { Chars } from '../chars';
import { scanIdentifier } from './identifier';
import { skipSingleLineComment } from './comments';

function scanNumeric(parser: Parser, context: Context) {
    return Token.EndOfSource;
}
function invalid(parser: Parser, context: Context, first: number) {
    return Token.EndOfSource;
}

const table = new Array(128).fill(invalid) as any;

table[Chars.Space] = (parser: Parser, context: Context, first: number) => {
    return Token.WhiteSpace;
};

table[Chars.Tab] = (parser: Parser, context: Context, first: number) => {
    return Token.WhiteSpace;
};

table[Chars.CarriageReturn] = (parser: Parser, context: Context, first: number) => {
    return parser.index < parser.length && parser.source.charCodeAt(parser.index) === Chars.LineFeed ?
        Token.LineFeed :
        Token.CarriageReturn;
};

table[Chars.LineFeed] = (parser: Parser, context: Context, first: number) => {
    parser.flags |= Flags.ConsumedNewline;
    return Token.LineFeed;
};

/** Punctuators */

// `,`
table[Chars.Comma] = () => Token.Comma;

// `~`
table[Chars.Tilde] = () => Token.Complement;
// `?`
table[Chars.QuestionMark] = () => Token.QuestionMark;

// `[`
table[Chars.LeftBracket] = () => Token.LeftBracket;

// `]`
table[Chars.RightBracket] = () => Token.RightBracket;

// `{`
table[Chars.LeftBrace] = () => Token.LeftBrace;

// `}`
table[Chars.RightBrace] = () => Token.RightBrace;

// `:`
table[Chars.Colon] = () => Token.Colon;

// `;`
table[Chars.Semicolon] = () => Token.Semicolon;

// `(`
table[Chars.LeftParen] = () => Token.LeftParen;

// `)`
table[Chars.RightParen] = () => Token.RightParen;

// `/`, `/=`, `/>`
table[Chars.Slash] = (parser: Parser, context: Context, first: number) => {
    if (parser.index >= parser.length) return Token.Divide;
    const next = parser.source.charCodeAt(parser.index);
    if (next === Chars.Slash) {
        return skipSingleLineComment(parser);
    } else if (next === Chars.Asterisk) {
        //   return skipBlockComment(parser, state);
    } else if (next === Chars.EqualSign) {
        parser.index++; parser.column++;
        return Token.DivideAssign;
    } else if (next === Chars.GreaterThan) {
        parser.index++; parser.column++;
        return Token.JSXAutoClose;
    }
    return Token.Divide;
};

// `!`, `!=`, `!==`
table[Chars.Exclamation] = (parser: Parser) => {
    if (consumeOpt(parser, Chars.EqualSign)) {
        if (consumeOpt(parser, Chars.EqualSign)) {
            return Token.StrictNotEqual;
        } else {
            return Token.LooseNotEqual;
        }
    } else {
        return Token.Negate;
    }
};

// `%`, `%=`
table[Chars.Percent] = (parser: Parser) => {
    if (consumeOpt(parser, Chars.EqualSign)) {
        return Token.ModuloAssign;
    } else {
        return Token.Modulo;
    }
};

// `&`, `&&`, `&=`
table[Chars.Ampersand] = (parser: Parser) => {
    if (parser.index < parser.length) {
        const next = parser.source.charCodeAt(parser.index);
        if (next === Chars.Ampersand) {
            parser.index++; parser.column++;
            return Token.LogicalAnd;
        } else if (next === Chars.EqualSign) {
            parser.index++; parser.column++;
            return Token.BitwiseAndAssign;
        }
    }
    return Token.BitwiseAnd;
};

// `*`, `**`, `*=`, `**=`
table[Chars.Asterisk] = (parser: Parser) => {
    if (parser.index < parser.length) {
        const next = parser.source.charCodeAt(parser.index);
        if (next === Chars.Asterisk) {
            parser.index++; parser.column++;
            if (consumeOpt(parser, Chars.EqualSign)) {
                return Token.ExponentiateAssign;
            } else {
                return Token.Exponentiate;
            }
        } else if (next === Chars.EqualSign) {
            parser.index++; parser.column++;
            return Token.MultiplyAssign;
        }
    }

    return Token.Multiply;
};

// `+`, `++`, `+=`
table[Chars.Plus] = (parser: Parser) => {
    if (parser.index < parser.length) {
        const next = parser.source.charCodeAt(parser.index);
        if (next === Chars.Plus) {
            parser.index++; parser.column++;
            return Token.Increment;
        } else if (next === Chars.EqualSign) {
            parser.index++; parser.column++;
            return Token.AddAssign;
        }
    }

    return Token.Add;
};

// `-`, `--`, `-=`
table[Chars.Hyphen] = (parser: Parser) => {
    if (parser.index < parser.source.length) {
        const next = parser.source.charCodeAt(parser.index);

        if (next === Chars.Hyphen) {
            parser.index++; parser.column++;
            return Token.Decrement;
        } else if (next === Chars.EqualSign) {
            parser.index++; parser.column++;
            return Token.SubtractAssign;
        }
    }

    return Token.Subtract;
};

// `.`, `...`, `.123` (numeric literal)
table[Chars.Period] = (parser: Parser, context: Context) => {

    if (parser.index < parser.source.length) {
        const next = parser.source.charCodeAt(parser.index);
        if (next === Chars.Period) {
            if (parser.index + 1 < parser.source.length && parser.source.charCodeAt(parser.index) === Chars.Period) {
                parser.index += 2; parser.column += 2;
                return Token.Ellipsis;
            }
        } else if (next >= Chars.Zero && next <= Chars.Nine) {
            scanNumeric(parser, context);
            return Token.NumericLiteral;
        }
    }
    return Token.Period;
};

// `0`...`9`
for (let i = Chars.Zero; i < Chars.Nine; i++) {
    table[i] = scanNumeric;
}

// `<`, `<=`, `<<`, `<<=`, `</`
table[Chars.LessThan] = (parser: Parser, context: Context) => {
    if (parser.index < parser.source.length) {
        switch (parser.source.charCodeAt(parser.index)) {
            case Chars.LessThan:
                parser.index++; parser.column++;
                if (consumeOpt(parser, Chars.EqualSign)) {
                    return Token.ShiftLeftAssign;
                } else {
                    return Token.ShiftLeft;
                }

            case Chars.EqualSign:
                parser.index++; parser.column++;
                return Token.LessThanOrEqual;

            case Chars.Slash: {
                if (!(context & Context.OptionsJSX)) break;
                const index = parser.index + 1;

                // Check that it's not a comment start.
                if (index < parser.source.length) {
                    const next = parser.source.charCodeAt(index);
                    if (next === Chars.Asterisk || next === Chars.Slash) break;
                }

                parser.index++; parser.column++;
                return Token.JSXClose;
            }

            default: // ignore
        }
    }

    return Token.LessThan;
};

// `=`, `==`, `===`, `=>`
table[Chars.EqualSign] = (parser: Parser) => {
    if (parser.index < parser.source.length) {
        const next = parser.source.charCodeAt(parser.index);
        if (next === Chars.EqualSign) {
            parser.index++; parser.column++;
            if (consumeOpt(parser, Chars.EqualSign)) {
                return Token.StrictEqual;
            } else {
                return Token.LooseEqual;
            }
        } else if (next === Chars.GreaterThan) {
            parser.index++; parser.column++;
            return Token.Arrow;
        }
    }

    return Token.Assign;
};

// `>`, `>=`, `>>`, `>>>`, `>>=`, `>>>=`
table[Chars.GreaterThan] = (parser: Parser) => {
    if (parser.index < parser.source.length) {
        const next = parser.source.charCodeAt(parser.index);

        if (next === Chars.GreaterThan) {
            parser.index++; parser.column++;

            if (parser.index < parser.source.length) {
                const next = parser.source.charCodeAt(parser.index);

                if (next === Chars.GreaterThan) {
                    parser.index++; parser.column++;
                    if (consumeOpt(parser, Chars.EqualSign)) {
                        return Token.LogicalShiftRightAssign;
                    } else {
                        return Token.LogicalShiftRight;
                    }
                } else if (next === Chars.EqualSign) {
                    parser.index++; parser.column++;
                    return Token.ShiftRightAssign;
                }
            }

            return Token.ShiftRight;
        } else if (next === Chars.EqualSign) {
            parser.index++; parser.column++;
            return Token.GreaterThanOrEqual;
        }
    }

    return Token.GreaterThan;
};

// `A`...`Z`
for (let i = Chars.UpperA; i < Chars.UpperZ; i++) {
    table[i] = scanIdentifier;
}

// `a`...`z`
for (let i = Chars.LowerA; i < Chars.LowerZ; i++) {
    table[i] = scanIdentifier;
}
// `\\u{N}var`
table[Chars.Backslash] = scanIdentifier;

// `^`, `^=`
table[Chars.Caret] = (parser: Parser) => {
    if (consumeOpt(parser, Chars.EqualSign)) {
        return Token.BitwiseXorAssign;
    } else {
        return Token.BitwiseXor;
    }
};

// `_var`
table[Chars.Underscore] = scanIdentifier;

// ``string``
// table[Chars.Backtick] = scanTemplate;

// `|`, `||`, `|=`
table[Chars.VerticalBar] = (parser: Parser) => {
    if (parser.index < parser.length) {
        const next = parser.source.charCodeAt(parser.index);
        if (next === Chars.VerticalBar) {
            parser.index++; parser.column++;
            return Token.LogicalOr;
        } else if (next === Chars.EqualSign) {
            parser.index++; parser.column++;
            return Token.BitwiseOrAssign;
        }
    }

    return Token.BitwiseOr;
};

export function scan(parser: Parser, context: Context): Token {
    while (parser.index < parser.length) {
        const first = parser.source.charCodeAt(parser.index);
        if (first === Chars.Dollar || (first >= Chars.LowerA && first <= Chars.LowerZ)) {
            return scanIdentifier(parser, context);
        } else {
            parser.index++; parser.column++;
            const token = table[first](parser, context, first);
            if ((token & Token.WhiteSpace) === Token.WhiteSpace) continue;
            if (context & Context.OptionsTokenize) parser.tokens.push(token);
            return token;
        }
    }
    return Token.EndOfSource;
}
