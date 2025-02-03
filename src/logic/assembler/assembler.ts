/**
 * assembler.ts
 *
 * Converts program source code into a binary object file, which consists of the
 * starting address of the program followed by the assembled machine code. It
 * also generates a Map with memory addresses as the keys and corresponding
 * lines of source code as the values, which is used to display the code
 * alongside the computer's memory in the simulator user interface.
 */

import Parser from "./parser";
import ErrorBuilder from "./errorBuilder";
import UI from "../../presentation/ui";

export default class Assembler
{
    // all valid opcodes, including trap aliases
    protected static opCodes = new Set([
        "add", "and", "br", "brn", "brz", "brp",
        "brnz", "brnp", "brzp", "brnzp", "jmp", "jsr",
        "jsrr", "ld", "ldi", "ldr", "lea", "not",
        "ret", "rti", "st", "sti", "str", "trap",
        "getc", "halt", "in", "out", "puts", "putsp"
    ]);

    // all valid assembler directives
    private static directives = new Set([
        ".orig", ".end", ".fill", ".blkw", ".stringz"
    ]);

    // All instructions and directives mapped to the number of operands
    // they take. The only thing not mapped is .blkw, which can accept
    // 1 or 2 operands (handled in this.validOperandCount())
    private static operandCounts = new Map([
        ["add", 3], ["and", 3], ["br", 1], ["brn", 1], ["brz", 1], ["brp", 1],
        ["brnz", 1], ["brnp", 1], ["brzp", 1], ["brnzp", 1], ["jmp", 1], ["jsr", 1],
        ["jsrr", 1], ["ld", 2], ["ldi", 2], ["ldr", 3], ["lea", 2], ["not", 2],
        ["ret", 0], ["rti", 0], ["st", 2], ["sti", 2], ["str", 3], ["trap", 1],
        ["getc", 0], ["halt", 0], ["in", 0], ["out", 0], ["puts", 0], ["putsp", 0],
        [".orig", 1], [".end", 0], [".fill", 1], [".stringz", 1]
    ]);

    // Errors where assembly cannot begin for given file
    private static errors = {
        INFILE: "Source code is empty",
        FIRSTLINE: "The first line of code must be a .ORIG directive"
    };

    private static lastObj: Blob | null = null;
    private static lastSym: Blob | null = null;

