; =====================
; LC-3 OPERATING SYSTEM
; =====================

.ORIG 0

; --------------------------
; TRAP VECTOR TABLE (0x0000)
; --------------------------
.BLKW x20, TRAP_UNIMP
; implemented traps begin at x20
.FILL TRAP_GETC
.FILL TRAP_OUT
.FILL TRAP_PUTS
.FILL TRAP_IN
.FILL TRAP_PUTSP
.FILL TRAP_HALT
; x27 - xFF are unimplemented
.BLKW xDA, TRAP_UNIMP

; -------------------------------
; EXCEPTION VECTOR TABLE (0x0100)
; -------------------------------
.FILL EXPT_PRIV
.FILL EXPT_ILLEGAL
.BLKW x7E, EXPT_UNIMP

; -------------------------------
; INTERRUPT VECTOR TABLE (0x0180)
; -------------------------------
.FILL INT_KEYBD
.BLKW x7F, EXPT_UNIMP

; -------------------------
; OPERATING SYSTEM (0x0200)
; -------------------------

; Register addresses:
KBD_STATUS: .FILL xFE00
KBD_DATA:   .FILL xFE02
CON_STATUS: .FILL xFE04
CON_DATA:   .FILL xFE06
MCR:        .FILL xFFFE

; Constants (see bottom of code for more strings):
BYTE_MASK:  .FILL x00FF
MSB_MASK:   .FILL x7FFF ; used to clear the MSB of a word with AND
NOTRAP_MSG: .STRINGZ "Invalid TRAP excecuted\n"
BAD_EX_MSG: .STRINGZ "An invalid interrupt or exception has occured\n"

; -------------------------------
; Unimplemented Traps
; Print notification then return.
; -------------------------------
TRAP_UNIMP:
    ADD     r6, r6, #-2
    STR     r0, r6, #0
    STR     r7, r6, #1
    LEA     r0, NOTRAP_MSG
    PUTS
    LDR     r0, r6, #0
    LDR     r7, r6, #1
    ADD     r6, r6, #2
    RTI

; The descriptions of the following trap implementations are quoted directly
; from Patel, Introduction to Computer Systems, p. 543

; ----------------------------------------------------------------------------
; GETC
; Read a single character from the keyboard. The character is not echoed onto
; the console. Its ASCII code is copied into R0. The high eight bits of R0 are
; cleared.
; ----------------------------------------------------------------------------
TRAP_GETC:
    ; push r1-r2/r7
    ADD     r6, r6, #-2
    STR     r1, r6, #0
    STR     r2, r6, #1
GETC_WAIT:
    ; wait for keyboard to be ready
    LDI     r1, KBD_STATUS
    ; ready bit is MSB so we loop until result is negative
    BRzp    GETC_WAIT
    LDI     r0, KBD_DATA
    ; clear keyboard ready bit
    LD      r2, MSB_MASK
    AND     r1, r1, r2
    STI     r1, KBD_STATUS
    ; ensure R0[15:8] are clear
    LD      r1, BYTE_MASK
    AND     r0, r0, r1
    ; pop r1-r2 and return
    LDR     r1, r6, #0
    LDR     r2, r6, #1
    ADD     r6, r6, #2
    RTI

; ----------------------------------------------------
; OUT
; Write a character in R0[7:0] to the console display.
; ----------------------------------------------------
TRAP_OUT:
    ; push r0-r1/r7
    ADD     r6, r6, #-2
    STR     r0, r6, #0
    STR     r1, r6, #1
    ; ensure we only write lower byte to console
    LD      r1, BYTE_MASK
    AND     r0, r0, r1
OUT_WAIT:
    ; wait for display to be ready
    LDI     r1, CON_STATUS
    ; ready bit is MSB so we loop until result is negative
    BRzp    OUT_WAIT
    ; write character
    STI     r0, CON_DATA
    ; pop registers and return
    LDR     r0, r6, #0
    LDR     r1, r6, #1
    ADD     r6, r6, #2
    RTI

