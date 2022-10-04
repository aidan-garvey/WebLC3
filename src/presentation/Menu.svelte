<script>
    export let currView = "editor"
</script>

<div id="menu" class="workSans">
    {#if currView == "editor"}
        <div id="new" class="menu-item">
            <span class="material-symbols-outlined">note_add</span>
            <p>New</p>
        </div>
        <div id="open" class="menu-item">
            <span class="material-symbols-outlined">folder</span>
            <p>Open</p>
        </div>
        <div id="save" class="menu-item">
            <span class="material-symbols-outlined">save</span>
            <p>Save</p>
        </div>
    {:else}
        <div id="reload" class="menu-item">
            <span class="material-symbols-outlined">refresh</span>
            <p>Reload</p>
        </div>
        <div id="reinitialize" class="menu-item">
            <span class="material-symbols-outlined">power_settings_new</span>
            <p>Reinitialize</p>
        </div>
        <div id="randomize" class="menu-item">
            <span class="material-symbols-outlined">shuffle</span>
            <p>Randomize</p>
        </div>
    {/if}
</div>

<style>
    #menu{
        height: 80%;
        display: grid;
        grid-template-columns: 4em 4em 4em;
        grid-column-gap: 0.4em;
    }

    .menu-item{
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
        font-size: 9px;
        margin: 0;
    }
</style>