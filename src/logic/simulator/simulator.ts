/**
 * simulator.ts
 * 
 * The LC-3 simulator. Each instance keeps track of the machine's state and
 * executes code.
 * 
 * All functions that run the simulator (and only those functions) are async.
 */

import Assembler from "../assembler/assembler";
import UI from "../../presentation/ui"
import Messages from "./simMessages"

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

    private static WORKER_PATH = "src/logic/simulator/simWorker.ts";

    // 2^16 words * 2 bytes/word
    private static MEM_SIZE = (1 << 16) * 2;

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
    // memory addresses mapped to the code which generated the value there
    private userDisassembly: Map<number, string>;
    // object file for operating system code
    private osObjFile: Uint16Array;
    private osDissassembly: Map<number, string>;
    // worker thread for running the simulator without freezing rest of app
    private simWorker: Worker;
    private workerBusy: boolean = false;
    

    /**
     * Initialize the simulator, load the code into memory and set PC to start
     * of program
     * @param objectFile the object file to load
     * @param sourceCode memory addresses mapped to disassembled source code
     */
    public constructor(objectFile: Uint16Array, sourceCode: Map<number, string>)
    {
        this.userObjFile = objectFile;
        this.userDisassembly = sourceCode;

        // assemble operating system code, load into simulator, then load user's code
        (async ()=>{
            const osAsmResult = await this.getOSAsm();
            this.osObjFile = osAsmResult[0];
            this.osDissassembly = osAsmResult[1];

            this.loadBuiltInCode();

            // get Web Worker set up with a copy of the data
            this.simWorker = new Worker(Simulator.WORKER_PATH, {type: "module"});

            this.simWorker.onmessage = (event) => {
                const msg = event.data;
                console.log("Main thread received new message:");
                console.log(msg);
                if (msg.type === Messages.CYCLE_UPDATE)
                    this.updateFromWorker(msg);
                else if (msg.type === Messages.WORKER_DONE)
                    this.workerBusy = false;
                else if (msg.type === Messages.CONSOLE)
                    UI.appendConsole(msg.message);
            };

            this.simWorker.postMessage ({
                type: Messages.INIT,
                memory: this.memory,
                registers: this.registers,
                savedUSP: this.savedUSP,
                savedSSP: this.savedSSP,
                pc: this.pc,
                psr: this.getPSR(),
                intSignal: this.interruptSignal,
                intPriority: this.interruptPriority,
                intVector: this.interruptVector,
                breakPoints: this.breakPoints,
                userObj: objectFile,
                osObj: this.osObjFile
            });

            // get this class and the worker to reload the program
            this.reloadProgram();

            UI.appendConsole("Simulator ready.");
        })();
    }

    private async getOSAsm() : Promise<[Uint16Array, Map<number, string>]>
    {
        const res = await fetch('src/logic/simulator/os/lc3_os.asm');
        const src = await res.text();
        const asmResult = await Assembler.assemble(src);
        if (asmResult === null)
        {
            UI.appendConsole("Operating system assembly unsuccessful.");
            return [new Uint16Array(0), new Map()];
        }
        else
        {
            return asmResult;
        }
    }

    private updateFromWorker(msg: any)
    {
        for (let [addr, val] of msg.memoryMap)
        {
            this.memory[addr] = val;
        }
        this.registers = msg.registers;
        this.savedUSP = msg.savedUSP;
        this.savedSSP = msg.savedSSP;
        this.pc = msg.pc;
        this.setPSR(msg.psr, false);
        this.interruptSignal = msg.intSignal;
        this.interruptPriority = msg.intPriority;
        this.interruptVector = msg.intVector;
    }

    /**
     * Load code into memory, set PC to start of program, restore Processor
     * Status Register to defaults, set clock-enable
     */
    public reloadProgram()
    {
        this.simWorker.postMessage({type: Messages.RELOAD});

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
            this.memory[loc++] = this.osObjFile[i];
        }
    }

    /**
     * Set PC to start of program and set clock-enable, leave rest of memory
     * and CPU as-is
     */
    public restartProgram()
    {
        this.pc[0] = this.userObjFile[0];
        this.simWorker.postMessage({type: Messages.SET_PC, pc: this.pc});
    }

    /**
     * Set all of memory to zeroes except for operating system code
     */
    public resetMemory()
    {
        this.simWorker.postMessage({type: Messages.RESET});

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

        this.simWorker.postMessage({type: Messages.RANDOMIZE, memory: this.memory});
    }

    public async halt()
    {
        if (this.workerBusy)
        {
            this.workerBusy = false;
            this.simWorker.postMessage({type: Messages.HALT});
        }
    }

    /**
     * Set clock-enable and run until a breakpoint is encountered or the
     * clock-enable bit is cleared (including due to the invokation of the HALT
     * trap)
     */
    public async run()
    {
        if (!this.workerBusy)
        {
            this.workerBusy = true;
            this.simWorker.postMessage({type: Messages.RUN});
        }
        else
        {
            UI.appendConsole("Simulator is already running!\n");
        }
    }

    /**
    * Set clock-enable and run one instruction
     */
    public async stepIn()
    {
        if (!this.workerBusy)
        {
            this.workerBusy = true;
            this.simWorker.postMessage({type: Messages.STEP_IN});
        }
        else
        {
            UI.appendConsole("Simulator is already running!\n");
        }
    }

    /**
     * Set clock-enable and run until the currently executing subroutine or
     * service call is returned from, or any of the conditions for run()
     * stopping are encountered
     */
    public async stepOut()
    {
        if (!this.workerBusy)
        {
            this.workerBusy = true;
            this.simWorker.postMessage({type: Messages.STEP_OUT});
        }
        else
        {
            UI.appendConsole("Simulator is already running!\n");
        }
    }

    /**
     * Set clock-enable and run one instruction, unless it is a JSR/JSRR or
     * TRAP, in which case run until one of the conditions for stepOut() or
     * run() is encountered. Will also step over exceptions and interrupts.
     */
    public async stepOver()
    {
        if (!this.workerBusy)
        {
            this.workerBusy = true;
            this.simWorker.postMessage({type: Messages.STEP_OVER});
        }
        else
        {
            UI.appendConsole("Simulator is already running!\n");
        }
    }

    /**
     * Invoke a keyboard interrupt if the conditions are valid. Namely, the
     * keyboard interrupt-enable bit must be set and the current priority level
     * must be less than 4.
     * The interrupt enable bit is bit 14 of the keyboard status register.
     * Regardless of interrupt invokation, the keyboard data register is
     * updated with the new ascii code and the keyboard status register's ready
     * bit is set
     */
    public keyboardInterrupt(asciiCode: number)
    {
        this.memory[Simulator.KBDR] = asciiCode;
        this.memory[Simulator.KBSR] |= 0x8000;
        if (this.priorityLevel < 4 && (this.memory[Simulator.KBSR] & 0x4000) != 0)
        {
            this.interruptSignal = true;
            this.interruptPriority = 4;
            this.interruptVector = 0x80;
        }

        this.simWorker.postMessage(
            {
                type: Messages.KBD_INT,
                intSignal: this.interruptSignal,
                intPriority: this.interruptPriority,
                intVector: this.interruptVector,
                kbsr: this.memory[Simulator.KBSR],
                kndr: this.memory[Simulator.KBDR]
            }
        );
    }

    /**
     * Add a breakpoint
     * @param address the address of the breakpoint
     */
    public setBreakpoint(address: number)
    {
        this.breakPoints.add(address);
        this.simWorker.postMessage({type: Messages.SET_BREAK, addr: address});
    }

    /**
     * Remove a breakpoint
     * @param address the address of the breakpoint
     */
    public clearBreakpoint(address: number)
    {
        this.breakPoints.delete(address);
        this.simWorker.postMessage({type: Messages.CLR_BREAK, addr: address});
    }

    /**
     * Clear all breakpoints
     */
    public clearAllBreakpoints()
    {
        this.breakPoints.clear();
        this.simWorker.postMessage({type: Messages.CLR_ALL_BREAKS});
    }

    /**
     * Return the formatted contents of memory in a given range. Both values in the range
     * will be taken mod x10000.
     * @param start start of range (inclusive)
     * @param end end of range (exclusive)
     * @returns an array of entries with format: [address, hex val, decimal val, code]
     */
    public getMemoryRange(start: number, end: number) : string[][]
    {
        let len = end - start;

        start %= 0x1_0000;
        if (start < 0)
            start += 0x1_0000;

        len %= 0x1_0000;
        if (len < 0)
            len += 0x1_0000;
        
        let res: string[][] = [];
        for (let i = 0; i < len; i++)
        {
            let addr = (i + start) % 0x1_0000;
            let code;
            if (this.userDisassembly.has(addr))
            {
                code = this.userDisassembly.get(addr);
            }
            else if (this.osDissassembly.has(addr))
            {
                code = this.osDissassembly.get(addr);
            }
            if (typeof(code) === "undefined")
            {
                code = "";
            }
            res.push([
                "0x" + addr.toString(16),
                "0x" + this.memory[addr].toString(16),
                this.memory[addr].toString(10),
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
        this.simWorker.postMessage({
            type: Messages.SET_MEM, addr: address, val: value
        });
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
        this.simWorker.postMessage({type: Messages.SET_REG, registers: this.registers});
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
        this.simWorker.postMessage({type: Messages.SET_PC, pc: this.pc});
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
     * @param value the 16-bit word to use as the new PSR value
     * @param updateWorker if true, update the worker's copy of the PSR. Should
     *      only be false if we know the worker's PSR is up-to-date.
     */
    public setPSR(value: number, updateWorker: boolean = true)
    {
        this.flagPositive = (value & 1) != 0;
        this.flagZero = (value & 2) != 0;
        this.flagNegative = (value & 4) != 0;
        this.priorityLevel = (value >> 8) & 7;
        this.userMode = (value & 0x8000) != 0;

        if (updateWorker)
            this.simWorker.postMessage({type: Messages.SET_PSR, psr: this.getPSR()});
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
}
