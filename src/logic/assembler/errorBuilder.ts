/**
 * errorBuilder.ts
 * 
 * Given a copy of the source code being assembled, generates error messages
 * with as much relevant info as possible.
 */

import Assembler from "./assembler";

export default class ErrorBuilder
{
    private sourceCode: string[];

    /** 
     * Creates an ErrorBuilder given the source code, which must be separated
     * individual lines.
     * @param {string[]} sourceCode
     */
    public constructor(sourceCode: string[])
    {
        this.sourceCode = sourceCode;
    }

    private formatMessage(lineNum: number, message: string): string
    {
        return lineNum + ": " + message + "\n" + this.sourceCode[lineNum];
    }

    /** operandError
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
        else if (!Assembler.operandCounts.has(tokens[0]))
        {
            return "Assembler error: attempted to throw operand count error for unknown instruction/directive " + tokens[0];
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

    public unknownMnemonic(lineNum: number, mnemonic: string): string
    {
        return this.formatMessage(lineNum, "Invalid instruction: " + mnemonic);
    }

    public immOperand(lineNum: number, operand: string): string
    {
        return this.formatMessage(lineNum,
            "Invalid immediate operand: " + operand);
    }

    public immBounds(lineNum: number, instruction: string, operand: string): string
    {
        return this.formatMessage(lineNum,
            "Immediate value is out of bounds for " + instruction + ": " + operand);
    }

    public immBoundsBits(lineNum: number, bits: number, operand: string): string
    {
        return this.formatMessage(lineNum,
            "Immediate value does not fit in the required " +
            bits + " bits: " + operand);
    }

    public badLabel(lineNum: number, label: string): string
    {
        return this.formatMessage(lineNum, "Unknown label: " + label);
    }

    public badMemory(address: number, value: number): string
    {
        return "Assembler error: value at address " + address + 
            " is too large for one word: " + value;
    }

    public nanMemory(address: number): string
    {
        return "Assembler error: value at address " + address + "is NaN";
    }

    public badQuotes(lineNum: number, literal: string): string
    {
        return this.formatMessage(lineNum, 
            "String literal has invalid quotes: " + literal);
    }

    public badRegister(lineNum: number, operand: string): string
    {
        return this.formatMessage(lineNum,
            "Invalid register specifier: " + operand);
    }

    public labelBounds(lineNum: number, label: string, bits: number): string
    {
        return this.formatMessage(lineNum,
            "PC-offset for label " + label + " is out of " + bits +
            "-bit boundary for instruction");
    }

    public noLineNumForAddr(addr: number): string
    {
        return "Assembler error: no line number stored for memory address " + addr;
    }

    public emptyString(lineNum: number): string
    {
        return this.formatMessage(lineNum, "Empty string literal");
    }
}
