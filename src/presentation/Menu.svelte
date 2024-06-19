<!--
    Menu.svelte
        View-specific work controls. Allows filesystem management and CPU machine state reloads
-->

<script>
    import { onMount } from 'svelte'
    import { openedFile, reloadOverride, latestSnapshot } from './stores.js'

    // Current view
    export let currView = "editor"
    // Current .asm filename
    let filename = ""
    openedFile.subscribe(value => { filename = value });
    // Read-only mode will nullify interactions
    export let readOnly = false


    /* EDITOR MENU CONTROLS */

    // Meta click handler
    function click(){
        if(!readOnly){
            let type = this.id
            if (type == "new")
                newClick()
            else if (type == "open")
                openClick()
            else if (type == "save")
                saveClick()
            else if (type == "reload")
                reloadClick()
            else if (type == "reinitialize")
                reinitializeClick()
            else if (type == "randomize")
                randomizeClick()
        }
    }

    // New: Reset Editor and filename
    function newClick(){
        if (confirm('Are you sure you want to start over?\n\nWARNING: This will clear the editor. Make sure to save your current progress first.')) {
            let editor = globalThis.editor
            if(editor){
                editor.setValue("")
                updateFilename("untitled.asm")
                openedFile.set("untitled.asm")
                latestSnapshot.set("")
            }
        }
    }

    // Open: Open an existing .asm file and load content to Editor
    function openClick(){
        let opener = document.getElementById("opener")
        opener.click()
    }
    function openFile(){
        let files = document.getElementById("opener").files
        if (files.length > 0) {
            let filename = files[0].name
            let extension = filename.split('.').pop();
            extension = extension.split('.').pop();
            if(extension == "asm" || extension == "s"){
                const reader = new FileReader()
                reader.readAsText(files[0]);
                reader.onload = function() {
                    let editor = globalThis.editor
                    if(editor){
                        let result = reader.result.toString()
                        editor.setValue(result)
                        updateFilename(filename)
                        latestSnapshot.set(result)
                    }
                    else
                        console.error("Reading file to editor failed.")
                };
            } else {
                alert("Invalid file. WebLC3 only accepts .asm and .s files.")
            }
        }
    }

    // Save: Save Editor content as .asm or .s file to client's local filesystem
    function saveClick(){
        if(globalThis.editor){
            let content = globalThis.editor.getValue()
            latestSnapshot.set(content)
            download(filename,content)
        }
    }
    let download = (fileName, data) => {}

    // Load download function on application load
    onMount(() => {
        download = (fileName, data) => {
            var a = document.createElement("a")
            document.body.appendChild(a)
            var blob = new Blob([data], { type: "plain/text" })
            let url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url)
        }
    });
    // Update filename reflected in EditorView
    function updateFilename(fn) { openedFile.set(fn) }



    /* SIMULATOR MENU CONTROLS */

    // Reload: Load code into memory, set PC to start of program, restore Processor Status Register to defaults, set clock-enable
    function reloadClick(){
        if(globalThis.simulator){
            globalThis.simulator.clearMessageQueue()
            globalThis.simulator.reloadProgram()
            reloadOverride.set([true,true])
        }
    }

    // Reinitialize: Set all of memory to zeroes except for operating system code
    function reinitializeClick(){
        if(globalThis.simulator){
            globalThis.simulator.clearMessageQueue()
            globalThis.simulator.resetMemory()
            reloadOverride.set([true,false])
        }
    }

    // Randomize: Randomize all of memory except for operating system code
    function randomizeClick(){
        if(globalThis.simulator){
            globalThis.simulator.clearMessageQueue()
            globalThis.simulator.randomizeMemory()
            reloadOverride.set([true,false])
        }
    }
</script>

<div id="menu" class="workSans" role="menubar" aria-label="Editor and simulator work controls">
    {#if currView == "editor"}
        <button id="new" class="menu-item" on:click={click} role="menuitem" aria-label="Start new file">
            <span class="material-symbols-outlined">note_add</span>
            <p>New</p>
        </button>
        <input id="opener" type="file" style="display:none;" on:change={openFile}>
        <button id="open" class="menu-item" on:click={click} role="menuitem" aria-label="Open assembly file from device">
            <span class="material-symbols-outlined">folder</span>
            <p>Open</p>
        </button>
        <button id="save" class="menu-item" on:click={click} role="menuitem" aria-label="Save file to device">
            <span class="material-symbols-outlined">save</span>
            <p>Save</p>
        </button>
    {:else}
        <button id="reload" class="menu-item" on:click={click} role="menuitem" aria-label="Reload simulator">
            <span class="material-symbols-outlined">refresh</span>
            <p>Reload</p>
        </button>
        <button id="reinitialize" class="menu-item" on:click={click} role="menuitem" aria-label="Reinitialize simulator">
            <span class="material-symbols-outlined">power_settings_new</span>
            <p>Reinitialize</p>
        </button>
        <button id="randomize" class="menu-item" on:click={click} role="menuitem" aria-label="Randomize simulator">
            <span class="material-symbols-outlined">shuffle</span>
            <p>Randomize</p>
        </button>
    {/if}
</div>

<style>
    #menu{
        height: 80%;
        display: grid;
        grid-template-columns: 4.5em 4.5em 4.5em;
        grid-column-gap: 0.4em;
    }

    .menu-item{
        padding: unset;
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

    @media (max-width: 1200px) {
	    .menu-item span{
            font-size: 20px;
        }
    }

    @media (max-width: 900px) {
	    #menu{
            grid-template-columns: 6em 6em 6em;
            grid-column-gap: 0.7em;
        }
    }

    @media (max-width: 600px) {
        #menu{
            grid-template-columns: 4.5em 4.5em 4.5em;
            grid-column-gap: 0.4em;
        }
    }
</style>