<!-- 
    SimulatorStatus.svelte
        Reflect current state of Simulator class. Includes 3 stoplights: NOT READY, READY, and RUNNING
-->

<script>
    import { activeStoplight, assembledFile } from "./stores"
    import { onMount } from "svelte"

    // Active stoplight ID
    let active = "sim-status-not-ready"
    // Assembled .obj filename
    let filename = ""
    // Text to show by stoplights
    $: showText = filename

    onMount(() => { 
        // Switch active stoplight
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

        // Change to most recently assembled filename
        assembledFile.subscribe(value => {
            filename = value
        });

        // Download .obj file
        download = (fileName, blob) => {
            var a = document.createElement("a")
            document.body.appendChild(a)
            let url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url)
        }
	});

    // Change text on hover to cue that .obj file can be downloaded
    function showDownload(){
        showText = "Download .obj file"
    }

    // Swap back text to .obj filename
    function showFilename(){
        showText = filename
    }

    // Download most recently assembled .obj file
    function saveObj(){
        if(globalThis.objFile){
            download(filename,globalThis.objFile)
        }
    }
    let download = (fileName, data) => {}
</script>

<div id="sim-status">
    <div class="sim-status-lbl" on:mouseenter={showDownload} on:mouseleave={showFilename} on:click={saveObj} > 
        {showText} 
    </div>
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
        justify-content: space-between;
        cursor: default;
        width: 100%;
        min-width: max-content;
        max-width: 18vw;
        transform: translateY(1vh);
    }

    .sim-status-lbl{
        font-family: 'Source Code Pro', monospace;
        cursor: pointer;
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

    @media (max-width: 1300px) {
		#sim-status{
            min-width: 30vw;
        }
    }
</style>