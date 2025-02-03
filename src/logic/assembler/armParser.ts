/**
 * armParser.ts
 *
 * Splits lines of source code into individual tokens and converts tokenized source code into machine code
 */

import Parser from "./parser";
import UI from "../../presentation/ui";

export default class ArmParser extends Parser
{
    /**
     * Converts a line of source code into at least one line of machine code. Should generally be used instead of
     * parseCode, since this supports instructions that assemble into multiple words of machine code.
     * @param {number} lineNum
     * @param {string[]} tokens
     * @param {number} pc
     * @param {Map<string, number>} labels
     * @param {Map<string[], number>} toFix
     * @returns {number}
     */
    public parseInstruction(lineNumber: number, tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>): number[]
    {
        switch (tokens[0])
        {
            case "bl":
                return this.asmFormat19(lineNumber, tokens, pc, labels, toFix);
            default:
                return [this.parseCode(lineNumber, tokens, pc, labels, toFix)]
        }
    }

    /**
     * Converts a line of source code into machine code.
     * Given a tokenized line of source code, the location of the instruction (given by pc), the known labels in the
     * program, and the map containing labels which have yet to be defined, return the resulting machine code for that
     * instruction.
     * @param {number} lineNum
     * @param {string[]} tokens
     * @param {number} pc
     * @param {Map<string, number>} labels
     * @param {Map<string[], number>} toFix
     * @returns {number}
     */
    public override parseCode(lineNum: number, tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>): number {
        switch (tokens[0])
        {
            case "add":
                return this.parseAdd(lineNum, tokens);
            case "asr":
                return this.parseAsr(lineNum, tokens);
            case "cmp":
                return this.parseCmp(lineNum, tokens);
            case "ldr":
                return this.parseLdr(lineNum, tokens, pc, labels, toFix);
            case "ldrb":
                return this.parseLdrb(lineNum, tokens);
            case "ldrh":
                return this.parseLdrh(lineNum, tokens);
            case "lsl":
                return this.parseLsl(lineNum, tokens);
            case "lsr":
                return this.parseLsr(lineNum, tokens);
            case "mov":
                return this.parseMov(lineNum, tokens);
            case "str":
                return this.parseStr(lineNum, tokens);
            case "strb":
                return this.parseStrb(lineNum, tokens);
            case "strh":
                return this.parseStrh(lineNum, tokens);
            case "sub":
                return this.parseSub(lineNum, tokens);
            case "adc":
            case "and":
            case "bic":
            case "cmn":
            case "eor":
            case "mul":
            case "mvn":
            case "neg":
            case "orr":
            case "ror":
            case "sbc":
            case "tst":
                return this.asmFormat4(lineNum, tokens);
            case "bx":
                return this.asmFormat5(lineNum, tokens);
            case "ldsb":
            case "ldsh":
                return this.asmFormat8(lineNum, tokens);
            case "pop":
            case "push":
                return this.asmFormat14(lineNum, tokens);
            case "ldmia":
            case "stmia":
                return this.asmFormat15(lineNum, tokens);
            case "beq":
            case "bne":
            case "bcs":
            case "bcc":
            case "bmi":
            case "bpl":
            case "bvs":
            case "bvc":
            case "bhi":
            case "bls":
            case "bge":
            case "blt":
            case "bgt":
            case "ble":
                return this.asmFormat16(lineNum, tokens, pc, labels, toFix);
            case "swi":
                return this.asmFormat17(lineNum, tokens);
            case "b":
            case "🅱️":
                return this.asmFormat18(lineNum, tokens, pc, labels, toFix);
            case "getc":
            case "out":
            case "puts":
            case "in":
            case "putsp":
            case "halt":
                return this.asmSwiAlias(tokens[0]);
            case "rti":
                return this.parseRti(lineNum, tokens);
            default:
                return NaN;
        }
    }

    /**
     * Parses a register operand and returns the register number
     * @param {string} regStr
     * @param {number} lineNum
     * @returns {number}
     */
    protected override parseReg(registerString: string, lineNumber: number): number
    {
        // Parse high register or defer to the LC-3 register parser
        if (registerString[0] == 'h' || registerString == 'H')
        {
            const registerNumber = parseInt(registerString.substring(1));
            if (isNaN(registerNumber) || registerNumber < 0 || registerNumber >= 8)
            {
                UI.appendConsole(this.errorBuilder.badRegister(lineNumber, registerString) + "\n");
                return NaN;
            }
            else
            {
                return registerNumber;
            }
        }
        else
            return super.parseReg(registerString, lineNumber);
    }

