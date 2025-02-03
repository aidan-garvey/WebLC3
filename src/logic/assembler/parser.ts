/**
 * parser.ts
 *
 * Splits lines of source code into individual tokens and converts tokenized
 * source code into machine code. Also contains methods for parsing tokens as
 * different types of operand.
 */

import type ErrorBuilder from "./errorBuilder";
import UI from "../../presentation/ui";

export default class Parser
{
    // instruction mnemonics mapped to opcodes
    private static opcodeVals = new Map([
        // instructions
        ["add", 0x1000], ["and", 0x5000], ["br", 0x0E00], ["brn", 0x0800],
        ["brz", 0x0400], ["brp", 0x0200], ["brnz", 0x0C00], ["brnp", 0x0A00],
        ["brzp", 0x0600], ["brnzp", 0x0E00], ["jmp", 0xC000], ["jsr", 0x4800],
        ["jsrr", 0x4000], ["ld", 0x2000], ["ldi", 0xA000], ["ldr", 0x6000],
        ["lea", 0xE000], ["not", 0x903F], ["ret", 0xC1C0], ["rti", 0x8000],
        ["st", 0x3000], ["sti", 0xB000], ["str", 0x7000], ["trap", 0xF000],
        // trap aliases
        ["getc", 0xF020], ["halt", 0xF025], ["in", 0xF023],
        ["out", 0xF021], ["puts", 0xF022], ["putsp", 0xF024]
    ]);

    // instruction mnemonics mapped to their allowed length in bits of immediate operands
    private static immBitCounts = new Map([
        ["add", 5], ["and", 5], ["br", 9], ["brn", 9], ["brz", 9], ["brp", 9],
        ["brnz", 9], ["brnp", 9], ["brzp", 9], ["brnzp", 9], ["jsr", 11], ["ld", 9],
        ["ldi", 9], ["ldr", 6], ["lea", 9], ["st", 9], ["sti", 9], ["str", 6]
    ]);

    // valid escape codes mapped to ascii values
    private static escapes = new Map([
        ['\\', '\\'.charCodeAt(0)],
        ['\'', '\''.charCodeAt(0)],
        ['\"', '\"'.charCodeAt(0)],
        ['n', '\n'.charCodeAt(0)],
        ['r', '\r'.charCodeAt(0)],
        ['t', '\t'.charCodeAt(0)]
    ]);

    protected errorBuilder: ErrorBuilder;

    public constructor(errorBuilder: ErrorBuilder)
    {
        this.errorBuilder = errorBuilder;
    }

    public static getImmBitCount(token: string)
    : number | undefined
    {
        return this.immBitCounts.get(token);
    }

    /**
     * Given a line and an index in that line, return true if the character is
     * in a string literal
     * @param line
     * @param index
     */
    private static inQuotes(line: string, index: number) : boolean
    {
        let quotes = false;
        let lastQuote = '\0';
        for (let i = 0; i < line.length; i++)
        {
            if (i == index)
            {
                return quotes;
            }
            else if (line[i] == "'" || line[i] == '"')
            {
                // openning a new set of quotes
                if (!quotes)
                {
                    quotes = true;
                    lastQuote = line[i];
                }
                // closing the current set of quotes
                else if (line[i] == lastQuote)
                {
                    quotes = false;
                }
                // else: it's a ' within "...", or a " within '...'
            }
        }
        return quotes;
    }

    /**
     * Trim leading and trailing whitespace and remove any comments
     * from a line of source code, convert to lowercase.
     * @param {string} line
     * @returns {string}
     */
    public static trimLine(line: string) : string
    {
        let res = line;
        // comment begins at the first semicolon not within quotes
        let comment = line.indexOf(';');
        while (comment >= 0 && this.inQuotes(line, comment))
        {
            comment = line.indexOf(';', comment + 1);
        }
        if (comment >= 0)
        {
            res = line.substring(0, comment);
        }
        return res.trim();
    }