; -----------------------------------------------------------------------------
; PUTS
; Write a string of ASCII characters to the console display. The characters are
; contained in consecutive memory locations, one character per memory location,
; starting with the address specified in R0. Writing terminates with the
; occurrence of x0000 in a memory location.
; -----------------------------------------------------------------------------
TRAP_PUTS:
    ; push r0-r3/r7
    ADD     r6, r6, #-4
    STR     r0, r6, #0
    STR     r1, r6, #1
    STR     r2, r6, #2
    STR     r3, r6, #3

    ; r2 will mask ASCII characters
    LD      r2, BYTE_MASK
PUTS_STRING_LOOP:
    ; load next character into r1
    LDR     r1, r0, #0
    BRz     PUTS_BREAK  ; break loop if we hit a null character
    AND     r1, r1, r2  ; mask character
    ; wait for console to be ready
PUTS_CONSOLE_LOOP:
    LDI     r3, CON_STATUS
    BRzp    PUTS_CONSOLE_LOOP
    ; write character
    STI     r1, CON_DATA
    ADD     r0, r0, #1  ; advance to next character
    BR      PUTS_STRING_LOOP
PUTS_BREAK:
    ; pop registers and return
    LDR     r0, r6, #0
    LDR     r1, r6, #1
    LDR     r2, r6, #2
    LDR     r3, r6, #3
    ADD     r6, r6, #4
    RTI

; ---------------------------------------------------------------------------
; IN
; Print a prompt on the screen and read a single character from the keyboard.
; The character is echoed onto the console monitor, and its ASCII code is
; copied into R0. The high eight bits of R0 are cleared.
; ---------------------------------------------------------------------------
TRAP_IN:
    ; push r1-r2/r7
    ADD     r6, r6, #-3
    STR     r1, r6, #0
    STR     r2, r6, #1
    STR     r7, r6, #2

    ; print the prompt
    LEA     r0, IN_PROMPT
    PUTS    ; I call this one exceptionception

    ; r2 will be used to clear ready bits
    LD      r2, MSB_MASK

    ; wait for character
IN_KBD_LOOP:
    LDI     r1, KBD_STATUS
    BRzp    IN_KBD_LOOP
    ; clear keyboard ready bit
    AND     r1, r1, r2
    STI     r1, KBD_STATUS

    ; copy the character and clear upper 8 bits
    LDI     r0, KBD_DATA
    LD      r1, BYTE_MASK
    AND     r0, r0, r1

    ; echo character to console
IN_CON_LOOP:
    LDI     r1, CON_STATUS
    BRzp    IN_CON_LOOP
    STI     r0, CON_DATA

    ; pop registers and return
    LDR     r1, r6, #0
    LDR     r2, r6, #1
    LDR     r7, r6, #2
    ADD     r6, r6, #3
    RTI

; -----------------------------------------------------------------------------
; PUTSP
; Write a string of ASCII characters to the console. The characters are
; contained in consecutive memory locations, two characters per memory
; location, starting with the address specified in R0. The ASCII code contained
; in bits [7:0] of a memory location is written to the console first. Then the
; ASCII code contained in bits [15:8] of that memory location is written to the
; console. (A character string consisting of an odd number of characters to be
; written will have x00 in bits [15:8] of the memory location containing the
; last character to be written.) Writing terminates with the occurrence of 
; x0000 in a memory location
; -----------------------------------------------------------------------------
TRAP_PUTSP:
    ; push r0-r3/r7
    ADD     r6, r6, #-5
    STR     r0, r6, #0
    STR     r1, r6, #1
    STR     r2, r6, #2
    STR     r3, r6, #3
    STR     r7, r6, #4

    ADD     r1, r0, #0  ; r1 := address of string
    AND     r2, r2, #0  ; r2 will be a loop counter
    LD      r3, BYTE_MASK
    NOT     r3, r3      ; r3 := 0xFF00

    ; loop until we reach 0x0000
PUTSP_STRING_LOOP:
    LDR     r0, r1, #0  ; r0 := current pair of chars
    BRz     PUTSP_BREAK
    ADD     r1, r1, #1  ; r1 -> next pair of chars
    OUT     ; output character in r0[7:0]

    ; loop counter
    ADD     r2, r2, #8

    ; isolate r0[15:8]
    AND     r0, r0, r3
    BRz     PUTSP_STRING_LOOP ; if no character, get next pair
    BRp     ROTATE_STEP ; if no MSB, rotate