    /**
     * Generates machine code in the appropriate format for an add instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseAdd(lineNumber: number, tokens: string[]): number
    {
        if (tokens.length == 3)
        {
            if (this.isImmediate(tokens[2]))
                if (tokens[1].toLowerCase() == "sp")
                    return this.asmFormat13(lineNumber, tokens);
                else
                    return this.asmFormat3(lineNumber, tokens);
            if (tokens[1][0].toLowerCase() == 'h' || tokens[2][0].toLowerCase() == 'h')
                return this.asmFormat5(lineNumber, tokens);
        }
        else if (tokens.length == 4)
        {
            if (tokens[2].toLowerCase() == "pc" || tokens[2].toLowerCase() == "sp")
                return this.asmFormat12(lineNumber, tokens);
            else
                return this.asmFormat2(lineNumber, tokens);
        }

        return NaN;
    }

    /**
     * Generates machine code in the appropriate format for an asr instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseAsr(lineNumber: number, tokens: string[]): number
    {
        if (tokens.length == 4)
            return this.asmFormat1(lineNumber, tokens);
        else if (tokens.length == 3)
            return this.asmFormat4(lineNumber, tokens);

        return NaN;
    }

    /**
     * Generates machine code in the appropriate format for a cmp instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseCmp(lineNumber: number, tokens: string[]): number
    {
        if (this.isImmediate(tokens[2][0]))
            return this.asmFormat3(lineNumber, tokens);
        else
        {
            if (tokens[1][0].toLowerCase() == 'h' || tokens[2][0].toLowerCase() == 'h')
                return this.asmFormat5(lineNumber, tokens);
            else
                return this.asmFormat4(lineNumber, tokens);
        }
    }

    /**
     * Generates machine code in the appropriate format for an ldr instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseLdr(lineNumber: number, tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>): number
    {
        // Check for (and remove) square brackets
        if (tokens[2].startsWith('[') && tokens[3].endsWith(']'))
        {
            tokens[2] = tokens[2].substring(1);
            tokens[3] = tokens[3].substring(0, tokens[3].length - 1);
        }
        else
        {
            UI.appendConsole(this.errorBuilder.formatMessage(
                lineNumber, 'Expected square brackets around all operands after the first (e.g. "LDR Rd, [Rb, Ro]")') + '\n');
            return NaN;
        }

        if (tokens[2] == "pc")
            if (tokens[3].startsWith('='))
                return this.parseLdrLabelPseudoOp(lineNumber, tokens, pc, labels, toFix);
            else
                return this.asmFormat6(lineNumber, tokens);
        else
        {
            if (this.isImmediate(tokens[3]))
            {
                if (tokens[2] == "sp")
                    return this.asmFormat11(lineNumber, tokens);
                else
                    return this.asmFormat9(lineNumber, tokens);
            }
            else
                return this.asmFormat7(lineNumber, tokens);
        }
    }

    /**
     * Generates machine code in the appropriate format for an ldrb instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseLdrb(lineNumber: number, tokens: string[]): number
    {
        // Check for (and remove) square brackets
        if (tokens[2].startsWith('[') && tokens[3].endsWith(']'))
        {
            tokens[2] = tokens[2].substring(1);
            tokens[3] = tokens[3].substring(0, tokens[3].length - 1);
        }
        else
        {
            UI.appendConsole(this.errorBuilder.formatMessage(
                lineNumber, 'Expected square brackets around all operands after the first (e.g. "LDR Rd, [Rb, Ro]")') + '\n');
            return NaN;
        }

        if (this.isImmediate(tokens[3]))
            return this.asmFormat9(lineNumber, tokens);
        else
            return this.asmFormat7(lineNumber, tokens);
    }

    /**
     * Generates machine code in the appropriate format for an ldrh instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseLdrh(lineNumber: number, tokens: string[]): number
    {
        // Check for (and remove) square brackets
        if (tokens[2].startsWith('[') && tokens[3].endsWith(']'))
        {
            tokens[2] = tokens[2].substring(1);
            tokens[3] = tokens[3].substring(0, tokens[3].length - 1);
        }
        else
        {
            UI.appendConsole(this.errorBuilder.formatMessage(
                lineNumber, 'Expected square brackets around all operands after the first (e.g. "LDR Rd, [Rb, Ro]")') + '\n');
            return NaN;
        }

        if (this.isImmediate(tokens[3]))
            return this.asmFormat10(lineNumber, tokens);
        else
            return this.asmFormat8(lineNumber, tokens);
    }

    /**
     * Generates machine code in the appropriate format for an lsl instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseLsl(lineNumber: number, tokens: string[]): number
    {
        if (tokens.length == 4)
            return this.asmFormat1(lineNumber, tokens);
        else
            return this.asmFormat4(lineNumber, tokens);
    }

    /**
     * Generates machine code in the appropriate format for an lsr instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseLsr(lineNumber: number, tokens: string[]): number
    {
        if (tokens.length == 4)
            return this.asmFormat1(lineNumber, tokens);
        else
            return this.asmFormat4(lineNumber, tokens);
    }

    /**
     * Generates machine code in the appropriate format for a mov instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseMov(lineNumber: number, tokens: string[]): number
    {
        if (this.isImmediate(tokens[2]))
            return this.asmFormat3(lineNumber, tokens);
        else
            return this.asmFormat5(lineNumber, tokens);
    }

    /**
     * Generates machine code in the appropriate format for a str instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseStr(lineNumber: number, tokens: string[]): number
    {
        // Check for (and remove) square brackets
        if (tokens[2].startsWith('[') && tokens[3].endsWith(']'))
        {
            tokens[2] = tokens[2].substring(1);
            tokens[3] = tokens[3].substring(0, tokens[3].length - 1);
        }
        else
        {
            UI.appendConsole(this.errorBuilder.formatMessage(
                lineNumber, 'Expected square brackets around all operands after the first (e.g. "STR Rd, [Rb, Ro]")') + '\n');
            return NaN;
        }

        if (this.isImmediate(tokens[3]))
        {
            if (tokens[2] == "sp")
                return this.asmFormat11(lineNumber, tokens);
            else
                return this.asmFormat9(lineNumber, tokens);
        }
        else
            return this.asmFormat7(lineNumber, tokens);
    }

    /**
     * Generates machine code in the appropriate format for a strb instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseStrb(lineNumber: number, tokens: string[]): number
    {
        // Check for (and remove) square brackets
        if (tokens[2].startsWith('[') && tokens[3].endsWith(']'))
        {
            tokens[2] = tokens[2].substring(1);
            tokens[3] = tokens[3].substring(0, tokens[3].length - 1);
        }
        else
        {
            UI.appendConsole(this.errorBuilder.formatMessage(
                lineNumber, 'Expected square brackets around all operands after the first (e.g. "LDR Rd, [Rb, Ro]")') + '\n');
            return NaN;
        }

        if (this.isImmediate(tokens[3]))
            return this.asmFormat9(lineNumber, tokens);
        else
            return this.asmFormat7(lineNumber, tokens);
    }

    /**
     * Generates machine code in the appropriate format for a strh instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseStrh(lineNumber: number, tokens: string[]): number
    {
        // Check for (and remove) square brackets
        if (tokens[2].startsWith('[') && tokens[3].endsWith(']'))
        {
            tokens[2] = tokens[2].substring(1);
            tokens[3] = tokens[3].substring(0, tokens[3].length - 1);
        }
        else
        {
            UI.appendConsole(this.errorBuilder.formatMessage(
                lineNumber, 'Expected square brackets around all operands after the first (e.g. "LDR Rd, [Rb, Ro]")') + '\n');
            return NaN;
        }

        if (this.isImmediate(tokens[3]))
        {
            return this.asmFormat10(lineNumber, tokens);
        }
        else
            return this.asmFormat8(lineNumber, tokens);
    }

    /**
     * Generates machine code in the appropriate format for a sub instruction
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseSub(lineNumber: number, tokens: string[]): number
    {
        if (tokens.length == 4)
            return this.asmFormat2(lineNumber, tokens);
        else
            return this.asmFormat3(lineNumber, tokens);
    }

    /**
     * Generates machine code for an instruction in format 1 (move shifted register)
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat1(lineNumber: number, tokens: string[]): number
    {
        let result = 0;

        // Opcode
        let opcode = 0;
        switch (tokens[0])
        {
            case 'lsl': opcode = 0b00; break;
            case 'lsr': opcode = 0b01; break;
            case 'asr': opcode = 0b10; break;
            default: return NaN;
        }
        result |= (opcode << 11);

        // Immediate value
        const immediate = this.parseImmediate(tokens[3], false, lineNumber, 5);
        result |= (immediate << 6);

        // Source register
        const sourceRegister = this.parseReg(tokens[1], lineNumber);
        result |= (sourceRegister << 3);

        // Destination register
        const destinationRegister = this.parseReg(tokens[2], lineNumber);
        result |= destinationRegister;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 2 (add/subtract)
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat2(lineNumber: number, tokens: string[]): number
    {
        let result = 0b0001100000000000;

        // Immediate flag and value
        if (this.isImmediate(tokens[3]))
        {
            const immediateFlag = 1;
            const immediate = this.parseImmediate(tokens[3], false, lineNumber, 3)

            result |= (immediateFlag << 10);
            result |= (immediate << 6);
        }
        else
        {
            // Source register 2
            const sourceRegister2 = this.parseReg(tokens[3], lineNumber);
            if (isNaN(sourceRegister2))
                return NaN;
            result |= (sourceRegister2 << 6);
        }

        // Opcode
        let opcode = 0;
        if (tokens[0] == "sub")
            opcode = 1;
        result |= (opcode << 9);

        // Source register 1
        const sourceRegister1 = this.parseReg(tokens[2], lineNumber);
        if (isNaN(sourceRegister1))
            return NaN;
        result |= (sourceRegister1 << 3);

        // Destination register
        const destinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(destinationRegister))
            return NaN;
        result |= destinationRegister;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 3 (move/compare/add/subtract immediate)
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat3(lineNumber: number, tokens: string[]): number
    {
        let result = 0b0010000000000000;

        // Opcode
        let opcode = 0;
        switch (tokens[0])
        {
            case "mov": opcode = 0b00; break;
            case "add": opcode = 0b10; break;
            case "cmp": opcode = 0b01; break;
            case "sub": opcode = 0b11; break;
            default: return NaN;
        }
        result |= (opcode << 11);

        // Source/destination register
        const register = this.parseReg(tokens[1], lineNumber);
        if (isNaN(register))
            return NaN;
        result |= (register << 8);

        // Immediate value
        const immediate = this.parseImmediate(tokens[2], true, lineNumber, 8)
        result |= immediate;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 4 (ALU operation)
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat4(lineNumber: number, tokens: string[]): number
    {
        let result = 0b0100000000000000;

        // Opcode
        let opcode = 0;
        switch (tokens[0])
        {
            case "and": opcode = 0b0000; break;
            case "eor": opcode = 0b0001; break;
            case "lsl": opcode = 0b0010; break;
            case "lsr": opcode = 0b0011; break;
            case "adc": opcode = 0b0101; break;
            case "asr": opcode = 0b0100; break;
            case "sbc": opcode = 0b0110; break;
            case "ror": opcode = 0b0111; break;
            case "tst": opcode = 0b1000; break;
            case "neg": opcode = 0b1001; break;
            case "cmp": opcode = 0b1010; break;
            case "cmn": opcode = 0b1011; break;
            case "orr": opcode = 0b1100; break;
            case "mul": opcode = 0b1101; break;
            case "bic": opcode = 0b1110; break;
            case "mvn": opcode = 0b1111; break;
            default: return NaN;
        }
        result |= (opcode << 6);

        // Source register 2
        const sourceRegister2 = this.parseReg(tokens[2], lineNumber);
        if (isNaN(sourceRegister2))
            return NaN;
        result |= (sourceRegister2 << 3);

        // Source/destination register
        const sourceDestinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(sourceDestinationRegister))
            return NaN;
        result |= sourceDestinationRegister;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 5 (Hi register operation/branch exchange)
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat5(lineNumber: number, tokens: string[]): number
    {
        let result = 0b0100010000000000;

        // Opcode
        let opcode = 0;
        switch (tokens[0])
        {
            case "add": opcode = 0b00; break;
            case "cmp": opcode = 0b01; break;
            case "mov": opcode = 0b10; break;
            case "bx":
                opcode = 0b11;
                // Workaround for the fact that bx only takes one operand
                tokens.push(tokens[1])
                break;
            default: return NaN;
        }
        result |= (opcode << 8);

        // Hi operand flag 1
        let h1 = 0;
        if (tokens[1][0].toLowerCase() == 'h')
        {
            h1 = 1;
        }
        result |= (h1 << 7);

        // Hi operand flag 2
        let h2 = 0;
        if (tokens[2][0].toLowerCase() == 'h')
        {
            h2 = 1;
        }
        result |= (h2 << 6);

        // Source register
        const sourceRegister = this.parseReg(tokens[2], lineNumber);
        if (isNaN(sourceRegister))
            return NaN;
        result |= (sourceRegister << 3);

        // Destination register
        const destinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(destinationRegister))
            return NaN;
        result |= destinationRegister;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 6 (pc-relative load)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat6(lineNumber: number, tokens: string[]): number
    {
        let result = 0b0100100000000000;

        // Destination register
        const destinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(destinationRegister))
            return NaN;
        result |= (destinationRegister << 8);

        // Immediate value
        const immediate = this.parseImmediate(tokens[3], false, lineNumber, 8)
        if (isNaN(immediate))
            return NaN;
        result |= immediate;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 7 (load/store with register offset)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat7(lineNumber: number, tokens: string[]): number
    {
        let result = 0b0101000000000000;

        // Flags
        let loadStoreFlag = 0;
        let byteWordFlag = 0;
        switch (tokens[0])
        {
            case "ldr":
                loadStoreFlag = 1;
                byteWordFlag = 0;
                break;
            case "ldrb":
                loadStoreFlag = 1;
                byteWordFlag = 1;
                break;
            case "str":
                loadStoreFlag = 0;
                byteWordFlag = 0;
                break;
            case "strb":
                loadStoreFlag = 0;
                byteWordFlag = 1;
                break;
        }
        result |= (loadStoreFlag << 11);
        result |= (byteWordFlag << 10);

        // Offset register
        const offsetRegister = this.parseReg(tokens[3], lineNumber);
        if (isNaN(offsetRegister))
            return NaN;
        result |= (offsetRegister << 6);

        // Base register
        const baseRegister = this.parseReg(tokens[2], lineNumber);
        if (isNaN(baseRegister))
            return NaN;
        result |= (baseRegister << 3);

        // Source/destination register
        const sourceDestinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(sourceDestinationRegister))
            return NaN;
        result |= sourceDestinationRegister;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 8 (load/store sign-extended byte/halfword)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat8(lineNumber: number, tokens: string[]): number
    {
        let result = 0b0101001000000000;

        // Flags
        let hFlag = 0;
        let signExtendFlag = 0;
        switch (tokens[0])
        {
            case "ldrh":
                hFlag = 1;
                signExtendFlag = 0;
                break;
            case "ldsb":
                hFlag = 0;
                signExtendFlag = 1;
                break;
            case "ldsh":
                hFlag = 1;
                signExtendFlag = 1;
                break;
            case "strh":
                hFlag = 0;
                signExtendFlag = 0;
                break;
        }
        result |= (hFlag << 11);
        result |= (signExtendFlag << 10);

        // Offset register
        const offsetRegister = this.parseReg(tokens[3], lineNumber);
        if (isNaN(offsetRegister))
            return NaN;
        result |= (offsetRegister << 6);

        // Base register
        const baseRegister = this.parseReg(tokens[2], lineNumber);
        if (isNaN(baseRegister))
            return NaN;
        result |= (baseRegister << 3);

        // Destination register
        const destinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(destinationRegister))
            return NaN;
        result |= destinationRegister;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 9 (load/store with immediate offset)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat9(lineNumber: number, tokens: string[]): number
    {
        let result = 0b0110000000000000;

        // Flags
        let loadStoreFlag = 0;
        let byteWordFlag = 0;
        switch (tokens[0])
        {
            case "ldrb":
                loadStoreFlag = 1;
                byteWordFlag = 1;
                break;
            case "ldr":
                loadStoreFlag = 1;
                byteWordFlag = 0;
                break;
            case "strb":
                loadStoreFlag = 0;
                byteWordFlag = 1;
                break;
            case "str":
                loadStoreFlag = 0;
                byteWordFlag = 0;
                break;
        }
        result |= (loadStoreFlag << 11);
        result |= (byteWordFlag << 12);

        // Immediate value
        const immediate = this.parseImmediate(tokens[3], true, lineNumber, 5)
        result |= (immediate << 6);

        // Base register
        const baseRegister = this.parseReg(tokens[2], lineNumber);
        if (isNaN(baseRegister))
            return NaN;
        result |= (baseRegister << 3);

        // Source/destination register
        const sourceDestinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(sourceDestinationRegister))
            return NaN;
        result |= sourceDestinationRegister;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 8 (load/store halfword)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat10(lineNumber: number, tokens: string[]): number
    {
        let result = 0b1000000000000000;

        // Load/store bit
        let loadStoreBit = 0;
        if (tokens[0] == "ldrh")
        {
            loadStoreBit = 1;
        }
        result |= (loadStoreBit << 11);

        // Immediate value
        const immediate = this.parseImmediate(tokens[3], true, lineNumber, 5);

        result |= (immediate << 6);

        // Base register
        const baseRegister = this.parseReg(tokens[2], lineNumber);
        if (isNaN(baseRegister))
            return NaN;
        result |= (baseRegister << 3);

        // Destination register
        const destinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(destinationRegister))
            return NaN;
        result |= destinationRegister;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 11 (SP-relative load/store)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat11(lineNumber: number, tokens: string[]): number
    {
        let result = 0b1001000000000000;

        // Load/store bit
        let loadStoreFlag = 0;
        switch (tokens[0])
        {
            case "ldr":
                loadStoreFlag = 1;
                break;
            case "str":
                loadStoreFlag = 0;
                break;
        }
        result |= (loadStoreFlag << 11);

        // Destination register
        const destinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(destinationRegister))
            return NaN;
        result |= (destinationRegister << 8);

        // Immediate value
        const immediate = this.parseImmediate(tokens[3], true, lineNumber, 8);
        result |= immediate;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 12 (load address)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat12(lineNumber: number, tokens: string[]): number
    {
        let result = 0b1010000000000000;

        // Source
        if (tokens[2] == "sp")
        {
            UI.appendConsole(this.errorBuilder.formatMessage(
                lineNumber, 'SP not supported with format 12 instructions, as the LC-3 hardware has no dedicated stack pointer. For similar functionality, use r6 instead.' + '\n'
            ));
            return NaN;
        }

        // Destination register
        const destinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(destinationRegister))
            return NaN;
        result |= (destinationRegister << 9);

        /*
        Immediate value. Note that we ignore the word alignment constraint that the instruction is supposed to have,
        since we don't care about 32-bit addressing.
        */
        const immediate = this.parseImmediate(tokens[3], true, lineNumber, 9)
        if (isNaN(immediate))
            return NaN;
        result |= immediate;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 13 (add offset to stack pointer)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat13(lineNumber: number, tokens: string[]): number
    {
        let result = 0b1011000000000000;

        // Immediate value (part 1)
        const immediate = this.parseImmediate(tokens[2], true, lineNumber, 7);

        // Sign flag
        let signFlag = 0;
        if (immediate < 0)
            signFlag = 1;
        result |= (signFlag << 7);

        // Immediate value (part 2)
        result |= (Math.abs(immediate));

        return result;
    }

