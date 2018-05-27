import { Parser } from '../types';
import { Token } from '../token';
import { Errors, recordErrors, } from '../errors';

/*@internal*/
export const enum LabelState {
    Empty            = 0,      // Break statement
    Iteration        = 1 << 0, // Parsing iteration statement
    CrossingBoundary = 1 << 1, // Crossing function boundary
}

/**
 * Returns true if start of an iteration statement
 * 
 * @param parser Parser object
 */
function isIterationStatement(parser: Parser): boolean {
    return parser.token === Token.WhileKeyword || parser.token === Token.DoKeyword || parser.token === Token.ForKeyword;
}

/**
 * Add label to the stack
 * 
 * @param parser Parser object
 * @param label Label to be added
 */
export function addLabel(parser: Parser, label: string): void {
    if (!parser.labelSet) parser.labelSet = {};
    parser.labelSet[label] = true;
    parser.labelSetStack[parser.labelDepth] = parser.labelSet;
    parser.iterationStack[parser.labelDepth] = isIterationStatement(parser);
    parser.labelSet = undefined;
    parser.labelDepth++;
}

/**
 * Add function 
 * 
 * @param parser Parser object
 * @param label Label to be added
 */
export function addCrossingBoundary(parser: Parser): void {
    parser.labelSetStack[parser.labelDepth] = parser.functionBoundaryStack;
    parser.iterationStack[parser.labelDepth] = LabelState.Empty;
    parser.labelDepth++;
}

/**
 * Validates continue statement
 * 
 * @param parser Parser object
 * @param label Label
 */
export function validateContinueLabel(parser: Parser, label: string): void {
    const state = getLabel(parser, label, true);
    if ((state & LabelState.Iteration) !== LabelState.Iteration) {
        if (state & LabelState.CrossingBoundary) {
            recordErrors(parser, Errors.InvalidNestedStatement)
        } else {
            recordErrors(parser, Errors.UnknownLabel, label as string);
        }
    }
}

/**
 * Validates break statement
 * 
 * @param parser Parser object
 * @param label Label
 */
export function validateBreakStatement(parser: Parser, label: any): void {
    const state = getLabel(parser, label);
    if ((state & LabelState.Iteration) !== LabelState.Iteration) recordErrors(parser, Errors.UnknownLabel, label);
}

/**
 * Add label
 * 
 * @param parser Parser object
 * @param label Label to be added
 */
export function getLabel(
    parser: Parser,
    label: string,
    iterationStatement: boolean = false,
    crossBoundary: boolean = false
): LabelState {
    if (!iterationStatement && parser.labelSet && parser.labelSet[label] === true) {
        return LabelState.Iteration;
    }

    if (!parser.labelSetStack) return LabelState.Empty;

    let stopAtTheBorder = false;
    for (let i = parser.labelDepth - 1; i >= 0; i--) {
        let labelSet = parser.labelSetStack[i];
        if (labelSet === parser.functionBoundaryStack) {
            if (crossBoundary) {
                break;
            } else {
                stopAtTheBorder = true;
                continue;
            }
        }

        if (iterationStatement && parser.iterationStack[i] === false) {
            continue;
        }

        if (labelSet[label] === true) {
            return stopAtTheBorder ? LabelState.CrossingBoundary : LabelState.Iteration;
        }
    }

    return LabelState.Empty;
}