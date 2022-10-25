/**
 * simulator.ts
 * 
 * The LC-3 simulator. Each instance keeps track of the machine's state and
 * executes code.
 */

import Opcodes from "./opcodes";
import decodeRegister from "./decodeReg";
import decodeImmediate from "./decodeImm";
import Assembler from "../assembler/assembler";
import * as fs from "node:fs";

export default class Simulator
{
    // Memory address constants:

    // keyboard status and data registers
    private static KBSR = 0xFE00;
    private static KBDR = 0xFE02;
    // display status and data registers
    private static DSR = 0xFE04;
    private static DDR = 0xFE06;
    // machine control register (bit 15 is clock-enable)
    private static MCR = 0xFFFE;

    // 2^16 words of memory
    private memory: Uint16Array = new Uint16Array(1<<16);
    // general-purpose registers
    private registers: Uint16Array = new Uint16Array(8);
    // internal registers for non-active stack pointer
    private savedUSP: Uint16Array = new Uint16Array(1);
    private savedSSP: Uint16Array = new Uint16Array(1);
    // program counter
    private pc: Uint16Array = new Uint16Array(1);
    // components of the Processor Status Register (PSR)
    private userMode: boolean = true;
    private priorityLevel: number = 0;
    private flagNegative: boolean = false;
    private flagZero: boolean = false;
    private flagPositive: boolean = false;
    // interrupt parameters
    private interruptSignal: boolean = false;
    private interruptPriority: number = 0;
    private interruptVector: number = 0;
    // addresses of each active breakpoint
    private breakPoints: Set<number> = new Set();
    // object file for program to run
    private userObjFile: Uint16Array;
    // object file for operating system code
    private osObjFile: Uint16Array;
    // memory addresses mapped to the code which generated the value there
    private disassembly: Map<number, string>;

    /**
     * Initialize the simulator, load the code into memory and set PC to start
     * of program
     * @param objectFile the object file to load
     * @param sourceCode memory addresses mapped to disassembled source code
     */
    public constructor(objectFile: Uint16Array, sourceCode: Map<number, string>)
    {
        this.userObjFile = objectFile;
        this.disassembly = sourceCode;

        // load operating system code
        let osSource: string;
        try
        {
            osSource = fs.readFileSync("src/logic/simulator/os/lc3_os.asm", "utf8");
            const asmResult = Assembler.assemble(osSource);
            if (asmResult === null)
            {
                console.log("Error assembling operating system code");
                this.osObjFile = new Uint16Array([0]);
            }
            else
            {
                console.log("Operating system code assembled successfully");
                this.osObjFile = asmResult[0];
                for (let mapping of asmResult[1])
                {
                    this.disassembly.set(mapping[0], mapping[1]);
                }
            }
        }
        catch (error)
        {
            console.log("Error retrieving operating system source code: " + error);
            this.osObjFile = new Uint16Array([0]);
        }

        this.loadBuiltInCode();
        this.reloadProgram();
    }

    /**
     * Load code into memory, set PC to start of program, restore Processor
     * Status Register to defaults, set clock-enable
     */
    public reloadProgram()
    {
        let loc = this.userObjFile[0];
        for (let i = 1; i < this.userObjFile.length; i++)
        {
            this.memory[loc++] = this.userObjFile[i];
        }
        this.pc[0] = this.userObjFile[0];

        this.restorePSR();
    }

    /**
     * Load operating system code into memory from object file
     */
    private loadBuiltInCode()
    {
        let loc = this.osObjFile[0];
        for (let i = 1; i < this.osObjFile.length; i++)
        {
            this.memory[loc++] = this.userObjFile[i];
        }
    }

    /**
     * Set PC to start of program and set clock-enable, leave rest of memory
     * and CPU as-is
     */
    public restartProgram()
    {
        this.pc[0] = this.userObjFile[0];
    }

    /**
     * Set all of memory to zeroes except for operating system code
     */
    public resetMemory()
    {
        for (let i = 0; i < this.memory.length; i++)
        {
            this.memory[i] = 0;
        }
        for (let i = 0; i < 8; i++)
        {
            this.registers[i] = 0;
        }
        this.loadBuiltInCode();
    }

    /**
     * Randomize all of memory except for operating system code
     */
    public randomizeMemory()
    {
        for (let i = 0; i < this.memory.length; i++)
        {
            this.memory[i] = this.randWord();
        }
        for (let i = 0; i < 8; i++)
        {
            this.registers[i] = this.randWord();
        }
        this.loadBuiltInCode();
    }

