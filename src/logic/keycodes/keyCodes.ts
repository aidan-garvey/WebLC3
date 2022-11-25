/**
 * keyCodes.ts
 * 
 * The purpose of this class is to provide consistent ASCII codes when the user
 * presses a key. Passing a KeyboardEvent.key value to getAscii() will return
 * the corresponding ASCII code if one exists, or undefined otherwise.
 */

export default class KeyCodes
{
    private static specialKeys: Map<string, number> = new Map([
        ["Enter", 10], // enter and return always map to \n, not \r
        ["Tab", 9],
        ["Spacebar", 32],
        ["Backspace", 8],
        ["Delete", 127],
        ["Escape", 27]
    ]);

    /**
     * Return the ascii code corresponding to the given KeyboardEvent.key value,
     * or return undefined if such a code does not exist.
     * @param key A string, the key property of a KeyboardEvent
     * @returns An ascii code if possible, undefined otherwise
     */
    public static getAscii(key: string): number | undefined
    {
        // if it is a special key, return that code
        if (this.specialKeys.has(key))
        {
            return this.specialKeys.get(key);
        }
        // if the key has a printed representation which is a valid ASCII
        // character, return that code
        else if (key.length == 1)
        {
            const code = key.codePointAt(0);
            if (typeof(code) === 'undefined' || code >= 0x80)
                return undefined;
            else
                return code;
        }
        // in all other cases, return undefined
        else
        {
            return undefined;
        }
    }
}
