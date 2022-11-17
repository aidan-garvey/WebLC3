<!-- 
    Menu.svelte
        View-specific work controls. Allows filesystem management and CPU machine state reloads
-->

<script>
    import { onMount } from 'svelte';
    import { openedFile, currentView, reloadOverride } from './stores.js';

    // Set view-specific controls
    let currView = "editor"
    currentView.subscribe(value => { currView = value });
    // Current .asm filename
    let filename = ""
    openedFile.subscribe(value => { filename = value });


    /* EDITOR MENU CONTROLS */
    
    // New: Reset Editor and filename
    function newClick(){
        if (confirm('Are you sure you want to start over?\n\nWARNING: This will clear the editor. Make sure to save your current progress first.')) {
            let editor = globalThis.editor
            if(editor){
                editor.setValue("")
                updateFilename("untitled.asm")
                openedFile.set("untitled.asm")
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
            if(extension == "asm"){
                const reader = new FileReader()
                reader.readAsText(files[0]);
                reader.onload = function() {
                    let editor = globalThis.editor
                    if(editor){
                        editor.setValue(reader.result)
                        updateFilename(filename)
                    }
                    else
                        console.error("Reading .asm file to editor failed.")
                };
            } else {
                alert("Invalid file. WebLC3 only accepts .asm files.")
            }
        }
    }

    // Save: Save Editor content as .asm file to client's local filesystem
    function saveClick(){
        let editor = globalThis.editor
        if(editor)
            download(filename,editor.getValue())
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
            globalThis.simulator.reloadProgram()
            reloadOverride.set([true,true])
        }
    }

    // Reinitialize: Set all of memory to zeroes except for operating system code
    function reinitializeClick(){
        if(globalThis.simulator){
            globalThis.simulator.resetMemory()
            reloadOverride.set([true,false])
        }
    }

    // Randomize: Randomize all of memory except for operating system code
    function randomizeClick(){
        if(globalThis.simulator){
            globalThis.simulator.randomizeMemory()
            reloadOverride.set([true,false])
        }
    }
</script>

<div id="menu" class="workSans">
    {#if currView == "editor"}
        <div id="new" class="menu-item" on:click={newClick}>
            <span class="material-symbols-outlined">note_add</span>
            <p>New</p>
        </div>
        <input id="opener" type="file" style="display:none;" on:change={openFile}>
        <div id="open" class="menu-item" on:click={openClick}>
            <span class="material-symbols-outlined">folder</span>
            <p>Open</p>
        </div>
        <div id="save" class="menu-item" on:click={saveClick}>
            <span class="material-symbols-outlined">save</span>
            <p>Save</p>
        </div>
    {:else}
        <div id="reload" class="menu-item" on:click={reloadClick}>
            <span class="material-symbols-outlined">refresh</span>
            <p>Reload</p>
        </div>
        <div id="reinitialize" class="menu-item" on:click={reinitializeClick}>
            <span class="material-symbols-outlined">power_settings_new</span>
            <p>Reinitialize</p>
        </div>
        <div id="randomize" class="menu-item" on:click={randomizeClick}>
            <span class="material-symbols-outlined">shuffle</span>
            <p>Randomize</p>
        </div>
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
</style>