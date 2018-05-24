# Cherow

**Work in progress**

This is an experimental branch with focus on adding a "editor mode" for Cherow. It will replace current tolerant mode,
and will recover from all errors. Incremental parsing is a TODO.

Doing this would require a refactoring both of parser and the lexer.

**Note:** This is a different approach than Acorn loose, and for *panic mode* it will not create any AST nodes, but
the scanner will be primed until statement level are reached.

## Current progress

This is still an experiment, but you can do simple parsing. Any wrong input will not take you into inifity, but outputs invalid AST.
Soon as the invalid code is corrected, the AST will normalize itself.

Here is an example:

```js
// Input
parseScript('function (() {}')

// Output

{"type":"Program","sourceType":"script","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","body":{"type":"BlockStatement","body":[{"type":"ExpressionStatement"}]},"params":[null],"async":false,"generator":false,"expression":false,"id":null}}]}
```

## API

```js

 cherow.parse('1_2__', (err: string, line: number, column: number) => {
       console.log( `Line ${line}, column ${column}: ${err}`);
 });

 // Line 1, column 4: Only one underscore is allowed as numeric separator
 // Line 1, column 5: Numeric separators are not allowed at the end of numeric literals
```
