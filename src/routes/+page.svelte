<!-- 
    +page.svelte
        Root page application window component
-->

<script>
    import "../app.css"
    import Header from "../presentation/Header.svelte"
    import Workspace from "../presentation/Workspace.svelte"
    import { consoleSelected, reloadOverride } from "../presentation/stores"
    import UI from "../presentation/ui"
    import KeyCodes from "../logic/keycodes/keyCodes"

    // Allow sending of key interrupts if Simulator console is selected
    let interruptable = false
    consoleSelected.subscribe(value => {
		interruptable = value
	});

    function keyRelease(event) {
        if(globalThis.simulator && interruptable){
            // Tilde (~) is used as the interrupt key to force stop a running simulator
            if(event.key == '~')
                globalThis.simulator.halt()
            // Else, send key code to the simulator
            else
            {
                const keyCode = KeyCodes.getAscii(event.key)
                if (typeof(keyCode) != 'undefined')
                    globalThis.simulator.keyboardInterrupt(keyCode)
            }
                
            reloadOverride.set([true,false])
        }
	}

    // Deselect when user clicks on any surface other than Console
    function blurConsole(){
		UI.deselectConsole()
    }
</script>

<svelte:window on:keypress={keyRelease} on:click={blurConsole} />

<Header />
<Workspace />