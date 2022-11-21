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

    // Allow sending of key interrupts if Simulator console is selected
    let interruptable = false
    consoleSelected.subscribe(value => {
		interruptable = value
	});

    // Allow page to know contents of latest startup or save
    let hasUnsaved = false
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
        hasUnsaved = checkDirty()

        if(hasUnsaved){
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
/>

<Header />
<Workspace />