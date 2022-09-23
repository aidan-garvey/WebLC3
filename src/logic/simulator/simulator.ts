/**
 * 
 */

export default class Simulator
{
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
    private internalUSP: Uint16Array = new Uint16Array(1);
    private internalSSP: Uint16Array = new Uint16Array(1);
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
    private objFile: Uint16Array;
    // memory addresses mapped to the code which generated the value there
    private disAsm: Map<number, string>;

    /**
     * Initialize the simulator, load the code into memory and set PC to start
     * of program
     * @param objectFile the object file to load
     * @param sourceCode memory addresses mapped to disassembled source code
     */
    public constructor(objectFile: Uint16Array, sourceCode: Map<number, string>)
    {
        this.objFile = objectFile;
        this.disAsm = sourceCode;
        this.loadBuiltInCode();
        this.reloadProgram();
    }

    /**
     * Load code into memory, set PC to start of program, restore Processor
     * Status Register to defaults, set clock-enable
     */
    public reloadProgram()
    {
        let loc = this.objFile[0];
        for (let i = 1; i < this.objFile.length; i++)
        {
            this.memory[loc++] = this.objFile[i];
        }
        this.pc[0] = this.objFile[0];

        this.restorePSR();
    }

    /**
     * Set PC to start of program and set clock-enable, leave rest of memory
     * and CPU as-is
     */
    public restartProgram()
    {
        this.pc[0] = this.objFile[0];
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
        this.loadBuiltInCode();
    }

    /**
     * Run until a breakpoint is encountered or the clock-enable bit is cleared
     * (including due to the invokation of the HALT trap)
     */
    public run()
    {

    }

    /**
     * Run one instruction if clock-enable is set
     */
    public stepIn()
    {

    }

    /**
     * Run until an RET or RTI has been executed, or any of the conditions for
     * run() stopping are encountered
     */
    public stepOut()
    {

    }

    /**
     * Run one instruction if clock-enable is set, unless it is a JSR/JSRR, in
     * which case run until one of the conditions for stepOut() or run() is
     * encountered
     */
    public stepOver()
    {

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
            let code = this.disAsm.get(i);
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
     * Set Processor Status Register to defaults and clear interrupt signal
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
    }

    /**
     * Dummy method which will load the code for built-in traps, exceptions and
     * interrupts
     */
    private loadBuiltInCode()
    {

    }

    /**
     * Set bit MCR[15]
     */
    private enableClock()
    {
        this.memory[Simulator.MCR] = 0x8000;
    }
}
