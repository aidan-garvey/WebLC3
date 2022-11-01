
/**
 * vectors.ts
 * 
 * This class contains interrupt/exception vector constants
 */

export default class Vectors
{
    private static vectorSet = {
        EX_PRIV: 0x00,
        EX_ILLEGAL: 0x01,
        INT_KBD: 0x80
    };

    public static privilegeViolation(): number
    {
        return Vectors.vectorSet.EX_PRIV;
    }

    public static illegalOpcode(): number
    {
        return Vectors.vectorSet.EX_ILLEGAL;
    }

    public static keyboardInterrupt(): number
    {
        return Vectors.vectorSet.INT_KBD;
    }
}
