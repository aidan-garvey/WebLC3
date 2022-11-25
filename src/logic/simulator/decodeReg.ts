
/**
 * Decode the index of a register in an instruction
 * @param instruction the instruction to decode
 * @param position one of three positions, numbered left-to-right (0, 1, 2)
 * @returns decoded register number
 */
export default function decodeRegister(instruction: number, position: number): number
{
    let shift: number;
    switch (position)
    {
        case 0:
            shift = 9;
            break;
        case 1:
            shift = 6;
            break;
        default:
            shift = 0;
            break;
    }
    return (instruction >> shift) & 0b111;
}
