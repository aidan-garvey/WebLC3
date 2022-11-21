<!-- 
    +page.svelte
        Root page application window component
-->

<script>
    import "../app.css"
    import Header from "../presentation/Header.svelte"
    import Workspace from "../presentation/Workspace.svelte"
    import { consoleSelected, reloadOverride, currentView } from "../presentation/stores"
    import UI from "../presentation/ui"
    import KeyCodes from "../logic/keycodes/keyCodes"

    // Allow sending of key interrupts if Simulator console is selected
    let interruptable = false
    consoleSelected.subscribe(value => {
		interruptable = value
	});

    // Check if current view is Editor
    let isEditor = false
    currentView.subscribe(view => {
        isEditor = (view == "editor")
	});

    // Allow page to know if user has unsaved changes
    let hasUnsaved = false
    let editorContent = ""


    /* Send non-printing keycodes generated in conjunction with CTRL
     * while preventing browser activity when window is interruptable
     * Caveat: Cannot send CTRL+N or CTRL+W
     * Unicode Reference: https://www.physics.udel.edu/~watson/scen103/ascii.html
     */
    function keyDown(event){
        if(event.ctrlKey && interruptable){
            // Prevent firing of browser shortcuts
            event.preventDefault()

            // Send modified keycode
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
        if(isEditor && globalThis.editor){
            editorContent = globalThis.editor.getValue()
        }

        if(globalThis.simulator && interruptable){
            const keyCode = KeyCodes.getAscii(event.key)
            if (typeof(keyCode) != 'undefined')
                globalThis.simulator.keyboardInterrupt(keyCode)
            
            reloadOverride.set([true,false])
        }
	}

    // Deselect when user clicks on any surface other than Console
    function blurConsole(){
		UI.deselectConsole()
    }

    // TODO: Prompt before closing window if there are unsaved Editor contents
    function exitPrompt(event){
        if(hasUnsaved){
            event.preventDefault();
		    // Chrome requires returnValue to be set
		    event.returnValue = "";
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