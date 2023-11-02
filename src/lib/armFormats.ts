/*
Functions to test if an instruction is of a certain type, similar to opcodes.ts
in the LC-3 simulator
*/

import ArmSimWorker from "./armSimWorker";

export default class ArmFormats
{
    // Checks for a return from a subroutine
    public static isBXorRTI(instruction: number): boolean
    {
        return ArmSimWorker.getBits(instruction, 15, 6) == 0b0100011100 || instruction == 0b0100011101000000;
    }

    // Checks for a jump to subroutine
    public static isBL(instruction: number): boolean
    {
        return ArmSimWorker.getBits(instruction, 15, 12) == 0b1111;
    }

    // Checks for a software interrupt
    public static isSWI(instruction: number): boolean
    {
        return ArmSimWorker.getBits(instruction, 15, 8) == 0b11011111;
    }
}