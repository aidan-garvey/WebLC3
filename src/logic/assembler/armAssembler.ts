/**
 * armAssembler.ts
 *
 * Converts program source code into a binary object file, which consists of the
 * starting address of the program followed by the assembled machine code. It
 * also generates a Map with memory addresses as the keys and corresponding
 * lines of source code as the values, which is used to display the code
 * alongside the computer's memory in the simulator user interface.
 *
 * The algorithms used here are very similar to the LC-3 Assembler class, but
 * there are certain subtle differences in the languages' directives and opcodes
 * that make it so this needs to be a separate class.
 */

import Parser from "./parser";
import UI from "../../presentation/ui";
import ArmErrorBuilder from "./armErrorBuilder";
import ArmParser from "./armParser";

export default class ARMAssembler
{
    // All valid opcodes including trap aliases
    private static opCodes = new Set([
        "adc", "add", "and", "asr", "b", "🅱️",
        "beq", "bne", "bcs", "bcc", "bmi", "bpl", "bvs", "bvc", "bhi", "bls", "bge", "blt", "bgt", "ble",
        "bic", "bl", "bx", "cmn", "cmp", "eor", "ldmia", "ldr", "ldrb", "ldrh", "lsl", "ldsb", "ldsh", "lsr",
        "mov", "mul", "mvn", "neg", "orr", "pop", "push", "ror", "sbc", "stmia", "str", "strb", "strh", "sub",
        "tst", "swi", "rti",

        "getc", "puts", "halt", "out", "putsp", "in"
    ]);

    // All valid assembler directives
    private static directives = new Set([
        ".text", ".global", ".orig", ".data", ".fill", ".blkw", ".stringz"
    ])

    /*
     All instructions and directives mapped to the number of operands they take. Instructions not mapped here can take a
     variable number of operands and are handled in this.validOperandCount.
    */
    private static operandCounts = new Map([
        ["adc", 2], ["and", 2], ["b", 1], ["🅱️", 1],

        ["beq", 1], ["bne", 1], ["bcs", 1], ["bcc", 1], ["bmi", 1], ["bpl", 1], ["bvs", 1], ["bvc", 1], ["bhi", 1],
        ["bls", 1], ["bge", 1], ["blt", 1], ["bgt", 1], ["ble", 1],

        ["bic", 2], ["bl", 1], ["bx", 1], ["cmn", 2], ["cmp", 2], ["eor", 2], ["ldr", 3], ["ldrb", 3], ["ldrh", 3], ["ldsb", 3],
        ["ldsh", 3], ["mov", 2], ["mul", 2], ["mvn", 2], ["neg", 2], ["orr", 2], ["ror", 2], ["sbc", 2], ["strb", 3],
        ["strh", 3], ["tst", 2], ["swi", 1], ["rti", 0],

        ["getc", 0], ["puts", 0], ["halt", 0], ["out", 0], ["putsp", 0], ["in", 0],

        [".text", 0], [".global", 1], [".orig", 1], [".data", 0], [".fill", 1], [".stringz", 1],
    ]);

    // Errors where assembly cannot begin for given file
    private static errors = {
        INFILE: "Source code is empty",
        FIRSTLINE: "The first line of code must be a .ORIG directive",
    };

    // The most recently saved object file
    private static lastObjectFile: Blob | null = null;
    // The most recently saved symbol table
    private static lastSymbolTable: Blob | null = null;

