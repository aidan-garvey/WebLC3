import Messages from "./simMessages";

class SimWorker
{
    // if set to true, the worker thread must halt and transfer ownership of
    // memory back to the main thread as soon as the current instruction is done
    static haltFlag: boolean;
    // simulator's memory, transferred from simulator
    static memory: Uint16Array;
    // general-purpose registers
    static registers: Uint16Array;
    // internal registers for non-active stack pointer
    static savedUSP: Uint16Array;
    static savedSSP: Uint16Array;
    // program counter
    static pc: Uint16Array;
    // components of the Processor Status Register (PSR)
    static userMode: boolean;
    static priorityLevel: number;
    static flagNegative: boolean;
    static flagZero: boolean;
    static flagPositive: boolean;
    // interrupt parameters
    static interruptSignal: boolean;
    static interruptPriority: number;
    static interruptVector: number;
    // addresses of each active breakpoint
    static breakPoints: Set<number>;

    /**
     * Initialize message handlers
     */
    static init()
    {
        self.onmessage = (event) => {
            switch (event.data.messageType)
            {
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
                    // step out
                    break;
                case Messages.STEP_OVER:
                    // step over
                    break;
            }
        }
    }
}

SimWorker.init();