    /**
     * Set clock-enable and run until a breakpoint is encountered or the
     * clock-enable bit is cleared (including due to the invokation of the HALT
     * trap)
     */
    public run()
    {
        this.enableClock();
        let intOrEx = this.instructionCycle();

        while (this.isClockEnabled() && !this.breakPoints.has(this.pc[0]))
        {
            let intOrEx = this.instructionCycle();
        }
    }

    /**
    * Set clock-enable and run one instruction
     */
    public stepIn()
    {
        this.enableClock();
        let intOrEx = this.instructionCycle();
    }

    /**
     * Set clock-enable and run until the currently executing subroutine or
     * service call is returned from, or any of the conditions for run()
     * stopping are encountered
     */
    public stepOut()
    {
        let currDepth = 1;
        this.enableClock();

        // ignore breakpoints for first instruction cycle
        if (Opcodes.isRETorRTI(this.pc[0]))
        {
            --currDepth;
        }
        else if (Opcodes.isJSRorJSRR(this.pc[0]) || Opcodes.isTRAP(this.pc[0]))
        {
            ++currDepth;
        }
        if (this.instructionCycle())
        {
            ++currDepth;
            // if we have an option to toggle breaking on interrupts/exceptions, handle it here
        }

        // keep executing but don't ignore clock or breakpoints
        while (currDepth > 0 && this.isClockEnabled() && !this.breakPoints.has(this.pc[0]))
        {
            if (Opcodes.isRETorRTI(this.pc[0]))
            {
                --currDepth;
            }
            else if (Opcodes.isJSRorJSRR(this.pc[0]) || Opcodes.isTRAP(this.pc[0]))
            {
                ++currDepth;
            }

            // execute instruction cycle, increase depth if we're handling an INT/exception
            if (this.instructionCycle())
            {
                ++currDepth;
                // if we have an option to toggle breaking on interrupts/exceptions, handle it here
            }
        }
    }

    /**
     * Set clock-enable and run one instruction, unless it is a JSR/JSRR or
     * TRAP, in which case run until one of the conditions for stepOut() or
     * run() is encountered. Will also step over exceptions and interrupts.
     */
    public stepOver()
    {
        let depth = 0;

        // if we have a jsr/jsrr/trap, we'll need to step out of it
        if (Opcodes.isJSRorJSRR(this.memory[this.pc[0]]) || Opcodes.isTRAP(this.memory[this.pc[0]]))
        {
            ++depth;
        }
        // run 1 instruction, if interrupt or exception occurs we'll step out of it
        this.enableClock();
        if (this.instructionCycle())
        {
            ++depth;
        }

        // call stepOut() until we're back to depth of 0
        while (depth > 0 && this.isClockEnabled() && !this.breakPoints.has(this.pc[0]))
        {
            this.stepOut();
            --depth;
        }
    }

    /**
     * Invoke a keyboard interrupt if the conditions are valid. Namely, the
     * keyboard interrupt-enable bit must be set and the current priority level
     * must be less than 4.
     */
    public keyboardInterrupt(asciiCode: number)
    {
        this.memory[Simulator.KBDR] = asciiCode;
        if (this.priorityLevel < 4 && (this.memory[Simulator.KBSR] & 0x8000) != 0)
        {
            this.interruptSignal = true;
            this.interruptPriority = 4;
            this.interruptVector = 0x80;
        }
    }

    /**
     * Add a breakpoint
     * @param address the address of the breakpoint
     */
    public setBreakpoint(address: number)
    {
        this.breakPoints.add(address);
    }

    /**
     * Remove a breakpoint
     * @param address the address of the breakpoint
     */
    public clearBreakpoint(address: number)
    {
        this.breakPoints.delete(address);
    }

    /**
     * Clear all breakpoints
     */
    public clearAllBreakpoints()
    {
        this.breakPoints.clear();
    }

    /**
     * Return the formatted contents of memory in a given range
     * @param start start of range (inclusive)
     * @param end end of range (exclusive)
     * @returns an array of entries with format: [address, hex val, decimal val, code]
     */
    public getMemoryRange(start: number, end: number) : string[][]
    {
        let res: string[][] = [];
        for (let i = start; i < end; i++)
        {
            let code = this.disassembly.get(i);
            if (typeof(code) === "undefined")
            {
                code = "";
            }
            res.push([
                "0x" + i.toString(16),
                "0x" + this.memory[i].toString(16),
                this.memory[i].toString(10),
                code
            ]);
        }
        return res;
    }

    /**
     * Return the number stored in the given memory location
     * @param address the address to query
     * @returns the value stored at memory[address]
     */
    public getMemory(address: number) : number
    {
        return this.memory[address];
    }

