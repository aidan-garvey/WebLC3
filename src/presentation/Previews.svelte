<!-- 
    Previews.svelte
        Preview components for documentation modal
-->

<script>
    export let id = ""
</script>

{#if id == "assemble"}
    <button id="assemble" class="functionBtn">
        <span class="material-symbols-outlined">memory</span>
        ASSEMBLE
    </button>
{:else if id == "new"}
    <div id="new" class="menu-item">
        <span class="material-symbols-outlined">note_add</span>
        <p>New</p>
    </div>
{:else if id == "open"}
    <div id="open" class="menu-item">
        <span class="material-symbols-outlined">folder</span>
        <p>Open</p>
    </div>
{:else if id == "save"}
    <div id="save" class="menu-item">
        <span class="material-symbols-outlined">save</span>
        <p>Save</p>
    </div>
{:else if id == "reload"}
    <div id="reload" class="menu-item">
        <span class="material-symbols-outlined">refresh</span>
        <p>Reload</p>
    </div>
{:else if id == "reinitialize"}
    <div id="reinitialize" class="menu-item">
        <span class="material-symbols-outlined">power_settings_new</span>
        <p>Reinitialize</p>
    </div>
{:else if id == "randomize"}
    <div id="randomize" class="menu-item">
        <span class="material-symbols-outlined">shuffle</span>
        <p>Randomize</p>
    </div>
{:else if id == "run"}
    <button id="run" class="functionBtn">
        ▶ Run
    </button>
{:else if id == "step-in"}
    <button id="step-in" class="functionBtn">
        <span class="material-symbols-outlined">subdirectory_arrow_right</span>
         Step in
    </button>
{:else if id == "step-out"}
    <button id="step-out" class="functionBtn">
        <span class="material-symbols-outlined">subdirectory_arrow_left</span>
         Step out
    </button>
{:else if id == "step-over"}
    <button id="step-over" class="functionBtn">
        <span class="material-symbols-outlined">u_turn_right</span>
         Step over
    </button>
{:else if id == "sim-status"}
    <div id="sim-status-bar">
        <div class="sim-status-lbl"> 
            SIMULATOR STATUS
        </div>
        <div id="status-array">
            <div id="sim-status-ready" class="stoplight stoplight-active"><div> READY </div></div>
            <div id="sim-status-running" class="stoplight"><div> RUNNING </div></div>
        </div>
    </div>
{/if}

<style>
    #assemble{
        height: max-content;
        width: 13.5em;
    }

    #assemble.functionBtn{
		padding: 1.2em 0 1.2em 0;
		margin-top: 1vh;
		text-align: center;
	}

    .menu-item{
        height: 6.5em;
        width: 6em;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        border-radius: 15px;
    }

    .menu-item span{
        font-size: 25px;
        margin-bottom: 8%;
    }

    .menu-item p{
        width: 80%;
        text-align: center;
        letter-spacing: 1px;
        font-size: 9px;
        margin: 0;
    }

    #run{
        height: 6em;
        width: 10em;
        font-size: 20px;
		text-align: center;
    }

    #step-in, #step-out, #step-over{
        height: 3.8em;
        width: 12em;
        font-size: 14px;
        text-align: left;
        border-radius: 10px;
        padding: 0.6em 0 0.6em 1.2em;
        justify-content: flex-start !important;
    }

    .functionBtn span{
		margin-right: 8%;
	}

    #sim-status-bar{
        display: flex;
        width: 100%;
        height: 1.2em;
        min-width: 18vw;
        max-width: max-content;
        justify-content: space-between;
        align-items: center;
    }

    .sim-status-lbl{
        font-family: 'Source Code Pro', monospace;
        cursor: pointer;
        max-width: 30vw;
        overflow: hidden;
    }

    #status-array{
        display: flex;
        margin-left: 2em;
    }

    .stoplight{
        height: 100%;
        width: max-content;
        max-width: 6vw;
        text-align: center;
        padding: 0.6em 1em 0.6em 1em;
        font-family: 'Nova Flat', cursive;
        transform: skewX(-30deg);
        overflow: hidden;
        display: grid;
        justify-items: center;
        align-items: center;
    }

    .stoplight div{
        transform: skewX(30deg);
    }
</style>