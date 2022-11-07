<script>
    import Header from "../presentation/Header.svelte";
    import Workspace from "../presentation/Workspace.svelte";
    import "../app.css";
    import UI from "../presentation/ui";

    function handleKeydown(event) {
		let keyCode = event.keyCode
        if(keyCode == 219)
            UI.setSimulatorNotReady()
        else if(keyCode == 221)
            UI.setSimulatorReady()
        else if(keyCode == 220)
            UI.setSimulatorRunning()
	}
</script>

<svelte:window on:keydown={handleKeydown}/>

<Header />
<Workspace />