; ==========================
;   LC-3 OPERATING SYSTEM
; --------------------------
; WebLC3's implementation of
; the LC-3 operating system.
; The ARM version of the OS.
; --------------------------
;         by Alex Kitt, 2023
; ==========================

.ORIG 0

; --------------------------
; TRAP VECTOR TABLE (0x0000)
; --------------------------
.BLKW x20, TRAP_UNIMP
; Implemented traps begin at x20
.FILL TRAP_GETC
.FILL TRAP_OUT
.FILL TRAP_PUTS
; IN and PUTSP are unimplemented
.FILL TRAP_UNIMP
.FILL TRAP_UNIMP
.FILL TRAP_HALT
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

; Device register addresses
KBD_STATUS: .FILL xFE00
KBD_DATA:   .FILL xFE02
CON_STATUS: .FILL xFE04
CON_DATA:   .FILL xFE06
MCR:        .FILL xFFFE

; Constants (see the bottom of this file for more strings)
; To clear the upper byte of a word
BYTE_MASK:  .FILL x00FF
; To clear the most significant bit of a word
MSB_MASK:   .FILL x7FFF
NOTRAP_MSG: .STRINGZ "Invalid SWI excecuted\n"
BAD_EX_MSG: .STRINGZ "An invalid interrupt or exception has occured\n"

