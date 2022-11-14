<script>
    import EditorView from "./EditorView.svelte";
    import SimulatorView from "./SimulatorView.svelte";
    import { currentView } from '../presentation/stores.js';

    let currView = "editor"
    currentView.subscribe(value => {
		currView = value
	});
</script>

<div id="workspace">
    <div id="workspace-inner">
        {#if currView == "editor"}
            <EditorView />
        {:else}
            <SimulatorView />
        {/if}
    </div>
</div>

<style>
    #workspace{
        margin-top: 6vh;
        width: 100vw;
        height: 80vh;
        display: flex;
        justify-content: center;
    }

    #workspace-inner{
        height: 88%;
        width: 90%;
    }

    @media (max-width: 1300px) {
		#workspace{
			height: 120vh;
		}
	}

    @media (max-width: 900px) {
		#workspace{
			height: 150vh;
		}
	}
    
</style>