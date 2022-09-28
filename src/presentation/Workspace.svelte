<script>
    import EditorView from "./EditorView.svelte";
    import SimulatorView from "./SimulatorView.svelte";
    export let view="editor"

    function loadView(event) {
        view = event.detail.text;
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
        width: 100vw;
        height: 85vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #workspace-inner{
        height: 90%;
        width: 95%;
    }
</style>