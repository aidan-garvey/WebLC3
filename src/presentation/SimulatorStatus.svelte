<script>
    import { activeStoplight, assembledFile } from "./stores"
    import { onMount } from "svelte"

    let active = "sim-status-not-ready"
    let filename = ""
    onMount(() => { 
        activeStoplight.subscribe(value => {
            active = value
            setTimeout(function() {
                let stoplight = document.getElementById(active)
                let currActive = document.querySelector(".stoplight-active")
                if(currActive)
                    currActive.classList.remove("stoplight-active")
                stoplight.classList.add("stoplight-active")
            }, 300)
        });

        assembledFile.subscribe(value => {
            filename = value
        });
	});

</script>

<div id="sim-status">
    <div class="sim-status-lbl"> {filename} </div>
    <div id="status-array">
        {#if active == "sim-status-not-ready"}
            <div id="sim-status-not-ready" class="stoplight"><div> NOT READY </div></div>
        {:else}
            <div id="sim-status-ready" class="stoplight"><div> READY </div></div>
            <div id="sim-status-running" class="stoplight"><div> RUNNING </div></div>
        {/if}
    </div>
</div>

<style>
    #sim-status{
        display: flex;
        align-items: center;
        font-size: 11px;
        justify-content: flex-start;
        cursor: default;
        width: 95%;
        transform: translateY(1vh);
    }

    .sim-status-lbl{
        font-family: 'Source Code Pro', monospace;
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