    /**
     * Return true if all characters are valid in the specified radix
     * @param numString
     * @param radix
     */
    private validDigits(numString: string, radix: number): boolean
    {
        // @ts-ignore
        const zeroCode: number = '0'.codePointAt(0);
        const digitMax = zeroCode + radix - 1;
        // @ts-ignore
        const aCode: number = 'a'.codePointAt(0);
        const letterMax = radix > 10? aCode + radix - 11 : undefined;

        let i = 0;
        // allow a negative sign only for decimal numbers
        if (radix == 10 && numString[0] == '-')
            i = 1;

        for (; i < numString.length; i++)
        {
            // @ts-ignore
            let curr: number = numString.codePointAt(i);
            if (curr >= zeroCode && curr <= digitMax)
            {
                continue;
            }
            else if (letterMax && curr >= aCode && curr <= letterMax)
            {
                continue;
            }
            else
            {
                return false;
            }
        }

        return true;
    }

    /**
     * Parse an immediate value, which can be decimal, binary or hexadecimal.
     * If it is not a valid value, return NaN.
     * @param {string} token: the value to parse
     * @param {boolean} signed: is this immedate a signed value?
     * @param {number} lineNum
     * @param {number} bits: length, in bits, that the value is allowed to be
     * @returns {number}
     */
    public parseImmediate(
        token: string,
        signed: boolean,
        lineNum: number,
        bits: number = 16,) : number
    {
        let mask = 0;
        for (let i = 0; i < bits; i++)
        {
            mask <<= 1;
            mask += 1;
        }

        let radix = 10;
        let start = 0;

        // 0x or 0X prefix
        if (token.startsWith("0x"))
        {
            start = 2;
            radix = 16;
        }
        // 0b or 0B prefix
        else if (token.startsWith("0b"))
        {
            start = 2;
            radix = 2;
        }
        // #?[bBxX]? prefix
        else
        {
            // it's optional to use '#' with 'x' or 'b'
            if (token[start] == '#')
            {
                ++start;
            }

            if (token[start] == 'x')
            {
                radix = 16;
                ++start;
            }
            else if (token[start] == 'b')
            {
                radix = 2;
                ++start;
            }
        }

        const numString = token.substring(start);
        let result;

        // only call parseInt if the digits are valid in the string
        if (this.validDigits(numString, radix))
        {
            result = parseInt(numString, radix);
        }
        else
        {
            result = NaN;
        }

        let max: number;
        let min: number;

        // if no sign extension will occur, allow signed or unsigned values
        if (bits === 16)
        {
            max = (1 << bits) - 1;
            min = -(1 << (bits - 1));
        }
        else if (signed)
        {
            max = (1 << (bits - 1)) - 1;
            min = -(1 << (bits - 1));
        }
        else
        {
            max = (1 << bits) - 1;
            min = 0;
        }
        // parseInt failed
        if (isNaN(result))
        {
            UI.appendConsole(this.errorBuilder.immOperand(lineNum, token) + "\n");
            return NaN;
        }
        // value does not fit in allowed bits
        else if (result < min || result > max)
        {
            UI.appendConsole(this.errorBuilder.immBoundsBits(lineNum, bits, token) + "\n");
            return NaN;
        }
        // parsing successful
        else
        {
            return result & mask;
        }
    }

    /**
     * Convert a string into a list of ascii codes
     * @param {string} literal
     * @returns {number[]}
     */
    protected stringToCodes(literal: string, lineNum: number) : number[] | null
    {
        const result: number[] = [];
        let quote = literal[0];
        if ((quote == '"' || quote == "'") && literal[literal.length - 1] == quote)
        {
            for (let i = 1; i < literal.length - 1; i++)
            {
                // if there is an escape sequence
                if (literal[i] === '\\' && i < literal.length - 2 && Parser.escapes.has(literal[i+1]))
                {
                    // we want to jump over the escaped character before the next iteration
                    ++i;
                    // @ts-ignore
                    result.push(Parser.escapes.get(literal[i]));
                }
                else
                {
                    result.push(literal.charCodeAt(i));
                }

            }
        }
        else
        {
            UI.appendConsole(this.errorBuilder.badQuotes(lineNum, literal) + "\n");
            return null;
        }
        return result;
    }

