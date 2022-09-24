
export default class Opcodes
{
    private static JSR = 0x4000;
    private static RET = 0xC1C0;
    private static RTI = 0x8000;
    private static TRAP = 0xF000;

    public static isJSRorJSRR(instruction: number) : boolean
    {
        return (instruction & 0xF000) == Opcodes.JSR;
    }

    public static isRETorRTI(instruction: number) : boolean
    {
        return instruction == Opcodes.RET || (instruction & 0xF000) == Opcodes.RTI;
    }

    public static isTRAP(instruction: number) : boolean
    {
        return (instruction & 0xF000) == Opcodes.TRAP;
    }
}