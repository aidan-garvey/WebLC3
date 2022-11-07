<script>
    import { activeStoplight } from "./stores"
    import { onMount } from "svelte"

    onMount(() => { 
        activeStoplight.subscribe(value => {
            let newActive = value
            let stoplight = document.getElementById(newActive)
            let currActive = document.querySelector(".stoplight-active")
            if(currActive)
                currActive.classList.remove("stoplight-active")
            stoplight.classList.add("stoplight-active")
        });
	});

</script>

<div id="sim-status">
    <div class="sim-status-lbl">SIMULATOR</div>
    <div id="status-array">
        <div id="sim-status-not-ready" class="stoplight"><div> NOT READY </div></div>
        <div id="sim-status-ready" class="stoplight"><div> READY </div></div>
        <div id="sim-status-running" class="stoplight"><div> RUNNING </div></div>
    </div>
</div>

<style>
    #sim-status{
        display: flex;
        align-items: flex-end;
        font-size: 11px;
        justify-content: flex-end;
        cursor: default;
        width: 95%;
    }

    .sim-status-lbl{
        font-family: 'Source Code Pro', monospace;
    }

    #status-array{
        display: grid;
        grid-template-columns: 6vw 5vw 5vw;
        margin-left: 2em;
    }

    .stoplight{
        height: 100%;
        text-align: center;
        padding-top: 0.5em;
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
