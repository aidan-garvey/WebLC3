/**
 * assembler.ts
 * 
 * Converts program source code into a binary object file, which
 * consists of the starting address of the program followed by the
 * assembled machine code / data. It also generates a Map with memory
 * addresses as the keys and corresponding lines of source code as the
 * values, which is needed to display the code alongside the computer's
 * memory in the simulator user interface.
 */

import Parser from "./parser";
import FakeUI from "./fakeUI";
import ErrorBuilder from "./errorBuilder";

export default class Assembler
{
    // all valid opcodes, including trap aliases
    static opCodes = new Set([
        "add", "and", "br", "brn", "brz", "brp",
        "brnz", "brnp", "brzp", "brnzp", "jmp", "jsr",
        "jsrr", "ld", "ldi", "ldr", "lea", "not",
        "ret", "rti", "st", "sti", "str", "trap",
        "getc", "halt", "in", "out", "puts", "putsp"
    ]);

    // all valid assembler directives
    static directives = new Set([
        ".orig", ".end", ".fill", ".blkw", ".stringz"
    ]);

    // All instructions and directives mapped to the number of operands
    // they take. The only thing not mapped is .blkw, which can accept
    // 1 or 2 operands (handled in this.validOperandCount())
    static operandCounts = new Map([
        ["add", 3], ["and", 3], ["br", 1], ["brn", 1], ["brz", 1], ["brp", 1],
        ["brnz", 1], ["brnp", 1], ["brzp", 1], ["brnzp", 1], ["jmp", 1], ["jsr", 1],
        ["jsrr", 1], ["ld", 2], ["ldi", 2], ["ldr", 3], ["lea", 2], ["not", 2],
        ["ret", 0], ["rti", 0], ["st", 2], ["sti", 2], ["str", 3], ["trap", 1],
        ["getc", 0], ["halt", 0], ["in", 0], ["out", 0], ["puts", 0], ["putsp", 0],
        [".orig", 1], [".end", 0], [".fill", 1], [".stringz", 1]
    ]);

    // assembler errors which may be output to the console
    static errors = {
        INFILE: "Source code is empty",
        FIRSTLINE: "The first line of code must be a .ORIG directive",
        IMMEDIATE: "Invalid immediate value",
        MULTORIG: "Multiple .ORIG directives used",
        // OPERANDS: "Incorrect number of operands",
        INVSYMBOL: "Unreconginzed opcode/directive or invalid label",
        BADQUOTES: "String literal has invalid quotes",
        EMPTYSTRING: "String literals cannot be empty",
        BADREG: "Invalid register",
        BADMNEMONIC: "Invalid instruction",
        IMMBOUNDS: "Immediate value is out of bounds for the instruction",
        BADOPRND: "Invalid operand",
        BADLABEL: "Unknown label",
        LBLBOUNDS: "Distance to label is out of range",
        BADMEMORY: "Value written to memory does not fit in 16 bits"
    };

    static hasError = false;

