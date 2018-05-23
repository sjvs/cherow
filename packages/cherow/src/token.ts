/**
 * https://tc39.github.io/ecma262/#sec-ecmascript-language-source-code
 */
export const enum Token {
    Type = 0xff,

    /* Precedence */
    PrecStart          = 8,
    Precedence         = 15 << PrecStart, // 8-11

    /* Attribute names */
    Contextual         = 1 << 12,
    Reserved           = 1 << 13,
    FutureReserved     = 1 << 14,
    Invalid            = 1 << 16,
    ASI                = 1 << 17,
    IsLogical          = 1 << 18,

    /* ECMA tokens */
    WhiteSpace         = 1 << 19, // Note: LineTerminator and WhiteSpace are treated as one token
    Comments           = 1 << 20 | WhiteSpace,
    NumericLiteral     = 1 << 21,
    StringLiteral      = 1 << 22,
    NullLiteral        = 1 << 23,
    Identifier         = 1 << 23,
    RegularExpression  = 1 << 24,
    Punctuators        = 1 << 25,
    Template           = 1 << 26,

    /** Misc */
    IsAssignOp         = 1 << 27,
    IsBinaryOp         = 1 << 28,
    IsUnaryOp          = 1 << 29,
    IsUpdateOp         = 1 << 30,

    /* Node types */
    EndOfSource = 0, // Pseudo

    /* Booleans */
    FalseKeyword      = 1 | Reserved,
    TrueKeyword       = 2 | Reserved,

    /* Null literal */
    NullKeyword       = 3 | NullLiteral | Reserved,

    /* Template nodes */
    TemplateHead  = 4 | Template,
    TemplateSpan  = 5 | Template,
    TemplateTail  = 6 | Template,

    /* Punctuators */
    Arrow        = 7  | Punctuators, // =>
    LeftParen    = 8  | Punctuators, // (
    LeftBrace    = 9  | Punctuators, // {
    Period       = 10 | Punctuators, // .
    Ellipsis     = 11 | Punctuators, // ...
    RightBrace   = 12 | Punctuators, // }
    RightParen   = 13 | Punctuators, // )
    Semicolon    = 14 | Punctuators, // ;
    Comma        = 15 | Punctuators, // ,
    LeftBracket  = 16 | Punctuators, // [
    RightBracket = 17 | Punctuators, // ]
    Colon        = 18 | Punctuators, // :
    QuestionMark = 19 | Punctuators, // ?
    SingleQuote  = 20 | Punctuators, // '
    DoubleQuote  = 21 | Punctuators, // "
    JSXClose     = 22 | Punctuators, // </
    JSXAutoClose = 23 | Punctuators, // />

    /* Update operators */
    Increment = 24 | Punctuators | IsUpdateOp, // ++
    Decrement = 25 | Punctuators | IsUpdateOp, // --

    /* Assign operators */
    Assign                  = 26  | Punctuators | IsAssignOp, // =
    ShiftLeftAssign         = 27  | Punctuators | IsAssignOp, // <<=
    ShiftRightAssign        = 28  | Punctuators | IsAssignOp, // >>=
    LogicalShiftRightAssign = 29  | Punctuators | IsAssignOp, // >>>=
    ExponentiateAssign      = 30  | Punctuators | IsAssignOp, // **=
    AddAssign               = 31  | Punctuators | IsAssignOp, // +=
    SubtractAssign          = 32  | Punctuators | IsAssignOp, // -=
    MultiplyAssign          = 33  | Punctuators | IsAssignOp, // *=
    DivideAssign            = 34  | Punctuators | IsAssignOp, // /=
    ModuloAssign            = 35  | Punctuators | IsAssignOp, // %=
    BitwiseXorAssign        = 36  | Punctuators | IsAssignOp, // ^=
    BitwiseOrAssign         = 37  | Punctuators | IsAssignOp, // |=
    BitwiseAndAssign        = 38  | Punctuators | IsAssignOp, // &=

    /* Unary/binary operators */
    TypeofKeyword      = 39  | IsUnaryOp | Punctuators | Reserved,
    DeleteKeyword      = 40  | IsUnaryOp | Punctuators | Reserved,
    VoidKeyword        = 41  | IsUnaryOp | Punctuators | Reserved,
    Negate             = 42  | IsUnaryOp | Punctuators, // !
    Complement         = 43  | IsUnaryOp | Punctuators, // ~
    Add                = 44  | IsUnaryOp | IsBinaryOp | Punctuators | 9 << PrecStart, // +
    Subtract           = 45  | IsUnaryOp | IsBinaryOp | Punctuators | 9 << PrecStart, // -
    InKeyword          = 46  | IsBinaryOp | Punctuators | 7 << PrecStart | Reserved,
    InstanceofKeyword  = 47  | IsBinaryOp | Punctuators | 7 << PrecStart | Reserved,
    Multiply           = 48  | IsBinaryOp | Punctuators | 10 << PrecStart, // *
    Modulo             = 49  | IsBinaryOp | Punctuators | 10 << PrecStart, // %
    Divide             = 50  | IsBinaryOp | Punctuators | 10 << PrecStart, // /
    Exponentiate       = 51  | IsBinaryOp | Punctuators | 11 << PrecStart, // **
    LogicalAnd         = 52  | IsBinaryOp | Punctuators | 2 << PrecStart, // &&
    LogicalOr          = 53  | IsBinaryOp | Punctuators | 1 << PrecStart, // ||
    StrictEqual        = 54  | IsBinaryOp | Punctuators | 6 << PrecStart, // ===
    StrictNotEqual     = 55  | IsBinaryOp | Punctuators | 6 << PrecStart, // !==
    LooseEqual         = 56  | IsBinaryOp | Punctuators | 6 << PrecStart, // ==
    LooseNotEqual      = 57  | IsBinaryOp | Punctuators | 6 << PrecStart, // !=
    LessThanOrEqual    = 58  | IsBinaryOp | Punctuators | 7 << PrecStart, // <=
    GreaterThanOrEqual = 59  | IsBinaryOp | Punctuators | 7 << PrecStart, // >=
    LessThan           = 60  | IsBinaryOp | Punctuators | 7 << PrecStart, // <
    GreaterThan        = 61  | IsBinaryOp | Punctuators | 7 << PrecStart, // >
    ShiftLeft          = 62  | IsBinaryOp | Punctuators | 8 << PrecStart, // <<
    ShiftRight         = 63  | IsBinaryOp | Punctuators | 8 << PrecStart, // >>
    LogicalShiftRight  = 64  | IsBinaryOp | Punctuators | 8 << PrecStart, // >>>
    BitwiseAnd         = 65  | IsBinaryOp | Punctuators | 5 << PrecStart, // &
    BitwiseOr          = 66  | IsBinaryOp | Punctuators | 3 << PrecStart, // |
    BitwiseXor         = 67  | IsBinaryOp | Punctuators | 4 << PrecStart, // ^

    /* Variable declaration kinds */
    VarKeyword   = 68 | Reserved,
    LetKeyword   = 69 | FutureReserved,
    ConstKeyword = 70 | Reserved,

    /* Other reserved words */
    BreakKeyword    = 71 | Reserved,
    CaseKeyword     = 72 | Reserved,
    CatchKeyword    = 73 | Reserved,
    ClassKeyword    = 74 | Reserved,
    ContinueKeyword = 75 | Reserved,
    DebuggerKeyword = 76 | Reserved,
    DefaultKeyword  = 77 | Reserved,
    DoKeyword       = 78 | Reserved,
    ElseKeyword     = 79 | Reserved,
    ExportKeyword   = 80 | Reserved,
    ExtendsKeyword  = 81 | Reserved,
    FinallyKeyword  = 82 | Reserved,
    ForKeyword      = 83 | Reserved,
    FunctionKeyword = 84 | Reserved,
    IfKeyword       = 85 | Reserved,
    ImportKeyword   = 86 | Reserved,
    NewKeyword      = 87 | Reserved,
    ReturnKeyword   = 88 | Reserved,
    SuperKeyword    = 89 | Reserved,
    SwitchKeyword   = 90 | Reserved,
    ThisKeyword     = 91 | Reserved,
    ThrowKeyword    = 92 | Reserved,
    TryKeyword      = 93 | Reserved,
    WhileKeyword    = 94 | Reserved,
    WithKeyword     = 95 | Reserved,

    /* Eval & arguments */
    Arguments        = 96 | Identifier,
    Eval             = 97 | Identifier,

    /* Decorators */
    At               = 98 | Identifier,

    /* Private names or shebang comment start */
    Hash             = 99 | Identifier,

    /* Strict mode reserved words */
    ImplementsKeyword = 100 | FutureReserved,
    InterfaceKeyword  = 101 | FutureReserved,
    PackageKeyword    = 102 | FutureReserved,
    PrivateKeyword    = 103 | FutureReserved,
    ProtectedKeyword  = 104 | FutureReserved,
    PublicKeyword     = 105 | FutureReserved,
    StaticKeyword     = 106 | FutureReserved,
    YieldKeyword      = 107 | FutureReserved,

    /* Contextual keywords */
    AsKeyword          = 108 | Contextual,
    AsyncKeyword       = 109 | Contextual,
    AwaitKeyword       = 110 | Contextual | IsUnaryOp,
    ConstructorKeyword = 111 | Contextual,
    GetKeyword         = 112 | Contextual,
    SetKeyword         = 113 | Contextual,
    FromKeyword        = 114 | Contextual,
    OfKeyword          = 115 | Contextual,

    /* Comments */
    SingleComment      = 116 | WhiteSpace | Comments,
    MultiComment       = 117 | WhiteSpace | Comments,
    HTMLComment        = 118 | WhiteSpace | Comments,

    /* WhiteSpace */
    Space              = 119 | WhiteSpace,
    Tab                = 120 | WhiteSpace,
    LineFeed           = 121 | WhiteSpace,
    CarriageReturn     = 122 | WhiteSpace,

    /* Numbers */
    Hex                = 123 | NumericLiteral,
    Decimal            = 124 | NumericLiteral,
    Binary             = 125 | NumericLiteral,
    Octal              = 126 | NumericLiteral,
    Implicit           = 127 | NumericLiteral,
    BigInt             = 128 | NumericLiteral,
    
    /* Enum */
    EnumKeyword        = 129 | NumericLiteral,
}

