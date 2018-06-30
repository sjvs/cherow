export const enum Context {
  Empty = 0,
  OptionsRaw           = 1 << 0,
  ExpressionStart      = 1 << 10,
  Strict               = 1 << 14,
  Module               = 1 << 15,
  TaggedTemplate               = 1 << 16,

}

export const enum Flags {
  Empty = 0,
  LineTerminator = 1 << 0,
  HasOctal       = 1 << 1,
}
