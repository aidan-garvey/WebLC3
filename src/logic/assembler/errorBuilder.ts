/**
 * errorBuilder.ts
 * 
 * Contains methods for generating more complex error messages.
 */

import Assembler from "./assembler";

export default class ErrorBuilder
{
    /**
     * 
     * @param {string[]} tokens 
     * @returns {string}
     */
    static operandError(tokens: string[]) : string
    {
        return "Incorrect number of operands: expected " + 
            Assembler.operandCounts.get(tokens[0]) + ", found " + (tokens.length - 1);
    }
}
