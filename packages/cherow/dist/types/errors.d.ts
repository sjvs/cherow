import { Parser } from './types';
export declare function constructError(index: number, line: number, column: number, description: string): void;
export declare function recordErrors(parser: Parser, type: Errors, ...params: string[]): void;