    /**
     * Generates machine code for an instruction in format 14 (push/pop registers)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat14(lineNumber: number, tokens: string[])
    {
        // Check for (and remove) curly braces
        const lastTokenIndex = tokens.length - 1;
        if (tokens[1].startsWith('{') && tokens[lastTokenIndex].endsWith('}'))
        {
            tokens[1] = tokens[1].substring(1);
            tokens[lastTokenIndex] = tokens[lastTokenIndex].substring(0, tokens[lastTokenIndex].length - 1);
        }
        else
        {
            UI.appendConsole(this.errorBuilder.formatMessage(
                lineNumber, 'Expected curly braces around register list (e.g. PUSH {r0, r1, r2})' + '\n'
            ));
            return NaN;
        }

        let result = 0b1011010000000000;

        // Flags
        let loadStoreBit = 0;
        let pcLrBit = 0;
        if (tokens[0] == "pop")
        {
            loadStoreBit = 1;
            if (tokens[tokens.length - 1] == "pc")
                pcLrBit = 1;
        }
        else if (tokens[0] == "push")
        {
            loadStoreBit = 0;
            if (tokens[tokens.length - 1] == "lr")
                pcLrBit = 1;
        }
        result |= (loadStoreBit << 11);
        result |= (pcLrBit << 8);

        // Register list
        let registerListCutoff = tokens.length;
        if (pcLrBit == 1)
            registerListCutoff = tokens.length - 1;
        let registerList = 0;
        for (let i = 1; i < registerListCutoff; i++)
        {
            registerList |= (1 << this.parseReg(tokens[i], lineNumber));
        }
        result |= registerList;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 15 (multiple load/store)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat15(lineNumber: number, tokens: string[])
    {
        let result = 0b1100000000000000;

        // Load/store bit
        let loadStore = 0;
        if (tokens[0] == "stmia")
            loadStore = 0;
        if (tokens[0] == "ldmia")
            loadStore = 1;
        result |= (loadStore << 11);

        // Base register
        const baseRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(baseRegister))
            return NaN;
        result |= (baseRegister << 8);

        // Register list
        let registerList = 0;
        for (let i = 2; i < tokens.length; i++)
        {
            registerList |= (1 << this.parseReg(tokens[i], lineNumber));
        }
        result |= registerList;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 16 (conditional branch)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat16(lineNumber: number, tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>): number
    {
        let result = 0b1101000000000000;

        // Condition
        let condition = 0;
        switch (tokens[0])
        {
            case "beq":
                condition = 0b0000; break;
            case "bne":
                condition = 0b0001; break;
            case "bcs":
                condition = 0b0010; break;
            case "bcc":
                condition = 0b0011; break;
            case "bmi":
                condition = 0b0100; break;
            case "bpl":
                condition = 0b0101; break;
            case "bvs":
                condition = 0b0110; break;
            case "bvc":
                condition = 0b0111; break;
            case "bhi":
                condition = 0b1000; break;
            case "bls":
                condition = 0b1001; break;
            case "bge":
                condition = 0b1010; break;
            case "blt":
                condition = 0b1011; break;
            case "bgt":
                condition = 0b1100; break;
            case "ble":
                condition = 0b1101; break;
            default: return NaN;
        }
        result |= (condition << 8);

        // Immediate value
        if (labels.has(tokens[1]))
        {
            const offset = this.calcLabelOffset(tokens[1], pc, labels, 8, lineNumber);
            if (isNaN(offset))
                return NaN;

            return result | offset;
        }
        else
        {
            toFix.set(tokens, pc);
            return result;
        }
    }

    /**
     * Generates machine code for an instruction in format 17 (software interrupt)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat17(lineNumber: number, tokens: string[]): number
    {
        let result = 0b1101111100000000;

        // Interrupt vector
        const value = this.parseImmediate(tokens[1], false, lineNumber, 8);
        if (isNaN(value))
            return NaN;
        result |= value;

        return result;
    }

    /**
     * Generates machine code for an instruction in format 18 (unconditional branch)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat18(lineNumber: number, tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>): number
    {
        let result = 0b1110000000000000;

        // Immediate value
        if (labels.has(tokens[1]))
        {
            const offset = this.calcLabelOffset(tokens[1], pc, labels, 11, lineNumber);
            if (isNaN(offset))
                return NaN;

            return result | offset;
        }
        else
        {
            toFix.set(tokens, pc);
            return result;
        }
    }

    /**
     * Generates machine code for an instruction in format 19 (long branch with link)
     * @param {number} lineNumber
     * @param {string[]} tokens
     * @returns {number}
     */
    private asmFormat19(lineNumber: number, tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>): number[]
    {
        /*
        This instruction plays the same role as JSR in LC-3. Since JSR only uses an 11-bit offset for subroutine jumps,
        the functionality for representing larger values using multiple instructions would go untested, and as such I'm
        commenting out its implementation. Feel free to add it back if there's a program that needs it.
        */
        // let highInstruction = 0b1111000000000000;
        let lowInstruction = 0b1111100000000000;

        // Immediate value
        if (labels.has(tokens[1]))
        {
            // const offset = this.calcLabelOffset(tokens[1], pc, labels, 23, lineNumber);
            const offset = this.calcLabelOffset(tokens[1], pc, labels, 11, lineNumber);
            if (isNaN(offset))
                return [NaN];

            // const highBits = (offset & 0b111111111110000000000) >> 12;
            // highInstruction |= highBits;

            const lowBits = (offset & 0b0000000000011111111111);
            lowInstruction |= lowBits;

            // return [highInstruction, lowInstruction];
            return [lowInstruction];
        }
        else
        {
            toFix.set(tokens, pc);
            // return [highInstruction, lowInstruction];
            return [lowInstruction];
        }
    }


