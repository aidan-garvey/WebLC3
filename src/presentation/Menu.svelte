<script>
    export let currView = "editor"
</script>

<div id="menu" class="workSans">
    {#if currView == "editor"}
        <div id="new" class="menu-item">
            <section></section>
            <p>New</p>
        </div>
        <div id="open" class="menu-item">
            <section></section>
            <p>Open</p>
        </div>
        <div id="save" class="menu-item">
            <section></section>
            <p>Save</p>
        </div>
    {:else}
        <div id="reload" class="menu-item">
            <section></section>
            <p>Reload</p>
        </div>
        <div id="reinitialize" class="menu-item">
            <section></section>
            <p>Reinitialize</p>
        </div>
        <div id="randomize" class="menu-item">
            <section></section>
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

    .menu-item section{
        height: 35%;
        width: 45%;
        margin-bottom: 5%;
    }

    .menu-item p{
        width: 80%;
        text-align: center;
        font-size: 9px;
        margin: 0;
    }
</style>