    /**
     * Parse a register operand, return the register number
     * @param {string} regStr
     * @param {number} lineNum
     * @returns {number}
     */
    protected parseReg(regStr: string, lineNum: number) : number
    {
        if (regStr[0] != 'r' && regStr[0] != 'R')
        {
            UI.appendConsole(this.errorBuilder.badRegister(lineNum, regStr) + "\n");
            return NaN;
        }
        else
        {
            const regNum = parseInt(regStr.substring(1));
            if (isNaN(regNum) || regNum < 0 || regNum >= 8)
            {
                UI.appendConsole(this.errorBuilder.badRegister(lineNum, regStr) + "\n");
                return NaN;
            }
            else
            {
                return regNum;
            }
        }
    }

    /**
     * Calculate the difference between a label's address and the PC.
     * If the labels map does not contain the label, or the difference
     * does not fit in the given number of bits, return NaN.
     * Otherwise, return the value converted to unsigned and truncated
     * to the given number of bits.
     * This function requires the PC to be the location of the instruction
     * with the label operand, NOT incremented as it would be when adding
     * the offset to the PC during execution.
     * @param {string} label
     * @param {number} pc
     * @param {Map<string, number>} labels
     * @param {number} bits
     * @param {number} lineNum
     * @returns {number}
     */
    public calcLabelOffset(
        label: string,
        pc: number,
        labels: Map<string, number>,
        bits: number,
        lineNum: number)
    : number
    {
        let mask = 0;
        for (let i = 0; i < bits; i++)
        {
            mask <<= 1;
            mask += 1;
        }
        if (labels.has(label))
        {
            // ts says diff may be undefined despite the above if statement
            // @ts-ignore
            const diff = labels.get(label) - (pc + 1);
            const max = (1<<(bits-1))-1;
            const min = -(1<<(bits-1));
            if (diff < min || diff > max)
            {
                UI.appendConsole(this.errorBuilder.labelBounds(lineNum, label, bits) + "\n");
                return NaN;
            }
            else
            {
                return diff & mask;
            }
        }
        else
        {
            UI.appendConsole(this.errorBuilder.badLabel(lineNum, label) + "\n");
            return NaN;
        }
    }