    /**
     * Generates machine code in the appropriate format for this weird ldr pseudo-op.
     * ARM Thumb doesn't have an official way to load the address at a label (i.e. it doesn't have an equivalent to the
     * LC-3's lea instruction), so I'm putting an unofficial pseudo-op here. This is somewhat similar to an official
     * ARM pseudo-op with the same syntax:
    developer.arm.com/documentation/dui0473/m/writing-arm-assembly-language/load-immediate-values-using-ldr-rd---const
     * @param {number} lineNum
     * @param {string[]} tokens
     * @returns {number}
     */
    private parseLdrLabelPseudoOp(lineNumber: number, tokens: string[], pc: number, labels: Map<string, number>, toFix: Map<string[], number>): number
    {
        // This pseudo-op is just syntactic sugar for a format 12 add instruction involving the PC and a label
        let result = 0b1010000000000000;

        // Destination register
        const destinationRegister = this.parseReg(tokens[1], lineNumber);
        if (isNaN(destinationRegister))
            return NaN;
        result |= (destinationRegister << 9);

        // Immediate value
        const label = tokens[3].substring(1);
        let offset;
        if (labels.has(label))
        {
            offset = this.calcLabelOffset(label, pc, labels, 9, lineNumber);

            if (isNaN(offset))
                return NaN;
            result |= offset;
        }
        else
        {
            toFix.set(tokens, pc);
        }

        return result;
    }

