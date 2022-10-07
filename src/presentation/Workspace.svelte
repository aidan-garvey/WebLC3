<script>
    import EditorView from "./EditorView.svelte";
    import SimulatorView from "./SimulatorView.svelte";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
	function swapView(view) {
		dispatch("changeView", {
			text: view
		})
	}

    export let view="editor"
    function loadView(event) {
        view = event.detail.text
        swapView(view)
	}
</script>

<div id="workspace">
    <div id="workspace-inner">
        {#if view == "editor"}
            <EditorView on:changeView={loadView} />
        {:else}
            <SimulatorView on:changeView={loadView} />
        {/if}
    </div>
</div>

<style>
    #workspace{
        margin-top: -1vh;
        width: 100vw;
        height: 85vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #workspace-inner{
        height: 85%;
        width: 90%;
    }

    @media (max-width: 900px) {
		#workspace{
			margin-bottom: 48vh;
		}
	}
    
</style>