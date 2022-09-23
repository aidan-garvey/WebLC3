/**
 * fakeUI.ts
 * 
 * Temporary class for testing the assembler which mimics the function
 * calls made between the assembler and user interface.
 */

import Assembler from "./assembler";

export default class FakeUI
{
    /**
     * @param {string} message 
     */
    static print(message: string)
    {
        console.log(message + ".");
    }

    static run()
    {
        const result = Assembler.assemble (
    ".orig x3000\n\
    add r0, r1, r2\n\
    add r3 r4 #-1\n\
LABEL1:\n\
    brnzp LABEL2\n\
    lea r5 LABEL1\n\
LABEL2:\n\
    .fill #x0069\n\
    .blkw #3, x0420\n\
LABEL3 .stringz 'hello'\n\
    .stringz \"world\"\n\
    lea r0, LABEL3\n\
    puts\n\
    halt\n\
    \n\
    .end\n"
        );

        if (result == null)
            return;
        
        const [assembled, dissassembled] = result;

        const start = assembled[0];
        for (let i = 1; i < assembled.length; i++)
        {
            const astr = (i - 1 + start).toString(16).toUpperCase();
            let apad = "";
            for (let j = 0; j < (4 - astr.length); j++)
                apad = apad + "0";

            const hstr = assembled[i].toString(16).toUpperCase();
            let hpad = "";
            for (let j = 0; j < (4 - hstr.length); j++)
                hpad = hpad + "0";
        
            const bstr = assembled[i].toString(2);
            let bpad = "";
            for (let j = 0; j < (16 - bstr.length); j++)
                bpad = bpad + "0";
            
            const upperChar = String.fromCharCode(assembled[i] >> 8);
            const lowerChar = String.fromCharCode(assembled[i] & 0xFF);
            const cstr = "'" + upperChar + lowerChar + "'";

            const dstr = dissassembled.has(i - 1 + start) ?
                dissassembled.get(i - 1 + start) : "";

            console.log("0x" + apad + astr + " : 0x" + hpad + hstr + " | 0b" + bpad + bstr + " | " + cstr + "\t| " + dstr);
        }
    }
}

FakeUI.run();
