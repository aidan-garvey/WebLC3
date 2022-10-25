/**
 * parser.ts
 * 
 * Splits lines of source code into individual tokens, converts
 * tokenized source code into machine code. Also contains methods for
 * parsing tokens as any type of operand.
 */

import Assembler from "./assembler";
import type ErrorBuilder from "./errorBuilder";
import FakeUI from "./fakeUI";

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
 
    private errorBuilder: ErrorBuilder;

    public constructor(errorBuilder: ErrorBuilder)
    {
        this.errorBuilder = errorBuilder;
    }

    /**
     * Trim leading and trailing whitespace and remove any comments
     * from a line of source code, convert to lowercase.
     * @param {string} line 
     * @returns {string}
     */
    static trimLine(line: string) : string
    {
        let res = line;
        const cmt = line.indexOf(';');
        if (cmt >= 0)
        {
            res = line.substring(0, cmt);
        }
        return res.trim().toLowerCase();
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
        const result = parseInt(token.substring(start), radix);
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
            FakeUI.print(this.errorBuilder.immOperand(lineNum, token));
            Assembler.hasError = true;
            return NaN;
        }
        // value does not fit in allowed bits
        else if (result < min || result > max)
        {
            FakeUI.print(this.errorBuilder.immBoundsBits(lineNum, bits, token));
            Assembler.hasError = true;
            return NaN;
        }
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
    private stringToCodes(literal: string, lineNum: number) : number[]
    {
        const result = [];
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
            FakeUI.print(this.errorBuilder.badQuotes(lineNum, literal));
            Assembler.hasError = true;
        }
        // @ts-ignore
        return result;
    }

    /**
     * Parse a register operand, return the register number
     * @param {string} regStr 
     * @returns {number}
     */
    private parseReg(regStr: string, lineNum: number) : number
    {
        if (regStr[0] != 'r' && regStr[0] != 'R')
        {
            FakeUI.print(this.errorBuilder.badRegister(lineNum, regStr));
            Assembler.hasError = true;
            return NaN;
        }
        else
        {
            const regNum = parseInt(regStr.substring(1));
            if (isNaN(regNum) || regNum < 0 || regNum >= 8)
            {
                FakeUI.print(this.errorBuilder.badRegister(lineNum, regStr));
                Assembler.hasError = true;
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
                FakeUI.print(this.errorBuilder.labelBounds(lineNum, label, bits));
                Assembler.hasError = true;
                return NaN;
            }
            else
            {
                return diff & mask;
            }
        }
        else
        {
            FakeUI.print(this.errorBuilder.badLabel(lineNum, label));
            Assembler.hasError = true;
            return NaN;
        }
    }

    /**
     * Divide a line of source code into an array of token strings.
     * @param {string} line 
     * @returns {string[]}
     */
    static tokenizeLine(line: string) : string[]
    {
        // if the line contains a string literal, split it off first
        const firstQuote = line.search(/['"]/);
        let stringOperand = "";
        if (firstQuote >= 0)
        {
            stringOperand = line.slice(firstQuote);
            line = line.slice(0, firstQuote);
        }

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
            return this.asmBrJsr(tokens, pc, labels, toFix);
        switch (tokens[0])
        {
            case "add":
            case "and":
            case "not":
                return this.asmAluOp(lineNum, tokens);
            case "jsr":
                return this.asmBrJsr(tokens, pc, labels, toFix);
            case "jmp":
            case "jsrr":
                return this.asmRegJump(tokens);
            case "ld":
            case "ldi":
            case "lea":
            case "st":
            case "sti":
                return this.asmPcLoadStore(tokens, pc, labels, toFix);
            case "ldr":
            case "str":
                return this.asmRegLoadStore(tokens);
            case "trap":
                return this.asmTrap(tokens[1]);
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
        // @ts-ignore
        res |= this.parseReg(tokens[1]) << 9;
        // source reg 1
        // @ts-ignore
        res |= this.parseReg(tokens[2]) << 6;

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
                // @ts-ignore
                source2 = this.parseImmediate(tokens[3], true, Parser.immBitCounts.get(tokens[0]));
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
     * @param {string[]} tokens 
     * @param {number} pc 
     * @param {Map<string, number>} labels 
     * @param {Map<string[], number>} toFix 
     * @returns {number}
     */
    private asmBrJsr(tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>) : number
    {
        let res = Parser.opcodeVals.get(tokens[0]);
        let bits = Parser.immBitCounts.get(tokens[0]);
        if (labels.has(tokens[1]))
        {
            // @ts-ignore
            return res | this.calcLabelOffset(tokens[1], pc, labels, bits);
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
     * @param {string[]} tokens 
     * @returns {number}
     */
    private asmRegJump(tokens: string[]) : number
    {
        let res = Parser.opcodeVals.get(tokens[0]);
        // @ts-ignore
        return (res | this.parseReg(tokens[1])) << 6;
    }

    /**
     * generate machine code for a load or store operation which uses a PC offset
     * @param {string[]} tokens 
     * @param {number} pc 
     * @param {Map<string, number>} labels 
     * @param {Map<string[], number>} toFix 
     * @returns {number}
     */
    private asmPcLoadStore(tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>) : number
    {
        let res = Parser.opcodeVals.get(tokens[0]);
        // @ts-ignore
        res |= this.parseReg(tokens[1]) << 9;
        if (labels.has(tokens[2]))
        {
            // @ts-ignore
            return res | this.calcLabelOffset(tokens[2], pc, labels, this.immBitCounts.get(tokens[0]));
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
     * @param {string[]} tokens 
     * @returns {number}
     */
    private asmRegLoadStore(tokens: string[]) : number
    {
        let res = Parser.opcodeVals.get(tokens[0]);
        // @ts-ignore
        res |= this.parseReg(tokens[1]) << 9;
        // @ts-ignore
        res |= this.parseReg(tokens[2]) << 6;
        // @ts-ignore
        let imm = this.parseImmediate(tokens[3], true, Parser.immBitCounts.get(tokens[0]));
        if (isNaN(imm))
            return NaN;
        else
            // @ts-ignore
            return res | imm;
    }

    /**
     * generate machine code for a trap instruction
     * @param {string} code 
     * @returns {number}
     */
    private asmTrap(code: string) : number
    {
        let immCode = this.parseImmediate(code, false, 8);
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
                FakeUI.print(Assembler.errors.MULTORIG);
                Assembler.hasError = true;
                break;

            case ".end":
                inc = -1;
                break;

            case ".fill":
                // if the first 1 or 2 characters indicate a numerical value
                if (tokens[1].match(/^[#bBxX].+$/) != null)
                {
                    val = this.parseImmediate(tokens[1], false, lineNum);
                    if (!isNaN(val))
                    {
                        memory[pc] = val;
                        inc = 1;
                    }
                }
                // label being used as address, does not start with digit
                else if (tokens[1].match(/^\D.*$/) != null)
                {
                    inc = 1;
                    toFix.set(tokens, pc);
                }
                break;

            case ".blkw":
                const amt = this.parseImmediate(tokens[1], false, lineNum);
                val = 0;
                if (tokens.length == 3)
                {
                    if (tokens[2].match(/^[#bBxX].+$/) != null)
                    {
                        val = this.parseImmediate(tokens[2], false, lineNum);
                    }
                    else if (tokens[2].match(/^\D.*$/) != null)
                    {
                        inc = 1;
                        toFix.set(tokens, pc);
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
                if (codes != null && codes.length > 0)
                {
                    for (let i = 0; i < codes.length; i++)
                    {
                        memory[pc++] = codes[i];
                    }
                    // null-terminate the string
                    memory[pc++] = 0;
                    inc = codes.length + 1;
                }
                break;
        }

        return inc;
    }
}