    /**
     * Assemble the given ARM source code.
     *
     * If there are errors in the code, print errors to the editor
     * console and return [null, null].
     * If the code is assembled successfully: print a success message
     * to the editor console, return the resulting object file as a
     * Uint16Array and a Map of memory addresses mapped to the source
     * code that was assembled and placed at that address.
     * @param {string} sourceCode the code to assemble
     * @param {boolean} userCode if true (default), this is the user's code. Save the resulting object file and symbol
     * table and enforce separate text and data sections.
     * @returns {Promise<[Uint16Array, Map<number, string>] | null>}
     */
    public static async assemble(sourceCode: string, userCode: boolean = true)
        : Promise<[Uint16Array, Map<number, string>] | null>
    {
        let hasError = false;

        // Since we're assembling a new program, delete the previously saved object and symbol table files
        if (userCode)
        {
            this.lastObjectFile = null;
            this.lastSymbolTable = null;
        }

        const sourceLines = sourceCode.split(/[\r]?[\n]/);
        if (sourceLines.length == 1 && sourceLines[0] == '')
        {
            UI.appendConsole(this.errors.INFILE + "\n");
            return null;
        }
        // Object to generate error messages
        const errorBuilder = new ArmErrorBuilder(sourceLines);
        // Parses the source code
        const parser = new ArmParser(errorBuilder);

        // Stores the resulting machine code / binary data
        const memory: number[] = [];
        // Maps label names to the address of the label
        const labels: Map<string, number> = new Map();
        /*
         Maps line tokens with label operands to the memory location they're in. After the first pass, we'll revisit
         these to fix the offset values.
         */
        const toFix: Map<string[], number> = new Map();
        // Maps memory locations to the source code they contain
        const addressToCode: Map<number, string> = new Map();
        // Maps memory locations to line numbers so we can print line numbers if an error occurs while fixing labels
        const addressToLineNumber: Map<number, number> = new Map();

        // Memory location of the first line of code
        let startOffset = 0x3000;
        // Index in sourceCode of the line we're currently parsing
        let lineNumber = 0;
        // Index in the memory array (not the final address) of the word we're currently writing
        let pc = 0;

        /*
        ARM code is separated into logic and data sections, but the LC-3 OS has logic and data interweaved in a way
        that's hard to, uh, un-interweave. As such, this enum tracks which section we're currently parsing and whether
        to throw an error if we see logic or data in the wrong section.
        */
        enum Section {Text, Data, NotApplicable}
        let currentSection = Section.NotApplicable;

        /*
        Scan for the first few non-empty lines. They must be an .orig directive, a .text directive, a .global directive
        with the label _start, and a _start label, in that order. Only the .orig directive is mandatory for all code;
        the other lines are only required for user code.
        */
        let currentLine = Parser.trimLine(sourceLines[lineNumber]);
        while (!currentLine)
        {
            currentLine = Parser.trimLine(sourceLines[++lineNumber]);
        }
        if (!currentLine.toLowerCase().startsWith(".orig"))
        {
            UI.appendConsole(this.errors.FIRSTLINE + "\n");
            return null;
        }
        else
        {
            const tokens = Parser.tokenizeLine(currentLine);
            if (!this.validOperandCount(tokens))
            {
                UI.appendConsole(errorBuilder.operandCount(lineNumber, tokens) + "\n");
                return null;
            }
            const addr = parser.parseImmediate(tokens[1], false, lineNumber);
            if (!isNaN(addr))
            {
                startOffset = addr;
            }
            else
            {
                return null;
            }
        }
        /*
        The following lines are handled separately from .orig because the first line simply needed to start with .orig
        but the rest need to be an exact match. Also, the remaining lines are only required for user code (i.e. the
        operating system doesn't need to include them).
        */
        if (userCode)
        {
            const initialLines = [".text", ".global _start", "_start:"]
            for (let i = 0; i < initialLines.length; i++)
            {
                let currentLine = Parser.trimLine(sourceLines[++lineNumber]);
                while (!currentLine)
                {
                    currentLine = Parser.trimLine(sourceLines[++lineNumber]);
                }

                if (currentLine.toLowerCase() != initialLines[i])
                {
                    let error;
                    switch (i)
                    {
                        case 0: error = "The second line of code must be a .TEXT directive"; break;
                        case 1: error = "The third line of code must be a .GLOBAL directive followed by the label _start"; break;
                        case 2: error = 'The fourth line of code must be "_start:"'; break;
                    }
                    UI.appendConsole(error + '\n');
                    return null
                }
            }
            labels.set("_start", pc);
            currentSection = Section.Text;
        }

        while (++lineNumber < sourceLines.length)
        {
            currentLine = Parser.trimLine(sourceLines[lineNumber]);
            if (currentLine)
            {
                addressToLineNumber.set(pc, lineNumber);

                const tokens = Parser.tokenizeLine(currentLine);
                // Label
                if (tokens[0][0] != '.' && !this.opCodes.has(tokens[0]))
                {
                    labels.set(tokens[0], pc);
                    // Remove label from line
                    tokens.shift();
                    if (tokens.length == 0)
                        continue;
                }

                // Assembler directive
                if (this.directives.has(tokens[0]))
                {
                    if (tokens[0] == ".data")
                        currentSection = Section.Data;
                    else if (tokens[0] == ".text")
                        currentSection = Section.Text;
                    else if (currentSection == Section.Text)
                    {
                        UI.appendConsole(errorBuilder.formatMessage(
                            lineNumber, "Cannot include data in text section.") + '\n');
                        hasError = true;
                        break;
                    }

                    if (!this.validOperandCount(tokens))
                    {
                        UI.appendConsole(errorBuilder.operandCount(lineNumber, tokens) + "\n");
                        hasError = true;
                        continue;
                    }

                    const pcIncrement = parser.parseDirective(lineNumber, tokens, pc, memory, toFix);
                    if (pcIncrement <= 0)
                    {
                        hasError == true;
                    }
                    else
                    {
                        pc += pcIncrement;
                    }
                }
                // Instruction
                else if (this.opCodes.has(tokens[0]))
                {
                    if (currentSection == Section.Data)
                    {
                        UI.appendConsole(errorBuilder.formatMessage(
                            lineNumber, "Cannot include instructions in data section.") + '\n');
                        hasError = true;
                        break;
                    }

                    if (!this.validOperandCount(tokens))
                    {
                        UI.appendConsole(errorBuilder.operandCount(lineNumber, tokens) + "\n");
                        hasError = true;
                        continue;
                    }
                    const words = parser.parseInstruction(lineNumber, tokens, pc, labels, toFix);
                    for (let i = 0; i < words.length; i++)
                    {
                        if (!isNaN(words[i]))
                        {
                            memory[pc] = words[i];
                            addressToCode.set(pc + startOffset, currentLine);
                        }
                        else
                        {
                            UI.appendConsole(errorBuilder.nanMemory(lineNumber, pc) + "\n");
                            memory[pc] = 0;
                            hasError = true;
                        }
                        ++pc;
                    }
                }
                else
                {
                    UI.appendConsole(errorBuilder.unknownMnemonic(lineNumber, tokens[0]) + "\n");
                    hasError = true;
                }
            }
        }

        // Go back and fix branches
        for (const entry of toFix)
        {
            const tokens = entry[0];
            const location = entry[1];
            let line = addressToLineNumber.get(location);
            if (typeof(line) === "undefined")
            {
                UI.appendConsole(errorBuilder.noLineNumForAddr(location) + "\n");
                lineNumber = -1;
            }
            else
            {
                lineNumber = line;
            }

            // .fill and .blkw use absolute addresses, not offsets
            if (tokens[0] == ".fill")
            {
                const labelVal = labels.get(tokens[1]);
                if (typeof(labelVal) === "undefined")
                {
                    hasError = true;
                    UI.appendConsole(errorBuilder.badLabel(lineNumber, tokens[1]) + "\n");
                }
                else
                {
                    memory[location] = labelVal + startOffset;
                }
            }
            else if (tokens[0] == ".blkw")
            {
                if (labels.has(tokens[2]))
                {
                    const amt = parser.parseImmediate(tokens[1], false, lineNumber);
                    if (!isNaN(amt))
                    {
                        for (let i = 0; i < amt; i++)
                        {
                            // @ts-ignore
                            memory[location + i] = labels.get(tokens[2]) + startOffset;
                        }
                    }
                    else
                    {
                        hasError = true;
                        UI.appendConsole(errorBuilder.badLabel(lineNumber, tokens[2]) + "\n");
                    }
                }
                else
                {
                    hasError = true;
                    UI.appendConsole(errorBuilder.badLabel(lineNumber, tokens[2]) + "\n");
                }
            }
            else
            {
                let offsetSize;
                switch (tokens[0])
                {
                    case 'bl': offsetSize = 11; break;
                    case 'ldr': offsetSize = 9; break;
                    default: offsetSize = 8;    break;
                }

                let label;
                if (tokens[tokens.length - 1].startsWith('='))
                    label = tokens[tokens.length - 1].substring(1);
                else
                    label = tokens[tokens.length - 1];

                const offset = parser.calcLabelOffset(label, location, labels, offsetSize, lineNumber);
                if (labels.has(label))
                {
                    if (isNaN(offset))
                        hasError = true;
                    else
                        memory[location] |= offset;
                }
                else
                {
                    hasError = true;
                    UI.appendConsole(errorBuilder.badLabel(lineNumber, tokens[0]) + "\n");
                }
            }
        }

        // Load resulting machine code into Uint16Array and return it
        const result = new Uint16Array(memory.length + 1);
        result[0] = startOffset;
        let lastLineNumber: number = 0;
        for (let i = 0; i < memory.length; i++)
        {
            if (addressToLineNumber.has(i))
            {
                // @ts-ignore
                lastLineNumber = addressToLineNumber.get(i);
            }

            if (memory[i] > 0xffff)
            {
                UI.appendConsole(errorBuilder.badMemory(lastLineNumber, i + startOffset, memory[i]) + "\n");
                hasError = true;
                result[i + 1] = 0;
            }
            else if (isNaN(memory[i]))
            {
                UI.appendConsole(errorBuilder.nanMemory(lastLineNumber, i + startOffset) + "\n");
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
            if (userCode)
            {
                // Save object and symbol table blobs
                await this.makeObjectFileBlob(result);
                await this.makeSymbolTableBlob(labels, startOffset);
            }
            UI.printConsole("Assembly successful. \n");
            return [result, addressToCode]
        }

    }

    /**
     * Assuming tokens[0] is a valid instruction, return true if there are a valid number of operands following it
     * @param {string[]} tokens
     * @returns {boolean}
     */
    public static validOperandCount(tokens: string[]): boolean
    {
        switch (tokens[0])
        {
            case ".blkw":
                return tokens.length == 2 || tokens.length == 3;
            case "add":
            case "asr":
            case "lsl":
            case "lsr":
            case "str":
            case "sub":
                return tokens.length == 3 || tokens.length == 4;
            case "ldmia":
            case "pop":
            case "push":
            case "stmia":
                return tokens.length > 1;

            default:
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
     * Converts object file into a blob that can be downloaded
     * @param {Uint16Array} object
     */
    private static async makeObjectFileBlob(object: Uint16Array)
    {
        let objectString = "";
        // Convert numbers to base-16 strings, add leading zeroes
        for (let i = 0; i < object.length; i++)
        {
            let currentLine = object[i].toString(16);
            while (currentLine.length < 4)
                currentLine = "0" + currentLine;

            if (i % 8 == 7)
            {
                currentLine += '\n';
            }
            else
            {
                currentLine += ' ';
            }
            objectString += currentLine;
        }
        this.lastObjectFile = new Blob(Array.from(objectString.trim() + '\n'), { type: "text/plan" });
    }

    /**
     * Given a mapping of labels to memory addresses, creates a plain text symbol table blob
     * @param {Map<string, number>} labels
     * @param {number} startOffset
     */
    private static async makeSymbolTableBlob(labels: Map<string, number>, startOffset: number)
    {
        let table = "";
        for (let pair of labels)
        {
            let label = pair[0];
            let address = (pair[1] + startOffset).toString(16);
            table += label + " = " + address + "\n";
        }
        this.lastSymbolTable = new Blob(Array.from(table), { type: "text/plain" });
    }

    /**
     * Return the most recently assembled object file as a plain text blob. If
     * the previous assembly ended in an error or nothing has been assembled
     * yet, returns null.
     */
    public static getObjectFileBlob(): Blob | null
    {
        return this.lastObjectFile;
    }

    /**
     * Return the most recently assembled symbol table as a plain text blob. If
     * the previous assembly ended in an error or nothing has been assembled
     * yet, returns null.
     */
    public static getSymbolTableBlob(): Blob | null
    {
        return this.lastSymbolTable;
    }
}