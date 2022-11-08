<script>
    import Header from "../presentation/Header.svelte";
    import Workspace from "../presentation/Workspace.svelte";
    import "../app.css";
    import UI from "../presentation/ui";

    function handleKeydown(event) {
		let keyCode = event.keyCode

        if(globalThis.simulator){
            // Tilde (~) as arbitrary key to force stop running simulator
            if(keyCode == 192){
                globalThis.simulator.halt()
                UI.appendConsole("Force stopped simulator, program reset.\n")
            }
            /*else{
                globalThis.simulator.keyboardInterrupt(keyCode)
            }*/
        }
	}
</script>

<svelte:window on:keydown={handleKeydown}/>

<Header />
<Workspace />