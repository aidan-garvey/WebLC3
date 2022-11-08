<script>
    import Header from "../presentation/Header.svelte";
    import Workspace from "../presentation/Workspace.svelte";
    import "../app.css";
    import UI from "../presentation/ui";
    import { consoleSelected } from "../presentation/stores"

    let interruptable = false
    consoleSelected.subscribe(value => {
		interruptable = value
	});

    function handleKeyRelease(event) {
		let keyCode = event.keyCode

        if(globalThis.simulator && interruptable){
            // Tilde (~) as arbitrary key to force stop running simulator
            if(keyCode == 126)
                globalThis.simulator.halt()
            else
                globalThis.simulator.keyboardInterrupt(keyCode)
        }
        UI.deselectConsole()
        consoleSelected.set(false)
	}

</script>

<svelte:window on:keypress={handleKeyRelease} />

<Header />
<Workspace />