<!--
    +page.svelte
        Root page application window component
-->

<script>
    import "../app.css"
    import Header from "../presentation/Header.svelte"
    import Workspace from "../presentation/Workspace.svelte"
    import { consoleSelected, reloadOverride, latestSnapshot } from "../presentation/stores"
    import UI from "../presentation/ui"
    import KeyCodes from "../logic/keycodes/keyCodes"
    import { onMount } from 'svelte';
    import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
    import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
    import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
    import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
    import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

    let editor;
    let Monaco;

    onMount(async () => {
        if(!globalThis.editor){
            // @ts-ignore
            self.MonacoEnvironment = {
                getWorker: function (_moduleId, label) {
                    if (label === 'json') {
                        return new jsonWorker();
                    }
                    if (label === 'css' || label === 'scss' || label === 'less') {
                        return new cssWorker();
                    }
                    if (label === 'html' || label === 'handlebars' || label === 'razor') {
                        return new htmlWorker();
                    }
                    if (label === 'typescript' || label === 'javascript') {
                        return new tsWorker();
                    }
                    return new editorWorker();
                }
            };

            Monaco = await import('monaco-editor');

            Monaco.languages.register({
                id: 'lc3Asm'
            });

            Monaco.languages.setMonarchTokensProvider('lc3Asm', {
                defaultToken: "invalid",
                ignoreCase: true,

                instructions: [
                    "add", "and", "br", "brn", "brz", "brp",
                    "brnz", "brnp", "brzp", "brnzp", "jmp", "jsr",
                    "jsrr", "ld", "ldi", "ldr", "lea", "not",
                    "ret", "rti", "st", "sti", "str", "trap",

                    "adc", "asr", "b",
                    "beq", "bne", "bcs", "bcc", "bmi", "bpl", "bvs",
                    "bvc", "bhi", "bls", "bge", "blt", "bgt", "ble",
                    "bic", "bl", "bx", "cmn", "cmp", "eor", "ldmia",
                    "ldrb", "ldrh", "lsl", "ldsb", "ldsh", "lsr", "mov",
                    "mul", "mvn", "neg", "orr", "pop", "push", "ror",
                    "sbc", "stmia", "strb", "strh", "sub", "tst", "swi",
                ],

                trapAliases: [
                    "getc", "halt", "in", "out", "puts", "putsp"
                ],

                origDirective: [
                    ".orig"
                ],

                directives: [
                    ".end", ".fill", ".blkw", ".stringz",
                    ".global", ".text", ".data",
                ],

                digits: /\d+/,
                binDigits: /[0-1]+/,
                hexDigits: /[0-9a-fA-F]+/,

                tokenizer: {
                    root: [
                        // numbers
                        [/#?[xX](@hexDigits)/, "hexNumber"],
                        [/#?[bB](@binDigits)/, "binNumber"],
                        [/#?-?(@digits)/, "number"],

                        // strings
                        [/"([^"])*$/, "invalidString"],
                        [/'([^'])*$/, "invalidString"],
                        [/"/, "string", "@doubleString"],
                        [/'/, "string", "@singleString"],

                        // registers
                        [/[rR][0-7]/, "register"],

                        [/\.[\w]+/, {
                            cases: {
                                "@origDirective": "orig",
                                "@directives": "directive",
                                "@default": "invalid"
                            }
                        }],

                        // instructions and labels
                        [/[a-zA-Z_][\w]*/, {
                            cases: {
                                "@instructions": "instruction",
                                "@trapAliases": "trapAlias",
                                "@default": "label"
                            }
                        }],

                        {include: "@whitespace"},

                        // delimiter
                        [/[,:]/, "delimiter"]
                    ],

                    whitespace: [
                        [/\s/, ''],
                        [/;.*$/, "comment"]
                    ],

                    doubleString: [
                        [/[^"]+/, "string"],
                        [/"/, "string", "@pop"]
                    ],

                    singleString: [
                        [/[^']+/, "string"],
                        [/'/, "string", "@pop"]
                    ]
                }
            });

            // Define a new theme that contains only rules that match this language
            Monaco.editor.defineTheme('lc3Theme', {
                colors: {
                    'editor.background': '2F2F2F'
                },
                base: 'vs-dark',
                inherit: false,
                rules: [
                    { token: 'register', foreground: '8786CC' },
                    { token: 'instruction', foreground: 'FFAB40' },
                    { token: 'trapAlias', foreground: 'FFAB40' },
                    { token: 'orig', foreground: 'F6F180' },
                    { token: 'directive', foreground: '90D050'},
                    { token: 'label', foreground: '60B6FF'},
                    { token: 'number', foreground: 'CE608C'},
                    { token: 'hexNumber', foreground: 'CE608C'},
                    { token: 'binNumber', foreground: 'CE608C'},
                    { token: 'delimiter', foreground: 'F0F0F0'},
                    { token: 'invalidString', foreground: 'FF3724', fontStyle: 'bold'},
                    { token: 'comment', foreground: '8F878C'},
                    { token: 'string', foreground: '80B49A'},
                    { token: 'invalid', foreground: 'C33333', fontStyle: 'bold'}
                ]
            });

            function getCode() {
                return [
                    '; comment',
                    '',
                    '.orig x3000',
                    '',
                    '	lea R0, hello',
                    '	puts',
                    '	halt',
                    '',
                    'hello: .stringz "Hello World!\\n"',
                    '.end'
                ].join('\n');
            }

            editor = Monaco.editor.create(document.getElementById('container'), {
                theme: 'lc3Theme',
                value: getCode(),
                language: 'lc3Asm',
                //options: {automaticLayout: true}
            });

            globalThis.editor = editor;
        }

        document.body.scrollTo(0,0) // Set scrollbar of loaded page to top
    });

    // Allow sending of key interrupts if Simulator console is selected
    let interruptable = false
    consoleSelected.subscribe(value => {
		interruptable = value
	});

    // Allow page to know contents of latest startup or save
    let snapshot = ""
    latestSnapshot.subscribe(value => {
        snapshot = value
    });


    /* Send non-printing keycodes generated in conjunction with CTRL
     * while preventing browser activity when window is interruptable
     * Caveat: Cannot send CTRL+N or CTRL+W
     * Unicode Reference: https://www.physics.udel.edu/~watson/scen103/ascii.html
     */
    function keyDown(event){
        // Prevent firing of browser shortcuts
        if(event.ctrlKey && interruptable){
            event.preventDefault()

            // Send modified keycode with CTRL
            if(globalThis.simulator){
                const keyCode = KeyCodes.getAscii(event.key)
                if (typeof(keyCode) != 'undefined')
                    globalThis.simulator.keyboardInterrupt(keyCode - 96)

                reloadOverride.set([true,false])
            }
        }
    }

    /* Send printing keycodes when window is interruptable
     * Unicode Reference: https://www.physics.udel.edu/~watson/scen103/ascii.html
     */
    function keyRelease(event) {
        if(globalThis.simulator && interruptable){
            const keyCode = KeyCodes.getAscii(event.key)
            if (typeof(keyCode) != 'undefined')
                globalThis.simulator.keyboardInterrupt(keyCode)

            reloadOverride.set([true,false])
        }
	}

    // Check editor content against latest snapshot
    function checkDirty(){
        let content = globalThis.editor.getValue()
        return content != snapshot
    }

    // Deselect when user clicks on any surface other than Console
    function blurConsole(){
		UI.deselectConsole()
    }

    // Prompt before closing window if there are unsaved Editor contents
    function exitPrompt(event){
        if(checkDirty()){
            event.preventDefault()
            let leaveMsg = "WARNING: You have unsaved changes on your Editor. Make sure to save your current progress first.\n\nWould you like to proceed?"
            event.returnValue = leaveMsg
            return ""
        }
        else if (interruptable){
            // Avoid unintended exit on CTRL+W while sending key interrupts
            event.preventDefault()
            event.returnValue = ""
            return ""
        }
    }
</script>

<svelte:window
    on:keydown={keyDown}
    on:keypress={keyRelease}
    on:click={blurConsole}
    on:beforeunload={exitPrompt}
    role="application"
    aria-activedescendant="title"
/>

<Header />
<Workspace />