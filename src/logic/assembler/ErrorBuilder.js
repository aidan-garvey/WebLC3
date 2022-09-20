/**
 * ErrorBuilder.js
 * 
 * Contains methods for generating more complex error messages.
 */

import {Assembler} from "./Assembler.js";

export class ErrorBuilder
{
    /**
     * 
     * @param {string[]} tokens 
     * @returns {string}
     */
    static operandError(tokens)
    {
        return "Incorrect number of operands: expected " + 
            Assembler.operandCounts.get(tokens[0]) + ", found " + (tokens.length - 1);
    }
}
