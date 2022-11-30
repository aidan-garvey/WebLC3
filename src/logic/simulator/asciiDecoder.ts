/**
 * decodeAscii.ts
 * 
 * Given a number, return a string representation of the ascii character it
 * represents, or an empty string otherwise.
 */

export default class AsciiDecoder
{
    private static ctrlCodes = new Map([
        [9,  "'\\t'"],
        [10, "'\\n'"],
        [13, "'\\r'"]
    ]);

    static decode(code: number): string
    {
        // printable ascii codes, ' ' to '~'
        if (code >= 32 && code < 127)
        {
            return "'" + String.fromCharCode(code) + "'";
        }
        // if there's a control code for it, return that, otherwise return ""
        else
        {
            const seq = this.ctrlCodes.get(code);
            return typeof(seq) === "undefined" ? "" : seq;
        }
    }
}