ROTATE_ADD:
    ADD     r0, r0, #1  ; if MSB, copy to LSB
ROTATE_STEP:
    ; decrement loop counter, break when we hit zero
    ADD     r2, r2, #-1
    BRnz    ROTATE_BREAK
    ADD     r0, r0, r0  ; bit shift left
    BRzp    ROTATE_STEP ; if no MSB, rotate
    BR      ROTATE_ADD  ; if MSB, copy to LSB

ROTATE_BREAK:
    ; output character in r0[7:0], formerly r0[15:8]
    OUT     ; old r[8] is still in r[15] but gets ignored by OUT
    BR      PUTSP_STRING_LOOP

PUTSP_BREAK:
    ; pop registers and return
    LDR     r0, r6, #0
    LDR     r1, r6, #1
    LDR     r2, r6, #2
    LDR     r3, r6, #3
    LDR     r7, r6, #4
    ADD     r6, r6, #5
    RTI

; --------------------------------------------------
; HALT
; Halt execution and print a message on the console.
; --------------------------------------------------
TRAP_HALT:
    ; push r0-r1/r7
    ADD     r6, r6, #-3
    STR     r0, r6, #0
    STR     r1, r6, #1
    STR     r7, r6, #2

    ; print message
    LEA     r0, HALT_MSG
    PUTS
    ; stop the clock, leave rest of MCR untouched
    LD      r1, MSB_MASK
    LDI     r0, MCR
    AND     r0, r0, r1
    STI     r0, MCR
    ; excecution stops here

    ; in case the clock is manually re-enabled, return as normal
    LDR     r0, r6, #0
    LDR     r1, r6, #1
    LDR     r7, r6, #2
    ADD     r6, r6, #3
    RTI

; ------------------------------------------------------
; Unimplemented Interrupts / Exceptions
; Print a notification of the error and halt the machine
; ------------------------------------------------------
EXPT_UNIMP:
    ADD     r6, r6, #-2
    STR     r0, r6, #0
    STR     r7, r6, #1
    LEA     r0, BAD_EX_MSG
    PUTS
    HALT
    ; in case clock is manually restarted, continue as normal
    LDR     r0, r6, #0
    LDR     r7, r6, #1
    ADD     r6, r6, #2
    RTI

; ------------------------------------------------------
; Privilege Mode Violation
; Print a notification of the error and halt the machine
; ------------------------------------------------------
EXPT_PRIV:
    ADD     r6, r6, #-2
    STR     r0, r6, #0
    STR     r7, r6, #1
    LEA     r0, PRIV_MSG
    PUTS
    HALT
    ; in case clock is manually restarted, continue as normal
    LDR     r0, r6, #0
    LDR     r7, r6, #1
    ADD     r6, r6, #2
    RTI

; ------------------------------------------------------
; Illegal Opcode Exception
; Print a notification of the error and halt the machine
; ------------------------------------------------------
EXPT_ILLEGAL:
    ADD     r6, r6, #-2
    STR     r0, r6, #0
    STR     r7, r6, #1
    LEA     r0, ILL_MSG
    PUTS
    HALT
    ; in case clock is manually restarted, continue as normal
    LDR     r0, r6, #0
    LDR     r7, r6, #1
    ADD     r6, r6, #2
    RTI

; ---------------------------
; Keyboard Interrupt
; Echo the key to the console
; ---------------------------
INT_KEYBD:
    ADD     r6, r6, #-2
    STR     r0, r6, #0
    STR     r7, r6, #1
    LDI     r0, KBD_DATA
    OUT
    LDR     r0, r6, #0
    STR     r7, r6, #1
    ADD     r6, r6, #2
    RTI

; Strings output by some traps and exceptions
IN_PROMPT:  .STRINGZ "Input a character > "
HALT_MSG:   .STRINGZ "Halting computer\n"
PRIV_MSG:   .STRINGZ "Privilege mode violation\n"
ILL_MSG:    .STRINGZ "Illegal opcode exception\n"

.END
