/**
 * simulator.ts
 *
 * The LC-3 simulator. Keeps track of the machine's state and interacts with the
 * UI. Has a worker (simWorker.ts) which executes LC-3 code. Most of the LC-3's
 * data is stored in Uint16Arrays with SharedArrayBuffers, so changes made by
 * the worker will appear to the simulator.
 */

import Assembler from "../assembler/assembler";
import ARMAssembler from "../assembler/armAssembler";
import UI from "../../presentation/ui";
import Messages from "./simMessages";
import AsciiDecoder from "./asciiDecoder";
import LC3Worker from '$lib/simWorker?worker';
import ARMWorker from '$lib/armSimWorker?worker';

// Used to tell which type of simulator worker to create
enum FileType {
    LC3 = "asm",
    ARM = "s"
};

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

    // 2^16 words * 2 bytes/word
    private static MEM_SIZE = (1 << 16) * 2;
    // 16 registers * 2 bytes/word
    private static REGISTERS_SIZE = 2*16;

    // PSR can be AND'ed with these values to get a flag
    private static MASK_N = 0x4;
    private static MASK_Z = 0x2;
    private static MASK_P = 0x1;
    private static MASK_USER = 0x8000;
    // user mode enabled, condition code N, everything else zero
    private static PSR_DEFAULT = 0x8002;
    // initial value for supervisor stack pointer
    private static SSP_DEFAULT = 0x3000;

    // 2^16 words of memory
    private memory: Uint16Array;
    // general-purpose registers
    private registers: Uint16Array;
    // internal registers for non-active stack pointer
    private savedUSP: Uint16Array;
    private savedSSP: Uint16Array;
    // program counter
    private pc: Uint16Array;

    // Processor Status Register (PSR)
    private psr: Uint16Array;

    // interrupt parameters
    private interruptSignal: Uint8Array;
    private interruptPriority: Uint8Array;
    private interruptVector: Uint16Array;

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
    // worker is executing code for the simulator
    private workerBusy: boolean = false;
    // shared flag to halt worker
    private workerHalt: Uint8Array;
    
    // control whether to ignore console messages
    private ignoreConsoleMessages = false;

    /**
     * Initialize the simulator, load the code into memory and set PC to start
     * of program
     * @param objectFile the object file to load
     * @param sourceCode memory addresses mapped to disassembled source code
     */
    public constructor(objectFile: Uint16Array, sourceCode: Map<number, string>, type: FileType)
    {
        this.userObjFile = objectFile;
        this.userDisassembly = sourceCode;

        this.memory = new Uint16Array(new SharedArrayBuffer(Simulator.MEM_SIZE));
        this.registers = new Uint16Array(new SharedArrayBuffer(Simulator.REGISTERS_SIZE));
        this.savedSSP = new Uint16Array(new SharedArrayBuffer(2));
        this.savedUSP = new Uint16Array(new SharedArrayBuffer(2));
        this.pc = new Uint16Array(new SharedArrayBuffer(2));
        this.psr = new Uint16Array(new SharedArrayBuffer(2));
        this.interruptSignal = new Uint8Array(new SharedArrayBuffer(1));
        this.interruptPriority = new Uint8Array(new SharedArrayBuffer(1));
        this.interruptVector = new Uint16Array(new SharedArrayBuffer(2));
        this.workerHalt = new Uint8Array(new SharedArrayBuffer(1));
        Atomics.store(this.workerHalt, 0, 0);
        Atomics.store(this.savedSSP, 0, Simulator.SSP_DEFAULT);

        // assemble operating system code, load into simulator, then load user's code
        (async ()=>{
            const osAsmResult = await this.getOSAsm(type);
            this.osObjFile = osAsmResult[0];
            this.osDissassembly = osAsmResult[1];
            this.loadBuiltInCode();

            this.initWorker(type);
            this.workerBusy = false;

            // get this class and the worker to reload the program
            this.reloadProgram();

            UI.setSimulatorReady();
            UI.appendConsole("Simulator ready.");
        })();
    }

    private async getOSAsm(type: FileType) : Promise<[Uint16Array, Map<number, string>]>
    {
        let asmResult;
        if (type == FileType.ARM)
        {
            const res = await fetch('/os/lc3_arm_os.s?raw');
            const src = await res.text();
            asmResult = await ARMAssembler.assemble(src, false);
        }
        else
        {
            const res = await fetch('/os/lc3_os.asm?raw');
            const src = await res.text();
            asmResult = await Assembler.assemble(src, false);
        }
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

    /**
     * Send a message to simWorker with the simulator's state
     */
    private initWorker(type: FileType)
    {
        if (type == FileType.ARM)
            this.simWorker = new ARMWorker();
        else
            this.simWorker = new LC3Worker();

        this.simWorker.onmessage = (event) => {
            const msg = event.data;
            if (msg.type === Messages.WORKER_DONE)
            {
                this.workerBusy = false;
                Atomics.store(this.workerHalt, 0, 0);
                UI.setSimulatorReady();
                UI.update();
            }
            else if (msg.type === Messages.MSG_QUEUE_END) {
              // End of recent message queue, re-enable handling console messages
              this.ignoreConsoleMessages = false;
            } else if (msg.type === Messages.CONSOLE && !this.ignoreConsoleMessages)
              UI.appendConsole(msg.message);
        };

        this.simWorker.postMessage ({
            type: Messages.INIT,
            memory: this.memory,
            registers: this.registers,
            savedUSP: this.savedUSP,
            savedSSP: this.savedSSP,
            pc: this.pc,
            psr: this.psr,
            intSignal: this.interruptSignal,
            intPriority: this.interruptPriority,
            intVector: this.interruptVector,
            breakPoints: this.breakPoints,
            halt: this.workerHalt
        });
    }

    /**
     * Tell the worker to post a message so we know when we've handled
     * all messages up until this point. Allows us to ignore message spam
     */
    public clearMessageQueue() {
        this.ignoreConsoleMessages = true
        this.simWorker.postMessage({ type: Messages.MSG_QUEUE_END });
    }

    /**
     * Load code into memory, set PC to start of program, restore Processor
     * Status Register to defaults, set clock-enable
     */
    public reloadProgram()
    {
        if (this.workerBusy)
        {
            this.halt();
        }

        let loc = this.userObjFile[0];
        for (let i = 1; i < this.userObjFile.length; i++)
        {
            this.setMemory(loc++, this.userObjFile[i]);
        }
        Atomics.store(this.pc, 0, this.userObjFile[0]);

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
            this.setMemory(loc++, this.osObjFile[i]);
        }
    }

    /**
     * Set PC to start of program and set clock-enable, leave rest of memory
     * and CPU as-is
     */
    public restartProgram()
    {
        if (this.workerBusy)
        {
            this.halt();
        }
        Atomics.store(this.pc, 0, this.userObjFile[0]);
    }

    /**
     * Set all of memory to zeroes except for operating system code
     */
    public resetMemory()
    {
        if (this.workerBusy)
        {
            this.halt();
        }

        for (let i = 0; i < this.memory.length; i++)
        {
            this.setMemory(i, 0);
        }
        for (let i = 0; i < 8; i++)
        {
            this.setRegister(i, 0);
        }
        this.loadBuiltInCode();
    }

    /**
     * Randomize all of memory except for operating system code
     */
    public randomizeMemory()
    {
        if (this.workerBusy)
        {
            this.halt();
        }

        for (let i = 0; i < this.memory.length; i++)
        {
            this.setMemory(i, this.randWord());
        }
        for (let i = 0; i < 8; i++)
        {
            this.setRegister(i, this.randWord());
        }
        this.loadBuiltInCode();
    }

    public async halt()
    {
        if (this.workerBusy)
        {
            Atomics.store(this.workerHalt, 0, 1);
        }
        else
        {
            UI.appendConsole("Simulator is not running!\n")
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
            UI.setSimulatorRunning();
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
            UI.setSimulatorRunning();
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
            UI.setSimulatorRunning();
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
            UI.setSimulatorRunning();
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
        Atomics.store(this.memory, Simulator.KBDR, asciiCode);
        const currKBSR = Atomics.or(this.memory, Simulator.KBSR, 0x8000);
        if (this.priorityLevel() < 4 && (currKBSR & 0x4000) != 0)
        {
            Atomics.store(this.interruptSignal, 0, 1);
            Atomics.store(this.interruptPriority, 0, 4);
            Atomics.store(this.interruptVector, 0, 0x80);
        }
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
            let content = this.getMemory(addr);
            let code;
            if (this.userDisassembly.has(addr))
            {
                code = this.userDisassembly.get(addr);
            }
            else if (this.osDissassembly.has(addr))
            {
                code = this.osDissassembly.get(addr);
            }
            else
            {
                code = AsciiDecoder.decode(content);
            }

            if (typeof(code) === "undefined")
            {
                code = "";
            }
            res.push([
                "0x" + addr.toString(16),
                "0x" + content.toString(16),
                this.signExtend(content).toString(10),
                code
            ]);
        }
        return res;
    }

    /**
     * Return the code stored in the given memory location
     * @param address the address to query
     * @returns the code stored at memory[address]
     */
     public getCode(addr: number) : string
     {
        let code;
        let content = this.getMemory(addr);
        if (this.userDisassembly.has(addr))
        {
            code = this.userDisassembly.get(addr);
        }
        else if (this.osDissassembly.has(addr))
        {
            code = this.osDissassembly.get(addr);
        }
        else
        {
            code = AsciiDecoder.decode(content);
        }

        if (typeof(code) === "undefined")
        {
            code = "";
        }
        return code;
     }

    /**
     * Return the number stored in the given memory location
     * @param address the address to query
     * @returns the value stored at memory[address]
     */
    public getMemory(address: number) : number
    {
        return Atomics.load(this.memory, address);
    }

    /**
     * Write the given value to the given memory location
     * @param address the address to write to
     * @param value the value to store at memory[address]
     */
    public setMemory(address: number, value: number)
    {
        Atomics.store(this.memory, address, value);
    }

    /**
     * Return the contents of a register
     * @param registerNumber
     * @returns
     */
    public getRegister(registerNumber: number) : number
    {
        return Atomics.load(this.registers, registerNumber);
    }

    /**
     * Set the contents of a register
     * @param registerNumber
     * @param value
     */
    public setRegister(registerNumber: number, value: number)
    {
        Atomics.store(this.registers, registerNumber, value);
    }

    /**
     * Return the value of the program counter
     * @returns
     */
    public getPC() : number
    {
        return Atomics.load(this.pc, 0);
    }

    /**
     * Set the value of the program counter
     * @param value
     */
    public setPC(value: number)
    {
        Atomics.store(this.pc, 0, value);
    }

    /**
     * Return the value of the processor status register
     * @returns
     */
    public getPSR() : number
    {
        return Atomics.load(this.psr, 0);
    }

    /**
     * Set the value of the processor status register
     * @param value the 16-bit word to use as the new PSR value
     */
    public setPSR(value: number)
    {
        Atomics.store(this.psr, 0, value);
    }

    /**
     * Break the value of the PSR into its individual components
     * @returns [user mode, priority level, negative, zero, positive]
     */
    private getAllPSR(): [
        boolean, // user mode
        number,  // priority level
        boolean, // negative
        boolean, // zero
        boolean  // positive
    ]
    {
        const psrVal = this.getPSR();
        return [
            (psrVal & Simulator.MASK_USER) != 0,
            (psrVal >> 8) & 0x7,
            (psrVal & Simulator.MASK_N) != 0,
            (psrVal & Simulator.MASK_Z) != 0,
            (psrVal & Simulator.MASK_P) != 0
        ];
    }

    private priorityLevel(): number
    {
        let psrVal = this.getPSR();
        return (psrVal >> 8) & 0x7;
    }

    /**
     * Get a breakdown of the statuses of the PSR's components. Returns an
     * array of strings with the following elements: (1) if the processor is in
     * user or supervisor mode; (2) the priority level of the currently-
     * executing program; (3) the condition code flags
     */
    public getPSRInfo() : string[]
    {
        const psrVals = this.getAllPSR();

        let flags = "";
        if (psrVals[2])
            flags += "N";
        if (psrVals[3])
            flags += "Z";
        if (psrVals[4])
            flags += "P";
        if (!flags)
            flags = "[none]"

        return [
            psrVals[0] ? "user" : "supervisor",
            "PL" + psrVals[1],
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
        Atomics.store(this.psr, 0, Simulator.PSR_DEFAULT);

        Atomics.store(this.interruptSignal, 0, 0);
        Atomics.store(this.interruptPriority, 0, 0);
        Atomics.store(this.interruptVector, 0, 0);
        Atomics.store(this.savedSSP, 0, Simulator.SSP_DEFAULT);
        Atomics.store(this.savedUSP, 0, 0);
    }

    /**
     * Sign-extend a 16-bit integer
     */
    public signExtend(num: number): number
    {
        // if it's positive, do not change it
        if ((num & 0x8000) == 0)
        {
            return num;
        }
        else
        {
            // convert to positive 16-bit integer
            num = ~num;
            num += 1;
            num &= 0xFFFF;
            // return its negation
            return -num;
        }
    }
}