    /**
     * Write the given value to the given memory location
     * @param address the address to write to
     * @param value the value to store at memory[address]
     */
    public setMemory(address: number, value: number)
    {
        this.memory[address] = value;
    }

    /**
     * Return the contents of a register
     * @param registerNumber 
     * @returns 
     */
    public getRegister(registerNumber: number) : number
    {
        return this.registers[registerNumber];
    }

    /**
     * Set the contents of a register
     * @param registerNumber 
     * @param value 
     */
    public setRegister(registerNumber: number, value: number)
    {
        this.registers[registerNumber] = value;
    }

    /**
     * Return the value of the program counter
     * @returns 
     */
    public getPC() : number
    {
        return this.pc[0];
    }

    /**
     * Set the value of the program counter
     * @param value 
     */
    public setPC(value: number)
    {
        this.pc[0] = value;
    }

    /**
     * Return the value of the processor status register 
     * @returns
     */
    public getPSR() : number
    {
        let result = +this.userMode << 15;
        result |= this.priorityLevel << 8;
        result |= +this.flagNegative << 2;
        result |= +this.flagZero << 1;
        result |= +this.flagPositive;
        return result;
    }

    /**
     * Set the value of the processor status register
     * @param value 
     */
    public setPSR(value: number)
    {
        this.flagPositive = (value & 1) != 0;
        this.flagZero = (value & 2) != 0;
        this.flagNegative = (value & 4) != 0;
        this.priorityLevel = (value >> 8) & 7;
        this.userMode = (value & 0x8000) != 0;
    }

    /**
     * Get a breakdown of the statuses of the PSR's components. Returns, in the
     * following order: (1) if the processor is in user or supervisor mode; (2)
     * the priority level of the currently-executing program; (3) the condition
     * code flags
     * @returns three strings describing the status of the PSR
     */
    public getPSRInfo() : string[]
    {
        let flags = "";
        if (this.flagNegative)
            flags += "N";
        if (this.flagZero)
            flags += "Z";
        if (this.flagPositive)
            flags += "P";
        if (!flags)
            flags = "[none]"

        return [
            this.userMode ? "user" : "supervisor",
            "PL" + this.priorityLevel,
            flags
        ];
    }

    /**
     * Return a random integer in the range [0, 2^16)
     * @returns {number}
     */
    private randWord() : number
    {
        return Math.floor(Math.random() * (1 << 16));
    }

    /**
     * Set Processor Status Register to defaults, clear interrupt signal, reset
     * saved USP and SSP
     */
    private restorePSR()
    {
        this.userMode = true;
        this.priorityLevel = 0;
        this.flagNegative = false;
        this.flagZero = false;
        this.flagPositive = false;
        this.interruptSignal = false;
        this.interruptPriority = 0;
        this.interruptVector = 0;
        this.savedSSP[0] = 0x3000;
        this.savedUSP[0] = 0;
    }

    /**
     * Set bit MCR[15] to enable the clock
     */
    private enableClock()
    {
        this.memory[Simulator.MCR] = 0x8000;
    }

    /**
     * @returns true if clock is enabled, false otherwise
     */
    private isClockEnabled() : boolean
    {
        return (this.memory[Simulator.MCR] & 0x8000) != 0;
    }

    /**
     * Execute a single instruction cycle. If an exception or interrupt occurs,
     * initiate it and return true. If the cycle completed as expected, return
     * false.
     * @returns true if an interrupt or exception occured, false otherwise
     */
    private instructionCycle() : boolean
    {
        /*
        (1) check for exception (illegal instruction or privilege violation)
            * if yes, initialize and return true. Otherwise, continue
        (2) execute the instruction
            * fetch, increment PC
            * call subroutine for opcode
        (3) if INT asserted, initialize and return true. Else, return false
        */
        
        // (1) check for exception
        // not yet implemented

        // (2) execute instruction
        const instruction = this.memory[this.pc[0]++];
        switch ((instruction & 0xF000) >> 12)
        {
            case 0b0000:
                this.execBr(instruction);
                break;
            case 0b0001:
                this.execAdd(instruction);
                break;
            case 0b0010:
                this.execLd(instruction);
                break;
            case 0b0011:
                this.execSt(instruction);
                break;
            case 0b0100:
                this.execJsr(instruction);
                break;
            case 0b0101:
                this.execAnd(instruction);
                break;
            case 0b0110:
                this.execLdr(instruction);
                break;
            case 0b0111:
                this.execStr(instruction);
                break;
            case 0b1000:
                this.execRti(instruction);
                break;
            case 0b1001:
                this.execNot(instruction);
                break;
            case 0b1010:
                this.execLdi(instruction);
                break;
            case 0b1011:
                this.execSti(instruction);
                break;
            case 0b1100:
                this.execJmp(instruction);
                break;
            case 0b1101:
                // illegal (reserved)
                break;
            case 0b1110:
                this.execLea(instruction);
                break;
            case 0b1111:
                this.execTrap(instruction);
                break;
            default:
                break;
        }

        // (3) handle interrupt
        // not yet implemented

        return false;
    }

