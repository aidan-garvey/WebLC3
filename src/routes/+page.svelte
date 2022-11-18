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

    // Allow sending of key interrupts if Simulator console is selected
    let interruptable = false
    consoleSelected.subscribe(value => {
		interruptable = value
	});

    function keyRelease(event) {
		let keyCode = event.keyCode
        if(globalThis.simulator && interruptable){
            globalThis.simulator.keyboardInterrupt(keyCode)
            // Tilde (~) is used as the interrupt key to force stop a running simulator
            if(keyCode == 126)
                globalThis.simulator.halt()
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