    /**
     * Divide a line of source code into an array of token strings.
     * All source code, except string literals, are converted to lowercase.
     * @param {string} line
     * @returns {string[]}
     */
    public static tokenizeLine(line: string) : string[]
    {
        // if the line contains a string literal, split it off first
        const firstQuote = line.search(/['"]/);
        let stringOperand = "";
        if (firstQuote >= 0)
        {
            stringOperand = line.slice(firstQuote);
            line = line.slice(0, firstQuote);
        }
        line = line.toLowerCase();

        /**
         * split on colons and commas
         * trim all resulting strings
         * split remaining non-empty strings on whitespace
         */
        const tokens = line.split(/[,:]/)
        for (let i = 0; i < tokens.length; i++)
        {
            tokens[i] = tokens[i].trim();
        }
        // if we have a line with just a label and colon, remove the empty token after the colon
        if (tokens.length == 2 && !tokens[1])
            tokens.pop();

        const result = [];
        for (let i = 0; i < tokens.length; i++)
        {
            const t = tokens[i].split(/[\s]+/);
            for (let j = 0; j < t.length; j++)
            {
                result.push(t[j]);
            }
        }

        if (firstQuote >= 0)
        {
            result.push(stringOperand);
        }
        return result;
    }

    /**
     * Convert a line of source code into machine code
     * @param {number} lineNum
     * @param {string[]} tokens
     * @param {number} pc
     * @param {Map<string, number>} labels
     * @param {Map<string[], number>} toFix
     * @returns {number}
     */
    // Given a tokenized line of source code; the location of the
    // instruction (given by pc); the known labels in the program; and
    // the map containing labels which have yet to be defined, return
    // the resulting machine code for that instruction.
    public parseCode(lineNum: number, tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>) : number
    {
        if (tokens[0].startsWith("br"))
            return this.asmBrJsr(lineNum, tokens, pc, labels, toFix);

        switch (tokens[0])
        {
            case "add":
            case "and":
            case "not":
                return this.asmAluOp(lineNum, tokens);
            case "jsr":
                return this.asmBrJsr(lineNum, tokens, pc, labels, toFix);
            case "jmp":
            case "jsrr":
                return this.asmRegJump(lineNum, tokens);
            case "ld":
            case "ldi":
            case "lea":
            case "st":
            case "sti":
                return this.asmPcLoadStore(lineNum, tokens, pc, labels, toFix);
            case "ldr":
            case "str":
                return this.asmRegLoadStore(lineNum, tokens);
            case "trap":
                return this.asmTrap(lineNum, tokens[1]);
            case "getc":
            case "out":
            case "puts":
            case "in":
            case "putsp":
            case "halt":
                return this.asmTrapAlias(tokens[0]);
            case "ret":
                return 0b1100_0001_1100_0000;
            case "rti":
                return 0b1000_0000_0000_0000;
            default:
                return NaN;
        }
    }

    /**
     * generate machine code for an arithmetic operation (add, and, not)
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmAluOp(lineNum: number, tokens: string[]) : number
    {
        let res = Parser.opcodeVals.get(tokens[0]);

        // destination register
        const destReg = this.parseReg(tokens[1], lineNum);
        if (isNaN(destReg))
            return NaN;

        // source register 1
        const source1 = this.parseReg(tokens[2], lineNum);
        if (isNaN(source1))
            return NaN;

        // @ts-ignore
        res |= (destReg << 9) | (source1 << 6);

        // if doing NOT, we only need 2 registers
        if (tokens[0] != "not")
        {
            // try to treat last operand as a register
            let source2;
            if (tokens[3][0] == 'r' || tokens[3][0] == 'R')
                source2 = this.parseReg(tokens[3], lineNum);
            else
            {
                // set immediate flag
                // @ts-ignore
                res |= 0b10_0000;
                source2 = this.parseImmediate(tokens[3], true, lineNum, Parser.immBitCounts.get(tokens[0]));
            }

            if (!isNaN(source2))
            {
                // @ts-ignore
                res |= source2;
            }
            else
            {
                return NaN;
            }
        }

        // @ts-ignore
        return res;
    }

    /**
     * generate machine code for a branch or subroutine call (control flow with PC offset)
     * @param {number} lineNum
     * @param {string[]} tokens
     * @param {number} pc
     * @param {Map<string, number>} labels
     * @param {Map<string[], number>} toFix
     * @returns {number}
     */
    private asmBrJsr(lineNum: number, tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>) : number
    {
        let res = Parser.opcodeVals.get(tokens[0]);
        const bits = Parser.immBitCounts.get(tokens[0]);
        if (labels.has(tokens[1]))
        {
            // @ts-ignore
            const offset = this.calcLabelOffset(tokens[1], pc, labels, bits, lineNum);
            if (isNaN(offset))
                return NaN;

            // @ts-ignore
            return res | offset;
        }
        else
        {
            toFix.set(tokens, pc);
            // @ts-ignore
            return res;
        }
    }

    /**
     * generate machine code for JMP or JSRR (control flow with a register)
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmRegJump(lineNum: number, tokens: string[]) : number
    {
        let res = Parser.opcodeVals.get(tokens[0]);
        const reg = this.parseReg(tokens[1], lineNum);
        if (isNaN(reg))
            return NaN;
        // @ts-ignore
        return res | (reg << 6);
    }

    /**
     * generate machine code for a load or store operation which uses a PC offset
     * @param {lineNum}
     * @param {string[]} tokens
     * @param {number} pc
     * @param {Map<string, number>} labels
     * @param {Map<string[], number>} toFix
     * @returns {number}
     */
    private asmPcLoadStore(lineNum: number, tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>) : number
    {
        let res = Parser.opcodeVals.get(tokens[0]);
        const reg = this.parseReg(tokens[1], lineNum);
        if (isNaN(reg))
            return NaN;

        // @ts-ignore
        res |= reg << 9;

        if (labels.has(tokens[2]))
        {
            // @ts-ignore
            const offset = this.calcLabelOffset(tokens[2], pc, labels, Parser.immBitCounts.get(tokens[0]), lineNum);
            if (isNaN(offset))
                return NaN;

            // @ts-ignore
            return res | offset;
        }
        else
        {
            toFix.set(tokens, pc);
            // @ts-ignore
            return res;
        }
    }

    /**
     * generate machine code for a load or store which uses a register + immediate offset
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmRegLoadStore(lineNum: number, tokens: string[]) : number
    {
        let res = Parser.opcodeVals.get(tokens[0]);
        const destReg = this.parseReg(tokens[1], lineNum);
        const srcReg = this.parseReg(tokens[2], lineNum);
        const imm = this.parseImmediate(tokens[3], true, lineNum, Parser.immBitCounts.get(tokens[0]));

        if (isNaN(destReg) || isNaN(srcReg) || isNaN(imm))
            return NaN;

        // @ts-ignore
        res |= destReg << 9;
        // @ts-ignore
        res |= srcReg << 6;
        // @ts-ignore
        return res | imm;
    }

    /**
     * generate machine code for a trap instruction
     * @param {number} lineNum
     * @param {string} code
     * @returns {number}
     */
    private asmTrap(lineNum: number, code: string) : number
    {
        let immCode = this.parseImmediate(code, false, lineNum, 8);
        if (isNaN(immCode))
            return NaN;
        else
            return 0xF000 | (immCode & 0xFF);
    }

    /**
     * generate machine code for a trap alias
     * @param {string} alias
     * @returns {number}
     */
    private asmTrapAlias(alias: string) : number
    {
        // @ts-ignore
        return Parser.opcodeVals.get(alias);
    }

    /**
     * Given a tokenized line of source code with an assembler
     * directive, handle its effects and return the amount that
     * the program counter must be increased by after the operation.
     * If the directive is .end, return -1.
     * If there is an error, return 0.
     * Assumes that the number of operands is valid.
     * @param {number} lineNum
     * @param {string[]} tokens
     * @param {number} pc
     * @param {number[]} memory
     * @returns {number}
     */
    public parseDirective(
        lineNum: number,
        tokens: string[],
        pc: number,
        memory: number[],
        toFix: Map<string[], number>)
    : number
    {
        let inc = 0;
        let val;
        switch (tokens[0])
        {
            case ".orig":
                UI.appendConsole(this.errorBuilder.multiOrig(lineNum) + "\n");
                break;

            case ".end":
                inc = -1;
                break;

            case ".fill":
                // if first character is alphabetical or an underscore, treat operand as a label
                // (unless the operand matches the pattern for a binary or hex value)
                if (tokens[1].match(/^[a-zA-Z_]/) != null && tokens[1].match(/^[xX][0-9a-fA-F]+$/) == null && tokens[1].match(/^[bB][0-1]+$/) == null)
                {
                    inc = 1;
                    toFix.set(tokens, pc);
                }
                // otherwise, attempt to use it as a number
                else
                {
                    val = this.parseImmediate(tokens[1], false, lineNum);
                    if (!isNaN(val))
                    {
                        memory[pc] = val;
                        inc = 1;
                    }
                }
                break;

            case ".blkw":
                const amt = this.parseImmediate(tokens[1], false, lineNum);
                val = 0;
                if (tokens.length == 3)
                {
                    // if first character is alphabetical or an underscore, treat operand as a label
                    if (tokens[2].match(/^[a-zA-Z_]/) != null && tokens[2].match(/^[xX][0-9a-fA-F]+$/) == null && tokens[2].match(/^[bB][0-1]+$/) == null)
                    {
                        inc = 1;
                        toFix.set(tokens, pc);
                    }
                    else
                    {
                        val = this.parseImmediate(tokens[2], false, lineNum);
                    }
                }
                if (!isNaN(val) && !isNaN(amt))
                {
                    for (let i = 0; i < amt; i++)
                    {
                        memory[pc++] = val;
                    }
                    inc = amt;
                }
                break;

            case ".stringz":
                const codes = this.stringToCodes(tokens[1], lineNum);
                if (codes !== null && codes.length > 0)
                {
                    for (let i = 0; i < codes.length; i++)
                    {
                        memory[pc++] = codes[i];
                    }
                    // null-terminate the string
                    memory[pc++] = 0;
                    inc = codes.length + 1;
                }
                else if (codes !== null)
                {
                    UI.appendConsole(this.errorBuilder.emptyString(lineNum) + "\n");
                }
                break;
        }

        return inc;
    }
}
