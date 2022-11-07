<script>

</script>

<div id="sim-status">
    <div class="sim-status-lbl">Simulator status</div>
    <div id="status-array">
        <div id="sim-status-not-ready" class="stoplight stoplight-active"><div> NOT READY </div></div>
        <div id="sim-status-ready" class="stoplight"><div> READY </div></div>
        <div id="sim-status-running" class="stoplight"><div> RUNNING </div></div>
    </div>
</div>

<style>
    #sim-status{
        display: flex;
        align-items: flex-end;
        font-size: 12px;
        justify-content: flex-end;
        cursor: default
    }

    .sim-status-lbl{
        width: max-content;
        font-family: 'Source Code Pro', monospace;
    }

    #status-array{
        display: grid;
        grid-template-columns: 8vw 8vw 8vw;
        margin-left: 2em;
    }

    .stoplight{
        height: 100%;
        text-align: center;
        padding-top: 0.5em;
        font-family: 'Nova Flat', cursive;
        transform: skewX(-30deg);
    }

    .stoplight div{
        transform: skewX(30deg);
    }

</style>
