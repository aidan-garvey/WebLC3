
/**
 * Decode an immediate operand in an instruction (including PC offsets)
 * @param instruction the instruction to decode
 * @param length the length, in bits, of the immediate operand
 * @returns the immediate value, sign-extended to 16 bits
 */
export default function decodeImmediate
(
    instruction: number,
    length: number
)
: number
{
    let mask = 0x0FFF;
    let sign = 0xF800;
    for (let remaining = 12 - length; remaining > 0; --remaining)
    {
        mask >>= 1;
        sign = (sign >> 1) | 0x8000;
    }
    // isolate immediate value
    let result = instruction & mask;
    // sign-extend to 16 bits
    if ((result & sign) != 0)
    {
        result |= sign;
    }
    return result;
}