    /**
     * Set the condition codes according to the given number
     * @param result the 16-bit result of an instruction
     */
    private setConditions(result: number)
    {
        this.flagNegative = (result & 0x8000) != 0;
        this.flagZero = result == 0;
        this.flagPositive = (result & 0x8000) == 0 && result > 0;
    }

    /**
     * Instruction methods - each executes one instruction.
     */

    private execAdd(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const source1 = this.registers[decodeRegister(instruction, 1)];
        let source2: number;
        if ((instruction & 0b10_0000) != 0)
        {
            source2 = decodeImmediate(instruction, 5);
        }
        else
        {
            source2 = this.registers[decodeRegister(instruction, 2)];
        }

        this.registers[destReg] = source1 + source2;
        this.setConditions(this.registers[destReg]);
    }

    private execAnd(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const source1 = this.registers[decodeRegister(instruction, 1)];
        let source2: number;
        if ((instruction & 0b10_0000) != 0)
        {
            source2 = decodeImmediate(instruction, 5);
        }
        else
        {
            source2 = this.registers[decodeRegister(instruction, 2)];
        }

        this.registers[destReg] = source1 & source2;
        this.setConditions(this.registers[destReg]);
    }

    private execBr(instruction: number)
    {
        if (
            (this.flagNegative && (instruction & 0x0800))
            || (this.flagZero && (instruction & 0x0400))
            || (this.flagPositive && (instruction & 0x0200))
        )
        {
            this.pc[0] += decodeImmediate(instruction, 9);
        }
    }

    private execJmp(instruction: number)
    {
        this.pc[0] = this.registers[decodeRegister(instruction, 1)];
    }

    private execJsr(instruction: number)
    {
        const savedPC = this.pc[0];
        if (instruction & 0x800)
        {
            this.pc[0] += decodeImmediate(instruction, 11);
        }
        else
        {
            this.pc[0] = this.registers[decodeRegister(instruction, 1)];
        }
        this.registers[7] = savedPC;
    }

    private execLd(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const src = (this.pc[0] + decodeImmediate(instruction, 9)) & 0xFFFF;
        this.registers[destReg] = this.memory[src];
        this.setConditions(this.registers[destReg]);
    }

    private execLdi(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const src = (this.pc[0] + decodeImmediate(instruction, 9)) & 0xFFFF;
        this.registers[destReg] = this.memory[this.memory[src]];
        this.setConditions(this.registers[destReg]);
    }

    private execLdr(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const src = (this.registers[decodeRegister(instruction, 0)]
                + decodeImmediate(instruction, 6)) & 0xFFFF;
        this.registers[destReg] = this.memory[src];
        this.setConditions(this.registers[destReg]);
    }

    private execLea(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        this.registers[destReg] = this.pc[0] + decodeImmediate(instruction, 9);
        this.setConditions(this.registers[destReg]);
    }

    private execNot(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        this.registers[destReg] = (~this.registers[decodeRegister(instruction, 1)]) & 0xFFFF;
        this.setConditions(this.registers[destReg]);
    }

    private execRti(instruction: number)
    {
        // for now, does not trigger privilege mode exception

        // need to swap stack pointers if we go supervisor -> user
    }

    private execSt(instruction: number)
    {
        const dest = (this.pc[0] + decodeImmediate(instruction, 9)) & 0xFFFF;
        this.memory[dest] = this.registers[decodeRegister(instruction, 0)];
    }

    private execSti(instruction: number)
    {
        const dest = (this.pc[0] + decodeImmediate(instruction, 9)) & 0xFFFF;
        this.memory[this.memory[dest]] = this.registers[decodeRegister(instruction, 0)];
    }

    private execStr(instruction: number)
    {
        const dest = (this.registers[decodeRegister(instruction, 0)]
                + decodeImmediate(instruction, 6)) & 0xFFFF;
        this.memory[dest] = this.registers[decodeRegister(instruction, 0)];
    }

    private execTrap(instruction: number)
    {
        // will be implemented later
    }
}
