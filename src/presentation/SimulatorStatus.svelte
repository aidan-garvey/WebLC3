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
    // Allow download of blobs of assembled object and symbol table available
    $: downloadReady = (active != "sim-status-not-ready")

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
        if(downloadReady){
            let len = filename.length
            if(len > 18){
                // Maintain component length
                let rem = len-18
                let fn = "Download&nbsp.obj&nbspfile"
                for(let i=0; i<rem; i++)
                    fn += "&nbsp"
                showText = fn
            }
            else
                showText = "Download .obj file"
        }
    }

    // Swap back text to .obj filename
    function showFilename(){
        showText = filename
    }

    // Download most recently assembled .obj file
    function saveObj(){
        if(globalThis.objFile)
            download(filename,globalThis.objFile)
    }

    // Download most recently assembled symbol table
    function saveSymbolTable(){
        if(globalThis.symbolTable){
            // Pop off .obj from filename and append .sym
            let fn = filename.substring(0,filename.length-4) + ".sym"
            download(fn, globalThis.symbolTable)
        }
    }

    let download = (fileName, data) => {}
</script>

<div id="sim-status" role="status" aria-label="Check machine status and available assembled files to download" aria-live="polite">
    <div id="sim-status-bar">
        <div class="sim-status-lbl" on:mouseenter={showDownload} on:mouseleave={showFilename} on:click={saveObj} on:keypress={saveObj} role="button" aria-label="Save .obj file to device" tabindex="0"> 
            {@html showText} 
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
    {#if downloadReady}
        <button class="tinyBtn" on:click={saveSymbolTable}> Get symbol table </button>
    {/if}
</div>

<style>
    #sim-status{
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        font-size: 11px;
        justify-content: flex-start;
        cursor: default;
        width: 100%;
        min-width: 12vw;
        max-width: 18vw;
        transform: translateY(1vh);
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

    .tinyBtn{
        font-size: 9px !important;
        margin-top: 1vh;
        transform: translateX(-4px);
    }

    @media (max-width: 1300px) {
        #sim-status{
            min-width: 35vw;
        }

        .tinyBtn{
            margin-left: 4em;
        }
    }
</style>