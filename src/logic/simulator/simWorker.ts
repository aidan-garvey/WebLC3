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

    // if set to true, the worker thread must halt and transfer ownership of
    // memory back to the main thread as soon as the current instruction is done
    private static haltFlag: boolean;
    // simulator's memory, transferred from simulator
    private static memory: Uint16Array;
    // general-purpose registers
    private static registers: Uint16Array;
    // internal registers for non-active stack pointer
    private static savedUSP: Uint16Array;
    private static savedSSP: Uint16Array;
    // program counter
    private static pc: Uint16Array;
    // components of the Processor Status Register (PSR)
    private static userMode: boolean;
    private static priorityLevel: number;
    private static flagNegative: boolean;
    private static flagZero: boolean;
    private static flagPositive: boolean;
    // interrupt parameters
    private static interruptSignal: boolean;
    private static interruptPriority: number;
    private static interruptVector: number;
    // addresses of each active breakpoint
    private static breakPoints: Set<number>;
    // object file for program to run
    private static userObjFile: Uint16Array;
    // object file for operating system code
    private static osObjFile: Uint16Array;

    private static changedMemory: Set<number>;

    /**
     * Initialize message handlers
     */
    public static init()
    {
        this.haltFlag = false;

        console.log("Hello, thread!");

        self.onmessage = (event) => {
            const msg = event.data;
            console.log("Worker received new message:");
            console.log(msg);
            switch (msg.type)
            {
                // save a copy of the simulator's data
                case Messages.INIT:
                    this.memory = msg.memory;
                    this.registers = msg.registers;
                    this.savedUSP = msg.savedUSP;
                    this.savedSSP = msg.savedSSP;
                    this.pc = msg.pc;
                    this.setPSR(msg.psr);
                    this.interruptSignal = msg.intSignal;
                    this.interruptPriority = msg.intPriority;
                    this.interruptVector = msg.intVector;
                    this.breakPoints = msg.breakPoints;
                    this.userObjFile = msg.userObj;
                    this.osObjFile = msg.osObj;
                    break;
                case Messages.RELOAD:
                    this.reloadProgram();
                    break;
                case Messages.RESET:
                    this.resetMemory();
                    break;
                case Messages.RANDOMIZE:
                    this.memory = msg.memory;
                    break;
                case Messages.HALT:
                    this.haltFlag = true;
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
                case Messages.KBD_INT:
                    this.interruptSignal = msg.intSignal;
                    this.interruptPriority = msg.intPriority;
                    this.interruptVector = msg.intVector;
                    this.memory[this.KBSR] = msg.kbsr;
                    this.memory[this.KBDR] = msg.kbdr;
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
                case Messages.SET_MEM:
                    this.memory[msg.addr] = msg.val;
                    break;
                case Messages.SET_REG:
                    this.registers = msg.registers;
                    break;
                case Messages.SET_PC:
                    this.pc = msg.pc;
                    break;
                case Messages.SET_PSR:
                    this.setPSR(msg.psr);
                    break;
            }
        };
    }

    private static sendConsoleMessage(msg: string)
    {
        self.postMessage({type: Messages.CONSOLE, message: msg});
    }

    /**
     * Send a message to the main thread after an instruction cycle to update
     * its values.
     */
    private static updateMainThread()
    {
        // construct map from changedMemory
        const memUpdates: Map<number, number> = new Map();
        for (let addr of this.changedMemory)
        {
            memUpdates.set(addr, this.memory[addr]);
        }
        // send the message
        self.postMessage({
            type: Messages.CYCLE_UPDATE,
            memoryMap: memUpdates,
            registers: this.registers,
            savedUSP: this.savedUSP,
            savedSSP: this.savedSSP,
            pc: this.pc,
            psr: this.getPSR(),
            intSignal: this.interruptSignal,
            intPriority: this.interruptPriority,
            intVector: this.interruptVector
        });
    }

    /*****************************
     ---- Getters and Setters ----
     *****************************/
    
    private static setPSR(value: number)
    {
        this.flagPositive = (value & 1) != 0;
        this.flagZero = (value & 2) != 0;
        this.flagNegative = (value & 4) != 0;
        this.priorityLevel = (value >> 8) & 7;
        this.userMode = (value & 0x8000) != 0;
    }

    private static getPSR(): number
    {
        let result = +this.userMode << 15;
        result |= this.priorityLevel << 8;
        result |= +this.flagNegative << 2;
        result |= +this.flagZero << 1;
        result |= +this.flagPositive;
        return result;
    }

    /**
     * Set Processor Status Register to defaults, clear interrupt signal, reset
     * saved USP and SSP
     */
    private static restorePSR()
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

    private static enableClock()
    {
        this.memory[this.MCR] = 0x8000;
    }

    private static isClockEnabled(): boolean
    {
        return (this.memory[this.MCR] & 0x8000) != 0;
    }

    /**************************************
     ---- Mass Memory Copies / Setters ----
     These are faster to do independently
     than via messages.
     **************************************/

    /**
     * Load code into memory, set PC to start of program, restore Processor
     * Status Register to defaults, set clock-enable
     */
    private static reloadProgram()
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
    private static loadBuiltInCode()
    {
        let loc = this.osObjFile[0];
        for (let i = 1; i < this.osObjFile.length; i++)
        {
            this.memory[loc++] = this.osObjFile[i];
        }
    }

    /**
     * Set all of memory to zeroes except for operating system code
     */
    private static resetMemory()
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
        this.haltFlag = false;
        let intOrEx = this.instructionCycle();

        while (!this.haltFlag && this.isClockEnabled() && !this.breakPoints.has(this.pc[0]))
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
        this.haltFlag = false;
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
        this.haltFlag = false;

        // execute first instruction cycle, ignoring breakpoints
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
        while (!this.haltFlag && currDepth > 0 && this.isClockEnabled() && !this.breakPoints.has(this.pc[0]))
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
        if (Opcodes.isJSRorJSRR(this.memory[this.pc[0]]) || Opcodes.isTRAP(this.memory[this.pc[0]]))
        {
            ++depth;
        }
        // run 1 instruction, if interrupt or exception occurs we'll step out of it
        this.enableClock();
        this.haltFlag = false;
        if (this.instructionCycle())
        {
            ++depth;
        }

        // call stepOut() until we're back to depth of 0
        while (!this.haltFlag && depth > 0 && this.isClockEnabled() && !this.breakPoints.has(this.pc[0]))
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
        
        const instruction = this.memory[this.pc[0]++];

        // this will track all the memory addresses that get updated
        this.changedMemory = new Set();

        // (1) check for exception
        // (a) priviledge mode exception
        if (this.userMode && Opcodes.isRTI(instruction))
        {
            this.initException(Vectors.privilegeViolation());
            this.updateMainThread();
            return true;
        }
        // (b) illegal opcode exception
        else if (Opcodes.isIllegal(instruction))
        {
            this.initException(Vectors.illegalOpcode());
            this.updateMainThread();
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
        if ((this.memory[this.DSR] & 0x8000) == 0)
        {
            // print character, set ready bit
            const toPrint = this.memory[this.DDR] & 0x00FF;
            this.sendConsoleMessage(String.fromCharCode(toPrint));
            this.memory[this.DSR] |= 0x8000;
            this.changedMemory.add(this.DSR);
        }

        // (4) handle interrupt
        if (this.interruptSignal)
        {
            this.initInterrupt();
            this.updateMainThread();
            return true;
        }
        else
        {
            this.updateMainThread();
            return false;
        }
    }

    /**
     * Set the condition codes according to the given number
     * @param result the 16-bit result of an instruction
     */
    private static setConditions(result: number)
    {
        this.flagNegative = (result & 0x8000) != 0;
        this.flagZero = result == 0;
        this.flagPositive = (result & 0x8000) == 0 && result > 0;
    }

    /**
     * Initialize an exception with the given vector
     * @param vector 
     */
    private static initException(vector: number)
    {
        // push PSR and PC onto supervisor stack
        let ssp = this.savedSSP[0];
        this.memory[--ssp] = this.getPSR();
        this.memory[--ssp] = this.pc[0];
        this.savedSSP[0] = ssp;

        this.changedMemory.add(ssp);
        this.changedMemory.add(ssp + 1);

        // load R6 with supervisor stack if it is not the SSP already
        if (this.userMode)
        {
            this.savedUSP[0] = this.registers[6];
            this.registers[6] = this.savedSSP[0];
        }

        // set privilege mode to supervisor (PSR[15] = 0)
        this.userMode = false;
        
        // expand vector to 16 bits, adding 0x0100 to its value
        vector += 0x0100;

        // set the PC to the value of this expanded vector
        this.pc[0] = this.memory[vector];
    }

    /**
     * Initialize an interrupt
     */
    private static initInterrupt()
    {
        // disable interrupt signal
        this.interruptSignal = false;

        // push PSR and PC onto supervisor stack
        let ssp = this.savedSSP[0];
        this.memory[--ssp] = this.getPSR();
        this.memory[--ssp] = this.pc[0];
        this.savedSSP[0] = ssp;

        this.changedMemory.add(ssp);
        this.changedMemory.add(ssp + 1);
        

        // load R6 with supervisor stack if it is not the SSP already
        if (this.userMode)
        {
            this.savedUSP[0] = this.registers[6];
            this.registers[6] = this.savedSSP[0];
        }

        // set privilege mode to supervisor (PSR[15] = 0)
        this.userMode = false;

        // set priority level to the one given by the interrupt
        this.priorityLevel = this.interruptPriority;

        // set the PC to the value of the vector expanded to 16 bits + 0x0100
        this.pc[0] = this.memory[this.interruptVector + 0x0100];
    }

    /**
     * Instruction methods - each executes one instruction.
     */

    private static execAdd(instruction: number)
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

    private static execAnd(instruction: number)
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

    private static execBr(instruction: number)
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

    private static execJmp(instruction: number)
    {
        this.pc[0] = this.registers[decodeRegister(instruction, 1)];
    }

    private static execJsr(instruction: number)
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

    private static execLd(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const src = (this.pc[0] + decodeImmediate(instruction, 9)) & 0xFFFF;
        this.registers[destReg] = this.memory[src];
        this.setConditions(this.registers[destReg]);
    }

    private static execLdi(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const src = (this.pc[0] + decodeImmediate(instruction, 9)) & 0xFFFF;
        this.registers[destReg] = this.memory[this.memory[src]];
        this.setConditions(this.registers[destReg]);
    }

    private static execLdr(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        const srcReg = decodeRegister(instruction, 1);
        const src = (this.registers[srcReg]
                + decodeImmediate(instruction, 6)) & 0xFFFF;
        this.registers[destReg] = this.memory[src];
        this.setConditions(this.registers[destReg]);
    }

    private static execLea(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        this.registers[destReg] = this.pc[0] + decodeImmediate(instruction, 9);
        this.setConditions(this.registers[destReg]);
    }

    private static execNot(instruction: number)
    {
        const destReg = decodeRegister(instruction, 0);
        this.registers[destReg] = (~this.registers[decodeRegister(instruction, 1)]) & 0xFFFF;
        this.setConditions(this.registers[destReg]);
    }

    /**
     * Pop the PC and PSR off the stack, if privilege mode changes from
     * supervisor to user then load the USP into R6.
     * @param instruction 
     */
    private static execRti(instruction: number)
    {
        let sp = this.savedSSP[0];
        this.pc[0] = this.memory[sp++];
        this.setPSR(this.memory[sp++]);
        this.savedSSP[0] = sp;

        // if we went user -> supervisor, load R6 with USP
        if (this.userMode)
        {
            this.registers[6] = this.savedUSP[0];
        }
        // otherwise, load R6 with SSP
        else
        {
            this.registers[6] = this.savedSSP[0];
        }
    }

    private static execSt(instruction: number)
    {
        const dest = (this.pc[0] + decodeImmediate(instruction, 9)) & 0xFFFF;
        this.memory[dest] = this.registers[decodeRegister(instruction, 0)];

        this.changedMemory.add(dest);
    }

    private static execSti(instruction: number)
    {
        const dest = (this.pc[0] + decodeImmediate(instruction, 9)) & 0xFFFF;
        this.memory[this.memory[dest]] = this.registers[decodeRegister(instruction, 0)];
    
        this.changedMemory.add(this.memory[dest]);
    }

    private static execStr(instruction: number)
    {
        const destReg = decodeRegister(instruction, 1);
        const srcReg = decodeRegister(instruction, 0);
        const dest = (this.registers[destReg] + decodeImmediate(instruction, 6)) & 0xFFFF;
        this.memory[dest] = this.registers[srcReg];

        this.changedMemory.add(dest);
    }

    /**
     * Load R7 with the incremented PC, then load PC with the zero-extended
     * trap vector in the instruction
     * @param instruction 
     */
    private static execTrap(instruction: number)
    {
        this.registers[7] = this.pc[0];
        this.pc[0] = this.memory[instruction & 0x00FF];
    }
}

SimWorker.init();