    /**
     * Assemble the given source code.
     *
     * If there are errors in the code, print errors to the editor
     * console and return [null, null].
     * If the code is assembled successfully: print a success message
     * to the editor console, return the resulting object file as a
     * Uint16Array and a Map of memory addresses mapped to the source
     * code that was assembled and placed at that address.
     * @param {string} sourceCode 
     * @returns {[Uint16Array, Map<number, string>] | null}
     */
    static assemble(sourceCode: string) : [Uint16Array, Map<number, string>] | null
    {
        this.hasError = false;

        const srcLines = sourceCode.split(/[\n\r]+/);
        if (srcLines.length == 0)
        {
            FakeUI.print(this.errors.INFILE);
            return null;
        }

        // stores the resulting machine code / binary data,
        // each entry corresponds to the address given by the .ORIG
        // directive plus the index into the array.
        // (ex: if program starts with .ORIG x3000, memory[2] corresponds to
        // the address x3002)
        const memory: number[] = [];
        // map label names to the address of the label
        const labels: Map<string, number> = new Map();
        // Map line tokens with label operands to the memory location they are in.
        // After the first pass, we'll revisit these to fix the offset values.
        const toFix: Map<string[], number> = new Map();
        // maps memory locations where code is stored to the source code
        const addrToCode: Map<number, string> = new Map();
        let startOffset;
        let lineNum = 0;
        // keeps track of our spot in the memory array (not the final address)
        let pc = 0; 

        // scan for first non-empty line, must be a .ORIG directive
        let currLine = Parser.trimLine(srcLines[lineNum]);
        while (!currLine)
        {
            currLine = Parser.trimLine(srcLines[++lineNum]);
        }
        if (!currLine.startsWith(".orig"))
        {
            FakeUI.print(this.errors.FIRSTLINE);
            return null;
        }
        else
        {
            const tokens = currLine.split(/\s+/);
            if (!this.validOperandCount(tokens))
            {
                FakeUI.print(ErrorBuilder.operandError(tokens));
                return null;
            }
            const addr = Parser.parseImmediate(tokens[1], false);
            if (!isNaN(addr))
            {
                startOffset = addr;
            }
            else
            {
                return null;
            }
        }

        let atEnd = false; // tracks if we've hit a .END directive
        // assemble the rest of the code
        while (!atEnd && ++lineNum < srcLines.length)
        {
            // handle validOperandCount before calling parseCode or parseDirective
            currLine = Parser.trimLine(srcLines[lineNum]);
            if (currLine)
            {
                const tokens = Parser.tokenizeLine(currLine);
                // check for label as first token
                if (tokens[0][0] != '.' && !this.opCodes.has(tokens[0]))
                {
                    labels.set(tokens[0], pc);
                    // remove label
                    tokens.shift();
                    if (tokens.length == 0)
                        continue;
                }
                // if more tokens follow the label, parse them

                // assembler directive:
                if (this.directives.has(tokens[0]))
                {
                    if (!this.validOperandCount(tokens))
                    {
                        FakeUI.print(ErrorBuilder.operandError(tokens));
                        this.hasError = true;
                        continue;
                    }
                    const pcInc = Parser.parseDirective(tokens, pc, memory, toFix);
                    if (pcInc < 0)
                    {
                        atEnd = true;
                    }
                    else
                    {
                        pc += pcInc;
                    }
                }
                // instruction:
                else if (this.opCodes.has(tokens[0]))
                {
                    const word = Parser.parseCode(tokens, pc, labels, toFix);
                    if (!isNaN(word))
                    {
                        memory[pc] = word;
                        addrToCode.set(pc + startOffset, currLine);
                    }
                    else
                    {
                        memory[pc] = 0;
                    }
                    ++pc;
                }
                else
                {
                    FakeUI.print(this.errors.BADMNEMONIC);
                    this.hasError = true;
                }
            } // end if 
        } // end white

        // go back and fix branches label is always last operand
        for (const entry of toFix)
        {
            const tokens = entry[0];
            const loc = entry[1];
            if (tokens[0] == ".fill")
            {
                if (labels.has(tokens[1]))
                {
                    // @ts-ignore
                    memory[loc] = labels.get(tokens[1]) + startOffset;
                }
                else
                {
                    this.hasError = true;
                    FakeUI.print(this.errors.BADLABEL + ": " + tokens[1]);
                }
            }
            else if (tokens[0] == ".blkw")
            {
                if (labels.has(tokens[2]))
                {
                    const amt = Parser.parseImmediate(tokens[1], false);
                    if (!isNaN(amt))
                    {
                        for (let i = 0; i < amt; i++)
                        {
                            // @ts-ignore
                            memory[loc + i] = labels.get(tokens[2]) + startOffset;
                        }
                    }
                    else
                    {
                        this.hasError = true;
                        FakeUI.print(this.errors.BADLABEL + ": " + tokens[2]);
                    }
                }
                else
                {
                    this.hasError = true;
                    FakeUI.print(this.errors.BADLABEL + ": " + tokens[2]);
                }
            }
            else
            {
                const offset = Parser.calcLabelOffset(
                    tokens[tokens.length - 1],
                    loc,
                    labels,
                    // @ts-ignore
                    Parser.immBitCounts.get(tokens[0]) 
                );
                if (!isNaN(offset))
                {
                    memory[loc] |= offset;
                }
                else
                {
                    this.hasError = true;
                    FakeUI.print(this.errors.BADLABEL);
                }
            }
        }

        // load resulting machine code into Uint16Array, return it
        const result = new Uint16Array(memory.length + 1);
        result[0] = startOffset;
        for (let i = 0; i < memory.length; i++)
        {
            if (memory[i] > 0xFFFF)
            {
                FakeUI.print(this.errors.BADMEMORY + ": " + memory[i]);
                this.hasError = true;
                result[i + 1] = 0;
            }
            else
            {
                result[i + 1] = memory[i];
            }
        }

        if (this.hasError)
            return null;
        else
            return [result, addrToCode];
    }

    /**
     * assuming tokens[0] is a valid instruction, return true if
     * there are a valid number of operands following it
     * @param {string[]} tokens 
     * @returns {boolean}
     */
    static validOperandCount(tokens: string[]) : boolean
    {
        if (tokens[0] == ".blkw")
        {
            return tokens.length == 2 || tokens.length == 3;
        }
        else
        {
            return (tokens.length - 1) == this.operandCounts.get(tokens[0]);
        }
    }
}