// Note: this *must* be kept in sync with the enum's order.
//
// It exploits the enum value ordering, and it's necessarily a complete and
// utter hack.
//
// All to lower it to a single monomorphic array access.
const KeywordDescTable = [
    'end of source',

    /* Constants/Bindings */
    'false', 'true', 'null',

    /* Template nodes */
    'template head', 'template body', 'template tail',

    /* Punctuators */
    '=>', '(', '{', '.', '...', '}', ')', ';', ',', '[', ']', ':', '?', '\'', '"', '</', '/>',

    /* Update operators */
    '++', '--',

    /* Assign operators */
    '=', '<<=', '>>=', '>>>=', '**=', '+=', '-=', '*=', '/=', '%=', '^=', '|=',
    '&=',

    /* Unary/binary operators */
    'typeof', 'delete', 'void', '!', '~', '+', '-', 'in', 'instanceof', '*', '%', '/', '**', '&&',
    '||', '===', '!==', '==', '!=', '<=', '>=', '<', '>', '<<', '>>', '>>>', '&', '|', '^',

    /* Variable declaration kinds */
    'var', 'let', 'const',

    /* Other reserved words */
    'break', 'case', 'catch', 'class', 'continue', 'debugger', 'default', 'do', 'else', 'export',
    'extends', 'finally', 'for', 'function', 'if', 'import', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'while', 'with',

     /* Eval & arguments */
     'arguments', 'eval',
     
     /* Decorators */
     'at',
 
     /* Private names or shebang comment start */
     '#',
 
    /* Strict mode reserved words */
    'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'yield',

    /* Contextual keywords */
    'as', 'async', 'await', 'constructor', 'get', 'set', 'from', 'of',

    /* Comments */
    'SingleComment', 'MultiComment', 'HTMLComment',

    /* WhiteSpace */
    'space', 'tab', 'line feed', 'carrige return',

    /* WhiteSpace */
    'hex', 'decimal', 'binary', 'octal', 'implicit', 'bigInt',

    /* Enum */

    'enum'
];

