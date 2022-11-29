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
        ▶ RUN
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
{:else if id == "sim-status-bar"}
    <div id="sim-status-bar">
        <div class="sim-status-lbl"> 
            SIMULATOR STATUS
        </div>
        <div id="status-array">
            <div id="sim-status-not-ready" class="stoplight stoplight-active"><div> NOT READY </div></div>
        </div>
    </div>
{:else if id == "sim-status"}
<div id="sim-status">
    <div id="sim-status-bar">
        <div class="sim-status-lbl"> myFile.obj</div>
        <div id="status-array">
            <div id="sim-status-ready" class="stoplight stoplight-active"><div> READY </div></div>
            <div id="sim-status-running" class="stoplight"><div> RUNNING </div></div>
        </div>
    </div>
    <button class="tinyBtn"> Get symbol table </button>
</div>

{:else if id == "jump-controls"}
<div id="jump-controls">
    <div>
        <span style="cursor:default;">JUMP</span><span class="mute"> :</span>
        <input id="jump-input" type="text" class="sourceCodePro" placeholder="x3000">
        <button id="jump-express" class="material-symbols-outlined"> login </button>
    </div>
    <div id="jump-buttons">
        <button>PC</button>
        <button>◀</button>
        <button>◅</button>
        <button>▻</button>
        <button>▶</button>
    </div>
</div>
{:else if id == "regRow-0"}
    <div id="regRow-0" class="regRow highlighted">
        <div>R0</div>
        <div class="editable">0x0</div>
        <div class="editable">0</div>
    </div>
{:else if id == "memRow-0"}
    <div id="memRow-0" class="memRow highlighted">
        <button id="bp-0" class="bp"><span class="material-symbols-outlined">report</span></button>
        <button id="ptr-0" class="ptr">▶</button>
        <div>0x3000</div>
        <div id="hex-0" class="editable">0x0</div>
        <div id="dec-0" class="editable">0</div>
        <div>lea R0, hello</div>
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

    #jump-controls{
        width: 100%;
        display: flex;
        justify-content: space-between;
        margin-top: 2vh;
        max-width: 70%;
    }

    .mute{
        color: #5B5B5B;
    }

    #jump-input{
        width: 4em;
        border: none;
        outline: none;
        background: none;
        border-bottom: 1px solid #5B5B5B;
    }

    #jump-express{
        background: none;
        border: none;
        font-size: unset;
        cursor: pointer;
        transform: translateY(2px);
    }

    #jump-buttons{
        display: flex;
        font-size: 1.5em;
    }

    #jump-buttons button{
        background: none;
        border: none;
        font-size: unset;
        margin: 0 0.6em 0 0.6em;
        cursor: pointer;
    }

    #jump-buttons button:hover{
        color: var(--d-loc);
    }

    .regRow{
        display: grid;
        grid-template-columns: 20% 20% 20% 20%;
        padding: 2px 0 2px 10px;
        max-width: 70%;
    }

    .memRow{
        display: grid;
        grid-template-columns: max-content max-content 20% 20% 20% 20%;
        padding: 2px 0 2px 0;
        max-width: 90%;
    }

    .memRow div:nth-child(3){
        font-weight: 800;
    }

    .bp, .ptr{
        background: unset;
        font-size: unset;
        border: unset;
        padding: unset;
        margin: 0 10px 0 10px;
        opacity: 0.4;
        cursor: pointer;
    }

    .bp:hover, .ptr:hover{
        cursor: pointer;
    }

    .bp:hover{
        color: var(--l-instr);
        opacity: 1;
    }

    .ptr:hover{
        color: var(--d-loc);
        opacity: 1;
    }
</style>