    /**
     * Generates machine code for a software interrupt alias
     * @param {string} alias
     * @returns {number}
     */
    private asmSwiAlias(alias: string): number
    {
        const swiValues = new Map([
            ["getc", 0x20], ["halt", 0x25], ["in", 0x23], ["out", 0x21], ["puts", 0x22], ["putsp", 0x24]
        ]);

        // @ts-ignore
        return 0b1101111100000000 | swiValues.get(alias);
    }

    /**
     * Generates machine code for an rti instruction.
     *
     * Note that this instruction isn't in the ARM Thumb instruction set, but I've ported it over from the LC-3 because
     * the canonical way of returning from a software interrupt in ARM is impossible to implement here.
     * When a software interrupt occurs in ARM Thumb code, the processor is "supposed" to switch to ARM mode (that is,
     * start executing 32-bit instructions instead of 16-bit ones), execute the interrupt, and then switch back into
     * Thumb mode (for 16-bit instructions) and resume regular execution.

     * Since this simulator doesn't have any 32-bit instructions, we use the LC-3's calling convention for OS routines
     * instead. For entering a software interrupt, this meant making the swi instruction mimic LC-3's trap instruction,
     * but for exiting a software interrupt, this means simply porting LC-3's rti instruction.
     * @param {number} lineNum
     * @param {string[]} tokens
     */
    private parseRti(lineNum: number, tokens: string[])
    {
        /*
        Using the same binary as the original rti would result in this being indistinguishable from a
        "strh r0, [r0, #0]" instruction, so we imitate a bx instruction instead. Specifically, a "real" ARM Thumb
        implementation (not like one exists) would read this as "bx r8"
        */
        return 0b0100011101000000;
    }

    /**
     * Given a tokenized line of source code with an assembler directive, handle its effects and return the amount that
     * the program counter must be increased by after the operation.
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
        let increment = 0;

        switch (tokens[0])
        {
            // Exclude LC-3 directive(s) that aren't supported here
            case ".end":
                break;
            // Process any other LC-3 directive
            default:
                increment = super.parseDirective(lineNum, tokens, pc, memory, toFix);
                break;
        }

        return increment;
    }

    /**
     * Tells whether the given token is an immediate value
     * @param {string} token
     * @returns {boolean}
     */
    private isImmediate(token: string): boolean
    {
        return (token[0] == "#" || token[0] == "x");
    }
}