/**
 * errorBuilder.ts
 *
 * Generates error messages with a consistent style. Constructed with a
 * reference to the source code so it can display the line with the error.
 */

import Assembler from "./assembler";

export default class ErrorBuilder
{
    private sourceCode: string[];

    /**
     * Creates an ErrorBuilder given the source code, which must be separated
     * into individual lines.
     * @param {string[]} sourceCode
     */
    public constructor(sourceCode: string[])
    {
        this.sourceCode = sourceCode;
    }

    /**
     * Return an error message with line number, an error-specific description
     * of the problem, and the entire line of code.
     * @param lineNum
     * @param description
     * @returns
     */
    public formatMessage(lineNum: number, description: string): string
    {
        return (lineNum + 1) + ": " + description + "\n" + this.sourceCode[lineNum];
    }

    /**
     * Convert an integer to a hexadecimal string representation
     */
    private toHex(n: number): string
    {
        return "x" + n.toString(16);
    }

    /**
     * Wrong number of operands for an instruction or assembler directive
     * @param lineNum
     * @param tokens
     * @returns
     */
    public operandCount(lineNum: number, tokens: string[]): string
    {
        let expected: string;
        if (tokens[0] == ".blkw")
        {
            expected = "1 or 2";
        }
        else if (!Assembler.validMnemonic(tokens[0]))
        {
            return this.formatMessage(lineNum, "Assembler error: attempted to throw operand count error for unknown instruction/directive " + tokens[0]);
        }
        else
        {
            //@ts-ignore
            expected = Assembler.operandCounts.get(tokens[0]);
        }
        return this.formatMessage(lineNum,
            "Incorrect number of operands for " + tokens[0] + ": expected " +
            expected + ", found " + (tokens.length-1));
    }

    /**
     * Invalid instruction mnemonic / directive
     * @param lineNum
     * @param mnemonic
     * @returns
     */
    public unknownMnemonic(lineNum: number, mnemonic: string): string
    {
        return this.formatMessage(lineNum, "Invalid instruction: " + mnemonic);
    }

    /**
     * Invalid immediate operand
     * @param lineNum
     * @param operand
     * @returns
     */
    public immOperand(lineNum: number, operand: string): string
    {
        return this.formatMessage(lineNum,
            "Invalid immediate operand: " + operand);
    }

    /**
     * Immediate operand does not fit in allowed number of bits for instruction
     * (displays the name of the instruction in the description)
     * @param lineNum
     * @param instruction
     * @param operand
     * @returns
     */
    public immBounds(lineNum: number, instruction: string, operand: string): string
    {
        return this.formatMessage(lineNum,
            "Immediate value is out of bounds for " + instruction + ": " + operand);
    }

    /**
     * Immediate operand does not fit in allowed number of bits for instruction
     * (displays the length of the immediate operand field)
     * @param lineNum
     * @param bits
     * @param operand
     * @returns
     */
    public immBoundsBits(lineNum: number, bits: number, operand: string): string
    {
        return this.formatMessage(lineNum,
            "Immediate value does not fit in the required " +
            bits + " bits: " + operand);
    }

    /**
     * Undefined label
     * @param lineNum
     * @param label
     * @returns
     */
    public badLabel(lineNum: number, label: string): string
    {
        return this.formatMessage(lineNum, "Unknown label: " + label);
    }

    /**
     * Internal error: assembled word of machine code does not fit in 16 bits
     * @param address
     * @param value
     * @returns
     */
    public badMemory(lineNum: number, address: number, value: number): string
    {
        const hexAddr = this.toHex(address);
        return this.formatMessage(lineNum, "Assembler error: value at address " + hexAddr +
            " is too large for one word: " + value);
    }

    /**
     * Internal error: NaN was saved to memory
     * @param address
     * @returns
     */
    public nanMemory(lineNum: number, address: number): string
    {
        const hexAddr = this.toHex(address);
        return this.formatMessage(lineNum, "Assembler error: value at address " + hexAddr + " is NaN");
    }

    /**
     * String literal has mismatched quotes around it
     * @param lineNum
     * @param literal
     * @returns
     */
    public badQuotes(lineNum: number, literal: string): string
    {
        return this.formatMessage(lineNum,
            "String literal has invalid quotes: " + literal);
    }

    /**
     * Register operand is invalid
     * @param lineNum
     * @param operand
     * @returns
     */
    public badRegister(lineNum: number, operand: string): string
    {
        return this.formatMessage(lineNum,
            "Invalid register specifier: " + operand);
    }

    /**
     * Difference between program counter and label is too large to fit in the
     * instruction's PC-offset field
     * @param lineNum
     * @param label
     * @param bits
     * @returns
     */
    public labelBounds(lineNum: number, label: string, bits: number): string
    {
        return this.formatMessage(lineNum,
            "Program counter offset for label " + label + " does not fit in " + bits +
            "-bit label field for instruction");
    }

    /**
     * Internal error: line number was not stored for a memory address
     * @param addr
     * @returns
     */
    public noLineNumForAddr(addr: number): string
    {
        const hexAddr = this.toHex(addr);
        return "Assembler error: no line number stored for memory address " + hexAddr;
    }

    /**
     * Empty string literal given for .stringz
     * @param lineNum
     * @returns
     */
    public emptyString(lineNum: number): string
    {
        return this.formatMessage(lineNum, "Empty string literal");
    }

    /**
     * Multiple .orig directives used
     */
    public multiOrig(lineNum: number): string
    {
        return this.formatMessage(lineNum,
            "Multiple .ORIG directives used, you must only use one .ORIG directive");
    }
}
