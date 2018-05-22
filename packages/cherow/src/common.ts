export const enum Context {
    Empty = 0,
    OptionsTokenize = 1 << 0,
    OptionsJSX= 1 << 1,

    Strict = 1 << 2,
    Module = 1 << 3,

}

export const enum Flags {
    Empty = 0,
    NewLine = 1,
}