; -------------------------------
; Unimplemented Traps
; Print notification then return.
; -------------------------------
TRAP_UNIMP:
    sub r6, r6, #2
    str r0, [r6, #0]
    str r7, [r6, #1]
    ldr r0, [pc, =NOTRAP_MSG]
    puts
    ldr r0, [r6, #0]
    ldr r7, [r6, #1]
    add r6, r6, #2
    rti

; The descriptions of the following trap implementations are quoted directly
; from Patel, Introduction to Computer Systems 2nd. Edition, p. 543

; ----------------------------------------------------------------------------
; GETC
; Read a single character from the keyboard. The character is not echoed onto
; the console. Its ASCII code is copied into R0. The high eight bits of R0 are
; cleared.
; ----------------------------------------------------------------------------
TRAP_GETC:
    push {r1, r2}
GETC_WAIT:
    ; Wait for keyboard to be ready
    ldr r1, [pc, =KBD_STATUS]
    ldr r1, [r1, #0]
    ldr r1, [r1, #0]
    ; Ready bit is the MSB so we loop until the result is negative
    tst r1, r1
    bpl GETC_WAIT
    ldr r0, [pc, =KBD_DATA]
    ldr r0, [r0, #0]
    ldr r0, [r0, #0]
    ; Clear keyboard ready bit
    ldr r2, [pc, =MSB_MASK]
    ldr r2, [r2, #0]
    and r1, r2
    ldr r2, [pc, =KBD_STATUS]
    ldr r2, [r2, #0]
    str r1, [r2, #0]
    ; Pop registers and return
    pop {r1, r2}
    rti

; ----------------------------------------------------
; OUT
; Write a character in R0[7:0] to the console display.
; ----------------------------------------------------
TRAP_OUT:
    push {r0, r1, r2}
    ; Ensure we only write the lower byte to the console
    ldr r1, [pc, =BYTE_MASK]
    ldr r1, [r1, #0]
    and r0, r1
OUT_WAIT:
    ; Wait for the display to be ready
    ldr r1, [pc, =CON_STATUS]
    ldr r1, [r1, #0]
    ldr r1, [r1, #0]
    tst r1, r1
    ; The ready bit is the MSB, so we loop until the result is negative
    bpl OUT_WAIT
    ; Write a character
    ldr r2, [pc, =CON_DATA]
    ldr r2, [r2, #0]
    str r0, [r2, #0]
    ; Pop registers and return
    pop {r0, r1, r2}
    rti

; -----------------------------------------------------------------------------
; PUTS
; Write a string of ASCII characters to the console display. The characters are
; contained in consecutive memory locations, one character per memory location,
; starting with the address specified in R0. Writing terminates with the
; occurrence of x0000 in a memory location.
; -----------------------------------------------------------------------------
TRAP_PUTS:
    push {r0, r1, r2, r3}

    ; r2 will mask ASCII characters
    ldr r2, [pc, =BYTE_MASK]
    ldr r2, [r2, #0]
PUTS_STRING_LOOP:
    ; Load next character into r1
    ldr r1, [r0, #0]
    ; Set condition codes
    tst r1, r1
    ; Break loop if we hit a null character
    beq PUTS_BREAK
    ; Mask character
    and r1, r2
    ; Wait for console to be ready
PUTS_CONSOLE_LOOP:
    ldr r3, [pc, =CON_STATUS]
    ldr r3, [r3, #0]
    ldr r3, [r3, #0]
    tst r3, r3
    bpl PUTS_CONSOLE_LOOP
    ; Write character
    ldr r3, [pc, =CON_DATA]
    ldr r3, [r3, #0]
    str r1, [r3, #0]
    add r0, #1
    b PUTS_STRING_LOOP
PUTS_BREAK:
    ; Pop registers and return
    pop {r0, r1, r2, r3}
    rti

; --------------------------------------------------
; HALT
; Halt execution and print a message on the console.
; --------------------------------------------------
TRAP_HALT:
    push {r0, r1, r7}
HALT_LOOP:
    ; Print message
    ldr r0, [pc, =HALT_MSG]
    PUTS
    ; Stop the clock, leave the rest of MCR untouched
    ldr r1, [pc, =MSB_MASK]
    ldr r1, [r1, #0]

    ldr r0, [pc, =MCR]
    ldr r0, [r0, #0]
    ldr r0, [r0, #0]

    and r0, r1

    ldr r1, [pc, =MCR]
    ldr r1, [r1, #0]
    str r0, [r1, #0]  ; Execution stops here

    ; If clock is manually re-enabled, halt the computer again
    b HALT_LOOP

    pop {r0, r1, r7}
    rti

; ------------------------------------------------------
; Unimplemented Interrupts / Exceptions
; Print a notification of the error and halt the machine
; ------------------------------------------------------
EXPT_UNIMP:
    sub r6, r6, #2
    str r0, [r6, #0]
    str r7, [r6, #1]
    ldr r0, [pc, =BAD_EX_MSG]
    puts
    halt
    ; In case clock is manually restarted, continue as normal
    ldr r0, [r6, #0]
    ldr r7, [r6, #1]
    ldr r6, [r6, #2]
    rti

; ------------------------------------------------------
; Privilege Mode Violation
; Print a notification of the error and halt the machine
; ------------------------------------------------------
EXPT_PRIV:
    sub r6, r6, #2
    str r0, [r6, #0]
    str r7, [r6, #1]
    ldr r0, [pc, =PRIV_MSG]
    puts
    halt
    ; In case clock is manually restarted, continue as normal
    ldr r0, [r6, #0]
    ldr r7, [r6, #1]
    ldr r6, [r6, #2]
    rti

; ------------------------------------------------------
; Illegal Opcode Exception
; Print a notification of the error and halt the machine
; ------------------------------------------------------
EXPT_ILLEGAL:
    sub r6, r6, #2
    str r0, [r6, #0]
    str r7, [r6, #1]
    ldr r0, [pc, =ILL_MSG]
    puts
    halt
    ; In case clock is manually restarted, continue as normal
    ldr r0, [r6, #0]
    ldr r7, [r6, #1]
    ldr r6, [r6, #2]
    rti

; ---------------------------
; Keyboard Interrupt
; Echo the key to the console
; ---------------------------
INT_KEYBD:
    sub r6, r6, #2
    str r0, [r6, #0]
    str r7, [r6, #1]
    ldr r0, [pc, =KBD_DATA]
    out
    ldr r0, [r6, #0]
    ldr r7, [r6, #1]
    add r6, r6, #2
    rti

; Strings output by some traps and exceptions
IN_PROMPT:  .stringz "Input a character > "
HALT_MSG:   .stringz "Halting computer\n"
PRIV_MSG:   .stringz "Privilege mode violation\n"
ILL_MSG:    .stringz "Illegal opcode exception\n"