    /**
     * Assemble the given source code.
     *
     * If there are errors in the code, print errors to the editor
     * console and return [null, null].
     * If the code is assembled successfully: print a success message
     * to the editor console, return the resulting object file as a
     * Uint16Array and a Map of memory addresses mapped to the source
     * code that was assembled and placed at that address.
     * @param {string} sourceCode the code to assemble
     * @param {boolean} saveFiles if true (default), save the resulting object file and symbol table
     * @returns {Promise<[Uint16Array, Map<number, string>] | null>}
     */
    public static async assemble(sourceCode: string, saveFiles: boolean = true)
        : Promise<[Uint16Array, Map<number, string>] | null>
    {
        let hasError = false;

        // since we are assembling a new program, delete the previously saved
        // object and symbol table files
        if (saveFiles)
        {
            this.lastObj = null;
            this.lastSym = null;
        }

        const srcLines = sourceCode.split(/[\r]?[\n]/);
        if (srcLines.length == 0)
        {
            UI.appendConsole(this.errors.INFILE + "\n");
            return null;
        }
        // object which will generate error messages
        const errorBuilder = new ErrorBuilder(srcLines);
        // helps parse parts of the source code
        const parser = new Parser(errorBuilder);

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
        // maps memory locations to line numbers so we can print line numbers
        // if an error occurs while fixing labels
        const addrToLineNum: Map<number, number> = new Map();

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
        if (!currLine.toLowerCase().startsWith(".orig"))
        {
            UI.appendConsole(this.errors.FIRSTLINE + "\n");
            return null;
        }
        else
        {
            const tokens = Parser.tokenizeLine(currLine);
            if (!this.validOperandCount(tokens))
            {
                UI.appendConsole(errorBuilder.operandCount(lineNum, tokens) + "\n");
                return null;
            }
            const addr = parser.parseImmediate(tokens[1], false, lineNum);
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
                addrToLineNum.set(pc, lineNum);

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
                        UI.appendConsole(errorBuilder.operandCount(lineNum, tokens) + "\n");
                        hasError = true;
                        continue;
                    }
                    const pcInc = parser.parseDirective(lineNum, tokens, pc, memory, toFix);
                    if (pcInc < 0)
                    {
                        atEnd = true;
                    }
                    else if (pcInc == 0)
                    {
                        hasError = true;
                    }
                    else
                    {
                        pc += pcInc;
                    }
                }
                // instruction:
                else if (this.opCodes.has(tokens[0]))
                {
                    if (!this.validOperandCount(tokens))
                    {
                        UI.appendConsole(errorBuilder.operandCount(lineNum, tokens) + "\n");
                        hasError = true;
                        continue;
                    }
                    const word = parser.parseCode(lineNum, tokens, pc, labels, toFix);
                    if (!isNaN(word))
                    {
                        memory[pc] = word;
                        addrToCode.set(pc + startOffset, currLine);
                    }
                    else
                    {
                        memory[pc] = 0;
                        hasError = true;
                    }
                    ++pc;
                }
                else
                {
                    UI.appendConsole(errorBuilder.unknownMnemonic(lineNum, tokens[0]) + "\n");
                    hasError = true;
                }
            } // end if
        } // end white

        // go back and fix branches, label is always last operand
        for (const entry of toFix)
        {
            const tokens = entry[0];
            const loc = entry[1];
            let line = addrToLineNum.get(loc);
            if (typeof(line) === "undefined")
            {
                UI.appendConsole(errorBuilder.noLineNumForAddr(loc) + "\n");
                lineNum = -1;
            }
            else
            {
                lineNum = line;
            }

            // .fill and .blkw use absolute addresses, not offsets
            if (tokens[0] == ".fill")
            {
                const labelVal = labels.get(tokens[1]);
                if (typeof(labelVal) === "undefined")
                {
                    hasError = true;
                    UI.appendConsole(errorBuilder.badLabel(lineNum, tokens[1]) + "\n");
                }
                else
                {
                    memory[loc] = labelVal + startOffset;
                }
            }
            else if (tokens[0] == ".blkw")
            {
                if (labels.has(tokens[2]))
                {
                    const amt = parser.parseImmediate(tokens[1], false, lineNum);
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
                        hasError = true;
                        UI.appendConsole(errorBuilder.badLabel(lineNum, tokens[2]) + "\n");
                    }
                }
                else
                {
                    hasError = true;
                    UI.appendConsole(errorBuilder.badLabel(lineNum, tokens[2]) + "\n");
                }
            }
            else
            {
                const offset = parser.calcLabelOffset(
                    tokens[tokens.length - 1],
                    loc,
                    labels,
                    //@ts-ignore
                    Parser.getImmBitCount(tokens[0]),
                    lineNum
                );
                if (!isNaN(offset))
                {
                    memory[loc] |= offset;
                }
                else
                {
                    hasError = true;
                    UI.appendConsole(errorBuilder.badLabel(lineNum, tokens[0]) + "\n");
                }
            }
        }

        // load resulting machine code into Uint16Array, return it
        const result = new Uint16Array(memory.length + 1);
        result[0] = startOffset;
        let lastLineNum: number = 0;
        for (let i = 0; i < memory.length; i++)
        {
            if (addrToLineNum.has(i))
            {
                // @ts-ignore
                lastLineNum = addrToLineNum.get(i);
            }


            if (memory[i] > 0xFFFF)
            {
                UI.appendConsole(errorBuilder.badMemory(lastLineNum, i + startOffset, memory[i]) + "\n");
                hasError = true;
                result[i + 1] = 0;
            }
            else if (isNaN(memory[i]))
            {
                UI.appendConsole(errorBuilder.nanMemory(lastLineNum, i + startOffset) + "\n");
                hasError = true;
                result[i + 1] = 0;
            }
            else
            {
                result[i + 1] = memory[i];
            }
        }

        if (hasError)
            return null;
        else
        {
            if (saveFiles)
            {
                // save object and symbol table blobs
                await this.makeObjectFileBlob(result);
                await this.makeSymbolTableBlob(labels, startOffset);
            }
            UI.printConsole("Assembly successful.\n")
            return [result, addrToCode];
        }
    }

    /**
     * assuming tokens[0] is a valid instruction, return true if
     * there are a valid number of operands following it
     * @param {string[]} tokens
     * @returns {boolean}
     */
    public static validOperandCount(tokens: string[]) : boolean
    {
        if (tokens[0] == ".blkw")
        {
            return tokens.length == 2 || tokens.length == 3;
        }
        else
        {
            const result = (tokens.length - 1) == this.operandCounts.get(tokens[0]);
            return result;
        }
    }

    /**
     * determine if string is a valid instruction or directive name
     */
    public static validMnemonic(symbol: string) : boolean
    {
        return this.opCodes.has(symbol) || this.directives.has(symbol);
    }

    /**
     * Convert object file into a blob which can be downloaded.
     */
    private static async makeObjectFileBlob(obj: Uint16Array)
    {
        let objStr = "";
        // convert numbers to base-16 strings, add leading zeroes
        for (let i = 0; i < obj.length; i++)
        {
            let curr = obj[i].toString(16);
            while (curr.length < 4)
                curr = "0" + curr;

            if (i % 8 == 7)
            {
                curr += '\n';
            }
            else
            {
                curr += ' ';
            }
            objStr += curr;
        }
        this.lastObj = new Blob(Array.from(objStr.trim() + '\n'), {type:"text/plain"});
    }

    /**
     * Given a mapping of labels to memory addresses, create a plain text symbol
     * table blob.
     * @param labels
     * @param startOffset
     */
    private static async makeSymbolTableBlob(labels: Map<string, number>, startOffset: number)
    {
        let table = "";
        for (let pair of labels)
        {
            let label = pair[0];
            let addr = (pair[1] + startOffset).toString(16);
            table += label + " = " + addr + "\n";
        }
        this.lastSym = new Blob(Array.from(table), {type:"text/plain"});
    }

    /**
     * Return the most recently assembled object file as a plain text blob. If
     * the previous assembly ended in an error or nothing has been assembled
     * yet, returns null.
     */
    public static getObjectFileBlob(): Blob | null
    {
        return this.lastObj;
    }

    /**
     * Return the most recently assembled symbol table as a plain text blob. If
     * the previous assembly ended in an error or nothing has been assembled
     * yet, returns null.
     */
    public static getSymbolTableBlob(): Blob | null
    {
        return this.lastSym;
    }
}
