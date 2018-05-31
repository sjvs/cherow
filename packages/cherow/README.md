# Cherow

**Work in progress**

This will be the v. 2.0 version of the Cherow parser.

## New features

- Editor mode
- Tokenizing
- Web compat

## Improvements

- Performance
- Souce code size


## API Changes

```js

 cherow.parse('1_2__', { edit: true }, (err: string, line: number, column: number) => {
       console.log( `Line ${line}, column ${column}: ${err}`);
 });

 // Line 1, column 4: Only one underscore is allowed as numeric separator
 // Line 1, column 5: Numeric separators are not allowed at the end of numeric literals
```
