/**
 * simWorker.ts
 * 
 * This class is responsible for executing LC-3 code for the simulator in a
 * separate thread. It maintains a copy of the simulator's data, and it passes
 * messages to the simulator when its data is updated so they stay in sync.
 * 
 * A lot of code and data duplication exists between this class and the
 * simulator, but this greatly reduces the amount of data that would need to be
 * passed between threads in messages.
 */

import Messages from "./simMessages";
import Opcodes from "./opcodes";
import Vectors from "./vectors";
import decodeImmediate from "./decodeImm";
import decodeRegister from "./decodeReg";

class SimWorker
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

    // PSR can be AND'ed with these values to get a flag, OR'ed to set a flag
    private static MASK_N = 0x4;
    private static MASK_Z = 0x2;
    private static MASK_P = 0x1;
    private static MASK_USER = 0x8000;
    // PSR can be AND'ed with these values to clear a flag
    private static CLEAR_N = 0b1111_1111_1111_1011;
    private static CLEAR_Z = 0b1111_1111_1111_1101;
    private static CLEAR_P = 0b1111_1111_1111_1110;

    // simulator's memory, transferred from simulator
    private static memory: Uint16Array;
    // general-purpose registers
    private static registers: Uint16Array;
    // internal registers for non-active stack pointer
    private static savedUSP: Uint16Array;
    private static savedSSP: Uint16Array;
    // program counter
    private static pc: Uint16Array;
    // processor status register
    private static psr: Uint16Array;

    // interrupt parameters
    private static interruptSignal: Uint8Array;
    private static interruptPriority: Uint8Array;
    private static interruptVector: Uint16Array;

    // addresses of each active breakpoint
    private static breakPoints: Set<number>;

    // if set to non-zero, worker must stop executing
    private static haltFlag: Uint8Array;

    /**
     * Initialize message handlers
     */
    public static init()
    {
        self.onmessage = (event) => {
            const msg = event.data;
            switch (msg.type)
            {
                // save a copy of the simulator's data
                case Messages.INIT:
                    this.memory = msg.memory;
                    this.registers = msg.registers;
                    this.savedUSP = msg.savedUSP;
                    this.savedSSP = msg.savedSSP;
                    this.pc = msg.pc;
                    this.psr = msg.psr;
                    this.interruptSignal = msg.intSignal;
                    this.interruptPriority = msg.intPriority;
                    this.interruptVector = msg.intVector;
                    this.breakPoints = msg.breakPoints;
                    this.haltFlag = msg.halt;
                    break;
                case Messages.RUN:
                    this.run();
                    break;
                case Messages.STEP_IN:
                    this.stepIn();
                    break;
                case Messages.STEP_OUT:
                    this.stepOut();
                    break;
                case Messages.STEP_OVER:
                    this.stepOver();
                    break;
                case Messages.SET_BREAK:
                    this.breakPoints.add(msg.addr);
                    break;
                case Messages.CLR_BREAK:
                    this.breakPoints.delete(msg.addr);
                    break;
                case Messages.CLR_ALL_BREAKS:
                    this.breakPoints.clear();
                    break;
            }
        };
    }

    /**
     * Get the main thread to print something to the UI console.
     * @param msg the string to append to the console
     */
    private static sendConsoleMessage(msg: string)
    {
        self.postMessage({type: Messages.CONSOLE, message: msg});
    }

    /*****************************
     ---- Getters and Setters ----
     *****************************/
    
    private static setPSR(value: number)
    {
        Atomics.store(this.psr, 0, value);
    }

    private static getPSR(): number
    {
        return Atomics.load(this.psr, 0);
    }

    private static enableClock()
    {
        Atomics.or(this.memory, this.MCR, 0x8000);
    }

    private static isClockEnabled(): boolean
    {
        return (Atomics.load(this.memory, this.MCR) & 0x8000) != 0;
    }

    private static haltSet(): boolean
    {
        return Atomics.load(this.haltFlag, 0) != 0;
    }

    private static getMemory(addr: number): number
    {
        return Atomics.load(this.memory, addr);
    }

    private static setMemory(addr: number, value: number)
    {
        Atomics.store(this.memory, addr, value);
    }

    private static getPC(): number
    {
        return Atomics.load(this.pc, 0);
    }

    private static setPC(value: number)
    {
        Atomics.store(this.pc, 0, value);
    }

    private static getRegister(index: number): number
    {
        return Atomics.load(this.registers, index);
    }

    private static setRegister(index: number, value: number)
    {
        Atomics.store(this.registers, index, value);
    }

    private static flagNegative(): boolean
    {
        let psrVal = this.getPSR();
        return (psrVal & this.MASK_N) != 0;
    }

    private static flagZero(): boolean
    {
        let psrVal = this.getPSR();
        return (psrVal & this.MASK_Z) != 0;
    }

    private static flagPositive(): boolean
    {
        let psrVal = this.getPSR();
        return (psrVal & this.MASK_P) != 0;
    }

    private static setPriorityLevel(level: number)
    {
        Atomics.or(this.psr, 0, (level & 0x7) << 8);
    }

    private static userMode(): boolean
    {
        let psrVal = this.getPSR();
        return (psrVal & this.MASK_USER) != 0;
    }

    /*****************************
     ---- Simulator Operation ----
     *****************************/

    /**
     * Set clock-enable and run until a breakpoint is encountered or the
     * clock-enable bit is cleared (including due to the invokation of the HALT
     * trap)
     */
    private static run()
    {
        this.enableClock();
        let intOrEx = this.instructionCycle();

        while (!this.haltSet() && this.isClockEnabled() && !this.breakPoints.has(this.getPC()))
        {
            let intOrEx = this.instructionCycle();
        }

        self.postMessage({type: Messages.WORKER_DONE});
    }

    /**
    * Set clock-enable and run one instruction
     */
    private static stepIn()
    {
        this.enableClock();
        let intOrEx = this.instructionCycle();

        self.postMessage({type: Messages.WORKER_DONE});
    }

    /**
     * Set clock-enable and run until the currently executing subroutine or
     * service call is returned from, or any of the conditions for run()
     * stopping are encountered
     */
    private static stepOut()
    {
        let currDepth = 1;
        this.enableClock();

        // execute first instruction cycle, ignoring breakpoints
        if (Opcodes.isRETorRTI(this.getPC()))
        {
            --currDepth;
        }
        else if (Opcodes.isJSRorJSRR(this.getPC()) || Opcodes.isTRAP(this.getPC()))
        {
            ++currDepth;
        }
        if (this.instructionCycle())
        {
            ++currDepth;
            // if we have an option to toggle breaking on interrupts/exceptions, handle it here
        }

        // keep executing but don't ignore clock or breakpoints
        while (!this.haltSet() && currDepth > 0 && this.isClockEnabled() && !this.breakPoints.has(this.getPC()))
        {
            if (Opcodes.isRETorRTI(this.getPC()))
            {
                --currDepth;
            }
            else if (Opcodes.isJSRorJSRR(this.getPC()) || Opcodes.isTRAP(this.getPC()))
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

        self.postMessage({type: Messages.WORKER_DONE});
    }

    /**
     * Set clock-enable and run one instruction, unless it is a JSR/JSRR or
     * TRAP, in which case run until one of the conditions for stepOut() or
     * run() is encountered. Will also step over exceptions and interrupts.
     */
    private static stepOver()
    {
        let depth = 0;

        // if we have a jsr/jsrr/trap, we'll need to step out of it
        if (Opcodes.isJSRorJSRR(this.getMemory(this.getPC())) || Opcodes.isTRAP(this.getMemory(this.getPC())))
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
        while (!this.haltSet() && depth > 0 && this.isClockEnabled() && !this.breakPoints.has(this.getPC()))
        {
            this.stepOut();
            --depth;
        }

        self.postMessage({type: Messages.WORKER_DONE});
    }

    /**
     * Execute a single instruction cycle. If an exception or interrupt occurs,
     * initiate it and return true. If the cycle completed as expected, return
     * false.
     * @returns true if an interrupt or exception occured, false otherwise
     */
    private static instructionCycle() : boolean
    {
        /*
        (1) check for exception (illegal instruction or privilege violation)
            * if yes, initialize and return true. Otherwise, continue
        (2) execute the instruction
            * fetch, increment PC
            * call subroutine for opcode
        (3) check if the console ready bit has been cleared. If so, output the
            character in the console data register to the screen and set the
            console ready bit
        (4) if INT asserted, initialize and return true. Else, return false
        */
        
        const oldPC = this.getPC();
        const instruction = this.getMemory(oldPC);
        this.setPC(oldPC + 1);

        // (1) check for exception
        // (a) priviledge mode exception
        if (this.userMode() && Opcodes.isRTI(instruction))
        {
            this.initException(Vectors.privilegeViolation());
            return true;
        }
        // (b) illegal opcode exception
        else if (Opcodes.isIllegal(instruction))
        {
            this.initException(Vectors.illegalOpcode());
            return true;
        }

        // (2) execute instruction
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

        // (3) console output
        if ((this.getMemory(this.DSR) & 0x8000) == 0)
        {
            // print character, set ready bit
            const toPrint = this.getMemory(this.DDR) & 0x00FF;
            this.sendConsoleMessage(String.fromCharCode(toPrint));
            Atomics.or(this.memory, this.DSR, 0x8000);
        }

        // (4) handle interrupt
        if (Atomics.load(this.interruptSignal, 0) != 0)
        {
            this.initInterrupt();
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * Set the condition codes according to the given number
     * @param result the 16-bit result of an instruction
     */
    private static setConditions(result: number)
    {
        let psrVal = this.getPSR();
        if ((result & 0x8000) != 0)
        {
            psrVal |= this.MASK_N;
            psrVal &= this.CLEAR_Z;
            psrVal &= this.CLEAR_P;
        }
        else if (result == 0)
        {
            psrVal &= this.CLEAR_N;
            psrVal |= this.MASK_Z;
            psrVal &= this.CLEAR_P;
        }
        else
        {
            psrVal &= this.CLEAR_N;
            psrVal &= this.CLEAR_Z;
            psrVal |= this.MASK_P;
        }
        this.setPSR(psrVal);
    }

    /**
     * Initialize an exception with the given vector
     * @param vector 
     */
    private static initException(vector: number)
    {
        // push PSR and PC onto supervisor stack
        let ssp = Atomics.load(this.savedSSP, 0);
        this.setMemory(ssp - 1, this.getPSR());
        this.setMemory(ssp - 2, this.getPC());
        Atomics.store(this.savedSSP, 0, ssp - 2);

        // load R6 with supervisor stack if it is not the SSP already
        if (this.userMode())
        {
            Atomics.store(this.savedUSP, 0, this.getRegister(6));
            this.setRegister(6, Atomics.load(this.savedSSP, 0));
        }

        // set privilege mode to supervisor (PSR[15] = 0)
        Atomics.or(this.psr, 0, this.MASK_USER);

        // set PC to memory[vector + 0x0100]
        vector += 0x0100;
        this.setPC(this.getMemory(vector));
    }

    /**
     * Initialize an interrupt
     */
    private static initInterrupt()
    {
        // disable interrupt signal
        Atomics.store(this.interruptSignal, 0, 0);

        // push PSR and PC onto supervisot stack
        let ssp = Atomics.load(this.savedSSP, 0);
        this.setMemory(ssp - 1, this.getPSR());
        this.setMemory(ssp - 2, this.getPC());
        Atomics.store(this.savedSSP, 0, ssp - 2);

        // load R6 with supervisor stack if it is not the SSP already
        if (this.userMode())
        {
            Atomics.store(this.savedUSP, 0, this.getRegister(6));
            this.setRegister(6, Atomics.load(this.savedSSP, 0));
        }

        // set privilege mode to supervisor (PSR[15] = 0)
        Atomics.or(this.psr, 0, this.MASK_USER);

        // set priority level to the one given by the interrupt
        this.setPriorityLevel(Atomics.load(this.interruptPriority, 0));

        // set PC to memory[vector + 0x0100]
        let vector = Atomics.load(this.interruptVector, 0);
        vector += 0x0100;
        this.setPC(this.getMemory(vector));
    }

    /**
     * Instruction methods - each executes one instruction.
     */

    private static execAdd(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const source1 = this.getRegister(decodeRegister(instruction, 1));
        let source2: number;
        if ((instruction & 0b10_0000) != 0)
        {
            source2 = decodeImmediate(instruction, 5);
        }
        else
        {
            source2 = this.getRegister(decodeRegister(instruction, 2));
        }

        const res = source1 + source2;
        this.setRegister(destReg, res);
        this.setConditions(res);
    }

    private static execAnd(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const source1 = this.getRegister(decodeRegister(instruction, 1));
        let source2: number;
        if ((instruction & 0b10_0000) != 0)
        {
            source2 = decodeImmediate(instruction, 5);
        }
        else
        {
            source2 = this.getRegister(decodeRegister(instruction, 2));
        }

        const res = source1 & source2;
        this.setRegister(destReg, res);
        this.setConditions(res);
    }

    private static execBr(instruction: number)
    {
        if (
            (this.flagNegative() && (instruction & 0x0800))
            || (this.flagZero() && (instruction & 0x0400))
            || (this.flagPositive() && (instruction & 0x0200))
        )
        {
            Atomics.add(this.pc, 0, decodeImmediate(instruction, 9));
        }
    }

    private static execJmp(instruction: number)
    {
        this.setPC(this.getRegister(decodeRegister(instruction, 1)));
    }

    private static execJsr(instruction: number)
    {
        const savedPC = this.getPC();
        if (instruction & 0x800)
        {
            Atomics.add(this.pc, 0, decodeImmediate(instruction, 11));
        }
        else
        {
            this.setPC(this.getRegister(decodeRegister(instruction, 1)));
        }
        this.setRegister(7, savedPC);
    }

    private static execLd(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const src = (this.getPC() + decodeImmediate(instruction, 9)) & 0xFFFF;
        const res = this.getMemory(src);
        this.setRegister(destReg, res);
        this.setConditions(res);
    }

    private static execLdi(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const src = (this.getPC() + decodeImmediate(instruction, 9)) & 0xFFFF;
        const res = this.getMemory(this.getMemory(src));
        this.setRegister(destReg, res);
        this.setConditions(res);
    }

    private static execLdr(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const srcReg = decodeRegister(instruction, 1);
        const src = (this.getRegister(srcReg)
                + decodeImmediate(instruction, 6)) & 0xFFFF;
        const res = this.getMemory(src);
        this.setRegister(destReg, res);
        this.setConditions(res);
    }

    private static execLea(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const res = this.getPC() + decodeImmediate(instruction, 9);
        this.setRegister(destReg, res);
        this.setConditions(res);
    }

    private static execNot(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const res = (~this.getRegister(decodeRegister(instruction, 1))) & 0xFFFF;
        this.setRegister(destReg, res);
        this.setConditions(res);
    }

    /**
     * Pop the PC and PSR off the stack, if privilege mode changes from
     * supervisor to user then load the USP into R6.
     * @param instruction 
     */
    private static execRti(instruction: number)
    {
        let sp = Atomics.load(this.savedSSP, 0);
        this.setPC(this.getMemory(sp));
        this.setPSR(this.getMemory(sp + 1));
        Atomics.store(this.savedSSP, 0, sp + 2);

        // if we went user -> supervisor, load R6 with USP
        if (this.userMode())
        {
            this.setRegister(6, Atomics.load(this.savedUSP, 0));
        }
        // otheewise, load R6 with SPP
        else
        {
            this.setRegister(6, Atomics.load(this.savedSSP, 0));
        }
    }

    private static execSt(instruction: number)
    {
        const dest = (this.getPC() + decodeImmediate(instruction, 9)) & 0xFFFF;
        this.setMemory(dest, this.getRegister(decodeRegister(instruction, 0)));
    }

    private static execSti(instruction: number)
    {
        const dest = (this.getPC() + decodeImmediate(instruction, 9)) & 0xFFFF;
        this.setMemory(this.getMemory(dest), this.getRegister(decodeRegister(instruction, 0)));
    }

    private static execStr(instruction: number)
    {
        const destReg = decodeRegister(instruction, 1);
        const srcReg = decodeRegister(instruction, 0);
        const dest = (this.getRegister(destReg) + decodeImmediate(instruction, 6)) & 0xFFFF;
        this.setMemory(dest, this.getRegister(srcReg));
    }

    /**
     * Load R7 with the incremented PC, then load PC with the zero-extended
     * trap vector in the instruction
     * @param instruction 
     */
    private static execTrap(instruction: number)
    {
        this.setRegister(7, this.getPC());
        this.setPC(this.getMemory(instruction & 0x00FF));
    }
}

SimWorker.init();
