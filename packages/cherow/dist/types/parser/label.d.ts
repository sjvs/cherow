import { Parser } from '../types';
/**
 * Add label to the stack
 *
 * @param parser Parser object
 * @param label Label to be added
 */
export declare function addLabel(parser: Parser, label: string): void;
/**
 * Add label
 *
 * @param parser Parser object
 * @param label Label to be added
 */
export declare function addCrossingBoundary(parser: Parser): void;
/**
 * Validates continue statement
 *
 * @param parser Parser object
 * @param label Label
 */
export declare function validateContinueLabel(parser: Parser, label: string): void;
/**
 * Validates break statement
 *
 * @param parser Parser object
 * @param label Label
 */
export declare function validateBreakStatement(parser: Parser, label: any): void;
/**
 * Add label
 *
 * @param parser Parser object
 * @param label Label to be added
 */
export declare function getLabel(parser: Parser, label: string, iterationStatement?: boolean, stopAtFunctionBoundary?: boolean): LabelState;