/**
 * The conversion function between token and its string description/representation.
 */
export function tokenDesc(token: Token): string {
    if ((token & Token.Type) < KeywordDescTable.length) {
        return KeywordDescTable[token & Token.Type];
    } else {
        throw new Error('unreachable');
    }
}

// Used `Object.create(null)` to avoid potential `Object.prototype`
// interference.
const descKeywordTable: {[key: string]: Token} = Object.create(null, {
    this: {value: Token.ThisKeyword},
    function: {value: Token.FunctionKeyword},
    if: {value: Token.IfKeyword},
    return: {value: Token.ReturnKeyword},
    var: {value: Token.VarKeyword},
    else: {value: Token.ElseKeyword},
    for: {value: Token.ForKeyword},
    new: {value: Token.NewKeyword},
    in: {value: Token.InKeyword},
    typeof: {value: Token.TypeofKeyword},
    while: {value: Token.WhileKeyword},
    case: {value: Token.CaseKeyword},
    break: {value: Token.BreakKeyword},
    try: {value: Token.TryKeyword},
    catch: {value: Token.CatchKeyword},
    delete: {value: Token.DeleteKeyword},
    throw: {value: Token.ThrowKeyword},
    switch: {value: Token.SwitchKeyword},
    continue: {value: Token.ContinueKeyword},
    default: {value: Token.DefaultKeyword},
    instanceof: {value: Token.InstanceofKeyword},
    do: {value: Token.DoKeyword},
    void: {value: Token.VoidKeyword},
    finally: {value: Token.FinallyKeyword},
    arguments: {value: Token.Arguments},
    async: {value: Token.AsyncKeyword},
    await: {value: Token.AwaitKeyword},
    class: {value: Token.ClassKeyword},
    const: {value: Token.ConstKeyword},
    constructor: {value: Token.ConstructorKeyword},
    debugger: {value: Token.DebuggerKeyword},
    enum: {value: Token.EnumKeyword},
    eval: {value: Token.Eval},
    export: {value: Token.ExportKeyword},
    extends: {value: Token.ExtendsKeyword},
    false: {value: Token.FalseKeyword},
    from: {value: Token.FromKeyword},
    get: {value: Token.GetKeyword},
    implements: {value: Token.ImplementsKeyword},
    import: {value: Token.ImportKeyword},
    interface: {value: Token.InterfaceKeyword},
    let: {value: Token.LetKeyword},
    null: {value: Token.NullKeyword},
    of: {value: Token.OfKeyword},
    package: {value: Token.PackageKeyword},
    private: {value: Token.PrivateKeyword},
    protected: {value: Token.ProtectedKeyword},
    public: {value: Token.PublicKeyword},
    set: {value: Token.SetKeyword},
    static: {value: Token.StaticKeyword},
    super: {value: Token.SuperKeyword},
    true: {value: Token.TrueKeyword},
    with: {value: Token.WithKeyword},
    yield: {value: Token.YieldKeyword},
    as: {value: Token.AsKeyword},
 });

export function descKeyword(value: string): Token {
    return (descKeywordTable[value] | 0) as Token;
}